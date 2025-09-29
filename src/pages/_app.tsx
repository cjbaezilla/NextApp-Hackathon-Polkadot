// Suprimir errores del Analytics SDK de RainbowKit de forma más agresiva
if (typeof window !== 'undefined') {
  // Interceptar console.error antes de cualquier importación
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const message = args[0]?.toString() || '';
    if (message.includes('Analytics SDK') || 
        message.includes('Failed to fetch') || 
        message.includes('AnalyticsSDKApiError') ||
        message.includes('TypeError: Failed to fetch')) {
      return;
    }
    originalConsoleError.apply(console, args);
  };

  // Interceptar console.warn también
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    const message = args[0]?.toString() || '';
    if (message.includes('Analytics SDK') || 
        message.includes('Failed to fetch') || 
        message.includes('AnalyticsSDKApiError')) {
      return;
    }
    originalConsoleWarn.apply(console, args);
  };

  // Manejar promesas rechazadas
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason?.toString() || '';
    if (reason.includes('Analytics SDK') || 
        reason.includes('AnalyticsSDKApiError') ||
        reason.includes('Failed to fetch')) {
      event.preventDefault();
    }
  });

  // Manejar errores no capturados
  window.addEventListener('error', (event) => {
    const message = event.message || '';
    if (message.includes('Analytics SDK') || 
        message.includes('Failed to fetch') || 
        message.includes('AnalyticsSDKApiError')) {
      event.preventDefault();
    }
  });
}

import '../styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';

import { config } from '../wagmi';
import { hardhat } from '../wagmi';
import Navigation from '../components/Navigation';
import ClientOnly from '../components/ClientOnly';

const client = new QueryClient();

function AppWithTheme({ Component, pageProps, router }: AppProps) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    setMounted(true);
    
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initialTheme = savedTheme || systemTheme;
    
    setTheme(initialTheme);
    
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        setTheme(newTheme);
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    const handleThemeChange = (e: CustomEvent) => {
      setTheme(e.detail.theme);
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    window.addEventListener('theme-changed', handleThemeChange as EventListener);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange);
      window.removeEventListener('theme-changed', handleThemeChange as EventListener);
    };
  }, []);

  const rainbowKitTheme = theme === 'dark' ? darkTheme() : lightTheme();

  if (!mounted) {
    return (
      <div className="bg-background text-foreground">
        <ClientOnly fallback={
          <div className="w-full bg-background border-b border-border shadow-sm">
            <div className="h-6 bg-muted border-b border-border flex items-center justify-between px-2 text-xs text-muted-foreground">
              <span className="font-medium">v0.1.0</span>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-muted rounded"></div>
                <div className="w-px h-3 bg-border"></div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-muted rounded"></div>
                  <span className="text-xs font-medium">ES</span>
                  <div className="w-3 h-3 bg-muted rounded"></div>
                </div>
              </div>
            </div>
            <div className="h-12 flex items-center justify-between px-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-md bg-muted">
                  <div className="w-5 h-5 bg-muted rounded"></div>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-white text-sm font-bold">P</span>
                </div>
              </div>
              <div className="w-24 h-8 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
        }>
          <Navigation />
        </ClientOnly>
        <Component {...pageProps} />
      </div>
    );
  }

  return (
    <RainbowKitProvider 
      theme={rainbowKitTheme}
      initialChain={hardhat}
      showRecentTransactions={false}
    >
      <div className="bg-background text-foreground">
        <ClientOnly fallback={
          <div className="w-full bg-background border-b border-border shadow-sm">
            <div className="h-6 bg-muted border-b border-border flex items-center justify-between px-2 text-xs text-muted-foreground">
              <span className="font-medium">v0.1.0</span>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-muted rounded"></div>
                <div className="w-px h-3 bg-border"></div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-muted rounded"></div>
                  <span className="text-xs font-medium">ES</span>
                  <div className="w-3 h-3 bg-muted rounded"></div>
                </div>
              </div>
            </div>
            <div className="h-12 flex items-center justify-between px-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-md bg-muted">
                  <div className="w-5 h-5 bg-muted rounded"></div>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-white text-sm font-bold">P</span>
                </div>
              </div>
              <div className="w-24 h-8 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
        }>
          <Navigation />
        </ClientOnly>
        <Component {...pageProps} />
      </div>
</RainbowKitProvider>
  );
}

function MyApp({ Component, pageProps, router }: AppProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>
        <AppWithTheme Component={Component} pageProps={pageProps} router={router} />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default MyApp;
