// ─────────────────────────────────────────────────────────────────────────────
// INSTRUCCIONES DE INSTALACIÓN
// Ejecuta en la terminal dentro de tribunal_frontend:
//   npm install jspdf
//
// INSTRUCCIONES DE USO
// 1. Copia el archivo generarPdfResolucion.ts a src/utils/generarPdfResolucion.ts
// 2. En ExpedienteDetallePage.tsx agrega este import al inicio:
//    import { generarPdfResolucion } from "../../utils/generarPdfResolucion";
// 3. Agrega el estado para PDF al inicio del componente:
//    const [generandoPdf, setGenerandoPdf] = useState<number | null>(null);
// 4. Agrega la función generarPdf al componente:
//    (ver abajo)
// 5. Reemplaza la sección {/* ══ RESOLUCIONES ══ */} completa con el JSX de abajo.
// ─────────────────────────────────────────────────────────────────────────────

// ── Función a pegar dentro de ExpedienteDetallePage (antes del return) ────────
/*
const generarPdf = async (resolucion: any) => {
  setGenerandoPdf(resolucion.idResolucion);
  try {
    await generarPdfResolucion({
      expediente: exp,
      resolucion,
      partes,
      vocales,
    });
  } catch (e) {
    console.error("Error generando PDF:", e);
  } finally {
    setGenerandoPdf(null);
  }
};
*/

// ── JSX a reemplazar en la sección {/* ══ RESOLUCIONES ══ */} ─────────────────
// (reemplaza TODO desde {tabActiva === "resoluciones" && ( hasta el cierre )}  )

export const RESOLUCION_TAB_JSX = `
{tabActiva === "resoluciones" && (
  <div className="space-y-4">
    <SeccionHeader
      count={resoluciones.length}
      singular="resolución"
      plural="resoluciones"
      onAgregar={() => abrirForm("resoluciones")}
      mostrarBoton={!showForm["resoluciones"]}
    />
    {showForm["resoluciones"] && (
      <FormResolucion
        idExpediente={idExpediente}
        onSaved={() => onSaved("resoluciones")}
        onCancel={() => cerrarForm("resoluciones")}
      />
    )}
    {resoluciones.length === 0 && !showForm["resoluciones"] ? (
      <TablaVacia
        icono={Scale}
        mensaje="Sin resoluciones registradas"
        onAgregar={() => abrirForm("resoluciones")}
        labelAgregar="Nueva resolución"
      />
    ) : (
      resoluciones.map((r: any) => (
        <div
          key={r.idResolucion}
          className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700 space-y-3"
        >
          {/* Cabecera de la card */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-white font-mono">
                {r.numeroResolucion}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {r.idTipoRes?.codigo} · {r.idTipoRes?.nombre}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Pill
                className={
                  r.estado === "VIGENTE"
                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                    : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"
                }
              >
                {r.estado}
              </Pill>
              {r.esRecurrible && (
                <Pill className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                  Recurrible · {r.plazoRecursoDias}d
                </Pill>
              )}

              {/* ✅ BOTÓN GENERAR PDF */}
              <button
                onClick={() => generarPdf(r)}
                disabled={generandoPdf === r.idResolucion}
                title="Descargar resolución en PDF"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold border border-red-200 dark:border-red-800/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generandoPdf === r.idResolucion ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <FileDown className="w-3.5 h-3.5" />
                    PDF
                  </>
                )}
              </button>

              <BtnEliminar
                disabled={eliminandoId === r.idResolucion}
                onClick={() =>
                  eliminar(
                    r.idResolucion,
                    () => eliminarResolucion({ variables: { id: Number(r.idResolucion) } }) as any,
                    \`¿Eliminar la resolución \${r.numeroResolucion}?\`,
                    {
                      loading: "Eliminando resolución...",
                      success: \`Resolución \${r.numeroResolucion} eliminada\`,
                      error: "Error al eliminar la resolución",
                    }
                  )
                }
              />
            </div>
          </div>

          <InfoCell label="Fecha de Resolución" value={fmtFecha(r.fechaResolucion)} />

          {r.parteDispositiva && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">
                Parte Dispositiva
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900/50 rounded-lg p-3 border border-gray-200 dark:border-slate-700 leading-relaxed">
                {r.parteDispositiva}
              </p>
            </div>
          )}

          {r.fundamentacion && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">
                Fundamentación
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900/50 rounded-lg p-3 border border-gray-200 dark:border-slate-700 leading-relaxed">
                {r.fundamentacion}
              </p>
            </div>
          )}
        </div>
      ))
    )}
  </div>
)}
`;
