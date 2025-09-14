import React from 'react';
import { School } from '../types';
import { Clock, DollarSign, BookOpen, CheckCircle, AlertCircle } from 'lucide-react';

interface TargetSchoolsProps {
  schools: School[];
}

const TargetSchools: React.FC<TargetSchoolsProps> = ({ schools }) => {
  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-pink-600';
  };

  const getStatusIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-500" />;
    return <AlertCircle className="w-5 h-5 text-yellow-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
          Target Schools
        </h2>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          Action
        </button>
      </div>

      <div className="grid gap-6">
        {schools.map((school, index) => (
          <div key={index} className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-colors">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* School Basic Info */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {school.school.split(' ').map(word => word[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg">{school.school}</h3>
                    <p className="text-slate-400 text-sm">{school.program}</p>
                  </div>
                </div>

                {/* Match Score - positioned under school name */}
                <div className="mb-4">
                  <div className="relative w-16 h-16 mb-2">
                    <div className="absolute inset-0 rounded-full bg-slate-700"></div>
                    <div 
                      className={`absolute inset-0 rounded-full bg-gradient-to-r ${getMatchScoreColor(school.match_score)}`}
                      style={{
                        background: `conic-gradient(from 0deg, transparent ${360 - (school.match_score * 3.6)}deg, #10B981 ${360 - (school.match_score * 3.6)}deg)`
                      }}
                    ></div>
                    <div className="absolute inset-2 bg-slate-800 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{school.match_score}</span>
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs">Match Score</p>
                </div>

                {/* School Details */}
                <div className="space-y-3">
                  <div>
                    <h5 className="text-slate-400 text-xs font-medium mb-1">QS Ranking</h5>
                    <p className="text-slate-300 text-sm">#{school.ranking || "N/A"}</p>
                  </div>
                  
                  <div>
                    <h5 className="text-slate-400 text-xs font-medium mb-1">Tuition</h5>
                    <p className="text-slate-300 text-sm">{school.tuition}</p>
                  </div>
                  
                  <div>
                    <h5 className="text-slate-400 text-xs font-medium mb-1">Duration</h5>
                    <p className="text-slate-300 text-sm">{school.duration || "2 years"}</p>
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div className="ml-4">
                <div className="mb-4">
                  <h4 className="text-white text-sm font-medium mb-3 flex items-center">
                    <BookOpen className="w-4 h-4 text-green-500 mr-2" />
                    Requirements
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <h5 className="text-slate-400 text-xs font-medium mb-1">Language Requirements</h5>
                      <p className="text-slate-300 text-sm">{school.language_requirements || "TOEFL 90+ or IELTS 7.0+"}</p>
                    </div>
                    
                    <div>
                      <h5 className="text-slate-400 text-xs font-medium mb-1">Admission Requirements</h5>
                      <p className="text-slate-300 text-sm">{school.admission_requirements || "Bachelor's degree, 3.0+ GPA recommended"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TargetSchools;