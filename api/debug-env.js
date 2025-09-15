import mysql from 'mysql2/promise';
import { OpenAI } from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: 'vercel',
    checks: {}
  };

  // 1. 检查环境变量是否存在
  console.log('🔍 检查环境变量...');
  debugInfo.checks.environment_variables = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '✅ 已设置' : '❌ 未设置',
    TIDB_HOST: process.env.TIDB_HOST ? '✅ 已设置' : '❌ 未设置',
    TIDB_PORT: process.env.TIDB_PORT ? '✅ 已设置' : '❌ 未设置',
    TIDB_USER: process.env.TIDB_USER ? '✅ 已设置' : '❌ 未设置',
    TIDB_PASSWORD: process.env.TIDB_PASSWORD ? '✅ 已设置' : '❌ 未设置',
    TIDB_DATABASE: process.env.TIDB_DATABASE ? '✅ 已设置' : '❌ 未设置'
  };

  // 2. 测试OpenAI API连接
  console.log('🔍 测试OpenAI API连接...');
  try {
    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      
      // 简单的API调用测试
      const testResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 5
      });
      
      debugInfo.checks.openai_api = {
        status: '✅ 连接成功',
        model: 'gpt-4o-mini',
        response_length: testResponse.choices[0].message.content.length
      };
    } else {
      debugInfo.checks.openai_api = {
        status: '❌ API密钥未设置'
      };
    }
  } catch (error) {
    debugInfo.checks.openai_api = {
      status: '❌ 连接失败',
      error: error.message
    };
  }

  // 3. 测试数据库连接
  console.log('🔍 测试数据库连接...');
  try {
    if (process.env.TIDB_HOST && process.env.TIDB_USER && process.env.TIDB_PASSWORD && process.env.TIDB_DATABASE) {
      const dbConfig = {
        host: process.env.TIDB_HOST,
        port: parseInt(process.env.TIDB_PORT) || 4000,
        user: process.env.TIDB_USER,
        password: process.env.TIDB_PASSWORD,
        database: process.env.TIDB_DATABASE,
        ssl: { rejectUnauthorized: false }
      };

      const connection = await mysql.createConnection(dbConfig);
      
      // 测试基本连接
      const [rows] = await connection.execute('SELECT 1 as test');
      
      // 检查关键表是否存在
      const [tableCheck] = await connection.execute(
        "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('schools', 'user_sessions')",
        [process.env.TIDB_DATABASE]
      );
      
      // 检查schools表数据量
      const [schoolCount] = await connection.execute('SELECT COUNT(*) as count FROM schools');
      
      // 检查是否有embedding数据
      const [embeddingCheck] = await connection.execute(
        'SELECT COUNT(*) as count FROM schools WHERE embedding IS NOT NULL AND embedding != ""'
      );
      
      await connection.end();
      
      debugInfo.checks.database = {
        status: '✅ 连接成功',
        tables_found: tableCheck.map(t => t.TABLE_NAME),
        schools_count: schoolCount[0].count,
        schools_with_embeddings: embeddingCheck[0].count
      };
    } else {
      debugInfo.checks.database = {
        status: '❌ 数据库配置不完整'
      };
    }
  } catch (error) {
    debugInfo.checks.database = {
      status: '❌ 连接失败',
      error: error.message
    };
  }

  // 4. 测试向量搜索功能
  console.log('🔍 测试向量搜索功能...');
  try {
    if (debugInfo.checks.database.status === '✅ 连接成功' && debugInfo.checks.database.schools_with_embeddings > 0) {
      const dbConfig = {
        host: process.env.TIDB_HOST,
        port: parseInt(process.env.TIDB_PORT) || 4000,
        user: process.env.TIDB_USER,
        password: process.env.TIDB_PASSWORD,
        database: process.env.TIDB_DATABASE,
        ssl: { rejectUnauthorized: false }
      };

      const connection = await mysql.createConnection(dbConfig);
      
      // 获取一个示例向量进行测试
      const [sampleVector] = await connection.execute('SELECT embedding FROM schools WHERE embedding IS NOT NULL LIMIT 1');
      
      if (sampleVector.length > 0) {
        // 测试向量搜索
        const [vectorSearchResult] = await connection.execute(`
          SELECT 
            school_name, program_name, 
            VEC_COSINE_DISTANCE(embedding, ?) AS similarity
          FROM schools 
          WHERE embedding IS NOT NULL
          ORDER BY similarity ASC 
          LIMIT 3
        `, [sampleVector[0].embedding]);
        
        debugInfo.checks.vector_search = {
          status: '✅ 向量搜索功能正常',
          test_results_count: vectorSearchResult.length,
          sample_similarity: vectorSearchResult[0]?.similarity || 'N/A'
        };
      } else {
        debugInfo.checks.vector_search = {
          status: '❌ 没有可用的向量数据'
        };
      }
      
      await connection.end();
    } else {
      debugInfo.checks.vector_search = {
        status: '⏭️ 跳过 - 数据库连接失败或无向量数据'
      };
    }
  } catch (error) {
    debugInfo.checks.vector_search = {
      status: '❌ 向量搜索测试失败',
      error: error.message
    };
  }

  console.log('🎯 调试信息收集完成:', JSON.stringify(debugInfo, null, 2));

  return res.status(200).json(debugInfo);
}
