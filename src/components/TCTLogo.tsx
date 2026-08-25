import React, { useState } from 'react';

interface TCTLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'full' | 'icon-only' | 'watermark' | 'compact' | 'print';
  className?: string;
  useImage?: boolean;
}

export const TCTLogo: React.FC<TCTLogoProps> = ({
  size = 'md',
  variant = 'full',
  className = '',
  useImage = false // default to vector for maximum sharpness and print clarity
}) => {
  const [imgError, setImgError] = useState(false);

  // Dimensions based on size for Circular Emblem logo (1:1 ratio)
  const sizeConfig = {
    xs: { height: 28, width: 28, text: 'text-[9px]' },
    sm: { height: 40, width: 40, text: 'text-[11px]' },
    md: { height: 50, width: 50, text: 'text-xs' },
    lg: { height: 72, width: 72, text: 'text-sm' },
    xl: { height: 110, width: 110, text: 'text-base' },
    '2xl': { height: 160, width: 160, text: 'text-xl' }
  };

  const currentSize = sizeConfig[size] || sizeConfig.md;

  if (variant === 'watermark') {
    return (
      <div className={`pointer-events-none select-none flex flex-col items-center justify-center ${className}`}>
        <svg
          viewBox="0 0 600 600"
          className="w-full h-full object-contain opacity-5 pointer-events-none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="300" cy="300" r="280" stroke="#0f172a" strokeWidth="8" />
          <circle cx="300" cy="288" r="70" stroke="#0f172a" strokeWidth="6" />
          <path
            d="M 195 175 L 230 142 Q 242 132, 258 132 L 342 132 Q 358 132, 370 142 L 405 175 Q 465 175, 480 190 Q 492 205, 492 235 L 492 360 Q 492 405, 448 405 L 152 405 Q 108 405, 108 360 L 108 235 Q 108 205, 120 190 Q 135 175, 195 175 Z"
            stroke="#0f172a"
            strokeWidth="8"
          />
          <text x="300" y="470" textAnchor="middle" fill="#0f172a" fontSize="42" fontWeight="900" letterSpacing="6">
            CORPORACIÓN TCT
          </text>
        </svg>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Official Circular TCT Logo Emblem with Golden Ring */}
      <div 
        style={{ height: currentSize.height, width: currentSize.width }}
        className="relative shrink-0 flex items-center justify-center aspect-square rounded-full print:shadow-none"
      >
        {/* Golden Neon Ring Aura (screen only) */}
        <div className="absolute -inset-0.5 rounded-full ring-2 ring-amber-400/90 shadow-[0_0_12px_rgba(245,158,11,0.6)] print:hidden pointer-events-none z-0" />

        <div className="w-full h-full rounded-full overflow-hidden relative z-10 bg-slate-900 flex items-center justify-center border-2 border-amber-400 shadow-sm print:border-amber-600 print:bg-slate-900">
          {!imgError && useImage ? (
            <img
              src="/assets/tct-logo.png"
              alt="Corporación TCT Logo"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              style={{ height: currentSize.height, width: currentSize.width }}
              className="w-full h-full object-cover select-none"
            />
          ) : (
            <svg
              viewBox="0 0 600 600"
              style={{ height: currentSize.height, width: currentSize.width }}
              className="w-full h-full object-contain"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <radialGradient id="tctCircleBg" cx="50%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="60%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#020617" />
                </radialGradient>
                <linearGradient id="tctGoldRing" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="40%" stopColor="#f59e0b" />
                  <stop offset="80%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#b45309" />
                </linearGradient>
                <linearGradient id="tctChromeWhite" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="50%" stopColor="#f8fafc" />
                  <stop offset="100%" stopColor="#e2e8f0" />
                </linearGradient>
                <radialGradient id="tctLensIris" cx="44%" cy="38%" r="62%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="22%" stopColor="#f97316" />
                  <stop offset="44%" stopColor="#ec4899" />
                  <stop offset="68%" stopColor="#8b5cf6" />
                  <stop offset="88%" stopColor="#0284c7" />
                  <stop offset="100%" stopColor="#090d16" />
                </radialGradient>
              </defs>

              {/* Background circular disc */}
              <circle cx="300" cy="300" r="292" fill="url(#tctCircleBg)" />
              <circle cx="300" cy="300" r="286" stroke="url(#tctGoldRing)" strokeWidth="12" />

              {/* Camera Body Silhouette */}
              <rect x="235" y="160" width="50" height="14" rx="5" fill="#94a3b8" />
              <path
                d="M 195 185 L 230 152 Q 242 142, 258 142 L 342 142 Q 358 142, 370 152 L 405 185 Q 465 185, 480 200 Q 492 215, 492 245 L 492 360 Q 492 400, 448 400 L 152 400 Q 108 400, 108 360 L 108 245 Q 108 215, 120 200 Q 135 185, 195 185 Z"
                fill="#1e293b"
                stroke="#cbd5e1"
                strokeWidth="10"
                strokeLinejoin="round"
              />

              {/* T C T Bold Letters */}
              {/* Left T */}
              <path d="M 136 210 L 220 210 L 220 242 L 192 242 L 192 355 L 164 355 L 164 242 L 136 242 Z" fill="url(#tctChromeWhite)" />
              {/* Right T */}
              <path d="M 380 210 L 464 210 L 464 242 L 436 242 L 436 355 L 408 355 L 408 242 L 380 242 Z" fill="url(#tctChromeWhite)" />
              {/* Center C */}
              <path d="M 346 226 C 320 206, 280 206, 254 226 C 214 256, 214 324, 254 354 C 280 374, 320 374, 346 354 L 326 322 C 312 332, 288 332, 276 322 C 256 304, 256 276, 276 258 C 288 248, 312 248, 326 258 Z" fill="url(#tctChromeWhite)" />

              {/* Colorful Camera Optical Lens */}
              <circle cx="300" cy="290" r="62" fill="#090d16" stroke="#475569" strokeWidth="4" />
              <circle cx="300" cy="290" r="50" fill="url(#tctLensIris)" />
              <circle cx="300" cy="290" r="18" fill="#020617" />
              {/* Lens highlight */}
              <circle cx="286" cy="276" r="6" fill="#ffffff" opacity="0.9" />

              {/* Text CORPORACIÓN TCT */}
              <text x="300" y="474" textAnchor="middle" fill="url(#tctGoldRing)" fontSize="40" fontWeight="900" letterSpacing="6">
                CORPORACIÓN TCT
              </text>
            </svg>
          )}
        </div>
      </div>

      {/* Optional Title Branding if variant is full */}
      {variant === 'full' && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-white text-base sm:text-lg tracking-wider leading-tight">
              CORPORACIÓN TCT
            </span>
          </div>
          <span className="font-slogan text-sm sm:text-base text-amber-300 font-medium tracking-wide leading-none select-none drop-shadow-sm -mt-0.5">
            Marcando Historia
          </span>
        </div>
      )}
    </div>
  );
};

