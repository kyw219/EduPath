import mysql from 'mysql2/promise';
import { OpenAI } from 'openai';
import { v4 as uuidv4 } from 'uuid';

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

export default async function handler(req, res) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userProfile } = req.body;

    if (!userProfile) {
      return res.status(400).json({ error: 'Invalid user profile' });
    }

    // 生成 session_id
    const sessionId = uuidv4();

    // 使用传入的用户档案
    const profileText = `${userProfile.current_major} ${userProfile.target_field} GPA: ${userProfile.gpa_score} Countries: ${userProfile.preferred_countries?.join(', ')} Language: ${userProfile.language_test} ${userProfile.additional_info || ''}`;

    console.log('🔄 向量化用户档案...');
    
    // 向量化用户档案
    const embeddingResponse = await openai.embeddings.create({
      input: profileText,
      model: 'text-embedding-ada-002',
    });

    const profileVector = embeddingResponse.data[0].embedding;

    // 连接数据库
    const connection = await mysql.createConnection(dbConfig);

    try {
      // 存储用户会话
      await connection.execute(
        `INSERT INTO user_sessions (
          session_id, chat_messages, user_profile, 
          profile_embedding, status
        ) VALUES (?, ?, ?, ?, ?)`,
        [
          sessionId,
          JSON.stringify([]),  // 空的聊天记录，因为我们现在直接传用户档案
          profileText,
          JSON.stringify(profileVector),
          'analyzed'
        ]
      );

      console.log(`✅ 用户会话创建成功: ${sessionId}`);

      // 返回响应
      res.status(200).json({
        analysis_id: sessionId,
        status: 'analyzing',
        message: 'Analyzing 50+ programs based on your profile...'
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('❌ 分析错误:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
