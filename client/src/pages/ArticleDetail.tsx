/**
 * ArticleDetail Page
 * 显示单篇文章的完整内容
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SimpleDivider } from '@/components/OrganicDivider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2, Heart } from 'lucide-react';
import { api, getImageUrl } from '@/lib/api';
import { ImagePlaceholder } from '@/components/Placeholder';

interface News {
  id: number;
  title: string;
  author: string;
  authorTitle?: string;
  authorAvatar?: string;
  cover: string;
  content: string;
  date: string;
  category: { name: string; type?: string };
}

interface AdminInfo {
  username: string;
  nickname: string | null;
  avatar: string | null;
  title: string | null;
}

interface ArticleDetailProps {
  id: string;
}

export function ArticleDetailPage({ id }: ArticleDetailProps) {
  const [, navigate] = useLocation();
  const [article, setArticle] = useState<News | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<News[]>([]);
  const [authorInfo, setAuthorInfo] = useState<AdminInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const loadArticle = async () => {
      try {
        const res = await api.get(`/news/${id}`);
        setArticle(res.data);

        // Fetch author's current info from admin table (by username)
        // Note: author field now stores username, but old data might have nickname
        if (res.data.author) {
          try {
            // Try by username first (new data format)
            let adminRes = await api.get(`/admins/by-username/${encodeURIComponent(res.data.author)}`);
            if (!adminRes.data.username) {
              // Fallback: try by-name for old data (nickname stored)
              adminRes = await api.get(`/admins/by-name/${encodeURIComponent(res.data.author)}`);
            }
            setAuthorInfo(adminRes.data);
          } catch {
            // If admin not found, use data from article (may be outdated)
            setAuthorInfo({
              username: res.data.author,
              nickname: res.data.author,
              avatar: res.data.authorAvatar || null,
              title: res.data.authorTitle || null
            });
          }
        }

        // Fetch related articles (same category)
        const allRes = await api.get('/news');
        const related = allRes.data
          .filter((a: News) => a.id !== Number(id) && a.category.name === res.data.category.name)
          .slice(0, 3);
        setRelatedArticles(related);
      } catch (error) {
        console.error('Failed to load article:', error);
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header onNavigate={(path) => navigate(path)} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-600">加载中...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header onNavigate={(path) => navigate(path)} />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-slate-600">文章未找到</p>
          <Button
            onClick={() => navigate('/')}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            返回首页
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onNavigate={(path) => navigate(path)} />

      {/* Article Header */}
      <section className="py-8 bg-white border-b border-border">
        <div className="container max-w-[1200px]">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-orange-600 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-semibold text-orange-600 bg-orange-50 rounded-full">
                {article.category?.name}
              </span>
              <span className="text-sm text-slate-500">
                {new Date(article.date).toLocaleDateString('zh-CN')}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
              {article.title}
            </h1>

            <div className="flex items-center gap-4 pt-4 border-t border-border">
              {getImageUrl(authorInfo?.avatar || null) ? (
                <img src={getImageUrl(authorInfo?.avatar || null)} alt={authorInfo?.nickname || article.author} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-sm font-semibold text-orange-600">
                  {(authorInfo?.nickname || article.author || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-medium text-slate-800">{authorInfo?.nickname || article.author}</p>
                <p className="text-sm text-slate-500">{authorInfo?.title || article.authorTitle || '健康专家'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-12 bg-white">
        <div className="container max-w-[1200px]">
          <div
            className="prose prose-lg max-w-none mb-8 ql-editor text-[18px] [&_p]:mb-[1.75em] [&_p]:indent-[2em]"
            style={{
              lineHeight: '2.0',
            }}
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          <SimpleDivider className="my-8" />

          {/* Article Actions */}
          <div className="flex items-center gap-4 py-6">
            <button
              onClick={() => setLiked(!liked)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${liked
                ? 'bg-red-100 text-red-600'
                : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                }`}
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              {liked ? '已赞' : '赞'}
            </button>

            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-slate-600 hover:bg-gray-200 transition-colors">
              <Share2 className="w-5 h-5" />
              分享
            </button>
          </div>
        </div>
      </section>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="py-12 bg-orange-50">
          <div className="container max-w-[1200px]">
            <h2 className="text-3xl font-bold text-slate-900 mb-8">相关推荐</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((relatedArticle) => (
                <div
                  key={relatedArticle.id}
                  onClick={() => navigate(`/article/${relatedArticle.id}`)}
                  className="group rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                >
                  <div className="relative overflow-hidden h-40 bg-gray-200">
                    {getImageUrl(relatedArticle.cover) ? (
                      <img
                        src={getImageUrl(relatedArticle.cover)}
                        alt={relatedArticle.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <ImagePlaceholder width={400} height={160} />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-800 line-clamp-2 group-hover:text-orange-600 transition-colors">
                      {relatedArticle.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-12 bg-gradient-to-r from-orange-600 to-red-600 text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">想了解更多健康知识？</h2>
          <p className="text-lg text-orange-100 mb-8 max-w-2xl mx-auto">
            加入向阳健康社区，每天获取最新的健康资讯和专业建议
          </p>
          <Button
            size="lg"
            className="bg-white text-orange-600 hover:bg-gray-100 font-semibold"
          >
            立即加入
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

