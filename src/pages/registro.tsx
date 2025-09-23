import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Users, Mail, Twitter, Github, MessageCircle, Image as ImageIcon, UserPlus, CheckCircle, AlertCircle, X, Edit3 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useContractRead, useAccount, useWriteContract, useWaitForTransactionReceipt, useWatchContractEvent } from 'wagmi';
import ClientOnly from '@/components/ClientOnly';

// Cargar ABI del contrato desde variable de entorno
const UsersContract = require(process.env.NEXT_PUBLIC_USERS_CONTRACT_ABI_PATH!);

const RegistroPage: NextPage = () => {
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
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [isUserRegistered, setIsUserRegistered] = useState(false);
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
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

  // Configurar escritura del contrato
  const { writeContract: writeContract, data: registerData, error: registerErrorData, isPending: isRegisterPending } = useWriteContract();

  // Esperar a que se complete la transacción
  const { isLoading: isRegisterReceiptPending, isSuccess: isRegisterSuccess } = useWaitForTransactionReceipt({
    hash: registerData,
  });

  // Escuchar eventos de registro del contrato
  useWatchContractEvent({
    address: contractAddress,
    abi: UsersContract.abi,
    eventName: 'UserRegistered',
    onLogs(logs: any[]) {
      // Solo procesar si hay una dirección conectada
      if (!address) return;
      
      // Buscar eventos que coincidan con la dirección del usuario actual
      const userEvents = logs.filter(log => 
        log.args && log.args.user && log.args.user.toLowerCase() === address.toLowerCase()
      );
      
      if (userEvents.length > 0) {
        // Solo actualizar el estado de registro si no está ya registrado
        // y no hay un proceso de registro en curso
        if (!isUserRegistered && !isRegistering && !isRegisterPending && !isRegisterReceiptPending) {
          setIsUserRegistered(true);
          setShowSuccessPage(true);
          setIsTransitioning(false);
        }
      }
    },
  });

  // Función para refrescar todos los datos después del registro
  const refreshAllData = useCallback(async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await Promise.all([
        refetchTotalMembers(),
        refetchAllUsers(),
        refetchUserRegistered(),
      ]);
    } catch (error) {
      console.error('Error al refrescar datos:', error);
    }
  }, [refetchTotalMembers, refetchAllUsers, refetchUserRegistered]);

  // Efecto para manejar el estado de registro
  useEffect(() => {
    if (isRegisterPending || isRegisterReceiptPending) {
      setIsRegistering(true);
      setRegisterError(null);
      setIsTransitioning(false);
    } else if (isRegisterSuccess) {
      setIsRegistering(false);
      setIsTransitioning(true);
      
      // Solo actualizar el estado de registro si no está ya registrado
      if (!isUserRegistered) {
        // Usar un timeout para crear una transición suave
        setTimeout(() => {
          setIsUserRegistered(true);
          setShowSuccessPage(true);
          setIsTransitioning(false);
        }, 1000);
      } else {
        // Si ya está registrado, solo desactivar la transición
        setIsTransitioning(false);
      }
      refreshAllData();
    } else if (registerErrorData) {
      setIsRegistering(false);
      setIsTransitioning(false);
      setRegisterError(registerErrorData?.message || 'Error al registrar usuario');
    }
  }, [isRegisterPending, isRegisterReceiptPending, isRegisterSuccess, registerErrorData, refreshAllData, isUserRegistered]);

  // Efecto para verificar si el usuario ya está registrado
  useEffect(() => {
    if (userRegistered !== undefined) {
      const wasRegistered = isUserRegistered;
      const isNowRegistered = Boolean(userRegistered);
      
      if (isNowRegistered && !wasRegistered) {
        // Si el usuario se registró, mostrar la página de éxito
        setShowSuccessPage(true);
        setIsTransitioning(false);
      } else if (!isNowRegistered && wasRegistered) {
        // Si el usuario ya no está registrado, ocultar la página de éxito
        setShowSuccessPage(false);
        setIsTransitioning(false);
      }
      
      setIsUserRegistered(isNowRegistered);
    }
  }, [userRegistered, isUserRegistered]);

  // Efecto para limpiar el estado de transición después de un tiempo
  useEffect(() => {
    if (isTransitioning) {
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
      }, 5000); // Timeout de 5 segundos como fallback
      
      return () => clearTimeout(timeout);
    }
  }, [isTransitioning]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegister = async () => {
    if (!isConnected) {
      setRegisterError('Por favor conecta tu wallet primero');
      return;
    }

    if (isUserRegistered) {
      setRegisterError('Ya estás registrado en el sistema');
      return;
    }

    if (!formData.username.trim()) {
      setRegisterError('El nombre de usuario es obligatorio');
      return;
    }

    try {
      writeContract({
        address: contractAddress,
        abi: UsersContract.abi,
        functionName: 'registerUser',
        args: [
          formData.username,
          formData.email,
          formData.twitterLink,
          formData.githubLink,
          formData.telegramLink,
          formData.avatarLink,
          formData.coverImageLink
        ],
      });
    } catch (error) {
      setRegisterError('Error al iniciar el proceso de registro');
    }
  };

  const handleResetForm = () => {
    setFormData({
      username: '',
      email: '',
      twitterLink: '',
      githubLink: '',
      telegramLink: '',
      avatarLink: '',
      coverImageLink: ''
    });
    setRegisterError(null);
    setShowSuccessPage(false);
    setIsTransitioning(false);
    setIsRegistering(false);
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
      value: showSuccessPage ? 'Registrado' : isTransitioning ? 'Procesando...' : 'No Registrado',
      icon: User,
      color: showSuccessPage 
        ? 'from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800'
        : isTransitioning
        ? 'from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800'
        : 'from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>Registro de Usuario - DApp Polka</title>
        <meta
          content="Regístrate en la plataforma DApp Polka"
          name="description"
        />
        <link href="/favicon.ico" rel="icon" />
      </Head>

      <div className="container mx-auto px-3 py-4">
        {/* Header compacto */}
        <div className="mb-4">
          <div>
            <h1 className="text-lg font-bold text-foreground mb-1">
              Registro de Usuario
            </h1>
            <p className="text-muted-foreground text-xs">
              Únete a la comunidad DApp Polka
            </p>
          </div>
        </div>

        {/* Estadísticas principales */}
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-2">
            <ClientOnly fallback={
              <>
                <Card className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1 truncate">Usuarios Registrados</p>
                        <p className="text-sm font-bold text-foreground truncate">0</p>
                      </div>
                      <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center ml-2 flex-shrink-0">
                        <Users className="w-3 h-3 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1 truncate">Tu Estado</p>
                        <p className="text-sm font-bold text-foreground truncate">No Registrado</p>
                      </div>
                      <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center ml-2 flex-shrink-0">
                        <User className="w-3 h-3 text-primary" />
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

        {/* Panel de registro */}
        <div className="max-w-md mx-auto">
          <Card className="p-4">
            <CardContent className="p-0">
              <div className="space-y-4">
                {/* Mensaje de error */}
                <ClientOnly fallback={null}>
                  {registerError && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                          <span className="text-sm text-red-600 dark:text-red-400">{registerError}</span>
                        </div>
                        <button
                          onClick={() => setRegisterError(null)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </ClientOnly>


                {/* Pantalla de transición */}
                {isTransitioning ? (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Procesando registro...
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Confirmando tu registro en la blockchain
                      </p>
                    </div>
                  </div>
                ) : !showSuccessPage ? (
                  <div className="space-y-3">
                    {/* Username */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Nombre de Usuario *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          placeholder="Tu nombre de usuario"
                          className="w-full pl-10 pr-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                          required
                        />
                      </div>
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

                    {/* Botón de registro */}
                    <ClientOnly fallback={
                      <Button
                        onClick={handleRegister}
                        disabled={true}
                        className="w-full"
                        size="lg"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Cargando...
                      </Button>
                    }>
                      <Button
                        onClick={handleRegister}
                        disabled={isRegistering || !isConnected || !formData.username.trim()}
                        className="w-full"
                        size="lg"
                      >
                        {!isConnected ? (
                          <>
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Conecta tu Wallet
                          </>
                        ) : isRegistering ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Registrando...
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Registrarse
                          </>
                        )}
                      </Button>
                    </ClientOnly>
                  </div>
                ) : (
                  /* Usuario ya registrado */
                  <div className="text-center space-y-4 animate-in fade-in-50 duration-500">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        ¡Registro exitoso!
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Ya formas parte de la comunidad DApp Polka
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link href="/editar-perfil" className="flex-1">
                        <Button
                          variant="outline"
                          className="w-full"
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Editar Perfil
                        </Button>
                      </Link>
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
                  <p>• Solo el nombre de usuario es obligatorio</p>
                  <p>• Los enlaces son opcionales pero recomendados</p>
                  <p>• Puedes editar tu perfil en cualquier momento</p>
                  <p>• El nombre de usuario no se puede cambiar después del registro</p>
                  <ClientOnly fallback={null}>
                    {!isConnected && (
                      <p className="text-amber-600 dark:text-amber-400">
                        ⚠️ Conecta tu wallet para poder registrarte
                      </p>
                    )}
                  </ClientOnly>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RegistroPage;
