import React from 'react';

interface LoaderProps {
  text?: string;
  fullScreen?: boolean;
  variant?: 'light' | 'dark';
}

export function Loader({ text = 'Loading...', fullScreen = false, variant = 'light' }: LoaderProps) {
  const isDark = variant === 'dark';

  const content = (
    <div className={`flex flex-col items-center justify-center gap-4 p-6 backdrop-blur-md border-4 max-w-xs mx-auto ${
      isDark 
        ? 'bg-[#1a1a1a]/90 shadow-[8px_8px_0_#ffe500] border-electricYellow' 
        : 'bg-white/90 shadow-[8px_8px_0_#1a1a1a] border-[#1a1a1a]'
    }`}>
      {/* Swiggly / Equalizer Loader */}
      <div className="flex items-center gap-2 h-8">
        {[...Array(5)].map((_, i) => (
          <div 
            key={i} 
            className={`w-2.5 ${isDark ? 'bg-electricYellow shadow-[2px_2px_0_#ffffff]' : 'bg-[#1a1a1a] shadow-[2px_2px_0_#ffe500]'}`}
            style={{
              height: '100%',
              animation: `squiggly 1.2s ease-in-out infinite`,
              animationDelay: `${i * 0.12}s`,
              transformOrigin: 'bottom'
            }}
          />
        ))}
        <style>{`
          @keyframes squiggly {
            0%, 100% { transform: scaleY(0.3); }
            50% { transform: scaleY(1.2); }
          }
        `}</style>
      </div>

      {text && (
        <p className={`font-black uppercase tracking-widest text-sm mt-2 text-center ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${
        isDark ? 'bg-[#0a0a0a]/90' : 'bg-cream/80'
      }`}>
        {content}
      </div>
    );
  }

  // Inside a container
  return (
    <div className="w-full h-full flex items-center justify-center min-h-[200px] p-8">
      {content}
    </div>
  );
}
