// ================================================================
// CAMBIO 4 — FRONTEND: ExpedienteDetallePage.tsx
// ================================================================
// Este archivo tiene 4 partes que debes agregar/modificar.
// Te digo exactamente dónde va cada una.
// ================================================================


// ────────────────────────────────────────────────────────────────
// PARTE A: Import de la mutation
// ────────────────────────────────────────────────────────────────
// Busca esta línea en los imports de arriba del archivo:
//
//   import {
//     CREAR_AUDIENCIA, ACTUALIZAR_AUDIENCIA, ELIMINAR_AUDIENCIA,
//     GET_TIPOS_AUDIENCIA, GET_SALAS_AUDIENCIA,
//   } from "../../graphql/audiencias";
//
// REEMPLÁZALA con esto (solo se agrega ENVIAR_CITACIONES_AUDIENCIA):
//
//   import {
//     CREAR_AUDIENCIA, ACTUALIZAR_AUDIENCIA, ELIMINAR_AUDIENCIA,
//     GET_TIPOS_AUDIENCIA, GET_SALAS_AUDIENCIA,
//     ENVIAR_CITACIONES_AUDIENCIA,
//   } from "../../graphql/audiencias";


// ────────────────────────────────────────────────────────────────
// PARTE B: Componente modal — pégalo ANTES de la función
//          "export default function ExpedienteDetallePage()"
// ────────────────────────────────────────────────────────────────

/*
function ModalCitaciones({
  audiencia,
  partes,
  onClose,
}: {
  audiencia: any;
  partes: any[];
  onClose: () => void;
}) {
  const [enviarCitaciones] = useMutation(ENVIAR_CITACIONES_AUDIENCIA);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<any | null>(null);

  // Separar partes con y sin email
  const partesConEmail = partes.filter((p: any) =>
    p.idPersona?.contactos?.some(
      (c: any) => c.tipoContacto?.toLowerCase() === "email"
    )
  );
  const partesSinEmail = partes.filter(
    (p: any) =>
      !p.idPersona?.contactos?.some(
        (c: any) => c.tipoContacto?.toLowerCase() === "email"
      )
  );

  const fmtFechaHora = (iso?: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("es-BO", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const confirmar = async () => {
    setEnviando(true);
    try {
      const { data } = await enviarCitaciones({
        variables: { idAudiencia: Number(audiencia.idAudiencia) },
      });
      setResultado(data?.enviarCitacionesAudiencia);
    } catch (e: any) {
      setResultado({ ok: false, mensaje: e.message ?? "Error al enviar." });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={!enviando ? onClose : undefined}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        // ── Cabecera ──
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <Send className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-white">
                Enviar Citaciones
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {audiencia.idTipoAudiencia?.nombre} ·{" "}
                {fmtFechaHora(audiencia.fechaHoraProgramada)}
              </p>
            </div>
          </div>
          {!enviando && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        // ── Cuerpo ──
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {!resultado ? (
            <>
              // Partes que SÍ recibirán el correo
              {partesConEmail.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                    Recibirán citación ({partesConEmail.length})
                  </p>
                  <div className="space-y-2">
                    {partesConEmail.map((p: any) => {
                      const email = p.idPersona?.contactos?.find(
                        (c: any) => c.tipoContacto?.toLowerCase() === "email"
                      )?.valor;
                      return (
                        <div
                          key={p.idParte}
                          className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                              {p.idPersona?.nombre} {p.idPersona?.primerApellido}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {p.idRol?.nombreRol} · {email}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              // Partes SIN email
              {partesSinEmail.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                    Sin email registrado ({partesSinEmail.length})
                  </p>
                  <div className="space-y-2">
                    {partesSinEmail.map((p: any) => (
                      <div
                        key={p.idParte}
                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700"
                      >
                        <AlertCircle className="w-4 h-4 text-gray-400 shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {p.idPersona?.nombre} {p.idPersona?.primerApellido}
                          </p>
                          <p className="text-xs text-gray-400">
                            {p.idRol?.nombreRol} · Sin email
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {partesConEmail.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <AlertCircle className="w-10 h-10 text-amber-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                    Ninguna parte tiene email registrado
                  </p>
                  <p className="text-xs text-gray-400">
                    Registra los contactos de las partes antes de enviar citaciones.
                  </p>
                </div>
              )}
            </>
          ) : (
            // Resultado del envío
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              {resultado.ok ? (
                <CheckCircle className="w-12 h-12 text-emerald-500" />
              ) : (
                <AlertCircle className="w-12 h-12 text-amber-400" />
              )}
              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                {resultado.mensaje}
              </p>
              {resultado.destinatarios?.length > 0 && (
                <div className="w-full text-left space-y-1">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Enviados a:
                  </p>
                  {resultado.destinatarios.map((d: string) => (
                    <p key={d} className="text-xs text-gray-600 dark:text-gray-300">
                      ✓ {d}
                    </p>
                  ))}
                </div>
              )}
              {resultado.sinEmail?.length > 0 && (
                <div className="w-full text-left space-y-1">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Sin email (no enviados):
                  </p>
                  {resultado.sinEmail.map((d: string) => (
                    <p key={d} className="text-xs text-gray-400">
                      ✗ {d}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        // ── Pie ──
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex gap-2">
          {!resultado ? (
            <>
              <button
                onClick={onClose}
                disabled={enviando}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm font-medium transition-colors disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                onClick={confirmar}
                disabled={enviando || partesConEmail.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
              >
                {enviando ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                ) : (
                  <><Send className="w-4 h-4" /> Enviar {partesConEmail.length} citación{partesConEmail.length !== 1 ? "es" : ""}</>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
*/


