import type { NextPage } from 'next';
import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Coins, 
  DollarSign,
  Info,
  Loader2,
  ArrowLeft,
  Vote,
  Settings
} from 'lucide-react';
import { useRouter } from 'next/router';
import ClientOnly from '@/components/ClientOnly';
import Link from 'next/link';
import { useDAOCreation } from '@/hooks/useDAOCreation';
import { useNFTCollectionValidation } from '@/hooks/useNFTCollectionValidation';

const CrearDAOPage: NextPage = () => {
  const router = useRouter();
  
  // Estados del formulario
  const [daoName, setDaoName] = useState('');
  const [nftContractAddress, setNftContractAddress] = useState('');
  const [minProposalCreationTokens, setMinProposalCreationTokens] = useState('');
  const [minVotesToApprove, setMinVotesToApprove] = useState('');
  const [minTokensToApprove, setMinTokensToApprove] = useState('');

  // Hook personalizado para manejo de creación de DAOs
  const {
    userRequirements,
    isLoadingRequirements,
    minNFTsRequired,
    daoCreationState,
    creationFee,
    createNewDAO,
    resetCreationState,
    formatETH,
    isConnected,
    address
  } = useDAOCreation();

  // Hook para validar que el usuario tenga NFTs en la colección especificada
  const {
    isValidating: isValidatingNFTs,
    hasNFTs,
    nftBalance: collectionNFTBalance,
    error: nftValidationError,
    isContractAddressValid,
    revalidate: revalidateNFTs
  } = useNFTCollectionValidation(nftContractAddress);

  // Efecto para manejar éxito de creación
  useEffect(() => {
    if (daoCreationState.isSuccess) {
      // Limpiar formulario
      setDaoName('');
      setNftContractAddress('');
      setMinProposalCreationTokens('');
      setMinVotesToApprove('');
      setMinTokensToApprove('');
      // Redirigir inmediatamente al perfil con parámetro de éxito
      router.push('/perfil?daoCreated=true');
    }
  }, [daoCreationState.isSuccess, router]);

  // Función para formatear números con separadores de miles
  const formatNumberWithCommas = (value: string) => {
    // Remover caracteres no numéricos
    const cleanValue = value.replace(/[^\d]/g, '');
    
    if (!cleanValue) return '';
    
    // Convertir a número y formatear con separadores de miles
    const number = parseInt(cleanValue, 10);
    return number.toLocaleString('es-CL');
  };

  // Función para manejar el cambio en inputs numéricos
  const handleNumericInputChange = (value: string, setter: (value: string) => void) => {
    // Permitir solo números para evitar confusión
    const cleanValue = value.replace(/[^\d]/g, '');
    // Formatear con separadores de miles en tiempo real
    const formatted = formatNumberWithCommas(cleanValue);
    setter(formatted);
  };

  // Función para manejar el formateo en blur (cuando el usuario sale del campo)
  const handleNumericInputBlur = (value: string, setter: (value: string) => void) => {
    const formatted = formatNumberWithCommas(value);
    setter(formatted);
  };

  // Función para manejar el formateo en focus (limpiar para edición)
  const handleNumericInputFocus = (value: string, setter: (value: string) => void) => {
    const cleanValue = value.replace(/[^\d]/g, '');
    setter(cleanValue);
  };

  // Función para crear DAO
  const handleCreateDAO = async () => {
    try {
      // Limpiar los valores formateados antes de enviar (remover comas)
      const cleanMinProposalCreationTokens = minProposalCreationTokens.replace(/[^\d]/g, '');
      const cleanMinVotesToApprove = minVotesToApprove.replace(/[^\d]/g, '');
      const cleanMinTokensToApprove = minTokensToApprove.replace(/[^\d]/g, '');
      
      await createNewDAO(
        daoName,
        nftContractAddress,
        parseInt(cleanMinProposalCreationTokens, 10),
        parseInt(cleanMinVotesToApprove, 10),
        parseInt(cleanMinTokensToApprove, 10)
      );
    } catch (error) {
      console.error('Error al crear DAO:', error);
      // El error ya se maneja en el hook
    }
  };

  // Función para limpiar errores
  const handleClearError = () => {
    resetCreationState();
  };

  // Validar si el formulario está completo
  const isFormValid = 
    daoName.trim() &&
    nftContractAddress.trim() &&
    minProposalCreationTokens &&
    minVotesToApprove &&
    minTokensToApprove &&
    Number(minProposalCreationTokens.replace(/[^\d]/g, '')) > 0 &&
    Number(minVotesToApprove.replace(/[^\d]/g, '')) > 0 &&
    Number(minTokensToApprove.replace(/[^\d]/g, '')) > 0 &&
    isContractAddressValid &&
    hasNFTs === true;

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>Crear DAO - DApp Polka</title>
        <meta
          content="Crear una nueva Organización Autónoma Descentralizada (DAO) en la plataforma"
          name="description"
        />
        <link href="/favicon.ico" rel="icon" />
      </Head>

      <div className="container mx-auto px-3 py-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground mb-1">
                Crear DAO
              </h1>
              <p className="text-muted-foreground text-xs">
                Crea tu propia Organización Autónoma Descentralizada
              </p>
            </div>
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-xs">
                <ArrowLeft className="w-3 h-3 mr-1" />
                Volver al Home
              </Button>
            </Link>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Verificación de requisitos */}
          <ClientOnly fallback={
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          }>
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center space-x-2">
                  <Info className="w-4 h-4" />
                  <span>Requisitos para Crear DAO</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {isLoadingRequirements ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Cargando requisitos...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Mostrar requisitos del contrato siempre */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Info className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          Requisitos del Contrato
                        </span>
                      </div>
                      <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
                        <p>• Estar registrado en la plataforma</p>
                        <p>• Poseer al menos {minNFTsRequired} NFTs</p>
                        <p>• Pagar la tarifa de creación</p>
                      </div>
                    </div>

                    {!isConnected ? (
                      <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm">Conecta tu wallet para verificar tu estado</span>
                      </div>
                    ) : userRequirements ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">Usuario registrado</span>
                          </div>
                          <Badge className={userRequirements.isRegistered 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }>
                            {userRequirements.isRegistered ? (
                              <><CheckCircle className="w-3 h-3 mr-1" />Sí</>
                            ) : (
                              <><XCircle className="w-3 h-3 mr-1" />No</>
                            )}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Coins className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">NFTs poseídos</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{userRequirements.nftBalance}</span>
                            <Badge className={userRequirements.nftBalance >= minNFTsRequired
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }>
                              {userRequirements.nftBalance >= minNFTsRequired ? (
                                <><CheckCircle className="w-3 h-3 mr-1" />✓</>
                              ) : (
                                <><XCircle className="w-3 h-3 mr-1" />Mín: {minNFTsRequired}</>
                              )}
                            </Badge>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-border">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Estado general</span>
                            <Badge className={userRequirements.canCreateDAO
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }>
                              {userRequirements.canCreateDAO ? (
                                <><CheckCircle className="w-3 h-3 mr-1" />Puedes crear DAO</>
                              ) : (
                                <><XCircle className="w-3 h-3 mr-1" />No cumples requisitos</>
                              )}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          </ClientOnly>

          {/* Formulario de creación */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Configuración del DAO</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dirección del contrato NFT */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Dirección del Contrato NFT
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={nftContractAddress}
                    onChange={(e) => setNftContractAddress(e.target.value)}
                    placeholder="0x..."
                    className={`w-full px-3 py-2 border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                      nftContractAddress.trim() !== '' && !isValidatingNFTs
                        ? hasNFTs === true
                          ? 'border-green-500 focus:ring-green-500'
                          : hasNFTs === false
                          ? 'border-red-500 focus:ring-red-500'
                          : nftValidationError
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-border'
                        : 'border-border'
                    }`}
                    disabled={daoCreationState.isCreating || daoCreationState.isConfirming || !userRequirements?.canCreateDAO}
                  />
                  {isValidatingNFTs && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {!isValidatingNFTs && nftContractAddress.trim() !== '' && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {hasNFTs === true ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : hasNFTs === false ? (
                        <XCircle className="w-4 h-4 text-red-500" />
                      ) : nftValidationError ? (
                        <XCircle className="w-4 h-4 text-red-500" />
                      ) : null}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Dirección del contrato NFT que se usará para determinar la membresía del DAO. 
                  <span className="text-orange-600 dark:text-orange-400 font-medium"> Debes poseer al menos 1 NFT en esta colección.</span>
                </p>
                
                {/* Feedback de validación de NFTs */}
                {nftContractAddress.trim() !== '' && !isValidatingNFTs && (
                  <div className="mt-2">
                    {hasNFTs === true ? (
                      <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs">
                          Posees {collectionNFTBalance} NFT{collectionNFTBalance !== 1 ? 's' : ''} en esta colección
                        </span>
                      </div>
                    ) : hasNFTs === false ? (
                      <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                        <XCircle className="w-4 h-4" />
                        <span className="text-xs">
                          No posees NFTs en esta colección (necesitas al menos 1)
                        </span>
                      </div>
                    ) : nftValidationError ? (
                      <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                        <XCircle className="w-4 h-4" />
                        <span className="text-xs">{nftValidationError}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={revalidateNFTs}
                          className="text-xs h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                        >
                          Reintentar
                        </Button>
                      </div>
                    ) : null}
                  </div>
                )}
                
                {isValidatingNFTs && (
                  <div className="mt-2 flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs">Verificando balance de NFTs...</span>
                  </div>
                )}
              </div>

              {/* Nombre del DAO */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nombre del DAO
                </label>
                <input
                  type="text"
                  value={daoName}
                  onChange={(e) => setDaoName(e.target.value)}
                  placeholder="Mi DAO"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={daoCreationState.isCreating || daoCreationState.isConfirming || !userRequirements?.canCreateDAO}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Nombre único para identificar tu DAO
                </p>
              </div>

              {/* Tokens mínimos para crear propuestas */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tokens Mínimos para Crear Propuestas
                </label>
                <input
                  type="text"
                  value={minProposalCreationTokens}
                  onChange={(e) => handleNumericInputChange(e.target.value, setMinProposalCreationTokens)}
                  onFocus={(e) => handleNumericInputFocus(e.target.value, setMinProposalCreationTokens)}
                  onBlur={(e) => handleNumericInputBlur(e.target.value, setMinProposalCreationTokens)}
                  placeholder="10"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={daoCreationState.isCreating || daoCreationState.isConfirming || !userRequirements?.canCreateDAO}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Cantidad mínima de tokens NFT que debe poseer un usuario para crear propuestas
                </p>
              </div>

              {/* Votos mínimos para aprobar */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Votos Únicos Mínimos para Aprobar
                </label>
                <input
                  type="text"
                  value={minVotesToApprove}
                  onChange={(e) => handleNumericInputChange(e.target.value, setMinVotesToApprove)}
                  onFocus={(e) => handleNumericInputFocus(e.target.value, setMinVotesToApprove)}
                  onBlur={(e) => handleNumericInputBlur(e.target.value, setMinVotesToApprove)}
                  placeholder="5"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={daoCreationState.isCreating || daoCreationState.isConfirming || !userRequirements?.canCreateDAO}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Número mínimo de votos requeridos para aprobar una propuesta
                </p>
              </div>

              {/* Tokens mínimos para aprobar */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tokens Mínimos para Aprobar
                </label>
                <input
                  type="text"
                  value={minTokensToApprove}
                  onChange={(e) => handleNumericInputChange(e.target.value, setMinTokensToApprove)}
                  onFocus={(e) => handleNumericInputFocus(e.target.value, setMinTokensToApprove)}
                  onBlur={(e) => handleNumericInputBlur(e.target.value, setMinTokensToApprove)}
                  placeholder="50"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={daoCreationState.isCreating || daoCreationState.isConfirming || !userRequirements?.canCreateDAO}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Cantidad mínima de tokens que debe tener un usuario para que su voto cuente
                </p>
              </div>

              {/* Información de tarifa */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Tarifa de Creación
                  </span>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  {creationFee ? `${formatETH(creationFee as bigint)} ETH` : 'Cargando...'}
                </p>
              </div>

              {/* Botón de creación */}
              <Button
                onClick={handleCreateDAO}
                disabled={
                  daoCreationState.isCreating || 
                  daoCreationState.isConfirming ||
                  !userRequirements?.canCreateDAO || 
                  !isConnected ||
                  !isFormValid ||
                  isValidatingNFTs ||
                  (nftContractAddress.trim() !== '' && hasNFTs !== true)
                }
                className="w-full"
              >
                {daoCreationState.isCreating || daoCreationState.isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {daoCreationState.isCreating ? 'Enviando transacción...' : 
                     daoCreationState.isConfirming ? 'Confirmando...' : 'Creando DAO...'}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear DAO
                  </>
                )}
              </Button>

              <ClientOnly fallback={null}>
                {!isConnected && (
                  <p className="text-sm text-muted-foreground text-center">
                    Conecta tu wallet para crear un DAO
                  </p>
                )}
              </ClientOnly>

              <ClientOnly fallback={null}>
                {isConnected && !userRequirements?.canCreateDAO && (
                  <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                        No cumples con los requisitos
                      </span>
                    </div>
                    <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                      Necesitas estar registrado y poseer al menos {minNFTsRequired} NFTs para crear un DAO.
                    </p>
                  </div>
                )}
              </ClientOnly>

              {/* Mostrar errores si los hay */}
              <ClientOnly fallback={null}>
                {daoCreationState.error && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-800 dark:text-red-200">
                          Error al crear DAO
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearError}
                        className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                      >
                        Cerrar
                      </Button>
                    </div>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                      {daoCreationState.error}
                    </p>
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCreateDAO}
                        className="w-full text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                        disabled={
                          daoCreationState.isCreating || 
                          daoCreationState.isConfirming ||
                          !userRequirements?.canCreateDAO || 
                          !isConnected ||
                          !isFormValid ||
                          isValidatingNFTs ||
                          (nftContractAddress.trim() !== '' && hasNFTs !== true)
                        }
                      >
                        Reintentar
                      </Button>
                    </div>
                  </div>
                )}
              </ClientOnly>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CrearDAOPage;
