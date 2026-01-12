import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

const ScanReceipt = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);

  const handleStartScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      toast.success('QR-код успешно отсканирован!');
      navigate('/');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 p-4">
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

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-accent to-primary flex items-center justify-center text-white shadow-lg">
              <Icon name="QrCode" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Сканирование чека</h1>
              <p className="text-muted-foreground">
                Наведите камеру на QR-код
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-8 bg-white/80 backdrop-blur-sm text-center">
            <div className="mb-6">
              <div className="relative mx-auto w-64 h-64 rounded-3xl bg-gradient-to-br from-purple-100 to-cyan-100 flex items-center justify-center overflow-hidden">
                {isScanning ? (
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                    }}
                    className="absolute inset-0 bg-gradient-to-br from-primary to-accent opacity-20"
                  />
                ) : null}
                <Icon
                  name="QrCode"
                  size={120}
                  className={isScanning ? 'text-primary animate-pulse' : 'text-muted-foreground'}
                />
              </div>
            </div>

            {isScanning ? (
              <div className="space-y-4">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <p className="text-xl font-semibold text-primary">
                    Сканирование...
                  </p>
                </motion.div>
                <p className="text-muted-foreground">
                  Обрабатываем данные чека
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-lg font-medium">
                  QR-код на чеке находится внизу
                </p>
                <p className="text-muted-foreground mb-6">
                  Мы автоматически добавим товары из чека в ваши запасы
                </p>
                <Button
                  onClick={handleStartScan}
                  size="lg"
                  className="w-full text-lg h-14 bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg"
                >
                  <Icon name="Camera" size={24} className="mr-2" />
                  Начать сканирование
                </Button>
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <Card className="p-6 bg-white/60 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                <Icon name="Info" size={20} className="text-accent" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Как это работает?</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Icon name="Check" size={16} className="mt-0.5 flex-shrink-0 text-primary" />
                    Отсканируйте QR-код на кассовом чеке
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Check" size={16} className="mt-0.5 flex-shrink-0 text-primary" />
                    Мы получим список покупок из ФНС
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Check" size={16} className="mt-0.5 flex-shrink-0 text-primary" />
                    Товары автоматически добавятся в нужные места хранения
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ScanReceipt;
