import { useState } from 'react'
import { Check, Copy, FileDown } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import { api, ApiError } from '@/lib/api'

// ── Tipos ────────────────────────────────────────────────────────────────────

interface NeutroBasic { rn_ohm_km: number; xn_ohm_km: number; rpn_ohm_km: number; xpn_ohm_km: number }
interface NeutroLF    { bn_us_km: number; bpn_us_km: number }

interface Section1 {
  name: string; rated_voltage_kv: number; i_ground_ka: number; i_air_ka: number
  nominal_frequency_hz: number; cable_ohl: string; system_type: string
  phases: number; neutrals: number
  r_ohm_km: number; x_ohm_km: number; r0_ohm_km: number; x0_ohm_km: number
  neutral_params: NeutroBasic | null
}
interface Section2 {
  max_temperature_degc: number; r_ohm_km: number; material: string
  b_us_km: number; b0_us_km: number; ins_factor: number
  neutral_params: NeutroLF | null
}
interface Section3 {
  name: string; type: string; parallel_lines: number
  length_km: number; derating_factor: number; type_of_line: string; line_model: string
}
interface Section4 {
  customers: number; max_load_kva: number; average_load_kva: number
  power_factor: number; max_loading_pct: number
}
interface ResultData {
  section1_line_type_basic: Section1
  section2_line_type_load_flow: Section2
  section3_elm_lne_basic: Section3
  section4_elm_lne_load_flow: Section4
}

export interface TemplateDisplayProps {
  resultData: Record<string, unknown> | null
  resultText: string | null
  resultHtml?: string | null
  calculationId?: number
  plan?: string
  downloadCount?: number
  className?: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const f = (n: number, dec = 4) => n.toFixed(dec)

const TABS_LINE_TYPE = [
  'Basic Data','Load Flow','VDE/IEC Short-Circuit','Complete Short-Circuit',
  'ANSI Short-Circuit','IEC 61363','DC Short-Circuit','RMS-Simulation',
  'EMT-Simulation','Harmonics/Power Quality','Protection','Reliability',
  'Cable Sizing','Description',
]
const TABS_ELM_LNE = [
  'Basic Data','Load Flow','VDE/IEC Short-Circuit','Complete Short-Circuit',
  'ANSI Short-Circuit','IEC 61363','DC Short-Circuit','RMS-Simulation',
  'EMT-Simulation','Harmonics/Power Quality','Optimal Power Flow','Reliability',
  'Generation Adequacy','Tie Open Point Opt.','Cable Sizing','Description',
]

// ── Primitivos UI (pantalla) ─────────────────────────────────────────────────

function ValBox({ value, wide }: { value: string | number; wide?: boolean }) {
  const [copied, setCopied] = useState(false)
  const text = String(value)
  return (
    <span
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1400) }}
      title="Click para copiar"
      className={cn(
        'relative inline-flex items-center gap-1 cursor-pointer select-all shrink-0',
        'border border-slate-400 bg-white text-slate-900 rounded px-1.5 py-0.5',
        'text-xs font-mono hover:border-sky-400 hover:bg-sky-50 transition-colors',
        wide ? 'min-w-[160px] sm:min-w-[220px]' : 'min-w-[60px]',
        copied && 'border-emerald-400 bg-emerald-50 text-emerald-800'
      )}
    >
      {/* Tooltip flotante */}
      <span className={cn(
        'pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 z-50',
        'bg-emerald-800 text-emerald-100 text-[10px] px-2 py-0.5 rounded whitespace-nowrap',
        'transition-opacity duration-300',
        copied ? 'opacity-100' : 'opacity-0'
      )}>
        Copiado ✓
      </span>
      {copied && <Check className="h-2.5 w-2.5 text-emerald-500 shrink-0" />}
      <span className="truncate">{text}</span>
    </span>
  )
}

function Field({ label, value, unit, wide, accent }: {
  label: string; value: string | number; unit?: string; wide?: boolean; accent?: boolean
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap min-w-0">
      <span className={cn('text-xs shrink-0', accent ? 'text-red-400 font-medium' : 'text-slate-300')}>
        {label}
      </span>
      <ValBox value={value} wide={wide} />
      {unit && <span className="text-xs text-slate-400 shrink-0">{unit}</span>}
    </div>
  )
}

