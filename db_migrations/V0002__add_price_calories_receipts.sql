ALTER TABLE products 
ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS calories DECIMAL(10, 2);

ALTER TABLE shopping_items 
ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS calories DECIMAL(10, 2);

CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_date TIMESTAMP NOT NULL,
    store_name VARCHAR(200),
    total_amount DECIMAL(10, 2),
    is_distributed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES receipts(id),
    name VARCHAR(200) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20) DEFAULT 'шт',
    price DECIMAL(10, 2),
    total_price DECIMAL(10, 2),
    storage_location_id UUID REFERENCES storage_locations(id),
    is_distributed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt ON receipt_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipts_distributed ON receipts(is_distributed);
CREATE INDEX IF NOT EXISTS idx_receipt_items_distributed ON receipt_items(is_distributed);