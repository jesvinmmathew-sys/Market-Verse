import React from "react";

interface NovaLogoProps {
  className?: string;
  size?: number;
  variant?: "default" | "balloon";
}

export const NovaLogo: React.FC<NovaLogoProps> = ({ className = "w-8 h-8", size, variant = "default" }) => {
  const sizeStyle = size ? { width: size, height: size } : {};
  const isBalloon = variant === "balloon";

  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} transition-all duration-300`}
      style={sizeStyle}
      id="nova-ai-flagship-logo"
    >
      <defs>
        {/* Glow Filters */}
        {!isBalloon ? (
          <>
            <filter id="novaIntenseGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="novaBeadGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="novaShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="1" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.75" />
            </filter>
          </>
        ) : null}

        {/* Brand Gradients */}
        <linearGradient id="leftStemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isBalloon ? "#000000" : "#1cd4a1"} />
          <stop offset="100%" stopColor={isBalloon ? "#111111" : "#028090"} />
        </linearGradient>

        <linearGradient id="diagonalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isBalloon ? "#000000" : "#00f5d4"} />
          <stop offset="100%" stopColor={isBalloon ? "#1a1a1a" : "#028090"} />
        </linearGradient>

        <linearGradient id="rightStemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isBalloon ? "#111111" : "#ff5c77"} />
          <stop offset="100%" stopColor={isBalloon ? "#000000" : "#990033"} />
        </linearGradient>

        {/* Tapered Ring Gradients */}
        <linearGradient id="leftRingGrad" x1="50%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={isBalloon ? "#000000" : "#10b981"} stopOpacity="0.8" />
          <stop offset="100%" stopColor={isBalloon ? "#111111" : "#0ea5e9"} />
        </linearGradient>

        <linearGradient id="rightRingGrad" x1="50%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isBalloon ? "#000000" : "#f43f5e"} stopOpacity="0.8" />
          <stop offset="100%" stopColor={isBalloon ? "#111111" : "#be123c"} />
        </linearGradient>

        <radialGradient id="novaBgGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity={isBalloon ? "0" : "0.12"} />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Subtle background glow */}
      {!isBalloon && (
        <circle cx="100" cy="100" r="95" fill="url(#novaBgGlow)" className="animate-pulse" style={{ animationDuration: "6s" }} />
      )}

      {/* Left Tapered Arc (Green/Teal bull ring) */}
      <path
        d="M 100,16 C 51,16 16,51 16,100 C 16,134 35,152 46,158 C 44,152 48,145 56,145 C 68,145 88,148 102,138 C 76,155 52,160 38,154 C 23,143 18,124 18,100 C 18,55 55,18 100,18 Z"
        fill={isBalloon ? "#000000" : "url(#leftRingGrad)"}
        stroke={isBalloon ? "#000000" : "none"}
        strokeWidth={isBalloon ? "1.5" : "0"}
      />

      {/* Right Tapered Arc (Red/Crimson bear ring) */}
      <path
        d="M 100,16 C 149,16 184,51 184,100 C 184,134 165,152 154,158 C 156,152 152,145 144,145 C 132,145 112,148 98,138 C 124,155 148,160 162,154 C 177,143 182,124 182,100 C 182,55 145,18 100,18 Z"
        fill={isBalloon ? "#000000" : "url(#rightRingGrad)"}
        stroke={isBalloon ? "#000000" : "none"}
        strokeWidth={isBalloon ? "1.5" : "0"}
      />

      {/* Left Bullish Candlesticks (Green rising indicators) */}
      <g id="bullish-candlesticks-logo" opacity="1">
        {/* Leftmost small */}
        <line x1="33" y1="104" x2="33" y2="128" stroke="#10b981" strokeWidth={isBalloon ? "3" : "1.2"} />
        <rect x="30" y="109" width={isBalloon ? "6.5" : "4"} height={isBalloon ? "10" : "6"} fill="#10b981" rx={isBalloon ? "1" : "0.5"} />

        {/* Middle medium */}
        <line x1="42" y1="86" x2="42" y2="118" stroke="#10b981" strokeWidth={isBalloon ? "3" : "1.2"} />
        <rect x="39" y="93" width={isBalloon ? "7" : "4.5"} height={isBalloon ? "16" : "11"} fill="#10b981" rx={isBalloon ? "1" : "0.5"} />

        {/* Right large */}
        <line x1="51" y1="64" x2="51" y2="108" stroke="#10b981" strokeWidth={isBalloon ? "3" : "1.2"} />
        <rect x="47.5" y="74" width={isBalloon ? "8" : "5"} height={isBalloon ? "24" : "18"} fill="#10b981" rx={isBalloon ? "1" : "0.5"} />
      </g>

      {/* Right Bearish Candlesticks (Red falling indicators) */}
      <g id="bearish-candlesticks-logo" opacity="1">
        {/* Leftmost large */}
        <line x1="149" y1="64" x2="149" y2="108" stroke="#ef233c" strokeWidth={isBalloon ? "3" : "1.2"} />
        <rect x="145.5" y="72" width={isBalloon ? "8" : "5"} height={isBalloon ? "24" : "18"} fill="#ef233c" rx={isBalloon ? "1" : "0.5"} />

        {/* Middle medium */}
        <line x1="158" y1="81" x2="158" y2="117" stroke="#ef233c" strokeWidth={isBalloon ? "3" : "1.2"} />
        <rect x="154.5" y="88" width={isBalloon ? "7" : "4.5"} height={isBalloon ? "18" : "13"} fill="#ef233c" rx={isBalloon ? "1" : "0.5"} />

        {/* Rightmost small */}
        <line x1="167" y1="92" x2="167" y2="122" stroke="#ef233c" strokeWidth={isBalloon ? "3" : "1.2"} />
        <rect x="164" y="98" width={isBalloon ? "6.5" : "4"} height={isBalloon ? "14" : "11"} fill="#ef233c" rx={isBalloon ? "1" : "0.5"} />
      </g>

      {/* Center 3D ribbon "N" */}
      <g filter={isBalloon ? undefined : "url(#novaShadow)"}>
        {/* Left vertical ribbon stem */}
        <path
          d="M 56,141 
             L 56,66 
             C 56,54 62,50 76,50 
             L 76,141 Z"
          fill="url(#leftStemGrad)"
        />

        {/* Right vertical ribbon stem */}
        <path
          d="M 124,141 
             L 124,50 
             C 138,50 144,54 144,66 
             L 144,141 Z"
          fill="url(#rightStemGrad)"
        />

        {/* Diagonal overlapping glossy ribbon stem */}
        <path
          d="M 56,50 
             C 56,50 68,54 78,66 
             L 144,141 
             L 124,141 
             L 56,64 Z"
          fill="url(#diagonalGrad)"
        />
      </g>

      {/* Bottom Swoops Convergence & Glow Bead */}
      <g>
        {/* Left organic swoop line */}
        <path
          d="M 38,154 C 52,160 76,155 102,138"
          stroke={isBalloon ? "#000000" : "url(#leftRingGrad)"}
          strokeWidth={isBalloon ? "3" : "1.5"}
          strokeLinecap="round"
          opacity={isBalloon ? "1" : "0.6"}
        />
        {/* Right organic swoop line */}
        <path
          d="M 162,154 C 148,160 124,155 98,138"
          stroke={isBalloon ? "#000000" : "url(#rightRingGrad)"}
          strokeWidth={isBalloon ? "3" : "1.5"}
          strokeLinecap="round"
          opacity={isBalloon ? "1" : "0.6"}
        />

        {/* Central glowing bead */}
        <circle cx="100" cy="138" r={isBalloon ? "8" : "6.5"} fill={isBalloon ? "#000000" : "#00f5d4"} filter={isBalloon ? undefined : "url(#novaBeadGlow)"} />
        <circle cx="100" cy="138" r={isBalloon ? "4" : "4"} fill="#ffffff" />
      </g>
    </svg>
  );
};
