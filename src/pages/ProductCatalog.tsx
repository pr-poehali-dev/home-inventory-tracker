import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import Sidebar from '@/components/Sidebar';
import { catalogApi, ProductCatalog, storageApi, StorageLocation } from '@/lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export const ProductCatalogPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductCatalog[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductCatalog | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [caloriesPer100g, setCaloriesPer100g] = useState('');
  const [defaultUnit, setDefaultUnit] = useState('г');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [catalogData, locationsData] = await Promise.all([
        catalogApi.getProducts(),
        storageApi.getLocations(),
      ]);
      setProducts(catalogData);
      setLocations(locationsData);
    } catch (error) {
      toast.error('Ошибка загрузки справочника');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Укажите название товара');
      return;
    }

    try {
      const data = {
        name: name.trim(),
        category: category.trim() || undefined,
        calories_per_100g: caloriesPer100g ? parseInt(caloriesPer100g) : undefined,
        default_unit: defaultUnit,
      };

      if (editingProduct) {
        await catalogApi.updateProduct({ ...data, id: editingProduct.id });
        toast.success('Товар обновлен');
      } else {
        await catalogApi.createProduct(data);
        toast.success('Товар добавлен');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Ошибка сохранения товара');
      console.error(error);
    }
  };

  const handleEdit = (product: ProductCatalog) => {
    setEditingProduct(product);
    setName(product.name);
    setCategory(product.category || '');
    setCaloriesPer100g(product.calories_per_100g ? String(product.calories_per_100g) : '');
    setDefaultUnit(product.default_unit);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить этот товар из справочника?')) return;

    try {
      await catalogApi.deleteProduct(id);
      toast.success('Товар удален');
      fetchData();
    } catch (error) {
      toast.error('Ошибка удаления товара');
      console.error(error);
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setName('');
    setCategory('');
    setCaloriesPer100g('');
    setDefaultUnit('г');
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 flex items-center justify-center">
        <Icon name="Loader2" size={48} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 pb-20">
      <Sidebar locations={locations} />
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6 pt-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4 hover:bg-white/50"
          >
            <Icon name="ArrowLeft" size={20} className="mr-2" />
            Назад
          </Button>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Справочник товаров
              </h1>
              <p className="text-muted-foreground mt-1">
                Управление товарами и калорийностью
              </p>
            </div>
            <Button
              onClick={openAddDialog}
              className="bg-gradient-to-r from-primary to-secondary"
            >
              <Icon name="Plus" size={20} className="mr-2" />
              Добавить товар
            </Button>
          </div>

          <div className="relative">
            <Icon
              name="Search"
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Поиск товаров..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/80"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredProducts.length === 0 ? (
            <Card className="p-8 text-center bg-white/80 backdrop-blur-sm">
              <Icon name="Package" size={48} className="mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Товары не найдены' : 'Справочник пуст'}
              </p>
              {!searchQuery && (
                <Button onClick={openAddDialog} variant="outline">
                  Добавить первый товар
                </Button>
              )}
            </Card>
          ) : (
            filteredProducts.map((product) => (
              <Card key={product.id} className="p-4 bg-white/80 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      {product.category && (
                        <div className="flex items-center gap-1">
                          <Icon name="Tag" size={14} />
                          <span>{product.category}</span>
                        </div>
                      )}
                      {product.calories_per_100g && (
                        <div className="flex items-center gap-1">
                          <Icon name="Flame" size={14} />
                          <span className="font-medium text-orange-600">
                            {product.calories_per_100g} ккал/100{product.default_unit}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(product)}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      <Icon name="Pencil" size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Icon name="Trash2" size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Редактировать товар' : 'Добавить товар'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Название товара *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Огурцы"
              />
            </div>

            <div>
              <Label htmlFor="category">Категория</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Овощи"
              />
            </div>

            <div>
              <Label htmlFor="calories">Калорийность на 100г</Label>
              <Input
                id="calories"
                type="number"
                value={caloriesPer100g}
                onChange={(e) => setCaloriesPer100g(e.target.value)}
                placeholder="15"
              />
            </div>

            <div>
              <Label htmlFor="unit">Единица измерения</Label>
              <Input
                id="unit"
                value={defaultUnit}
                onChange={(e) => setDefaultUnit(e.target.value)}
                placeholder="г"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductCatalogPage;
