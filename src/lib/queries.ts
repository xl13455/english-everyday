import type { PoolConnection } from "mysql2/promise";
import { YEARS, type SectionType } from "./constants";
import { getPool, type ResultSetHeader, type RowDataPacket } from "./db";
import type {
  EssayContent,
  EssayFormValues,
  VocabDraftItem,
  VocabItem,
  YearContent,
  YearSummary,
} from "./types";
import { createEmptyVocabDraft, toVocabDraftItems } from "./vocab-utils";

type SectionRow = RowDataPacket & { id: number; year: number; type: SectionType };
type VocabRow = RowDataPacket & {
  word: string;
  pos: string | null;
  phonetic: string | null;
  meaning: string;
  example: string | null;
};
type EssayRow = RowDataPacket & {
  id: number;
  prompt: string;
  draft: string;
  revised: string;
  notes: string | null;
  video_url: string | null;
};
type MediaRow = RowDataPacket & {
  id: number;
  kind: "image" | "video" | "draft";
  mime_type: string;
  filename: string;
  data: Buffer;
};

type Queryable = PoolConnection | ReturnType<typeof getPool>;

async function ensureYear(year: number, db: Queryable = getPool()) {
  await db.execute("INSERT IGNORE INTO exam_year (year) VALUES (?)", [year]);
}

async function getOrCreateSection(
  year: number,
  type: SectionType,
  db: Queryable = getPool(),
): Promise<number> {
  await ensureYear(year, db);
  const [rows] = await db.execute<SectionRow[]>(
    "SELECT id FROM section WHERE year = ? AND type = ? LIMIT 1",
    [year, type],
  );
  if (rows[0]) return Number(rows[0].id);

  const [result] = await db.execute<ResultSetHeader>(
    "INSERT INTO section (year, type) VALUES (?, ?)",
    [year, type],
  );
  return Number(result.insertId);
}

export async function ensureAllYears() {
  const pool = getPool();
  for (const year of YEARS) {
    await ensureYear(year, pool);
  }
}

export async function listYearSummaries(): Promise<YearSummary[]> {
  const pool = getPool();
  await ensureAllYears();

  const byYear = new Map<number, YearSummary>();
  for (const year of YEARS) {
    byYear.set(year, {
      year,
      status: { vocab: false, small_essay: false, big_essay: false },
      filled: 0,
      total: 3,
    });
  }

  const [vocabYears] = await pool.execute<RowDataPacket[]>(
    `SELECT DISTINCT s.year
     FROM section s
     INNER JOIN vocab_item v ON v.section_id = s.id
     WHERE s.type = 'vocab'`,
  );
  const [essayYears] = await pool.execute<RowDataPacket[]>(
    `SELECT s.year, s.type
     FROM section s
     INNER JOIN essay e ON e.section_id = s.id`,
  );

  for (const row of vocabYears) {
    const item = byYear.get(Number(row.year));
    if (item) item.status.vocab = true;
  }
  for (const row of essayYears) {
    const item = byYear.get(Number(row.year));
    if (!item) continue;
    if (row.type === "small_essay") item.status.small_essay = true;
    if (row.type === "big_essay") item.status.big_essay = true;
  }

  return YEARS.map((year) => {
    const item = byYear.get(year)!;
    item.filled = Object.values(item.status).filter(Boolean).length;
    return item;
  });
}

export async function hasSectionContent(
  year: number,
  type: SectionType,
): Promise<boolean> {
  const summaries = await listYearSummaries();
  return summaries.find((s) => s.year === year)?.status[type] ?? false;
}

async function loadVocab(sectionId: number): Promise<VocabItem[]> {
  const pool = getPool();
  const [rows] = await pool.execute<VocabRow[]>(
    `SELECT word, pos, phonetic, meaning, example
     FROM vocab_item
     WHERE section_id = ?
     ORDER BY sort_order ASC, id ASC`,
    [sectionId],
  );
  return rows.map((row) => ({
    word: row.word,
    pos: row.pos || undefined,
    phonetic: row.phonetic || undefined,
    meaning: row.meaning,
    example: row.example || undefined,
  }));
}

