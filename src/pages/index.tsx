import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserAvatar } from '@/components/ui/user-avatar';
import { TokenIcon } from '@/components/ui/token-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Users, User, Mail, Twitter, Github, MessageCircle, Calendar, ExternalLink, Globe, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useContractRead, useAccount } from 'wagmi';
import ClientOnly from '@/components/ClientOnly';
import { useAllUsers, UserInfo } from '@/hooks/useAllUsers';
import { useERC20Tokens, TokenInfo } from '@/hooks/useERC20Tokens';
import { useAllDAOs, DAOInfo } from '@/hooks/useAllDAOs';
import { useUniswapV2Pools, PoolInfo } from '@/hooks/useUniswapV2Pools';
import { DAOItem } from '@/components/DAOItem';
import TokenInfoModal from '@/components/TokenInfoModal';
import DAOInfoModal from '@/components/DAOInfoModal';
import PoolInfoModal from '@/components/PoolInfoModal';
import { formatAmount } from '@/lib/uniswap-utils';
import { formatUnits } from 'viem';

// Cargar ABI del contrato desde variable de entorno
const UsersContract = require(process.env.NEXT_PUBLIC_USERS_CONTRACT_ABI_PATH!);

// Dirección del contrato ERC20MembersFactory desde variables de entorno
const ERC20FactoryAddress = process.env.NEXT_PUBLIC_ERC20MEMBERSFACTORY_CONTRACT_ADDRESS as `0x${string}`;





