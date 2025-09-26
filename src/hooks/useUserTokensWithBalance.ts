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

export const useUserTokensWithBalance = (userAddress?: string) => {
  const { address, isConnected } = useAccount();
  const [allTokens, setAllTokens] = useState<TokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Usar la dirección proporcionada o la del usuario conectado
  const targetAddress = userAddress || address;

  // Dirección del contrato desde variable de entorno
  const factoryContractAddress = process.env.NEXT_PUBLIC_ERC20MEMBERSFACTORY_CONTRACT_ADDRESS as `0x${string}`;

  // Leer todos los tokens del factory
  const { data: allTokensData, refetch: refetchAllTokens, isLoading: isLoadingAllTokens } = useContractRead({
    address: factoryContractAddress,
    abi: ERC20MembersFactory.abi,
    functionName: 'getAllTokens',
  });

  // Efecto para procesar los datos
  useEffect(() => {
    if (!allTokensData || !Array.isArray(allTokensData) || !targetAddress) {
      setAllTokens([]);
      setIsLoading(isLoadingAllTokens);
      return;
    }

    try {
      setIsLoading(true);
      
      // Procesar tokens y convertirlos al formato correcto
      const processedTokens: TokenInfo[] = allTokensData.map((token: any) => ({
        tokenAddress: token.tokenAddress,
        creator: token.creator,
        name: token.name,
        symbol: token.symbol,
        initialSupply: token.initialSupply,
        creationTimestamp: token.createdAt,
      }));
      
      setAllTokens(processedTokens);
      setError(null);
      setIsLoading(false);
    } catch (err) {
      console.error('Error al procesar tokens:', err);
      setError('Error al procesar los tokens');
      setAllTokens([]);
      setIsLoading(false);
    }
  }, [allTokensData, isLoadingAllTokens, targetAddress]);

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
      await refetchAllTokens();
    } catch (err) {
      console.error('Error al refrescar tokens:', err);
      setError('Error al refrescar los tokens');
    }
  };

  return {
    allTokens,
    tokensCount: allTokens.length,
    isLoading,
    error,
    isConnected,
    address,
    refreshTokens: refetchAllTokens,
    formatCreationDate,
    formatInitialSupply,
    formatBalance,
    shortenAddress
  };
};
