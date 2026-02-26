/**
 * Health Experts Page
 * 健康工大人 - 专家介绍和说明
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star } from 'lucide-react';
import { api, getImageUrl } from '@/lib/api';
import { toast } from "sonner";
import { useCachedData } from "@/hooks/useCachedData";
import { AvatarPlaceholder } from "@/components/Placeholder";

interface Expert {
  id: string;
  name: string;
  title: string;
  specialty: string;
  bio: string;
  avatar: string;
  rating: number;
  consultations: number;
  expertise: string[];
  introduction: string;
  experience: string;
}

export function HealthWorkersPage() {
  const [, navigate] = useLocation();
  const [experts, setExperts] = useState<Expert[]>([]);
  const [filteredExperts, setFilteredExperts] = useState<Expert[]>([]);
  const [categories, setCategories] = useState<string[]>(['全部']);
  const [selectedSpecialty, setSelectedSpecialty] = useState('全部');
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);

  // 使用 useCallback 包装 fetch 函数避免无限循环
  const fetchExperts = useCallback(async () => {
    const res = await api.get('/experts');
    return res.data;
  }, []);

  const fetchCategories = useCallback(async () => {
    const res = await api.get('/categories?type=expert');
    return res.data;
  }, []);

  // 使用缓存 hook
  const { data: expertsRaw = [], loading: expertsLoading } = useCachedData<any[]>(
    'healthworkers_experts',
    fetchExperts
  );

  const { data: categoriesRaw = [] } = useCachedData<any[]>(
    'healthworkers_categories',
    fetchCategories
  );

  // 当数据变化时更新状态
  useEffect(() => {
    const loadedExperts = (expertsRaw || []).map((item: any) => ({
      id: String(item.id),
      name: item.name,
      title: item.title,
      specialty: item.category?.name || '其他',
      bio: item.unit || '',
      avatar: getImageUrl(item.avatar) || '',
      rating: item.score || 5.0,
      consultations: Math.floor(Math.random() * 1000) + 100,
      expertise: item.achievements ? [item.achievements] : [],
      introduction: item.introduction,
      experience: `${item.unit || ''} | ${item.achievements || ''}`
    }));

    setExperts(loadedExperts);
    setFilteredExperts(loadedExperts);

    const categoryNames = ['全部', ...(categoriesRaw || []).map((c: any) => c.name)];
    setCategories(categoryNames);
  }, [expertsRaw, categoriesRaw]);

  const handleSpecialtyChange = (specialty: string) => {
    setSelectedSpecialty(specialty);
    if (specialty === '全部') {
      setFilteredExperts(experts);
    } else {
      setFilteredExperts(experts.filter(expert => expert.specialty === specialty));
    }
  };

  const stripHtml = (html: string) => {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, '');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header onNavigate={(path) => navigate(path)} />

      {/* Hero Section */}
      <section className="relative py-12 md:py-16 bg-gradient-to-r from-orange-500 to-amber-600 overflow-hidden">
        {/* ... (Hero content same as before) ... */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />
        </div>

        <div className="container relative z-10">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/90 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            返回首页
          </button>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">健康工大人</h1>
          <p className="text-orange-50 max-w-2xl text-lg opacity-90">
            汇聚专业的健康专家团队，为工大学生提供全方位的健康指导
          </p>
        </div>
      </section>

      {/* Specialty Filter */}
      <section className="py-6 sticky top-16 z-40 bg-slate-50/95 backdrop-blur-sm">
        <div className="container">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((specialty) => (
              <button
                key={specialty}
                onClick={() => handleSpecialtyChange(specialty)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${selectedSpecialty === specialty
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
              >
                {specialty}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Experts List */}
      <section className="pb-20 flex-1">
        <div className="container max-w-5xl">
          <div className="flex flex-col gap-4">
            {filteredExperts.map((expert) => (
              <div
                key={expert.id}
                onClick={() => setSelectedExpert(expert)}
                className="group relative bg-white rounded-xl border border-slate-200 p-6 flex flex-col sm:flex-row gap-6 cursor-pointer hover:border-blue-500/30 hover:shadow-md transition-all duration-300"
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 border border-slate-100 group-hover:scale-105 transition-transform duration-300">
                    {getImageUrl(expert.avatar) ? (
                      <img
                        src={getImageUrl(expert.avatar)}
                        alt={expert.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <AvatarPlaceholder size={96} />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                    <h3 className="text-xl font-bold text-slate-900">{expert.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                      {expert.title}
                    </span>
                    <span className="text-slate-400 text-sm">|</span>
                    <span className="text-blue-600 text-sm font-medium">{expert.specialty}</span>
                  </div>

                  <p className="text-sm text-slate-500 mb-3 line-clamp-1">
                    {expert.experience}
                  </p>

                  <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-2">
                    {stripHtml(expert.introduction)}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {expert.expertise.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-1 text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action CTA or Stats */}
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 sm:border-l sm:border-slate-100 sm:pl-6 min-w-[120px]">
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-semibold text-slate-700">{expert.rating}</span>
                  </div>

                  <div className="text-sm text-slate-400 flex items-center gap-1">
                    查看详情
                    <ArrowLeft className="w-3 h-3 rotate-180" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Expert Detail Modal */}
      {selectedExpert && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="relative">
              <button
                onClick={() => setSelectedExpert(null)}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-slate-100 text-slate-500 rounded-full transition-colors z-10"
              >
                ✕
              </button>

              <div className="p-8 pb-0 flex flex-col md:flex-row gap-6">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-slate-50 overflow-hidden">
                  {getImageUrl(selectedExpert.avatar) ? (
                    <img
                      src={getImageUrl(selectedExpert.avatar)}
                      alt={selectedExpert.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <AvatarPlaceholder size={128} />
                  )}
                </div>
                <div className="pt-2">
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">{selectedExpert.name}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-slate-600 mb-4">
                    <span className="font-medium text-slate-900">{selectedExpert.title}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>{selectedExpert.specialty}</span>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed max-w-xl">
                    {selectedExpert.experience}
                  </p>
                </div>
              </div>

              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">{selectedExpert.rating}</div>
                    <div className="text-xs text-slate-500 mt-1">综合评分</div>
                  </div>
                  <div className="text-center border-l border-slate-200">
                    <div className="text-2xl font-bold text-slate-900">{selectedExpert.consultations}</div>
                    <div className="text-xs text-slate-500 mt-1">咨询人次</div>
                  </div>
                  <div className="col-span-2 md:col-span-2 flex items-center justify-end px-4">
                    <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white">
                      预约咨询
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">关于专家</h3>
                  <div className="prose prose-sm max-w-none text-slate-600 leading-7" dangerouslySetInnerHTML={{ __html: selectedExpert.introduction }} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">擅长领域</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedExpert.expertise.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
