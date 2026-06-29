import { Link, Navigate } from 'react-router-dom'
import { Zap, Calculator, History, Shield, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

export function Home() {
  const { isAuthenticated, isLoading } = useAuth()

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/calculator" replace />
  }

  return (
    <div className="flex flex-col items-center text-center py-12 gap-12">
      {/* Hero */}
      <div className="space-y-4 max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary font-medium">
          <Zap className="h-3 w-3" />
          DIgSILENT PowerFactory
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Cálculos eléctricos{' '}
          <span className="text-primary">precisos y rápidos</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Genera plantillas listas para importar en DIgSILENT PowerFactory y otros programas de simulación eléctrica. Ahorra tiempo y elimina errores manuales.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button size="lg" asChild className="electric-glow">
            <Link to="/register">
              Comenzar gratis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/login">Iniciar sesión</Link>
          </Button>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
        {[
          {
            icon: Calculator,
            title: 'Calculadora completa',
            desc: '35+ tipos de conductor soportados: ACSR, TTU Cu, Dúplex AL, Tríplex AL y acometidas.',
          },
          {
            icon: Zap,
            title: 'Plantillas DIgSILENT',
            desc: 'Genera los 4 bloques de datos requeridos por DIgSILENT PowerFactory: Line Type Basic, Load Flow, ElmLne Basic y Load Flow.',
          },
          {
            icon: History,
            title: 'Historial de cálculos',
            desc: 'Todos tus cálculos guardados y disponibles. Revísalos, compáralos y reutilízalos.',
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

      {/* Pricing */}
      <div className="w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-6">Planes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card-surface p-6 text-left space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Gratuito</p>
              <p className="text-2xl font-bold">$0 <span className="text-sm font-normal text-muted-foreground">/ mes</span></p>
            </div>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-primary" />2 plantillas por semana</li>
              <li className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-primary" />Historial de cálculos</li>
              <li className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-primary" />35+ conductores</li>
            </ul>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/register">Registrarse</Link>
            </Button>
          </div>

          <div className="card-surface p-6 text-left space-y-4 border-primary/50 electric-glow">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm text-primary font-medium">Pro</p>
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Popular</span>
              </div>
              <p className="text-2xl font-bold text-primary">Contactar</p>
            </div>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-accent" />Plantillas ilimitadas</li>
              <li className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-accent" />Múltiples usuarios por org</li>
              <li className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-accent" />Soporte prioritario</li>
            </ul>
            <Button className="w-full" asChild>
              <Link to="/register">Empezar</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
