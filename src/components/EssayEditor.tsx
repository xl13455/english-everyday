"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
};

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** 纯文本（含换行）→ TipTap HTML */
function textToHtml(text: string) {
  if (!text) return "<p></p>";
  return text
    .split("\n")
    .map((line) => (line ? `<p>${escapeHtml(line)}</p>` : "<p></p>"))
    .join("");
}

function editorToText(editor: NonNullable<ReturnType<typeof useEditor>>) {
  return editor.getText({ blockSeparator: "\n" });
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
        bulletList: false,
        orderedList: false,
        listItem: false,
        code: false,
      }),
    ],
    content: textToHtml(value),
    editorProps: {
      attributes: {
        class: "essay-editor__content",
        "data-placeholder": placeholder,
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(editorToText(ed));
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editorToText(editor);
    if (value === current) return;
    editor.commands.setContent(textToHtml(value), { emitUpdate: false });
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
          <span className="essay-editor__tip">回车换段 · 适合粘贴与长文编辑</span>
        </div>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
