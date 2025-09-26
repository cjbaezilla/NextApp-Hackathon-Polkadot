import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface DAOAvatarProps {
  daoAddress: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
};

export const DAOAvatar: React.FC<DAOAvatarProps> = ({
  daoAddress,
  size = 'md',
  className,
  alt = 'DAO Avatar'
}) => {
  // Generar la URL del avatar usando el servicio dicebear
  const avatarUrl = `https://api.dicebear.com/9.x/icons/svg?seed=${daoAddress}`;

  return (
    <Image
      src={avatarUrl}
      alt={alt}
      width={size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 48 : 64}
      height={size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 48 : 64}
      className={cn(
        'rounded-full object-cover border-2 border-gray-200 dark:border-gray-700',
        sizeClasses[size],
        className
      )}
      onError={(e) => {
        // Fallback a un icono si la imagen falla
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        const parent = target.parentElement;
        if (parent) {
          parent.innerHTML = `
            <div class="flex items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-white font-semibold text-xs ${sizeClasses[size]}">
              ${daoAddress.slice(0, 2).toUpperCase()}
            </div>
          `;
        }
      }}
    />
  );
};
