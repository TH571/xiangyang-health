/**
 * Home Page
 * 首页 - 包含 Hero、今日浙工大人、文章分类等主要内容
 * Design Philosophy: 现代健康主义 - 温暖、清晰、有机流动
 */

import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { UserCard } from "@/components/UserCard";
import { ArticleCard } from "@/components/ArticleCard";
import ClockDisplay from "@/components/ClockDisplay";
import { OrganicDivider } from "@/components/OrganicDivider";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import { api, getImageUrl, getApiErrorMessage, getImageThumb } from "@/lib/api";
import { OSS_BASE_URL } from "@/lib/config";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCachedData } from "@/hooks/useCachedData";
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

// Daily Tip interface
interface DailyTip {
  content: string;
  source?: string;
  date?: string;
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
  const [dailyTip, setDailyTip] = useState<DailyTip | null>(null);
  const [refreshingTip, setRefreshingTip] = useState(false);

  // 点击"每日一条科普知识"板块时，随机刷新一条健康贴士
  const handleTipRefresh = useCallback(async () => {
    if (refreshingTip) return;
    setRefreshingTip(true);
    try {
      const res = await api.get("/daily-tip/random", {
        params: dailyTip?.content ? { exclude: dailyTip.content } : {},
      });
      setDailyTip({ content: res.data.content, source: res.data.source || "向阳健康" });
    } catch (e) {
      console.error("刷新健康贴士失败:", e);
    } finally {
      setRefreshingTip(false);
    }
  }, [refreshingTip, dailyTip]);

  // 首页组合请求：一次 API 调用替代 3 次（news + experts + daily-tip）
  const fetchHome = useCallback(async () => {
    const res = await api.get('/home');
    return res.data;
  }, []);

  const { data: homeData, loading: homeLoading, error: homeError } = useCachedData<any>(
    'home_data',
    fetchHome
  );

  // 当数据变化时更新状态
  useEffect(() => {
    if (!homeData) return;

    const { news: newsData = [], experts: expertsData = [], dailyTip: tipData } = homeData;

    // Map Experts to Users
    const mappedUsers = (expertsData || []).map((e: any) => ({
      id: String(e.id),
      name: e.name,
      title: e.title,
      avatar: getImageThumb(e.avatar, 200) || '',
      description: e.achievements || e.introduction?.substring(0, 50) || "专业健康专家",
      quote: "守护每一位浙工大人的健康"
    }));
    setUsers(mappedUsers);

    // Map News to Articles
    const categoryIdMap: Record<number, ArticleCategory> = { 1: "science", 2: "frontiers", 3: "lectures" };
    const mappedArticles = (newsData || []).map((n: any) => ({
      id: String(n.id),
      title: n.title,
      category: (categoryIdMap[n.categoryId] || "science") as ArticleCategory,
      image: getImageUrl(n.cover) || '',
      date: n.date,
      excerpt: n.title,
      content: '',
      author: '',
      authorAvatar: '',
      publishDate: n.date
    }));
    setArticles(mappedArticles);

    // Daily tip
    if (tipData) {
      setDailyTip({ content: tipData.content, source: tipData.source || "向阳健康" });
    }
  }, [homeData]);

  useEffect(() => { setLoading(homeLoading); setError(homeError ? getApiErrorMessage(homeError) : null); }, [homeLoading, homeError]);

