import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import Sidebar from '@/components/Sidebar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { menuApi, storageApi, Recipe, RecipeIngredient, StorageLocation, Product } from '@/lib/api';
import { toast } from 'sonner';

const RecipeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false);
  const [isMatchingDialogOpen, setIsMatchingDialogOpen] = useState(false);
  const [productMatches, setProductMatches] = useState<{ [key: string]: string }>({});
  const [newIngredient, setNewIngredient] = useState({
    product_name: '',
    quantity: '',
    unit: 'г',
  });

  useEffect(() => {
    if (id && id !== 'new') {
      fetchData();
    } else {
      setIsLoading(false);
      setIsEditMode(true);
    }
  }, [id]);

  const fetchData = async () => {
    if (!id || id === 'new') return;

    try {
      const [recipeData, locationsData, productsData] = await Promise.all([
        menuApi.getRecipe(id),
        storageApi.getLocations(),
        storageApi.getLocations().then(async (locs) => {
          const allProducts: Product[] = [];
          for (const loc of locs) {
            const data = await storageApi.getLocationWithProducts(loc.id);
            allProducts.push(...data.products.filter(p => p.quantity > 0));
          }
          return allProducts;
        }),
      ]);
      setRecipe(recipeData.recipe);
      setIngredients(recipeData.ingredients);
      setLocations(locationsData);
      setAvailableProducts(productsData);
    } catch (error) {
      toast.error('Ошибка загрузки');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!recipe?.name) {
      toast.error('Введите название рецепта');
      return;
    }

    if (ingredients.length === 0) {
      toast.error('Добавьте хотя бы один ингредиент');
      return;
    }

    try {
      await menuApi.createRecipe({
        name: recipe.name,
        description: recipe.description,
        total_calories: recipe.total_calories,
        cooking_time: recipe.cooking_time,
        servings: recipe.servings,
        ingredients: ingredients.map((i) => ({
          id: '',
          recipe_id: '',
          product_name: i.product_name,
          quantity: i.quantity,
          unit: i.unit,
        })),
      });
      toast.success('Рецепт сохранен');
      navigate('/menu');
    } catch (error) {
      toast.error('Ошибка сохранения');
      console.error(error);
    }
  };

  const handleAddIngredient = () => {
    if (!newIngredient.product_name || !newIngredient.quantity) {
      toast.error('Заполните все поля');
      return;
    }

    setIngredients([
      ...ingredients,
      {
        id: Math.random().toString(),
        recipe_id: id || '',
        product_name: newIngredient.product_name,
        quantity: parseFloat(newIngredient.quantity),
        unit: newIngredient.unit,
      },
    ]);
    setNewIngredient({ product_name: '', quantity: '', unit: 'г' });
    setIsAddIngredientOpen(false);
    toast.success('Ингредиент добавлен');
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handlePrepareWithMatching = () => {
    const matches: { [key: string]: string } = {};
    const similarityThreshold = 0.6;

    ingredients.forEach((ingredient) => {
      const matchedProduct = availableProducts.find((product) => {
        const similarity =
          product.name.toLowerCase() === ingredient.product_name.toLowerCase()
            ? 1
            : product.name.toLowerCase().includes(ingredient.product_name.toLowerCase()) ||
              ingredient.product_name.toLowerCase().includes(product.name.toLowerCase())
            ? 0.8
            : 0;
        return similarity >= similarityThreshold && product.quantity >= ingredient.quantity;
      });

      if (matchedProduct) {
        matches[ingredient.product_name] = matchedProduct.id;
      }
    });

    setProductMatches(matches);
    setIsMatchingDialogOpen(true);
  };

  const handleConfirmMatching = async () => {
    toast.success('Блюдо приготовлено!');
    setIsMatchingDialogOpen(false);
    navigate('/menu');
  };

  const unmatchedIngredients = ingredients.filter(
    (ing) => !productMatches[ing.product_name]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 p-4">
      <Sidebar locations={locations} />
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 pt-4"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/menu')}
            className="mb-4 hover:bg-white/50"
          >
            <Icon name="ArrowLeft" size={20} className="mr-2" />
            Назад
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-1">
                {recipe?.name || 'Новый рецепт'}
              </h1>
              {!isEditMode && recipe?.description && (
                <p className="text-muted-foreground">{recipe.description}</p>
              )}
            </div>
            {id !== 'new' && !isEditMode && (
              <div className="flex gap-2">
                <Button onClick={() => setIsEditMode(true)} variant="outline">
                  <Icon name="Edit" size={16} className="mr-2" />
                  Редактировать
                </Button>
                <Button onClick={handlePrepareWithMatching}>
                  <Icon name="ChefHat" size={16} className="mr-2" />
                  Приготовить
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {isEditMode ? (
          <Card className="p-6 bg-white/80 backdrop-blur-sm mb-6">
            <div className="space-y-4">
              <div>
                <Label>Название</Label>
                <Input
                  value={recipe?.name || ''}
                  onChange={(e) =>
                    setRecipe((prev) => ({ ...prev!, name: e.target.value }))
                  }
                  placeholder="Название рецепта"
                />
              </div>
              <div>
                <Label>Описание</Label>
                <Textarea
                  value={recipe?.description || ''}
                  onChange={(e) =>
                    setRecipe((prev) => ({ ...prev!, description: e.target.value }))
                  }
                  placeholder="Описание рецепта"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Калории</Label>
                  <Input
                    type="number"
                    value={recipe?.total_calories || ''}
                    onChange={(e) =>
                      setRecipe((prev) => ({
                        ...prev!,
                        total_calories: parseInt(e.target.value),
                      }))
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Время (мин)</Label>
                  <Input
                    type="number"
                    value={recipe?.cooking_time || ''}
                    onChange={(e) =>
                      setRecipe((prev) => ({
                        ...prev!,
                        cooking_time: parseInt(e.target.value),
                      }))
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Порций</Label>
                  <Input
                    type="number"
                    value={recipe?.servings || 1}
                    onChange={(e) =>
                      setRecipe((prev) => ({
                        ...prev!,
                        servings: parseInt(e.target.value),
                      }))
                    }
                    placeholder="1"
                  />
                </div>
              </div>
            </div>
          </Card>
        ) : (
          recipe && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="p-4 bg-white/80 backdrop-blur-sm text-center">
                <Icon name="Flame" size={24} className="mx-auto mb-2 text-orange-500" />
                <p className="text-sm text-muted-foreground">Калории</p>
                <p className="text-xl font-bold">{recipe.total_calories || 0} ккал</p>
              </Card>
              <Card className="p-4 bg-white/80 backdrop-blur-sm text-center">
                <Icon name="Timer" size={24} className="mx-auto mb-2 text-blue-500" />
                <p className="text-sm text-muted-foreground">Время</p>
                <p className="text-xl font-bold">{recipe.cooking_time || 0} мин</p>
              </Card>
              <Card className="p-4 bg-white/80 backdrop-blur-sm text-center">
                <Icon name="Users" size={24} className="mx-auto mb-2 text-green-500" />
                <p className="text-sm text-muted-foreground">Порций</p>
                <p className="text-xl font-bold">{recipe.servings}</p>
              </Card>
            </div>
          )
        )}

        <Card className="p-6 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Ингредиенты</h2>
            {isEditMode && (
              <Button onClick={() => setIsAddIngredientOpen(true)} size="sm">
                <Icon name="Plus" size={16} className="mr-2" />
                Добавить
              </Button>
            )}
          </div>

          {ingredients.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Ингредиенты не добавлены
            </p>
          ) : (
            <div className="space-y-2">
              {ingredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Icon name="CircleDot" size={16} className="text-primary" />
                    <span className="font-medium">{ingredient.product_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      {ingredient.quantity} {ingredient.unit}
                    </Badge>
                    {isEditMode && (
                      <Button
                        onClick={() => handleRemoveIngredient(index)}
                        size="sm"
                        variant="ghost"
                        className="text-red-600"
                      >
                        <Icon name="Trash2" size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {isEditMode && (
          <div className="mt-6 flex gap-3">
            <Button onClick={handleSave} className="flex-1">
              Сохранить рецепт
            </Button>
            <Button
              onClick={() => (id === 'new' ? navigate('/menu') : setIsEditMode(false))}
              variant="outline"
            >
              Отмена
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isAddIngredientOpen} onOpenChange={setIsAddIngredientOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить ингредиент</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Название</Label>
              <Input
                value={newIngredient.product_name}
                onChange={(e) =>
                  setNewIngredient({ ...newIngredient, product_name: e.target.value })
                }
                placeholder="Например: рис"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Количество</Label>
                <Input
                  type="number"
                  value={newIngredient.quantity}
                  onChange={(e) =>
                    setNewIngredient({ ...newIngredient, quantity: e.target.value })
                  }
                  placeholder="200"
                />
              </div>
              <div>
                <Label>Единица</Label>
                <Select
                  value={newIngredient.unit}
                  onValueChange={(value) =>
                    setNewIngredient({ ...newIngredient, unit: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="г">г</SelectItem>
                    <SelectItem value="кг">кг</SelectItem>
                    <SelectItem value="мл">мл</SelectItem>
                    <SelectItem value="л">л</SelectItem>
                    <SelectItem value="шт">шт</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleAddIngredient} className="w-full">
              Добавить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isMatchingDialogOpen} onOpenChange={setIsMatchingDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Сопоставление продуктов</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Выберите продукты из запасов для замены общих названий в рецепте
            </p>

            {ingredients.map((ingredient) => {
              const matchedProductId = productMatches[ingredient.product_name];
              const matchedProduct = availableProducts.find((p) => p.id === matchedProductId);

              return (
                <Card key={ingredient.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">{ingredient.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Требуется: {ingredient.quantity} {ingredient.unit}
                      </p>
                    </div>
                    {matchedProduct && (
                      <Badge className="bg-green-100 text-green-700">
                        <Icon name="Check" size={14} className="mr-1" />
                        Найдено
                      </Badge>
                    )}
                  </div>

                  {matchedProduct ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Icon name="ArrowRight" size={16} />
                      <span>
                        {matchedProduct.name} (доступно: {matchedProduct.quantity}{' '}
                        {matchedProduct.unit})
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-orange-600">Подходящий продукт не найден</p>
                      <Select
                        value={productMatches[ingredient.product_name] || ''}
                        onValueChange={(value) =>
                          setProductMatches({ ...productMatches, [ingredient.product_name]: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите замену" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableProducts
                            .filter((p) => p.quantity >= ingredient.quantity)
                            .map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} ({product.quantity} {product.unit})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </Card>
              );
            })}

            {unmatchedIngredients.length > 0 && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  <Icon name="AlertTriangle" size={16} className="inline mr-2" />
                  {unmatchedIngredients.length} ингредиентов без замены
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleConfirmMatching}
                className="flex-1"
                disabled={unmatchedIngredients.length > 0}
              >
                Подтвердить и приготовить
              </Button>
              <Button
                onClick={() => setIsMatchingDialogOpen(false)}
                variant="outline"
              >
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecipeDetail;
