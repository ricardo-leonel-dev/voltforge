import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Settings, Users, Building2, CreditCard, ChevronDown, ChevronRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Subscription, User, Organization } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const PROGRAMS = ['digsilent', 'pscad', 'etap']
const PLANS = ['free', 'basico', 'pro'] as const

function PlanBadge({ plan }: { plan: string }) {
  const variant = plan === 'pro' ? 'success' : plan === 'basico' ? 'accent' : 'secondary'
  return <Badge variant={variant}>{plan.toUpperCase()}</Badge>
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={status === 'active' ? 'outline' : 'destructive'} className="text-[10px]">
      {status}
    </Badge>
  )
}

function RoleBadge({ role }: { role: string }) {
  const variant = role === 'superadmin' ? 'accent' : role === 'admin' ? 'outline' : 'secondary'
  return <Badge variant={variant} className="text-[10px]">{role}</Badge>
}

interface OrgPlanDraft {
  plan: string
  program_code: string | null
}

interface OrgCardProps {
  org: Organization
  subscription: Subscription | undefined
  users: User[]
  onSave: (subId: number, draft: OrgPlanDraft) => Promise<void>
  saving: boolean
}

function OrgCard({ org, subscription, users, onSave, saving }: OrgCardProps) {
  const [usersOpen, setUsersOpen] = useState(false)
  const [draft, setDraft] = useState<OrgPlanDraft>({
    plan: subscription?.plan ?? 'free',
    program_code: subscription?.program_code ?? 'digsilent',
  })
  const [isDirty, setIsDirty] = useState(false)

  const original: OrgPlanDraft = {
    plan: subscription?.plan ?? 'free',
    program_code: subscription?.program_code ?? 'digsilent',
  }

  const updateDraft = (patch: Partial<OrgPlanDraft>) => {
    const next = { ...draft, ...patch }
    setDraft(next)
    setIsDirty(next.plan !== original.plan || next.program_code !== original.program_code)
  }

  const handleSave = async () => {
    if (!subscription) return
    await onSave(subscription.id, draft)
    setIsDirty(false)
  }

  return (
    <Card className="overflow-hidden">
      {/* Org header */}
      <div className="flex items-center justify-between gap-4 p-4 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{org.name}</p>
            <p className="text-[10px] text-muted-foreground">Desde {formatDate(org.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {subscription && <PlanBadge plan={subscription.plan} />}
          {subscription && <StatusBadge status={subscription.status} />}
          {!subscription && <Badge variant="secondary" className="text-[10px]">Sin suscripción</Badge>}
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Plan controls */}
        {subscription && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
              Asignación de plan
            </p>
            <div className="flex flex-wrap items-end gap-2">
              {PLANS.map(p => {
                const isSelected = draft.plan === p
                const activeStyle =
                  p === 'pro'    ? 'border-l-primary text-primary bg-primary/10 border-primary/40'
                  : p === 'basico' ? 'border-l-accent text-accent bg-accent/10 border-accent/40'
                  : 'border-l-muted-foreground text-foreground bg-muted/30 border-border'
                return (
                  <div key={p} className="flex flex-col gap-1">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => updateDraft({
                        plan: p,
                        program_code: p === 'basico' ? (draft.program_code ?? 'digsilent') : null,
                      })}
                      className={cn(
                        'h-8 px-3 text-[11px] font-bold rounded border border-l-4 transition-all',
                        isSelected
                          ? activeStyle
                          : 'border-border border-l-border text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {p === 'basico' ? 'BÁSICO' : p.toUpperCase()}
                    </button>
                    {p === 'basico' && isSelected && (
                      <Select
                        value={draft.program_code ?? 'digsilent'}
                        onValueChange={v => updateDraft({ program_code: v })}
                        disabled={saving}
                      >
                        <SelectTrigger className="h-7 w-28 text-[11px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PROGRAMS.map(prog => (
                            <SelectItem key={prog} value={prog} className="text-xs">
                              {prog.toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )
              })}

              <Button
                size="sm"
                className="h-8 text-xs ml-auto"
                disabled={!isDirty || saving}
                onClick={handleSave}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        )}

        {/* Users accordion */}
        <div>
          <button
            type="button"
            onClick={() => setUsersOpen(v => !v)}
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full text-left"
          >
            {usersOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            <Users className="h-3.5 w-3.5" />
            {users.length} usuario{users.length !== 1 ? 's' : ''}
          </button>

          {usersOpen && (
            <div className="mt-3 space-y-2 pl-6 border-l border-border ml-1.5">
              {users.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Sin usuarios registrados</p>
              ) : (
                users.map(user => (
                  <div key={user.id} className="flex items-center justify-between gap-2 py-1">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <RoleBadge role={user.role} />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function AdminDashboard() {
  const { isSuperAdmin, isLoading } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [subs, setSubs] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<number | null>(null)

  useEffect(() => {
    if (!isSuperAdmin) return
    Promise.all([
      api.admin.listUsers(),
      api.admin.listOrganizations(),
      api.admin.listSubscriptions(),
    ]).then(([u, o, s]) => {
      setUsers(u)
      setOrgs(o)
      setSubs(s)
    }).finally(() => setLoading(false))
  }, [isSuperAdmin])

  if (!isLoading && !isSuperAdmin) return <Navigate to="/" replace />

  const handleSave = async (subId: number, draft: OrgPlanDraft) => {
    setSavingId(subId)
    try {
      const updated = await api.admin.updateSubscription(subId, {
        plan: draft.plan,
        status: 'active',
        program_code: draft.program_code,
      })
      setSubs(prev => prev.map(s => s.id === subId ? updated : s))
    } finally {
      setSavingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
        Cargando panel...
      </div>
    )
  }

  const proCount = subs.filter(s => s.plan === 'pro').length

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Panel de Administración</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Users, label: 'Usuarios', value: users.length },
          { icon: Building2, label: 'Organizaciones', value: orgs.length },
          { icon: CreditCard, label: 'Suscripciones Pro', value: proCount },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Org cards */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Organizaciones
        </h2>
        <div className="space-y-3">
          {orgs.map(org => {
            const sub = subs.find(s => s.org_id === org.id)
            const orgUsers = users.filter(u => u.org_id === org.id)
            return (
              <OrgCard
                key={org.id}
                org={org}
                subscription={sub}
                users={orgUsers}
                onSave={handleSave}
                saving={savingId === sub?.id}
              />
            )
          })}

          {orgs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay organizaciones registradas.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
