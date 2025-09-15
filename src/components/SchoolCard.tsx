import React from 'react';
import { School } from '../types';

interface SchoolCardProps {
  school: School;
  type: 'target' | 'reach';
  onAddToPlan?: (school: School) => void;
  schoolsInPlan?: Set<string>;
}

interface QualificationItem {
  name: string;
  status: 'met' | 'partial' | 'not_met';
  userValue?: string;
  requiredValue: string;
}

const SchoolCard: React.FC<SchoolCardProps> = ({ school, type, onAddToPlan, schoolsInPlan }) => {

  // Generate school abbreviation
  const getSchoolAbbreviation = (schoolName: string) => {
    return schoolName
      .split(' ')
      .filter(word => word.length > 2) // Filter out small words like "of", "the"
      .map(word => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  // Get compatibility score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-orange-400';
  };

  // Get compatibility score ring color
  const getScoreRingColor = (score: number) => {
    if (score >= 80) return '#10B981'; // green
    if (score >= 60) return '#F59E0B'; // yellow
    return '#F97316'; // orange
  };

  // Generate full program name from short program name
  const getFullProgramName = (program: string) => {
    // This would ideally come from the API data
    // For now, we'll generate a reasonable full name
    if (program.toLowerCase().includes('computer science')) {
      return 'Master of Science in Computer Science';
    }
    if (program.toLowerCase().includes('business')) {
      return 'Master of Business Administration';
    }
    if (program.toLowerCase().includes('engineering')) {
      return 'Master of Engineering';
    }
    return `Master of Science in ${program}`;
  };

  // Simple status calculation function
  const calculateStatus = (requirement: string): QualificationItem['status'] => {
    if (!requirement || requirement.toLowerCase().includes('not required') || requirement.toLowerCase().includes('not specified')) {
      return 'met';
    }
    if (requirement.toLowerCase().includes('preferred') || requirement.toLowerCase().includes('recommended')) {
      return 'partial';
    }
    return 'not_met'; // Default requires meeting
  };

  // Qualification data matching Admission Requirements order
  const qualificationData: QualificationItem[] = [
    {
      name: 'GPA',
      status: calculateStatus(school.gpa_requirement),
      requiredValue: school.gpa_requirement
    },
    {
      name: 'Language Score',
      status: calculateStatus(school.language_requirement),
      requiredValue: school.language_requirement
    },
    {
      name: 'Prerequisites',
      status: calculateStatus(school.prerequisite_courses),
      requiredValue: school.prerequisite_courses
    },
    {
      name: 'Degree Requirement',
      status: calculateStatus(school.degree_requirement),
      requiredValue: school.degree_requirement
    },
    {
      name: 'Other Requirements',
      status: calculateStatus(school.other_requirements),
      requiredValue: school.other_requirements
    }
  ];

  // Get qualification status indicator
  const getQualificationIndicator = (status: QualificationItem['status']) => {
    const baseClasses = 'w-4 h-4 rounded-full border-2 flex items-center justify-center';
    
    switch (status) {
      case 'met':
        return (
          <div className={`${baseClasses} bg-green-500 border-green-500`}>
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        );
      case 'partial':
        return (
          <div className={`${baseClasses} bg-gradient-to-r from-green-500 to-transparent border-green-500`}>
            <div className="w-1 h-2 bg-white rounded-full"></div>
          </div>
        );
      case 'not_met':
        return <div className={`${baseClasses} border-red-500 bg-transparent`}></div>;
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-colors">
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Column - School Identity & Score */}
        <div className="col-span-3 flex flex-col items-center text-center h-full py-4">
          {/* Top spacing to align with column headers */}
          <div className="h-6"></div>
          
          {/* School Logo */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
            type === 'target' 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
              : 'bg-gradient-to-r from-orange-500 to-red-600'
          }`}>
            <span className="text-white font-bold text-lg">
              {getSchoolAbbreviation(school.school)}
            </span>
          </div>

          {/* School Name */}
          <h3 className="text-white font-semibold text-lg mb-2 leading-relaxed">
            {school.school}
          </h3>

          {/* Full Program Name */}
          <p className="text-gray-300 text-base font-medium mb-6 leading-relaxed">
            {getFullProgramName(school.program)}
          </p>

          {/* Compatibility Score - Enlarged */}
          <div className="flex flex-col items-center">
            <div className="relative w-20 h-20 mb-3">
              {/* Background circle */}
              <div className="absolute inset-0 rounded-full bg-slate-700"></div>
              {/* Progress circle */}
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(from 0deg, ${getScoreRingColor(school.match_score)} ${school.match_score * 3.6}deg, transparent ${school.match_score * 3.6}deg)`
                }}
              ></div>
              {/* Inner circle with score */}
              <div className="absolute inset-2 bg-slate-800 rounded-full flex items-center justify-center">
                <span className={`font-bold text-xl ${getScoreColor(school.match_score)}`}>
                  {school.match_score}
                </span>
              </div>
            </div>
            <p className="text-slate-400 text-sm font-medium mb-4">Compatibility Score</p>
            
            {/* Add to Plan Button */}
            {(() => {
              const schoolId = `${school.school}-${school.program}`;
              const isInPlan = schoolsInPlan?.has(schoolId);
              
              return (
                <>
                  <button 
                    onClick={() => onAddToPlan?.(school)}
                    disabled={isInPlan}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors mb-2 ${
                      isInPlan 
                        ? 'bg-green-600 text-white cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isInPlan ? 'Added to Plan' : 'Add to Plan'}
                  </button>
                  <p className="text-slate-500 text-xs text-center">
                    {isInPlan ? 'Check Timeline for tasks' : 'View in Timeline after adding'}
                  </p>
                </>
              );
            })()}
          </div>
        </div>

        {/* Middle Column - Program Details */}
        <div className="col-span-3">
          <div className="bg-slate-800/50 rounded-lg p-4 h-full">
            <h4 className="text-slate-200 text-base font-bold mb-4 border-b border-slate-600 pb-2">
              Program Details
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="text-slate-400 text-xs font-medium">Program Ranking</label>
                <div className="mt-1 p-2 bg-slate-700 rounded border border-slate-600">
                  <span className="text-slate-300 text-sm">QS Ranking #{school.ranking || "N/A"}</span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-xs font-medium">Tuition</label>
                <div className="mt-1 p-2 bg-slate-700 rounded border border-slate-600">
                  <span className="text-slate-300 text-sm">{school.tuition}</span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-xs font-medium">Location</label>
                <div className="mt-1 p-2 bg-slate-700 rounded border border-slate-600">
                  <span className="text-slate-300 text-sm">
                    {school.school.includes('Hong Kong') ? 'Hong Kong' : 
                     school.school.includes('California') ? 'California, USA' :
                     school.school.includes('Chicago') ? 'Chicago, USA' :
                     school.school.includes('Tokyo') ? 'Tokyo, Japan' : 'Location TBD'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-xs font-medium">Duration</label>
                <div className="mt-1 p-2 bg-slate-700 rounded border border-slate-600">
                  <span className="text-slate-300 text-sm">{school.duration || "2 years"}</span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-xs font-medium">Application Period</label>
                <div className="mt-1 p-2 bg-slate-700 rounded border border-slate-600">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-xs">Opens:</span>
                      <span className="text-slate-300 text-sm">{school.application_opens || "September 1, 2024"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-xs">Deadline:</span>
                      <span className="text-slate-300 text-sm">{school.deadline || "January 15, 2025"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Admission Requirements */}
        <div className="col-span-3">
          <div className="bg-slate-800/50 rounded-lg p-4 h-full">
            <h4 className="text-slate-200 text-base font-bold mb-4 border-b border-slate-600 pb-2">
              Admission Requirements
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="text-slate-400 text-xs font-medium">GPA</label>
                <div className="mt-1 p-2 bg-slate-700 rounded border border-slate-600">
                  <span className="text-slate-300 text-sm">{school.gpa_requirement}</span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-xs font-medium">Language Score</label>
                <div className="mt-1 p-2 bg-slate-700 rounded border border-slate-600">
                  <span className="text-slate-300 text-sm">{school.language_requirement}</span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-xs font-medium">Prerequisites</label>
                <div className="mt-1 p-2 bg-slate-700 rounded border border-slate-600">
                  <span className="text-slate-300 text-sm">{school.prerequisite_courses}</span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-xs font-medium">Degree Requirement</label>
                <div className="mt-1 p-2 bg-slate-700 rounded border border-slate-600">
                  <span className="text-slate-300 text-sm">{school.degree_requirement}</span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-xs font-medium">Other Requirements</label>
                <div className="mt-1 p-2 bg-slate-700 rounded border border-slate-600">
                  <span className="text-slate-300 text-sm">{school.other_requirements}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Far Right Column - Qualification Status */}
        <div className="col-span-3">
          <div className="bg-slate-800/50 rounded-lg p-4 h-full">
            <h4 className="text-slate-200 text-base font-bold mb-4 border-b border-slate-600 pb-2">
              Qualification Status
            </h4>
            
            <div className="space-y-3">
              {qualificationData.map((item, index) => (
                <div key={index}>
                  <label className="text-slate-400 text-xs font-medium">{item.name}</label>
                  <div className="mt-1 p-2 bg-slate-700 rounded border border-slate-600 flex items-center justify-between">
                    <span className="text-slate-300 text-sm">{item.requiredValue}</span>
                    <div className="ml-3 flex-shrink-0">
                      {getQualificationIndicator(item.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SchoolCard;
