interface CulturalVesselGaugeProps {
  value: number;
  maxValue: number;
  label: string;
  culturalLabel: string;
  color: string;
  patternType?: 'geometric' | 'bamboo' | 'waves';
}

export function CulturalVesselGauge({ 
  value, 
  maxValue, 
  label, 
  culturalLabel,
  color,
  patternType = 'geometric' 
}: CulturalVesselGaugeProps) {
  const fillHeight = (value / maxValue) * 130;
  const fillY = 172 - fillHeight;
  
  return (
    <svg width="140" height="200" viewBox="0 0 140 200" className="drop-shadow-lg">
      <defs>
        {/* Gradient for the fill - water/liquid effect */}
        <linearGradient id={`fillGradient-${label}`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#7BD3C4" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#D4A574" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#E87461" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      
      {/* Base/Stand - organic shape */}
      <ellipse cx="70" cy="182" rx="28" ry="6" fill="#3A3630" stroke="#5A4A3A" strokeWidth="2"/>
      
      {/* Main vessel body - organic ceramic shape */}
      <path
        d="M 52 180 Q 48 150, 50 120 L 50 50 Q 50 35, 70 32 Q 90 35, 90 50 L 90 120 Q 92 150, 88 180 Z"
        fill="#E8DFD0"
        stroke="#5A4A3A"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      
      {/* Inner vessel space - lighter */}
      <path
        d="M 55 178 Q 52 150, 54 120 L 54 55 Q 54 42, 70 40 Q 86 42, 86 55 L 86 120 Q 88 150, 85 178 Z"
        fill="#F5F1E8"
        stroke="#8B7355"
        strokeWidth="1.5"
      />
      
      {/* Decorative patterns based on type */}
      {patternType === 'geometric' && (
        <>
          {/* Top band - geometric pattern */}
          <rect x="50" y="48" width="40" height="12" fill="#8B7355" opacity="0.3"/>
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={`geo-${i}`}>
              <line x1={55 + i * 8} y1="50" x2={57 + i * 8} y2="50" stroke="#5A4A3A" strokeWidth="1"/>
              <line x1={55 + i * 8} y1="55" x2={57 + i * 8} y2="55" stroke="#5A4A3A" strokeWidth="1"/>
              <circle cx={56 + i * 8} cy="52.5" r="1.5" fill="#3A3630" opacity="0.4"/>
            </g>
          ))}
          {/* Mid wave pattern */}
          <path
            d="M 54 100 Q 58 97, 62 100 T 70 100 T 78 100 T 86 100"
            stroke="#8B7355"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M 54 105 Q 58 102, 62 105 T 70 105 T 78 105 T 86 105"
            stroke="#8B7355"
            strokeWidth="1.5"
            fill="none"
          />
        </>
      )}
      
      {patternType === 'bamboo' && (
        <>
          {/* Bamboo segment lines */}
          {[48, 68, 88, 110, 135].map((y, idx) => (
            <g key={`bamboo-${idx}`}>
              <line x1="50" y1={y} x2="90" y2={y} stroke="#8B7355" strokeWidth="2" opacity="0.5"/>
              <line x1="50" y1={y + 2} x2="90" y2={y + 2} stroke="#8B7355" strokeWidth="1" opacity="0.3"/>
              {/* Small natural marks */}
              <circle cx={60 + Math.random() * 15} cy={y + 5} r="1" fill="#5A4A3A" opacity="0.4"/>
              <circle cx={75 + Math.random() * 10} cy={y + 7} r="0.8" fill="#5A4A3A" opacity="0.3"/>
            </g>
          ))}
        </>
      )}
      
      {patternType === 'waves' && (
        <>
          {/* Flowing wave patterns */}
          {[55, 80, 105, 130].map((y, idx) => (
            <g key={`wave-${idx}`}>
              <path
                d={`M 54 ${y} Q 58 ${y - 3}, 62 ${y} T 70 ${y} T 78 ${y} T 86 ${y}`}
                stroke="#8B7355"
                strokeWidth="1.5"
                fill="none"
                opacity="0.6"
              />
              <path
                d={`M 54 ${y + 4} Q 58 ${y + 1}, 62 ${y + 4} T 70 ${y + 4} T 78 ${y + 4} T 86 ${y + 4}`}
                stroke="#8B7355"
                strokeWidth="1"
                fill="none"
                opacity="0.4"
              />
            </g>
          ))}
        </>
      )}
      
      {/* Scale markings - organic hand-drawn style */}
      {Array.from({ length: 11 }, (_, i) => {
        const y = 172 - (i * 13);
        const isMajor = i % 2 === 0;
        const displayValue = Math.round((i / 10) * maxValue);
        return (
          <g key={`scale-${i}`}>
            <line
              x1="48"
              y1={y}
              x2={isMajor ? "42" : "45"}
              y2={y}
              stroke="#5A4A3A"
              strokeWidth={isMajor ? "2.5" : "1.5"}
              strokeLinecap="round"
            />
            {isMajor && (
              <text
                x="36"
                y={y + 1}
                fill="#3A3630"
                fontSize="9"
                fontWeight="bold"
                textAnchor="end"
                dominantBaseline="middle"
                fontFamily="serif"
              >
                {displayValue}
              </text>
            )}
          </g>
        );
      })}
      
      {/* Liquid fill - rises with organic top edge */}
      <path
        d={`M 55 178 Q 52 150, 54 120 L 54 ${fillY} Q 58 ${fillY - 2}, 62 ${fillY} T 70 ${fillY} T 78 ${fillY} Q 82 ${fillY - 2}, 86 ${fillY} L 86 120 Q 88 150, 85 178 Z`}
        fill={`url(#fillGradient-${label})`}
      />
      
      {/* Vessel rim - decorative top */}
      <ellipse cx="70" cy="32" rx="22" ry="5" fill="#3A3630" stroke="#5A4A3A" strokeWidth="2"/>
      <ellipse cx="70" cy="31" rx="20" ry="4" fill="#5A4A3A" opacity="0.6"/>
      
      {/* Cultural label at top */}
      <text x="70" y="22" fill="#5A4A3A" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="serif">
        {culturalLabel}
      </text>
      
      {/* Current level indicator - artistic marker */}
      <circle
        cx="95"
        cy={fillY}
        r="4"
        fill={color}
        stroke="#3A3630"
        strokeWidth="2"
      />
      <line
        x1="90"
        y1={fillY}
        x2="99"
        y2={fillY}
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
