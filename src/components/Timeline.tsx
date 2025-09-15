import React, { useState } from 'react';
import { TimelineResponse } from '../types';
import { Calendar, CheckCircle, Clock, DollarSign, AlertCircle, Check, Info } from 'lucide-react';

interface TimelineProps {
  timelineData: TimelineResponse;
}

const Timeline: React.FC<TimelineProps> = ({ timelineData }) => {
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const toggleTaskCompletion = (taskId: string) => {
    const newCompleted = new Set(completedTasks);
    if (newCompleted.has(taskId)) {
      newCompleted.delete(taskId);
    } else {
      newCompleted.add(taskId);
    }
    setCompletedTasks(newCompleted);
  };

  const getTaskId = (phaseIndex: number, taskIndex: number) => {
    return `${phaseIndex}-${taskIndex}`;
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getTaskUrgencyColor = (deadline: string, isCompleted: boolean) => {
    // Always return neutral colors for task background
    return isCompleted ? 'bg-slate-700 border-slate-600' : 'bg-slate-800 border-slate-700';
  };

  const getTaskCardClasses = (deadline: string, isCompleted: boolean) => {
    // Always return neutral colors for task background
    return isCompleted ? 'bg-slate-700 border-slate-600' : 'bg-slate-800 border-slate-700';
  };

  const getUrgencyLabel = (deadline: string) => {
    const daysUntil = getDaysUntilDeadline(deadline);
    
    if (daysUntil === 0) {
      return 'Due today';
    } else if (daysUntil <= 7) {
      return `${daysUntil} days left`;
    } else if (daysUntil <= 30) {
      return `${daysUntil} days left`;
    } else {
      return `${daysUntil} days left`;
    }
  };


  const getStatusIcon = (status: string) => {
    // Always return exclamation mark for all tasks
    return <AlertCircle className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Calendar className="w-6 h-6 mr-3" />
          Application Timeline
        </h2>
        <div className="flex items-center space-x-4 text-sm">
          <span className="text-slate-400">Total Cost: {timelineData.total_estimated_cost}</span>
          <span className="text-slate-400">Tasks: {timelineData.total_tasks}</span>
          <span className="text-slate-400">
            Completed: {completedTasks.size}/{timelineData.total_tasks}
          </span>
        </div>
      </div>

      {/* Timeline Phases */}
      <div className="relative">
        {timelineData.timeline.map((phase, phaseIndex) => (
          <div key={phaseIndex} className="mb-12 last:mb-0">
            {/* Phase Header */}
            <div className="flex items-center mb-6">
              <div 
                className="w-4 h-4 rounded-full mr-4"
                style={{ backgroundColor: phase.color }}
              ></div>
              <div>
                <h3 className="text-xl font-semibold text-white">{phase.phase}</h3>
                <p className="text-slate-400 text-sm">{phase.period}</p>
              </div>
            </div>

            {/* Phase Tasks */}
            <div className="ml-8 space-y-4">
              {phase.tasks.map((task, taskIndex) => {
                const taskId = getTaskId(phaseIndex, taskIndex);
                const isCompleted = completedTasks.has(taskId);
                
                return (
                  <div 
                    key={taskIndex}
                    className={`rounded-lg p-4 border transition-all duration-300 ${getTaskCardClasses(task.deadline, isCompleted)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="relative group">
                            {getStatusIcon(task.status)}
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                              <div className="space-y-1">
                                <div><strong>Status:</strong> {task.status}</div>
                                <div><strong>Priority:</strong> {task.priority}</div>
                                <div><strong>Cost:</strong> {task.cost}</div>
                                <div><strong>Deadline:</strong> {task.deadline}</div>
                              </div>
                              {/* Tooltip arrow */}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
                            </div>
                          </div>
                          <h4 className={`font-medium ${isCompleted ? 'text-slate-400 line-through' : 'text-white'}`}>
                            {task.task}
                          </h4>
                          <span className="text-xs text-slate-400">
                            {getUrgencyLabel(task.deadline)}
                          </span>
                        </div>
                        
                        <p className={`text-sm mb-3 ${isCompleted ? 'text-slate-500' : 'text-slate-300'}`}>
                          {task.reason}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-sm text-slate-400">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Due: {task.deadline}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-4 h-4" />
                            <span>{task.cost}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Completion Button */}
                      <button
                        onClick={() => toggleTaskCompletion(taskId)}
                        className={`ml-4 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          isCompleted
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                        }`}
                      >
                        {isCompleted ? (
                          <div className="flex items-center space-x-1">
                            <Check className="w-4 h-4" />
                            <span>Completed</span>
                          </div>
                        ) : (
                          'Mark Complete'
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Connecting Line */}
            {phaseIndex < timelineData.timeline.length - 1 && (
              <div 
                className="w-0.5 h-8 ml-2 mt-4"
                style={{ backgroundColor: phase.color, opacity: 0.3 }}
              ></div>
            )}
          </div>
        ))}
      </div>

      {/* Key Deadlines Summary */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-white font-semibold mb-4">Key Upcoming Deadlines</h3>
        <div className="grid gap-3">
          {timelineData.key_deadlines.slice(0, 4).map((deadline, index) => {
            const daysUntil = getDaysUntilDeadline(deadline.date);
            const urgencyColor = daysUntil <= 30 ? 'text-red-400' : daysUntil <= 90 ? 'text-yellow-400' : 'text-slate-400';
            
            return (
              <div key={index} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    deadline.type === 'application' ? 'bg-red-500' : 'bg-blue-500'
                  }`}></div>
                  <span className="text-slate-300">{deadline.event}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-sm">{deadline.date}</span>
                  <div className={`text-xs ${urgencyColor}`}>
                    {getUrgencyLabel(deadline.date)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Timeline;