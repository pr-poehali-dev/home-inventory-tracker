import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { StorageLocation } from '@/lib/api';

interface SidebarProps {
  locations: StorageLocation[];
}

const Sidebar = ({ locations }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isStorageExpanded, setIsStorageExpanded] = useState(true);

  const menuItems = [
    { path: '/', icon: 'Home', label: 'Главная' },
    { path: '/shopping-list', icon: 'ShoppingCart', label: 'Список покупок' },
    { path: '/receipts', icon: 'Receipt', label: 'Чеки' },
    { path: '/scan', icon: 'QrCode', label: 'Сканировать' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-40 w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white"
      >
        <Icon name="Menu" size={24} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />

            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Мои запасы
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon name="X" size={24} />
                  </Button>
                </div>

                <nav className="space-y-2">
                  {menuItems.map((item) => (
                    <Button
                      key={item.path}
                      variant={isActive(item.path) ? 'default' : 'ghost'}
                      className="w-full justify-start text-base h-12"
                      onClick={() => {
                        navigate(item.path);
                        setIsOpen(false);
                      }}
                    >
                      <Icon name={item.icon as any} size={20} className="mr-3" />
                      {item.label}
                    </Button>
                  ))}

                  <div className="pt-4 mt-4 border-t">
                    <Button
                      variant="ghost"
                      className="w-full justify-between text-base h-12 mb-2"
                      onClick={() => setIsStorageExpanded(!isStorageExpanded)}
                    >
                      <div className="flex items-center">
                        <Icon name="Package" size={20} className="mr-3" />
                        Запасы
                      </div>
                      <Icon
                        name={isStorageExpanded ? 'ChevronDown' : 'ChevronRight'}
                        size={20}
                      />
                    </Button>

                    <AnimatePresence>
                      {isStorageExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-1 pl-4">
                            {locations.map((loc) => (
                              <Button
                                key={loc.id}
                                variant="ghost"
                                className="w-full justify-start text-sm h-10"
                                onClick={() => {
                                  navigate(`/storage/${loc.id}`);
                                  setIsOpen(false);
                                }}
                              >
                                <div
                                  className={`${loc.color} w-6 h-6 rounded-lg flex items-center justify-center text-white mr-2`}
                                >
                                  <Icon name={loc.icon as any} size={14} />
                                </div>
                                {loc.name}
                                <span className="ml-auto text-xs text-muted-foreground">
                                  {loc.items_count}
                                </span>
                              </Button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
