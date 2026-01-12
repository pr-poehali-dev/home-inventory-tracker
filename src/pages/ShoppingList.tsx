import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import Sidebar from '@/components/Sidebar';
import { shoppingApi, storageApi, ShoppingItem, StorageLocation } from '@/lib/api';
import { AddShoppingItemDialog } from '@/components/AddShoppingItemDialog';
import { toast } from 'sonner';

const ShoppingList = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = async () => {
    try {
      const [itemsData, locationsData] = await Promise.all([
        shoppingApi.getItems(),
        storageApi.getLocations()
      ]);
      setItems(itemsData);
      setLocations(locationsData);
    } catch (error) {
      toast.error('Ошибка загрузки списка');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const toggleItem = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    try {
      await shoppingApi.toggleItem(id, !item.is_purchased);
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, is_purchased: !i.is_purchased } : i
        )
      );
    } catch (error) {
      toast.error('Ошибка обновления статуса');
      console.error(error);
    }
  };

  const unpurchasedItems = items.filter((item) => !item.is_purchased);
  const purchasedItems = items.filter((item) => item.is_purchased);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 p-4">
      <Sidebar locations={locations} />
      <div className="max-w-4xl mx-auto pb-24">
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

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-1">
                Список покупок
              </h1>
              <p className="text-muted-foreground">
                {unpurchasedItems.length} товаров к покупке
              </p>
            </div>
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white shadow-lg`}>
              <Icon name="ShoppingCart" size={32} />
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {unpurchasedItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Icon name="ListTodo" size={20} />
                К покупке
              </h2>
              <div className="space-y-2">
                {unpurchasedItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="p-4 bg-white/80 backdrop-blur-sm hover:shadow-md transition-all">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={item.is_purchased}
                          onCheckedChange={() => toggleItem(item.id)}
                          className="w-5 h-5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{item.name}</span>
                            {item.category && (
                              <Badge variant="outline" className="text-xs">
                                {item.category}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} {item.unit}
                          </p>
                          {item.notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {purchasedItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                <Icon name="CheckCircle2" size={20} />
                Куплено
              </h2>
              <div className="space-y-2">
                {purchasedItems.map((item) => (
                  <Card
                    key={item.id}
                    className="p-4 bg-white/60 backdrop-blur-sm opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={item.is_purchased}
                        onCheckedChange={() => toggleItem(item.id)}
                        className="w-5 h-5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium line-through">
                            {item.name}
                          </span>
                          {item.category && (
                            <Badge variant="outline" className="text-xs">
                              {item.category}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} {item.unit}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {items.length === 0 && (
            <Card className="p-12 text-center bg-white/80 backdrop-blur-sm">
              <Icon name="ShoppingCart" size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground mb-2">
                Список пуст
              </p>
              <p className="text-sm text-muted-foreground">
                Добавьте товары для покупки
              </p>
            </Card>
          )}
          </div>
        )}

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

        <AddShoppingItemDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onItemAdded={fetchItems}
        />
      </div>
    </div>
  );
};

export default ShoppingList;