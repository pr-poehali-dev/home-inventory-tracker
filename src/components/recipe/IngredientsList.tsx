import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RecipeIngredient } from '@/lib/api';
import { toast } from 'sonner';

interface IngredientsListProps {
  ingredients: RecipeIngredient[];
  isEditMode: boolean;
  onAddIngredient: (ingredient: RecipeIngredient) => void;
  onRemoveIngredient: (index: number) => void;
  recipeId: string | undefined;
}

export const IngredientsList = ({
  ingredients,
  isEditMode,
  onAddIngredient,
  onRemoveIngredient,
  recipeId,
}: IngredientsListProps) => {
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false);
  const [newIngredient, setNewIngredient] = useState({
    product_name: '',
    quantity: '',
    unit: 'г',
  });

  const handleAddIngredient = () => {
    if (!newIngredient.product_name || !newIngredient.quantity) {
      toast.error('Заполните все поля');
      return;
    }

    onAddIngredient({
      id: Math.random().toString(),
      recipe_id: recipeId || '',
      product_name: newIngredient.product_name,
      quantity: parseFloat(newIngredient.quantity),
      unit: newIngredient.unit,
    });
    setNewIngredient({ product_name: '', quantity: '', unit: 'г' });
    setIsAddIngredientOpen(false);
    toast.success('Ингредиент добавлен');
  };

  return (
    <>
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
                      onClick={() => onRemoveIngredient(index)}
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
    </>
  );
};
