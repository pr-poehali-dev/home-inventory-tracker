-- Добавляем тестовые рецепты
INSERT INTO recipes (name, description, total_calories, cooking_time, servings) VALUES
('Рис с курицей', 'Классическое блюдо: отварной рис с куриной грудкой', 650, 30, 2),
('Гречка с говядиной', 'Гречневая каша с тушеной говядиной', 720, 40, 2),
('Овощной салат', 'Свежий салат из помидоров, огурцов и зелени', 120, 10, 2);

-- Добавляем ингредиенты для риса с курицей
INSERT INTO recipe_ingredients (recipe_id, product_name, quantity, unit)
SELECT id, 'Рис', 200, 'г' FROM recipes WHERE name = 'Рис с курицей'
UNION ALL
SELECT id, 'Курица', 300, 'г' FROM recipes WHERE name = 'Рис с курицей'
UNION ALL
SELECT id, 'Соль', 5, 'г' FROM recipes WHERE name = 'Рис с курицей';

-- Добавляем ингредиенты для гречки с говядиной
INSERT INTO recipe_ingredients (recipe_id, product_name, quantity, unit)
SELECT id, 'Гречка', 200, 'г' FROM recipes WHERE name = 'Гречка с говядиной'
UNION ALL
SELECT id, 'Говядина', 350, 'г' FROM recipes WHERE name = 'Гречка с говядиной'
UNION ALL
SELECT id, 'Лук', 100, 'г' FROM recipes WHERE name = 'Гречка с говядиной';

-- Добавляем ингредиенты для салата
INSERT INTO recipe_ingredients (recipe_id, product_name, quantity, unit)
SELECT id, 'Помидоры', 150, 'г' FROM recipes WHERE name = 'Овощной салат'
UNION ALL
SELECT id, 'Огурцы', 150, 'г' FROM recipes WHERE name = 'Овощной салат'
UNION ALL
SELECT id, 'Зелень', 30, 'г' FROM recipes WHERE name = 'Овощной салат';