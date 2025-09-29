import type { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Minus,
  Activity, 
  DollarSign,
  X,
  Eye,
  RefreshCw,
  Search,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import ClientOnly from '@/components/ClientOnly';
import { useUniswapV2Pools, PoolInfo } from '@/hooks/useUniswapV2Pools';
import PoolInfoModal from '@/components/PoolInfoModal';
import { formatAmount } from '@/lib/uniswap-utils';
import { formatUnits } from 'viem';
import { useRouter } from 'next/router';

const PoolsPage: NextPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPool, setSelectedPool] = useState<PoolInfo | null>(null);
  const [showPoolModal, setShowPoolModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const {
    pools,
    isLoading,
    error,
    totalPools,
    poolCreationState,
    createPool,
    resetCreationState,
    loadPools,
    isConnected,
    address
  } = useUniswapV2Pools();

  // Evitar problemas de hidratación
  useEffect(() => {
    setMounted(true);
  }, []);

  // Efecto para mostrar mensaje de éxito cuando se viene de crear pool
  useEffect(() => {
    if (router.query.from === 'create-pool') {
      setShowSuccessMessage(true);
      // Limpiar el parámetro de la URL
      router.replace('/pools', undefined, { shallow: true });
    }
  }, [router]);

  // Filtrar pools
  const filteredPools = pools
    .filter(pool => 
      pool.token0.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pool.token1.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pool.token0.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pool.token1.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pool.token0.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pool.token1.address.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Usar función de formateo centralizada
  const formatNumber = formatAmount;

  // Calcular TVL total solo en ETH
  const calculateTotalTVL = () => {
    const wethAddress = process.env.NEXT_PUBLIC_WETH_ADDRESS?.toLowerCase();
    if (!wethAddress) return '0';

    return pools.reduce((sum, pool) => {
      const token0Address = pool.token0.address.toLowerCase();
      const token1Address = pool.token1.address.toLowerCase();
      
      // Solo incluir pools que contengan WETH/ETH
      if (token0Address === wethAddress || token1Address === wethAddress) {
        // Si token0 es WETH, usar reserve0; si token1 es WETH, usar reserve1
        const ethReserve = token0Address === wethAddress ? pool.reserves.reserve0 : pool.reserves.reserve1;
        const ethAmount = formatUnits(ethReserve, 18); // WETH tiene 18 decimales
        return sum + parseFloat(ethAmount);
      }
      
      return sum;
    }, 0);
  };

  // Función para manejar clic en pool
  const handlePoolClick = (pool: PoolInfo) => {
    setSelectedPool(pool);
    setShowPoolModal(true);
  };

  // Función para cerrar modal de pool
  const closePoolModal = () => {
    setShowPoolModal(false);
    setSelectedPool(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>Pools de Liquidez - DApp Polka</title>
        <meta
          content="Interactúa con pools de liquidez Uniswap V2"
          name="description"
        />
        <link href="/favicon.ico" rel="icon" />
      </Head>

      <div className="container mx-auto px-3 py-4">
        {/* Mensaje de éxito */}
        {showSuccessMessage && (
          <div className="mb-4">
            <Card className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <CardContent className="p-0">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    ¡Pool creado exitosamente!
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSuccessMessage(false)}
                    className="text-green-600 hover:text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20 ml-auto"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Tu pool de liquidez ha sido creado y está disponible para trading.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground mb-1">
                Pools de Liquidez
              </h1>
              <p className="text-muted-foreground text-xs">
                Interactúa con pools Uniswap V2
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <ClientOnly fallback={
                <Button
                  disabled={true}
                  className="text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Crear Pool
                </Button>
              }>
                <Link href="/crear-pool">
                  <Button
                    disabled={!isConnected}
                    className="text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Crear Pool
                  </Button>
                </Link>
              </ClientOnly>
            </div>
          </div>
        </div>

        {/* Estadísticas generales */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Pools</p>
                    <div className="text-lg font-bold text-foreground">
                      <ClientOnly fallback="0">
                        {totalPools}
                      </ClientOnly>
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Activity className="text-white text-xs w-4 h-4" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">TVL Total en ETH</p>
                    <div className="text-lg font-bold text-foreground">
                      <ClientOnly fallback="0">
                        {formatNumber(calculateTotalTVL().toString())} ETH
                      </ClientOnly>
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <DollarSign className="text-white text-xs w-4 h-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Controles de búsqueda y filtrado */}
        <div className="mb-4">
          <Card className="p-3">
            <CardContent className="p-0">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Búsqueda */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar por token, símbolo o dirección..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  />
                </div>


              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de pools */}
        <div className="space-y-6 mb-6">
          <ClientOnly fallback={
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4">
                  <CardContent className="p-0">
                    <div className="animate-pulse space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-muted rounded-full"></div>
                          <div className="w-8 h-8 bg-muted rounded-full"></div>
                          <div className="space-y-1">
                            <div className="h-4 bg-muted rounded w-24"></div>
                            <div className="h-3 bg-muted rounded w-16"></div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="h-4 bg-muted rounded w-20"></div>
                          <div className="h-3 bg-muted rounded w-16"></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          }>
            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4">
                    <CardContent className="p-0">
                      <div className="animate-pulse space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-muted rounded-full"></div>
                            <div className="w-8 h-8 bg-muted rounded-full"></div>
                            <div className="space-y-1">
                              <div className="h-4 bg-muted rounded w-24"></div>
                              <div className="h-3 bg-muted rounded w-16"></div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="h-4 bg-muted rounded w-20"></div>
                            <div className="h-3 bg-muted rounded w-16"></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card className="p-6">
                <CardContent className="p-0">
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
                      <X className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-1">Error al cargar pools</h3>
                      <p className="text-xs text-muted-foreground">{error}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadPools}
                      className="text-xs"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Reintentar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : filteredPools.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPools.map((pool, index) => (
                  <div key={pool.address} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {/* Tokens */}
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
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {pool.token0.symbol}/{pool.token1.symbol}
                          </h3>
                          <p className="text-sm text-muted-foreground">Pool de Liquidez</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePoolClick(pool)}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Link href={`/agregar-liquidez?tokenA=${pool.token0.address}&tokenB=${pool.token1.address}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 border-green-600 hover:text-green-700 hover:bg-green-100 dark:text-green-400 dark:border-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20"
                            title="Agregar Liquidez"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </Link>
                        <Link href={`/remover-liquidez?tokenA=${pool.token0.address}&tokenB=${pool.token1.address}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:border-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                            title="Remover Liquidez"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="p-6">
                <CardContent className="p-0">
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                      <Activity className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-1">No hay pools disponibles</h3>
                      <p className="text-xs text-muted-foreground">
                        {searchTerm ? 'No se encontraron pools que coincidan con tu búsqueda' : 'Aún no hay pools de liquidez creados'}
                      </p>
                    </div>
                    {!searchTerm && (
                      <ClientOnly fallback={
                        <Button
                          disabled={true}
                          className="text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Crear Primer Pool
                        </Button>
                      }>
                        <Link href="/crear-pool">
                          <Button
                            disabled={!isConnected}
                            className="text-xs"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Crear Primer Pool
                          </Button>
                        </Link>
                      </ClientOnly>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </ClientOnly>
        </div>
      </div>


      {/* Modal de información del pool */}
      {showPoolModal && selectedPool && (
        <PoolInfoModal
          isOpen={showPoolModal}
          onClose={closePoolModal}
          pool={selectedPool}
        />
      )}
    </div>
  );
};

export default PoolsPage;
