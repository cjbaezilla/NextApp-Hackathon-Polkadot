import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

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

  const handleRegisterClick = () => {
    router.push('/registro');
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
            {/* Tokens creados */}
            <Card className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tokens Creados</p>
                    <p className="text-lg font-bold text-foreground">2,847</p>
                  </div>
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">T</span>
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

          {/* Fila inferior - Nuevas secciones */}
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
      </div>
    </div>
  );
};

export default Home;
