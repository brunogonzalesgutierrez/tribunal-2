// src/utils/generarPdfResolucion.ts
// Genera un PDF oficial de una resolución judicial usando jsPDF.
// Requiere: npm install jspdf

export async function generarPdfResolucion(params: {
  expediente: any;
  resolucion: any;
  partes: any[];
  vocales: any[];
}) {
  const { jsPDF } = await import("jspdf");

  const { expediente: exp, resolucion: r, partes, vocales } = params;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });

  // ── Medidas ──────────────────────────────────────────────────────────────
  const PW        = doc.internal.pageSize.getWidth();   // 215.9 mm
  const PH        = doc.internal.pageSize.getHeight();  // 279.4 mm
  const ML        = 25;   // margen izquierdo
  const MR        = 25;   // margen derecho
  const CUERPO_W  = PW - ML - MR;

  // ── Paleta ───────────────────────────────────────────────────────────────
  const NEGRO:   [number,number,number] = [10,  10,  10 ];
  const OSCURO:  [number,number,number] = [30,  30,  30 ];
  const GRIS:    [number,number,number] = [100, 100, 100];
  const GRIS_LT: [number,number,number] = [200, 200, 200];
  const GRIS_BG: [number,number,number] = [245, 245, 245];
  const AZUL:    [number,number,number] = [15,  55,  120];
  const BLANCO:  [number,number,number] = [255, 255, 255];

  let y = 0;

  // ── Helpers ──────────────────────────────────────────────────────────────
  const fmtFecha = (iso?: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-BO", {
      day: "2-digit", month: "long", year: "numeric",
    });
  };

  const fmtFechaCorta = (iso?: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-BO", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  };

  const nuevaPagina = () => {
    doc.addPage();
    y = 35;
    dibujarMarcaAgua();
    dibujarPiePagina();
  };

  const checkY = (necesita: number) => {
    if (y + necesita > PH - 28) nuevaPagina();
  };

  // ── Marca de agua diagonal ────────────────────────────────────────────────
  const dibujarMarcaAgua = () => {
    doc.saveGraphicsState();
    doc.setGState(new (doc as any).GState({ opacity: 0.04 }));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(52);
    doc.setTextColor(...AZUL);
    doc.text("PODER JUDICIAL", PW / 2, PH / 2, {
      align: "center",
      angle: 45,
    });
    doc.restoreGraphicsState();
  };

  // ── Pie de página (se llama al crear página, y al final se actualiza) ────
  const piePaginaY = PH - 18;

  const dibujarPiePagina = () => {
    // Línea doble
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
      "Documento generado por el Sistema de Gestión Judicial — Válido únicamente como copia informativa",
      PW / 2, piePaginaY + 1,
      { align: "center" }
    );
    doc.text(
      `Generado el ${new Date().toLocaleString("es-BO")}`,
      ML, piePaginaY + 5
    );
  };

  // ════════════════════════════════════════════════════════════════════════
  // PÁGINA 1
  // ════════════════════════════════════════════════════════════════════════
  dibujarMarcaAgua();
  dibujarPiePagina();

  // ── Franja superior azul oscuro ──────────────────────────────────────────
  doc.setFillColor(...AZUL);
  doc.rect(0, 0, PW, 22, "F");

  // Línea dorada decorativa bajo la franja
  doc.setFillColor(180, 150, 60);
  doc.rect(0, 22, PW, 1.2, "F");

  // Texto en la franja
  doc.setTextColor(...BLANCO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("ESTADO PLURINACIONAL DE BOLIVIA", PW / 2, 9, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(
    (exp?.idSala?.idTribunal?.nombreTribunal ?? "TRIBUNAL DEPARTAMENTAL DE JUSTICIA").toUpperCase(),
    PW / 2, 16, { align: "center" }
  );

  y = 32;

  // ── Bloque identificador de la resolución ────────────────────────────────
  // Rectángulo con borde azul a la izquierda
  doc.setFillColor(...GRIS_BG);
  doc.setDrawColor(...AZUL);
  doc.setLineWidth(0.2);
  doc.roundedRect(ML, y, CUERPO_W, 22, 1, 1, "FD");
  // Barra izquierda azul
  doc.setFillColor(...AZUL);
  doc.roundedRect(ML, y, 3, 22, 1, 1, "F");

  doc.setTextColor(...AZUL);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`RESOLUCIÓN N° ${r.numeroResolucion}`, ML + 8, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRIS);
  doc.text(
    `${r.idTipoRes?.nombre ?? "Resolución"} — ${fmtFecha(r.fechaResolucion)}`,
    ML + 8, y + 14
  );
  doc.text(
    `Estado: ${r.estado ?? "—"}${r.esRecurrible ? `  ·  Recurrible (plazo: ${r.plazoRecursoDias ?? 0} días)` : ""}`,
    ML + 8, y + 19
  );

  y += 28;

  // ── Sección: DATOS DEL EXPEDIENTE ───────────────────────────────────────
  const seccion = (titulo: string) => {
    checkY(14);
    doc.setFillColor(...AZUL);
    doc.rect(ML, y, CUERPO_W, 7, "F");
    doc.setTextColor(...BLANCO);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(titulo.toUpperCase(), ML + 4, y + 5);
    y += 10;
  };

  const fila2col = (label1: string, val1: string, label2: string, val2: string) => {
    checkY(8);
    const col = CUERPO_W / 2 - 2;
    // col 1
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...GRIS);
    doc.text(label1.toUpperCase(), ML, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...OSCURO);
    doc.text(val1, ML, y + 4.5);
    // col 2
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...GRIS);
    doc.text(label2.toUpperCase(), ML + col + 4, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...OSCURO);
    doc.text(val2, ML + col + 4, y + 4.5);
    y += 10;
  };

  seccion("I. Datos del Expediente");

  fila2col(
    "N° de Expediente", exp?.numeroExpediente ?? "—",
    "Año", String(exp?.ano ?? "—")
  );
  fila2col(
    "Tipo de Proceso", exp?.idTipoProceso?.nombre ?? "—",
    "Estado del Expediente", exp?.idEstadoExpediente?.nombreEstado ?? "—"
  );
  fila2col(
    "Sala", exp?.idSala?.nombreSala ?? "—",
    "Instancia", exp?.idSala?.idTribunal?.instancia ?? "—"
  );
  fila2col(
    "Fecha de Ingreso", fmtFechaCorta(exp?.fechaIngreso),
    "Fecha de Conclusión", fmtFechaCorta(exp?.fechaConclusion)
  );

  // Separador fino
  doc.setDrawColor(...GRIS_LT);
  doc.setLineWidth(0.3);
  doc.line(ML, y, ML + CUERPO_W, y);
  y += 5;

  // ── Sección: PARTES PROCESALES ───────────────────────────────────────────
  if (partes.length > 0) {
    seccion("II. Partes Procesales");

    // Cabecera de tabla
    const colNombre = CUERPO_W * 0.44;
    const colDoc    = CUERPO_W * 0.22;
    const colRol    = CUERPO_W * 0.22;
    const colAbog   = CUERPO_W * 0.12;

    doc.setFillColor(230, 235, 245);
    doc.rect(ML, y, CUERPO_W, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...AZUL);
    doc.text("NOMBRE COMPLETO",       ML + 2,                         y + 4.2);
    doc.text("N° DOCUMENTO",          ML + colNombre + 2,             y + 4.2);
    doc.text("ROL PROCESAL",          ML + colNombre + colDoc + 2,    y + 4.2);
    doc.text("ABOGADO",               ML + colNombre + colDoc + colRol + 2, y + 4.2);
    y += 7;

    partes.forEach((p: any, idx: number) => {
      checkY(7);
      const nombre = `${p.idPersona?.nombre ?? ""} ${p.idPersona?.primerApellido ?? ""} ${p.idPersona?.segundoApellido ?? ""}`.trim();
      const ci     = p.idPersona?.numeroDocumento ?? "—";
      const rol    = p.idRol?.nombreRol ?? "—";
      const abog   = p.idPersona?.esAbogado ? "Sí" : "No";

      if (idx % 2 === 0) {
        doc.setFillColor(250, 250, 252);
        doc.rect(ML, y - 1, CUERPO_W, 7, "F");
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...OSCURO);
      doc.text(nombre,  ML + 2,                               y + 4);
      doc.text(ci,      ML + colNombre + 2,                   y + 4);
      doc.text(rol,     ML + colNombre + colDoc + 2,          y + 4);
      doc.text(abog,    ML + colNombre + colDoc + colRol + 2, y + 4);

      // línea separadora fila
      doc.setDrawColor(...GRIS_LT);
      doc.setLineWidth(0.15);
      doc.line(ML, y + 6, ML + CUERPO_W, y + 6);
      y += 7;
    });

    y += 4;
  }

  // ── Sección: CONFORMACIÓN DE SALA ───────────────────────────────────────
  if (vocales.length > 0) {
    checkY(14);
    seccion("III. Conformación de Sala");

    vocales.forEach((v: any, idx: number) => {
      checkY(7);
      const nombre = `${v.idVocal?.idPersona?.nombre ?? ""} ${v.idVocal?.idPersona?.primerApellido ?? ""}`.trim();
      const cargo  = v.idVocal?.cargo ?? "—";
      const rol    = v.rolEnCaso ?? "—";

      if (idx % 2 === 0) {
        doc.setFillColor(250, 250, 252);
        doc.rect(ML, y - 1, CUERPO_W, 7, "F");
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...OSCURO);
      doc.text(nombre, ML + 2, y + 4);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...GRIS);
      doc.text(`${cargo}  ·  ${rol}`, ML + CUERPO_W / 2, y + 4);

      doc.setDrawColor(...GRIS_LT);
      doc.setLineWidth(0.15);
      doc.line(ML, y + 6, ML + CUERPO_W, y + 6);
      y += 7;
    });

    y += 4;
  }

  // ── Sección: PARTE DISPOSITIVA ───────────────────────────────────────────
  checkY(20);
  const romanos = ["I", "II", "III", "IV"];
  const numDisp = vocales.length > 0 ? "IV" : partes.length > 0 ? "III" : "II";
  seccion(`${numDisp}. Parte Dispositiva`);

  const dispositivaLines = doc.splitTextToSize(r.parteDispositiva ?? "—", CUERPO_W - 10);
  const altDisp = dispositivaLines.length * 5.5 + 10;
  checkY(altDisp);

  // Caja con borde izquierdo azul
  doc.setFillColor(240, 244, 252);
  doc.setDrawColor(...AZUL);
  doc.setLineWidth(0.2);
  doc.roundedRect(ML, y, CUERPO_W, altDisp, 1, 1, "FD");
  doc.setFillColor(...AZUL);
  doc.rect(ML, y, 3, altDisp, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...NEGRO);
  doc.text(dispositivaLines, ML + 7, y + 7);
  y += altDisp + 6;

  // ── Sección: FUNDAMENTACIÓN ──────────────────────────────────────────────
  if (r.fundamentacion) {
    checkY(20);
    const numFunda = numDisp === "IV" ? "V" : numDisp === "III" ? "IV" : "III";
    seccion(`${numFunda}. Fundamentación Jurídica`);

    const fundaLines = doc.splitTextToSize(r.fundamentacion, CUERPO_W - 4);
    const altFunda = fundaLines.length * 5.2 + 6;
    checkY(altFunda);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.8);
    doc.setTextColor(...OSCURO);
    // Texto justificado simulado
    doc.text(fundaLines, ML, y + 5, { lineHeightFactor: 1.4 });
    y += altFunda + 6;
  }

  // ── Sección: INFORMACIÓN ADICIONAL ──────────────────────────────────────
  checkY(20);
  const numAd = "VI";
  seccion(`${numAd}. Información Adicional de la Resolución`);

  fila2col(
    "Tipo de Resolución", r.idTipoRes?.nombre ?? "—",
    "Código", r.idTipoRes?.codigo ?? "—"
  );
  fila2col(
    "Nivel Jerárquico", r.idTipoRes?.nivelJerarquico ? `Nivel ${r.idTipoRes.nivelJerarquico}` : "—",
    "Es Recurrible", r.esRecurrible ? `Sí — Plazo ${r.plazoRecursoDias ?? 0} días` : "No"
  );

  y += 4;

  // ── Bloque de firmas ────────────────────────────────────────────────────
  checkY(45);
  y += 6;

  doc.setDrawColor(...GRIS_LT);
  doc.setLineWidth(0.3);
  doc.line(ML, y, ML + CUERPO_W, y);
  y += 8;

  const firmaCols = vocales.length > 0 ? Math.min(vocales.length, 3) : 1;
  const firmaW    = CUERPO_W / firmaCols;

  if (vocales.length > 0) {
    vocales.slice(0, 3).forEach((v: any, idx: number) => {
      const nombre = `${v.idVocal?.idPersona?.nombre ?? ""} ${v.idVocal?.idPersona?.primerApellido ?? ""}`.trim();
      const cargo  = v.idVocal?.cargo ?? "";
      const rol    = v.rolEnCaso ?? "";
      const cx     = ML + idx * firmaW + firmaW / 2;

      // Línea de firma
      doc.setDrawColor(...OSCURO);
      doc.setLineWidth(0.4);
      doc.line(cx - firmaW * 0.35, y + 12, cx + firmaW * 0.35, y + 12);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...OSCURO);
      doc.text(nombre, cx, y + 16, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...GRIS);
      doc.text(cargo, cx, y + 20, { align: "center" });
      doc.text(rol,   cx, y + 24, { align: "center" });
    });
  } else {
    const cx = ML + CUERPO_W / 2;
    doc.setDrawColor(...OSCURO);
    doc.setLineWidth(0.4);
    doc.line(cx - 35, y + 12, cx + 35, y + 12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...OSCURO);
    doc.text("FIRMA Y SELLO", cx, y + 16, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...GRIS);
    doc.text("Autoridad Judicial", cx, y + 20, { align: "center" });
  }

  y += 30;

  // ── Código de documento (simulado) ──────────────────────────────────────
  checkY(12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...GRIS);
  const codigo = `DOC-${r.numeroResolucion?.replace(/[^A-Z0-9]/gi, "").toUpperCase() ?? "XXX"}-${exp?.ano ?? new Date().getFullYear()}-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  doc.text(`Código de documento: ${codigo}`, ML, y);
  y += 5;

  // ════════════════════════════════════════════════════════════════════════
  // Número de página en todas las páginas
  // ════════════════════════════════════════════════════════════════════════
  const totalPaginas = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...AZUL);
    doc.text(
      `Página ${i} de ${totalPaginas}`,
      PW - MR, piePaginaY + 5,
      { align: "right" }
    );
  }

  // ── Descargar ────────────────────────────────────────────────────────────
  const nombre = `Resolucion_${r.numeroResolucion?.replace(/[/\\]/g, "-") ?? "documento"}_Exp${exp?.numeroExpediente?.replace(/[/\\]/g, "-") ?? ""}.pdf`;
  doc.save(nombre);
}