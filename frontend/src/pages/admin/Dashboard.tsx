import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Settings, Users, Building2, CreditCard } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Subscription, User, Organization } from '@/lib/types'
import { formatDate } from '@/lib/utils'

const PROGRAMS = ['digsilent', 'pscad', 'etap']

function PlanBadge({ plan }: { plan: string }) {
  const variant = plan === 'pro' ? 'success' : plan === 'basico' ? 'accent' : 'secondary'
  return <Badge variant={variant}>{plan.toUpperCase()}</Badge>
}

export function AdminDashboard() {
  const { isSuperAdmin, isLoading } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [subs, setSubs] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<number | null>(null)

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

  const cyclePlan = async (sub: Subscription) => {
    setUpdating(sub.id)
    try {
      const plans = ['free', 'basico', 'pro']
      const next = plans[(plans.indexOf(sub.plan) + 1) % plans.length]
      const programCode = next === 'basico' ? (sub.program_code ?? 'digsilent') : null
      const updated = await api.admin.updateSubscription(sub.id, {
        plan: next,
        status: 'active',
        program_code: programCode,
      })
      setSubs(prev => prev.map(s => s.id === sub.id ? updated : s))
    } finally {
      setUpdating(null)
    }
  }

  const updateProgram = async (sub: Subscription, programCode: string) => {
    setUpdating(sub.id)
    try {
      const updated = await api.admin.updateSubscription(sub.id, {
        plan: sub.plan,
        status: sub.status,
        program_code: programCode,
      })
      setSubs(prev => prev.map(s => s.id === sub.id ? updated : s))
    } finally {
      setUpdating(null)
    }
  }

  if (loading) return <div className="text-muted-foreground text-sm">Cargando panel admin...</div>

  const nextPlanLabel = (plan: string) => {
    const plans = ['free', 'basico', 'pro']
    const next = plans[(plans.indexOf(plan) + 1) % plans.length]
    return `→ ${next}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Panel de Administración</h1>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Users, label: 'Usuarios', value: users.length },
          { icon: Building2, label: 'Organizaciones', value: orgs.length },
          { icon: CreditCard, label: 'Suscripciones Pro', value: subs.filter(s => s.plan === 'pro').length },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
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

      {/* Suscripciones */}
      <Card>
        <CardHeader><CardTitle className="text-base">Suscripciones</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {subs.map(sub => {
              const org = orgs.find(o => o.id === sub.org_id)
              return (
                <div key={sub.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{org?.name ?? `Org #${sub.org_id}`}</p>
                    <p className="text-xs text-muted-foreground">Actualizado: {formatDate(sub.updated_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <PlanBadge plan={sub.plan} />
                    <Badge variant={sub.status === 'active' ? 'outline' : 'destructive'}>{sub.status}</Badge>

                    {sub.plan === 'basico' && (
                      <Select
                        value={sub.program_code ?? 'digsilent'}
                        onValueChange={v => updateProgram(sub, v)}
                        disabled={updating === sub.id}
                      >
                        <SelectTrigger className="h-7 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PROGRAMS.map(p => (
                            <SelectItem key={p} value={p} className="text-xs">{p.toUpperCase()}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      disabled={updating === sub.id}
                      onClick={() => cyclePlan(sub)}
                    >
                      {updating === sub.id ? '...' : nextPlanLabel(sub.plan)}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Usuarios */}
      <Card>
        <CardHeader><CardTitle className="text-base">Usuarios</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={user.role === 'superadmin' ? 'accent' : 'secondary'}>{user.role}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {orgs.find(o => o.id === user.org_id)?.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Las suscripciones sin pago directo se gestionan manualmente.{' '}
        <Link to="/subscription" className="text-primary hover:underline">Ver mi plan</Link>
      </p>
    </div>
  )
}
