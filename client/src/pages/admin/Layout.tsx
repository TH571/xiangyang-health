import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { getImageUrl } from "@/lib/api";
import {
    LayoutDashboard,
    Newspaper,
    UserRound,
    ShoppingBag,
    FolderTree,
    Shield,
    LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminLayout({ children }: { children: React.ReactNode }) {
    const { logout, user } = useAuth()!;
    const [location] = useLocation();

    const navItems = [
        { href: "/admin/dashboard", label: "概览", icon: LayoutDashboard },
        { href: "/admin/news", label: "新闻内容", icon: Newspaper },
        { href: "/admin/experts", label: "健康工大人", icon: UserRound },
        { href: "/admin/selection", label: "向阳优选", icon: ShoppingBag },
        { href: "/admin/categories", label: "分类管理", icon: FolderTree },
        { href: "/admin/settings", label: "管理员设置", icon: Shield },
    ];

    return (
        <div className="flex min-h-screen bg-slate-100">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-10">
                <div className="p-6 border-b border-slate-700">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <span className="text-orange-500">向阳</span> 后台管理
                        <a
                            href="/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto text-2xl hover:scale-110 transition-transform cursor-pointer"
                            title="访问前端首页"
                        >
                            🏠
                        </a>
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <Link key={item.href} href={item.href}>
                            <div
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${location.startsWith(item.href)
                                    ? "bg-orange-600 text-white"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                            </div>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-700">
                    <div className="mb-4 px-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden border border-slate-600">
                            {user?.avatar ? (
                                <img src={getImageUrl(user.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-lg font-bold text-slate-500">
                                    {(user?.nickname || user?.username || "A").charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="overflow-hidden">
                            <div className="text-sm font-medium text-white truncate">{user?.nickname || user?.username}</div>
                            <div className="text-xs text-slate-500">管理员</div>
                        </div>
                    </div>
                    <Button
                        onClick={logout}
                        variant="destructive"
                        className="w-full justify-start gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        退出登录
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                {children}
            </main>
        </div>
    );
}
