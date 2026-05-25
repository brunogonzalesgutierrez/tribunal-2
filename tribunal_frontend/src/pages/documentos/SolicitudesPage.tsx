import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_SOLICITUDES,
  GET_USUARIOS_SIMPLE,
  CREAR_SOLICITUD,
  ELIMINAR_SOLICITUD,
} from "../../graphql/solicitudes";
import {
  ClipboardList, Plus, Eye, Trash2, Clock, CheckCircle, XCircle, X, AlertCircle,
} from "lucide-react";

// ════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════

interface Usuario {
  idUsuario: number;
  nombres: string;
  paterno: string;
  email: string;
  activo: boolean;
}

interface Solicitud {
  idSolicitud: number;
  codigoIanus: string;
  codigoSala: string;
  estadoSolicitud: string;
  fechaSolicitud: string;
  fechaConfirmacion?: string;
  observacion?: string;
  usuario: Usuario;
}

type FiltroEstado = "TODOS" | "PENDIENTE" | "APROBADA" | "RECHAZADA";

// ════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════

const fmtFecha = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("es-BO", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "—";

const fmtFechaHora = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString("es-BO", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—";

// ════════════════════════════════════════════════════════
// BADGES
// ════════════════════════════════════════════════════════

const ESTADO_STYLES: Record<string, string> = {
  PENDIENTE:  "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  APROBADA:   "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  RECHAZADA:  "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
};

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  APROBADA:  "Aprobada",
  RECHAZADA: "Rechazada",
};

const EstadoBadge = ({ estado }: { estado: string }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
    ESTADO_STYLES[estado] ?? "bg-gray-100 dark:bg-slate-700 text-gray-600"
  }`}>
    {ESTADO_LABELS[estado] ?? estado}
  </span>
);

// ════════════════════════════════════════════════════════
// STAT CARD
// ════════════════════════════════════════════════════════

function StatCard({
  label, value, icon, color, sub,
}: {
  label: string; value: number; icon: React.ReactNode; color: string; sub?: string;
}) {
  const bgMap: Record<string, string> = {
    blue:    "bg-blue-100 dark:bg-blue-900/30",
    emerald: "bg-emerald-100 dark:bg-emerald-900/30",
    amber:   "bg-amber-100 dark:bg-amber-900/30",
    red:     "bg-red-100 dark:bg-red-900/30",
  };
  const key = Object.keys(bgMap).find(k => color.includes(k)) ?? "blue";
  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
          <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${bgMap[key]}`}>
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

// ════════════════════════════════════════════════════════
// MODAL BASE
// ════════════════════════════════════════════════════════