async function loadEssay(sectionId: number): Promise<EssayContent | null> {
  const pool = getPool();
  const [rows] = await pool.execute<EssayRow[]>(
    `SELECT id, prompt, draft, revised, notes, video_url
     FROM essay WHERE section_id = ? LIMIT 1`,
    [sectionId],
  );
  const essay = rows[0];
  if (!essay) return null;

  const [media] = await pool.execute<RowDataPacket[]>(
    `SELECT id, kind FROM essay_media WHERE essay_id = ? ORDER BY sort_order ASC, id ASC`,
    [essay.id],
  );

  const imageIds = media
    .filter((m) => m.kind === "image")
    .map((m) => Number(m.id));
  const draftImageIds = media
    .filter((m) => m.kind === "draft")
    .map((m) => Number(m.id));
  const videoMedia = media.find((m) => m.kind === "video");

  return {
    prompt: essay.prompt,
    draft: essay.draft || "",
    revised: essay.revised,
    notes: essay.notes || undefined,
    videoUrl: essay.video_url || undefined,
    imageIds,
    draftImageIds,
    videoMediaId: videoMedia ? Number(videoMedia.id) : null,
  };
}

export async function getYearContent(year: number): Promise<YearContent> {
  const pool = getPool();
  await ensureYear(year);

  const [sections] = await pool.execute<SectionRow[]>(
    "SELECT id, year, type FROM section WHERE year = ?",
    [year],
  );

  const content: YearContent = {
    year,
    vocab: [],
    small_essay: null,
    big_essay: null,
  };

  for (const section of sections) {
    if (section.type === "vocab") {
      content.vocab = await loadVocab(Number(section.id));
    } else if (section.type === "small_essay") {
      content.small_essay = await loadEssay(Number(section.id));
    } else if (section.type === "big_essay") {
      content.big_essay = await loadEssay(Number(section.id));
    }
  }

  return content;
}

export async function getSectionFormSeed(
  year: number,
  type: SectionType,
): Promise<{
  isEdit: boolean;
  vocabItems: VocabDraftItem[];
  essay: EssayFormValues;
}> {
  const content = await getYearContent(year);
  const emptyEssay: EssayFormValues = {
    prompt: "",
    draft: "",
    revised: "",
    notes: "",
    draftImageIds: [],
    imageIds: [],
    videoMediaId: null,
  };

  if (type === "vocab") {
    return {
      isEdit: content.vocab.length > 0,
      vocabItems:
        content.vocab.length > 0
          ? toVocabDraftItems(content.vocab)
          : [createEmptyVocabDraft()],
      essay: emptyEssay,
    };
  }

  const essay = type === "small_essay" ? content.small_essay : content.big_essay;
  if (!essay) {
    return { isEdit: false, vocabItems: [], essay: emptyEssay };
  }

  return {
    isEdit: true,
    vocabItems: [],
    essay: {
      prompt: essay.prompt,
      draft: essay.draft,
      revised: essay.revised,
      notes: essay.notes ?? "",
      draftImageIds: essay.draftImageIds ?? [],
      imageIds: essay.imageIds ?? [],
      videoMediaId: essay.videoMediaId ?? null,
    },
  };
}

