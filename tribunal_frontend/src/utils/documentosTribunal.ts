// src/utils/documentosTribunal.ts
// ============================================================
// Generador UNIFICADO de documentos oficiales del Tribunal
// de Justicia Universitaria — Primera Instancia (UAGRM)
//
// Formato basado en el documento físico oficial:
//   — Logo UAGRM izquierda + Logo Tribunal derecha
//   — Título centrado en mayúsculas
//   — Cuerpo con el contenido del acto procesal
//   — Espacio para firma física de la secretaria
//
// USO:
//   import { generarDocumentoTribunal } from "@/utils/documentosTribunal";
//   generarDocumentoTribunal({ tipo: "CITACION", ... });
// ============================================================

const BACKEND = "http://localhost:8000";

// Cache de logos para no pedir al servidor en cada llamada
const _logoCache: Record<string, string> = {};

async function obtenerLogoBase64(nombre: "uagrm" | "tribunal"): Promise<string> {
  if (_logoCache[nombre]) return _logoCache[nombre];
  try {
    const resp = await fetch(`${BACKEND}/api/logo/${nombre}/`);
    const json = await resp.json();
    if (json.ok) {
      _logoCache[nombre] = json.dataUrl;
      return json.dataUrl;
    }
  } catch {
    // Si no se puede cargar el logo, continuar sin él
  }
  return "";
}

// ── Helpers de fecha ─────────────────────────────────────────────────────────
const MESES_ES = [
  "enero","febrero","marzo","abril","mayo","junio",
  "julio","agosto","septiembre","octubre","noviembre","diciembre",
];

function fechaLarga(fecha?: Date | string | null): string {
  const d = fecha ? new Date(fecha) : new Date();
  return `${d.getDate()} de ${MESES_ES[d.getMonth()]} de ${d.getFullYear()}`;
}

function horaActual(): string {
  return new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });
}

// ── Tipos de documentos soportados ───────────────────────────────────────────
export type TipoDocumentoTribunal =
  | "CITACION"            // Art. 44 / 47 — Notificación y/o Citación general
  | "CITACION_ADMISION"   // Art. 44 + 58a — Citación al denunciado con auto de admisión
  | "CITACION_DEC_INF"    // Art. 58b — Citación para declaración informativa
  | "SUBSANACION"         // Art. 56 — Auto de subsanación
  | "RECHAZO"             // Art. 57 — Auto de rechazo
  | "AUTO_ADMISION"       // Art. 58 — Auto de admisión (documento físico)
  | "APERTURA_PROBATORIA" // Art. 60 — Auto de apertura del término probatorio
  | "CIERRE_PROBATORIO"   // Art. 74 — Auto de cierre
  | "RESOLUCION_FINAL"    // Art. 75 — Resolución final (sancionatoria/absolutoria)
  | "ACLARACION"          // Art. 77 — Auto de aclaración/enmienda
  | "OFICIO_RECTORADO"    // Art. 16 + 90 II — Oficio al Rectorado
  | "CONCILIACION"        // Art. 59 — Acta de conciliación

export interface DatosDocumentoTribunal {
  tipo: TipoDocumentoTribunal;
  // Expediente
  numeroExpediente: string;
  anioExpediente?: number;
  // Partes
  nombreDestinatario: string;       // A quién se notifica/cita
  rolDestinatario?: string;         // "Denunciante" | "Denunciado/a" | etc.
  emailDestinatario?: string;
  // Denuncia (opcional, para contexto)
  numeroDenuncia?: string;
  descripcionHechos?: string;
  fechaHecho?: string;
  // Resolución (para documentos de resolución)
  tipoResolucion?: "SANCIONATORIA" | "ABSOLUTORIA";
  tipoSancion?: string;
  detalleSancion?: string;
  textoCuerpo?: string;             // Texto libre para el cuerpo del documento
  // Aclaracion
  textoAclaracion?: string;
  // Conciliacion
  textoConciliacion?: string;
  // Rectorado
  textoOficioRectorado?: string;
  // Vocal/Secretaria firmante
  nombreSecretaria?: string;
  cargoSecretaria?: string;
  // Fecha del documento (por defecto: hoy)
  fechaDocumento?: string;
}

