import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { History as HistoryIcon, ChevronDown, ChevronRight, Zap } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { api } from '@/lib/api'
import type { Calculation, CalcInput } from '@/lib/types'
import { TemplateDisplay } from '@/components/TemplateDisplay'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

function CalcRow({ calc, plan }: { calc: Calculation; plan: string }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const inputs = calc.inputs

  const handleUseAsBase = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate('/calculator', { state: { prefill: inputs as unknown as CalcInput } })
  }

  return (
    <div className="card-surface overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-surface-hover transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {inputs.nombre || '(sin nombre)'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {inputs.subtipo} — {inputs.conductor_code} — {inputs.fase_conexion}
            </p>
            <p className="text-[11px] text-muted-foreground/60">{formatDate(calc.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-3 shrink-0">
          <Badge variant="secondary">{inputs.distancia_m} m</Badge>
          <Badge variant="outline">{inputs.voltaje_kv} kV</Badge>
          <button
            onClick={handleUseAsBase}
            className="text-[11px] text-primary/70 hover:text-primary border border-primary/20 hover:border-primary/50 px-2 py-0.5 rounded-full transition-colors whitespace-nowrap"
          >
            Usar como base →
          </button>
        </div>
      </button>

      {open && (calc.result_data || calc.result_text) && (
        <div className="border-t border-border p-4">
          <TemplateDisplay
            resultData={calc.result_data}
            resultText={calc.result_text}
            resultHtml={calc.result_html}
            calculationId={calc.id}
            plan={plan}
            downloadCount={calc.download_count}
          />
        </div>
      )}
    </div>
  )
}

export function History() {
  const { isAuthenticated, isLoading } = useAuth()
  const { plan } = useSubscription()
  const [calculations, setCalculations] = useState<Calculation[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!isAuthenticated) return
    api.calculations.list(page)
      .then(setCalculations)
      .finally(() => setLoading(false))
  }, [isAuthenticated, page])

  if (!isLoading && !isAuthenticated) return <Navigate to="/login" replace />

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <HistoryIcon className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Historial de cálculos</h1>
      </div>

      {loading ? (
        <div className="text-muted-foreground text-sm">Cargando...</div>
      ) : calculations.length === 0 ? (
        <div className="card-surface p-10 flex flex-col items-center justify-center text-center text-muted-foreground">
          <Zap className="h-10 w-10 mb-3 opacity-20" />
          <p className="text-sm">Aún no has generado ninguna plantilla.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {calculations.map((calc, i) => (
            <CalcRow key={calc.id ?? i} calc={calc} plan={plan} />
          ))}
        </div>
      )}

      {calculations.length === 20 && (
        <button
          onClick={() => setPage(p => p + 1)}
          className="w-full py-2 text-sm text-primary hover:underline"
        >
          Cargar más
        </button>
      )}
    </div>
  )
}
