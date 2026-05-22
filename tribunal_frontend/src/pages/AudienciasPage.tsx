import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_AUDIENCIAS,
  GET_TIPOS_AUDIENCIA,
  GET_SALAS_AUDIENCIA,
  GET_ASISTENCIAS,
  GET_ACTAS,
  GET_EXPEDIENTES_SIMPLE,
  GET_TRIBUNALES_SIMPLE,
  GET_TIPOS_PROCESO_SIMPLE,
  GET_PERSONAS_SIMPLE,
  GET_USUARIOS_SIMPLE,
  CREAR_AUDIENCIA,
  ACTUALIZAR_AUDIENCIA,
  ELIMINAR_AUDIENCIA,
  CREAR_TIPO_AUDIENCIA,
  ELIMINAR_TIPO_AUDIENCIA,
  CREAR_SALA_AUDIENCIA,
  ACTUALIZAR_SALA_AUDIENCIA,
  ELIMINAR_SALA_AUDIENCIA,
  REGISTRAR_ASISTENCIA,
  ACTUALIZAR_ASISTENCIA,
  ELIMINAR_ASISTENCIA,
  CREAR_ACTA,
  ACTUALIZAR_ACTA,
  ELIMINAR_ACTA,
} from "../graphql/audiencias";
import {
  Scale, Plus, Search, Edit, Trash2, X, CheckCircle, Circle,
  Video, FileText, Users, DoorOpen, ClipboardList, Calendar,
  ChevronLeft, ChevronRight, MoreVertical, Mic, Clock,
  AlertCircle,
} from "lucide-react";

// ─── TIPOS ───────────────────────────────────────────────
interface Expediente { idExpediente: number; numeroExpediente: string; ano: number; }
interface TipoAudiencia { idTipoAudiencia: number; nombre: string; duracionEstimada: number; descripcion?: string; idTipoProceso: { idTipoProceso: number; nombre: string; }; }
interface SalaAudiencia { idSalaAud: number; nombreSala: string; capacidad: number; equipadaVideoconf: boolean; enlaceVirtual?: string; activa: boolean; idTribunal: { idTribunal: number; nombreTribunal: string; }; }
interface Audiencia {
  idAudiencia: number;
  fechaHoraProgramada: string;
  fechaHoraInicio?: string;
  fechaHoraFin?: string;
  estadoAudiencia: string;
  motivoSuspension?: string;
  linkVideoconferencia?: string;
  idExpediente: { idExpediente: number; numeroExpediente: string; ano: number; };
  idTipoAudiencia: { idTipoAudiencia: number; nombre: string; duracionEstimada: number; };
  idSalaAud?: { idSalaAud: number; nombreSala: string; capacidad: number; equipadaVideoconf: boolean; };
}
interface Asistencia {
  idAsistencia: number;
  rolEnAudiencia: string;
  asistio: boolean;
  horaIngreso?: string;
  motivoInasistencia?: string;
  idAudiencia: { idAudiencia: number; fechaHoraProgramada: string; idExpediente: { numeroExpediente: string; }; };
  idPersona: { idPersona: number; nombre: string; primerApellido: string; numeroDocumento: string; };
}
interface Acta {
  idActa: number;
  contenido: string;
  fechaActa: string;
  firmada: boolean;
  urlGrabacion?: string;
  idAudiencia: { idAudiencia: number; fechaHoraProgramada: string; idExpediente: { numeroExpediente: string; }; };
  usuario: { idUsuario: number; nombres: string; paterno: string; };
}

const fmt = (dt?: string) =>
  dt ? new Date(dt).toLocaleString("es-BO", { dateStyle: "short", timeStyle: "short" }) : "—";

// ─── ESTADO BADGE ────────────────────────────────────────
const ESTADO_STYLES: Record<string, string> = {
  PROGRAMADA:  "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  EN_CURSO:    "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  FINALIZADA:  "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400",
  SUSPENDIDA:  "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
};
const EstadoBadge = ({ estado }: { estado: string }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${ESTADO_STYLES[estado] ?? "bg-gray-100 dark:bg-slate-700 text-gray-600"}`}>
    {estado.replace("_", " ")}
  </span>
);

// ─── MODAL ───────────────────────────────────────────────
function Modal({ children, onClose, title, icon }: {
  children: React.ReactNode; onClose: () => void; title: string; icon?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            {icon}
            {title}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── FIELD ───────────────────────────────────────────────
const Field = ({ label, value, onChange, type = "text", placeholder = "", required = false }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
}) => (
  <div className="mb-4">
    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
    />
  </div>
);

const SelectField = ({ label, value, onChange, children, required = false }: {
  label: string; value: string | number; onChange: (v: string) => void;
  children: React.ReactNode; required?: boolean;
}) => (
  <div className="mb-4">
    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
    >
      {children}
    </select>
  </div>
);

const TextareaField = ({ label, value, onChange, rows = 3, required = false }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; required?: boolean;
}) => (
  <div className="mb-4">
    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <textarea
      value={value} rows={rows}
      onChange={e => onChange(e.target.value)}
      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-vertical"
    />
  </div>
);

const ErrorBox = ({ msg }: { msg: string }) =>
  msg ? (
    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 mb-4 text-sm text-red-600 dark:text-red-400">
      <AlertCircle className="w-4 h-4 shrink-0" />
      {msg}
    </div>
  ) : null;

const ModalFooter = ({ onCancel, onSave, saveLabel }: { onCancel: () => void; onSave: () => void; saveLabel: string; }) => (
  <div className="flex gap-3 justify-end pt-4">
    <button onClick={onCancel} className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium">
      Cancelar
    </button>
    <button onClick={onSave} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium text-sm shadow-md transition-all">
      {saveLabel}
    </button>
  </div>
);

// ─── STAT CARD ───────────────────────────────────────────
function StatCard({ label, value, icon, color, sub }: {
  label: string; value: number | string; icon: React.ReactNode; color: string; sub?: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
          <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${color.includes("blue") ? "bg-blue-100 dark:bg-blue-900/30" : color.includes("emerald") ? "bg-emerald-100 dark:bg-emerald-900/30" : color.includes("amber") ? "bg-amber-100 dark:bg-amber-900/30" : color.includes("purple") ? "bg-purple-100 dark:bg-purple-900/30" : "bg-gray-100 dark:bg-slate-700"}`}>
          {icon}
        </div>
      </div>
      {sub && (
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">{sub}</p>
        </div>
      )}
    </div>
  );
}

