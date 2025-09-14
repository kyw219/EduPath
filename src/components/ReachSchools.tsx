import React from 'react';
import { School } from '../types';
import { AlertTriangle, Clock, DollarSign, BookOpen, Target } from 'lucide-react';

interface ReachSchoolsProps {
  schools: School[];
}

const ReachSchools: React.FC<ReachSchoolsProps> = ({ schools }) => {
  const getMatchScoreColor = (score: number) => {
    if (score >= 70) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-pink-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <span className="w-3 h-3 bg-orange-500 rounded-full mr-3"></span>
          Reach Schools
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
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center">
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
                        background: `conic-gradient(from 0deg, transparent ${360 - (school.match_score * 3.6)}deg, #F59E0B ${360 - (school.match_score * 3.6)}deg)`
                      }}
                    ></div>
                    <div className="absolute inset-2 bg-slate-800 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{school.match_score}</span>
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs">Match Score</p>
                </div>
              </div>

              {/* Gaps & Requirements */}
              <div>
                <div className="mb-4">
                  <h4 className="text-white text-sm font-medium mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 text-orange-500 mr-2" />
                    Knowledge Gaps
                  </h4>
                  <div className="space-y-1">
                    {school.gaps?.map((gap, i) => (
                      <span key={i} className="inline-block bg-red-900 text-red-300 text-xs px-2 py-1 rounded mr-2 mb-1">
                        {gap}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-white text-sm font-medium mb-2 flex items-center">
                    <BookOpen className="w-4 h-4 text-blue-500 mr-2" />
                    Suggestions
                  </h4>
                  <p className="text-slate-300 text-sm">{school.suggestions}</p>
                </div>
              </div>

              {/* Program Details */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-white text-sm font-medium mb-2">Duration</h4>
                  <p className="text-slate-300 text-sm">{school.duration || "2 years"}</p>
                </div>

                <div>
                  <h4 className="text-white text-sm font-medium mb-2">Language Requirements</h4>
                  <p className="text-slate-300 text-sm">{school.language_requirements || "TOEFL 100+ or IELTS 7.5+"}</p>
                </div>

                <div>
                  <h4 className="text-white text-sm font-medium mb-2">Admission Requirements</h4>
                  <p className="text-slate-300 text-sm">{school.admission_requirements || "Strong academic background, research experience preferred"}</p>
                </div>

                <div className="pt-3">
                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-orange-900 text-orange-300">
                    Reach School
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

export default ReachSchools;