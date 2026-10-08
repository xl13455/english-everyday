USE english_everyday;

ALTER TABLE vocab_item
  ADD COLUMN word_family TEXT NULL AFTER meaning;
