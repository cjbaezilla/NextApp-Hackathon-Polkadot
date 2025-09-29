import { useState, useEffect } from 'react';

export const useNavigation = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isExtraSmall, setIsExtraSmall] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const checkScreenSize = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth <= 768);
        setIsExtraSmall(window.innerWidth <= 320);
      }
    };

    checkScreenSize();
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkScreenSize);
      return () => window.removeEventListener('resize', checkScreenSize);
    }
  }, []);

  // Durante la hidratación, usar valores por defecto para evitar diferencias
  if (!mounted) {
    return { isMobile: false, isExtraSmall: false };
  }

  return { isMobile, isExtraSmall };
};
