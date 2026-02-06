/**
 * ArticleCard Component
 * 展示文章卡片，包含图片、标题、摘要和作者
 * Design Philosophy: 卡片浮动 - 浅阴影和微妙的悬停效果
 */

import { Article } from "@/lib/mockData";
import { ArrowRight } from "lucide-react";

interface ArticleCardProps {
  article: Article;
  onClick?: (article: Article) => void;
}

export function ArticleCard({ article, onClick }: ArticleCardProps) {
  return (
    <div
      onClick={() => onClick?.(article)}
      className="group rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-2xl hover:shadow-orange-900/10 transition-all duration-500 hover:-translate-y-2 cursor-pointer h-full flex flex-col border border-gray-100 hover:border-orange-200"
    >
      {/* Image Container */}
      <div className="relative overflow-hidden h-56 bg-gray-200">
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
        {/* Category Badge on Image */}
        <div className="absolute top-4 left-4">
          <span className="inline-block px-3 py-1.5 text-xs font-bold text-white bg-orange-600/90 backdrop-blur-sm rounded-lg shadow-lg">
            {article.category === "frontiers" && "健康前沿"}
            {article.category === "lectures" && "健康讲堂"}
            {article.category === "science" && "健康科普"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 flex flex-col">
        {/* Category Badge (Mobile) */}
        <div className="mb-3 md:hidden">
          <span className="inline-block px-3 py-1 text-xs font-semibold text-orange-600 bg-orange-50 rounded-full">
            {article.category === "frontiers" && "健康前沿"}
            {article.category === "lectures" && "健康讲堂"}
            {article.category === "science" && "健康科普"}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors duration-300">
          {article.title}
        </h3>

        {/* Excerpt */}
        <p className="text-sm text-slate-600 mb-6 line-clamp-3 leading-relaxed flex-1">
          {article.excerpt}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 group-hover:border-orange-100 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-xs font-bold text-white shadow-md overflow-hidden">
              {article.authorAvatar ? (
                <img src={article.authorAvatar} alt={article.author} className="w-full h-full object-cover" />
              ) : (
                article.author.charAt(0)
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">
                {article.author}
              </span>
              <span className="text-xs text-slate-500">
                {new Date(article.publishDate).toLocaleDateString("zh-CN")}
              </span>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-orange-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
        </div>
      </div>
    </div>
  );
}
