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

    console.log(`🔄 生成申请时间线: ${analysisId}`);

    // 生成时间线数据
    const timelineData = {
      timeline: [
        {
          phase: "Background Building",
          period: "2025-01 to 2025-03",
          color: "#10B981",
          tasks: [
            {
              task: "Complete Prerequisites",
              deadline: "2025-02-15",
              status: "pending",
              priority: "high",
              reason: "Required for target programs",
              cost: "$1,200"
            },
            {
              task: "Coursera: Calculus Specialization",
              deadline: "2025-03-01",
              status: "pending",
              priority: "medium",
              reason: "Math foundation for reach schools",
              cost: "$49/month"
            }
          ]
        },
        {
          phase: "Application Prep",
          period: "2025-04 to 2025-08",
          color: "#3B82F6",
          tasks: [
            {
              task: "GRE Preparation & Test",
              deadline: "2025-06-15",
              status: "upcoming",
              priority: "high",
              reason: "Required for most programs",
              cost: "$220"
            },
            {
              task: "Personal Statement Draft",
              deadline: "2025-07-30",
              status: "upcoming",
              priority: "high",
              reason: "Career change story critical",
              cost: "$0"
            }
          ]
        },
        {
          phase: "Application Season",
          period: "2025-09 to 2025-12",
          color: "#8B5CF6",
          tasks: [
            {
              task: "Target School Applications Submit",
              deadline: "2025-01-15",
              status: "upcoming",
              priority: "high",
              reason: "Top target schools",
              cost: "$360"
            },
            {
              task: "Reach School Applications Submit",
              deadline: "2025-12-01",
              status: "upcoming",
              priority: "medium",
              reason: "Reach schools",
              cost: "$250"
            }
          ]
        }
      ],
      key_deadlines: [
        { "date": "2025-01-15", "event": "Target School Applications Due", "type": "application" },
        { "date": "2025-02-01", "event": "Cal State LB MS CS Due", "type": "application" },
        { "date": "2025-06-15", "event": "GRE Test Date", "type": "milestone" },
        { "date": "2025-12-01", "event": "Reach School Applications Due", "type": "application" }
      ],
      total_estimated_cost: "$5,500",
      total_tasks: 18,
      completion_rate: 0
    };

    // 连接数据库并更新时间线数据
    const connection = await mysql.createConnection(dbConfig);

    try {
      await connection.execute(`
        UPDATE user_sessions 
        SET timeline_data = ?, status = 'completed'
        WHERE session_id = ?
      `, [JSON.stringify(timelineData), analysisId]);

      console.log('✅ 时间线生成完成');

      // 返回响应
      res.status(200).json(timelineData);

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('❌ 时间线生成错误:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
