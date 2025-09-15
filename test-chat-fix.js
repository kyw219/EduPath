// 测试聊天API的追问逻辑
const testMessages = [
  [
    { role: 'user', content: 'cs law 3.5' }
  ],
  [
    { role: 'user', content: 'cs law 3.5' },
    { role: 'assistant', content: 'Got it! Your current major is cs and you\'re targeting law programs. Your GPA is 3.5.' },
    { role: 'user', content: '103' }
  ]
];

async function testChat() {
  const API_BASE = 'http://localhost:3000';
  
  for (let i = 0; i < testMessages.length; i++) {
    console.log(`\n=== Test ${i + 1} ===`);
    console.log('Input:', JSON.stringify(testMessages[i], null, 2));
    
    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: testMessages[i] }),
      });
      
      const result = await response.json();
      console.log('Reply:', result.reply);
      console.log('Extracted Profile:', JSON.stringify(result.extractedProfile, null, 2));
      console.log('Has Sufficient Info:', result.hasBasicInfo);
      
    } catch (error) {
      console.error('Error:', error.message);
    }
  }
}

testChat();
