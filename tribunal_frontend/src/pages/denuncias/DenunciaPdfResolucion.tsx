// src/pages/denuncias/DenunciaPdfResolucion.tsx
import { FileText } from "lucide-react";

function parseFecha(iso?: string): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function fmtFecha(iso?: string): string {
  const d = parseFecha(iso);
  if (!d) return "—";
  return d.toLocaleDateString("es-BO", { day: "2-digit", month: "long", year: "numeric" });
}

function fmtFechaCorta(iso?: string): string {
  const d = parseFecha(iso);
  if (!d) return "—";
  return d.toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" });
}

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

interface DenunciaResolucion {
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

const TIPOS_SANCION_LABEL: Record<string, string> = {
  MULTA:                "Multa de hasta el veinte por ciento (20%) del haber mensual",
  SUSPENSION_TEMPORAL:  "Suspensión temporal de sus funciones (de uno a doce meses sin goce de haberes)",
  REMOCION:             "Remoción del cargo",
  RETIRO:               "Retiro de la Universidad",
  AMONESTACION:         "Amonestación por escrito",
  SUSPENSION_ESTUDIANTE:"Suspensión temporal de la condición de estudiante (de seis meses a tres años)",
  EXPULSION:            "Expulsión de la Universidad",
};

function buildHtml(d: DenunciaResolucion): string {
  const conformaciones = d.expediente?.conformaciones ?? [];
  const esAbsolutoria = d.tipoResolucion === "ABSOLUTORIA";
  const denuncianteNombre = d.denunciante
    ? `${d.denunciante.nombre} ${d.denunciante.primerApellido}`.trim()
    : "—";
  const denunciadoNombre = d.denunciado
    ? `${d.denunciado.nombre} ${d.denunciado.primerApellido}`.trim()
    : "—";
  const sancionLabel = d.tipoSancion ? (TIPOS_SANCION_LABEL[d.tipoSancion] ?? d.tipoSancion) : null;

  // Número de resolución formateado: EXP-S1-2026-001 → usar numeroDenuncia como referencia
  const anio = d.fechaResolucion?.slice(0, 4) ?? new Date().getFullYear();
  const numResolucion = `${d.expediente?.numeroExpediente ?? d.numeroDenuncia} / ${anio}`;

  // Vocal presidente o primer vocal para la firma principal
  const presidente = conformaciones.find(c =>
    c.rolEnCaso.toLowerCase().includes("president") ||
    c.rolEnCaso.toLowerCase().includes("presid")
  ) ?? conformaciones[0];

  const secretario = conformaciones.find(c =>
    c.rolEnCaso.toLowerCase().includes("secretar")
  ) ?? conformaciones[conformaciones.length - 1];

  // Fecha en letras para el cierre
  const fechaCierre = fmtFecha(d.fechaResolucion);

  const resolucionParrafos = (d.resolucion ?? "")
    .split("\n")
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p>${p}</p>`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Resolución — ${numResolucion}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11pt;
    color: #111;
    background: #fff;
  }

  .page {
    width: 21.6cm;
    min-height: 27.9cm;
    margin: 0 auto;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  /* ── BARRA ROJA LATERAL ── */
  .barra-lateral {
    position: fixed;
    left: 0;
    top: 0;
    width: 12px;
    height: 100%;
    background: #c0392b;
    z-index: 10;
  }

  /* ── CONTENIDO PRINCIPAL (margen izquierdo para la barra) ── */
  .contenido {
    margin-left: 22px;
    padding: 0 2cm 0 0.5cm;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  /* ── ENCABEZADO INSTITUCIONAL ── */
  .header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 1.2cm 0 0.5cm 0;
    border-bottom: 2px solid #c0392b;
    margin-bottom: 0.4cm;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .header-escudo {
    width: 62px;
    height: 62px;
    background: #1a3a6b;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 8pt;
    font-weight: bold;
    text-align: center;
    line-height: 1.2;
    padding: 6px;
    flex-shrink: 0;
  }

  .header-institucion {
    line-height: 1.3;
  }

  .header-institucion .univ-nombre {
    font-size: 9pt;
    color: #333;
  }

  .header-institucion .univ-nombre-bold {
    font-size: 11pt;
    font-weight: bold;
    color: #1a1a1a;
    display: block;
  }

  .header-right {
    text-align: right;
  }

  .header-right .tribunal-label {
    font-size: 22pt;
    font-weight: bold;
    color: #1a1a1a;
    line-height: 1;
    letter-spacing: -0.5px;
  }

  .header-right .tribunal-sub {
    font-size: 8.5pt;
    color: #555;
    margin-top: 2px;
  }

  /* ── NÚMERO DE RESOLUCIÓN ── */
  .num-resolucion {
    text-align: center;
    padding: 0.4cm 0 0.3cm;
    border-bottom: 1px solid #ddd;
    margin-bottom: 0.4cm;
  }

  .num-resolucion .label {
    font-size: 10pt;
    font-weight: bold;
    color: #333;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .num-resolucion .numero {
    font-size: 26pt;
    font-weight: bold;
    color: #1a1a1a;
    letter-spacing: 2px;
    line-height: 1.1;
    font-family: Arial, sans-serif;
  }

  /* ── SECCIONES ── */
  .seccion-titulo {
    font-size: 11pt;
    font-weight: bold;
    margin: 0.5cm 0 0.15cm;
    text-transform: uppercase;
  }

  .seccion-cuerpo {
    font-size: 10.5pt;
    line-height: 1.65;
    text-align: justify;
  }

  .seccion-cuerpo p {
    margin-bottom: 0.3cm;
    text-indent: 1.5em;
  }

  .seccion-cuerpo p:first-child {
    text-indent: 0;
  }

  /* ── POR TANTO ── */
  .por-tanto {
    font-size: 10.5pt;
    font-style: italic;
    font-weight: bold;
    margin: 0.4cm 0 0.2cm;
    text-align: center;
  }

  /* ── RESUELVE ── */
  .resuelve {
    font-size: 11pt;
    font-weight: bold;
    margin: 0.2cm 0;
    text-transform: uppercase;
    letter-spacing: 0.15em;
  }

  /* ── ARTÍCULOS ── */
  .articulos {
    margin: 0.2cm 0;
  }

  .articulo {
    margin-bottom: 0.3cm;
    font-size: 10.5pt;
    line-height: 1.65;
    text-align: justify;
  }

  .articulo .art-num {
    font-weight: bold;
  }

  /* ── SANCIÓN BOX ── */
  .sancion-destacada {
    border-left: 4px solid #c0392b;
    padding: 8px 12px;
    margin: 0.3cm 0;
    background: #fdf2f2;
    font-size: 10.5pt;
    line-height: 1.6;
  }

  .sancion-destacada .san-label {
    font-weight: bold;
    color: #c0392b;
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  /* ── CIERRE ── */
  .cierre {
    margin-top: 0.4cm;
    font-size: 10.5pt;
    line-height: 1.7;
  }

  .cierre .registrese {
    font-weight: bold;
    font-size: 11pt;
    text-align: center;
    margin: 0.3cm 0;
    text-transform: uppercase;
  }

  /* ── FIRMAS ── */
  .firmas {
    display: flex;
    justify-content: space-around;
    margin-top: 1.2cm;
    gap: 1cm;
    page-break-inside: avoid;
  }

  .firma-bloque {
    text-align: center;
    flex: 1;
  }

  .firma-espacio {
    height: 1.5cm;
    border-bottom: 1px solid #333;
    margin: 0 auto 0.2cm;
    width: 80%;
  }

  .firma-nombre {
    font-size: 10pt;
    font-weight: bold;
    text-transform: uppercase;
    line-height: 1.3;
  }

  .firma-cargo {
    font-size: 9pt;
    font-weight: bold;
    text-transform: uppercase;
    color: #333;
    margin-top: 2px;
  }

  /* ── PIE ── */
  .pie {
    margin-top: auto;
    padding-top: 0.5cm;
  }

  .pie-lema {
    text-align: center;
    font-style: italic;
    font-size: 9pt;
    color: #555;
    padding: 0.3cm 0;
    border-top: 1px solid #c0392b;
    border-bottom: 3px solid #c0392b;
    margin-bottom: 0.2cm;
  }

  .pie-datos {
    display: flex;
    justify-content: space-between;
    font-size: 8pt;
    color: #555;
    padding: 0 0.2cm;
  }

  .pie-datos span {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* ── LATERAL INFO (MLAB/Sist) ── */
  .lateral-info {
    position: fixed;
    bottom: 3cm;
    left: 18px;
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    font-size: 7pt;
    color: #888;
    letter-spacing: 0.05em;
  }

  @media print {
    body { padding: 0; }
    .page { width: 100%; min-height: 100vh; }
    .barra-lateral { position: fixed; }
  }
</style>
</head>
<body>

<div class="barra-lateral"></div>

<div class="lateral-info">
  TJU · ${d.expediente?.numeroExpediente ?? d.numeroDenuncia} · ${anio}
</div>

<div class="page">
  <div class="contenido">

    <!-- ── ENCABEZADO ── -->
    <div class="header">
      <div class="header-left">
        <div class="header-escudo">
          UAGRM<br/>⚖
        </div>
        <div class="header-institucion">
          <span class="univ-nombre">Universidad Autónoma</span>
          <span class="univ-nombre-bold">Gabriel René Moreno</span>
          <span style="font-size:8pt;color:#555;display:block;">Santa Cruz — Bolivia</span>
        </div>
      </div>
      <div class="header-right">
        <div class="tribunal-label">TRIBUNAL</div>
        <div class="tribunal-sub">DE JUSTICIA UNIVERSITARIA — PRIMERA INSTANCIA</div>
        ${conformaciones[0]?.idVocal?.idSala?.nombreSala
          ? `<div style="font-size:8pt;color:#888;margin-top:2px;">${conformaciones[0].idVocal.idSala.nombreSala}</div>`
          : ""}
      </div>
    </div>

    <!-- ── NÚMERO DE RESOLUCIÓN ── -->
    <div class="num-resolucion">
      <div class="label">Resolución Final N°</div>
      <div class="numero">${numResolucion}</div>
    </div>

    <!-- ── VISTO ── -->
    <div class="seccion-titulo">Visto:</div>
    <div class="seccion-cuerpo">
      <p>
        El expediente N° <strong>${d.expediente?.numeroExpediente ?? "—"}</strong>,
        correspondiente a la denuncia N° <strong>${d.numeroDenuncia}</strong>, presentada
        por <strong>${denuncianteNombre}</strong> en contra de
        <strong>${denunciadoNombre}</strong>
        ${d.denunciado?.numeroDocumento ? `(C.I. ${d.denunciado.numeroDocumento})` : ""},
        en su condición de ${d.tipoDenunciado ?? "miembro de la comunidad universitaria"}.
      </p>
      ${d.fechaHecho ? `<p>Que los hechos denunciados habrían ocurrido en fecha <strong>${fmtFecha(d.fechaHecho)}</strong>.</p>` : ""}
      <p>
        Que la denuncia fue presentada en fecha <strong>${fmtFecha(d.fechaDenuncia)}</strong>,
        tramitándose el presente proceso disciplinario conforme a las disposiciones del
        Reglamento de Justicia Universitaria, aprobado mediante Resolución I.C.U. N° 048-2018,
        de fecha 10 de mayo de 2018.
      </p>
    </div>

    <!-- ── CONSIDERANDO ── -->
    <div class="seccion-titulo">Considerando:</div>
    <div class="seccion-cuerpo">
      <p>
        Que el Tribunal de Justicia Universitaria de Primera Instancia, una vez tramitado
        el proceso en todas sus etapas, conforme a los Arts. 58, 60 y 74 del Reglamento de
        Justicia Universitaria, ha procedido a la valoración integral de los medios probatorios
        aportados por las partes durante el período probatorio de treinta (30) días hábiles
        (Art. 60 par. I), así como los antecedentes del proceso.
      </p>
      ${resolucionParrafos || `<p>
        Que del análisis y valoración de los elementos probatorios reunidos en el proceso,
        el Tribunal ha formado convicción suficiente para pronunciar la presente resolución
        final motivada, de conformidad con lo establecido en el Art. 75 del Reglamento de
        Justicia Universitaria.
      </p>`}
    </div>

    <!-- ── SANCIÓN DESTACADA (si sancionatoria) ── -->
    ${!esAbsolutoria && sancionLabel ? `
    <div class="sancion-destacada">
      <div class="san-label">Sanción aplicable — Art. 42 del Reglamento</div>
      <div>${sancionLabel}</div>
      ${d.detalleSancion ? `<div style="font-style:italic;color:#555;margin-top:4px;">${d.detalleSancion}</div>` : ""}
    </div>` : ""}

    <!-- ── POR TANTO ── -->
    <div class="por-tanto">
      El Tribunal de Justicia Universitaria de Primera Instancia, en uso de las
      atribuciones conferidas por el Art. 85° del Estatuto Orgánico y el Reglamento de
      Justicia Universitaria (Res. I.C.U. N° 048-2018),
    </div>

    <!-- ── RESUELVE ── -->
    <div class="resuelve">R &nbsp; E &nbsp; S &nbsp; U &nbsp; E &nbsp; L &nbsp; V &nbsp; E :</div>

    <div class="articulos">
      <div class="articulo">
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
             disponiendo el archivo del presente proceso disciplinario (Art. 75 del Reglamento).`
        }
      </div>

