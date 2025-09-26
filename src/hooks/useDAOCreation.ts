import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';

// Importar ABI del contrato DAOMembersFactory
import DAOMembersFactoryABI from '@/contracts/DAOMembersFactory.json';

// Configuración del contrato desde variables de entorno
const DAOMEMBERSFACTORY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_DAOMEMBERSFACTORY_CONTRACT_ADDRESS as `0x${string}`;

interface UserRequirements {
  isRegistered: boolean;
  nftBalance: number;
  canCreateDAO: boolean;
}

interface DAOCreationState {
  isCreating: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error: string | null;
  transactionHash: string | null;
}

export const useDAOCreation = () => {
  const { address, isConnected } = useAccount();
  const [userRequirements, setUserRequirements] = useState<UserRequirements | null>(null);
  const [daoCreationState, setDAOCreationState] = useState<DAOCreationState>({
    isCreating: false,
    isConfirming: false,
    isSuccess: false,
    error: null,
    transactionHash: null,
  });

  // Leer requisitos del usuario
  const { data: userRequirementsData, isLoading: isLoadingRequirements } = useReadContract({
    address: DAOMEMBERSFACTORY_CONTRACT_ADDRESS,
    abi: DAOMembersFactoryABI.abi,
    functionName: 'checkUserRequirements',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Leer tarifa de creación
  const { data: creationFee } = useReadContract({
    address: DAOMEMBERSFACTORY_CONTRACT_ADDRESS,
    abi: DAOMembersFactoryABI.abi,
    functionName: 'getDAOCreationFee',
    query: {
      retry: 1,
      refetchOnWindowFocus: false,
    }
  });

  // Leer mínimo de NFTs requeridos
  const { data: minNFTsRequired } = useReadContract({
    address: DAOMEMBERSFACTORY_CONTRACT_ADDRESS,
    abi: DAOMembersFactoryABI.abi,
    functionName: 'getMinNFTsRequired',
    query: {
      retry: 1,
      refetchOnWindowFocus: false,
    }
  });

  // Hook para escribir en el contrato
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();

  // Hook para esperar confirmación de transacción
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Procesar requisitos del usuario
  useEffect(() => {
    // Si no hay wallet conectado, establecer requisitos básicos
    if (!address) {
      setUserRequirements({
        isRegistered: false,
        nftBalance: 0,
        canCreateDAO: false,
      });
      return;
    }

    // Si hay wallet conectado y datos disponibles, procesarlos
    if (userRequirementsData && Array.isArray(userRequirementsData) && userRequirementsData.length >= 3) {
      const [isRegistered, nftBalance, canCreateDAO] = userRequirementsData as [boolean, bigint, boolean];
      setUserRequirements({
        isRegistered,
        nftBalance: Number(nftBalance),
        canCreateDAO,
      });
    }
  }, [userRequirementsData, address]);

  // Actualizar estado de creación
  useEffect(() => {
    setDAOCreationState(prev => ({
      ...prev,
      isCreating: isPending,
      isConfirming,
      isSuccess,
      transactionHash: hash || null,
    }));
  }, [isPending, isConfirming, isSuccess, hash]);

  // Manejar errores de escritura
  useEffect(() => {
    if (writeError) {
      setDAOCreationState(prev => ({
        ...prev,
        error: writeError.message || 'Error desconocido al crear DAO',
      }));
    }
  }, [writeError]);

  // Función para crear un nuevo DAO
  const createNewDAO = async (
    daoName: string,
    nftContractAddress: string,
    minProposalCreationTokens: number,
    minVotesToApprove: number,
    minTokensToApprove: number
  ) => {
    if (!address || !creationFee) {
      throw new Error('Dirección de usuario o tarifa no disponible');
    }

    try {
      setDAOCreationState(prev => ({
        ...prev,
        error: null,
        isCreating: true,
      }));

      await writeContract({
        address: DAOMEMBERSFACTORY_CONTRACT_ADDRESS,
        abi: DAOMembersFactoryABI.abi,
        functionName: 'deployDAO',
        args: [
          daoName,
          nftContractAddress as `0x${string}`,
          BigInt(minProposalCreationTokens),
          BigInt(minVotesToApprove),
          BigInt(minTokensToApprove),
        ],
        value: creationFee as bigint,
      });
    } catch (error) {
      console.error('Error al crear DAO:', error);
      setDAOCreationState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error desconocido al crear DAO',
        isCreating: false,
      }));
      throw error;
    }
  };

  // Función para resetear el estado de creación
  const resetCreationState = () => {
    setDAOCreationState({
      isCreating: false,
      isConfirming: false,
      isSuccess: false,
      error: null,
      transactionHash: null,
    });
  };

  // Función para formatear ETH
  const formatETH = (value: bigint) => {
    return formatEther(value);
  };

  return {
    // Estado del usuario
    userRequirements,
    isLoadingRequirements,
    isConnected,
    address,

    // Configuración del contrato
    minNFTsRequired: minNFTsRequired ? Number(minNFTsRequired) : 5,
    creationFee,

    // Estado de creación
    daoCreationState,

    // Funciones
    createNewDAO,
    resetCreationState,
    formatETH,
  };
};
