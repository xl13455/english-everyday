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
    example: "",
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
    (first.includes("word") && first.includes("meaning"))
  );
}

export function parseVocabFileText(text: string): VocabItem[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const start = isVocabHeaderLine(lines[0]) ? 1 : 0;
  const items: VocabItem[] = [];

  for (let i = start; i < lines.length; i++) {
    const cols = splitVocabLine(lines[i]);
    if (cols.length < 2) continue;

    let word = "";
    let pos = "";
    let phonetic = "";
    let meaning = "";
    let example = "";

    if (cols.length >= 5) {
      [word, pos, phonetic, meaning, example] = cols;
    } else if (cols.length === 4) {
      const second = cols[1];
      const looksLikePos =
        /^(n\.?|v\.?|vt\.?|vi\.?|adj\.?|adv\.?|prep\.?|conj\.?|phr\.?|noun|verb|adjective|adverb)$/i.test(
          second,
        ) || second.endsWith(".");
      if (looksLikePos) {
        [word, pos, meaning, example] = cols;
      } else {
        [word, phonetic, meaning, example] = cols;
      }
    } else if (cols.length === 3) {
      [word, pos, meaning] = cols;
      if (!/^(n\.?|v\.?|adj\.?|adv\.?)/i.test(pos) && !pos.endsWith(".")) {
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
      example: example.trim() || undefined,
    });
  }

  return items;
}

export const VOCAB_FILE_TEMPLATE = `单词,词性,音标,释义,例句
resilience,n.,/rɪˈzɪliəns/,韧性；恢复力,Mental resilience helps students cope with exam stress.
underscore,v.,/ˌʌndərˈskɔːr/,强调；突出,The data underscore the importance of early preparation.
`;