export async function saveVocab(year: number, items: VocabItem[]) {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const sectionId = await getOrCreateSection(year, "vocab", conn);
    await conn.execute("DELETE FROM vocab_item WHERE section_id = ?", [
      sectionId,
    ]);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await conn.execute(
        `INSERT INTO vocab_item
         (section_id, word, pos, phonetic, meaning, example, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          sectionId,
          item.word,
          item.pos || null,
          item.phonetic || null,
          item.meaning,
          item.example || null,
          i,
        ],
      );
    }
    await conn.execute(
      "UPDATE section SET updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?",
      [sectionId],
    );
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function saveEssay(input: {
  year: number;
  type: "small_essay" | "big_essay";
  prompt: string;
  draft: string;
  revised: string;
  notes?: string;
  images?: { filename: string; mimeType: string; data: Buffer }[];
  draftImages?: { filename: string; mimeType: string; data: Buffer }[];
  videoFile?: { filename: string; mimeType: string; data: Buffer } | null;
  replaceImages?: boolean;
  replaceDraftImages?: boolean;
  replaceVideoFile?: boolean;
  clearImages?: boolean;
  clearDraftImages?: boolean;
  clearVideo?: boolean;
}) {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const sectionId = await getOrCreateSection(input.year, input.type, conn);

    const [existing] = await conn.execute<EssayRow[]>(
      "SELECT id FROM essay WHERE section_id = ? LIMIT 1",
      [sectionId],
    );

    let essayId: number;
    if (existing[0]) {
      essayId = Number(existing[0].id);
      await conn.execute(
        `UPDATE essay
         SET prompt = ?, draft = ?, revised = ?, notes = ?, video_url = NULL
         WHERE id = ?`,
        [
          input.prompt,
          input.draft,
          input.revised,
          input.notes || null,
          essayId,
        ],
      );
    } else {
      const [result] = await conn.execute<ResultSetHeader>(
        `INSERT INTO essay (section_id, prompt, draft, revised, notes, video_url)
         VALUES (?, ?, ?, ?, ?, NULL)`,
        [
          sectionId,
          input.prompt,
          input.draft,
          input.revised,
          input.notes || null,
        ],
      );
      essayId = Number(result.insertId);
    }

    if (input.replaceImages || input.clearImages) {
      await conn.execute(
        "DELETE FROM essay_media WHERE essay_id = ? AND kind = 'image'",
        [essayId],
      );
    }
    if (input.images?.length) {
      for (let i = 0; i < input.images.length; i++) {
        const image = input.images[i];
        await conn.execute(
          `INSERT INTO essay_media (essay_id, kind, mime_type, filename, data, sort_order)
           VALUES (?, 'image', ?, ?, ?, ?)`,
          [essayId, image.mimeType, image.filename, image.data, i],
        );
      }
    }

    if (input.replaceDraftImages || input.clearDraftImages) {
      await conn.execute(
        "DELETE FROM essay_media WHERE essay_id = ? AND kind = 'draft'",
        [essayId],
      );
    }
    if (input.draftImages?.length) {
      for (let i = 0; i < input.draftImages.length; i++) {
        const image = input.draftImages[i];
        await conn.execute(
          `INSERT INTO essay_media (essay_id, kind, mime_type, filename, data, sort_order)
           VALUES (?, 'draft', ?, ?, ?, ?)`,
          [essayId, image.mimeType, image.filename, image.data, i],
        );
      }
    }

    if (input.clearVideo || (input.replaceVideoFile && input.videoFile)) {
      await conn.execute(
        "DELETE FROM essay_media WHERE essay_id = ? AND kind = 'video'",
        [essayId],
      );
    }
    if (input.videoFile) {
      await conn.execute(
        `INSERT INTO essay_media (essay_id, kind, mime_type, filename, data, sort_order)
         VALUES (?, 'video', ?, ?, ?, 0)`,
        [
          essayId,
          input.videoFile.mimeType,
          input.videoFile.filename,
          input.videoFile.data,
        ],
      );
    }

    await conn.execute(
      "UPDATE section SET updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?",
      [sectionId],
    );
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function getMediaById(id: number): Promise<MediaRow | null> {
  const pool = getPool();
  const [rows] = await pool.execute<MediaRow[]>(
    "SELECT id, kind, mime_type, filename, data FROM essay_media WHERE id = ? LIMIT 1",
    [id],
  );
  return rows[0] ?? null;
}

export async function deleteMediaById(id: number): Promise<boolean> {
  const pool = getPool();
  const [result] = await pool.execute<ResultSetHeader>(
    "DELETE FROM essay_media WHERE id = ?",
    [id],
  );
  return result.affectedRows > 0;
}

export async function deleteMediaByIds(ids: number[]): Promise<number> {
  if (ids.length === 0) return 0;
  const pool = getPool();
  const placeholders = ids.map(() => "?").join(",");
  const [result] = await pool.execute<ResultSetHeader>(
    `DELETE FROM essay_media WHERE id IN (${placeholders})`,
    ids,
  );
  return result.affectedRows;
}

export async function deleteSection(
  year: number,
  type: SectionType,
): Promise<boolean> {
  const pool = getPool();
  const [result] = await pool.execute<ResultSetHeader>(
    "DELETE FROM section WHERE year = ? AND type = ?",
    [year, type],
  );
  return result.affectedRows > 0;
}
