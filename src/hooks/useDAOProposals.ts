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

// Hook para obtener todas las propuestas del DAO
export const useDAOProposals = () => {
  // Dirección del contrato DAO desde variables de entorno
  const daoContractAddress = process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS as `0x${string}`;

  // Obtener el total de propuestas
  const { data: totalProposals, isLoading: isLoadingTotal, error: totalError } = useContractRead({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'getTotalProposals',
  });

  // Función para obtener una propuesta específica por ID
  const getProposalById = (proposalId: number) => {
    // Esta función ya no usa hooks directamente, se debe usar useProposal en su lugar
    console.warn('getProposalById está deprecado. Usa useProposal en su lugar.');
    return null;
  };

  // Función para obtener el estado de una propuesta
  const getProposalStatus = (proposalId: number) => {
    // Esta función ya no usa hooks directamente, se debe usar useProposal en su lugar
    console.warn('getProposalStatus está deprecado. Usa useProposal en su lugar.');
    return null;
  };

  return {
    totalProposals: totalProposals ? Number(totalProposals) : 0,
    isLoadingTotal,
    totalError,
    getProposalById,
    getProposalStatus,
  };
};

// Hook para obtener una propuesta específica
export const useProposal = (proposalId: number) => {
  const daoContractAddress = process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS as `0x${string}`;

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

// Hook para obtener detalles completos de una propuesta
export const useProposalDetails = (proposalId: number) => {
  const daoContractAddress = process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS as `0x${string}`;

  // Validar que proposalId sea un número válido
  const isValidId = typeof proposalId === 'number' && proposalId >= 0 && !isNaN(proposalId);

  // Obtener propuesta básica
  const { data: proposal, isLoading: isLoadingProposal, error: proposalError } = useContractRead({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'getProposal',
    args: [BigInt(proposalId)],
    query: {
      enabled: isValidId && !!daoContractAddress,
    },
  });

  // Obtener estado del contrato
  const { data: status, isLoading: isLoadingStatus, error: statusError } = useContractRead({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'getProposalStatus',
    args: [BigInt(proposalId)],
    query: {
      enabled: isValidId && !!daoContractAddress,
    },
  });

  // Obtener número de votantes únicos
  const { data: uniqueVoters, isLoading: isLoadingVoters, error: votersError } = useContractRead({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'getUniqueVotersCount',
    args: [BigInt(proposalId)],
    query: {
      enabled: isValidId && !!daoContractAddress,
    },
  });

  // Obtener poder total de votación
  const { data: totalVotingPower, isLoading: isLoadingPower, error: powerError } = useContractRead({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'getProposalTotalVotingPower',
    args: [BigInt(proposalId)],
    query: {
      enabled: isValidId && !!daoContractAddress,
    },
  });

  // Función para determinar el estado de la propuesta
  const getProposalStatusInfo = (proposalData: DAOProposal): ProposalStatus => {
    const now = Date.now() / 1000;
    const startTime = Number(proposalData.startTime);
    const endTime = Number(proposalData.endTime);

    if (proposalData.cancelled) {
      return { status: 'cancelled', canVote: false, isApproved: false };
    }

    if (now < startTime) {
      const timeRemaining = Math.ceil((startTime - now) / 86400); // días
      return { 
        status: 'upcoming', 
        canVote: false, 
        isApproved: false,
        timeRemaining: `${timeRemaining} días`
      };
    }

    if (now > endTime) {
      // Verificar si fue aprobada (esto requeriría lógica adicional del contrato)
      return { status: 'ended', canVote: false, isApproved: false };
    }

    const timeRemaining = Math.ceil((endTime - now) / 86400); // días
    return { 
      status: 'active', 
      canVote: true, 
      isApproved: false,
      timeRemaining: `${timeRemaining} días`
    };
  };

  // Crear objeto con detalles completos
  const proposalData = proposal && typeof proposal === 'object' && 
    'id' in proposal && 'proposer' in proposal && 'description' in proposal 
    ? proposal as DAOProposal 
    : undefined;

  const proposalDetails: ProposalDetails | undefined = proposalData ? {
    id: proposalData.id,
    proposer: proposalData.proposer,
    description: proposalData.description,
    link: proposalData.link,
    votesFor: proposalData.votesFor,
    votesAgainst: proposalData.votesAgainst,
    startTime: proposalData.startTime,
    endTime: proposalData.endTime,
    cancelled: proposalData.cancelled,
    uniqueVoters: uniqueVoters ? Number(uniqueVoters) : 0,
    totalVotingPower: (totalVotingPower as bigint) || BigInt(0),
    contractStatus: (status as string) || 'unknown'
  } : undefined;

  return {
    proposal: proposalData,
    proposalDetails,
    status: status as string | undefined,
    uniqueVoters: uniqueVoters ? Number(uniqueVoters) : 0,
    totalVotingPower: totalVotingPower || BigInt(0),
    isLoading: isLoadingProposal || isLoadingStatus || isLoadingVoters || isLoadingPower,
    error: proposalError || statusError || votersError || powerError,
    getProposalStatusInfo,
  };
};

// Hook para obtener múltiples propuestas (útil para listar todas)
export const useMultipleProposals = (proposalIds: number[]) => {
  const daoContractAddress = process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS as `0x${string}`;
  
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

// Hook para cargar todas las propuestas del DAO usando el contrato real
export const useAllProposals = () => {
  const { totalProposals, isLoadingTotal } = useDAOProposals();

  // Crear array de IDs de propuestas usando useMemo para evitar recrear en cada render
  const proposalIds = useMemo(() => {
    if (!totalProposals || totalProposals === 0) return [];
    return Array.from({ length: totalProposals }, (_, i) => i);
  }, [totalProposals]);

  // Cargar propuestas individualmente usando useMultipleProposals
  const { proposals: loadedProposals, isLoading: isLoadingMultiple, errors } = useMultipleProposals(proposalIds);

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

// Hook para obtener detalles completos de todas las propuestas
export const useAllProposalDetails = () => {
  const { totalProposals, isLoadingTotal } = useDAOProposals();

  // Crear array de IDs de propuestas usando useMemo para evitar recrear en cada render
  const proposalIds = useMemo(() => {
    if (!totalProposals || totalProposals === 0) return [];
    return Array.from({ length: totalProposals }, (_, i) => i);
  }, [totalProposals]);

  // Cargar propuestas individualmente usando useMultipleProposals
  const { proposals: loadedProposals, isLoading: isLoadingMultiple, errors } = useMultipleProposals(proposalIds);

  // Usar useMemo para procesar los detalles de las propuestas y evitar bucles infinitos
  const processedProposalDetails = useMemo(() => {
    if (!loadedProposals || loadedProposals.length === 0) return [];
    
    // Convertir propuestas a detalles completos
    const details: ProposalDetails[] = loadedProposals.map(proposal => ({
      ...proposal,
      uniqueVoters: 0, // Se puede obtener del contrato si es necesario
      totalVotingPower: BigInt(0), // Se puede obtener del contrato si es necesario
      contractStatus: 'unknown' // Se puede obtener del contrato si es necesario
    }));
    
    // Ordenar por ID descendente (más recientes primero)
    return details.sort((a, b) => Number(b.id) - Number(a.id));
  }, [loadedProposals]);

  // Usar useMemo para el estado de error
  const processedError = useMemo(() => {
    if (errors && errors.length > 0) {
      return 'Error al cargar algunas propuestas';
    }
    return null;
  }, [errors]);

  return {
    proposalDetails: processedProposalDetails,
    isLoading: isLoadingTotal || isLoadingMultiple,
    error: processedError,
    totalProposals,
  };
};
