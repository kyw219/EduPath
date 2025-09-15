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

// 清理 GPT 响应，移除 Markdown 标记
function cleanGPTResponse(response) {
  let cleaned = response.trim();
  
  // 移除开头的 ```json 或 ```
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  
  // 移除结尾的 ```
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  
  return cleaned.trim();
}

// LLM 结构化数据函数
async function structureSchoolData(schoolData) {
  try {
    console.log(`🔄 正在结构化学校数据: ${schoolData.school_name} - ${schoolData.program_name}`);
    
    // 使用 JSON Schema 结构化输出（OpenAI 最新功能）
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "system",
        content: "You are a data extraction expert. Extract information from university program details and return ONLY valid JSON. No markdown, no explanations, just pure JSON."
      }, {
        role: "user", 
        content: `Extract structured information from this university program using ALL available data:

SCHOOL INFORMATION:
- School: ${schoolData.school_name}
- Country/Region: ${schoolData.country_region}
- QS Ranking: ${schoolData.qs_ranking}

PROGRAM INFORMATION:
- Program Name: ${schoolData.program_name}
- Degree Type: ${schoolData.degree_type}
- Duration: ${schoolData.duration}
- Broad Category: ${schoolData.broad_category}
- Specific Field: ${schoolData.specific_field}

DETAILED PROGRAM INFORMATION:
${schoolData.program_details || 'No detailed program information available'}

EXISTING LANGUAGE REQUIREMENTS (if any):
${schoolData.language_requirements || 'Not specified in database'}

ADDITIONAL CONTEXT:
- Program URL: ${schoolData.program_url || 'Not available'}
- Graduate School URL: ${schoolData.graduate_school_url || 'Not available'}

Based on ALL the above information, extract and return a JSON object with exactly these fields:
{
  "tuition": "extracted/estimated tuition amount in USD format",
  "language_requirements": "specific TOEFL/IELTS requirements",
  "admission_requirements": "GPA, degree, and academic requirements",
  "prerequisites": "prerequisite courses or background needed",
  "other_requirements": "work experience, portfolio, tests, or other special requirements"
}

IMPORTANT: Use the detailed program information to provide accurate, specific requirements rather than generic ones.`
      }],
      response_format: { type: "json_object" }, // 强制 JSON 输出
      max_tokens: 400,
      temperature: 0
    });

    let responseContent = completion.choices[0].message.content;
    console.log(`📝 GPT 原始响应: ${responseContent.substring(0, 200)}...`);
    
    // 清理响应
    responseContent = cleanGPTResponse(responseContent);
    console.log(`🧹 清理后响应: ${responseContent.substring(0, 200)}...`);
    
    // 解析 JSON
    const structuredData = JSON.parse(responseContent);
    console.log(`✅ 结构化成功: ${schoolData.school_name}`);
    
    // 验证必需字段
    const requiredFields = ['tuition', 'language_requirements', 'admission_requirements'];
    for (const field of requiredFields) {
      if (!structuredData[field]) {
        console.log(`⚠️ 缺少字段 ${field}，使用默认值`);
        structuredData[field] = getDefaultValue(field);
      }
    }
    
    return structuredData;
    
  } catch (error) {
    console.error('❌ LLM结构化失败:', error.message);
    console.error('❌ 错误详情:', error);
    
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

// 获取默认值
function getDefaultValue(field) {
  const defaults = {
    tuition: "$50,000",
    language_requirements: "TOEFL 90+ or IELTS 7.0+",
    admission_requirements: "Bachelor's degree, 3.0+ GPA recommended",
    prerequisites: "Relevant undergraduate coursework",
    other_requirements: "Strong academic background"
  };
  return defaults[field] || "Not specified";
}

// 简单的国家名映射
function getStandardCountryNames(text) {
  const countries = [];
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('uk') || lowerText.includes('united kingdom') || lowerText.includes('britain') || lowerText.includes('england')) {
    countries.push('United Kingdom');
  }
  if (lowerText.includes('us') || lowerText.includes('usa') || lowerText.includes('united states') || lowerText.includes('america')) {
    countries.push('United States');
  }
  if (lowerText.includes('canada')) {
    countries.push('Canada');
  }
  if (lowerText.includes('australia')) {
    countries.push('Australia');
  }
  
  return [...new Set(countries)]; // 去重
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
      // 获取用户档案向量和原始档案文本
      const [userRows] = await connection.execute(
        'SELECT profile_embedding, user_profile FROM user_sessions WHERE session_id = ?',
        [analysisId]
      );

      if (userRows.length === 0) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const userVector = userRows[0].profile_embedding;
      const userProfile = userRows[0].user_profile;
      
      // 提取用户偏好的国家
      const preferredCountries = getStandardCountryNames(userProfile);
      console.log('🌍 用户偏好国家:', preferredCountries);

      console.log('🔄 执行向量搜索...');

      // 构建 target schools 查询
      let targetSql = `
        SELECT 
          id, school_name, program_name, country_region, broad_category, specific_field,
          qs_ranking, degree_type, duration, program_details, language_requirements,
          program_url, graduate_school_url, crawl_status,
          VEC_COSINE_DISTANCE(embedding, ?) AS similarity
        FROM schools`;
      
      let targetParams = [userVector];
      
      if (preferredCountries.length > 0) {
        const placeholders = preferredCountries.map(() => '?').join(',');
        targetSql += ` WHERE country_region IN (${placeholders})`;
        targetParams.push(...preferredCountries);
        console.log('🎯 Target schools - 应用国家过滤:', preferredCountries);
      }
      
      targetSql += ` ORDER BY similarity ASC LIMIT 3`;
      
      const [targetRows] = await connection.execute(targetSql, targetParams);

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

      // 构建 reach schools 查询 (排名更高的学校)
      let reachSql = `
        SELECT 
          id, school_name, program_name, country_region, broad_category, specific_field,
          qs_ranking, degree_type, duration, program_details, language_requirements,
          program_url, graduate_school_url, crawl_status,
          VEC_COSINE_DISTANCE(embedding, ?) AS similarity
        FROM schools 
        WHERE qs_ranking <= 20`;
      
      let reachParams = [userVector];
      
      if (preferredCountries.length > 0) {
        const placeholders = preferredCountries.map(() => '?').join(',');
        reachSql += ` AND country_region IN (${placeholders})`;
        reachParams.push(...preferredCountries);
        console.log('🚀 Reach schools - 应用国家过滤:', preferredCountries);
      }
      
      reachSql += ` ORDER BY similarity ASC LIMIT 2`;
      
      const [reachRows] = await connection.execute(reachSql, reachParams);

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
