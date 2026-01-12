import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import Sidebar from '@/components/Sidebar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { storageApi, StorageLocation } from '@/lib/api';
import { toast } from 'sonner';

const ICONS = ['Refrigerator', 'UtensilsCrossed', 'Home', 'Package', 'Box', 'Archive'];
const COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-orange-500',
  'bg-cyan-500',
];

const StorageManagement = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<StorageLocation | null>(null);
  const [formData, setFormData] = useState({ name: '', icon: 'Package', color: 'bg-blue-500' });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const data = await storageApi.getLocations();
      setLocations(data);
    } catch (error) {
      toast.error('Ошибка загрузки');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (location: StorageLocation) => {
    setEditingLocation(location);
    setFormData({ name: location.name, icon: location.icon, color: location.color });
    setIsEditDialogOpen(true);
  };

  const handleAdd = () => {
    setFormData({ name: '', icon: 'Package', color: 'bg-blue-500' });
    setIsAddDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingLocation || !formData.name.trim()) return;

    try {
      await storageApi.updateLocation(editingLocation.id, formData);
      await fetchLocations();
      setIsEditDialogOpen(false);
      toast.success('Место обновлено');
    } catch (error) {
      toast.error('Ошибка обновления');
      console.error(error);
    }
  };

  const handleSaveAdd = async () => {
    if (!formData.name.trim()) return;

    try {
      await storageApi.createLocation(formData);
      await fetchLocations();
      setIsAddDialogOpen(false);
      toast.success('Место добавлено');
    } catch (error) {
      toast.error('Ошибка создания');
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить это место хранения?')) return;

    try {
      await storageApi.deleteLocation(id);
      await fetchLocations();
      toast.success('Место удалено');
    } catch (error) {
      toast.error('Ошибка удаления');
      console.error(error);
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

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-1">
                Управление местами
              </h1>
              <p className="text-muted-foreground">{locations.length} мест хранения</p>
            </div>
            <Button onClick={handleAdd} size="lg" className="shadow-lg">
              <Icon name="Plus" size={20} className="mr-2" />
              Добавить
            </Button>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-4 md:grid-cols-2"
          >
            {locations.map((location) => (
              <Card
                key={location.id}
                className="p-6 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`${location.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg`}
                  >
                    <Icon name={location.icon as any} size={28} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{location.name}</h3>
                    <p className="text-muted-foreground text-sm">
                      {location.items_count} товаров
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(location)}
                  >
                    <Icon name="Edit" size={16} className="mr-2" />
                    Изменить
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(location.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Icon name="Trash2" size={16} />
                  </Button>
                </div>
              </Card>
            ))}
          </motion.div>
        )}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать место</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Название</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Название места"
              />
            </div>
            <div>
              <Label>Иконка</Label>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`w-12 h-12 rounded-lg flex items-center justify-center border-2 transition-all ${
                      formData.icon === icon
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                  >
                    <Icon name={icon as any} size={20} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Цвет</Label>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-12 h-12 rounded-lg ${color} border-2 transition-all ${
                      formData.color === color ? 'border-gray-800 scale-110' : 'border-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>
            <Button onClick={handleSaveEdit} className="w-full">
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить место</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Название</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Название места"
              />
            </div>
            <div>
              <Label>Иконка</Label>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`w-12 h-12 rounded-lg flex items-center justify-center border-2 transition-all ${
                      formData.icon === icon
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                  >
                    <Icon name={icon as any} size={20} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Цвет</Label>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-12 h-12 rounded-lg ${color} border-2 transition-all ${
                      formData.color === color ? 'border-gray-800 scale-110' : 'border-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>
            <Button onClick={handleSaveAdd} className="w-full">
              Добавить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StorageManagement;
