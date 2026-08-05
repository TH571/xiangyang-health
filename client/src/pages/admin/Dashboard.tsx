import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { AdminLayout } from "./Layout";
import { api, getImageUrl } from "@/lib/api";
import {
  Newspaper,
  UserRound,
  ShoppingBag,
  Lightbulb,
  ArrowUpRight,
  CalendarDays,
} from "lucide-react";

interface Stats {
  newsCount: number;
  expertCount: number;
  productCount: number;
  tipCount: number;
  recentNews: { id: number; title: string; date: string; category?: { name: string } }[];
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  const fetchStats = useCallback(async () => {
    try {
      const [newsRes, expertRes, productRes, tipRes] = await Promise.all([
        api.get("/news"),
        api.get("/experts"),
        api.get("/products"),
        api.get("/daily-tips"),
      ]);
      const news = newsRes.data || [];
      setStats({
        newsCount: news.length,
        expertCount: (expertRes.data || []).length,
        productCount: (productRes.data || []).length,
        tipCount: (tipRes.data || []).length,
        recentNews: news
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)
          .map((n: any) => ({
            id: n.id,
            title: n.title,
            date: n.date,
            category: n.category,
          })),
      });
    } catch (e) {
      console.error("Failed to fetch stats:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const cards = [
    {
      label: "新闻内容",
      count: stats?.newsCount ?? 0,
      icon: Newspaper,
      color: "bg-orange-500",
      href: "/admin/news",
    },
    {
      label: "浙工大健康人",
      count: stats?.expertCount ?? 0,
      icon: UserRound,
      color: "bg-blue-500",
      href: "/admin/experts",
    },
    {
      label: "向阳优品",
      count: stats?.productCount ?? 0,
      icon: ShoppingBag,
      color: "bg-green-500",
      href: "/admin/selection",
    },
    {
      label: "健康贴士",
      count: stats?.tipCount ?? 0,
      icon: Lightbulb,
      color: "bg-purple-500",
      href: "/admin/daily-tips",
    },
  ];

  return (
    <AdminLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">仪表盘</h2>
        <p className="text-slate-500">向阳健康后台数据概览</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => (
          <div
            key={card.label}
            onClick={() => navigate(card.href)}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-orange-200 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${card.color} bg-opacity-10`}>
                <card.icon className={`w-6 h-6 text-white`} style={{ color: card.color.replace('bg-', '') }} />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500 transition-colors" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {loading ? (
                <span className="inline-block w-8 h-8 bg-slate-200 rounded animate-pulse" />
              ) : (
                card.count
              )}
            </div>
            <div className="text-sm text-slate-500">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Recent News */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-slate-900">最近文章</h3>
          </div>
          <button
            onClick={() => navigate("/admin/news")}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            查看全部
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4">
                <div className="flex-1 h-5 bg-slate-200 rounded animate-pulse" />
                <div className="w-20 h-5 bg-slate-200 rounded animate-pulse" />
              </div>
            ))
          ) : stats?.recentNews.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-500">暂无文章</div>
          ) : (
            stats?.recentNews.map((news) => (
              <div
                key={news.id}
                onClick={() => navigate(`/admin/news/${news.id}`)}
                className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-slate-900 truncate block">
                    {news.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0">
                  {news.category && (
                    <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                      {news.category.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    {new Date(news.date).toLocaleDateString("zh-CN")}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickActionButton
          label="发布新文章"
          desc="撰写并发布健康科普内容"
          onClick={() => navigate("/admin/news/new")}
          color="bg-orange-500"
        />
        <QuickActionButton
          label="新增专家"
          desc="添加浙工大健康人资料"
          onClick={() => navigate("/admin/experts/new")}
          color="bg-blue-500"
        />
        <QuickActionButton
          label="新增产品"
          desc="添加向阳优品推荐"
          onClick={() => navigate("/admin/selection/new")}
          color="bg-green-500"
        />
      </div>
    </AdminLayout>
  );
}

function QuickActionButton({
  label,
  desc,
  onClick,
  color,
}: {
  label: string;
  desc: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-orange-200 transition-all text-left group"
    >
      <div className={`w-1 h-12 rounded-full ${color} shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-slate-900 group-hover:text-orange-600 transition-colors">
          {label}
        </div>
        <div className="text-sm text-slate-500 truncate">{desc}</div>
      </div>
      <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500 shrink-0 transition-colors" />
    </button>
  );
}