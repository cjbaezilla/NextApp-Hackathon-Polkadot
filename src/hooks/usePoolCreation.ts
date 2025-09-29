import { useState, useCallback, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseEther, formatEther, parseUnits, formatUnits, isAddress } from 'viem';
import { UNISWAP_V2_ADDRESSES } from '@/lib/constants';
import { formatAmount, toWei, fromWei, getDeadline, calculateMinAmountOut } from '@/lib/uniswap-utils';

// Importar ABI oficiales desde las librerías de Uniswap
import UNISWAP_V2_FACTORY_ABI from '@uniswap/v2-core/build/IUniswapV2Factory.json';
import UNISWAP_V2_ROUTER_ABI from '@uniswap/v2-periphery/build/IUniswapV2Router02.json';
import ERC20_ABI from '@uniswap/v2-core/build/IERC20.json';

export interface PoolCreationState {
  isCreating: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error: string | null;
  txHash: string | null;
  pairAddress: string | null;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: bigint;
  allowance: bigint;
}

export const usePoolCreation = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContract, isPending, error, data: writeData, reset: resetWriteContract } = useWriteContract();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Estado para creación de pools
  const [poolCreationState, setPoolCreationState] = useState<PoolCreationState>({
    isCreating: false,
    isConfirming: false,
    isSuccess: false,
    error: null,
    txHash: null,
    pairAddress: null
  });

  // Esperar confirmación de la transacción
  const { isLoading: isConfirming, isSuccess: isTransactionSuccess, error: receiptError } = useWaitForTransactionReceipt({
    hash: writeData as `0x${string}`,
  });

  // Efecto para manejar estados de creación
  useEffect(() => {
    if (isPending) {
      setPoolCreationState({
        isCreating: true,
        isConfirming: false,
        isSuccess: false,
        error: null,
        txHash: writeData || null,
        pairAddress: null
      });
    } else if (isConfirming) {
      setPoolCreationState(prev => ({
        ...prev,
        isCreating: false,
        isConfirming: true
      }));
    } else if (isTransactionSuccess) {
      setPoolCreationState(prev => ({
        ...prev,
        isConfirming: false,
        isSuccess: true
      }));
    }
  }, [isPending, isConfirming, isTransactionSuccess, writeData]);

  // Efecto para manejar errores de escritura y confirmación
  useEffect(() => {
    if (error) {
      setPoolCreationState(prev => ({
        ...prev,
        error: error.message || 'Error al enviar la transacción',
        isCreating: false,
        isConfirming: false
      }));
    }
  }, [error]);

  useEffect(() => {
    if (receiptError) {
      setPoolCreationState(prev => ({
        ...prev,
        error: receiptError.message || 'Error al confirmar la transacción',
        isConfirming: false
      }));
    }
  }, [receiptError]);

  // Efecto para obtener la dirección del pool cuando la transacción sea exitosa
  useEffect(() => {
    const getPoolAddress = async () => {
      if (isTransactionSuccess && publicClient && poolCreationState.txHash) {
        try {
          // Obtener la dirección del pool creado
          // Nota: Necesitamos los tokens que se usaron para crear el pool
          // Por ahora, solo marcamos como exitoso sin la dirección específica
          setPoolCreationState(prev => ({
            ...prev,
            isSuccess: true,
            pairAddress: 'Pool creado exitosamente' // Placeholder hasta obtener la dirección real
          }));
        } catch (error) {
          console.error('Error getting pool address:', error);
        }
      }
    };

    getPoolAddress();
  }, [isTransactionSuccess, publicClient, poolCreationState.txHash]);

  // Obtener información de un token
  const getTokenInfo = useCallback(async (tokenAddress: string): Promise<TokenInfo | null> => {
    if (!publicClient || !address) return null;

    // Validar que la dirección sea válida
    if (!tokenAddress || !isAddress(tokenAddress)) {
      console.error('Invalid token address:', tokenAddress);
      return null;
    }

    try {
      const [symbol, name, decimals, balance, allowance] = await Promise.all([
        publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI.abi,
          functionName: 'symbol',
          args: []
        }) as Promise<string>,
        publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI.abi,
          functionName: 'name',
          args: []
        }) as Promise<string>,
        publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI.abi,
          functionName: 'decimals',
          args: []
        }) as Promise<number>,
        publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI.abi,
          functionName: 'balanceOf',
          args: [address]
        }) as Promise<bigint>,
        publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI.abi,
          functionName: 'allowance',
          args: [address, UNISWAP_V2_ADDRESSES.ROUTER]
        }) as Promise<bigint>
      ]);

      return {
        address: tokenAddress,
        symbol,
        name,
        decimals,
        balance,
        allowance
      };
    } catch (error) {
      console.error('Error getting token info:', error);
      return null;
    }
  }, [publicClient, address]);

  // Verificar si ya existe un pool para dos tokens
  const checkPoolExists = useCallback(async (tokenA: string, tokenB: string): Promise<boolean> => {
    if (!publicClient) return false;

    // Validar que las direcciones sean válidas
    if (!tokenA || !tokenB || !isAddress(tokenA) || !isAddress(tokenB)) {
      console.error('Invalid token addresses:', { tokenA, tokenB });
      return false;
    }

    try {
      const pairAddress = await publicClient.readContract({
        address: UNISWAP_V2_ADDRESSES.FACTORY as `0x${string}`,
        abi: UNISWAP_V2_FACTORY_ABI.abi,
        functionName: 'getPair',
        args: [tokenA as `0x${string}`, tokenB as `0x${string}`]
      }) as `0x${string}`;

      return pairAddress !== '0x0000000000000000000000000000000000000000';
    } catch (error) {
      console.error('Error checking pool existence:', error);
      return false;
    }
  }, [publicClient]);

  // Crear un nuevo pool
  const createPool = useCallback(async (
    tokenA: string,
    tokenB: string,
    amountA: string,
    amountB: string
  ) => {
    // Limpiar errores previos y resetear estado de escritura
    resetWriteContract();
    setPoolCreationState(prev => ({
      ...prev,
      error: null
    }));

    if (!isConnected || !address) {
      const errorMsg = 'Debes conectar tu wallet';
      setPoolCreationState(prev => ({ ...prev, error: errorMsg }));
      throw new Error(errorMsg);
    }

    // Validar direcciones de tokens
    if (!tokenA || !tokenB || !isAddress(tokenA) || !isAddress(tokenB)) {
      const errorMsg = 'Direcciones de tokens inválidas';
      setPoolCreationState(prev => ({ ...prev, error: errorMsg }));
      throw new Error(errorMsg);
    }

    try {
      // Verificar si el pool ya existe
      const poolExists = await checkPoolExists(tokenA, tokenB);
      if (poolExists) {
        const errorMsg = 'Ya existe un pool para estos tokens';
        setPoolCreationState(prev => ({ ...prev, error: errorMsg }));
        throw new Error(errorMsg);
      }

      // Obtener información de los tokens
      const [tokenAInfo, tokenBInfo] = await Promise.all([
        getTokenInfo(tokenA),
        getTokenInfo(tokenB)
      ]);

      if (!tokenAInfo || !tokenBInfo) {
        const errorMsg = 'No se pudo obtener información de los tokens';
        setPoolCreationState(prev => ({ ...prev, error: errorMsg }));
        throw new Error(errorMsg);
      }

      // Verificar balances
      const amountAWei = parseUnits(amountA, tokenAInfo.decimals);
      const amountBWei = parseUnits(amountB, tokenBInfo.decimals);

      if (tokenAInfo.balance < amountAWei) {
        const errorMsg = `Balance insuficiente de ${tokenAInfo.symbol}`;
        setPoolCreationState(prev => ({ ...prev, error: errorMsg }));
        throw new Error(errorMsg);
      }

      if (tokenBInfo.balance < amountBWei) {
        const errorMsg = `Balance insuficiente de ${tokenBInfo.symbol}`;
        setPoolCreationState(prev => ({ ...prev, error: errorMsg }));
        throw new Error(errorMsg);
      }

      // Aprobar tokens si es necesario
      if (tokenAInfo.allowance < amountAWei) {
        await writeContract({
          address: tokenA as `0x${string}`,
          abi: ERC20_ABI.abi,
          functionName: 'approve',
          args: [UNISWAP_V2_ADDRESSES.ROUTER as `0x${string}`, amountAWei]
        });
      }

      if (tokenBInfo.allowance < amountBWei) {
        await writeContract({
          address: tokenB as `0x${string}`,
          abi: ERC20_ABI.abi,
          functionName: 'approve',
          args: [UNISWAP_V2_ADDRESSES.ROUTER as `0x${string}`, amountBWei]
        });
      }

      // Calcular cantidades mínimas con tolerancia de slippage
      const amountAMin = calculateMinAmountOut(amountAWei, 5);
      const amountBMin = calculateMinAmountOut(amountBWei, 5);
      const deadline = getDeadline(20);

      // Crear el pool y agregar liquidez
      await writeContract({
        address: UNISWAP_V2_ADDRESSES.ROUTER as `0x${string}`,
        abi: UNISWAP_V2_ROUTER_ABI.abi,
        functionName: 'addLiquidity',
        args: [
          tokenA as `0x${string}`,
          tokenB as `0x${string}`,
          amountAWei,
          amountBWei,
          amountAMin,
          amountBMin,
          address,
          deadline
        ]
      });

    } catch (error: any) {
      console.error('Error creating pool:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido al crear el pool';
      setPoolCreationState(prev => ({
        ...prev,
        error: errorMsg,
        isCreating: false,
        isConfirming: false
      }));
      throw error;
    }
  }, [isConnected, address, checkPoolExists, getTokenInfo, writeContract, resetWriteContract]);

  // Crear pool con ETH (usando WETH)
  const createPoolWithETH = useCallback(async (
    token: string,
    tokenAmount: string,
    ethAmount: string
  ) => {
    // Limpiar errores previos y resetear estado de escritura
    resetWriteContract();
    setPoolCreationState(prev => ({
      ...prev,
      error: null
    }));

    if (!isConnected || !address) {
      const errorMsg = 'Debes conectar tu wallet';
      setPoolCreationState(prev => ({ ...prev, error: errorMsg }));
      throw new Error(errorMsg);
    }

    // Validar dirección del token
    if (!token || !isAddress(token)) {
      const errorMsg = 'Dirección de token inválida';
      setPoolCreationState(prev => ({ ...prev, error: errorMsg }));
      throw new Error(errorMsg);
    }

    try {
      // Verificar si el pool ya existe
      const poolExists = await checkPoolExists(token, UNISWAP_V2_ADDRESSES.WETH);
      if (poolExists) {
        const errorMsg = 'Ya existe un pool para este token y WETH';
        setPoolCreationState(prev => ({ ...prev, error: errorMsg }));
        throw new Error(errorMsg);
      }

      // Obtener información del token
      const tokenInfo = await getTokenInfo(token);
      if (!tokenInfo) {
        const errorMsg = 'No se pudo obtener información del token';
        setPoolCreationState(prev => ({ ...prev, error: errorMsg }));
        throw new Error(errorMsg);
      }

      // Verificar balance del token
      const tokenAmountWei = parseUnits(tokenAmount, tokenInfo.decimals);
      if (tokenInfo.balance < tokenAmountWei) {
        const errorMsg = `Balance insuficiente de ${tokenInfo.symbol}`;
        setPoolCreationState(prev => ({ ...prev, error: errorMsg }));
        throw new Error(errorMsg);
      }

      // Aprobar token si es necesario
      if (tokenInfo.allowance < tokenAmountWei) {
        await writeContract({
          address: token as `0x${string}`,
          abi: ERC20_ABI.abi,
          functionName: 'approve',
          args: [UNISWAP_V2_ADDRESSES.ROUTER as `0x${string}`, tokenAmountWei]
        });
      }

      // Calcular cantidades mínimas con tolerancia de slippage
      const amountTokenMin = calculateMinAmountOut(tokenAmountWei, 5);
      const amountETHMin = calculateMinAmountOut(toWei(ethAmount), 5);
      const deadline = getDeadline(20);

      // Crear el pool y agregar liquidez con ETH
      await writeContract({
        address: UNISWAP_V2_ADDRESSES.ROUTER as `0x${string}`,
        abi: UNISWAP_V2_ROUTER_ABI.abi,
        functionName: 'addLiquidityETH',
        args: [
          token as `0x${string}`,
          tokenAmountWei,
          amountTokenMin,
          amountETHMin,
          address,
          deadline
        ],
        value: toWei(ethAmount)
      });

    } catch (error: any) {
      console.error('Error creating pool with ETH:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido al crear el pool';
      setPoolCreationState(prev => ({
        ...prev,
        error: errorMsg,
        isCreating: false,
        isConfirming: false
      }));
      throw error;
    }
  }, [isConnected, address, checkPoolExists, getTokenInfo, writeContract, resetWriteContract]);

  // Resetear estado de creación
  const resetCreationState = useCallback(() => {
    resetWriteContract();
    setPoolCreationState({
      isCreating: false,
      isConfirming: false,
      isSuccess: false,
      error: null,
      txHash: null,
      pairAddress: null
    });
  }, [resetWriteContract]);

  // Formatear ETH
  const formatETH = useCallback((value: bigint) => {
    return formatAmount(value);
  }, []);

  return {
    poolCreationState,
    createPool,
    createPoolWithETH,
    getTokenInfo,
    checkPoolExists,
    resetCreationState,
    formatETH,
    // Durante la hidratación, usar valores por defecto para evitar diferencias
    isConnected: mounted ? isConnected : false,
    address: mounted ? address : undefined,
    isPending,
    error
  };
};
