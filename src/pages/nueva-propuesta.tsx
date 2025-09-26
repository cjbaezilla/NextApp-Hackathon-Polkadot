import type { NextPage } from 'next';
import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DatePicker from '@/components/ui/date-picker';
import { ArrowLeft, FileText, Clock, User, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { useContractRead, useWriteContract, useAccount, useWaitForTransactionReceipt } from 'wagmi';
import ClientOnly from '@/components/ClientOnly';
import { useDAOAddress } from '@/hooks/useDAOAddress';
import { useRouter } from 'next/router';

// Importar ABI del contrato DAO
const DAOContract = require(process.env.NEXT_PUBLIC_DAO_CONTRACT_ABI_PATH!);

const NuevaPropuestaPage: NextPage = () => {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  
  // Obtener dirección del contrato DAO desde URL o variables de entorno
  const daoContractAddress = useDAOAddress();
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    description: '',
    link: '',
    startTime: '',
    endTime: ''
  });

  // Función para convertir fecha DD-MM-YYYY a timestamp
  const parseDateToTimestamp = (dateStr: string): number => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Los meses en JS van de 0-11
      const year = parseInt(parts[2], 10);
      
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day).getTime() / 1000;
      }
    }
    return 0;
  };

  // Función para convertir fecha DD-MM-YYYY HH:MM a timestamp
  const parseDateTimeToTimestamp = (dateTimeStr: string): number => {
    const [datePart, timePart] = dateTimeStr.split(' ');
    const parts = datePart.split('-');
    
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      
      let hours = 0;
      let minutes = 0;
      
      if (timePart) {
        const [h, m] = timePart.split(':');
        hours = parseInt(h, 10) || 0;
        minutes = parseInt(m, 10) || 0;
      }
      
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day, hours, minutes).getTime() / 1000;
      }
    }
    return 0;
  };
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Leer datos del contrato DAO
  const { data: minimumTokensToCreate, error: minTokensError, isLoading: minTokensLoading } = useContractRead({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'MIN_PROPOSAL_CREATION_TOKENS',
  });

  const { data: userVotingPower, error: votingPowerError, isLoading: votingPowerLoading } = useContractRead({
    address: daoContractAddress,
    abi: DAOContract.abi,
    functionName: 'getVotingPower',
    args: address ? [address] : undefined,
  });


  // Función para crear propuesta
  const { writeContract: createProposal, data: createData, isPending: isCreating } = useWriteContract();

  // Esperar confirmación de la transacción
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: createData as `0x${string}`,
  });

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  // Validar formulario
  const validateForm = () => {
    if (!formData.description.trim()) {
      setError('La descripción es requerida');
      return false;
    }
    if (!formData.link.trim()) {
      setError('El enlace es requerido');
      return false;
    }
    if (!formData.startTime) {
      setError('La fecha de inicio es requerida');
      return false;
    }
    if (!formData.endTime) {
      setError('La fecha de fin es requerida');
      return false;
    }

    const startTime = parseDateTimeToTimestamp(formData.startTime);
    const endTime = parseDateTimeToTimestamp(formData.endTime);
    const now = Date.now() / 1000;

    if (startTime === 0) {
      setError('Formato de fecha de inicio inválido. Use DD-MM-YYYY HH:MM');
      return false;
    }
    if (endTime === 0) {
      setError('Formato de fecha de fin inválido. Use DD-MM-YYYY HH:MM');
      return false;
    }

    if (startTime <= now) {
      setError('La fecha de inicio debe ser en el futuro');
      return false;
    }
    if (endTime <= startTime) {
      setError('La fecha de fin debe ser posterior a la fecha de inicio');
      return false;
    }

    return true;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      setError('Debes conectar tu wallet para crear una propuesta');
      return;
    }

    if (isLoadingContractData) {
      setError('Cargando datos del contrato, por favor espera...');
      return;
    }

    if (!canCreateProposal) {
      setError(`Necesitas al menos ${minimumTokensToCreate ? Number(minimumTokensToCreate).toString() : '10'} NFTs para crear propuestas`);
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const startTime = Math.floor(parseDateTimeToTimestamp(formData.startTime));
      const endTime = Math.floor(parseDateTimeToTimestamp(formData.endTime));

      createProposal({
        address: daoContractAddress,
        abi: DAOContract.abi,
        functionName: 'createProposal',
        args: [
          formData.description,
          formData.link,
          startTime,
          endTime
        ]
      });
    } catch (err) {
      setError('Error al crear la propuesta');
      setIsSubmitting(false);
    }
  };

  // Manejar éxito de la transacción
  useEffect(() => {
    if (isConfirmed) {
      setIsSubmitting(false);
      // Redirigir inmediatamente sin mostrar mensaje de éxito, manteniendo la dirección del DAO
      const currentAddress = router.query.address;
      const queryParams = currentAddress ? `?address=${currentAddress}&proposalCreated=true` : '?proposalCreated=true';
      router.push(`/dao${queryParams}`);
    }
  }, [isConfirmed, router]);

  // Verificar si el usuario puede crear propuestas
  const canCreateProposal = userVotingPower && minimumTokensToCreate 
    ? Number(userVotingPower) >= Number(minimumTokensToCreate)
    : false;

  // Verificar si los datos del contrato están cargando
  const isLoadingContractData = minTokensLoading || votingPowerLoading || userVotingPower === undefined || minimumTokensToCreate === undefined;


  // Establecer fechas por defecto
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Formatear fechas a DD-MM-YYYY HH:MM
    const formatDateTime = (date: Date): string => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${day}-${month}-${year} ${hours}:${minutes}`;
    };
    
    setFormData(prev => ({
      ...prev,
      startTime: formatDateTime(tomorrow),
      endTime: formatDateTime(nextWeek)
    }));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>Nueva Propuesta - DApp Polka</title>
        <meta
          content="Crear nueva propuesta DAO"
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
                Nueva Propuesta DAO
              </h1>
              <p className="text-muted-foreground text-xs">
                Crea una nueva propuesta
              </p>
            </div>
            <Link href={`/dao${router.query.address ? `?address=${router.query.address}` : ''}`}>
              <Button variant="ghost" size="sm" className="text-xs">
                <ArrowLeft className="w-3 h-3 mr-1" />
                Volver al DAO
              </Button>
            </Link>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Información del usuario */}
          <ClientOnly fallback={
            <Card className="mb-6 p-4">
              <CardContent className="p-0">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Cargando información del usuario...</p>
                </div>
              </CardContent>
            </Card>
          }>
            <Card className="mb-6 p-4">
              <CardContent className="p-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Tu Poder de Voto</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {isLoadingContractData ? 'Cargando...' : (userVotingPower ? Number(userVotingPower).toString() : '0')} NFTs
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Mínimo Requerido</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {isLoadingContractData ? 'Cargando...' : (minimumTokensToCreate ? Number(minimumTokensToCreate).toString() : '10')} NFTs
                    </span>
                  </div>

                  {/* Mensaje informativo sobre limitación de propuestas */}
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <p className="text-xs text-blue-800 dark:text-blue-200">
                        Puedes crear solo 1 propuesta cada 24 horas
                      </p>
                    </div>
                  </div>

                  {!isLoadingContractData && !canCreateProposal && (
                    <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                        <p className="text-xs text-orange-800 dark:text-orange-200">
                          {!!minTokensError || !!votingPowerError 
                            ? 'Error al cargar datos del contrato. Verifica tu conexión.'
                            : `Necesitas al menos ${minimumTokensToCreate ? Number(minimumTokensToCreate).toString() : '10'} NFTs para crear propuestas`
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </ClientOnly>

          {/* Formulario */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Detalles de la Propuesta</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Descripción */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
                    Descripción de la Propuesta *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe detalladamente tu propuesta..."
                    rows={4}
                    className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Enlace */}
                <div>
                  <label htmlFor="link" className="block text-sm font-medium text-foreground mb-1">
                    Enlace de Referencia *
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="url"
                      id="link"
                      name="link"
                      value={formData.link}
                      onChange={handleInputChange}
                      placeholder="https://ejemplo.com/documento"
                      className="w-full pl-10 pr-3 py-2 text-sm border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Fechas */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="startTime" className="block text-sm font-medium text-foreground mb-1">
                      Fecha de Inicio *
                    </label>
                    <DatePicker
                      value={formData.startTime}
                      onChange={(value) => setFormData(prev => ({ ...prev, startTime: value }))}
                      placeholder="DD-MM-YYYY HH:MM"
                      disabled={isSubmitting}
                      showTime={true}
                    />
                  </div>

                  <div>
                    <label htmlFor="endTime" className="block text-sm font-medium text-foreground mb-1">
                      Fecha de Fin *
                    </label>
                    <DatePicker
                      value={formData.endTime}
                      onChange={(value) => setFormData(prev => ({ ...prev, endTime: value }))}
                      placeholder="DD-MM-YYYY HH:MM"
                      disabled={isSubmitting}
                      showTime={true}
                    />
                  </div>
                </div>

                {/* Mensajes de error y éxito */}
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <p className="text-xs text-red-800 dark:text-red-200">{error}</p>
                    </div>
                  </div>
                )}


                {/* Botones */}
                <div className="flex space-x-3 pt-4">
                  <Link href={`/dao${router.query.address ? `?address=${router.query.address}` : ''}`} className="flex-1">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full text-xs"
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </Button>
                  </Link>
                  <Button 
                    type="submit" 
                    className="flex-1 text-xs"
                    disabled={!canCreateProposal || isSubmitting || isCreating || isConfirming || !!minTokensError || !!votingPowerError}
                  >
                    {isSubmitting || isCreating || isConfirming ? (
                      'Creando...'
                    ) : (
                      'Crear Propuesta'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default NuevaPropuestaPage;
