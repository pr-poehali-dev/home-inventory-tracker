import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { storageApi, StorageLocation } from '@/lib/api';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const data = await storageApi.getLocations();
        setLocations(data);
      } catch (error) {
        toast.error('Ошибка загрузки данных');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, []);

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
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-4 md:grid-cols-2 mb-6"
          >
            {locations.map((location) => (
            <motion.div key={location.id} variants={itemVariants}>
              <Card
                className="p-6 cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm border-2 hover:border-primary"
                onClick={() => navigate(`/storage/${location.id}`)}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`${location.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg`}
                  >
                    <Icon name={location.icon as any} size={28} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-1">{location.name}</h3>
                    <p className="text-muted-foreground">
                      {location.items_count} товаров
                    </p>
                  </div>
                  <Icon name="ChevronRight" size={24} className="text-muted-foreground" />
                </div>
              </Card>
            </motion.div>
          ))}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex gap-3"
        >
          <Button
            onClick={() => navigate('/shopping-list')}
            size="lg"
            className="flex-1 text-lg h-16 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity shadow-lg"
          >
            <Icon name="ShoppingCart" size={24} className="mr-2" />
            Список покупок
          </Button>
          <Button
            onClick={() => navigate('/scan')}
            size="lg"
            variant="outline"
            className="h-16 px-6 border-2 hover:bg-accent/10 hover:border-accent transition-all"
          >
            <Icon name="QrCode" size={28} />
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;