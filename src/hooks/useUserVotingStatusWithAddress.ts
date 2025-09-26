import { useContractRead } from 'wagmi';
import { useAccount } from 'wagmi';

// Importar ABI del contrato DAO
const DAOContract = require(process.env.NEXT_PUBLIC_DAO_CONTRACT_ABI_PATH!);

/**
 * Hook personalizado para verificar si un usuario ya votó en una propuesta específica con dirección personalizada
 * @param proposalId - ID de la propuesta a verificar
 * @param daoContractAddress - Dirección del contrato DAO
 * @returns {Object} Objeto con el estado de votación del usuario
 */
export const useUserVotingStatusWithAddress = (proposalId: number, daoContractAddress: `0x${string}`) => {
  const { address } = useAccount();

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
