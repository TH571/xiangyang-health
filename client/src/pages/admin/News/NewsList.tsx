import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import RichTextEditor from '@/components/RichTextEditor';

// ... (other imports)


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
import { api, uploadApi } from "@/lib/api";

interface News {
    id: number;
    title: string;
    author: string;
    authorTitle: string;
    authorAvatar: string;
    cover: string;
    content: string;
    date: string;
    categoryId: number;
    category: { name: string };
}

interface Category {
    id: number;
    name: string;
}

export function NewsList() {
    const [news, setNews] = useState<News[]>([]);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth()!;
    const [, setLocation] = useLocation();

    const fetchNews = async () => {
        try {
            const res = await api.get("/news");
            setNews(res.data);
        } catch { toast.error("加载新闻失败"); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchNews(); }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("确定删除?")) return;
        try {
            await api.delete(`/news/${id}`);
            toast.success("删除成功");
            fetchNews();
        } catch { toast.error("删除失败"); }
    };

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">新闻内容管理</h2>
                <Button onClick={() => setLocation("/admin/news/new")} className="bg-orange-600 hover:bg-orange-700">
                    <Plus className="w-4 h-4 mr-2" /> 发布新闻
                </Button>
            </div>

            <div className="bg-white rounded-lg border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>标题</TableHead>
                            <TableHead>分类</TableHead>
                            <TableHead>作者</TableHead>
                            <TableHead>发布时间</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {news.map(item => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium max-w-[300px] truncate">
                                    <a
                                        href={`/article/${item.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-orange-600 hover:underline cursor-pointer"
                                    >
                                        {item.title}
                                    </a>
                                </TableCell>
                                <TableCell>{item.category?.name || "未分类"}</TableCell>
                                <TableCell>{item.author}</TableCell>
                                <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
                                    <Button size="icon" variant="ghost" onClick={() => setLocation(`/admin/news/${item.id}`)}>
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDelete(item.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {news.length === 0 && !loading && <TableRow><TableCell colSpan={5} className="text-center py-6">暂无数据</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </div>
        </AdminLayout>
    );
}

export function NewsEdit({ params }: { params?: { id?: string } }) {
    const { token, user } = useAuth()!;
    const [formData, setFormData] = useState<Partial<News>>({ content: "", author: user?.username || "", authorTitle: user?.title || "", authorAvatar: user?.avatar || "" });
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useLocation();

    // Extract ID from URL if params is empty (wouter issue sometimes)
    const id = params?.id || (location.match(/\/admin\/news\/(\d+)/)?.[1]);

    useEffect(() => {
        const loadData = async () => {
            // Fetch categories
            const catRes = await api.get("/categories?type=news");
            setCategories(catRes.data);

            if (id) {
                const res = await api.get(`/news/${id}`);
                setFormData(res.data);
            }
        };
        loadData();
    }, [id, token]);

    const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const data = new FormData();
        data.append("file", file);
        try {
            const res = await uploadApi.post("/upload?type=news", data);
            setFormData({ ...formData, cover: res.data.url });
            toast.success("上传成功");
        } catch { toast.error("上传失败"); }
    };

    const handleImageUpload = async (file: File) => {
        const data = new FormData();
        data.append('file', file);
        const res = await uploadApi.post('/upload?type=news', data);
        return res.data.url;
    };

    const modules = useMemo(() => ({
        toolbar: [
            [{ header: [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image'],
            ['clean'],
        ],
    }), []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                title: formData.title,
                author: formData.author,
                authorTitle: formData.authorTitle,
                authorAvatar: formData.authorAvatar,
                cover: formData.cover,
                content: formData.content,
                date: formData.date,
                categoryId: Number(formData.categoryId),
            };
            if (id) {
                await api.put(`/news/${id}`, payload);
                toast.success("更新成功");
            } else {
                await api.post("/news", payload);
                toast.success("发布成功");
            }
            setLocation("/admin/news");
        } catch { toast.error("保存失败"); }
        finally { setLoading(false); }
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="icon" onClick={() => setLocation("/admin/news")}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h2 className="text-2xl font-bold">{id ? "编辑新闻" : "发布新闻"}</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>标题</Label>
                            <Input value={formData.title || ""} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
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
                            <div className="flex justify-between items-center">
                                <Label>作者</Label>
                                <Button
                                    type="button"
                                    variant="link"
                                    className="h-auto p-0 text-orange-600 font-normal text-xs"
                                    onClick={() => setFormData(prev => ({
                                        ...prev,
                                        author: user?.username || "",
                                        authorTitle: user?.title || "",
                                        authorAvatar: user?.avatar || ""
                                    }))}
                                >
                                    使用我的资料 ({user?.username})
                                </Button>
                            </div>
                            <Input value={formData.author || ""} onChange={e => setFormData({ ...formData, author: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>作者头衔</Label>
                            <Input value={formData.authorTitle || ""} onChange={e => setFormData({ ...formData, authorTitle: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>发布日期</Label>
                            <Input type="date" value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ""} onChange={e => setFormData({ ...formData, date: new Date(e.target.value).toISOString() })} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>封面图片</Label>
                        <div className="flex items-center gap-4">
                            {formData.cover && <img src={formData.cover} alt="Cover" className="h-20 w-32 object-cover rounded border" />}
                            <div className="relative">
                                <Input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleUploadCover} accept="image/*" />
                                <Button type="button" variant="outline"><Upload className="w-4 h-4 mr-2" /> 上传封面</Button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>正文内容</Label>
                        <div className="prose-editor">
                            <RichTextEditor
                                theme="snow"
                                value={formData.content || ""}
                                onChange={val => setFormData(prev => ({ ...prev, content: val }))}
                                onImageUpload={handleImageUpload}
                                modules={modules}
                                className="mb-12"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => setLocation("/admin/news")}>取消</Button>
                        <Button type="submit" className="bg-orange-600 hover:bg-orange-700" disabled={loading}>
                            {loading ? "保存中..." : "保存新闻"}
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
