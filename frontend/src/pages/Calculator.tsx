import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Zap } from 'lucide-react'
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
  subtipo: 'Tramo BTA Trifasico',
  fase_conexion: 'ABC',
  voltaje_kv: 0.22,
  conductor_code: 'ACSR 2',
  configuracion: '3F4C',
  circuito: 'abc',
  tipo_uso: 'Distribución',
  circuitos: 'ABC',
  distancia_m: 100,
  terminal_i: 'Nodo inicial / Cub_1',
  terminal_j: 'Nodo final / Cub_16',
  template_program_code: 'digsilent',
}

function autoAdjustForConductor(code: string, prev: CalcInput): Partial<CalcInput> {
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

  useEffect(() => {
    api.conductors.list().then(setConductors).catch(console.error)
  }, [])

  if (!isLoading && !isAuthenticated) return <Navigate to="/login" replace />

  const set = (key: keyof CalcInput, value: string | number) =>
    setForm(f => ({ ...f, [key]: value }))

  const handleConductorChange = (code: string) => {
    const adjust = autoAdjustForConductor(code, form)
    setForm(f => ({ ...f, conductor_code: code, ...adjust }))
  }

  const handleGenerate = async () => {
    setError('')
    setIsGenerating(true)
    try {
      const calc = await api.calculations.create(form)
      setResult(calc)
      refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al generar plantilla')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Calculadora ArcGIS → DIgSILENT</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos del tramo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

            {/* TERMINALES */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Terminal i</Label>
                <Input value={form.terminal_i} onChange={e => set('terminal_i', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Terminal j</Label>
                <Input value={form.terminal_j} onChange={e => set('terminal_j', e.target.value)} />
              </div>
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

        {/* Resultado */}
        <div>
          {result ? (
            <TemplateDisplay
              resultData={result.result_data}
              resultText={result.result_text}
              resultHtml={result.result_html}
              calculationId={result.id}
              plan={plan}
              downloadCount={result.download_count}
            />
          ) : (
            <div className="card-surface p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px] text-muted-foreground">
              <Zap className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm">Completa el formulario y genera la plantilla</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
