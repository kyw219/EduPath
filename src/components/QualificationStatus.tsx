import React from 'react';
import { School, UserProfile } from '../types';

interface QualificationItem {
  name: string;
  status: 'met' | 'partial' | 'not_met' | 'unknown';
  userValue?: string;
  requiredValue: string;
}

interface QualificationStatusProps {
  school: School;
  userProfile?: UserProfile | null;
}

const QualificationStatus: React.FC<QualificationStatusProps> = ({ school, userProfile }) => {
  
  // 智能资格评估函数
  const evaluateQualification = (
    type: 'gpa' | 'language' | 'prerequisites' | 'degree' | 'other',
    requirement: string
  ): QualificationItem['status'] => {
    if (!userProfile) {
      return 'unknown';
    }

    const req = requirement?.toLowerCase() || '';
    
    switch (type) {
      case 'gpa':
        if (!req || req.includes('not specified') || req.includes('not required')) {
          return 'met';
        }
        const gpaMatch = req.match(/(\d+\.?\d*)/);
        if (gpaMatch) {
          const requiredGPA = parseFloat(gpaMatch[1]);
          return userProfile.gpa >= requiredGPA ? 'met' : 'not_met';
        }
        return 'unknown';

      case 'language':
        if (!req || req.includes('not specified') || req.includes('not required')) {
          return 'met';
        }
        
        // 检查TOEFL
        const toeflMatch = req.match(/toefl[^0-9]*(\d+)/);
        if (toeflMatch && userProfile.toefl) {
          const requiredTOEFL = parseInt(toeflMatch[1]);
          return userProfile.toefl >= requiredTOEFL ? 'met' : 'not_met';
        }
        
        // 检查IELTS
        const ieltsMatch = req.match(/ielts[^0-9]*(\d+\.?\d*)/);
        if (ieltsMatch && userProfile.ielts) {
          const requiredIELTS = parseFloat(ieltsMatch[1]);
          return userProfile.ielts >= requiredIELTS ? 'met' : 'not_met';
        }
        
        return 'not_met';

      case 'prerequisites':
        if (!req || req.includes('not specified') || req.includes('not required')) {
          return 'met';
        }
        
        // 提取关键词
        const keywords = ['python', 'java', 'c++', 'data structures', 'algorithms', 'discrete mathematics', 'programming', 'mathematics'];
        const foundKeywords = keywords.filter(keyword => req.includes(keyword.toLowerCase()));
        const userKeywords = userProfile.background.map(bg => bg.toLowerCase());
        
        if (foundKeywords.length === 0) {
          return 'unknown';
        }
        
        const matchedKeywords = foundKeywords.filter(keyword => 
          userKeywords.some(userKeyword => userKeyword.includes(keyword))
        );
        
        if (matchedKeywords.length === foundKeywords.length) {
          return 'met'; // 全部匹配
        } else if (matchedKeywords.length > 0) {
          return 'partial'; // 部分匹配
        } else {
          return 'not_met'; // 无匹配
        }

      case 'degree':
        // 学位要求始终为绿色
        return 'met';

      case 'other':
        if (!req || req.includes('not specified') || req.includes('not required')) {
          return 'met';
        }
        
        // 检查经验相关关键词
        const expKeywords = ['research', 'internship', 'work experience', 'software development', 'academic record'];
        const foundExpKeywords = expKeywords.filter(keyword => req.includes(keyword.toLowerCase()));
        const userExp = userProfile.experience.map(exp => exp.toLowerCase());
        
        if (foundExpKeywords.length === 0) {
          return req.includes('recommended') ? 'partial' : 'unknown';
        }
        
        const matchedExpKeywords = foundExpKeywords.filter(keyword => 
          userExp.some(userExpItem => userExpItem.includes(keyword))
        );
        
        if (matchedExpKeywords.length === foundExpKeywords.length) {
          return 'met'; // 全部匹配
        } else if (matchedExpKeywords.length > 0) {
          return 'partial'; // 部分匹配
        } else {
          return 'not_met'; // 无匹配
        }

      default:
        return 'unknown';
    }
  };

  // 获取用户信息显示
  const getUserValue = (type: 'gpa' | 'language' | 'prerequisites' | 'degree' | 'other'): string => {
    if (!userProfile) {
      return '无档案';
    }
    
    switch (type) {
      case 'gpa':
        return `GPA: ${userProfile.gpa}/4.0`;
      case 'language':
        const scores = [];
        if (userProfile.toefl) scores.push(`TOEFL: ${userProfile.toefl}`);
        if (userProfile.ielts) scores.push(`IELTS: ${userProfile.ielts}`);
        return scores.length > 0 ? scores.join(', ') : '无语言成绩';
      case 'prerequisites':
        return userProfile.background.join(', ');
      case 'degree':
        return userProfile.degree;
      case 'other':
        return userProfile.experience.join(', ');
      default:
        return '未知';
    }
  };

  // 资格数据
  const qualificationData: QualificationItem[] = [
    {
      name: 'GPA',
      status: evaluateQualification('gpa', school.gpa_requirement),
      requiredValue: school.gpa_requirement,
      userValue: getUserValue('gpa')
    },
    {
      name: 'Language Score',
      status: evaluateQualification('language', school.language_requirement),
      requiredValue: school.language_requirement,
      userValue: getUserValue('language')
    },
    {
      name: 'Prerequisites',
      status: evaluateQualification('prerequisites', school.prerequisite_courses),
      requiredValue: school.prerequisite_courses,
      userValue: getUserValue('prerequisites')
    },
    {
      name: 'Degree Requirement',
      status: evaluateQualification('degree', school.degree_requirement),
      requiredValue: school.degree_requirement,
      userValue: getUserValue('degree')
    },
    {
      name: 'Other Requirements',
      status: evaluateQualification('other', school.other_requirements),
      requiredValue: school.other_requirements,
      userValue: getUserValue('other')
    }
  ];

  // Get qualification status indicator - 颜色系统，增大尺寸
  const getQualificationIndicator = (status: QualificationItem['status']) => {
    const baseClasses = 'w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200';
    
    switch (status) {
      case 'met':
        // 🟢 绿色实心圆点 - 完全符合
        return (
          <div className={`${baseClasses} bg-green-500 shadow-sm`}></div>
        );
      case 'partial':
        // 🟡 黄色实心圆点 - 部分符合
        return (
          <div className={`${baseClasses} bg-yellow-500 shadow-sm`}></div>
        );
      case 'not_met':
        // 🔴 红色实心圆点 - 不符合
        return (
          <div className={`${baseClasses} bg-red-500 shadow-sm`}></div>
        );
      case 'unknown':
      default:
        // ⚪ 灰色实心圆点 - 无法判断
        return (
          <div className={`${baseClasses} bg-gray-500 shadow-sm`}></div>
        );
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-lg p-4 h-full">
      <h4 className="text-slate-200 text-base font-bold mb-4 border-b border-slate-600 pb-2">
        Qualification Status
      </h4>
      
      <div className="space-y-3">
        {qualificationData.map((item, index) => (
          <div key={index}>
            {/* 只显示标签，与左边对应 */}
            <label className="text-slate-400 text-xs font-medium invisible">{item.name}</label>
            {/* 圆点容器，高度与左边的要求框对齐 */}
            <div className="mt-1 p-2 flex items-center justify-center border border-transparent rounded">
              {getQualificationIndicator(item.status)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QualificationStatus;
