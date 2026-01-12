const API_BASE = {
  storage: 'https://functions.poehali.dev/575d5adf-f1ad-4840-8e0a-2ffd7b4bef19',
  shopping: 'https://functions.poehali.dev/b6020faf-a0aa-4f1e-8d41-3ddab94980f8',
  budget: 'https://functions.poehali.dev/1a040252-43be-4273-a42d-37e30c769d98',
};

export interface StorageLocation {
  id: string;
  name: string;
  icon: string;
  color: string;
  items_count: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  expiry_date?: string;
  storage_location_id: string;
  added_date: string;
  notes?: string;
  created_at: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  is_purchased: boolean;
  added_date: string;
  notes?: string;
  created_at: string;
}

export const storageApi = {
  async getLocations(): Promise<StorageLocation[]> {
    const response = await fetch(API_BASE.storage);
    if (!response.ok) throw new Error('Failed to fetch locations');
    return response.json();
  },

  async getLocationWithProducts(id: string): Promise<{ location: StorageLocation; products: Product[] }> {
    const response = await fetch(`${API_BASE.storage}?id=${id}`);
    if (!response.ok) throw new Error('Failed to fetch location details');
    return response.json();
  },

  async createLocation(data: { name: string; icon: string; color: string }): Promise<StorageLocation> {
    const response = await fetch(`${API_BASE.storage}?action=createLocation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create location');
    return response.json();
  },

  async updateLocation(id: string, data: { name: string; icon: string; color: string }): Promise<StorageLocation> {
    const response = await fetch(`${API_BASE.storage}?action=updateLocation&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update location');
    return response.json();
  },

  async deleteLocation(id: string): Promise<void> {
    const response = await fetch(`${API_BASE.storage}?action=deleteLocation&id=${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete location');
  },

  async addProduct(data: {
    name: string;
    quantity: number;
    unit: string;
    category?: string;
    expiryDate?: string;
    storageLocationId: string;
    notes?: string;
  }): Promise<Product> {
    const response = await fetch(API_BASE.storage, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to add product');
    return response.json();
  },

  async deleteProduct(productId: string): Promise<void> {
    const response = await fetch(`${API_BASE.storage}?productId=${productId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete product');
  },
};

export const shoppingApi = {
  async getItems(): Promise<ShoppingItem[]> {
    const response = await fetch(API_BASE.shopping);
    if (!response.ok) throw new Error('Failed to fetch shopping items');
    return response.json();
  },

  async addItem(data: {
    name: string;
    quantity: number;
    unit: string;
    category?: string;
    notes?: string;
  }): Promise<ShoppingItem> {
    const response = await fetch(API_BASE.shopping, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to add item');
    return response.json();
  },

  async toggleItem(id: string, isPurchased: boolean): Promise<ShoppingItem> {
    const response = await fetch(`${API_BASE.shopping}?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPurchased }),
    });
    if (!response.ok) throw new Error('Failed to update item');
    return response.json();
  },
};

export interface BudgetCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category_id?: string;
  category_name?: string;
  icon?: string;
  color?: string;
  description?: string;
  date: string;
  receipt_id?: string;
  created_at: string;
}

export const budgetApi = {
  async getCategories(): Promise<BudgetCategory[]> {
    const response = await fetch(`${API_BASE.budget}?action=categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  },

  async getTransactions(startDate?: string, endDate?: string): Promise<{ transactions: Transaction[]; summary: { total_income: number; total_expense: number } }> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const response = await fetch(`${API_BASE.budget}?${params}`);
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return response.json();
  },

  async addTransaction(data: { type: 'income' | 'expense'; amount: number; category_id?: string; description?: string; date?: string }): Promise<Transaction> {
    const response = await fetch(API_BASE.budget, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to add transaction');
    return response.json();
  },

  async getAnalytics(period: number = 30): Promise<any[]> {
    const response = await fetch(`${API_BASE.budget}?action=analytics&period=${period}`);
    if (!response.ok) throw new Error('Failed to fetch analytics');
    return response.json();
  },
};