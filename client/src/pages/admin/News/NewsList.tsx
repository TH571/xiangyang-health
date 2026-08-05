import { useState, useEffect, useMemo, useCallback } from "react";
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
import { Pencil, Trash2, Plus, ArrowLeft, Upload, Search, Eye, X } from "lucide-react";
import { toast } from "sonner";
import { api, uploadApi, uploadFileDirect, getImageUrl } from "@/lib/api";
import { useCachedData, clearAllCache } from "@/hooks/useCachedData";

// ===== Preview Modal =====
function PreviewModal({ open, onClose, title, content }: { open: boolean; onClose: () => void; title?: string; content?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col m-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900 truncate">{title || "文章预览"}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <article className="prose prose-slate max-w-none prose-img:max-w-full prose-img:mx-auto prose-img:my-4">
            <div dangerouslySetInnerHTML={{ __html: content || "" }} />
          </article>
        </div>
      </div>
    </div>
  );
}

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
    const { token } = useAuth()!;
    const [, setLocation] = useLocation();

    // 搜索筛选状态
    const [searchKeyword, setSearchKeyword] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

    // 使用 useCallback 包装 fetchFn 避免无限循环
    const fetchNews = useCallback(async () => {
        const res = await api.get("/news");
        return res.data;
    }, []);

    // 加载分类列表
    useEffect(() => {
        api.get("/categories?type=news").then(res => setCategories(res.data)).catch(() => {});
    }, []);

    // 使用缓存 hook
    const { data: news = [], loading, refetch } = useCachedData<News[]>(
        'news_list',
        fetchNews
    );

    // 前端筛选
    const filteredNews = useMemo(() => {
        let list = news || [];
        if (searchKeyword.trim()) {
            const kw = searchKeyword.toLowerCase();
            list = list.filter(n => n.title.toLowerCase().includes(kw) || (n.author || "").toLowerCase().includes(kw));
        }
        if (filterCategory !== "all") {
            list = list.filter(n => n.categoryId === Number(filterCategory));
        }
        return list;
    }, [news, searchKeyword, filterCategory]);

    const handleDelete = async (id: number) => {
        if (!confirm("确定删除?")) return;
        try {
            await api.delete(`/news/${id}`);
            toast.success("删除成功");
            clearAllCache();
            refetch();
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

            {/* Search & Filter Bar */}
            <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="搜索标题或作者..."
                        value={searchKeyword}
                        onChange={e => setSearchKeyword(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="全部分类" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">全部分类</SelectItem>
                        {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <div className="text-sm text-slate-500">
                    共 <span className="font-semibold text-slate-700">{filteredNews.length}</span> 条
                </div>
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
                        {filteredNews?.map(item => (
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
                        {(!filteredNews || filteredNews.length === 0) && !loading && <TableRow><TableCell colSpan={5} className="text-center py-6">暂无数据</TableCell></TableRow>}
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
    const [showPreview, setShowPreview] = useState(false);
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
        try {
            const url = await uploadFileDirect(file, "news");
            setFormData({ ...formData, cover: url });
            toast.success("上传成功");
        } catch (err: any) { toast.error("上传失败: " + (err.message || "未知错误")); console.error(err); }
    };

    const handleImageUpload = async (file: File) => {
        return await uploadFileDirect(file, "news");
    };

    const handleVideoUpload = async (file: File) => {
        return await uploadFileDirect(file, "video");
    };

    const modules = useMemo(() => ({
        toolbar: [
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ color: [] }, { background: [] }],
            [{ align: [] }],
            [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
            ['blockquote', 'code-block'],
            [{ script: 'sub' }, { script: 'super' }],
            ['link', 'image', 'video'],
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
            clearAllCache();
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
                            {formData.cover && <img src={getImageUrl(formData.cover)} alt="Cover" className="h-20 w-32 object-cover rounded border" />}
                            <div className="relative">
                                <Input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleUploadCover} />
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
                                onVideoUpload={handleVideoUpload}
                                modules={modules}
                                className="mb-12"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => setLocation("/admin/news")}>取消</Button>
                        <Button type="button" variant="secondary" onClick={() => setShowPreview(true)} disabled={!formData.content}>
                            <Eye className="w-4 h-4 mr-2" /> 预览
                        </Button>
                        <Button type="submit" className="bg-orange-600 hover:bg-orange-700" disabled={loading}>
                            {loading ? "保存中..." : "保存新闻"}
                        </Button>
                    </div>
                </form>

                {/* Preview Modal */}
                <PreviewModal
                    open={showPreview}
                    onClose={() => setShowPreview(false)}
                    title={formData.title}
                    content={formData.content}
                />
            </div>
        </AdminLayout>
    );
}
