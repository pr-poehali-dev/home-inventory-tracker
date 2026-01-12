import { StorageLocation, Product, ShoppingItem } from '@/types/storage';

export const mockStorageLocations: StorageLocation[] = [
  {
    id: '1',
    name: 'Холодильник',
    icon: 'Refrigerator',
    color: 'bg-blue-500',
    itemsCount: 15,
  },
  {
    id: '2',
    name: 'Кухонный шкаф',
    icon: 'ChefHat',
    color: 'bg-green-500',
    itemsCount: 22,
  },
  {
    id: '3',
    name: 'Кладовка',
    icon: 'Package',
    color: 'bg-pink-500',
    itemsCount: 8,
  },
  {
    id: '4',
    name: 'Морозилка',
    icon: 'Snowflake',
    color: 'bg-cyan-500',
    itemsCount: 12,
  },
];

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Молоко',
    quantity: 2,
    unit: 'л',
    category: 'Молочные',
    expiryDate: '2026-01-20',
    storageLocationId: '1',
    addedDate: '2026-01-10',
    notes: 'Обезжиренное 0.5%',
  },
  {
    id: '2',
    name: 'Яйца',
    quantity: 10,
    unit: 'шт',
    category: 'Молочные',
    expiryDate: '2026-01-25',
    storageLocationId: '1',
    addedDate: '2026-01-08',
  },
  {
    id: '3',
    name: 'Хлеб белый',
    quantity: 1,
    unit: 'шт',
    category: 'Хлебобулочные',
    expiryDate: '2026-01-15',
    storageLocationId: '2',
    addedDate: '2026-01-12',
  },
  {
    id: '4',
    name: 'Макароны',
    quantity: 3,
    unit: 'пачки',
    category: 'Крупы',
    storageLocationId: '2',
    addedDate: '2026-01-05',
  },
  {
    id: '5',
    name: 'Рис',
    quantity: 2,
    unit: 'кг',
    category: 'Крупы',
    storageLocationId: '3',
    addedDate: '2026-01-01',
  },
];

export const mockShoppingList: ShoppingItem[] = [
  {
    id: '1',
    name: 'Огурцы',
    quantity: 1,
    unit: 'кг',
    category: 'Овощи',
    isPurchased: false,
    addedDate: '2026-01-12',
  },
  {
    id: '2',
    name: 'Помидоры',
    quantity: 1.5,
    unit: 'кг',
    category: 'Овощи',
    isPurchased: false,
    addedDate: '2026-01-12',
  },
  {
    id: '3',
    name: 'Сметана',
    quantity: 1,
    unit: 'шт',
    category: 'Молочные',
    isPurchased: true,
    addedDate: '2026-01-11',
  },
];