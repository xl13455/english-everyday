USE english_everyday;

-- 视频改存 COS：data 可空，用 storage_key 指向对象
ALTER TABLE essay_media
  MODIFY COLUMN data LONGBLOB NULL,
  ADD COLUMN storage_key VARCHAR(512) NULL AFTER filename;
