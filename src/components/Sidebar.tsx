import React from 'react';
import { 
  GraduationCap, 
  Target, 
  Calendar,
  User,
  Home
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onChatToggle: () => void;
  showChat: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const menuItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'safe', icon: Target, label: 'Safe Programs' },
    { id: 'target', icon: Target, label: 'Possible Programs' },
    { id: 'reach', icon: Target, label: 'Dream Programs' },
    { id: 'timeline', icon: Calendar, label: 'Timeline' }
  ];

  return (
    <div className="w-64 bg-slate-900 h-full flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-semibold text-lg">EduPath AI</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-slate-300" />
          </div>
          <div className="text-sm">
            <p className="text-white font-medium">Eduatmerican</p>
            <p className="text-slate-400 text-xs">Student</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;