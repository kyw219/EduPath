// API 测试脚本
// 使用方法：node test-api.js

const BASE_URL = 'http://localhost:3000'; // Vercel dev server
// const BASE_URL = 'http://localhost:5173'; // 如果你想从 Vite dev server 调用

async function testChatAPI() {
  console.log('🔄 测试 Chat API...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: '我目前学的是计算机科学，想申请机器学习相关的研究生项目' }
        ]
      }),
    });
    
    const data = await response.json();
    console.log('✅ Chat API 响应:', data);
    return data;
  } catch (error) {
    console.error('❌ Chat API 错误:', error);
  }
}

async function testAnalyzeAPI(userProfile) {
  console.log('🔄 测试 Analyze API...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userProfile }),
    });
    
    const data = await response.json();
    console.log('✅ Analyze API 响应:', data);
    return data.analysis_id;
  } catch (error) {
    console.error('❌ Analyze API 错误:', error);
  }
}

async function testSchoolsAPI(analysisId) {
  console.log('🔄 测试 Schools API...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/schools?analysisId=${analysisId}`);
    const data = await response.json();
    console.log('✅ Schools API 响应:', data);
    return data;
  } catch (error) {
    console.error('❌ Schools API 错误:', error);
  }
}

async function testTimelineAPI(analysisId) {
  console.log('🔄 测试 Timeline API...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/timeline?analysisId=${analysisId}`);
    const data = await response.json();
    console.log('✅ Timeline API 响应:', data);
    return data;
  } catch (error) {
    console.error('❌ Timeline API 错误:', error);
  }
}

async function testAdjustAPI(analysisId) {
  console.log('🔄 测试 Adjust API...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        analysisId,
        action: 'remove_school',
        schoolId: 0,
        schoolType: 'target'
      }),
    });
    
    const data = await response.json();
    console.log('✅ Adjust API 响应:', data);
    return data;
  } catch (error) {
    console.error('❌ Adjust API 错误:', error);
  }
}

// 完整测试流程
async function runFullTest() {
  console.log('🚀 开始完整 API 测试流程...\n');
  
  // 1. 测试聊天 API
  const chatResult = await testChatAPI();
  
  if (chatResult && chatResult.hasBasicInfo) {
    // 2. 如果有基本信息，测试分析 API
    const analysisId = await testAnalyzeAPI(chatResult.extractedProfile);
    
    if (analysisId) {
      // 3. 测试获取学校推荐
      await testSchoolsAPI(analysisId);
      
      // 4. 测试获取时间线
      await testTimelineAPI(analysisId);
      
      // 5. 测试调整学校
      await testAdjustAPI(analysisId);
    }
  }
  
  console.log('\n✅ 所有测试完成！');
}

// 运行测试
runFullTest().catch(console.error);
