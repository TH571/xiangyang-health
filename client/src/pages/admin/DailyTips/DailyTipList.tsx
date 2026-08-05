import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "../Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Pencil, Trash2, Plus, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useCachedData, clearAllCache } from "@/hooks/useCachedData";

interface DailyTip {
  id: number;
  content: string;
  source: string;
  date: string;
  isActive: boolean;
  createdAt: string;
}

export function DailyTipList() {
  const { token } = useAuth()!;
  const [isOpen, setIsOpen] = useState(false);
  const [current, setCurrent] = useState<Partial<DailyTip>>({ content: "", source: "向阳健康", isActive: true });

  const fetchTips = useCallback(async () => {
    const res = await api.get("/daily-tips");
    return res.data;
  }, []);

  const { data: tips = [], loading, refetch } = useCachedData<DailyTip[]>("daily_tips", fetchTips);

  // 后台管理页挂载时强制刷新，避免读到旧缓存
  useEffect(() => {
    clearAllCache();
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (current.id) {
        await api.put(`/daily-tips/${current.id}`, current);
        toast.success("更新成功");
      } else {
        await api.post("/daily-tip", { content: current.content, source: current.source || "向阳健康" });
        toast.success("创建成功");
      }
      clearAllCache();
      setIsOpen(false);
      setCurrent({ content: "", source: "向阳健康", isActive: true });
      refetch();
    } catch { toast.error("操作失败"); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除这条健康贴士？")) return;
    try {
      await api.delete(`/daily-tips/${id}`);
      toast.success("删除成功");
      clearAllCache();
      refetch();
    } catch { toast.error("删除失败"); }
  };

  const openEdit = (tip: DailyTip) => {
    setCurrent(tip);
    setIsOpen(true);
  };

  const openCreate = () => {
    setCurrent({ content: "", source: "向阳健康", isActive: true });
    setIsOpen(true);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">每日健康贴士</h2>
          <p className="text-sm text-slate-500 mt-1">管理首页展示的每日健康科普知识</p>
        </div>
        <Button onClick={openCreate} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="w-4 h-4 mr-2" /> 新增贴士
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{current.id ? "编辑健康贴士" : "新增健康贴士"}</DialogTitle>
            <DialogDescription>
              健康贴士将展示在网站首页的每日健康板块
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>贴士内容</Label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={current.content || ""}
                onChange={e => setCurrent({ ...current, content: e.target.value })}
                required
                placeholder="输入健康科普知识..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>来源</Label>
                <Input
                  value={current.source || ""}
                  onChange={e => setCurrent({ ...current, source: e.target.value })}
                  placeholder="向阳健康"
                />
              </div>
              <div className="space-y-2">
                <Label>状态</Label>
                <Select
                  value={current.isActive ? "true" : "false"}
                  onValueChange={val => setCurrent({ ...current, isActive: val === "true" })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">启用</SelectItem>
                    <SelectItem value="false">禁用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>取消</Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700">保存</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50%]">内容</TableHead>
              <TableHead>来源</TableHead>
              <TableHead>日期</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tips?.map((tip) => (
              <TableRow key={tip.id}>
                <TableCell className="max-w-[400px]">
                  <div className="truncate text-sm">{tip.content}</div>
                </TableCell>
                <TableCell className="text-sm text-slate-600">{tip.source || "向阳健康"}</TableCell>
                <TableCell className="text-sm">{new Date(tip.date).toLocaleDateString("zh-CN")}</TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tip.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {tip.isActive ? "启用" : "禁用"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(tip)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDelete(tip.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!tips || tips.length === 0) && !loading && (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">暂无健康贴士</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}