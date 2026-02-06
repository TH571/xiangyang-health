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
                                const url = await onImageUpload(file);
                                const range = quill.getSelection();
                                quill.insertEmbed(range?.index || 0, 'image', url);
                            } catch (error) {
                                toast.error("图片上传失败");
                            }
                        }
                    };
                });
            }

            // Handle Paste and Drop
            const handleImageInsert = async (file: File) => {
                if (!onImageUpload) return;
                try {
                    const url = await onImageUpload(file);
                    const range = quill.getSelection();
                    quill.insertEmbed(range?.index || 0, 'image', url);
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
                                handleImageInsert(file);
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
                            handleImageInsert(files[i]);
                        }
                    }
                }
            });

            quill.on("text-change", (delta, oldDelta, source) => {
                if (source === 'user') {
                    onChange(quill.root.innerHTML);
                }
            });

            quillRef.current = quill;

            // Initial value
            if (value) {
                quill.root.innerHTML = value;
            }
        }
    }, []); // Run once on mount

    // Handle updates from parent
    useEffect(() => {
        if (quillRef.current && value !== quillRef.current.root.innerHTML) {
            quillRef.current.root.innerHTML = value || "";
        }
    }, [value]);

    return (
        <div className={className}>
            <div ref={editorRef} className="h-full bg-white text-black" style={{ minHeight: '300px' }} />
        </div>
    );
}

