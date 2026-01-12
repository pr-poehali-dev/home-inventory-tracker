CREATE TABLE IF NOT EXISTS t_p56038920_home_inventory_track.food_diary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_name TEXT NOT NULL,
    portion_weight NUMERIC NOT NULL,
    calories NUMERIC NOT NULL,
    meal_type TEXT,
    eaten_date TIMESTAMP NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE t_p56038920_home_inventory_track.food_diary IS 'Дневник питания - учёт съеденной еды';
COMMENT ON COLUMN t_p56038920_home_inventory_track.food_diary.meal_name IS 'Название блюда или продукта';
COMMENT ON COLUMN t_p56038920_home_inventory_track.food_diary.portion_weight IS 'Вес порции в граммах';
COMMENT ON COLUMN t_p56038920_home_inventory_track.food_diary.calories IS 'Калорийность порции';
COMMENT ON COLUMN t_p56038920_home_inventory_track.food_diary.meal_type IS 'Тип приёма пищи (завтрак, обед, ужин, перекус)';
COMMENT ON COLUMN t_p56038920_home_inventory_track.food_diary.eaten_date IS 'Дата и время приёма пищи';

CREATE INDEX IF NOT EXISTS idx_food_diary_date ON t_p56038920_home_inventory_track.food_diary(eaten_date DESC);
