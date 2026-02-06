import { AdminLayout } from "./Layout";

export function AdminDashboard() {
    return (
        <AdminLayout>
            <div className="p-8 bg-white rounded-xl border border-slate-200 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">欢迎回来</h2>
                <p className="text-slate-600">
                    这里是向阳健康后台管理系统。您可以从左侧菜单选择要管理的内容模块。
                </p>
            </div>
        </AdminLayout>
    );
}
