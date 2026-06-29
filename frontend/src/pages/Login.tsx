import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lightbulb } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

type LoginState = 'idle' | 'loading' | 'error' | 'success'

export function Login() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loginState, setLoginState] = useState<LoginState>('idle')
  const cardRef = useRef<HTMLDivElement>(null)
  const iconRef = useRef<HTMLDivElement>(null)

  if (isAuthenticated) return <Navigate to="/calculator" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoginState('loading')
    try {
      await login(form)
      setLoginState('success')
      setTimeout(() => navigate('/calculator'), 950)
    } catch (err) {
      setLoginState('error')
      setError(err instanceof ApiError ? err.message : 'Error al iniciar sesión')
      // Clear animation class after it finishes so it can retrigger
      const card = cardRef.current
      if (card) {
        card.classList.add('login-short-circuit')
        card.addEventListener('animationend', () => card.classList.remove('login-short-circuit'), { once: true })
      }
      const icon = iconRef.current
      if (icon) {
        icon.classList.add('login-short-circuit-icon')
        icon.addEventListener('animationend', () => icon.classList.remove('login-short-circuit-icon'), { once: true })
      }
      setTimeout(() => setLoginState('idle'), 800)
    }
  }

  const isSuccess = loginState === 'success'
  const isLoading = loginState === 'loading'

  return (
    <div className={cn(
      'flex min-h-[70vh] items-center justify-center transition-colors duration-500',
      error && loginState !== 'loading' ? 'bg-black/15' : ''
    )}>
      {/* Arc flash overlay — brief white blind during error */}
      {loginState === 'error' && (
        <div
          className="fixed inset-0 z-50 pointer-events-none bg-white login-short-circuit-overlay"
        />
      )}

      <div ref={cardRef} className={isSuccess ? 'login-card-warmup' : ''}>
        <Card className={cn('w-full max-w-md relative overflow-hidden', loginState === 'error' && 'login-error-border')}>
          <CardHeader className="text-center">
            <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center mb-2 transition-colors duration-300 ${
              isSuccess ? 'bg-amber-400/20' : 'bg-primary/10'
            }`}>
              <div ref={iconRef} className={isSuccess ? 'login-bulb-on' : ''}>
                <Lightbulb className={`h-6 w-6 transition-colors duration-300 ${
                  isSuccess ? 'text-amber-300' : 'text-primary'
                }`} />
              </div>
            </div>
            <CardTitle>{isSuccess ? '¡Bienvenido!' : 'Iniciar sesión'}</CardTitle>
            <CardDescription>
              {isSuccess ? 'Encendiendo el sistema...' : 'Accede a tu calculadora eléctrica'}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && loginState !== 'loading' && (
                <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive flex items-center gap-2">
                  <span className="text-destructive font-bold text-base leading-none">⚡</span>
                  {error}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="tu@email.com"
                  disabled={isLoading || isSuccess}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPwd ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    className="pr-10"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••"
                    disabled={isLoading || isSuccess}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                className={`w-full transition-colors duration-300 ${isSuccess ? 'bg-amber-500 hover:bg-amber-500 text-white' : ''}`}
                disabled={isLoading || isSuccess}
              >
                {isSuccess ? 'Conectando...' : isLoading ? 'Verificando...' : 'Ingresar'}
              </Button>
              <p className="text-sm text-muted-foreground">
                ¿No tienes cuenta?{' '}
                <Link to="/register" className="text-primary hover:underline">Regístrate</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
