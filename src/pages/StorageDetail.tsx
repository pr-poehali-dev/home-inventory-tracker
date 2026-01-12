import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import Sidebar from '@/components/Sidebar';
import { storageApi, StorageLocation, Product } from '@/lib/api';
import { AddProductDialog } from '@/components/AddProductDialog';
import { ProductCard } from '@/components/ProductCard';
import { toast } from 'sonner';

const StorageDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [location, setLocation] = useState<StorageLocation | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    if (!id) return;
    
    try {
      const [data, locationsData] = await Promise.all([
        storageApi.getLocationWithProducts(id),
        storageApi.getLocations()
      ]);
      setLocation(data.location);
      setProducts(data.products);
      setLocations(locationsData);
    } catch (error) {
      toast.error('Ошибка загрузки данных');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(cats);
  }, [products]);

  const handleDeleteProduct = async (productId: string) => {
    try {
      await storageApi.deleteProduct(productId);
      await fetchData();
      toast.success('Продукт удален');
    } catch (error) {
      toast.error('Ошибка удаления');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50">
        <p>Место хранения не найдено</p>
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
            onClick={() => navigate('/')}
            className="mb-4 hover:bg-white/50"
          >
            <Icon name="ArrowLeft" size={20} className="mr-2" />
            Назад
          </Button>

          <div className="flex items-center gap-4 mb-4">
            <div className={`${location.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg`}>
              <Icon name={location.icon as any} size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{location.name}</h1>
              <p className="text-muted-foreground">
                {products.length} товаров
              </p>
            </div>
          </div>

          {categories.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <Badge key={cat} variant="secondary" className="text-sm">
                  {cat}
                </Badge>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-3 mb-20"
        >
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ProductCard product={product} onDelete={handleDeleteProduct} />
            </motion.div>
          ))}

          {products.length === 0 && (
            <Card className="p-12 text-center bg-white/80 backdrop-blur-sm">
              <Icon name="Package" size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground mb-2">
                Пока пусто
              </p>
              <p className="text-sm text-muted-foreground">
                Добавьте первый товар
              </p>
            </Card>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="fixed bottom-6 left-0 right-0 px-4 max-w-4xl mx-auto"
        >
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            size="lg"
            className="w-full text-lg h-14 bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-xl"
          >
            <Icon name="Plus" size={24} className="mr-2" />
            Добавить товар
          </Button>
        </motion.div>

        <AddProductDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          storageLocationId={id || ''}
          onProductAdded={fetchData}
        />
      </div>
    </div>
  );
};

export default StorageDetail;