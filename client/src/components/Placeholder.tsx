/**
 * SVG 占位符组件
 * 替代外部 via.placeholder.com 服务
 */

export function AvatarPlaceholder({ size = 40, className = "" }: { size?: number; className?: string }) {
  const initials = "X";

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200 text-orange-600 font-semibold rounded-full ${className}`}
      style={{ width: size, height: size }}
    >
      <span style={{ fontSize: size * 0.4 }}>
        {initials}
      </span>
    </div>
  );
}

export function ImagePlaceholder({ width = 300, height = 200, className = "" }: { width?: number; height?: number; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 rounded-lg ${className}`}
      style={{ width, height }}
    >
      <svg className="w-1/4 h-1/4 opacity-20" fill="currentColor" viewBox="0 0 24 24">
        <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 10l-2 2m0-2l2 2m0-2l2 2m0-2l2 2" />
      </svg>
      <span className="ml-2 text-sm">暂无图片</span>
    </div>
  );
}

export function SmallAvatarPlaceholder() {
  return <AvatarPlaceholder size={40} />;
}
