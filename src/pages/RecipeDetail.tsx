import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import Sidebar from '@/components/Sidebar';
import { RecipeEditForm } from '@/components/recipe/RecipeEditForm';
import { RecipeStats } from '@/components/recipe/RecipeStats';
import { IngredientsList } from '@/components/recipe/IngredientsList';
import { ProductMatchingDialog } from '@/components/recipe/ProductMatchingDialog';
import { menuApi, storageApi, Recipe, RecipeIngredient, StorageLocation, Product } from '@/lib/api';
import { toast } from 'sonner';

const RecipeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isMatchingDialogOpen, setIsMatchingDialogOpen] = useState(false);
  const [productMatches, setProductMatches] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (id && id !== 'new') {
      fetchData();
    } else {
      setIsLoading(false);
      setIsEditMode(true);
    }
  }, [id]);

  const fetchData = async () => {
    if (!id || id === 'new') return;

    try {
      const [recipeData, locationsData, productsData] = await Promise.all([
        menuApi.getRecipe(id),
        storageApi.getLocations(),
        storageApi.getLocations().then(async (locs) => {
          const allProducts: Product[] = [];
          for (const loc of locs) {
            const data = await storageApi.getLocationWithProducts(loc.id);
            allProducts.push(...data.products.filter(p => p.quantity > 0));
          }
          return allProducts;
        }),
      ]);
      setRecipe(recipeData.recipe);
      setIngredients(recipeData.ingredients);
      setLocations(locationsData);
      setAvailableProducts(productsData);
    } catch (error) {
      toast.error('Ошибка загрузки');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!recipe?.name) {
      toast.error('Введите название рецепта');
      return;
    }

    if (ingredients.length === 0) {
      toast.error('Добавьте хотя бы один ингредиент');
      return;
    }

    try {
      await menuApi.createRecipe({
        name: recipe.name,
        description: recipe.description,
        total_calories: recipe.total_calories,
        cooking_time: recipe.cooking_time,
        servings: recipe.servings,
        ingredients: ingredients.map((i) => ({
          id: '',
          recipe_id: '',
          product_name: i.product_name,
          quantity: i.quantity,
          unit: i.unit,
        })),
      });
      toast.success('Рецепт сохранен');
      navigate('/menu');
    } catch (error) {
      toast.error('Ошибка сохранения');
      console.error(error);
    }
  };

  const handleAddIngredient = (ingredient: RecipeIngredient) => {
    setIngredients([...ingredients, ingredient]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handlePrepareWithMatching = () => {
    const matches: { [key: string]: string } = {};
    const similarityThreshold = 0.6;

    ingredients.forEach((ingredient) => {
      const matchedProduct = availableProducts.find((product) => {
        const similarity =
          product.name.toLowerCase() === ingredient.product_name.toLowerCase()
            ? 1
            : product.name.toLowerCase().includes(ingredient.product_name.toLowerCase()) ||
              ingredient.product_name.toLowerCase().includes(product.name.toLowerCase())
            ? 0.8
            : 0;
        return similarity >= similarityThreshold && product.quantity >= ingredient.quantity;
      });

      if (matchedProduct) {
        matches[ingredient.product_name] = matchedProduct.id;
      }
    });

    setProductMatches(matches);
    setIsMatchingDialogOpen(true);
  };

  const handleConfirmMatching = async () => {
    toast.success('Блюдо приготовлено!');
    setIsMatchingDialogOpen(false);
    navigate('/menu');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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
            onClick={() => navigate('/menu')}
            className="mb-4 hover:bg-white/50"
          >
            <Icon name="ArrowLeft" size={20} className="mr-2" />
            Назад
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-1">
                {recipe?.name || 'Новый рецепт'}
              </h1>
              {!isEditMode && recipe?.description && (
                <p className="text-muted-foreground">{recipe.description}</p>
              )}
            </div>
            {id !== 'new' && !isEditMode && (
              <div className="flex gap-2">
                <Button onClick={() => setIsEditMode(true)} variant="outline">
                  <Icon name="Edit" size={16} className="mr-2" />
                  Редактировать
                </Button>
                <Button onClick={handlePrepareWithMatching}>
                  <Icon name="ChefHat" size={16} className="mr-2" />
                  Приготовить
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {isEditMode ? (
          <RecipeEditForm recipe={recipe} setRecipe={setRecipe} />
        ) : (
          recipe && <RecipeStats recipe={recipe} />
        )}

        <IngredientsList
          ingredients={ingredients}
          isEditMode={isEditMode}
          onAddIngredient={handleAddIngredient}
          onRemoveIngredient={handleRemoveIngredient}
          recipeId={id}
        />

        {isEditMode && (
          <div className="mt-6 flex gap-3">
            <Button onClick={handleSave} className="flex-1">
              Сохранить рецепт
            </Button>
            <Button
              onClick={() => (id === 'new' ? navigate('/menu') : setIsEditMode(false))}
              variant="outline"
            >
              Отмена
            </Button>
          </div>
        )}
      </div>

      <ProductMatchingDialog
        isOpen={isMatchingDialogOpen}
        onClose={() => setIsMatchingDialogOpen(false)}
        ingredients={ingredients}
        availableProducts={availableProducts}
        productMatches={productMatches}
        setProductMatches={setProductMatches}
        onConfirm={handleConfirmMatching}
      />
    </div>
  );
};

export default RecipeDetail;
