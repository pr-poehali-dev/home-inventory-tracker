import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { StorageLocation } from '@/lib/api';

interface AddToStorageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locations: StorageLocation[];
  onLocationSelect: (locationId: string) => void;
  itemName: string;
}

export const AddToStorageDialog = ({
  open,
  onOpenChange,
  locations,
  onLocationSelect,
  itemName,
}: AddToStorageDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Добавить "{itemName}" в запасы</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Выберите место хранения:
          </p>
          {locations.map((location) => (
            <Card
              key={location.id}
              className="p-4 cursor-pointer hover:shadow-md transition-all bg-white/80 backdrop-blur-sm"
              onClick={() => {
                onLocationSelect(location.id);
                onOpenChange(false);
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`${location.color} w-12 h-12 rounded-xl flex items-center justify-center text-white`}
                >
                  <Icon name={location.icon as any} size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{location.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {location.items_count} товаров
                  </p>
                </div>
                <Icon name="ChevronRight" size={20} className="text-muted-foreground" />
              </div>
            </Card>
          ))}
          {locations.length === 0 && (
            <Card className="p-8 text-center bg-white/80">
              <Icon name="Package" size={32} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                Нет мест хранения
              </p>
            </Card>
          )}
        </div>

        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="w-full"
        >
          Отмена
        </Button>
      </DialogContent>
    </Dialog>
  );
};
