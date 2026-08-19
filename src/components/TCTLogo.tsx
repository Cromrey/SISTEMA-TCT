import React, { useState } from 'react';

interface TCTLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'full' | 'icon-only' | 'watermark' | 'compact';
  className?: string;
  useImage?: boolean;
}

export const TCTLogo: React.FC<TCTLogoProps> = ({
  size = 'md',
  variant = 'full',
  className = '',
  useImage = true
}) => {
  const [imgError, setImgError] = useState(false);

  // Dimensions based on size for Circular Emblem logo (1:1 ratio)
  const sizeConfig = {
    xs: { height: 26, width: 26, text: 'text-[9px]' },
    sm: { height: 36, width: 36, text: 'text-[11px]' },
    md: { height: 48, width: 48, text: 'text-xs' },
    lg: { height: 72, width: 72, text: 'text-sm' },
    xl: { height: 110, width: 110, text: 'text-base' },
    '2xl': { height: 160, width: 160, text: 'text-xl' }
  };

  const currentSize = sizeConfig[size] || sizeConfig.md;

  if (variant === 'watermark') {
    return (
      <div className={`pointer-events-none select-none flex flex-col items-center justify-center ${className}`}>
        <img
          src="/assets/tct-logo.png"
          alt="Corporación TCT Watermark"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain opacity-10 filter drop-shadow-sm pointer-events-none"
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Official Circular TCT Logo Emblem with Golden Glowing Aura */}
      <div 
        style={{ height: currentSize.height, width: currentSize.width }}
        className="relative shrink-0 flex items-center justify-center aspect-square"
      >
        {/* Golden Pulsing Border Glow */}
        <div className="absolute -inset-0.5 rounded-full ring-1.5 ring-amber-400/80 shadow-[0_0_10px_rgba(245,158,11,0.65)] animate-pulse pointer-events-none" />

        {!imgError && useImage ? (
          <img
            src="/assets/tct-logo.png"
            alt="Corporación TCT Logo"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            style={{ height: currentSize.height, width: currentSize.width }}
            className="w-full h-full object-contain filter drop-shadow-[0_0_6px_rgba(245,158,11,0.5)] select-none relative z-10"
          />
        ) : (
          <svg
            viewBox="0 0 600 600"
            style={{ height: currentSize.height, width: currentSize.width }}
            className="filter drop-shadow-md"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="tctCircleBgFb" cx="45%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#2c323b" />
                <stop offset="40%" stopColor="#181c22" />
                <stop offset="75%" stopColor="#0d0f12" />
                <stop offset="100%" stopColor="#050607" />
              </radialGradient>
              <linearGradient id="tctChromeGradFb" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="25%" stopColor="#e2e8f0" />
                <stop offset="55%" stopColor="#cbd5e1" />
                <stop offset="85%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#64748b" />
              </linearGradient>
              <radialGradient id="tctLensOpticalCoreFb" cx="44%" cy="38%" r="62%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="16%" stopColor="#f97316" />
                <stop offset="38%" stopColor="#ec4899" />
                <stop offset="55%" stopColor="#8b5cf6" />
                <stop offset="72%" stopColor="#0284c7" />
                <stop offset="88%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#020617" />
              </radialGradient>
            </defs>
            <circle cx="300" cy="300" r="290" fill="url(#tctCircleBgFb)" stroke="#334155" strokeWidth="4" />
            <rect x="135" y="160" width="55" height="14" rx="6" fill="#64748b" />
            <path
              d="M 195 175 L 230 142 Q 242 132, 258 132 L 342 132 Q 358 132, 370 142 L 405 175 Q 465 175, 480 190 Q 492 205, 492 235 L 492 360 Q 492 405, 448 405 L 152 405 Q 108 405, 108 360 L 108 235 Q 108 205, 120 190 Q 135 175, 195 175 Z"
              fill="#0d1117"
              stroke="url(#tctChromeGradFb)"
              strokeWidth="12"
              strokeLinejoin="round"
            />
            {/* TCT */}
            <path d="M 132 204 L 236 204 L 236 244 L 204 244 L 204 372 L 164 372 L 164 244 L 132 244 Z" fill="url(#tctChromeGradFb)" />
            <path d="M 364 204 L 468 204 L 468 244 L 436 244 L 436 372 L 396 372 L 396 244 L 364 244 Z" fill="url(#tctChromeGradFb)" />
            <path d="M 346 220 C 318 198, 282 198, 254 220 C 210 252, 210 324, 254 356 C 282 378, 318 378, 346 356 L 326 322 C 312 333, 288 333, 276 322 C 252 301, 252 275, 276 254 C 288 243, 312 243, 326 254 Z" fill="url(#tctChromeGradFb)" />
            {/* Lens */}
            <circle cx="300" cy="288" r="66" fill="#020617" stroke="#334155" strokeWidth="2" />
            <circle cx="300" cy="288" r="52" fill="url(#tctLensOpticalCoreFb)" />
            <circle cx="300" cy="288" r="16" fill="#000000" />
            <circle cx="288" cy="272" r="5" fill="#ffffff" opacity="0.95" />
            {/* Text */}
            <text x="300" y="472" textAnchor="middle" fill="url(#tctChromeGradFb)" fontSize="44" fontWeight="900" letterSpacing="8">
              CORPORACIÓN TCT
            </text>
          </svg>
        )}
      </div>

      {/* Optional Title Branding if variant is full */}
      {variant === 'full' && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-white text-base sm:text-lg tracking-wider leading-none">
              CORPORACIÓN TCT
            </span>
          </div>
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mt-0.5">
            Producción Audiovisual & Eventos
          </span>
        </div>
      )}
    </div>
  );
};