      <div class="articulo">
        <span class="art-num">Artículo 2°. —</span>
        Notificar a las partes con la presente resolución en sus respectivos domicilios
        procesales, dentro del plazo máximo de cinco (5) días hábiles (Art. 46 del
        Reglamento), con la advertencia de que contra la misma procede el recurso de
        apelación ante este mismo Tribunal en el plazo perentorio de cinco (5) días hábiles
        a partir de la notificación personal (Art. 82 par. II del Reglamento).
      </div>

      ${!esAbsolutoria ? `
      <div class="articulo">
        <span class="art-num">Artículo 3°. —</span>
        Ejecutoriada la presente resolución, remítase el expediente ante la autoridad
        responsable para su respectiva ejecución, en el plazo de tres (3) días hábiles,
        de conformidad con el Art. 16 del Reglamento de Justicia Universitaria.
      </div>` : ""}

      <div class="articulo">
        <span class="art-num">Artículo ${!esAbsolutoria ? "4°" : "3°"}. —</span>
        Devuélvanse los obrados al archivo una vez ejecutoriada la presente resolución y
        cumplidos los trámites de ley correspondientes.
      </div>
    </div>

    ${d.aclaracionEnmienda ? `
    <div style="border-left:3px solid #7c3aed;padding:8px 12px;margin:0.3cm 0;background:#f9f5ff;font-size:10pt;font-style:italic;line-height:1.6;">
      <strong style="color:#7c3aed;font-size:9pt;text-transform:uppercase;">Aclaración / Enmienda (Art. 77):</strong><br/>
      ${d.aclaracionEnmienda}
      ${d.fechaSolicitudAclaracion ? `<br/><span style="font-size:9pt;color:#666;">Fecha: ${fmtFechaCorta(d.fechaSolicitudAclaracion)}</span>` : ""}
    </div>` : ""}

