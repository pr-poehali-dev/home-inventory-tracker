import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import Sidebar from '@/components/Sidebar';
import { budgetApi, storageApi, BudgetCategory, Transaction, StorageLocation } from '@/lib/api';
import { toast } from 'sonner';

const Budget = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0 });
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category_id: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesData, transactionsData, locationsData, analyticsData] = await Promise.all([
        budgetApi.getCategories(),
        budgetApi.getTransactions(),
        storageApi.getLocations(),
        budgetApi.getAnalytics(30),
      ]);
      setCategories(categoriesData);
      setTransactions(transactionsData.transactions);
      setSummary(transactionsData.summary);
      setLocations(locationsData);
      setAnalytics(analyticsData);
    } catch (error) {
      toast.error('Ошибка загрузки данных');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTransaction = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Введите сумму');
      return;
    }

    try {
      await budgetApi.addTransaction({
        ...formData,
        amount: parseFloat(formData.amount),
      });
      await fetchData();
      setIsAddDialogOpen(false);
      setFormData({
        type: 'expense',
        amount: '',
        category_id: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      toast.success('Транзакция добавлена');
    } catch (error) {
      toast.error('Ошибка добавления');
      console.error(error);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === formData.type);
  const incomeCategories = categories.filter((c) => c.type === 'income');
  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const balance = summary.total_income - summary.total_expense;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 p-4">
      <Sidebar locations={locations} />
      <div className="max-w-6xl mx-auto">
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
                Бюджет
              </h1>
              <p className="text-muted-foreground">Управление финансами</p>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} size="lg" className="shadow-lg">
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
          <>
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card className="p-6 bg-white/80 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Доходы</p>
                    <p className="text-2xl font-bold text-green-600">
                      {summary.total_income.toLocaleString()} ₽
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Icon name="TrendingUp" size={24} className="text-green-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white/80 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Расходы</p>
                    <p className="text-2xl font-bold text-red-600">
                      {summary.total_expense.toLocaleString()} ₽
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <Icon name="TrendingDown" size={24} className="text-red-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white/80 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Баланс</p>
                    <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {balance.toLocaleString()} ₽
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Icon name="Wallet" size={24} className="text-blue-600" />
                  </div>
                </div>
              </Card>
            </div>

            <Tabs defaultValue="transactions" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="transactions">Транзакции</TabsTrigger>
                <TabsTrigger value="analytics">Аналитика</TabsTrigger>
              </TabsList>

              <TabsContent value="transactions" className="space-y-4">
                {transactions.length === 0 ? (
                  <Card className="p-8 text-center bg-white/80 backdrop-blur-sm">
                    <Icon name="FileText" size={48} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Нет транзакций</p>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {transactions.map((t) => (
                      <Card key={t.id} className="p-4 bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`${t.color || 'bg-gray-500'} w-10 h-10 rounded-full flex items-center justify-center text-white`}>
                              <Icon name={(t.icon as any) || 'Package'} size={20} />
                            </div>
                            <div>
                              <p className="font-semibold">{t.category_name || 'Без категории'}</p>
                              {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
                              <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString('ru')}</p>
                            </div>
                          </div>
                          <p className={`text-lg font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()} ₽
                          </p>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="p-6 bg-white/80 backdrop-blur-sm">
                    <h3 className="text-lg font-semibold mb-4">Расходы по категориям</h3>
                    <div className="space-y-3">
                      {analytics.filter((a) => a.type === 'expense' && parseFloat(a.total) > 0).map((cat) => (
                        <div key={cat.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`${cat.color} w-8 h-8 rounded-lg flex items-center justify-center text-white`}>
                              <Icon name={cat.icon as any} size={16} />
                            </div>
                            <span>{cat.name}</span>
                          </div>
                          <span className="font-semibold">{parseFloat(cat.total).toLocaleString()} ₽</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-6 bg-white/80 backdrop-blur-sm">
                    <h3 className="text-lg font-semibold mb-4">Доходы по категориям</h3>
                    <div className="space-y-3">
                      {analytics.filter((a) => a.type === 'income' && parseFloat(a.total) > 0).map((cat) => (
                        <div key={cat.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`${cat.color} w-8 h-8 rounded-lg flex items-center justify-center text-white`}>
                              <Icon name={cat.icon as any} size={16} />
                            </div>
                            <span>{cat.name}</span>
                          </div>
                          <span className="font-semibold">{parseFloat(cat.total).toLocaleString()} ₽</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить транзакцию</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Тип</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as 'income' | 'expense', category_id: '' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Расход</SelectItem>
                  <SelectItem value="income">Доход</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Сумма</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0"
              />
            </div>

            <div>
              <Label>Категория</Label>
              <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Описание</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Опционально"
              />
            </div>

            <div>
              <Label>Дата</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <Button onClick={handleAddTransaction} className="w-full">
              Добавить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Budget;
