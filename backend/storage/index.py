import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.environ.get('DATABASE_URL')
SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')


def handler(event: dict, context) -> dict:
    '''API для управления местами хранения, продуктами и справочником товаров'''
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
        query_params = event.get('queryStringParameters', {}) or {}
        action = query_params.get('action')
        
        if action == 'catalog':
            if method == 'GET':
                cur.execute(f"""
                    SELECT id, name, category, calories_per_100g, default_unit, created_at
                    FROM {SCHEMA}.product_catalog
                    ORDER BY name
                """)
                products = cur.fetchall()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps([dict(p) for p in products], default=str),
                    'isBase64Encoded': False
                }
            
            elif method == 'POST':
                data = json.loads(event.get('body', '{}'))
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.product_catalog 
                    (name, category, calories_per_100g, default_unit)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (name) DO UPDATE SET
                        category = EXCLUDED.category,
                        calories_per_100g = EXCLUDED.calories_per_100g,
                        default_unit = EXCLUDED.default_unit,
                        updated_at = CURRENT_TIMESTAMP
                    RETURNING *
                """, (data.get('name'), data.get('category'), 
                      data.get('calories_per_100g'), data.get('default_unit', 'г')))
                product = cur.fetchone()
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(dict(product), default=str),
                    'isBase64Encoded': False
                }
            
            elif method == 'PUT':
                data = json.loads(event.get('body', '{}'))
                cur.execute(f"""
                    UPDATE {SCHEMA}.product_catalog
                    SET name = %s, category = %s, calories_per_100g = %s, 
                        default_unit = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    RETURNING *
                """, (data.get('name'), data.get('category'), 
                      data.get('calories_per_100g'), data.get('default_unit'), data.get('id')))
                product = cur.fetchone()
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(dict(product), default=str),
                    'isBase64Encoded': False
                }
            
            elif method == 'DELETE':
                product_id = query_params.get('id')
                cur.execute(f"DELETE FROM {SCHEMA}.product_catalog WHERE id = %s", (product_id,))
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }

        if method == 'GET':
            location_id = query_params.get('id')

            if location_id:
                cur.execute(
                    f'SELECT * FROM {SCHEMA}.storage_locations WHERE id = %s',
                    (location_id,)
                )
                location = cur.fetchone()

                cur.execute(
                    f'SELECT * FROM {SCHEMA}.products WHERE storage_location_id = %s ORDER BY added_date DESC',
                    (location_id,)
                )
                products = cur.fetchall()

                result = {
                    'location': dict(location) if location else None,
                    'products': [dict(p) for p in products]
                }
            else:
                cur.execute(f'SELECT * FROM {SCHEMA}.storage_locations ORDER BY created_at')
                locations = cur.fetchall()

                for loc in locations:
                    cur.execute(
                        f'SELECT COUNT(*) as count FROM {SCHEMA}.products WHERE storage_location_id = %s',
                        (loc['id'],)
                    )
                    count_result = cur.fetchone()
                    loc['items_count'] = count_result['count'] if count_result else 0

                result = [dict(loc) for loc in locations]

            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(result, default=str),
                'isBase64Encoded': False
            }

        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))

            if action == 'createLocation':
                cur.execute(
                    f'''INSERT INTO {SCHEMA}.storage_locations (name, icon, color)
                        VALUES (%s, %s, %s) RETURNING *''',
                    (body.get('name'), body.get('icon'), body.get('color'))
                )
                location = cur.fetchone()
                conn.commit()

                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(dict(location), default=str),
                    'isBase64Encoded': False
                }

            cur.execute(
                f'''INSERT INTO {SCHEMA}.products 
                    (name, quantity, unit, category, expiry_date, storage_location_id, notes, calories_per_100g)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING *''',
                (
                    body.get('name'),
                    body.get('quantity'),
                    body.get('unit'),
                    body.get('category'),
                    body.get('expiryDate'),
                    body.get('storageLocationId'),
                    body.get('notes'),
                    body.get('caloriesPer100g')
                )
            )
            product = cur.fetchone()
            conn.commit()

            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(dict(product), default=str),
                'isBase64Encoded': False
            }

        elif method == 'PUT':
            if action == 'updateProduct':
                product_id = query_params.get('id')
                body = json.loads(event.get('body', '{}'))

                cur.execute(
                    f'''UPDATE {SCHEMA}.products 
                        SET name = %s, quantity = %s, unit = %s, category = %s, 
                            expiry_date = %s, notes = %s, calories_per_100g = %s
                        WHERE id = %s RETURNING *''',
                    (
                        body.get('name'),
                        body.get('quantity'),
                        body.get('unit'),
                        body.get('category'),
                        body.get('expiryDate'),
                        body.get('notes'),
                        body.get('caloriesPer100g'),
                        product_id
                    )
                )
                product = cur.fetchone()
                conn.commit()

                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(dict(product) if product else {}, default=str),
                    'isBase64Encoded': False
                }

            if action == 'updateLocation':
                location_id = query_params.get('id')
                body = json.loads(event.get('body', '{}'))

                cur.execute(
                    f'''UPDATE {SCHEMA}.storage_locations 
                        SET name = %s, icon = %s, color = %s 
                        WHERE id = %s RETURNING *''',
                    (body.get('name'), body.get('icon'), body.get('color'), location_id)
                )
                location = cur.fetchone()
                conn.commit()

                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(dict(location) if location else {}, default=str),
                    'isBase64Encoded': False
                }

        elif method == 'DELETE':
            if action == 'deleteLocation':
                location_id = query_params.get('id')
                cur.execute(f'DELETE FROM {SCHEMA}.storage_locations WHERE id = %s', (location_id,))
                conn.commit()

                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }

            product_id = query_params.get('productId')

            if not product_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Product ID required'}),
                    'isBase64Encoded': False
                }

            cur.execute(f'DELETE FROM {SCHEMA}.products WHERE id = %s', (product_id,))
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