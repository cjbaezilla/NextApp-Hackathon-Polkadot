import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain, http } from 'viem';

// Configuración de la red Polkadot Hub TestNet
const polkadotHub = defineChain({
  id: 420420422,
  name: 'Polkadot Hub TestNet',
  nativeCurrency: {
    name: 'PAS',
    symbol: 'PAS',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-passet-hub-eth-rpc.polkadot.io'],
    },
    public: {
      http: ['https://testnet-passet-hub-eth-rpc.polkadot.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Polkadot Hub Explorer',
      url: 'https://blockscout-passet-hub.parity-testnet.parity.io',
    },
  },
  testnet: true,
});

// Configuración de la red local Hardhat
export const hardhat = defineChain({
  id: 31337,
  name: 'Hardhat Local',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
    },
  },
  testnet: true,
});

// Configuración de la red Sepolia
const sepolia = defineChain({
  id: 11155111,
  name: 'Sepolia',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://gateway.tenderly.co/public/sepolia'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://gateway.tenderly.co/public/sepolia'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Etherscan',
      url: 'https://sepolia.etherscan.io',
    },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: 'DApp Polka',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'temp_project_id_for_development',
  chains: [hardhat, polkadotHub, sepolia],
  ssr: false, // Deshabilitado para exportación estática
  transports: {
    [hardhat.id]: http(),
    [polkadotHub.id]: http(),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://gateway.tenderly.co/public/sepolia'),
  },
});
