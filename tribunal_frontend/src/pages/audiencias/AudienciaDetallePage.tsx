import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import {
  GET_AUDIENCIAS,
  GET_ASISTENCIAS_AUDIENCIA,
} from "../../graphql/audiencias";
import {
  Scale, ArrowLeft, Calendar, DoorOpen, Video,
  User, CheckCircle, XCircle, AlertCircle, Clock,
} from "lucide-react";
import { EstadoBadge, fmt } from "./shared";
import { Audiencia } from "./shared";

// ─── Tipos locales ────────────────────────────────────────
interface Persona {
  idPersona: number;
  nombre: string;
  primerApellido: string;
  numeroDocumento: string;
}

interface Asistencia {
  idAsistencia: number;
  rolEnAudiencia: string;
  asistio: boolean;
  motivoInasistencia: string | null;
  horaIngreso: string | null;
  idPersona: Persona;
}

// ─── Helpers ──────────────────────────────────────────────
function estadoAsistencia(a: Asistencia): "PRESENTE" | "JUSTIFICADO" | "AUSENTE" {
  if (a.asistio) return "PRESENTE";
  if (
    !a.asistio &&
    a.motivoInasistencia &&
    a.motivoInasistencia.toLowerCase().includes("justif")
  )
    return "JUSTIFICADO";
  return "AUSENTE";
}

function AsistenciaBadge({ asistencia }: { asistencia: Asistencia }) {
  const estado = estadoAsistencia(asistencia);
  if (estado === "PRESENTE")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
        <CheckCircle className="w-3.5 h-3.5" /> Presente
      </span>
    );
  if (estado === "JUSTIFICADO")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">
        <AlertCircle className="w-3.5 h-3.5" /> Justificado
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400">
      <XCircle className="w-3.5 h-3.5" /> Ausente
    </span>
  );
}