function Group({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('relative border border-slate-500 rounded pt-5 pb-3 px-3', className)}>
      <span className="absolute -top-2.5 left-2 bg-slate-800 px-1.5 text-[10px] font-semibold text-slate-300 whitespace-nowrap">
        {title}
      </span>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function DigsPanel({ title, activeTab, tabs, children }: {
  title: string; activeTab: string; tabs: string[]; children: React.ReactNode
}) {
  return (
    <div className="mb-5">
      <h3 className="text-xs font-semibold text-sky-400 mb-1.5 uppercase tracking-wide">{title}</h3>
      <div className="border border-slate-600 bg-slate-800 rounded overflow-hidden flex flex-col sm:flex-row">
        <div className="hidden sm:block w-36 shrink-0 border-r border-slate-600 text-[10px]">
          {tabs.map(tab => (
            <div key={tab} className={cn(
              'px-2 py-1 border-b border-slate-700',
              tab === activeTab ? 'bg-sky-700 text-white font-semibold' : 'text-slate-400'
            )}>{tab}</div>
          ))}
        </div>

        <div className="sm:hidden px-3 pt-2">
          <span className="inline-block text-[10px] bg-sky-700 text-white px-2 py-0.5 rounded font-semibold">
            {activeTab}
          </span>
        </div>

        <div className="flex-1 p-3 sm:p-4 space-y-2.5 min-w-0">{children}</div>
      </div>
    </div>
  )
}

// ── Secciones ────────────────────────────────────────────────────────────────

function S1({ d }: { d: Section1 }) {
  return (
    <DigsPanel title="1. Line Type — Basic Data" activeTab="Basic Data" tabs={TABS_LINE_TYPE}>
      <Field label="Name" value={d.name} wide />
      <Field label="Rated Voltage" value={f(d.rated_voltage_kv, 3)} unit="kV" />
      <div className="flex flex-wrap gap-3">
        <Field label="Rated Current" value={f(d.i_ground_ka, 3)} unit="kA (in ground)" />
        <Field label="Rated Current (in air)" value={f(d.i_air_ka, 3)} unit="kA" />
      </div>
      <Field label="Nominal Frequency" value={d.nominal_frequency_hz} unit="Hz" />
      <Field label="Cable / OHL" value={d.cable_ohl} />
      <div className="flex flex-wrap gap-3">
        <Field label="System Type" value={d.system_type} />
        <Field label="Phases" value={d.phases} />
        <Field label="Number of Neutrals" value={d.neutrals} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <Group title="Parameters per Length 1,2-Sequence">
          <Field label="AC-Resistance R'(20°C)" value={f(d.r_ohm_km)} unit="Ohm/km" />
          <Field label="Reactance X'" value={f(d.x_ohm_km)} unit="Ohm/km" />
        </Group>
        <Group title="Parameters per Length Zero Sequence">
          <Field label="AC-Resistance R0'" value={f(d.r0_ohm_km)} unit="Ohm/km" />
          <Field label="Reactance X0'" value={f(d.x0_ohm_km)} unit="Ohm/km" />
        </Group>
      </div>
      {d.neutral_params && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Group title="Parameters per Length, Neutral">
            <Field label="AC-Resistance Rn'" value={f(d.neutral_params.rn_ohm_km)} unit="Ohm/km" />
            <Field label="Reactance Xn'" value={f(d.neutral_params.xn_ohm_km)} unit="Ohm/km" />
          </Group>
          <Group title="Parameters per Length, Phase-Neutral Coupling">
            <Field label="AC-Resistance Rpn'" value={f(d.neutral_params.rpn_ohm_km)} unit="Ohm/km" />
            <Field label="Reactance Xpn'" value={f(d.neutral_params.xpn_ohm_km)} unit="Ohm/km" />
          </Group>
        </div>
      )}
    </DigsPanel>
  )
}

function S2({ d }: { d: Section2 }) {
  return (
    <DigsPanel title="2. Line Type — Load Flow" activeTab="Load Flow" tabs={TABS_LINE_TYPE}>
      <Group title="Parameters per Length 1,2-Sequence" className="w-full sm:w-80">
        <Field label="Max. Operational Temperature" value={d.max_temperature_degc} unit="°C" />
        <Field label="AC-Resistance R'(20°C)" value={f(d.r_ohm_km)} unit="Ohm/km" />
        <Field label="Conductor Material" value={d.material} />
      </Group>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <Group title="Parameters per Length 1,2-Sequence">
          <Field label="Susceptance B'" value={f(d.b_us_km)} unit="uS/km" />
          <Field label="Ins. Factor" value={d.ins_factor} />
        </Group>
        <Group title="Parameters per Length Zero Sequence">
          <Field label="Susceptance B0'" value={f(d.b0_us_km)} unit="uS/km" />
          <Field label="Ins. Factor" value={d.ins_factor} />
        </Group>
      </div>
      {d.neutral_params && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Group title="Parameters per Length, Neutral">
            <Field label="Susceptance Bn'" value={f(d.neutral_params.bn_us_km)} unit="uS/km" />
          </Group>
          <Group title="Parameters per Length, Phase-Neutral Coupling">
            <Field label="Susceptance Bpn'" value={f(d.neutral_params.bpn_us_km)} unit="uS/km" />
          </Group>
        </div>
      )}
    </DigsPanel>
  )
}

