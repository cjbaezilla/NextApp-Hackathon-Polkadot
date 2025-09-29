import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowUpDown, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  ExternalLink,
  Settings,
  Info,
  Loader2,
  X,
  Copy,
  Plus
} from 'lucide-react';
import ClientOnly from '@/components/ClientOnly';
import { useSwap, TokenBalance } from '@/hooks/useSwap';
import { formatAmount } from '@/lib/uniswap-utils';
import { UNISWAP_V2_ADDRESSES } from '@/lib/constants';
import { NumericFormat } from 'react-number-format';

const SwapPage: NextPage = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [slippageTolerance, setSlippageTolerance] = useState(5);
  const [deadline, setDeadline] = useState(20);
  
  const [tokenInAddress, setTokenInAddress] = useState('');
  const [tokenOutAddress, setTokenOutAddress] = useState('');
  const [amountIn, setAmountIn] = useState<string>('');
  
  const [tokenInInfo, setTokenInInfo] = useState<TokenBalance | null>(null);
  const [tokenOutInfo, setTokenOutInfo] = useState<TokenBalance | null>(null);
  const [isLoadingTokenInfo, setIsLoadingTokenInfo] = useState(false);
  
  const [optimisticAmountOut, setOptimisticAmountOut] = useState<string>('');
  const [isOptimisticCalculating, setIsOptimisticCalculating] = useState(false);
  const [poolExists, setPoolExists] = useState<boolean>(true);
  const [isCheckingPool, setIsCheckingPool] = useState<boolean>(false);

  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const {
    swapState,
    tokenBalances,
    updateSwapState,
    resetSwapState,
    calculateAmountOut,
    executeSwap,
    loadTokenBalances,
    wrapETH,
    unwrapWETH,
    checkPoolExists,
    isPending,
    writeError,
    isConnected,
    address
  } = useSwap();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (router.isReady) {
      const { tokenIn, tokenOut } = router.query;
      
      if (tokenIn && typeof tokenIn === 'string') {
        setTokenInAddress(tokenIn);
      }
      
      if (tokenOut && typeof tokenOut === 'string') {
        setTokenOutAddress(tokenOut);
      }
    }
  }, [router.isReady, router.query]);

  useEffect(() => {
    const loadTokenInfo = async () => {
      if (!tokenInAddress || !isConnected) {
        setTokenInInfo(null);
        return;
      }
      
      if (!tokenInAddress.startsWith('0x') || tokenInAddress.length !== 42) {
        setTokenInInfo(null);
        return;
      }
      
      setIsLoadingTokenInfo(true);
      try {
        const existingToken = tokenBalances.find(t => t.address === tokenInAddress);
        if (existingToken) {
          setTokenInInfo(existingToken);
        } else {
          await loadTokenBalances([tokenInAddress as `0x${string}`]);
        }
      } catch (error) {
        setTokenInInfo(null);
      } finally {
        setIsLoadingTokenInfo(false);
      }
    };

    loadTokenInfo();
  }, [tokenInAddress, isConnected, tokenBalances, loadTokenBalances]);

  useEffect(() => {
    const loadTokenInfo = async () => {
      if (!tokenOutAddress || !isConnected) {
        setTokenOutInfo(null);
        return;
      }
      
      if (!tokenOutAddress.startsWith('0x') || tokenOutAddress.length !== 42) {
        setTokenOutInfo(null);
        return;
      }
      
      setIsLoadingTokenInfo(true);
      try {
        const existingToken = tokenBalances.find(t => t.address === tokenOutAddress);
        if (existingToken) {
          setTokenOutInfo(existingToken);
        } else {
          await loadTokenBalances([tokenOutAddress as `0x${string}`]);
        }
      } catch (error) {
        setTokenOutInfo(null);
      } finally {
        setIsLoadingTokenInfo(false);
      }
    };

    loadTokenInfo();
  }, [tokenOutAddress, isConnected, tokenBalances, loadTokenBalances]);

  useEffect(() => {
    const isErrorCleared = tokenInAddress && tokenOutAddress && 
      tokenInAddress.toLowerCase() !== tokenOutAddress.toLowerCase();
    
    updateSwapState({ 
      tokenIn: tokenInAddress as `0x${string}` || null,
      tokenOut: tokenOutAddress as `0x${string}` || null,
      amountIn: amountIn,
      ...(isErrorCleared && { error: null })
    });
  }, [tokenInAddress, tokenOutAddress, amountIn, updateSwapState]);

  useEffect(() => {
    if (tokenInAddress && tokenBalances.length > 0) {
      const existingToken = tokenBalances.find(t => t.address === tokenInAddress);
      if (existingToken) {
        setTokenInInfo(existingToken);
      }
    }
  }, [tokenBalances, tokenInAddress]);

  useEffect(() => {
    if (tokenOutAddress && tokenBalances.length > 0) {
      const existingToken = tokenBalances.find(t => t.address === tokenOutAddress);
      if (existingToken) {
        setTokenOutInfo(existingToken);
      }
    }
  }, [tokenBalances, tokenOutAddress]);

  // Verificar si existe un pool para el par de tokens
  useEffect(() => {
    const checkPoolExistence = async () => {
      if (!isConnected || !tokenInAddress || !tokenOutAddress) {
        setPoolExists(true);
        return;
      }

      // No verificar si son el mismo token
      if (tokenInAddress.toLowerCase() === tokenOutAddress.toLowerCase()) {
        setPoolExists(true);
        return;
      }

      // No verificar para operaciones de wrap/unwrap
      if ((tokenInAddress.toLowerCase() === UNISWAP_V2_ADDRESSES.WETH.toLowerCase() && 
           tokenOutAddress === '0x0000000000000000000000000000000000000000') ||
          (tokenInAddress === '0x0000000000000000000000000000000000000000' &&
           tokenOutAddress.toLowerCase() === UNISWAP_V2_ADDRESSES.WETH.toLowerCase())) {
        setPoolExists(true);
        return;
      }

      // Determinar las direcciones reales para verificar el pool
      let actualTokenIn = tokenInAddress;
      let actualTokenOut = tokenOutAddress;

      // Si ETH es el token de entrada, usar WETH para la verificación
      if (tokenInAddress === '0x0000000000000000000000000000000000000000') {
        actualTokenIn = UNISWAP_V2_ADDRESSES.WETH;
      }

      // Si ETH es el token de salida, usar WETH para la verificación
      if (tokenOutAddress === '0x0000000000000000000000000000000000000000') {
        actualTokenOut = UNISWAP_V2_ADDRESSES.WETH;
      }

      // Validar que ambas direcciones sean válidas
      if (actualTokenIn.startsWith('0x') && actualTokenIn.length === 42 && 
          actualTokenOut.startsWith('0x') && actualTokenOut.length === 42) {
        setIsCheckingPool(true);
        try {
          const exists = await checkPoolExists(actualTokenIn as `0x${string}`, actualTokenOut as `0x${string}`);
          setPoolExists(exists);
        } catch (error) {
          console.error('Error checking pool existence:', error);
          setPoolExists(false);
        } finally {
          setIsCheckingPool(false);
        }
      } else {
        setPoolExists(true);
      }
    };

    checkPoolExistence();
  }, [tokenInAddress, tokenOutAddress, isConnected, checkPoolExists]);

  useEffect(() => {
    if (amountIn && parseFloat(amountIn) > 0) {
      setIsOptimisticCalculating(true);
      setOptimisticAmountOut('');
    } else {
      setIsOptimisticCalculating(false);
      setOptimisticAmountOut('');
    }

    const timeoutId = setTimeout(async () => {
      if (tokenInAddress && tokenOutAddress && amountIn && parseFloat(amountIn) > 0) {
        if (tokenInAddress.toLowerCase() === tokenOutAddress.toLowerCase()) {
          updateSwapState({ 
            amountOut: '0',
            error: 'Los tokens de entrada y salida deben ser diferentes'
          });
          setIsOptimisticCalculating(false);
          setOptimisticAmountOut('');
        } else if (tokenInAddress.toLowerCase() === UNISWAP_V2_ADDRESSES.WETH.toLowerCase() && 
                   tokenOutAddress === '0x0000000000000000000000000000000000000000') {
          const unwrapAmount = amountIn;
          updateSwapState({ 
            amountOut: unwrapAmount,
            error: null
          });
          setOptimisticAmountOut(unwrapAmount);
          setIsOptimisticCalculating(false);
        } else if (tokenInAddress === '0x0000000000000000000000000000000000000000' &&
                   tokenOutAddress.toLowerCase() === UNISWAP_V2_ADDRESSES.WETH.toLowerCase()) {
          const wrapAmount = amountIn;
          updateSwapState({ 
            amountOut: wrapAmount,
            error: null
          });
          setOptimisticAmountOut(wrapAmount);
          setIsOptimisticCalculating(false);
        } else {
          try {
            const result = await calculateAmountOut(tokenInAddress as `0x${string}`, tokenOutAddress as `0x${string}`, amountIn);
            if (result && result !== '0') {
              setOptimisticAmountOut(result);
              updateSwapState({ amountOut: result });
            } else {
              updateSwapState({ amountOut: '' });
            }
          } catch (error) {
            setOptimisticAmountOut('');
            updateSwapState({ amountOut: '' });
          } finally {
            setIsOptimisticCalculating(false);
          }
        }
      } else {
        updateSwapState({ amountOut: '', error: null });
        setOptimisticAmountOut('');
        setIsOptimisticCalculating(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [tokenInAddress, tokenOutAddress, amountIn, calculateAmountOut, updateSwapState]);

  const handleSwapTokens = () => {
    if (tokenInAddress && tokenOutAddress) {
      const tempAddress = tokenInAddress;
      const tempInfo = tokenInInfo;
      const tempAmountOut = optimisticAmountOut || swapState.amountOut;
      
      setTokenInAddress(tokenOutAddress);
      setTokenOutAddress(tempAddress);
      setTokenInInfo(tokenOutInfo);
      setTokenOutInfo(tempInfo);
      
      setOptimisticAmountOut(amountIn || '');
      setAmountIn(tempAmountOut);
    }
  };

  const handleMaxClick = () => {
    if (tokenInInfo) {
      setAmountIn(tokenInInfo.formattedBalance);
    }
  };

  const cleanValueForCalculation = (value: string) => {
    return value.replace(/,/g, '');
  };

  const handleAmountInChange = (values: any) => {
    setAmountIn(values.value || '');
  };

  const handleCopyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(null), 2000);
    } catch (error) {
    }
  };

  const handleExecuteSwap = async () => {
    try {
      await executeSwap();
    } catch (error) {
    }
  };

  useEffect(() => {
    if (swapState.isSuccess) {
      setTokenInAddress('');
      setTokenOutAddress('');
      setAmountIn('');
      setTokenInInfo(null);
      setTokenOutInfo(null);
      
      setOptimisticAmountOut('');
      setIsOptimisticCalculating(false);
      
      updateSwapState({
        tokenIn: null,
        tokenOut: null,
        amountIn: '',
        amountOut: '',
        isCalculating: false,
        isSwapping: false,
        isConfirming: false,
        error: null
      });
    }
  }, [swapState.isSuccess, updateSwapState]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-3 py-4">
          <div className="max-w-md mx-auto">
            <Card className="p-6">
              <CardContent className="p-0">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                  <div className="h-12 bg-muted rounded"></div>
                  <div className="h-12 bg-muted rounded"></div>
                  <div className="h-10 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>Swap de Tokens - DApp Polka</title>
        <meta
          content="Intercambia tokens usando Uniswap V2"
          name="description"
        />
        <link href="/favicon.ico" rel="icon" />
      </Head>

      <div className="container mx-auto px-3 py-4">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground mb-1">
                Swap de Tokens
              </h1>
              <p className="text-muted-foreground text-xs">
                Intercambia tokens usando Uniswap V2
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="text-xs"
              >
                <Settings className="w-3 h-3 mr-1" />
                Configuración
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          {showSettings && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-sm">Configuración de Swap</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tolerancia de Slippage (%)</label>
                  <div className="flex space-x-2">
                    {[0.5, 1, 3, 5].map((value) => (
                      <Button
                        key={value}
                        variant={slippageTolerance === value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSlippageTolerance(value)}
                        className="text-xs"
                      >
                        {value}%
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Deadline (minutos)</label>
                  <div className="flex space-x-2">
                    {[10, 20, 30, 60].map((value) => (
                      <Button
                        key={value}
                        variant={deadline === value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDeadline(value)}
                        className="text-xs"
                      >
                        {value}m
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="gap-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-center text-base">Intercambiar Tokens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-foreground">
                    Desde
                  </label>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => setTokenInAddress(UNISWAP_V2_ADDRESSES.WETH)}
                      disabled={tokenOutAddress === UNISWAP_V2_ADDRESSES.WETH}
                      className="text-xs font-medium text-blue-600 hover:text-blue-500 underline-offset-4 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      usar WETH
                    </Button>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => setTokenInAddress('0x0000000000000000000000000000000000000000')}
                      disabled={tokenOutAddress === '0x0000000000000000000000000000000000000000'}
                      className="text-xs font-medium text-green-600 hover:text-green-500 underline-offset-4 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      usar ETH
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={tokenInAddress}
                    onChange={(e) => setTokenInAddress(e.target.value)}
                    placeholder="0x... (dirección del token)"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xs"
                    disabled={!isConnected}
                  />
                  <div className="flex items-center justify-between">
                    <NumericFormat
                      value={amountIn}
                      onValueChange={handleAmountInChange}
                      placeholder="0.0"
                      thousandSeparator=","
                      decimalSeparator="."
                      allowNegative={false}
                      decimalScale={18}
                      fixedDecimalScale={false}
                      className={`flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ${
                        isOptimisticCalculating ? 'opacity-90' : 'opacity-100'
                      }`}
                      disabled={!isConnected || swapState.isCalculating}
                    />
                    {tokenInInfo && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleMaxClick}
                        className="ml-2 text-xs"
                      >
                        MAX
                      </Button>
                    )}
                  </div>
                  {isLoadingTokenInfo && tokenInAddress && (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span className="text-xs text-muted-foreground">Cargando información del token...</span>
                    </div>
                  )}
                  {tokenInInfo && (
                    <div className="p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-green-800 dark:text-green-200">
                            {tokenInInfo.name} ({tokenInInfo.symbol})
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-300">
                            Balance: {formatAmount(tokenInInfo.balance)} {tokenInInfo.symbol}
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Válido
                        </Badge>
                      </div>
                    </div>
                  )}
                  {tokenInAddress === '0x0000000000000000000000000000000000000000' && (
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                            Ethereum (ETH)
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            Se convertirá automáticamente a WETH para el swap
                          </p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          ETH → WETH
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSwapTokens}
                  disabled={!tokenInAddress || !tokenOutAddress}
                  className="rounded-full p-2"
                >
                  <ArrowUpDown className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-foreground">
                    Hacia
                  </label>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => setTokenOutAddress(UNISWAP_V2_ADDRESSES.WETH)}
                      disabled={tokenInAddress === UNISWAP_V2_ADDRESSES.WETH}
                      className="text-xs font-medium text-blue-600 hover:text-blue-500 underline-offset-4 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      usar WETH
                    </Button>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => setTokenOutAddress('0x0000000000000000000000000000000000000000')}
                      disabled={tokenInAddress === '0x0000000000000000000000000000000000000000'}
                      className="text-xs font-medium text-green-600 hover:text-green-500 underline-offset-4 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      usar ETH
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={tokenOutAddress}
                    onChange={(e) => setTokenOutAddress(e.target.value)}
                    placeholder="0x... (dirección del token)"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xs"
                    disabled={!isConnected}
                  />
                  <div className="relative">
                    <NumericFormat
                      value={optimisticAmountOut || swapState.amountOut}
                      placeholder={isOptimisticCalculating ? "Calculando..." : "0.0"}
                      thousandSeparator=","
                      decimalSeparator="."
                      allowNegative={false}
                      decimalScale={18}
                      fixedDecimalScale={false}
                      className={`w-full px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-opacity duration-200 ${
                        isOptimisticCalculating ? 'opacity-70' : 'opacity-100'
                      }`}
                      disabled={true}
                    />
                    {isOptimisticCalculating && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  {isLoadingTokenInfo && tokenOutAddress && (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span className="text-xs text-muted-foreground">Cargando información del token...</span>
                    </div>
                  )}
                  {tokenOutInfo && (
                    <div className="p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-green-800 dark:text-green-200">
                            {tokenOutInfo.name} ({tokenOutInfo.symbol})
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Válido
                        </Badge>
                      </div>
                    </div>
                  )}
                  {tokenOutAddress === '0x0000000000000000000000000000000000000000' && (
                    <div className="p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-green-800 dark:text-green-200">
                            Ethereum (ETH)
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-300">
                            Se recibirá ETH nativo en tu wallet
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          ETH
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {amountIn && (optimisticAmountOut || swapState.amountOut) && parseFloat(amountIn) > 0 && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                  {(tokenInAddress.toLowerCase() === UNISWAP_V2_ADDRESSES.WETH.toLowerCase() && 
                    tokenOutAddress === '0x0000000000000000000000000000000000000000') || 
                   (tokenInAddress === '0x0000000000000000000000000000000000000000' &&
                    tokenOutAddress.toLowerCase() === UNISWAP_V2_ADDRESSES.WETH.toLowerCase()) ? (
                    <div className="flex items-center justify-center">
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                        {tokenInAddress.toLowerCase() === UNISWAP_V2_ADDRESSES.WETH.toLowerCase() ? 
                          'Unwrap WETH → ETH' : 'Wrap ETH → WETH'}
                      </Badge>
                    </div>
                  ) : tokenInAddress === '0x0000000000000000000000000000000000000000' && 
                    tokenOutAddress !== '0x0000000000000000000000000000000000000000' ? (
                    <div className="flex items-center justify-center">
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                        ETH → WETH → {tokenOutInfo?.symbol || 'Token'}
                      </Badge>
                    </div>
                  ) : null}
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Precio</span>
                    <span className={`font-medium ${isOptimisticCalculating ? 'opacity-70' : 'opacity-100'}`}>
                      {(tokenInAddress.toLowerCase() === UNISWAP_V2_ADDRESSES.WETH.toLowerCase() && 
                        tokenOutAddress === '0x0000000000000000000000000000000000000000') || 
                       (tokenInAddress === '0x0000000000000000000000000000000000000000' &&
                        tokenOutAddress.toLowerCase() === UNISWAP_V2_ADDRESSES.WETH.toLowerCase()) ? (
                        '1:1 (Wrap/Unwrap)'
                      ) : tokenInAddress === '0x0000000000000000000000000000000000000000' && 
                        tokenOutAddress !== '0x0000000000000000000000000000000000000000' ? (
                        `1 ETH = ${formatAmount((parseFloat(optimisticAmountOut || swapState.amountOut) / parseFloat(amountIn)).toString())} ${tokenOutInfo?.symbol}`
                      ) : (
                        `1 ${tokenInAddress === '0x0000000000000000000000000000000000000000' ? 'ETH' : tokenInInfo?.symbol} = ${formatAmount((parseFloat(optimisticAmountOut || swapState.amountOut) / parseFloat(amountIn)).toString())} ${tokenOutAddress === '0x0000000000000000000000000000000000000000' ? 'ETH' : tokenOutInfo?.symbol}`
                      )}
                    </span>
                  </div>
                  
                  {!(tokenInAddress.toLowerCase() === UNISWAP_V2_ADDRESSES.WETH.toLowerCase() && 
                     tokenOutAddress === '0x0000000000000000000000000000000000000000') && 
                   !(tokenInAddress === '0x0000000000000000000000000000000000000000' &&
                     tokenOutAddress.toLowerCase() === UNISWAP_V2_ADDRESSES.WETH.toLowerCase()) && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Tolerancia de slippage</span>
                        <span className="font-medium">{slippageTolerance}%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Deadline</span>
                        <span className="font-medium">{deadline} minutos</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Indicador de verificación de pool */}
              {isCheckingPool && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-sm text-blue-600 dark:text-blue-400">
                      Verificando si existe un pool para este par de tokens...
                    </span>
                  </div>
                </div>
              )}

              {/* Mensaje cuando no existe pool */}
              {!poolExists && !isCheckingPool && tokenInAddress && tokenOutAddress && 
               tokenInAddress.toLowerCase() !== tokenOutAddress.toLowerCase() && (
                <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-orange-600 dark:text-orange-400 mb-2">
                        No existe un pool de liquidez para este par de tokens.
                      </p>
                      <p className="text-xs text-orange-700 dark:text-orange-300 mb-2">
                        Puedes crear un nuevo pool de liquidez para permitir el intercambio entre estos tokens.
                      </p>
                      <div className="mt-2">
                        <Link 
                          href={{
                            pathname: '/crear-pool',
                            query: {
                              tokenA: tokenInAddress === '0x0000000000000000000000000000000000000000' ? UNISWAP_V2_ADDRESSES.WETH : tokenInAddress,
                              tokenB: tokenOutAddress === '0x0000000000000000000000000000000000000000' ? UNISWAP_V2_ADDRESSES.WETH : tokenOutAddress
                            }
                          }}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/20 dark:hover:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Crear Pool de Liquidez
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {swapState.error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-red-600 dark:text-red-400 mb-2">{swapState.error}</p>
                      {swapState.error.includes('No existe liquidez') && (
                        <div className="mt-2">
                          <Link 
                            href={{
                              pathname: '/crear-pool',
                              query: {
                                tokenA: (tokenInAddress === '0x0000000000000000000000000000000000000000' ? UNISWAP_V2_ADDRESSES.WETH : tokenInAddress) || '',
                                tokenB: (tokenOutAddress === '0x0000000000000000000000000000000000000000' ? UNISWAP_V2_ADDRESSES.WETH : tokenOutAddress) || ''
                              }
                            }}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Crear Pool de Liquidez
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {swapState.isConfirming && swapState.txHash && (
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
                      {swapState.txHash.slice(0, 10)}...{swapState.txHash.slice(-8)}
                    </code>
                  </div>
                </div>
              )}

              {swapState.isSuccess && swapState.txHash && (
                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                          ¡Swap completado exitosamente!
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300 mb-2">
                          Tu transacción ha sido confirmada en la blockchain.
                        </p>
                        <div className="flex items-center space-x-4 flex-wrap gap-2">
                          <a
                            href={`https://sepolia.etherscan.io/tx/${swapState.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:underline flex items-center space-x-1 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Ver transacción en Etherscan</span>
                          </a>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-green-600 dark:text-green-400">
                              Hash: {swapState.txHash.slice(0, 10)}...{swapState.txHash.slice(-8)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => swapState.txHash && handleCopyHash(swapState.txHash)}
                              className="h-5 w-5 p-0 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/20"
                              title={copiedHash === swapState.txHash ? "¡Copiado!" : "Copiar hash"}
                            >
                              {copiedHash === swapState.txHash ? (
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
                      onClick={() => {
                        updateSwapState({ isSuccess: false });
                      }}
                      className="h-6 w-6 p-0 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              <ClientOnly fallback={
                <Button
                  disabled={true}
                  className="w-full"
                >
                  Conecta tu wallet
                </Button>
              }>
                {!poolExists && !isCheckingPool && tokenInAddress && tokenOutAddress && 
                 tokenInAddress.toLowerCase() !== tokenOutAddress.toLowerCase() ? (
                  <Link 
                    href={{
                      pathname: '/crear-pool',
                      query: {
                        tokenA: tokenInAddress === '0x0000000000000000000000000000000000000000' ? UNISWAP_V2_ADDRESSES.WETH : tokenInAddress,
                        tokenB: tokenOutAddress === '0x0000000000000000000000000000000000000000' ? UNISWAP_V2_ADDRESSES.WETH : tokenOutAddress
                      }
                    }}
                    className="w-full"
                  >
                    <Button
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Pool de Liquidez
                    </Button>
                  </Link>
                ) : (
                  <Button
                    onClick={handleExecuteSwap}
                    disabled={
                      !isConnected ||
                      !tokenInAddress ||
                      !tokenOutAddress ||
                      !amountIn ||
                      !(optimisticAmountOut || swapState.amountOut) ||
                      parseFloat(amountIn) <= 0 ||
                      swapState.isSwapping ||
                      swapState.isConfirming ||
                      isPending ||
                      isOptimisticCalculating ||
                      tokenInAddress.toLowerCase() === tokenOutAddress.toLowerCase() ||
                      isCheckingPool
                    }
                    className="w-full"
                  >
                    {!isConnected ? (
                      'Conecta tu wallet'
                    ) : swapState.isSwapping || isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Enviando transacción...
                      </>
                    ) : swapState.isConfirming ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Confirmando...
                      </>
                    ) : isOptimisticCalculating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Calculando...
                      </>
                    ) : isCheckingPool ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verificando pool...
                      </>
                    ) : !tokenInAddress || !tokenOutAddress ? (
                      'Ingresa direcciones de tokens'
                    ) : tokenInAddress.toLowerCase() === tokenOutAddress.toLowerCase() ? (
                      'Los tokens deben ser diferentes'
                    ) : (tokenInAddress.toLowerCase() === UNISWAP_V2_ADDRESSES.WETH.toLowerCase() && 
                         tokenOutAddress === '0x0000000000000000000000000000000000000000') ? (
                      'Unwrap WETH'
                    ) : (tokenInAddress === '0x0000000000000000000000000000000000000000' &&
                         tokenOutAddress.toLowerCase() === UNISWAP_V2_ADDRESSES.WETH.toLowerCase()) ? (
                      'Wrap ETH'
                    ) : tokenInAddress === '0x0000000000000000000000000000000000000000' && 
                         tokenOutAddress !== '0x0000000000000000000000000000000000000000' ? (
                      'Swap ETH → Token'
                    ) : !amountIn || parseFloat(amountIn) <= 0 ? (
                      'Ingresa cantidad'
                    ) : (
                      'Intercambiar'
                    )}
                  </Button>
                )}
              </ClientOnly>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span>¿Qué es WETH y por qué es importante?</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm text-foreground mb-2">¿Qué es WETH?</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    WETH (Wrapped Ethereum) es una versión &quot;envuelta&quot; de ETH que cumple con el estándar ERC-20. 
                    Es esencialmente ETH convertido a un token que puede ser intercambiado, transferido y utilizado 
                    en contratos inteligentes como cualquier otro token ERC-20.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-foreground mb-2">¿Por qué necesitamos WETH?</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Ethereum nativo (ETH) no cumple con el estándar ERC-20, lo que significa que no puede ser 
                    intercambiado directamente en DEXs como Uniswap. WETH actúa como un &quot;puente&quot; que permite 
                    usar ETH en aplicaciones DeFi que requieren tokens ERC-20.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-foreground mb-2">¿Cómo funciona?</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span><strong>Wrapping:</strong> Envuelves ETH para obtener WETH (1:1)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span><strong>Unwrapping:</strong> Conviertes WETH de vuelta a ETH (1:1)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span><strong>Intercambio:</strong> Usas WETH para hacer swaps en Uniswap</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-foreground mb-2">Ventajas de usar WETH</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li className="flex items-start space-x-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Compatible con todos los DEXs y protocolos DeFi</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Conversión 1:1 con ETH (sin pérdidas)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Mayor liquidez en pools de Uniswap</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Facilita el trading de tokens ERC-20</span>
                    </li>
                  </ul>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    <strong>💡 Consejo:</strong> Cuando hagas swaps con ETH, el sistema automáticamente 
                    maneja la conversión entre ETH y WETH según sea necesario. No necesitas hacer 
                    conversiones manuales.
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

export default SwapPage;
