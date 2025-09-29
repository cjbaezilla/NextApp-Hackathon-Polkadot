import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  ExternalLink, 
  TrendingDown, 
  Activity, 
  Users,
  ArrowUpDown
} from 'lucide-react';
import { PoolInfo } from '@/hooks/useUniswapV2Pools';
import { formatAmount } from '@/lib/uniswap-utils';
import { useRouter } from 'next/router';

interface PoolInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  pool: PoolInfo;
}

const PoolInfoModal = ({ isOpen, onClose, pool }: PoolInfoModalProps) => {
  const router = useRouter();
  
  if (!isOpen) return null;

  // Función para acortar dirección
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Usar función de formateo centralizada
  const formatNumber = formatAmount;

  // Función para manejar navegación
  const handleSwap = () => {
    onClose();
    router.push(`/swap?tokenIn=${pool.token0.address}&tokenOut=${pool.token1.address}`);
  };

  const handleAddLiquidity = () => {
    onClose();
    router.push(`/agregar-liquidez?tokenA=${pool.token0.address}&tokenB=${pool.token1.address}`);
  };


  // Calcular ratio de tokens
  const token0Ratio = pool.reserves.reserve0 > BigInt(0) ? 
    Number(pool.reserves.reserve0) / (Number(pool.reserves.reserve0) + Number(pool.reserves.reserve1)) * 100 : 0;
  const token1Ratio = 100 - token0Ratio;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center space-x-3">
              <div className="flex items-center -space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center border-2 border-background">
                  <span className="text-white text-xs font-bold">
                    {pool.token0.symbol.charAt(0)}
                  </span>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-background">
                  <span className="text-white text-xs font-bold">
                    {pool.token1.symbol.charAt(0)}
                  </span>
                </div>
              </div>
              <span>{pool.token0.symbol}/{pool.token1.symbol}</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Información básica del pool */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Token 0</h3>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{pool.token0.name}</span>
                    <Badge variant="outline">{pool.token0.symbol}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {shortenAddress(pool.token0.address)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatNumber((Number(pool.reserves.reserve0) / Math.pow(10, pool.token0.decimals)).toString())} {pool.token0.symbol}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Token 1</h3>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{pool.token1.name}</span>
                    <Badge variant="outline">{pool.token1.symbol}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {shortenAddress(pool.token1.address)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatNumber((Number(pool.reserves.reserve1) / Math.pow(10, pool.token1.decimals)).toString())} {pool.token1.symbol}
                  </p>
                </div>
              </div>
            </div>

            {/* Dirección del pool */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Dirección del Pool</h3>
              <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
                <span className="text-sm font-mono text-foreground">
                  {shortenAddress(pool.address)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`https://sepolia.etherscan.io/address/${pool.address}`, '_blank')}
                  className="text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Ver en Explorer
                </Button>
              </div>
            </div>
          </div>


          {/* Distribución de tokens */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Distribución de Tokens</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground">{pool.token0.symbol}</span>
                  <span className="text-sm font-medium text-foreground">{token0Ratio.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${token0Ratio}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground">{pool.token1.symbol}</span>
                  <span className="text-sm font-medium text-foreground">{token1Ratio.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${token1Ratio}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Supply Total</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {formatNumber((Number(pool.totalSupply) / 1e18).toString())} LP
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Acciones</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                className="w-full text-sm"
                onClick={handleSwap}
              >
                <ArrowUpDown className="w-4 h-4 mr-2" />
                Hacer Swap
              </Button>
              <Button 
                variant="outline" 
                className="w-full text-sm"
                onClick={handleAddLiquidity}
              >
                <Users className="w-4 h-4 mr-2" />
                Agregar Liquidez
              </Button>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default PoolInfoModal;
