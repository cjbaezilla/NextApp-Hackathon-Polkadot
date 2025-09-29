import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Search, X } from 'lucide-react';
import { TokenBalance } from '@/hooks/useSwap';
import { formatAmount } from '@/lib/uniswap-utils';

interface TokenSelectorProps {
  selectedToken: TokenBalance | null;
  availableTokens: TokenBalance[];
  onTokenSelect: (token: TokenBalance) => void;
  disabled?: boolean;
  placeholder?: string;
  showBalance?: boolean;
}

export const TokenSelector = ({
  selectedToken,
  availableTokens,
  onTokenSelect,
  disabled = false,
  placeholder = "Seleccionar token",
  showBalance = true
}: TokenSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTokens = availableTokens.filter(token =>
    token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTokenSelect = (token: TokenBalance) => {
    onTokenSelect(token);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className="w-full justify-between h-12 px-3"
      >
        <div className="flex items-center space-x-2">
          {selectedToken ? (
            <>
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {selectedToken.symbol.charAt(0)}
                </span>
              </div>
              <div className="text-left">
                <div className="font-medium text-sm">{selectedToken.symbol}</div>
                {showBalance && (
                  <div className="text-xs text-muted-foreground">
                    {formatAmount(selectedToken.formattedBalance)}
                  </div>
                )}
              </div>
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </Button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 z-40" 
            onClick={handleClose}
          />
          
          {/* Modal */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-hidden">
            <Card className="border-0 shadow-none">
              <CardContent className="p-0">
                {/* Header con búsqueda */}
                <div className="p-3 border-b border-border">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">Seleccionar Token</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClose}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar por símbolo, nombre o dirección..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                {/* Lista de tokens */}
                <div className="max-h-60 overflow-y-auto">
                  {filteredTokens.length > 0 ? (
                    <div className="p-1">
                      {filteredTokens.map((token) => (
                        <button
                          key={token.address}
                          onClick={() => handleTokenSelect(token)}
                          className="w-full flex items-center justify-between p-3 hover:bg-accent rounded-md transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-bold">
                                {token.symbol.charAt(0)}
                              </span>
                            </div>
                            <div className="text-left">
                              <div className="font-medium text-sm">{token.symbol}</div>
                              <div className="text-xs text-muted-foreground truncate max-w-32">
                                {token.name}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {showBalance && (
                              <div className="text-sm font-medium">
                                {formatAmount(token.formattedBalance)}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              {token.address.slice(0, 6)}...{token.address.slice(-4)}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                        <Search className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {searchTerm ? 'No se encontraron tokens' : 'No hay tokens disponibles'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
