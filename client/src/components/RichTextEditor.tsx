import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { toast } from "sonner";

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    onImageUpload?: (file: File) => Promise<string>;
    placeholder?: string;
    modules?: any;
    className?: string;
    theme?: string;
}

export default function RichTextEditor({ value, onChange, onImageUpload, placeholder, modules, className, theme = "snow" }: RichTextEditorProps) {
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
                        ['link', 'image'],
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
                                // 保存当前选区（焦点还在编辑器内）
                                const savedRange = quill.getSelection(true);
                                const url = await onImageUpload(file);
                                // 恢复焦点并插入图片
                                quill.focus();
                                const insertIndex = savedRange?.index ?? quill.getLength();
                                quill.insertEmbed(insertIndex, 'image', url);
                                // 将光标移动到图片后
                                quill.setSelection(insertIndex + 1, 0);
                                // 立即触发 onChange 确保状态同步
                                isUpdatingRef.current = true;
                                onChangeRef.current(quill.root.innerHTML);
                                // 延迟重置标志，确保外部状态更新完成
                                setTimeout(() => { isUpdatingRef.current = false; }, 100);
                            } catch (error) {
                                toast.error("图片上传失败");
                            }
                        }
                    };
                });
            }

            // Handle Paste and Drop
            const handleImageInsert = async (file: File, insertRange?: { index: number; length: number } | null) => {
                if (!onImageUpload) return;
                try {
                    const url = await onImageUpload(file);
                    const index = insertRange?.index ?? quill.getSelection(true)?.index ?? quill.getLength();
                    quill.insertEmbed(index, 'image', url);
                    // 将光标移动到图片后
                    quill.setSelection(index + 1, 0);
                    // 立即触发 onChange 确保状态同步
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
                                // 保存当前选区位置
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
                            // 获取放置位置
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
    }, []); // Run once on mount

    // Handle updates from parent (when value is actually different and not during editing)
    useEffect(() => {
        if (quillRef.current && !isUpdatingRef.current) {
            const currentHtml = quillRef.current.root.innerHTML;
            const newValue = value || "";
            // Only update if content is significantly different (avoid overwriting user edits)
            if (newValue !== currentHtml) {
                // Check if the difference is just whitespace or minor formatting
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
        </div>
    );
}

