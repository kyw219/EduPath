import mysql from 'mysql2/promise';

// 数据库连接配置
const dbConfig = {
  host: process.env.TIDB_HOST,
  port: parseInt(process.env.TIDB_PORT) || 4000,
  user: process.env.TIDB_USER,
  password: process.env.TIDB_PASSWORD,
  database: process.env.TIDB_DATABASE,
  ssl: { rejectUnauthorized: false }
};

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

      const targetSchools = targetRows.map(row => ({
        school: row.school_name,
        program: row.program_name,
        match_score: Math.round((1 - row.similarity) * 100),
        deadline: "2025-01-15", // 示例数据
        requirements: "Basic background sufficient",
        tuition: "$43,000",
        employment_rate: "92%",
        reason: `Great match for your background in ${row.country_region}`
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

      const reachSchools = reachRows.map(row => ({
        school: row.school_name,
        program: row.program_name,
        match_score: Math.max(50, Math.round((1 - row.similarity) * 100) - 20),
        gaps: ["Advanced Math", "Research Experience"],
        suggestions: "Complete prerequisite courses and gain research experience",
        deadline: "2025-12-01",
        tuition: "$77,000",
        requirements: "Strong academic background required",
        employment_rate: "98%",
        reason: `Top-tier program at ${row.school_name}`
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
