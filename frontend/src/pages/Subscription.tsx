import { Navigate } from 'react-router-dom'
import { Crown, Zap, CheckCircle, Star } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface PlanFeature {
  text: string
  included: boolean
}

interface PlanCardProps {
  icon: React.ReactNode
  name: string
  features: PlanFeature[]
  isActive: boolean
  accentClass: string
  note?: string
}

function PlanCard({ icon, name, features, isActive, accentClass, note }: PlanCardProps) {
  return (
    <Card className={cn(
      'relative transition-all',
      isActive && 'ring-2 ring-primary shadow-lg shadow-primary/10'
    )}>
      {isActive && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="success" className="text-[10px] px-2 py-0.5 whitespace-nowrap">
            Tu plan actual
          </Badge>
        </div>
      )}
      <CardHeader className="pb-2 pt-5">
        <CardTitle className={cn('text-base flex items-center gap-2', accentClass)}>
          {icon}
          {name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pb-4">
        <ul className="space-y-1.5">
          {features.map((f, i) => (
            <li key={i} className={cn('flex items-start gap-2 text-xs', f.included ? 'text-foreground/80' : 'text-muted-foreground/50')}>
              {f.included
                ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                : <span className="h-3.5 w-3.5 shrink-0 mt-0.5 flex items-center justify-center text-[10px]">·</span>
              }
              {f.text}
            </li>
          ))}
        </ul>
        {note && (
          <p className={cn('text-[10px] mt-3 p-2 rounded border', accentClass + '/20 border-current/20 bg-current/5 opacity-70')}>
            {note}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function Subscription() {
  const { isAuthenticated, isLoading } = useAuth()
  const { data, isLoading: subLoading, isFree, isBasico, isPro, used, remaining, allowedProgram } = useSubscription()

  if (!isLoading && !isAuthenticated) return <Navigate to="/login" replace />

  const sub = data?.subscription
  const freeLimit = data?.free_limit ?? 2

  const planLabel = isPro ? 'PRO' : isBasico ? 'BÁSICO' : 'GRATIS'
  const planVariant = isPro ? 'success' : isBasico ? 'accent' : 'secondary'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Crown className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Mi suscripción</h1>
      </div>

      {subLoading ? (
        <p className="text-muted-foreground text-sm">Cargando...</p>
      ) : (
        <>
          {/* Estado actual */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <Badge variant={planVariant} className="text-sm px-3 py-1">{planLabel}</Badge>
                  {sub && (
                    <Badge variant={sub.status === 'active' ? 'success' : 'outline'} className="text-xs">
                      {sub.status}
                    </Badge>
                  )}
                </div>

                {isFree && (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">Uso hoy:</span>
                    <span className="font-medium">{used} / {freeLimit}</span>
                    <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all rounded-full"
                        style={{ width: `${Math.min(100, (used / freeLimit) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {remaining > 0
                        ? `${remaining} restante${remaining !== 1 ? 's' : ''}`
                        : 'Límite alcanzado'}
                    </span>
                  </div>
                )}

                {isBasico && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Programa activo:</span>
                    <span className="font-medium text-primary">{allowedProgram.toUpperCase()}</span>
                  </div>
                )}

                {isPro && (
                  <span className="text-sm text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> Sin restricciones
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Comparativa de planes — siempre visible */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Comparativa de planes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <PlanCard
                icon={<Zap className="h-4 w-4" />}
                name="Gratis"
                isActive={isFree}
                accentClass="text-muted-foreground"
                features={[
                  { text: '2 plantillas por día', included: true },
                  { text: 'Copia de valores al portapapeles', included: true },
                  { text: 'Sin historial de cálculos', included: false },
                  { text: 'Sin descarga PDF', included: false },
                  { text: 'Solo 1 herramienta', included: false },
                ]}
              />
              <PlanCard
                icon={<Star className="h-4 w-4" />}
                name="Básico"
                isActive={isBasico}
                accentClass="text-accent"
                note="Para activar este plan, contacta al administrador."
                features={[
                  { text: 'Plantillas ilimitadas', included: true },
                  { text: 'Historial de 1 mes', included: true },
                  { text: 'Hasta 5 descargas PDF por cálculo', included: true },
                  { text: 'Un programa a la vez', included: true },
                  { text: 'Múltiples programas simultáneos', included: false },
                ]}
              />
              <PlanCard
                icon={<Crown className="h-4 w-4" />}
                name="Pro"
                isActive={isPro}
                accentClass="text-primary"
                note="Para activar este plan, contacta al administrador."
                features={[
                  { text: 'Plantillas ilimitadas', included: true },
                  { text: 'Historial permanente', included: true },
                  { text: 'Descargas PDF ilimitadas', included: true },
                  { text: 'Todos los programas disponibles', included: true },
                  { text: 'Múltiples usuarios por organización', included: true },
                ]}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
