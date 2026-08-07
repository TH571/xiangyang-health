import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "../Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { api, getImageThumb, uploadFileDirect } from "@/lib/api";
import { Image, File, Film, RefreshCw, ExternalLink, Copy, ChevronLeft, ChevronRight, FolderOpen, Trash2, Upload, X, Loader2, ArrowUp, ArrowDown } from "lucide-react";

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
  // 上传
  const [uploadPrefix, setUploadPrefix] = useState("default");
  const [uploadQueue, setUploadQueue] = useState<{ file: File; status: "pending" | "uploading" | "done" | "error"; error?: string; url?: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  // 排序
  const [sortBy, setSortBy] = useState<"name" | "size" | "date">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // 上传前缀选项（对应 OSS 目录）
  const uploadPrefixOptions = [
    { value: "default", label: "default (通用)" },
    { value: "news", label: "news (文章)" },
    { value: "avatar", label: "avatar (头像)" },
    { value: "product", label: "product (产品)" },
  ];

  const addFiles = useCallback((files: FileList | File[]) => {
    const newFiles = Array.from(files).filter(f => f.size > 0);
    if (newFiles.length === 0) return;
    setUploadQueue(prev => [
      ...prev,
      ...newFiles.map(file => ({ file, status: "pending" as const })),
    ]);
  }, []);

  const removeFromQueue = (i: number) => {
    setUploadQueue(prev => prev.filter((_, j) => j !== i));
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); };

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
      const detail = e.response?.data?.detail || e.response?.data?.error || "";
      const status = e.response?.status ? `(HTTP ${e.response.status})` : "";
      toast.error(`加载媒体文件失败: ${e.message || "未知错误"}${status}${detail ? ` ${detail}` : ""}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMedia("", null); }, [fetchMedia]);

  const startUploads = useCallback(async () => {
    setUploadQueue(prev => prev.map(q => q.status === "pending" ? { ...q, status: "uploading" as const } : q));
    
    // 逐个上传（避免并发签名冲突）
    const current = [...uploadQueue];
    for (let i = 0; i < current.length; i++) {
      if (current[i].status !== "pending") continue;
      setUploadQueue(prev => prev.map((q, j) => j === i && q.status === "pending" ? { ...q, status: "uploading" as const } : q));
      try {
        const url = await uploadFileDirect(current[i].file, uploadPrefix);
        setUploadQueue(prev => prev.map((q, j) => j === i ? { ...q, status: "done" as const, url } : q));
      } catch (e: any) {
        const msg = e.message || "上传失败";
        setUploadQueue(prev => prev.map((q, j) => j === i ? { ...q, status: "error" as const, error: msg } : q));
      }
    }

    // 全部完成后刷新列表 + toast
    const final = [...uploadQueue];
    const ok = final.filter(q => q.status === "done" || q.status === "pending").length;
    const err = final.filter(q => q.status === "error").length;
    if (ok > 0) {
      fetchMedia(currentPrefix, marker);
      toast.success(`上传完成: ${ok} 个成功${err > 0 ? `，${err} 个失败` : ""}`);
    } else if (err > 0) {
      toast.error(`上传失败: ${err} 个文件均失败`);
    }
    // 3 秒后清除队列
    setTimeout(() => setUploadQueue([]), 3000);
  }, [uploadQueue, uploadPrefix, currentPrefix, marker, fetchMedia]);

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

  // 键盘快捷键：Delete 键删除选中文件（输入框内不触发）
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selected.size > 0 && !deleting) {
          e.preventDefault();
          handleDelete(Array.from(selected));
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, deleting]);

  const filtered = (() => {
    let list = filterType === "all" ? objects : objects.filter(o => o.type === filterType);
    const key = sortBy === "name" ? "key" : sortBy === "size" ? "size" : "lastModified";
    const dir = sortOrder === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      const av = a[key as keyof typeof a] || "";
      const bv = b[key as keyof typeof a] || "";
      if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv) * dir;
      return (Number(av) - Number(bv)) * dir;
    });
    return list;
  })();
  const imageTypes = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"];
  const videoTypes = ["mp4", "webm", "mov", "avi"];
  const allSelected = filtered.length > 0 && selected.size === filtered.length;

  const getIcon = (type: string) => {
    if (imageTypes.includes(type)) return <Image className="w-4 h-4 text-blue-500" />;
    if (videoTypes.includes(type)) return <Film className="w-4 h-4 text-purple-500" />;
    return <File className="w-4 h-4 text-slate-500" />;
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
          <p className="text-sm text-slate-500 mt-1">上传、浏览和管理 OSS 上的图片、视频和文件</p>
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

      {/* Upload Zone */}
      <div
        className={`mb-6 border-2 border-dashed rounded-lg p-4 transition-colors ${isDragging ? "border-orange-500 bg-orange-50" : "border-slate-300 bg-slate-50 hover:border-slate-400"}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex items-end gap-4 flex-wrap">
          <div>
            <div className="text-xs text-slate-500 mb-1">上传目录</div>
            <Select value={uploadPrefix} onValueChange={setUploadPrefix}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {uploadPrefixOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <label className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-slate-300 bg-white cursor-pointer hover:bg-slate-100 transition-colors text-sm text-slate-600">
            <Upload className="w-4 h-4" />
            <span>点击选择文件或拖拽到此处</span>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </label>
          {uploadQueue.some(q => q.status === "pending") && (
            <Button size="sm" onClick={startUploads}>
              上传 ({uploadQueue.filter(q => q.status === "pending").length})
            </Button>
          )}
        </div>

        {/* Upload Queue */}
        {uploadQueue.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {uploadQueue.map((q, i) => (
              <div key={i} className="flex items-center gap-2 text-sm p-1.5 rounded bg-white border border-slate-200">
                {q.status === "uploading" ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin" /> :
                 q.status === "done"     ? <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 13l4 4L19 7" /></svg> :
                 q.status === "error"    ? <X className="w-4 h-4 text-red-500" /> :
                                           <File className="w-4 h-4 text-slate-400" />}
                <span className="flex-1 truncate text-slate-700">{q.file.name}</span>
                <span className="text-xs text-slate-400">
                  {q.status === "pending" ? "等待中" :
                   q.status === "uploading" ? "上传中…" :
                   q.status === "done" ? "完成" :
                   `失败: ${q.error}`}
                </span>
                {(q.status === "done" || q.status === "error") && (
                  <button onClick={() => removeFromQueue(i)} className="p-0.5 hover:bg-slate-200 rounded"><X className="w-3 h-3" /></button>
                )}
              </div>
            ))}
          </div>
        )}
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
        <span className="text-xs text-slate-400 whitespace-nowrap">排序</span>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="name">文件名</SelectItem>
            <SelectItem value="size">大小</SelectItem>
            <SelectItem value="date">日期</SelectItem>
          </SelectContent>
        </Select>
        <button
          onClick={() => setSortOrder(o => o === "asc" ? "desc" : "asc")}
          className="p-2 rounded border border-slate-300 bg-white hover:bg-slate-100 transition-colors text-slate-600"
          title={sortOrder === "asc" ? "切换降序" : "切换升序"}
        >
          {sortOrder === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
        </button>
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
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 p-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">该路径下没有媒体文件</div>
        ) : (
          <>
            {/* Selection Bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50">
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="w-3.5 h-3.5 accent-orange-600"
                />
                全选 ({filtered.length})
              </label>
              {selected.size > 0 && (
                <span className="text-xs text-orange-600 font-medium">已选择 {selected.size} 个文件</span>
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 p-3">
              {filtered.map((obj) => {
                const isSelected = selected.has(obj.key);
                return (
                  <div
                    key={obj.key}
                    onClick={() => toggleSelect(obj.key)}
                    className={`group relative bg-slate-50 rounded-lg border overflow-hidden hover:shadow-md transition-all cursor-pointer ${isSelected ? "border-orange-500 ring-2 ring-orange-200" : "border-slate-200"}`}
                  >
                    {/* Checkbox */}
                    <div className={`absolute top-1.5 left-1.5 z-10 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? "bg-orange-600 border-orange-600" : "bg-white/90 border-slate-300 group-hover:border-orange-400"}`}>
                      {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>

                    {/* Preview */}
                    <div className="aspect-square flex items-center justify-center bg-slate-100 overflow-hidden">
                      {imageTypes.includes(obj.type) ? (
                        <img
                          src={getImageThumb(obj.url, 200)}
                          alt={obj.key}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                            (e.target as HTMLImageElement).parentElement!.classList.add("flex", "items-center", "justify-center");
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-slate-400">
                          {getIcon(obj.type)}
                          <span className="text-[10px] font-mono">.{obj.type}</span>
                        </div>
                      )}
                    </div>

                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                      {imageTypes.includes(obj.type) && (
                        <a href={obj.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                          className="p-1.5 bg-white rounded-full hover:bg-orange-100 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5 text-slate-700" />
                        </a>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); handleCopyUrl(obj.url); }}
                        className="p-1.5 bg-white rounded-full hover:bg-orange-100 transition-colors">
                        <Copy className="w-3.5 h-3.5 text-slate-700" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete([obj.key]); }}
                        className="p-1.5 bg-white rounded-full hover:bg-red-100 transition-colors">
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      </button>
                    </div>

                    {/* Info */}
                    <div className="p-1.5">
                      <div className="text-[10px] text-slate-600 truncate leading-tight" title={obj.key.split("/").pop()}>
                        {obj.key.split("/").pop()}
                      </div>
                      <div className="text-[10px] text-slate-400">{formatSize(obj.size)}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <div className="text-xs text-slate-500">
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