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
  
  // 强力清理所有可能的markdown标记
  cleaned = cleaned.replace(/^```json\s*/gi, '');
  cleaned = cleaned.replace(/^```\s*/g, '');
  cleaned = cleaned.replace(/```\s*$/g, '');
  
  // 移除可能的反引号
  cleaned = cleaned.replace(/^`+|`+$/g, '');
  
  return cleaned.trim();
}

// LLM 资格评估函数
async function evaluateQualifications(userProfile, schoolData, structuredData) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "system",
        content: "You are an admissions expert. Evaluate if a user meets university requirements and return ONLY valid JSON."
      }, {
        role: "user",
        content: `Evaluate qualification status for this user against school requirements:

USER PROFILE: ${userProfile}

SCHOOL: ${schoolData.school_name} - ${schoolData.program_name}
REQUIREMENTS:
- GPA: ${structuredData.gpa_requirement}
- Language: ${structuredData.language_requirement} 
- Prerequisites: ${structuredData.prerequisite_courses}
- Degree: ${structuredData.degree_requirement}
- Other: ${structuredData.other_requirements}

Return JSON with qualification status for each category:
{
  "gpa": {"status": "met|partial|not_met|unknown", "reason": "brief explanation"},
  "language": {"status": "met|partial|not_met|unknown", "reason": "brief explanation"},
  "prerequisites": {"status": "met|partial|not_met|unknown", "reason": "brief explanation"},
  "degree": {"status": "met|partial|not_met|unknown", "reason": "brief explanation"},
  "other": {"status": "met|partial|not_met|unknown", "reason": "brief explanation"}
}`
      }],
      response_format: { type: "json_object" },
      max_tokens: 400,
      temperature: 0
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('❌ LLM资格评估失败:', error);
    return {
      gpa: { status: 'unknown', reason: 'Evaluation failed' },
      language: { status: 'unknown', reason: 'Evaluation failed' },
      prerequisites: { status: 'unknown', reason: 'Evaluation failed' },
      degree: { status: 'unknown', reason: 'Evaluation failed' },
      other: { status: 'unknown', reason: 'Evaluation failed' }
    };
  }
}

// LLM 结构化数据函数
async function structureSchoolData(schoolData) {
  try {
    console.log(`🔄 正在结构化学校数据: ${schoolData.school_name} - ${schoolData.program_name}`);
    console.log(`📝 Program details 长度: ${schoolData.program_details ? schoolData.program_details.length : 'NULL'}`);
    console.log(`📝 Program details 前200字符: ${schoolData.program_details ? schoolData.program_details.substring(0, 200) : 'EMPTY'}`);
    
    // 使用 JSON Schema 结构化输出（OpenAI 最新功能）
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "system",
        content: "You are a data extraction expert. Extract information from university program details and return ONLY valid JSON. No markdown, no explanations, just pure JSON."
      }, {
        role: "user", 
        content: `You are analyzing a graduate program. Extract admission requirements from the provided information.

SCHOOL: ${schoolData.school_name}
PROGRAM: ${schoolData.program_name} (${schoolData.degree_type})
FIELD: ${schoolData.specific_field}
RANKING: QS #${schoolData.qs_ranking}

PROGRAM DETAILS:
${schoolData.program_details || 'Limited program information available'}

LANGUAGE REQUIREMENTS:
${schoolData.language_requirements || 'No specific language requirements listed'}

Extract and return a JSON object with these fields:
{
  "tuition": "Annual tuition cost (extract from text or estimate based on school ranking)",
  "gpa_requirement": "Minimum GPA or academic requirements", 
  "language_requirement": "TOEFL/IELTS scores required",
  "prerequisite_courses": "Required academic background or specific courses",
  "degree_requirement": "Required undergraduate degree type",
  "other_requirements": "Additional requirements (GRE, work experience, etc.)"
}

EXTRACTION RULES:
1. For TUITION: Look for cost/fee information. If not found, estimate: Top 10 schools ~$60k, Top 50 ~$45k, Others ~$35k
2. For GPA: Look for "GPA", "grade", "academic standing". If not found, use "3.0+ GPA typically required"
3. For LANGUAGE: Use exact scores from language requirements. If not found, use "TOEFL 90+ or IELTS 7.0+"
4. For PREREQUISITES: Look for specific courses, academic background. If CS program, assume "Strong quantitative background"
5. For DEGREE: Look for degree requirements. Default to "Bachelor's degree required"
6. For OTHER: Look for GRE, work experience, research. If not found, use "Strong academic record recommended"

Be specific and helpful - avoid "Information not available" unless truly no relevant information exists.`
      }],
      response_format: { type: "json_object" }, // 强制 JSON 输出
      max_tokens: 600,
      temperature: 0
    });

    let responseContent = completion.choices[0].message.content;
    console.log(`📝 GPT 原始响应 (${schoolData.school_name} - ${schoolData.program_name}): ${responseContent.substring(0, 300)}...`);
    
    // 清理响应
    responseContent = cleanGPTResponse(responseContent);
    console.log(`🧹 清理后响应: ${responseContent.substring(0, 200)}...`);
    
    // 解析 JSON
    let structuredData;
    try {
      structuredData = JSON.parse(responseContent);
      console.log(`✅ 结构化成功: ${schoolData.school_name}`);
    } catch (parseError) {
      console.error(`❌ JSON解析失败: ${parseError.message}`);
      console.error(`❌ 清理后的响应: ${responseContent.substring(0, 500)}`);
      throw parseError;
    }
    
    // 验证必需字段
    const requiredFields = ['tuition', 'gpa_requirement', 'language_requirement', 'prerequisite_courses', 'degree_requirement', 'other_requirements'];
    for (const field of requiredFields) {
      if (structuredData[field] === undefined || structuredData[field] === null) {
        console.log(`⚠️ 缺少字段 ${field}，使用默认值`);
        structuredData[field] = getDefaultValue(field);
      }
    }
    
    return structuredData;
    
  } catch (error) {
    console.error(`❌ LLM结构化失败 (${schoolData.school_name} - ${schoolData.program_name}):`, error.message);
    console.error('❌ 错误详情:', error);
    
    // 返回默认结构
    console.log('⚠️ 使用默认值 - 这可能导致学校信息重复');
    return {
      tuition: "$50,000",
      gpa_requirement: "3.0+ GPA recommended",
      language_requirement: "TOEFL 90+ or IELTS 7.0+",
      prerequisite_courses: "Relevant undergraduate coursework",
      degree_requirement: "Bachelor's degree required",
      other_requirements: "Strong academic background"
    };
  }
}

// 获取默认值
function getDefaultValue(field) {
  const defaults = {
    tuition: "$50,000",
    gpa_requirement: "3.0+ GPA recommended",
    language_requirement: "TOEFL 90+ or IELTS 7.0+",
    prerequisite_courses: "Relevant undergraduate coursework",
    degree_requirement: "Bachelor's degree required",
    other_requirements: "Strong academic background"
  };
  return defaults[field] || "Information not available";
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

      const userVector = JSON.parse(userRows[0].profile_embedding);
      const userProfile = userRows[0].user_profile;
      
      // 将向量转换为TiDB兼容的字符串格式
      const vectorString = `[${userVector.join(',')}]`;
      
      // 提取用户偏好的国家
      const preferredCountries = getStandardCountryNames(userProfile);
      console.log('🌍 用户偏好国家:', preferredCountries);

      console.log('🔄 执行向量搜索...');

      // 从用户档案中提取目标专业
      const targetField = userProfile.match(/Target field:\s*([^.]+)/)?.[1]?.trim().toLowerCase();
      console.log('🎯 检测到目标专业:', targetField);
      
      // 获取最匹配的50个候选学校
      let candidatesSql = `
        SELECT 
          id, school_name, program_name, country_region, broad_category, specific_field,
          qs_ranking, degree_type, duration, program_details, language_requirements,
          program_url, graduate_school_url, crawl_status,
          VEC_COSINE_DISTANCE(embedding, ?) AS similarity
        FROM schools`;
      
      let candidatesParams = [vectorString];
      let whereConditions = [];
      
      // 添加目标专业过滤
      if (targetField) {
        if (targetField.includes('cs') || targetField.includes('computer')) {
          whereConditions.push(`(specific_field LIKE '%Computer%' OR program_name LIKE '%Computer%') AND program_name NOT LIKE '%Law%'`);
          console.log('🎯 搜索计算机科学项目');
        } else if (targetField.includes('mba') || targetField.includes('business')) {
          whereConditions.push(`(specific_field LIKE '%Business%' OR program_name LIKE '%MBA%' OR program_name LIKE '%Business%') AND program_name NOT LIKE '%Law%'`);
          console.log('🎯 搜索商科项目');
        } else if (targetField.includes('law')) {
          whereConditions.push(`(specific_field LIKE '%Law%' OR program_name LIKE '%Law%')`);
          console.log('🎯 搜索法学项目');
        }
      }
      
      // 添加国家过滤
      if (preferredCountries.length > 0) {
        const placeholders = preferredCountries.map(() => '?').join(',');
        whereConditions.push(`country_region IN (${placeholders})`);
        candidatesParams.push(...preferredCountries);
        console.log('🌍 应用国家过滤:', preferredCountries);
      }
      
      if (whereConditions.length > 0) {
        candidatesSql += ` WHERE ${whereConditions.join(' AND ')}`;
      }
      
      candidatesSql += ` ORDER BY similarity ASC LIMIT 50`;
      
      const [candidateRows] = await connection.execute(candidatesSql, candidatesParams);
      console.log(`🔍 找到 ${candidateRows.length} 个候选学校`);

      // 智能三分类算法 - 确保每所学校只出现一次，逻辑合理分配
      function classifySchools(candidates) {
        const dreamSchools = [];
        const targetSchools = [];
        const safeChoice = [];
        const usedSchools = new Set(); // 记录已使用的学校
        
        // 按相似度排序（最相似的在前面）
        const sortedCandidates = [...candidates].sort((a, b) => a.similarity - b.similarity);
        
        // 第一轮：选择Dream Schools (Top 30排名的学校，不考虑相似度)
        sortedCandidates.forEach(school => {
          const schoolName = school.school_name;
          const ranking = school.qs_ranking;
          
          if (usedSchools.has(schoolName)) return;
          
          if (ranking <= 30 && dreamSchools.length < 4) {
            dreamSchools.push(school);
            usedSchools.add(schoolName);
          }
        });
        
        // 第二轮：选择Target Schools (相似度最高的学校，排名31-80优先)
        sortedCandidates.forEach(school => {
          const schoolName = school.school_name;
          const ranking = school.qs_ranking;
          
          if (usedSchools.has(schoolName)) return;
          
          // 优先选择排名31-80的高相似度学校
          if (ranking > 30 && ranking <= 80 && targetSchools.length < 6) {
            targetSchools.push(school);
            usedSchools.add(schoolName);
          }
        });
        
        // 第三轮：继续填充Target Schools (如果还没满，选择其他高相似度学校)
        if (targetSchools.length < 6) {
          sortedCandidates.forEach(school => {
            const schoolName = school.school_name;
            
            if (usedSchools.has(schoolName)) return;
            if (targetSchools.length >= 6) return;
            
            targetSchools.push(school);
            usedSchools.add(schoolName);
          });
        }
        
        // 第四轮：选择Safe Choice (剩余的高相似度学校，排名较低但匹配度高)
        sortedCandidates.forEach(school => {
          const schoolName = school.school_name;
          const ranking = school.qs_ranking;
          
          if (usedSchools.has(schoolName)) return;
          if (safeChoice.length >= 3) return;
          
          // 优先选择排名较低但相似度高的学校作为保底
          if (ranking > 50) {
            safeChoice.push(school);
            usedSchools.add(schoolName);
          }
        });
        
        return { dreamSchools, targetSchools, safeChoice };
      }
      
      const { dreamSchools, targetSchools, safeChoice } = classifySchools(candidateRows);
      console.log(`📊 分类结果: Dream(${dreamSchools.length}) Target(${targetSchools.length}) Safe(${safeChoice.length})`);
      
      // 记录每个类别的学校名称，用于调试
      console.log('🏆 Dream Schools:', dreamSchools.map(s => s.school_name));
      console.log('🎯 Target Schools:', targetSchools.map(s => s.school_name));
      console.log('🛡️ Safe Choice:', safeChoice.map(s => s.school_name));
      
      // 处理target schools (Target Schools)
      const processedTargetSchools = await Promise.all(targetSchools.map(async row => {
        const structuredData = await structureSchoolData(row);
        const qualificationStatus = await evaluateQualifications(userProfile, row, structuredData);
        return {
          school: row.school_name,
          program: row.program_name,
          match_score: Math.round((1 - row.similarity) * 1000) / 10,
          ranking: row.qs_ranking,
          deadline: "2025-01-15",
          tuition: structuredData.tuition,
          duration: row.duration || "2 years",
          gpa_requirement: structuredData.gpa_requirement,
          language_requirement: structuredData.language_requirement,
          prerequisite_courses: structuredData.prerequisite_courses,
          degree_requirement: structuredData.degree_requirement,
          other_requirements: structuredData.other_requirements,
          qualification_status: qualificationStatus
        };
      }));

      // 处理safe schools (Safe Choice)
      const safeSchools = await Promise.all(safeChoice.map(async row => {
        const structuredData = await structureSchoolData(row);
        const qualificationStatus = await evaluateQualifications(userProfile, row, structuredData);
        return {
          school: row.school_name,
          program: row.program_name,
          match_score: Math.round((1 - row.similarity) * 1000) / 10,
          ranking: row.qs_ranking,
          deadline: "2025-01-15",
          tuition: structuredData.tuition,
          duration: row.duration || "2 years",
          gpa_requirement: structuredData.gpa_requirement,
          language_requirement: structuredData.language_requirement,
          prerequisite_courses: structuredData.prerequisite_courses,
          degree_requirement: structuredData.degree_requirement,
          other_requirements: structuredData.other_requirements,
          qualification_status: qualificationStatus
        };
      }));

      // 处理reach schools (Dream Schools)
      const reachSchools = await Promise.all(dreamSchools.map(async row => {
        const structuredData = await structureSchoolData(row);
        const qualificationStatus = await evaluateQualifications(userProfile, row, structuredData);
        return {
          school: row.school_name,
          program: row.program_name,
          match_score: Math.max(50.0, Math.round((1 - row.similarity) * 1000) / 10 - 1.5),
          ranking: row.qs_ranking,
          gaps: ["Advanced Math", "Research Experience"],
          suggestions: "Complete prerequisite courses and gain research experience",
          deadline: "2025-12-01",
          tuition: structuredData.tuition,
          duration: row.duration || "2 years",
          gpa_requirement: structuredData.gpa_requirement,
          language_requirement: structuredData.language_requirement,
          prerequisite_courses: structuredData.prerequisite_courses,
          degree_requirement: structuredData.degree_requirement,
          other_requirements: structuredData.other_requirements,
          qualification_status: qualificationStatus
        };
      }));

      // 更新数据库存储匹配结果
      // 临时解决方案：将safe_schools合并到target_schools中，直到数据库schema更新
      const combinedTargetSchools = [...processedTargetSchools, ...safeSchools];
      
      await connection.execute(`
        UPDATE user_sessions 
        SET target_schools = ?, reach_schools = ?
        WHERE session_id = ?
      `, [
        JSON.stringify(combinedTargetSchools),
        JSON.stringify(reachSchools),
        analysisId
      ]);

      console.log(`✅ 找到 ${processedTargetSchools.length} 个目标学校，${reachSchools.length} 个冲刺学校，${safeSchools.length} 个保底选择`);

      // 返回响应
      res.status(200).json({
        target_schools: processedTargetSchools,
        reach_schools: reachSchools,
        safe_schools: safeSchools
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
