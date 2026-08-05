import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { X, Image as ImageIcon, RefreshCw, ChevronLeft, ChevronRight, FolderOpen } from "lucide-react";

interface MediaObject {
  key: string;
  url: string;
  size: number;
  lastModified: string;
  type: string;
}

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

/**
 * 媒体库图片选择器 - 从 OSS 选择已上传的图片
 */
export function MediaPicker({ open, onClose, onSelect }: MediaPickerProps) {
  const [objects, setObjects] = useState<MediaObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [prefix, setPrefix] = useState("");
  const [currentPrefix, setCurrentPrefix] = useState("");
  const [marker, setMarker] = useState<string | null>(null);
  const [nextMarker, setNextMarker] = useState<string | null>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const imageTypes = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"];

  const fetchMedia = useCallback(async (p: string, m: string | null) => {
    setLoading(true);
    try {
      const res = await api.get("/media", { params: { prefix: p, marker: m || undefined, maxKeys: 60 } });
      setObjects(res.data.objects || []);
      setNextMarker(res.data.nextMarker);
      setIsTruncated(res.data.isTruncated);
      setCurrentPrefix(p);
    } catch (e: any) {
      toast.error("加载媒体失败: " + (e.message || "未知错误"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setSelected(null);
      fetchMedia("", null);
    }
  }, [open, fetchMedia]);

  if (!open) return null;

  const images = objects.filter(o => imageTypes.includes(o.type));

  const handleConfirm = () => {
    if (!selected) return;
    onSelect(selected);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col m-4" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-slate-900">从媒体库选择图片</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchMedia(currentPrefix, null)}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> 刷新
            </Button>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100">
          <div className="flex-1 relative">
            <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="按路径筛选 (如: news/, avatar/)"
              value={prefix}
              onChange={e => setPrefix(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (setMarker(null), fetchMedia(prefix, null))}
              className="pl-10"
            />
          </div>
          <Button variant="secondary" size="sm" onClick={() => { setMarker(null); fetchMedia(prefix, null); }}>
            筛选
          </Button>
        </div>

        {/* Breadcrumb */}
        <div className="text-xs text-slate-500 px-6 py-2">
          当前路径: <span className="font-mono text-slate-700">{currentPrefix || "(根目录)"}</span>
          {currentPrefix && (
            <button onClick={() => { setMarker(null); fetchMedia("", null); }} className="ml-2 text-orange-600 hover:underline">
              回到根目录
            </button>
          )}
        </div>

        {/* Image Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              该路径下没有图片
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((obj) => (
                <div
                  key={obj.key}
                  onClick={() => setSelected(obj.url)}
                  className={`relative aspect-square rounded-lg border overflow-hidden cursor-pointer transition-all group ${
                    selected === obj.url
                      ? "border-orange-500 ring-2 ring-orange-200"
                      : "border-slate-200 hover:border-orange-300"
                  }`}
                >
                  <img
                    src={obj.url}
                    alt={obj.key}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                    <div className="text-[10px] text-white truncate">{obj.key.split("/").pop()}</div>
                    <div className="text-[10px] text-white/70">{formatSize(obj.size)}</div>
                  </div>
                  {selected === obj.url && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-orange-600 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
          <div className="text-sm text-slate-500">
            {images.length} 张图片
            {isTruncated && " (还有更多)"}
          </div>
          <div className="flex items-center gap-2">
            {marker && (
              <Button variant="outline" size="sm" onClick={() => { setMarker(null); fetchMedia(currentPrefix, null); }}>
                <ChevronLeft className="w-4 h-4 mr-1" /> 上一页
              </Button>
            )}
            {isTruncated && (
              <Button variant="outline" size="sm" onClick={() => nextMarker && fetchMedia(currentPrefix, nextMarker)}>
                下一页 <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onClose}>
              取消
            </Button>
            <Button size="sm" className="bg-orange-600 hover:bg-orange-700" disabled={!selected} onClick={handleConfirm}>
              插入图片
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}