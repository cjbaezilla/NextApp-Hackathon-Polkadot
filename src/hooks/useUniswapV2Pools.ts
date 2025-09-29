import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { parseEther, formatEther, parseUnits, formatUnits } from 'viem';
import { UNISWAP_V2_ADDRESSES } from '@/lib/constants';
import { formatAmount } from '@/lib/uniswap-utils';

// Importar ABI oficiales desde las librerías de Uniswap
import UNISWAP_V2_FACTORY_ABI from '@uniswap/v2-core/build/IUniswapV2Factory.json';
import UNISWAP_V2_PAIR_ABI from '@uniswap/v2-core/build/IUniswapV2Pair.json';
import ERC20_ABI from '@uniswap/v2-core/build/IERC20.json';

// Usar direcciones desde constants.ts
const UNISWAP_V2_FACTORY_ADDRESS = UNISWAP_V2_ADDRESSES.FACTORY as `0x${string}`;
const UNISWAP_V2_ROUTER_ADDRESS = UNISWAP_V2_ADDRESSES.ROUTER as `0x${string}`;

export interface PoolInfo {
  address: string;
  token0: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  token1: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  reserves: {
    reserve0: bigint;
    reserve1: bigint;
  };
  totalSupply: bigint;
  liquidity: string;
  apy: string;
}

export interface PoolCreationState {
  isCreating: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error: string | null;
  txHash: string | null;
}

