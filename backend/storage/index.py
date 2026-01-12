import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.environ.get('DATABASE_URL')
SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')


def handler(event: dict, context) -> dict:
    '''API для управления местами хранения и продуктами'''
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
                    (name, quantity, unit, category, expiry_date, storage_location_id, notes)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING *''',
                (
                    body.get('name'),
                    body.get('quantity'),
                    body.get('unit'),
                    body.get('category'),
                    body.get('expiryDate'),
                    body.get('storageLocationId'),
                    body.get('notes')
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

            cur.execute(f'SELECT * FROM {SCHEMA}.products WHERE id = %s', (product_id,))
            product = cur.fetchone()

            if not product:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Product not found'}),
                    'isBase64Encoded': False
                }

            cur.execute(f'UPDATE {SCHEMA}.products SET quantity = 0 WHERE id = %s', (product_id,))
            conn.commit()

            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True}),
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