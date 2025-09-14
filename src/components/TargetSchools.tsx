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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* School Info */}
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {school.school.split(' ').map(word => word[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">{school.school}</h3>
                    <p className="text-slate-400 text-sm">{school.program}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-slate-400 mb-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{school.deadline}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-4 h-4" />
                    <span>{school.tuition}</span>
                  </div>
                </div>

                {/* Match Score */}
                <div className="text-center">
                  <div className="relative w-16 h-16 mx-auto mb-2">
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
              </div>

              {/* Requirements & Reason */}
              <div>
                <div className="mb-4">
                  <h4 className="text-white text-sm font-medium mb-2 flex items-center">
                    <BookOpen className="w-4 h-4 text-green-500 mr-2" />
                    Requirements
                  </h4>
                  <p className="text-slate-300 text-sm">{school.requirements}</p>
                </div>
                
                <div>
                  <h4 className="text-white text-sm font-medium mb-2">Why This School</h4>
                  <p className="text-slate-300 text-sm">{school.reason}</p>
                </div>
              </div>

              {/* Stats & Status */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-white text-sm font-medium mb-2">Employment Rate</h4>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full" 
                        style={{ width: school.employment_rate }}
                      ></div>
                    </div>
                    <span className="text-slate-300 text-sm">{school.employment_rate}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {getStatusIcon(school.match_score)}
                  <span className="text-slate-300 text-sm">
                    {school.match_score >= 80 ? 'Highly Recommended' : 'Recommended'}
                  </span>
                </div>

                <div className="pt-3">
                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-green-900 text-green-300">
                    Target School
                  </span>
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