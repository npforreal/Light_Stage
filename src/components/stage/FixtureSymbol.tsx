import React from 'react';
import { FixtureType } from '../../types/virtualStage';
import { FIXTURE_SYMBOLS } from '../../services/stageSymbols';

export interface FixtureSymbolProps {
  type: FixtureType;
  x: number;
  y: number;
  /** Half-size in SVG units. */
  size?: number;
  isLit: boolean;
  color: string;
  /** Extra ring for Follow spots (kept for compatibility with the old look). */
  showFollowRing?: boolean;
}

/**
 * USITT-lite fixture symbol. Shape identifies the fixture type without relying on
 * colour; fill switches to the active cue colour when the fixture is lit.
 */
export const FixtureSymbol: React.FC<FixtureSymbolProps> = ({
  type,
  x,
  y,
  size = 5,
  isLit,
  color,
  showFollowRing = true,
}) => {
  const fill = isLit ? color : '#1e293b';
  const stroke = isLit ? '#ffffff' : '#475569';
  const shape = FIXTURE_SYMBOLS[type]?.shape ?? 'circle';
  const common = { fill, stroke, strokeWidth: 1.5 };

  const body = (() => {
    switch (shape) {
      case 'square':
        return <rect x={x - size} y={y - size} width={size * 2} height={size * 2} rx={1} {...common} />;
      case 'diamond':
        return (
          <polygon
            points={`${x},${y - size * 1.2} ${x + size * 1.2},${y} ${x},${y + size * 1.2} ${x - size * 1.2},${y}`}
            {...common}
          />
        );
      case 'triangle':
        return (
          <polygon
            points={`${x},${y - size * 1.3} ${x + size * 1.15},${y + size} ${x - size * 1.15},${y + size}`}
            {...common}
          />
        );
      case 'hex': {
        const points = Array.from({ length: 6 }, (_, index) => {
          const angle = (Math.PI / 3) * index - Math.PI / 6;
          return `${x + Math.cos(angle) * size * 1.15},${y + Math.sin(angle) * size * 1.15}`;
        }).join(' ');
        return <polygon points={points} {...common} />;
      }
      case 'cross':
        return (
          <g stroke={stroke} strokeWidth={1.5} strokeLinecap="round">
            <line x1={x - size} y1={y} x2={x + size} y2={y} />
            <line x1={x} y1={y - size} x2={x} y2={y + size} />
            <circle cx={x} cy={y} r={1.4} fill={fill} />
          </g>
        );
      case 'chevron':
        return (
          <polygon
            points={`${x - size},${y - size} ${x + size * 0.6},${y} ${x - size},${y + size} ${x - size * 0.3},${y}`}
            {...common}
          />
        );
      case 'ring':
        return (
          <g>
            <circle cx={x} cy={y} r={size} fill="none" stroke={stroke} strokeWidth={1.5} />
            <circle cx={x} cy={y} r={size * 0.4} fill={fill} />
          </g>
        );
      case 'circle-dot':
        return (
          <g>
            <circle cx={x} cy={y} r={size} {...common} />
            <circle cx={x} cy={y} r={size * 0.35} fill="#ffffff" opacity={isLit ? 0.95 : 0.25} />
          </g>
        );
      case 'smoke':
        return (
          <g>
            <rect x={x - size} y={y - size * 0.8} width={size * 2} height={size * 1.6} rx={2} {...common} />
            <path
              d={`M ${x - size * 0.6} ${y} q ${size * 0.3} -${size * 0.5} ${size * 0.6} 0 q ${size * 0.3} ${size * 0.5} ${size * 0.6} 0`}
              fill="none"
              stroke={isLit ? '#ffffff' : '#94a3b8'}
              strokeWidth={1}
            />
          </g>
        );
      case 'circle':
      default:
        return <circle cx={x} cy={y} r={size} {...common} />;
    }
  })();

  return (
    <g>
      {body}
      {showFollowRing && type === 'Follow' && (
        <circle
          cx={x}
          cy={y}
          r={size + 3}
          fill="none"
          stroke={isLit ? color : '#64748b'}
          strokeWidth={1}
          strokeDasharray="2 2"
        />
      )}
    </g>
  );
};