// ── CSS compartido para todos los documentos ─────────────────────────────────
function estilosBase(): string {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11pt;
      color: #111;
      background: #fff;
    }
    .pagina {
      width: 21.5cm;
      min-height: 27.9cm;
      margin: 0 auto;
      padding: 1.8cm 2.2cm 2cm 2.2cm;
      position: relative;
    }
    /* ── Encabezado con 2 logos ── */
    .encabezado {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.4cm;
    }
    .encabezado img {
      width: 2.8cm;
      height: 2.8cm;
      object-fit: contain;
    }
    .encabezado-texto {
      text-align: center;
      flex: 1;
      padding: 0 0.5cm;
      line-height: 1.45;
    }
    .encabezado-texto p {
      font-size: 11pt;
      font-weight: bold;
      color: #111;
      text-transform: uppercase;
    }
    .encabezado-texto p.sub {
      font-size: 10pt;
      font-weight: normal;
    }
    /* ── Separador horizontal doble ── */
    .separador {
      border: none;
      border-top: 2px solid #111;
      margin: 0.35cm 0 0.5cm;
    }
    /* ── Título del documento ── */
    .titulo-doc {
      text-align: center;
      font-size: 12pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin: 0.5cm 0 0.6cm;
    }
    /* ── Cuerpo ── */
    .cuerpo {
      font-size: 11pt;
      line-height: 1.9;
      color: #111;
    }
    .cuerpo p {
      margin-bottom: 0.35cm;
      text-align: justify;
    }
    .cuerpo .campo {
      display: inline-block;
      min-width: 4cm;
      border-bottom: 1px dotted #555;
      vertical-align: bottom;
    }
    .cuerpo .campo-largo {
      display: block;
      width: 100%;
      border-bottom: 1px dotted #555;
      min-height: 0.65cm;
      margin: 0.1cm 0;
    }
    .negrita { font-weight: bold; }
    /* ── Bloque de alerta (plazos) ── */
    .alerta {
      border-left: 4px solid #c0392b;
      background: #fdf2f2;
      padding: 0.25cm 0.4cm;
      margin: 0.4cm 0;
      font-size: 10.5pt;
      line-height: 1.65;
    }
    .alerta .alerta-titulo {
      font-weight: bold;
      color: #c0392b;
      font-size: 9.5pt;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin-bottom: 4px;
    }
    /* ── Bloque informativo ── */
    .info-box {
      border: 1px solid #b0c4de;
      background: #f0f6ff;
      padding: 0.25cm 0.4cm;
      margin: 0.4cm 0;
      font-size: 10.5pt;
      border-radius: 3px;
    }
    /* ── Certifico y firma ── */
    .certifico {
      margin-top: 0.6cm;
      font-size: 11pt;
    }
    .firma-bloque {
      margin-top: 1.8cm;
      text-align: center;
    }
    .firma-linea {
      display: inline-block;
      width: 7cm;
      border-top: 1px solid #111;
      margin-bottom: 0.2cm;
    }
    .firma-nombre {
      font-size: 10.5pt;
      font-weight: bold;
      text-transform: uppercase;
      line-height: 1.4;
    }
    .firma-cargo {
      font-size: 10pt;
      font-weight: bold;
      text-transform: uppercase;
      line-height: 1.4;
    }
    .firma-inst {
      font-size: 9.5pt;
      line-height: 1.4;
    }
    /* ── Pie ── */
    .pie {
      position: absolute;
      bottom: 1.2cm;
      left: 2.2cm;
      right: 2.2cm;
      border-top: 1px solid #888;
      padding-top: 0.2cm;
      font-size: 8pt;
      color: #555;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { background: #fff; }
      .pagina { margin: 0; width: 100%; }
    }
  `;
}

// ── Encabezado HTML con los dos logos ────────────────────────────────────────
function htmlEncabezado(logoUagrm: string, logoTribunal: string): string {
  const imgUagrm    = logoUagrm    ? `<img src="${logoUagrm}"    alt="Escudo UAGRM">` : "<div style='width:2.8cm'></div>";
  const imgTribunal = logoTribunal ? `<img src="${logoTribunal}" alt="Escudo Tribunal">` : "<div style='width:2.8cm'></div>";
  return `
    <div class="encabezado">
      ${imgUagrm}
      <div class="encabezado-texto">
        <p>UNIVERSIDAD AUTÓNOMA "GABRIEL RENÉ MORENO"</p>
        <p>TRIBUNAL DE JUSTICIA UNIVERSITARIA</p>
        <p class="sub">DE PRIMERA INSTANCIA</p>
      </div>
      ${imgTribunal}
    </div>
    <hr class="separador"/>
  `;
}

// ── Bloque de firma de la secretaria ─────────────────────────────────────────
function htmlFirma(nombre: string, cargo: string): string {
  return `
    <div class="certifico">Certifico. -</div>
    <div class="firma-bloque">
      <div class="firma-linea"></div><br/>
      <div class="firma-nombre">${nombre}</div>
      <div class="firma-cargo">${cargo}</div>
      <div class="firma-inst">Tribunal de Justicia Universitaria<br/>U.A.G.R.M.</div>
    </div>
  `;
}

// ── Pie de página ─────────────────────────────────────────────────────────────
function htmlPie(numeroExpediente: string, tipo: string): string {
  const fecha = new Date().toLocaleDateString("es-BO");
  return `
    <div class="pie">
      <span>Tribunal de Justicia Universitaria — U.A.G.R.M. · Primera Instancia</span>
      <span>Exp. ${numeroExpediente} · ${tipo} · ${fecha}</span>
    </div>
  `;
}

// ── Constructores de cuerpo por tipo de documento ─────────────────────────────

function cuerpoCitacion(d: DatosDocumentoTribunal): string {
  const hora   = horaActual();
  const fecha  = fechaLarga(d.fechaDocumento);
  const email  = d.emailDestinatario ? `, al correo <strong>${d.emailDestinatario}</strong>` : "";
  return `
    <p>Expediente Nro. <strong>${d.numeroExpediente}${d.anioExpediente ? "/" + d.anioExpediente : ""}</strong></p>
    <p>En la ciudad de Santa Cruz a horas <strong>${hora}</strong> del día <strong>${fecha}</strong>.</p>
    <p><span class="negrita">Notifiqué y/o Cité a:</span></p>
    <p>${d.nombreDestinatario}${d.rolDestinatario ? ` — en calidad de <strong>${d.rolDestinatario}</strong>` : ""}.</p>
    <p><span class="negrita">Lugar:</span></p>
    <p>Notificación electrónica enviada${email}.
    <div class="campo-largo"></div>
    <div class="campo-largo"></div></p>
    <p>Con lo siguiente:</p>
    <p class="negrita">1.- ${d.textoCuerpo ?? "Providencia de la fecha."}</p>
    <p class="negrita">Quien informado de su tenor se dio por: NOTIFICADO(A)</p>
    <p>Recibiendo copia de ley y firmando en constancia:</p>
  `;
}

function cuerpoCitacionAdmision(d: DatosDocumentoTribunal): string {
  const hora  = horaActual();
  const fecha = fechaLarga(d.fechaDocumento);
  const email = d.emailDestinatario ? `al correo <strong>${d.emailDestinatario}</strong>` : "";
  return `
    <p>Expediente Nro. <strong>${d.numeroExpediente}${d.anioExpediente ? "/" + d.anioExpediente : ""}</strong>
    ${d.numeroDenuncia ? ` — Denuncia <strong>${d.numeroDenuncia}</strong>` : ""}</p>
    <p>En la ciudad de Santa Cruz a horas <strong>${hora}</strong> del día <strong>${fecha}</strong>.</p>
    <p><span class="negrita">Citado/a:</span> ${d.nombreDestinatario}</p>
    <p><span class="negrita">En calidad de:</span> Denunciado/a</p>
    <p><span class="negrita">Lugar:</span> Notificación electrónica enviada ${email}.
    <div class="campo-largo"></div></p>
    <p>Con lo siguiente:</p>
    <div class="info-box">
      <p><strong>AUTO DE ADMISIÓN — CITACIÓN PERSONAL (Art. 58):</strong></p>
      <p>El Tribunal de Justicia Universitaria de Primera Instancia ha admitido la denuncia
      disciplinaria interpuesta en su contra, iniciando la etapa investigativa.</p>
      <p>Se le cita para que en el plazo <strong>improrrogable de DIEZ (10) DÍAS HÁBILES</strong>
      asuma su defensa sobre los hechos o actos denunciados, advirtiéndosele que el proceso
      continuará <strong>con o sin su contestación</strong> (Art. 58 inc. a).</p>
    </div>
    ${d.descripcionHechos ? `
    <p><span class="negrita">Hechos denunciados:</span></p>
    <p>${d.descripcionHechos}</p>
    ` : ""}
    <p class="negrita">Quien informado/a de su tenor se dio por: CITADO(A)</p>
    <p>Recibiendo copia de ley y firmando en constancia:</p>
  `;
}

function cuerpoSubsanacion(d: DatosDocumentoTribunal): string {
  const hora  = horaActual();
  const fecha = fechaLarga(d.fechaDocumento);
  return `
    <p>Denuncia <strong>${d.numeroDenuncia ?? "—"}</strong></p>
    <p>En la ciudad de Santa Cruz a horas <strong>${hora}</strong> del día <strong>${fecha}</strong>.</p>
    <p><span class="negrita">Notificado/a:</span> ${d.nombreDestinatario} — <strong>Denunciante</strong></p>
    <p>Con lo siguiente:</p>
    <div class="alerta">
      <div class="alerta-titulo">AUTO DE SUBSANACIÓN — ART. 56</div>
      <p>La denuncia presentada no se ajusta a los requisitos mínimos establecidos en el Art. 55
      del Reglamento de Justicia Universitaria. Se dispone la subsanación de los defectos
      formales en el plazo <strong>improrrogable de TRES (3) DÍAS HÁBILES</strong>,
      bajo apercibimiento de tenerse por no presentada.</p>
      ${d.textoCuerpo ? `<p><strong>Defectos a subsanar:</strong> ${d.textoCuerpo}</p>` : ""}
    </div>
    <p class="negrita">Quien informado/a de su tenor se dio por: NOTIFICADO(A)</p>
    <p>Recibiendo copia de ley y firmando en constancia:</p>
  `;
}

function cuerpoAperturaProbatoria(d: DatosDocumentoTribunal): string {
  const hora  = horaActual();
  const fecha = fechaLarga(d.fechaDocumento);
  return `
    <p>Expediente Nro. <strong>${d.numeroExpediente}${d.anioExpediente ? "/" + d.anioExpediente : ""}</strong>
    ${d.numeroDenuncia ? ` — Denuncia <strong>${d.numeroDenuncia}</strong>` : ""}</p>
    <p>En la ciudad de Santa Cruz a horas <strong>${hora}</strong> del día <strong>${fecha}</strong>.</p>
    <p><span class="negrita">Notificado/a:</span> ${d.nombreDestinatario}
    ${d.rolDestinatario ? ` — <strong>${d.rolDestinatario}</strong>` : ""}</p>
    <p>Con lo siguiente:</p>
    <div class="info-box">
      <p><strong>AUTO DE APERTURA DEL TÉRMINO PROBATORIO (Art. 60):</strong></p>
      <p>Habiendo recibido la declaración informativa, el Tribunal dicta
      <strong>Auto de Apertura del Término Probatorio de TREINTA (30) DÍAS HÁBILES</strong>,
      a efecto de recepcionar las pruebas de cargo y descargo.</p>
      <p>Las partes podrán <strong>ratificar sus pruebas dentro de los CINCO (5) DÍAS HÁBILES</strong>
      computables desde la presente notificación (Art. 60 II).</p>
    </div>
    <p class="negrita">Quien informado/a de su tenor se dio por: NOTIFICADO(A)</p>
    <p>Recibiendo copia de ley y firmando en constancia:</p>
  `;
}

function cuerpoCierreProbatorio(d: DatosDocumentoTribunal): string {
  const hora  = horaActual();
  const fecha = fechaLarga(d.fechaDocumento);
  return `
    <p>Expediente Nro. <strong>${d.numeroExpediente}${d.anioExpediente ? "/" + d.anioExpediente : ""}</strong></p>
    <p>En la ciudad de Santa Cruz a horas <strong>${hora}</strong> del día <strong>${fecha}</strong>.</p>
    <p>Con lo siguiente:</p>
    <div class="info-box">
      <p><strong>AUTO DE CLAUSURA DEL TÉRMINO PROBATORIO (Art. 74):</strong></p>
      <p>Concluido el plazo de treinta (30) días hábiles del término probatorio, el Tribunal
      de Justicia Universitaria dispone en forma expresa la <strong>clausura del período probatorio</strong>.
      Se procede a dictar la resolución final motivada en el plazo de quince (15) días calendario
      (Art. 13 inc. 3 y Art. 75).</p>
    </div>
    <p class="negrita">Quien informado/a de su tenor se dio por: NOTIFICADO(A)</p>
    <p>Recibiendo copia de ley y firmando en constancia:</p>
  `;
}

function cuerpoOficioRectorado(d: DatosDocumentoTribunal): string {
  const fecha = fechaLarga(d.fechaDocumento);
  return `
    <p>Expediente Nro. <strong>${d.numeroExpediente}${d.anioExpediente ? "/" + d.anioExpediente : ""}</strong>
    ${d.numeroDenuncia ? ` — Denuncia <strong>${d.numeroDenuncia}</strong>` : ""}</p>
    <p>Señor Rector de la Universidad Autónoma "Gabriel René Moreno"</p>
    <p>Ciudad. -</p>
    <p>De mi consideración:</p>
    <p>El Tribunal de Justicia Universitaria de Primera Instancia de la Universidad Autónoma
    "Gabriel René Moreno", en cumplimiento del <strong>Art. 16</strong> del Reglamento de Justicia
    Universitaria (Resolución I.C.U. N° 048-2018), remite a usted el presente expediente en el
    plazo de tres (3) días hábiles desde la ejecutoria de la resolución definitiva, a efectos de que:</p>
    <div class="alerta">
      <div class="alerta-titulo">ACCIÓN REQUERIDA — ART. 90 PAR. II</div>
      <p>Se emita la correspondiente <strong>resolución administrativa</strong> en el plazo
      <strong>improrrogable de CINCO (5) DÍAS HÁBILES</strong> de recibido el presente oficio,
      disponiendo la ejecución de la sanción impuesta.</p>
    </div>
    ${d.textoOficioRectorado ? `<p>${d.textoOficioRectorado}</p>` : ""}
    <p>Asimismo, se recuerda que la resolución sancionatoria ejecutoriada debe registrarse en la
    <strong>Gaceta Universitaria dentro de los CINCO (5) DÍAS HÁBILES</strong> siguientes (Art. 7).</p>
    <p>En ${fecha}.</p>
    <p>Atentamente,</p>
  `;
}

function cuerpoConciliacion(d: DatosDocumentoTribunal): string {
  const hora  = horaActual();
  const fecha = fechaLarga(d.fechaDocumento);
  return `
    <p>Expediente Nro. <strong>${d.numeroExpediente}${d.anioExpediente ? "/" + d.anioExpediente : ""}</strong>
    ${d.numeroDenuncia ? ` — Denuncia <strong>${d.numeroDenuncia}</strong>` : ""}</p>
    <p>En la ciudad de Santa Cruz a horas <strong>${hora}</strong> del día <strong>${fecha}</strong>.</p>
    <p>El Tribunal de Justicia Universitaria de Primera Instancia, en virtud del Art. 59 del
    Reglamento de Justicia Universitaria, hace constar que las partes han llegado a un
    <strong>acuerdo de conciliación</strong> en los siguientes términos:</p>
    <div class="info-box">
      <p><strong>Puntos acordados:</strong></p>
      <p>${d.textoConciliacion ?? "—"}</p>
    </div>
    <p>Con lo cual se concluye el trámite disciplinario y se dispone el <strong>archivo de obrados</strong>
    (Art. 59 II).</p>
    <p>Las partes firman en conformidad:</p>
    <br/>
    <table style="width:100%;margin-top:0.5cm;">
      <tr>
        <td style="width:45%;text-align:center;vertical-align:bottom;">
          <div style="border-top:1px solid #111;margin-bottom:0.15cm;"></div>
          <div style="font-size:10pt;font-weight:bold;">Denunciante</div>
        </td>
        <td style="width:10%"></td>
        <td style="width:45%;text-align:center;vertical-align:bottom;">
          <div style="border-top:1px solid #111;margin-bottom:0.15cm;"></div>
          <div style="font-size:10pt;font-weight:bold;">Denunciado/a</div>
        </td>
      </tr>
    </table>
  `;
}

// ── Mapeo tipo → (título del documento, constructor de cuerpo) ────────────────
const CONFIGS: Record<TipoDocumentoTribunal, {
  titulo: string;
  cuerpo: (d: DatosDocumentoTribunal) => string;
}> = {
  CITACION:            { titulo: "NOTIFICACIÓN y/o CITACIÓN",                   cuerpo: cuerpoCitacion },
  CITACION_ADMISION:   { titulo: "AUTO DE ADMISIÓN — CITACIÓN PERSONAL",        cuerpo: cuerpoCitacionAdmision },
  CITACION_DEC_INF:    { titulo: "CITACIÓN — DECLARACIÓN INFORMATIVA",          cuerpo: cuerpoCitacion },
  SUBSANACION:         { titulo: "AUTO DE SUBSANACIÓN (Art. 56)",                cuerpo: cuerpoSubsanacion },
  RECHAZO:             { titulo: "AUTO DE RECHAZO DE DENUNCIA (Art. 57)",        cuerpo: cuerpoCitacion },
  AUTO_ADMISION:       { titulo: "AUTO DE ADMISIÓN (Art. 58)",                   cuerpo: cuerpoCitacionAdmision },
  APERTURA_PROBATORIA: { titulo: "AUTO DE APERTURA DEL TÉRMINO PROBATORIO (Art. 60)", cuerpo: cuerpoAperturaProbatoria },
  CIERRE_PROBATORIO:   { titulo: "AUTO DE CLAUSURA DEL TÉRMINO PROBATORIO (Art. 74)", cuerpo: cuerpoCierreProbatorio },
  RESOLUCION_FINAL:    { titulo: "RESOLUCIÓN FINAL (Art. 75)",                   cuerpo: cuerpoCitacion },
  ACLARACION:          { titulo: "AUTO DE ACLARACIÓN / COMPLEMENTACIÓN (Art. 77)", cuerpo: cuerpoCitacion },
  OFICIO_RECTORADO:    { titulo: "OFICIO DE REMISIÓN AL RECTORADO (Art. 16 + Art. 90 II)", cuerpo: cuerpoOficioRectorado },
  CONCILIACION:        { titulo: "ACTA DE CONCILIACIÓN (Art. 59)",               cuerpo: cuerpoConciliacion },
};

// ── Función principal ─────────────────────────────────────────────────────────
export async function generarDocumentoTribunal(datos: DatosDocumentoTribunal): Promise<void> {
  const secretaria = datos.nombreSecretaria ?? "Abg. Fátima Aguirre Avalos";
  const cargoSec   = datos.cargoSecretaria  ?? "Sría. al Tribunal de 1ra Instancia";

  const [logoUagrm, logoTribunal] = await Promise.all([
    obtenerLogoBase64("uagrm"),
    obtenerLogoBase64("tribunal"),
  ]);

  const config = CONFIGS[datos.tipo];
  if (!config) {
    console.error(`Tipo de documento desconocido: ${datos.tipo}`);
    return;
  }

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>${config.titulo} — Exp. ${datos.numeroExpediente}</title>
  <style>${estilosBase()}</style>
</head>
<body>
<div class="pagina">
  ${htmlEncabezado(logoUagrm, logoTribunal)}
  <div class="titulo-doc">${config.titulo}</div>
  <div class="cuerpo">
    ${config.cuerpo(datos)}
  </div>
  ${htmlFirma(secretaria, cargoSec)}
  ${htmlPie(datos.numeroExpediente, config.titulo)}
</div>
<script>window.onload = function(){ window.print(); }</script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=950,height=800");
  if (!win) {
    alert("El navegador bloqueó la ventana emergente. Permitila e intentá de nuevo.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

// ── Exportaciones de conveniencia por tipo ────────────────────────────────────

export const generarCitacion = (d: Omit<DatosDocumentoTribunal, "tipo">) =>
  generarDocumentoTribunal({ ...d, tipo: "CITACION" });

export const generarAutoAdmision = (d: Omit<DatosDocumentoTribunal, "tipo">) =>
  generarDocumentoTribunal({ ...d, tipo: "AUTO_ADMISION" });

export const generarAutoSubsanacion = (d: Omit<DatosDocumentoTribunal, "tipo">) =>
  generarDocumentoTribunal({ ...d, tipo: "SUBSANACION" });

export const generarAperturaProbatoria = (d: Omit<DatosDocumentoTribunal, "tipo">) =>
  generarDocumentoTribunal({ ...d, tipo: "APERTURA_PROBATORIA" });

export const generarCierreProbatorio = (d: Omit<DatosDocumentoTribunal, "tipo">) =>
  generarDocumentoTribunal({ ...d, tipo: "CIERRE_PROBATORIO" });

export const generarOficioRectorado = (d: Omit<DatosDocumentoTribunal, "tipo">) =>
  generarDocumentoTribunal({ ...d, tipo: "OFICIO_RECTORADO" });

export const generarActaConciliacion = (d: Omit<DatosDocumentoTribunal, "tipo">) =>
  generarDocumentoTribunal({ ...d, tipo: "CONCILIACION" });
