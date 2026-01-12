import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import Sidebar from '@/components/Sidebar';
import { menuApi, storageApi, Recipe, PreparedMeal, PlannedRecipe, StorageLocation } from '@/lib/api';
import { toast } from 'sonner';

const Menu = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [preparedMeals, setPreparedMeals] = useState<PreparedMeal[]>([]);
  const [plannedRecipes, setPlannedRecipes] = useState<PlannedRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [recipesData, mealsData, plannedData, locationsData] = await Promise.all([
        menuApi.getRecipes(),
        menuApi.getPreparedMeals(),
        menuApi.getPlannedRecipes(),
        storageApi.getLocations(),
      ]);
      setRecipes(recipesData);
      setPreparedMeals(mealsData);
      setPlannedRecipes(plannedData);
      setLocations(locationsData);
    } catch (error) {
      toast.error('Ошибка загрузки данных');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanRecipe = async (recipeId: string) => {
    try {
      const result = await menuApi.planRecipe(recipeId);
      await fetchData();
      
      if (result.missing_products && result.missing_products.length > 0) {
        toast.warning(`Добавлено ${result.missing_products.length} товаров в список покупок`);
      } else {
        toast.success('Рецепт запланирован! Все продукты есть в наличии');
      }
    } catch (error) {
      toast.error('Ошибка планирования');
      console.error(error);
    }
  };

  const handlePrepare = async (plannedId: string) => {
    try {
      await menuApi.prepareRecipe(plannedId);
      await fetchData();
      toast.success('Блюдо приготовлено!');
    } catch (error) {
      toast.error('Ошибка приготовления');
      console.error(error);
    }
  };

  const handleCancel = async (plannedId: string) => {
    try {
      await menuApi.cancelPlan(plannedId);
      await fetchData();
      toast.info('Планирование отменено');
    } catch (error) {
      toast.error('Ошибка отмены');
      console.error(error);
    }
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    try {
      await menuApi.deleteRecipe(recipeId);
      await fetchData();
      toast.success('Рецепт удален');
    } catch (error) {
      toast.error('Ошибка удаления');
      console.error(error);
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    try {
      await menuApi.deletePreparedMeal(mealId);
      await fetchData();
      toast.success('Блюдо удалено');
    } catch (error) {
      toast.error('Ошибка удаления');
      console.error(error);
    }
  };

  const availableRecipes = recipes.filter(r => 
    !plannedRecipes.find(p => p.recipe_id === r.id && p.status === 'planned')
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 p-4">
      <Sidebar locations={locations} />
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 pt-4"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4 hover:bg-white/50"
          >
            <Icon name="ArrowLeft" size={20} className="mr-2" />
            Назад
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-1">
                Меню
              </h1>
              <p className="text-muted-foreground">Готовые блюда и рецепты</p>
            </div>
            <Button onClick={() => navigate('/recipe/new')} size="lg" className="shadow-lg">
              <Icon name="Plus" size={20} className="mr-2" />
              Создать рецепт
            </Button>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {preparedMeals.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Icon name="ChefHat" size={28} className="text-primary" />
                  Готовые блюда
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {preparedMeals.map((meal) => (
                    <Card key={meal.id} className="p-6 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold">{meal.recipe_name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-100 text-green-700">
                            {meal.servings_left} порций
                          </Badge>
                          <Button
                            onClick={() => handleDeleteMeal(meal.id)}
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                          >
                            <Icon name="Trash2" size={14} />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Icon name="Flame" size={16} />
                          {meal.total_calories || 0} ккал
                        </div>
                        <div className="flex items-center gap-1">
                          <Icon name="Calendar" size={16} />
                          {new Date(meal.prepared_date).toLocaleDateString('ru')}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {plannedRecipes.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Icon name="Clock" size={28} className="text-orange-500" />
                  Запланировано
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {plannedRecipes.map((planned) => (
                    <Card key={planned.id} className="p-6 bg-white/80 backdrop-blur-sm">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold">{planned.recipe_name}</h3>
                        <Badge className="bg-orange-100 text-orange-700">Ожидает</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Icon name="Flame" size={16} />
                          {planned.total_calories || 0} ккал
                        </div>
                        <div className="flex items-center gap-1">
                          <Icon name="Timer" size={16} />
                          {planned.cooking_time || 0} мин
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handlePrepare(planned.id)}
                          size="sm"
                          className="flex-1"
                        >
                          <Icon name="Check" size={16} className="mr-1" />
                          Приготовлено
                        </Button>
                        <Button
                          onClick={() => handleCancel(planned.id)}
                          size="sm"
                          variant="outline"
                          className="flex-1"
                        >
                          <Icon name="X" size={16} className="mr-1" />
                          Отмена
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Icon name="BookOpen" size={28} className="text-blue-500" />
                Доступные рецепты
              </h2>
              {availableRecipes.length === 0 ? (
                <Card className="p-8 text-center bg-white/80 backdrop-blur-sm">
                  <Icon name="Utensils" size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Все рецепты запланированы</p>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {availableRecipes.map((recipe) => (
                    <Card key={recipe.id} className="p-6 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
                      <h3 
                        className="text-lg font-semibold mb-2 cursor-pointer hover:text-primary transition-colors"
                        onClick={() => navigate(`/recipe/${recipe.id}`)}
                      >
                        {recipe.name}
                      </h3>
                      {recipe.description && (
                        <p className="text-sm text-muted-foreground mb-3">{recipe.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Icon name="Flame" size={16} />
                          {recipe.total_calories || 0} ккал
                        </div>
                        <div className="flex items-center gap-1">
                          <Icon name="Timer" size={16} />
                          {recipe.cooking_time || 0} мин
                        </div>
                        <div className="flex items-center gap-1">
                          <Icon name="Users" size={16} />
                          {recipe.servings} порций
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handlePlanRecipe(recipe.id)}
                          className="flex-1"
                          size="sm"
                        >
                          <Icon name="CalendarPlus" size={16} className="mr-2" />
                          Запланировать
                        </Button>
                        <Button
                          onClick={() => navigate(`/recipe/${recipe.id}`)}
                          variant="outline"
                          size="sm"
                        >
                          <Icon name="Eye" size={16} />
                        </Button>
                        <Button
                          onClick={() => handleDeleteRecipe(recipe.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Icon name="Trash2" size={16} />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Menu;