import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useBalance } from 'wagmi';
import { parseEther, formatEther, parseUnits, formatUnits } from 'viem';
import { UNISWAP_V2_ADDRESSES, SLIPPAGE_TOLERANCE, DEADLINE_BUFFER } from '@/lib/constants';
import { formatAmount } from '@/lib/uniswap-utils';

// Función de utilidad para validar direcciones de tokens
const isValidTokenAddress = (address: string): boolean => {
  return Boolean(address && 
         address.startsWith('0x') && 
         address.length === 42 && 
         address !== '0x0000000000000000000000000000000000000000');
};

// Importar ABI oficiales desde las librerías de Uniswap
import UNISWAP_V2_ROUTER_ABI from '@uniswap/v2-periphery/build/UniswapV2Router02.json';
import UNISWAP_V2_FACTORY_ABI from '@uniswap/v2-core/build/UniswapV2Factory.json';
import UNISWAP_V2_PAIR_ABI from '@uniswap/v2-core/build/UniswapV2Pair.json';
import ERC20_ABI from '@uniswap/v2-core/build/IERC20.json';

// Usar direcciones desde constants.ts
const UNISWAP_V2_ROUTER_ADDRESS = UNISWAP_V2_ADDRESSES.ROUTER as `0x${string}`;
const UNISWAP_V2_FACTORY_ADDRESS = UNISWAP_V2_ADDRESSES.FACTORY as `0x${string}`;

export interface LiquidityState {
  poolAddress: `0x${string}` | null;
  tokenA: `0x${string}` | null;
  tokenB: `0x${string}` | null;
  amountA: string;
  amountB: string;
  lpTokenAmount: string;
  isCalculating: boolean;
  isAdding: boolean;
  isRemoving: boolean;
  isApproving: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  successOperation: 'add' | 'remove' | null;
  error: string | null;
  txHash: string | null;
  approvalTxHash: string | null;
}

export interface PoolInfo {
  address: `0x${string}`;
  token0: `0x${string}`;
  token1: `0x${string}`;
  reserve0: bigint;
  reserve1: bigint;
  totalSupply: bigint;
  token0Info: TokenInfo;
  token1Info: TokenInfo;
}

export interface TokenInfo {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  balance: bigint;
  formattedBalance: string;
  isWETH?: boolean;
  ethBalance?: bigint;
  totalAvailableBalance?: bigint;
  formattedTotalBalance?: string;
}

