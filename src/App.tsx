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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [schoolsData, setSchoolsData] = useState<SchoolsResponse | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineResponse | null>(null);
  const [showChat, setShowChat] = useState(true);
  const [schoolsInPlan, setSchoolsInPlan] = useState<Set<string>>(new Set());

  // Handle adding school to plan
  const handleAddToPlan = (school: any) => {
    const schoolId = `${school.school}-${school.program}`;
    
    if (schoolsInPlan.has(schoolId)) {
      return; // Already in plan
    }

    // Add school to plan
    setSchoolsInPlan(prev => new Set([...prev, schoolId]));

    // Generate timeline tasks for this school
    const newTasks = generateSchoolTasks(school);
    
    // Update timeline data
    if (timelineData) {
      const updatedTimeline = { ...timelineData };
      
      // Add tasks to appropriate phases
      newTasks.forEach(task => {
        const phaseIndex = updatedTimeline.timeline.findIndex(phase => 
          phase.phase.toLowerCase().includes(task.phase.toLowerCase())
        );
        
        if (phaseIndex !== -1) {
          updatedTimeline.timeline[phaseIndex].tasks.push({
            task: task.task,
            deadline: task.deadline,
            status: 'pending',
            priority: task.priority,
            reason: task.reason,
            cost: task.cost
          });
        }
      });
      
      // Update totals
      updatedTimeline.total_tasks += newTasks.length;
      
      setTimelineData(updatedTimeline);
    }
  };

  // Generate tasks for a specific school
  const generateSchoolTasks = (school: any) => {
    const schoolName = school.school;
    const deadline = school.deadline || "January 15, 2025";
    
    return [
      {
        phase: "preparation",
        task: `Research ${schoolName} program requirements`,
        deadline: "October 15, 2024",
        priority: "high",
        reason: `Understand specific requirements for ${school.program} at ${schoolName}`,
        cost: "Free"
      },
      {
        phase: "application",
        task: `Complete ${schoolName} application`,
        deadline: deadline,
        priority: "high",
        reason: `Submit application before deadline for ${schoolName}`,
        cost: "$100"
      },
      {
        phase: "application",
        task: `Submit transcripts to ${schoolName}`,
        deadline: deadline,
        priority: "medium",
        reason: `Official transcripts required for ${schoolName} application`,
        cost: "$25"
      },
      {
        phase: "follow-up",
        task: `Follow up on ${schoolName} application status`,
        deadline: "March 1, 2025",
        priority: "medium",
        reason: `Check application status and provide any additional materials`,
        cost: "Free"
      }
    ];
  };

  // Initialize timeline with basic structure if no data exists
  const initializeTimelineIfNeeded = () => {
    if (!timelineData && schoolsInPlan.size > 0) {
      const basicTimeline = {
        timeline: [
          {
            phase: "Preparation Phase",
            period: "September - November 2024",
            color: "#3B82F6",
            tasks: []
          },
          {
            phase: "Application Phase", 
            period: "December 2024 - January 2025",
            color: "#F59E0B",
            tasks: []
          },
          {
            phase: "Follow-up Phase",
            period: "February - April 2025",
            color: "#10B981",
            tasks: []
          }
        ],
        key_deadlines: [],
        total_estimated_cost: "$0",
        total_tasks: 0,
        completion_rate: 0
      };
      setTimelineData(basicTimeline);
    }
  };

  // Initialize timeline when schools are added
  useEffect(() => {
    initializeTimelineIfNeeded();
  }, [schoolsInPlan]);

  // Auto-fetch welcome message on first load
  useEffect(() => {
    const initializeChat = async () => {
      if (messages.length === 0) {
        try {
          const chatResponse = await intelligentChat([{ role: 'user', content: 'hi' }]);
          setMessages([{
            role: 'assistant',
            content: chatResponse.reply
          }]);
        } catch (error) {
          console.error('Failed to initialize chat:', error);
        }
      }
    };
    initializeChat();
  }, []);

  const handleSendMessage = async (message: string) => {
    const newUserMessage: ChatMessage = { role: 'user', content: message };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    
    if (!analysisId) {
      try {
        // Use new intelligent chat API
        const chatResponse = await intelligentChat(updatedMessages);
        
        // Add AI reply
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: chatResponse.reply
        }]);
        
        // If enough information is available, start analysis
        if (chatResponse.shouldAnalyze) {
          setIsAnalyzing(true);
          
          try {
            // Analyze user profile
            const analysisResponse = await analyzeChat(chatResponse.extractedProfile);
            setAnalysisId(analysisResponse.analysis_id);
            
            // Get school recommendations
            const schools = await getSchools(analysisResponse.analysis_id);
            setSchoolsData(schools);
            
            // Get timeline
            const timeline = await getTimeline(analysisResponse.analysis_id);
            setTimelineData(timeline);

            // Send completion message
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `Analysis complete! You can now view your analysis results in the Target Schools and Reach Schools tabs.`
            }]);

            // Auto-navigate to results page but keep chat open
            setTimeout(() => {
              setActiveTab('target');
            }, 2000);

          } catch (error) {
            console.error('Analysis failed:', error);
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: 'Sorry, there was an error during analysis. Please try again.'
            }]);
          } finally {
            setIsAnalyzing(false);
          }
        }
        
      } catch (error) {
        console.error('Chat failed:', error);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.'
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
        return <TargetSchools schools={schoolsData.target_schools} onAddToPlan={handleAddToPlan} schoolsInPlan={schoolsInPlan} />;
      case 'reach':
        return <ReachSchools schools={schoolsData.reach_schools} onAddToPlan={handleAddToPlan} schoolsInPlan={schoolsInPlan} />;
      case 'timeline':
        if (!timelineData) {
          return (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <h3 className="text-white text-xl mb-4">No Timeline Generated Yet</h3>
                <p className="text-slate-400 mb-4">Add schools to your plan to generate a personalized timeline</p>
                <p className="text-slate-500 text-sm">Use the "Add to Plan" button on school cards to get started</p>
              </div>
            </div>
          );
        }
        return <Timeline timelineData={timelineData} />;
      default:
        return <TargetSchools schools={schoolsData.target_schools} onAddToPlan={handleAddToPlan} schoolsInPlan={schoolsInPlan} />;
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