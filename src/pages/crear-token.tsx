import type { NextPage } from 'next';
import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Coins, 
  Plus, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Users, 
  DollarSign,
  Info,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { useRouter } from 'next/router';
import ClientOnly from '@/components/ClientOnly';
import Link from 'next/link';
import { useTokenCreation } from '@/hooks/useTokenCreation';

const CrearTokenPage: NextPage = () => {
  const router = useRouter();
  
  // Estados del formulario
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [initialSupply, setInitialSupply] = useState('');

  // Hook personalizado para manejo de creación de tokens
  const {
    userRequirements,
    minNFTsRequired,
    tokenCreationState,
    creationFee,
    createNewToken,
    resetCreationState,
    formatETH,
    isConnected,
    address
  } = useTokenCreation();

  // Efecto para manejar éxito de creación
  useEffect(() => {
    if (tokenCreationState.isSuccess) {
      // Limpiar formulario
      setTokenName('');
      setTokenSymbol('');
      setInitialSupply('');
      // Redirigir inmediatamente al perfil con parámetro de éxito
      router.push('/perfil?tokenCreated=true');
    }
  }, [tokenCreationState.isSuccess, router]);

  // Función para formatear números con separadores de miles
  const formatNumberWithCommas = (value: string) => {
    // Remover caracteres no numéricos
    const cleanValue = value.replace(/[^\d]/g, '');
    
    if (!cleanValue) return '';
    
    // Convertir a número y formatear con separadores de miles
    const number = parseInt(cleanValue, 10);
    return number.toLocaleString('es-CL');
  };

  // Función para manejar el cambio en el input de cantidad
  const handleInitialSupplyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Permitir solo números para evitar confusión
    const cleanValue = value.replace(/[^\d]/g, '');
    // Formatear con separadores de miles en tiempo real
    const formatted = formatNumberWithCommas(cleanValue);
    setInitialSupply(formatted);
  };

  // Función para manejar el formateo en blur (cuando el usuario sale del campo)
  const handleInitialSupplyBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const formatted = formatNumberWithCommas(e.target.value);
    setInitialSupply(formatted);
  };

  // Función para manejar el formateo en focus (limpiar para edición)
  const handleInitialSupplyFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const cleanValue = e.target.value.replace(/[^\d]/g, '');
    setInitialSupply(cleanValue);
  };

  // Función para crear token
  const handleCreateToken = async () => {
    try {
      // Limpiar el valor formateado antes de enviar (remover comas)
      const cleanSupply = initialSupply.replace(/[^\d]/g, '');
      await createNewToken(tokenName, tokenSymbol, cleanSupply);
    } catch (error) {
      console.error('Error al crear token:', error);
      // El error ya se maneja en el hook
    }
  };

  // Función para limpiar errores
  const handleClearError = () => {
    resetCreationState();
  };


  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>Crear Token - DApp Polka</title>
        <meta
          content="Crear un nuevo token ERC20 en la plataforma"
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
                Crear Token ERC20
              </h1>
              <p className="text-muted-foreground text-xs">
                Crea tu propio token personalizado
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
                  <span>Requisitos para Crear Token</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {userRequirements.isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Verificando requisitos...</span>
                  </div>
                ) : !isConnected ? (
                  <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">Conecta tu wallet para verificar requisitos</span>
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
                        <Badge className={userRequirements.canCreateToken
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }>
                          {userRequirements.canCreateToken ? (
                            <><CheckCircle className="w-3 h-3 mr-1" />Puedes crear token</>
                          ) : (
                            <><XCircle className="w-3 h-3 mr-1" />No cumples requisitos</>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </ClientOnly>

          {/* Formulario de creación */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Información del Token</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nombre del token */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nombre del Token
                </label>
                <input
                  type="text"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="Ej: Mi Token Personalizado"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={tokenCreationState.isCreating || tokenCreationState.isConfirming || !userRequirements.canCreateToken}
                />
              </div>

              {/* Símbolo del token */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Símbolo del Token
                </label>
                <input
                  type="text"
                  value={tokenSymbol}
                  onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                  placeholder="Ej: MTP"
                  maxLength={10}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={tokenCreationState.isCreating || tokenCreationState.isConfirming || !userRequirements.canCreateToken}
                />
              </div>

              {/* Suministro inicial */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Suministro Inicial
                </label>
                <input
                  type="text"
                  value={initialSupply}
                  onChange={handleInitialSupplyChange}
                  onFocus={handleInitialSupplyFocus}
                  onBlur={handleInitialSupplyBlur}
                  placeholder="1000000"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={tokenCreationState.isCreating || tokenCreationState.isConfirming || !userRequirements.canCreateToken}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Cantidad total de tokens que se crearán (se formatea automáticamente mientras escribes)
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
                onClick={handleCreateToken}
                disabled={
                  tokenCreationState.isCreating || 
                  tokenCreationState.isConfirming ||
                  !userRequirements.canCreateToken || 
                  !isConnected ||
                  !tokenName.trim() ||
                  !tokenSymbol.trim() ||
                  !initialSupply ||
                  Number(initialSupply.replace(/[^\d]/g, '')) <= 0
                }
                className="w-full"
              >
                {tokenCreationState.isCreating || tokenCreationState.isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {tokenCreationState.isCreating ? 'Enviando transacción...' : 
                     tokenCreationState.isConfirming ? 'Confirmando...' : 'Creando token...'}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Token
                  </>
                )}
              </Button>

              <ClientOnly fallback={null}>
                {!isConnected && (
                  <p className="text-sm text-muted-foreground text-center">
                    Conecta tu wallet para crear un token
                  </p>
                )}
              </ClientOnly>

              <ClientOnly fallback={null}>
                {isConnected && !userRequirements.canCreateToken && (
                  <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                        No cumples con los requisitos
                      </span>
                    </div>
                    <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                      Necesitas estar registrado y poseer al menos {minNFTsRequired} NFTs para crear un token.
                    </p>
                  </div>
                )}
              </ClientOnly>

              {/* Mostrar errores si los hay */}
              <ClientOnly fallback={null}>
                {tokenCreationState.error && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-800 dark:text-red-200">
                          Error al crear token
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
                      {tokenCreationState.error}
                    </p>
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCreateToken}
                        className="w-full text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                        disabled={
                          tokenCreationState.isCreating || 
                          tokenCreationState.isConfirming ||
                          !userRequirements.canCreateToken || 
                          !isConnected ||
                          !tokenName.trim() ||
                          !tokenSymbol.trim() ||
                          !initialSupply ||
                          Number(initialSupply.replace(/[^\d]/g, '')) <= 0
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

export default CrearTokenPage;
