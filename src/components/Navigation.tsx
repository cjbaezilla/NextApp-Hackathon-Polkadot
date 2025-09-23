import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Globe, ChevronDown, Moon, Sun, Menu, X, Home, ExternalLink, Plus, Vote, UserPlus, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { useTheme } from '../hooks/useTheme';

const Navigation = () => {
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('ES');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isMobile, isExtraSmall } = useNavigation();
  const { theme, toggleTheme } = useTheme();

  const languages = [
    { code: 'ES', name: 'Español' },
    { code: 'EN', name: 'English' },
    { code: 'PT', name: 'Português' }
  ];

  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/' },
    { icon: Plus, label: 'Mint NFT', href: '/mint' },
    { icon: UserPlus, label: 'Registro', href: '/registro' },
    { icon: User, label: 'Perfil', href: '/perfil' },
    { icon: Vote, label: 'DAO', href: '/dao' }
  ];

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('.burger-menu') && !target.closest('.menu-overlay')) {
          setIsMenuOpen(false);
        }
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevenir scroll del body cuando el menú está abierto
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  return (
    <div className="w-full bg-background border-b border-border shadow-sm">
      {/* Barra superior compacta */}
      <div className={`${isExtraSmall ? 'h-5' : 'h-6'} bg-muted border-b border-border flex items-center justify-between ${isExtraSmall ? 'px-1' : 'px-2'} text-xs text-muted-foreground`}>
        <div className="flex items-center space-x-2">
          <span className="font-medium">v0.1.0</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center hover:text-foreground transition-colors"
            title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          >
            {theme === 'light' ? (
              <Moon className={`${isExtraSmall ? 'w-3 h-3' : 'w-4 h-4'}`} />
            ) : (
              <Sun className={`${isExtraSmall ? 'w-3 h-3' : 'w-4 h-4'}`} />
            )}
          </button>
          <div className="w-px h-3 bg-border"></div>
          <div className="relative">
            <button
              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
              className="flex items-center space-x-1 hover:text-foreground transition-colors"
            >
              <Globe className={`${isExtraSmall ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
              <span className="text-xs font-medium">{selectedLanguage}</span>
              <ChevronDown className={`${isExtraSmall ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
            </button>
            {isLanguageOpen && (
              <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-md shadow-lg z-50 min-w-24">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setSelectedLanguage(lang.code);
                      setIsLanguageOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-accent first:rounded-t-md last:rounded-b-md"
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barra de navegación principal */}
      <div className={`${isExtraSmall ? 'h-10' : 'h-12'} flex items-center justify-between ${isExtraSmall ? 'px-2' : 'px-3'}`}>
        {/* Logo circular izquierdo con menú hamburguesa */}
        <div className="flex items-center space-x-2">
          {/* Botón hamburguesa */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`burger-menu ${isExtraSmall ? 'p-1' : 'p-1.5'} rounded-md hover:bg-accent transition-colors duration-200`}
            title="Abrir menú"
          >
            {isMenuOpen ? (
              <X className={`${isExtraSmall ? 'w-4 h-4' : 'w-5 h-5'} text-foreground`} />
            ) : (
              <Menu className={`${isExtraSmall ? 'w-4 h-4' : 'w-5 h-5'} text-foreground`} />
            )}
          </button>
          
          {/* Logo */}
          <div className={`${isExtraSmall ? 'w-7 h-7' : 'w-8 h-8'} bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center shadow-sm`}>
            <span className={`text-white ${isExtraSmall ? 'text-xs' : 'text-sm'} font-bold`}>P</span>
          </div>
        </div>

        {/* Botón de conexión derecho */}
        <div className="flex items-center">
          <ConnectButton
            chainStatus="icon"
            accountStatus={{
              smallScreen: 'avatar',
              largeScreen: 'full',
            }}
            showBalance={{
              smallScreen: false,
              largeScreen: true,
            }}
          />
        </div>
      </div>

      {/* Menú lateral deslizable */}
      {isMenuOpen && (
        <>
          {/* Overlay */}
          <div className="menu-overlay fixed inset-0 bg-black/50 z-40" />
          
          {/* Menú lateral */}
          <div className="menu-overlay fixed left-0 top-0 h-full w-72 bg-background border-r border-border shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
            {/* Header del menú */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-white text-sm font-bold">P</span>
                </div>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-md hover:bg-accent transition-colors duration-200"
                title="Cerrar menú"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>

            {/* Opciones del menú */}
            <nav className="p-4">
              <ul className="space-y-2">
                {menuItems.map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <li key={index}>
                      <a
                        href={item.href}
                        className="flex items-center space-x-3 px-3 py-2 rounded-md text-foreground hover:bg-accent transition-colors duration-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <IconComponent className="w-5 h-5" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Footer del menú */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
              <div className="text-left">
                <p className="text-xs text-muted-foreground">
                  Creado por{' '}
                  <a 
                    href="https://baeza.me" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 transition-colors duration-200 underline inline-flex items-center gap-1"
                  >
                    Carlos Baeza
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Navigation;
