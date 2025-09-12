import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface StickyCartButtonProps {
  itemCount: number;
  onClick: () => void;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  text?: string;
}

export const StickyCartButton = ({ 
  itemCount, 
  onClick, 
  position = "bottom-right",
  text = "Cart"
}: StickyCartButtonProps) => {
  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6", 
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-40`}>
      <Button
        onClick={onClick}
        className="gradient-primary text-white shadow-custom-lg hover-lift relative"
        size="lg"
      >
        <div className="flex items-center space-x-2">
          <span>🛒</span>
          <span className="font-medium">{text}</span>
        </div>
        
        {itemCount > 0 && (
          <Badge 
            className="absolute -top-2 -right-2 bg-accent text-accent-foreground border-2 border-background min-w-[1.5rem] h-6 rounded-full flex items-center justify-center text-xs font-bold"
          >
            {itemCount > 99 ? "99+" : itemCount}
          </Badge>
        )}
      </Button>
    </div>
  );
};