  // 骨架屏最小显示时间控制
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setShowSkeleton(false), 800);
      return () => clearTimeout(timer);
    } else {
      setShowSkeleton(true);
    }
  }, [loading]);

  // 首页加载完成后，预加载其他板块页面 chunk（加速后续路由切换）
  useEffect(() => {
    if (!loading && !showSkeleton) {
      import("./CategoryList");
      import("./ArticleDetail");
      import("./HealthWorkers");
      import("./Selection");
      import("./About");
    }
  }, [loading, showSkeleton]);

  // Filter logic - adapted to be more flexible or use specific category IDs/names if I knew them.
  // I'll just take slices for now to ensure display if categories don't match exact english keys.
  // Ideally backend should return category "type" or "slug".
  // I'll assume standard categories for now or just display.
  // Actually, I can filter by Chinese names if seeded that way.
  // "前沿研究" -> frontiers? "专业讲座" -> lectures? "科普知识" -> science?
  // I'll try to match Chinese names or fallback.

  // Filter logic - 按分类筛选，空分类显示空
  const frontierArticles = articles.filter(a => a.category === "frontiers").slice(0, 3);
  const lectureArticles = articles.filter(a => a.category === "lectures").slice(0, 3);
  const scienceArticles = articles.filter(a => a.category === "science").slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onNavigate={path => navigate(path)} />

      {/* Hero Section */}
      <section
        className="relative py-12 md:py-24 overflow-hidden bg-gradient-to-br from-orange-50 via-white to-amber-50 bg-scroll md:bg-fixed"
        style={{
          backgroundImage: `url(${OSS_BASE_URL}/images/hero-bg.webp?x-oss-process=image/resize,w_1400,quality_75)`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
        }}
      >
        {/* Decorative Background Elements */}
        <div className="absolute top-20 right-0 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl" />

        <div className="container relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6 animate-fade-in">
              {/* Logo Icon */}
              <div className="inline-block relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
                <img
                  src="/images/sunflower-icon-white.png"
                  alt="向阳健康"
                  className="relative w-20 h-20 md:w-24 md:h-24 drop-shadow-2xl group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Main Title */}
              <div className="space-y-3">
                <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight tracking-tight">
                  以光为引
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
                    以知为翼
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-slate-700 leading-relaxed">
                  浙工大大健康校友联盟，守护浙工大人在健康之路上温暖前行。域名 www.xyjk.ren 为"向阳健康人"的拼音缩写
                </p>
              </div>

              {/* Subtitle */}
              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-semibold text-orange-600">
                  向阳健康知库
                </h2>
                <p className="text-base md:text-lg text-slate-600 leading-relaxed">
                  每日一条科普知识，让健康成为习惯
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  size="lg"
                  onClick={() => navigate("/science")}
                  className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  开始探索
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/about")}
                  className="border-2 border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400 font-semibold transition-all duration-300"
                >
                  了解更多
                </Button>
              </div>
            </div>

            {/* Right Illustration */}
            <div
              className="hidden md:flex items-end justify-center animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="relative w-72 h-72 lg:w-80 lg:h-80">
                {/* Animated Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-orange-300 to-amber-300 rounded-full opacity-20 blur-3xl animate-pulse" />
                <div className="absolute inset-4 bg-gradient-to-br from-orange-200/30 to-amber-200/30 rounded-full blur-2xl" />
                <img
                  src={getImageThumb(`${OSS_BASE_URL}/images/health-illustration.jpg`, 500)}
                  alt="健康插画"
                  loading="lazy"
                  decoding="async"
                  className="relative w-full h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                />
                <ClockDisplay />
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
          <div
            className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-center cursor-pointer select-none group"
            onClick={handleTipRefresh}
            role="button"
            aria-label="点击刷新一条健康贴士"
            title="点击换一条科普知识"
          >
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <Sparkles
                className={`w-6 h-6 md:w-8 md:h-8 transition-transform ${refreshingTip ? "animate-spin" : "group-hover:rotate-180"}`}
              />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg md:text-xl font-semibold tracking-wide">
                每日一条科普知识
                <span className="ml-2 text-xs font-normal text-orange-100/80 align-middle">
                  {refreshingTip ? "换一条中..." : "点击换一条"}
                </span>
              </h3>
              <p className="text-orange-100 text-base md:text-lg max-w-2xl">
                {dailyTip ? dailyTip.content : "加载中..."}
              </p>
              {dailyTip?.source && (
                <p className="text-orange-200 text-sm">
                  —— {dailyTip.source}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Today's Workers Section */}
      <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              浙工大健康人
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              汇聚专业的健康专家团队 个人，为浙工大人提供全方位的健康指导
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
              onClick={() => navigate("/workers")}
              className="border-2 border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white hover:shadow-lg hover:shadow-orange-400/25 font-semibold px-8 transition-all duration-300"
            >
              查看更多健康人
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
              健康NEWS
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
              查看全部健康NEWS
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

      <Footer />
    </div>
  );
}
