import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.environ.get('DATABASE_URL')
SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')


def handler(event: dict, context) -> dict:
    '''API для управления списком покупок'''
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
            cur.execute(f'SELECT * FROM {SCHEMA}.shopping_items ORDER BY is_purchased ASC, added_date DESC')
            items = cur.fetchall()

            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps([dict(item) for item in items], default=str),
                'isBase64Encoded': False
            }

        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))

            cur.execute(
                f'''INSERT INTO {SCHEMA}.shopping_items 
                    (name, quantity, unit, category, notes)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING *''',
                (
                    body.get('name'),
                    body.get('quantity'),
                    body.get('unit'),
                    body.get('category'),
                    body.get('notes')
                )
            )
            item = cur.fetchone()
            conn.commit()

            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(dict(item), default=str),
                'isBase64Encoded': False
            }

        elif method == 'PUT':
            query_params = event.get('queryStringParameters', {}) or {}
            item_id = query_params.get('id')
            body = json.loads(event.get('body', '{}'))

            if not item_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Item ID required'}),
                    'isBase64Encoded': False
                }

            is_purchased = body.get('isPurchased')
            storage_location_id = body.get('storageLocationId')
            
            cur.execute(
                f'SELECT * FROM {SCHEMA}.shopping_items WHERE id = %s',
                (item_id,)
            )
            old_item = cur.fetchone()
            
            if not old_item:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Item not found'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f'UPDATE {SCHEMA}.shopping_items SET is_purchased = %s WHERE id = %s RETURNING *',
                (is_purchased, item_id)
            )
            item = cur.fetchone()
            
            if is_purchased and not old_item['is_purchased'] and storage_location_id:
                cur.execute(
                    f'''SELECT id FROM {SCHEMA}.products 
                        WHERE LOWER(TRIM(name)) = LOWER(TRIM(%s)) 
                        AND storage_location_id = %s
                        LIMIT 1''',
                    (item['name'], storage_location_id)
                )
                existing_product = cur.fetchone()
                
                if existing_product:
                    cur.execute(
                        f'''UPDATE {SCHEMA}.products 
                            SET quantity = quantity + %s 
                            WHERE id = %s''',
                        (item['quantity'], existing_product['id'])
                    )
                else:
                    cur.execute(
                        f'''INSERT INTO {SCHEMA}.products 
                            (name, quantity, unit, category, storage_location_id, notes)
                            VALUES (%s, %s, %s, %s, %s, %s)''',
                        (
                            item['name'],
                            item['quantity'],
                            item['unit'],
                            item['category'],
                            storage_location_id,
                            'Добавлено из списка покупок'
                        )
                    )
            
            conn.commit()

            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(dict(item), default=str),
                'isBase64Encoded': False
            }

        elif method == 'DELETE':
            query_params = event.get('queryStringParameters', {}) or {}
            item_id = query_params.get('id')

            if not item_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Item ID required'}),
                    'isBase64Encoded': False
                }

            cur.execute(f'DELETE FROM {SCHEMA}.shopping_items WHERE id = %s', (item_id,))
            conn.commit()

            return {
                'statusCode': 204,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': '',
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