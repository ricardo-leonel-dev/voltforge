import { RefreshCw, Zap } from 'lucide-react'
import { useUpdateNotification } from '@/hooks/useUpdateNotification'
import { Button } from './ui/button'

export function UpdateBanner() {
  const { updateAvailable, applyUpdate } = useUpdateNotification()

  if (!updateAvailable) return null

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-accent text-accent-foreground flex items-center justify-between px-4 py-2 text-sm font-medium shadow-lg animate-fade-in">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4" />
        <span>Nueva versión disponible</span>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={applyUpdate}
        className="text-accent-foreground hover:bg-amber-400 gap-1"
      >
        <RefreshCw className="h-3 w-3" />
        Actualizar
      </Button>
    </div>
  )
}
