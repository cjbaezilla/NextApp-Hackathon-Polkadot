import type { NextPage } from 'next';
import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info,
  Loader2,
  ArrowLeft,
  Coins,
  DollarSign,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useRouter } from 'next/router';
import ClientOnly from '@/components/ClientOnly';
import Link from 'next/link';
import { usePoolCreation, TokenInfo } from '@/hooks/usePoolCreation';
import { UNISWAP_V2_ADDRESSES, TOKEN_SYMBOLS } from '@/lib/constants';
import { formatAmount } from '@/lib/uniswap-utils';
import { NumericFormat } from 'react-number-format';
import { useBalance, useContractRead } from 'wagmi';
import { formatEther } from 'viem';
import ERC20_ABI from '@uniswap/v2-core/build/IERC20.json';

const CrearPoolPage: NextPage = () => {
  const router = useRouter();
  
  // Estados del formulario
  const [poolType, setPoolType] = useState<'token-token' | 'token-eth'>('token-token');
  const [tokenA, setTokenA] = useState('');
  const [tokenB, setTokenB] = useState('');
  const [amountA, setAmountA] = useState<string>('');
  const [amountB, setAmountB] = useState<string>('');
  const [ethAmount, setEthAmount] = useState<string>('');

  // Estados para información de tokens
  const [tokenAInfo, setTokenAInfo] = useState<TokenInfo | null>(null);
  const [tokenBInfo, setTokenBInfo] = useState<TokenInfo | null>(null);
  const [isLoadingTokenInfo, setIsLoadingTokenInfo] = useState(false);

  // Estados para validación de existencia de pools
  const [poolExists, setPoolExists] = useState<boolean>(false);
  const [isCheckingPool, setIsCheckingPool] = useState<boolean>(false);

  // Hook personalizado para manejo de creación de pools
  const {
    poolCreationState,
    createPool,
    createPoolWithETH,
    getTokenInfo,
    checkPoolExists,
    resetCreationState,
    formatETH,
    isConnected,
    address
  } = usePoolCreation();

  // Obtener balance de ETH del usuario
  const { data: ethBalance } = useBalance({
    address: address,
  });

  // Obtener balance de WETH del usuario
  const { data: wethBalance } = useContractRead({
    address: UNISWAP_V2_ADDRESSES.WETH as `0x${string}`,
    abi: ERC20_ABI.abi,
    functionName: 'balanceOf',
    args: address ? [address] : ['0x0000000000000000000000000000000000000000'],
    query: {
      enabled: !!address,
    },
  });

  // Efecto para manejar éxito de creación
  useEffect(() => {
    if (poolCreationState.isSuccess) {
      // Limpiar formulario
      setTokenA('');
      setTokenB('');
      setAmountA('');
      setAmountB('');
      setEthAmount('');
      setTokenAInfo(null);
      setTokenBInfo(null);
      // Redirigir a la página de pools con parámetro para mostrar mensaje de éxito
      router.push('/pools?from=create-pool');
    }
  }, [poolCreationState.isSuccess, router]);

  // Efecto para llenar automáticamente las direcciones desde query parameters
  useEffect(() => {
    if (router.isReady) {
      const { tokenA: queryTokenA, tokenB: queryTokenB } = router.query;
      
      if (queryTokenA && typeof queryTokenA === 'string' && queryTokenA !== tokenA) {
        setTokenA(queryTokenA);
      }
      
      if (queryTokenB && typeof queryTokenB === 'string' && queryTokenB !== tokenB) {
        setTokenB(queryTokenB);
      }
    }
  }, [router.isReady, router.query, tokenA, tokenB]);

  // Cargar información de tokens cuando cambian las direcciones
  useEffect(() => {
    const loadTokenInfo = async () => {
      if (!tokenA || !isConnected) {
        setTokenAInfo(null);
        return;
      }
      
      // Validar que la dirección sea válida antes de hacer la llamada
      if (!tokenA.startsWith('0x') || tokenA.length !== 42) {
        setTokenAInfo(null);
        return;
      }
      
      setIsLoadingTokenInfo(true);
      try {
        const info = await getTokenInfo(tokenA);
        setTokenAInfo(info);
      } catch (error) {
        console.error('Error loading token A info:', error);
        setTokenAInfo(null);
      } finally {
        setIsLoadingTokenInfo(false);
      }
    };

    loadTokenInfo();
  }, [tokenA, getTokenInfo, isConnected]);

  useEffect(() => {
    const loadTokenInfo = async () => {
      if (!tokenB || !isConnected || poolType === 'token-eth') {
        setTokenBInfo(null);
        return;
      }
      
      // Validar que la dirección sea válida antes de hacer la llamada
      if (!tokenB.startsWith('0x') || tokenB.length !== 42) {
        setTokenBInfo(null);
        return;
      }
      
      setIsLoadingTokenInfo(true);
      try {
        const info = await getTokenInfo(tokenB);
        setTokenBInfo(info);
      } catch (error) {
        console.error('Error loading token B info:', error);
        setTokenBInfo(null);
      } finally {
        setIsLoadingTokenInfo(false);
      }
    };

    loadTokenInfo();
  }, [tokenB, getTokenInfo, isConnected, poolType]);

  // Efecto para verificar existencia de pools cuando ambos tokens estén completos
  useEffect(() => {
    const checkPoolExistence = async () => {
      if (!isConnected) return;
      
      // Para pools token-token
      if (poolType === 'token-token' && tokenA && tokenB && tokenA !== tokenB) {
        // Validar que ambas direcciones sean válidas
        if (tokenA.startsWith('0x') && tokenA.length === 42 && 
            tokenB.startsWith('0x') && tokenB.length === 42) {
          setIsCheckingPool(true);
          try {
            const exists = await checkPoolExists(tokenA, tokenB);
            setPoolExists(exists);
          } catch (error) {
            console.error('Error checking pool existence:', error);
            setPoolExists(false);
          } finally {
            setIsCheckingPool(false);
          }
        } else {
          setPoolExists(false);
        }
      }
      // Para pools token-ETH
      else if (poolType === 'token-eth' && tokenA) {
        // Validar que la dirección del token sea válida
        if (tokenA.startsWith('0x') && tokenA.length === 42) {
          setIsCheckingPool(true);
          try {
            const exists = await checkPoolExists(tokenA, UNISWAP_V2_ADDRESSES.WETH);
            setPoolExists(exists);
          } catch (error) {
            console.error('Error checking pool existence:', error);
            setPoolExists(false);
          } finally {
            setIsCheckingPool(false);
          }
        } else {
          setPoolExists(false);
        }
      }
      // Resetear estado si no hay tokens completos
      else {
        setPoolExists(false);
      }
    };

    checkPoolExistence();
  }, [tokenA, tokenB, poolType, isConnected, checkPoolExists]);

  // Función para limpiar el valor para cálculos (remover comas y mantener decimales)
  const cleanValueForCalculation = (value: string) => {
    return value.replace(/,/g, '');
  };

  // Función para calcular el balance total disponible de ETH + WETH
  const getTotalETHWETHBalance = () => {
    if (!ethBalance && !wethBalance) return 0;
    
    const ethAmount = ethBalance ? parseFloat(formatEther(ethBalance.value)) : 0;
    const wethAmount = wethBalance ? parseFloat(formatEther(wethBalance as bigint)) : 0;
    
    return ethAmount + wethAmount;
  };

  // Función para formatear el balance total
  const formatTotalETHWETHBalance = () => {
    const total = getTotalETHWETHBalance();
    return total.toLocaleString('es-ES', { 
      minimumFractionDigits: 4, 
      maximumFractionDigits: 4 
    });
  };

  // Función para convertir formato "K" y "M" de vuelta a número completo
  const parseFormattedAmount = (formattedAmount: string): number => {
    const cleanAmount = formattedAmount.replace(/,/g, '');
    
    if (cleanAmount.endsWith('K')) {
      return parseFloat(cleanAmount.slice(0, -1)) * 1000;
    }
    if (cleanAmount.endsWith('M')) {
      return parseFloat(cleanAmount.slice(0, -1)) * 1000000;
    }
    
    return parseFloat(cleanAmount);
  };

  // Handlers para react-number-format
  const handleAmountAChange = (values: any) => {
    setAmountA(values.value || '');
  };

  const handleAmountBChange = (values: any) => {
    setAmountB(values.value || '');
  };

  const handleEthAmountChange = (values: any) => {
    setEthAmount(values.value || '');
  };

  // Función para crear pool
  const handleCreatePool = async () => {
    try {
      // Limpiar los valores formateados antes de enviar (remover comas, mantener decimales)
      const cleanAmountA = cleanValueForCalculation(amountA);
      const cleanAmountB = cleanValueForCalculation(amountB);
      const cleanEthAmount = cleanValueForCalculation(ethAmount);
      
      if (poolType === 'token-token') {
        await createPool(tokenA, tokenB, cleanAmountA, cleanAmountB);
      } else {
        await createPoolWithETH(tokenA, cleanAmountA, cleanEthAmount);
      }
    } catch (error) {
      console.error('Error al crear pool:', error);
    }
  };

  // Función para limpiar errores
  const handleClearError = () => {
    resetCreationState();
  };

  // Validar si el formulario está completo
  const isFormValid = () => {
    if (poolType === 'token-token') {
      const cleanAmountA = cleanValueForCalculation(amountA);
      const cleanAmountB = cleanValueForCalculation(amountB);
      return tokenA.trim() && tokenB.trim() && amountA && amountB && 
             parseFloat(cleanAmountA) > 0 && parseFloat(cleanAmountB) > 0 &&
             !poolExists; // El pool no debe existir
    } else {
      const cleanAmountA = cleanValueForCalculation(amountA);
      const cleanEthAmount = cleanValueForCalculation(ethAmount);
      return tokenA.trim() && amountA && ethAmount && 
             parseFloat(cleanAmountA) > 0 && parseFloat(cleanEthAmount) > 0 &&
             !poolExists; // El pool no debe existir
    }
  };

  // Verificar si hay suficiente balance
  const hasInsufficientBalance = () => {
    if (!tokenAInfo || !amountA) return false;
    
    const cleanAmountA = cleanValueForCalculation(amountA);
    const requiredAmount = parseFloat(cleanAmountA);
    const availableAmount = parseFormattedAmount(formatAmount(tokenAInfo.balance));
    
    return requiredAmount > availableAmount;
  };

  const hasInsufficientBalanceB = () => {
    if (!tokenBInfo || !amountB || poolType === 'token-eth') return false;
    
    const cleanAmountB = cleanValueForCalculation(amountB);
    const requiredAmount = parseFloat(cleanAmountB);
    const availableAmount = parseFormattedAmount(formatAmount(tokenBInfo.balance));
    
    return requiredAmount > availableAmount;
  };

  // Verificar si hay suficiente balance de ETH/WETH
  const hasInsufficientETHWETHBalance = () => {
    if (!ethAmount || poolType !== 'token-eth') return false;
    
    const cleanEthAmount = cleanValueForCalculation(ethAmount);
    const requiredAmount = parseFloat(cleanEthAmount);
    const availableAmount = getTotalETHWETHBalance();
    
    return requiredAmount > availableAmount;
  };

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>Crear Pool de Liquidez - DApp Polka</title>
        <meta
          content="Crear un nuevo pool de liquidez Uniswap V2"
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
                Crear Pool de Liquidez
              </h1>
              <p className="text-muted-foreground text-xs">
                Crea un nuevo pool de liquidez Uniswap V2
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

        <div className="max-w-4xl mx-auto">
          {/* Formulario de creación */}
          <Card className="gap-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Configuración del Pool</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Información sobre pools */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    ¿Qué es un Pool de Liquidez?
                  </span>
                </div>
                <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
                  <p>• Un pool de liquidez permite el intercambio entre dos tokens</p>
                  <p>• Los proveedores de liquidez ganan comisiones por las transacciones</p>
                  <p>• Puedes crear pools entre tokens ERC20 o entre un token y ETH</p>
                  <p>• Una vez creado, el pool estará disponible para todos los usuarios</p>
                </div>
              </div>

              {!isConnected && (
                <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">Conecta tu wallet para crear un pool</span>
                </div>
              )}
              {/* Tipo de pool */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tipo de Pool
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={poolType === 'token-token' ? 'default' : 'outline'}
                    onClick={() => setPoolType('token-token')}
                    className="text-xs"
                    disabled={poolCreationState.isCreating || poolCreationState.isConfirming}
                  >
                    Token/Token
                  </Button>
                  <Button
                    variant={poolType === 'token-eth' ? 'default' : 'outline'}
                    onClick={() => setPoolType('token-eth')}
                    className="text-xs"
                    disabled={poolCreationState.isCreating || poolCreationState.isConfirming}
                  >
                    Token/ETH
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {poolType === 'token-token' 
                    ? 'Crea un pool entre dos tokens ERC20'
                    : 'Crea un pool entre un token ERC20 y ETH (WETH)'
                  }
                </p>
              </div>

              {/* Token A */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {poolType === 'token-eth' ? 'Token' : 'Token A'}
                </label>
                <input
                  type="text"
                  value={tokenA}
                  onChange={(e) => setTokenA(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={poolCreationState.isCreating || poolCreationState.isConfirming}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Dirección del contrato del token
                </p>
                {/* Notificación de Token A válido */}
                {!poolExists && tokenAInfo && (
                  <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-green-800 dark:text-green-200">
                          {tokenAInfo.name} ({tokenAInfo.symbol})
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300">
                          Balance: {formatAmount(tokenAInfo.balance)} {tokenAInfo.symbol}
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Válido
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Mostrar balance disponible de ETH + WETH en vista token-ETH */}
                {poolType === 'token-eth' && isConnected && address && tokenA && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                          Balance disponible (ETH + WETH)
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          {formatTotalETHWETHBalance()} ETH
                        </p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 text-xs">
                        <DollarSign className="w-3 h-3 mr-1" />
                        Total
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              {/* Token B (solo para token-token) */}
              {poolType === 'token-token' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Token B
                  </label>
                  <input
                    type="text"
                    value={tokenB}
                    onChange={(e) => setTokenB(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    disabled={poolCreationState.isCreating || poolCreationState.isConfirming}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Dirección del contrato del segundo token
                  </p>
                  {/* Notificación de Token B válido */}
                  {!poolExists && tokenBInfo && (
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-green-800 dark:text-green-200">
                            {tokenBInfo.name} ({tokenBInfo.symbol})
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-300">
                            Balance: {formatAmount(tokenBInfo.balance)} {tokenBInfo.symbol}
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Válido
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Información de tokens */}
              {isLoadingTokenInfo && (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Cargando información de tokens...</span>
                </div>
              )}

              {/* Verificación de existencia de pools */}
              {isCheckingPool && (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Verificando si el pool ya existe...</span>
                </div>
              )}

              {/* Advertencia si el pool ya existe */}
              {poolExists && !isCheckingPool && (
                <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                      Pool ya existe
                    </span>
                  </div>
                  <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                    {poolType === 'token-token' 
                      ? 'Ya existe un pool de liquidez para esta combinación de tokens. Puedes agregar liquidez al pool existente en lugar de crear uno nuevo.'
                      : 'Ya existe un pool de liquidez para este token y WETH. Puedes agregar liquidez al pool existente en lugar de crear uno nuevo.'
                    }
                  </p>
                </div>
              )}


              {/* Cantidades - Layout responsivo - Solo mostrar si el pool no existe */}
              {!poolExists && (
                <div className="flex flex-col min-[400px]:flex-row gap-4">
                  {/* Cantidad Token A */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Cantidad de {tokenAInfo?.symbol || 'Token A'}
                    </label>
                    <NumericFormat
                      value={amountA}
                      onValueChange={handleAmountAChange}
                      placeholder="0"
                      thousandSeparator=","
                      decimalSeparator="."
                      allowNegative={false}
                      decimalScale={18}
                      fixedDecimalScale={false}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      disabled={poolCreationState.isCreating || poolCreationState.isConfirming}
                    />
                    {hasInsufficientBalance() && (
                      <p className="text-xs text-red-600 mt-1">
                        Balance insuficiente. Disponible: {formatAmount(tokenAInfo?.balance || 0n)} {tokenAInfo?.symbol}
                      </p>
                    )}
                  </div>

                  {/* Cantidad Token B o ETH */}
                  {poolType === 'token-token' ? (
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Cantidad de {tokenBInfo?.symbol || 'Token B'}
                      </label>
                      <NumericFormat
                        value={amountB}
                        onValueChange={handleAmountBChange}
                        placeholder="0"
                        thousandSeparator=","
                        decimalSeparator="."
                        allowNegative={false}
                        decimalScale={18}
                        fixedDecimalScale={false}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        disabled={poolCreationState.isCreating || poolCreationState.isConfirming}
                      />
                      {hasInsufficientBalanceB() && (
                        <p className="text-xs text-red-600 mt-1">
                          Balance insuficiente. Disponible: {formatAmount(tokenBInfo?.balance || 0n)} {tokenBInfo?.symbol}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Cantidad de ETH
                      </label>
                      <NumericFormat
                        value={ethAmount}
                        onValueChange={handleEthAmountChange}
                        placeholder="0"
                        thousandSeparator=","
                        decimalSeparator="."
                        allowNegative={false}
                        decimalScale={18}
                        fixedDecimalScale={false}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        disabled={poolCreationState.isCreating || poolCreationState.isConfirming}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Esta cantidad se convertirá automáticamente a WETH
                      </p>
                      {hasInsufficientETHWETHBalance() && (
                        <p className="text-xs text-red-600 mt-1">
                          Balance insuficiente. Disponible: {formatTotalETHWETHBalance()} ETH
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Botón de creación */}
              <Button
                onClick={handleCreatePool}
                disabled={
                  poolCreationState.isCreating || 
                  poolCreationState.isConfirming ||
                  !isConnected ||
                  (!poolExists && (!isFormValid() || hasInsufficientBalance() || hasInsufficientBalanceB() || hasInsufficientETHWETHBalance())) ||
                  isCheckingPool
                }
                className={`w-full ${poolExists ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                variant={poolExists ? 'default' : 'default'}
              >
                {poolCreationState.isCreating || poolCreationState.isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {poolCreationState.isCreating ? 'Enviando transacción...' : 
                     poolCreationState.isConfirming ? 'Esperando confirmación de la blockchain...' : 
                     poolExists ? 'Agregando liquidez...' : 'Creando pool...'}
                  </>
                ) : (
                  <>
                    {poolExists ? (
                      <Coins className="w-4 h-4 mr-2" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    {poolExists ? 'Agregar Liquidez' : 'Crear Pool'}
                  </>
                )}
              </Button>

              <ClientOnly fallback={null}>
                {!isConnected && (
                  <p className="text-sm text-muted-foreground text-center">
                    Conecta tu wallet para crear un pool
                  </p>
                )}
              </ClientOnly>

              {/* Mostrar errores si los hay */}
              <ClientOnly fallback={null}>
                {poolCreationState.error && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-800 dark:text-red-200">
                          Error al crear pool
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearError}
                        className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                      >
                        Cerrar
                      </Button>
                    </div>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                      {poolCreationState.error}
                    </p>
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCreatePool}
                        className={`w-full ${poolExists ? 'text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/20' : 'text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20'}`}
                        disabled={
                          poolCreationState.isCreating || 
                          poolCreationState.isConfirming ||
                          !isConnected ||
                          (!poolExists && (!isFormValid() || hasInsufficientBalance() || hasInsufficientBalanceB() || hasInsufficientETHWETHBalance())) ||
                          isCheckingPool
                        }
                      >
                        Reintentar
                      </Button>
                    </div>
                  </div>
                )}
              </ClientOnly>

              {/* Mostrar estado de confirmación */}
              <ClientOnly fallback={null}>
                {poolCreationState.isConfirming && poolCreationState.txHash && (
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
                        {poolCreationState.txHash.slice(0, 10)}...{poolCreationState.txHash.slice(-8)}
                      </code>
                    </div>
                  </div>
                )}
              </ClientOnly>

              {/* Mostrar éxito */}
              <ClientOnly fallback={null}>
                {poolCreationState.isSuccess && poolCreationState.pairAddress && (
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        Pool creado exitosamente
                      </span>
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-300 mb-2">
                      Tu pool de liquidez ha sido creado y está disponible para trading.
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-green-700 dark:text-green-300">
                        Dirección del pool:
                      </span>
                      <code className="text-xs bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded">
                        {poolCreationState.pairAddress.slice(0, 10)}...{poolCreationState.pairAddress.slice(-8)}
                      </code>
                    </div>
                  </div>
                )}
              </ClientOnly>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CrearPoolPage;