const Home: NextPage = () => {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [selectedDAO, setSelectedDAO] = useState<DAOInfo | null>(null);
  const [showDAOModal, setShowDAOModal] = useState(false);
  const [selectedPool, setSelectedPool] = useState<PoolInfo | null>(null);
  const [showPoolModal, setShowPoolModal] = useState(false);

  // Dirección del contrato desde variables de entorno
  const contractAddress = process.env.NEXT_PUBLIC_USERS_CONTRACT_ADDRESS as `0x${string}`;

  // Usar el hook personalizado para obtener tokens ERC20
  const { 
    tokens: erc20Tokens, 
    totalTokens: totalTokensCreated, 
    isLoading: isLoadingTokens, 
    error: tokensError 
  } = useERC20Tokens(ERC20FactoryAddress, 3);

  // Usar el hook personalizado para obtener DAOs
  const { 
    allDAOs, 
    totalDAOs: totalDAOsCreated, 
    isLoading: isLoadingDAOs, 
    error: daosError
  } = useAllDAOs(3);

  // Usar el hook personalizado para obtener pools de liquidez
  const {
    pools: liquidityPools,
    isLoading: isLoadingPools,
    error: poolsError,
    totalPools: totalPoolsCreated
  } = useUniswapV2Pools();

  // Leer datos del contrato
  const { data: totalMembers } = useContractRead({
    address: contractAddress,
    abi: UsersContract.abi,
    functionName: 'getTotalMembers',
  });

  // Usar el hook personalizado para cargar datos de usuarios
  const { 
    allUsers: registeredUsers, 
    isLoading: isLoadingUsers, 
    error: usersError 
  } = useAllUsers(3);

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

  const handleTokenClick = (token: TokenInfo) => {
    setSelectedToken(token);
    setShowTokenModal(true);
  };

  const closeTokenModal = () => {
    setShowTokenModal(false);
    setSelectedToken(null);
  };

  const handleDAOClick = (dao: DAOInfo) => {
    setSelectedDAO(dao);
    setShowDAOModal(true);
  };

  const closeDAOModal = () => {
    setShowDAOModal(false);
    setSelectedDAO(null);
  };

  const handlePoolClick = (pool: PoolInfo) => {
    setSelectedPool(pool);
    setShowPoolModal(true);
  };

  const closePoolModal = () => {
    setShowPoolModal(false);
    setSelectedPool(null);
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

  // Usar función de formateo centralizada
  const formatNumber = formatAmount;

  // Calcular TVL total solo en ETH
  const calculateTotalTVL = () => {
    const wethAddress = process.env.NEXT_PUBLIC_WETH_ADDRESS?.toLowerCase();
    if (!wethAddress) return '0';

    return liquidityPools.reduce((sum, pool) => {
      const token0Address = pool.token0.address.toLowerCase();
      const token1Address = pool.token1.address.toLowerCase();
      
      // Solo incluir pools que contengan WETH/ETH
      if (token0Address === wethAddress || token1Address === wethAddress) {
        // Si token0 es WETH, usar reserve0; si token1 es WETH, usar reserve1
        const ethReserve = token0Address === wethAddress ? pool.reserves.reserve0 : pool.reserves.reserve1;
        const ethAmount = formatUnits(ethReserve, 18); // WETH tiene 18 decimales
        return sum + parseFloat(ethAmount);
      }
      
      return sum;
    }, 0);
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
                    <div className="text-lg font-bold text-foreground">
                      <ClientOnly fallback="0">
                        {totalMembers ? Number(totalMembers).toString() : '0'}
                      </ClientOnly>
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Users className="text-white text-xs w-4 h-4" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tokens Creados */}
            <Card className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tokens Creados</p>
                    <div className="text-lg font-bold text-foreground">
                      <ClientOnly fallback="0">
                        {totalTokensCreated.toString()}
                      </ClientOnly>
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">T</span>
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
                    <div className="text-lg font-bold text-foreground">
                      <ClientOnly fallback="0">
                        {totalDAOsCreated.toString()}
                      </ClientOnly>
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">D</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pools de liquidez */}
            <Link href="/pools">
              <Card className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800 hover:shadow-md hover:shadow-orange-500/10 transition-all duration-200 cursor-pointer">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">LP Pools</p>
                      <div className="text-lg font-bold text-foreground">
                        <ClientOnly fallback="0">
                          {totalPoolsCreated}
                        </ClientOnly>
                      </div>
                    </div>
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">L</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* TVL destacado */}
          <Card className="mt-2 p-4 bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-indigo-950/30 dark:to-cyan-950/30 border-indigo-200 dark:border-indigo-800">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">TVL Total en ETH</p>
                  <div className="text-2xl font-bold text-foreground">
                    <ClientOnly fallback="0">
                      {formatNumber(calculateTotalTVL().toString())} ETH
                    </ClientOnly>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg font-bold">Ξ</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sección de cuatro columnas compacta */}
        <div className="grid grid-cols-2 gap-3">
          {/* Fila superior - Nuevos Miembros */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-foreground">
                Nuevos Miembros
              </h2>
            </div>
            
            <div className="space-y-2">
              <ClientOnly fallback={
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-2">
                      <CardContent className="p-0">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-muted rounded-full animate-pulse"></div>
                          <div className="flex-1 space-y-1">
                            <div className="h-3 bg-muted rounded animate-pulse w-3/4"></div>
                            <div className="h-2 bg-muted rounded animate-pulse w-1/2"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              }>
                {isLoadingUsers ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="p-2">
                        <CardContent className="p-0">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-muted rounded-full animate-pulse"></div>
                            <div className="flex-1 space-y-1">
                              <div className="h-3 bg-muted rounded animate-pulse w-3/4"></div>
                              <div className="h-2 bg-muted rounded animate-pulse w-1/2"></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : usersError ? (
                  <Card className="p-4">
                    <CardContent className="p-0">
                      <div className="text-center space-y-2">
                        <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
                          <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </div>
                        <p className="text-xs text-muted-foreground">Error al cargar miembros</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : registeredUsers.length > 0 ? (
                  registeredUsers.map((user, index) => (
                    <Card 
                      key={index} 
                      className="p-2 mb-2 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 cursor-pointer border hover:border-primary/20 group"
                      onClick={() => handleUserClick(user)}
                    >
                      <CardContent className="p-0">
                        <div className="flex items-center space-x-2">
                          <UserAvatar
                            userAddress={user.userAddress}
                            customImageUrl={user.avatarLink}
                            size="sm"
                            alt={user.username}
                            showBorder={false}
                          />
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xs font-medium text-card-foreground mb-1 truncate" title={user.username}>
                              {user.username}
                            </h3>
                            
                            <p className="text-xs text-muted-foreground truncate" title={user.userAddress}>
                              {shortenAddress(user.userAddress)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="p-4">
                    <CardContent className="p-0">
                      <div className="text-center space-y-2">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center mx-auto">
                          <Users className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground">No hay miembros registrados</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </ClientOnly>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-foreground">
                Nuevos Tokens
              </h2>
            </div>
            
            <div className="space-y-2">
              <ClientOnly fallback={
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-2">
                      <CardContent className="p-0">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-muted rounded-full animate-pulse"></div>
                          <div className="flex-1 space-y-1">
                            <div className="h-3 bg-muted rounded animate-pulse w-3/4"></div>
                            <div className="h-2 bg-muted rounded animate-pulse w-1/2"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              }>
                {isLoadingTokens ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="p-2">
                        <CardContent className="p-0">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-muted rounded-full animate-pulse"></div>
                            <div className="flex-1 space-y-1">
                              <div className="h-3 bg-muted rounded animate-pulse w-3/4"></div>
                              <div className="h-2 bg-muted rounded animate-pulse w-1/2"></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : tokensError ? (
                  <Card className="p-4">
                    <CardContent className="p-0">
                      <div className="text-center space-y-2">
                        <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
                          <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </div>
                        <p className="text-xs text-muted-foreground">Error al cargar tokens</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : erc20Tokens.length > 0 ? (
                  erc20Tokens.map((token, index) => (
                    <Card 
                      key={index} 
                      className="p-2 mb-2 hover:shadow-md hover:shadow-accent/5 transition-all duration-200 cursor-pointer border hover:border-primary/20 group"
                      onClick={() => handleTokenClick(token)}
                    >
                      <CardContent className="p-0">
                        <div className="flex items-center space-x-2">
                          <TokenIcon 
                            tokenAddress={token.tokenAddress}
                            size={24}
                            className="border-gray-200 dark:border-gray-700"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xs font-medium text-card-foreground mb-1">
                              {token.name}
                            </h3>
                            
                            <p className="text-xs text-muted-foreground truncate">
                              {shortenAddress(token.tokenAddress)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="p-4">
                    <CardContent className="p-0">
                      <div className="text-center space-y-2">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center mx-auto">
                          <span className="text-muted-foreground text-xs font-bold">T</span>
                        </div>
                        <p className="text-xs text-muted-foreground">No hay tokens creados</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </ClientOnly>
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
              <ClientOnly fallback={
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-2">
                      <CardContent className="p-0">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-muted rounded-full animate-pulse"></div>
                          <div className="flex-1 space-y-1">
                            <div className="h-3 bg-muted rounded animate-pulse w-3/4"></div>
                            <div className="h-2 bg-muted rounded animate-pulse w-1/2"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              }>
                {isLoadingDAOs ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="p-2">
                        <CardContent className="p-0">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-muted rounded-full animate-pulse"></div>
                            <div className="flex-1 space-y-1">
                              <div className="h-3 bg-muted rounded animate-pulse w-3/4"></div>
                              <div className="h-2 bg-muted rounded animate-pulse w-1/2"></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : daosError ? (
                  <Card className="p-4">
                    <CardContent className="p-0">
                      <div className="text-center space-y-2">
                        <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
                          <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </div>
                        <p className="text-xs text-muted-foreground">Error al cargar DAOs</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : allDAOs.length > 0 ? (
                  allDAOs.map((dao, index) => (
                    <DAOItem 
                      key={dao.daoAddress}
                      daoAddress={dao.daoAddress}
                      index={index}
                      onClick={() => handleDAOClick(dao)}
                    />
                  ))
                ) : (
                  <Card className="p-4">
                    <CardContent className="p-0">
                      <div className="text-center space-y-2">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center mx-auto">
                          <span className="text-muted-foreground text-xs font-bold">D</span>
                        </div>
                        <p className="text-xs text-muted-foreground">No hay DAOs creadas</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </ClientOnly>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-foreground">
                Nuevos Pools
              </h2>
            </div>
            
            <div className="space-y-2">
              <ClientOnly fallback={
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-2">
                      <CardContent className="p-0">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-muted rounded-full animate-pulse"></div>
                          <div className="flex-1 space-y-1">
                            <div className="h-3 bg-muted rounded animate-pulse w-3/4"></div>
                            <div className="h-2 bg-muted rounded animate-pulse w-1/2"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              }>
                {isLoadingPools ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="p-2">
                        <CardContent className="p-0">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-muted rounded-full animate-pulse"></div>
                            <div className="flex-1 space-y-1">
                              <div className="h-3 bg-muted rounded animate-pulse w-3/4"></div>
                              <div className="h-2 bg-muted rounded animate-pulse w-1/2"></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : poolsError ? (
                  <Card className="p-4">
                    <CardContent className="p-0">
                      <div className="text-center space-y-2">
                        <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
                          <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </div>
                        <p className="text-xs text-muted-foreground">Error al cargar pools</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : liquidityPools.length > 0 ? (
                  liquidityPools.slice(0, 3).map((pool, index) => (
                    <Card 
                      key={pool.address} 
                      className="p-2 mb-2 hover:shadow-md hover:shadow-accent/5 transition-all duration-200 cursor-pointer border hover:border-primary/20 group"
                      onClick={() => handlePoolClick(pool)}
                    >
                      <CardContent className="p-0">
                        <div className="flex items-center space-x-2">
                          {/* Tokens */}
                          <div className="flex items-center -space-x-1">
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center border-2 border-background">
                              <span className="text-white text-xs font-bold">
                                {pool.token0.symbol.charAt(0)}
                              </span>
                            </div>
                            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-background">
                              <span className="text-white text-xs font-bold">
                                {pool.token1.symbol.charAt(0)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xs font-medium text-card-foreground mb-1">
                              {pool.token0.symbol}/{pool.token1.symbol}
                            </h3>
                            
                            <p className="text-xs text-muted-foreground truncate">
                              {shortenAddress(pool.address)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="p-4">
                    <CardContent className="p-0">
                      <div className="text-center space-y-2">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center mx-auto">
                          <span className="text-muted-foreground text-xs font-bold">L</span>
                        </div>
                        <p className="text-xs text-muted-foreground">No hay pools disponibles</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </ClientOnly>
            </div>
          </div>
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
                <UserAvatar
                  userAddress={selectedUser.userAddress}
                  customImageUrl={selectedUser.avatarLink}
                  size="xl"
                  alt={selectedUser.username}
                  showBorder={true}
                  className="mx-auto"
                />
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

      {/* Modal de información del token */}
      {showTokenModal && selectedToken && (
        <TokenInfoModal
          isOpen={showTokenModal}
          onClose={closeTokenModal}
          token={selectedToken}
        />
      )}

      {/* Modal de información del DAO */}
      {showDAOModal && selectedDAO && (
        <DAOInfoModal
          isOpen={showDAOModal}
          onClose={closeDAOModal}
          dao={selectedDAO}
        />
      )}

      {/* Modal de información del pool */}
      {showPoolModal && selectedPool && (
        <PoolInfoModal
          isOpen={showPoolModal}
          onClose={closePoolModal}
          pool={selectedPool}
        />
      )}
    </div>
  );
};

export default Home;