export const useUniswapV2Pools = () => {
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Obtener direcciones de contratos desde variables de entorno
  const factoryAddress = UNISWAP_V2_FACTORY_ADDRESS;
  const routerAddress = UNISWAP_V2_ROUTER_ADDRESS;

  // Estado para creación de pools
  const [poolCreationState, setPoolCreationState] = useState<PoolCreationState>({
    isCreating: false,
    isConfirming: false,
    isSuccess: false,
    error: null,
    txHash: null
  });

  // Obtener número total de pools
  const { data: totalPools } = useReadContract({
    address: factoryAddress,
    abi: UNISWAP_V2_FACTORY_ABI.abi,
    functionName: 'allPairsLength',
    query: {
      enabled: !!factoryAddress,
    },
  });

  // Función para obtener información de un pool
  const getPoolInfo = useCallback(async (pairAddress: string): Promise<PoolInfo | null> => {
    if (!publicClient) {
      return null;
    }

    try {
      // Obtener información del pair directamente del contrato
      const [reserves, token0, token1, totalSupply] = await Promise.all([
        publicClient.readContract({
          address: pairAddress as `0x${string}`,
          abi: UNISWAP_V2_PAIR_ABI.abi,
          functionName: 'getReserves',
          args: []
        }) as Promise<[bigint, bigint, bigint]>,
        publicClient.readContract({
          address: pairAddress as `0x${string}`,
          abi: UNISWAP_V2_PAIR_ABI.abi,
          functionName: 'token0',
          args: []
        }) as Promise<`0x${string}`>,
        publicClient.readContract({
          address: pairAddress as `0x${string}`,
          abi: UNISWAP_V2_PAIR_ABI.abi,
          functionName: 'token1',
          args: []
        }) as Promise<`0x${string}`>,
        publicClient.readContract({
          address: pairAddress as `0x${string}`,
          abi: UNISWAP_V2_PAIR_ABI.abi,
          functionName: 'totalSupply',
          args: []
        }) as Promise<bigint>
      ]);


      // Obtener información de los tokens
      const [token0Info, token1Info] = await Promise.all([
        publicClient.readContract({
          address: token0 as `0x${string}`,
          abi: ERC20_ABI.abi,
          functionName: 'decimals',
          args: []
        }).then(async (decimals) => {
          const [symbol, name] = await Promise.all([
            publicClient.readContract({
              address: token0 as `0x${string}`,
              abi: ERC20_ABI.abi,
              functionName: 'symbol',
              args: []
            }) as Promise<string>,
            publicClient.readContract({
              address: token0 as `0x${string}`,
              abi: ERC20_ABI.abi,
              functionName: 'name',
              args: []
            }) as Promise<string>
          ]);
          return { decimals: Number(decimals), symbol, name };
        }),
        publicClient.readContract({
          address: token1 as `0x${string}`,
          abi: ERC20_ABI.abi,
          functionName: 'decimals',
          args: []
        }).then(async (decimals) => {
          const [symbol, name] = await Promise.all([
            publicClient.readContract({
              address: token1 as `0x${string}`,
              abi: ERC20_ABI.abi,
              functionName: 'symbol',
              args: []
            }) as Promise<string>,
            publicClient.readContract({
              address: token1 as `0x${string}`,
              abi: ERC20_ABI.abi,
              functionName: 'name',
              args: []
            }) as Promise<string>
          ]);
          return { decimals: Number(decimals), symbol, name };
        })
      ]);

      const reserve0 = reserves[0];
      const reserve1 = reserves[1];

      // Calcular liquidez considerando los decimales de cada token
      const token0Amount = formatUnits(reserve0, token0Info.decimals);
      const token1Amount = formatUnits(reserve1, token1Info.decimals);
      const liquidity = (parseFloat(token0Amount) + parseFloat(token1Amount)).toString();

      const poolInfo = {
        address: pairAddress,
        token0: {
          address: token0,
          symbol: token0Info.symbol,
          name: token0Info.name,
          decimals: token0Info.decimals
        },
        token1: {
          address: token1,
          symbol: token1Info.symbol,
          name: token1Info.name,
          decimals: token1Info.decimals
        },
        reserves: {
          reserve0,
          reserve1
        },
        totalSupply,
        liquidity,
        apy: '0.00' // Placeholder - se calcularía con datos históricos
      };

      return poolInfo;
    } catch (error) {
      return null;
    }
  }, [publicClient]);

  // Cargar pools
  const loadPools = useCallback(async () => {
    if (!totalPools || Number(totalPools) === 0 || !publicClient || !factoryAddress) {
      setPools([]);
      if (!factoryAddress) {
        setError('Dirección del Factory de Uniswap V2 no configurada');
      } else if (!publicClient) {
        setError('Cliente público no disponible');
      } else if (!totalPools || Number(totalPools) === 0) {
        setError('No hay pools disponibles en el factory');
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const poolsToLoad = Math.min(Number(totalPools), 10); // Limitar a 10 pools
      const poolPromises: Promise<PoolInfo | null>[] = [];

      // Cargar pools en orden descendente (más nuevos primero)
      for (let i = Number(totalPools) - 1; i >= Number(totalPools) - poolsToLoad && i >= 0; i--) {
        // Obtener dirección del pool directamente del contrato
        try {
          const poolAddress = await publicClient.readContract({
            address: factoryAddress,
            abi: UNISWAP_V2_FACTORY_ABI.abi,
            functionName: 'allPairs',
            args: [BigInt(i)]
          }) as `0x${string}`;
          
          if (poolAddress && poolAddress !== '0x0000000000000000000000000000000000000000') {
            poolPromises.push(getPoolInfo(poolAddress));
          }
        } catch (error) {
          // Error silencioso para pools individuales
        }
      }

      const poolResults = await Promise.all(poolPromises);
      const validPools = poolResults.filter((pool): pool is PoolInfo => pool !== null);
      
      setPools(validPools);
    } catch (error) {
      setError('Error al cargar los pools de liquidez');
    } finally {
      setIsLoading(false);
    }
  }, [totalPools, publicClient, getPoolInfo, factoryAddress]);

  // Cargar pools al montar el componente
  useEffect(() => {
    if (totalPools && factoryAddress) {
      loadPools();
    }
  }, [totalPools, loadPools, factoryAddress]);

  // Función para crear un nuevo pool
  const createPool = async (tokenA: string, tokenB: string) => {
    if (!isConnected || !address) {
      setPoolCreationState(prev => ({
        ...prev,
        error: 'Debes conectar tu wallet'
      }));
      return;
    }

    setPoolCreationState({
      isCreating: true,
      isConfirming: false,
      isSuccess: false,
      error: null,
      txHash: null
    });

    try {
      // Aquí se implementaría la lógica para crear un pool
      // Por ahora, simulamos la creación
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setPoolCreationState({
        isCreating: false,
        isConfirming: false,
        isSuccess: true,
        error: null,
        txHash: '0x1234567890abcdef'
      });

      // Recargar pools después de crear uno nuevo
      await loadPools();
    } catch (error) {
      setPoolCreationState(prev => ({
        ...prev,
        isCreating: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }));
    }
  };

  // Función para resetear el estado de creación
  const resetCreationState = () => {
    setPoolCreationState({
      isCreating: false,
      isConfirming: false,
      isSuccess: false,
      error: null,
      txHash: null
    });
  };

  return {
    pools,
    isLoading,
    error,
    totalPools: totalPools ? Number(totalPools) : 0,
    poolCreationState,
    createPool,
    resetCreationState,
    loadPools,
    // Durante la hidratación, usar valores por defecto para evitar diferencias
    isConnected: mounted ? isConnected : false,
    address: mounted ? address : undefined
  };
};
