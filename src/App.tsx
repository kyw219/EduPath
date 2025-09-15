import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import Home from './components/Home';
import TargetSchools from './components/TargetSchools';
import DreamSchools from './components/ReachSchools';
import SafeChoice from './components/SafeChoice';
import Timeline from './components/Timeline';
import { ChatMessage, SchoolsResponse, TimelineResponse, UserProfile } from './types';
import { intelligentChat, analyzeChat, getSchools, getTimeline } from './api/realApi';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<'analyzing' | 'matching' | 'timeline' | 'complete'>('analyzing');
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [schoolsData, setSchoolsData] = useState<SchoolsResponse | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineResponse | null>(null);
  const [showChat, setShowChat] = useState(true);
  const [schoolsInPlan, setSchoolsInPlan] = useState<Set<string>>(new Set());
  
  // 用户档案状态 - 从聊天中提取
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // 从聊天消息中按序号提取用户回答
  const extractUserProfileFromMessages = (): UserProfile => {
    let gpa = 0;
    let toefl: number | undefined;
    let ielts: number | undefined;
    const background: string[] = [];
    const experience: string[] = [];

    console.log('🔍 提取用户信息，当前消息:', messages);

    // 遍历用户消息，查找编号回答
    messages.forEach((message, index) => {
      if (message.role === 'user') {
        const content = message.content.toLowerCase();
        console.log(`📝 消息 ${index}:`, content);
        
        // 更灵活的提取逻辑 - 支持多种格式
        
        // 1. GPA (寻找数字，可能在"1."后面或单独出现)
        const gpaMatch = content.match(/(?:1\.?\s*)?([0-9]+\.?[0-9]*)\s*(?:\/4|gpa|out of 4)?/);
        if (gpaMatch) {
          const gpaValue = parseFloat(gpaMatch[1]);
          if (gpaValue >= 1 && gpaValue <= 4) { // 合理的GPA范围
            gpa = gpaValue;
            console.log('✅ 找到GPA:', gpa);
          }
        }
        
        // 2. 编程语言 (更灵活的匹配)
        if (content.includes('python')) background.push('Python');
        if (content.includes('java') && !content.includes('javascript')) background.push('Java');
        if (content.includes('c++') || content.includes('cpp')) background.push('C++');
        if (content.includes('javascript') || content.includes('js')) background.push('JavaScript');
        
        // 3. 语言成绩 (寻找两位或三位数字)
        const langMatch = content.match(/(?:3\.?\s*)?(\d{2,3})(?!\d)/);
        if (langMatch) {
          const score = parseInt(langMatch[1]);
          if (score >= 80 && score <= 120) {
            toefl = score; // TOEFL范围
            console.log('✅ 找到TOEFL:', toefl);
          } else if (score >= 4 && score <= 9) {
            ielts = score / 10; // 可能是整数形式的IELTS
            console.log('✅ 找到IELTS:', ielts);
          }
        }
        
        // 也检查小数形式的IELTS
        const ieltsMatch = content.match(/(\d\.\d)/);
        if (ieltsMatch) {
          const score = parseFloat(ieltsMatch[1]);
          if (score >= 4.0 && score <= 9.0) {
            ielts = score;
            console.log('✅ 找到IELTS (小数):', ielts);
          }
        }
        
        // 4. 项目经验
        if (content.includes('internship')) experience.push('Internship');
        if (content.includes('research')) experience.push('Research');
        if (content.includes('project')) experience.push('Course Projects');
        if (content.includes('work') && !content.includes('coursework')) experience.push('Work Experience');
        
        // 5. 数学课程 (更灵活的匹配)
        if (content.includes('linear algebra') || content.includes('linear algrbra')) background.push('Linear Algebra');
        if (content.includes('discrete math') || content.includes('dicrete math')) background.push('Discrete Mathematics');
        if (content.includes('calculus') || content.includes('calculate')) background.push('Calculus');
        if (content.includes('statistics') || content.includes('stats')) background.push('Statistics');
      }
    });

    const profile = {
      name: 'User',
      gpa: gpa,
      toefl: toefl,
      ielts: ielts,
      background: background.length > 0 ? [...new Set(background)] : ['General Background'], // 去重
      degree: 'Bachelor\'s Degree',
      experience: experience.length > 0 ? [...new Set(experience)] : ['Academic Background'] // 去重
    };

    console.log('🎯 最终提取的用户档案:', profile);
    return profile;
  };

  // Handle adding/removing school to/from plan
  const handleTogglePlan = (school: any) => {
    const schoolId = `${school.school}-${school.program}`;
    
    if (schoolsInPlan.has(schoolId)) {
      // Remove from plan
      setSchoolsInPlan(prev => {
        const newSet = new Set(prev);
        newSet.delete(schoolId);
        return newSet;
      });

      // Remove corresponding timeline tasks
      if (timelineData) {
        const updatedTimeline = { ...timelineData };
        const schoolName = school.school;
        
        // Remove tasks related to this school
        updatedTimeline.timeline.forEach(phase => {
          phase.tasks = phase.tasks.filter(task => 
            !task.task.includes(schoolName)
          );
        });
        
        // Recalculate total tasks
        updatedTimeline.total_tasks = updatedTimeline.timeline.reduce(
          (total, phase) => total + phase.tasks.length, 0
        );
        
        // Recalculate total cost
        const totalCost = updatedTimeline.timeline.reduce((total, phase) => {
          return total + phase.tasks.reduce((phaseTotal, task) => {
            const cost = task.cost.replace(/[^0-9]/g, '');
            return phaseTotal + (cost ? parseInt(cost) : 0);
          }, 0);
        }, 0);
        updatedTimeline.total_estimated_cost = `$${totalCost.toLocaleString()}`;
        
        setTimelineData(updatedTimeline);
      }
    } else {
      // Add to plan
      setSchoolsInPlan(prev => new Set([...prev, schoolId]));

      // Generate timeline tasks for this school
      const newTasks = generateSchoolTasks(school);
      
      // Update timeline data
      if (timelineData) {
        const updatedTimeline = { ...timelineData };
        
        // Add tasks to appropriate phases
        newTasks.forEach(task => {
          let phaseIndex = -1;
          if (task.phase === "background") {
            phaseIndex = updatedTimeline.timeline.findIndex(phase => 
              phase.phase.toLowerCase().includes("background")
            );
          } else if (task.phase === "prep") {
            phaseIndex = updatedTimeline.timeline.findIndex(phase => 
              phase.phase.toLowerCase().includes("prep")
            );
          } else if (task.phase === "season") {
            phaseIndex = updatedTimeline.timeline.findIndex(phase => 
              phase.phase.toLowerCase().includes("season")
            );
          }
          
          if (phaseIndex !== -1) {
            updatedTimeline.timeline[phaseIndex].tasks.push({
              task: task.task,
              deadline: task.deadline,
              status: 'pending' as const,
              priority: task.priority as 'high' | 'medium' | 'low',
              reason: task.reason,
              cost: task.cost
            });
          }
        });
        
        // Update totals
        updatedTimeline.total_tasks += newTasks.length;
        
        // Calculate total cost
        const totalCost = updatedTimeline.timeline.reduce((total, phase) => {
          return total + phase.tasks.reduce((phaseTotal, task) => {
            const cost = task.cost.replace(/[^0-9]/g, '');
            return phaseTotal + (cost ? parseInt(cost) : 0);
          }, 0);
        }, 0);
        updatedTimeline.total_estimated_cost = `$${totalCost.toLocaleString()}`;
        
        setTimelineData(updatedTimeline);
      }
    }
  };

  // Generate realistic tasks for a specific school
  const generateSchoolTasks = (school: any) => {
    const schoolName = school.school;
    const program = school.program || "Master's Program";
    const deadline = school.deadline || "January 15, 2025";
    
    // Determine program type for targeted tasks
    const isCS = program.toLowerCase().includes('computer') || program.toLowerCase().includes('cs');
    const isBusiness = program.toLowerCase().includes('business') || program.toLowerCase().includes('mba');
    const isEngineering = program.toLowerCase().includes('engineering');
    
    const tasks = [];
    
    // Background Building Tasks (September - December 2024)
    if (isCS) {
      tasks.push({
        phase: "background",
        task: `Complete Linear Algebra course for ${schoolName} CS program`,
        deadline: "November 30, 2024",
        priority: "high",
        reason: `${schoolName} CS program requires strong mathematical foundation`,
        cost: "$500"
      });
      tasks.push({
        phase: "background",
        task: `Gain programming internship experience`,
        deadline: "December 15, 2024",
        priority: "medium",
        reason: `Strengthen technical background for competitive CS programs`,
        cost: "Free"
      });
    } else if (isBusiness) {
      tasks.push({
        phase: "background",
        task: `Complete business internship or work experience`,
        deadline: "November 30, 2024",
        priority: "high",
        reason: `${schoolName} values practical business experience`,
        cost: "Free"
      });
    } else if (isEngineering) {
      tasks.push({
        phase: "background",
        task: `Complete Calculus and Physics prerequisites`,
        deadline: "December 1, 2024",
        priority: "high",
        reason: `Essential foundation for engineering programs at ${schoolName}`,
        cost: "$800"
      });
    }
    
    // General background task
    tasks.push({
      phase: "background",
      task: `Improve GPA in relevant coursework`,
      deadline: "December 20, 2024",
      priority: "medium",
      reason: `Strengthen academic profile for ${schoolName} admission`,
      cost: "Free"
    });
    
    // Application Prep Tasks (October 2024 - January 2025)
    tasks.push({
      phase: "prep",
      task: `Take TOEFL exam (target: 100+)`,
      deadline: "November 15, 2024",
      priority: "high",
      reason: `${schoolName} requires strong English proficiency`,
      cost: "$245"
    });
    
    tasks.push({
      phase: "prep",
      task: `Write Personal Statement for ${schoolName}`,
      deadline: "December 1, 2024",
      priority: "high",
      reason: `Craft compelling narrative for ${program} application`,
      cost: "$200"
    });
    
    tasks.push({
      phase: "prep",
      task: `Request 3 recommendation letters`,
      deadline: "November 20, 2024",
      priority: "high",
      reason: `Allow recommenders sufficient time for quality letters`,
      cost: "Free"
    });
    
    tasks.push({
      phase: "prep",
      task: `Update CV with recent achievements`,
      deadline: "December 5, 2024",
      priority: "medium",
      reason: `Showcase relevant experience for ${schoolName} admission`,
      cost: "Free"
    });
    
    // Application Season Tasks (December 2024 - March 2025)
    tasks.push({
      phase: "season",
      task: `Submit ${schoolName} online application`,
      deadline: deadline,
      priority: "high",
      reason: `Complete application before ${schoolName} deadline`,
      cost: "$100"
    });
    
    tasks.push({
      phase: "season",
      task: `Upload official transcripts to ${schoolName}`,
      deadline: deadline,
      priority: "high",
      reason: `Ensure all academic records are submitted`,
      cost: "$25"
    });
    
    tasks.push({
      phase: "season",
      task: `Follow up on ${schoolName} application status`,
      deadline: "February 15, 2025",
      priority: "medium",
      reason: `Track application progress and provide additional materials if needed`,
      cost: "Free"
    });
    
    return tasks;
  };

  // Initialize timeline with basic structure if no data exists
  const initializeTimelineIfNeeded = () => {
    if (!timelineData && schoolsInPlan.size > 0) {
      const basicTimeline = {
        timeline: [
          {
            phase: "Background Building",
            period: "September - December 2024",
            color: "#EF4444",
            tasks: []
          },
          {
            phase: "Application Prep", 
            period: "October 2024 - January 2025",
            color: "#F59E0B",
            tasks: []
          },
          {
            phase: "Application Season",
            period: "December 2024 - March 2025",
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
        
        // If enough information is available, start analysis
        if (chatResponse.shouldAnalyze) {
          setIsAnalyzing(true);
          setAnalysisProgress('analyzing');
          
          // Add AI reply
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: chatResponse.reply
          }]);
          
          try {
            // Analyze user profile
            console.log('🔄 开始分析用户档案...', new Date().toLocaleTimeString());
            const analysisResponse = await analyzeChat(chatResponse.extractedProfile);
            setAnalysisId(analysisResponse.analysis_id);
            console.log('✅ 用户档案分析完成', new Date().toLocaleTimeString());
            
            // Update progress to matching phase
            setAnalysisProgress('matching');
            
            // Get school recommendations
            console.log('🔄 开始匹配学校...', new Date().toLocaleTimeString());
            const schools = await getSchools(analysisResponse.analysis_id);
            console.log('✅ 学校匹配完成', new Date().toLocaleTimeString());
            
            // 从聊天消息中提取用户信息用于资格评估
            try {
              const extractedProfile = extractUserProfileFromMessages();
              setUserProfile(extractedProfile);
              console.log('✅ 用户资料提取成功:', extractedProfile);
            } catch (error) {
              console.error('❌ 用户资料提取失败:', error);
              // 即使提取失败也继续，只是不会有智能评估
            }
            
            // 临时处理：从API返回中分离safe_schools数据
            if (schools.safe_schools) {
              // 如果API已经返回了分离的数据，直接使用
              setSchoolsData(schools);
            } else if (schools.target_schools && schools.target_schools.length > 6) {
              // 如果target_schools包含了合并数据，需要分离
              const enhancedSchools = {
                ...schools,
                safe_schools: schools.target_schools.slice(-3), // 最后3个作为safe choice
                target_schools: schools.target_schools.slice(0, -3) // 前面的作为perfect match
              };
              setSchoolsData(enhancedSchools);
            } else {
              setSchoolsData(schools);
            }
            
            // Update progress to timeline phase
            setAnalysisProgress('timeline');
            
            // Get timeline
            console.log('🔄 开始生成时间线...', new Date().toLocaleTimeString());
            const timeline = await getTimeline(analysisResponse.analysis_id);
            setTimelineData(timeline);
            console.log('✅ 时间线生成完成', new Date().toLocaleTimeString());
            
            // Mark as complete
            setAnalysisProgress('complete');

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
        } else {
          // Add AI reply for non-analysis cases
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: chatResponse.reply
          }]);
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
    switch (activeTab) {
      case 'home':
        return <Home onStartAnalysis={() => setShowChat(true)} />;
      case 'target':
        if (!schoolsData) {
          return (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center opacity-50">
                  <span className="text-white text-2xl">🎓</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">No Analysis Yet</h2>
                <p className="text-slate-400 mb-6">Complete your AI analysis to see school recommendations</p>
                <button 
                  onClick={() => setShowChat(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Start Analysis
                </button>
              </div>
            </div>
          );
        }
        return <TargetSchools schools={schoolsData.target_schools} onTogglePlan={handleTogglePlan} schoolsInPlan={schoolsInPlan} userProfile={userProfile} />;
      case 'reach':
        if (!schoolsData) {
          return (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center opacity-50">
                  <span className="text-white text-2xl">🏆</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">No Analysis Yet</h2>
                <p className="text-slate-400 mb-6">Complete your AI analysis to see dream school recommendations</p>
                <button 
                  onClick={() => setShowChat(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Start Analysis
                </button>
              </div>
            </div>
          );
        }
        return <DreamSchools schools={schoolsData.reach_schools} onTogglePlan={handleTogglePlan} schoolsInPlan={schoolsInPlan} userProfile={userProfile} />;
      case 'safe':
        if (!schoolsData || !schoolsData.safe_schools) {
          return (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center opacity-50">
                  <span className="text-white text-2xl">🛡️</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">No Analysis Yet</h2>
                <p className="text-slate-400 mb-6">Complete your AI analysis to see safe choice recommendations</p>
                <button 
                  onClick={() => setShowChat(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Start Analysis
                </button>
              </div>
            </div>
          );
        }
        return <SafeChoice schools={schoolsData.safe_schools} onTogglePlan={handleTogglePlan} schoolsInPlan={schoolsInPlan} userProfile={userProfile} />;
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
        return <Home onStartAnalysis={() => setShowChat(true)} />;
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onChatToggle={() => setShowChat(!showChat)}
        showChat={showChat}
      />
      
      <div className="flex-1 flex">
        {/* Top Bar with Chat Toggle */}
        <div className="flex-1 flex flex-col">
          <div className="flex justify-end p-4 flex-shrink-0">
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
            analysisProgress={analysisProgress}
            onClose={() => setShowChat(false)}
          />
        )}
      </div>
    </div>
  );
}

export default App;