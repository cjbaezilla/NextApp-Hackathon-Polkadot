import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseEther, formatEther, parseUnits, formatUnits } from 'viem';
import { UNISWAP_V2_ADDRESSES, SLIPPAGE_TOLERANCE, DEADLINE_BUFFER } from '@/lib/constants';
import { formatAmount } from '@/lib/uniswap-utils';

const isValidTokenAddress = (address: string): boolean => {
  return Boolean(address && 
         address.startsWith('0x') && 
         address.length === 42 && 
         address !== '0x0000000000000000000000000000000000000000');
};

import UNISWAP_V2_ROUTER_ABI from '@uniswap/v2-periphery/build/UniswapV2Router02.json';
import ERC20_ABI from '@uniswap/v2-core/build/IERC20.json';

const UNISWAP_V2_ROUTER_ADDRESS = UNISWAP_V2_ADDRESSES.ROUTER as `0x${string}`;

export interface SwapState {
  tokenIn: `0x${string}` | null;
  tokenOut: `0x${string}` | null;
  amountIn: string;
  amountOut: string;
  isCalculating: boolean;
  isSwapping: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error: string | null;
  txHash: string | null;
}

export interface TokenBalance {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  balance: bigint;
  formattedBalance: string;
}

export const useSwap = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContract, isPending, error: writeError, data: writeData, reset: resetWriteContract } = useWriteContract();
  
  const [swapState, setSwapState] = useState<SwapState>({
    tokenIn: null,
    tokenOut: null,
    amountIn: '',
    amountOut: '',
    isCalculating: false,
    isSwapping: false,
    isConfirming: false,
    isSuccess: false,
    error: null,
    txHash: null
  });

  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [mounted, setMounted] = useState(false);

  const { isLoading: isConfirming, isSuccess: isTransactionSuccess, error: receiptError } = useWaitForTransactionReceipt({
    hash: writeData as `0x${string}`,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isPending) {
      setSwapState(prev => ({
        ...prev,
        isSwapping: true,
        isConfirming: false,
        isSuccess: false,
        error: null,
        txHash: writeData || prev.txHash
      }));
    } else if (isConfirming) {
      setSwapState(prev => ({
        ...prev,
        isSwapping: false,
        isConfirming: true,
        isSuccess: false,
        txHash: writeData || prev.txHash
      }));
    } else if (isTransactionSuccess) {
      setSwapState(prev => ({
        ...prev,
        isConfirming: false,
        isSuccess: true,
        txHash: writeData || prev.txHash
      }));
    }
  }, [isPending, isConfirming, isTransactionSuccess, writeData]);

  useEffect(() => {
    if (writeError) {
      setSwapState(prev => ({
        ...prev,
        error: writeError.message || 'Error al enviar la transacción',
        isSwapping: false,
        isConfirming: false,
        isSuccess: false
      }));
    }
  }, [writeError]);

  useEffect(() => {
    if (receiptError) {
      setSwapState(prev => ({
        ...prev,
        error: receiptError.message || 'Error al confirmar la transacción',
        isConfirming: false,
        isSuccess: false
      }));
    }
  }, [receiptError]);

  const getTokenBalance = useCallback(async (tokenAddress: `0x${string}`): Promise<TokenBalance | null> => {
    if (!publicClient || !address) return null;

    try {
      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        const balance = await publicClient.getBalance({ address });
        return {
          address: tokenAddress,
          symbol: 'ETH',
          name: 'Ethereum',
          decimals: 18,
          balance,
          formattedBalance: formatEther(balance)
        };
      }

      const [balance, decimals, symbol, name] = await Promise.all([
        publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI.abi,
          functionName: 'balanceOf',
          args: [address]
        }) as Promise<bigint>,
        publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI.abi,
          functionName: 'decimals',
          args: []
        }) as Promise<number>,
        publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI.abi,
          functionName: 'symbol',
          args: []
        }) as Promise<string>,
        publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI.abi,
          functionName: 'name',
          args: []
        }) as Promise<string>
      ]);

      return {
        address: tokenAddress,
        symbol,
        name,
        decimals,
        balance,
        formattedBalance: formatUnits(balance, decimals)
      };
    } catch (error) {
      return null;
    }
  }, [publicClient, address]);

  const getTokenAllowance = useCallback(async (tokenAddress: `0x${string}`): Promise<bigint> => {
    if (!publicClient || !address) return 0n;

    try {
      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        return BigInt(Number.MAX_SAFE_INTEGER);
      }

      const allowance = await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI.abi,
        functionName: 'allowance',
        args: [address, UNISWAP_V2_ROUTER_ADDRESS]
      }) as bigint;

      return allowance;
    } catch (error) {
      return 0n;
    }
  }, [publicClient, address]);

  const checkPoolExists = useCallback(async (
    tokenA: `0x${string}`,
    tokenB: `0x${string}`
  ): Promise<boolean> => {
    if (!publicClient || !UNISWAP_V2_ADDRESSES.FACTORY) {
      return false;
    }

    try {
      const UNISWAP_V2_FACTORY_ABI = [
        {
          "inputs": [
            {"internalType": "address", "name": "tokenA", "type": "address"},
            {"internalType": "address", "name": "tokenB", "type": "address"}
          ],
          "name": "getPair",
          "outputs": [
            {"internalType": "address", "name": "pair", "type": "address"}
          ],
          "stateMutability": "view",
          "type": "function"
        }
      ];

      const pairAddress = await publicClient.readContract({
        address: UNISWAP_V2_ADDRESSES.FACTORY as `0x${string}`,
        abi: UNISWAP_V2_FACTORY_ABI,
        functionName: 'getPair',
        args: [tokenA, tokenB]
      }) as `0x${string}`;

      return pairAddress !== '0x0000000000000000000000000000000000000000';
    } catch (error) {
      return false;
    }
  }, [publicClient]);

  const calculateAmountOut = useCallback(async (
    tokenIn: `0x${string}`,
    tokenOut: `0x${string}`,
    amountIn: string
  ): Promise<string> => {
    if (!publicClient || !amountIn || parseFloat(amountIn) <= 0) {
      return '0';
    }

    if (tokenIn.toLowerCase() === tokenOut.toLowerCase()) {
      return '0';
    }

    if (!tokenIn || !tokenOut) {
      return '0';
    }

    if (tokenIn !== '0x0000000000000000000000000000000000000000' && !isValidTokenAddress(tokenIn)) {
      return '0';
    }

    if (tokenOut !== '0x0000000000000000000000000000000000000000' && !isValidTokenAddress(tokenOut)) {
      return '0';
    }

    try {
      const amountInWei = parseEther(amountIn);
      
      if (tokenIn.toLowerCase() === tokenOut.toLowerCase()) {
        return '0';
      }

      if (!UNISWAP_V2_ADDRESSES.WETH) {
        return '0';
      }

      let path: readonly `0x${string}`[];
      if (tokenIn === '0x0000000000000000000000000000000000000000') {
        path = [UNISWAP_V2_ADDRESSES.WETH as `0x${string}`, tokenOut] as const;
      } else if (tokenOut === '0x0000000000000000000000000000000000000000') {
        if (tokenIn.toLowerCase() === UNISWAP_V2_ADDRESSES.WETH.toLowerCase()) {
          setSwapState(prev => ({ 
            ...prev, 
            isCalculating: false,
            error: 'Para convertir WETH a ETH, usa la función "unwrap" en lugar de swap'
          }));
          return '0';
        }
        path = [tokenIn, UNISWAP_V2_ADDRESSES.WETH as `0x${string}`] as const;
      } else {
        path = [tokenIn, tokenOut] as const;
      }

      if (path.length < 2 || path[0].toLowerCase() === path[1].toLowerCase()) {
        return '0';
      }

      const poolExists = await checkPoolExists(path[0], path[1]);
      if (!poolExists) {
        return '0';
      }

      const amountsOut = await publicClient.readContract({
        address: UNISWAP_V2_ROUTER_ADDRESS,
        abi: UNISWAP_V2_ROUTER_ABI.abi,
        functionName: 'getAmountsOut',
        args: [amountInWei, path]
      }) as bigint[];

      const amountOut = amountsOut[amountsOut.length - 1];
      const formattedAmountOut = formatEther(amountOut);

      return formattedAmountOut;
    } catch (error) {
      return '0';
    }
  }, [publicClient, checkPoolExists]);

  const approveToken = useCallback(async (tokenAddress: `0x${string}`, amount: string) => {
    if (!isConnected || !address) {
      throw new Error('Debes conectar tu wallet');
    }

    const amountWei = parseEther(amount);
    
    return writeContract({
      address: tokenAddress,
      abi: ERC20_ABI.abi,
      functionName: 'approve',
      args: [UNISWAP_V2_ROUTER_ADDRESS, amountWei]
    });
  }, [isConnected, address, writeContract]);

  const wrapETH = useCallback(async (amount: string) => {
    if (!isConnected || !address) {
      throw new Error('Debes conectar tu wallet');
    }

    const amountWei = parseEther(amount);
    
    return writeContract({
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
      value: amountWei
    });
  }, [isConnected, address, writeContract]);

  const unwrapWETH = useCallback(async (amount: string) => {
    if (!isConnected || !address) {
      throw new Error('Debes conectar tu wallet');
    }

    const amountWei = parseEther(amount);
    
    return writeContract({
      address: UNISWAP_V2_ADDRESSES.WETH as `0x${string}`,
      abi: [
        {
          "inputs": [{"internalType": "uint256", "name": "wad", "type": "uint256"}],
          "name": "withdraw",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ],
      functionName: 'withdraw',
      args: [amountWei]
    });
  }, [isConnected, address, writeContract]);

  const executeSwap = useCallback(async () => {
    if (!swapState.tokenIn) {
      throw new Error('Selecciona un token de entrada');
    }
    if (!swapState.tokenOut) {
      throw new Error('Selecciona un token de salida');
    }
    if (!swapState.amountIn || parseFloat(swapState.amountIn) <= 0) {
      throw new Error('Ingresa una cantidad válida para el swap');
    }
    if (!swapState.amountOut || swapState.amountOut === '0') {
      throw new Error('No se pudo calcular la cantidad de salida. Verifica que exista liquidez para este par de tokens.');
    }

    if (!isConnected || !address) {
      throw new Error('Debes conectar tu wallet');
    }

    if (swapState.tokenIn.toLowerCase() === swapState.tokenOut.toLowerCase()) {
      throw new Error('Los tokens de entrada y salida deben ser diferentes');
    }

    if (swapState.tokenIn.toLowerCase() === UNISWAP_V2_ADDRESSES.WETH.toLowerCase() && 
        swapState.tokenOut === '0x0000000000000000000000000000000000000000') {
      return await unwrapWETH(swapState.amountIn);
    }

    if (swapState.tokenIn === '0x0000000000000000000000000000000000000000' &&
        swapState.tokenOut.toLowerCase() === UNISWAP_V2_ADDRESSES.WETH.toLowerCase()) {
      return await wrapETH(swapState.amountIn);
    }

    resetWriteContract();
    setSwapState(prev => ({ ...prev, error: null }));

    try {
      const amountInWei = parseEther(swapState.amountIn);
      const amountOutWei = parseEther(swapState.amountOut);
      
      const slippageBps = BigInt(SLIPPAGE_TOLERANCE * 100);
      const minAmountOut = amountOutWei - (amountOutWei * slippageBps) / 10000n;
      
      const deadline = BigInt(Math.floor(Date.now() / 1000) + DEADLINE_BUFFER);

      if (swapState.tokenIn !== '0x0000000000000000000000000000000000000000') {
        const currentAllowance = await getTokenAllowance(swapState.tokenIn);
        if (currentAllowance < amountInWei) {
          await approveToken(swapState.tokenIn, swapState.amountIn);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      if (swapState.tokenIn === '0x0000000000000000000000000000000000000000') {
        const path = [UNISWAP_V2_ADDRESSES.WETH as `0x${string}`, swapState.tokenOut] as const;
        
        await writeContract({
          address: UNISWAP_V2_ROUTER_ADDRESS,
          abi: UNISWAP_V2_ROUTER_ABI.abi,
          functionName: 'swapExactETHForTokens',
          args: [minAmountOut, path, address, deadline],
          value: amountInWei
        });
      } else if (swapState.tokenOut === '0x0000000000000000000000000000000000000000') {
        const path = [swapState.tokenIn, UNISWAP_V2_ADDRESSES.WETH as `0x${string}`] as const;
        
        await writeContract({
          address: UNISWAP_V2_ROUTER_ADDRESS,
          abi: UNISWAP_V2_ROUTER_ABI.abi,
          functionName: 'swapExactTokensForETH',
          args: [amountInWei, minAmountOut, path, address, deadline]
        });
      } else {
        const path = [swapState.tokenIn, swapState.tokenOut] as const;
        
        await writeContract({
          address: UNISWAP_V2_ROUTER_ADDRESS,
          abi: UNISWAP_V2_ROUTER_ABI.abi,
          functionName: 'swapExactTokensForTokens',
          args: [amountInWei, minAmountOut, path, address, deadline]
        });
      }
    } catch (error) {
      setSwapState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Error al ejecutar el swap'
      }));
      throw error;
    }
  }, [swapState, isConnected, address, writeContract, getTokenAllowance, approveToken, resetWriteContract, unwrapWETH, wrapETH]);

  const updateSwapState = useCallback((updates: Partial<SwapState>) => {
    setSwapState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetSwapState = useCallback(() => {
    setSwapState({
      tokenIn: null,
      tokenOut: null,
      amountIn: '',
      amountOut: '',
      isCalculating: false,
      isSwapping: false,
      isConfirming: false,
      isSuccess: false,
      error: null,
      txHash: null
    });
  }, []);

  const loadTokenBalances = useCallback(async (tokenAddresses: `0x${string}`[]) => {
    if (!address || !publicClient) return;

    try {
      const balancePromises = tokenAddresses.map(addr => getTokenBalance(addr));
      const balances = await Promise.all(balancePromises);
      const validBalances = balances.filter((balance): balance is TokenBalance => balance !== null);
      
      setTokenBalances(prevBalances => {
        const newBalances = [...prevBalances];
        
        validBalances.forEach(newBalance => {
          const existingIndex = newBalances.findIndex(existing => existing.address === newBalance.address);
          if (existingIndex >= 0) {
            newBalances[existingIndex] = newBalance;
          } else {
            newBalances.push(newBalance);
          }
        });
        
        return newBalances;
      });
    } catch (error) {
      // Error loading token balances
    }
  }, [address, publicClient, getTokenBalance]);

  return {
    swapState,
    tokenBalances,
    updateSwapState,
    resetSwapState,
    calculateAmountOut,
    executeSwap,
    approveToken,
    getTokenBalance,
    getTokenAllowance,
    loadTokenBalances,
    wrapETH,
    unwrapWETH,
    checkPoolExists,
    isPending,
    writeError,
    isConnected: mounted ? isConnected : false,
    address: mounted ? address : undefined
  };
};
