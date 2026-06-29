import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Zap, PenLine } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { api, ApiError } from '@/lib/api'
import type { CalcInput, Calculation, ConductorType } from '@/lib/types'
import { SubscriptionGate } from '@/components/SubscriptionGate'
import { TemplateDisplay } from '@/components/TemplateDisplay'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const SUBTIPOS = ['Tramo BTA Trifasico', 'Tramo BTA Bifasico', 'Tramo BTA Monofasico', 'Tramo MTA Trifasico']
const FASES = ['ABC', 'AB', 'AC', 'BC', 'A', 'B', 'C']
const VOLTAJES = [
  { label: '220 V', value: '0.22' },
  { label: '127 V', value: '0.127' },
  { label: '13.8 kV', value: '13.8' },
  { label: '22 kV', value: '22' },
]
const CONFIGURACIONES = ['3F4C', '3F3C', '2F3C', '2F2C', '1F2C']
const USOS = ['Distribución', 'Acometida', 'Alumbrado Público']

const DEFAULT_FORM: CalcInput = {
  nombre: '',
  descripcion: '',
  subtipo: 'Tramo BTA Trifasico',
  fase_conexion: 'ABC',
  voltaje_kv: 0.22,
  conductor_code: 'ACSR 2',
  configuracion: '3F4C',
  circuito: 'abc',
  tipo_uso: 'Distribución',
  circuitos: 'ABC',
  distancia_m: 100,
  template_program_code: 'digsilent',
}

function autoAdjustForConductor(code: string): Partial<CalcInput> {
  if (code.includes('MONOFASICA')) {
    return { subtipo: 'Tramo BTA Monofasico', fase_conexion: 'A', configuracion: '1F2C', circuito: 'a', circuitos: 'A', tipo_uso: 'Acometida', voltaje_kv: 0.22 }
  }
  if (code.includes('BIFASICA')) {
    return { subtipo: 'Tramo BTA Bifasico', fase_conexion: 'AB', configuracion: '2F3C', circuito: 'ab', circuitos: 'AB', tipo_uso: 'Acometida', voltaje_kv: 0.22 }
  }
  if (code.includes('TRIFASICA')) {
    return { subtipo: 'Tramo BTA Trifasico', fase_conexion: 'ABC', configuracion: '3F4C', circuito: 'abc', circuitos: 'ABC', tipo_uso: 'Acometida', voltaje_kv: 0.22 }
  }
  return {}
}

