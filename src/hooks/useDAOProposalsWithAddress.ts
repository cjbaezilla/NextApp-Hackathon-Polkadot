import { useContractRead } from 'wagmi';
import { useMemo, useState, useEffect } from 'react';

// Importar ABI del contrato DAO
const DAOContract = require(process.env.NEXT_PUBLIC_DAO_CONTRACT_ABI_PATH!);

// Tipo para una propuesta DAO
export interface DAOProposal {
  id: bigint;
  proposer: string;
  description: string;
  link: string;
  votesFor: bigint;
  votesAgainst: bigint;
  startTime: bigint;
  endTime: bigint;
  cancelled: boolean;
}

// Tipo para el estado de una propuesta
export interface ProposalStatus {
  status: 'active' | 'ended' | 'cancelled' | 'upcoming';
  canVote: boolean;
  isApproved: boolean;
  timeRemaining?: string;
}

// Tipo para información adicional de propuesta
export interface ProposalDetails extends DAOProposal {
  uniqueVoters: number;
  totalVotingPower: bigint;
  contractStatus: string;
}

// Hook para obtener todas las propuestas del DAO con dirección personalizada
export const useDAOProposalsWithAddress = (daoContractAddress: `0x${string}`) => {
  // Obtener el total de propuestas
  const { data: totalProposals, isLoading: isLoadingTotal, error: totalError } = useContractRead({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'getTotalProposals',
  });

  return {
    totalProposals: totalProposals ? Number(totalProposals) : 0,
    isLoadingTotal,
    totalError,
  };
};

// Hook para obtener una propuesta específica con dirección personalizada
export const useProposalWithAddress = (proposalId: number, daoContractAddress: `0x${string}`) => {
  // Validar que proposalId sea un número válido
  const isValidId = typeof proposalId === 'number' && proposalId >= 0 && !isNaN(proposalId);

  const { data: proposal, isLoading, error } = useContractRead({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'getProposal',
    args: [BigInt(proposalId)],
    query: {
      enabled: isValidId && !!daoContractAddress,
    },
  });

  const { data: status, isLoading: isLoadingStatus, error: statusError } = useContractRead({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'getProposalStatus',
    args: [BigInt(proposalId)],
    query: {
      enabled: isValidId && !!daoContractAddress,
    },
  });

  // Validar que los datos sean válidos antes de retornarlos
  const validatedProposal = proposal && typeof proposal === 'object' && 
    'id' in proposal && 'proposer' in proposal && 'description' in proposal 
    ? proposal as DAOProposal 
    : undefined;

  return {
    proposal: validatedProposal,
    status: status as string | undefined,
    isLoading: isLoading || isLoadingStatus,
    error: error || statusError,
  };
};

// Hook para obtener múltiples propuestas con dirección personalizada
export const useMultipleProposalsWithAddress = (proposalIds: number[], daoContractAddress: `0x${string}`) => {
  // Usar un número fijo de hooks para evitar problemas de orden
  const maxProposals = 10; // Reducido para evitar problemas de rendimiento
  
  // Crear hooks fijos para las primeras 10 propuestas
  const proposal0 = useContractRead({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'getProposal',
    args: [BigInt(0)],
    query: {
      enabled: proposalIds && proposalIds.length > 0 && proposalIds[0] === 0,
    },
  });

  const proposal1 = useContractRead({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'getProposal',
    args: [BigInt(1)],
    query: {
      enabled: proposalIds && proposalIds.length > 1 && proposalIds[1] === 1,
    },
  });

  const proposal2 = useContractRead({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'getProposal',
    args: [BigInt(2)],
    query: {
      enabled: proposalIds && proposalIds.length > 2 && proposalIds[2] === 2,
    },
  });

  const proposal3 = useContractRead({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'getProposal',
    args: [BigInt(3)],
    query: {
      enabled: proposalIds && proposalIds.length > 3 && proposalIds[3] === 3,
    },
  });

  const proposal4 = useContractRead({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'getProposal',
    args: [BigInt(4)],
    query: {
      enabled: proposalIds && proposalIds.length > 4 && proposalIds[4] === 4,
    },
  });

  // Array de todos los resultados de hooks
  const results = [proposal0, proposal1, proposal2, proposal3, proposal4];
  
  // Filtrar solo los resultados que tienen datos y están habilitados
  const validProposals = results
    .map((result, index) => ({
      data: result.data,
      isLoading: result.isLoading,
      error: result.error,
      id: index
    }))
    .filter(result => result.data !== undefined);

  return {
    proposals: validProposals.map(result => result.data).filter(Boolean) as DAOProposal[],
    isLoading: results.some(result => result.isLoading),
    errors: results.map(result => result.error).filter(Boolean),
  };
};

// Hook para cargar todas las propuestas del DAO usando el contrato real con dirección personalizada
export const useAllProposalsWithAddress = (daoContractAddress: `0x${string}`) => {
  const { totalProposals, isLoadingTotal } = useDAOProposalsWithAddress(daoContractAddress);

  // Crear array de IDs de propuestas usando useMemo para evitar recrear en cada render
  const proposalIds = useMemo(() => {
    if (!totalProposals || totalProposals === 0) return [];
    return Array.from({ length: totalProposals }, (_, i) => i);
  }, [totalProposals]);

  // Cargar propuestas individualmente usando useMultipleProposals
  const { proposals: loadedProposals, isLoading: isLoadingMultiple, errors } = useMultipleProposalsWithAddress(proposalIds, daoContractAddress);

  // Usar useMemo para procesar las propuestas y evitar bucles infinitos
  const processedProposals = useMemo(() => {
    if (!loadedProposals || loadedProposals.length === 0) return [];
    
    // Ordenar por ID descendente (más recientes primero)
    return [...loadedProposals].sort((a, b) => Number(b.id) - Number(a.id));
  }, [loadedProposals]);

  // Usar useMemo para el estado de error
  const processedError = useMemo(() => {
    if (errors && errors.length > 0) {
      return 'Error al cargar algunas propuestas';
    }
    return null;
  }, [errors]);

  return {
    proposals: processedProposals,
    isLoading: isLoadingTotal || isLoadingMultiple,
    error: processedError,
    totalProposals,
  };
};