function Modal({
  children, onClose, title, icon,
}: {
  children: React.ReactNode; onClose: () => void; title: string; icon?: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            {icon}{title}
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

// ════════════════════════════════════════════════════════
// CAMPOS
// ════════════════════════════════════════════════════════

const Field = ({
  label, value, onChange, type = "text", placeholder = "", required = false, readOnly = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; readOnly?: boolean;
}) => (
  <div className="mb-4">
    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type} value={value} placeholder={placeholder} readOnly={readOnly}
      onChange={e => onChange(e.target.value)}
      className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all outline-none ${
        readOnly
          ? "bg-gray-100 dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-400 cursor-not-allowed"
          : "bg-gray-50 dark:bg-slate-900/60 border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      }`}
    />
  </div>
);

const SelectField = ({
  label, value, onChange, children, required = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
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

const TextareaField = ({
  label, value, onChange, placeholder = "",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) => (
  <div className="mb-4">
    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{label}</label>
    <textarea
      value={value} placeholder={placeholder} rows={3}
      onChange={e => onChange(e.target.value)}
      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-vertical"
    />
  </div>
);

const ErrorBox = ({ msg }: { msg: string }) =>
  msg ? (
    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 mb-4 text-sm text-red-600 dark:text-red-400">
      <AlertCircle className="w-4 h-4 shrink-0" />{msg}
    </div>
  ) : null;

// ════════════════════════════════════════════════════════
// MODAL DETALLE (solo lectura)
// ════════════════════════════════════════════════════════

function DetalleModal({ solicitud, onClose }: { solicitud: Solicitud; onClose: () => void }) {
  return (
    <Modal
      onClose={onClose}
      title={`Solicitud #${solicitud.idSolicitud}`}
      icon={<ClipboardList className="w-5 h-5 text-blue-500" />}
    >
      {/* Estado */}
      <div className="flex justify-end mb-4">
        <EstadoBadge estado={solicitud.estadoSolicitud} />
      </div>

      {/* Códigos */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 dark:bg-slate-900/60 rounded-xl border border-gray-200 dark:border-slate-700 p-3">
          <p className="text-xs text-gray-400 mb-1">Código IANUS</p>
          <p className="font-mono font-bold text-blue-500 text-sm">{solicitud.codigoIanus}</p>
        </div>
        <div className="bg-gray-50 dark:bg-slate-900/60 rounded-xl border border-gray-200 dark:border-slate-700 p-3">
          <p className="text-xs text-gray-400 mb-1">Código de sala</p>
          <p className="font-mono font-bold text-blue-500 text-sm">{solicitud.codigoSala}</p>
        </div>
      </div>

      {/* Usuario */}
      <div className="bg-gray-50 dark:bg-slate-900/60 rounded-xl border border-gray-200 dark:border-slate-700 p-3 mb-4">
        <p className="text-xs text-gray-400 mb-1">Usuario solicitante</p>
        <p className="font-semibold text-gray-800 dark:text-white text-sm">
          {solicitud.usuario.nombres} {solicitud.usuario.paterno}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{solicitud.usuario.email}</p>
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-xs text-gray-400 mb-1">Fecha de solicitud</p>
          <p className="text-sm text-gray-700 dark:text-gray-200">{fmtFechaHora(solicitud.fechaSolicitud)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Fecha de confirmación</p>
          <p className="text-sm text-gray-700 dark:text-gray-200">{fmtFechaHora(solicitud.fechaConfirmacion)}</p>
        </div>
      </div>

      {/* Observación */}
      {solicitud.observacion && (
        <div className="bg-gray-50 dark:bg-slate-900/60 rounded-xl border border-gray-200 dark:border-slate-700 p-3 mb-4">
          <p className="text-xs text-gray-400 mb-1">Observación</p>
          <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{solicitud.observacion}</p>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
        >
          Cerrar
        </button>
      </div>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════
// MODAL NUEVA SOLICITUD
// ════════════════════════════════════════════════════════

const initForm = { idUsuario: "", codigoIanus: "", codigoSala: "", observacion: "" };

function NuevaSolicitudModal({
  usuarios, onClose, onGuardado,
}: {
  usuarios: Usuario[]; onClose: () => void; onGuardado: () => void;
}) {
  const [form, setForm]   = useState(initForm);
  const [err, setErr]     = useState("");
  const [crearSolicitud]  = useMutation(CREAR_SOLICITUD);

  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const guardar = async () => {
    if (!form.idUsuario || !form.codigoIanus || !form.codigoSala) {
      setErr("Usuario, código IANUS y código de sala son obligatorios."); return;
    }
    try {
      await crearSolicitud({
        variables: {
          idUsuario:   Number(form.idUsuario),
          codigoIanus: form.codigoIanus,
          codigoSala:  form.codigoSala,
          observacion: form.observacion || undefined,
        },
      });
      onGuardado();
    } catch (e: any) { setErr(e.message ?? "Error al guardar."); }
  };

  return (
    <Modal
      onClose={onClose}
      title="Nueva solicitud de actualización"
      icon={<ClipboardList className="w-5 h-5 text-blue-500" />}
    >
      <SelectField label="Usuario solicitante" value={form.idUsuario} onChange={f("idUsuario")} required>
        <option value="">— Seleccionar usuario —</option>
        {usuarios.filter(u => u.activo).map(u => (
          <option key={u.idUsuario} value={u.idUsuario}>
            {u.nombres} {u.paterno} — {u.email}
          </option>
        ))}
      </SelectField>
      <Field label="Código IANUS"   value={form.codigoIanus} onChange={f("codigoIanus")} required placeholder="ej: IANUS-2024-001" />
      <Field label="Código de sala" value={form.codigoSala}  onChange={f("codigoSala")}  required placeholder="ej: SALA-A1" />
      <TextareaField label="Observación" value={form.observacion} onChange={f("observacion")} placeholder="Descripción opcional de la solicitud..." />
      <ErrorBox msg={err} />
      <div className="flex gap-3 justify-end pt-2">
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
        >
          Cancelar
        </button>
        <button
          onClick={guardar}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium text-sm shadow-md transition-all"
        >
          Crear solicitud
        </button>
      </div>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════

const FILTROS: { id: FiltroEstado; label: string }[] = [
  { id: "TODOS",     label: "Todos" },
  { id: "PENDIENTE", label: "Pendientes" },
  { id: "APROBADA",  label: "Aprobadas" },
  { id: "RECHAZADA", label: "Rechazadas" },
];

export default function SolicitudesPage() {
  const [modalNuevo, setModalNuevo]             = useState(false);
  const [solicitudDetalle, setSolicitudDetalle] = useState<Solicitud | null>(null);
  const [busqueda, setBusqueda]                 = useState("");
  const [filtroEstado, setFiltroEstado]         = useState<FiltroEstado>("TODOS");

  const { data, loading, refetch } = useQuery(GET_SOLICITUDES);
  const { data: dataUsuarios }     = useQuery(GET_USUARIOS_SIMPLE);
  const [eliminarSolicitud]        = useMutation(ELIMINAR_SOLICITUD);

  const solicitudes: Solicitud[] = data?.allSolicitudes   ?? [];
  const usuarios:    Usuario[]   = dataUsuarios?.allUsuarios ?? [];

  const total      = solicitudes.length;
  const pendientes = solicitudes.filter(s => s.estadoSolicitud === "PENDIENTE").length;
  const aprobadas  = solicitudes.filter(s => s.estadoSolicitud === "APROBADA").length;
  const rechazadas = solicitudes.filter(s => s.estadoSolicitud === "RECHAZADA").length;

  const filtradas = solicitudes.filter(s => {
    const matchEstado   = filtroEstado === "TODOS" || s.estadoSolicitud === filtroEstado;
    const matchBusqueda = `${s.codigoIanus} ${s.codigoSala} ${s.usuario?.nombres ?? ""} ${s.usuario?.paterno ?? ""} ${s.observacion ?? ""}`
      .toLowerCase().includes(busqueda.toLowerCase());
    return matchEstado && matchBusqueda;
  });

  const eliminar = async (s: Solicitud) => {
    if (!window.confirm(`¿Eliminar la solicitud ${s.codigoIanus}?`)) return;
    const { data } = await eliminarSolicitud({ variables: { id: Number(s.idSolicitud) } });
    if (!data?.eliminarSolicitud?.ok) {
      alert(data?.eliminarSolicitud?.mensaje ?? "No se pudo eliminar."); return;
    }
    refetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-blue-500" />
            Solicitudes de actualización
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Sincronización IANUS • {total} solicitudes
          </p>
        </div>
        <button
          onClick={() => setModalNuevo(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> Nueva solicitud
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total" value={total} color="text-blue-600 dark:text-blue-400"
          icon={<ClipboardList className="w-6 h-6 text-blue-600 dark:text-blue-400" />} />
        <StatCard label="Pendientes" value={pendientes} color="text-amber-600 dark:text-amber-400"
          icon={<Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
          sub="Esperando respuesta" />
        <StatCard label="Aprobadas" value={aprobadas} color="text-emerald-600 dark:text-emerald-400"
          icon={<CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
          sub={`${Math.round((aprobadas / (total || 1)) * 100)}% del total`} />
        <StatCard label="Rechazadas" value={rechazadas} color="text-red-600 dark:text-red-400"
          icon={<XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />}
          sub="Requieren atención" />
      </div>

      {/* Filtros + búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Filtro por estado */}
        <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-1">
          {FILTROS.map(fil => (
            <button
              key={fil.id}
              onClick={() => setFiltroEstado(fil.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filtroEstado === fil.id
                  ? "bg-white dark:bg-slate-700 text-gray-800 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {fil.label}
            </button>
          ))}
        </div>

        {/* Búsqueda */}
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por código, usuario u observación..."
          className="flex-1 min-w-0 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
        />

        <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">
          {filtradas.length} resultado{filtradas.length !== 1 ? "s" : ""}
          {filtroEstado !== "TODOS" && ` · ${ESTADO_LABELS[filtroEstado]}`}
        </span>
      </div>

      {/* Tabla Desktop */}
      <div className="hidden lg:block bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700">
              <tr>
                {["#", "Código IANUS", "Código sala", "Usuario", "Estado", "Fecha solicitud", "Fecha confirmación", "Acciones"].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <ClipboardList className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                      <p>No se encontraron solicitudes</p>
                    </div>
                  </td>
                </tr>
              ) : filtradas.map(s => (
                <tr key={s.idSolicitud} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 text-xs text-gray-400 font-mono">#{s.idSolicitud}</td>
                  <td className="px-6 py-4 font-mono font-bold text-blue-500 text-sm">{s.codigoIanus}</td>
                  <td className="px-6 py-4 font-mono text-gray-500 dark:text-gray-400 text-sm">{s.codigoSala}</td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-sm text-gray-800 dark:text-white">
                      {s.usuario?.nombres} {s.usuario?.paterno}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.usuario?.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <EstadoBadge estado={s.estadoSolicitud} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">
                    {fmtFecha(s.fechaSolicitud)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">
                    {fmtFecha(s.fechaConfirmacion)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSolicitudDetalle(s)}
                        className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => eliminar(s)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards Móvil */}
      <div className="lg:hidden space-y-3">
        {filtradas.map(s => (
          <div key={s.idSolicitud} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-mono font-bold text-blue-500 text-sm">{s.codigoIanus}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.codigoSala}</p>
              </div>
              <div className="flex items-center gap-1">
                <EstadoBadge estado={s.estadoSolicitud} />
                <button onClick={() => setSolicitudDetalle(s)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => eliminar(s)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700 dark:text-gray-200">
                {s.usuario?.nombres} {s.usuario?.paterno}
              </p>
              <span className="text-xs text-gray-400">{fmtFecha(s.fechaSolicitud)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal nueva solicitud */}
      {modalNuevo && (
        <NuevaSolicitudModal
          usuarios={usuarios}
          onClose={() => setModalNuevo(false)}
          onGuardado={() => { refetch(); setModalNuevo(false); }}
        />
      )}

      {/* Modal detalle */}
      {solicitudDetalle && (
        <DetalleModal
          solicitud={solicitudDetalle}
          onClose={() => setSolicitudDetalle(null)}
        />
      )}
    </div>
  );
}
