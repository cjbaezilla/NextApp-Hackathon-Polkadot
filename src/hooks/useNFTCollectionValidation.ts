import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { isAddress } from 'viem';

// ABI básico para ERC721 (balanceOf)
const ERC721_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

interface NFTValidationState {
  isValidating: boolean;
  hasNFTs: boolean | null;
  nftBalance: number;
  error: string | null;
}

export const useNFTCollectionValidation = (contractAddress: string) => {
  const { address, isConnected } = useAccount();
  const [validationState, setValidationState] = useState<NFTValidationState>({
    isValidating: false,
    hasNFTs: null,
    nftBalance: 0,
    error: null,
  });

  // Validar que la dirección del contrato sea válida
  const isContractAddressValid = contractAddress.trim() !== '' && isAddress(contractAddress);

  // Leer balance de NFTs del usuario en la colección especificada
  const { 
    data: nftBalance, 
    isLoading: isLoadingBalance, 
    error: balanceError,
    refetch: refetchBalance 
  } = useReadContract({
    address: isContractAddressValid ? contractAddress as `0x${string}` : undefined,
    abi: ERC721_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isContractAddressValid,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  });

  // Actualizar estado de validación cuando cambien los datos
  useEffect(() => {
    if (!isConnected || !address) {
      setValidationState({
        isValidating: false,
        hasNFTs: null,
        nftBalance: 0,
        error: null,
      });
      return;
    }

    if (!isContractAddressValid) {
      setValidationState({
        isValidating: false,
        hasNFTs: null,
        nftBalance: 0,
        error: contractAddress.trim() === '' ? null : 'Dirección de contrato inválida',
      });
      return;
    }

    if (isLoadingBalance) {
      setValidationState(prev => ({
        ...prev,
        isValidating: true,
        error: null,
      }));
      return;
    }

    if (balanceError) {
      setValidationState({
        isValidating: false,
        hasNFTs: false,
        nftBalance: 0,
        error: 'Error al verificar balance de NFTs. Verifica que la dirección sea un contrato ERC721 válido.',
      });
      return;
    }

    if (nftBalance !== undefined) {
      const balance = Number(nftBalance);
      setValidationState({
        isValidating: false,
        hasNFTs: balance > 0,
        nftBalance: balance,
        error: null,
      });
    }
  }, [
    isConnected, 
    address, 
    isContractAddressValid, 
    contractAddress, 
    isLoadingBalance, 
    balanceError, 
    nftBalance
  ]);

  // Función para revalidar manualmente
  const revalidate = () => {
    if (isContractAddressValid && address) {
      refetchBalance();
    }
  };

  return {
    ...validationState,
    isContractAddressValid,
    revalidate,
  };
};
