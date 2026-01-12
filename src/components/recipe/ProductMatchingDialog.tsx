import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RecipeIngredient, Product } from '@/lib/api';

interface ProductMatchingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  ingredients: RecipeIngredient[];
  availableProducts: Product[];
  productMatches: { [key: string]: string };
  setProductMatches: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  onConfirm: () => void;
}

export const ProductMatchingDialog = ({
  isOpen,
  onClose,
  ingredients,
  availableProducts,
  productMatches,
  setProductMatches,
  onConfirm,
}: ProductMatchingDialogProps) => {
  const unmatchedIngredients = ingredients.filter(
    (ing) => !productMatches[ing.product_name]
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
              onClick={onConfirm}
              className="flex-1"
              disabled={unmatchedIngredients.length > 0}
            >
              Подтвердить и приготовить
            </Button>
            <Button onClick={onClose} variant="outline">
              Отмена
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