    <!-- ── CIERRE ── -->
    <div class="cierre">
      <p>
        Es dada en las oficinas del Tribunal de Justicia Universitaria de Primera Instancia
        de la Universidad Autónoma "Gabriel René Moreno", en la ciudad de Santa Cruz de la
        Sierra, a los ${fechaCierre !== "—" ? fechaCierre : "______ días del mes de ______ del año ______"}.
      </p>
      <div class="registrese">Regístrese, Notifíquese, Cúmplase y Archívese.</div>
    </div>

    <!-- ── FIRMAS ── -->
    <div class="firmas">
      <div class="firma-bloque">
        <div class="firma-espacio"></div>
        <div class="firma-nombre">
          ${secretario
            ? `${secretario.idVocal.idPersona.nombre} ${secretario.idVocal.idPersona.primerApellido}`
            : "________________________________"}
        </div>
        <div class="firma-cargo">
          ${secretario ? secretario.rolEnCaso : "Secretario/a del Tribunal"}
        </div>
      </div>

      <div class="firma-bloque">
        <div class="firma-espacio"></div>
        <div class="firma-nombre">
          ${presidente
            ? `${presidente.idVocal.idPersona.nombre} ${presidente.idVocal.idPersona.primerApellido}`
            : "________________________________"}
        </div>
        <div class="firma-cargo">
          ${presidente ? presidente.rolEnCaso : "Presidente del Tribunal"}
        </div>
        ${presidente?.idVocal?.cargo
          ? `<div style="font-size:8.5pt;color:#555;">${presidente.idVocal.cargo}</div>`
          : ""}
      </div>
    </div>

