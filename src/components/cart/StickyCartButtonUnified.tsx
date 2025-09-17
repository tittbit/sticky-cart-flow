import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartDrawer } from "@/hooks/useCartDrawer";

interface StickyCartButtonUnifiedProps {
  itemCount: number;
  onClick: () => void;
  shopDomain?: string;
  isVisible?: boolean;
}

export const StickyCartButtonUnified = ({ 
  itemCount, 
  onClick, 
  shopDomain,
  isVisible = true 
}: StickyCartButtonUnifiedProps) => {
  const { settings, loading } = useCartDrawer(shopDomain);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animate when item count changes
  useEffect(() => {
    if (itemCount > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [itemCount]);

  if (loading || !settings || !settings.stickyButtonEnabled || !isVisible) {
    return null;
  }

  const position = settings.stickyButtonPosition || 'bottom-right';
  const buttonText = settings.stickyButtonText || 'Cart';
  const themeColor = settings.themeColor || '#000000';

  // Position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-6 left-6';
      case 'top-right':
        return 'top-6 right-6';
      case 'top-left':
        return 'top-6 left-6';
      case 'bottom-right':
      default:
        return 'bottom-6 right-6';
    }
  };

  return (
    <Button
      onClick={onClick}
      className={`
        fixed ${getPositionClasses()} z-40 
        shadow-custom-xl hover:shadow-custom-2xl
        transition-all duration-300 
        ${isAnimating ? 'animate-scale-in' : ''}
        hover:scale-105 active:scale-95
        min-w-[60px] h-14 rounded-full
        flex items-center gap-2 px-4
        text-white font-semibold
        border-2 border-white/20
      `}
      style={{ 
        backgroundColor: themeColor,
        boxShadow: `0 8px 32px ${themeColor}40`
      }}
    >
      <span className="text-xl">🛒</span>
      <span className="hidden sm:inline text-sm">{buttonText}</span>
      {itemCount > 0 && (
        <Badge 
          className={`
            bg-white text-black font-bold text-xs min-w-[20px] h-5 
            flex items-center justify-center rounded-full
            ${isAnimating ? 'animate-bounce' : ''}
          `}
        >
          {itemCount > 99 ? '99+' : itemCount}
        </Badge>
      )}
    </Button>
  );
};