import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, action }) => {
  return (
    <div className={`bg-white rounded-2xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 ${className}`}>
      {(title || action) && (
        <div className="px-6 py-4 border-b border-gray-100/80 bg-gray-50/50 flex justify-between items-center">
          {title && <h3 className="text-base font-bold text-gray-900 tracking-tight uppercase text-xs text-gray-500">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};