import json
import os
from datetime import datetime

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    import psycopg2_binary as psycopg2
    from psycopg2_binary.extras import RealDictCursor

DATABASE_URL = os.environ.get('DATABASE_URL')
SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')


def handler(event: dict, context) -> dict:
    '''API для обработки чеков и добавления в бюджет'''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        if method == 'GET':
            cur.execute(f'SELECT * FROM {SCHEMA}.receipts')
            receipts = cur.fetchall()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps([dict(r) for r in receipts], default=str),
                'isBase64Encoded': False
            }

        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            
            cur.execute(
                f'''INSERT INTO {SCHEMA}.receipts (qr_code, total_amount, status)
                    VALUES (%s, %s, 'pending') RETURNING *''',
                (body.get('qr_code'), body.get('total_amount'))
            )
            receipt = cur.fetchone()
            receipt_id = receipt['id']
            
            total_amount = 0
            items_data = body.get('items', [])
            
            cur.execute(f'SELECT id, name FROM {SCHEMA}.budget_categories WHERE type = ''expense''')
            expense_categories = {cat['name'].lower(): cat['id'] for cat in cur.fetchall()}
            
            default_category_id = expense_categories.get('продукты')
            
            for item in items_data:
                item_name = item.get('name', '')
                item_price = float(item.get('price', 0))
                item_quantity = float(item.get('quantity', 1))
                item_total = float(item.get('total', item_price * item_quantity))
                
                total_amount += item_total
                
                category_name = item.get('budget_category_name', 'Продукты')
                category_id = expense_categories.get(category_name.lower(), default_category_id)
                
                cur.execute(
                    f'''SELECT id, calories_per_100g FROM {SCHEMA}.product_catalog 
                        WHERE LOWER(TRIM(name)) = LOWER(TRIM(%s))
                        LIMIT 1''',
                    (item_name,)
                )
                catalog_item = cur.fetchone()
                
                if not catalog_item:
                    cur.execute(
                        f'''INSERT INTO {SCHEMA}.product_catalog (name, category, default_unit)
                            VALUES (%s, %s, 'г')
                            RETURNING id, calories_per_100g''',
                        (item_name, category_name)
                    )
                    catalog_item = cur.fetchone()
                
                cur.execute(
                    f'''INSERT INTO {SCHEMA}.receipt_items 
                        (receipt_id, name, quantity, price, total, budget_category_name, category_id)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)''',
                    (receipt_id, item_name, item_quantity, item_price, item_total, 
                     category_name, category_id)
                )
                
                cur.execute(
                    f'''SELECT id FROM {SCHEMA}.shopping_items 
                        WHERE LOWER(TRIM(name)) = LOWER(TRIM(%s)) 
                        AND is_purchased = FALSE
                        LIMIT 1''',
                    (item_name,)
                )
                matching_shopping_item = cur.fetchone()
                
                if matching_shopping_item:
                    cur.execute(
                        f'''UPDATE {SCHEMA}.shopping_items 
                            SET is_purchased = TRUE 
                            WHERE id = %s''',
                        (matching_shopping_item['id'],)
                    )
            
            cur.execute(
                f'UPDATE {SCHEMA}.receipts SET total_amount = %s, status = ''processed'' WHERE id = %s',
                (total_amount, receipt_id)
            )
            
            cur.execute(
                f'''INSERT INTO {SCHEMA}.transactions (type, amount, category_id, description, receipt_id, date)
                    VALUES ('expense', %s, %s, %s, %s, CURRENT_DATE)''',
                (total_amount, default_category_id, f'Чек от {datetime.now().strftime("%d.%m.%Y")}', receipt_id)
            )
            
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'receipt': dict(receipt),
                    'total_amount': total_amount,
                    'items_count': len(items_data)
                }, default=str),
                'isBase64Encoded': False
            }

        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }

    finally:
        cur.close()
        conn.close()