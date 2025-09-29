# DApp Polka

Una aplicación descentralizada (DApp) construida en Next.js para el ecosistema DeFi en múltiples redes blockchain. Esta plataforma permite a los usuarios crear tokens ERC20, gestionar DAOs, realizar swaps de tokens y administrar liquidez usando protocolos como Uniswap V2.

## 🚀 Características

- **Creación de Tokens ERC20**: Crea tu propio token personalizado con suministro inicial
- **Gestión de DAOs**: Crea y administra Organizaciones Autónomas Descentralizadas
- **Sistema de Swap**: Intercambia tokens usando Uniswap V2 con soporte para ETH/WETH
- **Pools de Liquidez**: Crea, gestiona y elimina pools de liquidez
- **Dashboard Completo**: Visualiza estadísticas del protocolo en tiempo real
- **Gestión de Usuarios**: Sistema de registro y perfiles de usuario
- **Sistema de Propuestas DAO**: Crea y vota en propuestas de gobernanza
- **Wallet Integration**: Conecta con wallets compatibles usando RainbowKit
- **Responsive Design**: Interfaz optimizada para móviles y desktop
- **Tema Oscuro/Claro**: Soporte completo para ambos temas
- **Multi-Red**: Soporte para Polkadot Hub TestNet, Sepolia y Hardhat Local

## 🛠️ Tecnologías

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: TailwindCSS, ShadCN UI Components
- **Blockchain**: wagmi v2, viem, RainbowKit
- **DeFi Protocols**: Uniswap V2, ERC20, ERC721 (NFTs)
- **Redes**: Polkadot Hub TestNet, Sepolia, Hardhat Local
- **State Management**: React Query (TanStack Query)
- **Build**: Optimizado para exportación estática

## 📋 Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Wallet compatible (MetaMask, WalletConnect, etc.)

## 🏗️ Instalación

1. **Clona el repositorio**
```bash
git clone <repository-url>
cd dapp_polka
```

2. **Instala las dependencias**
```bash
npm install
```

3. **Configura las variables de entorno**
```bash
cp .env.example .env.local
```

Edita `.env.local` y agrega las variables necesarias:
```env
# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=tu_project_id_aqui

# Contratos principales
NEXT_PUBLIC_USERS_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_USERS_CONTRACT_ABI_PATH=./src/contracts/UsersContract.json

# Factory de tokens ERC20
NEXT_PUBLIC_ERC20MEMBERSFACTORY_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_ERC20MEMBERSFACTORY_CONTRACT_ABI_PATH=./src/contracts/ERC20MembersFactory.json

# Factory de DAOs
NEXT_PUBLIC_DAOMEMBERSFACTORY_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_DAOMEMBERSFACTORY_CONTRACT_ABI_PATH=./src/contracts/DAOMembersFactory.json

# Uniswap V2
NEXT_PUBLIC_UNISWAP_V2_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_UNISWAP_V2_ROUTER_ADDRESS=0x...
NEXT_PUBLIC_WETH_ADDRESS=0x...

# RPC (opcional)
NEXT_PUBLIC_RPC_URL=https://gateway.tenderly.co/public/sepolia
```

4. **Ejecuta el servidor de desarrollo**
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🎯 Funcionalidades

### Dashboard Principal
- Estadísticas del protocolo en tiempo real
- Visualización de usuarios registrados, tokens creados, DAOs y pools de liquidez
- TVL (Total Value Locked) calculado en ETH
- Lista de nuevos miembros, tokens, DAOs y pools

### Creación de Tokens ERC20
- Interfaz para crear tokens personalizados
- Configuración de nombre, símbolo y suministro inicial
- Validación de requisitos (usuario registrado + NFTs mínimos)
- Tarifa de creación dinámica
- Formateo automático de números

### Gestión de DAOs
- Creación de Organizaciones Autónomas Descentralizadas
- Configuración de parámetros de gobernanza
- Validación de contratos NFT para membresía
- Sistema de propuestas y votación
- Gestión de permisos y umbrales

### Sistema de Swap
- Intercambio de tokens usando Uniswap V2
- Soporte para ETH/WETH wrapping/unwrapping
- Cálculo automático de precios y slippage
- Verificación de existencia de pools
- Configuración de tolerancia de slippage y deadline

### Pools de Liquidez
- Creación de pools Uniswap V2
- Gestión de liquidez (agregar/remover)
- Visualización de pools existentes
- Cálculo de fees y rewards

### Sistema de Usuarios
- Registro de usuarios en la plataforma
- Perfiles con información social (Twitter, GitHub, Telegram)
- Gestión de avatares y datos personales
- Sistema de NFTs para membresía

### Características Técnicas
- **Client-Side Rendering**: Optimizado para exportación estática
- **Hydration Safe**: Manejo correcto de la hidratación del cliente
- **Error Handling**: Manejo robusto de errores de transacciones
- **Responsive**: Diseño adaptativo para todos los dispositivos
- **Multi-Red**: Soporte para múltiples redes blockchain
- **Real-time Updates**: Actualizaciones en tiempo real usando React Query

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo en localhost:3000

