import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "../Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { api, getImageThumb } from "@/lib/api";
import { Image, File, Film, RefreshCw, ExternalLink, Copy, ChevronLeft, ChevronRight, FolderOpen, Trash2 } from "lucide-react";

interface MediaObject {
  key: string;
  url: string;
  size: number;
  lastModified: string;
  type: string;
}

export function MediaList() {
  const [objects, setObjects] = useState<MediaObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [prefix, setPrefix] = useState("");
  const [currentPrefix, setCurrentPrefix] = useState("");
  const [marker, setMarker] = useState<string | null>(null);
  const [nextMarker, setNextMarker] = useState<string | null>(null);
  // marker 历史栈：记录已浏览过的分页标记，用于真正的"上一页"
  const [history, setHistory] = useState<string[]>([]);
  const [isTruncated, setIsTruncated] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const fetchMedia = useCallback(async (p: string, m: string | null) => {
    setLoading(true);
    try {
      const res = await api.get("/media", { params: { prefix: p, marker: m || undefined, maxKeys: 50 } });
      setObjects(res.data.objects || []);
      setNextMarker(res.data.nextMarker);
      setIsTruncated(res.data.isTruncated);
      setCurrentPrefix(p);
      setMarker(m);
      setSelected(new Set());
    } catch (e: any) {
      toast.error("加载媒体文件失败: " + (e.message || "未知错误"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMedia("", null); }, [fetchMedia]);

  const handleFilter = (p: string) => {
    setPrefix(p);
    setHistory([]);
    fetchMedia(p, null);
  };

  const handleNext = () => {
    if (nextMarker) {
      setHistory(h => [...h, marker || ""]);
      fetchMedia(currentPrefix, nextMarker);
    }
  };

  const handlePrev = () => {
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    fetchMedia(currentPrefix, prev || null);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(() => toast.success("链接已复制")).catch(() => toast.error("复制失败"));
  };

  const toggleSelect = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected(prev => {
      if (prev.size === filtered.length) return new Set();
      return new Set(filtered.map(o => o.key));
    });
  };

  const handleDelete = async (keys: string[]) => {
    if (keys.length === 0) return;
    if (!confirm(`确定删除选中的 ${keys.length} 个文件？此操作不可恢复！`)) return;
    setDeleting(true);
    try {
      const res = await api.post("/media/delete", { keys });
      const { deleted, blocked } = res.data;
      if (blocked && blocked.length > 0) {
        const names = blocked.map((b: any) => b.key.split("/").pop()).join("、");
        toast.warning(
          `已删除 ${deleted} 个文件；${blocked.length} 个文件正被引用，已跳过：${names}`
        );
      } else {
        toast.success(`已删除 ${deleted} 个文件`);
      }
      setSelected(new Set());
      fetchMedia(currentPrefix, marker);
    } catch (e: any) {
      toast.error("删除失败: " + (e.response?.data?.error || e.message || "未知错误"));
    } finally {
      setDeleting(false);
    }
  };

  const filtered = filterType === "all" ? objects : objects.filter(o => o.type === filterType);
  const imageTypes = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"];
  const videoTypes = ["mp4", "webm", "mov", "avi"];
  const allSelected = filtered.length > 0 && selected.size === filtered.length;

  const getIcon = (type: string) => {
    if (imageTypes.includes(type)) return <Image className="w-5 h-5 text-blue-500" />;
    if (videoTypes.includes(type)) return <Film className="w-5 h-5 text-purple-500" />;
    return <File className="w-5 h-5 text-slate-500" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const typeOptions = [
    { value: "all", label: "全部类型" },
    { value: "jpg", label: "JPEG" },
    { value: "png", label: "PNG" },
    { value: "gif", label: "GIF" },
    { value: "webp", label: "WebP" },
    { value: "mp4", label: "MP4" },
    { value: "pdf", label: "PDF" },
    { value: "docx", label: "DOCX" },
  ];

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">媒体管理</h2>
          <p className="text-sm text-slate-500 mt-1">浏览 OSS 上已上传的图片、视频和文件，支持勾选删除</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={() => handleDelete(Array.from(selected))}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleting ? "删除中..." : `删除选中 (${selected.size})`}
            </Button>
          )}
          <Button variant="outline" onClick={() => fetchMedia(currentPrefix, null)}>
            <RefreshCw className="w-4 h-4 mr-2" /> 刷新
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="按路径筛选 (如: news/, avatar/, product/)"
            value={prefix}
            onChange={e => setPrefix(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleFilter(prefix)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {typeOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="secondary" onClick={() => handleFilter(prefix)}>
          筛选
        </Button>
      </div>

      {/* Breadcrumb */}
      <div className="text-sm text-slate-500 mb-4">
        当前路径: <span className="font-mono text-slate-700">{currentPrefix || "(根目录)"}</span>
        {currentPrefix && (
          <button onClick={() => handleFilter("")} className="ml-2 text-orange-600 hover:underline">回到根目录</button>
        )}
      </div>

      {/* Media Grid */}
      <div className="bg-white rounded-lg border shadow-sm">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-square bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">该路径下没有媒体文件</div>
        ) : (
          <>
            {/* Selection Bar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-slate-50">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 accent-orange-600"
                />
                全选 ({filtered.length})
              </label>
              {selected.size > 0 && (
                <span className="text-sm text-orange-600 font-medium">已选择 {selected.size} 个文件</span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-6">
              {filtered.map((obj) => {
                const isSelected = selected.has(obj.key);
                return (
                  <div
                    key={obj.key}
                    onClick={() => toggleSelect(obj.key)}
                    className={`group relative bg-slate-50 rounded-lg border overflow-hidden hover:shadow-md transition-all cursor-pointer ${isSelected ? "border-orange-500 ring-2 ring-orange-200" : "border-slate-200"}`}
                  >
                    {/* Checkbox */}
                    <div className={`absolute top-2 left-2 z-10 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? "bg-orange-600 border-orange-600" : "bg-white border-slate-300 group-hover:border-orange-400"}`}>
                      {isSelected && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>

                    {/* Preview */}
                    <div className="aspect-square flex items-center justify-center bg-slate-100 overflow-hidden">
                      {imageTypes.includes(obj.type) ? (
                        <img
                          src={getImageThumb(obj.url, 400)}
                          alt={obj.key}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                            (e.target as HTMLImageElement).parentElement!.classList.add("flex", "items-center", "justify-center");
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          {getIcon(obj.type)}
                          <span className="text-xs font-mono">.{obj.type}</span>
                        </div>
                      )}
                    </div>

                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      {imageTypes.includes(obj.type) && (
                        <a href={obj.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                          className="p-2 bg-white rounded-full hover:bg-orange-100 transition-colors">
                          <ExternalLink className="w-4 h-4 text-slate-700" />
                        </a>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); handleCopyUrl(obj.url); }}
                        className="p-2 bg-white rounded-full hover:bg-orange-100 transition-colors">
                        <Copy className="w-4 h-4 text-slate-700" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete([obj.key]); }}
                        className="p-2 bg-white rounded-full hover:bg-red-100 transition-colors">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>

                    {/* Info */}
                    <div className="p-2">
                      <div className="text-xs text-slate-700 truncate" title={obj.key.split("/").pop()}>
                        {obj.key.split("/").pop()}
                      </div>
                      <div className="text-xs text-slate-400">{formatSize(obj.size)}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
              <div className="text-sm text-slate-500">
                共 {filtered.length} 个文件
                {isTruncated && " (还有更多)"}
              </div>
              <div className="flex gap-2">
                {history.length > 0 && (
                  <Button variant="outline" size="sm" onClick={handlePrev}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> 上一页
                  </Button>
                )}
                {isTruncated && (
                  <Button variant="outline" size="sm" onClick={handleNext}>
                    下一页 <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}