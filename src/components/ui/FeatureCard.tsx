import React from 'react';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  iconBgColor?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ 
  icon, 
  title, 
  description, 
  iconBgColor = 'bg-blue-500/20' 
}) => {
  return (
    <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/30">
      <div className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center mb-4 mx-auto`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  );
};

export default FeatureCard;
