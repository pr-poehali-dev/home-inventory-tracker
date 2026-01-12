import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import Sidebar from '@/components/Sidebar';
import { storageApi, StorageLocation } from '@/lib/api';
import { toast } from 'sonner';
import { Html5QrcodeScanner, Html5QrcodeScannerState } from 'html5-qrcode';

const ScanReceipt = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const data = await storageApi.getLocations();
        setLocations(data);
      } catch (error) {
        console.error(error);
      }
    };
    
    fetchLocations();

    return () => {
      if (scannerRef.current && scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const handleStartScan = async () => {
    if (!scannerDivRef.current) {
      toast.error('Ошибка инициализации сканера');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Camera permission error:', error);
      toast.error('Не удалось получить доступ к камере. Проверьте разрешения в браузере.');
      return;
    }
    
    setIsScanning(true);
    
    try {
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
        },
        false
      );
      
      scannerRef.current = scanner;

      scanner.render(
        (decodedText) => {
          toast.success('QR-код успешно отсканирован!');
          console.log('Scanned:', decodedText);
          
          scanner.clear().catch(console.error);
          setIsScanning(false);
          
          setTimeout(() => navigate('/'), 500);
        },
        (error) => {
          console.warn('QR scan error:', error);
        }
      );
    } catch (error) {
      console.error('Scanner initialization error:', error);
      toast.error('Ошибка запуска сканера');
      setIsScanning(false);
    }
  };

  const handleStopScan = () => {
    if (scannerRef.current) {
      scannerRef.current.clear()
        .then(() => {
          setIsScanning(false);
          toast.info('Сканирование остановлено');
        })
        .catch(console.error);
    }
  };

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
            {isScanning ? (
              <div className="space-y-4">
                <div id="qr-reader" ref={scannerDivRef} className="w-full"></div>
                <Button
                  onClick={handleStopScan}
                  size="lg"
                  variant="outline"
                  className="w-full text-lg h-14"
                >
                  <Icon name="X" size={24} className="mr-2" />
                  Отменить
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mb-6">
                  <div className="relative mx-auto w-64 h-64 rounded-3xl bg-gradient-to-br from-purple-100 to-cyan-100 flex items-center justify-center overflow-hidden">
                    <Icon name="QrCode" size={120} className="text-muted-foreground" />
                  </div>
                </div>
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