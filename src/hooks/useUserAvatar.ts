import { useMemo } from "react"

interface UserInfo {
  userAddress: string
  avatarLink?: string
  username?: string
}

/**
 * Hook personalizado para obtener la URL del avatar de un usuario.
 * Prioriza la imagen personalizada del contrato, sino usa el avatar generado.
 */
function useUserAvatar(userInfo: UserInfo | null | undefined) {
  return useMemo(() => {
    if (!userInfo?.userAddress) {
      return {
        userAddress: "",
        avatarUrl: undefined,
        hasCustomAvatar: false
      }
    }

    const hasCustomAvatar = Boolean(userInfo.avatarLink && userInfo.avatarLink.trim() !== "")
    const generatedAvatarUrl = `https://api.dicebear.com/9.x/pixel-art-neutral/svg?seed=${encodeURIComponent(userInfo.userAddress)}`
    
    return {
      userAddress: userInfo.userAddress,
      avatarUrl: hasCustomAvatar ? userInfo.avatarLink : generatedAvatarUrl,
      hasCustomAvatar,
      generatedAvatarUrl
    }
  }, [userInfo?.userAddress, userInfo?.avatarLink])
}

export { useUserAvatar }
