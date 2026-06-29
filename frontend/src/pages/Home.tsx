import { Link, Navigate } from 'react-router-dom'
import { Zap, Calculator, History, Star, Crown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

export function Home() {
  const { isAuthenticated, isLoading } = useAuth()

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/calculator" replace />
  }

  return (
    <div className="flex flex-col items-center text-center py-16 gap-20">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="relative w-full max-w-3xl mx-auto">
        <div className="absolute inset-0 dot-grid rounded-3xl opacity-50 pointer-events-none" />
        <div className="relative z-10 space-y-7 max-w-2xl mx-auto py-10 px-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary font-medium">
            <Zap className="h-3 w-3" />
            DIgSILENT PowerFactory · PSCAD · ETAP
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.05]">
            Plantillas técnicas.{' '}
            <span className="font-mono text-primary">//</span>
            <br />
            Cero transcripción.
          </h1>

          <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
            Ingresa los parámetros de tu tramo desde ArcGIS. Obtén los 4 bloques DIgSILENT
            listos para importar: Line&nbsp;Type&nbsp;Basic, Load&nbsp;Flow, ElmLne&nbsp;Basic y ElmLne&nbsp;Load&nbsp;Flow.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
            <Button size="lg" asChild className="electric-glow">
              <Link to="/register">
                Comenzar gratis
                <Zap className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Iniciar sesión</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
        {[
          {
            icon: Calculator,
            title: 'Calculadora completa',
            desc: '35+ conductores: ACSR, TTU Cu, Dúplex AL, Tríplex AL, acometidas mono/bi/trifásicas. Parámetros R\', X\', R0\', X0\' calculados por tramo.',
          },
          {
            icon: Zap,
            title: 'Plantillas DIgSILENT',
            desc: '4 bloques requeridos por DIgSILENT: Line Type Basic, Line Type Load Flow, ElmLne Basic, ElmLne Load Flow. Sin transcripción manual.',
          },
          {
            icon: History,
            title: 'Historial de cálculos',
            desc: 'Registro de cálculos con nombre y descripción. Compara tramos, reutiliza configuraciones base, exporta a PDF.',
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="card-surface p-5 text-left space-y-2 electric-border">
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* ── Pricing ───────────────────────────────────────────────────── */}
      <div className="w-full max-w-4xl">
        <h2 className="text-3xl font-black tracking-tight">Niveles de acceso</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-10">
          Elige el voltaje que necesitas.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-stretch">

          {/* FREE — powered down */}
          <div className="bg-surface rounded-lg border border-border p-6 text-left space-y-5 flex flex-col opacity-90">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold text-muted-foreground">Gratuito</p>
              </div>
              <p className="text-3xl font-black">$0
                <span className="text-sm font-normal text-muted-foreground ml-1">/ mes</span>
              </p>
            </div>
            <ul className="text-sm space-y-2.5 text-muted-foreground flex-1">
              {[
                '2 cálculos por día (reset a las 00:00)',
                'Copia de parámetros al portapapeles',
                'Acceso al catálogo completo de 35+ conductores',
              ].map(f => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-muted-foreground/50 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/register">Registrarse</Link>
            </Button>
          </div>

          {/* BÁSICO — warming up */}
          <div className="bg-surface rounded-lg border border-accent/50 p-6 text-left space-y-5 flex flex-col relative">
            <div className="absolute -top-3 left-4">
              <span className="text-[10px] bg-accent text-accent-foreground font-bold px-2.5 py-0.5 rounded-full tracking-wide">
                NUEVO
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-accent" />
                <p className="text-sm font-semibold text-accent">Básico</p>
              </div>
              <p className="text-3xl font-black text-accent">Contactar</p>
            </div>
            <ul className="text-sm space-y-2.5 flex-1">
              {[
                'Cálculos ilimitados sin cuota diaria',
                'Historial de 30 días',
                'PDF exportable (hasta 5 descargas por cálculo)',
                'Un software de simulación habilitado',
              ].map(f => (
                <li key={f} className="flex items-start gap-2 text-foreground/80">
                  <Check className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full border-accent/40 text-accent hover:bg-accent/10 hover:text-accent" asChild>
              <Link to="/register">Empezar</Link>
            </Button>
          </div>

          {/* PRO — full power, animated border */}
          <div className="pro-card-border-wrap flex flex-col relative" style={{ filter: 'drop-shadow(0 0 24px rgba(14,165,233,0.2))' }}>
            <div className="pro-card-border-inner p-6 text-left space-y-5 flex flex-col relative">
              <div className="absolute -top-3 left-4">
                <span className="text-[10px] bg-primary text-primary-foreground font-bold px-2.5 py-0.5 rounded-full tracking-wide">
                  POPULAR
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-primary">Pro</p>
                </div>
                <p className="text-3xl font-black text-primary">Contactar</p>
              </div>
              <ul className="text-sm space-y-2.5 flex-1">
                {[
                  'Cálculos ilimitados sin restricciones',
                  'Historial permanente sin caducidad',
                  'PDF ilimitados por cálculo',
                  'Todos los softwares: DIgSILENT, PSCAD, ETAP',
                  'Múltiples usuarios en la misma organización',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-foreground/80">
                    <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="w-full" asChild>
                <Link to="/register">Empezar</Link>
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
