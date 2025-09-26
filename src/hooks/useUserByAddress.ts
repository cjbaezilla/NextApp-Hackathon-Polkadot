import { useContractRead } from 'wagmi';
import { useState, useEffect } from 'react';

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

export const useUserByAddress = (userAddress: string | undefined) => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dirección del contrato desde variables de entorno
  const contractAddress = process.env.NEXT_PUBLIC_USERS_CONTRACT_ADDRESS as `0x${string}`;

  // Leer información del usuario
  const { data: userData, isLoading: isLoadingRead, error: readError } = useContractRead({
    address: contractAddress,
    abi: UsersContract.abi,
    functionName: 'getUserInfo',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress && userAddress !== '0x0000000000000000000000000000000000000000',
    },
  });

  // Procesar los datos cuando cambien
  useEffect(() => {
    if (!userAddress) {
      setUserInfo(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (isLoadingRead) {
      setIsLoading(true);
      setError(null);
      return;
    }

    if (readError) {
      setIsLoading(false);
      setError('Error al cargar información del usuario');
      setUserInfo(null);
      return;
    }

    if (userData) {
      try {
        const user = {
          ...userData,
          userAddress: userAddress
        } as UserInfo;
        
        setUserInfo(user);
        setIsLoading(false);
        setError(null);
      } catch (err) {
        setIsLoading(false);
        setError('Error al procesar información del usuario');
        setUserInfo(null);
      }
    } else {
      setUserInfo(null);
      setIsLoading(false);
      setError(null);
    }
  }, [userData, userAddress, isLoadingRead, readError]);

  return {
    userInfo,
    isLoading,
    error,
  };
};
