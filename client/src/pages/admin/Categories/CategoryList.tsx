import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "../Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useCachedData, clearAllCache } from "@/hooks/useCachedData";

interface Category {
    id: number;
    name: string;
    type: string;
    createdAt: string;
}

export function CategoryList() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentCategory, setCurrentCategory] = useState<Partial<Category>>({ type: "news" });
    const { token } = useAuth()!;

    // 使用 useCallback 包装 fetchFn 避免无限循环
    const fetchCategories = useCallback(async () => {
        const res = await api.get("/categories");
        return res.data;
    }, []);

    // 使用缓存 hook
    const { data: categories = [], loading, refetch } = useCachedData<Category[]>(
        'categories_list',
        fetchCategories
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (currentCategory.id) {
                await api.put(`/categories/${currentCategory.id}`, currentCategory);
                toast.success("更新成功");
            } else {
                await api.post("/categories", currentCategory);
                toast.success("创建成功");
            }
            clearAllCache();
            setIsDialogOpen(false);
            refetch();
            setCurrentCategory({ type: "news" });
        } catch (error) {
            toast.error("操作失败");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("确定要删除这个分类吗？")) return;
        try {
            await api.delete(`/categories/${id}`);
            toast.success("删除成功");
            clearAllCache();
            refetch();
        } catch (error) {
            toast.error("删除失败");
        }
    };

    const openEdit = (category: Category) => {
        setCurrentCategory(category);
        setIsDialogOpen(true);
    };

    const openCreate = () => {
        setCurrentCategory({ type: "news" });
        setIsDialogOpen(true);
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "news": return "新闻内容";
            case "expert": return "健康工大人";
            case "selection": return "向阳优选";
            default: return type;
        }
    }

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">分类管理</h2>
                <Button onClick={openCreate} className="bg-orange-600 hover:bg-orange-700">
                    <Plus className="w-4 h-4 mr-2" />
                    新增分类
                </Button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentCategory.id ? "编辑分类" : "新增分类"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>分类名称</Label>
                            <Input
                                value={currentCategory.name || ""}
                                onChange={e => setCurrentCategory({ ...currentCategory, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>所属板块</Label>
                            <Select
                                value={currentCategory.type || "news"}
                                onValueChange={val => setCurrentCategory({ ...currentCategory, type: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="news">新闻内容</SelectItem>
                                    <SelectItem value="expert">健康工大人</SelectItem>
                                    <SelectItem value="selection">向阳优选</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
                            <Button type="submit" className="bg-orange-600 hover:bg-orange-700">保存</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <div className="bg-white rounded-lg border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>名称</TableHead>
                            <TableHead>所属板块</TableHead>
                            <TableHead>创建时间</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories?.map((category) => (
                            <TableRow key={category.id}>
                                <TableCell className="font-medium">{category.name}</TableCell>
                                <TableCell>{getTypeLabel(category.type)}</TableCell>
                                <TableCell>{new Date(category.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right flex justify-end gap-2">
                                    <Button size="icon" variant="ghost" onClick={() => openEdit(category)}>
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(category.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {(!categories || categories.length === 0) && !loading && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-6 text-slate-500">
                                    暂无数据
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </AdminLayout>
    );
}
