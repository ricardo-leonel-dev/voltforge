import { useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Camera, Check, Lock, User as UserIcon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { api, ApiError } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ── Avatar ───────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

function resizeImage(file: File, maxPx = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(maxPx / img.width, maxPx / img.height, 1)
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = reject
    img.src = url
  })
}

// Engineered badge: SVG arc dial around the avatar
function ArcRing() {
  // r=64 in 140×140 viewBox → circumference ≈ 402.1
  // 270° arc (dash) + 90° gap — gap positioned at bottom-right
  const r = 64
  const circ = 2 * Math.PI * r
  const dash = circ * 0.75
  const gap = circ * 0.25
  return (
    <svg
      width="140" height="140" viewBox="0 0 140 140" fill="none"
      className="absolute inset-0 pointer-events-none"
      aria-hidden
    >
      {/* Dim full ring */}
      <circle cx="70" cy="70" r={r} stroke="rgba(14,165,233,0.12)" strokeWidth="1.5" />
      {/* Active arc — gap sits at bottom-right (rotate 135° so dash starts at ~top-left going clockwise) */}
      <circle
        cx="70" cy="70" r={r}
        stroke="rgba(14,165,233,0.55)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${gap}`}
        transform="rotate(135 70 70)"
      />
      {/* Tick marks at start/end of gap — feel like calibration marks */}
      <line x1="70" y1="6" x2="70" y2="14" stroke="rgba(14,165,233,0.8)" strokeWidth="1.5"
        transform="rotate(135 70 70)" strokeLinecap="round" />
      <line x1="70" y1="6" x2="70" y2="14" stroke="rgba(14,165,233,0.8)" strokeWidth="1.5"
        transform="rotate(225 70 70)" strokeLinecap="round" />
    </svg>
  )
}

function AvatarSection({
  name,
  avatarUrl,
  onAvatarChange,
}: {
  name: string
  avatarUrl?: string | null
  onAvatarChange: (dataUrl: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [hovering, setHovering] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('La imagen debe ser menor a 5 MB'); return }
    setUploading(true)
    try {
      const dataUrl = await resizeImage(file)
      onAvatarChange(dataUrl)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-[140px] h-[140px]">
        <ArcRing />
        {/* Avatar circle — 120px centered in 140px container */}
        <button
          type="button"
          className="absolute inset-[10px] rounded-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={() => fileRef.current?.click()}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          disabled={uploading}
          title="Cambiar foto"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10 border border-primary/20">
              <span className="font-mono text-2xl font-semibold text-primary tracking-tighter select-none">
                {getInitials(name)}
              </span>
            </div>
          )}
          {/* Hover overlay */}
          <div className={cn(
            'absolute inset-0 flex flex-col items-center justify-center gap-1',
            'bg-black/60 backdrop-blur-[2px] transition-opacity duration-200',
            hovering && !uploading ? 'opacity-100' : 'opacity-0'
          )}>
            <Camera className="h-5 w-5 text-white" />
            <span className="text-[10px] text-white/80 font-mono uppercase tracking-wide">Cambiar</span>
          </div>
          {/* Uploading overlay */}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      <div className="text-center">
        <p className="font-mono text-base font-semibold text-foreground">{name}</p>
      </div>
    </div>
  )
}

// ── Inline feedback ──────────────────────────────────────────────────────────

type FeedbackState = { type: 'success' | 'error'; msg: string } | null

function Feedback({ state }: { state: FeedbackState }) {
  if (!state) return null
  return (
    <p className={cn('text-xs', state.type === 'success' ? 'text-emerald-400' : 'text-destructive')}>
      {state.type === 'success' ? <Check className="inline h-3 w-3 mr-1" /> : null}
      {state.msg}
    </p>
  )
}

// ── Sección info básica ──────────────────────────────────────────────────────

function BasicInfoSection({ onSaved }: { onSaved: () => void }) {
  const { user } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>(null)

  const handleSave = async () => {
    setSaving(true)
    setFeedback(null)
    try {
      await api.auth.updateMe({ name: name.trim() || undefined, email: email.trim() || undefined })
      await onSaved()
      setFeedback({ type: 'success', msg: 'Cambios guardados' })
      setTimeout(() => setFeedback(null), 3000)
    } catch (err) {
      setFeedback({ type: 'error', msg: err instanceof ApiError ? err.message : 'Error al guardar' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card-surface p-5 space-y-4">
      <div className="flex items-center gap-2 pb-1 border-b border-border">
        <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
          Datos de cuenta
        </span>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Nombre</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-primary/90"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
        <Feedback state={feedback} />
      </div>
    </div>
  )
}

// ── Sección contraseña ───────────────────────────────────────────────────────

function PasswordSection() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>(null)

  const handleChange = async () => {
    if (next !== confirm) {
      setFeedback({ type: 'error', msg: 'Las contraseñas nuevas no coinciden' })
      return
    }
    setSaving(true)
    setFeedback(null)
    try {
      await api.auth.updateMe({ current_password: current, new_password: next })
      setCurrent('')
      setNext('')
      setConfirm('')
      setFeedback({ type: 'success', msg: 'Contraseña actualizada' })
      setTimeout(() => setFeedback(null), 3000)
    } catch (err) {
      setFeedback({ type: 'error', msg: err instanceof ApiError ? err.message : 'Error al cambiar contraseña' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card-surface border-amber-500/20 p-5 space-y-4">
      <div className="flex items-center gap-2 pb-1 border-b border-amber-500/20">
        <Lock className="h-3.5 w-3.5 text-amber-400/70" />
        <span className="text-[10px] uppercase tracking-widest text-amber-400/70 font-medium">
          Seguridad
        </span>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Contraseña actual</Label>
          <Input type="password" value={current} onChange={e => setCurrent(e.target.value)} placeholder="••••••••" />
        </div>
        <div className="space-y-1.5">
          <Label>Nueva contraseña</Label>
          <Input type="password" value={next} onChange={e => setNext(e.target.value)} placeholder="Mín. 8 caracteres" />
        </div>
        <div className="space-y-1.5">
          <Label>Confirmar nueva contraseña</Label>
          <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button
          size="sm"
          variant="outline"
          onClick={handleChange}
          disabled={saving || !current || !next || !confirm}
          className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
        >
          {saving ? 'Cambiando...' : 'Cambiar contraseña'}
        </Button>
        <Feedback state={feedback} />
      </div>
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────

export function Profile() {
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth()
  const [avatarSaving, setAvatarSaving] = useState(false)

  if (!isLoading && !isAuthenticated) return <Navigate to="/login" replace />

  const handleAvatarChange = async (dataUrl: string) => {
    setAvatarSaving(true)
    try {
      await api.auth.updateMe({ avatar_url: dataUrl })
      await refreshUser()
    } catch {
      // silent — avatar upload failures are non-critical
    } finally {
      setAvatarSaving(false)
    }
  }

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Avatar + nombre */}
      <AvatarSection
        name={user.name}
        avatarUrl={user.avatar_url}
        onAvatarChange={handleAvatarChange}
      />

      {/* Info básica */}
      <BasicInfoSection onSaved={refreshUser} />

      {/* Contraseña */}
      <PasswordSection />

      {/* Meta info */}
      <div className="text-center text-[11px] text-muted-foreground/50 font-mono space-y-0.5">
        <p>ID {user.id} · org {user.org_id} · {user.role}</p>
        <p>Cuenta creada {new Date(user.created_at).toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
    </div>
  )
}
