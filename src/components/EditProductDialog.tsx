import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { storageApi, Product } from '@/lib/api';

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onProductUpdated?: () => void;
}

export const EditProductDialog = ({
  open,
  onOpenChange,
  product,
  onProductUpdated,
}: EditProductDialogProps) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('шт');
  const [category, setCategory] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [caloriesPer100g, setCaloriesPer100g] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setQuantity(String(product.quantity));
      setUnit(product.unit);
      setCategory(product.category || '');
      setExpiryDate(product.expiry_date ? product.expiry_date.split('T')[0] : '');
      setNotes(product.notes || '');
      setCaloriesPer100g(product.calories_per_100g ? String(product.calories_per_100g) : '');
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !quantity || !product) {
      toast.error('Заполните обязательные поля');
      return;
    }

    setIsSubmitting(true);
    try {
      await storageApi.updateProduct(product.id, {
        name,
        quantity: parseFloat(quantity),
        unit,
        category: category || undefined,
        expiryDate: expiryDate || undefined,
        notes: notes || undefined,
        caloriesPer100g: caloriesPer100g ? parseInt(caloriesPer100g) : undefined,
      });

      toast.success('Продукт обновлен');
      onProductUpdated?.();
      onOpenChange(false);
    } catch (error) {
      toast.error('Ошибка обновления продукта');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Редактировать продукт</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Название *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Молоко"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="quantity">Количество *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                required
              />
            </div>
            <div>
              <Label htmlFor="unit">Единица</Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="шт, кг, л"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="category">Категория</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Молочные продукты"
            />
          </div>

          <div>
            <Label htmlFor="caloriesPer100g">Калорийность (ккал на 100г)</Label>
            <Input
              id="caloriesPer100g"
              type="number"
              value={caloriesPer100g}
              onChange={(e) => setCaloriesPer100g(e.target.value)}
              placeholder="60"
            />
          </div>

          <div>
            <Label htmlFor="expiryDate">Срок годности</Label>
            <Input
              id="expiryDate"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="notes">Заметки</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Дополнительная информация"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Icon name="Save" size={16} className="mr-2" />
                  Сохранить
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
