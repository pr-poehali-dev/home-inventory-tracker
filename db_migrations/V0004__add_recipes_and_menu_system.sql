-- Таблица рецептов
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    total_calories INTEGER,
    cooking_time INTEGER,
    servings INTEGER DEFAULT 1,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица ингредиентов рецепта
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id),
    product_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10, 3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица готовых блюд
CREATE TABLE IF NOT EXISTS prepared_meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id),
    prepared_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    servings_left INTEGER NOT NULL,
    expires_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_meal_status CHECK (status IN ('available', 'consumed', 'expired'))
);

-- Таблица запланированных рецептов
CREATE TABLE IF NOT EXISTS planned_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id),
    status VARCHAR(20) DEFAULT 'planned',
    missing_products JSONB,
    planned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_planned_status CHECK (status IN ('planned', 'prepared', 'cancelled'))
);

-- Добавляем поле budget_category_id к продуктам для связи с бюджетом
ALTER TABLE products ADD COLUMN IF NOT EXISTS budget_category_id UUID REFERENCES budget_categories(id);

-- Добавляем поле budget_category_name к товарам из чеков
ALTER TABLE receipt_items ADD COLUMN IF NOT EXISTS budget_category_name VARCHAR(100);

-- Создаем индексы
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_prepared_meals_recipe ON prepared_meals(recipe_id);
CREATE INDEX IF NOT EXISTS idx_prepared_meals_status ON prepared_meals(status);
CREATE INDEX IF NOT EXISTS idx_planned_recipes_recipe ON planned_recipes(recipe_id);
CREATE INDEX IF NOT EXISTS idx_planned_recipes_status ON planned_recipes(status);