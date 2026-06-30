import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Zap, Calculator, History, Crown, Settings, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'

function getInitials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

function NavAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  return (
    <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-primary/30">
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-primary/10">
          <span className="font-mono text-[10px] font-semibold text-primary leading-none">
            {getInitials(name)}
          </span>
        </div>
      )}
    </div>
  )
}

export function Navbar() {
  const { user, logout, isAuthenticated, isSuperAdmin } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
    setMobileOpen(false)
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn('flex items-center gap-1.5 text-sm px-2 py-1 rounded-md transition-colors',
      isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-surface')

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-primary font-bold shrink-0">
          <Zap className="h-5 w-5" />
          <span className="hidden sm:inline">Calculadora Eléctrica</span>
          <span className="sm:hidden">ElecCalc</span>
        </Link>

        {/* Desktop nav */}
        {isAuthenticated && (
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/calculator" className={navLinkClass}>
              <Calculator className="h-4 w-4" />
              Calculadora
            </NavLink>
            <NavLink to="/history" className={navLinkClass}>
              <History className="h-4 w-4" />
              Historial
            </NavLink>
            <NavLink to="/subscription" className={navLinkClass}>
              <Crown className="h-4 w-4" />
              Plan
            </NavLink>
            {isSuperAdmin && (
              <NavLink to="/admin" className={navLinkClass}>
                <Settings className="h-4 w-4" />
                Admin
              </NavLink>
            )}
          </div>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <NavLink
                to="/profile"
                className={({ isActive }) => cn(
                  'hidden sm:flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors',
                  isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-surface'
                )}
              >
                <NavAvatar name={user?.name ?? ''} avatarUrl={user?.avatar_url} />
                <span>{user?.name}</span>
              </NavLink>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden md:flex gap-1">
                <LogOut className="h-4 w-4" />
                Salir
              </Button>
              <button
                className="md:hidden p-2 text-muted-foreground hover:text-foreground"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Ingresar</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Registrarse</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && isAuthenticated && (
        <div className="md:hidden border-t border-border bg-surface px-4 py-3 flex flex-col gap-2 animate-fade-in">
          <NavLink to="/calculator" className={navLinkClass} onClick={() => setMobileOpen(false)}>
            <Calculator className="h-4 w-4" />
            Calculadora
          </NavLink>
          <NavLink to="/history" className={navLinkClass} onClick={() => setMobileOpen(false)}>
            <History className="h-4 w-4" />
            Historial
          </NavLink>
          <NavLink to="/subscription" className={navLinkClass} onClick={() => setMobileOpen(false)}>
            <Crown className="h-4 w-4" />
            Mi Plan
          </NavLink>
          {isSuperAdmin && (
            <NavLink to="/admin" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              <Settings className="h-4 w-4" />
              Admin
            </NavLink>
          )}
          <NavLink to="/profile" className={navLinkClass} onClick={() => setMobileOpen(false)}>
            <NavAvatar name={user?.name ?? ''} avatarUrl={user?.avatar_url} />
            Mi perfil
          </NavLink>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm px-2 py-1 text-destructive hover:bg-surface rounded-md">
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      )}
    </nav>
  )
}