// ════════════════════════════════════════════════════════
// PÁGINA DE DETALLE
// ════════════════════════════════════════════════════════
export default function AudienciaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const idAudiencia = Number(id);

  // Traemos todas las audiencias y filtramos la que corresponde
  const { data: dataAud, loading: loadingAud } = useQuery(GET_AUDIENCIAS);
  const { data: dataAsis, loading: loadingAsis } = useQuery(
    GET_ASISTENCIAS_AUDIENCIA,
    { variables: { idAudiencia }, skip: !idAudiencia }
  );

  const audiencias: Audiencia[] = dataAud?.allAudiencias ?? [];
  const audiencia = audiencias.find(a => Number(a.idAudiencia) === idAudiencia);
  const asistencias: Asistencia[] = dataAsis?.asistenciasPorAudiencia ?? [];

  // ── Loading ──────────────────────────────────────────
  if (loadingAud) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    );
  }

  // ── No encontrada ────────────────────────────────────
  if (!audiencia) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Scale className="w-16 h-16 text-gray-300 dark:text-gray-600" />
        <p className="text-gray-500 dark:text-gray-400 text-lg">Audiencia no encontrada</p>
        <button
          onClick={() => navigate("/audiencias")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a audiencias
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">

      {/* ── Encabezado ── */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/audiencias")}
          className="p-2 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-600 dark:text-gray-400"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Scale className="w-6 h-6 text-blue-500" />
            Detalle de Audiencia
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Expediente{" "}
            <span className="font-semibold text-blue-500">
              #{audiencia.idExpediente.numeroExpediente}
            </span>{" "}
            · {audiencia.idExpediente.ano}
          </p>
        </div>
      </div>

      {/* ── Datos de la audiencia ── */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <h2 className="font-semibold text-gray-800 dark:text-white text-base">
            Información de la audiencia
          </h2>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Expediente */}
          <div>
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              Expediente
            </p>
            <p className="text-gray-800 dark:text-white font-semibold">
              #{audiencia.idExpediente.numeroExpediente}
              <span className="text-gray-400 font-normal ml-2 text-sm">
                {audiencia.idExpediente.ano}
              </span>
            </p>
          </div>

          {/* Tipo */}
          <div>
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              Tipo de audiencia
            </p>
            <p className="text-gray-800 dark:text-white">
              {audiencia.idTipoAudiencia.nombre}
              <span className="text-xs text-gray-400 ml-2">
                ({audiencia.idTipoAudiencia.duracionEstimada} min)
              </span>
            </p>
          </div>

          {/* Fecha y hora */}
          <div>
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              Fecha y hora programada
            </p>
            <p className="text-gray-800 dark:text-white flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-400" />
              {fmt(audiencia.fechaHoraProgramada)}
            </p>
          </div>

          {/* Sala */}
          <div>
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              Sala
            </p>
            {audiencia.idSalaAud ? (
              <p className="text-gray-800 dark:text-white flex items-center gap-1.5">
                <DoorOpen className="w-4 h-4 text-purple-400" />
                {audiencia.idSalaAud.nombreSala}
                <span className="text-xs text-gray-400">
                  (Cap. {audiencia.idSalaAud.capacidad})
                </span>
              </p>
            ) : (
              <p className="text-gray-400">—</p>
            )}
          </div>

          {/* Estado */}
          <div>
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              Estado
            </p>
            <EstadoBadge estado={audiencia.estadoAudiencia} />
          </div>

          {/* Link videoconferencia */}
          <div>
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              Videoconferencia
            </p>
            {audiencia.linkVideoconferencia ? (
              <a
                href={audiencia.linkVideoconferencia}
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 text-sm flex items-center gap-1.5 hover:underline"
              >
                <Video className="w-4 h-4" /> Abrir enlace
              </a>
            ) : (
              <p className="text-gray-400 text-sm">Sin enlace</p>
            )}
          </div>

          {/* Motivo de suspensión (solo si aplica) */}
          {audiencia.estadoAudiencia === "SUSPENDIDA" && audiencia.motivoSuspension && (
            <div className="sm:col-span-2">
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Motivo de suspensión
              </p>
              <p className="text-gray-700 dark:text-gray-300 text-sm bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2.5">
                {audiencia.motivoSuspension}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Lista de asistencias ── */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 dark:text-white text-base flex items-center gap-2">
            <User className="w-4 h-4 text-blue-400" />
            Asistencias
            {!loadingAsis && (
              <span className="text-xs font-normal text-gray-400 ml-1">
                ({asistencias.length})
              </span>
            )}
          </h2>
        </div>

        {loadingAsis ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : asistencias.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-gray-400 dark:text-gray-500 gap-3">
            <User className="w-10 h-10" />
            <p className="text-sm">Sin asistencias registradas aún</p>
          </div>
        ) : (
          <>
            {/* Tabla desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Persona
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Hora ingreso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Motivo
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {asistencias.map(a => (
                    <tr
                      key={a.idAsistencia}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-800 dark:text-white">
                          {a.idPersona.nombre} {a.idPersona.primerApellido}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {a.idPersona.numeroDocumento}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {a.rolEnAudiencia}
                      </td>
                      <td className="px-6 py-4">
                        <AsistenciaBadge asistencia={a} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {a.horaIngreso ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {a.horaIngreso}
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-[200px]">
                        {a.motivoInasistencia || (
                          <span className="text-gray-300 dark:text-gray-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards móvil */}
            <div className="sm:hidden divide-y divide-gray-100 dark:divide-slate-700">
              {asistencias.map(a => (
                <div key={a.idAsistencia} className="px-4 py-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white text-sm">
                        {a.idPersona.nombre} {a.idPersona.primerApellido}
                      </p>
                      <p className="text-xs text-gray-400">{a.rolEnAudiencia}</p>
                    </div>
                    <AsistenciaBadge asistencia={a} />
                  </div>
                  {a.horaIngreso && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {a.horaIngreso}
                    </p>
                  )}
                  {a.motivoInasistencia && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                      {a.motivoInasistencia}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
