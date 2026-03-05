import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { toast } from "sonner";

// 视频 URL 解析函数
const parseVideoUrl = (url: string) => {
    if (!url) return null;

    // YouTube 链接解析
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (youtubeMatch) {
        return {
            type: 'youtube' as const,
            id: youtubeMatch[1],
            embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`
        };
    }

    // B 站链接解析
    const bilibiliMatch = url.match(/bilibili\.com\/video\/(BV[\w]+)|(av[\d]+)/);
    if (bilibiliMatch) {
        const bvid = bilibiliMatch[1] || bilibiliMatch[2];
        return {
            type: 'bilibili' as const,
            id: bvid,
            embedUrl: `https://player.bilibili.com/player.html?bvid=${bvid}&high_quality=1`
        };
    }

    // MP4 直接链接或其他视频格式
    if (url.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) {
        return {
            type: 'mp4' as const,
            url: url
        };
    }

    // 默认作为 mp4 处理
    return {
        type: 'mp4' as const,
        url: url
    };
};

// 定义并注册自定义 Video Blot（在组件外部执行，避免重复注册）
const registerVideoBlot = () => {
    const BlockEmbed = (Quill as any).import('blots/block/embed');

    class VideoBlot extends BlockEmbed {
        static create(url: string) {
            const node = super.create() as HTMLElement;

            // 解析视频 URL
            const video = parseVideoUrl(url);

            if (video?.type === 'youtube') {
                const iframe = document.createElement('iframe');
                iframe.setAttribute('src', video.embedUrl);
                iframe.setAttribute('frameborder', '0');
                iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
                iframe.setAttribute('allowfullscreen', 'true');
                iframe.className = 'ql-video';
                iframe.setAttribute('data-url', url);
                node.appendChild(iframe);
            } else if (video?.type === 'bilibili') {
                const iframe = document.createElement('iframe');
                iframe.setAttribute('src', video.embedUrl);
                iframe.setAttribute('frameborder', '0');
                iframe.setAttribute('allowfullscreen', 'true');
                iframe.setAttribute('scrolling', 'no');
                iframe.setAttribute('border', '0');
                iframe.setAttribute('framespacing', '0');
                iframe.setAttribute('high_quality', '1');
                iframe.setAttribute('danmaku', '0');
                iframe.className = 'ql-video';
                iframe.setAttribute('data-url', url);
                node.appendChild(iframe);
            } else {
                // MP4 或其他视频格式
                const videoEl = document.createElement('video');
                videoEl.setAttribute('src', url);
                videoEl.setAttribute('controls', 'true');
                videoEl.className = 'ql-video';
                videoEl.setAttribute('data-url', url);
                const text = document.createElement('p');
                text.textContent = '您的浏览器不支持视频播放。';
                videoEl.appendChild(text);
                node.appendChild(videoEl);
            }

            return node;
        }

        static value(node: HTMLElement) {
            const video = node.querySelector('video, iframe');
            return video?.getAttribute('data-url') || node.getAttribute('data-url') || '';
        }
    }

    VideoBlot.blotName = 'video';
    VideoBlot.className = 'ql-video-wrapper';
    VideoBlot.tagName = 'div';

    (Quill as any).register(VideoBlot, true);
};

// 只注册一次
let blotRegistered = false;
if (!blotRegistered) {
    registerVideoBlot();
    blotRegistered = true;
}

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    onImageUpload?: (file: File) => Promise<string>;
    onVideoUpload?: (file: File) => Promise<string>;
    placeholder?: string;
    modules?: any;
    className?: string;
    theme?: string;
}

