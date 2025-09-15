import React from 'react';
import { School } from '../types';
import SchoolCard from './SchoolCard';

interface TargetSchoolsProps {
  schools: School[];
}

const TargetSchools: React.FC<TargetSchoolsProps> = ({ schools }) => {
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
          />
        ))}
      </div>
    </div>
  );
};

export default TargetSchools;