// Hook para obtener detalles completos de todas las propuestas con datos reales del contrato y dirección personalizada
export const useAllProposalDetailsWithAddress = (daoContractAddress: `0x${string}`) => {
  const { totalProposals, isLoadingTotal } = useDAOProposalsWithAddress(daoContractAddress);

  // Crear array de IDs de propuestas usando useMemo para evitar recrear en cada render
  const proposalIds = useMemo(() => {
    if (!totalProposals || totalProposals === 0) return [];
    return Array.from({ length: totalProposals }, (_, i) => i);
  }, [totalProposals]);

  // Cargar propuestas individualmente usando useMultipleProposals
  const { proposals: loadedProposals, isLoading: isLoadingMultiple, errors } = useMultipleProposalsWithAddress(proposalIds, daoContractAddress);

  // Obtener datos de votantes únicos y poder total para cada propuesta
  const proposal0Voters = useContractRead({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'getUniqueVotersCount',
    args: [BigInt(0)],
    query: {
      enabled: proposalIds.length > 0,
    },
  });

  const proposal0Power = useContractRead({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'getProposalTotalVotingPower',
    args: [BigInt(0)],
    query: {
      enabled: proposalIds.length > 0,
    },
  });

  const proposal1Voters = useContractRead({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'getUniqueVotersCount',
    args: [BigInt(1)],
    query: {
      enabled: proposalIds.length > 1,
    },
  });

  const proposal1Power = useContractRead({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'getProposalTotalVotingPower',
    args: [BigInt(1)],
    query: {
      enabled: proposalIds.length > 1,
    },
  });

  const proposal2Voters = useContractRead({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'getUniqueVotersCount',
    args: [BigInt(2)],
    query: {
      enabled: proposalIds.length > 2,
    },
  });

  const proposal2Power = useContractRead({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'getProposalTotalVotingPower',
    args: [BigInt(2)],
    query: {
      enabled: proposalIds.length > 2,
    },
  });

  const proposal3Voters = useContractRead({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'getUniqueVotersCount',
    args: [BigInt(3)],
    query: {
      enabled: proposalIds.length > 3,
    },
  });

  const proposal3Power = useContractRead({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'getProposalTotalVotingPower',
    args: [BigInt(3)],
    query: {
      enabled: proposalIds.length > 3,
    },
  });

  const proposal4Voters = useContractRead({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'getUniqueVotersCount',
    args: [BigInt(4)],
    query: {
      enabled: proposalIds.length > 4,
    },
  });

  const proposal4Power = useContractRead({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'getProposalTotalVotingPower',
    args: [BigInt(4)],
    query: {
      enabled: proposalIds.length > 4,
    },
  });

  // Usar useMemo para procesar los detalles de las propuestas y evitar bucles infinitos
  const processedProposalDetails = useMemo(() => {
    if (!loadedProposals || loadedProposals.length === 0) return [];
    
    // Array de datos de votantes y poder
    const votersData = [proposal0Voters, proposal1Voters, proposal2Voters, proposal3Voters, proposal4Voters];
    const powerData = [proposal0Power, proposal1Power, proposal2Power, proposal3Power, proposal4Power];
    
    // Convertir propuestas a detalles completos
    const details: ProposalDetails[] = loadedProposals.map((proposal, index) => {
      const voters = votersData[index]?.data;
      const power = powerData[index]?.data;
      
      return {
        ...proposal,
        uniqueVoters: voters ? Number(voters) : 0,
        totalVotingPower: power ? (power as bigint) : BigInt(0),
        contractStatus: 'active' // Estado por defecto
      };
    });
    
    // Ordenar por ID descendente (más recientes primero)
    return details.sort((a, b) => Number(b.id) - Number(a.id));
  }, [loadedProposals, proposal0Voters.data, proposal0Power.data, proposal1Voters.data, proposal1Power.data, proposal2Voters.data, proposal2Power.data, proposal3Voters.data, proposal3Power.data, proposal4Voters.data, proposal4Power.data]);

  // Usar useMemo para el estado de error
  const processedError = useMemo(() => {
    if (errors && errors.length > 0) {
      return 'Error al cargar algunas propuestas';
    }
    return null;
  }, [errors]);

  // Verificar si está cargando datos de votantes y poder
  const isLoadingVotingData = proposal0Voters.isLoading || proposal0Power.isLoading || 
                              proposal1Voters.isLoading || proposal1Power.isLoading ||
                              proposal2Voters.isLoading || proposal2Power.isLoading ||
                              proposal3Voters.isLoading || proposal3Power.isLoading ||
                              proposal4Voters.isLoading || proposal4Power.isLoading;

  return {
    proposalDetails: processedProposalDetails,
    isLoading: isLoadingTotal || isLoadingMultiple || isLoadingVotingData,
    error: processedError,
    totalProposals,
  };
};
