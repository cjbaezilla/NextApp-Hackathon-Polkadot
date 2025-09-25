import * as React from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  /** Dirección del usuario para generar el avatar */
  userAddress: string
  /** URL de imagen personalizada del usuario (opcional) */
  customImageUrl?: string
  /** Tamaño del avatar */
  size?: "sm" | "md" | "lg" | "xl"
  /** Clases CSS adicionales */
  className?: string
  /** Texto alternativo para accesibilidad */
  alt?: string
  /** Mostrar borde alrededor del avatar */
  showBorder?: boolean
}

/**
 * Componente reutilizable para mostrar avatares de usuarios.
 * Usa imagen personalizada si está disponible, sino genera un avatar pixel-art
 * usando el servicio de DiceBear basado en la dirección del usuario.
 */
function UserAvatar({
  userAddress,
  customImageUrl,
  size = "md",
  className,
  alt,
  showBorder = true,
}: UserAvatarProps) {
  const [imageError, setImageError] = React.useState(false)
  
  // Tamaños predefinidos
  const sizeClasses = {
    sm: "size-6",
    md: "size-8", 
    lg: "size-12",
    xl: "size-16"
  }

  // Generar URL del avatar usando DiceBear pixel-art-neutral
  const generatedAvatarUrl = `https://api.dicebear.com/9.x/pixel-art-neutral/svg?seed=${encodeURIComponent(userAddress)}`
  
  // Determinar qué imagen usar
  const imageUrl = customImageUrl && !imageError ? customImageUrl : generatedAvatarUrl
  
  // Fallback con iniciales si fallan ambas imágenes
  const fallbackText = userAddress.slice(2, 4).toUpperCase() // Primeros 2 caracteres después de 0x

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage
        src={imageUrl}
        alt={alt || `Avatar de ${userAddress}`}
        className={cn(
          "object-cover",
          showBorder && "border-2 border-gray-200 dark:border-gray-700"
        )}
        onError={() => {
          // Si es la imagen personalizada la que falla, intentar con la generada
          if (customImageUrl && !imageError) {
            setImageError(true)
          }
        }}
      />
      <AvatarFallback className={cn(
        "bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold",
        size === "sm" && "text-xs",
        size === "md" && "text-sm", 
        size === "lg" && "text-base",
        size === "xl" && "text-lg"
      )}>
        {fallbackText}
      </AvatarFallback>
    </Avatar>
  )
}

export { UserAvatar }
