import React, { useState, useEffect } from 'react';
import { useContractRead } from 'wagmi';
import { Card, CardContent } from '@/components/ui/card';
import { DAOAvatar } from '@/components/ui/dao-avatar';

// Cargar ABI desde variable de entorno
const DAOContract = require(process.env.NEXT_PUBLIC_DAO_CONTRACT_ABI_PATH!);

interface DAOItemProps {
  daoAddress: string;
  index: number;
  onDataUpdate?: (data: { name: string; totalProposals: bigint }) => void;
  onClick?: () => void;
}

export const DAOItem: React.FC<DAOItemProps> = ({ daoAddress, index, onDataUpdate, onClick }) => {
  const [daoName, setDaoName] = useState(`DAO #${index + 1}`);
  const [totalProposals, setTotalProposals] = useState<bigint>(BigInt(0));

  // Leer nombre del DAO
  const { data: nameData } = useContractRead({
    address: daoAddress as `0x${string}`,
    abi: DAOContract.abi,
    functionName: 'name',
  });

  // Leer total de propuestas
  const { data: proposalsData } = useContractRead({
    address: daoAddress as `0x${string}`,
    abi: DAOContract.abi,
    functionName: 'getTotalProposals',
  });

  // Actualizar datos cuando lleguen del contrato
  useEffect(() => {
    if (nameData && typeof nameData === 'string') {
      setDaoName(nameData);
    }
  }, [nameData]);

  useEffect(() => {
    if (proposalsData !== undefined) {
      setTotalProposals(proposalsData as bigint);
    }
  }, [proposalsData]);

  // Notificar cambios a el componente padre
  useEffect(() => {
    if (onDataUpdate) {
      onDataUpdate({
        name: daoName,
        totalProposals: totalProposals
      });
    }
  }, [daoName, totalProposals, onDataUpdate]);

  // Función para acortar dirección
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Card 
      className="p-2 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 cursor-pointer border hover:border-primary/20 group"
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex items-center space-x-2">
          <DAOAvatar 
            daoAddress={daoAddress}
            size="sm"
            alt={`Avatar del DAO ${daoName}`}
          />
          
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-medium text-card-foreground mb-1">
              {daoName}
            </h3>
            
            <p className="text-xs text-muted-foreground truncate">
              {shortenAddress(daoAddress)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
