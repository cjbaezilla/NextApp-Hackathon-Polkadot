import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Users, User, Mail, Twitter, Github, MessageCircle, Calendar, ExternalLink, Globe, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useContractRead, useAccount } from 'wagmi';
import ClientOnly from '@/components/ClientOnly';
import { useUsersData, UserInfo } from '@/hooks/useUsersData';

// Cargar ABI del contrato desde variable de entorno
const UsersContract = require(process.env.NEXT_PUBLIC_USERS_CONTRACT_ABI_PATH!);

// Datos de ejemplo para proyectos NFT
const nftProjects = [
  {
    id: 1,
    name: 'PolkaPunks',
    address: '0x1234...5678',
    price: '2.5 DOT',
    change: '+12.5%',
    volume: '1,250 DOT'
  },
  {
    id: 2,
    name: 'DotArt Collection',
    address: '0xabcd...efgh',
    price: '1.8 DOT',
    change: '+8.3%',
    volume: '890 DOT'
  },
  {
    id: 3,
    name: 'Substrate Heroes',
    address: '0x9876...5432',
    price: '3.2 DOT',
    change: '-2.1%',
    volume: '2,100 DOT'
  }
];

// Datos de ejemplo para tokens ERC20
const erc20Tokens = [
  {
    id: 1,
    name: 'PolkaToken',
    symbol: 'POLK',
    address: '0x1111...2222',
    price: '$0.45',
    change: '+15.2%',
    marketCap: '$2.1M'
  },
  {
    id: 2,
    name: 'DotCoin',
    symbol: 'DOTC',
    address: '0x3333...4444',
    price: '$1.25',
    change: '+5.7%',
    marketCap: '$5.8M'
  },
  {
    id: 3,
    name: 'Substrate Token',
    symbol: 'SUB',
    address: '0x5555...6666',
    price: '$0.78',
    change: '-3.4%',
    marketCap: '$1.9M'
  }
];

// Datos de ejemplo para DAOs
const daos = [
  {
    id: 1,
    name: 'PolkaDAO',
    address: '0xaaaa...bbbb',
    members: '1,250',
    proposals: '45',
    treasury: '12.5K DOT'
  },
  {
    id: 2,
    name: 'Substrate',
    address: '0xcccc...dddd',
    members: '890',
    proposals: '32',
    treasury: '8.7K DOT'
  },
  {
    id: 3,
    name: 'Dot Community',
    address: '0xeeee...ffff',
    members: '2,100',
    proposals: '67',
    treasury: '25.3K DOT'
  }
];

// Datos de ejemplo para Pools
const pools = [
  {
    id: 1,
    name: 'DOT-ETH Pool',
    address: '0xgggg...hhhh',
    liquidity: '125K DOT',
    apy: '8.5%',
    volume: '45K DOT'
  },
  {
    id: 2,
    name: 'POLK-USDC Pool',
    address: '0xiiii...jjjj',
    liquidity: '78K DOT',
    apy: '12.3%',
    volume: '32K DOT'
  },
  {
    id: 3,
    name: 'SUB-DOT Pool',
    address: '0xkkkk...llll',
    liquidity: '95K DOT',
    apy: '6.7%',
    volume: '28K DOT'
  }
];

