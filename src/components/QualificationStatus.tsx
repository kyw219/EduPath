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

  // 资格数据 - 使用LLM评估结果
  const qualificationData: QualificationItem[] = [
    {
      name: 'GPA',
      status: school.qualification_status?.gpa?.status || 'unknown',
      requiredValue: school.gpa_requirement,
      userValue: getUserValue('gpa')
    },
    {
      name: 'Language Score',
      status: school.qualification_status?.language?.status || 'unknown',
      requiredValue: school.language_requirement,
      userValue: getUserValue('language')
    },
    {
      name: 'Prerequisites',
      status: school.qualification_status?.prerequisites?.status || 'unknown',
      requiredValue: school.prerequisite_courses,
      userValue: getUserValue('prerequisites')
    },
    {
      name: 'Degree Requirement',
      status: school.qualification_status?.degree?.status || 'unknown',
      requiredValue: school.degree_requirement,
      userValue: getUserValue('degree')
    },
    {
      name: 'Other Requirements',
      status: school.qualification_status?.other?.status || 'unknown',
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
