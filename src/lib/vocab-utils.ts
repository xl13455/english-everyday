import type { VocabDraftItem, VocabItem } from "./types";

export function toVocabDraftItems(items: VocabItem[]): VocabDraftItem[] {
  return items.map((item, index) => ({
    ...item,
    key: `${item.word}-${index}-${Math.random().toString(36).slice(2, 6)}`,
  }));
}

export function createEmptyVocabDraft(): VocabDraftItem {
  return {
    key: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    word: "",
    pos: "",
    phonetic: "",
    meaning: "",
    word_family: "",
    collocation: "",
    discrimination: "",
    example: "",
    example_zh: "",
  };
}

function splitVocabLine(line: string): string[] {
  if (line.includes("\t")) {
    return line.split("\t").map((s) => s.trim());
  }
  if (line.includes("|")) {
    return line.split("|").map((s) => s.trim());
  }
  return line.split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
}

function isVocabHeaderLine(line: string): boolean {
  const first = splitVocabLine(line).map((s) => s.toLowerCase());
  return (
    first[0] === "word" ||
    first[0] === "单词" ||
    first.includes("词性") ||
    first.includes("搭配") ||
    first.includes("词族") ||
    first.includes("辨析") ||
    (first.includes("word") && first.includes("meaning"))
  );
}

function looksLikePos(value: string): boolean {
  return (
    /^(n\.?|v\.?|vt\.?|vi\.?|adj\.?|adv\.?|prep\.?|conj\.?|phr\.?|noun|verb|adjective|adverb)$/i.test(
      value,
    ) || value.endsWith(".")
  );
}

function headerIndex(header: string[], ...names: string[]): number {
  for (const name of names) {
    const i = header.indexOf(name.toLowerCase());
    if (i >= 0) return i;
  }
  return -1;
}

export function parseVocabFileText(text: string): VocabItem[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const start = isVocabHeaderLine(lines[0]) ? 1 : 0;
  const header =
    start === 1 ? splitVocabLine(lines[0]).map((s) => s.toLowerCase()) : [];
  const items: VocabItem[] = [];

  for (let i = start; i < lines.length; i++) {
    const cols = splitVocabLine(lines[i]);
    if (cols.length < 2) continue;

    let word = "";
    let pos = "";
    let phonetic = "";
    let meaning = "";
    let word_family = "";
    let collocation = "";
    let discrimination = "";
    let example = "";
    let example_zh = "";

    // 新格式：单词|词性|音标|释义|词族|搭配|辨析|例句|例句中文
    if (cols.length >= 9) {
      [
        word,
        pos,
        phonetic,
        meaning,
        word_family,
        collocation,
        discrimination,
        example,
        example_zh,
      ] = cols;
    } else if (
      header.length >= 7 &&
      (headerIndex(header, "词族", "word_family") >= 0 ||
        headerIndex(header, "辨析", "discrimination") >= 0)
    ) {
      const h = header;
      const get = (names: string[]) => {
        const idx = headerIndex(h, ...names);
        return idx >= 0 ? cols[idx] || "" : "";
      };
      word = get(["单词", "word"]);
      pos = get(["词性", "pos"]);
      phonetic = get(["音标", "phonetic"]);
      meaning = get(["释义", "meaning"]);
      word_family = get(["词族", "word_family"]);
      collocation = get(["搭配", "collocation"]);
      discrimination = get(["辨析", "discrimination"]);
      example = get(["例句", "example"]);
      example_zh = get(["例句中文", "example_zh"]);
    } else if (cols.length >= 8) {
      // 兼容上一版：单词|词性|音标|释义|词族|搭配|例句|例句中文
      [
        word,
        pos,
        phonetic,
        meaning,
        word_family,
        collocation,
        example,
        example_zh,
      ] = cols;
    } else if (cols.length >= 7) {
      // 兼容：单词|词性|音标|释义|搭配|例句|例句中文
      [word, pos, phonetic, meaning, collocation, example, example_zh] = cols;
    } else if (
      cols.length === 6 &&
      (header.includes("搭配") || header.includes("collocation"))
    ) {
      [word, pos, phonetic, meaning, collocation, example] = cols;
    } else if (
      cols.length === 6 &&
      (header.includes("例句中文") || header.includes("example_zh"))
    ) {
      [word, pos, phonetic, meaning, example, example_zh] = cols;
    } else if (cols.length >= 5) {
      [word, pos, phonetic, meaning, example] = cols;
    } else if (cols.length === 4) {
      const second = cols[1];
      if (looksLikePos(second)) {
        [word, pos, meaning, example] = cols;
      } else {
        [word, phonetic, meaning, example] = cols;
      }
    } else if (cols.length === 3) {
      [word, pos, meaning] = cols;
      if (!looksLikePos(pos) && !pos.endsWith(".")) {
        phonetic = pos;
        pos = "";
      }
    } else {
      [word, meaning] = cols;
    }

    word = word.trim();
    meaning = meaning.trim();
    if (!word || !meaning) continue;

    items.push({
      word,
      pos: pos.trim() || undefined,
      phonetic: phonetic.trim() || undefined,
      meaning,
      word_family: word_family.trim() || undefined,
      collocation: collocation.trim() || undefined,
      discrimination: discrimination.trim() || undefined,
      example: example.trim() || undefined,
      example_zh: example_zh.trim() || undefined,
    });
  }

  return items;
}

export const VOCAB_FILE_TEMPLATE = `单词|词性|音标|释义|词族|搭配|辨析|例句|例句中文
resilience|n.|/rɪˈzɪliəns/|韧性；恢复力|resilient / resist|mental resilience 心理韧性；build resilience 培养抗压能力||Mental resilience helps students cope with exam stress.|心理韧性帮助学生应对考试压力。
indicate|v.|/ˈɪndɪkeɪt/|表明；显示|indication n.|figures indicate 数据表明|indicate=客观显示；imply=暗含言外之意|Figures indicate rising demand.|数据表明需求在上升。
`;
