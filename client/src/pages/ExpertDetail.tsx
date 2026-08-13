/**
 * ExpertDetail Page
 * 专家详情 - 独立页面形式（非弹窗）
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ArrowLeft } from 'lucide-react';
import { api, getImageUrl, getImageThumb } from '@/lib/api';
import { AvatarPlaceholder } from '@/components/Placeholder';

interface Expert {
  id: number;
  name: string;
  title: string | null;
  avatar: string | null;
  unit: string | null;
  achievements: string | null;
  introduction: string | null;
  category: { name: string; type?: string } | null;
}

interface ExpertDetailProps {
  id: string;
}

export function ExpertDetailPage({ id }: ExpertDetailProps) {
  const [, navigate] = useLocation();
  const [expert, setExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setExpert(null);
    api
      .get(`/experts/${id}`)
      .then((res) => {
        if (!cancelled) setExpert(res.data);
      })
      .catch(() => {
        // 加载失败（如不存在），保持 null 显示未找到
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('/workers');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header onNavigate={(path) => navigate(path)} />
        <div className="flex-1 flex items-center justify-center py-32">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header onNavigate={(path) => navigate(path)} />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-32 text-center px-4">
          <p className="text-slate-500 text-lg">未找到该健康人信息</p>
          <button
            onClick={handleBack}
            className="text-orange-600 font-medium hover:underline"
          >
            返回
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const specialty = expert.category?.name || '其他';
  const experience = [expert.unit, expert.achievements].filter(Boolean).join(' | ');
  const expertise = expert.achievements ? [expert.achievements] : [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header onNavigate={(path) => navigate(path)} />

      {/* Hero Section */}
      <section className="relative py-12 md:py-16 bg-gradient-to-r from-orange-500 to-amber-600 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />
        </div>

        <div className="container relative z-10">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white/90 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            返回
          </button>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">专家详情</h1>
          <p className="text-orange-50 max-w-2xl text-lg opacity-90">
            汇聚专业的健康专家团队，为浙工大人提供全方位的健康指导
          </p>
        </div>
      </section>

      {/* Detail Content */}
      <section className="py-12 md:py-16 flex-1">
        <div className="container max-w-3xl">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* 头部信息 */}
            <div className="p-8 pb-0 flex flex-col md:flex-row gap-6 items-start">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg bg-slate-50 overflow-hidden flex-shrink-0">
                {getImageUrl(expert.avatar) ? (
                  <img
                    src={getImageThumb(expert.avatar, 400)}
                    alt={expert.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <AvatarPlaceholder size={128} />
                )}
              </div>
              <div className="pt-1">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">{expert.name}</h2>
                <div className="flex flex-wrap items-center gap-3 text-slate-600 mb-4">
                  {expert.title && <span className="font-medium text-slate-900">{expert.title}</span>}
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span>{specialty}</span>
                </div>
                {experience && (
                  <p className="text-slate-500 text-sm leading-relaxed max-w-xl">{experience}</p>
                )}
              </div>
            </div>

            {/* 正文 */}
            <div className="p-8 space-y-8">
              {expert.introduction && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">关于专家</h3>
                  <div
                    className="prose prose-sm max-w-none text-slate-600 leading-7"
                    dangerouslySetInnerHTML={{ __html: expert.introduction }}
                  />
                </div>
              )}

              {expertise.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">擅长领域</h3>
                  <div className="flex flex-wrap gap-2">
                    {expertise.map((skill, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