export function Calculator() {
  const { isAuthenticated, isLoading } = useAuth()
  const { plan, refresh } = useSubscription()
  const [conductors, setConductors] = useState<ConductorType[]>([])
  const [form, setForm] = useState<CalcInput>(DEFAULT_FORM)
  const [result, setResult] = useState<Calculation | null>(null)
  const [error, setError] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [formCollapsed, setFormCollapsed] = useState(false)

  useEffect(() => {
    api.conductors.list().then(setConductors).catch(console.error)
  }, [])

  if (!isLoading && !isAuthenticated) return <Navigate to="/login" replace />

  const set = (key: keyof CalcInput, value: string | number) =>
    setForm(f => ({ ...f, [key]: value }))

  const handleConductorChange = (code: string) => {
    const adjust = autoAdjustForConductor(code)
    setForm(f => ({ ...f, conductor_code: code, ...adjust }))
  }

  const handleGenerate = async () => {
    setError('')
    setIsGenerating(true)
    try {
      const calc = await api.calculations.create(form)
      setResult(calc)
      setFormCollapsed(true)
      refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al generar plantilla')
    } finally {
      setIsGenerating(false)
    }
  }

  const hasResult = result !== null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Calculadora ArcGIS → DIgSILENT</h1>
      </div>

      <div className={cn(
        'flex gap-5 items-start transition-all duration-500',
        hasResult ? 'flex-row' : 'flex-col max-w-3xl mx-auto w-full'
      )}>

        {/* Formulario */}
        <div className={cn(
          'transition-all duration-500 shrink-0',
          hasResult && formCollapsed
            ? 'w-12'
            : hasResult
              ? 'w-full lg:w-80'
              : 'w-full'
        )}>
          {hasResult && formCollapsed ? (
            /* Collapsed: vertical icon strip */
            <div className="flex flex-col items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                title="Editar parámetros"
                onClick={() => setFormCollapsed(false)}
              >
                <PenLine className="h-4 w-4" />
              </Button>
              <div
                className="text-[10px] text-muted-foreground"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap' }}
              >
                {form.nombre || 'Parámetros'}
              </div>
            </div>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Datos del tramo</CardTitle>
                  {hasResult && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground"
                      onClick={() => setFormCollapsed(true)}
                    >
                      Colapsar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* NOMBRE */}
                <div className="space-y-1.5">
                  <Label>Nombre del cálculo <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.nombre}
                    onChange={e => set('nombre', e.target.value)}
                    placeholder="Ej: Circuito Norte - Alimentador 3"
                  />
                </div>

                {/* DESCRIPCIÓN */}
                <div className="space-y-1.5">
                  <Label>Descripción <span className="text-xs text-muted-foreground">(opcional)</span></Label>
                  <textarea
                    value={form.descripcion ?? ''}
                    onChange={e => set('descripcion', e.target.value)}
                    placeholder="Notas adicionales sobre este tramo..."
                    rows={2}
                    className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  />
                </div>

                <div className="border-t border-border pt-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-3 font-medium">
                    Parámetros técnicos
                  </p>
                </div>

                {/* SUBTIPO */}
                <div className="space-y-1.5">
                  <Label>SUBTIPO <span className="text-destructive">*</span></Label>
                  <Select value={form.subtipo} onValueChange={v => set('subtipo', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SUBTIPOS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                {/* FASE */}
                <div className="space-y-1.5">
                  <Label>Fase Conexión <span className="text-destructive">*</span></Label>
                  <Select value={form.fase_conexion} onValueChange={v => set('fase_conexion', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{FASES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                {/* VOLTAJE */}
                <div className="space-y-1.5">
                  <Label>Voltaje <span className="text-destructive">*</span></Label>
                  <Select value={String(form.voltaje_kv)} onValueChange={v => set('voltaje_kv', parseFloat(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{VOLTAJES.map(v => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                {/* CONDUCTOR */}
                <div className="space-y-1.5">
                  <Label>Código Conductor Fase <span className="text-destructive">*</span></Label>
                  <Select value={form.conductor_code} onValueChange={handleConductorChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {conductors.map(c => (
                        <SelectItem key={c.code} value={c.code}>{c.display_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* CONFIGURACION */}
                <div className="space-y-1.5">
                  <Label>Configuración Conductores <span className="text-destructive">*</span></Label>
                  <Select value={form.configuracion} onValueChange={v => set('configuracion', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CONFIGURACIONES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                {/* CIRCUITO */}
                <div className="space-y-1.5">
                  <Label>Circuito <span className="text-destructive">*</span></Label>
                  <Input value={form.circuito} onChange={e => set('circuito', e.target.value)} />
                </div>

                {/* USO */}
                <div className="space-y-1.5">
                  <Label>Tipo Uso Tramo <span className="text-destructive">*</span></Label>
                  <Select value={form.tipo_uso} onValueChange={v => set('tipo_uso', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{USOS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                {/* CIRCUITOS */}
                <div className="space-y-1.5">
                  <Label>Circuitos <span className="text-destructive">*</span></Label>
                  <Input value={form.circuitos} onChange={e => set('circuitos', e.target.value)} />
                </div>

                {/* DISTANCIA */}
                <div className="space-y-1.5">
                  <Label>Longitud del tramo (m)</Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.distancia_m}
                    onChange={e => set('distancia_m', parseFloat(e.target.value) || 0)}
                  />
                </div>

                {/* Aviso */}
                <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-400">
                  Si tus usuarios ya están conectados como cargas en buses/nodos específicos, no llenes Line Loads. Déjalo en cero para no duplicar carga.
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <SubscriptionGate onGenerate={handleGenerate} isGenerating={isGenerating} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Resultado */}
        {hasResult && (
          <div className="flex-1 min-w-0">
            <TemplateDisplay
              resultData={result.result_data}
              resultText={result.result_text}
              resultHtml={result.result_html}
              calculationId={result.id}
              plan={plan}
              downloadCount={result.download_count}
            />
          </div>
        )}
      </div>
    </div>
  )
}
