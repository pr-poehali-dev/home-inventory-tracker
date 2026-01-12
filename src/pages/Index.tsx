import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import Sidebar from '@/components/Sidebar';
import { storageApi, shoppingApi, StorageLocation, ShoppingItem } from '@/lib/api';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [locationsData, shoppingData] = await Promise.all([
          storageApi.getLocations(),
          shoppingApi.getItems()
        ]);
        setLocations(locationsData);
        setShoppingItems(shoppingData);
      } catch (error) {
        toast.error('Ошибка загрузки данных');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    (deferredPrompt as any).prompt();
    const { outcome } = await (deferredPrompt as any).userChoice;

    if (outcome === 'accepted') {
      toast.success('Приложение установлено!');
    }

    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  const toggleShoppingItem = async (id: string) => {
    const item = shoppingItems.find((i) => i.id === id);
    if (!item) return;

    try {
      await shoppingApi.toggleItem(id, !item.is_purchased);
      setShoppingItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, is_purchased: !i.is_purchased } : i
        )
      );
    } catch (error) {
      toast.error('Ошибка обновления');
      console.error(error);
    }
  };

  const unpurchasedItems = shoppingItems.filter((item) => !item.is_purchased);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 p-4 pb-20">
      <Sidebar locations={locations} />
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 pt-6"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">
            Мои запасы
          </h1>
          <p className="text-muted-foreground text-lg">
            Управляйте продуктами и покупками легко
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {unpurchasedItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Icon name="ShoppingCart" size={24} className="text-primary" />
                        Список покупок
                      </h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/shopping-list')}
                      >
                        Все
                        <Icon name="ChevronRight" size={16} className="ml-1" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
                    {unpurchasedItems.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Checkbox
                          checked={item.is_purchased}
                          onCheckedChange={() => toggleShoppingItem(item.id)}
                          className="w-5 h-5"
                        />
                        <div className="flex-1">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {item.quantity} {item.unit}
                          </span>
                        </div>
                        {item.category && (
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}



            {showInstallButton && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-4"
              >
                <Button
                  onClick={handleInstallClick}
                  size="lg"
                  className="w-full h-14 text-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg"
                >
                  <Icon name="Download" size={24} className="mr-2" />
                  Установить приложение
                </Button>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex gap-3"
            >
              <Button
                onClick={() => navigate('/receipts')}
                size="lg"
                variant="outline"
                className="flex-1 text-lg h-16 border-2 hover:bg-primary/10 hover:border-primary transition-all"
              >
                <Icon name="Receipt" size={24} className="mr-2" />
                Чеки
              </Button>
              <Button
                onClick={() => navigate('/scan')}
                size="lg"
                className="h-16 px-6 bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg"
              >
                <Icon name="QrCode" size={28} />
              </Button>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default Index;