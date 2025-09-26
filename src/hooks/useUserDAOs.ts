import { useState, useEffect, useMemo } from 'react';
import { useContractRead, useAccount } from 'wagmi';
import { readContract } from '@wagmi/core';
import { config } from '@/wagmi';

// Cargar ABI desde variable de entorno
const DAOMembersFactory = require(process.env.NEXT_PUBLIC_DAOMEMBERSFACTORY_CONTRACT_ABI_PATH!);
const DAOContract = require(process.env.NEXT_PUBLIC_DAO_CONTRACT_ABI_PATH!);

interface DAOInfo {
  daoAddress: string;
  creator: string;
  name: string;
  nftContract: string;
  minProposalCreationTokens: bigint;
  minVotesToApprove: bigint;
  minTokensToApprove: bigint;
  totalProposals: bigint;
  owner: string;
}

export const useUserDAOs = () => {
  const { address, isConnected } = useAccount();
  const [userDAOs, setUserDAOs] = useState<DAOInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dirección del contrato desde variable de entorno
  const factoryContractAddress = process.env.NEXT_PUBLIC_DAOMEMBERSFACTORY_CONTRACT_ADDRESS as `0x${string}`;

  // Leer todos los DAOs
  const { data: allDAOs, refetch: refetchAllDAOs } = useContractRead({
    address: factoryContractAddress,
    abi: DAOMembersFactory.abi,
    functionName: 'getAllDAOs',
  });

  // Función para obtener el creador de un DAO específico
  const getDAOCreator = async (daoAddress: string): Promise<string | null> => {
    try {
      const creator = await readContract(config, {
        address: factoryContractAddress,
        abi: DAOMembersFactory.abi,
        functionName: 'getDAOCreator',
        args: [daoAddress as `0x${string}`],
      });
      return creator as string;
    } catch (err) {
      console.error(`Error al obtener creador del DAO ${daoAddress}:`, err);
      return null;
    }
  };

  // Efecto para procesar los DAOs del usuario
  useEffect(() => {
    if (allDAOs && Array.isArray(allDAOs) && address) {
      setIsLoading(true);
      setError(null);

      const processUserDAOs = async () => {
        try {
          const validDAOs = allDAOs.filter(
            (daoAddress: string) => daoAddress && daoAddress !== '0x0000000000000000000000000000000000000000'
          );

          // Crear promesas para verificar el creador de cada DAO
          const creatorPromises = validDAOs.map((daoAddress: string) => 
            getDAOCreator(daoAddress)
          );

          // Esperar a que todas las verificaciones se completen
          const creators = await Promise.all(creatorPromises);

          // Filtrar solo los DAOs creados por el usuario actual
          const userDAOsList: DAOInfo[] = [];
          
          for (let i = 0; i < validDAOs.length; i++) {
            const daoAddress = validDAOs[i];
            const creator = creators[i];
            
            if (creator && creator.toLowerCase() === address.toLowerCase()) {
              userDAOsList.push({
                daoAddress: daoAddress,
                creator: creator,
                name: `DAO #${i + 1}`, // Nombre temporal
                nftContract: '',
                minProposalCreationTokens: BigInt(0),
                minVotesToApprove: BigInt(0),
                minTokensToApprove: BigInt(0),
                totalProposals: BigInt(0),
                owner: creator,
              });
            }
          }

          setUserDAOs(userDAOsList);
          setIsLoading(false);
        } catch (err) {
          console.error('Error al procesar DAOs del usuario:', err);
          setError('Error al procesar los DAOs');
          setIsLoading(false);
        }
      };

      processUserDAOs();
    } else if (!address) {
      setUserDAOs([]);
      setIsLoading(false);
    }
  }, [allDAOs, address]);

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
      setIsLoading(true);
      setError(null);
      await refetchAllDAOs();
    } catch (err) {
      console.error('Error al refrescar DAOs:', err);
      setError('Error al refrescar los DAOs');
      setIsLoading(false);
    }
  };

  return {
    userDAOs,
    daoCount: userDAOs.length,
    isLoading,
    error,
    isConnected,
    address,
    refreshDAOs,
    formatCreationDate,
    shortenAddress
  };
};
