import type { NextPage } from 'next';
import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Vote, FileText, CheckCircle, XCircle, Clock, Plus, ExternalLink, Calendar, User, ThumbsUp, ThumbsDown, X } from 'lucide-react';
import { useContractRead, useWriteContract, useAccount, useWaitForTransactionReceipt } from 'wagmi';
import ClientOnly from '@/components/ClientOnly';
import { useDAOProposals, useProposal, useAllProposals, useAllProposalDetails, DAOProposal, ProposalDetails, ProposalStatus } from '@/hooks/useDAOProposals';
import { useUserVotingStatus } from '@/hooks/useUserVotingStatus';
import { useRouter } from 'next/router';
const DAOContract = require(process.env.NEXT_PUBLIC_DAO_CONTRACT_ABI_PATH!);

const DAOPage: NextPage = () => {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  
  // Dirección del contrato DAO desde variables de entorno
  const daoContractAddress = process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS as `0x${string}`;
  
  // Estados para votación
  const [votingProposal, setVotingProposal] = useState<number | null>(null);
  const [votingSupport, setVotingSupport] = useState<boolean | null>(null);
  
  // Estado para mensaje de éxito
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Hook para obtener propuestas
  const { totalProposals, isLoadingTotal } = useDAOProposals();
  
  // Hook para obtener todas las propuestas
  const { proposals: allProposals, isLoading: isLoadingProposals, error: proposalsError } = useAllProposals();
  
  // Hook para obtener detalles completos de las propuestas
  const { proposalDetails, isLoading: isLoadingDetails, error: detailsError } = useAllProposalDetails();

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

  // Obtener poder de voto del usuario
  const { data: userVotingPower } = useContractRead({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'getVotingPower',
    args: address ? [address] : undefined,
  });

  // Función para votar
  const { writeContract: vote, data: voteData, isPending: isVoting } = useWriteContract();

  // Esperar confirmación de la transacción de voto
  const { isLoading: isConfirmingVote, isSuccess: isVoteConfirmed } = useWaitForTransactionReceipt({
    hash: voteData as `0x${string}`,
  });

  // Hook personalizado para contar propuestas activas y próximas
  const [activeProposals, setActiveProposals] = React.useState<number>(0);
  const [upcomingProposals, setUpcomingProposals] = React.useState<number>(0);

  // Calcular propuestas activas y próximas cuando cambien las propuestas
  useEffect(() => {
    if (allProposals && allProposals.length > 0) {
      const now = Date.now() / 1000;
      
      const activeCount = allProposals.filter(p => {
        const startTime = Number(p.startTime);
        const endTime = Number(p.endTime);
        return !p.cancelled && now >= startTime && now <= endTime;
      }).length;
      
      const upcomingCount = allProposals.filter(p => {
        const startTime = Number(p.startTime);
        return !p.cancelled && now < startTime;
      }).length;
      
      setActiveProposals(activeCount);
      setUpcomingProposals(upcomingCount);
    } else {
      setActiveProposals(0);
      setUpcomingProposals(0);
    }
  }, [allProposals]);

  // Detectar si se creó una propuesta y mostrar mensaje de éxito
  useEffect(() => {
    if (router.query.proposalCreated === 'true') {
      setShowSuccessMessage(true);
      // Limpiar el parámetro de la URL
      router.replace('/dao', undefined, { shallow: true });
    }
  }, [router]);

  // Manejar éxito de la votación
  useEffect(() => {
    if (isVoteConfirmed) {
      setVotingProposal(null);
      setVotingSupport(null);
      // Recargar propuestas después de votar
      window.location.reload();
    }
  }, [isVoteConfirmed]);

  // Función para cerrar mensaje de éxito
  const closeSuccessMessage = () => {
    setShowSuccessMessage(false);
  };

  // Función para manejar votación
  const handleVote = (proposalId: number, support: boolean) => {
    if (!isConnected) {
      alert('Debes conectar tu wallet para votar');
      return;
    }

    if (!userVotingPower || Number(userVotingPower) === 0) {
      alert('No tienes poder de voto suficiente');
      return;
    }

    setVotingProposal(proposalId);
    setVotingSupport(support);

    vote({
      address: daoContractAddress,
      abi: DAOContract.abi,
      functionName: 'vote',
      args: [BigInt(proposalId), support]
    });
  };

  // Función para obtener el estado de una propuesta
  const getProposalStatus = (proposal: DAOProposal): ProposalStatus => {
    const now = Date.now() / 1000;
    const startTime = Number(proposal.startTime);
    const endTime = Number(proposal.endTime);

    if (proposal.cancelled) {
      return { status: 'cancelled', canVote: false, isApproved: false };
    }

    if (now < startTime) {
      const timeRemaining = Math.ceil((startTime - now) / 86400);
      return { 
        status: 'upcoming', 
        canVote: false, 
        isApproved: false,
        timeRemaining: `${timeRemaining} días`
      };
    }

    if (now > endTime) {
      return { status: 'ended', canVote: false, isApproved: false };
    }

    const timeRemaining = Math.ceil((endTime - now) / 86400);
    return { 
      status: 'active', 
      canVote: true, 
      isApproved: false,
      timeRemaining: `${timeRemaining} días`
    };
  };

  // Función para formatear fecha
  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Componente para botones de votación con verificación de estado
  const VotingButtons = ({ proposalId, status }: { proposalId: number; status: ProposalStatus }) => {
    const { hasVoted, isLoading: isLoadingVotingStatus } = useUserVotingStatus(proposalId);
    const isCurrentlyVoting = votingProposal === proposalId && isVoting;
    const userHasVoted = hasVoted === true;

    if (!status.canVote || !isConnected) {
      return null;
    }

    if (isLoadingVotingStatus) {
      return (
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" className="flex-1 text-xs" disabled>
            <ThumbsUp className="w-3 h-3 mr-1" />
            Verificando...
          </Button>
          <Button size="sm" variant="outline" className="flex-1 text-xs" disabled>
            <ThumbsDown className="w-3 h-3 mr-1" />
            Verificando...
          </Button>
        </div>
      );
    }

    if (userHasVoted) {
      return (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-center space-x-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <p className="text-xs text-blue-800 dark:text-blue-200">
              Ya has votado en esta propuesta
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex space-x-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-xs"
          onClick={() => handleVote(proposalId, true)}
          disabled={isCurrentlyVoting || isConfirmingVote}
        >
          <ThumbsUp className="w-3 h-3 mr-1" />
          {isCurrentlyVoting && votingSupport === true 
            ? 'Votando...' : 'Votar A Favor'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-xs"
          onClick={() => handleVote(proposalId, false)}
          disabled={isCurrentlyVoting || isConfirmingVote}
        >
          <ThumbsDown className="w-3 h-3 mr-1" />
          {isCurrentlyVoting && votingSupport === false 
            ? 'Votando...' : 'Votar En Contra'}
        </Button>
      </div>
    );
  };

  // Función para obtener el color del badge según el estado
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'ended': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'upcoming': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };


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
      label: 'Total',
      value: totalProposals ? Number(totalProposals).toString() : '0',
      icon: FileText,
      color: 'from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800'
    },
    {
      label: 'Activas',
      value: activeProposals.toString(),
      icon: Clock,
      color: 'from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800'
    },
    {
      label: 'Próximas',
      value: upcomingProposals.toString(),
      icon: Calendar,
      color: 'from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800'
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

        {/* Mensaje de éxito */}
        {showSuccessMessage && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    ¡Propuesta creada exitosamente!
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Tu propuesta ha sido enviada y está disponible para votación.
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeSuccessMessage}
                className="text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30 p-1 h-auto"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

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
          <div className="grid grid-cols-3 gap-2">
            <ClientOnly fallback={
              <>
                <Card className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1 truncate">Total</p>
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
                        <p className="text-xs text-muted-foreground mb-1 truncate">Activas</p>
                        <p className="text-sm font-bold text-foreground truncate">0</p>
                      </div>
                      <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center ml-2 flex-shrink-0">
                        <Clock className="w-3 h-3 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1 truncate">Próximas</p>
                        <p className="text-sm font-bold text-foreground truncate">0</p>
                      </div>
                      <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center ml-2 flex-shrink-0">
                        <Calendar className="w-3 h-3 text-primary" />
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

        {/* Lista de Propuestas */}
        <div className="max-w-4xl mx-auto">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-foreground mb-2">
              Propuestas DAO
            </h2>
          </div>

          <ClientOnly fallback={
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4">
                  <CardContent className="p-0">
                    <div className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                      <div className="h-3 bg-muted rounded w-full mb-2"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          }>
            {proposalDetails.length === 0 && !isLoadingTotal && !isLoadingProposals && !isLoadingDetails ? (
              <Card className="p-8 text-center">
                <CardContent className="p-0">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No hay propuestas
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Aún no se han creado propuestas en este DAO.
                  </p>
                  <Link href="/nueva-propuesta">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Primera Propuesta
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {proposalDetails.map((proposalDetail, index) => {
                  const proposal = proposalDetail as DAOProposal;
                  const status = getProposalStatus(proposal);
                  const isCurrentlyVoting = votingProposal === Number(proposal.id) && isVoting;
                  
                  return (
                    <Card key={Number(proposal.id)} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <CardTitle className="text-sm font-semibold text-foreground">
                                Propuesta #{Number(proposal.id)}
                              </CardTitle>
                              <Badge className={`text-xs ${getStatusBadgeColor(status.status)}`}>
                                {status.status === 'active' ? 'Activa' : 
                                 status.status === 'ended' ? 'Finalizada' :
                                 status.status === 'cancelled' ? 'Cancelada' : 'Próxima'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {proposal.description}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          {/* Información de la propuesta */}
                          <div className="space-y-2 text-xs">
                            <div className="flex items-center space-x-2">
                              <User className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Proponente:</span>
                              <span className="font-mono text-foreground">
                                {`${proposal.proposer.slice(0, 6)}...${proposal.proposer.slice(-4)}`}
                              </span>
                            </div>
                            
                            {proposal.link && (
                              <div className="flex items-center space-x-2">
                                <ExternalLink className="w-3 h-3 text-muted-foreground" />
                                <a 
                                  href={proposal.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline truncate"
                                >
                                  Ver documento
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Estadísticas de votación */}
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="flex items-center space-x-2">
                              <Users className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Votantes Únicos:</span>
                              <span className="font-bold text-foreground">
                                {proposalDetail.uniqueVoters}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Vote className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Poder Total:</span>
                              <span className="font-bold text-foreground">
                                {Number(proposalDetail.totalVotingPower)}
                              </span>
                            </div>
                          </div>

                          {/* Fechas */}
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Inicio:</span>
                              <span className="text-foreground">{formatDate(proposal.startTime)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Fin:</span>
                              <span className="text-foreground">{formatDate(proposal.endTime)}</span>
                            </div>
                          </div>

                          {/* Votos */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <ThumbsUp className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-green-800 dark:text-green-400">
                                  A Favor
                                </span>
                              </div>
                              <span className="text-sm font-bold text-green-800 dark:text-green-400">
                                {Number(proposal.votesFor)}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <ThumbsDown className="w-4 h-4 text-red-600" />
                                <span className="text-sm font-medium text-red-800 dark:text-red-400">
                                  En Contra
                                </span>
                              </div>
                              <span className="text-sm font-bold text-red-800 dark:text-red-400">
                                {Number(proposal.votesAgainst)}
                              </span>
                            </div>
                          </div>

                          {/* Botones de votación */}
                          <VotingButtons proposalId={Number(proposal.id)} status={status} />

                          {status.canVote && !isConnected && (
                            <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                              <p className="text-xs text-orange-800 dark:text-orange-200 text-center">
                                Conecta tu wallet para votar en esta propuesta
                              </p>
                            </div>
                          )}

                          {status.status === 'upcoming' && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                              <div className="flex items-center justify-center space-x-2">
                                <Clock className="w-4 h-4 text-blue-600" />
                                <p className="text-xs text-blue-800 dark:text-blue-200">
                                  La votación comenzará en {status.timeRemaining}
                                </p>
                              </div>
                            </div>
                          )}

                          {status.status === 'ended' && (
                            <div className="p-3 bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800 rounded-lg">
                              <div className="flex items-center justify-center space-x-2">
                                <CheckCircle className="w-4 h-4 text-gray-600" />
                                <p className="text-xs text-gray-800 dark:text-gray-200">
                                  Votación finalizada
                                </p>
                              </div>
                            </div>
                          )}

                          {status.status === 'cancelled' && (
                            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                              <div className="flex items-center justify-center space-x-2">
                                <XCircle className="w-4 h-4 text-red-600" />
                                <p className="text-xs text-red-800 dark:text-red-200">
                                  Propuesta cancelada
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ClientOnly>
        </div>
      </div>
    </div>
  );
};

export default DAOPage;
