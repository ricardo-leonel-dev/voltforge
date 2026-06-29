use serde_json::json;
use crate::models::{calculation::CalcInput, conductor::ConductorType};
use super::{TemplateGenerator, TemplateOutput};

pub struct DigsilentGenerator;

impl TemplateGenerator for DigsilentGenerator {
    fn program_code(&self) -> &str {
        "digsilent"
    }

    fn generate(&self, input: &CalcInput, c: &ConductorType, html_template: &str) -> TemplateOutput {
        let r0 = c.r_ohm_km * 3.0;
        let x0 = c.x_ohm_km * 3.0;
        let lkm = input.distancia_m / 1000.0;

        let fases: i32 = match input.fase_conexion.as_str() {
            "ABC" => 3,
            "AB" | "AC" | "BC" => 2,
            _ => 1,
        };

        let neutros: i32 = match input.configuracion.as_str() {
            "3F4C" | "2F3C" | "1F2C" => 1,
            _ => 0,
        };

        let tipo_nombre = format!("{} - {} - {}", input.subtipo, input.conductor_code, input.fase_conexion);
        let line_name = format!("Line - {} - {}", input.conductor_code, input.fase_conexion);
        let line_model = match c.line_type.as_str() {
            "OHL" => "Overhead Line",
            _ => "Cable",
        };

        // Parámetros de neutro condicionales
        let neutro_basic = if neutros == 1 {
            json!({
                "rn_ohm_km": c.rn_ohm_km,
                "xn_ohm_km": c.xn_ohm_km,
                "rpn_ohm_km": c.rpn_ohm_km,
                "xpn_ohm_km": c.xpn_ohm_km,
            })
        } else {
            json!(null)
        };

        let neutro_load_flow = if neutros == 1 {
            json!({
                "bn_us_km": c.bn_us_km,
                "bpn_us_km": c.bpn_us_km,
            })
        } else {
            json!(null)
        };

        let data = json!({
            "section1_line_type_basic": {
                "name": tipo_nombre,
                "rated_voltage_kv": input.voltaje_kv,
                "i_ground_ka": c.i_ground_ka,
                "i_air_ka": c.i_air_ka,
                "nominal_frequency_hz": 60,
                "cable_ohl": c.line_type,
                "system_type": "AC",
                "phases": fases,
                "neutrals": neutros,
                "r_ohm_km": c.r_ohm_km,
                "x_ohm_km": c.x_ohm_km,
                "r0_ohm_km": r0,
                "x0_ohm_km": x0,
                "neutral_params": neutro_basic,
            },
            "section2_line_type_load_flow": {
                "max_temperature_degc": 80,
                "r_ohm_km": c.r_ohm_km,
                "material": c.material,
                "b_us_km": c.b_us_km,
                "b0_us_km": c.b0_us_km,
                "ins_factor": 0,
                "neutral_params": neutro_load_flow,
            },
            "section3_elm_lne_basic": {
                "name": line_name,
                "type": tipo_nombre,
                "parallel_lines": 1,
                "length_km": lkm,
                "derating_factor": 1,
                "type_of_line": line_model,
                "line_model": "Lumped Parameter (PI)",
            },
            "section4_elm_lne_load_flow": {
                "customers": 0,
                "max_load_kva": 0,
                "average_load_kva": 0,
                "power_factor": 1,
                "max_loading_pct": 100,
            },
            "derived": {
                "r0_ohm_km": r0,
                "x0_ohm_km": x0,
                "r_total_ohm": c.r_ohm_km * lkm,
                "x_total_ohm": c.x_ohm_km * lkm,
                "r0_total_ohm": r0 * lkm,
                "x0_total_ohm": x0 * lkm,
                "length_km": lkm,
                "phases": fases,
                "neutrals": neutros,
            }
        });

        let neutro_text = if neutros == 1 {
            format!(
                "Rn': {:.4} Ohm/km\nXn': {:.4} Ohm/km\nRpn': {:.4} Ohm/km\nXpn': {:.4} Ohm/km",
                c.rn_ohm_km, c.xn_ohm_km, c.rpn_ohm_km, c.xpn_ohm_km
            )
        } else {
            "Sin conductor neutro adicional.".to_string()
        };

        let neutro_lf_text = if neutros == 1 {
            format!(
                "Bn': {:.4} uS/km\nBpn': {:.4} uS/km",
                c.bn_us_km, c.bpn_us_km
            )
        } else {
            "Sin parámetros adicionales de neutro en Load Flow.".to_string()
        };

        let text = format!(
r#"RESUMEN FINAL PARA COPIAR EN DIgSILENT
Cálculo: {calc_nombre}
{calc_desc}
1) LINE TYPE - BASIC DATA
Name: {tipo_nombre}
Rated Voltage: {voltaje:.3} kV
Rated Current in ground: {i_ground:.3} kA
Rated Current in air: {i_air:.3} kA
Nominal Frequency: 60 Hz
Cable / OHL: {cable_ohl}
System Type: AC
Phases: {fases}
Number of Neutrals: {neutros}

R'(20°C): {r:.4} Ohm/km
X': {x:.4} Ohm/km
R0': {r0:.4} Ohm/km
X0': {x0:.4} Ohm/km

{neutro_text}

2) LINE TYPE - LOAD FLOW
Max. Operational Temperature: 80 °C
AC-Resistance R'(20°C): {r:.4} Ohm/km
Conductor Material: {material}
B': {b:.4} uS/km
B0': {b0:.4} uS/km
Ins. Factor: 0

{neutro_lf_text}

3) LINE / ELM LNE - BASIC DATA
Name: {line_name}
Type: {tipo_nombre}
Out of Service: NO marcar
Number of parallel Lines: 1
Length of Line: {lkm:.4} km
Derating Factor: 1
Thermal Rating: dejar vacío
Type of Line: {line_model}
Line Model: Marcar Lumped Parameter (PI)
Distributed Parameter: NO marcar

