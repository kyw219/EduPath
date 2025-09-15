import React from 'react';

interface GradientButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

const GradientButton: React.FC<GradientButtonProps> = ({ 
  onClick, 
  children, 
  className = '' 
}) => {
  return (
    <button 
      onClick={onClick}
      className={`bg-gradient-to-r from-blue-500 to-purple-600 text-white px-10 py-4 rounded-xl text-lg font-semibold hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 ${className}`}
    >
      {children}
    </button>
  );
};

export default GradientButton;
