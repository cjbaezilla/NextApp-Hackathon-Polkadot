import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TokenIcon } from '@/components/ui/token-icon';
import { UserAvatar } from '@/components/ui/user-avatar';
import { 
  X, 
  Copy, 
  ExternalLink, 
  Coins, 
  User,
  Calendar,
  Mail,
  Twitter,
  Github,
  MessageCircle
} from 'lucide-react';
import { useRouter } from 'next/router';
import { TokenInfo } from '@/hooks/useERC20Tokens';
import { useUserByAddress, UserInfo } from '@/hooks/useUserByAddress';

interface TokenInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: TokenInfo;
}

const TokenInfoModal: React.FC<TokenInfoModalProps> = ({ isOpen, onClose, token }) => {
  const router = useRouter();
  const { userInfo, isLoading: isLoadingUser, error: userError } = useUserByAddress(token.creator);

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
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
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
            <CardTitle className="text-lg">Información del Token</CardTitle>
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
          {/* Información del Token */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <TokenIcon 
                tokenAddress={token.tokenAddress}
                size={48}
                className="shadow-md"
              />
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {token.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {token.symbol}
                </p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Coins className="w-5 h-5" />
                  <span>Detalles del Token</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre</p>
                    <p className="font-medium">{token.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Símbolo</p>
                    <p className="font-medium">{token.symbol}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Dirección del Contrato</p>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm">{shortenAddress(token.tokenAddress)}</span>
                    <button
                      onClick={() => copyToClipboard(token.tokenAddress)}
                      className="p-1 rounded hover:bg-muted transition-colors"
                      title="Copiar dirección completa"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const explorerUrl = `https://sepolia.etherscan.io/address/${token.tokenAddress}`;
                        window.open(explorerUrl, '_blank');
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Suministro Inicial</p>
                    <p className="font-medium">
                      {formatNumber(token.initialSupply)} {token.symbol}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de Creación</p>
                    <p className="font-medium">{formatDate(token.createdAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Información del Creador */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Creador del Token</span>
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
                    <p className="text-xs text-muted-foreground font-mono">{shortenAddress(token.creator)}</p>
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
                    <p className="text-xs text-muted-foreground font-mono">{shortenAddress(token.creator)}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenInfoModal;