export default function RichTextEditor({ value, onChange, onImageUpload, onVideoUpload, placeholder, modules, className, theme = "snow" }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<Quill | null>(null);
    const onChangeRef = useRef(onChange);
    const isUpdatingRef = useRef(false);

    // 保持 onChange 引用最新
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        if (editorRef.current && !quillRef.current) {
            const quill = new Quill(editorRef.current, {
                theme,
                placeholder: placeholder || "Compose...",
                modules: modules || {
                    toolbar: [
                        [{ header: [1, 2, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['link', 'image', 'video'],
                        ['clean'],
                    ],
                },
            });

            // Handle toolbar image button
            if (onImageUpload) {
                const toolbar = quill.getModule('toolbar') as any;
                toolbar.addHandler('image', () => {
                    const input = document.createElement('input');
                    input.setAttribute('type', 'file');
                    input.setAttribute('accept', 'image/*');
                    input.click();
                    input.onchange = async () => {
                        const file = input.files ? input.files[0] : null;
                        if (file) {
                            try {
                                const savedRange = quill.getSelection(true);
                                const url = await onImageUpload(file);
                                quill.focus();
                                const insertIndex = savedRange?.index ?? quill.getLength();
                                quill.insertEmbed(insertIndex, 'image', url);
                                quill.setSelection(insertIndex + 1, 0);
                                isUpdatingRef.current = true;
                                onChangeRef.current(quill.root.innerHTML);
                                setTimeout(() => { isUpdatingRef.current = false; }, 100);
                            } catch (error) {
                                toast.error("图片上传失败");
                            }
                        }
                    };
                });
            }

            // Handle toolbar video button - 支持 URL 输入和文件上传
            const toolbar = quill.getModule('toolbar') as any;
            toolbar.addHandler('video', () => {
                // 创建选择菜单
                const choice = confirm("点击'确定'上传视频文件，点击'取消'输入视频链接");
                if (choice) {
                    // 上传视频文件
                    if (!onVideoUpload) {
                        toast.error("视频上传功能未配置");
                        return;
                    }
                    const input = document.createElement('input');
                    input.setAttribute('type', 'file');
                    input.setAttribute('accept', 'video/*');
                    input.click();
                    input.onchange = async () => {
                        const file = input.files ? input.files[0] : null;
                        if (file) {
                            // 检查文件大小（限制 500MB）
                            if (file.size > 500 * 1024 * 1024) {
                                toast.error("视频文件不能超过 500MB");
                                return;
                            }
                            try {
                                const savedRange = quill.getSelection(true);
                                const url = await onVideoUpload(file);
                                quill.focus();
                                const insertIndex = savedRange?.index ?? quill.getLength();
                                quill.insertEmbed(insertIndex, 'video', url);
                                quill.setSelection(insertIndex + 1, 0);
                                isUpdatingRef.current = true;
                                onChangeRef.current(quill.root.innerHTML);
                                setTimeout(() => { isUpdatingRef.current = false; }, 100);
                            } catch (error) {
                                toast.error("视频上传失败");
                            }
                        }
                    };
                } else {
                    // 输入视频链接
                    const url = prompt("请输入视频链接:\n\n支持格式：\n- MP4 直链\n- YouTube (youtube.com 或 youtu.be)\n- B 站 (bilibili.com)");
                    if (!url) return;

                    const video = parseVideoUrl(url);
                    if (!video) {
                        toast.error("不支持的视频链接格式");
                        return;
                    }

                    const savedRange = quill.getSelection(true);
                    const insertIndex = savedRange?.index ?? quill.getLength();

                    // 使用自定义 blot 插入视频
                    quill.insertEmbed(insertIndex, 'video', url);

                    // 将光标移动到视频后
                    quill.setSelection(insertIndex + 1, 0);
                    isUpdatingRef.current = true;
                    onChangeRef.current(quill.root.innerHTML);
                    setTimeout(() => { isUpdatingRef.current = false; }, 100);
                }
            });

            // Handle Paste and Drop
            const handleImageInsert = async (file: File, insertRange?: { index: number; length: number } | null) => {
                if (!onImageUpload) return;
                try {
                    const url = await onImageUpload(file);
                    const index = insertRange?.index ?? quill.getSelection(true)?.index ?? quill.getLength();
                    quill.insertEmbed(index, 'image', url);
                    quill.setSelection(index + 1, 0);
                    isUpdatingRef.current = true;
                    onChangeRef.current(quill.root.innerHTML);
                    setTimeout(() => { isUpdatingRef.current = false; }, 100);
                } catch (error) {
                    toast.error("粘贴图片上传失败");
                }
            };

            quill.root.addEventListener('paste', (e: ClipboardEvent) => {
                const items = e.clipboardData?.items;
                if (items) {
                    for (let i = 0; i < items.length; i++) {
                        if (items[i].type.indexOf('image') !== -1) {
                            const file = items[i].getAsFile();
                            if (file) {
                                e.preventDefault();
                                const range = quill.getSelection(true);
                                handleImageInsert(file, range);
                            }
                        }
                    }
                }
            });

            quill.root.addEventListener('drop', (e: DragEvent) => {
                const files = e.dataTransfer?.files;
                if (files && files.length > 0) {
                    for (let i = 0; i < files.length; i++) {
                        if (files[i].type.indexOf('image') !== -1) {
                            e.preventDefault();
                            const range = quill.getSelection(true);
                            handleImageInsert(files[i], range);
                        }
                    }
                }
            });

            quill.on("text-change", (delta, oldDelta, source) => {
                if (source === 'user') {
                    onChangeRef.current(quill.root.innerHTML);
                }
            });

            quillRef.current = quill;

            // Initial value
            if (value) {
                quill.root.innerHTML = value;
            }
        }
    }, []);

    // Handle updates from parent
    useEffect(() => {
        if (quillRef.current && !isUpdatingRef.current) {
            const currentHtml = quillRef.current.root.innerHTML;
            const newValue = value || "";
            if (newValue !== currentHtml) {
                const normalizedCurrent = currentHtml.replace(/\s+/g, ' ').trim();
                const normalizedNew = newValue.replace(/\s+/g, ' ').trim();
                if (normalizedCurrent !== normalizedNew) {
                    quillRef.current.root.innerHTML = newValue;
                }
            }
        }
    }, [value]);

    return (
        <div className={className}>
            <div ref={editorRef} className="h-full bg-white text-black" style={{ minHeight: '300px' }} />
            <style>{`
                .ql-video-wrapper {
                    position: relative;
                    margin: 16px 0;
                }
                .ql-video {
                    width: 100%;
                    aspect-ratio: 16 / 9;
                    border-radius: 8px;
                }
                .ql-video-wrapper video.ql-video {
                    background: #000;
                }
            `}</style>
        </div>
    );
}