// ─── TABLA DESKTOP ────────────────────────────────────────
function TablaDesktop({ headers, children, loading, emptyMsg, emptyIcon }: {
  headers: string[]; children: React.ReactNode; loading: boolean; emptyMsg: string; emptyIcon?: React.ReactNode;
}) {
  return (
    <div className="hidden lg:block bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700">
            <tr>
              {headers.map(h => (
                <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i}>
                  {[...Array(headers.length)].map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse w-24" />
                    </td>
                  ))}
                </tr>
              ))
            ) : !children || (Array.isArray(children) && children.length === 0) ? (
              <tr>
                <td colSpan={headers.length} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    {emptyIcon ?? <Scale className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
                    <p>{emptyMsg}</p>
                  </div>
                </td>
              </tr>
            ) : children}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── ACTION BUTTONS ──────────────────────────────────────
const ActionBtns = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => (
  <div className="flex items-center justify-end gap-1">
    <button onClick={onEdit} className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors" title="Editar">
      <Edit className="w-4 h-4" />
    </button>
    <button onClick={onDelete} className="p-2 rounded-lg text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors" title="Eliminar">
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
);

// ─── MOBILE CARD AUDIENCIA ───────────────────────────────
function AudienciaCard({ a, onEdit, onDelete }: { a: Audiencia; onEdit: () => void; onDelete: () => void; }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-blue-500 dark:text-blue-400 font-bold">#{a.idExpediente.numeroExpediente}</span>
          <span className="text-xs text-gray-400 ml-2">{a.idExpediente.ano}</span>
          <p className="text-sm text-gray-700 dark:text-gray-200 font-medium mt-0.5">{a.idTipoAudiencia.nombre}</p>
        </div>
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
            <MoreVertical className="w-5 h-5 text-gray-500" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg z-10 py-1">
              <button onClick={onEdit} className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2">
                <Edit className="w-4 h-4" /> Editar
              </button>
              <button onClick={onDelete} className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Eliminar
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Calendar className="w-3.5 h-3.5" />
          {fmt(a.fechaHoraProgramada)}
        </div>
        {a.idSalaAud && (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <DoorOpen className="w-3.5 h-3.5" />
            {a.idSalaAud.nombreSala}
          </div>
        )}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
        <EstadoBadge estado={a.estadoAudiencia} />
        {a.linkVideoconferencia && (
          <a href={a.linkVideoconferencia} target="_blank" rel="noreferrer" className="text-blue-500 text-xs flex items-center gap-1">
            <Video className="w-3.5 h-3.5" /> Enlace
          </a>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// TAB: AUDIENCIAS
// ════════════════════════════════════════════════════════
function TabAudiencias() {
  const { data, loading, refetch } = useQuery(GET_AUDIENCIAS);
  const { data: dExp }  = useQuery(GET_EXPEDIENTES_SIMPLE);
  const { data: dTipo } = useQuery(GET_TIPOS_AUDIENCIA);
  const { data: dSala } = useQuery(GET_SALAS_AUDIENCIA);

  const [crearAudiencia]      = useMutation(CREAR_AUDIENCIA);
  const [actualizarAudiencia] = useMutation(ACTUALIZAR_AUDIENCIA);
  const [eliminarAudiencia]   = useMutation(ELIMINAR_AUDIENCIA);

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<Audiencia | null>(null);
  const [err, setErr]       = useState("");
  const [busqueda, setBusq] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const initForm = { idExpediente: 0, idTipoAudiencia: 0, idSalaAud: 0, fechaHoraProgramada: "", linkVideoconferencia: "", estadoAudiencia: "PROGRAMADA", motivoSuspension: "" };
  const [form, setForm] = useState(initForm);
  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const audiencias: Audiencia[] = data?.allAudiencias ?? [];
  const expedientes: Expediente[] = dExp?.allExpedientes ?? [];
  const tipos: TipoAudiencia[] = dTipo?.allTiposAudiencia ?? [];
  const salas: SalaAudiencia[] = dSala?.allSalasAudiencia ?? [];

  const filtradas = audiencias.filter(a =>
    `${a.idExpediente.numeroExpediente} ${a.estadoAudiencia} ${a.idTipoAudiencia.nombre}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalPages = Math.ceil(filtradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated  = filtradas.slice(startIndex, startIndex + itemsPerPage);

  const programadas = audiencias.filter(a => a.estadoAudiencia === "PROGRAMADA").length;
  const enCurso     = audiencias.filter(a => a.estadoAudiencia === "EN_CURSO").length;
  const finalizadas = audiencias.filter(a => a.estadoAudiencia === "FINALIZADA").length;
  const suspendidas = audiencias.filter(a => a.estadoAudiencia === "SUSPENDIDA").length;

  const abrirCrear = () => { setEdit(null); setForm(initForm); setErr(""); setModal(true); };
  const abrirEditar = (a: Audiencia) => {
    setEdit(a);
    setForm({
      idExpediente: a.idExpediente.idExpediente, idTipoAudiencia: a.idTipoAudiencia.idTipoAudiencia,
      idSalaAud: a.idSalaAud?.idSalaAud ?? 0, fechaHoraProgramada: a.fechaHoraProgramada?.slice(0, 16) ?? "",
      linkVideoconferencia: a.linkVideoconferencia ?? "", estadoAudiencia: a.estadoAudiencia,
      motivoSuspension: a.motivoSuspension ?? "",
    });
    setErr(""); setModal(true);
  };

  const guardar = async () => {
    if (!form.idExpediente || !form.idTipoAudiencia || !form.fechaHoraProgramada) {
      setErr("Expediente, tipo de audiencia y fecha son obligatorios."); return;
    }
    try {
      if (editando) {
        await actualizarAudiencia({ variables: { id: Number(editando.idAudiencia), input: {
          idTipoAudiencia: Number(form.idTipoAudiencia) || undefined,
          idSalaAud: Number(form.idSalaAud) || undefined,
          fechaHoraProgramada: form.fechaHoraProgramada,
          estadoAudiencia: form.estadoAudiencia || undefined,
          motivoSuspension: form.motivoSuspension || undefined,
          linkVideoconferencia: form.linkVideoconferencia || undefined,
        }}});
      } else {
        await crearAudiencia({ variables: { input: {
          idExpediente: Number(form.idExpediente),
          idTipoAudiencia: Number(form.idTipoAudiencia),
          fechaHoraProgramada: form.fechaHoraProgramada,
          idSalaAud: Number(form.idSalaAud) || undefined,
          linkVideoconferencia: form.linkVideoconferencia || undefined,
        }}});
      }
      await refetch(); setModal(false);
    } catch (e: any) { setErr(e.message ?? "Error al guardar."); }
  };

  const eliminar = async (a: Audiencia) => {
    if (!window.confirm(`¿Eliminar la audiencia del expediente #${a.idExpediente.numeroExpediente}?`)) return;
    const { data } = await eliminarAudiencia({ variables: { id: Number(a.idAudiencia) } });
    if (!data?.eliminarAudiencia?.ok) { alert(data?.eliminarAudiencia?.mensaje ?? "No se pudo eliminar."); return; }
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Programadas" value={programadas} color="text-blue-600 dark:text-blue-400"
          icon={<Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />} sub="Próximas a realizarse" />
        <StatCard label="En curso" value={enCurso} color="text-emerald-600 dark:text-emerald-400"
          icon={<CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />} sub="Activas ahora mismo" />
        <StatCard label="Finalizadas" value={finalizadas} color="text-gray-600 dark:text-gray-400"
          icon={<Circle className="w-6 h-6 text-gray-500 dark:text-gray-400" />} sub="Completadas" />
        <StatCard label="Suspendidas" value={suspendidas} color="text-amber-600 dark:text-amber-400"
          icon={<AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />} sub="Requieren reprogramación" />
      </div>

      {/* Buscador + botón */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="Buscar por expediente, tipo o estado..."
            value={busqueda} onChange={e => { setBusq(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
          />
        </div>
        <button onClick={abrirCrear} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]">
          <Plus className="w-4 h-4" /> Nueva audiencia
        </button>
      </div>

      {/* Tabla Desktop */}
      <TablaDesktop
        headers={["Expediente", "Tipo", "Fecha programada", "Sala", "Estado", "Link", "Acciones"]}
        loading={loading} emptyMsg="No hay audiencias registradas"
        emptyIcon={<Scale className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
      >
        {paginated.map(a => (
          <tr key={a.idAudiencia} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td className="px-6 py-4">
              <span className="font-bold text-blue-500 dark:text-blue-400">#{a.idExpediente.numeroExpediente}</span>
              <span className="text-xs text-gray-400 ml-2">{a.idExpediente.ano}</span>
            </td>
            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">{a.idTipoAudiencia.nombre}</td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">{fmt(a.fechaHoraProgramada)}</td>
            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
              {a.idSalaAud ? (
                <span className="flex items-center gap-1.5">
                  {a.idSalaAud.nombreSala}
                  {a.idSalaAud.equipadaVideoconf && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                      <Video className="w-3 h-3 inline" />
                    </span>
                  )}
                </span>
              ) : <span className="text-gray-400">—</span>}
            </td>
            <td className="px-6 py-4"><EstadoBadge estado={a.estadoAudiencia} /></td>
            <td className="px-6 py-4">
              {a.linkVideoconferencia
                ? <a href={a.linkVideoconferencia} target="_blank" rel="noreferrer" className="text-blue-500 text-xs flex items-center gap-1 hover:underline">
                    <Video className="w-3.5 h-3.5" /> Enlace
                  </a>
                : <span className="text-gray-400 text-sm">—</span>}
            </td>
            <td className="px-6 py-4"><ActionBtns onEdit={() => abrirEditar(a)} onDelete={() => eliminar(a)} /></td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Cards Móvil */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4 animate-pulse h-36" />
          ))
        ) : paginated.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Scale className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p>No se encontraron audiencias</p>
          </div>
        ) : paginated.map(a => (
          <AudienciaCard key={a.idAudiencia} a={a} onEdit={() => abrirEditar(a)} onDelete={() => eliminar(a)} />
        ))}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filtradas.length)} de {filtradas.length}
          </p>
          <div className="flex gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">Página {currentPage} de {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <Modal onClose={() => setModal(false)}
          title={editando ? "Editar audiencia" : "Nueva audiencia"}
          icon={<Scale className="w-5 h-5 text-blue-500" />}>
          {!editando && (
            <SelectField label="Expediente" value={form.idExpediente} onChange={f("idExpediente")} required>
              <option value={0}>— Seleccionar expediente —</option>
              {expedientes.map(e => <option key={e.idExpediente} value={e.idExpediente}>#{e.numeroExpediente} ({e.ano})</option>)}
            </SelectField>
          )}
          <SelectField label="Tipo de audiencia" value={form.idTipoAudiencia} onChange={f("idTipoAudiencia")} required>
            <option value={0}>— Seleccionar tipo —</option>
            {tipos.map(t => <option key={t.idTipoAudiencia} value={t.idTipoAudiencia}>{t.nombre} ({t.duracionEstimada} min)</option>)}
          </SelectField>
          <Field label="Fecha y hora programada" value={form.fechaHoraProgramada} onChange={f("fechaHoraProgramada")} type="datetime-local" required />
          <SelectField label="Sala de audiencia" value={form.idSalaAud} onChange={f("idSalaAud")}>
            <option value={0}>— Sin sala asignada —</option>
            {salas.filter(s => s.activa).map(s => <option key={s.idSalaAud} value={s.idSalaAud}>{s.nombreSala} (cap. {s.capacidad})</option>)}
          </SelectField>
          <Field label="Link videoconferencia" value={form.linkVideoconferencia} onChange={f("linkVideoconferencia")} placeholder="https://..." />
          {editando && (
            <>
              <SelectField label="Estado" value={form.estadoAudiencia} onChange={f("estadoAudiencia")}>
                <option value="PROGRAMADA">Programada</option>
                <option value="EN_CURSO">En curso</option>
                <option value="FINALIZADA">Finalizada</option>
                <option value="SUSPENDIDA">Suspendida</option>
              </SelectField>
              {form.estadoAudiencia === "SUSPENDIDA" && (
                <TextareaField label="Motivo de suspensión" value={form.motivoSuspension} onChange={f("motivoSuspension")} />
              )}
            </>
          )}
          <ErrorBox msg={err} />
          <ModalFooter onCancel={() => setModal(false)} onSave={guardar} saveLabel={editando ? "Guardar cambios" : "Crear audiencia"} />
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// TAB: TIPOS DE AUDIENCIA
// ════════════════════════════════════════════════════════
function TabTiposAudiencia() {
  const { data, loading, refetch } = useQuery(GET_TIPOS_AUDIENCIA);
  const { data: dTipoProc } = useQuery(GET_TIPOS_PROCESO_SIMPLE);
  const [crearTipo]    = useMutation(CREAR_TIPO_AUDIENCIA);
  const [eliminarTipo] = useMutation(ELIMINAR_TIPO_AUDIENCIA);

  const [modal, setModal] = useState(false);
  const [err, setErr]     = useState("");
  const [form, setForm]   = useState({ nombre: "", duracionEstimada: "", idTipoProceso: 0, descripcion: "" });
  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const tipos: TipoAudiencia[] = data?.allTiposAudiencia ?? [];
  const tiposProceso           = dTipoProc?.allTiposProceso ?? [];

  const guardar = async () => {
    if (!form.nombre || !form.duracionEstimada || !form.idTipoProceso) {
      setErr("Nombre, duración y tipo de proceso son obligatorios."); return;
    }
    try {
      await crearTipo({ variables: { nombre: form.nombre, duracionEstimada: Number(form.duracionEstimada), idTipoProceso: Number(form.idTipoProceso), descripcion: form.descripcion || undefined } });
      await refetch(); setModal(false); setForm({ nombre: "", duracionEstimada: "", idTipoProceso: 0, descripcion: "" });
    } catch (e: any) { setErr(e.message ?? "Error."); }
  };

  const eliminar = async (t: TipoAudiencia) => {
    if (!window.confirm(`¿Eliminar el tipo "${t.nombre}"?`)) return;
    const { data } = await eliminarTipo({ variables: { id: Number(t.idTipoAudiencia) } });
    if (!data?.eliminarTipoAudiencia?.ok) { alert(data?.eliminarTipoAudiencia?.mensaje ?? "No se pudo eliminar."); return; }
    refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">{tipos.length} tipo{tipos.length !== 1 ? "s" : ""} registrados</p>
        <button onClick={() => { setErr(""); setModal(true); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]">
          <Plus className="w-4 h-4" /> Nuevo tipo
        </button>
      </div>

      <TablaDesktop
        headers={["Nombre", "Duración", "Tipo de proceso", "Descripción", "Acciones"]}
        loading={loading} emptyMsg="No hay tipos de audiencia" emptyIcon={<ClipboardList className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
      >
        {tipos.map(t => (
          <tr key={t.idTipoAudiencia} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td className="px-6 py-4 font-semibold text-gray-800 dark:text-white">{t.nombre}</td>
            <td className="px-6 py-4">
              <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                <Clock className="w-3.5 h-3.5 text-gray-400" /> {t.duracionEstimada} min
              </span>
            </td>
            <td className="px-6 py-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                {t.idTipoProceso.nombre}
              </span>
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{t.descripcion ?? "—"}</td>
            <td className="px-6 py-4">
              <button onClick={() => eliminar(t)} className="p-2 rounded-lg text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Cards móvil */}
      <div className="lg:hidden space-y-3">
        {tipos.map(t => (
          <div key={t.idTipoAudiencia} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-gray-800 dark:text-white">{t.nombre}</p>
                <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {t.duracionEstimada} min</p>
              </div>
              <button onClick={() => eliminar(t)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                {t.idTipoProceso.nombre}
              </span>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal onClose={() => setModal(false)} title="Nuevo tipo de audiencia" icon={<ClipboardList className="w-5 h-5 text-blue-500" />}>
          <Field label="Nombre" value={form.nombre} onChange={f("nombre")} required />
          <Field label="Duración estimada (minutos)" value={form.duracionEstimada} onChange={f("duracionEstimada")} type="number" required />
          <SelectField label="Tipo de proceso" value={form.idTipoProceso} onChange={f("idTipoProceso")} required>
            <option value={0}>— Seleccionar —</option>
            {tiposProceso.map((tp: any) => <option key={tp.idTipoProceso} value={tp.idTipoProceso}>{tp.nombre}</option>)}
          </SelectField>
          <TextareaField label="Descripción" value={form.descripcion} onChange={f("descripcion")} />
          <ErrorBox msg={err} />
          <ModalFooter onCancel={() => setModal(false)} onSave={guardar} saveLabel="Crear tipo" />
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// TAB: SALAS DE AUDIENCIA
// ════════════════════════════════════════════════════════
function TabSalasAudiencia() {
  const { data, loading, refetch } = useQuery(GET_SALAS_AUDIENCIA);
  const { data: dTrib }            = useQuery(GET_TRIBUNALES_SIMPLE);
  const [crearSala]      = useMutation(CREAR_SALA_AUDIENCIA);
  const [actualizarSala] = useMutation(ACTUALIZAR_SALA_AUDIENCIA);
  const [eliminarSala]   = useMutation(ELIMINAR_SALA_AUDIENCIA);

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<SalaAudiencia | null>(null);
  const [err, setErr]       = useState("");
  const initForm = { idTribunal: 0, nombreSala: "", capacidad: "", equipadaVideoconf: false, enlaceVirtual: "", activa: true };
  const [form, setForm] = useState(initForm);
  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const salas: SalaAudiencia[] = data?.allSalasAudiencia ?? [];
  const tribunales              = dTrib?.allTribunales ?? [];

  const activas   = salas.filter(s => s.activa).length;
  const videoconf = salas.filter(s => s.equipadaVideoconf).length;

  const abrirCrear = () => { setEdit(null); setForm(initForm); setErr(""); setModal(true); };
  const abrirEditar = (s: SalaAudiencia) => {
    setEdit(s);
    setForm({ idTribunal: s.idTribunal.idTribunal, nombreSala: s.nombreSala, capacidad: String(s.capacidad), equipadaVideoconf: s.equipadaVideoconf, enlaceVirtual: s.enlaceVirtual ?? "", activa: s.activa });
    setErr(""); setModal(true);
  };

  const guardar = async () => {
    if (!form.nombreSala || !form.capacidad) { setErr("Nombre y capacidad son obligatorios."); return; }
    try {
      if (editando) {
        await actualizarSala({ variables: { id: Number(editando.idSalaAud), input: { nombreSala: form.nombreSala, capacidad: Number(form.capacidad), equipadaVideoconf: form.equipadaVideoconf, enlaceVirtual: form.enlaceVirtual || undefined, activa: form.activa } } });
      } else {
        if (!form.idTribunal) { setErr("El tribunal es obligatorio."); return; }
        await crearSala({ variables: { idTribunal: Number(form.idTribunal), nombreSala: form.nombreSala, capacidad: Number(form.capacidad), equipadaVideoconf: form.equipadaVideoconf, enlaceVirtual: form.enlaceVirtual || undefined, activa: form.activa } });
      }
      await refetch(); setModal(false);
    } catch (e: any) { setErr(e.message ?? "Error."); }
  };

  const eliminar = async (s: SalaAudiencia) => {
    if (!window.confirm(`¿Eliminar la sala "${s.nombreSala}"?`)) return;
    const { data } = await eliminarSala({ variables: { id: Number(s.idSalaAud) } });
    if (!data?.eliminarSalaAudiencia?.ok) { alert(data?.eliminarSalaAudiencia?.mensaje ?? "No se pudo eliminar."); return; }
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total salas" value={salas.length} color="text-blue-600 dark:text-blue-400"
          icon={<DoorOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />} sub="Registradas en el sistema" />
        <StatCard label="Salas activas" value={activas} color="text-emerald-600 dark:text-emerald-400"
          icon={<CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />} sub={`${salas.length - activas} inactiva${salas.length - activas !== 1 ? "s" : ""}`} />
        <StatCard label="Con videoconf." value={videoconf} color="text-purple-600 dark:text-purple-400"
          icon={<Video className="w-6 h-6 text-purple-600 dark:text-purple-400" />} sub="Equipadas para sesiones remotas" />
      </div>

      <div className="flex justify-end">
        <button onClick={abrirCrear} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]">
          <Plus className="w-4 h-4" /> Nueva sala
        </button>
      </div>

      <TablaDesktop
        headers={["Nombre", "Tribunal", "Capacidad", "Videoconf.", "Enlace virtual", "Estado", "Acciones"]}
        loading={loading} emptyMsg="No hay salas de audiencia" emptyIcon={<DoorOpen className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
      >
        {salas.map(s => (
          <tr key={s.idSalaAud} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td className="px-6 py-4 font-semibold text-gray-800 dark:text-white">{s.nombreSala}</td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{s.idTribunal.nombreTribunal}</td>
            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">{s.capacidad} personas</td>
            <td className="px-6 py-4">
              <span className={`text-sm font-medium ${s.equipadaVideoconf ? "text-purple-600 dark:text-purple-400" : "text-gray-400"}`}>
                {s.equipadaVideoconf ? "✓ Sí" : "✗ No"}
              </span>
            </td>
            <td className="px-6 py-4">
              {s.enlaceVirtual
                ? <a href={s.enlaceVirtual} target="_blank" rel="noreferrer" className="text-blue-500 text-xs flex items-center gap-1 hover:underline"><Video className="w-3.5 h-3.5" /> Enlace</a>
                : <span className="text-gray-400 text-sm">—</span>}
            </td>
            <td className="px-6 py-4">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.activa ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"}`}>
                {s.activa ? <CheckCircle className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                {s.activa ? "Activa" : "Inactiva"}
              </span>
            </td>
            <td className="px-6 py-4"><ActionBtns onEdit={() => abrirEditar(s)} onDelete={() => eliminar(s)} /></td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Cards móvil */}
      <div className="lg:hidden space-y-3">
        {salas.map(s => (
          <div key={s.idSalaAud} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-semibold text-gray-800 dark:text-white">{s.nombreSala}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.idTribunal.nombreTribunal}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => abrirEditar(s)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"><Edit className="w-4 h-4" /></button>
                <button onClick={() => eliminar(s)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${s.equipadaVideoconf ? "text-purple-600 dark:text-purple-400" : "text-gray-400"}`}>
                {s.equipadaVideoconf ? "📹 Videoconf." : "Sin videoconf."}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.activa ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"}`}>
                {s.activa ? "Activa" : "Inactiva"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal onClose={() => setModal(false)} title={editando ? "Editar sala" : "Nueva sala de audiencia"} icon={<DoorOpen className="w-5 h-5 text-blue-500" />}>
          {!editando && (
            <SelectField label="Tribunal" value={form.idTribunal} onChange={f("idTribunal")} required>
              <option value={0}>— Seleccionar tribunal —</option>
              {tribunales.map((t: any) => <option key={t.idTribunal} value={t.idTribunal}>{t.nombreTribunal}</option>)}
            </SelectField>
          )}
          <Field label="Nombre de la sala" value={form.nombreSala} onChange={f("nombreSala")} required />
          <Field label="Capacidad (personas)" value={form.capacidad} onChange={f("capacidad")} type="number" required />
          <Field label="Enlace virtual" value={form.enlaceVirtual} onChange={f("enlaceVirtual")} placeholder="https://..." />
          <div className="mb-4 flex gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
              <input type="checkbox" checked={form.equipadaVideoconf} onChange={e => setForm(p => ({ ...p, equipadaVideoconf: e.target.checked }))} className="rounded" />
              Equipada para videoconferencia
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
              <input type="checkbox" checked={form.activa} onChange={e => setForm(p => ({ ...p, activa: e.target.checked }))} className="rounded" />
              Activa
            </label>
          </div>
          <ErrorBox msg={err} />
          <ModalFooter onCancel={() => setModal(false)} onSave={guardar} saveLabel={editando ? "Guardar cambios" : "Crear sala"} />
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// TAB: ASISTENCIAS
// ════════════════════════════════════════════════════════
function TabAsistencias() {
  const { data, loading, refetch } = useQuery(GET_ASISTENCIAS);
  const { data: dAud }  = useQuery(GET_AUDIENCIAS);
  const { data: dPers } = useQuery(GET_PERSONAS_SIMPLE);
  const [registrar]  = useMutation(REGISTRAR_ASISTENCIA);
  const [actualizar] = useMutation(ACTUALIZAR_ASISTENCIA);
  const [eliminarAs] = useMutation(ELIMINAR_ASISTENCIA);

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<Asistencia | null>(null);
  const [err, setErr]       = useState("");
  const initForm = { idAudiencia: 0, idPersona: 0, rolEnAudiencia: "", asistio: true, motivoInasistencia: "" };
  const [form, setForm] = useState(initForm);
  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const asistencias: Asistencia[] = data?.allAsistencias ?? [];
  const audiencias = dAud?.allAudiencias ?? [];
  const personas   = dPers?.allPersonas ?? [];

  const asistieron    = asistencias.filter(a => a.asistio).length;
  const noAsistieron  = asistencias.filter(a => !a.asistio).length;

  const abrirCrear = () => { setEdit(null); setForm(initForm); setErr(""); setModal(true); };
  const abrirEditar = (a: Asistencia) => {
    setEdit(a);
    setForm({ idAudiencia: a.idAudiencia.idAudiencia, idPersona: a.idPersona.idPersona, rolEnAudiencia: a.rolEnAudiencia, asistio: a.asistio, motivoInasistencia: a.motivoInasistencia ?? "" });
    setErr(""); setModal(true);
  };

  const guardar = async () => {
    try {
      if (editando) {
        await actualizar({ variables: { id: Number(editando.idAsistencia), input: { asistio: form.asistio, motivoInasistencia: form.motivoInasistencia || undefined } } });
      } else {
        if (!form.idAudiencia || !form.idPersona || !form.rolEnAudiencia) { setErr("Audiencia, persona y rol son obligatorios."); return; }
        await registrar({ variables: { idAudiencia: Number(form.idAudiencia), idPersona: Number(form.idPersona), rolEnAudiencia: form.rolEnAudiencia, asistio: form.asistio } });
      }
      await refetch(); setModal(false);
    } catch (e: any) { setErr(e.message ?? "Error."); }
  };

  const eliminar = async (a: Asistencia) => {
    if (!window.confirm(`¿Eliminar el registro de ${a.idPersona.nombre} ${a.idPersona.primerApellido}?`)) return;
    const { data } = await eliminarAs({ variables: { id: Number(a.idAsistencia) } });
    if (!data?.eliminarAsistencia?.ok) { alert(data?.eliminarAsistencia?.mensaje ?? "No se pudo eliminar."); return; }
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total registros" value={asistencias.length} color="text-blue-600 dark:text-blue-400"
          icon={<Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />} sub="Participantes registrados" />
        <StatCard label="Asistieron" value={asistieron} color="text-emerald-600 dark:text-emerald-400"
          icon={<CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />} sub={`${Math.round((asistieron / (asistencias.length || 1)) * 100)}% del total`} />
        <StatCard label="Inasistencias" value={noAsistieron} color="text-red-600 dark:text-red-400"
          icon={<Circle className="w-6 h-6 text-red-600 dark:text-red-400" />} sub={`${Math.round((noAsistieron / (asistencias.length || 1)) * 100)}% del total`} />
      </div>

      <div className="flex justify-end">
        <button onClick={abrirCrear} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]">
          <Plus className="w-4 h-4" /> Registrar asistencia
        </button>
      </div>

      <TablaDesktop
        headers={["Persona", "Audiencia", "Rol", "Asistió", "Hora ingreso", "Acciones"]}
        loading={loading} emptyMsg="No hay registros de asistencia" emptyIcon={<Users className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
      >
        {asistencias.map(a => (
          <tr key={a.idAsistencia} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {a.idPersona.nombre.charAt(0)}{a.idPersona.primerApellido.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white text-sm">{a.idPersona.nombre} {a.idPersona.primerApellido}</p>
                  <p className="text-xs text-gray-400 font-mono">{a.idPersona.numeroDocumento}</p>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="text-blue-500 font-medium">#{a.idAudiencia.idExpediente.numeroExpediente}</span>
              <div className="text-xs mt-0.5">{fmt(a.idAudiencia.fechaHoraProgramada)}</div>
            </td>
            <td className="px-6 py-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                {a.rolEnAudiencia}
              </span>
            </td>
            <td className="px-6 py-4">
              <span className={`font-semibold text-sm ${a.asistio ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                {a.asistio ? "✓ Sí" : "✗ No"}
              </span>
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">{a.horaIngreso ? fmt(a.horaIngreso) : "—"}</td>
            <td className="px-6 py-4"><ActionBtns onEdit={() => abrirEditar(a)} onDelete={() => eliminar(a)} /></td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Cards móvil */}
      <div className="lg:hidden space-y-3">
        {asistencias.map(a => (
          <div key={a.idAsistencia} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {a.idPersona.nombre.charAt(0)}{a.idPersona.primerApellido.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white text-sm">{a.idPersona.nombre} {a.idPersona.primerApellido}</p>
                  <p className="text-xs text-gray-400">{a.rolEnAudiencia}</p>
                </div>
              </div>
              <span className={`font-bold text-sm ${a.asistio ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                {a.asistio ? "✓" : "✗"}
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center">
              <span className="text-xs text-blue-500">#{a.idAudiencia.idExpediente.numeroExpediente}</span>
              <div className="flex gap-1">
                <button onClick={() => abrirEditar(a)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30"><Edit className="w-4 h-4" /></button>
                <button onClick={() => eliminar(a)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal onClose={() => setModal(false)} title={editando ? "Editar asistencia" : "Registrar asistencia"} icon={<Users className="w-5 h-5 text-blue-500" />}>
          {!editando && (
            <>
              <SelectField label="Audiencia" value={form.idAudiencia} onChange={f("idAudiencia")} required>
                <option value={0}>— Seleccionar audiencia —</option>
                {audiencias.map((a: any) => (
                  <option key={a.idAudiencia} value={a.idAudiencia}>#{a.idExpediente.numeroExpediente} — {fmt(a.fechaHoraProgramada)}</option>
                ))}
              </SelectField>
              <SelectField label="Persona" value={form.idPersona} onChange={f("idPersona")} required>
                <option value={0}>— Seleccionar persona —</option>
                {personas.map((p: any) => (
                  <option key={p.idPersona} value={p.idPersona}>{p.nombre} {p.primerApellido} — {p.numeroDocumento}</option>
                ))}
              </SelectField>
              <Field label="Rol en audiencia" value={form.rolEnAudiencia} onChange={f("rolEnAudiencia")} placeholder="Ej: Demandante, Abogado defensor..." required />
            </>
          )}
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
              <input type="checkbox" checked={form.asistio} onChange={e => setForm(p => ({ ...p, asistio: e.target.checked }))} className="rounded" />
              Asistió a la audiencia
            </label>
          </div>
          {!form.asistio && (
            <TextareaField label="Motivo de inasistencia" value={form.motivoInasistencia} onChange={f("motivoInasistencia")} />
          )}
          <ErrorBox msg={err} />
          <ModalFooter onCancel={() => setModal(false)} onSave={guardar} saveLabel={editando ? "Guardar" : "Registrar"} />
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// TAB: ACTAS
// ════════════════════════════════════════════════════════
function TabActas() {
  const { data, loading, refetch } = useQuery(GET_ACTAS);
  const { data: dAud } = useQuery(GET_AUDIENCIAS);
  const { data: dUsu } = useQuery(GET_USUARIOS_SIMPLE);
  const [crearActa]    = useMutation(CREAR_ACTA);
  const [actualizarAc] = useMutation(ACTUALIZAR_ACTA);
  const [eliminarAc]   = useMutation(ELIMINAR_ACTA);

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<Acta | null>(null);
  const [err, setErr]       = useState("");
  const initForm = { idAudiencia: 0, idUsuario: 0, contenido: "", firmada: false, urlGrabacion: "" };
  const [form, setForm] = useState(initForm);
  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const actas: Acta[] = data?.allActas ?? [];
  const audiencias    = dAud?.allAudiencias ?? [];
  const usuarios      = dUsu?.allUsuarios ?? [];

  const firmadas   = actas.filter(a => a.firmada).length;
  const pendientes = actas.filter(a => !a.firmada).length;

  const abrirCrear = () => { setEdit(null); setForm(initForm); setErr(""); setModal(true); };
  const abrirEditar = (a: Acta) => {
    setEdit(a);
    setForm({ idAudiencia: a.idAudiencia.idAudiencia, idUsuario: a.usuario.idUsuario, contenido: a.contenido, firmada: a.firmada, urlGrabacion: a.urlGrabacion ?? "" });
    setErr(""); setModal(true);
  };

  const guardar = async () => {
    if (!form.contenido) { setErr("El contenido del acta es obligatorio."); return; }
    try {
      if (editando) {
        await actualizarAc({ variables: { id: Number(editando.idActa), input: { contenido: form.contenido, firmada: form.firmada, urlGrabacion: form.urlGrabacion || undefined } } });
      } else {
        if (!form.idAudiencia || !form.idUsuario) { setErr("Audiencia y usuario son obligatorios."); return; }
        await crearActa({ variables: { idAudiencia: Number(form.idAudiencia), idUsuario: Number(form.idUsuario), contenido: form.contenido, firmada: form.firmada } });
      }
      await refetch(); setModal(false);
    } catch (e: any) { setErr(e.message ?? "Error."); }
  };

  const eliminar = async (a: Acta) => {
    if (!window.confirm(`¿Eliminar el acta del expediente #${a.idAudiencia.idExpediente.numeroExpediente}?`)) return;
    const { data } = await eliminarAc({ variables: { id: Number(a.idActa) } });
    if (!data?.eliminarActa?.ok) { alert(data?.eliminarActa?.mensaje ?? "No se pudo eliminar."); return; }
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total actas" value={actas.length} color="text-blue-600 dark:text-blue-400"
          icon={<FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />} sub="Registradas en el sistema" />
        <StatCard label="Firmadas" value={firmadas} color="text-emerald-600 dark:text-emerald-400"
          icon={<CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />} sub={`${Math.round((firmadas / (actas.length || 1)) * 100)}% del total`} />
        <StatCard label="Pendientes" value={pendientes} color="text-amber-600 dark:text-amber-400"
          icon={<AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />} sub="Esperando firma" />
      </div>

      <div className="flex justify-end">
        <button onClick={abrirCrear} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]">
          <Plus className="w-4 h-4" /> Nueva acta
        </button>
      </div>

      <TablaDesktop
        headers={["Expediente", "Fecha acta", "Registrado por", "Firmada", "Grabación", "Acciones"]}
        loading={loading} emptyMsg="No hay actas registradas" emptyIcon={<FileText className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
      >
        {actas.map(a => (
          <tr key={a.idActa} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td className="px-6 py-4">
              <span className="text-blue-500 font-bold">#{a.idAudiencia.idExpediente.numeroExpediente}</span>
              <div className="text-xs text-gray-400 mt-0.5">{fmt(a.idAudiencia.fechaHoraProgramada)}</div>
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">{fmt(a.fechaActa)}</td>
            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">{a.usuario.nombres} {a.usuario.paterno}</td>
            <td className="px-6 py-4">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${a.firmada ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"}`}>
                {a.firmada ? <><CheckCircle className="w-3 h-3" /> Firmada</> : <><AlertCircle className="w-3 h-3" /> Pendiente</>}
              </span>
            </td>
            <td className="px-6 py-4">
              {a.urlGrabacion
                ? <a href={a.urlGrabacion} target="_blank" rel="noreferrer" className="text-blue-500 text-xs flex items-center gap-1 hover:underline"><Mic className="w-3.5 h-3.5" /> Ver</a>
                : <span className="text-gray-400 text-sm">—</span>}
            </td>
            <td className="px-6 py-4"><ActionBtns onEdit={() => abrirEditar(a)} onDelete={() => eliminar(a)} /></td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Cards móvil */}
      <div className="lg:hidden space-y-3">
        {actas.map(a => (
          <div key={a.idActa} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-blue-500 font-bold">#{a.idAudiencia.idExpediente.numeroExpediente}</span>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{a.usuario.nombres} {a.usuario.paterno}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => abrirEditar(a)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30"><Edit className="w-4 h-4" /></button>
                <button onClick={() => eliminar(a)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${a.firmada ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"}`}>
                {a.firmada ? "✓ Firmada" : "⏳ Pendiente"}
              </span>
              <span className="text-xs text-gray-400">{fmt(a.fechaActa)}</span>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal onClose={() => setModal(false)} title={editando ? "Editar acta" : "Nueva acta de audiencia"} icon={<FileText className="w-5 h-5 text-blue-500" />}>
          {!editando && (
            <>
              <SelectField label="Audiencia" value={form.idAudiencia} onChange={f("idAudiencia")} required>
                <option value={0}>— Seleccionar audiencia —</option>
                {audiencias.map((a: any) => (
                  <option key={a.idAudiencia} value={a.idAudiencia}>#{a.idExpediente.numeroExpediente} — {fmt(a.fechaHoraProgramada)}</option>
                ))}
              </SelectField>
              <SelectField label="Usuario responsable" value={form.idUsuario} onChange={f("idUsuario")} required>
                <option value={0}>— Seleccionar usuario —</option>
                {usuarios.map((u: any) => <option key={u.idUsuario} value={u.idUsuario}>{u.nombres} {u.paterno}</option>)}
              </SelectField>
            </>
          )}
          <TextareaField label="Contenido del acta" value={form.contenido} onChange={f("contenido")} rows={6} required />
          <Field label="URL de grabación" value={form.urlGrabacion} onChange={f("urlGrabacion")} placeholder="https://..." />
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
              <input type="checkbox" checked={form.firmada} onChange={e => setForm(p => ({ ...p, firmada: e.target.checked }))} className="rounded" />
              Acta firmada
            </label>
          </div>
          <ErrorBox msg={err} />
          <ModalFooter onCancel={() => setModal(false)} onSave={guardar} saveLabel={editando ? "Guardar cambios" : "Crear acta"} />
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// TABS CONFIG
// ════════════════════════════════════════════════════════
const TABS = [
  { id: "audiencias",  label: "Audiencias",         Icon: Scale },
  { id: "tipos",       label: "Tipos",              Icon: ClipboardList },
  { id: "salas",       label: "Salas",              Icon: DoorOpen },
  { id: "asistencias", label: "Asistencias",        Icon: Users },
  { id: "actas",       label: "Actas",              Icon: FileText },
];

// ════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════
export default function AudienciasPage() {
  const [tabActiva, setTab] = useState("audiencias");

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Scale className="w-7 h-7 text-blue-500" />
          Audiencias
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Gestión de audiencias, tipos, salas, asistencias y actas
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-slate-700 overflow-x-auto">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all -mb-px ${
              tabActiva === id
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {tabActiva === "audiencias"  && <TabAudiencias />}
      {tabActiva === "tipos"       && <TabTiposAudiencia />}
      {tabActiva === "salas"       && <TabSalasAudiencia />}
      {tabActiva === "asistencias" && <TabAsistencias />}
      {tabActiva === "actas"       && <TabActas />}
    </div>
  );
}