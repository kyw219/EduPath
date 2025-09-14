import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import TargetSchools from './components/TargetSchools';
import ReachSchools from './components/ReachSchools';
import Timeline from './components/Timeline';
import { ChatMessage, SchoolsResponse, TimelineResponse } from './types';
import { analyzeChat, getSchools, getTimeline } from './api/mockApi';

function App() {
  const [activeTab, setActiveTab] = useState('target');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hi! Tell me: your current major, target field, GPA, and any relevant experience in one sentence.'
    }
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [schoolsData, setSchoolsData] = useState<SchoolsResponse | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineResponse | null>(null);
  const [showChat, setShowChat] = useState(true);

  const handleSendMessage = async (message: string) => {
    const newUserMessage: ChatMessage = { role: 'user', content: message };
    setMessages(prev => [...prev, newUserMessage]);
    
    // Check if we should trigger analysis
    if (messages.length >= 2 && !analysisId) {
      setIsAnalyzing(true);
      
      try {
        // Analyze chat
        const analysisResponse = await analyzeChat([...messages, newUserMessage]);
        setAnalysisId(analysisResponse.analysis_id);
        
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: analysisResponse.message
        }]);

        // Get schools data
        const schools = await getSchools(analysisResponse.analysis_id);
        setSchoolsData(schools);
        
        // Get timeline data
        const timeline = await getTimeline(analysisResponse.analysis_id);
        setTimelineData(timeline);

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Great! I've analyzed your profile and found ${schools.target_schools.length} target schools and ${schools.reach_schools.length} reach schools that match your criteria. Check out the recommendations in the Target Schools and Reach Schools tabs!`
        }]);

        // Switch to target schools view after analysis
        setTimeout(() => {
          setActiveTab('target');
          setShowChat(false);
        }, 2000);

      } catch (error) {
        console.error('Analysis failed:', error);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, there was an error analyzing your profile. Please try again.'
        }]);
      } finally {
        setIsAnalyzing(false);
      }
    } else if (messages.length === 1) {
      // Ask follow-up question
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Got it! Any location/budget preferences?'
      }]);
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