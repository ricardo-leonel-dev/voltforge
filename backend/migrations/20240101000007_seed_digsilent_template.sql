-- ============================================================
-- Migración 7: HTML template con placeholders para DIgSILENT
-- ============================================================
UPDATE template_programs SET html_template = $TMPL$<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Plantilla DIgSILENT — {{name}}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;background:#fff;color:#1e293b;padding:18px;font-size:11px}
.sec-title{color:#0369a1;font-size:12px;font-weight:700;margin:18px 0 6px;text-transform:uppercase;letter-spacing:.05em}
.sec-title:first-child{margin-top:0}
.panel{display:flex;border:1px solid #94a3b8;border-radius:4px;overflow:hidden;margin-bottom:14px;page-break-inside:avoid}
.sidebar{width:140px;flex-shrink:0;border-right:1px solid #94a3b8;font-size:9.5px}
.tab{padding:3px 7px;border-bottom:1px solid #e2e8f0;color:#64748b}
.tab.active{background:#0369a1;color:#fff;font-weight:700}
.area{flex:1;padding:12px;min-width:0}
.row{display:flex;align-items:center;gap:7px;margin-bottom:5px;flex-wrap:wrap}
.lbl{font-size:10px;color:#475569;flex-shrink:0}
.lbl.acc{color:#dc2626;font-weight:700}
.val{border:1px solid #94a3b8;background:#fff;border-radius:2px;padding:1px 5px;font-family:Consolas,monospace;font-size:10px;min-width:65px;color:#0f172a;display:inline-block}
.val.w{min-width:200px}
.unit{font-size:10px;color:#64748b;flex-shrink:0}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:7px}
.grp{border:1px solid #94a3b8;border-radius:3px;padding:9px 9px 7px;margin-top:7px;position:relative}
.grp-t{position:absolute;top:-7px;left:7px;background:#fff;padding:0 4px;font-size:9px;font-weight:700;color:#475569;white-space:nowrap}
.grp.n{max-width:300px}
.lm{font-size:10px;padding:1px 0}
.alert{background:#fffbeb;border:1px solid #fcd34d;padding:7px;border-radius:3px;font-size:10px;color:#92400e;margin-top:7px}
@page{margin:12mm;size:A4}
</style>
</head>
<body>

<div class="sec-title">1. Line Type — Basic Data</div>
<div class="panel">
  <div class="sidebar">
    <div class="tab active">Basic Data</div><div class="tab">Load Flow</div>
    <div class="tab">VDE/IEC Short-Circuit</div><div class="tab">Complete Short-Circuit</div>
    <div class="tab">ANSI Short-Circuit</div><div class="tab">IEC 61363</div>
    <div class="tab">DC Short-Circuit</div><div class="tab">RMS-Simulation</div>
    <div class="tab">EMT-Simulation</div><div class="tab">Harmonics/Power Quality</div>
    <div class="tab">Protection</div><div class="tab">Reliability</div>
    <div class="tab">Cable Sizing</div><div class="tab">Description</div>
  </div>
  <div class="area">
    <div class="row"><span class="lbl">Name</span><span class="val w">{{name}}</span></div>
    <div class="row"><span class="lbl">Rated Voltage</span><span class="val">{{rated_voltage_kv}}</span><span class="unit">kV</span></div>
    <div class="row">
      <span class="lbl">Rated Current</span><span class="val">{{i_ground_ka}}</span><span class="unit">kA (in ground)</span>
      <span class="lbl">Rated Current (in air)</span><span class="val">{{i_air_ka}}</span><span class="unit">kA</span>
    </div>
    <div class="row"><span class="lbl">Nominal Frequency</span><span class="val">{{nominal_freq}}</span><span class="unit">Hz</span></div>
    <div class="row"><span class="lbl">Cable / OHL</span><span class="val">{{cable_ohl}}</span></div>
    <div class="row">
      <span class="lbl">System Type</span><span class="val">{{system_type}}</span>
      <span class="lbl">Phases</span><span class="val">{{phases}}</span>
      <span class="lbl">Number of Neutrals</span><span class="val">{{neutrals}}</span>
    </div>
    <div class="g2">
      <div class="grp"><span class="grp-t">Parameters per Length 1,2-Sequence</span>
        <div class="row"><span class="lbl">AC-Resistance R'(20°C)</span><span class="val">{{r_ohm_km}}</span><span class="unit">Ohm/km</span></div>
        <div class="row"><span class="lbl">Reactance X'</span><span class="val">{{x_ohm_km}}</span><span class="unit">Ohm/km</span></div>
      </div>
      <div class="grp"><span class="grp-t">Parameters per Length Zero Sequence</span>
        <div class="row"><span class="lbl">AC-Resistance R0'</span><span class="val">{{r0_ohm_km}}</span><span class="unit">Ohm/km</span></div>
        <div class="row"><span class="lbl">Reactance X0'</span><span class="val">{{x0_ohm_km}}</span><span class="unit">Ohm/km</span></div>
      </div>
    </div>
    {{neutro_basic_block}}
  </div>
</div>

<div class="sec-title">2. Line Type — Load Flow</div>
<div class="panel">
  <div class="sidebar">
    <div class="tab">Basic Data</div><div class="tab active">Load Flow</div>
    <div class="tab">VDE/IEC Short-Circuit</div><div class="tab">Complete Short-Circuit</div>
    <div class="tab">ANSI Short-Circuit</div><div class="tab">IEC 61363</div>
    <div class="tab">DC Short-Circuit</div><div class="tab">RMS-Simulation</div>
    <div class="tab">EMT-Simulation</div><div class="tab">Harmonics/Power Quality</div>
    <div class="tab">Protection</div><div class="tab">Reliability</div>
    <div class="tab">Cable Sizing</div><div class="tab">Description</div>
  </div>
  <div class="area">
    <div class="grp n"><span class="grp-t">Parameters per Length 1,2-Sequence</span>
      <div class="row"><span class="lbl">Max. Operational Temperature</span><span class="val">{{max_temp}}</span><span class="unit">°C</span></div>
      <div class="row"><span class="lbl">AC-Resistance R'(20°C)</span><span class="val">{{r_ohm_km}}</span><span class="unit">Ohm/km</span></div>
      <div class="row"><span class="lbl">Conductor Material</span><span class="val">{{material}}</span></div>
    </div>
    <div class="g2">
      <div class="grp"><span class="grp-t">Parameters per Length 1,2-Sequence</span>
        <div class="row"><span class="lbl">Susceptance B'</span><span class="val">{{b_us_km}}</span><span class="unit">uS/km</span></div>
        <div class="row"><span class="lbl">Ins. Factor</span><span class="val">0</span></div>
      </div>
      <div class="grp"><span class="grp-t">Parameters per Length Zero Sequence</span>
        <div class="row"><span class="lbl">Susceptance B0'</span><span class="val">{{b0_us_km}}</span><span class="unit">uS/km</span></div>
        <div class="row"><span class="lbl">Ins. Factor</span><span class="val">0</span></div>
      </div>
    </div>
    {{neutro_lf_block}}
  </div>
</div>

<div class="sec-title">3. Line / ElmLne — Basic Data</div>
<div class="panel">
  <div class="sidebar">
    <div class="tab active">Basic Data</div><div class="tab">Load Flow</div>
    <div class="tab">VDE/IEC Short-Circuit</div><div class="tab">Complete Short-Circuit</div>
    <div class="tab">ANSI Short-Circuit</div><div class="tab">IEC 61363</div>
    <div class="tab">DC Short-Circuit</div><div class="tab">RMS-Simulation</div>
    <div class="tab">EMT-Simulation</div><div class="tab">Harmonics/Power Quality</div>
    <div class="tab">Optimal Power Flow</div><div class="tab">Reliability</div>
    <div class="tab">Generation Adequacy</div><div class="tab">Tie Open Point Opt.</div>
    <div class="tab">Cable Sizing</div><div class="tab">Description</div>
  </div>
  <div class="area">
    <div class="row"><span class="lbl">Name</span><span class="val w">{{line_name}}</span></div>
    <div class="row"><span class="lbl">Type</span><span class="val w">{{name}}</span></div>
    <div class="row"><span class="lbl">Terminal i</span><span class="val w">{{terminal_i}}</span></div>
    <div class="row"><span class="lbl">Terminal j</span><span class="val w">{{terminal_j}}</span></div>
    <div class="row"><span class="lbl">Zone</span><span class="val">Terminal i</span></div>
    <div class="row"><span class="lbl">Area</span><span class="val">Terminal i</span></div>
    <div class="row"><span class="lbl">Out of Service</span><span class="val">NO marcar</span></div>
    <div class="grp n"><span class="grp-t">Number of</span>
      <div class="row"><span class="lbl">parallel Lines</span><span class="val">1</span></div>
    </div>
    <div class="grp n"><span class="grp-t">Parameters</span>
      <div class="row"><span class="lbl">Thermal Rating</span><span class="val">Vacío</span></div>
      <div class="row"><span class="lbl">Length of Line</span><span class="val">{{length_km}}</span><span class="unit">km</span></div>
      <div class="row"><span class="lbl">Derating Factor</span><span class="val">1</span></div>
    </div>
    <div class="row"><span class="lbl acc">Type of Line</span><span class="val w">{{type_of_line}}</span></div>
    <div class="grp n"><span class="grp-t">Line Model</span>
      <div class="lm">● Lumped Parameter (PI)</div>
      <div class="lm" style="color:#94a3b8">○ Distributed Parameter</div>
    </div>
  </div>
</div>

<div class="sec-title">4. Line / ElmLne — Load Flow</div>
<div class="panel">
  <div class="sidebar">
    <div class="tab">Basic Data</div><div class="tab active">Load Flow</div>
    <div class="tab">VDE/IEC Short-Circuit</div><div class="tab">Complete Short-Circuit</div>
    <div class="tab">ANSI Short-Circuit</div><div class="tab">IEC 61363</div>
    <div class="tab">DC Short-Circuit</div><div class="tab">RMS-Simulation</div>
    <div class="tab">EMT-Simulation</div><div class="tab">Harmonics/Power Quality</div>
    <div class="tab">Optimal Power Flow</div><div class="tab">Reliability</div>
    <div class="tab">Generation Adequacy</div><div class="tab">Tie Open Point Opt.</div>
    <div class="tab">Cable Sizing</div><div class="tab">Description</div>
  </div>
  <div class="area">
    <div class="grp n"><span class="grp-t">Definition of Line Load</span>
      <div class="row"><span class="lbl">Number of Customers</span><span class="val">0</span></div>
      <div class="row"><span class="lbl">Max. Load</span><span class="val">0</span><span class="unit">kVA</span></div>
      <div class="row"><span class="lbl">Average Load</span><span class="val">0</span><span class="unit">kVA</span></div>
      <div class="row"><span class="lbl">Power Factor</span><span class="val">1</span></div>
    </div>
    <div class="grp n"><span class="grp-t">Thermal Loading Limit</span>
      <div class="row"><span class="lbl">Max. Loading</span><span class="val">100</span><span class="unit">%</span></div>
    </div>
    <div class="alert">No llenar Line Loads / Customers si ya tienes cargas en nodos específicos. Déjalo en 0 para no duplicar demanda.</div>
  </div>
</div>

</body>
</html>$TMPL$
WHERE code = 'digsilent';
