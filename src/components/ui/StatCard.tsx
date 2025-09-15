import React from 'react';

interface StatCardProps {
  value: string;
  label: string;
  description: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, description, color }) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
      <div className={`text-3xl font-bold ${color} mb-2`}>{value}</div>
      <div className="text-slate-400">{label}</div>
      <div className="text-slate-500 text-sm mt-1">{description}</div>
    </div>
  );
};

export default StatCard;
