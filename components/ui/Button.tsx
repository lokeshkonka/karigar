import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
}

export function Button({ className = '', variant = 'primary', children, ...props }: ButtonProps) {
  const baseStyles = "px-6 py-3 font-black uppercase tracking-wider text-sm transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-neo-xs hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-neo focus:outline-none disabled:opacity-50 border-neo";
  
  let variantStyles = "";
  switch (variant) {
    case 'primary':
      variantStyles = "bg-electricYellow text-[#1a1a1a] shadow-neo-sm";
      break;
    case 'secondary':
      variantStyles = "bg-blue text-white shadow-neo-sm";
      break;
    case 'danger':
      variantStyles = "bg-red text-white shadow-neo-sm";
      break;
    case 'success':
      variantStyles = "bg-green text-white shadow-neo-sm";
      break;
    case 'outline':
      variantStyles = "bg-transparent text-[#1a1a1a] shadow-neo-sm hover:bg-cream";
      break;
  }

  return (
    <button 
      className={`${baseStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