    <!-- ── DATOS LATERALES (estilo MLAB/Sist) ── -->
    <div style="margin-top:0.4cm;font-size:8pt;color:#777;">
      Exp. ${d.expediente?.numeroExpediente ?? "—"} &nbsp;·&nbsp;
      Den. ${d.numeroDenuncia} &nbsp;·&nbsp;
      ${d.fechaResolucion ? `Res. ${fmtFechaCorta(d.fechaResolucion)}` : ""}
      ${d.fechaNotificacionResolucion ? ` · Notif. ${fmtFechaCorta(d.fechaNotificacionResolucion)}` : ""}
    </div>

    <!-- ── PIE ── -->
    <div class="pie">
      <div class="pie-lema">"Formando con innovación, liderando con valores"</div>
      <div class="pie-datos">
        <span>⚖ Tribunal de Justicia Universitaria — U.A.G.R.M.</span>
        <span>📍 Santa Cruz de la Sierra, Bolivia</span>
        <span>🌐 www.uagrm.edu.bo</span>
      </div>
    </div>

  </div><!-- /contenido -->
</div><!-- /page -->

<script>
  window.onload = function(){ window.print(); }
</script>
</body>
</html>`;
}

export function generarPdfResolucion(denuncia: DenunciaResolucion): void {
  const html = buildHtml(denuncia);
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    alert("El navegador bloqueó la ventana emergente. Permitila e intentá de nuevo.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

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
      title={
        !puedeGenerar
          ? "Disponible una vez emitida la resolución definitiva"
          : "Generar PDF de la resolución"
      }
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