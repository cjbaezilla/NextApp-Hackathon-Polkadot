import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DAOAvatar } from '@/components/ui/dao-avatar';
import { UserAvatar } from '@/components/ui/user-avatar';
import { 
  X, 
  Copy, 
  Check,
  ExternalLink, 
  Users, 
  User,
  Calendar,
  Mail,
  Twitter,
  Github,
  MessageCircle,
  Building2,
  FileText,
  Target
} from 'lucide-react';
import { useRouter } from 'next/router';
import { DAOInfo } from '@/hooks/useAllDAOs';
import { useUserByAddress } from '@/hooks/useUserByAddress';
import { useContractRead } from 'wagmi';

// Cargar ABI de los contratos
const DAOContract = require(process.env.NEXT_PUBLIC_DAO_CONTRACT_ABI_PATH!);
const DAOMembersFactory = require(process.env.NEXT_PUBLIC_DAOMEMBERSFACTORY_CONTRACT_ABI_PATH!);

interface DAOInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  dao: DAOInfo;
}

const DAOInfoModal: React.FC<DAOInfoModalProps> = ({ isOpen, onClose, dao }) => {
  const router = useRouter();
  const [copiedDAOAddress, setCopiedDAOAddress] = React.useState(false);
  const [copiedNFTAddress, setCopiedNFTAddress] = React.useState(false);
  
  // Dirección del contrato DAOMembersFactory
  const factoryContractAddress = process.env.NEXT_PUBLIC_DAOMEMBERSFACTORY_CONTRACT_ADDRESS as `0x${string}`;

  // Obtener la dirección del creador del DAO
  const { data: creatorAddress } = useContractRead({
    address: factoryContractAddress,
    abi: DAOMembersFactory.abi,
    functionName: 'daoCreator',
    args: [dao.daoAddress],
    query: {
      enabled: !!dao.daoAddress && isOpen,
    },
  });

  const { userInfo, isLoading: isLoadingUser, error: userError } = useUserByAddress(creatorAddress as string);

  // Leer información detallada del DAO desde el contrato
  const { data: daoName } = useContractRead({
    address: dao.daoAddress as `0x${string}`,
    abi: DAOContract.abi,
    functionName: 'name',
    query: {
      enabled: !!dao.daoAddress && isOpen,
    },
  });


  const { data: totalProposals } = useContractRead({
    address: dao.daoAddress as `0x${string}`,
    abi: DAOContract.abi,
    functionName: 'getTotalProposals',
    query: {
      enabled: !!dao.daoAddress && isOpen,
    },
  });

  const { data: minProposalCreationTokens } = useContractRead({
    address: dao.daoAddress as `0x${string}`,
    abi: DAOContract.abi,
    functionName: 'MIN_PROPOSAL_CREATION_TOKENS',
    query: {
      enabled: !!dao.daoAddress && isOpen,
    },
  });

  const { data: minVotesToApprove } = useContractRead({
    address: dao.daoAddress as `0x${string}`,
    abi: DAOContract.abi,
    functionName: 'MIN_VOTES_TO_APPROVE',
    query: {
      enabled: !!dao.daoAddress && isOpen,
    },
  });

  const { data: minTokensToApprove } = useContractRead({
    address: dao.daoAddress as `0x${string}`,
    abi: DAOContract.abi,
    functionName: 'MIN_TOKENS_TO_APPROVE',
    query: {
      enabled: !!dao.daoAddress && isOpen,
    },
  });

  const { data: nftContract } = useContractRead({
    address: dao.daoAddress as `0x${string}`,
    abi: DAOContract.abi,
    functionName: 'nftContract',
    query: {
      enabled: !!dao.daoAddress && isOpen,
    },
  });

  const { data: owner } = useContractRead({
    address: dao.daoAddress as `0x${string}`,
    abi: DAOContract.abi,
    functionName: 'owner',
    query: {
      enabled: !!dao.daoAddress && isOpen,
    },
  });

  // Función para acortar dirección
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Función para formatear fecha
  const formatDate = (timestamp: number | bigint) => {
    const timestampNumber = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
    return new Date(timestampNumber * 1000).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para formatear número con separadores de miles
  const formatNumber = (value: bigint) => {
    return Number(value).toLocaleString('es-ES');
  };

  // Función para copiar al portapapeles
  const copyToClipboard = async (text: string, type: 'dao' | 'nft') => {
    try {
      await navigator.clipboard.writeText(text);
      
      // Mostrar animación de copia exitosa
      if (type === 'dao') {
        setCopiedDAOAddress(true);
        setTimeout(() => setCopiedDAOAddress(false), 2000);
      } else if (type === 'nft') {
        setCopiedNFTAddress(true);
        setTimeout(() => setCopiedNFTAddress(false), 2000);
      }
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Información del DAO</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Información del DAO */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <DAOAvatar 
                daoAddress={dao.daoAddress}
                size="lg"
                alt={daoName as string || dao.name}
                className="shadow-md"
              />
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {daoName as string || dao.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  DAO #{dao.daoAddress.slice(-4)}
                </p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Building2 className="w-5 h-5" />
                  <span>Detalles del DAO</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium">{daoName as string || dao.name}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Dirección del Contrato</p>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm">{shortenAddress(dao.daoAddress)}</span>
                    <button
                      onClick={() => copyToClipboard(dao.daoAddress, 'dao')}
                      className="p-1 rounded hover:bg-muted transition-colors"
                      title="Copiar dirección completa"
                    >
                      {copiedDAOAddress ? (
                        <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const explorerUrl = `https://sepolia.etherscan.io/address/${dao.daoAddress}`;
                        window.open(explorerUrl, '_blank');
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Propuestas</p>
                    <p className="font-medium">{totalProposals ? formatNumber(totalProposals as bigint) : '0'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contrato NFT</p>
                    {nftContract ? (
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm">{shortenAddress(nftContract as string)}</span>
                        <button
                          onClick={() => copyToClipboard(nftContract as string, 'nft')}
                          className="p-1 rounded hover:bg-muted transition-colors"
                          title="Copiar dirección completa"
                        >
                          {copiedNFTAddress ? (
                            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <p className="font-mono text-sm">No disponible</p>
                    )}
                  </div>
                </div>

                {/* Configuración de votación */}
                <div className="space-y-3">
                  <h5 className="text-sm font-semibold text-foreground flex items-center space-x-2">
                    <Target className="w-4 h-4" />
                    <span>Configuración de Votación</span>
                  </h5>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Tokens mín. para crear propuesta</p>
                      <p className="font-medium text-sm">
                        {minProposalCreationTokens ? formatNumber(minProposalCreationTokens as bigint) : '0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Votos mín. para aprobar</p>
                      <p className="font-medium text-sm">
                        {minVotesToApprove ? formatNumber(minVotesToApprove as bigint) : '0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tokens mín. para aprobar</p>
                      <p className="font-medium text-sm">
                        {minTokensToApprove ? formatNumber(minTokensToApprove as bigint) : '0'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Información del Creador */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Creador del DAO</span>
            </h4>

            {isLoadingUser ? (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-muted rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
                      <div className="h-3 bg-muted rounded animate-pulse w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : userError ? (
              <Card>
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
                      <User className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <p className="text-sm text-muted-foreground">Error al cargar información del creador</p>
                    <p className="text-xs text-muted-foreground font-mono">{creatorAddress ? shortenAddress(creatorAddress as string) : 'Dirección no disponible'}</p>
                  </div>
                </CardContent>
              </Card>
            ) : userInfo ? (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <UserAvatar
                      userAddress={userInfo.userAddress}
                      customImageUrl={userInfo.avatarLink}
                      size="md"
                      alt={userInfo.username}
                      showBorder={true}
                    />
                    
                    <div className="flex-1 space-y-3">
                      <div>
                        <h5 className="text-lg font-bold text-foreground">
                          {userInfo.username}
                        </h5>
                        <p className="text-sm text-muted-foreground font-mono">
                          {shortenAddress(userInfo.userAddress)}
                        </p>
                      </div>

                      <div className="space-y-2">
                        {userInfo.email && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Email:</span>
                            <span className="text-foreground">{userInfo.email}</span>
                          </div>
                        )}

                        <div className="flex items-center space-x-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Miembro desde:</span>
                          <span className="text-foreground">
                            {new Date(Number(userInfo.joinTimestamp) * 1000).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Enlaces sociales */}
                      <div className="flex flex-wrap gap-2">
                        {userInfo.twitterLink && userInfo.twitterLink !== '' && (
                          <a
                            href={userInfo.twitterLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                          >
                            <Twitter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm text-blue-600 dark:text-blue-400">Twitter</span>
                            <ExternalLink className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          </a>
                        )}

                        {userInfo.githubLink && userInfo.githubLink !== '' && (
                          <a
                            href={userInfo.githubLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-900/20 hover:bg-gray-200 dark:hover:bg-gray-900/40 transition-colors"
                          >
                            <Github className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">GitHub</span>
                            <ExternalLink className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                          </a>
                        )}

                        {userInfo.telegramLink && userInfo.telegramLink !== '' && (
                          <a
                            href={userInfo.telegramLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                          >
                            <MessageCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm text-blue-600 dark:text-blue-400">Telegram</span>
                            <ExternalLink className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          </a>
                        )}
                      </div>

                      <Button 
                        className="w-full" 
                        onClick={() => {
                          router.push(`/perfil?user=${userInfo.userAddress}`);
                          onClose();
                        }}
                      >
                        Ver Perfil Completo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                      <User className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Creador no registrado</p>
                    <p className="text-xs text-muted-foreground font-mono">{creatorAddress ? shortenAddress(creatorAddress as string) : 'Dirección no disponible'}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Botón para ver el DAO completo */}
          <div className="pt-4">
            <Button 
              className="w-full" 
              onClick={() => {
                router.push(`/dao?address=${dao.daoAddress}`);
                onClose();
              }}
            >
              Ver Página DAO
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DAOInfoModal;
