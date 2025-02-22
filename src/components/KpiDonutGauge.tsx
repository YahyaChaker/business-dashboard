import React from 'react';
import styles from './ui/KpiDonutGauge.module.css';

interface KpiDonutGaugeProps {
  score: number;
  month: string;
  size?: number;
}

interface Point {
  x: number;
  y: number;
}

interface Tick {
  outerPoint: Point;
  innerPoint: Point;
  angle: number;
}

const KpiDonutGauge: React.FC<KpiDonutGaugeProps> = ({ score, month, size = 240 }) => {
  // SVG parameters
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.38;
  const strokeWidth = size * 0.08;
  const innerRadius = radius - strokeWidth / 2;
  
  // Calculate angles and arc paths
  const startAngle = -180;
  const endAngle = 0;
  const angleRange = endAngle - startAngle;
  const scoreAngle = startAngle + (score / 100) * angleRange;
  
  // Calculate coordinates for arc
  const polarToCartesian = (
    centerX: number, 
    centerY: number, 
    radius: number, 
    angleInDegrees: number
  ): Point => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };
  
  const describeArc = (
    x: number, 
    y: number, 
    radius: number, 
    startAngle: number, 
    endAngle: number
  ): string => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", start.x, start.y, 
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  };
  
  // Create the track and progress arcs
  const trackPath = describeArc(centerX, centerY, innerRadius, startAngle, endAngle);
  const progressPath = describeArc(centerX, centerY, innerRadius, startAngle, scoreAngle);
  
  // Calculate positions for decorative elements
  const ticksCount = 11; // Ensure there are 11 ticks
  const ticks: Tick[] = Array(ticksCount).fill(0).map((_, i) => {
    const angle = startAngle + (angleRange * i / (ticksCount - 1));
    const outerPoint = polarToCartesian(centerX, centerY, radius + 6, angle);
    const innerPoint = polarToCartesian(centerX, centerY, radius - strokeWidth - 2, angle);
    return { outerPoint, innerPoint, angle };
  });
  
  // Generate gradient IDs
  const trackGradientId = `track-gradient-${Math.random().toString(36).substr(2, 9)}`;
  const progressGradientId = `progress-gradient-${Math.random().toString(36).substr(2, 9)}`;
  
  // Get the color class based on score
  const scoreColorClass = score >= 95 ? styles.excellent :
                         score >= 85 ? styles.good :
                         score >= 75 ? styles.average :
                         styles.poor;
  
  // Define gradient colors based on score
  let progressColors = {
    start: '',
    end: ''
  };
  
  if (scoreColorClass === styles.excellent) {
    progressColors = { start: '#4ECDC4', end: '#4ECDC4' };
  } else if (scoreColorClass === styles.good) {
    progressColors = { start: '#FFD93D', end: '#FFD93D' };
  } else if (scoreColorClass === styles.average) {
    progressColors = { start: '#FF9F1C', end: '#FF9F1C' };
  } else {
    progressColors = { start: '#FF6B6B', end: '#FF6B6B' };
  }

  return (
    <div className={styles.kpiGaugeContainer} style={{width: size, height: size * 0.8}}>
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}*0.8`} 
        className={styles.kpiGaugeSvg}
      >
        {/* Definitions for gradients */}
        <defs>
          <linearGradient id={trackGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E5E7EB" />
            <stop offset="100%" stopColor="#F3F4F6" />
          </linearGradient>
          
          <linearGradient id={progressGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={progressColors.start} />
            <stop offset="100%" stopColor={progressColors.end} />
          </linearGradient>
          
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Decorative elements */}
        {ticks.map((tick, i) => (
          <React.Fragment key={i}>
            <line 
              x1={tick.innerPoint.x} 
              y1={tick.innerPoint.y} 
              x2={tick.outerPoint.x} 
              y2={tick.outerPoint.y}
              stroke={i === 0 || i === ticks.length - 1 || i === Math.floor(ticks.length / 2) ? '#9CA3AF' : '#E5E7EB'}
              strokeWidth={i === 0 || i === ticks.length - 1 || i === Math.floor(ticks.length / 2) ? 2 : 1}
            />
            {(i === 0 || i === ticks.length - 1 || i === Math.floor(ticks.length / 2)) && (
              <text
                x={tick.outerPoint.x + (i === 0 ? 24 : i === ticks.length - 1 ? 6 :i === 5 ? -6: tick.angle < -90 ? -14 : tick.angle > -90 ? 14 : 0)}
                y={tick.outerPoint.y + (i === 0 ? 5 : i===5? 4: 0)}
                fontSize={size * 0.04}
                fill="#6B7280"
                textAnchor={i === Math.floor(ticks.length / 2) ? 'end' : tick.angle < -90 ? 'end' : tick.angle > -90 ? 'start' : 'middle'}
              >
                {i === 0 ? '0%' : i === ticks.length - 1 ? '100%' : '50%'}
              </text>
            )}
          </React.Fragment>
        ))}
        
        {/* Background track */}
        <path
          d={trackPath}
          fill="none"
          stroke={`url(#${trackGradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Progress arc with animation */}
        <path
          d={progressPath}
          fill="none"
          stroke={`url(#${progressGradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          filter="url(#glow)"
          className={`${styles.kpiArcProgress} ${scoreColorClass}`}
        />
        
        {/* Central circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={innerRadius - strokeWidth * 1.2}
          fill="white"
          className={styles.kpiCentralCircle}
        />
        
        {/* Score text */}
        <text
          x={centerX}
          y={centerY - size * 0.02}
          fontSize={size * 0.16}
          fontWeight="700"
          textAnchor="middle"
          dominantBaseline="central"
          className={`${styles.kpiScoreText} ${scoreColorClass}`}
        >
          {score}%
        </text>
        
        {/* Month text */}
        <text
          x={centerX}
          y={centerY + size * 0.12}
          fontSize={size * 0.06}
          textAnchor="middle"
          dominantBaseline="central"
          className={styles.kpiMonthText}
        >
          {month}
        </text>
      </svg>
    </div>
  );
};

export default KpiDonutGauge;