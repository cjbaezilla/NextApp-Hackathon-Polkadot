import { useState, useEffect, useMemo } from 'react';
import { useContractReads, useContractRead } from 'wagmi';

// Cargar ABI del contrato desde variable de entorno
const UsersContract = require(process.env.NEXT_PUBLIC_USERS_CONTRACT_ABI_PATH!);

// Interfaz para los datos del usuario
export interface UserInfo {
  username: string;
  email: string;
  twitterLink: string;
  githubLink: string;
  telegramLink: string;
  avatarLink: string;
  coverImageLink: string;
  userAddress: string;
  joinTimestamp: number | bigint;
}

export const useAllUsers = (limit: number = 12) => {
  const [allUsers, setAllUsers] = useState<UserInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dirección del contrato desde variables de entorno
  const contractAddress = process.env.NEXT_PUBLIC_USERS_CONTRACT_ADDRESS as `0x${string}`;

  // Leer el número total de usuarios registrados
  const { data: totalMembers, refetch: refetchTotalMembers } = useContractRead({
    address: contractAddress,
    abi: UsersContract.abi,
    functionName: 'getTotalMembers',
  });

  // Leer todas las direcciones de usuarios usando getAllUsers
  const { data: allUsersAddresses, refetch: refetchAllUsers } = useContractRead({
    address: contractAddress,
    abi: UsersContract.abi,
    functionName: 'getAllUsers',
  });

  // Procesar las direcciones con ordenamiento inverso (más recientes primero)
  const sortedUserAddresses = useMemo(() => {
    if (!allUsersAddresses || !Array.isArray(allUsersAddresses)) {
      return [];
    }
    
    // Ordenar en orden inverso para mostrar los usuarios más recientes primero
    const sortedAddresses = [...allUsersAddresses].reverse();
    
    // Limitar a los primeros 'limit' usuarios (que ahora son los más recientes)
    return sortedAddresses.slice(0, limit);
  }, [allUsersAddresses, limit]);

  // Preparar las queries para useContractReads usando useMemo
  const contractReadsConfig = useMemo(() => 
    sortedUserAddresses.map((address) => ({
      address: contractAddress,
      abi: UsersContract.abi,
      functionName: 'getUserInfo' as const,
      args: [address],
      enabled: !!address && address !== '0x0000000000000000000000000000000000000000',
    })), 
    [sortedUserAddresses, contractAddress]
  );

  // Usar useContractReads para manejar múltiples queries de forma eficiente
  const { data: contractReadsData, isLoading: isLoadingReads, error: readsError, refetch } = useContractReads({
    contracts: contractReadsConfig,
  });

  // Procesar los datos cuando cambien los resultados de las queries
  useEffect(() => {
    if (!contractReadsData || contractReadsData.length === 0) {
      setAllUsers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const loadedUsers: UserInfo[] = [];

      contractReadsData.forEach((result, index) => {
        const address = sortedUserAddresses[index];
        
        if (result.status === 'success' && result.result) {
          // Agregar la dirección del usuario a los datos
          const userInfo = {
            ...result.result,
            userAddress: address
          } as UserInfo;
          
          loadedUsers.push(userInfo);
        }
      });

      setAllUsers(loadedUsers);
      setIsLoading(false);
    } catch (err) {
      console.error('Error al procesar usuarios:', err);
      setError('Error al procesar los usuarios');
      setIsLoading(false);
    }
  }, [contractReadsData, sortedUserAddresses]);

  // Función para formatear fecha de registro
  const formatJoinDate = (timestamp: number | bigint) => {
    if (!timestamp || timestamp === 0) return 'Fecha no disponible';
    const timestampNumber = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
    const date = new Date(timestampNumber * 1000);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Función para acortar dirección de wallet
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Función para refrescar datos
  const refreshUsers = async () => {
    try {
      await Promise.all([refetchAllUsers(), refetchTotalMembers(), refetch?.()]);
    } catch (err) {
      console.error('Error al refrescar usuarios:', err);
      setError('Error al refrescar los usuarios');
    }
  };

  return {
    allUsers,
    totalUsers: totalMembers ? Number(totalMembers) : 0,
    isLoading: isLoadingReads || isLoading,
    error: readsError ? 'Error al cargar información de usuarios' : error,
    refreshUsers,
    formatJoinDate,
    shortenAddress
  };
};
