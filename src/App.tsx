import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import TargetSchools from './components/TargetSchools';
import ReachSchools from './components/ReachSchools';
import Timeline from './components/Timeline';
import { ChatMessage, SchoolsResponse, TimelineResponse } from './types';
import { intelligentChat, analyzeChat, getSchools, getTimeline, adjustSchools } from './api/realApi';

function App() {
  const [activeTab, setActiveTab] = useState('target');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hi! 欢迎来到EduPath AI！👋 

我需要了解两个基本信息来为你推荐最适合的学校：
1️⃣ 你现在的专业背景是什么？
2️⃣ 你想申请什么专业的研究生？

当然，如果你还能告诉我更多信息就更棒了！比如：GPA、相关经验、地区偏好、预算范围等等。信息越详细，我的推荐就越精准 🎯

请一次性告诉我这些信息吧！`
    }
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [schoolsData, setSchoolsData] = useState<SchoolsResponse | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineResponse | null>(null);
  const [showChat, setShowChat] = useState(true);

  const handleSendMessage = async (message: string) => {
    const newUserMessage: ChatMessage = { role: 'user', content: message };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    
    if (!analysisId) {
      try {
        // 使用新的智能聊天API
        const chatResponse = await intelligentChat(updatedMessages);
        
        // 添加AI回复
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: chatResponse.reply
        }]);
        
        // 如果有足够信息，开始分析
        if (chatResponse.shouldAnalyze) {
          setIsAnalyzing(true);
          
          try {
            // 分析用户档案
            const analysisResponse = await analyzeChat(chatResponse.extractedProfile);
            setAnalysisId(analysisResponse.analysis_id);
            
            // 获取学校推荐
            const schools = await getSchools(analysisResponse.analysis_id);
            setSchoolsData(schools);
            
            // 获取时间线
            const timeline = await getTimeline(analysisResponse.analysis_id);
            setTimelineData(timeline);

            // 发送完成消息
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `✅ 分析完成！我为你找到了 ${schools.target_schools.length} 个目标学校和 ${schools.reach_schools.length} 个冲刺学校。

📚 查看匹配学校推荐 → 点击左侧 'Target Schools' 和 'Reach Schools'
📅 查看个性化申请时间线 → 点击左侧 'Timeline'

这些推荐都是根据你的背景量身定制的！`
            }]);

            // 自动跳转到结果页面
            setTimeout(() => {
              setActiveTab('target');
              setShowChat(false);
            }, 3000);

          } catch (error) {
            console.error('Analysis failed:', error);
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: '抱歉，分析过程中出现了问题，请重试。'
            }]);
          } finally {
            setIsAnalyzing(false);
          }
        }
        
      } catch (error) {
        console.error('Chat failed:', error);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '抱歉，出现了问题，请重试。'
        }]);
      }
    }
  };

  const renderContent = () => {
    if (!schoolsData || !timelineData) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-2xl">🎓</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome to EduPath AI</h2>
            <p className="text-slate-400 mb-6">Start chatting to get personalized school recommendations</p>
            <div className="text-slate-500 text-sm">
              <p>Tell me about your:</p>
              <ul className="mt-2 space-y-1">
                <li>• Current major & GPA</li>
                <li>• Target field of study</li>
                <li>• Relevant experience</li>
                <li>• Location & budget preferences</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'target':
        return <TargetSchools schools={schoolsData.target_schools} />;
      case 'reach':
        return <ReachSchools schools={schoolsData.reach_schools} />;
      case 'timeline':
        return <Timeline timelineData={timelineData} />;
      default:
        return <TargetSchools schools={schoolsData.target_schools} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onChatToggle={() => setShowChat(!showChat)}
        showChat={showChat}
      />
      
      <div className="flex-1 flex">
        {/* Top Bar with Chat Toggle */}
        <div className="flex-1 flex flex-col">
          <div className="flex justify-end p-4">
            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-3 rounded-full transition-colors ${
                showChat
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
              }`}
              title="AI Chat"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
          </div>
          
          <main className="flex-1 px-8 pb-8 overflow-y-auto">
            {renderContent()}
          </main>
        </div>
        
        {showChat && (
          <ChatInterface 
            messages={messages} 
            onSendMessage={handleSendMessage}
            isAnalyzing={isAnalyzing}
            onClose={() => setShowChat(false)}
          />
        )}
      </div>
    </div>
  );
}

export default App;