4) LINE / ELM LNE - LOAD FLOW
Number of Customers: 0
Max. Load: 0 kVA
Average Load: 0 kVA
Power Factor: 1
Max. Loading: 100 %

BOTÓN LINE LOADS / CUSTOMERS
No llenar. No crear objetos ahí.
Déjalo vacío si ya tienes usuarios conectados como cargas en nodos.

DATOS DESDE ARCGIS
SUBTIPO: {subtipo}
Fase Conexion: {fase}
VOLTAJE: {voltaje} kV
Codigo Conductor Fase: {conductor}
Configuracion Conductores: {config}
Circuito: {circuito}
Tipo Uso Tramo: {uso}
Circuitos: {circuitos}
Distancia: {distancia} m

VERIFICACIÓN POR DISTANCIA
Distancia equivalente: {lkm:.4} km
R total: {r_total:.4} Ohm
X total: {x_total:.4} Ohm
R0 total: {r0_total:.4} Ohm
X0 total: {x0_total:.4} Ohm

FUENTES / CRITERIO DE DATOS
- Resistencias R' de TTU Cu: tomadas de tablas técnicas de TTU Cu 2000 V para calibre AWG.
- Reactancias X': valores prácticos aproximados para cables BT cortos; validar con ficha exacta del fabricante/CENTROSUR si tu tesis exige trazabilidad completa.
- B', B0', Bn' y Bpn': 0 uS/km para tramos BT cortos en flujo de carga, como simplificación usual.
- Corrientes Iground/Iair: valores referenciales para selección preliminar; validar con ampacidad de fabricante según instalación."#,
            calc_nombre = input.nombre,
            calc_desc = input.descripcion.as_deref().map(|d| format!("Descripción: {}\n", d)).unwrap_or_default(),
            tipo_nombre = tipo_nombre,
            voltaje = input.voltaje_kv,
            i_ground = c.i_ground_ka,
            i_air = c.i_air_ka,
            cable_ohl = c.line_type,
            fases = fases,
            neutros = neutros,
            r = c.r_ohm_km,
            x = c.x_ohm_km,
            r0 = r0,
            x0 = x0,
            neutro_text = neutro_text,
            material = c.material,
            b = c.b_us_km,
            b0 = c.b0_us_km,
            neutro_lf_text = neutro_lf_text,
            line_name = line_name,
            lkm = lkm,
            line_model = line_model,
            subtipo = input.subtipo,
            fase = input.fase_conexion,
            conductor = input.conductor_code,
            config = input.configuracion,
            circuito = input.circuito,
            uso = input.tipo_uso,
            circuitos = input.circuitos,
            distancia = input.distancia_m,
            r_total = c.r_ohm_km * lkm,
            x_total = c.x_ohm_km * lkm,
            r0_total = r0 * lkm,
            x0_total = x0 * lkm,
        );

        let html = fill_html_template(html_template, &tipo_nombre, &line_name, c, fases, neutros, r0, x0, lkm, line_model, input.voltaje_kv);

        TemplateOutput { data, text, html }
    }
}

