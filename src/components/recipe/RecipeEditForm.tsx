import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Recipe } from '@/lib/api';

interface RecipeEditFormProps {
  recipe: Recipe | null;
  setRecipe: React.Dispatch<React.SetStateAction<Recipe | null>>;
}

export const RecipeEditForm = ({ recipe, setRecipe }: RecipeEditFormProps) => {
  return (
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
  );
};
