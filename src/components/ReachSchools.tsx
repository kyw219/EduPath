import React from 'react';
import { School } from '../types';
import SchoolCard from './SchoolCard';

interface ReachSchoolsProps {
  schools: School[];
  onTogglePlan: (school: School) => void;
  schoolsInPlan: Set<string>;
}

const ReachSchools: React.FC<ReachSchoolsProps> = ({ schools, onTogglePlan, schoolsInPlan }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <span className="w-3 h-3 bg-orange-500 rounded-full mr-3"></span>
          Reach Schools
        </h2>
      </div>

      <div className="space-y-6">
        {schools.map((school, index) => (
          <SchoolCard 
            key={index} 
            school={school} 
            type="reach"
            onTogglePlan={onTogglePlan}
            schoolsInPlan={schoolsInPlan}
          />
        ))}
      </div>
    </div>
  );
};

export default ReachSchools;