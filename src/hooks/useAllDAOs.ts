import { useState, useEffect } from 'react';
import { useContractRead } from 'wagmi';

// Cargar ABI desde variable de entorno
const DAOMembersFactory = require(process.env.NEXT_PUBLIC_DAOMEMBERSFACTORY_CONTRACT_ABI_PATH!);
const DAOContract = require(process.env.NEXT_PUBLIC_DAO_CONTRACT_ABI_PATH!);

export interface DAOInfo {
  daoAddress: string;
  creator: string;
  name: string;
  nftContract: string;
  minProposalCreationTokens: bigint;
  minVotesToApprove: bigint;
  minTokensToApprove: bigint;
  totalProposals: bigint;
  owner: string;
  creationTimestamp: bigint;
}

export const useAllDAOs = (limit: number = 10) => {
  const [allDAOs, setAllDAOs] = useState<DAOInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dirección del contrato desde variable de entorno
  const factoryContractAddress = process.env.NEXT_PUBLIC_DAOMEMBERSFACTORY_CONTRACT_ADDRESS as `0x${string}`;

  // Leer el número total de DAOs creados
  const { data: totalDAOsCount, refetch: refetchTotalDAOs } = useContractRead({
    address: factoryContractAddress,
    abi: DAOMembersFactory.abi,
    functionName: 'getTotalDAOs',
  });

  // Leer todos los DAOs usando getAllDAOs
  const { data: allDAOsAddresses, refetch: refetchAllDAOs } = useContractRead({
    address: factoryContractAddress,
    abi: DAOMembersFactory.abi,
    functionName: 'getAllDAOs',
  });

  // Efecto para procesar los DAOs
  useEffect(() => {
    if (allDAOsAddresses && Array.isArray(allDAOsAddresses)) {
      setIsLoading(true);
      setError(null);

      try {
        // Ordenar en orden inverso para mostrar las DAOs más recientes primero
        const sortedDAOs = [...allDAOsAddresses].reverse();
        
        // Procesar solo los primeros 'limit' DAOs (que ahora son los más recientes)
        const daosToProcess = sortedDAOs.slice(0, limit);
        const daosList: DAOInfo[] = [];
        
        // Para cada DAO, agregarlo a la lista con información básica
        // La información del creador se obtendrá en el modal usando useContractRead
        daosToProcess.forEach((daoAddress: string, index: number) => {
          if (daoAddress && daoAddress !== '0x0000000000000000000000000000000000000000') {
            // El índice original en el array invertido nos da el número correcto de DAO
            const originalIndex = allDAOsAddresses.length - index;
            daosList.push({
              daoAddress: daoAddress,
              creator: '', // Se obtendrá dinámicamente en el modal
              name: `DAO #${originalIndex}`, // Número basado en el orden original
              nftContract: '',
              minProposalCreationTokens: BigInt(0),
              minVotesToApprove: BigInt(0),
              minTokensToApprove: BigInt(0),
              totalProposals: BigInt(0),
              owner: '',
              creationTimestamp: BigInt(0),
            });
          }
        });

        setAllDAOs(daosList);
        setIsLoading(false);
      } catch (err) {
        console.error('Error al procesar DAOs:', err);
        setError('Error al procesar los DAOs');
        setIsLoading(false);
      }
    } else {
      setAllDAOs([]);
      setIsLoading(false);
    }
  }, [allDAOsAddresses, limit]);

  // Función para formatear fecha
  const formatCreationDate = (timestamp: bigint) => {
    if (timestamp === BigInt(0)) return 'Fecha no disponible';
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

  // Función para acortar dirección
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Función para refrescar datos
  const refreshDAOs = async () => {
    try {
      await Promise.all([refetchAllDAOs(), refetchTotalDAOs()]);
    } catch (err) {
      console.error('Error al refrescar DAOs:', err);
      setError('Error al refrescar los DAOs');
    }
  };

  return {
    allDAOs,
    totalDAOs: totalDAOsCount ? Number(totalDAOsCount) : 0,
    isLoading,
    error,
    refreshDAOs,
    formatCreationDate,
    shortenAddress
  };
};