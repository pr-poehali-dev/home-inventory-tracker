import { useState } from 'react';
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
import { storageApi } from '@/lib/api';

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storageLocationId: string;
  onProductAdded?: () => void;
}

export const AddProductDialog = ({
  open,
  onOpenChange,
  storageLocationId,
  onProductAdded,
}: AddProductDialogProps) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('шт');
  const [category, setCategory] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !quantity) {
      toast.error('Заполните обязательные поля');
      return;
    }

    setIsSubmitting(true);
    try {
      await storageApi.addProduct({
        name,
        quantity: parseFloat(quantity),
        unit,
        category: category || undefined,
        expiryDate: expiryDate || undefined,
        storageLocationId,
        notes: notes || undefined,
      });
      
      toast.success(`Товар "${name}" добавлен`);
      onOpenChange(false);
      resetForm();
      onProductAdded?.();
    } catch (error) {
      toast.error('Ошибка добавления товара');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setQuantity('');
    setUnit('шт');
    setCategory('');
    setExpiryDate('');
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Package" size={24} />
            Добавить товар
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Название *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Молоко, хлеб..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="quantity">Количество *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.1"
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
              placeholder="Молочные, овощи..."
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
              placeholder="Дополнительная информация..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Отмена
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-primary to-secondary" disabled={isSubmitting}>
              <Icon name="Plus" size={18} className="mr-2" />
              {isSubmitting ? 'Добавление...' : 'Добавить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};