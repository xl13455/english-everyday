USE english_everyday;

ALTER TABLE essay_media
  MODIFY kind ENUM('image', 'video', 'draft') NOT NULL DEFAULT 'image';

ALTER TABLE essay
  MODIFY draft MEDIUMTEXT NULL;