export const useLiquidity = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContract, isPending, error: writeError, data: writeData, reset: resetWriteContract } = useWriteContract();
  
  // Hook para obtener balance de ETH nativo
  const { data: ethBalance } = useBalance({
    address: address,
  });
  
  const [liquidityState, setLiquidityState] = useState<LiquidityState>({
    poolAddress: null,
    tokenA: null,
    tokenB: null,
    amountA: '',
    amountB: '',
    lpTokenAmount: '',
    isCalculating: false,
    isAdding: false,
    isRemoving: false,
    isApproving: false,
    isConfirming: false,
    isSuccess: false,
    successOperation: null,
    error: null,
    txHash: null,
    approvalTxHash: null,
  });

  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);
  const [tokenBalances, setTokenBalances] = useState<TokenInfo[]>([]);
  const [lpTokenBalance, setLpTokenBalance] = useState<bigint>(0n);

  // Hook para esperar confirmación de transacción principal
  const { data: receipt, error: receiptError, isLoading: isConfirmingTx } = useWaitForTransactionReceipt({
    hash: liquidityState.txHash as `0x${string}` | undefined,
    query: {
      enabled: !!liquidityState.txHash,
    },
  });

  // Hook para esperar confirmación de transacción de aprobación
  const { data: approvalReceipt, error: approvalReceiptError } = useWaitForTransactionReceipt({
    hash: liquidityState.approvalTxHash as `0x${string}` | undefined,
    query: {
      enabled: !!liquidityState.approvalTxHash,
    },
  });

  // Función para obtener información de un token
  const getTokenInfo = useCallback(async (tokenAddress: `0x${string}`): Promise<TokenInfo> => {
    if (!publicClient || !address) {
      throw new Error('Cliente no disponible');
    }

    try {
      const [symbol, name, decimals, balance] = await Promise.all([
        publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI.abi,
          functionName: 'symbol',
        }) as Promise<string>,
        publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI.abi,
          functionName: 'name',
        }) as Promise<string>,
        publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI.abi,
          functionName: 'decimals',
        }) as Promise<number>,
        publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI.abi,
          functionName: 'balanceOf',
          args: [address],
        }) as Promise<bigint>,
      ]);

      // Verificar si es WETH
      const isWETH = tokenAddress.toLowerCase() === UNISWAP_V2_ADDRESSES.WETH.toLowerCase();
      const ethBalanceValue = ethBalance?.value || 0n;
      
      // Si es WETH, calcular el balance total disponible (WETH + ETH)
      let totalAvailableBalance = balance;
      let formattedTotalBalance = formatUnits(balance, decimals);
      
      if (isWETH && ethBalanceValue > 0n) {
        // Sumar ETH nativo al balance de WETH
        totalAvailableBalance = balance + ethBalanceValue;
        formattedTotalBalance = formatUnits(totalAvailableBalance, decimals);
      }

      return {
        address: tokenAddress,
        symbol,
        name,
        decimals,
        balance,
        formattedBalance: formatUnits(balance, decimals),
        isWETH,
        ethBalance: ethBalanceValue,
        totalAvailableBalance,
        formattedTotalBalance,
      };
    } catch (error) {
      throw new Error('Error al obtener información del token');
    }
  }, [publicClient, address, ethBalance?.value]);

  // Función para obtener información del pool
  const getPoolInfo = useCallback(async (poolAddress: `0x${string}`): Promise<PoolInfo> => {
    if (!publicClient) {
      throw new Error('Cliente no disponible');
    }

    try {
      const [token0, token1, reserves, totalSupply] = await Promise.all([
        publicClient.readContract({
          address: poolAddress,
          abi: UNISWAP_V2_PAIR_ABI.abi,
          functionName: 'token0',
        }) as Promise<`0x${string}`>,
        publicClient.readContract({
          address: poolAddress,
          abi: UNISWAP_V2_PAIR_ABI.abi,
          functionName: 'token1',
        }) as Promise<`0x${string}`>,
        publicClient.readContract({
          address: poolAddress,
          abi: UNISWAP_V2_PAIR_ABI.abi,
          functionName: 'getReserves',
        }) as Promise<[bigint, bigint, number]>,
        publicClient.readContract({
          address: poolAddress,
          abi: UNISWAP_V2_PAIR_ABI.abi,
          functionName: 'totalSupply',
        }) as Promise<bigint>,
      ]);

      const [token0Info, token1Info] = await Promise.all([
        getTokenInfo(token0),
        getTokenInfo(token1),
      ]);

      return {
        address: poolAddress,
        token0,
        token1,
        reserve0: reserves[0],
        reserve1: reserves[1],
        totalSupply,
        token0Info,
        token1Info,
      };
    } catch (error) {
      throw new Error('Error al obtener información del pool');
    }
  }, [publicClient, getTokenInfo]);

  // Función para obtener dirección del pool
  const getPoolAddress = useCallback(async (tokenA: string, tokenB: string): Promise<`0x${string}` | null> => {
    if (!publicClient || !isValidTokenAddress(tokenA) || !isValidTokenAddress(tokenB)) {
      return null;
    }

    try {
      const pairAddress = await publicClient.readContract({
        address: UNISWAP_V2_FACTORY_ADDRESS,
        abi: UNISWAP_V2_FACTORY_ABI.abi,
        functionName: 'getPair',
        args: [tokenA as `0x${string}`, tokenB as `0x${string}`],
      }) as `0x${string}`;

      // Verificar que el pool existe (no es la dirección cero)
      if (pairAddress === '0x0000000000000000000000000000000000000000') {
        return null;
      }

      return pairAddress;
    } catch (error) {
      return null;
    }
  }, [publicClient]);

  // Función para cargar balance de tokens LP
  const loadLPTokenBalance = useCallback(async (poolAddress: `0x${string}`) => {
    if (!publicClient || !address) {
      setLpTokenBalance(0n);
      return;
    }

    try {
      const balance = await publicClient.readContract({
        address: poolAddress,
        abi: ERC20_ABI.abi,
        functionName: 'balanceOf',
        args: [address],
      }) as bigint;

      setLpTokenBalance(balance);
    } catch (error) {
      setLpTokenBalance(0n);
    }
  }, [publicClient, address]);

  // Función para refrescar toda la información del pool
  const refreshPoolInfo = useCallback(async (poolAddress: `0x${string}`) => {
    if (!publicClient || !address) {
      return;
    }

    try {
      // Refrescar información del pool
      const updatedPoolInfo = await getPoolInfo(poolAddress);
      setPoolInfo(updatedPoolInfo);
      
      // Refrescar balance de LP tokens
      await loadLPTokenBalance(poolAddress);
    } catch (error) {
      // Error al refrescar información del pool
    }
  }, [publicClient, address, getPoolInfo, loadLPTokenBalance]);

  // Función para calcular cantidades proporcionales al agregar liquidez
  const calculateOptimalAmounts = useCallback(async (
    tokenA: `0x${string}`,
    tokenB: `0x${string}`,
    amountA: string
  ): Promise<{ amountA: string; amountB: string } | null> => {
    if (!publicClient || !amountA || parseFloat(amountA) <= 0) {
      return null;
    }

    try {
      const poolAddress = await getPoolAddress(tokenA, tokenB);
      if (!poolAddress) {
        return null;
      }

      const pool = await getPoolInfo(poolAddress);
      const amountAWei = parseUnits(amountA, pool.token0Info.decimals);

      // Determinar qué token es A y cuál es B
      const isTokenAFirst = tokenA.toLowerCase() === pool.token0.toLowerCase();
      const reserveA = isTokenAFirst ? pool.reserve0 : pool.reserve1;
      const reserveB = isTokenAFirst ? pool.reserve1 : pool.reserve0;

      // Calcular cantidad proporcional de B
      const amountBWei = (amountAWei * reserveB) / reserveA;
      const amountBFormatted = formatUnits(amountBWei, isTokenAFirst ? pool.token1Info.decimals : pool.token0Info.decimals);

      return {
        amountA,
        amountB: amountBFormatted,
      };
    } catch (error) {
      return null;
    }
  }, [publicClient, getPoolAddress, getPoolInfo]);

  // Función para calcular cantidades al remover liquidez
  const calculateRemoveAmounts = useCallback(async (
    poolAddress: `0x${string}`,
    lpTokenAmount: string
  ): Promise<{ amountA: string; amountB: string } | null> => {
    if (!publicClient || !lpTokenAmount || parseFloat(lpTokenAmount) <= 0) {
      return null;
    }

    try {
      const pool = await getPoolInfo(poolAddress);
      const lpAmountWei = parseUnits(lpTokenAmount, 18); // LP tokens siempre tienen 18 decimales

      // Calcular proporción de tokens que se recibirán
      const token0Amount = (lpAmountWei * pool.reserve0) / pool.totalSupply;
      const token1Amount = (lpAmountWei * pool.reserve1) / pool.totalSupply;

      return {
        amountA: formatUnits(token0Amount, pool.token0Info.decimals),
        amountB: formatUnits(token1Amount, pool.token1Info.decimals),
      };
    } catch (error) {
      return null;
    }
  }, [publicClient, getPoolInfo]);

  // Función para envolver ETH a WETH
  const wrapETH = useCallback(async (amount: string) => {
    if (!address || !publicClient) {
      throw new Error('Wallet no conectada');
    }

    try {
      await writeContract({
        address: UNISWAP_V2_ADDRESSES.WETH as `0x${string}`,
        abi: [
          {
            "inputs": [],
            "name": "deposit",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
          }
        ],
        functionName: 'deposit',
        value: parseEther(amount),
      });
    } catch (error: any) {
      throw new Error(`Error al envolver ETH: ${error.message}`);
    }
  }, [address, publicClient, writeContract]);

  // Función para aprobar tokens LP
  const approveLPTokens = useCallback(async (
    poolAddress: `0x${string}`,
    amount: bigint
  ): Promise<void> => {
    if (!address || !publicClient) {
      throw new Error('Wallet no conectada');
    }

    // Configurar el estado de aprobación
    setLiquidityState(prev => ({ 
      ...prev, 
      isApproving: true,
      approvalTxHash: null,
      error: null
    }));

    try {
      writeContract({
        address: poolAddress,
        abi: ERC20_ABI.abi,
        functionName: 'approve',
        args: [UNISWAP_V2_ROUTER_ADDRESS, amount],
      });
    } catch (error: any) {
      setLiquidityState(prev => ({ 
        ...prev, 
        isApproving: false,
        error: `Error al aprobar LP tokens: ${error.message}` 
      }));
      throw error;
    }
  }, [address, publicClient, writeContract]);

  // Función para agregar liquidez
  const addLiquidity = useCallback(async (
    tokenA: `0x${string}`,
    tokenB: `0x${string}`,
    amountADesired: string,
    amountBDesired: string
  ) => {
    if (!address || !publicClient) {
      throw new Error('Wallet no conectada');
    }

    setLiquidityState(prev => ({ 
      ...prev, 
      isAdding: true, 
      error: null,
      isSuccess: false,
      successOperation: null,
      txHash: null
    }));

    try {
      // Obtener pool address
      const poolAddress = await getPoolAddress(tokenA, tokenB);
      if (!poolAddress) {
        throw new Error('Pool no encontrado');
      }

      // Obtener información del pool
      const pool = await getPoolInfo(poolAddress);
      
      // Determinar orden de tokens
      const isTokenAFirst = tokenA.toLowerCase() === pool.token0.toLowerCase();
      const amountAWei = parseUnits(amountADesired, isTokenAFirst ? pool.token0Info.decimals : pool.token1Info.decimals);
      const amountBWei = parseUnits(amountBDesired, isTokenAFirst ? pool.token1Info.decimals : pool.token0Info.decimals);

      // Verificar si necesitamos envolver ETH para WETH
      const tokenAIsWETH = tokenA.toLowerCase() === UNISWAP_V2_ADDRESSES.WETH.toLowerCase();
      const tokenBIsWETH = tokenB.toLowerCase() === UNISWAP_V2_ADDRESSES.WETH.toLowerCase();
      
      if (tokenAIsWETH) {
        const tokenAInfo = isTokenAFirst ? pool.token0Info : pool.token1Info;
        const neededAmount = amountAWei;
        const wethBalance = tokenAInfo.balance;
        const ethBalanceValue = ethBalance?.value || 0n;
        
        if (neededAmount > wethBalance && ethBalanceValue > 0n) {
          const ethNeeded = neededAmount - wethBalance;
          const ethNeededFormatted = formatUnits(ethNeeded, 18);
          
          // Envolver ETH necesario
          await wrapETH(ethNeededFormatted);
        }
      }
      
      if (tokenBIsWETH) {
        const tokenBInfo = isTokenAFirst ? pool.token1Info : pool.token0Info;
        const neededAmount = amountBWei;
        const wethBalance = tokenBInfo.balance;
        const ethBalanceValue = ethBalance?.value || 0n;
        
        if (neededAmount > wethBalance && ethBalanceValue > 0n) {
          const ethNeeded = neededAmount - wethBalance;
          const ethNeededFormatted = formatUnits(ethNeeded, 18);
          
          // Envolver ETH necesario
          await wrapETH(ethNeededFormatted);
        }
      }

      // Calcular cantidades mínimas con slippage
      const amountAMin = (amountAWei * BigInt(100 - SLIPPAGE_TOLERANCE)) / 100n;
      const amountBMin = (amountBWei * BigInt(100 - SLIPPAGE_TOLERANCE)) / 100n;

      // Obtener deadline
      const deadline = BigInt(Math.floor(Date.now() / 1000) + DEADLINE_BUFFER);

      // Verificar y aprobar tokens si es necesario
      const tokenAContract = isTokenAFirst ? pool.token0 : pool.token1;
      const tokenBContract = isTokenAFirst ? pool.token1 : pool.token0;

      // Verificar allowance para tokenA
      const allowanceA = await publicClient.readContract({
        address: tokenAContract,
        abi: ERC20_ABI.abi,
        functionName: 'allowance',
        args: [address, UNISWAP_V2_ROUTER_ADDRESS],
      }) as bigint;

      if (allowanceA < amountAWei) {
        try {
          await writeContract({
            address: tokenAContract,
            abi: ERC20_ABI.abi,
            functionName: 'approve',
            args: [UNISWAP_V2_ROUTER_ADDRESS, amountAWei],
          });
        } catch (approveError: any) {
          throw new Error(`Error al aprobar token A: ${approveError.message}`);
        }
      }

      // Verificar allowance para tokenB
      const allowanceB = await publicClient.readContract({
        address: tokenBContract,
        abi: ERC20_ABI.abi,
        functionName: 'allowance',
        args: [address, UNISWAP_V2_ROUTER_ADDRESS],
      }) as bigint;

      if (allowanceB < amountBWei) {
        try {
          await writeContract({
            address: tokenBContract,
            abi: ERC20_ABI.abi,
            functionName: 'approve',
            args: [UNISWAP_V2_ROUTER_ADDRESS, amountBWei],
          });
        } catch (approveError: any) {
          throw new Error(`Error al aprobar token B: ${approveError.message}`);
        }
      }

      // Agregar liquidez
      try {
        await writeContract({
          address: UNISWAP_V2_ROUTER_ADDRESS,
          abi: UNISWAP_V2_ROUTER_ABI.abi,
          functionName: 'addLiquidity',
          args: [
            tokenA,
            tokenB,
            amountAWei,
            amountBWei,
            amountAMin,
            amountBMin,
            address,
            deadline,
          ],
        });

        // Solo cambiar a confirmando si la transacción se envió exitosamente
        setLiquidityState(prev => ({ 
          ...prev, 
          isAdding: false,
          isConfirming: true,
          successOperation: 'add'
        }));
      } catch (addLiquidityError: any) {
        throw new Error(`Error al agregar liquidez: ${addLiquidityError.message}`);
      }

    } catch (error: any) {
      setLiquidityState(prev => ({ 
        ...prev, 
        isAdding: false, 
        isConfirming: false,
        error: error.message || 'Error al agregar liquidez' 
      }));
    }
  }, [address, publicClient, getPoolAddress, getPoolInfo, writeContract, wrapETH, ethBalance?.value]);

  // Función para remover liquidez
  const removeLiquidity = useCallback(async (
    tokenA: `0x${string}`,
    tokenB: `0x${string}`,
    lpTokenAmount: string
  ) => {
    if (!address || !publicClient) {
      throw new Error('Wallet no conectada');
    }

    setLiquidityState(prev => ({ 
      ...prev, 
      isRemoving: true, 
      error: null,
      isSuccess: false,
      successOperation: null,
      txHash: null,
      tokenA,
      tokenB,
      lpTokenAmount,
      poolAddress: null
    }));

    try {
      // Obtener pool address
      const poolAddress = await getPoolAddress(tokenA, tokenB);
      if (!poolAddress) {
        throw new Error('Pool no encontrado');
      }

      // Actualizar el estado con la dirección del pool
      setLiquidityState(prev => ({ 
        ...prev, 
        poolAddress
      }));

      // Obtener información del pool
      const pool = await getPoolInfo(poolAddress);
      const lpAmountWei = parseUnits(lpTokenAmount, 18);

      // Verificar y aprobar LP tokens si es necesario
      const allowance = await publicClient.readContract({
        address: poolAddress,
        abi: ERC20_ABI.abi,
        functionName: 'allowance',
        args: [address, UNISWAP_V2_ROUTER_ADDRESS],
      }) as bigint;

      if (allowance < lpAmountWei) {
        // Pausar el proceso de remoción mientras se aprueba
        setLiquidityState(prev => ({ 
          ...prev, 
          isRemoving: false
        }));

        try {
          // Usar la función de aprobación que maneja el callback correctamente
          await approveLPTokens(poolAddress, lpAmountWei);
          
          // La función approveLPTokens maneja el estado de aprobación
          // y el callback se encarga de continuar con la remoción
          
        } catch (approveError: any) {
          setLiquidityState(prev => ({ 
            ...prev, 
            isApproving: false,
            error: `Error al aprobar LP tokens: ${approveError.message}` 
          }));
          return;
        }
      } else {
        // No necesita aprobación, continuar directamente
        const lpAmountWei = parseUnits(lpTokenAmount, 18);

        // Calcular cantidades mínimas
        const token0Amount = (lpAmountWei * pool.reserve0) / pool.totalSupply;
        const token1Amount = (lpAmountWei * pool.reserve1) / pool.totalSupply;
        const amountAMin = (token0Amount * BigInt(100 - SLIPPAGE_TOLERANCE)) / 100n;
        const amountBMin = (token1Amount * BigInt(100 - SLIPPAGE_TOLERANCE)) / 100n;

        // Obtener deadline
        const deadline = BigInt(Math.floor(Date.now() / 1000) + DEADLINE_BUFFER);

        // Remover liquidez
        await writeContract({
          address: UNISWAP_V2_ROUTER_ADDRESS,
          abi: UNISWAP_V2_ROUTER_ABI.abi,
          functionName: 'removeLiquidity',
          args: [
            tokenA,
            tokenB,
            lpAmountWei,
            amountAMin,
            amountBMin,
            address,
            deadline,
          ],
        });

        // Solo cambiar a confirmando si la transacción se envió exitosamente
        setLiquidityState(prev => ({ 
          ...prev, 
          isRemoving: false,
          isConfirming: true,
          successOperation: 'remove'
        }));
      }

    } catch (error: any) {
      setLiquidityState(prev => ({ 
        ...prev, 
        isRemoving: false, 
        isApproving: false,
        isConfirming: false,
        error: error.message || 'Error al remover liquidez' 
      }));
    }
  }, [address, publicClient, getPoolAddress, getPoolInfo, writeContract, approveLPTokens]);

  // Función para actualizar estado
  const updateLiquidityState = useCallback((updates: Partial<LiquidityState>) => {
    setLiquidityState(prev => ({ ...prev, ...updates }));
  }, []);

  // Función para resetear estado de éxito
  const resetSuccessState = useCallback(() => {
    setLiquidityState(prev => ({ 
      ...prev, 
      isSuccess: false, 
      successOperation: null,
      txHash: null,
      error: null
    }));
  }, []);

  // Función para resetear estado
  const resetLiquidityState = useCallback(() => {
    setLiquidityState({
      poolAddress: null,
      tokenA: null,
      tokenB: null,
      amountA: '',
      amountB: '',
      lpTokenAmount: '',
      isCalculating: false,
      isAdding: false,
      isRemoving: false,
      isApproving: false,
      isConfirming: false,
      isSuccess: false,
      successOperation: null,
      error: null,
      txHash: null,
      approvalTxHash: null,
    });
    setPoolInfo(null);
    setLpTokenBalance(0n);
  }, []);

  // Efecto para capturar el hash de la transacción cuando writeData esté disponible
  useEffect(() => {
    if (writeData && liquidityState.isConfirming && !liquidityState.txHash) {
      setLiquidityState(prev => ({ 
        ...prev, 
        txHash: writeData as `0x${string}`
      }));
    }
  }, [writeData, liquidityState.isConfirming, liquidityState.txHash]);

  // Efecto para capturar el hash de la transacción de aprobación cuando writeData esté disponible
  useEffect(() => {
    if (writeData && liquidityState.isApproving && !liquidityState.approvalTxHash) {
      setLiquidityState(prev => ({ 
        ...prev, 
        approvalTxHash: writeData as `0x${string}`
      }));
    }
  }, [writeData, liquidityState.isApproving, liquidityState.approvalTxHash]);

  // Efecto para manejar confirmación de transacciones de aprobación
  useEffect(() => {
    if (approvalReceipt && liquidityState.isApproving) {
      // La aprobación se confirmó, ahora continuar con la remoción
      setLiquidityState(prev => ({ 
        ...prev, 
        isApproving: false,
        isRemoving: true,
        approvalTxHash: null
      }));

      // Continuar con la remoción de liquidez automáticamente
      const continueRemoval = async () => {
        try {
          if (!liquidityState.poolAddress || !liquidityState.tokenA || !liquidityState.tokenB || !liquidityState.lpTokenAmount) {
            throw new Error('Datos insuficientes para continuar');
          }

          const poolAddress = liquidityState.poolAddress;
          const tokenA = liquidityState.tokenA;
          const tokenB = liquidityState.tokenB;
          const lpTokenAmount = liquidityState.lpTokenAmount;

          // Obtener información del pool
          const pool = await getPoolInfo(poolAddress);
          const lpAmountWei = parseUnits(lpTokenAmount, 18);

          // Calcular cantidades mínimas
          const token0Amount = (lpAmountWei * pool.reserve0) / pool.totalSupply;
          const token1Amount = (lpAmountWei * pool.reserve1) / pool.totalSupply;
          const amountAMin = (token0Amount * BigInt(100 - SLIPPAGE_TOLERANCE)) / 100n;
          const amountBMin = (token1Amount * BigInt(100 - SLIPPAGE_TOLERANCE)) / 100n;

          // Obtener deadline
          const deadline = BigInt(Math.floor(Date.now() / 1000) + DEADLINE_BUFFER);

          // Remover liquidez
          await writeContract({
            address: UNISWAP_V2_ROUTER_ADDRESS,
            abi: UNISWAP_V2_ROUTER_ABI.abi,
            functionName: 'removeLiquidity',
            args: [
              tokenA,
              tokenB,
              lpAmountWei,
              amountAMin,
              amountBMin,
              address,
              deadline,
            ],
          });

          // Cambiar a estado de confirmación
          setLiquidityState(prev => ({ 
            ...prev, 
            isRemoving: false,
            isConfirming: true,
            successOperation: 'remove'
          }));

        } catch (error: any) {
          setLiquidityState(prev => ({ 
            ...prev, 
            isRemoving: false,
            error: `Error al remover liquidez: ${error.message}` 
          }));
        }
      };

      continueRemoval();
    }

    if (approvalReceiptError && liquidityState.isApproving) {
      setLiquidityState(prev => ({ 
        ...prev, 
        isApproving: false,
        error: approvalReceiptError.message || 'Error en la transacción de aprobación' 
      }));
    }
  }, [approvalReceipt, approvalReceiptError, liquidityState.isApproving, liquidityState.poolAddress, liquidityState.tokenA, liquidityState.tokenB, liquidityState.lpTokenAmount, getPoolInfo, writeContract, address]);

  // Efecto para manejar confirmación de transacciones principales
  useEffect(() => {
    if (receipt && liquidityState.isConfirming) {
      setLiquidityState(prev => ({ 
        ...prev, 
        isConfirming: false, 
        isSuccess: true 
      }));
      // Recargar balances
      if (liquidityState.poolAddress) {
        loadLPTokenBalance(liquidityState.poolAddress);
      }
    }

    if (receiptError && liquidityState.isConfirming) {
      setLiquidityState(prev => ({ 
        ...prev, 
        isConfirming: false, 
        error: receiptError.message || 'Error en la transacción' 
      }));
    }
  }, [receipt, receiptError, isConfirmingTx, liquidityState.txHash, liquidityState.isConfirming, liquidityState.poolAddress, loadLPTokenBalance]);

  // Efecto para cargar balance LP cuando cambie el pool
  useEffect(() => {
    if (liquidityState.poolAddress && isConnected) {
      loadLPTokenBalance(liquidityState.poolAddress);
    }
  }, [liquidityState.poolAddress, isConnected, loadLPTokenBalance]);

  // Efecto para refrescar información del pool después de operación exitosa
  useEffect(() => {
    if (liquidityState.isSuccess && liquidityState.poolAddress && publicClient && address) {
      // Refrescar información del pool después de operación exitosa
      const refreshAfterSuccess = async () => {
        try {
          const poolAddress = liquidityState.poolAddress!;
          
          // Obtener información actualizada del pool directamente
          const [token0, token1, reserves, totalSupply] = await Promise.all([
            publicClient.readContract({
              address: poolAddress,
              abi: UNISWAP_V2_PAIR_ABI.abi,
              functionName: 'token0',
            }) as Promise<`0x${string}`>,
            publicClient.readContract({
              address: poolAddress,
              abi: UNISWAP_V2_PAIR_ABI.abi,
              functionName: 'token1',
            }) as Promise<`0x${string}`>,
            publicClient.readContract({
              address: poolAddress,
              abi: UNISWAP_V2_PAIR_ABI.abi,
              functionName: 'getReserves',
            }) as Promise<[bigint, bigint, number]>,
            publicClient.readContract({
              address: poolAddress,
              abi: UNISWAP_V2_PAIR_ABI.abi,
              functionName: 'totalSupply',
            }) as Promise<bigint>,
          ]);

          // Obtener información de los tokens
          const [token0Info, token1Info] = await Promise.all([
            getTokenInfo(token0),
            getTokenInfo(token1),
          ]);

          // Actualizar la información del pool
          const updatedPoolInfo = {
            address: poolAddress,
            token0,
            token1,
            reserve0: reserves[0],
            reserve1: reserves[1],
            totalSupply,
            token0Info,
            token1Info,
          };

          setPoolInfo(updatedPoolInfo);
        } catch (error) {
          // Error al refrescar información del pool después del éxito
        }
      };
      refreshAfterSuccess();
    }
  }, [liquidityState.isSuccess, liquidityState.poolAddress, publicClient, address, getTokenInfo]);

  return {
    liquidityState,
    poolInfo,
    lpTokenBalance,
    getTokenInfo,
    getPoolInfo,
    getPoolAddress,
    loadLPTokenBalance,
    refreshPoolInfo,
    calculateOptimalAmounts,
    calculateRemoveAmounts,
    addLiquidity,
    removeLiquidity,
    wrapETH,
    updateLiquidityState,
    resetLiquidityState,
    resetSuccessState,
    isPending,
    writeError,
    isConnected,
    address,
  };
};
