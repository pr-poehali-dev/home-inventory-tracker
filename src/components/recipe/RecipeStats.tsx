import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Recipe } from '@/lib/api';

interface RecipeStatsProps {
  recipe: Recipe;
}

export const RecipeStats = ({ recipe }: RecipeStatsProps) => {
  return (
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
  );
};
