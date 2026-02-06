/**
 * OrganicDivider Component
 * 创建有机曲线分割线，增强页面流动感
 * Design Philosophy: 有机流动 - 避免生硬的直线，使用曲线创造自然感
 */

interface OrganicDividerProps {
  variant?: 'wave' | 'curve' | 'swoosh';
  className?: string;
  color?: string;
}

export function OrganicDivider({
  variant = 'wave',
  className = '',
  color = 'currentColor'
}: OrganicDividerProps) {
  const baseClasses = `w-full h-24 ${className}`;

  if (variant === 'wave') {
    return (
      <svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className={baseClasses}
      >
        <path
          d="M0,50 Q300,0 600,50 T1200,50 L1200,120 L0,120 Z"
          fill={color}
          opacity="0.1"
        />
        <path
          d="M0,60 Q300,20 600,60 T1200,60 L1200,120 L0,120 Z"
          fill={color}
          opacity="0.05"
        />
      </svg>
    );
  }

  if (variant === 'curve') {
    return (
      <svg
        viewBox="0 0 1200 100"
        preserveAspectRatio="none"
        className={baseClasses}
      >
        <path
          d="M0,0 Q600,50 1200,0 L1200,100 L0,100 Z"
          fill={color}
          opacity="0.08"
        />
      </svg>
    );
  }

  // swoosh variant
  return (
    <svg
      viewBox="0 0 1200 120"
      preserveAspectRatio="none"
      className={baseClasses}
    >
      <path
        d="M0,80 Q300,40 600,50 T1200,30 L1200,120 L0,120 Z"
        fill={color}
        opacity="0.1"
      />
    </svg>
  );
}

/**
 * 简化版分割线 - 用于轻量级分隔
 */
export function SimpleDivider({
  className = 'my-8'
}: {
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent" />
    </div>
  );
}
