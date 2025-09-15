import React from 'react';

interface HomeProps {
  onStartAnalysis: () => void;
}

const Home: React.FC<HomeProps> = ({ onStartAnalysis }) => {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-4xl px-8">
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
            Get personalized school recommendations powered by advanced AI.<br />
            Join thousands of students who found their perfect academic match.
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

        {/* Trust Indicators */}
        <div className="mt-16 pt-8 border-t border-slate-700/50">
          <p className="text-slate-500 text-sm mb-4">Trusted by students from</p>
          <div className="flex justify-center items-center space-x-8 text-slate-600">
            <span className="font-semibold">MIT</span>
            <span className="font-semibold">Stanford</span>
            <span className="font-semibold">Harvard</span>
            <span className="font-semibold">Oxford</span>
            <span className="font-semibold">Cambridge</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
