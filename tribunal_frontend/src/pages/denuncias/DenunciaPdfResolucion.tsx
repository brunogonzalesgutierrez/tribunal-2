// src/pages/denuncias/DenunciaPdfResolucion.tsx
// ============================================================
// Genera la Resolución Final (Art. 75) con el formato oficial
// del Tribunal de Justicia Universitaria — Primera Instancia.
// Encabezado: Logo UAGRM izquierda + Logo Tribunal derecha.
// Se imprime desde el navegador → firma física de los vocales.
// ============================================================
import { FileText } from "lucide-react";

const BACKEND = "http://localhost:8000";

// ── Cache de logos ────────────────────────────────────────────────────────────
const _logoCache: Record<string, string> = {};
async function obtenerLogoBase64(nombre: "uagrm" | "tribunal"): Promise<string> {
  if (_logoCache[nombre]) return _logoCache[nombre];
  try {
    const resp = await fetch(`${BACKEND}/api/logo/${nombre}/`);
    const json = await resp.json();
    if (json.ok) { _logoCache[nombre] = json.dataUrl; return json.dataUrl; }
  } catch { /* continuar sin logo */ }
  return "";
}

// ── Helpers de fecha ──────────────────────────────────────────────────────────
const MESES_ES = [
  "enero","febrero","marzo","abril","mayo","junio",
  "julio","agosto","septiembre","octubre","noviembre","diciembre",
];

