import React from 'react';

export function Card({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={`bg-white border-neo shadow-neo p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
