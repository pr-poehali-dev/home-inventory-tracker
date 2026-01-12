import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Product } from '@/lib/api';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const isExpiringSoon = product.expiry_date
    ? new Date(product.expiry_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    : false;

  const isExpired = product.expiry_date
    ? new Date(product.expiry_date) < new Date()
    : false;

  return (
    <Card className="p-4 bg-white/80 backdrop-blur-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold">{product.name}</h3>
            {product.category && (
              <Badge variant="outline" className="text-xs">
                {product.category}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
            <span className="font-medium text-primary">
              {product.quantity} {product.unit}
            </span>
            {product.expiry_date && (
              <div className="flex items-center gap-1">
                <Icon name="Calendar" size={14} />
                <span
                  className={
                    isExpired
                      ? 'text-destructive font-medium'
                      : isExpiringSoon
                      ? 'text-warning font-medium'
                      : ''
                  }
                >
                  до {new Date(product.expiry_date).toLocaleDateString('ru-RU')}
                </span>
              </div>
            )}
          </div>

          {product.notes && (
            <p className="text-sm text-muted-foreground">{product.notes}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {isExpired && (
            <Badge variant="destructive" className="text-xs">
              Просрочено
            </Badge>
          )}
          {!isExpired && isExpiringSoon && (
            <Badge className="text-xs bg-warning text-white">
              Скоро истечёт
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};