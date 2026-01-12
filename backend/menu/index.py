import json
import os
from datetime import datetime
from difflib import SequenceMatcher
from decimal import Decimal

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    import psycopg2_binary as psycopg2
    from psycopg2_binary.extras import RealDictCursor

DATABASE_URL = os.environ.get('DATABASE_URL')
SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')


def decimal_default(obj):
    '''Конвертирует Decimal в float для JSON сериализации'''
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError


def similarity(a: str, b: str) -> float:
    '''Вычисляет схожесть двух строк (0-1)'''
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def find_matching_product(product_name: str, available_products: list) -> dict:
    '''Находит наиболее подходящий продукт из запасов'''
    best_match = None
    best_score = 0.6
    
    for product in available_products:
        score = similarity(product_name, product['name'])
        if score > best_score:
            best_score = score
            best_match = product
    
    return best_match


def handler(event: dict, context) -> dict:
    '''API для управления меню, рецептами и готовыми блюдами'''
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
            if action == 'prepared_meals':
                cur.execute(
                    f'''SELECT pm.*, r.name as recipe_name, r.image_url
                        FROM {SCHEMA}.prepared_meals pm
                        JOIN {SCHEMA}.recipes r ON pm.recipe_id = r.id
                        WHERE pm.status = 'available'
                        ORDER BY pm.prepared_date DESC'''
                )
                meals = cur.fetchall()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps([dict(m) for m in meals], default=str),
                    'isBase64Encoded': False
                }

            if action == 'planned':
                cur.execute(
                    f'''SELECT pr.*, r.name as recipe_name, r.total_calories, r.cooking_time
                        FROM {SCHEMA}.planned_recipes pr
                        JOIN {SCHEMA}.recipes r ON pr.recipe_id = r.id
                        WHERE pr.status = 'planned'
                        ORDER BY pr.planned_date DESC'''
                )
                planned = cur.fetchall()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps([dict(p) for p in planned], default=str),
                    'isBase64Encoded': False
                }

            recipe_id = query_params.get('recipe_id')
            if recipe_id:
                cur.execute(f'SELECT * FROM {SCHEMA}.recipes WHERE id = %s', (recipe_id,))
                recipe = cur.fetchone()
                
                cur.execute(
                    f'SELECT * FROM {SCHEMA}.recipe_ingredients WHERE recipe_id = %s',
                    (recipe_id,)
                )
                ingredients = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'recipe': dict(recipe) if recipe else None,
                        'ingredients': [dict(i) for i in ingredients]
                    }, default=str),
                    'isBase64Encoded': False
                }

            cur.execute(f'SELECT * FROM {SCHEMA}.recipes ORDER BY created_at DESC')
            recipes = cur.fetchall()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps([dict(r) for r in recipes], default=str),
                'isBase64Encoded': False
            }

        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))

            if action == 'plan_recipe':
                recipe_id = body.get('recipe_id')
                
                cur.execute(
                    f'SELECT * FROM {SCHEMA}.recipe_ingredients WHERE recipe_id = %s',
                    (recipe_id,)
                )
                ingredients = cur.fetchall()
                
                cur.execute(
                    f'SELECT * FROM {SCHEMA}.products WHERE quantity > 0'
                )
                available_products = cur.fetchall()
                
                missing_products = []
                for ingredient in ingredients:
                    matched_product = find_matching_product(
                        ingredient['product_name'],
                        available_products
                    )
                    
                    if not matched_product or matched_product['quantity'] < ingredient['quantity']:
                        missing_products.append({
                            'name': ingredient['product_name'],
                            'quantity': float(ingredient['quantity']),
                            'unit': ingredient['unit'],
                            'available': float(matched_product['quantity']) if matched_product else 0
                        })
                
                if missing_products:
                    for item in missing_products:
                        needed_qty = item['quantity'] - item['available']
                        if needed_qty > 0:
                            cur.execute(
                                f'''INSERT INTO {SCHEMA}.shopping_items (name, quantity, unit, category)
                                    VALUES (%s, %s, %s, %s)''',
                                (item['name'], needed_qty, item['unit'], 'Продукты')
                            )
                
                cur.execute(
                    f'''INSERT INTO {SCHEMA}.planned_recipes (recipe_id, status, missing_products)
                        VALUES (%s, 'planned', %s) RETURNING *''',
                    (recipe_id, json.dumps(missing_products))
                )
                planned = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'planned': dict(planned),
                        'missing_products': missing_products
                    }, default=str),
                    'isBase64Encoded': False
                }

            if action == 'prepare':
                planned_id = body.get('planned_id')
                
                cur.execute(
                    f'''SELECT pr.*, r.servings FROM {SCHEMA}.planned_recipes pr
                        JOIN {SCHEMA}.recipes r ON pr.recipe_id = r.id
                        WHERE pr.id = %s''',
                    (planned_id,)
                )
                planned = cur.fetchone()
                
                if not planned:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Planned recipe not found'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    f'SELECT * FROM {SCHEMA}.recipe_ingredients WHERE recipe_id = %s',
                    (planned['recipe_id'],)
                )
                ingredients = cur.fetchall()
                
                cur.execute(f'SELECT * FROM {SCHEMA}.products WHERE quantity > 0')
                available_products = cur.fetchall()
                
                total_calories = 0
                total_weight = 0
                
                for ingredient in ingredients:
                    matched_product = find_matching_product(
                        ingredient['product_name'],
                        available_products
                    )
                    
                    if matched_product:
                        new_qty = max(0, matched_product['quantity'] - ingredient['quantity'])
                        cur.execute(
                            f'UPDATE {SCHEMA}.products SET quantity = %s WHERE id = %s',
                            (new_qty, matched_product['id'])
                        )
                        
                        if matched_product.get('calories_per_100g'):
                            ingredient_weight_g = float(ingredient['quantity'])
                            if ingredient['unit'] == 'кг':
                                ingredient_weight_g *= 1000
                            elif ingredient['unit'] == 'мл':
                                pass
                            elif ingredient['unit'] == 'л':
                                ingredient_weight_g *= 1000
                            
                            calories = (float(matched_product['calories_per_100g']) * ingredient_weight_g) / 100
                            total_calories += calories
                            total_weight += ingredient_weight_g
                
                calories_per_100g = (total_calories / total_weight * 100) if total_weight > 0 else 0
                
                cur.execute(
                    f'''INSERT INTO {SCHEMA}.prepared_meals 
                        (recipe_id, servings_left, status, total_calories, total_weight)
                        VALUES (%s, %s, 'available', %s, %s) RETURNING *''',
                    (planned['recipe_id'], planned['servings'], calories_per_100g, total_weight)
                )
                meal = cur.fetchone()
                
                cur.execute(
                    f"UPDATE {SCHEMA}.planned_recipes SET status = 'prepared' WHERE id = %s",
                    (planned_id,)
                )
                
                conn.commit()
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(dict(meal), default=str),
                    'isBase64Encoded': False
                }

            if action == 'create_recipe':
                cur.execute(
                    f'''INSERT INTO {SCHEMA}.recipes (name, description, total_calories, cooking_time, servings, image_url)
                        VALUES (%s, %s, %s, %s, %s, %s) RETURNING *''',
                    (
                        body.get('name'),
                        body.get('description'),
                        body.get('total_calories'),
                        body.get('cooking_time'),
                        body.get('servings', 1),
                        body.get('image_url')
                    )
                )
                recipe = cur.fetchone()
                recipe_id = recipe['id']
                
                for ingredient in body.get('ingredients', []):
                    cur.execute(
                        f'''INSERT INTO {SCHEMA}.recipe_ingredients (recipe_id, product_name, quantity, unit)
                            VALUES (%s, %s, %s, %s)''',
                        (recipe_id, ingredient['product_name'], ingredient['quantity'], ingredient['unit'])
                    )
                
                conn.commit()
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(dict(recipe), default=str),
                    'isBase64Encoded': False
                }

        elif method == 'PUT':
            if action == 'cancel_plan':
                planned_id = query_params.get('id')
                cur.execute(
                    f"UPDATE {SCHEMA}.planned_recipes SET status = 'cancelled' WHERE id = %s",
                    (planned_id,)
                )
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }

        elif method == 'DELETE':
            if action == 'delete_recipe':
                recipe_id = query_params.get('id')
                
                if not recipe_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Recipe ID required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(f'DELETE FROM {SCHEMA}.prepared_meals WHERE recipe_id = %s', (recipe_id,))
                cur.execute(f'DELETE FROM {SCHEMA}.planned_recipes WHERE recipe_id = %s', (recipe_id,))
                cur.execute(f'DELETE FROM {SCHEMA}.recipe_ingredients WHERE recipe_id = %s', (recipe_id,))
                cur.execute(f'DELETE FROM {SCHEMA}.recipes WHERE id = %s', (recipe_id,))
                conn.commit()
                
                return {
                    'statusCode': 204,
                    'headers': {'Access-Control-Allow-Origin': '*'},
                    'body': '',
                    'isBase64Encoded': False
                }
            
            elif action == 'delete_meal':
                meal_id = query_params.get('id')
                
                if not meal_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Meal ID required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(f'DELETE FROM {SCHEMA}.prepared_meals WHERE id = %s', (meal_id,))
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