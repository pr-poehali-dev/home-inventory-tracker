-- Справочник товаров с калорийностью
CREATE TABLE IF NOT EXISTS t_p56038920_home_inventory_track.product_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL UNIQUE,
    category VARCHAR(100),
    calories_per_100g INTEGER,
    default_unit VARCHAR(20) DEFAULT 'г',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Настройки пользователя
CREATE TABLE IF NOT EXISTS t_p56038920_home_inventory_track.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_calorie_goal INTEGER DEFAULT 2000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Вставляем дефолтные настройки
INSERT INTO t_p56038920_home_inventory_track.user_settings (daily_calorie_goal) 
VALUES (2000)
ON CONFLICT DO NOTHING;

-- Индексы
CREATE INDEX IF NOT EXISTS idx_product_catalog_name ON t_p56038920_home_inventory_track.product_catalog(name);
CREATE INDEX IF NOT EXISTS idx_product_catalog_category ON t_p56038920_home_inventory_track.product_catalog(category);