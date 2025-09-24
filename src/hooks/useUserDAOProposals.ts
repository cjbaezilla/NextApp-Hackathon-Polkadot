import { useState, useEffect, useMemo } from 'react';
import { useContractRead, useContractReads } from 'wagmi';
import { useAccount } from 'wagmi';

// Cargar ABI del contrato DAO
const DAOContract = require(process.env.NEXT_PUBLIC_DAO_CONTRACT_ABI_PATH!);

// Interfaz para los datos de una propuesta
interface Proposal {
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

/**
 * Hook personalizado para obtener la cantidad de propuestas DAO creadas por el usuario
 * @returns {Object} Objeto con la cantidad de propuestas y estado de carga
 */
export const useUserDAOProposals = () => {
  const { address } = useAccount();
  const [userProposalsCount, setUserProposalsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dirección del contrato DAO
  const daoContractAddress = process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS as `0x${string}`;

  // Leer el total de propuestas
  const { data: totalProposals } = useContractRead({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'getTotalProposals',
  });

  // Efecto para contar las propuestas del usuario
  useEffect(() => {
    const countUserProposals = async () => {
      if (!address || !totalProposals) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const totalProposalsNumber = Number(totalProposals);
        let count = 0;

        // Iterar a través de todas las propuestas
        for (let i = 0; i < totalProposalsNumber; i++) {
          try {
            // Leer cada propuesta individual
            const proposal = await fetchProposal(i);
            
            // Verificar si el proposer coincide con la dirección del usuario
            if (proposal && proposal.proposer.toLowerCase() === address.toLowerCase()) {
              count++;
            }
          } catch (proposalError) {
            console.warn(`Error al leer propuesta ${i}:`, proposalError);
            // Continuar con la siguiente propuesta si hay un error
          }
        }

        setUserProposalsCount(count);
      } catch (err) {
        console.error('Error al contar propuestas del usuario:', err);
        setError('Error al cargar las propuestas');
        setUserProposalsCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    countUserProposals();
  }, [address, totalProposals]);

  // Función auxiliar para leer una propuesta específica
  const fetchProposal = async (proposalId: number): Promise<Proposal | null> => {
    try {
      // Esta función se ejecutará en el cliente, por lo que necesitamos
      // usar una estrategia diferente para las lecturas del contrato
      return null; // Se manejará en el useEffect
    } catch (error) {
      console.error(`Error al leer propuesta ${proposalId}:`, error);
      return null;
    }
  };

  return {
    userProposalsCount,
    isLoading,
    error,
  };
};

/**
 * Hook optimizado que cuenta dinámicamente las propuestas del usuario
 * Itera por TODAS las propuestas disponibles usando useContractReads
 */
export const useUserDAOProposalsOptimized = () => {
  const { address } = useAccount();
  const [userProposalsCount, setUserProposalsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Dirección del contrato DAO
  const daoContractAddress = process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS as `0x${string}`;

  // Leer el total de propuestas
  const { data: totalProposals } = useContractRead({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'getTotalProposals',
  });

  // Crear array de contratos para leer todas las propuestas dinámicamente
  const contracts = useMemo(() => {
    if (!totalProposals) return [];
    
    const total = Number(totalProposals);
    return Array.from({ length: total }, (_, i) => ({
      address: daoContractAddress,
      abi: DAOContract.abi,
      functionName: 'getProposal' as const,
      args: [i] as const,
    }));
  }, [totalProposals, daoContractAddress]);

  // Leer todas las propuestas usando useContractReads
  const { data: allProposals, isLoading: proposalsLoading } = useContractReads({
    contracts,
  });

  // Efecto para contar las propuestas del usuario
  useEffect(() => {
    if (!address || !allProposals || proposalsLoading) {
      setIsLoading(proposalsLoading || true);
      return;
    }

    let count = 0;

    console.log('🔍 Debugging proposal count:');
    console.log('- Address:', address);
    console.log('- Total proposals:', totalProposals);
    console.log('- All proposals data:', allProposals);

    // Iterar sobre todas las propuestas y contar las del usuario
    allProposals.forEach((proposalResult, index) => {
      if (proposalResult.status === 'success' && proposalResult.result) {
        const proposal = proposalResult.result as Proposal;
        console.log(`- Proposal ${index}:`, proposal);
        
        if (proposal && proposal.proposer) {
          const proposer = proposal.proposer;
          console.log(`- Proposal ${index} proposer:`, proposer);
          
          if (typeof proposer === 'string' && proposer.toLowerCase() === address.toLowerCase()) {
            console.log(`✅ Found matching proposal ${index} for user ${address}`);
            count++;
          }
        }
      }
    });

    console.log('📊 Final count:', count);
    setUserProposalsCount(count);
    setIsLoading(false);
  }, [address, allProposals, proposalsLoading, totalProposals]);

  return {
    userProposalsCount,
    isLoading,
  };
};
