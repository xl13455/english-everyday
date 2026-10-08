USE english_everyday;

ALTER TABLE vocab_item
  ADD COLUMN discrimination TEXT NULL AFTER collocation;
