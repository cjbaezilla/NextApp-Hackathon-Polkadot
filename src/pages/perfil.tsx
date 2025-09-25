import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/user-avatar';
import { TokenIcon } from '@/components/ui/token-icon';
import { 
  User, 
  Mail, 
  Twitter, 
  Github, 
  MessageCircle, 
  MapPin, 
  Calendar,
  ExternalLink,
  Edit3,
  Share2,
  Globe,
  Award,
  Users,
  TrendingUp,
  Copy,
  Coins,
  CheckCircle,
  X,
  Settings
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useContractRead, useAccount } from 'wagmi';
import { useRouter } from 'next/router';
import ClientOnly from '@/components/ClientOnly';
import TokenExplorerModal from '@/components/TokenExplorerModal';
import { useUserDAOProposalsOptimized } from '@/hooks/useUserDAOProposals';
import { useUserTokens } from '@/hooks/useUserTokens';
import UsersContract from '@/contracts/UsersContract.json';
import NFTContract from '@/contracts/NFTContract.json';
import SimpleERC20Contract from '@/contracts/SimpleERC20.json';

// Interfaz para los datos del usuario
interface UserInfo {
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

const PerfilPage: NextPage = () => {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [showTokenSuccessMessage, setShowTokenSuccessMessage] = useState(false);
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Hook para obtener la cantidad de propuestas DAO del usuario
  const { userProposalsCount, isLoading: isLoadingProposals } = useUserDAOProposalsOptimized();

  // Hook para obtener tokens del usuario
  const { 
    userTokens, 
    tokenCount, 
    isLoading: isLoadingTokens, 
    error: tokensError,
    refreshTokens,
    formatCreationDate,
    formatInitialSupply,
    formatBalance,
    shortenAddress
  } = useUserTokens();

  // Direcciones de los contratos desde variables de entorno
  const usersContractAddress = process.env.NEXT_PUBLIC_USERS_CONTRACT_ADDRESS as `0x${string}`;
  const nftContractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS as `0x${string}`;

  // Leer datos del contrato de usuarios
  const { data: totalMembers } = useContractRead({
    address: usersContractAddress,
    abi: UsersContract.abi,
    functionName: 'getTotalMembers',
  });

  const { data: userRegistered } = useContractRead({
    address: usersContractAddress,
    abi: UsersContract.abi,
    functionName: 'isRegisteredUser',
    args: address ? [address] : ['0x0000000000000000000000000000000000000000'],
  });

  // Leer información del usuario actual
  const { data: userData, refetch: refetchUserInfo } = useContractRead({
    address: usersContractAddress,
    abi: UsersContract.abi,
    functionName: 'getUserInfo',
    args: address ? [address] : ['0x0000000000000000000000000000000000000000'],
  }) as { data: UserInfo | undefined; refetch: () => void };

  // Leer balance de NFT del usuario
  const { data: userNftBalance, refetch: refetchUserNftBalance } = useContractRead({
    address: nftContractAddress,
    abi: NFTContract.abi,
    functionName: 'balanceOf',
    args: address ? [address] : ['0x0000000000000000000000000000000000000000'],
  });

  // Efecto para cargar datos del usuario
  useEffect(() => {
    if (userData && userRegistered) {
      setUserInfo(userData);
      setIsLoading(false);
    } else if (userRegistered === false) {
      setError('Usuario no registrado');
      setIsLoading(false);
    }
  }, [userData, userRegistered]);

  // Efecto para mostrar mensaje de éxito si se viene de crear un token
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenCreated = urlParams.get('tokenCreated');
    
    if (tokenCreated === 'true') {
      setShowTokenSuccessMessage(true);
      // Limpiar el parámetro de la URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Refrescar tokens para mostrar el nuevo token
      refreshTokens();
    }
  }, [refreshTokens]);

  // Función para formatear fecha de registro
  const formatJoinDate = (timestamp: number | bigint) => {
    const timestampNumber = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
    const date = new Date(timestampNumber * 1000);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Función para obtener iniciales del usuario
  const getUserInitials = (username: string) => {
    return username
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };


  // Función para copiar dirección al portapapeles
  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedItem('address');
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error('Error al copiar la dirección:', err);
    }
  };

  // Función para copiar email al portapapeles
  const copyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedItem('email');
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error('Error al copiar el email:', err);
    }
  };

  // Función para abrir el modal del token
  const openTokenModal = (token: any) => {
    setSelectedToken(token);
    setIsModalOpen(true);
  };

  // Función para cerrar el modal
  const closeTokenModal = () => {
    setIsModalOpen(false);
    setSelectedToken(null);
  };

  // Función para manejar cuando se envían tokens desde el modal
  const handleTokenSent = () => {
    // Refrescar la lista de tokens para actualizar balances
    refreshTokens();
  };

  // Componente para mostrar cada token individual
  const TokenItem = ({ token, index }: { token: any; index: number }) => {
    // Leer decimales del token
    const { data: tokenDecimals } = useContractRead({
      address: token.tokenAddress as `0x${string}`,
      abi: SimpleERC20Contract.abi,
      functionName: 'decimals',
    });

    // Leer balance del usuario para este token
    const { data: userBalance, refetch: refetchUserBalance } = useContractRead({
      address: token.tokenAddress as `0x${string}`,
      abi: SimpleERC20Contract.abi,
      functionName: 'balanceOf',
      args: address ? [address] : ['0x0000000000000000000000000000000000000000'],
    });

    return (
      <div key={index} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <TokenIcon 
              tokenAddress={token.tokenAddress}
              size={40}
              className="shadow-sm"
            />
            <div>
              <h3 className="font-semibold text-foreground">{token.name}</h3>
              <p className="text-sm text-muted-foreground">Símbolo: {token.symbol}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">
              {userBalance ? formatBalance(userBalance as bigint, tokenDecimals as number) : '0'} {token.symbol}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatCreationDate(token.creationTimestamp)}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <span className="font-mono text-sm">{shortenAddress(token.tokenAddress)}</span>
            <button
              onClick={() => navigator.clipboard.writeText(token.tokenAddress)}
              className="p-1 rounded hover:bg-muted transition-colors"
              title="Copiar dirección completa"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openTokenModal(token)}
          >
            <Settings className="w-3 h-3 mr-1" />
            Ver Detalles
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>Perfil - DApp Polka</title>
        <meta
          content="Ver perfil de usuario en la plataforma DApp Polka"
          name="description"
        />
        <link href="/favicon.ico" rel="icon" />
      </Head>

      <ClientOnly fallback={
        <div className="container mx-auto px-3 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Skeleton para la imagen de portada */}
            <div className="h-48 bg-muted rounded-lg mb-4 animate-pulse"></div>
            
            {/* Skeleton para el perfil */}
            <Card className="p-6">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-6">
                  {/* Avatar skeleton */}
                  <div className="w-24 h-24 bg-muted rounded-full animate-pulse"></div>
                  
                  {/* Información skeleton */}
                  <div className="flex-1 space-y-3">
                    <div className="h-6 bg-muted rounded animate-pulse w-1/3"></div>
                    <div className="h-4 bg-muted rounded animate-pulse w-1/2"></div>
                    <div className="h-4 bg-muted rounded animate-pulse w-2/3"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      }>
        <div className="container mx-auto px-3 py-6">
          <div className="max-w-4xl mx-auto">
            
            {/* Si no está conectado, redirigir o mostrar mensaje */}
            {!isConnected ? (
              <div className="max-w-md mx-auto">
                <Card className="p-6">
                  <CardContent className="p-0">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto">
                        <User className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Conecta tu wallet
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Conecta tu wallet para ver tu perfil
                        </p>
                        <Button onClick={() => router.push('/')}>
                          Ir al Dashboard
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : isLoading ? (
              <>
                {/* Skeleton para la imagen de portada */}
                <div className="h-48 bg-muted rounded-lg mb-4 animate-pulse"></div>
                
                {/* Skeleton para el perfil */}
                <Card className="p-6">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-6">
                      {/* Avatar skeleton */}
                      <div className="w-24 h-24 bg-muted rounded-full animate-pulse"></div>
                      
                      {/* Información skeleton */}
                      <div className="flex-1 space-y-3">
                        <div className="h-6 bg-muted rounded animate-pulse w-1/3"></div>
                        <div className="h-4 bg-muted rounded animate-pulse w-1/2"></div>
                        <div className="h-4 bg-muted rounded animate-pulse w-2/3"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : error || !userInfo ? (
              <div className="max-w-md mx-auto">
                <Card className="p-6">
                  <CardContent className="p-0">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto">
                        <User className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Usuario no registrado
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Primero debes registrarte para ver tu perfil
                        </p>
                        <Button onClick={() => router.push('/registro')}>
                          Registrarse
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <>
          {/* Contenedor principal con espacio para el avatar */}
          <div className="relative mb-8">
            {/* Imagen de portada */}
            <div className="relative h-48 md:h-64 rounded-lg overflow-hidden">
              {userInfo.coverImageLink ? (
                <Image
                  src={userInfo.coverImageLink}
                  alt={`Portada de ${userInfo.username}`}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
                  <Globe className="w-16 h-16 text-white/50" />
                </div>
              )}
              
              {/* Overlay con gradiente */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              
              {/* Botón de edición en la esquina superior derecha */}
              <div className="absolute top-4 right-4">
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/90 hover:bg-white text-black"
                  onClick={() => router.push('/editar-perfil')}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Avatar flotante centrado - fuera del contenedor con overflow-hidden */}
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 z-10">
              <UserAvatar
                userAddress={userInfo.userAddress}
                customImageUrl={userInfo.avatarLink}
                size="xl"
                className="w-32 h-32 border-4 border-background shadow-2xl"
                alt={userInfo.username}
                showBorder={false}
              />
            </div>
          </div>

          {/* Información del perfil centrada */}
          <div className="text-center space-y-2 mb-8 pt-10">
            {/* Username */}
            <h1 className="text-3xl font-bold text-foreground">
              {userInfo.username}
            </h1>
            
            {/* Address */}
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <span className="font-mono text-sm">{shortenAddress(userInfo.userAddress)}</span>
              <button
                onClick={() => copyAddress(userInfo.userAddress)}
                className={`p-1 rounded transition-colors ${
                  copiedItem === 'address' 
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                    : 'hover:bg-muted'
                }`}
                title={copiedItem === 'address' ? '¡Copiado!' : 'Copiar dirección completa'}
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            {/* Email del usuario - solo mostrar si no está vacío */}
            {userInfo.email && userInfo.email.trim() !== '' && (
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>{userInfo.email}</span>
                <button
                  onClick={() => copyEmail(userInfo.email)}
                  className={`p-1 rounded transition-colors ${
                    copiedItem === 'email' 
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                      : 'hover:bg-muted'
                  }`}
                  title={copiedItem === 'email' ? '¡Copiado!' : 'Copiar email'}
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Fecha de registro */}
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Miembro desde {formatJoinDate(userInfo.joinTimestamp)}</span>
            </div>

            {/* Iconos sociales */}
            <div className="flex items-center justify-center space-x-4 pt-2">
              {userInfo.twitterLink && (
                <a
                  href={userInfo.twitterLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                >
                  <Twitter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </a>
              )}

              {userInfo.githubLink && (
                <a
                  href={userInfo.githubLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-100 dark:bg-gray-900/20 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-900/40 transition-colors"
                >
                  <Github className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </a>
              )}

              {userInfo.telegramLink && (
                <a
                  href={userInfo.telegramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </a>
              )}
            </div>
          </div>

          {/* Estadísticas del usuario */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-card rounded-lg border">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <ClientOnly fallback={
                  <p className="text-2xl font-bold text-foreground">0</p>
                }>
                  <p className="text-2xl font-bold text-foreground">
                    {userNftBalance ? Number(userNftBalance).toString() : '0'}
                  </p>
                </ClientOnly>
                <p className="text-sm text-muted-foreground">NFTs Minteados</p>
              </div>
            </div>

            <div className="p-4 bg-card rounded-lg border">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <ClientOnly fallback={
                  <p className="text-2xl font-bold text-foreground">0</p>
                }>
                  <p className="text-2xl font-bold text-foreground">
                    {isLoadingProposals ? '...' : userProposalsCount}
                  </p>
                </ClientOnly>
                <p className="text-sm text-muted-foreground">Propuestas DAO</p>
              </div>
            </div>

            <div className="p-4 bg-card rounded-lg border">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Coins className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <ClientOnly fallback={
                  <p className="text-2xl font-bold text-foreground">0</p>
                }>
                  <p className="text-2xl font-bold text-foreground">
                    {isLoadingTokens ? '...' : tokenCount}
                  </p>
                </ClientOnly>
                <p className="text-sm text-muted-foreground">Tokens Creados</p>
              </div>
            </div>
          </div>

          {/* Mensaje de éxito para token creado - arriba de Mis Tokens */}
          {showTokenSuccessMessage && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      ¡Token creado exitosamente!
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      Tu token ha sido desplegado en la blockchain y ya aparece en tu perfil.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTokenSuccessMessage(false)}
                  className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors"
                >
                  <X className="w-4 h-4 text-green-600" />
                </button>
              </div>
            </div>
          )}

          {/* Sección de tokens del usuario */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center space-x-2">
                <Coins className="w-5 h-5" />
                <span>Mis Tokens</span>
              </h2>
              <Button
                variant="default"
                size="sm"
                className="bg-black hover:bg-gray-800 text-white"
                onClick={() => router.push('/crear-token')}
              >
                <Coins className="w-4 h-4 mr-2" />
                Crear Nuevo Token
              </Button>
            </div>

              <ClientOnly fallback={
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 border rounded-lg animate-pulse">
                      <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              }>
                {isLoadingTokens ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 border rounded-lg animate-pulse">
                        <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : tokensError ? (
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <X className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800 dark:text-red-200">
                        Error al cargar tokens
                      </span>
                    </div>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                      {tokensError}
                    </p>
                  </div>
                ) : userTokens.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Coins className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No has creado tokens aún
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Crea tu primer token personalizado para comenzar
                    </p>
                    <Button onClick={() => router.push('/crear-token')}>
                      Crear Token
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userTokens.map((token, index) => (
                      <TokenItem key={index} token={token} index={index} />
                    ))}
                  </div>
                )}
              </ClientOnly>
          </div>

              </>
            )}
          </div>
        </div>
      </ClientOnly>

      {/* Modal del Token Explorer */}
      {selectedToken && (
        <TokenExplorerModal
          isOpen={isModalOpen}
          onClose={closeTokenModal}
          token={selectedToken}
          onTokenSent={handleTokenSent}
        />
      )}
    </div>
  );
};

export default PerfilPage;
