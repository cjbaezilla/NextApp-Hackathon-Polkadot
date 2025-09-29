import type { NextPage } from 'next';
import Head from 'next/head';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Minus,
  CheckCircle, 
  XCircle, 
  Info,
  Loader2,
  ArrowLeft,
  ExternalLink,
  Copy
} from 'lucide-react';
import { useRouter } from 'next/router';
import ClientOnly from '@/components/ClientOnly';
import Link from 'next/link';
import { useLiquidity, PoolInfo as LiquidityPoolInfo } from '@/hooks/useLiquidity';
import { UNISWAP_V2_ADDRESSES, TOKEN_SYMBOLS } from '@/lib/constants';
import { formatAmount, fromTokenUnits } from '@/lib/uniswap-utils';
import { parseUnits, formatUnits } from 'viem';
import { NumericFormat } from 'react-number-format';
import { useBalance, useAccount } from 'wagmi';

// Hook personalizado para debounce
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Componente de skeleton para loading
const CalculationSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-muted rounded w-1/2"></div>
  </div>
);

const AgregarLiquidezPage: NextPage = () => {
  const router = useRouter();
  const { address } = useAccount();
  
  // Estados del formulario
  const [selectedPool, setSelectedPool] = useState<LiquidityPoolInfo | null>(null);
  const [tokenA, setTokenA] = useState('');
  const [tokenB, setTokenB] = useState('');
  const [amountA, setAmountA] = useState<string>('');
  const [amountB, setAmountB] = useState<string>('');

  // Hook para obtener balance de ETH
  const { data: ethBalance } = useBalance({
    address: address,
  });

  // Estados para validación
  const [isLoadingPoolInfo, setIsLoadingPoolInfo] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [isResettingAfterSuccess, setIsResettingAfterSuccess] = useState(false);

  // Debounced values para evitar cálculos excesivos
  const debouncedAmountA = useDebounce(amountA, 300);
  const debouncedAmountB = useDebounce(amountB, 300);

  // Hook personalizado para manejo de liquidez
  const {
    liquidityState,
    poolInfo,
    getPoolInfo,
    getPoolAddress,
    calculateOptimalAmounts,
    addLiquidity,
    updateLiquidityState,
    resetSuccessState,
    isConnected
  } = useLiquidity();

  // Estado para copia del hash
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [copiedPoolAddress, setCopiedPoolAddress] = useState<boolean>(false);

  // Efecto para manejar éxito de operación
  useEffect(() => {
    if (liquidityState.isSuccess) {
      // Limpiar formulario después del éxito
      setIsResettingAfterSuccess(true);
      setAmountA('');
      setAmountB('');
      setCalculationError(null);
      // Resetear la bandera después de un delay más largo para evitar cálculos automáticos
      setTimeout(() => {
        setIsResettingAfterSuccess(false);
      }, 500);
    }
  }, [liquidityState.isSuccess]);

  // Efecto para sincronizar selectedPool con poolInfo del hook
  useEffect(() => {
    if (poolInfo && selectedPool && poolInfo.address === selectedPool.address) {
      setSelectedPool(poolInfo);
    }
  }, [poolInfo, selectedPool]);

  // Efecto para manejar parámetros de URL tokenA y tokenB
  useEffect(() => {
    if (router.isReady) {
      const tokenAFromUrl = router.query.tokenA as string;
      const tokenBFromUrl = router.query.tokenB as string;
      
      // Llenar inputs de tokens si están en la URL
      if (tokenAFromUrl) {
        setTokenA(tokenAFromUrl);
      }
      if (tokenBFromUrl) {
        setTokenB(tokenBFromUrl);
      }
    }
  }, [router.isReady, router.query.tokenA, router.query.tokenB]);

  // Efecto separado para buscar pool automáticamente cuando se llenan los tokens desde URL
  useEffect(() => {
    if (router.isReady && tokenA && tokenB && tokenA !== tokenB) {
      const tokenAFromUrl = router.query.tokenA as string;
      const tokenBFromUrl = router.query.tokenB as string;
      
      // Solo buscar automáticamente si los tokens vienen de la URL
      if (tokenAFromUrl && tokenBFromUrl && 
          tokenA === tokenAFromUrl && tokenB === tokenBFromUrl) {
        const searchPool = async () => {
          if (!tokenA || !tokenB || tokenA === tokenB) {
            updateLiquidityState({ error: 'Debes ingresar dos direcciones de tokens diferentes' });
            return;
          }

          setIsLoadingPoolInfo(true);
          updateLiquidityState({ error: null });

          try {
            const poolAddress = await getPoolAddress(tokenA, tokenB);
            if (!poolAddress) {
              updateLiquidityState({ error: 'No se encontró un pool para esta combinación de tokens' });
              setSelectedPool(null);
              return;
            }

            const pool = await getPoolInfo(poolAddress);
            setSelectedPool(pool);
            updateLiquidityState({ 
              poolAddress,
              tokenA: tokenA as `0x${string}`,
              tokenB: tokenB as `0x${string}`
            });
          } catch (error) {
            updateLiquidityState({ error: 'Error al buscar el pool' });
            setSelectedPool(null);
          } finally {
            setIsLoadingPoolInfo(false);
          }
        };
        
        // Delay para asegurar que los estados se actualicen
        const timeoutId = setTimeout(searchPool, 500);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [tokenA, tokenB, router.isReady, router.query.tokenA, router.query.tokenB, getPoolAddress, getPoolInfo, updateLiquidityState]);


  // Función para buscar pool por direcciones de tokens
  const handleSearchPool = async () => {
    if (!tokenA || !tokenB || tokenA === tokenB) {
      updateLiquidityState({ error: 'Debes ingresar dos direcciones de tokens diferentes' });
      return;
    }

    setIsLoadingPoolInfo(true);
    updateLiquidityState({ error: null });

    try {
      const poolAddress = await getPoolAddress(tokenA, tokenB);
      if (!poolAddress) {
        updateLiquidityState({ error: 'No se encontró un pool para esta combinación de tokens' });
        setSelectedPool(null);
        return;
      }

      const pool = await getPoolInfo(poolAddress);
      setSelectedPool(pool);
      updateLiquidityState({ 
        poolAddress,
        tokenA: tokenA as `0x${string}`,
        tokenB: tokenB as `0x${string}`
      });
    } catch (error) {
      updateLiquidityState({ error: 'Error al buscar el pool' });
      setSelectedPool(null);
    } finally {
      setIsLoadingPoolInfo(false);
    }
  };

  // Función para calcular cantidades óptimas al agregar liquidez (A -> B)
  const handleCalculateOptimalAmounts = useCallback(async () => {
    if (!selectedPool || !debouncedAmountA || parseFloat(debouncedAmountA) <= 0 || isResettingAfterSuccess) {
      setCalculationError(null);
      return;
    }

    setIsCalculating(true);
    setCalculationError(null);
    
    try {
      const amounts = await calculateOptimalAmounts(
        selectedPool.token0,
        selectedPool.token1,
        debouncedAmountA
      );
      
      if (amounts) {
        // Determinar qué token es A y cuál es B
        const isTokenAFirst = tokenA.toLowerCase() === selectedPool.token0.toLowerCase();
        setAmountB(isTokenAFirst ? amounts.amountB : amounts.amountA);
      } else {
        setCalculationError('No se pudieron calcular las cantidades óptimas');
      }
    } catch (error) {
      setCalculationError('Error al calcular cantidades óptimas');
    } finally {
      setIsCalculating(false);
    }
  }, [selectedPool, debouncedAmountA, tokenA, calculateOptimalAmounts, isResettingAfterSuccess]);

  // Función para calcular cantidad A basada en cantidad B
  const handleCalculateAmountAFromB = useCallback(async () => {
    if (!selectedPool || !debouncedAmountB || parseFloat(debouncedAmountB) <= 0 || isResettingAfterSuccess) {
      setCalculationError(null);
      return;
    }

    setIsCalculating(true);
    setCalculationError(null);
    
    try {
      // Determinar qué token es A y cuál es B
      const isTokenAFirst = tokenA.toLowerCase() === selectedPool.token0.toLowerCase();
      const reserveA = isTokenAFirst ? selectedPool.reserve0 : selectedPool.reserve1;
      const reserveB = isTokenAFirst ? selectedPool.reserve1 : selectedPool.reserve0;
      const decimalsA = isTokenAFirst ? selectedPool.token0Info.decimals : selectedPool.token1Info.decimals;
      const decimalsB = isTokenAFirst ? selectedPool.token1Info.decimals : selectedPool.token0Info.decimals;

      // Convertir cantidad B a wei
      const amountBWei = parseUnits(debouncedAmountB, decimalsB);
      
      // Calcular cantidad proporcional de A
      const amountAWei = (amountBWei * reserveA) / reserveB;
      const amountAFormatted = formatUnits(amountAWei, decimalsA);
      
      setAmountA(amountAFormatted);
    } catch (error) {
      setCalculationError('Error al calcular cantidad A');
    } finally {
      setIsCalculating(false);
    }
  }, [selectedPool, debouncedAmountB, tokenA, isResettingAfterSuccess]);



  // Función para agregar liquidez
  const handleAddLiquidity = async () => {
    if (!selectedPool || !amountA || !amountB) {
      updateLiquidityState({ error: 'Completa todas las cantidades' });
      return;
    }

    // Validaciones específicas para WETH+ETH
    if (selectedPool.token0Info.isWETH) {
      const neededAmount = parseFloat(amountA);
      const availableWETH = parseFloat(selectedPool.token0Info.formattedBalance);
      const availableETH = ethBalance ? parseFloat(ethBalance.formatted) : 0;
      const totalAvailable = availableWETH + availableETH;
      
      if (neededAmount > totalAvailable) {
        updateLiquidityState({ 
          error: `No tienes suficiente ${selectedPool.token0Info.symbol}. Disponible: ${totalAvailable.toFixed(6)} (${availableWETH.toFixed(6)} WETH + ${availableETH.toFixed(6)} ETH)` 
        });
        return;
      }
    }

    if (selectedPool.token1Info.isWETH) {
      const neededAmount = parseFloat(amountB);
      const availableWETH = parseFloat(selectedPool.token1Info.formattedBalance);
      const availableETH = ethBalance ? parseFloat(ethBalance.formatted) : 0;
      const totalAvailable = availableWETH + availableETH;
      
      if (neededAmount > totalAvailable) {
        updateLiquidityState({ 
          error: `No tienes suficiente ${selectedPool.token1Info.symbol}. Disponible: ${totalAvailable.toFixed(6)} (${availableWETH.toFixed(6)} WETH + ${availableETH.toFixed(6)} ETH)` 
        });
        return;
      }
    }

    try {
      await addLiquidity(
        selectedPool.token0,
        selectedPool.token1,
        amountA,
        amountB
      );
    } catch (error) {
      // Error agregando liquidez
    }
  };


  // Función para copiar hash de transacción
  const handleCopyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(null), 2000);
    } catch (error) {
      // Error copying hash
    }
  };

  // Función para copiar dirección del pool
  const handleCopyPoolAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedPoolAddress(true);
      setTimeout(() => setCopiedPoolAddress(false), 2000);
    } catch (error) {
      // Error copying pool address
    }
  };

  // Función para limpiar valores para cálculos
  const cleanValueForCalculation = (value: string) => {
    return value.replace(/,/g, '');
  };

  // Handlers para NumericFormat optimizados con useCallback
  const handleAmountAChange = useCallback((values: any) => {
    setAmountA(values.value || '');
    setCalculationError(null);
  }, []);

  const handleAmountBChange = useCallback((values: any) => {
    setAmountB(values.value || '');
    setCalculationError(null);
  }, []);


  // Efecto para calcular cantidades óptimas cuando cambie debouncedAmountA
  useEffect(() => {
    if (selectedPool && debouncedAmountA && parseFloat(debouncedAmountA) > 0 && !isResettingAfterSuccess) {
      handleCalculateOptimalAmounts();
    }
  }, [debouncedAmountA, selectedPool, handleCalculateOptimalAmounts, isResettingAfterSuccess]);

  // Efecto para calcular cantidad A cuando cambie debouncedAmountB
  useEffect(() => {
    if (selectedPool && debouncedAmountB && parseFloat(debouncedAmountB) > 0 && !isResettingAfterSuccess) {
      handleCalculateAmountAFromB();
    }
  }, [debouncedAmountB, selectedPool, handleCalculateAmountAFromB, isResettingAfterSuccess]);

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>Agregar Liquidez - DApp Polka</title>
        <meta
          content="Agrega liquidez a pools Uniswap V2"
          name="description"
        />
        <link href="/favicon.ico" rel="icon" />
      </Head>

      <div className="container mx-auto px-3 py-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground mb-1">
                Agregar Liquidez
              </h1>
              <p className="text-muted-foreground text-xs">
                Agrega liquidez a pools Uniswap V2
              </p>
            </div>
            <Link href="/pools">
              <Button variant="ghost" size="sm" className="text-xs">
                <ArrowLeft className="w-3 h-3 mr-1" />
                Volver a Pools
              </Button>
            </Link>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Botones de navegación */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="default"
              className="text-xs h-12"
              disabled={true}
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Liquidez
            </Button>
            <Link href={`/remover-liquidez${tokenA && tokenB ? `?tokenA=${tokenA}&tokenB=${tokenB}` : ''}`}>
              <Button
                variant="outline"
                className="text-xs h-12 w-full"
                disabled={liquidityState.isAdding || liquidityState.isConfirming}
              >
                <Minus className="w-4 h-4 mr-2" />
                Remover Liquidez
              </Button>
            </Link>
          </div>

          {/* Selección de pool */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center space-x-2">
                <Info className="w-4 h-4" />
                <span>Seleccionar Pool</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Búsqueda manual por direcciones */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Token A
                    </label>
                    <input
                      type="text"
                      value={tokenA}
                      onChange={(e) => setTokenA(e.target.value)}
                      placeholder="0x... (dirección del token)"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xs"
                      disabled={liquidityState.isAdding || liquidityState.isConfirming}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Token B
                    </label>
                    <input
                      type="text"
                      value={tokenB}
                      onChange={(e) => setTokenB(e.target.value)}
                      placeholder="0x... (dirección del token)"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xs"
                      disabled={liquidityState.isAdding || liquidityState.isConfirming}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSearchPool}
                  disabled={!tokenA || !tokenB || isLoadingPoolInfo || liquidityState.isAdding || liquidityState.isConfirming}
                  className="w-full text-xs"
                >
                  {isLoadingPoolInfo ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                      Buscando pool...
                    </>
                  ) : (
                    'Buscar Pool'
                  )}
                </Button>
              </div>

            </CardContent>
          </Card>



          {/* Mensaje de éxito para agregar liquidez */}
          {liquidityState.isSuccess && liquidityState.txHash && liquidityState.successOperation === 'add' && (
            <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                      ¡Liquidez agregada exitosamente!
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300 mb-2">
                      Has agregado liquidez al pool y recibido tokens LP.
                    </p>
                    <div className="flex items-center space-x-4 flex-wrap gap-2">
                      <a
                        href={`https://sepolia.etherscan.io/tx/${liquidityState.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:underline flex items-center space-x-1 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Ver transacción en Etherscan</span>
                      </a>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-green-600 dark:text-green-400">
                          Hash: {liquidityState.txHash.slice(0, 10)}...{liquidityState.txHash.slice(-8)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => liquidityState.txHash && handleCopyHash(liquidityState.txHash)}
                          className="h-5 w-5 p-0 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/20"
                          title={copiedHash === liquidityState.txHash ? "¡Copiado!" : "Copiar hash"}
                        >
                          {copiedHash === liquidityState.txHash ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetSuccessState}
                  className="h-6 w-6 p-0 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/20"
                  title="Cerrar mensaje"
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Interfaz para agregar liquidez */}
          {selectedPool && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Agregar Liquidez</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2 flex items-center space-x-2">
                      <span>Cantidad de {selectedPool.token0Info.symbol}</span>
                      {selectedPool.token0Info.isWETH && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          WETH + ETH
                        </Badge>
                      )}
                    </label>
                    <div className="relative">
                      <NumericFormat
                        value={amountA}
                        onValueChange={handleAmountAChange}
                        placeholder="0.0"
                        thousandSeparator=","
                        decimalSeparator="."
                        allowNegative={false}
                        decimalScale={18}
                        fixedDecimalScale={false}
                        className={`w-full px-3 py-2 border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                          isCalculating 
                            ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20' 
                            : 'border-border'
                        }`}
                        disabled={liquidityState.isAdding || liquidityState.isConfirming}
                      />
                      {isCalculating && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedPool.token0Info.isWETH && selectedPool.token0Info.ethBalance && selectedPool.token0Info.ethBalance > 0n ? (
                        <span>
                          Balance: {formatAmount(selectedPool.token0Info.balance)} {selectedPool.token0Info.symbol} + {formatAmount(selectedPool.token0Info.ethBalance)} ETH
                          <br />
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            Total disponible: {formatAmount(selectedPool.token0Info.totalAvailableBalance || selectedPool.token0Info.balance)} {selectedPool.token0Info.symbol}
                          </span>
                        </span>
                      ) : (
                        `Balance: ${formatAmount(selectedPool.token0Info.balance)} ${selectedPool.token0Info.symbol}`
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2 flex items-center space-x-2">
                      <span>Cantidad de {selectedPool.token1Info.symbol}</span>
                      {selectedPool.token1Info.isWETH && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          WETH + ETH
                        </Badge>
                      )}
                    </label>
                    <div className="relative">
                      <NumericFormat
                        value={amountB}
                        onValueChange={handleAmountBChange}
                        placeholder="0.0"
                        thousandSeparator=","
                        decimalSeparator="."
                        allowNegative={false}
                        decimalScale={18}
                        fixedDecimalScale={false}
                        className={`w-full px-3 py-2 border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                          isCalculating 
                            ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20' 
                            : 'border-border'
                        }`}
                        disabled={liquidityState.isAdding || liquidityState.isConfirming}
                      />
                      {isCalculating && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedPool.token1Info.isWETH && selectedPool.token1Info.ethBalance && selectedPool.token1Info.ethBalance > 0n ? (
                        <span>
                          Balance: {formatAmount(selectedPool.token1Info.balance)} {selectedPool.token1Info.symbol} + {formatAmount(selectedPool.token1Info.ethBalance)} ETH
                          <br />
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            Total disponible: {formatAmount(selectedPool.token1Info.totalAvailableBalance || selectedPool.token1Info.balance)} {selectedPool.token1Info.symbol}
                          </span>
                        </span>
                      ) : (
                        `Balance: ${formatAmount(selectedPool.token1Info.balance)} ${selectedPool.token1Info.symbol}`
                      )}
                    </p>
                  </div>
                </div>
                
                {/* Información sobre WETH + ETH */}
                {(selectedPool.token0Info.isWETH || selectedPool.token1Info.isWETH) && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-blue-800 dark:text-blue-200">
                        <p className="font-medium mb-1">💡 Información sobre WETH</p>
                        <p>
                          {selectedPool.token0Info.isWETH && selectedPool.token1Info.isWETH
                            ? 'Ambos tokens son WETH. Puedes usar tu balance de ETH nativo para agregar liquidez.'
                            : 'Uno de los tokens es WETH. Puedes usar tu balance de ETH nativo para agregar liquidez.'}
                        </p>
                        <p className="mt-1 text-blue-700 dark:text-blue-300">
                          El ETH se envolverá automáticamente a WETH durante la transacción.
                        </p>
                      </div>
                    </div>
                  </div>
                )}


                {isCalculating && (
                  <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                    <h4 className="text-sm font-medium text-foreground">Calculando cantidades óptimas...</h4>
                    <CalculationSkeleton />
                  </div>
                )}

                {calculationError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-800 dark:text-red-200">
                        {calculationError}
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleAddLiquidity}
                  disabled={
                    !amountA || !amountB || 
                    parseFloat(amountA) <= 0 || parseFloat(amountB) <= 0 ||
                    liquidityState.isAdding || liquidityState.isConfirming ||
                    !isConnected
                  }
                  className="w-full"
                >
                  {liquidityState.isAdding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Agregando liquidez...
                    </>
                  ) : liquidityState.isConfirming ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Confirmando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Liquidez
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Información del pool seleccionado */}
          {selectedPool && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Información del Pool</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Token 0:</span>
                      <span className="text-sm font-medium">{selectedPool.token0Info.name} ({selectedPool.token0Info.symbol})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Token 1:</span>
                      <span className="text-sm font-medium">{selectedPool.token1Info.name} ({selectedPool.token1Info.symbol})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Reservas Token 0:</span>
                      <span className="text-sm font-medium">
                        {formatAmount(fromTokenUnits(selectedPool.reserve0, selectedPool.token0Info.decimals))} {selectedPool.token0Info.symbol}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Reservas Token 1:</span>
                      <span className="text-sm font-medium">
                        {formatAmount(fromTokenUnits(selectedPool.reserve1, selectedPool.token1Info.decimals))} {selectedPool.token1Info.symbol}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Supply Total LP:</span>
                      <span className="text-sm font-medium">
                        {formatAmount(fromTokenUnits(selectedPool.totalSupply, 18))} LP
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Dirección:</span>
                      <div className="flex items-center space-x-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {selectedPool.address.slice(0, 8)}...{selectedPool.address.slice(-6)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyPoolAddress(selectedPool.address)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          title={copiedPoolAddress ? "¡Copiado!" : "Copiar dirección"}
                        >
                          {copiedPoolAddress ? (
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mensajes de estado */}
          {liquidityState.error && (
            <Card>
              <CardContent className="pt-6">
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800 dark:text-red-200">
                      Error
                    </span>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {liquidityState.error}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {liquidityState.isConfirming && liquidityState.txHash && (
            <Card>
              <CardContent className="pt-6">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Confirmando transacción...
                    </span>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                    La transacción ha sido enviada y está siendo confirmada en la blockchain.
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-blue-700 dark:text-blue-300">
                      Hash de transacción:
                    </span>
                    <code className="text-xs bg-blue-100 dark:bg-blue-900/20 px-2 py-1 rounded">
                      {liquidityState.txHash.slice(0, 10)}...{liquidityState.txHash.slice(-8)}
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}


          {/* Información sobre liquidez */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span>¿Qué es la liquidez en Uniswap?</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm text-foreground mb-2">Proveedores de Liquidez (LP)</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Los proveedores de liquidez depositan pares de tokens en pools de Uniswap para facilitar el trading. 
                    A cambio, reciben tokens LP que representan su participación en el pool y les dan derecho a una 
                    porción de las comisiones generadas por las transacciones.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-foreground mb-2">Beneficios de ser LP</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li className="flex items-start space-x-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span><strong>Comisiones:</strong> Ganas 0.3% de cada swap en el pool</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span><strong>Proporcional:</strong> Tus ganancias son proporcionales a tu participación</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span><strong>Flexibilidad:</strong> Puedes agregar o remover liquidez en cualquier momento</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-foreground mb-2">Riesgos a considerar</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li className="flex items-start space-x-2">
                      <span className="text-orange-600 mt-1">⚠</span>
                      <span><strong>Pérdida impermanente:</strong> El valor relativo de los tokens puede cambiar</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-orange-600 mt-1">⚠</span>
                      <span><strong>Volatilidad:</strong> Los precios de los tokens pueden fluctuar</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-orange-600 mt-1">⚠</span>
                      <span><strong>Gas fees:</strong> Las transacciones requieren gas para ejecutarse</span>
                    </li>
                  </ul>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    <strong>💡 Consejo:</strong> Para maximizar tus ganancias, considera pools con alto volumen de trading 
                    y baja volatilidad. También es importante mantener una proporción equilibrada entre los tokens del par.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AgregarLiquidezPage;
