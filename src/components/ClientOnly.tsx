import { useEffect, useState } from 'react';

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Componente que solo renderiza su contenido en el cliente,
 * evitando problemas de hidratación entre servidor y cliente.
 * Útil cuando el contenido depende de estados del navegador.
 */
export const ClientOnly: React.FC<ClientOnlyProps> = ({ children, fallback = null }) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Durante la hidratación, siempre renderizar el fallback
  // para evitar diferencias entre servidor y cliente
  if (!hasMounted) {
    return fallback ? <>{fallback}</> : <div suppressHydrationWarning>{null}</div>;
  }

  return <>{children}</>;
};

export default ClientOnly;
