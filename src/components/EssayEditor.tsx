"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { isEssayHtml, toEssayEditorContent } from "@/lib/essay-html";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
};

function editorToStored(editor: NonNullable<ReturnType<typeof useEditor>>) {
  return editor.isEmpty ? "" : editor.getHTML();
}

export function EssayEditor({
  label,
  value,
  onChange,
  placeholder = "在此输入…",
  minHeight = 140,
}: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        code: false,
      }),
    ],
    content: toEssayEditorContent(value),
    editorProps: {
      attributes: {
        class: "essay-editor__content",
        "data-placeholder": placeholder,
      },
    },
    onCreate: ({ editor: ed }) => {
      // 历史纯文本载入后升级为 HTML；延后更新避免渲染中 setState 导致白屏
      if (value && !isEssayHtml(value)) {
        const html = editorToStored(ed);
        queueMicrotask(() => onChange(html));
      }
    },
    onUpdate: ({ editor: ed }) => {
      onChange(editorToStored(ed));
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editorToStored(editor);
    if (current === value) return;
    if (!value && editor.isEmpty) return;
    editor.commands.setContent(toEssayEditorContent(value), {
      emitUpdate: false,
    });
  }, [value, editor]);

  return (
    <div className="form-row">
      <span className="form-label">{label}</span>
      <div className="essay-editor" style={{ minHeight }}>
        <div className="essay-editor__toolbar">
          <button
            type="button"
            className="essay-editor__tool"
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            粗体
          </button>
          <button
            type="button"
            className="essay-editor__tool"
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            斜体
          </button>
          <button
            type="button"
            className="essay-editor__tool"
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            列表
          </button>
          <button
            type="button"
            className="essay-editor__tool"
            disabled={!editor}
            onClick={() => editor?.chain().focus().undo().run()}
          >
            撤销
          </button>
          <button
            type="button"
            className="essay-editor__tool"
            disabled={!editor}
            onClick={() => editor?.chain().focus().redo().run()}
          >
            重做
          </button>
          <span className="essay-editor__tip">
            回车换段 · 格式会随保存保留
          </span>
        </div>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
