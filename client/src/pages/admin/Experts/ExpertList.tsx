import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import RichTextEditor from '@/components/RichTextEditor';
import { AdminLayout } from "../Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Plus, ArrowLeft, Upload } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

interface Expert {
    id: number;
    name: string;
    title: string;
    avatar: string;
    unit: string;
    achievements: string;
    introduction: string;
    categoryId: number;
    category: { name: string };
}

interface Category {
    id: number;
    name: string;
}

export function ExpertList() {
    const [experts, setExperts] = useState<Expert[]>([]);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth()!;
    const [, setLocation] = useLocation();

    const fetchExperts = async () => {
        try {
            const res = await axios.get("/api/experts");
            setExperts(res.data);
        } catch { toast.error("加载专家失败"); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchExperts(); }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("确定删除?")) return;
        try {
            await axios.delete(`/api/experts/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("删除成功");
            fetchExperts();
        } catch { toast.error("删除失败"); }
    };

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">健康工大人管理</h2>
                <Button onClick={() => setLocation("/admin/experts/new")} className="bg-orange-600 hover:bg-orange-700">
                    <Plus className="w-4 h-4 mr-2" /> 新增专家
                </Button>
            </div>

            <div className="bg-white rounded-lg border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>头像</TableHead>
                            <TableHead>姓名</TableHead>
                            <TableHead>职称</TableHead>
                            <TableHead>所属分类</TableHead>
                            <TableHead>单位</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {experts.map(item => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    <img src={item.avatar || "https://via.placeholder.com/40"} alt={item.name} className="w-10 h-10 rounded-full object-cover" />
                                </TableCell>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>{item.title}</TableCell>
                                <TableCell>{item.category?.name || "未分类"}</TableCell>
                                <TableCell>{item.unit}</TableCell>
                                <TableCell className="text-right">
                                    <Button size="icon" variant="ghost" onClick={() => setLocation(`/admin/experts/${item.id}`)}>
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDelete(item.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {experts.length === 0 && !loading && <TableRow><TableCell colSpan={6} className="text-center py-6">暂无数据</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </div>
        </AdminLayout>
    );
}

export function ExpertEdit({ params }: { params?: { id?: string } }) {
    const [formData, setFormData] = useState<Partial<Expert>>({ introduction: "" });
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const { token } = useAuth()!;
    const [location, setLocation] = useLocation();

    const id = params?.id || (location.match(/\/admin\/experts\/(\d+)/)?.[1]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const catRes = await axios.get("/api/categories?type=expert", { headers: { Authorization: `Bearer ${token}` } });
                setCategories(catRes.data);
                if (id) {
                    const res = await axios.get(`/api/experts/${id}`);
                    setFormData(res.data);
                }
            } catch (err) {
                console.error("Failed to load expert data:", err);
                toast.error("加载数据失败，请检查后端服务");
            }
        };
        loadData();
    }, [id, token]);

    const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const data = new FormData();
        data.append("file", file);
        try {
            const res = await axios.post("/api/upload", data, { headers: { Authorization: `Bearer ${token}` } });
            setFormData({ ...formData, avatar: res.data.url });
            toast.success("上传成功");
        } catch { toast.error("上传失败"); }
    };

    const modules = useMemo(() => ({
        toolbar: [
            [{ header: [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link'],
            ['clean'],
        ],
    }), []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                name: formData.name,
                title: formData.title,
                avatar: formData.avatar,
                unit: formData.unit,
                achievements: formData.achievements,
                introduction: formData.introduction,
                categoryId: Number(formData.categoryId),
            };
            if (id) {
                await axios.put(`/api/experts/${id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
                toast.success("更新成功");
            } else {
                await axios.post("/api/experts", payload, { headers: { Authorization: `Bearer ${token}` } });
                toast.success("创建成功");
            }
            setLocation("/admin/experts");
        } catch { toast.error("保存失败"); }
        finally { setLoading(false); }
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="icon" onClick={() => setLocation("/admin/experts")}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h2 className="text-2xl font-bold">{id ? "编辑专家" : "新增专家"}</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>姓名</Label>
                            <Input value={formData.name || ""} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <Label>分类</Label>
                            <Select value={String(formData.categoryId || "")} onValueChange={val => setFormData({ ...formData, categoryId: Number(val) })}>
                                <SelectTrigger><SelectValue placeholder="选择分类" /></SelectTrigger>
                                <SelectContent>
                                    {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>职称</Label>
                            <Input value={formData.title || ""} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>单位</Label>
                            <Input value={formData.unit || ""} onChange={e => setFormData({ ...formData, unit: e.target.value })} />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label>成就/经历 (简短)</Label>
                            <Input value={formData.achievements || ""} onChange={e => setFormData({ ...formData, achievements: e.target.value })} placeholder="例如：三十年临床经验..." />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>头像 (照片)</Label>
                        <div className="flex items-center gap-4">
                            {formData.avatar && <img src={formData.avatar} alt="Avatar" className="h-20 w-20 object-cover rounded-full border" />}
                            <div className="relative">
                                <Input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleUploadAvatar} accept="image/*" />
                                <Button type="button" variant="outline"><Upload className="w-4 h-4 mr-2" /> 上传头像</Button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>详细介绍</Label>
                        <div className="prose-editor">
                            <RichTextEditor
                                theme="snow"
                                value={formData.introduction || ""}
                                onChange={val => setFormData(prev => ({ ...prev, introduction: val }))}
                                modules={modules}
                                className="mb-12"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => setLocation("/admin/experts")}>取消</Button>
                        <Button type="submit" className="bg-orange-600 hover:bg-orange-700" disabled={loading}>
                            {loading ? "保存中..." : "保存专家"}
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