function S3({ d }: { d: Section3 }) {
  return (
    <DigsPanel title="3. Line / ElmLne — Basic Data" activeTab="Basic Data" tabs={TABS_ELM_LNE}>
      <Field label="Name" value={d.name} wide />
      <Field label="Type" value={d.type} wide />
      <Field label="Out of Service" value="NO marcar" />
      <Group title="Number of" className="w-full sm:w-72">
        <Field label="parallel Lines" value={d.parallel_lines} />
      </Group>
      <Group title="Parameters" className="w-full sm:w-72">
        <Field label="Thermal Rating" value="Vacío" />
        <Field label="Length of Line" value={f(d.length_km)} unit="km" />
        <Field label="Derating Factor" value={d.derating_factor} />
      </Group>
      <Field label="Type of Line" value={d.type_of_line} wide accent />
      <Group title="Line Model" className="w-full sm:w-64">
        <p className="text-xs text-slate-300">● Lumped Parameter (PI)</p>
        <p className="text-xs text-slate-500">○ Distributed Parameter</p>
      </Group>
    </DigsPanel>
  )
}

function S4({ d }: { d: Section4 }) {
  return (
    <DigsPanel title="4. Line / ElmLne — Load Flow" activeTab="Load Flow" tabs={TABS_ELM_LNE}>
      <Group title="Definition of Line Load" className="w-full sm:w-80">
        <Field label="Number of Customers" value={d.customers} />
        <Field label="Max. Load" value={d.max_load_kva} unit="kVA" />
        <Field label="Average Load" value={d.average_load_kva} unit="kVA" />
        <Field label="Power Factor" value={d.power_factor} />
      </Group>
      <Group title="Thermal Loading Limit" className="w-full sm:w-80">
        <Field label="Max. Loading" value={d.max_loading_pct} unit="%" />
      </Group>
      <div className="mt-1 p-2 bg-amber-950/40 border border-amber-800/50 rounded text-xs text-amber-300">
        No llenar Line Loads / Customers si ya tienes cargas en nodos específicos. Déjalo en 0 para no duplicar demanda.
      </div>
    </DigsPanel>
  )
}

// ── Botones de acción ────────────────────────────────────────────────────────

function CopyAllButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}>
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copiado' : 'Copiar texto'}
    </Button>
  )
}

function DownloadButton({
  calculationId,
  resultHtml,
  plan,
  initialDownloadCount,
}: {
  calculationId?: number
  resultHtml?: string | null
  plan?: string
  initialDownloadCount?: number
}) {
  const [downloading, setDownloading] = useState(false)
  const [downloadCount, setDownloadCount] = useState(initialDownloadCount ?? 0)
  const [error, setError] = useState('')

  if (!plan || plan === 'free' || !resultHtml) return null

  const isBasico = plan === 'basico'
  const remaining = isBasico ? Math.max(0, 5 - downloadCount) : null
  const atLimit = isBasico && downloadCount >= 5

  const handleDownload = async () => {
    setError('')
    setDownloading(true)
    try {
      if (calculationId && isBasico) {
        const res = await api.calculations.download(calculationId)
        setDownloadCount(res.download_count)
      }
      const win = window.open('', '_blank', 'width=900,height=700')
      if (!win) return
      win.document.write(resultHtml)
      win.document.close()
      setTimeout(() => { win.print() }, 600)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al descargar')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 text-xs h-8"
        onClick={handleDownload}
        disabled={downloading || atLimit}
        title={atLimit ? 'Límite de descargas alcanzado para este cálculo' : undefined}
      >
        <FileDown className="h-3.5 w-3.5" />
        {downloading ? 'Abriendo...' : 'Descargar PDF'}
      </Button>
      {isBasico && (
        <span className="text-[10px] text-muted-foreground">
          {atLimit ? 'Sin descargas disponibles' : `${remaining} descarga${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''}`}
        </span>
      )}
      {error && <span className="text-[10px] text-destructive">{error}</span>}
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────

export function TemplateDisplay({
  resultData,
  resultText,
  resultHtml,
  calculationId,
  plan,
  downloadCount,
  className,
}: TemplateDisplayProps) {
  if (!resultData) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Plantilla generada</h3>
          {resultText && <CopyAllButton text={resultText} />}
        </div>
        <pre className="p-4 text-xs text-foreground/90 font-mono whitespace-pre-wrap leading-relaxed bg-surface border border-border rounded-lg overflow-x-auto">
          {resultText ?? ''}
        </pre>
      </div>
    )
  }

  const d = resultData as unknown as ResultData
  const { section1_line_type_basic: s1, section2_line_type_load_flow: s2,
          section3_elm_lne_basic: s3, section4_elm_lne_load_flow: s4 } = d

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h3 className="text-sm font-semibold text-foreground">Plantilla DIgSILENT</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {resultText && <CopyAllButton text={resultText} />}
          <DownloadButton
            calculationId={calculationId}
            resultHtml={resultHtml}
            plan={plan}
            initialDownloadCount={downloadCount}
          />
        </div>
      </div>

      <p className="text-[11px] text-slate-500 mb-3">
        Toca cualquier valor para copiarlo al portapapeles.
      </p>

      {s1 && <S1 d={s1} />}
      {s2 && <S2 d={s2} />}
      {s3 && <S3 d={s3} />}
      {s4 && <S4 d={s4} />}
    </div>
  )
}
