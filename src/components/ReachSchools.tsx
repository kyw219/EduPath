import React from 'react';
import { School } from '../types';
import SchoolCard from './SchoolCard';

interface ReachSchoolsProps {
  schools: School[];
}

const ReachSchools: React.FC<ReachSchoolsProps> = ({ schools }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <span className="w-3 h-3 bg-orange-500 rounded-full mr-3"></span>
          Aspirational Programs
        </h2>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          Adjust Selection
        </button>
      </div>

      <div className="space-y-6">
        {schools.map((school, index) => (
          <SchoolCard 
            key={index} 
            school={school} 
            type="reach" 
          />
        ))}
      </div>
    </div>
  );
};

export default ReachSchools;