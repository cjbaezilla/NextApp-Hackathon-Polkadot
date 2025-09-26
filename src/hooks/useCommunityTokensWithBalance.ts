import { useState, useEffect } from 'react';
import { useContractRead } from 'wagmi';
import { formatEther } from 'viem';

// Cargar ABI desde variable de entorno
const ERC20MembersFactory = require(process.env.NEXT_PUBLIC_ERC20MEMBERSFACTORY_CONTRACT_ABI_PATH!);
const SimpleERC20Contract = require(process.env.NEXT_PUBLIC_SIMPLEERC20_CONTRACT_ABI_PATH!);

interface TokenInfo {
  tokenAddress: string;
  creator: string;
  name: string;
  symbol: string;
  initialSupply: bigint;
  creationTimestamp: bigint;
  userBalance: bigint;
  decimals: number;
}

export const useCommunityTokensWithBalance = (userAddress?: string) => {
  const [communityTokens, setCommunityTokens] = useState<TokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dirección del contrato desde variable de entorno
  const factoryContractAddress = process.env.NEXT_PUBLIC_ERC20MEMBERSFACTORY_CONTRACT_ADDRESS as `0x${string}`;

  // Leer todos los tokens del factory
  const { data: allTokensData, refetch: refetchAllTokens, isLoading: isLoadingAllTokens } = useContractRead({
    address: factoryContractAddress,
    abi: ERC20MembersFactory.abi,
    functionName: 'getAllTokens',
  });

  // Efecto para procesar los datos y filtrar tokens de la comunidad con balance
  useEffect(() => {
    if (!allTokensData || !Array.isArray(allTokensData) || !userAddress) {
      setCommunityTokens([]);
      setIsLoading(isLoadingAllTokens);
      return;
    }

    const processTokens = async () => {
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
          userBalance: BigInt(0), // Se llenará después
          decimals: 18 // Valor por defecto, se actualizará
        }));

        // Filtrar tokens que NO son del usuario actual
        const communityTokensOnly = processedTokens.filter(token => 
          token.creator.toLowerCase() !== userAddress.toLowerCase()
        );

        // Por ahora, solo mostrar tokens de la comunidad sin verificar balance
        // TODO: Implementar verificación de balance usando wagmi hooks
        setCommunityTokens(communityTokensOnly.map(token => ({
          ...token,
          userBalance: BigInt(0),
          decimals: 18
        })));
        setError(null);
        setIsLoading(false);
      } catch (err) {
        console.error('Error al procesar tokens de la comunidad:', err);
        setError('Error al procesar los tokens de la comunidad');
        setCommunityTokens([]);
        setIsLoading(false);
      }
    };

    processTokens();
  }, [allTokensData, isLoadingAllTokens, userAddress]);

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
    const decimals = 18;
    const divisor = BigInt(10 ** decimals);
    
    const wholePart = supply / divisor;
    const fractionalPart = supply % divisor;
    
    if (fractionalPart === BigInt(0)) {
      return wholePart.toLocaleString('es-ES');
    }
    
    const fractionalString = fractionalPart.toString().padStart(decimals, '0');
    const trimmedFractional = fractionalString.replace(/0+$/, '');
    
    if (trimmedFractional === '') {
      return wholePart.toLocaleString('es-ES');
    }
    
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
    communityTokens,
    tokensCount: communityTokens.length,
    isLoading,
    error,
    refreshTokens,
    formatCreationDate,
    formatInitialSupply,
    formatBalance,
    shortenAddress
  };
};