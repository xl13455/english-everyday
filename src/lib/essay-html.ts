/** 判断是否为富文本 HTML（兼容历史纯文本）。 */
export function isEssayHtml(value: string) {
  return /<\/?(?:p|br|strong|em|u|s|ul|ol|li|b|i)\b/i.test(value);
}

/** 纯文本（含换行）→ 段落 HTML */
export function plainTextToEssayHtml(text: string) {
  if (!text) return "<p></p>";
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) =>
      line
        ? `<p>${escapeHtml(line)}</p>`
        : "<p></p>",
    )
    .join("");
}

export function toEssayEditorContent(value: string) {
  if (!value) return "<p></p>";
  if (isEssayHtml(value)) return value;
  return plainTextToEssayHtml(value);
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * 仅保留范文编辑器允许的标签，去掉脚本与事件属性。
 */
export function sanitizeEssayHtml(input: string) {
  if (!input) return "";
  if (!isEssayHtml(input)) {
    return plainTextToEssayHtml(input);
  }

  if (typeof window === "undefined") {
    return input
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "")
      .replace(/\son\w+\s*=\s*[^\s>]+/gi, "");
  }

  const template = document.createElement("template");
  template.innerHTML = input;
  const allowed = new Set([
    "P",
    "BR",
    "STRONG",
    "EM",
    "U",
    "S",
    "B",
    "I",
    "UL",
    "OL",
    "LI",
  ]);

  function walk(node: Node) {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        if (!allowed.has(el.tagName)) {
          el.replaceWith(...Array.from(el.childNodes));
          continue;
        }
        for (const attr of Array.from(el.attributes)) {
          el.removeAttribute(attr.name);
        }
        if (el.tagName === "B") {
          const strong = document.createElement("strong");
          strong.innerHTML = el.innerHTML;
          el.replaceWith(strong);
          walk(strong);
          continue;
        }
        if (el.tagName === "I") {
          const em = document.createElement("em");
          em.innerHTML = el.innerHTML;
          el.replaceWith(em);
          walk(em);
          continue;
        }
        walk(el);
      } else if (child.nodeType === Node.COMMENT_NODE) {
        child.parentNode?.removeChild(child);
      }
    }
  }

  walk(template.content);
  return template.innerHTML;
}
