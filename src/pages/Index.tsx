import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';

interface Item {
  id: string;
  name: string;
  category: string;
  location?: string;
  quantity: number;
  status: 'have' | 'need';
}

interface Location {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export default function Index() {
  const [items, setItems] = useState<Item[]>([
    { id: '1', name: 'Молоко', category: 'Молочные продукты', location: 'fridge', quantity: 2, status: 'have' },
    { id: '2', name: 'Хлеб', category: 'Хлебобулочные', location: 'pantry', quantity: 1, status: 'have' },
    { id: '3', name: 'Яблоки', category: 'Фрукты', location: 'fridge', quantity: 5, status: 'have' },
    { id: '4', name: 'Кофе', category: 'Напитки', location: 'cabinet', quantity: 1, status: 'have' },
    { id: '5', name: 'Сахар', category: 'Сыпучие', location: 'cabinet', quantity: 1, status: 'have' },
    { id: '6', name: 'Яйца', category: 'Молочные продукты', status: 'need', quantity: 10 },
    { id: '7', name: 'Масло', category: 'Молочные продукты', status: 'need', quantity: 1 },
    { id: '8', name: 'Помидоры', category: 'Овощи', status: 'need', quantity: 3 },
  ]);

  const [locations] = useState<Location[]>([
    { id: 'fridge', name: 'Холодильник', icon: 'Refrigerator', color: 'bg-blue-500' },
    { id: 'pantry', name: 'Кладовая', icon: 'Package', color: 'bg-amber-500' },
    { id: 'cabinet', name: 'Шкаф', icon: 'DoorClosed', color: 'bg-purple-500' },
    { id: 'freezer', name: 'Морозилка', icon: 'Snowflake', color: 'bg-cyan-500' },
  ]);

  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [selectedTab, setSelectedTab] = useState('have');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const addItem = () => {
    if (newItemName && newItemCategory) {
      const newItem: Item = {
        id: Date.now().toString(),
        name: newItemName,
        category: newItemCategory,
        quantity: 1,
        status: selectedTab as 'have' | 'need',
      };
      setItems([...items, newItem]);
      setNewItemName('');
      setNewItemCategory('');
      setIsDialogOpen(false);
    }
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const moveItem = (id: string, newStatus: 'have' | 'need') => {
    setItems(items.map(item => 
      item.id === id ? { ...item, status: newStatus } : item
    ));
  };

  const updateItemLocation = (id: string, locationId: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, location: locationId } : item
    ));
  };

  const haveItems = items.filter(item => item.status === 'have');
  const needItems = items.filter(item => item.status === 'need');
  
  const getLocationItems = (locationId: string) => 
    items.filter(item => item.location === locationId);

  const totalItems = items.length;
  const havePercentage = (haveItems.length / totalItems) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              🏠 Мой Дом
            </h1>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all">
                  <Icon name="Plus" className="mr-2" size={20} />
                  Добавить
                </Button>
              </DialogTrigger>
              <DialogContent className="animate-scale-in">
                <DialogHeader>
                  <DialogTitle>Добавить товар</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    placeholder="Название товара"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                  />
                  <Input
                    placeholder="Категория"
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                  />
                  <Button onClick={addItem} className="w-full bg-gradient-to-r from-purple-600 to-pink-600">
                    Добавить в раздел "{selectedTab === 'have' ? 'Есть дома' : 'Нужно купить'}"
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 animate-scale-in">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Заполненность дома</span>
                <span className="text-sm font-bold text-purple-600">{haveItems.length} из {totalItems}</span>
              </div>
              <Progress value={havePercentage} className="h-3" />
            </CardContent>
          </Card>
        </header>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 gap-4 bg-white/50 backdrop-blur-sm p-2 rounded-2xl shadow-lg">
            <TabsTrigger 
              value="have" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white rounded-xl transition-all"
            >
              <Icon name="Home" className="mr-2" size={18} />
              Есть дома
            </TabsTrigger>
            <TabsTrigger 
              value="need"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white rounded-xl transition-all"
            >
              <Icon name="ShoppingCart" className="mr-2" size={18} />
              Нужно купить
            </TabsTrigger>
            <TabsTrigger 
              value="locations"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-xl transition-all"
            >
              <Icon name="MapPin" className="mr-2" size={18} />
              Места хранения
            </TabsTrigger>
          </TabsList>

          <TabsContent value="have" className="space-y-4 animate-fade-in">
            {haveItems.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="pt-6 text-center text-gray-500">
                  <Icon name="Package" className="mx-auto mb-2" size={48} />
                  <p>Пока ничего нет дома</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {haveItems.map((item) => (
                  <Card 
                    key={item.id} 
                    className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105 animate-scale-in"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">{item.name}</CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            {item.category}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteItem(item.id)}
                          className="h-8 w-8 text-gray-400 hover:text-red-500"
                        >
                          <Icon name="Trash2" size={16} />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Количество:</span>
                        <Badge variant="outline">{item.quantity} шт</Badge>
                      </div>
                      {item.location && (
                        <div className="flex items-center gap-2 text-sm">
                          <Icon 
                            name={locations.find(l => l.id === item.location)?.icon || 'Package'} 
                            size={16} 
                            className="text-purple-600"
                          />
                          <span className="text-gray-600">
                            {locations.find(l => l.id === item.location)?.name}
                          </span>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moveItem(item.id, 'need')}
                          className="flex-1"
                        >
                          <Icon name="ShoppingCart" size={14} className="mr-1" />
                          В список
                        </Button>
                        <Select
                          value={item.location || ''}
                          onValueChange={(value) => updateItemLocation(item.id, value)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Место" />
                          </SelectTrigger>
                          <SelectContent>
                            {locations.map((location) => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="need" className="space-y-4 animate-fade-in">
            {needItems.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="pt-6 text-center text-gray-500">
                  <Icon name="CheckCircle2" className="mx-auto mb-2 text-green-500" size={48} />
                  <p>Всё куплено! 🎉</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {needItems.map((item) => (
                  <Card 
                    key={item.id} 
                    className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105 animate-scale-in"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">{item.name}</CardTitle>
                          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                            {item.category}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteItem(item.id)}
                          className="h-8 w-8 text-gray-400 hover:text-red-500"
                        >
                          <Icon name="Trash2" size={16} />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm mb-3">
                        <span className="text-gray-600">Купить:</span>
                        <Badge variant="outline">{item.quantity} шт</Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => moveItem(item.id, 'have')}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      >
                        <Icon name="Check" size={14} className="mr-1" />
                        Куплено
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="locations" className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {locations.map((location) => {
                const locationItems = getLocationItems(location.id);
                return (
                  <Card 
                    key={location.id} 
                    className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all animate-scale-in"
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${location.color} bg-opacity-20`}>
                          <Icon name={location.icon} size={24} className={location.color.replace('bg-', 'text-')} />
                        </div>
                        <div>
                          <CardTitle>{location.name}</CardTitle>
                          <p className="text-sm text-gray-500 mt-1">
                            {locationItems.length} товаров
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {locationItems.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-4">Пусто</p>
                      ) : (
                        <div className="space-y-2">
                          {locationItems.map((item) => (
                            <div 
                              key={item.id} 
                              className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <Icon name="Package" size={16} className="text-gray-400" />
                                <span className="text-sm font-medium">{item.name}</span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {item.quantity} шт
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}