# Producción
npm run build        # Construcción para producción
npm run start        # Servidor de producción
```

## 🌐 Configuración de Redes

El proyecto está configurado para trabajar con múltiples redes:

### Polkadot Hub TestNet
- **Chain ID**: 420420422
- **Moneda Nativa**: PAS (Polkadot Asset Hub)
- **RPC**: https://testnet-passet-hub-eth-rpc.polkadot.io
- **Explorer**: https://blockscout-passet-hub.parity-testnet.parity.io

### Sepolia (Ethereum Testnet)
- **Chain ID**: 11155111
- **Moneda Nativa**: ETH
- **RPC**: https://gateway.tenderly.co/public/sepolia
- **Explorer**: https://sepolia.etherscan.io

### Hardhat Local
- **Chain ID**: 31337
- **Moneda Nativa**: ETH
- **RPC**: http://127.0.0.1:8545
- **Uso**: Desarrollo local

## 📱 Despliegue Estático

Este proyecto está optimizado para despliegue estático en hostings compartidos:

### GitHub Pages
```bash
npm run build
# Sube el contenido de /out a tu repositorio
```

### Netlify/Vercel
- El archivo `_redirects` maneja el enrutamiento automáticamente
- Configura el directorio de publicación como `out`

### Hosting Compartido
```bash
npm run build
# Sube todo el contenido de /out a public_html
```

## 🔗 Contratos Inteligentes

El proyecto interactúa con múltiples contratos inteligentes:

### Contrato de Usuarios (UsersContract)
- **Funciones principales**: `registerUser()`, `getTotalMembers()`, `getUserInfo()`
- **Gestión de usuarios**: Registro, perfiles y información social

### Factory de Tokens ERC20 (ERC20MembersFactory)
- **Funciones principales**: `createToken()`, `getTokensCreated()`, `getTokenInfo()`
- **Creación de tokens**: Tokens personalizados con suministro inicial

### Factory de DAOs (DAOMembersFactory)
- **Funciones principales**: `createDAO()`, `getDAOsCreated()`, `getDAOInfo()`
- **Gestión de DAOs**: Creación y configuración de organizaciones descentralizadas

### Protocolo Uniswap V2
- **Factory**: Creación de pools de liquidez
- **Router**: Intercambio de tokens y gestión de liquidez
- **WETH**: Wrapped Ethereum para compatibilidad con ERC20

### Contrato NFT (para membresía)
- **Funciones principales**: `mint()`, `balanceOf()`, `getAllNftHolders()`
- **Membresía**: NFTs requeridos para ciertas funcionalidades

## 🎨 Personalización

### Temas
El proyecto soporta temas oscuro y claro automáticamente basado en las preferencias del sistema.

### Componentes UI
Utiliza componentes de ShadCN UI para mantener consistencia:
- Cards, Buttons, Badges, Avatars, Modals
- Componentes especializados: TokenIcon, UserAvatar, DAOAvatar
- Sistema de colores personalizable
- Clases utilitarias de TailwindCSS
- Componentes responsivos y accesibles

## 🐛 Solución de Problemas

### Error de Conexión a Wallet
- Asegúrate de tener MetaMask o wallet compatible instalado
- Verifica que estés en la red correcta (Polkadot Hub TestNet, Sepolia o Hardhat)
- Revisa la consola del navegador para errores

### Error de Transacción
- Verifica que tengas suficiente balance (PAS, ETH según la red)
- Confirma que los contratos estén desplegados en la red correcta
- Revisa el gas limit y precio
- Para creación de tokens/DAOs, asegúrate de cumplir los requisitos (NFTs mínimos)

### Error de Swap
- Verifica que exista un pool de liquidez para el par de tokens
- Revisa que tengas suficiente balance del token de entrada
- Ajusta la tolerancia de slippage si es necesario
- Para ETH, el sistema maneja automáticamente WETH wrapping

### Error de Pool de Liquidez
- Asegúrate de que ambos tokens sean válidos y diferentes
- Verifica que tengas balance de ambos tokens
- Revisa que el pool no exista ya

### Problemas de Build
- Ejecuta `npm run build` para verificar errores
- Revisa que todas las variables de entorno estén configuradas
- Asegúrate de tener Node.js 18+
- Verifica que los archivos ABI estén en las rutas correctas

## 📚 Recursos Adicionales

### Blockchain y DeFi
- [Documentación de RainbowKit](https://rainbowkit.com)
- [Documentación de wagmi](https://wagmi.sh)
- [Documentación de Uniswap V2](https://docs.uniswap.org/protocol/V2/introduction)
- [Documentación de viem](https://viem.sh)

### Frontend
- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de TailwindCSS](https://tailwindcss.com)
- [Documentación de ShadCN UI](https://ui.shadcn.com)
- [Documentación de React Query](https://tanstack.com/query)

### Redes Blockchain
- [Polkadot Hub TestNet](https://polkadot.io)
- [Sepolia Testnet](https://sepolia.dev)
- [Hardhat Local Network](https://hardhat.org/hardhat-network)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🔮 Roadmap

### Funcionalidades Pendientes
- [ ] Integración con más redes de Polkadot
- [ ] Marketplace de NFTs
- [ ] Sistema de staking
- [ ] Mejoras en el sistema de gobernanza DAO
- [ ] Mobile app (React Native)
- [ ] Integración con más protocolos DeFi
- [ ] Sistema de notificaciones
- [ ] Analytics avanzados

### Mejoras Técnicas
- [ ] Optimización de performance
- [ ] Mejores tests de integración
- [ ] Documentación de API
- [ ] Sistema de cache mejorado
- [ ] Soporte para más wallets

---

**Desarrollado con ❤️ para el ecosistema DeFi y Polkadot**
