import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface TokenIconProps {
  /** Dirección del token para generar el icono */
  tokenAddress: string
  /** Tamaño del icono en píxeles */
  size?: number
  /** Clases CSS adicionales */
  className?: string
  /** Texto alternativo para accesibilidad */
  alt?: string
}

/**
 * Componente reutilizable para mostrar iconos de tokens generados dinámicamente
 * usando el servicio de DiceBear basado en la dirección del token.
 */
function TokenIcon({ 
  tokenAddress, 
  size = 32, 
  className, 
  alt = `Token icon for ${tokenAddress}`
}: TokenIconProps) {
  const [imageError, setImageError] = React.useState(false)
  
  // Generar URL del icono usando DiceBear
  const iconUrl: string = `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(tokenAddress)}`
  
  // Fallback simple si hay error cargando la imagen
  const fallbackIcon = (
    <div 
      className={cn(
        "flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-xs",
        className
      )}
      style={{ width: size, height: size }}
    >
      {tokenAddress.slice(0, 2).toUpperCase()}
    </div>
  )

  if (imageError) {
    return fallbackIcon
  }

  return (
    <Image
      src={iconUrl}
      alt={alt}
      width={size}
      height={size}
      className={cn(
        "rounded-full object-cover border-2 border-gray-200 dark:border-gray-700",
        className
      )}
      onError={() => setImageError(true)}
    />
  )
}

export { TokenIcon }
