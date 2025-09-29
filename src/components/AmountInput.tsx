import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Maximize, RefreshCw } from 'lucide-react';
import { formatAmount } from '@/lib/uniswap-utils';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  onMaxClick?: () => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  tokenBalance?: string;
  tokenSymbol?: string;
  showMaxButton?: boolean;
  showBalance?: boolean;
  label?: string;
  error?: string;
}

export const AmountInput = ({
  value,
  onChange,
  onMaxClick,
  placeholder = "0.0",
  disabled = false,
  isLoading = false,
  tokenBalance,
  tokenSymbol,
  showMaxButton = true,
  showBalance = true,
  label,
  error
}: AmountInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Permitir solo números y un punto decimal
    if (inputValue === '' || /^\d*\.?\d*$/.test(inputValue)) {
      onChange(inputValue);
    }
  };

  const handleMaxClick = () => {
    if (onMaxClick && tokenBalance) {
      onMaxClick();
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full h-12 px-3 pr-20 py-2 border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-colors ${
              error 
                ? 'border-red-500 focus:ring-red-500' 
                : isFocused 
                  ? 'border-primary' 
                  : 'border-border'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          
          {/* Botón Max */}
          {showMaxButton && tokenBalance && onMaxClick && !disabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleMaxClick}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 px-2 text-xs"
            >
              <Maximize className="w-3 h-3 mr-1" />
              MAX
            </Button>
          )}
          
          {/* Indicador de carga */}
          {isLoading && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />
            </div>
          )}
        </div>

        {/* Balance del token */}
        {showBalance && tokenBalance && tokenSymbol && (
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">Balance:</span>
              <Badge variant="secondary" className="text-xs">
                {formatAmount(tokenBalance)} {tokenSymbol}
              </Badge>
            </div>
          </div>
        )}

        {/* Mensaje de error */}
        {error && (
          <div className="mt-1">
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};
