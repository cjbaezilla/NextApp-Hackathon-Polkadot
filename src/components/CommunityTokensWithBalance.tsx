import { useState, useEffect } from 'react';
import { useContractRead } from 'wagmi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TokenIcon } from '@/components/ui/token-icon';
import { 
  Coins, 
  Copy, 
  Settings, 
  X 
} from 'lucide-react';
import { formatEther } from 'viem';

// Cargar ABI desde variable de entorno
const ERC20MembersFactory = require(process.env.NEXT_PUBLIC_ERC20MEMBERSFACTORY_CONTRACT_ABI_PATH!);
const SimpleERC20Contract = require(process.env.NEXT_PUBLIC_SIMPLEERC20_CONTRACT_ABI_PATH!);

interface TokenInfo {
  tokenAddress: string;
  creator: string;
  name: string;
  symbol: string;
  initialSupply: bigint;
  creationTimestamp: bigint;
}

interface CommunityTokensWithBalanceProps {
  userAddress?: string;
  onTokenClick?: (token: any) => void;
}

export const CommunityTokensWithBalance = ({ userAddress, onTokenClick }: CommunityTokensWithBalanceProps) => {
  const [allTokens, setAllTokens] = useState<TokenInfo[]>([]);
  const [tokensWithBalance, setTokensWithBalance] = useState<TokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingBalances, setIsCheckingBalances] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dirección del contrato desde variable de entorno
  const factoryContractAddress = process.env.NEXT_PUBLIC_ERC20MEMBERSFACTORY_CONTRACT_ADDRESS as `0x${string}`;

  // Leer todos los tokens del factory
  const { data: allTokensData, refetch: refetchAllTokens, isLoading: isLoadingAllTokens } = useContractRead({
    address: factoryContractAddress,
    abi: ERC20MembersFactory.abi,
    functionName: 'getAllTokens',
  });

  // Efecto para procesar los datos
  useEffect(() => {
    if (!allTokensData || !Array.isArray(allTokensData) || !userAddress) {
      setAllTokens([]);
      setTokensWithBalance([]);
      setIsLoading(isLoadingAllTokens);
      return;
    }

    try {
      setIsLoading(true);
      
      // Procesar tokens y convertirlos al formato correcto
      const processedTokens: TokenInfo[] = allTokensData.map((token: any) => ({
        tokenAddress: token.tokenAddress,
        creator: token.creator,
        name: token.name,
        symbol: token.symbol,
        initialSupply: token.initialSupply,
        creationTimestamp: token.createdAt,
      }));

      // Filtrar tokens que NO son del usuario actual
      const communityTokensOnly = processedTokens.filter(token => 
        token.creator.toLowerCase() !== userAddress.toLowerCase()
      );

      setAllTokens(communityTokensOnly);
      setError(null);
      setIsLoading(false);
    } catch (err) {
      console.error('Error al procesar tokens de la comunidad:', err);
      setError('Error al procesar los tokens de la comunidad');
      setAllTokens([]);
      setTokensWithBalance([]);
      setIsLoading(false);
    }
  }, [allTokensData, isLoadingAllTokens, userAddress]);

  // Función para formatear fecha
  const formatCreationDate = (timestamp: bigint) => {
    const timestampNumber = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
    const date = new Date(timestampNumber * 1000);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para acortar dirección
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Función para manejar cuando se verifica el balance de un token
  const handleBalanceChecked = (token: TokenInfo, hasBalance: boolean) => {
    if (hasBalance) {
      setTokensWithBalance(prev => {
        if (!prev.find(t => t.tokenAddress === token.tokenAddress)) {
          return [...prev, token];
        }
        return prev;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border rounded-lg animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-center space-x-2">
          <X className="w-4 h-4 text-red-600" />
          <span className="text-sm font-medium text-red-800 dark:text-red-200">
            Error al cargar tokens de la comunidad
          </span>
        </div>
        <p className="text-xs text-red-700 dark:text-red-300 mt-1">
          {error}
        </p>
      </div>
    );
  }

  if (allTokens.length === 0) {
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
              No se han creado tokens por otros usuarios aún
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {allTokens.map((token, index) => (
        <TokenWithBalanceItem 
          key={index} 
          token={token} 
          userAddress={userAddress || ''}
          onTokenClick={onTokenClick}
          formatCreationDate={formatCreationDate}
          shortenAddress={shortenAddress}
          onBalanceChecked={(hasBalance) => handleBalanceChecked(token, hasBalance)}
        />
      ))}
      
      {/* Mostrar mensaje solo si no hay tokens con balance */}
      {!isLoading && allTokens.length > 0 && tokensWithBalance.length === 0 && (
        <Card className="p-8">
          <CardContent className="p-0">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Coins className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                No tienes tokens de la comunidad
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Los tokens creados por otros usuarios en los que tengas balance aparecerán aquí
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Componente para mostrar cada token individual con verificación de balance
const TokenWithBalanceItem = ({ 
  token, 
  userAddress, 
  onTokenClick, 
  formatCreationDate, 
  shortenAddress,
  onBalanceChecked
}: { 
  token: TokenInfo; 
  userAddress: string;
  onTokenClick?: (token: any) => void;
  formatCreationDate: (timestamp: bigint) => string;
  shortenAddress: (address: string) => string;
  onBalanceChecked?: (hasBalance: boolean) => void;
}) => {
  const [hasBalance, setHasBalance] = useState<boolean | null>(null);

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

  // Efecto para verificar si hay balance y notificar al componente padre
  useEffect(() => {
    if (userBalance !== undefined) {
      const balance = userBalance as bigint;
      const hasBalanceValue = balance > BigInt(0);
      setHasBalance(hasBalanceValue);
      onBalanceChecked?.(hasBalanceValue);
    }
  }, [userBalance, onBalanceChecked]);

  // Función para formatear balance con decimales correctos
  const formatBalance = (balance: bigint | undefined, decimals: number | undefined) => {
    if (!balance || !decimals) return '0';
    const formatted = formatEther(balance * BigInt(10 ** (18 - decimals)));
    return parseFloat(formatted).toLocaleString('es-ES');
  };

  // Solo mostrar si el usuario tiene balance > 0
  if (hasBalance === false || !userBalance || userBalance === BigInt(0)) {
    return null;
  }

  return (
    <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
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
        {onTokenClick && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTokenClick(token)}
          >
            <Settings className="w-3 h-3 mr-1" />
            Ver Detalles
          </Button>
        )}
      </div>
    </div>
  );
};

