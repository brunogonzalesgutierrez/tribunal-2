// ============================================================
// ARCHIVO 3 — CAMBIOS EN ExpedienteDetallePage.tsx
// ============================================================
//
// HAY 4 PARTES EN ESTE ARCHIVO.
// Léelas todas antes de empezar para no perderte.
//
// ============================================================


// ════════════════════════════════════════════════════════════
// PARTE A — AGREGAR IMPORTS AL INICIO DEL ARCHIVO
// ════════════════════════════════════════════════════════════
//
// PASO 1: Abre ExpedienteDetallePage.tsx
//
// PASO 2: Busca esta línea (está arriba, en los imports de graphql):
//
//   } from "../../graphql/audiencias";
//
// PASO 3: Reemplaza esa línea con esto (agrega las 2 queries nuevas):
//
//   ENVIAR_CITACIONES_AUDIENCIA,
//   GET_ASISTENCIAS_AUDIENCIA,
//   REGISTRAR_ASISTENCIA_BATCH,
// } from "../../graphql/audiencias";
//
// O sea, antes del } agrega las dos líneas nuevas.
// Tiene que quedar así:
/*
import {
  CREAR_AUDIENCIA, ACTUALIZAR_AUDIENCIA, ELIMINAR_AUDIENCIA,
  GET_TIPOS_AUDIENCIA, GET_SALAS_AUDIENCIA, ENVIAR_CITACIONES_AUDIENCIA,
  GET_ASISTENCIAS_AUDIENCIA,
  REGISTRAR_ASISTENCIA_BATCH,
} from "../../graphql/audiencias";
*/


// ════════════════════════════════════════════════════════════
// PARTE B — EL COMPONENTE MODAL (pegar antes de la función principal)
// ════════════════════════════════════════════════════════════
//
// PASO 4: Busca en ExpedienteDetallePage.tsx el componente ModalCitaciones.
//         Empieza con: function ModalCitaciones({
//
// PASO 5: Justo ANTES de "function ModalCitaciones({", pega TODO este bloque:

// ─── Tipos de estado de asistencia ────────────────────────
type EstadoAsistencia = "PRESENTE" | "AUSENTE" | "JUSTIFICADO" | null;

interface RegistroLocal {
  idPersona: number;
  nombre: string;
  rolEnAudiencia: string;
  estado: EstadoAsistencia;
  motivoInasistencia: string;
}

