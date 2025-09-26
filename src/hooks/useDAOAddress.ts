import { useRouter } from 'next/router';

/**
 * Hook personalizado para obtener la dirección del contrato DAO desde la URL o variables de entorno
 * @returns La dirección del contrato DAO
 */
export const useDAOAddress = (): `0x${string}` => {
  const router = useRouter();
  
  // Obtener dirección del contrato DAO desde URL o variables de entorno
  const getDAOContractAddress = (): `0x${string}` => {
    const urlAddress = router.query.address as string;
    if (urlAddress && urlAddress.startsWith('0x')) {
      return urlAddress as `0x${string}`;
    }
    return process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS as `0x${string}`;
  };
  
  return getDAOContractAddress();
};
