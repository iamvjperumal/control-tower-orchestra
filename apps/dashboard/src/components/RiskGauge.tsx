function scoreColor(score: number): string {
  if (score >= 60) return '#f87171';
  if (score >= 30) return '#fbbf24';
  return '#34d399';
}

export function RiskGauge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const clampedScore = Math.min(100, Math.max(0, score));
  const angle = (clampedScore / 100) * 180;
  const color = scoreColor(clampedScore);

  const rad = (angle * Math.PI) / 180;
  const x = 50 - 40 * Math.cos(rad);
  const y = 50 - 40 * Math.sin(rad);
  const largeArc = angle > 180 ? 1 : 0;

  const sizeClasses = {
    sm: 'w-24 h-16',
    md: 'w-40 h-24',
    lg: 'w-56 h-32',
  };

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 58" className={sizeClasses[size]}>
        <defs>
          <linearGradient id={`gauge-bg-${score}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1e1e36" />
            <stop offset="100%" stopColor="#1e1e36" />
          </linearGradient>
          <linearGradient id={`gauge-fill-${score}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#1e1e36" strokeWidth="7" strokeLinecap="round" />

        {clampedScore > 0 && (
          <path d={`M 10 50 A 40 40 0 ${largeArc} 1 ${x} ${y}`} fill="none" stroke={`url(#gauge-fill-${score})`} strokeWidth="7" strokeLinecap="round"
            filter="url(#glow)" style={{ transition: 'all 0.6s ease' }} />
        )}

        <text x="50" y="46" textAnchor="middle" fill={color} fontSize="18" fontWeight="800" fontFamily="Inter, system-ui, sans-serif">
          {clampedScore}
        </text>
        <text x="50" y="56" textAnchor="middle" fill="#55556a" fontSize="7" fontFamily="Inter, system-ui, sans-serif">
          RISK SCORE
        </text>
      </svg>
    </div>
  );
}
