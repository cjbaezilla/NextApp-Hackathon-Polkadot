import { useState, useEffect } from 'react';
import { useContractRead, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useAccount } from 'wagmi';
import { parseEther } from 'viem';

// Cargar ABIs desde variables de entorno
const ERC20MembersFactory = require(process.env.NEXT_PUBLIC_ERC20MEMBERSFACTORY_CONTRACT_ABI_PATH!);
const UsersContract = require(process.env.NEXT_PUBLIC_USERS_CONTRACT_ABI_PATH!);
const NFTContract = require(process.env.NEXT_PUBLIC_NFT_CONTRACT_ABI_PATH!);

interface UserRequirements {
  isRegistered: boolean;
  nftBalance: number;
  canCreateToken: boolean;
  isLoading: boolean;
}

interface TokenCreationState {
  isCreating: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error: string | null;
  transactionHash: string | null;
}

export const useTokenCreation = () => {
  const { address, isConnected } = useAccount();
  
  // Estados para la creación de tokens
  const [tokenCreationState, setTokenCreationState] = useState<TokenCreationState>({
    isCreating: false,
    isConfirming: false,
    isSuccess: false,
    error: null,
    transactionHash: null
  });

  // Estados para requisitos del usuario
  const [userRequirements, setUserRequirements] = useState<UserRequirements>({
    isRegistered: false,
    nftBalance: 0,
    canCreateToken: false,
    isLoading: true
  });

  // Direcciones de contratos desde variables de entorno
  const factoryContractAddress = process.env.NEXT_PUBLIC_ERC20MEMBERSFACTORY_CONTRACT_ADDRESS as `0x${string}`;
  const usersContractAddress = process.env.NEXT_PUBLIC_USERS_CONTRACT_ADDRESS as `0x${string}`;
  const nftContractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS as `0x${string}`;

  // Leer tarifa de creación de tokens
  const { data: creationFee, isLoading: isLoadingFee } = useContractRead({
    address: factoryContractAddress,
    abi: ERC20MembersFactory.abi,
    functionName: 'getTokenCreationFee',
    query: {
      retry: 1,
      refetchOnWindowFocus: false,
    }
  });

  // Leer mínimo de NFTs requeridos
  const { data: minNFTsRequired, isLoading: isLoadingMinNFTs } = useContractRead({
    address: factoryContractAddress,
    abi: ERC20MembersFactory.abi,
    functionName: 'getMinNFTsRequired',
    query: {
      retry: 1,
      refetchOnWindowFocus: false,
    }
  });

  // Verificar si el usuario está registrado
  const { data: isUserRegistered, isLoading: isLoadingRegistration } = useContractRead({
    address: usersContractAddress,
    abi: UsersContract.abi,
    functionName: 'isRegisteredUser',
    args: address ? [address] : ['0x0000000000000000000000000000000000000000'],
    query: {
      retry: 1,
      refetchOnWindowFocus: false,
      enabled: !!address, // Solo ejecutar si hay dirección
    }
  });

  // Leer balance de NFTs del usuario
  const { data: userNftBalance, isLoading: isLoadingNftBalance } = useContractRead({
    address: nftContractAddress,
    abi: NFTContract.abi,
    functionName: 'balanceOf',
    args: address ? [address] : ['0x0000000000000000000000000000000000000000'],
    query: {
      retry: 1,
      refetchOnWindowFocus: false,
      enabled: !!address, // Solo ejecutar si hay dirección
    }
  });

  // Función para crear token
  const { writeContract: createToken, data: createTokenData, isPending: isPendingCreation, error: writeError, reset: resetWriteContract } = useWriteContract();

  // Esperar confirmación de la transacción
  const { isLoading: isConfirming, isSuccess: isTokenCreated, error: receiptError } = useWaitForTransactionReceipt({
    hash: createTokenData as `0x${string}`,
  });

  // Efecto para verificar requisitos del usuario
  useEffect(() => {
    const minNFTs = minNFTsRequired ? Number(minNFTsRequired) : 5; // Valor por defecto
    
    // Si no hay wallet conectado, mostrar requisitos básicos inmediatamente
    if (!address) {
      setUserRequirements({
        isRegistered: false,
        nftBalance: 0,
        canCreateToken: false,
        isLoading: false
      });
      return;
    }
    
    // Si hay wallet conectado, verificar si las llamadas están cargando
    const isLoading = isLoadingRegistration || isLoadingNftBalance;
    
    if (!isLoading && isUserRegistered !== undefined && userNftBalance !== undefined) {
      // Si hay wallet conectado, verificar requisitos específicos
      const isRegistered = Boolean(isUserRegistered);
      const nftBalance = Number(userNftBalance);
      const canCreate = isRegistered && nftBalance >= minNFTs;

      setUserRequirements({
        isRegistered,
        nftBalance,
        canCreateToken: canCreate,
        isLoading: false
      });
    } else if (isLoading) {
      setUserRequirements(prev => ({ ...prev, isLoading: true }));
    }
  }, [
    address, 
    isUserRegistered, 
    userNftBalance, 
    minNFTsRequired, 
    isLoadingRegistration, 
    isLoadingNftBalance
  ]);

  // Efecto para manejar estados de creación
  useEffect(() => {
    if (isPendingCreation) {
      setTokenCreationState({
        isCreating: true,
        isConfirming: false,
        isSuccess: false,
        error: null,
        transactionHash: createTokenData || null
      });
    } else if (isConfirming) {
      setTokenCreationState(prev => ({
        ...prev,
        isCreating: false,
        isConfirming: true
      }));
    } else if (isTokenCreated) {
      setTokenCreationState(prev => ({
        ...prev,
        isConfirming: false,
        isSuccess: true
      }));
    }
  }, [isPendingCreation, isConfirming, isTokenCreated, createTokenData]);

  // Efecto para manejar errores de escritura y confirmación
  useEffect(() => {
    if (writeError) {
      setTokenCreationState(prev => ({
        ...prev,
        error: writeError.message || 'Error al enviar la transacción',
        isCreating: false,
        isConfirming: false
      }));
    }
  }, [writeError]);

  useEffect(() => {
    if (receiptError) {
      setTokenCreationState(prev => ({
        ...prev,
        error: receiptError.message || 'Error al confirmar la transacción',
        isConfirming: false
      }));
    }
  }, [receiptError]);

  // Función para crear token
  const createNewToken = async (name: string, symbol: string, initialSupply: string) => {
    // Limpiar errores previos y resetear estado de escritura
    resetWriteContract();
    setTokenCreationState(prev => ({
      ...prev,
      error: null
    }));

    if (!isConnected || !address) {
      const errorMsg = 'Debes conectar tu wallet para crear un token';
      setTokenCreationState(prev => ({ ...prev, error: errorMsg }));
      throw new Error(errorMsg);
    }

    if (!userRequirements.canCreateToken) {
      const errorMsg = 'No cumples con los requisitos para crear un token';
      setTokenCreationState(prev => ({ ...prev, error: errorMsg }));
      throw new Error(errorMsg);
    }

    if (!creationFee) {
      const errorMsg = 'No se pudo obtener la tarifa de creación';
      setTokenCreationState(prev => ({ ...prev, error: errorMsg }));
      throw new Error(errorMsg);
    }

    if (!name.trim() || !symbol.trim() || !initialSupply || Number(initialSupply) <= 0) {
      const errorMsg = 'Por favor completa todos los campos correctamente';
      setTokenCreationState(prev => ({ ...prev, error: errorMsg }));
      throw new Error(errorMsg);
    }

    try {
      // Convertir el suministro inicial a BigInt (ya está en la unidad correcta del token)
      const initialSupplyBigInt = BigInt(initialSupply);
      
      await createToken({
        address: factoryContractAddress,
        abi: ERC20MembersFactory.abi,
        functionName: 'createToken',
        args: [name, symbol, initialSupplyBigInt],
        value: creationFee as bigint
      });
    } catch (error) {
      console.error('Error al crear token:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido al crear el token';
      setTokenCreationState(prev => ({
        ...prev,
        error: errorMsg,
        isCreating: false,
        isConfirming: false
      }));
      throw error;
    }
  };

  // Función para resetear el estado de creación
  const resetCreationState = () => {
    resetWriteContract();
    setTokenCreationState({
      isCreating: false,
      isConfirming: false,
      isSuccess: false,
      error: null,
      transactionHash: null
    });
  };

  // Función para formatear ETH
  const formatETH = (wei: bigint) => {
    const eth = Number(wei) / 1e18;
    return eth.toFixed(4);
  };

  return {
    // Estados de requisitos del usuario
    userRequirements,
    minNFTsRequired: minNFTsRequired ? Number(minNFTsRequired) : 5,
    
    // Estados de creación de tokens
    tokenCreationState,
    creationFee,
    
    // Funciones
    createNewToken,
    resetCreationState,
    formatETH,
    
    // Estados de carga
    isLoadingFee,
    isLoadingMinNFTs,
    
    // Estados de conexión
    isConnected,
    address
  };
};
