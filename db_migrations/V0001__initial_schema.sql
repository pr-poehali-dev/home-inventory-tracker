CREATE TABLE IF NOT EXISTS storage_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    color VARCHAR(50) NOT NULL,
    items_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    category VARCHAR(100),
    expiry_date DATE,
    storage_location_id UUID NOT NULL REFERENCES storage_locations(id),
    added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shopping_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    category VARCHAR(100),
    is_purchased BOOLEAN DEFAULT FALSE,
    added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_storage_location ON products(storage_location_id);
CREATE INDEX IF NOT EXISTS idx_products_expiry_date ON products(expiry_date);
CREATE INDEX IF NOT EXISTS idx_shopping_items_purchased ON shopping_items(is_purchased);

INSERT INTO storage_locations (name, icon, color) 
SELECT 'Холодильник', 'Refrigerator', 'bg-blue-500'
WHERE NOT EXISTS (SELECT 1 FROM storage_locations WHERE name = 'Холодильник');

INSERT INTO storage_locations (name, icon, color) 
SELECT 'Кухонный шкаф', 'ChefHat', 'bg-purple-500'
WHERE NOT EXISTS (SELECT 1 FROM storage_locations WHERE name = 'Кухонный шкаф');

INSERT INTO storage_locations (name, icon, color) 
SELECT 'Кладовка', 'Package', 'bg-pink-500'
WHERE NOT EXISTS (SELECT 1 FROM storage_locations WHERE name = 'Кладовка');

INSERT INTO storage_locations (name, icon, color) 
SELECT 'Морозилка', 'Snowflake', 'bg-cyan-500'
WHERE NOT EXISTS (SELECT 1 FROM storage_locations WHERE name = 'Морозилка');