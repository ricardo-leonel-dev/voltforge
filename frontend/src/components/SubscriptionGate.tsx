import { Link } from 'react-router-dom'
import { Crown, Zap } from 'lucide-react'
import { Button } from './ui/button'
import { useSubscription } from '@/hooks/useSubscription'

interface SubscriptionGateProps {
  onGenerate: () => void
  isGenerating?: boolean
}

export function SubscriptionGate({ onGenerate, isGenerating }: SubscriptionGateProps) {
  const { isLoading, isFree, isBasico, isPro, remaining, isAtLimit, used, allowedProgram } = useSubscription()

  if (isLoading) {
    return <Button disabled className="w-full">Verificando suscripción...</Button>
  }

  if (isFree && isAtLimit) {
    return (
      <div className="space-y-3">
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
          <p className="font-medium">Límite diario alcanzado</p>
          <p className="text-xs mt-1 text-amber-400/80">Has usado {used}/2 generaciones gratuitas hoy.</p>
        </div>
        <Button asChild variant="accent" className="w-full">
          <Link to="/subscription">
            <Crown className="h-4 w-4" />
            Ver planes
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {isFree && (
        <p className="text-xs text-muted-foreground text-center">
          {remaining} generación{remaining !== 1 ? 'es' : ''} gratuita{remaining !== 1 ? 's' : ''} restante{remaining !== 1 ? 's' : ''} hoy
        </p>
      )}
      {isBasico && (
        <p className="text-xs text-muted-foreground text-center">
          Programa activo: <span className="text-primary font-medium">{allowedProgram.toUpperCase()}</span>
        </p>
      )}
      {isPro && (
        <p className="text-xs text-emerald-400 text-center">
          Plan Pro — generaciones ilimitadas
        </p>
      )}
      <Button
        onClick={onGenerate}
        disabled={isGenerating}
        className="w-full bg-primary hover:bg-primary/90 electric-glow"
      >
        <Zap className="h-4 w-4" />
        {isGenerating ? 'Generando...' : 'Generar plantilla DIgSILENT'}
      </Button>
    </div>
  )
}
