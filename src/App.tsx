
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import StorageDetail from "./pages/StorageDetail";
import StorageManagement from "./pages/StorageManagement";
import ShoppingList from "./pages/ShoppingList";
import ScanReceipt from "./pages/ScanReceipt";
import Budget from "./pages/Budget";
import Menu from "./pages/Menu";
import RecipeDetail from "./pages/RecipeDetail";
import FoodDiary from "./pages/FoodDiary";
import ProductCatalog from "./pages/ProductCatalog";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/storage/:id" element={<StorageDetail />} />
          <Route path="/storage-management" element={<StorageManagement />} />
          <Route path="/shopping-list" element={<ShoppingList />} />
          <Route path="/scan" element={<ScanReceipt />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/recipe/:id" element={<RecipeDetail />} />
          <Route path="/food-diary" element={<FoodDiary />} />
          <Route path="/product-catalog" element={<ProductCatalog />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;