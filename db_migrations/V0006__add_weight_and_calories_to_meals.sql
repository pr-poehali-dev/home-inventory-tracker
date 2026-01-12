ALTER TABLE prepared_meals ADD COLUMN IF NOT EXISTS total_weight NUMERIC;
ALTER TABLE prepared_meals ADD COLUMN IF NOT EXISTS total_calories NUMERIC;

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS total_weight NUMERIC;

COMMENT ON COLUMN prepared_meals.total_weight IS 'Общий вес готового блюда в граммах';
COMMENT ON COLUMN prepared_meals.total_calories IS 'Общая калорийность готового блюда';
COMMENT ON COLUMN recipes.total_weight IS 'Ожидаемый вес готового блюда в граммах';