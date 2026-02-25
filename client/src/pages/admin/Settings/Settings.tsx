import { useState, useEffect } from "react";
import { AdminLayout } from "../Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import axios from "axios";

export function Settings() {
    const { user, token, updateUser } = useAuth()!;

    // Profile State
    const [nickname, setNickname] = useState("");
    const [title, setTitle] = useState("");
    const [avatar, setAvatar] = useState("");
    const [profileLoading, setProfileLoading] = useState(false);

    // Password State
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [pwLoading, setPwLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setNickname(user.nickname || "");
            setTitle(user.title || "");
            setAvatar(user.avatar || "");
        }
    }, [user]);

    const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input value to allow re-uploading same file if needed
        e.target.value = '';

        const data = new FormData();
        data.append("file", file);
        try {
            const res = await axios.post("/api/upload?type=avatar", data, { headers: { Authorization: `Bearer ${token}` } });
            setAvatar(res.data.url);
            toast.success("上传成功");
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || "上传失败");
        }
    };

    const getUserId = () => {
        if (user?.id) return user.id;
        try {
            const payload = JSON.parse(atob(token!.split('.')[1]));
            return payload.id;
        } catch { return null; }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        const userId = getUserId();
        if (!userId) {
            toast.error("用户信息失效，请重新登录");
            return;
        }
        setProfileLoading(true);
        try {
            await axios.put(`/api/admins/${userId}`, { nickname, title, avatar }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            updateUser({ nickname, title, avatar });
            toast.success("资料更新成功");
        } catch (error: any) {
            console.error("Update profile error:", error);
            const msg = error.response?.data?.error || error.message || "更新失败";
            toast.error(`更新失败: ${msg}`);
        } finally {
            setProfileLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error("两次密码输入不一致");
            return;
        }
        if (password.length < 6) {
            toast.error("密码长度至少6位");
            return;
        }
        const userId = getUserId();
        if (!userId) {
            toast.error("用户信息失效，请重新登录");
            return;
        }
        setPwLoading(true);
        try {
            await axios.put(`/api/admins/${userId}/password`, { password }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("密码修改成功");
            setPassword("");
            setConfirmPassword("");
        } catch {
            toast.error("修改失败");
        } finally {
            setPwLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-xl mx-auto mt-10 space-y-8">
                <div>
                    <h2 className="text-2xl font-bold mb-6">管理员设置</h2>

                    {/* Profile Section */}
                    <div className="bg-white p-6 rounded-lg border shadow-sm mb-6">
                        <h3 className="text-lg font-semibold mb-4">个人资料</h3>
                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div className="flex items-center gap-6">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-full bg-slate-100 overflow-hidden border">
                                        {avatar ? (
                                            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-slate-300">
                                                {(nickname || user?.username || "A").charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 cursor-pointer rounded-full transition-opacity z-10">
                                        <Upload className="w-6 h-6" />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleUploadAvatar} />
                                    </label>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div className="space-y-2">
                                        <Label>用户名</Label>
                                        <Input value={user?.username} disabled className="bg-slate-50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>昵称</Label>
                                        <Input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="设置显示昵称 / 作者名" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>头衔</Label>
                                        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="例如: 高级顾问" />
                                    </div>
                                </div>
                            </div>
                            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={profileLoading}>
                                {profileLoading ? "保存资料" : "保存资料"}
                            </Button>
                        </form>
                    </div>

                    {/* Password Section */}
                    <div className="bg-white p-6 rounded-lg border shadow-sm">
                        <h3 className="text-lg font-semibold mb-4">修改密码</h3>
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label>新密码</Label>
                                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="至少6位" />
                            </div>
                            <div className="space-y-2">
                                <Label>确认新密码</Label>
                                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="再次输入新密码" />
                            </div>
                            <Button type="submit" variant="outline" className="w-full" disabled={pwLoading}>
                                {pwLoading ? "更新中..." : "更新密码"}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
