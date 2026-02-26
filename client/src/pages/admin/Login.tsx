import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { api } from "@/lib/api";

export function AdminLogin() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { login, token } = useAuth()!;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [location, setLocation] = useLocation();

    useEffect(() => {
        if (token) {
            setLocation("/admin/dashboard");
        }
    }, [token, setLocation]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await api.post("/auth/login", { username, password });
            const { token, ...user } = res.data;
            login(token, user);
            toast.success("登录成功");
        } catch (error) {
            toast.error("登录失败，请检查用户名或密码");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">向阳健康后台管理</CardTitle>
                    <CardDescription>请输入管理员账号和密码</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">用户名</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="admin"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">密码</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isLoading}>
                            {isLoading ? "登录中..." : "登录"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
