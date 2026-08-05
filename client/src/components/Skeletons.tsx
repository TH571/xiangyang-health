/**
 * Skeleton Components for Home Page
 * 首页骨架屏组件
 */

import { Skeleton } from "@/components/ui/skeleton";

/**
 * 浙工大人卡片骨架屏
 */
export function UserCardSkeleton() {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-800/30">
      {/* Avatar Skeleton */}
      <div className="relative mb-5">
        <Skeleton className="w-24 h-24 rounded-full bg-slate-700" />
      </div>

      {/* Name Skeleton */}
      <Skeleton className="h-6 w-24 mb-3 bg-slate-700" />

      {/* Quote Skeleton */}
      <Skeleton className="h-4 w-full max-w-[180px] bg-slate-700" />
    </div>
  );
}

/**
 * 浙工大人区块骨架屏（4个卡片）
 */
export function UsersSectionSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
      {[...Array(4)].map((_, i) => (
        <UserCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * 文章卡片骨架屏
 */
export function ArticleCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white shadow-md border border-gray-100 h-full flex flex-col">
      {/* Image Skeleton */}
      <div className="relative overflow-hidden h-56 bg-gray-200">
        <Skeleton className="w-full h-full bg-gray-300" />
        {/* Category Badge Skeleton */}
        <div className="absolute top-4 left-4">
          <Skeleton className="w-20 h-6 rounded-lg bg-white/80" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 flex flex-col">
        {/* Title Skeleton */}
        <Skeleton className="h-6 w-full mb-3 bg-gray-300" />
        <Skeleton className="h-6 w-2/3 mb-6 bg-gray-300" />

        {/* Excerpt Skeleton */}
        <div className="flex-1 space-y-2 mb-6">
          <Skeleton className="h-4 w-full bg-gray-200" />
          <Skeleton className="h-4 w-full bg-gray-200" />
          <Skeleton className="h-4 w-3/4 bg-gray-200" />
        </div>

        {/* Footer Skeleton */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full bg-gray-300" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-16 bg-gray-300" />
              <Skeleton className="h-3 w-12 bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 文章区块骨架屏（3个卡片）
 */
export function ArticlesSectionSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {[...Array(3)].map((_, i) => (
        <ArticleCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * 首页完整骨架屏
 * 包含所有需要加载的区块
 */
export function HomePageSkeleton() {
  return (
    <div className="space-y-16">
      {/* 今日浙工大人骨架屏 */}
      <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="container">
          <div className="text-center mb-16">
            <Skeleton className="h-10 w-48 mx-auto mb-4 bg-slate-700" />
            <Skeleton className="h-6 w-96 mx-auto bg-slate-700" />
          </div>
          <UsersSectionSkeleton />
        </div>
      </section>

      {/* 健康NEWS骨架屏 */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="mb-12">
            <Skeleton className="w-20 h-6 rounded-full mb-4 bg-orange-100" />
            <Skeleton className="h-10 w-40 mb-4 bg-gray-200" />
            <Skeleton className="h-6 w-96 bg-gray-200" />
          </div>
          <ArticlesSectionSkeleton />
        </div>
      </section>

      {/* 健康讲堂骨架屏 */}
      <section className="py-20 bg-gradient-to-b from-orange-50 to-white">
        <div className="container">
          <div className="mb-12">
            <Skeleton className="w-20 h-6 rounded-full mb-4 bg-orange-100" />
            <Skeleton className="h-10 w-40 mb-4 bg-gray-200" />
            <Skeleton className="h-6 w-96 bg-gray-200" />
          </div>
          <ArticlesSectionSkeleton />
        </div>
      </section>

      {/* 健康科普骨架屏 */}
      <section className="pt-0 pb-20 bg-white">
        <div className="container">
          <div className="mb-12">
            <Skeleton className="w-20 h-6 rounded-full mb-4 bg-orange-100" />
            <Skeleton className="h-10 w-40 mb-4 bg-gray-200" />
            <Skeleton className="h-6 w-96 bg-gray-200" />
          </div>
          <ArticlesSectionSkeleton />
        </div>
      </section>
    </div>
  );
}
