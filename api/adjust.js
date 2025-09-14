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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { analysisId, action, schoolId, schoolType } = req.body;

    if (!analysisId || !action || !schoolId || !schoolType) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    console.log(`🔄 调整学校: ${action} ${schoolType} school ${schoolId}`);

    const connection = await mysql.createConnection(dbConfig);

    try {
      // 获取当前学校列表
      const [sessionRows] = await connection.execute(
        'SELECT target_schools, reach_schools, user_profile FROM user_sessions WHERE session_id = ?',
        [analysisId]
      );

      if (sessionRows.length === 0) {
        return res.status(404).json({ error: 'Session not found' });
      }

      let targetSchools = JSON.parse(sessionRows[0].target_schools || '[]');
      let reachSchools = JSON.parse(sessionRows[0].reach_schools || '[]');
      const userProfile = sessionRows[0].user_profile;

      // 执行移除操作
      if (action === 'remove_school') {
        if (schoolType === 'target') {
          targetSchools = targetSchools.filter(school => school.school !== getSchoolNameById(schoolId, [...targetSchools, ...reachSchools]));
        } else {
          reachSchools = reachSchools.filter(school => school.school !== getSchoolNameById(schoolId, [...targetSchools, ...reachSchools]));
        }
      }

      // 简单补充逻辑 - 如果学校太少就补充
      if (targetSchools.length < 2) {
        // 从数据库补充一个target school
        const [supplementRows] = await connection.execute(`
          SELECT school_name, program_name, country_region, qs_ranking
          FROM schools 
          WHERE qs_ranking BETWEEN 20 AND 50
          ORDER BY RAND()
          LIMIT 1
        `);

        if (supplementRows.length > 0) {
          const newSchool = supplementRows[0];
          targetSchools.push({
            school: newSchool.school_name,
            program: newSchool.program_name,
            match_score: 75,
            deadline: "2025-02-01",
            requirements: "Standard requirements",
            tuition: "$45,000",
            duration: "2 years",
            language_requirements: "TOEFL 90+ or IELTS 7.0+",
            admission_requirements: "Bachelor's degree, 3.0+ GPA recommended",
            reason: "Additional quality program recommendation"
          });
        }
      }

      if (reachSchools.length < 2) {
        // 从数据库补充一个reach school
        const [supplementRows] = await connection.execute(`
          SELECT school_name, program_name, country_region, qs_ranking
          FROM schools 
          WHERE qs_ranking <= 15
          ORDER BY RAND()
          LIMIT 1
        `);

        if (supplementRows.length > 0) {
          const newSchool = supplementRows[0];
          reachSchools.push({
            school: newSchool.school_name,
            program: newSchool.program_name,
            match_score: 60,
            gaps: ["Stronger academic background"],
            suggestions: "Improve GPA and research experience",
            deadline: "2025-12-01",
            tuition: "$75,000",
            duration: "2 years",
            language_requirements: "TOEFL 100+ or IELTS 7.5+",
            admission_requirements: "Strong academic background, research experience preferred",
            requirements: "Excellent academic background",
            reason: "Top-tier program supplementary recommendation"
          });
        }
      }

      // 生成更新的Timeline
      const updatedTimeline = generateSimpleTimeline(targetSchools, reachSchools);

      // 更新数据库
      await connection.execute(`
        UPDATE user_sessions 
        SET target_schools = ?, reach_schools = ?, timeline_data = ?
        WHERE session_id = ?
      `, [
        JSON.stringify(targetSchools),
        JSON.stringify(reachSchools),
        JSON.stringify(updatedTimeline),
        analysisId
      ]);

      console.log(`✅ 学校调整完成`);

      res.status(200).json({
        success: true,
        updatedTargetSchools: targetSchools,
        updatedReachSchools: reachSchools,
        updatedTimeline: updatedTimeline,
        adjustmentMessage: `✅ Recommendations updated! You now have ${targetSchools.length} target schools and ${reachSchools.length} reach schools.`
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('❌ 学校调整错误:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// 辅助函数：根据ID获取学校名称
function getSchoolNameById(schoolId, allSchools) {
  // 简单实现：返回第一个匹配的学校名
  return allSchools[schoolId]?.school || 'Unknown School';
}

// 辅助函数：生成简单的Timeline
function generateSimpleTimeline(targetSchools, reachSchools) {
  const allSchools = [...targetSchools, ...reachSchools];
  const totalCost = allSchools.length * 150; // 简单计算

  return {
    timeline: [
      {
        phase: "Application Prep",
        period: "2025-01 to 2025-06",
        color: "#3B82F6",
        tasks: [
          {
            task: "Prepare application materials",
            deadline: "2025-03-01",
            status: "pending",
            priority: "high",
            reason: "Prepare common materials for all schools",
            cost: "$0"
          }
        ]
      },
      {
        phase: "Application Submission",
        period: "2025-09 to 2025-12",
        color: "#8B5CF6",
        tasks: allSchools.map((school, index) => ({
          task: `Submit ${school.school} application`,
          deadline: school.deadline || "2025-12-01",
          status: "upcoming",
          priority: "high",
          reason: `Apply to ${school.school}`,
          cost: "$150"
        }))
      }
    ],
    key_deadlines: allSchools.map(school => ({
      date: school.deadline || "2025-12-01",
      event: `${school.school} Application Due`,
      type: "application"
    })),
    total_estimated_cost: `$${totalCost}`,
    total_tasks: allSchools.length + 1,
    completion_rate: 0
  };
}
