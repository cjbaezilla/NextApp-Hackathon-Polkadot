# DApp Polka

Una aplicación descentralizada (DApp) construida en Next.js para interactuar con NFTs en la red Polkadot Hub TestNet. Esta aplicación permite a los usuarios mintear NFTs únicos y acceder a una plataforma de pruebas.

## 🚀 Características

- **Minting de NFTs**: Acuña NFTs únicos con precios dinámicos
- **Dashboard Interactivo**: Visualiza estadísticas en tiempo real del protocolo
- **Wallet Integration**: Conecta con wallets compatibles usando RainbowKit
- **Responsive Design**: Interfaz optimizada para móviles y desktop
- **Tema Oscuro/Claro**: Soporte completo para ambos temas
- **Exportación Estática**: Compatible con hostings estáticos

## 🛠️ Tecnologías

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: TailwindCSS, ShadCN UI Components
- **Blockchain**: wagmi v2, viem, RainbowKit
- **Red**: Polkadot Hub TestNet (Asset Hub)
- **Build**: Exportación estática para hosting compartido

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

Edita `.env.local` y agrega:
```env
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=tu_project_id_aqui
```

4. **Ejecuta el servidor de desarrollo**
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🎯 Funcionalidades

### Dashboard Principal
- Estadísticas del protocolo en tiempo real
- Visualización de proyectos NFT, tokens ERC20, DAOs y pools de liquidez
- TVL (Total Value Locked) del ecosistema

### Página de Minting
- Interfaz intuitiva para acuñar NFTs
- Selección de cantidad (1-10 NFTs)
- Precio dinámico basado en el contrato inteligente
- Estados de transacción en tiempo real
- Información de balance y holders

### Características Técnicas
- **Client-Side Rendering**: Optimizado para exportación estática
- **Hydration Safe**: Manejo correcto de la hidratación del cliente
- **Error Handling**: Manejo robusto de errores de transacciones
- **Responsive**: Diseño adaptativo para todos los dispositivos

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo en localhost:3000

# Producción
npm run build        # Construcción para producción
npm run start        # Servidor de producción
```

## 🌐 Configuración de Red

El proyecto está configurado para trabajar con:

- **Polkadot Hub TestNet**: Red principal para desarrollo y testing
- **Hardhat Local**: Red local para desarrollo (puerto 8545)

### Detalles de la Red Polkadot Hub TestNet:
- **Chain ID**: 420420422
- **Moneda Nativa**: PAS (Polkadot Asset Hub)
- **RPC**: https://testnet-passet-hub-eth-rpc.polkadot.io
- **Explorer**: https://blockscout-passet-hub.parity-testnet.parity.io

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

## 🔗 Contrato Inteligente

El proyecto interactúa con un contrato NFT ERC721 que incluye:

- **Funciones principales**: `mint()`, `mintBatch()`, `getMintPrice()`
- **Información del token**: `totalSupply`, `balanceOf`, `getAllNftHolders`
- **Eventos**: `TokenMinted` para tracking en tiempo real

## 🎨 Personalización

### Temas
El proyecto soporta temas oscuro y claro automáticamente basado en las preferencias del sistema.

### Componentes UI
Utiliza componentes de ShadCN UI para mantener consistencia:
- Cards, Buttons, Badges, Avatars
- Sistema de colores personalizable
- Clases utilitarias de TailwindCSS

## 🐛 Solución de Problemas

### Error de Conexión a Wallet
- Asegúrate de tener MetaMask o wallet compatible instalado
- Verifica que estés en la red correcta (Polkadot Hub TestNet)
- Revisa la consola del navegador para errores

### Error de Transacción
- Verifica que tengas suficiente balance PAS
- Confirma que el contrato esté desplegado en la red correcta
- Revisa el gas limit y precio

### Problemas de Build
- Ejecuta `npm run build` para verificar errores
- Revisa que todas las variables de entorno estén configuradas
- Asegúrate de tener Node.js 18+

## 📚 Recursos Adicionales

- [Documentación de RainbowKit](https://rainbowkit.com)
- [Documentación de wagmi](https://wagmi.sh)
- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de TailwindCSS](https://tailwindcss.com)
- [Polkadot Hub TestNet](https://polkadot.io)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🔮 Roadmap

- [ ] Integración con más redes de Polkadot
- [ ] Marketplace de NFTs
- [ ] Sistema de staking
- [ ] DAO governance
- [ ] Mobile app (React Native)

---

**Desarrollado con ❤️ para el ecosistema Polkadot**
