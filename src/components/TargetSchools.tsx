import React from 'react';
import { School } from '../types';
import SchoolCard from './SchoolCard';

interface TargetSchoolsProps {
  schools: School[];
  onAddToPlan: (school: School) => void;
  schoolsInPlan: Set<string>;
}

const TargetSchools: React.FC<TargetSchoolsProps> = ({ schools, onAddToPlan, schoolsInPlan }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
          Target Schools
        </h2>
      </div>

      <div className="space-y-6">
        {schools.map((school, index) => (
          <SchoolCard 
            key={index} 
            school={school} 
            type="target"
            onAddToPlan={onAddToPlan}
            schoolsInPlan={schoolsInPlan}
          />
        ))}
      </div>
    </div>
  );
};

export default TargetSchools;