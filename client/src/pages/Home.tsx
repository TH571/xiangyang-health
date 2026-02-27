/**
 * Home Page
 * 首页 - 包含 Hero、今日工大人、文章分类等主要内容
 * Design Philosophy: 现代健康主义 - 温暖、清晰、有机流动
 */

import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { UserCard } from "@/components/UserCard";
import { ArticleCard } from "@/components/ArticleCard";
import { OrganicDivider, SimpleDivider } from "@/components/OrganicDivider";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import { api, getImageUrl, getApiErrorMessage } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCachedData } from "@/hooks/useCachedData";
import { AvatarPlaceholder, ImagePlaceholder } from "@/components/Placeholder";
import { UsersSectionSkeleton, ArticlesSectionSkeleton } from "@/components/Skeletons";

// Interfaces based on usage
interface User {
  id: string;
  name: string;
  title: string;
  avatar: string;
  description: string;
  quote: string;
}

// Define valid categories matches ArticleCard expectation
type ArticleCategory = "frontiers" | "lectures" | "science";

interface Article {
  id: string;
  title: string;
  category: ArticleCategory;
  image: string;
  date: string;
  excerpt: string;
  content: string;
  author: string;
  publishDate: string;
}

export default function Home() {
  const [, navigate] = useLocation();
  const [users, setUsers] = useState<User[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 使用 useCallback 包装 fetch 函数避免无限循环
  const fetchExperts = useCallback(async () => {
    const res = await api.get('/experts');
    return res.data;
  }, []);

  const fetchNews = useCallback(async () => {
    const res = await api.get('/news');
    return res.data;
  }, []);

  // 分别缓存专家和新闻数据
  const { data: expertsData = [], loading: expertsLoading } = useCachedData<any[]>(
    'home_experts',
    fetchExperts
  );

  const { data: newsData = [], loading: newsLoading, error: newsError } = useCachedData<any[]>(
    'home_news',
    fetchNews
  );

  // 当数据变化时更新状态
  useEffect(() => {
    // Map Experts to Users - 添加空值检查
    const mappedUsers = (expertsData || []).slice(0, 4).map((e: any) => ({
      id: String(e.id),
      name: e.name,
      title: e.title,
      avatar: getImageUrl(e.avatar) || '',
      description: e.achievements || e.introduction?.substring(0, 50) || "专业健康专家",
      quote: "守护每一位工大人的健康"
    }));
    setUsers(mappedUsers);

    // Map News to Articles - 添加空值检查
    const mappedArticles = (newsData || []).map((n: any) => {
      let category: ArticleCategory = "science"; // default
      const catName = n.category?.name || "";
      if (catName.includes("前沿") || catName === "frontiers") category = "frontiers";
      else if (catName.includes("讲座") || catName.includes("讲堂") || catName === "lectures") category = "lectures";
      else if (catName.includes("科普") || catName === "science") category = "science";

      return {
        id: String(n.id),
        title: n.title,
        category: category,
        image: getImageUrl(n.cover) || '',
        date: n.date,
        excerpt: n.content?.replace(/<[^>]+>/g, '').substring(0, 100) + "...",
        content: n.content,
        author: n.author,
        authorAvatar: getImageUrl(n.authorAvatar),
        publishDate: n.date
      };
    });
    setArticles(mappedArticles);

    // 更新加载和错误状态
    setLoading(expertsLoading || newsLoading);
    setError(newsError ? getApiErrorMessage(newsError) : null);
  }, [expertsData, newsData, expertsLoading, newsLoading, newsError]);

  // 骨架屏最小显示时间控制
  useEffect(() => {
    if (!loading) {
      // 延迟关闭骨架屏，确保至少显示 800ms
      const timer = setTimeout(() => {
        setShowSkeleton(false);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setShowSkeleton(true);
    }
  }, [loading]);

  // Filter logic - adapted to be more flexible or use specific category IDs/names if I knew them.
  // I'll just take slices for now to ensure display if categories don't match exact english keys.
  // Ideally backend should return category "type" or "slug".
  // I'll assume standard categories for now or just display.
  // Actually, I can filter by Chinese names if seeded that way.
  // "前沿研究" -> frontiers? "专业讲座" -> lectures? "科普知识" -> science?
  // I'll try to match Chinese names or fallback.

  // Filter logic with fallbacks
  const frontierArticlesList = articles.filter(a => a.category === "frontiers").slice(0, 3);
  const frontierArticles = frontierArticlesList.length > 0 ? frontierArticlesList : articles.slice(0, 3);

  const lectureArticlesList = articles.filter(a => a.category === "lectures").slice(0, 3);
  const lectureArticles = lectureArticlesList.length > 0 ? lectureArticlesList : articles.slice(3, 6);

  const scienceArticlesList = articles.filter(a => a.category === "science").slice(0, 3);
  const scienceArticles = scienceArticlesList.length > 0 ? scienceArticlesList : articles.slice(6, 9);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onNavigate={path => navigate(path)} />

      {/* Hero Section */}
      <section
        className="relative py-20 md:py-40 overflow-hidden bg-gradient-to-br from-orange-50 via-white to-amber-50"
        style={{
          backgroundImage: "url(/images/hero-bg.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundAttachment: "fixed",
        }}
      >
        {/* Decorative Background Elements */}
        <div className="absolute top-20 right-0 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl" />

        <div className="container relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8 animate-fade-in">
              {/* Logo Icon */}
              <div className="inline-block relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
                <img
                  src="/images/sunflower-icon.png"
                  alt="向阳健康"
                  className="relative w-24 h-24 drop-shadow-2xl group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Main Title */}
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold text-slate-900 leading-tight tracking-tight">
                  以光为引
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
                    以知为翼
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-slate-700 leading-relaxed">
                  守护工大人在健康之路上温暖前行
                </p>
              </div>

              {/* Subtitle */}
              <div className="space-y-3">
                <h2 className="text-2xl md:text-3xl font-semibold text-orange-600">
                  向阳健康知库
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  每日一条科普知识，让健康成为习惯
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 pt-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  开始探索
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400 font-semibold transition-all duration-300"
                >
                  了解更多
                </Button>
              </div>
            </div>

            {/* Right Illustration */}
            <div
              className="hidden md:flex items-center justify-center animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="relative w-80 h-80 lg:w-96 lg:h-96">
                {/* Animated Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-orange-300 to-amber-300 rounded-full opacity-20 blur-3xl animate-pulse" />
                <div className="absolute inset-4 bg-gradient-to-br from-orange-200/30 to-amber-200/30 rounded-full blur-2xl" />
                <img
                  src="/images/health-illustration.jpg"
                  alt="健康插画"
                  className="relative w-full h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <OrganicDivider variant="wave" color="#FF8C42" className="mt-16" />
      </section>

      {/* Daily Knowledge Section */}
      <section className="relative py-14 bg-gradient-to-r from-orange-600 via-orange-700 to-red-600 text-white overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 25% 50%, white 2%, transparent 2.5%)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="container relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-center">
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <Sparkles className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg md:text-xl font-semibold tracking-wide">
                每日一条科普知识
              </h3>
              <p className="text-orange-100 text-base md:text-lg">
                1 + 1 = 2！
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Today's Workers Section */}
      <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              今日工大人
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              每天都有新的健康故事，来自我们的工大人社区
            </p>
          </div>

          {showSkeleton ? (
            <UsersSectionSkeleton />
          ) : error ? (
            <div className="text-center py-12 px-4">
              <Alert className="max-w-md mx-auto bg-slate-800/50 border-slate-700">
                <AlertCircle className="h-5 w-5 text-orange-400" />
                <AlertDescription className="text-gray-300">
                  {error}
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="mt-6 border-2 border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white"
              >
                重新加载
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {users.map(user => (
                <div
                  key={user.id}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 hover:bg-slate-700/50 hover:shadow-2xl hover:shadow-orange-900/20 transition-all duration-300 hover:-translate-y-1"
                >
                  <UserCard user={user} />
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button
              variant="outline"
              className="border-2 border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white hover:shadow-lg hover:shadow-orange-400/25 font-semibold px-8 transition-all duration-300"
            >
              查看更多工大人
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* Article Sections */}
      {/* Health Frontiers */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="mb-12">
            <div className="inline-block px-4 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold mb-4">
              前沿研究
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              健康前沿
            </h2>
            <p className="text-slate-600 max-w-2xl text-lg leading-relaxed">
              最新的健康研究和科学发现，帮助您了解最前沿的健康知识
            </p>
          </div>

          {showSkeleton ? (
            <ArticlesSectionSkeleton />
          ) : error ? (
            <div className="text-center py-12 px-4">
              <Alert className="max-w-md mx-auto bg-orange-50 border-orange-200">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <AlertDescription className="text-slate-700">
                  {error}
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => window.location.reload()}
                className="mt-6 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold shadow-lg"
              >
                重新加载
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {frontierArticles.map(article => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onClick={() => navigate(`/article/${article.id}`)}
                />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button
              onClick={() => navigate("/frontiers")}
              className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              查看全部健康前沿
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </div>
        </div>
      </section>

      {/* Health Lectures */}
      <section className="py-20 bg-gradient-to-b from-orange-50 to-white">
        <div className="container">
          <div className="mb-12">
            <div className="inline-block px-4 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold mb-4">
              专业讲座
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              健康讲堂
            </h2>
            <p className="text-slate-600 max-w-2xl text-lg leading-relaxed">
              专业讲座和健康教育，由专家为您解答健康疑惑
            </p>
          </div>

          {showSkeleton ? (
            <ArticlesSectionSkeleton />
          ) : error ? (
            <div className="text-center py-12 px-4">
              <Alert className="max-w-md mx-auto bg-orange-50 border-orange-200">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <AlertDescription className="text-slate-700">
                  {error}
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => window.location.reload()}
                className="mt-6 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold shadow-lg"
              >
                重新加载
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {lectureArticles.map(article => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onClick={() => navigate(`/article/${article.id}`)}
                />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button
              onClick={() => navigate("/lectures")}
              className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              查看全部讲座
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </div>
        </div>

        <OrganicDivider variant="swoosh" color="#2C3E50" className="mt-16" />
      </section>

      {/* Health Science */}
      <section className="pt-0 pb-20 bg-white">
        <div className="container">
          <div className="mb-12">
            <div className="inline-block px-4 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold mb-4">
              科普知识
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              健康科普
            </h2>
            <p className="text-slate-600 max-w-2xl text-lg leading-relaxed">
              健康知识科普和生活建议，让您成为自己健康的主人
            </p>
          </div>

          {showSkeleton ? (
            <ArticlesSectionSkeleton />
          ) : error ? (
            <div className="text-center py-12 px-4">
              <Alert className="max-w-md mx-auto bg-orange-50 border-orange-200">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <AlertDescription className="text-slate-700">
                  {error}
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => window.location.reload()}
                className="mt-6 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold shadow-lg"
              >
                重新加载
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {scienceArticles.map(article => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onClick={() => navigate(`/article/${article.id}`)}
                />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button
              onClick={() => navigate("/science")}
              className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              查看全部科普
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 bg-gradient-to-br from-orange-600 via-orange-700 to-red-600 text-white overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl" />

        <div className="container relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            准备开始您的健康之旅？
          </h2>
          <p className="text-xl md:text-2xl text-orange-100 mb-10 max-w-3xl mx-auto leading-relaxed">
            加入向阳健康社区，获取每日健康知识和专业建议
          </p>
          <Button
            size="lg"
            className="bg-white text-orange-600 hover:bg-gray-50 font-semibold px-8 py-6 text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
          >
            立即加入
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
