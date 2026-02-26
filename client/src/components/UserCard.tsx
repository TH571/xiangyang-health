/**
 * UserCard Component
 * 展示用户头像和引言
 * Design Philosophy: 卡片浮动 - 采用浅阴影和微妙的悬停效果
 */

import { User } from "@/lib/mockData";
import { AvatarPlaceholder } from "./Placeholder";

interface UserCardProps {
  user: User;
}

export function UserCard({ user }: UserCardProps) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-2xl hover:shadow-2xl hover:shadow-orange-900/10 transition-all duration-500 hover:-translate-y-2">
      {/* Avatar */}
      <div className="relative mb-5 group">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
        <div className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-orange-200 group-hover:ring-orange-400 ring-offset-2 ring-offset-white shadow-xl transition-all duration-300">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <AvatarPlaceholder size={96} />
          )}
        </div>
      </div>

      {/* Name */}
      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-orange-400 transition-colors duration-300">
        {user.name}
      </h3>

      {/* Quote */}
      <p className="text-base text-slate-600 italic leading-relaxed">
        "{user.quote}"
      </p>
    </div>
  );
}
