import React from 'react';

interface HomeProps {
  onStartAnalysis: () => void;
}

const Home: React.FC<HomeProps> = ({ onStartAnalysis }) => {
  return (
    <div className="flex-1 flex items-center justify-center relative overflow-hidden">
      {/* Animated Wave Background */}
      <div className="absolute inset-0 -z-10">
        <svg
          className="absolute bottom-0 w-full h-full"
          viewBox="0 0 1200 800"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="wave1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.1)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0.05)" />
            </linearGradient>
            <linearGradient id="wave2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(147, 51, 234, 0.1)" />
              <stop offset="100%" stopColor="rgba(147, 51, 234, 0.05)" />
            </linearGradient>
            <linearGradient id="wave3" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(16, 185, 129, 0.08)" />
              <stop offset="100%" stopColor="rgba(16, 185, 129, 0.03)" />
            </linearGradient>
          </defs>
          
          {/* Wave 1 */}
          <path
            fill="url(#wave1)"
            d="M0,400 C300,300 600,500 1200,400 L1200,800 L0,800 Z"
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0;50,0;0,0"
              dur="8s"
              repeatCount="indefinite"
            />
          </path>
          
          {/* Wave 2 */}
          <path
            fill="url(#wave2)"
            d="M0,500 C400,400 800,600 1200,500 L1200,800 L0,800 Z"
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0;-30,0;0,0"
              dur="6s"
              repeatCount="indefinite"
            />
          </path>
          
          {/* Wave 3 */}
          <path
            fill="url(#wave3)"
            d="M0,600 C200,550 400,650 600,600 C800,550 1000,650 1200,600 L1200,800 L0,800 Z"
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0;40,0;0,0"
              dur="10s"
              repeatCount="indefinite"
            />
          </path>
        </svg>
        
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-blue-400/20 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>
      </div>

      <div className="text-center max-w-4xl px-8 relative z-10">
        {/* Hero Section */}
        <div className="mb-16">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <span className="text-white text-3xl">🎓</span>
          </div>
          
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            Find Your Dream School
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              with AI
            </span>
          </h1>
          
          <p className="text-xl text-slate-400 mb-8 leading-relaxed">
            No more wondering 'Will I get in?' Know before you apply.<br />
            From overwhelmed to confident in one conversation.
          </p>
          
          <button 
            onClick={onStartAnalysis}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-10 py-4 rounded-xl text-lg font-semibold hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
          >
            🤖 Start AI Analysis
          </button>
        </div>

        {/* Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <div className="text-3xl font-bold text-blue-400 mb-2">10,000+</div>
            <div className="text-slate-400">Students Helped</div>
            <div className="text-slate-500 text-sm mt-1">Find their dream schools</div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <div className="text-3xl font-bold text-purple-400 mb-2">500+</div>
            <div className="text-slate-400">Top Universities</div>
            <div className="text-slate-500 text-sm mt-1">In our database</div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <div className="text-3xl font-bold text-green-400 mb-2">98%</div>
            <div className="text-slate-400">Match Accuracy</div>
            <div className="text-slate-500 text-sm mt-1">AI-powered precision</div>
          </div>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/30">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Smart Matching</h3>
            <p className="text-slate-400 text-sm">AI analyzes your profile for perfect school matches</p>
          </div>
          
          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/30">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">📅</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Timeline Planning</h3>
            <p className="text-slate-400 text-sm">Get personalized application timeline and deadlines</p>
          </div>
          
          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/30">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-white font-semibold mb-2">24/7 AI Assistant</h3>
            <p className="text-slate-400 text-sm">Real-time guidance for your application journey</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;
