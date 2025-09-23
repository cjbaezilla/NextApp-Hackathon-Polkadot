import { useState, useEffect, useMemo } from 'react';
import { useContractReads } from 'wagmi';

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

// Hook personalizado para cargar información de múltiples usuarios
export const useUsersData = (userAddresses: string[], limit: number = 12) => {
  const [usersData, setUsersData] = useState<UserInfo[]>([]);

  // Dirección del contrato desde variables de entorno
  const contractAddress = process.env.NEXT_PUBLIC_USERS_CONTRACT_ADDRESS as `0x${string}`;

  // Limitar las direcciones a cargar usando useMemo para evitar recrear el array
  const addressesToLoad = useMemo(() => userAddresses.slice(0, limit), [userAddresses, limit]);

  // Preparar las queries para useContractReads usando useMemo
  const contractReadsConfig = useMemo(() => 
    addressesToLoad.map((address) => ({
      address: contractAddress,
      abi: UsersContract.abi,
      functionName: 'getUserInfo' as const,
      args: [address],
      enabled: !!address && address !== '0x0000000000000000000000000000000000000000',
    })), 
    [addressesToLoad, contractAddress]
  );

  // Usar useContractReads para manejar múltiples queries de forma eficiente
  const { data: contractReadsData, isLoading: isLoadingReads, error: readsError, refetch } = useContractReads({
    contracts: contractReadsConfig,
  });

  // Procesar los datos cuando cambien los resultados de las queries
  useEffect(() => {
    if (!contractReadsData || contractReadsData.length === 0) {
      setUsersData([]);
      return;
    }

    const loadedUsers: UserInfo[] = [];

    contractReadsData.forEach((result, index) => {
      const address = addressesToLoad[index];
      
      if (result.status === 'success' && result.result) {
        // Agregar la dirección del usuario a los datos
        const userInfo = {
          ...result.result,
          userAddress: address
        } as UserInfo;
        
        loadedUsers.push(userInfo);
      }
    });

    setUsersData(loadedUsers);
  }, [contractReadsData, addressesToLoad]);

  return {
    usersData,
    isLoading: isLoadingReads,
    error: readsError ? 'Error al cargar información de usuarios' : null,
    refetch: () => {
      refetch?.();
    }
  };
};
