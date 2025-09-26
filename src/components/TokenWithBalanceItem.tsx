import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useContractRead } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TokenIcon } from '@/components/ui/token-icon';
import { Copy, Settings, Coins } from 'lucide-react';
import { formatEther } from 'viem';

// Cargar ABI desde variable de entorno
const SimpleERC20Contract = require(process.env.NEXT_PUBLIC_SIMPLEERC20_CONTRACT_ABI_PATH!);

interface Token {
  tokenAddress: string;
  creator: string;
  name: string;
  symbol: string;
  initialSupply: bigint;
  creationTimestamp: bigint;
}

interface TokensWithBalanceListProps {
  tokens: Token[];
  userAddress: string;
  onTokenClick: (token: any) => void;
  formatCreationDate: (timestamp: bigint) => string;
  shortenAddress: (address: string) => string;
  onNoTokensWithBalance?: () => void;
}

export const TokensWithBalanceList: React.FC<TokensWithBalanceListProps> = ({
  tokens,
  userAddress,
  onTokenClick,
  formatCreationDate,
  shortenAddress,
  onNoTokensWithBalance,
}) => {
  const [tokensWithBalance, setTokensWithBalance] = useState<any[]>([]);
  const [isChecking, setIsChecking] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);

  // Los tokens ya vienen filtrados del hook, no necesitamos filtrar aquí
  const tokensFromOthers = tokens;

  // Efecto para verificar balances y filtrar solo tokens con balance
  useEffect(() => {
    if (tokensFromOthers.length === 0) {
      setTokensWithBalance([]);
      setIsChecking(false);
      setHasChecked(true);
      return;
    }

    // Simular verificación de balances (cada TokenWithBalanceItem verificará su propio balance)
    setIsChecking(false);
    setTokensWithBalance(tokensFromOthers);
    setHasChecked(true);
  }, [tokensFromOthers]);

  // Efecto para verificar si hay tokens visibles después de la verificación
  useEffect(() => {
    if (hasChecked && tokensWithBalance.length === 0 && tokensFromOthers.length > 0) {
      onNoTokensWithBalance?.();
    }
  }, [hasChecked, tokensWithBalance.length, tokensFromOthers.length, onNoTokensWithBalance]);

  // Si no hay tokens de la comunidad
  if (tokensFromOthers.length === 0) {
    return (
      <Card className="p-8">
        <CardContent className="p-0">
          <div className="text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Coins className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No hay tokens de la comunidad disponibles
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Los tokens creados por otros usuarios aparecerán aquí cuando estén disponibles
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mostrar loading mientras verificamos
  if (isChecking) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="p-4 border rounded-lg animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tokensFromOthers.map((token, index) => (
        <TokenWithBalanceItem
          key={`${token.tokenAddress}-${index}`}
          token={token}
          userAddress={userAddress}
          onTokenClick={onTokenClick}
          formatCreationDate={formatCreationDate}
          shortenAddress={shortenAddress}
        />
      ))}
    </div>
  );
};

interface TokenWithBalanceItemProps {
  token: {
    tokenAddress: string;
    creator: string;
    name: string;
    symbol: string;
    initialSupply: bigint;
    creationTimestamp: bigint;
  };
  userAddress: string;
  onTokenClick: (token: any) => void;
  formatCreationDate: (timestamp: bigint) => string;
  shortenAddress: (address: string) => string;
  onTokenRendered?: (hasBalance: boolean) => void;
}

export const TokenWithBalanceItem: React.FC<TokenWithBalanceItemProps> = ({
  token,
  userAddress,
  onTokenClick,
  formatCreationDate,
  shortenAddress,
  onTokenRendered,
}) => {
  // Leer decimales del token
  const { data: tokenDecimals } = useContractRead({
    address: token.tokenAddress as `0x${string}`,
    abi: SimpleERC20Contract.abi,
    functionName: 'decimals',
  });

  // Leer balance del usuario para este token
  const { data: userBalance } = useContractRead({
    address: token.tokenAddress as `0x${string}`,
    abi: SimpleERC20Contract.abi,
    functionName: 'balanceOf',
    args: [userAddress as `0x${string}`],
    query: {
      enabled: !!userAddress,
    },
  });


  // Función para formatear balance con decimales correctos
  const formatBalance = (balance: bigint | undefined, decimals: number | undefined) => {
    if (!balance || !decimals) return '0';
    const formatted = formatEther(balance * BigInt(10 ** (18 - decimals)));
    return parseFloat(formatted).toLocaleString('es-ES');
  };

  // Filtrar tokens creados por el usuario
  if (userAddress && token.creator.toLowerCase() === userAddress.toLowerCase()) {
    onTokenRendered?.(false);
    return null;
  }

  // Solo renderizar si el usuario tiene balance > 0
  if (!userBalance || userBalance === BigInt(0)) {
    onTokenRendered?.(false);
    return null;
  }

  // Notificar que este token tiene balance
  onTokenRendered?.(true);

  return (
    <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors" data-token-item>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <TokenIcon 
            tokenAddress={token.tokenAddress}
            size={40}
            className="shadow-sm"
          />
          <div>
            <h3 className="font-semibold text-foreground">{token.name}</h3>
            <p className="text-sm text-muted-foreground">Símbolo: {token.symbol}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">
            {formatBalance(userBalance as bigint, tokenDecimals as number)} {token.symbol}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatCreationDate(token.creationTimestamp)}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <span className="font-mono text-sm">{shortenAddress(token.tokenAddress)}</span>
          <button
            onClick={() => navigator.clipboard.writeText(token.tokenAddress)}
            className="p-1 rounded hover:bg-muted transition-colors"
            title="Copiar dirección completa"
          >
            <Copy className="w-3 h-3" />
          </button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onTokenClick(token)}
        >
          <Settings className="w-3 h-3 mr-1" />
          Ver Detalles
        </Button>
      </div>
    </div>
  );
};
