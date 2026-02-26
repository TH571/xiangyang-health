import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "wouter";

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
import { Pencil, Trash2, Plus, ArrowLeft, Upload, Star } from "lucide-react";
import { toast } from "sonner";
import { api, uploadApi, getImageUrl } from "@/lib/api";
import { useCachedData } from "@/hooks/useCachedData";
import { SmallAvatarPlaceholder } from "@/components/Placeholder";

interface Product {
    id: number;
    name: string;
    rating: number;
    image: string;
    introduction: string; // Brief or rich text
    url: string;
    price: string;
    categoryId: number;
    category: { name: string };
    createdAt: string;
}

interface Category {
    id: number;
    name: string;
}

export function SelectionList() {
    const { token } = useAuth()!;
    const [, setLocation] = useLocation();

    // 使用 useCallback 包装 fetchFn 避免无限循环
    const fetchProducts = useCallback(async () => {
        const res = await api.get("/products");
        return res.data;
    }, []);

    // 使用缓存 hook
    const { data: products = [], loading, refetch } = useCachedData<Product[]>(
        'products_list',
        fetchProducts
    );

    const handleDelete = async (id: number) => {
        if (!confirm("确定删除?")) return;
        try {
            await api.delete(`/products/${id}`);
            toast.success("删除成功");
            refetch();
        } catch { toast.error("删除失败"); }
    };

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">向阳优选管理</h2>
                <Button onClick={() => setLocation("/admin/selection/new")} className="bg-orange-600 hover:bg-orange-700">
                    <Plus className="w-4 h-4 mr-2" /> 新增产品
                </Button>
            </div>

            <div className="bg-white rounded-lg border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>图片</TableHead>
                            <TableHead>名称</TableHead>
                            <TableHead>分类</TableHead>
                            <TableHead>价格</TableHead>
                            <TableHead>评分</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products?.map(item => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    {getImageUrl(item.image) ? (
                                        <img src={getImageUrl(item.image)} alt={item.name} className="w-12 h-12 rounded object-cover border" />
                                    ) : (
                                        <SmallAvatarPlaceholder />
                                    )}
                                </TableCell>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>{item.category?.name || "未分类"}</TableCell>
                                <TableCell>{item.price}</TableCell>
                                <TableCell className="flex items-center gap-1">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-500" /> {item.rating}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button size="icon" variant="ghost" onClick={() => setLocation(`/admin/selection/${item.id}`)}>
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDelete(item.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {(!products || products.length === 0) && !loading && <TableRow><TableCell colSpan={6} className="text-center py-6">暂无数据</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </div>
        </AdminLayout>
    );
}

export function SelectionEdit({ params }: { params?: { id?: string } }) {
    const [formData, setFormData] = useState<Partial<Product>>({ introduction: "", rating: 5 });
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const { token } = useAuth()!;
    const [location, setLocation] = useLocation();

    const id = params?.id || (location.match(/\/admin\/selection\/(\d+)/)?.[1]);

    useEffect(() => {
        const loadData = async () => {
            const catRes = await api.get("/categories?type=selection");
            setCategories(catRes.data);
            if (id) {
                const res = await api.get(`/products/${id}`);
                setFormData(res.data);
            }
        };
        loadData();
    }, [id, token]);

    const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const data = new FormData();
        data.append("file", file);
        try {
            const res = await uploadApi.post("/upload?type=product", data);
            setFormData({ ...formData, image: res.data.url });
            toast.success("上传成功");
        } catch { toast.error("上传失败"); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                name: formData.name,
                rating: Number(formData.rating),
                image: formData.image,
                introduction: formData.introduction,
                url: formData.url,
                price: formData.price,
                categoryId: Number(formData.categoryId),
            };
            if (id) {
                await api.put(`/products/${id}`, payload);
                toast.success("更新成功");
            } else {
                await api.post("/products", payload);
                toast.success("创建成功");
            }
            setLocation("/admin/selection");
        } catch { toast.error("保存失败"); }
        finally { setLoading(false); }
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="icon" onClick={() => setLocation("/admin/selection")}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h2 className="text-2xl font-bold">{id ? "编辑产品" : "新增产品"}</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>产品名称</Label>
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
                            <Label>价格描述</Label>
                            <Input value={formData.price || ""} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="例如：￥50.00 / 件" />
                        </div>
                        <div className="space-y-2">
                            <Label>评分 (0-5)</Label>
                            <Input type="number" step="0.1" min="0" max="5" value={formData.rating || 5} onChange={e => setFormData({ ...formData, rating: parseFloat(e.target.value) })} />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label>购买链接 (URL)</Label>
                            <Input value={formData.url || ""} onChange={e => setFormData({ ...formData, url: e.target.value })} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>产品图片</Label>
                        <div className="flex items-center gap-4">
                            {formData.image && <img src={getImageUrl(formData.image)} alt="Product" className="h-20 w-20 object-cover rounded border" />}
                            <div className="relative">
                                <Input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleUploadImage} accept="image/*" />
                                <Button type="button" variant="outline"><Upload className="w-4 h-4 mr-2" /> 上传图片</Button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>产品介绍 (简短描述)</Label>
                        <textarea
                            className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.introduction || ""}
                            onChange={e => setFormData({ ...formData, introduction: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => setLocation("/admin/selection")}>取消</Button>
                        <Button type="submit" className="bg-orange-600 hover:bg-orange-700" disabled={loading}>
                            {loading ? "保存中..." : "保存产品"}
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
