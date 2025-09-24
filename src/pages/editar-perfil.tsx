import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Users, Mail, Twitter, Github, MessageCircle, Image as ImageIcon, Save, CheckCircle, AlertCircle, X, Edit3 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useContractRead, useAccount, useWriteContract, useWaitForTransactionReceipt, useWatchContractEvent } from 'wagmi';
import ClientOnly from '@/components/ClientOnly';

// Cargar ABI del contrato desde variable de entorno
const UsersContract = require(process.env.NEXT_PUBLIC_USERS_CONTRACT_ABI_PATH!);

// Interfaz para los datos del usuario
interface UserInfo {
  username: string;
  email: string;
  twitterLink: string;
  githubLink: string;
  telegramLink: string;
  avatarLink: string;
  coverImageLink: string;
}

const EditarPerfilPage: NextPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    twitterLink: '',
    githubLink: '',
    telegramLink: '',
    avatarLink: '',
    coverImageLink: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isUserRegistered, setIsUserRegistered] = useState(false);
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [processedEvents, setProcessedEvents] = useState<Set<string>>(new Set());
  const [isInEditMode, setIsInEditMode] = useState(false);
  const { address, isConnected } = useAccount();

  // Dirección del contrato desde variables de entorno
  const contractAddress = process.env.NEXT_PUBLIC_USERS_CONTRACT_ADDRESS as `0x${string}`;

  // Leer datos del contrato
  const { data: totalMembers, refetch: refetchTotalMembers } = useContractRead({
    address: contractAddress,
    abi: UsersContract.abi,
    functionName: 'getTotalMembers',
  });

  const { data: allUsers, refetch: refetchAllUsers } = useContractRead({
    address: contractAddress,
    abi: UsersContract.abi,
    functionName: 'getAllUsers',
  });

  const { data: userRegistered, refetch: refetchUserRegistered } = useContractRead({
    address: contractAddress,
    abi: UsersContract.abi,
    functionName: 'isRegisteredUser',
    args: address ? [address] : ['0x0000000000000000000000000000000000000000'],
  });

  // Leer información del usuario actual
  const { data: userInfo, refetch: refetchUserInfo } = useContractRead({
    address: contractAddress,
    abi: UsersContract.abi,
    functionName: 'getUserInfo',
    args: address ? [address] : ['0x0000000000000000000000000000000000000000'],
  }) as { data: UserInfo | undefined; refetch: () => void };

  // Configurar escritura del contrato
  const { writeContract: writeContract, data: updateData, error: updateErrorData, isPending: isUpdatePending } = useWriteContract();

  // Esperar a que se complete la transacción
  const { isLoading: isUpdateReceiptPending, isSuccess: isUpdateSuccess } = useWaitForTransactionReceipt({
    hash: updateData,
  });

  // Escuchar eventos de actualización del contrato
  useWatchContractEvent({
    address: contractAddress,
    abi: UsersContract.abi,
    eventName: 'UserInfoUpdated',
    onLogs(logs: any[]) {
      // Solo procesar si hay una dirección conectada
      if (!address) return;
      
      // Buscar eventos que coincidan con la dirección del usuario actual
      const userEvents = logs.filter(log => 
        log.args && log.args.user && log.args.user.toLowerCase() === address.toLowerCase()
      );
      
      if (userEvents.length > 0) {
        // Crear un identificador único para cada evento basado en transactionHash y logIndex
        const newEventIds = userEvents.map(log => `${log.transactionHash}-${log.logIndex}`);
        
        // Filtrar solo eventos que no han sido procesados
        const unprocessedEvents = newEventIds.filter(eventId => !processedEvents.has(eventId));
        
        if (unprocessedEvents.length > 0) {
          // Marcar estos eventos como procesados
          setProcessedEvents(prev => {
            const newSet = new Set(prev);
            unprocessedEvents.forEach(eventId => newSet.add(eventId));
            return newSet;
          });
          
          // Solo actualizar el estado si no hay un proceso de actualización en curso
          // y el usuario no está en modo de edición activa
          if (!isUpdating && !isUpdatePending && !isUpdateReceiptPending && !isTransitioning && !isInEditMode) {
            setIsUpdating(false);
            setShowSuccessPage(true);
          }
        }
      }
    },
  });

  // Función para refrescar todos los datos después de la actualización
  const refreshAllData = useCallback(async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await Promise.all([
        refetchTotalMembers(),
        refetchAllUsers(),
        refetchUserRegistered(),
        refetchUserInfo(),
      ]);
    } catch (error) {
      console.error('Error al refrescar datos:', error);
    }
  }, [refetchTotalMembers, refetchAllUsers, refetchUserRegistered, refetchUserInfo]);

  // Efecto para cargar datos del usuario
  useEffect(() => {
    if (userInfo && userRegistered) {
      setFormData({
        username: userInfo.username || '',
        email: userInfo.email || '',
        twitterLink: userInfo.twitterLink || '',
        githubLink: userInfo.githubLink || '',
        telegramLink: userInfo.telegramLink || '',
        avatarLink: userInfo.avatarLink || '',
        coverImageLink: userInfo.coverImageLink || ''
      });
      setIsUserRegistered(true);
      setIsLoadingUserData(false);
      // Activar modo de edición cuando se cargan los datos
      setIsInEditMode(true);
    } else if (userRegistered === false) {
      setIsUserRegistered(false);
      setIsLoadingUserData(false);
    }
  }, [userInfo, userRegistered]);

  // Efecto para manejar el estado de actualización
  useEffect(() => {
    if (isUpdatePending || isUpdateReceiptPending) {
      setIsUpdating(true);
      setUpdateError(null);
      setIsTransitioning(false);
    } else if (isUpdateSuccess) {
      setIsUpdating(false);
      setIsTransitioning(true);
      
      // Usar un timeout para crear una transición suave
      setTimeout(() => {
        setShowSuccessPage(true);
        setIsTransitioning(false);
      }, 500);
      refreshAllData();
    } else if (updateErrorData) {
      setIsUpdating(false);
      setIsTransitioning(false);
      setUpdateError(updateErrorData?.message || 'Error al actualizar perfil');
    }
  }, [isUpdatePending, isUpdateReceiptPending, isUpdateSuccess, updateErrorData, refreshAllData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdate = async () => {
    if (!isConnected) {
      setUpdateError('Por favor conecta tu wallet primero');
      return;
    }

    if (!isUserRegistered) {
      setUpdateError('No estás registrado en el sistema');
      return;
    }

    // Desactivar modo de edición al iniciar actualización
    setIsInEditMode(false);

    try {
      writeContract({
        address: contractAddress,
        abi: UsersContract.abi,
        functionName: 'updateUserInfo',
        args: [
          formData.email,
          formData.twitterLink,
          formData.githubLink,
          formData.telegramLink,
          formData.avatarLink,
          formData.coverImageLink
        ],
      });
    } catch (error) {
      setUpdateError('Error al iniciar el proceso de actualización');
    }
  };

  const handleResetForm = () => {
    if (userInfo) {
      setFormData({
        username: userInfo.username || '',
        email: userInfo.email || '',
        twitterLink: userInfo.twitterLink || '',
        githubLink: userInfo.githubLink || '',
        telegramLink: userInfo.telegramLink || '',
        avatarLink: userInfo.avatarLink || '',
        coverImageLink: userInfo.coverImageLink || ''
      });
    }
    setUpdateError(null);
    setShowSuccessPage(false);
    setIsTransitioning(false);
    // Activar modo de edición para evitar redirecciones automáticas
    setIsInEditMode(true);
    // Limpiar eventos procesados para permitir nuevos eventos
    setProcessedEvents(new Set());
  };

  const mainStats = [
    {
      label: 'Total Usuarios',
      value: totalMembers ? Number(totalMembers).toString() : '0',
      icon: Users,
      color: 'from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800'
    },
    {
      label: 'Tu Estado',
      value: showSuccessPage ? 'Actualizado' : isTransitioning ? 'Procesando...' : isUserRegistered ? 'Registrado' : 'No Registrado',
      icon: User,
      color: showSuccessPage 
        ? 'from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800'
        : isTransitioning
        ? 'from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800'
        : isUserRegistered
        ? 'from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800'
        : 'from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>Editar Perfil - DApp Polka</title>
        <meta
          content="Edita tu perfil en la plataforma DApp Polka"
          name="description"
        />
        <link href="/favicon.ico" rel="icon" />
      </Head>

      <div className="container mx-auto px-3 py-4">
        <ClientOnly fallback={
          <div className="max-w-md mx-auto">
            <Card className="p-4">
              <CardContent className="p-0">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Cargando...
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Preparando el editor de perfil
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        }>
          {/* Si no está conectado, mostrar mensaje */}
          {!isConnected ? (
            <div className="max-w-md mx-auto">
              <Card className="p-4">
                <CardContent className="p-0">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto">
                      <AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Wallet no conectada
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Conecta tu wallet para editar tu perfil
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : !isUserRegistered && !isLoadingUserData ? (
            <div className="max-w-md mx-auto">
              <Card className="p-4">
                <CardContent className="p-0">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto">
                      <AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No estás registrado
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Primero debes registrarte para poder editar tu perfil
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              {/* Header compacto */}
              <div className="mb-4">
            <div>
              <h1 className="text-lg font-bold text-foreground mb-1">
                Editar Perfil
              </h1>
              <p className="text-muted-foreground text-xs">
                Actualiza tu información en la comunidad DApp Polka
              </p>
            </div>
          </div>

          {/* Estadísticas principales */}
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-2">
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
            </div>
          </div>

          {/* Panel de edición */}
          <div className="max-w-md mx-auto">
          <Card className="p-4">
            <CardContent className="p-0">
              <div className="space-y-4">
                {/* Mensaje de error */}
                {updateError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span className="text-sm text-red-600 dark:text-red-400">{updateError}</span>
                      </div>
                      <button
                        onClick={() => setUpdateError(null)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Pantalla de transición */}
                {isTransitioning ? (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Actualizando perfil...
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Confirmando tus cambios en la blockchain
                      </p>
                    </div>
                  </div>
                ) : !showSuccessPage ? (
                  <div className="space-y-3">
                    {/* Username (solo lectura) */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Nombre de Usuario
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={formData.username}
                          disabled
                          className="w-full pl-10 pr-3 py-2 text-sm border border-input bg-muted rounded-md text-muted-foreground cursor-not-allowed"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        El nombre de usuario no se puede cambiar
                      </p>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="tu@email.com"
                          className="w-full pl-10 pr-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Twitter Link */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Twitter
                      </label>
                      <div className="relative">
                        <Twitter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="url"
                          name="twitterLink"
                          value={formData.twitterLink}
                          onChange={handleInputChange}
                          placeholder="https://twitter.com/tuusuario"
                          className="w-full pl-10 pr-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* GitHub Link */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        GitHub
                      </label>
                      <div className="relative">
                        <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="url"
                          name="githubLink"
                          value={formData.githubLink}
                          onChange={handleInputChange}
                          placeholder="https://github.com/tuusuario"
                          className="w-full pl-10 pr-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Telegram Link */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Telegram
                      </label>
                      <div className="relative">
                        <MessageCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="url"
                          name="telegramLink"
                          value={formData.telegramLink}
                          onChange={handleInputChange}
                          placeholder="https://t.me/tuusuario"
                          className="w-full pl-10 pr-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Avatar Link */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Avatar
                      </label>
                      <div className="relative">
                        <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="url"
                          name="avatarLink"
                          value={formData.avatarLink}
                          onChange={handleInputChange}
                          placeholder="https://ejemplo.com/avatar.jpg"
                          className="w-full pl-10 pr-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Cover Image Link */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Imagen de Portada
                      </label>
                      <div className="relative">
                        <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="url"
                          name="coverImageLink"
                          value={formData.coverImageLink}
                          onChange={handleInputChange}
                          placeholder="https://ejemplo.com/portada.jpg"
                          className="w-full pl-10 pr-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Botones */}
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleUpdate}
                        disabled={isUpdating || !isConnected || !isUserRegistered}
                        className="flex-1"
                        size="lg"
                      >
                        {isUpdating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Actualizando...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Guardar Cambios
                          </>
                        )}
                      </Button>
                      
                    </div>
                  </div>
                ) : (
                  /* Perfil actualizado exitosamente */
                  <div className="text-center space-y-4 animate-in fade-in-50 duration-500">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        ¡Perfil actualizado!
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Tus cambios se han guardado correctamente
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleResetForm}
                        variant="outline"
                        className="flex-1"
                      >
                        Editar Nuevamente
                      </Button>
                      <Button
                        onClick={() => router.push('/perfil')}
                        className="flex-1"
                      >
                        Perfil de Usuario
                      </Button>
                    </div>
                  </div>
                )}

                {/* Información adicional */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• El nombre de usuario no se puede cambiar</p>
                  <p>• Los enlaces son opcionales pero recomendados</p>
                  <p>• Puedes actualizar tu información en cualquier momento</p>
                  {!isConnected && (
                    <p className="text-amber-600 dark:text-amber-400">
                      ⚠️ Conecta tu wallet para poder editar tu perfil
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
            </>
          )}
        </ClientOnly>
      </div>
    </div>
  );
};

export default EditarPerfilPage;
