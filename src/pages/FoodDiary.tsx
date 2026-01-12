import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { foodDiaryApi, FoodDiaryEntry, menuApi, PreparedMeal, settingsApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const FoodDiary = () => {
  const [entries, setEntries] = useState<FoodDiaryEntry[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(2000);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [preparedMeals, setPreparedMeals] = useState<PreparedMeal[]>([]);

  const [mealName, setMealName] = useState('');
  const [portionWeight, setPortionWeight] = useState('');
  const [calories, setCalories] = useState('');
  const [mealType, setMealType] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [diaryData, meals, settings] = await Promise.all([
        foodDiaryApi.getTodayEntries(),
        menuApi.getPreparedMeals(),
        settingsApi.getSettings(),
      ]);
      
      setEntries(diaryData.entries);
      setTotalCalories(diaryData.total_calories);
      setPreparedMeals(meals);
      setDailyGoal(settings.daily_calorie_goal);
    } catch (error) {
      toast.error('Ошибка загрузки дневника');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEntry = async () => {
    if (!mealName || !portionWeight || !calories) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    try {
      await foodDiaryApi.addEntry({
        meal_name: mealName,
        portion_weight: parseFloat(portionWeight),
        calories: parseFloat(calories),
        meal_type: mealType || undefined,
      });

      toast.success('Запись добавлена');
      setIsAddDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Ошибка добавления записи');
      console.error(error);
    }
  };

  const handleAddFromMeal = async (meal: PreparedMeal) => {
    setMealName(meal.recipe_name);
    
    if (meal.total_weight && meal.total_calories) {
      const portionSize = Math.round(meal.total_weight / (meal.servings_left || 1));
      const portionCalories = Math.round((meal.total_calories * portionSize) / 100);
      
      setPortionWeight(String(portionSize));
      setCalories(String(portionCalories));
    }
    
    setIsAddDialogOpen(true);
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await foodDiaryApi.deleteEntry(id);
      toast.success('Запись удалена');
      fetchData();
    } catch (error) {
      toast.error('Ошибка удаления записи');
      console.error(error);
    }
  };

  const resetForm = () => {
    setMealName('');
    setPortionWeight('');
    setCalories('');
    setMealType('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Icon name="Loader2" size={48} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-20">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Дневник питания
            </h1>
            <p className="text-muted-foreground mt-1">
              {new Date().toLocaleDateString('ru-RU', { 
                day: 'numeric', 
                month: 'long',
                weekday: 'long' 
              })}
            </p>
          </div>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-gradient-to-r from-primary to-secondary"
          >
            <Icon name="Plus" size={20} className="mr-2" />
            Добавить
          </Button>
        </div>

        <Card className="p-6 bg-white/80 backdrop-blur-sm mb-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Icon name="Flame" size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Калории за сегодня</p>
                  <p className="text-3xl font-bold">
                    {Math.round(totalCalories)} <span className="text-lg text-muted-foreground">/ {dailyGoal}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Прогресс</span>
                <span className={`font-medium ${totalCalories > dailyGoal ? 'text-red-600' : 'text-green-600'}`}>
                  {Math.round((totalCalories / dailyGoal) * 100)}%
                </span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all rounded-full ${
                    totalCalories > dailyGoal 
                      ? 'bg-gradient-to-r from-orange-500 to-red-600' 
                      : 'bg-gradient-to-r from-green-500 to-emerald-600'
                  }`}
                  style={{ width: `${Math.min((totalCalories / dailyGoal) * 100, 100)}%` }}
                />
              </div>
              {totalCalories > dailyGoal && (
                <p className="text-xs text-red-600 mt-2">
                  Превышение на {Math.round(totalCalories - dailyGoal)} ккал
                </p>
              )}
              {totalCalories < dailyGoal && (
                <p className="text-xs text-green-600 mt-2">
                  Осталось {Math.round(dailyGoal - totalCalories)} ккал
                </p>
              )}
            </div>
          </div>
        </Card>

        {preparedMeals.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Icon name="ChefHat" size={20} />
              Готовые блюда
            </h2>
            <div className="grid gap-3">
              {preparedMeals.map((meal) => (
                <Card
                  key={meal.id}
                  className="p-4 bg-white/80 backdrop-blur-sm hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleAddFromMeal(meal)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{meal.recipe_name}</h3>
                      {meal.total_calories && (
                        <p className="text-sm text-muted-foreground">
                          {Math.round(meal.total_calories)} ккал/100г
                        </p>
                      )}
                    </div>
                    <Button size="sm" variant="ghost" className="text-green-600">
                      <Icon name="Plus" size={16} />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-lg font-semibold mb-3">Сегодня съедено</h2>
          {entries.length === 0 ? (
            <Card className="p-8 text-center bg-white/80 backdrop-blur-sm">
              <Icon name="Utensils" size={48} className="mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">Пока нет записей за сегодня</p>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                variant="outline"
                className="mt-4"
              >
                Добавить первую запись
              </Button>
            </Card>
          ) : (
            entries.map((entry) => (
              <Card key={entry.id} className="p-4 bg-white/80 backdrop-blur-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{entry.meal_name}</h3>
                      {entry.meal_type && (
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {entry.meal_type}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Icon name="Weight" size={14} />
                        <span>{entry.portion_weight} г</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="Flame" size={14} />
                        <span className="font-medium text-orange-600">
                          {Math.round(entry.calories)} ккал
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="Clock" size={14} />
                        <span>
                          {new Date(entry.eaten_date).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDeleteEntry(entry.id)}
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Icon name="Trash2" size={16} />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Добавить приём пищи</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="mealName">Название блюда *</Label>
                <Input
                  id="mealName"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  placeholder="Овсяная каша"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="portionWeight">Вес (г) *</Label>
                  <Input
                    id="portionWeight"
                    type="number"
                    value={portionWeight}
                    onChange={(e) => setPortionWeight(e.target.value)}
                    placeholder="150"
                  />
                </div>
                <div>
                  <Label htmlFor="calories">Калории *</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="250"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="mealType">Тип приёма пищи</Label>
                <Input
                  id="mealType"
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                  placeholder="Завтрак, обед, ужин..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  resetForm();
                }}
              >
                Отмена
              </Button>
              <Button onClick={handleAddEntry} className="bg-gradient-to-r from-primary to-secondary">
                <Icon name="Plus" size={16} className="mr-2" />
                Добавить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default FoodDiary;