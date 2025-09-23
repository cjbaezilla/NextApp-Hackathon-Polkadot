import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Image as ImageIcon, User, Users, Coins, CheckCircle, AlertCircle, X, Copy } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useContractRead, useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt, useWatchContractEvent } from 'wagmi';
import { parseEther, formatEther } from 'viem';
// Cargar ABI del contrato desde variable de entorno
const NFTContract = require(process.env.NEXT_PUBLIC_NFT_CONTRACT_ABI_PATH!);
import ClientOnly from '@/components/ClientOnly';

const MintPage: NextPage = () => {
  const [mintAmount, setMintAmount] = useState(1);
  const [isMinting, setIsMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintedTokenId, setMintedTokenId] = useState<number | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const { address, isConnected } = useAccount();

  // Dirección del contrato desde variables de entorno
  const contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS as `0x${string}`;

  // Leer datos del contrato
  const { data: mintPrice, refetch: refetchMintPrice } = useContractRead({
    address: contractAddress,
    abi: NFTContract.abi,
    functionName: 'getMintPrice',
  });

  const { data: totalSupply, refetch: refetchTotalSupply } = useContractRead({
    address: contractAddress,
    abi: NFTContract.abi,
    functionName: 'totalSupply',
  });

  const { data: nextTokenId, refetch: refetchNextTokenId } = useContractRead({
    address: contractAddress,
    abi: NFTContract.abi,
    functionName: 'nextTokenId',
  });

  const { data: userBalance, refetch: refetchUserBalance } = useContractRead({
    address: contractAddress,
    abi: NFTContract.abi,
    functionName: 'balanceOf',
    args: address ? [address] : ['0x0000000000000000000000000000000000000000'],
  });

  const { data: allNftHolders, refetch: refetchAllNftHolders } = useContractRead({
    address: contractAddress,
    abi: NFTContract.abi,
    functionName: 'getAllNftHolders',
  });

  // Obtener balance de ETH del usuario
  const { data: ethBalance, refetch: refetchEthBalance } = useBalance({
    address: address,
  });

  // Configurar escritura del contrato
  const { writeContract: writeContract, data: mintData, error: mintErrorData, isPending: isMintPending } = useWriteContract();

  // Esperar a que se complete la transacción
  const { isLoading: isMintReceiptPending, isSuccess: isMintSuccess } = useWaitForTransactionReceipt({
    hash: mintData,
  });

  // Escuchar eventos de minting del contrato
  useWatchContractEvent({
    address: contractAddress,
    abi: NFTContract.abi,
    eventName: 'TokenMinted',
    onLogs(logs: any[]) {
      const latestLog = logs[logs.length - 1];
      if (latestLog && latestLog.args.tokenId) {
        setMintedTokenId(Number(latestLog.args.tokenId));
      }
    },
  });

  // Obtener número de NFTs acuñados usando nextTokenId (ya que nftHolders es un array)
  // nextTokenId representa el próximo ID a acuñar, por lo que los acuñados son nextTokenId - 1
  const mintedCount = nextTokenId ? Number(nextTokenId) - 1 : 0;

  const uniqueHoldersCount = Array.isArray(allNftHolders) ? allNftHolders.length : 0;

  // Función para refrescar todos los datos después del mint
  const refreshAllData = useCallback(async () => {
    try {
      // Pequeño delay para asegurar que la transacción se haya procesado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await Promise.all([
        refetchMintPrice(),
        refetchTotalSupply(),
        refetchNextTokenId(),
        refetchUserBalance(),
        refetchEthBalance(),
        refetchAllNftHolders(),
      ]);
    } catch (error) {
      console.error('Error al refrescar datos:', error);
    }
  }, [refetchMintPrice, refetchTotalSupply, refetchNextTokenId, refetchUserBalance, refetchEthBalance, refetchAllNftHolders]);

  // Efecto para manejar el estado de minting
  useEffect(() => {
    if (isMintPending || isMintReceiptPending) {
      setIsMinting(true);
      setMintError(null);
    } else if (isMintSuccess) {
      setIsMinting(false);
      setMintSuccess(true);
      // Refrescar todos los datos después del mint exitoso
      refreshAllData();
    } else if (mintErrorData) {
      setIsMinting(false);
      setMintError(mintErrorData?.message || 'Error al mintear NFT');
    }
  }, [isMintPending, isMintReceiptPending, isMintSuccess, mintErrorData, refreshAllData]);

  const handleCopyTransaction = async () => {
    if (mintData) {
      try {
        await navigator.clipboard.writeText(mintData);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Error al copiar:', err);
      }
    }
  };

  const handleMint = async () => {
    if (!isConnected) {
      setMintError('Por favor conecta tu wallet primero');
      return;
    }

    if (!mintPrice) {
      setMintError('No se pudo obtener el precio de minting');
      return;
    }

    try {
      if (mintAmount === 1) {
        // Minting individual
        writeContract({
          address: contractAddress,
          abi: NFTContract.abi,
          functionName: 'mint',
          args: [],
          value: mintPrice ? BigInt(mintPrice.toString()) : BigInt(0),
        });
      } else {
        // Minting en lote
        writeContract({
          address: contractAddress,
          abi: NFTContract.abi,
          functionName: 'mintBatch',
          args: [BigInt(mintAmount)],
          value: mintPrice ? BigInt(Number(mintPrice.toString()) * mintAmount) : BigInt(0),
        });
      }
    } catch (error) {
      setMintError('Error al iniciar el proceso de minting');
    }
  };

  const mainStats = [
    {
      label: 'Precio por NFT',
      value: mintPrice ? `${Number(mintPrice) / 1e18} PAS` : '1 PAS',
      icon: Coins,
      color: 'from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800'
    },
    {
      label: 'Tú Balance PAS',
      value: ethBalance ? `${Number(ethBalance.formatted).toFixed(4)} PAS` : '0.0000 PAS',
      icon: Coins,
      color: 'from-cyan-50 to-cyan-100 dark:from-cyan-950/20 dark:to-cyan-900/20 border-cyan-200 dark:border-cyan-800'
    }
  ];

  const otherStats = [
    {
      label: 'Holders',
      value: uniqueHoldersCount.toLocaleString(),
      icon: Users,
      color: 'from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800'
    },
    {
      label: 'Total',
      value: totalSupply ? Number(totalSupply).toLocaleString() : '0',
      icon: ImageIcon,
      color: 'from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800'
    },
    {
      label: 'Tuyos',
      value: userBalance ? Number(userBalance).toString() : '0',
      icon: User,
      color: 'from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>Mint NFT - DApp Polka</title>
        <meta
          content="Acuña NFTs únicos en Polkadot"
          name="description"
        />
        <link href="/favicon.ico" rel="icon" />
      </Head>

      <div className="container mx-auto px-3 py-4">
        {/* Header compacto */}
        <div className="mb-4">
          <div>
            <h1 className="text-lg font-bold text-foreground mb-1">
              Obtén tu CD-KEY
            </h1>
            <p className="text-muted-foreground text-xs">
              Haz mint de tu NFT y accede a la plataforma de pruebas
            </p>
          </div>
        </div>

        {/* Estadísticas principales */}
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-2">
            <ClientOnly fallback={
              <>
                <Card className="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1 truncate">Precio por NFT</p>
                        <p className="text-sm font-bold text-foreground truncate">1 PAS</p>
                      </div>
                      <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center ml-2 flex-shrink-0">
                        <Coins className="w-3 h-3 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="p-3 bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950/20 dark:to-cyan-900/20 border-cyan-200 dark:border-cyan-800">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1 truncate">Tú Balance PAS</p>
                        <p className="text-sm font-bold text-foreground truncate">0.0000 PAS</p>
                      </div>
                      <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center ml-2 flex-shrink-0">
                        <Coins className="w-3 h-3 text-primary" />
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

        {/* Otras estadísticas */}
        <div className="mb-6">
          <div className="grid grid-cols-3 gap-2">
            <ClientOnly fallback={
              <>
                <Card className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1 truncate">Holders</p>
                        <p className="text-sm font-bold text-foreground truncate">0</p>
                      </div>
                      <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center ml-2 flex-shrink-0">
                        <Users className="w-3 h-3 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1 truncate">Total</p>
                        <p className="text-sm font-bold text-foreground truncate">0</p>
                      </div>
                      <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center ml-2 flex-shrink-0">
                        <ImageIcon className="w-3 h-3 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1 truncate">Tuyos</p>
                        <p className="text-sm font-bold text-foreground truncate">0</p>
                      </div>
                      <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center ml-2 flex-shrink-0">
                        <User className="w-3 h-3 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            }>
              {otherStats.map((stat, index) => {
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

        {/* Panel de minting */}
        <div className="max-w-md mx-auto">
          <Card className="p-4">
            <CardContent className="p-0">
              <div className="space-y-4">
                {/* Imagen del NFT */}
                <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  <Image 
                    src="/img/cd-key.png" 
                    alt="PolkaPunks NFT" 
                    width={400}
                    height={400}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                {/* Cantidad */}
                <div>
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      size="default"
                      onClick={() => setMintAmount(Math.max(1, mintAmount - 1))}
                      disabled={mintAmount <= 1}
                      className="w-12 h-12 text-xl font-bold"
                    >
                      -
                    </Button>
                    <div className="flex-1 text-center">
                      <span className="text-3xl font-bold">{mintAmount}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="default"
                      onClick={() => setMintAmount(Math.min(10, mintAmount + 1))}
                      disabled={mintAmount >= 10}
                      className="w-12 h-12 text-xl font-bold"
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Precio total */}
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Precio Total:</span>
                    <ClientOnly fallback={
                      <span className="text-lg font-bold text-foreground">
                        {mintAmount} PAS
                      </span>
                    }>
                      <span className="text-lg font-bold text-foreground">
                        {mintPrice ? `${Math.round(Number(mintPrice) / 1e18 * mintAmount)} PAS` : `${Math.round(1 * mintAmount)} PAS`}
                      </span>
                    </ClientOnly>
                  </div>
                </div>

                {/* Mensaje de error */}
                <ClientOnly fallback={null}>
                  {mintError && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                          <span className="text-sm text-red-600 dark:text-red-400">{mintError}</span>
                        </div>
                        <button
                          onClick={() => setMintError(null)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </ClientOnly>

                {/* Mensaje de éxito */}
                <ClientOnly fallback={null}>
                  {mintSuccess && (
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1">
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-sm text-green-600 dark:text-green-400">
                              ¡Minteo exitoso!
                            </span>
                            {mintData && (
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-green-600 dark:text-green-400">
                                  Transacción: {mintData.slice(0, 10)}...{mintData.slice(-8)}
                                </span>
                                <button
                                  onClick={handleCopyTransaction}
                                  className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors p-0.5"
                                  title="Copiar hash completo"
                                >
                                  {copySuccess ? (
                                    <CheckCircle className="w-3 h-3" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setMintSuccess(false);
                            setMintedTokenId(null);
                          }}
                          className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors ml-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </ClientOnly>

                {/* Botón de minting */}
                <ClientOnly fallback={
                  <Button
                    onClick={handleMint}
                    disabled={true}
                    className="w-full"
                    size="lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Cargando...
                  </Button>
                }>
                  <Button
                    onClick={handleMint}
                    disabled={isMinting || !isConnected || !mintPrice}
                    className="w-full"
                    size="lg"
                  >
                    {!isConnected ? (
                      <>
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Conecta tu Wallet
                      </>
                    ) : isMinting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Minteando...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        {mintAmount === 1 ? 'Mintear NFT' : `Mintear ${mintAmount} NFTs`}
                      </>
                    )}
                  </Button>
                </ClientOnly>


                {/* Información adicional */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Los NFTs se transferirán a tu wallet automáticamente</p>
                  <p>• Se aplicará una comisión de red mínima</p>
                  <p>• Verifica que tienes suficiente balance para el minting</p>
                  <ClientOnly fallback={null}>
                    {!isConnected && (
                      <p className="text-amber-600 dark:text-amber-400">
                        ⚠️ Conecta tu wallet para poder mintear
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

export default MintPage;
