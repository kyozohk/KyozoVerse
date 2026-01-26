interface HourglassGaugeProps {
  value: number;
  maxValue: number;
  label: string;
  culturalLabel: string;
  color: string;
}

export function HourglassGauge({ 
  value, 
  maxValue, 
  label, 
  culturalLabel,
  color
}: HourglassGaugeProps) {
  // Calculate fill percentage and height
  const fillPercentage = (value / maxValue);
  const totalGlassHeight = 140; // Total height of the glass tube interior
  const fillHeight = fillPercentage * totalGlassHeight;
  
  return (
    <svg width="140" height="200" viewBox="0 0 140 200" className="drop-shadow-lg">
      <defs>
        {/* Sand texture pattern */}
        <pattern id={`sandTexture-${label}`} patternUnits="userSpaceOnUse" width="3" height="3">
          <circle cx="1" cy="1" r="0.6" fill={color} opacity="0.4"/>
          <circle cx="2.5" cy="2.5" r="0.5" fill={color} opacity="0.3"/>
        </pattern>
        
        {/* Sand gradient */}
        <linearGradient id={`sandGradient-${label}`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.95" />
          <stop offset="50%" stopColor={color} stopOpacity="0.85" />
          <stop offset="100%" stopColor={color} stopOpacity="0.75" />
        </linearGradient>
        
        {/* Glass shine effect */}
        <linearGradient id={`glassShine-${label}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      
      {/* Wooden base */}
      <rect x="35" y="180" width="70" height="8" rx="2" fill="#5A4A3A" stroke="#3A3630" strokeWidth="2"/>
      <rect x="40" y="182" width="60" height="4" rx="1" fill="#8B7355" opacity="0.6"/>
      
      {/* Bottom wooden frame cap */}
      <rect x="45" y="170" width="50" height="6" rx="2" fill="#5A4A3A" stroke="#3A3630" strokeWidth="2"/>
      
      {/* Glass tube outer */}
      <rect x="52" y="30" width="36" height="140" rx="3" fill="none" stroke="#5A4A3A" strokeWidth="2.5"/>
      
      {/* Glass tube inner (lighter background) */}
      <rect x="54" y="32" width="32" height="136" rx="2" fill="#F5F1E8" opacity="0.5"/>
      
      {/* Sand fill - fills from bottom */}
      <clipPath id={`tubeClip-${label}`}>
        <rect x="54" y="32" width="32" height="136" rx="2"/>
      </clipPath>
      
      <g clipPath={`url(#tubeClip-${label})`}>
        {/* Main sand fill */}
        <rect
          x="54"
          y={168 - fillHeight}
          width="32"
          height={fillHeight}
          fill={`url(#sandGradient-${label})`}
        />
        
        {/* Sand texture overlay */}
        <rect
          x="54"
          y={168 - fillHeight}
          width="32"
          height={fillHeight}
          fill={`url(#sandTexture-${label})`}
        />
        
        {/* Sandy top edge (irregular mound) */}
        <ellipse
          cx="70"
          cy={168 - fillHeight}
          rx="16"
          ry="3"
          fill={color}
          opacity="0.4"
        />
        
        {/* Additional sand grain details at top */}
        {[...Array(8)].map((_, i) => (
          <circle
            key={i}
            cx={58 + (i * 4)}
            cy={168 - fillHeight + (Math.random() * 2 - 1)}
            r={0.8 + Math.random() * 0.4}
            fill={color}
            opacity={0.5 + Math.random() * 0.3}
          />
        ))}
      </g>
      
      {/* Glass shine overlay */}
      <rect
        x="56"
        y="34"
        width="10"
        height="132"
        rx="1"
        fill={`url(#glassShine-${label})`}
      />
      
      {/* Top wooden frame cap */}
      <rect x="45" y="24" width="50" height="6" rx="2" fill="#5A4A3A" stroke="#3A3630" strokeWidth="2"/>
      
      {/* Wooden top */}
      <rect x="35" y="10" width="70" height="8" rx="2" fill="#5A4A3A" stroke="#3A3630" strokeWidth="2"/>
      <rect x="40" y="12" width="60" height="4" rx="1" fill="#8B7355" opacity="0.6"/>
      
      {/* Scale markings on the side */}
      {Array.from({ length: 11 }, (_, i) => {
        const y = 168 - (i * 14);
        const isMajor = i % 2 === 0;
        const displayValue = Math.round((i / 10) * maxValue);
        
        return (
          <g key={`scale-${i}`}>
            <line
              x1="50"
              y1={y}
              x2={isMajor ? "45" : "47"}
              y2={y}
              stroke="#5A4A3A"
              strokeWidth={isMajor ? "2.5" : "1.5"}
              strokeLinecap="round"
            />
            {isMajor && (
              <text
                x="39"
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
      
      {/* Label at top */}
      <text x="70" y="6" fill="#5A4A3A" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="serif">
        {culturalLabel}
      </text>
      
      {/* Current level indicator */}
      <circle
        cx="93"
        cy={168 - fillHeight}
        r="4"
        fill={color}
        stroke="#3A3630"
        strokeWidth="2"
      />
      <line
        x1="88"
        y1={168 - fillHeight}
        x2="98"
        y2={168 - fillHeight}
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}