const Home: NextPage = () => {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Dirección del contrato desde variables de entorno
  const contractAddress = process.env.NEXT_PUBLIC_USERS_CONTRACT_ADDRESS as `0x${string}`;

  // Leer datos del contrato
  const { data: totalMembers } = useContractRead({
    address: contractAddress,
    abi: UsersContract.abi,
    functionName: 'getTotalMembers',
  });

  const { data: allUsersAddresses } = useContractRead({
    address: contractAddress,
    abi: UsersContract.abi,
    functionName: 'getAllUsers',
  });

  // Usar el hook personalizado para cargar datos de usuarios
  const { usersData: registeredUsers, isLoading: isLoadingUsers, error: usersError } = useUsersData(
    Array.isArray(allUsersAddresses) ? allUsersAddresses : [],
    12
  );

  const handleRegisterClick = () => {
    router.push('/registro');
  };

  const handleUserClick = (user: UserInfo) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
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

  // Función para formatear fecha de registro
  const formatJoinDate = (timestamp: number | bigint) => {
    const timestampNumber = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
    const date = new Date(timestampNumber * 1000);
    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric'
    });
  };


  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>DApp Polka</title>
        <meta
          content="Aplicación descentralizada en Polkadot"
          name="description"
        />
        <link href="/favicon.ico" rel="icon" />
      </Head>

      <div className="container mx-auto px-3 py-4">
        {/* Header compacto */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground mb-1">
              Dashboard
            </h1>
            <p className="text-muted-foreground text-xs">
              NFT & ERC20 en Polkadot
            </p>
          </div>
          <Button className="text-xs px-3 py-2 h-auto" onClick={handleRegisterClick}>
            <Plus className="w-3 h-3 mr-1" />
            Registrate
          </Button>
        </div>

        {/* Sección de estadísticas del protocolo */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-2">
            {/* Usuarios registrados */}
            <Card className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Usuarios</p>
                    <p className="text-lg font-bold text-foreground">
                      <ClientOnly fallback="0">
                        {totalMembers ? Number(totalMembers).toString() : '0'}
                      </ClientOnly>
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Users className="text-white text-xs w-4 h-4" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Proyectos NFT */}
            <Card className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Proyectos NFT</p>
                    <p className="text-lg font-bold text-foreground">1,234</p>
                  </div>
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">N</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* DAOs creadas */}
            <Card className="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">DAOs Creadas</p>
                    <p className="text-lg font-bold text-foreground">456</p>
                  </div>
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">D</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pools de liquidez */}
            <Card className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
              <CardContent className="p-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">LP Pools</p>
                    <p className="text-lg font-bold text-foreground">789</p>
                  </div>
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">L</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* TVL destacado */}
          <Card className="mt-2 p-4 bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-indigo-950/30 dark:to-cyan-950/30 border-indigo-200 dark:border-indigo-800">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Value Locked (TVL)</p>
                  <p className="text-2xl font-bold text-foreground">$12.4M</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg font-bold">$</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sección de cuatro columnas compacta */}
        <div className="grid grid-cols-2 gap-3">
          {/* Fila superior */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-foreground">
                Nuevos Proyectos NFT
              </h2>
            </div>
            
            <div className="space-y-2">
              {nftProjects.map((project) => (
                <Card key={project.id} className="p-2 hover:shadow-md hover:shadow-primary/5 transition-all duration-200">
                  <CardContent className="p-0">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                          {project.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-medium text-card-foreground mb-1">
                          {project.name}
                        </h3>
                        
                        <p className="text-xs text-muted-foreground truncate">
                          {project.address}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-foreground">
                Nuevos Tokens ERC20
              </h2>
            </div>
            
            <div className="space-y-2">
              {erc20Tokens.map((token) => (
                <Card key={token.id} className="p-2 hover:shadow-md hover:shadow-accent/5 transition-all duration-200">
                  <CardContent className="p-0">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-accent text-accent-foreground text-xs font-medium">
                          {token.symbol.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-medium text-card-foreground mb-1">
                          {token.name}
                        </h3>
                        
                        <p className="text-xs text-muted-foreground truncate">
                          {token.address}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Fila inferior - Nuevas DAOs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-foreground">
                Nuevas DAOs
              </h2>
            </div>
            
            <div className="space-y-2">
              {daos.map((dao) => (
                <Card key={dao.id} className="p-2 hover:shadow-md hover:shadow-primary/5 transition-all duration-200">
                  <CardContent className="p-0">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                          {dao.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-medium text-card-foreground mb-1">
                          {dao.name}
                        </h3>
                        
                        <p className="text-xs text-muted-foreground truncate">
                          {dao.address}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-foreground">
                Nuevos Liquidity Pools
              </h2>
            </div>
            
            <div className="space-y-2">
              {pools.map((pool) => (
                <Card key={pool.id} className="p-2 hover:shadow-md hover:shadow-accent/5 transition-all duration-200">
                  <CardContent className="p-0">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-accent text-accent-foreground text-xs font-medium">
                          {pool.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-medium text-card-foreground mb-1">
                          {pool.name}
                        </h3>
                        
                        <p className="text-xs text-muted-foreground truncate">
                          {pool.address}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Sección de usuarios registrados - Ancho completo */}
        <div className="w-full mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">
                Comunidad de Usuarios
              </h2>
            </div>
          </div>

          <ClientOnly fallback={
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                <Card key={i} className="p-2">
                  <CardContent className="p-0">
                    <div className="text-center space-y-2">
                      <div className="w-8 h-8 bg-muted rounded-full animate-pulse mx-auto"></div>
                      <div className="space-y-1">
                        <div className="h-3 bg-muted rounded animate-pulse w-3/4 mx-auto"></div>
                        <div className="h-2 bg-muted rounded animate-pulse w-1/2 mx-auto"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          }>
            {isLoadingUsers ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                  <Card key={i} className="p-2">
                    <CardContent className="p-0">
                      <div className="text-center space-y-2">
                        <div className="w-8 h-8 bg-muted rounded-full animate-pulse mx-auto"></div>
                        <div className="space-y-1">
                          <div className="h-3 bg-muted rounded animate-pulse w-3/4 mx-auto"></div>
                          <div className="h-2 bg-muted rounded animate-pulse w-1/2 mx-auto"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : registeredUsers.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {registeredUsers.map((user, index) => (
                  <Card 
                    key={index} 
                    className="p-2 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 cursor-pointer border hover:border-primary/20 group"
                    onClick={() => handleUserClick(user)}
                  >
                    <CardContent className="p-0">
                      <div className="text-center space-y-2">
                        {/* Avatar */}
                        <Avatar className="w-8 h-8 mx-auto">
                          <AvatarImage 
                            src={user.avatarLink} 
                            alt={user.username}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xs font-semibold">
                            {getUserInitials(user.username)}
                          </AvatarFallback>
                        </Avatar>
                        
                        {/* Información del usuario */}
                        <div className="space-y-1">
                          <h3 className="text-xs font-medium text-foreground truncate px-1" title={user.username}>
                            {user.username}
                          </h3>
                          
                          <p className="text-xs text-muted-foreground font-mono truncate px-1" title={user.userAddress}>
                            {shortenAddress(user.userAddress)}
                          </p>
                          
                        </div>

                        {/* Iconos sociales */}
                        <div className="flex justify-center space-x-2">
                          <a
                            href={user.twitterLink || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                              user.twitterLink && user.twitterLink !== '' 
                                ? 'bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200 dark:hover:bg-blue-900/40' 
                                : 'bg-gray-100 dark:bg-gray-900/20 opacity-50 cursor-not-allowed'
                            }`}
                            title={user.twitterLink && user.twitterLink !== '' ? "Twitter" : "Twitter no disponible"}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!user.twitterLink || user.twitterLink === '') {
                                e.preventDefault();
                              }
                            }}
                          >
                            <Twitter className={`w-4 h-4 ${
                              user.twitterLink && user.twitterLink !== '' 
                                ? 'text-blue-600 dark:text-blue-400' 
                                : 'text-gray-400 dark:text-gray-500'
                            }`} />
                          </a>
                          <a
                            href={user.githubLink || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                              user.githubLink && user.githubLink !== '' 
                                ? 'bg-gray-100 dark:bg-gray-900/20 hover:bg-gray-200 dark:hover:bg-gray-900/40' 
                                : 'bg-gray-100 dark:bg-gray-900/20 opacity-50 cursor-not-allowed'
                            }`}
                            title={user.githubLink && user.githubLink !== '' ? "GitHub" : "GitHub no disponible"}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!user.githubLink || user.githubLink === '') {
                                e.preventDefault();
                              }
                            }}
                          >
                            <Github className={`w-4 h-4 ${
                              user.githubLink && user.githubLink !== '' 
                                ? 'text-gray-600 dark:text-gray-400' 
                                : 'text-gray-400 dark:text-gray-500'
                            }`} />
                          </a>
                          <a
                            href={user.telegramLink || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                              user.telegramLink && user.telegramLink !== '' 
                                ? 'bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200 dark:hover:bg-blue-900/40' 
                                : 'bg-gray-100 dark:bg-gray-900/20 opacity-50 cursor-not-allowed'
                            }`}
                            title={user.telegramLink && user.telegramLink !== '' ? "Telegram" : "Telegram no disponible"}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!user.telegramLink || user.telegramLink === '') {
                                e.preventDefault();
                              }
                            }}
                          >
                            <MessageCircle className={`w-4 h-4 ${
                              user.telegramLink && user.telegramLink !== '' 
                                ? 'text-blue-600 dark:text-blue-400' 
                                : 'text-gray-400 dark:text-gray-500'
                            }`} />
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : usersError ? (
              <Card className="p-8">
                <CardContent className="p-0">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
                      <X className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Error al cargar usuarios
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {usersError}
                      </p>
                      <Button
                        onClick={() => window.location.reload()}
                        variant="outline"
                        className="px-6 py-2"
                      >
                        Reintentar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="p-8">
                <CardContent className="p-0">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                      <Users className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No hay usuarios registrados
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Sé el primero en unirte a la comunidad DApp Polka
                      </p>
                      <Button
                        onClick={handleRegisterClick}
                        className="px-6 py-2"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Registrarse
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </ClientOnly>
        </div>
      </div>

      {/* Modal de información del usuario */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Perfil de Usuario</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeUserModal}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar y nombre */}
              <div className="text-center space-y-3">
                <Avatar className="w-20 h-20 mx-auto">
                  <AvatarImage 
                    src={selectedUser.avatarLink} 
                    alt={selectedUser.username}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {getUserInitials(selectedUser.username)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    {selectedUser.username}
                  </h3>
                  <p className="text-sm text-muted-foreground font-mono">
                    {shortenAddress(selectedUser.userAddress)}
                  </p>
                </div>
              </div>

              {/* Información de contacto */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Información de Contacto</h4>
                
                {selectedUser.email && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Email:</span>
                    <span className="text-foreground">{selectedUser.email}</span>
                  </div>
                )}

                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Miembro desde:</span>
                  <span className="text-foreground">
                    {new Date(Number(selectedUser.joinTimestamp) * 1000).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Enlaces sociales */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Enlaces Sociales</h4>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={selectedUser.twitterLink || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      selectedUser.twitterLink && selectedUser.twitterLink !== '' 
                        ? 'bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200 dark:hover:bg-blue-900/40' 
                        : 'bg-gray-100 dark:bg-gray-900/20 opacity-50 cursor-not-allowed'
                    }`}
                    onClick={(e) => {
                      if (!selectedUser.twitterLink || selectedUser.twitterLink === '') {
                        e.preventDefault();
                      }
                    }}
                  >
                    <Twitter className={`w-4 h-4 ${
                      selectedUser.twitterLink && selectedUser.twitterLink !== '' 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`} />
                    <span className={`text-sm ${
                      selectedUser.twitterLink && selectedUser.twitterLink !== '' 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {selectedUser.twitterLink && selectedUser.twitterLink !== '' ? 'Twitter' : 'Twitter no disponible'}
                    </span>
                    {selectedUser.twitterLink && selectedUser.twitterLink !== '' && (
                      <ExternalLink className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    )}
                  </a>
                  <a
                    href={selectedUser.githubLink || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      selectedUser.githubLink && selectedUser.githubLink !== '' 
                        ? 'bg-gray-100 dark:bg-gray-900/20 hover:bg-gray-200 dark:hover:bg-gray-900/40' 
                        : 'bg-gray-100 dark:bg-gray-900/20 opacity-50 cursor-not-allowed'
                    }`}
                    onClick={(e) => {
                      if (!selectedUser.githubLink || selectedUser.githubLink === '') {
                        e.preventDefault();
                      }
                    }}
                  >
                    <Github className={`w-4 h-4 ${
                      selectedUser.githubLink && selectedUser.githubLink !== '' 
                        ? 'text-gray-600 dark:text-gray-400' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`} />
                    <span className={`text-sm ${
                      selectedUser.githubLink && selectedUser.githubLink !== '' 
                        ? 'text-gray-600 dark:text-gray-400' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {selectedUser.githubLink && selectedUser.githubLink !== '' ? 'GitHub' : 'GitHub no disponible'}
                    </span>
                    {selectedUser.githubLink && selectedUser.githubLink !== '' && (
                      <ExternalLink className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                    )}
                  </a>
                  <a
                    href={selectedUser.telegramLink || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      selectedUser.telegramLink && selectedUser.telegramLink !== '' 
                        ? 'bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200 dark:hover:bg-blue-900/40' 
                        : 'bg-gray-100 dark:bg-gray-900/20 opacity-50 cursor-not-allowed'
                    }`}
                    onClick={(e) => {
                      if (!selectedUser.telegramLink || selectedUser.telegramLink === '') {
                        e.preventDefault();
                      }
                    }}
                  >
                    <MessageCircle className={`w-4 h-4 ${
                      selectedUser.telegramLink && selectedUser.telegramLink !== '' 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`} />
                    <span className={`text-sm ${
                      selectedUser.telegramLink && selectedUser.telegramLink !== '' 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {selectedUser.telegramLink && selectedUser.telegramLink !== '' ? 'Telegram' : 'Telegram no disponible'}
                    </span>
                    {selectedUser.telegramLink && selectedUser.telegramLink !== '' && (
                      <ExternalLink className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    )}
                  </a>
                </div>
              </div>

              {/* Botón de acción */}
              <div className="pt-4">
                <Button 
                  className="w-full" 
                  onClick={() => {
                    router.push(`/perfil?user=${selectedUser.userAddress}`);
                    closeUserModal();
                  }}
                >
                  Ver Perfil Completo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Home;
