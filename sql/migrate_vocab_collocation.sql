USE english_everyday;

ALTER TABLE vocab_item
  ADD COLUMN collocation TEXT NULL AFTER meaning,
  ADD COLUMN example_zh TEXT NULL AFTER example;
