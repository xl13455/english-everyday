"use client";

import { useRef, useState, type ChangeEvent } from "react";
import type { VocabDraftItem } from "@/lib/types";
import {
  VOCAB_FILE_TEMPLATE,
  createEmptyVocabDraft,
  parseVocabFileText,
  toVocabDraftItems,
} from "@/lib/vocab-utils";

type Props = {
  items: VocabDraftItem[];
  onChange: (items: VocabDraftItem[]) => void;
};

export function VocabEditor({ items, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  function updateItem(
    key: string,
    field: keyof Omit<VocabDraftItem, "key">,
    value: string,
  ) {
    onChange(
      items.map((item) =>
        item.key === key ? { ...item, [field]: value } : item,
      ),
    );
  }

  function removeItem(key: string) {
    if (items.length <= 1) {
      onChange([createEmptyVocabDraft()]);
      return;
    }
    onChange(items.filter((item) => item.key !== key));
  }

  function addItem() {
    onChange([...items, createEmptyVocabDraft()]);
  }

  function downloadTemplate() {
    const blob = new Blob([VOCAB_FILE_TEMPLATE], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vocab-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = parseVocabFileText(text);
      if (parsed.length === 0) {
        setImportMsg("未解析到有效生词，请检查文件格式。");
        return;
      }
      const ok = window.confirm(
        `将用文件中的 ${parsed.length} 条生词「全部覆盖」当前列表，是否继续？`,
      );
      if (!ok) return;
      onChange(toVocabDraftItems(parsed));
      setImportMsg(`已导入 ${parsed.length} 条，已覆盖原列表。记得点保存。`);
    } catch {
      setImportMsg("读取文件失败，请重试。");
    }
  }

  return (
    <div className="vocab-editor">
      <div className="vocab-editor__toolbar">
        <span className="form-label">生词列表 · {items.length} 条</span>
        <div className="vocab-editor__actions">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={downloadTemplate}
          >
            下载模板
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => fileRef.current?.click()}
          >
            文件批量导入
          </button>
          <button type="button" className="btn btn--secondary" onClick={addItem}>
            + 添加生词
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.csv,.tsv,text/plain,text/csv"
            hidden
            onChange={onFileChange}
          />
        </div>
      </div>

      <p className="form-hint">
        批量导入会<strong>全部覆盖</strong>当前列表。格式：每行
        <code>单词|词性|音标|释义|例句</code>
        ，也支持逗号 / Tab；可用「下载模板」参考。
      </p>
      {importMsg ? <p className="form-hint form-hint--banner">{importMsg}</p> : null}

      <div className="vocab-editor__list">
        {items.map((item, index) => (
          <div key={item.key} className="vocab-editor__card">
            <div className="vocab-editor__card-head">
              <span className="vocab-editor__index">#{index + 1}</span>
              <button
                type="button"
                className="btn btn--text vocab-editor__remove"
                onClick={() => removeItem(item.key)}
              >
                删除
              </button>
            </div>
            <div className="vocab-editor__grid">
              <label className="form-row">
                <span className="form-label">单词</span>
                <input
                  className="field"
                  value={item.word}
                  onChange={(e) => updateItem(item.key, "word", e.target.value)}
                  placeholder="resilience"
                  required
                />
              </label>
              <label className="form-row">
                <span className="form-label">词性</span>
                <input
                  className="field"
                  value={item.pos ?? ""}
                  onChange={(e) => updateItem(item.key, "pos", e.target.value)}
                  placeholder="n. / v. / adj. / adv."
                  list="vocab-pos-suggestions"
                />
              </label>
              <label className="form-row">
                <span className="form-label">音标（可选）</span>
                <input
                  className="field"
                  value={item.phonetic ?? ""}
                  onChange={(e) =>
                    updateItem(item.key, "phonetic", e.target.value)
                  }
                  placeholder="/rɪˈzɪliəns/"
                />
              </label>
              <label className="form-row">
                <span className="form-label">释义</span>
                <input
                  className="field"
                  value={item.meaning}
                  onChange={(e) =>
                    updateItem(item.key, "meaning", e.target.value)
                  }
                  placeholder="韧性；恢复力"
                  required
                />
              </label>
              <label className="form-row vocab-editor__full">
                <span className="form-label">例句（可选）</span>
                <input
                  className="field"
                  value={item.example ?? ""}
                  onChange={(e) =>
                    updateItem(item.key, "example", e.target.value)
                  }
                  placeholder="Mental resilience helps students cope with exam stress."
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="btn btn--secondary" onClick={addItem}>
        + 再加一条
      </button>

      <datalist id="vocab-pos-suggestions">
        <option value="n." />
        <option value="v." />
        <option value="vt." />
        <option value="vi." />
        <option value="adj." />
        <option value="adv." />
        <option value="prep." />
        <option value="conj." />
        <option value="phr." />
      </datalist>
    </div>
  );
}
