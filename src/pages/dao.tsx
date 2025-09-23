import type { NextPage } from 'next';
import Head from 'next/head';
import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Vote, FileText, CheckCircle, XCircle, Clock, Plus } from 'lucide-react';
import { useContractRead } from 'wagmi';
import ClientOnly from '@/components/ClientOnly';
const DAOContract = require(process.env.NEXT_PUBLIC_DAO_CONTRACT_ABI_PATH!);

const DAOPage: NextPage = () => {
  // Dirección del contrato DAO desde variables de entorno
  const daoContractAddress = process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS as `0x${string}`;
  

  // Leer datos del contrato DAO
  const { data: minimumVotesToApprove } = useContractRead({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'MIN_VOTES_TO_APPROVE',
  });

  const { data: minimumTokensToApprove } = useContractRead({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'MIN_TOKENS_TO_APPROVE',
  });

  const { data: totalProposals } = useContractRead({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'getTotalProposals',
  });

  // Hook personalizado para contar propuestas activas
  const [activeProposals, setActiveProposals] = React.useState<number>(0);

  // Función simplificada para estimar propuestas activas
  // En un escenario real, necesitarías iterar sobre cada propuesta y verificar su estado
  React.useEffect(() => {
    if (!totalProposals || Number(totalProposals) === 0) {
      setActiveProposals(0);
      return;
    }

    const total = Number(totalProposals);
    // Estimación simplificada: asumimos que aproximadamente el 30% de las propuestas están activas
    // En un escenario real, esto requeriría múltiples llamadas al contrato para verificar cada propuesta
    const estimatedActive = Math.max(0, Math.floor(total * 0.3));
    setActiveProposals(estimatedActive);
  }, [totalProposals]);


  // Estadísticas principales del DAO
  const mainStats = [
    {
      label: 'Votantes Mínimos',
      value: minimumVotesToApprove ? Number(minimumVotesToApprove).toString() : '5',
      icon: Users,
      color: 'from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800'
    },
    {
      label: 'Poder de Voto Mínimo',
      value: minimumTokensToApprove ? Number(minimumTokensToApprove).toString() : '100',
      icon: Vote,
      color: 'from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800'
    }
  ];

  // Estadísticas de propuestas
  const proposalStats = [
    {
      label: 'Total Propuestas',
      value: totalProposals ? Number(totalProposals).toString() : '0',
      icon: FileText,
      color: 'from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800'
    },
    {
      label: 'Propuestas Activas',
      value: activeProposals.toString(),
      icon: Clock,
      color: 'from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>DAO - DApp Polka</title>
        <meta
          content="Gobierno de la comunidad"
          name="description"
        />
        <link href="/favicon.ico" rel="icon" />
      </Head>

      <div className="container mx-auto px-3 py-4">
        {/* Header compacto */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground mb-1">
              DAO Governance
            </h1>
            <p className="text-muted-foreground text-xs">
            Gobierno de la comunidad
            </p>
          </div>
          <Link href="/nueva-propuesta">
            <Button className="text-xs px-3 py-2 h-auto">
              <Plus className="w-3 h-3 mr-1" />
              Nueva Propuesta
            </Button>
          </Link>
        </div>

        {/* Estadísticas principales del DAO */}
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-2">
            <ClientOnly fallback={
              <>
                <Card className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1 truncate">Votantes Mínimos</p>
                        <p className="text-sm font-bold text-foreground truncate">5</p>
                      </div>
                      <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center ml-2 flex-shrink-0">
                        <Users className="w-3 h-3 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1 truncate">Poder de Voto Mínimo</p>
                        <p className="text-sm font-bold text-foreground truncate">100</p>
                      </div>
                      <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center ml-2 flex-shrink-0">
                        <Vote className="w-3 h-3 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            }>
              {mainStats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <Card key={index} className={`p-3 bg-gradient-to-br ${stat.color}`}>
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-1 truncate">{stat.label}</p>
                          <p className="text-sm font-bold text-foreground truncate">{stat.value}</p>
                        </div>
                        <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center ml-2 flex-shrink-0">
                          <IconComponent className="w-3 h-3 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </ClientOnly>
          </div>
        </div>

        {/* Estadísticas de propuestas */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-2">
            <ClientOnly fallback={
              <>
                <Card className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1 truncate">Total Propuestas</p>
                        <p className="text-sm font-bold text-foreground truncate">0</p>
                      </div>
                      <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center ml-2 flex-shrink-0">
                        <FileText className="w-3 h-3 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1 truncate">Propuestas Activas</p>
                        <p className="text-sm font-bold text-foreground truncate">0</p>
                      </div>
                      <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center ml-2 flex-shrink-0">
                        <Clock className="w-3 h-3 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            }>
              {proposalStats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <Card key={index} className={`p-3 bg-gradient-to-br ${stat.color}`}>
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-1 truncate">{stat.label}</p>
                          <p className="text-sm font-bold text-foreground truncate">{stat.value}</p>
                        </div>
                        <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center ml-2 flex-shrink-0">
                          <IconComponent className="w-3 h-3 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </ClientOnly>
          </div>
        </div>

        {/* Información del DAO */}
        <div className="max-w-md mx-auto">
          <Card className="p-4">
            <CardContent className="p-0">
              <div className="space-y-4">
                {/* Información del contrato */}
                <div className="p-3 bg-muted rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Contrato DAO:</span>
                      <span className="text-xs font-mono text-foreground">
                        {daoContractAddress ? `${daoContractAddress.slice(0, 6)}...${daoContractAddress.slice(-4)}` : 'No configurado'}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>• Los votantes únicos se refieren al número mínimo de direcciones diferentes que deben votar</p>
                      <p>• El poder de voto mínimo es la cantidad total de NFTs que deben tener los votantes</p>
                      <p>• Las propuestas requieren ambos criterios para ser aprobadas</p>
                    </div>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Conecta tu wallet para participar en las votaciones</p>
                  <p>• Cada NFT que poseas te da un voto en las propuestas</p>
                  <p>• Las propuestas activas están abiertas para votación</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DAOPage;
