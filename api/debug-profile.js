import mysql from 'mysql2/promise';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const dbConfig = {
  host: process.env.TIDB_HOST,
  port: parseInt(process.env.TIDB_PORT) || 4000,
  user: process.env.TIDB_USER,
  password: process.env.TIDB_PASSWORD,
  database: process.env.TIDB_DATABASE,
  ssl: { rejectUnauthorized: false }
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { analysisId } = req.query;

    if (!analysisId) {
      return res.status(400).json({ error: 'Missing analysis ID' });
    }

    const connection = await mysql.createConnection(dbConfig);

    try {
      // 获取用户档案
      const [userRows] = await connection.execute(
        'SELECT profile_embedding, user_profile FROM user_sessions WHERE session_id = ?',
        [analysisId]
      );

      if (userRows.length === 0) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const userProfile = userRows[0].user_profile;
      const userVector = JSON.parse(userRows[0].profile_embedding);
      const vectorString = `[${userVector.join(',')}]`;

      // 测试与不同类型项目的相似度
      const [lawResults] = await connection.execute(`
        SELECT 
          school_name, program_name, specific_field,
          VEC_COSINE_DISTANCE(embedding, ?) AS similarity
        FROM schools 
        WHERE program_name LIKE '%Law%' 
        AND country_region LIKE '%United States%'
        ORDER BY similarity ASC 
        LIMIT 3
      `, [vectorString]);

      const [csResults] = await connection.execute(`
        SELECT 
          school_name, program_name, specific_field,
          VEC_COSINE_DISTANCE(embedding, ?) AS similarity
        FROM schools 
        WHERE specific_field LIKE '%Computer%' 
        AND country_region LIKE '%United States%'
        ORDER BY similarity ASC 
        LIMIT 3
      `, [vectorString]);

      // 检查国家过滤
      const [countryCheck] = await connection.execute(`
        SELECT DISTINCT country_region 
        FROM schools 
        WHERE specific_field LIKE '%Computer%'
        ORDER BY country_region
      `);

      await connection.end();

      return res.status(200).json({
        user_profile_text: userProfile,
        vector_length: userVector.length,
        law_similarities: lawResults.map(row => ({
          school: row.school_name,
          program: row.program_name,
          field: row.specific_field,
          similarity: row.similarity
        })),
        cs_similarities: csResults.map(row => ({
          school: row.school_name,
          program: row.program_name,
          field: row.specific_field,
          similarity: row.similarity
        })),
        cs_countries: countryCheck.map(row => row.country_region),
        analysis: {
          best_law_similarity: lawResults[0]?.similarity || 'N/A',
          best_cs_similarity: csResults[0]?.similarity || 'N/A',
          law_vs_cs_difference: lawResults[0] && csResults[0] ? 
            (csResults[0].similarity - lawResults[0].similarity) : 'N/A'
        }
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('❌ Profile debug error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
