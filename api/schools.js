import mysql from 'mysql2/promise';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 数据库连接配置
const dbConfig = {
  host: process.env.TIDB_HOST,
  port: parseInt(process.env.TIDB_PORT) || 4000,
  user: process.env.TIDB_USER,
  password: process.env.TIDB_PASSWORD,
  database: process.env.TIDB_DATABASE,
  ssl: { rejectUnauthorized: false }
};

// LLM 结构化数据函数
async function structureSchoolData(schoolData) {
  try {
    const prompt = `Please extract and structure the following school program information into a standardized JSON format:

School: ${schoolData.school_name}
Program: ${schoolData.program_name}
Raw Program Details: ${schoolData.program_details}

Please extract and return ONLY a valid JSON object with this exact structure:
{
  "tuition": "extracted tuition amount or estimate based on country/ranking",
  "language_requirements": "extracted TOEFL/IELTS requirements",
  "admission_requirements": "extracted GPA and degree requirements", 
  "prerequisites": "extracted prerequisite courses if any",
  "other_requirements": "extracted additional requirements like work experience, portfolio, etc."
}

Rules:
- If tuition is not found, estimate based on country and ranking
- If language requirements not found, use standard requirements for the country
- Keep responses concise and professional
- Return ONLY the JSON object, no additional text`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.1
    });

    const structuredData = JSON.parse(completion.choices[0].message.content);
    return structuredData;
    
  } catch (error) {
    console.error('❌ LLM结构化失败:', error);
    // 返回默认结构
    return {
      tuition: "$50,000",
      language_requirements: "TOEFL 90+ or IELTS 7.0+",
      admission_requirements: "Bachelor's degree, 3.0+ GPA recommended",
      prerequisites: "Relevant undergraduate coursework",
      other_requirements: "Strong academic background"
    };
  }
}

export default async function handler(req, res) {
  // 只允许 GET 请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { analysisId } = req.query;

    if (!analysisId) {
      return res.status(400).json({ error: 'Missing analysis ID' });
    }

    console.log(`🔄 获取学校匹配结果: ${analysisId}`);

    // 连接数据库
    const connection = await mysql.createConnection(dbConfig);

    try {
      // 获取用户档案向量
      const [userRows] = await connection.execute(
        'SELECT profile_embedding FROM user_sessions WHERE session_id = ?',
        [analysisId]
      );

      if (userRows.length === 0) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const userVector = userRows[0].profile_embedding;

      console.log('🔄 执行向量搜索...');

      // 搜索 target schools (相似度高的)
      const [targetRows] = await connection.execute(`
        SELECT 
          id, school_name, program_name, country_region,
          qs_ranking, degree_type, duration, program_details,
          VEC_COSINE_DISTANCE(embedding, ?) AS similarity
        FROM schools 
        ORDER BY similarity ASC 
        LIMIT 3
      `, [userVector]);

      // 使用 LLM 结构化 target schools 数据
      const targetSchools = await Promise.all(targetRows.map(async row => {
        const structuredData = await structureSchoolData(row);
        return {
          school: row.school_name,
          program: row.program_name,
          match_score: Math.round((1 - row.similarity) * 100),
          ranking: row.qs_ranking,
          deadline: "2025-01-15", // 这个可以后续也从数据中提取
          tuition: structuredData.tuition,
          duration: row.duration || "2 years",
          language_requirements: structuredData.language_requirements,
          admission_requirements: structuredData.admission_requirements,
          prerequisites: structuredData.prerequisites,
          other_requirements: structuredData.other_requirements
        };
      }));

      // 搜索 reach schools (排名更高的学校)
      const [reachRows] = await connection.execute(`
        SELECT 
          id, school_name, program_name, country_region,
          qs_ranking, degree_type, duration, program_details,
          VEC_COSINE_DISTANCE(embedding, ?) AS similarity
        FROM schools 
        WHERE qs_ranking <= 20
        ORDER BY similarity ASC 
        LIMIT 2
      `, [userVector]);

      // 使用 LLM 结构化 reach schools 数据
      const reachSchools = await Promise.all(reachRows.map(async row => {
        const structuredData = await structureSchoolData(row);
        return {
          school: row.school_name,
          program: row.program_name,
          match_score: Math.max(50, Math.round((1 - row.similarity) * 100) - 20),
          ranking: row.qs_ranking,
          gaps: ["Advanced Math", "Research Experience"], // 这个可以后续也用 LLM 生成
          suggestions: "Complete prerequisite courses and gain research experience",
          deadline: "2025-12-01",
          tuition: structuredData.tuition,
          duration: row.duration || "2 years", 
          language_requirements: structuredData.language_requirements,
          admission_requirements: structuredData.admission_requirements,
          prerequisites: structuredData.prerequisites,
          other_requirements: structuredData.other_requirements
        };
      }));

      // 更新数据库存储匹配结果
      await connection.execute(`
        UPDATE user_sessions 
        SET target_schools = ?, reach_schools = ?
        WHERE session_id = ?
      `, [
        JSON.stringify(targetSchools),
        JSON.stringify(reachSchools),
        analysisId
      ]);

      console.log(`✅ 找到 ${targetSchools.length} 个目标学校，${reachSchools.length} 个冲刺学校`);

      // 返回响应
      res.status(200).json({
        target_schools: targetSchools,
        reach_schools: reachSchools
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('❌ 学校匹配错误:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
