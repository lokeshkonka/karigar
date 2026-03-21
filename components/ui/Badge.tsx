import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'waiting' | 'inprogress' | 'quality' | 'ready' | 'overdue' | 'default';
}

export function Badge({ className = '', variant = 'default', children, ...props }: BadgeProps) {
  let variantStyles = "bg-cream text-[#1a1a1a]";
  
  switch (variant) {
    case 'waiting': // WAITING
      variantStyles = "bg-electricYellow text-[#1a1a1a]";
      break;
    case 'inprogress':
      variantStyles = "bg-blue text-white";
      break;
    case 'quality':
      variantStyles = "bg-orange text-white";
      break;
    case 'ready':
      variantStyles = "bg-green text-white";
      break;
    case 'overdue':
      variantStyles = "bg-red text-white animate-pulse shadow-[0_0_10px_rgba(226,75,74,0.7)]";
      break;
  }

  return (
    <span
      className={`px-3 py-1 text-xs font-black uppercase tracking-wide border-neo-sm ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
