import type { NextPage } from 'next';
import Head from 'next/head';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  TrendingUp
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useContractRead, useAccount } from 'wagmi';
import { useRouter } from 'next/router';
import ClientOnly from '@/components/ClientOnly';

// Cargar ABI del contrato desde variable de entorno
const UsersContract = require(process.env.NEXT_PUBLIC_USERS_CONTRACT_ABI_PATH!);
const NFTContract = require(process.env.NEXT_PUBLIC_NFT_CONTRACT_ABI_PATH!);

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

  // Función para acortar dirección de wallet
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
                <img
                  src={userInfo.coverImageLink}
                  alt={`Portada de ${userInfo.username}`}
                  className="w-full h-full object-cover"
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
              <Avatar className="w-32 h-32 border-4 border-background shadow-2xl">
                <AvatarImage 
                  src={userInfo.avatarLink} 
                  alt={userInfo.username}
                />
                <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {getUserInitials(userInfo.username)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Información del perfil centrada */}
          <div className="text-center space-y-4 mb-8 pt-10">
            {/* Username */}
            <h1 className="text-3xl font-bold text-foreground">
              {userInfo.username}
            </h1>
            
            {/* Address */}
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <span className="font-mono text-sm">{shortenAddress(userInfo.userAddress)}</span>
            </div>

            {/* Iconos sociales */}
            <div className="flex items-center justify-center space-x-4">
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

            {/* Email del usuario */}
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span>{userInfo.email}</span>
            </div>

            {/* Fecha de registro */}
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Miembro desde {formatJoinDate(userInfo.joinTimestamp)}</span>
            </div>
          </div>

          {/* Estadísticas del usuario */}
          <div className="grid grid-cols-2 gap-4 mb-6">
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
                <p className="text-sm text-muted-foreground">NFTs</p>
              </div>
            </div>

            <div className="p-4 bg-card rounded-lg border">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-sm text-muted-foreground">Votos DAO</p>
              </div>
            </div>
          </div>

              </>
            )}
          </div>
        </div>
      </ClientOnly>
    </div>
  );
};

export default PerfilPage;