function ModalAsistencia({
  audiencia,
  partes,
  onClose,
}: {
  audiencia: any;
  partes: any[];
  onClose: () => void;
}) {
  const { data: dataExistente, loading: loadingExistente } = useQuery(
    GET_ASISTENCIAS_AUDIENCIA,
    { variables: { idAudiencia: Number(audiencia.idAudiencia) }, fetchPolicy: "network-only" }
  );

  const [registrarBatch] = useMutation(REGISTRAR_ASISTENCIA_BATCH);
  const [guardando, setGuardando] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [yaGuardado, setYaGuardado] = useState(false);
  const [mensajeOk, setMensajeOk] = useState("");

  // Estado local: un registro por cada parte activa
  const [registros, setRegistros] = useState<RegistroLocal[]>([]);

  // Cuando llegan los datos existentes, inicializamos el estado
  useEffect(() => {
    if (!loadingExistente) {
      const asistenciasGuardadas: any[] = dataExistente?.asistenciasPorAudiencia ?? [];
      const hayDatos = asistenciasGuardadas.length > 0;
      setYaGuardado(hayDatos);
      setModoEdicion(!hayDatos); // Si no hay datos, abrir en modo edición directamente

      const iniciales: RegistroLocal[] = partes.map((p: any) => {
        // Buscar si ya hay asistencia guardada para esta persona
        const guardado = asistenciasGuardadas.find(
          (a: any) => a.idPersona?.idPersona === p.idPersona?.idPersona
        );

        let estado: EstadoAsistencia = null;
        if (guardado) {
          if (guardado.asistio) {
            estado = "PRESENTE";
          } else if (
            guardado.motivoInasistencia?.toLowerCase().includes("justif")
          ) {
            estado = "JUSTIFICADO";
          } else {
            estado = "AUSENTE";
          }
        }

        return {
          idPersona: p.idPersona?.idPersona,
          nombre: `${p.idPersona?.nombre} ${p.idPersona?.primerApellido}`,
          rolEnAudiencia: p.idRol?.nombreRol ?? "Parte procesal",
          estado,
          motivoInasistencia: guardado?.motivoInasistencia ?? "",
        };
      });

      setRegistros(iniciales);
    }
  }, [loadingExistente, dataExistente]);

  const setEstado = (idPersona: number, estado: EstadoAsistencia) => {
    setRegistros((prev) =>
      prev.map((r) => (r.idPersona === idPersona ? { ...r, estado } : r))
    );
  };

  const setMotivo = (idPersona: number, motivo: string) => {
    setRegistros((prev) =>
      prev.map((r) =>
        r.idPersona === idPersona ? { ...r, motivoInasistencia: motivo } : r
      )
    );
  };

  const todosMarcados = registros.every((r) => r.estado !== null);

  const guardar = async () => {
    if (!todosMarcados) return;
    setGuardando(true);
    try {
      const { data } = await registrarBatch({
        variables: {
          idAudiencia: Number(audiencia.idAudiencia),
          registros: registros.map((r) => ({
            idPersona: r.idPersona,
            rolEnAudiencia: r.rolEnAudiencia,
            estado: r.estado,
            motivoInasistencia: r.motivoInasistencia || null,
          })),
        },
      });
      if (data?.registrarAsistenciaBatch?.ok) {
        setYaGuardado(true);
        setModoEdicion(false);
        setMensajeOk(data.registrarAsistenciaBatch.mensaje);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setGuardando(false);
    }
  };

  // Colores y etiquetas por estado
  const estadoConfig = {
    PRESENTE: {
      label: "Presente",
      bg: "bg-emerald-500 hover:bg-emerald-600",
      bgActivo: "bg-emerald-500 ring-2 ring-emerald-300 dark:ring-emerald-700",
      bgInactivo: "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30",
      texto: "text-white",
    },
    AUSENTE: {
      label: "Ausente",
      bg: "bg-red-500 hover:bg-red-600",
      bgActivo: "bg-red-500 ring-2 ring-red-300 dark:ring-red-700",
      bgInactivo: "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30",
      texto: "text-white",
    },
    JUSTIFICADO: {
      label: "Justificado",
      bg: "bg-amber-500 hover:bg-amber-600",
      bgActivo: "bg-amber-500 ring-2 ring-amber-300 dark:ring-amber-700",
      bgInactivo: "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 hover:bg-amber-100 dark:hover:bg-amber-900/30",
      texto: "text-white",
    },
  };

  const presentes   = registros.filter((r) => r.estado === "PRESENTE").length;
  const ausentes    = registros.filter((r) => r.estado === "AUSENTE").length;
  const justificados = registros.filter((r) => r.estado === "JUSTIFICADO").length;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={!guardando ? onClose : undefined}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-lg flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Cabecera ── */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-white">
                {yaGuardado && !modoEdicion ? "Ver asistencia" : "Tomar asistencia"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {audiencia.idTipoAudiencia?.nombre} · {new Date(audiencia.fechaHoraProgramada).toLocaleDateString("es-BO")}
              </p>
            </div>
          </div>
          {!guardando && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* ── Resumen de contadores (solo cuando hay datos) ── */}
        {registros.some((r) => r.estado !== null) && (
          <div className="flex-shrink-0 px-6 py-3 border-b border-gray-200 dark:border-slate-700 flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{presentes} presentes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{ausentes} ausentes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{justificados} justificados</span>
            </div>
          </div>
        )}

        {/* ── Cuerpo ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {loadingExistente ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            </div>
          ) : registros.length === 0 ? (
            <div className="text-center py-10 text-gray-400 dark:text-gray-500">
              <Users className="w-10 h-10 mx-auto mb-2" />
              <p className="text-sm">No hay partes procesales activas</p>
            </div>
          ) : (
            registros.map((r) => (
              <div
                key={r.idPersona}
                className="p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 space-y-2"
              >
                {/* Nombre y rol */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {r.nombre.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{r.nombre}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{r.rolEnAudiencia}</p>
                  </div>
                </div>

                {/* Botones de estado */}
                {modoEdicion ? (
                  <div className="flex gap-2">
                    {(["PRESENTE", "AUSENTE", "JUSTIFICADO"] as EstadoAsistencia[]).map((est) => {
                      const cfg = estadoConfig[est!];
                      const activo = r.estado === est;
                      return (
                        <button
                          key={est}
                          onClick={() => setEstado(r.idPersona, est)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            activo ? `${cfg.bgActivo} ${cfg.texto}` : cfg.bgInactivo
                          }`}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  // Modo solo lectura
                  <div className="flex items-center gap-2">
                    {r.estado && (
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                        r.estado === "PRESENTE" ? "bg-emerald-500" :
                        r.estado === "AUSENTE"  ? "bg-red-500"     : "bg-amber-500"
                      }`}>
                        {estadoConfig[r.estado].label}
                      </span>
                    )}
                    {r.motivoInasistencia && r.estado !== "PRESENTE" && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {r.motivoInasistencia}
                      </span>
                    )}
                  </div>
                )}

                {/* Campo de motivo (solo en edición y si es AUSENTE o JUSTIFICADO) */}
                {modoEdicion && (r.estado === "AUSENTE" || r.estado === "JUSTIFICADO") && (
                  <input
                    type="text"
                    placeholder={
                      r.estado === "JUSTIFICADO"
                        ? "Motivo de justificación (opcional)..."
                        : "Motivo de inasistencia (opcional)..."
                    }
                    value={r.motivoInasistencia}
                    onChange={(e) => setMotivo(r.idPersona, e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-gray-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  />
                )}
              </div>
            ))
          )}

          {/* Mensaje de éxito */}
          {mensajeOk && !modoEdicion && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" />
              {mensajeOk}
            </div>
          )}
        </div>

        {/* ── Pie ── */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex gap-2">
          {modoEdicion ? (
            <>
              <button
                onClick={yaGuardado ? () => setModoEdicion(false) : onClose}
                disabled={guardando}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm font-medium transition-colors disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={guardando || !todosMarcados}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
              >
                {guardando ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                ) : (
                  <><Save className="w-4 h-4" /> Guardar asistencia</>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm font-medium transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => setModoEdicion(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors"
              >
                <Edit2 className="w-4 h-4" /> Editar asistencia
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════
// PARTE C — AGREGAR ESTADO asistenciaAud en la página principal
// ════════════════════════════════════════════════════════════
//
// PASO 6: Busca en ExpedienteDetallePage (en la función export default)
//         esta línea:
//
//   const [citacionAud, setCitacionAud] = useState<any | null>(null);
//
// PASO 7: Justo DEBAJO de esa línea, agrega esto:
//
//   const [asistenciaAud, setAsistenciaAud] = useState<any | null>(null);
//


// ════════════════════════════════════════════════════════════
// PARTE D — AGREGAR EL BOTÓN EN CADA CARD DE AUDIENCIA
// ════════════════════════════════════════════════════════════
//
// PASO 8: Busca en la sección de audiencias el botón de citaciones:
//
//   <button
//     onClick={() => setCitacionAud(a)}
//     title="Enviar citaciones por email"
//     className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
//   >
//     <Send className="w-3.5 h-3.5" />
//   </button>
//
// PASO 9: Justo DESPUÉS de ese botón (o sea, después del </button> del Send),
//         agrega este nuevo botón:
//
//   <button
//     onClick={() => setAsistenciaAud(a)}
//     title="Tomar asistencia"
//     className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
//   >
//     <ClipboardList className="w-3.5 h-3.5" />
//   </button>
//


// ════════════════════════════════════════════════════════════
// PARTE E — AGREGAR EL MODAL AL FINAL DE LA SECCIÓN DE AUDIENCIAS
// ════════════════════════════════════════════════════════════
//
// PASO 10: Busca en la sección de audiencias este bloque:
//
//   {citacionAud && (
//     <ModalCitaciones
//       audiencia={citacionAud}
//       partes={partes.filter((p: any) => p.activo)}
//       onClose={() => setCitacionAud(null)}
//     />
//   )}
//
// PASO 11: Justo DESPUÉS de ese bloque (después del cierre }), agrega esto:
//
//   {asistenciaAud && (
//     <ModalAsistencia
//       audiencia={asistenciaAud}
//       partes={partes.filter((p: any) => p.activo)}
//       onClose={() => setAsistenciaAud(null)}
//     />
//   )}
//


// ════════════════════════════════════════════════════════════
// PARTE F — AGREGAR useEffect AL IMPORT DE REACT
// ════════════════════════════════════════════════════════════
//
// PASO 12: Busca al inicio del archivo esta línea:
//
//   import { useState } from "react";
//
// Reemplázala con:
//
//   import { useState, useEffect } from "react";
//
// (Solo agrega ", useEffect" — nada más)