// ────────────────────────────────────────────────────────────────
// PARTE C: Import del ícono Send
// ────────────────────────────────────────────────────────────────
// Busca la línea de imports de lucide-react y agrega "Send":
//
//   import {
//     X, FolderOpen, Users, Calendar, Scale, FileText,
//     ClipboardList, History, Building2, CheckCircle, AlertCircle,
//     Clock, Gavel, UserCheck, ArrowRight, Loader2, GitBranch,
//     Plus, Edit2, Trash2, Save, XCircle, Video, ChevronLeft,
//     Search, FileDown, Send   <-- AGREGA Send AQUÍ
//   } from "lucide-react";


// ────────────────────────────────────────────────────────────────
// PARTE D: Estado y mutation dentro del componente principal
// ────────────────────────────────────────────────────────────────
// Busca esta línea dentro de ExpedienteDetallePage:
//
//   const [generandoPdf, setGenerandoPdf] = useState<number | null>(null);
//
// JUSTO DEBAJO agrega:
//
//   const [citacionAud, setCitacionAud] = useState<any | null>(null);
//   const [enviarCitaciones] = useMutation(ENVIAR_CITACIONES_AUDIENCIA);
//
// (el useState guarda qué audiencia tiene el modal abierto)


// ────────────────────────────────────────────────────────────────
// PARTE E: Botón en la card de audiencia + modal
// ────────────────────────────────────────────────────────────────
// En la sección {/* ══ AUDIENCIAS ══ */}, busca esta parte
// dentro del map de audiencias:
//
//   {!showForm["audiencias"] && (
//     <div className="flex items-center gap-1">
//       <button onClick={() => { setEditandoAud(a); abrirForm("audiencias"); }} ...
//       <BtnEliminar ...
//     </div>
//   )}
//
// REEMPLÁZALA con esto (se agrega el botón de citaciones):
//
//   {!showForm["audiencias"] && (
//     <div className="flex items-center gap-1">
//       <button
//         onClick={() => setCitacionAud(a)}
//         title="Enviar citaciones por email"
//         className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
//       >
//         <Send className="w-3.5 h-3.5" />
//       </button>
//       <button onClick={() => { setEditandoAud(a); abrirForm("audiencias"); }} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
//       <BtnEliminar
//         disabled={eliminandoId === a.idAudiencia}
//         onClick={() => eliminar(a.idAudiencia, () => eliminarAudiencia({ variables: { id: Number(a.idAudiencia) } }) as any, `¿Eliminar la audiencia del ${fmtFechaHora(a.fechaHoraProgramada)}?`, { loading: "Eliminando audiencia...", success: "Audiencia eliminada", error: "Error al eliminar la audiencia" })}
//       />
//     </div>
//   )}
//
// Luego busca el cierre de la sección de audiencias, justo ANTES
// del comentario {/* ══ RESOLUCIONES ══ */} agrega el modal:
//
//   {citacionAud && (
//     <ModalCitaciones
//       audiencia={citacionAud}
//       partes={partes.filter((p: any) => p.activo)}
//       onClose={() => setCitacionAud(null)}
//     />
//   )}
