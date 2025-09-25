import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TokenIcon } from '@/components/ui/token-icon';
import { 
  X, 
  Copy, 
  ExternalLink, 
  Send, 
  Coins, 
  CheckCircle,
  AlertCircle,
  Wallet
} from 'lucide-react';
import { useContractRead, useContractWrite, useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import SimpleERC20Contract from '@/contracts/SimpleERC20.json';


interface TokenInfo {
  name: string;
  symbol: string;
  tokenAddress: string;
  initialSupply: string;
  creationTimestamp: number | bigint;
}

interface TokenExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: TokenInfo;
  onTokenSent?: () => void; // Callback para notificar cuando se envían tokens
}


const TokenExplorerModal: React.FC<TokenExplorerModalProps> = ({ isOpen, onClose, token, onTokenSent }) => {
  const { address, isConnected } = useAccount();
  const [recipientAddress, setRecipientAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Leer información del token
  const { data: tokenName } = useContractRead({
    address: token.tokenAddress as `0x${string}`,
    abi: SimpleERC20Contract.abi,
    functionName: 'name',
  });

  const { data: tokenSymbol } = useContractRead({
    address: token.tokenAddress as `0x${string}`,
    abi: SimpleERC20Contract.abi,
    functionName: 'symbol',
  });

  const { data: tokenDecimals } = useContractRead({
    address: token.tokenAddress as `0x${string}`,
    abi: SimpleERC20Contract.abi,
    functionName: 'decimals',
  });

  const { data: totalSupply } = useContractRead({
    address: token.tokenAddress as `0x${string}`,
    abi: SimpleERC20Contract.abi,
    functionName: 'totalSupply',
  });

  const { data: userBalance, refetch: refetchUserBalance } = useContractRead({
    address: token.tokenAddress as `0x${string}`,
    abi: SimpleERC20Contract.abi,
    functionName: 'balanceOf',
    args: address ? [address] : ['0x0000000000000000000000000000000000000000'],
  });

  // Función para enviar tokens
  const { writeContract: transfer, data: transferData, error: transferError } = useContractWrite();

  const { isLoading: isTransferPending, isSuccess: isTransferSuccess } = useWaitForTransactionReceipt({
    hash: transferData,
  });

  // Función para copiar al portapapeles
  const copyToClipboard = async (text: string, item: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(item);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  // Función para formatear balance
  const formatBalance = (balance: bigint | undefined, decimals: number | undefined) => {
    if (!balance || !decimals) return '0';
    const formatted = formatEther(balance * BigInt(10 ** (18 - decimals)));
    return parseFloat(formatted).toLocaleString('es-ES');
  };

  // Función para formatear fecha
  const formatDate = (timestamp: number | bigint) => {
    // Convertir BigInt a number si es necesario
    const timestampNumber = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
    return new Date(timestampNumber * 1000).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para acortar dirección
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Función para formatear número con separadores de miles
  const formatNumber = (value: string) => {
    // Si el valor está vacío, retornar vacío
    if (!value) return '';
    
    // Remover todos los caracteres no numéricos excepto un punto decimal
    let cleanValue = value.replace(/[^\d.]/g, '');
    
    // Evitar múltiples puntos decimales - mantener solo el primero
    const dotIndex = cleanValue.indexOf('.');
    if (dotIndex !== -1) {
      cleanValue = cleanValue.substring(0, dotIndex + 1) + cleanValue.substring(dotIndex + 1).replace(/\./g, '');
    }
    
    // Si no hay punto decimal, formatear solo la parte entera
    if (dotIndex === -1) {
      if (cleanValue === '') return '';
      const number = parseInt(cleanValue, 10);
      if (isNaN(number)) return '';
      return number.toLocaleString('en-US'); // Usar formato inglés para evitar confusión
    }
    
    // Si hay punto decimal, formatear parte entera y mantener decimal
    const integerPart = cleanValue.substring(0, dotIndex);
    const decimalPart = cleanValue.substring(dotIndex + 1);
    
    if (integerPart === '') {
      return '.' + decimalPart;
    }
    
    const integerNumber = parseInt(integerPart, 10);
    if (isNaN(integerNumber)) return '.' + decimalPart;
    
    return integerNumber.toLocaleString('en-US') + '.' + decimalPart;
  };

  // Función para manejar el cambio en el input de cantidad
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formattedValue = formatNumber(inputValue);
    setSendAmount(formattedValue);
  };

  // Función para añadir token a MetaMask
  const addTokenToMetaMask = async () => {
    if (!(window as any).ethereum || !tokenName || !tokenSymbol || !tokenDecimals) {
      alert('MetaMask no está instalado o no se pudo obtener la información del token');
      return;
    }

    try {
      const wasAdded = await (window as any).ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: token.tokenAddress,
            symbol: (tokenSymbol as string) || token.symbol,
            decimals: tokenDecimals as number,
            image: `https://raw.githubusercontent.com/MetaMask/contract-metadata/master/images/${token.tokenAddress.toLowerCase()}.png`, // Imagen por defecto
          },
        },
      });

      if (wasAdded) {
        alert('¡Token añadido exitosamente a MetaMask!');
      } else {
        alert('El token no fue añadido a MetaMask');
      }
    } catch (error) {
      console.error('Error al añadir token a MetaMask:', error);
      alert('Error al añadir el token a MetaMask');
    }
  };

  // Función para manejar envío de tokens
  const handleSendTokens = async () => {
    if (!recipientAddress || !sendAmount || !tokenDecimals) return;

    try {
      setIsSending(true);
      // Remover separadores de miles (comas) para el cálculo
      const cleanAmount = sendAmount.replace(/,/g, '');
      const amount = parseEther(cleanAmount) / BigInt(10 ** (18 - (tokenDecimals as number)));
      
      transfer({
        address: token.tokenAddress as `0x${string}`,
        abi: SimpleERC20Contract.abi,
        functionName: 'transfer',
        args: [recipientAddress as `0x${string}`, amount],
      });
    } catch (error) {
      console.error('Error al enviar tokens:', error);
      setIsSending(false);
    }
  };

  // Efecto para manejar éxito de transacción
  useEffect(() => {
    if (isTransferSuccess && transferData) {
      setSendSuccess(true);
      setTransactionHash(transferData);
      setIsSending(false);
      setRecipientAddress('');
      setSendAmount('');
      // Refrescar el balance del usuario después del envío exitoso
      refetchUserBalance();
      // Notificar al componente padre para que también actualice su balance
      if (onTokenSent) {
        onTokenSent();
      }
    }
  }, [isTransferSuccess, transferData, refetchUserBalance, onTokenSent]);


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <TokenIcon 
                tokenAddress={token.tokenAddress}
                size={48}
                className="shadow-md"
              />
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {(tokenName as string) || token.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {(tokenSymbol as string) || token.symbol}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información del Token */}
            <div className="space-y-4">
              {/* Botón para añadir token a MetaMask */}
              <Button
                onClick={addTokenToMetaMask}
                className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-lg"
                disabled={!tokenName || !tokenSymbol || !tokenDecimals}
              >
                <Wallet className="w-6 h-6 mr-3" />
                Añadir Token a MetaMask
              </Button>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Coins className="w-5 h-5" />
                    <span>Información del Token</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nombre</p>
                      <p className="font-medium">{(tokenName as string) || token.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Símbolo</p>
                      <p className="font-medium">{(tokenSymbol as string) || token.symbol}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Dirección del Contrato</p>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm">{shortenAddress(token.tokenAddress)}</span>
                      <button
                        onClick={() => copyToClipboard(token.tokenAddress, 'contract')}
                        className={`p-1 rounded transition-colors ${
                          copiedItem === 'contract' 
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                            : 'hover:bg-muted'
                        }`}
                        title={copiedItem === 'contract' ? '¡Copiado!' : 'Copiar dirección completa'}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const explorerUrl = `https://sepolia.etherscan.io/address/${token.tokenAddress}`;
                          window.open(explorerUrl, '_blank');
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Suministro Total</p>
                      <p className="font-medium">
                        {totalSupply ? formatBalance(totalSupply as bigint, tokenDecimals as number) : '0'} {(tokenSymbol as string) || token.symbol}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha de Creación</p>
                      <p className="font-medium">{formatDate(token.creationTimestamp)}</p>
                    </div>
                  </div>

                  {isConnected && (
                    <div>
                      <p className="text-sm text-muted-foreground">Tu Balance</p>
                      <p className="font-medium text-lg">
                        {userBalance ? formatBalance(userBalance as bigint, tokenDecimals as number) : '0'} {(tokenSymbol as string) || token.symbol}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Enviar Tokens */}
              {isConnected && userBalance && Number(userBalance as bigint) > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Send className="w-5 h-5" />
                      <span>Enviar Tokens</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {sendSuccess && (
                      <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2 flex-1">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-green-800 dark:text-green-200 block">
                                ¡Tokens enviados exitosamente!
                              </span>
                              {transactionHash && (
                                <div className="mt-2 space-y-1">
                                  <p className="text-xs text-green-700 dark:text-green-300">
                                    Hash de la transacción:
                                  </p>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-mono text-xs text-green-800 dark:text-green-200 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                                      {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
                                    </span>
                                    <button
                                      onClick={() => copyToClipboard(transactionHash, 'txHash')}
                                      className={`p-1 rounded transition-colors ${
                                        copiedItem === 'txHash' 
                                          ? 'bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300' 
                                          : 'hover:bg-green-200 dark:hover:bg-green-800'
                                      }`}
                                      title={copiedItem === 'txHash' ? '¡Copiado!' : 'Copiar hash completo'}
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        const explorerUrl = `https://sepolia.etherscan.io/tx/${transactionHash}`;
                                        window.open(explorerUrl, '_blank');
                                      }}
                                      className="p-1 rounded hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                                      title="Ver en Etherscan"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSendSuccess(false);
                              setTransactionHash(null);
                            }}
                            className="p-1 rounded hover:bg-green-200 dark:hover:bg-green-800 transition-colors ml-2 flex-shrink-0"
                            title="Cerrar mensaje"
                          >
                            <X className="w-4 h-4 text-green-600" />
                          </button>
                        </div>
                      </div>
                    )}

                    {transferError && (
                      <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium text-red-800 dark:text-red-200">
                            Error al enviar tokens
                          </span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Dirección del Destinatario
                      </label>
                      <input
                        type="text"
                        value={recipientAddress}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                        placeholder="0x..."
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Cantidad
                      </label>
                      <input
                        type="text"
                        value={sendAmount}
                        onChange={handleAmountChange}
                        placeholder="0.0"
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <Button
                      onClick={handleSendTokens}
                      disabled={!recipientAddress || !sendAmount || isSending || isTransferPending}
                      className="w-full"
                    >
                      {isSending || isTransferPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Enviar Tokens
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ) : null}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenExplorerModal;
