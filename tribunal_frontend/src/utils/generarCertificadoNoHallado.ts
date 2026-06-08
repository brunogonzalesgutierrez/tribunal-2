// src/utils/generarCertificadoNoHallado.ts
// Genera un PDF oficial de "Certificado de Proceso No Hallado"
// Requiere: npm install jspdf (ya instalado si usás generarPdfResolucion)

export async function generarCertificadoNoHallado(params: {
  persona: {
    nombre: string;
    primerApellido: string;
    segundoApellido?: string;
    numeroDocumento?: string;       // C.I. (opcional)
    registroUniversitario: string;  // N° Registro (obligatorio, es el buscador)
    estamento?: string;
    titularA?: string;
  };
  tribunal: {
    nombreTribunal: string;
    instancia: string;
  };
  fechaBusqueda?: string; // ISO string, si no se pasa usa la fecha actual
}) {
  const { jsPDF } = await import("jspdf");

  const { persona, tribunal, fechaBusqueda } = params;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });

  // ── Medidas ──────────────────────────────────────────────────────────────
  const PW       = doc.internal.pageSize.getWidth();
  const PH       = doc.internal.pageSize.getHeight();
  const ML       = 25;
  const MR       = 25;
  const CUERPO_W = PW - ML - MR;

  // ── Paleta ───────────────────────────────────────────────────────────────
  const NEGRO:   [number,number,number] = [10,  10,  10 ];
  const OSCURO:  [number,number,number] = [30,  30,  30 ];
  const GRIS:    [number,number,number] = [100, 100, 100];
  const GRIS_LT: [number,number,number] = [200, 200, 200];
  const GRIS_BG: [number,number,number] = [245, 245, 245];
  const AZUL:    [number,number,number] = [15,  55,  120];
  const VERDE:   [number,number,number] = [22,  101, 52 ];
  const VERDE_BG:[number,number,number] = [240, 253, 244];
  const VERDE_BD:[number,number,number] = [187, 247, 208];
  const BLANCO:  [number,number,number] = [255, 255, 255];

  // ── Helpers ──────────────────────────────────────────────────────────────
  const nombreCompleto =
    `${persona.nombre} ${persona.primerApellido}${persona.segundoApellido ? ` ${persona.segundoApellido}` : ""}`.trim();

  const fechaHoy = fechaBusqueda ? new Date(fechaBusqueda) : new Date();

  const fmtFechaLarga = (d: Date) =>
    d.toLocaleDateString("es-BO", { day: "2-digit", month: "long", year: "numeric" });

  const fmtFechaCorta = (d: Date) =>
    d.toLocaleDateString("es-BO", { day: "2-digit", month: "2-digit", year: "numeric" });

  const fmtHora = (d: Date) =>
    d.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });

  const piePaginaY = PH - 18;

  // ── Marca de agua ─────────────────────────────────────────────────────────
  const dibujarMarcaAgua = () => {
    doc.saveGraphicsState();
    doc.setGState(new (doc as any).GState({ opacity: 0.04 }));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(52);
    doc.setTextColor(...AZUL);
    doc.text("PODER JUDICIAL", PW / 2, PH / 2, { align: "center", angle: 45 });
    doc.restoreGraphicsState();
  };

  // ── Pie de página ─────────────────────────────────────────────────────────
  const dibujarPie = () => {
    doc.setDrawColor(...AZUL);
    doc.setLineWidth(0.6);
    doc.line(ML, piePaginaY - 4, PW - MR, piePaginaY - 4);
    doc.setDrawColor(...GRIS_LT);
    doc.setLineWidth(0.2);
    doc.line(ML, piePaginaY - 2.5, PW - MR, piePaginaY - 2.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...GRIS);
    doc.text(
      "Documento generado por el Sistema de Gestión Judicial — Válido únicamente como certificación informativa",
      PW / 2, piePaginaY + 1, { align: "center" }
    );
    doc.text(
      `Generado el ${fmtFechaCorta(fechaHoy)} a las ${fmtHora(fechaHoy)}`,
      ML, piePaginaY + 5
    );
  };

  // ════════════════════════════════════════════════════════════════════════
  // CONSTRUCCIÓN DEL DOCUMENTO
  // ════════════════════════════════════════════════════════════════════════
  dibujarMarcaAgua();
  dibujarPie();

  // ── Franja superior azul ─────────────────────────────────────────────────
  doc.setFillColor(...AZUL);
  doc.rect(0, 0, PW, 22, "F");
  doc.setFillColor(180, 150, 60);
  doc.rect(0, 22, PW, 1.2, "F");

  doc.setTextColor(...BLANCO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("ESTADO PLURINACIONAL DE BOLIVIA", PW / 2, 9, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(tribunal.nombreTribunal.toUpperCase(), PW / 2, 16, { align: "center" });

  let y = 32;

  // ── Título del certificado ───────────────────────────────────────────────
  doc.setFillColor(...GRIS_BG);
  doc.setDrawColor(...AZUL);
  doc.setLineWidth(0.2);
  doc.roundedRect(ML, y, CUERPO_W, 24, 1, 1, "FD");
  doc.setFillColor(...AZUL);
  doc.roundedRect(ML, y, 3, 24, 1, 1, "F");

  doc.setTextColor(...AZUL);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("CERTIFICADO DE PROCESO NO HALLADO", ML + 8, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRIS);
  doc.text("Certificación de Inexistencia de Procesos Judiciales", ML + 8, y + 14);
  doc.text(`${tribunal.instancia}  ·  Emitido el ${fmtFechaLarga(fechaHoy)}`, ML + 8, y + 20);

  y += 30;

  // ── Sección helper ───────────────────────────────────────────────────────
  const seccion = (titulo: string) => {
    doc.setFillColor(...AZUL);
    doc.rect(ML, y, CUERPO_W, 7, "F");
    doc.setTextColor(...BLANCO);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(titulo.toUpperCase(), ML + 4, y + 5);
    y += 10;
  };

  const fila2col = (label1: string, val1: string, label2: string, val2: string) => {
    const col = CUERPO_W / 2 - 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...GRIS);
    doc.text(label1.toUpperCase(), ML, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...OSCURO);
    doc.text(val1 || "—", ML, y + 4.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...GRIS);
    doc.text(label2.toUpperCase(), ML + col + 4, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...OSCURO);
    doc.text(val2 || "—", ML + col + 4, y + 4.5);
    y += 11;
  };

  // ── I. Datos del solicitante ─────────────────────────────────────────────
  seccion("I. Datos del Solicitante");

  fila2col("Nombre completo", nombreCompleto, "N° Registro", persona.registroUniversitario);
  fila2col(
    "C.I.",              persona.numeroDocumento || "No registrado",
    "Estamento",         persona.estamento       || "—"
  );
  if (persona.titularA) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...GRIS);
    doc.text("TITULAR A", ML, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...OSCURO);
    doc.text(persona.titularA, ML, y + 4.5);
    y += 11;
  }

  doc.setDrawColor(...GRIS_LT);
  doc.setLineWidth(0.3);
  doc.line(ML, y, ML + CUERPO_W, y);
  y += 6;

  // ── II. Resultado de la búsqueda ─────────────────────────────────────────
  seccion("II. Resultado de la Búsqueda Exhaustiva");

  // Caja verde de certificación
  doc.setFillColor(...VERDE_BG);
  doc.setDrawColor(...VERDE_BD);
  doc.setLineWidth(0.3);
  doc.roundedRect(ML, y, CUERPO_W, 28, 2, 2, "FD");
  // Barra izquierda verde
  doc.setFillColor(...VERDE);
  doc.roundedRect(ML, y, 3.5, 28, 1, 1, "F");

  // Ícono de check (simulado con texto)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...VERDE);
  doc.text("✓", ML + 10, y + 12);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...VERDE);
  doc.text("PROCESO NO HALLADO", ML + 22, y + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(22, 101, 52);
  const resultadoLines = doc.splitTextToSize(
    `Realizada la búsqueda exhaustiva en los registros del ${tribunal.nombreTribunal}, ` +
    `NO SE ENCONTRÓ ningún expediente judicial ni proceso activo o concluido a nombre de ` +
    `${nombreCompleto} con N° de Registro ${persona.registroUniversitario}.`,
    CUERPO_W - 28
  );
  doc.text(resultadoLines, ML + 22, y + 16);

  y += 34;

  // ── III. Alcance y ámbito de la búsqueda ─────────────────────────────────
  seccion("III. Alcance y Ámbito de la Búsqueda");

  const items = [
    "Expedientes civiles activos y archivados",
    "Procesos penales en todas sus etapas",
    "Causas de familia y menores",
    "Procesos laborales y administrativos",
    "Recursos e impugnaciones pendientes",
    "Expedientes concluidos y archivados",
  ];

  items.forEach((item, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(250, 250, 252);
      doc.rect(ML, y - 1, CUERPO_W, 7, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...OSCURO);
    doc.text(`• ${item}`, ML + 4, y + 4);
    doc.setDrawColor(...GRIS_LT);
    doc.setLineWidth(0.15);
    doc.line(ML, y + 6, ML + CUERPO_W, y + 6);
    y += 7;
  });

  y += 4;

  // ── IV. Vigencia y advertencia ───────────────────────────────────────────
  seccion("IV. Vigencia y Advertencia Legal");

  const advertenciaText =
    "El presente certificado tiene validez de TREINTA (30) días calendario a partir de la fecha de emisión. " +
    "Este documento certifica únicamente la inexistencia de procesos en los registros del " +
    `${tribunal.nombreTribunal} a la fecha de su emisión. ` +
    "No ampara procesos registrados en otros tribunales o jurisdicciones del país. " +
    "Cualquier alteración o falsificación de este documento constituye delito conforme al Código Penal boliviano.";

  const advLines = doc.splitTextToSize(advertenciaText, CUERPO_W - 8);
  const advH = advLines.length * 5.2 + 10;

  doc.setFillColor(255, 251, 235);
  doc.setDrawColor(251, 191, 36);
  doc.setLineWidth(0.3);
  doc.roundedRect(ML, y, CUERPO_W, advH, 1, 1, "FD");
  doc.setFillColor(180, 130, 20);
  doc.roundedRect(ML, y, 3.5, advH, 1, 1, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);
  doc.setTextColor(92, 60, 0);
  doc.text(advLines, ML + 7, y + 7, { lineHeightFactor: 1.4 });
  y += advH + 8;

  // ── V. Datos de emisión ──────────────────────────────────────────────────
  seccion("V. Datos de Emisión");

  fila2col(
    "Fecha de emisión",    fmtFechaLarga(fechaHoy),
    "Hora de emisión",     fmtHora(fechaHoy)
  );
  fila2col(
    "Tribunal",            tribunal.nombreTribunal,
    "Instancia",           tribunal.instancia
  );

  y += 4;

  // ── Bloque de firma ──────────────────────────────────────────────────────
  doc.setDrawColor(...GRIS_LT);
  doc.setLineWidth(0.3);
  doc.line(ML, y, ML + CUERPO_W, y);
  y += 10;

  const cx = ML + CUERPO_W / 2;

  doc.setDrawColor(...OSCURO);
  doc.setLineWidth(0.5);
  doc.line(cx - 40, y + 14, cx + 40, y + 14);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...OSCURO);
  doc.text("SECRETARIO/A DE SALA", cx, y + 18, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRIS);
  doc.text(tribunal.nombreTribunal, cx, y + 23, { align: "center" });
  doc.text("Firma y Sello Oficial", cx, y + 28, { align: "center" });

  y += 34;

  // ── Código de documento ──────────────────────────────────────────────────
  const codigo = `CERT-PNH-${persona.registroUniversitario.replace(/[^A-Z0-9]/gi, "").toUpperCase()}-${fechaHoy.getFullYear()}-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...GRIS);
  doc.text(`Código de certificado: ${codigo}`, ML, y);

  // ── Número de página ──────────────────────────────────────────────────────
  const totalPags = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPags; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...AZUL);
    doc.text(`Página ${i} de ${totalPags}`, PW - MR, piePaginaY + 5, { align: "right" });
  }

  // ── Descargar ─────────────────────────────────────────────────────────────
  const nombreArchivo = `Certificado_PNH_${nombreCompleto.replace(/\s+/g, "_")}_${fechaHoy.getFullYear()}.pdf`;
  doc.save(nombreArchivo);
}
