import { useContractRead } from 'wagmi';
import { useState, useEffect } from 'react';
import { skipToken } from '@tanstack/react-query';

// Cargar ABI del contrato ERC20MembersFactory
const ERC20MembersFactory = require('@/contracts/ERC20MembersFactory.json');

export interface TokenInfo {
  tokenAddress: string;
  creator: string;
  name: string;
  symbol: string;
  initialSupply: bigint;
  createdAt: bigint;
}

export interface UseERC20TokensReturn {
  tokens: TokenInfo[];
  totalTokens: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook personalizado para obtener tokens creados por el contrato ERC20MembersFactory
 * @param contractAddress - Dirección del contrato ERC20MembersFactory
 * @param limit - Límite de tokens a obtener (opcional, por defecto 10)
 */
export const useERC20Tokens = (
  contractAddress: `0x${string}` | undefined,
  limit: number = 10
): UseERC20TokensReturn => {
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Obtener el total de tokens creados
  const { data: totalTokens, refetch: refetchTotal } = useContractRead({
    address: contractAddress!,
    abi: ERC20MembersFactory.abi,
    functionName: 'getTotalTokensCreated',
    query: {
      enabled: !!contractAddress,
    },
  });

  // Obtener todos los tokens
  const { data: allTokens, refetch: refetchTokens } = useContractRead({
    address: contractAddress!,
    abi: ERC20MembersFactory.abi,
    functionName: 'getAllTokens',
    query: {
      enabled: !!contractAddress,
    },
  });

  // Función para refetch
  const refetch = () => {
    refetchTotal();
    refetchTokens();
  };

  // Procesar los datos cuando cambien
  useEffect(() => {
    if (!contractAddress) {
      setIsLoading(false);
      setError('Dirección del contrato no disponible');
      return;
    }

    if (allTokens === undefined) {
      setIsLoading(true);
      setError(null);
      return;
    }

    try {
      setIsLoading(false);
      setError(null);

      // Convertir los datos del contrato a nuestro formato
      const processedTokens: TokenInfo[] = Array.isArray(allTokens) 
        ? allTokens.map((token: any) => ({
            tokenAddress: token.tokenAddress,
            creator: token.creator,
            name: token.name,
            symbol: token.symbol,
            initialSupply: BigInt(token.initialSupply),
            createdAt: BigInt(token.createdAt),
          }))
        : [];

      // Ordenar por fecha de creación (más recientes primero) y limitar
      const sortedTokens = processedTokens
        .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
        .slice(0, limit);

      setTokens(sortedTokens);
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Error desconocido al procesar tokens');
      setTokens([]);
    }
  }, [allTokens, contractAddress, limit]);

  return {
    tokens,
    totalTokens: totalTokens ? Number(totalTokens) : 0,
    isLoading,
    error,
    refetch,
  };
};
