import { useContractRead } from 'wagmi';
import { useAccount } from 'wagmi';

// Importar ABI del contrato DAO
const DAOContract = require(process.env.NEXT_PUBLIC_DAO_CONTRACT_ABI_PATH!);

/**
 * Hook personalizado para verificar si un usuario ya votó en una propuesta específica
 * @param proposalId - ID de la propuesta a verificar
 * @returns {Object} Objeto con el estado de votación del usuario
 */
export const useUserVotingStatus = (proposalId: number) => {
  const { address } = useAccount();
  
  // Dirección del contrato DAO
  const daoContractAddress = process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS as `0x${string}`;

  // Verificar si el usuario ya votó en esta propuesta
  const { data: hasVoted, isLoading, error } = useContractRead({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'hasVoted',
    args: address ? [BigInt(proposalId), address] : undefined,
    query: {
      enabled: !!address && proposalId >= 0,
    },
  });

  return {
    hasVoted: hasVoted as boolean | undefined,
    isLoading,
    error,
  };
};

/**
 * Hook para verificar el estado de votación del usuario en múltiples propuestas
 * @param proposalIds - Array de IDs de propuestas a verificar
 * @returns {Object} Objeto con el estado de votación para cada propuesta
 */
export const useMultipleUserVotingStatus = (proposalIds: number[]) => {
  const { address } = useAccount();
  
  // Dirección del contrato DAO
  const daoContractAddress = process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS as `0x${string}`;

  // Crear contratos para verificar múltiples propuestas
  const contracts = proposalIds.map(proposalId => ({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'hasVoted' as const,
    args: address ? [BigInt(proposalId), address] as const : undefined,
  }));

  // Verificar estado de votación para todas las propuestas
  const { data: votingStatuses, isLoading, error } = useContractRead({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'hasVoted',
    args: proposalIds.length > 0 && address ? [BigInt(proposalIds[0]), address] : undefined,
    query: {
      enabled: !!address && proposalIds.length > 0,
    },
  });

  // Crear un mapa de propuesta ID -> estado de votación
  const votingStatusMap = new Map<number, boolean>();
  
  if (votingStatuses !== undefined && proposalIds.length > 0) {
    votingStatusMap.set(proposalIds[0], votingStatuses as boolean);
  }

  return {
    votingStatusMap,
    isLoading,
    error,
  };
};
