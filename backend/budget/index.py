import json
import os
from datetime import datetime, timedelta

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    import psycopg2_binary as psycopg2
    from psycopg2_binary.extras import RealDictCursor

DATABASE_URL = os.environ.get('DATABASE_URL')
SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')


def handler(event: dict, context) -> dict:
    '''API для управления бюджетом, аналитикой и настройками пользователя'''
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
        
        if action == 'settings':
            if method == 'GET':
                cur.execute(f"SELECT id, daily_calorie_goal FROM {SCHEMA}.user_settings LIMIT 1")
                row = cur.fetchone()
                if not row:
                    cur.execute(f"INSERT INTO {SCHEMA}.user_settings (daily_calorie_goal) VALUES (2000) RETURNING id, daily_calorie_goal")
                    row = cur.fetchone()
                    conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(dict(row), default=str),
                    'isBase64Encoded': False
                }
            elif method == 'PUT':
                data = json.loads(event.get('body', '{}'))
                cur.execute(f"""
                    UPDATE {SCHEMA}.user_settings
                    SET daily_calorie_goal = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = (SELECT id FROM {SCHEMA}.user_settings LIMIT 1)
                    RETURNING id, daily_calorie_goal
                """, (data.get('daily_calorie_goal', 2000),))
                row = cur.fetchone()
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(dict(row), default=str),
                    'isBase64Encoded': False
                }

        if method == 'GET':
            if action == 'categories':
                cur.execute(f'SELECT * FROM {SCHEMA}.budget_categories ORDER BY type, name')
                categories = cur.fetchall()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps([dict(c) for c in categories], default=str),
                    'isBase64Encoded': False
                }

            if action == 'analytics':
                period = query_params.get('period', '30')
                start_date = (datetime.now() - timedelta(days=int(period))).date()

                cur.execute(
                    f'''SELECT 
                        bc.id, bc.name, bc.type, bc.icon, bc.color,
                        COALESCE(SUM(t.amount), 0) as total
                    FROM {SCHEMA}.budget_categories bc
                    LEFT JOIN {SCHEMA}.transactions t ON t.category_id = bc.id 
                        AND t.date >= %s
                    GROUP BY bc.id, bc.name, bc.type, bc.icon, bc.color
                    ORDER BY total DESC''',
                    (start_date,)
                )
                analytics = cur.fetchall()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps([dict(a) for a in analytics], default=str),
                    'isBase64Encoded': False
                }

            start_date = query_params.get('start_date')
            end_date = query_params.get('end_date')

            query = f'''SELECT t.*, bc.name as category_name, bc.icon, bc.color
                       FROM {SCHEMA}.transactions t
                       LEFT JOIN {SCHEMA}.budget_categories bc ON t.category_id = bc.id'''
            
            conditions = []
            params = []
            if start_date:
                conditions.append('t.date >= %s')
                params.append(start_date)
            if end_date:
                conditions.append('t.date <= %s')
                params.append(end_date)
            
            if conditions:
                query += ' WHERE ' + ' AND '.join(conditions)
            
            query += ' ORDER BY t.date DESC, t.created_at DESC'
            
            cur.execute(query, params)
            transactions = cur.fetchall()

            summary_query = f"""SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense
            FROM {SCHEMA}.transactions
            WHERE 1=1"""
            
            if start_date:
                summary_query += ' AND date >= %s'
            if end_date:
                summary_query += ' AND date <= %s'
            
            cur.execute(summary_query, params if params else ())
            summary = cur.fetchone()

            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'transactions': [dict(t) for t in transactions],
                    'summary': dict(summary)
                }, default=str),
                'isBase64Encoded': False
            }

        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))

            if action == 'category':
                cur.execute(
                    f'''INSERT INTO {SCHEMA}.budget_categories (name, type, icon, color)
                        VALUES (%s, %s, %s, %s) RETURNING *''',
                    (body.get('name'), body.get('type'), body.get('icon'), body.get('color'))
                )
                category = cur.fetchone()
                conn.commit()
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(dict(category), default=str),
                    'isBase64Encoded': False
                }

            cur.execute(
                f'''INSERT INTO {SCHEMA}.transactions 
                    (type, amount, category_id, description, date, receipt_id)
                    VALUES (%s, %s, %s, %s, %s, %s) RETURNING *''',
                (
                    body.get('type'),
                    body.get('amount'),
                    body.get('category_id'),
                    body.get('description'),
                    body.get('date', datetime.now().date()),
                    body.get('receipt_id')
                )
            )
            transaction = cur.fetchone()
            conn.commit()

            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(dict(transaction), default=str),
                'isBase64Encoded': False
            }

        elif method == 'PUT':
            if action == 'category':
                category_id = query_params.get('id')
                body = json.loads(event.get('body', '{}'))
                cur.execute(
                    f'''UPDATE {SCHEMA}.budget_categories 
                        SET name = %s, icon = %s, color = %s 
                        WHERE id = %s RETURNING *''',
                    (body.get('name'), body.get('icon'), body.get('color'), category_id)
                )
                category = cur.fetchone()
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(dict(category) if category else {}, default=str),
                    'isBase64Encoded': False
                }

        elif method == 'DELETE':
            if action == 'delete_transaction':
                transaction_id = query_params.get('id')
                if not transaction_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Transaction ID required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(f'DELETE FROM {SCHEMA}.transactions WHERE id = %s', (transaction_id,))
                conn.commit()
                return {
                    'statusCode': 204,
                    'headers': {'Access-Control-Allow-Origin': '*'},
                    'body': '',
                    'isBase64Encoded': False
                }

            if action == 'category':
                category_id = query_params.get('id')
                cur.execute(f'UPDATE {SCHEMA}.budget_categories SET name = name WHERE id = %s', (category_id,))
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
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