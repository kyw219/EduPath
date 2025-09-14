// 测试修改后的 schools API
const BASE_URL = 'http://localhost:3000';

async function testSchoolsAPI() {
  console.log('🔄 测试修改后的 Schools API...');
  
  try {
    // 先创建一个测试用的 analysis session
    const testProfile = {
      current_major: "Computer Science",
      target_field: "Machine Learning", 
      additional_info: "GPA 3.5, TOEFL 105"
    };

    console.log('1. 创建测试分析会话...');
    const analyzeResponse = await fetch(`${BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userProfile: testProfile }),
    });
    
    if (!analyzeResponse.ok) {
      throw new Error(`Analyze API error: ${analyzeResponse.status}`);
    }
    
    const analyzeData = await analyzeResponse.json();
    console.log('✅ 分析会话创建成功:', analyzeData.analysis_id);
    
    // 等待一下让数据处理完成
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('2. 测试 Schools API（使用真实数据 + LLM 结构化）...');
    console.log('⏳ 请等待 LLM 处理数据...');
    
    const schoolsResponse = await fetch(`${BASE_URL}/api/schools?analysisId=${analyzeData.analysis_id}`);
    
    if (!schoolsResponse.ok) {
      const errorText = await schoolsResponse.text();
      console.error('❌ Schools API 响应错误:', errorText);
      throw new Error(`Schools API error: ${schoolsResponse.status}`);
    }
    
    const schoolsData = await schoolsResponse.json();
    
    console.log('✅ Schools API 响应成功！');
    console.log('📊 Target Schools:', schoolsData.target_schools?.length || 0);
    console.log('📊 Reach Schools:', schoolsData.reach_schools?.length || 0);
    
    // 显示第一个学校的详细信息
    if (schoolsData.target_schools?.[0]) {
      console.log('\n🎯 第一个推荐项目详情:');
      const school = schoolsData.target_schools[0];
      console.log(`- 学校: ${school.school}`);
      console.log(`- 项目: ${school.program}`);
      console.log(`- 匹配分数: ${school.match_score}`);
      console.log(`- 学费: ${school.tuition}`);
      console.log(`- 语言要求: ${school.language_requirements}`);
      console.log(`- 入学要求: ${school.admission_requirements}`);
      console.log(`- 先修课程: ${school.prerequisites || 'N/A'}`);
      console.log(`- 其他要求: ${school.other_requirements || 'N/A'}`);
    }
    
    return schoolsData;
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    return null;
  }
}

// 运行测试
testSchoolsAPI()
  .then(data => {
    if (data) {
      console.log('\n🎉 测试完成！真实数据已通过 GPT-4o mini 成功结构化');
    } else {
      console.log('\n💥 测试失败，请检查错误信息');
    }
  })
  .catch(console.error);