function parseFecha(iso?: string): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function fmtFecha(iso?: string): string {
  const d = parseFecha(iso);
  if (!d) return "—";
  return `${d.getDate()} de ${MESES_ES[d.getMonth()]} de ${d.getFullYear()}`;
}
function fmtFechaCorta(iso?: string): string {
  const d = parseFecha(iso);
  if (!d) return "—";
  return d.toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Persona {
  nombre: string;
  primerApellido: string;
  segundoApellido?: string;
  numeroDocumento?: string;
}

interface Conformacion {
  idConformacion: number;
  rolEnCaso: string;
  idVocal: {
    cargo: string;
    idPersona: { nombre: string; primerApellido: string };
    idSala?: { nombreSala: string };
  };
}

export interface DenunciaResolucion {
  numeroDenuncia: string;
  fechaDenuncia?: string;
  fechaHecho?: string;
  descripcion: string;
  estado: string;
  tipoDenunciado?: string;
  denunciante?: Persona;
  denunciado?: Persona;
  resolucion?: string;
  tipoResolucion?: string;
  fechaResolucion?: string;
  tipoSancion?: string;
  detalleSancion?: string;
  aclaracionEnmienda?: string;
  fechaSolicitudAclaracion?: string;
  fechaNotificacionResolucion?: string;
  expediente?: {
    idExpediente: number;
    numeroExpediente: string;
    conformaciones?: Conformacion[];
  };
}

const SANCION_LABEL: Record<string, string> = {
  MULTA:                 "Multa de hasta el veinte por ciento (20%) del haber mensual",
  SUSPENSION_TEMPORAL:   "Suspensión temporal de sus funciones (de uno a doce meses sin goce de haberes)",
  REMOCION:              "Remoción del cargo",
  RETIRO:                "Retiro de la Universidad",
  AMONESTACION:          "Amonestación por escrito",
  SUSPENSION_ESTUDIANTE: "Suspensión temporal de la condición de estudiante (de seis meses a tres años)",
  EXPULSION:             "Expulsión de la Universidad",
};

// ── Constructor de HTML ───────────────────────────────────────────────────────
function buildHtml(d: DenunciaResolucion, logoUagrm: string, logoTribunal: string): string {
  const conformaciones = d.expediente?.conformaciones ?? [];
  const esAbsolutoria  = d.tipoResolucion === "ABSOLUTORIA";

  const denuncianteNombre = d.denunciante
    ? `${d.denunciante.nombre} ${d.denunciante.primerApellido}`.trim() : "—";
  const denunciadoNombre  = d.denunciado
    ? `${d.denunciado.nombre} ${d.denunciado.primerApellido}`.trim() : "—";

  const sancionLabel = d.tipoSancion ? (SANCION_LABEL[d.tipoSancion] ?? d.tipoSancion) : null;
  const numRes = `${d.expediente?.numeroExpediente ?? d.numeroDenuncia} / ${d.fechaResolucion?.slice(0, 4) ?? new Date().getFullYear()}`;

  const presidente = conformaciones.find(c =>
    c.rolEnCaso.toLowerCase().includes("presid")
  ) ?? conformaciones[0];
  const secretario = conformaciones.find(c =>
    c.rolEnCaso.toLowerCase().includes("secretar")
  ) ?? conformaciones[conformaciones.length - 1];

  const imgUagrm    = logoUagrm    ? `<img src="${logoUagrm}"    alt="Escudo UAGRM"    style="width:2.8cm;height:2.8cm;object-fit:contain;">` : "<div style='width:2.8cm'></div>";
  const imgTribunal = logoTribunal ? `<img src="${logoTribunal}" alt="Escudo Tribunal" style="width:2.8cm;height:2.8cm;object-fit:contain;">` : "<div style='width:2.8cm'></div>";

  const resolucionParrafos = (d.resolucion ?? "")
    .split("\n").map(p => p.trim()).filter(Boolean)
    .map(p => `<p>${p}</p>`).join("\n");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Resolución Final N° ${numRes}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Arial,Helvetica,sans-serif; font-size:11pt; color:#111; background:#fff; }
  .pagina { width:21.5cm; min-height:27.9cm; margin:0 auto; padding:1.8cm 2.2cm 2.5cm; position:relative; }

  /* ── Encabezado con logos ── */
  .encabezado { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.3cm; }
  .enc-texto { text-align:center; flex:1; padding:0 0.5cm; line-height:1.45; }
  .enc-texto p { font-size:11pt; font-weight:bold; text-transform:uppercase; }
  .enc-texto p.sub { font-weight:normal; font-size:10pt; }
  .separador { border:none; border-top:2px solid #111; margin:0.3cm 0 0.5cm; }

  /* ── Número de resolución ── */
  .num-res { text-align:center; margin:0 0 0.4cm; }
  .num-res .label { font-size:10pt; font-weight:bold; text-transform:uppercase; letter-spacing:0.04em; color:#333; }
  .num-res .numero { font-size:24pt; font-weight:bold; letter-spacing:2px; color:#111; line-height:1.1; }

  /* ── Secciones ── */
  .sec-titulo { font-size:11pt; font-weight:bold; margin:0.5cm 0 0.12cm; text-transform:uppercase; }
  .sec-cuerpo { font-size:10.5pt; line-height:1.75; text-align:justify; }
  .sec-cuerpo p { margin-bottom:0.3cm; text-indent:1.5em; }
  .sec-cuerpo p:first-child { text-indent:0; }

  /* ── Sanción ── */
  .sancion { border-left:4px solid #c0392b; background:#fdf2f2; padding:0.2cm 0.4cm; margin:0.3cm 0; font-size:10.5pt; line-height:1.6; }
  .san-label { font-weight:bold; color:#c0392b; font-size:9pt; text-transform:uppercase; margin-bottom:4px; }

  /* ── Por tanto / Resuelve ── */
  .por-tanto { font-size:10.5pt; font-style:italic; font-weight:bold; text-align:center; margin:0.4cm 0 0.2cm; }
  .resuelve { font-size:11pt; font-weight:bold; text-transform:uppercase; letter-spacing:0.15em; margin:0.2cm 0; }
  .articulos { margin:0.2cm 0; }
  .art { margin-bottom:0.3cm; font-size:10.5pt; line-height:1.7; text-align:justify; }
  .art .art-num { font-weight:bold; }

  /* ── Aclaración ── */
  .aclaracion { border-left:3px solid #7c3aed; background:#f9f5ff; padding:0.2cm 0.4cm; margin:0.3cm 0; font-size:10pt; font-style:italic; line-height:1.6; }

  /* ── Registrese ── */
  .registrese { font-weight:bold; font-size:11pt; text-align:center; text-transform:uppercase; margin:0.35cm 0; }
  .cierre { margin-top:0.4cm; font-size:10.5pt; line-height:1.7; }

  /* ── Firmas ── */
  .firmas { display:flex; justify-content:space-around; margin-top:1.5cm; gap:1cm; page-break-inside:avoid; }
  .firma-bloque { text-align:center; flex:1; }
  .firma-linea { height:1.5cm; border-bottom:1px solid #333; margin:0 auto 0.15cm; width:80%; }
  .firma-nombre { font-size:10pt; font-weight:bold; text-transform:uppercase; line-height:1.3; }
  .firma-cargo { font-size:9pt; font-weight:bold; text-transform:uppercase; color:#333; margin-top:2px; }

  /* ── Pie ── */
  .pie { margin-top:0.5cm; padding-top:0.2cm; border-top:1px solid #888; display:flex; justify-content:space-between; font-size:8pt; color:#555; }

  @media print { body { padding:0; } .pagina { width:100%; } }
</style>
</head>
<body>
<div class="pagina">

  <!-- Encabezado con logos -->
  <div class="encabezado">
    ${imgUagrm}
    <div class="enc-texto">
      <p>UNIVERSIDAD AUTÓNOMA "GABRIEL RENÉ MORENO"</p>
      <p>TRIBUNAL DE JUSTICIA UNIVERSITARIA</p>
      <p class="sub">DE PRIMERA INSTANCIA</p>
    </div>
    ${imgTribunal}
  </div>
  <hr class="separador"/>

  <!-- Número de resolución -->
  <div class="num-res">
    <div class="label">Resolución Final N°</div>
    <div class="numero">${numRes}</div>
  </div>

  <!-- VISTO -->
  <div class="sec-titulo">Visto:</div>
  <div class="sec-cuerpo">
    <p>El expediente N° <strong>${d.expediente?.numeroExpediente ?? "—"}</strong>,
    correspondiente a la denuncia N° <strong>${d.numeroDenuncia}</strong>, presentada
    por <strong>${denuncianteNombre}</strong> en contra de
    <strong>${denunciadoNombre}</strong>${d.denunciado?.numeroDocumento ? ` (C.I. ${d.denunciado.numeroDocumento})` : ""},
    en su condición de ${d.tipoDenunciado ?? "miembro de la comunidad universitaria"}.</p>
    ${d.fechaHecho ? `<p>Que los hechos denunciados habrían ocurrido en fecha <strong>${fmtFecha(d.fechaHecho)}</strong>.</p>` : ""}
    <p>Que la denuncia fue presentada en fecha <strong>${fmtFecha(d.fechaDenuncia)}</strong>,
    tramitándose el presente proceso disciplinario conforme al Reglamento de Justicia
    Universitaria — Resolución I.C.U. N° 048-2018 de fecha 10 de mayo de 2018.</p>
  </div>

  <!-- CONSIDERANDO -->
  <div class="sec-titulo">Considerando:</div>
  <div class="sec-cuerpo">
    <p>Que el Tribunal de Justicia Universitaria de Primera Instancia, una vez tramitado
    el proceso en todas sus etapas conforme a los Arts. 58, 60 y 74 del Reglamento, ha
    procedido a la valoración integral de los medios probatorios aportados durante el
    período probatorio de treinta (30) días hábiles (Art. 60 par. I).</p>
    ${resolucionParrafos || `<p>Que del análisis y valoración de los elementos probatorios, el Tribunal ha formado
    convicción suficiente para pronunciar la presente resolución final motivada,
    de conformidad con el Art. 75 del Reglamento de Justicia Universitaria.</p>`}
  </div>

  <!-- Sanción si es sancionatoria -->
  ${!esAbsolutoria && sancionLabel ? `
  <div class="sancion">
    <div class="san-label">Sanción aplicable — Art. 42 del Reglamento</div>
    <div>${sancionLabel}</div>
    ${d.detalleSancion ? `<div style="font-style:italic;color:#555;margin-top:4px;">${d.detalleSancion}</div>` : ""}
  </div>` : ""}

  <!-- POR TANTO -->
  <div class="por-tanto">
    El Tribunal de Justicia Universitaria de Primera Instancia, en uso de las atribuciones
    conferidas por el Art. 85° del Estatuto Orgánico y el Reglamento de Justicia
    Universitaria (Res. I.C.U. N° 048-2018),
  </div>

  <!-- RESUELVE -->
  <div class="resuelve">R &nbsp; E &nbsp; S &nbsp; U &nbsp; E &nbsp; L &nbsp; V &nbsp; E :</div>

  <div class="articulos">
    <div class="art">
      <span class="art-num">Artículo 1°. —</span>
      ${!esAbsolutoria
        ? `Declarar <strong>PROBADA</strong> la denuncia formulada por <strong>${denuncianteNombre}</strong>
           en contra de <strong>${denunciadoNombre}</strong>, e imponer la sanción de
           <strong>${sancionLabel ?? "la sanción correspondiente conforme al Art. 42"}</strong>
           ${d.detalleSancion ? `(${d.detalleSancion})` : ""},
           de conformidad con los Arts. 42 y 75 del Reglamento de Justicia Universitaria.`
        : `Declarar <strong>IMPROBADA</strong> la denuncia formulada por <strong>${denuncianteNombre}</strong>
           en contra de <strong>${denunciadoNombre}</strong>, y en consecuencia
           <strong>ABSOLVER</strong> al denunciado de todos los cargos formulados en su contra,
           disponiendo el archivo del presente proceso (Art. 75).`
      }
    </div>
    <div class="art">
      <span class="art-num">Artículo 2°. —</span>
      Notificar a las partes con la presente resolución en sus respectivos domicilios
      procesales, dentro del plazo máximo de cinco (5) días hábiles (Art. 46),
      con la advertencia de que contra la misma procede recurso de apelación en el
      plazo perentorio de cinco (5) días hábiles desde la notificación personal (Art. 82 II).
    </div>
    ${!esAbsolutoria ? `
    <div class="art">
      <span class="art-num">Artículo 3°. —</span>
      Ejecutoriada la presente resolución, remítase el expediente ante la autoridad responsable
      para su ejecución en el plazo de tres (3) días hábiles (Art. 16).
    </div>` : ""}
    <div class="art">
      <span class="art-num">Artículo ${!esAbsolutoria ? "4°" : "3°"}. —</span>
      Devuélvanse los obrados al archivo una vez ejecutoriada la presente resolución y
      cumplidos los trámites de ley correspondientes.
    </div>
  </div>

  <!-- Aclaración si existe -->
  ${d.aclaracionEnmienda ? `
  <div class="aclaracion">
    <strong style="color:#7c3aed;font-size:9pt;text-transform:uppercase;">Aclaración / Enmienda (Art. 77):</strong><br/>
    ${d.aclaracionEnmienda}
    ${d.fechaSolicitudAclaracion ? `<br/><span style="font-size:9pt;color:#666;">Fecha: ${fmtFechaCorta(d.fechaSolicitudAclaracion)}</span>` : ""}
  </div>` : ""}

  <!-- Cierre -->
  <div class="cierre">
    <p>Es dada en las oficinas del Tribunal de Justicia Universitaria de Primera Instancia
    de la Universidad Autónoma "Gabriel René Moreno", en la ciudad de Santa Cruz de la
    Sierra, a los ${d.fechaResolucion ? fmtFecha(d.fechaResolucion) : "____ días del mes de ______ del año ______"}.</p>
    <div class="registrese">Regístrese, Notifíquese, Cúmplase y Archívese.</div>
  </div>

  <!-- Firmas vocales -->
  <div class="firmas">
    <div class="firma-bloque">
      <div class="firma-linea"></div>
      <div class="firma-nombre">
        ${secretario
          ? `${secretario.idVocal.idPersona.nombre} ${secretario.idVocal.idPersona.primerApellido}`
          : "________________________________"}
      </div>
      <div class="firma-cargo">${secretario ? secretario.rolEnCaso : "Secretario/a del Tribunal"}</div>
    </div>
    <div class="firma-bloque">
      <div class="firma-linea"></div>
      <div class="firma-nombre">
        ${presidente
          ? `${presidente.idVocal.idPersona.nombre} ${presidente.idVocal.idPersona.primerApellido}`
          : "________________________________"}
      </div>
      <div class="firma-cargo">${presidente ? presidente.rolEnCaso : "Presidente del Tribunal"}</div>
      ${presidente?.idVocal?.cargo ? `<div style="font-size:8.5pt;color:#555;">${presidente.idVocal.cargo}</div>` : ""}
    </div>
  </div>

  <!-- Datos de referencia -->
  <div style="margin-top:0.5cm;font-size:8pt;color:#777;">
    Exp. ${d.expediente?.numeroExpediente ?? "—"} &nbsp;·&nbsp;
    Den. ${d.numeroDenuncia} &nbsp;·&nbsp;
    ${d.fechaResolucion ? `Res. ${fmtFechaCorta(d.fechaResolucion)}` : ""}
    ${d.fechaNotificacionResolucion ? ` · Notif. ${fmtFechaCorta(d.fechaNotificacionResolucion)}` : ""}
  </div>

  <!-- Pie -->
  <div class="pie">
    <span>Tribunal de Justicia Universitaria — U.A.G.R.M. · Primera Instancia</span>
    <span>"Formando con innovación, liderando con valores"</span>
  </div>

</div>
<script>window.onload = function(){ window.print(); }</script>
</body>
</html>`;
}

// ── Función principal exportada ───────────────────────────────────────────────
export async function generarPdfResolucion(denuncia: DenunciaResolucion): Promise<void> {
  const [logoUagrm, logoTribunal] = await Promise.all([
    obtenerLogoBase64("uagrm"),
    obtenerLogoBase64("tribunal"),
  ]);

  const html = buildHtml(denuncia, logoUagrm, logoTribunal);
  const win  = window.open("", "_blank", "width=950,height=800");
  if (!win) {
    alert("El navegador bloqueó la ventana emergente. Permitila e intentá de nuevo.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

// ── Botón React ───────────────────────────────────────────────────────────────
interface BtnProps {
  denuncia: DenunciaResolucion;
  className?: string;
  disabled?: boolean;
}

export function BtnGenerarPdfResolucion({ denuncia, className, disabled }: BtnProps) {
  const puedeGenerar = !!denuncia.resolucion && !!denuncia.fechaResolucion;
  return (
    <button
      onClick={() => generarPdfResolucion(denuncia)}
      disabled={disabled || !puedeGenerar}
      title={!puedeGenerar ? "Disponible una vez emitida la resolución definitiva" : "Generar PDF de la resolución"}
      className={
        className ??
        "flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      }
    >
      <FileText className="w-4 h-4" />
      Generar PDF Resolución
    </button>
  );
}
