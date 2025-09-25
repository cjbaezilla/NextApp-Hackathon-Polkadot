import { useState, useEffect } from 'react';
import { useContractRead, useAccount } from 'wagmi';
import { formatEther } from 'viem';

// Cargar ABI desde variable de entorno
const ERC20MembersFactory = require(process.env.NEXT_PUBLIC_ERC20MEMBERSFACTORY_CONTRACT_ABI_PATH!);

interface TokenInfo {
  tokenAddress: string;
  creator: string;
  name: string;
  symbol: string;
  initialSupply: bigint;
  creationTimestamp: bigint;
}

export const useUserTokens = () => {
  const { address, isConnected } = useAccount();
  const [userTokens, setUserTokens] = useState<TokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dirección del contrato desde variable de entorno
  const factoryContractAddress = process.env.NEXT_PUBLIC_ERC20MEMBERSFACTORY_CONTRACT_ADDRESS as `0x${string}`;

  // Leer tokens del usuario
  const { data: tokensData, refetch: refetchTokens, isLoading: isLoadingTokens } = useContractRead({
    address: factoryContractAddress,
    abi: ERC20MembersFactory.abi,
    functionName: 'getUserTokens',
    args: address ? [address] : ['0x0000000000000000000000000000000000000000'],
  });

  // Leer cantidad de tokens del usuario
  const { data: tokenCount, refetch: refetchTokenCount } = useContractRead({
    address: factoryContractAddress,
    abi: ERC20MembersFactory.abi,
    functionName: 'getUserTokenCount',
    args: address ? [address] : ['0x0000000000000000000000000000000000000000'],
  });

  // Efecto para procesar los datos de tokens
  useEffect(() => {
    if (tokensData && Array.isArray(tokensData)) {
      try {
        const processedTokens: TokenInfo[] = tokensData.map((token: any) => ({
          tokenAddress: token.tokenAddress,
          creator: token.creator,
          name: token.name,
          symbol: token.symbol,
          initialSupply: token.initialSupply,
          creationTimestamp: token.createdAt,
        }));
        
        setUserTokens(processedTokens);
        setError(null);
      } catch (err) {
        console.error('Error al procesar tokens del usuario:', err);
        setError('Error al procesar los tokens');
      }
    } else if (tokensData === null || tokensData === undefined) {
      setUserTokens([]);
      setError(null);
    }
    
    setIsLoading(isLoadingTokens);
  }, [tokensData, isLoadingTokens]);

  // Función para formatear fecha
  const formatCreationDate = (timestamp: bigint) => {
    const timestampNumber = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
    const date = new Date(timestampNumber * 1000);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para formatear el suministro inicial
  const formatInitialSupply = (supply: bigint) => {
    // Los tokens ERC20 tienen 18 decimales por defecto
    const decimals = 18;
    const divisor = BigInt(10 ** decimals);
    
    // Convertir de wei a la unidad principal del token
    const wholePart = supply / divisor;
    const fractionalPart = supply % divisor;
    
    // Si no hay parte fraccionaria significativa, mostrar solo la parte entera
    if (fractionalPart === BigInt(0)) {
      return wholePart.toLocaleString('es-ES');
    }
    
    // Convertir la parte fraccionaria a decimales
    const fractionalString = fractionalPart.toString().padStart(decimals, '0');
    const trimmedFractional = fractionalString.replace(/0+$/, ''); // Quitar ceros al final
    
    if (trimmedFractional === '') {
      return wholePart.toLocaleString('es-ES');
    }
    
    // Combinar parte entera y fraccionaria
    const result = `${wholePart.toLocaleString('es-ES')}.${trimmedFractional}`;
    return result;
  };

  // Función para formatear balance con decimales correctos
  const formatBalance = (balance: bigint | undefined, decimals: number | undefined) => {
    if (!balance || !decimals) return '0';
    const formatted = formatEther(balance * BigInt(10 ** (18 - decimals)));
    return parseFloat(formatted).toLocaleString('es-ES');
  };

  // Función para acortar dirección
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Función para refrescar datos
  const refreshTokens = async () => {
    try {
      await Promise.all([refetchTokens(), refetchTokenCount()]);
    } catch (err) {
      console.error('Error al refrescar tokens:', err);
      setError('Error al refrescar los tokens');
    }
  };

  return {
    userTokens,
    tokenCount: tokenCount ? Number(tokenCount) : 0,
    isLoading,
    error,
    isConnected,
    address,
    refreshTokens,
    formatCreationDate,
    formatInitialSupply,
    formatBalance,
    shortenAddress
  };
};