fn fill_html_template(
    template: &str,
    nombre: &str,
    line_name: &str,
    c: &ConductorType,
    fases: i32,
    neutros: i32,
    r0: f64,
    x0: f64,
    lkm: f64,
    line_model: &str,
    voltaje_kv: f64,
) -> String {
    let neutro_basic_block = if neutros == 1 {
        format!(
            r#"<div class="g2">
  <div class="grp"><span class="grp-t">Parameters per Length, Neutral</span>
    <div class="row"><span class="lbl">AC-Resistance Rn'</span><span class="val">{rn:.4}</span><span class="unit">Ohm/km</span></div>
    <div class="row"><span class="lbl">Reactance Xn'</span><span class="val">{xn:.4}</span><span class="unit">Ohm/km</span></div>
  </div>
  <div class="grp"><span class="grp-t">Parameters per Length, Phase-Neutral Coupling</span>
    <div class="row"><span class="lbl">AC-Resistance Rpn'</span><span class="val">{rpn:.4}</span><span class="unit">Ohm/km</span></div>
    <div class="row"><span class="lbl">Reactance Xpn'</span><span class="val">{xpn:.4}</span><span class="unit">Ohm/km</span></div>
  </div>
</div>"#,
            rn = c.rn_ohm_km, xn = c.xn_ohm_km, rpn = c.rpn_ohm_km, xpn = c.xpn_ohm_km
        )
    } else {
        String::new()
    };

    let neutro_lf_block = if neutros == 1 {
        format!(
            r#"<div class="g2">
  <div class="grp"><span class="grp-t">Parameters per Length, Neutral</span>
    <div class="row"><span class="lbl">Susceptance Bn'</span><span class="val">{bn:.4}</span><span class="unit">uS/km</span></div>
  </div>
  <div class="grp"><span class="grp-t">Parameters per Length, Phase-Neutral Coupling</span>
    <div class="row"><span class="lbl">Susceptance Bpn'</span><span class="val">{bpn:.4}</span><span class="unit">uS/km</span></div>
  </div>
</div>"#,
            bn = c.bn_us_km, bpn = c.bpn_us_km
        )
    } else {
        String::new()
    };

    template
        .replace("{{name}}", nombre)
        .replace("{{rated_voltage_kv}}", &format!("{:.3}", voltaje_kv))
        .replace("{{i_ground_ka}}", &format!("{:.3}", c.i_ground_ka))
        .replace("{{i_air_ka}}", &format!("{:.3}", c.i_air_ka))
        .replace("{{nominal_freq}}", "60")
        .replace("{{cable_ohl}}", &c.line_type)
        .replace("{{system_type}}", "AC")
        .replace("{{phases}}", &fases.to_string())
        .replace("{{neutrals}}", &neutros.to_string())
        .replace("{{r_ohm_km}}", &format!("{:.4}", c.r_ohm_km))
        .replace("{{x_ohm_km}}", &format!("{:.4}", c.x_ohm_km))
        .replace("{{r0_ohm_km}}", &format!("{:.4}", r0))
        .replace("{{x0_ohm_km}}", &format!("{:.4}", x0))
        .replace("{{neutro_basic_block}}", &neutro_basic_block)
        .replace("{{max_temp}}", "80")
        .replace("{{material}}", &c.material)
        .replace("{{b_us_km}}", &format!("{:.4}", c.b_us_km))
        .replace("{{b0_us_km}}", &format!("{:.4}", c.b0_us_km))
        .replace("{{neutro_lf_block}}", &neutro_lf_block)
        .replace("{{line_name}}", line_name)
        .replace("{{length_km}}", &format!("{:.4}", lkm))
        .replace("{{type_of_line}}", line_model)
}
