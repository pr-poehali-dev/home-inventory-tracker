export interface StorageLocation {
  id: string;
  name: string;
  icon: string;
  color: string;
  itemsCount: number;
}

export interface Product {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  expiryDate?: string;
  storageLocationId: string;
  addedDate: string;
  notes?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  isPurchased: boolean;
  addedDate: string;
  notes?: string;
}
