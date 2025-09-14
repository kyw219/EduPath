import React, { useState } from 'react';
import { School } from '../types';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SchoolCardProps {
  school: School;
  type: 'target' | 'reach';
}

interface QualificationItem {
  name: string;
  status: 'met' | 'partial' | 'not_met';
  userValue?: string;
  requiredValue: string;
}

const SchoolCard: React.FC<SchoolCardProps> = ({ school, type }) => {
  const [showQualifications, setShowQualifications] = useState(false);

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

  // 简单状态计算函数
  const calculateStatus = (requirement: string): QualificationItem['status'] => {
    if (!requirement || requirement.toLowerCase().includes('not required') || requirement.toLowerCase().includes('not specified')) {
      return 'met';
    }
    if (requirement.toLowerCase().includes('preferred') || requirement.toLowerCase().includes('recommended')) {
      return 'partial';
    }
    return 'not_met'; // 默认需要满足
  };

  // 基于真实数据生成 qualification data
  const qualificationData: QualificationItem[] = [
    {
      name: 'English Proficiency',
      status: calculateStatus(school.language_requirements),
      userValue: 'TOEFL 105', // 这个应该来自用户档案
      requiredValue: school.language_requirements
    },
    {
      name: 'Academic Prerequisites',
      status: calculateStatus(school.admission_requirements),
      userValue: 'GPA 3.2', // 这个应该来自用户档案
      requiredValue: school.admission_requirements
    },
    {
      name: 'Prerequisites',
      status: calculateStatus(school.prerequisites || 'Not specified'),
      requiredValue: school.prerequisites || 'Not specified'
    },
    {
      name: 'Other Requirements',
      status: calculateStatus(school.other_requirements || 'Not specified'),
      requiredValue: school.other_requirements || 'Not specified'
    }
  ].filter(item => item.requiredValue !== 'Not specified'); // 过滤掉空值

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
        <div className="col-span-3">
          {/* School Logo */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
            type === 'target' 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
              : 'bg-gradient-to-r from-orange-500 to-red-600'
          }`}>
            <span className="text-white font-bold text-lg">
              {getSchoolAbbreviation(school.school)}
            </span>
          </div>

          {/* School Name */}
          <h3 className="text-white font-semibold text-lg mb-1 leading-tight">
            {school.school}
          </h3>

          {/* Full Program Name */}
          <p className="text-gray-300 text-base font-medium mb-4 leading-tight">
            {getFullProgramName(school.program)}
          </p>

          {/* Compatibility Score */}
          <div className="flex flex-col items-start">
            <div className="relative w-16 h-16 mb-2">
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
                <span className={`font-bold text-lg ${getScoreColor(school.match_score)}`}>
                  {school.match_score}
                </span>
              </div>
            </div>
            <p className="text-slate-400 text-sm">Compatibility Score</p>
          </div>
        </div>

        {/* Middle Column - Program Details */}
        <div className="col-span-3">
          <div className="border-2 border-red-500/30 rounded-lg p-4 h-full">
            <h4 className="text-white text-sm font-semibold mb-4 border-b border-slate-600 pb-2">
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
            </div>
          </div>
        </div>

        {/* Right Column - Admission Requirements */}
        <div className="col-span-3">
          <div className="border-2 border-red-500/30 rounded-lg p-4 h-full">
            <h4 className="text-white text-sm font-semibold mb-4 border-b border-slate-600 pb-2">
              Admission Requirements
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="text-slate-400 text-xs font-medium">English Proficiency</label>
                <div className="mt-1 p-2 bg-slate-700 rounded border border-slate-600">
                  <span className="text-slate-300 text-sm">
                    {school.language_requirements || "TOEFL 90+ or IELTS 7.0+"}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-xs font-medium">Academic Prerequisites</label>
                <div className="mt-1 p-2 bg-slate-700 rounded border border-slate-600">
                  <span className="text-slate-300 text-sm">
                    {school.admission_requirements || "Bachelor's degree, 3.0+ GPA recommended"}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-xs font-medium">Other Requirements</label>
                <div className="mt-1 p-2 bg-slate-700 rounded border border-slate-600">
                  <span className="text-slate-300 text-sm">
                    {type === 'reach' && school.suggestions ? 
                      school.suggestions : 
                      "Research experience preferred"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Far Right Column - Qualification Status */}
        <div className="col-span-3">
          <div className="border-2 border-red-500/30 rounded-lg p-4 h-full">
            <div className="flex items-center justify-between mb-4 border-b border-slate-600 pb-2">
              <h4 className="text-white text-sm font-semibold">
                Qualification Status
              </h4>
              <button
                onClick={() => setShowQualifications(!showQualifications)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {showQualifications ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
            
            <div className="space-y-3">
              {qualificationData.slice(0, showQualifications ? qualificationData.length : 3).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-400 text-xs font-medium">{item.name}</p>
                    <p className="text-slate-300 text-xs truncate">
                      {item.userValue ? `${item.userValue} / ${item.requiredValue}` : item.requiredValue}
                    </p>
                  </div>
                  <div className="ml-3 flex-shrink-0">
                    {getQualificationIndicator(item.status)}
                  </div>
                </div>
              ))}
              
              {!showQualifications && qualificationData.length > 3 && (
                <div className="text-center">
                  <button
                    onClick={() => setShowQualifications(true)}
                    className="text-blue-400 hover:text-blue-300 text-xs transition-colors"
                  >
                    +{qualificationData.length - 3} more
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SchoolCard;
