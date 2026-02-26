/**
 * CategoryList Page
 * 显示特定分类的所有文章
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ArticleCard } from '@/components/ArticleCard';
import { SimpleDivider } from '@/components/OrganicDivider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search } from 'lucide-react';
import { api, getImageUrl } from '@/lib/api';
import { Article } from '@/lib/mockData';
import { useCachedData } from "@/hooks/useCachedData";
import { ImagePlaceholder } from "@/components/Placeholder";

interface CategoryListProps {
  category: 'frontiers' | 'lectures' | 'science';
}

const categoryConfig = {
  frontiers: {
    name: '健康前沿',
    description: '最新的健康研究和科学发现',
    color: 'from-orange-600 to-red-600'
  },
  lectures: {
    name: '健康讲堂',
    description: '专业讲座和健康教育',
    color: 'from-blue-600 to-purple-600'
  },
  science: {
    name: '健康科普',
    description: '健康知识科普和生活建议',
    color: 'from-green-600 to-teal-600'
  }
};

export function CategoryListPage({ category }: CategoryListProps) {
  const [, navigate] = useLocation();
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const config = categoryConfig[category];

  // 使用 useCallback 包装 fetch 函数避免无限循环
  const fetchNews = useCallback(async () => {
    const response = await api.get('/news');
    return response.data;
  }, []);

  // 使用缓存 hook 获取新闻数据
  const { data: newsData = [], loading } = useCachedData<any[]>(
    `category_${category}`,
    fetchNews
  );

  // 当新闻数据变化时更新文章列表
  useEffect(() => {
    // Filter based on category loosely
    const filtered = newsData.filter((n: any) => {
      const catName = n.category?.name || "";
      if (category === "frontiers") return catName.includes("前沿") || catName === "frontiers";
      if (category === "lectures") return catName.includes("讲座") || catName.includes("讲堂") || catName === "lectures";
      if (category === "science") return catName.includes("科普") || catName === "science";
      return false;
    });

    const mappedArticles = filtered.map((n: any) => ({
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
    }));

    setArticles(mappedArticles);
    setFilteredArticles(mappedArticles);
  }, [newsData, category]);

  // 搜索过滤
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredArticles(articles);
    } else {
      const filtered = articles.filter(
        article =>
          article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredArticles(filtered);
    }
  }, [searchTerm, articles]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onNavigate={(path) => navigate(path)} />

      {/* Hero Section */}
      <section className={`relative py-12 md:py-20 text-white bg-gradient-to-r ${config.color} overflow-hidden`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-white rounded-full blur-3xl" />
        </div>

        <div className="container relative z-10">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </button>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">{config.name}</h1>
          <p className="text-lg text-white/90 max-w-2xl">{config.description}</p>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-8 bg-white border-b border-border">
        <div className="container">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="搜索文章..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setSearchTerm('')}
              className="hidden sm:inline-flex"
            >
              清除
            </Button>
          </div>
          <p className="text-sm text-slate-600 mt-3">
            找到 <span className="font-semibold text-slate-900">{filteredArticles.length}</span> 篇文章
          </p>
        </div>
      </section>

      <SimpleDivider className="my-0" />

      {/* Articles Grid */}
      <section className="py-12 bg-white flex-1">
        <div className="container">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-600">加载中...</p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600 mb-4">未找到匹配的文章</p>
              <Button
                onClick={() => setSearchTerm('')}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                清除搜索条件
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onClick={(article) => navigate(`/article/${article.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

// Export pages for each category
export function HealthFrontiers() {
  return <CategoryListPage category="frontiers" />;
}

export function HealthLectures() {
  return <CategoryListPage category="lectures" />;
}

export function HealthScience() {
  return <CategoryListPage category="science" />;
}
