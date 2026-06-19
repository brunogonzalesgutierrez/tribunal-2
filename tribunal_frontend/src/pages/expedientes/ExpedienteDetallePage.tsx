import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";

import { useAuth } from "../../context/AuthContext";
import {
  GET_DETALLE_EXPEDIENTE,
  GET_ESTADOS_TODOS, CAMBIAR_ESTADO,
  CREAR_PARTE, ELIMINAR_PARTE,
  CREAR_RESOLUCION, ELIMINAR_RESOLUCION,
  CREAR_ACTUACION, ELIMINAR_ACTUACION,
  GET_TIPOS_RES, GET_TIPOS_ACT,
  GET_PERSONAS_DETALLE, GET_ROLES_PROC,
} from "../../graphql/expedienteDetalle";
import {
  CREAR_AUDIENCIA, ACTUALIZAR_AUDIENCIA, ELIMINAR_AUDIENCIA,
  GET_TIPOS_AUDIENCIA, GET_SALAS_AUDIENCIA, ENVIAR_CITACIONES_AUDIENCIA,
  GET_ASISTENCIAS_AUDIENCIA, REGISTRAR_ASISTENCIA_BATCH,
} from "../../graphql/audiencias";
import {
  GET_VOCALES,
  CREAR_CONFORMACION, ELIMINAR_CONFORMACION,
} from "../../graphql/tribunal";
import { GET_TIPOS_DOC, ELIMINAR_DOCUMENTO } from "../../graphql/documento";
import { useCrudNotifications } from "../../hooks/useCrudNotifications";
import {
  generarDocumentoTribunal,
} from "../../utils/documentosTribunal"

// ─── GraphQL adicional ─────────────────────────────────────────────────────
// (todo movido a graphql/)
// ─── Imports de iconos ─────────────────────────────────────────────────────
import {
  X, FolderOpen, Users, Calendar, Scale, FileText,
  ClipboardList, History, Building2, CheckCircle, AlertCircle,
  Clock, Gavel, UserCheck, ArrowRight, Loader2, GitBranch,
  Plus, Edit2, Trash2, Save, XCircle, Video, ChevronLeft, Search, FileDown, Send
} from "lucide-react";

// ─── Helpers ───────────────────────────────────────────────────────────────
const fmtFecha = (iso?: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" });
};
const fmtFechaHora = (iso?: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-BO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};
const tiempoRelativo = (iso?: string | null) => {
  if (!iso) return "";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "ahora mismo";
  if (diff < 60) return `hace ${diff} min`;
  const hrs = Math.floor(diff / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const dias = Math.floor(hrs / 24);
  if (dias < 7) return `hace ${dias}d`;
  return fmtFecha(iso);
};

// ─── Estilos compartidos ───────────────────────────────────────────────────
const inputCls = "w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all";
const labelCls = "block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1";

const estadoAudienciaColor: Record<string, string> = {
  PROGRAMADA: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  REALIZADA:  "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  SUSPENDIDA: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  CANCELADA:  "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  EN_CURSO:   "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400",
  FINALIZADA: "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300",
};
const audBg: Record<string, string> = {
  PROGRAMADA: "bg-blue-100 dark:bg-blue-900/30",
  REALIZADA:  "bg-emerald-100 dark:bg-emerald-900/30",
  SUSPENDIDA: "bg-amber-100 dark:bg-amber-900/30",
  EN_CURSO:   "bg-indigo-100 dark:bg-indigo-900/30",
};
const audIc: Record<string, string> = {
  PROGRAMADA: "text-blue-600 dark:text-blue-400",
  REALIZADA:  "text-emerald-600 dark:text-emerald-400",
  SUSPENDIDA: "text-amber-600 dark:text-amber-400",
  EN_CURSO:   "text-indigo-600 dark:text-indigo-400",
};
const estadoRecursoColor: Record<string, string> = {
  PENDIENTE: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  ADMITIDO:  "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  RESUELTO:  "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  RECHAZADO: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
};
const TIMELINE_NODE: Record<string, { dot: string; ring: string; icon: string }> = {
  "En Trámite":      { dot: "bg-blue-500",    ring: "ring-blue-200 dark:ring-blue-900",       icon: "🔄" },
  "Para Resolución": { dot: "bg-amber-500",   ring: "ring-amber-200 dark:ring-amber-900",     icon: "⚖️" },
  "Concluido":       { dot: "bg-emerald-500", ring: "ring-emerald-200 dark:ring-emerald-900", icon: "✅" },
  "Apelado":         { dot: "bg-orange-500",  ring: "ring-orange-200 dark:ring-orange-900",   icon: "📤" },
  "Suspendido":      { dot: "bg-red-500",     ring: "ring-red-200 dark:ring-red-900",         icon: "⏸️" },
  "Ingresado":       { dot: "bg-indigo-500",  ring: "ring-indigo-200 dark:ring-indigo-900",   icon: "📥" },
};
const getNodeStyle = (n?: string) =>
  TIMELINE_NODE[n ?? ""] ?? { dot: "bg-gray-400 dark:bg-slate-500", ring: "ring-gray-200 dark:ring-slate-700", icon: "📋" };

const RESUMEN_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  blue:    { bg: "bg-blue-50 dark:bg-blue-900/10",     border: "border-blue-100 dark:border-blue-900/30",    text: "text-blue-600 dark:text-blue-400"    },
  indigo:  { bg: "bg-indigo-50 dark:bg-indigo-900/10", border: "border-indigo-100 dark:border-indigo-900/30", text: "text-indigo-600 dark:text-indigo-400" },
  purple:  { bg: "bg-purple-50 dark:bg-purple-900/10", border: "border-purple-100 dark:border-purple-900/30", text: "text-purple-600 dark:text-purple-400" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-900/10", border: "border-emerald-100 dark:border-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400" },
};

// ══════════════════════════════════════════════════════════════════════════
// BUSCADOR MODAL GENÉRICO
// ══════════════════════════════════════════════════════════════════════════
interface OpcionModal {
  id: number;
  titulo: string;
  subtitulo?: string;
  extra?: string;
}

function BuscadorModal({
  titulo, placeholder, opciones, loading, onSelect, onClose,
}: {
  titulo: string; placeholder: string; opciones: OpcionModal[];
  loading: boolean; onSelect: (id: number, label: string) => void; onClose: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const filtradas = opciones.filter(o =>
    `${o.titulo} ${o.subtitulo ?? ""} ${o.extra ?? ""}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-500" />{titulo}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder={placeholder} value={busqueda} onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              autoFocus />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>
          ) : filtradas.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" /><p>No se encontraron resultados</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filtradas.map(o => (
                <button key={o.id} onClick={() => { const label = o.extra ? `${o.titulo} — ${o.extra}` : o.titulo; onSelect(o.id, label); onClose(); }}
                  className="w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{o.titulo}</p>
                      {o.subtitulo && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{o.subtitulo}</p>}
                      {o.extra && <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">{o.extra}</p>}
                    </div>
                    <Plus className="w-5 h-5 text-blue-500 shrink-0 ml-3" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 px-6 py-4 rounded-b-2xl">
          <button onClick={onClose} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function ChipSeleccionado({ label, onClear, color = "blue" }: {
  label: string; onClear: () => void; color?: "blue" | "indigo" | "emerald" | "purple";
}) {
  const colores = {
    blue:    "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800",
    indigo:  "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800",
    emerald: "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800",
    purple:  "bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800",
  };
  const btnColores = {
    blue:    "hover:bg-blue-200 dark:hover:bg-blue-800",
    indigo:  "hover:bg-indigo-200 dark:hover:bg-indigo-800",
    emerald: "hover:bg-emerald-200 dark:hover:bg-emerald-800",
    purple:  "hover:bg-purple-200 dark:hover:bg-purple-800",
  };
  return (
    <div className={`flex items-center gap-2 p-2.5 rounded-xl border ${colores[color]}`}>
      <span className="flex-1 text-sm text-gray-800 dark:text-white truncate">{label}</span>
      <button type="button" onClick={onClear} className={`p-1 rounded-lg text-gray-500 transition-colors ${btnColores[color]}`}>
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function BtnAbrirBuscador({ onClick, label = "Buscar y seleccionar" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all">
      <Search className="w-4 h-4" />{label}
    </button>
  );
}

function CampoSelector({ label, required, valorLabel, onAbrir, onLimpiar, color = "blue" }: {
  label: string; required?: boolean; valorLabel: string;
  onAbrir: () => void; onLimpiar: () => void; color?: "blue" | "indigo" | "emerald" | "purple"; disabled?: boolean;
}) {
  return (
    <div>
      <label className={labelCls}>{label} {required && <span className="text-red-500">*</span>}</label>
      {valorLabel ? <ChipSeleccionado label={valorLabel} onClear={onLimpiar} color={color} /> : <BtnAbrirBuscador onClick={onAbrir} label={`Buscar ${label.toLowerCase()}`} />}
    </div>
  );
}

const Pill = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>{children}</span>
);
const InfoCell = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div>
    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-0.5">{label}</p>
    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{value ?? "—"}</p>
  </div>
);
const TablaVacia = ({ icono: Icon, mensaje, onAgregar, labelAgregar }: {
  icono: React.ElementType; mensaje: string; onAgregar?: () => void; labelAgregar?: string;
}) => (
  <div className="flex flex-col items-center gap-4 py-10 text-gray-400 dark:text-gray-600">
    <Icon className="w-10 h-10" />
    <p className="text-sm">{mensaje}</p>
    {onAgregar && (
      <button onClick={onAgregar} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors shadow-sm shadow-blue-500/25">
        <Plus className="w-4 h-4" /> {labelAgregar ?? "Agregar"}
      </button>
    )}
  </div>
);

const SeccionHeader = ({ count, singular, plural, onAgregar, mostrarBoton }: {
  count: number; singular: string; plural: string; onAgregar: () => void; mostrarBoton: boolean;
}) => (
  <div className="flex items-center justify-between mb-4">
    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
      {count} {count === 1 ? singular : plural}
    </p>
    {mostrarBoton && (
      <button onClick={onAgregar} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition-all hover:scale-[1.02] shadow-sm shadow-blue-500/30">
        <Plus className="w-3.5 h-3.5" /> Agregar
      </button>
    )}
  </div>
);

const FormInline = ({ titulo, icono: Icon, color = "blue", onCancel, onSave, saving, error, children }: {
  titulo: string; icono: React.ElementType; color?: string;
  onCancel: () => void; onSave: () => void; saving: boolean; error: string; children: React.ReactNode;
}) => {
  const bg = {
    blue:    "border-blue-200 dark:border-blue-800/60 bg-blue-50/60 dark:bg-blue-900/10",
    emerald: "border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-900/10",
    purple:  "border-purple-200 dark:border-purple-800/60 bg-purple-50/60 dark:bg-purple-900/10",
    indigo:  "border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/60 dark:bg-indigo-900/10",
  }[color] ?? "";
  const ic = {
    blue: "bg-blue-500", emerald: "bg-emerald-500", purple: "bg-purple-500", indigo: "bg-indigo-500",
  }[color] ?? "bg-blue-500";
  return (
    <div className={`rounded-2xl border-2 ${bg} p-5 space-y-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg ${ic} flex items-center justify-center`}><Icon className="w-4 h-4 text-white" /></div>
          <p className="text-sm font-bold text-gray-800 dark:text-white">{titulo}</p>
        </div>
        <button onClick={onCancel} disabled={saving} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-40">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div>{children}</div>
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button onClick={onCancel} disabled={saving}
          className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
          <XCircle className="w-4 h-4" /> Cancelar
        </button>
        <button onClick={onSave} disabled={saving}
          className={`px-4 py-2 rounded-xl ${ic} hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-sm`}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
};

const BtnEliminar = ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) => (
  <button onClick={onClick} disabled={disabled}
    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" title="Eliminar">
    <Trash2 className="w-3.5 h-3.5" />
  </button>
);

const TABS = [
  { id: "general",      label: "General",      icon: FolderOpen    },
  { id: "partes",       label: "Partes",       icon: Users         },
  { id: "vocales",      label: "Conformación", icon: Building2     },
  { id: "actuaciones",  label: "Actuaciones",  icon: ClipboardList },
  { id: "audiencias",   label: "Audiencias",   icon: Calendar      },
  { id: "documentos",   label: "Documentos",   icon: FileText      },
  { id: "resoluciones", label: "Resoluciones", icon: Scale         },
  { id: "recursos",     label: "Recursos",     icon: Gavel         },
  { id: "historial",    label: "Historial",    icon: History       },
] as const;
type TabId = typeof TABS[number]["id"];

// ══════════════════════════════════════════════════════════════════════════
// MODAL CAMBIO DE ESTADO (Art. 7 — registro obligatorio con motivo)
// ══════════════════════════════════════════════════════════════════════════
function ModalCambioEstado({ expediente, onClose, onCambiado }: {
  expediente: any;
  onClose: () => void;
  onCambiado: () => void;
}) {
  const { usuario } = useAuth();
  const { data, loading } = useQuery(GET_ESTADOS_TODOS);
  const [cambiarEstado] = useMutation(CAMBIAR_ESTADO);

  const [estadoId, setEstadoId] = useState(0);
  const [motivo, setMotivo]     = useState("");
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState("");

  const nivelActual = expediente.idEstadoExpediente?.nivel ?? 0;
  const todos: any[] = data?.allEstadosExpediente ?? [];

  // Mostrar estados de nivel mayor al actual + terminales (excluir el estado actual)
  const opciones = todos.filter(e => {
    if (e.idEstado === expediente.idEstadoExpediente?.idEstado) return false;
    // Art. 59: Conciliación solo antes del término probatorio (nivel <= 3)
    if (e.nombreEstado === "Conciliado" && nivelActual > 3) return false;
    // Art. 23 par. I: Desistido en 1ra instancia no termina el proceso
    // Solo permitir Desistido desde segunda instancia (nivel >= 8)
    if (e.nombreEstado === "Desistido" && nivelActual < 8) return false;
    return e.esTerminal || e.nivel > nivelActual;
  });

  const guardar = async () => {
    if (!estadoId) { setErr("Seleccioná un estado de destino."); return; }
    if (!motivo.trim()) { setErr("El motivo es obligatorio (Art. 7 del Reglamento)."); return; }
    if (!usuario?.idUsuario) { setErr("No se pudo identificar al usuario."); return; }
    setSaving(true); setErr("");
    try {
      await cambiarEstado({
        variables: {
          idExpediente: Number(expediente.idExpediente),
          idEstadoNuevo: Number(estadoId),
          idUsuario: Number(usuario.idUsuario),
          motivo: motivo.trim(),
        },
      });
      onCambiado();
    } catch (e: any) {
      setErr(e.message ?? "Error al cambiar el estado.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={!saving ? onClose : undefined}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-md flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-white">Cambiar estado del expediente</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Actual: <span className="font-semibold text-gray-700 dark:text-gray-300">{expediente.idEstadoExpediente?.nombreEstado ?? "Sin estado"}</span>
              </p>
            </div>
          </div>
          {!saving && (
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Selector de estado destino */}
          <div>
            <label className={labelCls}>
              Nuevo estado <span className="text-red-500">*</span>
            </label>
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
              </div>
            ) : opciones.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                No hay estados disponibles para avanzar
              </p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {opciones.map(e => (
                  <button
                    key={e.idEstado}
                    onClick={() => setEstadoId(e.idEstado)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      estadoId === e.idEstado
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                        : "border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>{e.nombreEstado}</span>
                      {e.esTerminal
                        ? <Pill className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">Terminal</Pill>
                        : <Pill className="bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400">Nivel {e.nivel}</Pill>
                      }
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Motivo — obligatorio por Art. 7 */}
          <div>
            <label className={labelCls}>
              Motivo <span className="text-red-500">*</span>
              <span className="ml-1 normal-case font-normal text-gray-400">(requerido — Art. 7)</span>
            </label>
            <textarea
              rows={3}
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              disabled={saving}
              placeholder="Describí el motivo del cambio de estado..."
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Error */}
          {err && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />{err}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm font-medium transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={saving || !estadoId || !motivo.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
              : <><Save className="w-4 h-4" /> Confirmar cambio</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// FORM AUDIENCIA
// ══════════════════════════════════════════════════════════════════════════
const INIT_AUD = {
  idTipoAudiencia: 0, tipoLabel: "", idSalaAud: 0, salaLabel: "",
  fechaHoraProgramada: "", linkVideoconferencia: "", estadoAudiencia: "PROGRAMADA",
  motivoSuspension: "", fechaHoraInicio: "", fechaHoraFin: "",
};

function FormAudiencia({ idExpediente, editando, onSaved, onCancel }: {
  idExpediente: number; editando: any | null; onSaved: () => void; onCancel: () => void;
}) {
  const { data: dTipo, loading: lTipo } = useQuery(GET_TIPOS_AUDIENCIA);
  const { data: dSala, loading: lSala } = useQuery(GET_SALAS_AUDIENCIA);
  const [crear]      = useMutation(CREAR_AUDIENCIA);
  const [actualizar] = useMutation(ACTUALIZAR_AUDIENCIA);

  const [form, setForm] = useState(editando ? {
    idTipoAudiencia: editando.idTipoAudiencia?.idTipoAudiencia ?? 0,
    tipoLabel: editando.idTipoAudiencia?.nombre ?? "",
    idSalaAud: editando.idSalaAud?.idSalaAud ?? 0,
    salaLabel: editando.idSalaAud?.nombreSala ?? "",
    fechaHoraProgramada: editando.fechaHoraProgramada?.slice(0, 16) ?? "",
    linkVideoconferencia: editando.linkVideoconferencia ?? "",
    estadoAudiencia: editando.estadoAudiencia ?? "PROGRAMADA",
    motivoSuspension: editando.motivoSuspension ?? "",
    fechaHoraInicio: editando.fechaHoraInicio?.slice(0, 16) ?? "",
    fechaHoraFin: editando.fechaHoraFin?.slice(0, 16) ?? "",
  } : { ...INIT_AUD });

  const [err, setErr]       = useState("");
  const [saving, setSaving] = useState(false);
  const [modal, setModal]   = useState<"tipo" | "sala" | null>(null);

  const tipos: any[] = dTipo?.allTiposAudiencia ?? [];
  const salas: any[] = (dSala?.allSalasAudiencia ?? []).filter((s: any) => s.activa);

  const opcionesTipo: OpcionModal[] = tipos.map((t: any) => ({ id: t.idTipoAudiencia, titulo: t.nombre, extra: `${t.duracionEstimada} min` }));
  const opcionesSala: OpcionModal[] = salas.map((s: any) => ({ id: s.idSalaAud, titulo: s.nombreSala, subtitulo: `Cap. ${s.capacidad}`, extra: s.equipadaVideoconf ? "📹 Videoconferencia" : undefined }));

  const set = (k: string) => (e: React.ChangeEvent<any>) => setForm(p => ({ ...p, [k]: e.target.value }));

  const guardar = async () => {
    if (!form.idTipoAudiencia || !form.fechaHoraProgramada) { setErr("Tipo y fecha son obligatorios."); return; }
    setSaving(true); setErr("");
    try {
      if (editando) {
        await actualizar({ variables: { id: Number(editando.idAudiencia), input: {
          idTipoAudiencia: Number(form.idTipoAudiencia) || undefined,
          idSalaAud: Number(form.idSalaAud) || undefined,
          fechaHoraProgramada: form.fechaHoraProgramada,
          estadoAudiencia: form.estadoAudiencia || undefined,
          motivoSuspension: form.motivoSuspension || undefined,
          linkVideoconferencia: form.linkVideoconferencia || undefined,
          fechaHoraInicio: form.fechaHoraInicio || undefined,
          fechaHoraFin: form.fechaHoraFin || undefined,
        } } });
      } else {
        await crear({ variables: { input: {
          idExpediente: Number(idExpediente),
          idTipoAudiencia: Number(form.idTipoAudiencia),
          fechaHoraProgramada: form.fechaHoraProgramada,
          idSalaAud: Number(form.idSalaAud) || undefined,
          linkVideoconferencia: form.linkVideoconferencia || undefined,
        } } });
      }
      onSaved();
    } catch (e: any) { setErr(e.message ?? "Error al guardar."); } finally { setSaving(false); }
  };

  return (
    <>
      <FormInline titulo={editando ? "Editar audiencia" : "Programar audiencia"} icono={Calendar} color="blue" onCancel={onCancel} onSave={guardar} saving={saving} error={err}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CampoSelector label="Tipo de audiencia" required valorLabel={form.tipoLabel} onAbrir={() => setModal("tipo")} onLimpiar={() => setForm(p => ({ ...p, idTipoAudiencia: 0, tipoLabel: "" }))} color="blue" />
          <div>
            <label className={labelCls}>Fecha y hora <span className="text-red-500">*</span></label>
            <input type="datetime-local" value={form.fechaHoraProgramada} onChange={set("fechaHoraProgramada")} className={inputCls} disabled={saving} />
          </div>
          <CampoSelector label="Sala" valorLabel={form.salaLabel} onAbrir={() => setModal("sala")} onLimpiar={() => setForm(p => ({ ...p, idSalaAud: 0, salaLabel: "" }))} color="blue" />
          <div>
            <label className={labelCls}>Link videoconf.</label>
            <input type="url" placeholder="https://meet.google.com/..." value={form.linkVideoconferencia} onChange={set("linkVideoconferencia")} className={inputCls} disabled={saving} />
          </div>
          {editando && (
            <div>
              <label className={labelCls}>Estado</label>
              <select value={form.estadoAudiencia} onChange={set("estadoAudiencia")} className={inputCls} disabled={saving}>
                <option value="PROGRAMADA">Programada</option>
                <option value="EN_CURSO">En curso</option>
                <option value="REALIZADA">Realizada</option>
                <option value="SUSPENDIDA">Suspendida</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>
          )}
          {editando && (form.estadoAudiencia === "EN_CURSO" || form.estadoAudiencia === "REALIZADA") && (
            <div>
              <label className={labelCls}>Hora de inicio</label>
              <input type="datetime-local" value={form.fechaHoraInicio} onChange={set("fechaHoraInicio")} className={inputCls} disabled={saving} />
            </div>
          )}
          {editando && form.estadoAudiencia === "REALIZADA" && (
            <div>
              <label className={labelCls}>Hora de fin</label>
              <input type="datetime-local" value={form.fechaHoraFin} onChange={set("fechaHoraFin")} className={inputCls} disabled={saving} />
            </div>
          )}
          {editando && form.estadoAudiencia === "SUSPENDIDA" && (
            <div className="sm:col-span-2">
              <label className={labelCls}>Motivo suspensión</label>
              <textarea rows={2} value={form.motivoSuspension} onChange={set("motivoSuspension")} className={`${inputCls} resize-none`} disabled={saving} />
            </div>
          )}
        </div>
      </FormInline>
      {modal === "tipo" && (
        <BuscadorModal titulo="Seleccionar tipo de audiencia" placeholder="Buscar por nombre..." opciones={opcionesTipo} loading={lTipo}
          onSelect={(id, label) => setForm(p => ({ ...p, idTipoAudiencia: id, tipoLabel: label }))} onClose={() => setModal(null)} />
      )}
      {modal === "sala" && (
        <BuscadorModal titulo="Seleccionar sala" placeholder="Buscar por nombre o capacidad..." opciones={opcionesSala} loading={lSala}
          onSelect={(id, label) => {
            const salaSeleccionada = salas.find((s: any) => s.idSalaAud === id);
            setForm(p => ({ ...p, idSalaAud: id, salaLabel: label, linkVideoconferencia: salaSeleccionada?.enlaceVirtual || p.linkVideoconferencia }));
          }}
          onClose={() => setModal(null)} />
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// FORM PARTE PROCESAL
// ══════════════════════════════════════════════════════════════════════════
function FormParte({ idExpediente, onSaved, onCancel }: { idExpediente: number; onSaved: () => void; onCancel: () => void }) {
  const { data: dP, loading: lP } = useQuery(GET_PERSONAS_DETALLE);
  const { data: dR, loading: lR } = useQuery(GET_ROLES_PROC);
  const [crear] = useMutation(CREAR_PARTE);
  const [form, setForm] = useState({ idPersona: 0, personaLabel: "", idRol: 0, rolLabel: "" });
  const [err, setErr]   = useState("");
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<"persona" | "rol" | null>(null);

  const personas: any[] = dP?.allPersonas ?? [];
  const roles: any[]    = dR?.allRolesProcesal ?? [];
  const opcionesPersona: OpcionModal[] = personas.map((p: any) => ({
    id: p.idPersona,
    titulo: `${p.nombre} ${p.primerApellido} ${p.segundoApellido ?? ""}`.trim(),
    extra: p.numeroDocumento,
    subtitulo: p.esAbogado ? "Abogado" : undefined,
  }));
  const opcionesRol: OpcionModal[] = roles.map((r: any) => ({ id: r.idRol, titulo: r.nombreRol }));

  const guardar = async () => {
    if (!form.idPersona || !form.idRol) { setErr("Persona y rol son obligatorios."); return; }
    setSaving(true); setErr("");
    try {
      await crear({ variables: { idExpediente: Number(idExpediente), idPersona: Number(form.idPersona), idRol: Number(form.idRol) } });
      onSaved();
    } catch (e: any) { setErr(e.message ?? "Error al guardar."); } finally { setSaving(false); }
  };

  return (
    <>
      <FormInline titulo="Agregar parte procesal" icono={Users} color="indigo" onCancel={onCancel} onSave={guardar} saving={saving} error={err}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><CampoSelector label="Persona" required valorLabel={form.personaLabel} onAbrir={() => setModal("persona")} onLimpiar={() => setForm(p => ({ ...p, idPersona: 0, personaLabel: "" }))} color="indigo" /></div>
          <div className="sm:col-span-2"><CampoSelector label="Rol procesal" required valorLabel={form.rolLabel} onAbrir={() => setModal("rol")} onLimpiar={() => setForm(p => ({ ...p, idRol: 0, rolLabel: "" }))} color="indigo" /></div>
        </div>
      </FormInline>
      {modal === "persona" && <BuscadorModal titulo="Seleccionar persona" placeholder="Buscar por nombre o documento..." opciones={opcionesPersona} loading={lP} onSelect={(id, label) => setForm(p => ({ ...p, idPersona: id, personaLabel: label }))} onClose={() => setModal(null)} />}
      {modal === "rol"     && <BuscadorModal titulo="Seleccionar rol procesal" placeholder="Buscar por nombre..." opciones={opcionesRol} loading={lR} onSelect={(id, label) => setForm(p => ({ ...p, idRol: id, rolLabel: label }))} onClose={() => setModal(null)} />}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// FORM RESOLUCIÓN
// ══════════════════════════════════════════════════════════════════════════
function FormResolucion({ idExpediente, onSaved, onCancel }: { idExpediente: number; onSaved: () => void; onCancel: () => void }) {
  const { data: dR, loading: lR } = useQuery(GET_TIPOS_RES);
  const [crear] = useMutation(CREAR_RESOLUCION);
  const [form, setForm] = useState({ idTipoRes: 0, tipoLabel: "", numeroResolucion: "", fechaResolucion: "", parteDispositiva: "", fundamentacion: "" });
  const [err, setErr]   = useState("");
  const [saving, setSaving] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  const tipos: any[] = dR?.allTiposResolucion ?? [];
  const opciones: OpcionModal[] = tipos.map((t: any) => ({ id: t.idTipoRes, titulo: t.nombre, extra: t.codigo, subtitulo: t.nivelJerarquico ? `Nivel ${t.nivelJerarquico}` : undefined }));
  const set = (k: string) => (e: React.ChangeEvent<any>) => setForm(p => ({ ...p, [k]: e.target.value }));

  const guardar = async () => {
    if (!form.idTipoRes || !form.numeroResolucion || !form.fechaResolucion || !form.parteDispositiva) {
      setErr("Tipo, número, fecha y parte dispositiva son obligatorios."); return;
    }
    setSaving(true); setErr("");
    try {
      await crear({ variables: { input: {
        idExpediente: Number(idExpediente),
        idTipoRes: Number(form.idTipoRes),
        numeroResolucion: form.numeroResolucion,
        fechaResolucion: form.fechaResolucion,
        parteDispositiva: form.parteDispositiva,
        fundamentacion: form.fundamentacion || undefined,
      } } });
      onSaved();
    } catch (e: any) { setErr(e.message ?? "Error al guardar."); } finally { setSaving(false); }
  };

  return (
    <>
      <FormInline titulo="Nueva resolución" icono={Scale} color="purple" onCancel={onCancel} onSave={guardar} saving={saving} error={err}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><CampoSelector label="Tipo de resolución" required valorLabel={form.tipoLabel} onAbrir={() => setModalAbierto(true)} onLimpiar={() => setForm(p => ({ ...p, idTipoRes: 0, tipoLabel: "" }))} color="purple" /></div>
          <div>
            <label className={labelCls}>N° Resolución <span className="text-red-500">*</span></label>
            <input type="text" placeholder="Ej: RES-001/2025" value={form.numeroResolucion} onChange={set("numeroResolucion")} className={inputCls} disabled={saving} />
          </div>
          <div>
            <label className={labelCls}>Fecha <span className="text-red-500">*</span></label>
            <input type="date" value={form.fechaResolucion} onChange={set("fechaResolucion")} className={inputCls} disabled={saving} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Parte dispositiva <span className="text-red-500">*</span></label>
            <textarea rows={3} placeholder="Decisión principal de la resolución..." value={form.parteDispositiva} onChange={set("parteDispositiva")} className={`${inputCls} resize-none`} disabled={saving} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Fundamentación</label>
            <textarea rows={3} placeholder="Fundamentos jurídicos (opcional)..." value={form.fundamentacion} onChange={set("fundamentacion")} className={`${inputCls} resize-none`} disabled={saving} />
          </div>
        </div>
      </FormInline>
      {modalAbierto && <BuscadorModal titulo="Seleccionar tipo de resolución" placeholder="Buscar por nombre o código..." opciones={opciones} loading={lR} onSelect={(id, label) => setForm(p => ({ ...p, idTipoRes: id, tipoLabel: label }))} onClose={() => setModalAbierto(false)} />}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// FORM DOCUMENTO
// ══════════════════════════════════════════════════════════════════════════
const DJANGO_BASE = "http://localhost:8000";

function FormDocumento({ idExpediente, onSaved, onCancel }: { idExpediente: number; onSaved: () => void; onCancel: () => void }) {
  const { data: dD, loading: lD } = useQuery(GET_TIPOS_DOC);
  const [form, setForm] = useState({ idTipoDoc: 0, tipoLabel: "", titulo: "", numeroFolio: "" });
  const [archivo, setArchivo]           = useState<File | null>(null);
  const [err, setErr]                   = useState("");
  const [saving, setSaving]             = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const inputFileRef                    = useRef<HTMLInputElement>(null);

  const tipos: any[] = dD?.allTiposDoc ?? [];
  const opciones: OpcionModal[] = tipos.map((t: any) => ({ id: t.idTipoDoc, titulo: t.nombre, extra: t.codigo, subtitulo: t.esPublico ? "Público" : "Privado" }));
  const set = (k: string) => (e: React.ChangeEvent<any>) => setForm(p => ({ ...p, [k]: e.target.value }));

  const manejarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f && !f.name.toLowerCase().endsWith(".pdf")) { setErr("Solo se permiten archivos PDF."); return; }
    setArchivo(f); setErr("");
  };

  const guardar = async () => {
    if (!form.idTipoDoc || !form.titulo.trim()) { setErr("Tipo y título son obligatorios."); return; }
    setSaving(true); setErr("");
    try {
      const formData = new FormData();
      formData.append("titulo", form.titulo.trim());
      formData.append("idExpediente", String(idExpediente));
      formData.append("idTipoDoc", String(form.idTipoDoc));
      if (form.numeroFolio) formData.append("numeroFolio", form.numeroFolio);
      if (archivo) formData.append("archivo", archivo);
      const resp = await fetch(`${DJANGO_BASE}/api/subir-documento/`, { method: "POST", body: formData });
      const json = await resp.json();
      if (!json.ok) { setErr(json.mensaje ?? "Error al guardar."); return; }
      onSaved();
    } catch { setErr("No se pudo conectar con el servidor."); } finally { setSaving(false); }
  };

  return (
    <>
      <FormInline titulo="Registrar documento" icono={FileText} color="emerald" onCancel={onCancel} onSave={guardar} saving={saving} error={err}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <CampoSelector label="Tipo de documento" required valorLabel={form.tipoLabel} onAbrir={() => setModalAbierto(true)} onLimpiar={() => setForm(p => ({ ...p, idTipoDoc: 0, tipoLabel: "" }))} color="emerald" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Título <span className="text-red-500">*</span></label>
            <input type="text" placeholder="Nombre del documento..." value={form.titulo} onChange={set("titulo")} className={inputCls} disabled={saving} />
          </div>
          <div>
            <label className={labelCls}>N° Folio</label>
            <input type="number" placeholder="Ej: 42" value={form.numeroFolio} onChange={set("numeroFolio")} className={inputCls} disabled={saving} />
          </div>
          <div>
            <label className={labelCls}>Archivo PDF (opcional)</label>
            <div
              onClick={() => !saving && inputFileRef.current?.click()}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                archivo
                  ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20"
                  : "border-dashed border-gray-300 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-500 bg-white dark:bg-slate-900"
              } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {archivo ? (
                <>
                  <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="flex-1 text-xs text-emerald-700 dark:text-emerald-400 font-medium truncate">{archivo.name}</span>
                  <button type="button" onClick={e => { e.stopPropagation(); setArchivo(null); if (inputFileRef.current) inputFileRef.current.value = ""; }} className="p-0.5 rounded text-gray-400 hover:text-red-500 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                  </svg>
                  <span className="text-xs text-gray-400 dark:text-gray-500">Clic para seleccionar PDF</span>
                </>
              )}
            </div>
            <input ref={inputFileRef} type="file" accept="application/pdf" className="hidden" onChange={manejarArchivo} />
          </div>
        </div>
      </FormInline>
      {modalAbierto && <BuscadorModal titulo="Seleccionar tipo de documento" placeholder="Buscar por nombre o código..." opciones={opciones} loading={lD} onSelect={(id, label) => setForm(p => ({ ...p, idTipoDoc: id, tipoLabel: label }))} onClose={() => setModalAbierto(false)} />}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// FORM ACTUACIÓN
// ══════════════════════════════════════════════════════════════════════════
function FormActuacion({ idExpediente, onSaved, onCancel }: { idExpediente: number; onSaved: () => void; onCancel: () => void }) {
  const { usuario } = useAuth();
  const { data: dA, loading: lA } = useQuery(GET_TIPOS_ACT);
  const [crear] = useMutation(CREAR_ACTUACION);
  const [form, setForm] = useState({ idTipoActuacion: 0, tipoLabel: "", folioInicio: "", folioFin: "", descripcion: "" });
  const [err, setErr]   = useState("");
  const [saving, setSaving] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  const tipos: any[] = dA?.allTiposActuacion ?? [];
  const opciones: OpcionModal[] = tipos.map((t: any) => ({ id: t.idTipoActuacion, titulo: t.nombre, extra: t.codigo }));
  const set = (k: string) => (e: React.ChangeEvent<any>) => setForm(p => ({ ...p, [k]: e.target.value }));

  const guardar = async () => {
    if (!form.idTipoActuacion || !form.folioInicio || !form.folioFin) { setErr("Tipo, folio inicio y folio fin son obligatorios."); return; }
    if (!usuario?.idUsuario) { setErr("No se pudo identificar al usuario."); return; }
    setSaving(true); setErr("");
    try {
      await crear({ variables: {
        idExpediente: Number(idExpediente),
        idTipoActuacion: Number(form.idTipoActuacion),
        idUsuario: Number(usuario.idUsuario),
        folioInicio: Number(form.folioInicio),
        folioFin: Number(form.folioFin),
        descripcion: form.descripcion || undefined,
      } });
      onSaved();
    } catch (e: any) { setErr(e.message ?? "Error al guardar."); } finally { setSaving(false); }
  };

  return (
    <>
      <FormInline titulo="Registrar actuación" icono={ClipboardList} color="blue" onCancel={onCancel} onSave={guardar} saving={saving} error={err}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><CampoSelector label="Tipo de actuación" required valorLabel={form.tipoLabel} onAbrir={() => setModalAbierto(true)} onLimpiar={() => setForm(p => ({ ...p, idTipoActuacion: 0, tipoLabel: "" }))} color="blue" /></div>
          <div>
            <label className={labelCls}>Folio inicio <span className="text-red-500">*</span></label>
            <input type="number" placeholder="Ej: 1" value={form.folioInicio} onChange={set("folioInicio")} className={inputCls} disabled={saving} />
          </div>
          <div>
            <label className={labelCls}>Folio fin <span className="text-red-500">*</span></label>
            <input type="number" placeholder="Ej: 5" value={form.folioFin} onChange={set("folioFin")} className={inputCls} disabled={saving} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Descripción</label>
            <textarea rows={2} placeholder="Descripción de la actuación (opcional)..." value={form.descripcion} onChange={set("descripcion")} className={`${inputCls} resize-none`} disabled={saving} />
          </div>
          <div className="sm:col-span-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 text-xs text-gray-500 dark:text-gray-400">
            Usuario registrador: <span className="font-semibold text-gray-700 dark:text-gray-300">{usuario?.paterno} {usuario?.nombre}</span>
          </div>
        </div>
      </FormInline>
      {modalAbierto && <BuscadorModal titulo="Seleccionar tipo de actuación" placeholder="Buscar por nombre o código..." opciones={opciones} loading={lA} onSelect={(id, label) => setForm(p => ({ ...p, idTipoActuacion: id, tipoLabel: label }))} onClose={() => setModalAbierto(false)} />}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// FORM CONFORMACIÓN
// ══════════════════════════════════════════════════════════════════════════
function FormConformacion({ idExpediente, vocalesYaAsignados = [], onSaved, onCancel }: { idExpediente: number; vocalesYaAsignados?: number[]; onSaved: () => void; onCancel: () => void }) {
  const { data: dV, loading: lV } = useQuery(GET_VOCALES);
  const [crear] = useMutation(CREAR_CONFORMACION);
  const [form, setForm] = useState({ idVocal: 0, vocalLabel: "", rolEnCaso: "" });
  const [err, setErr]   = useState("");
  const [saving, setSaving] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  // IDs de vocales ya asignados a este expediente
  const asignadosSet = new Set(vocalesYaAsignados);
  const vocales: any[] = (dV?.allVocales ?? []).filter(
    (v: any) => v.activo && !asignadosSet.has(Number(v.idVocal))
  );
  const opciones: OpcionModal[] = vocales.map((v: any) => ({
    id: v.idVocal,
    titulo: `${v.idPersona?.nombre} ${v.idPersona?.primerApellido}`,
    subtitulo: v.cargo,
    extra: v.idSala?.nombreSala,
  }));
  const set = (k: string) => (e: React.ChangeEvent<any>) => setForm(p => ({ ...p, [k]: e.target.value }));

  const guardar = async () => {
    if (!form.idVocal || !form.rolEnCaso.trim()) { setErr("Vocal y rol en el caso son obligatorios."); return; }
    setSaving(true); setErr("");
    try {
      await crear({ variables: { idExpediente: Number(idExpediente), idVocal: Number(form.idVocal), rolEnCaso: form.rolEnCaso.trim() } });
      onSaved();
    } catch (e: any) { setErr(e.message ?? "Error al guardar."); } finally { setSaving(false); }
  };

  return (
    <>
      <FormInline titulo="Asignar vocal" icono={Building2} color="indigo" onCancel={onCancel} onSave={guardar} saving={saving} error={err}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><CampoSelector label="Vocal" required valorLabel={form.vocalLabel} onAbrir={() => setModalAbierto(true)} onLimpiar={() => setForm(p => ({ ...p, idVocal: 0, vocalLabel: "" }))} color="indigo" /></div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Rol en el caso <span className="text-red-500">*</span></label>
            <input type="text" placeholder="Ej: Vocal Relator, Presidente de Sala..." value={form.rolEnCaso} onChange={set("rolEnCaso")} className={inputCls} disabled={saving} />
          </div>
        </div>
      </FormInline>
      {modalAbierto && <BuscadorModal titulo="Seleccionar vocal activo" placeholder="Buscar por nombre, cargo o sala..." opciones={opciones} loading={lV} onSelect={(id, label) => setForm(p => ({ ...p, idVocal: id, vocalLabel: label }))} onClose={() => setModalAbierto(false)} />}
    </>
  );
}

// ─── Timeline historial ────────────────────────────────────────────────────
function TimelineHistorial({ historial }: { historial: any[] }) {
  if (historial.length === 0) return <TablaVacia icono={History} mensaje="Sin cambios de estado registrados" />;
  const ordenado = [...historial].sort((a, b) => new Date(a.fechaCambio).getTime() - new Date(b.fechaCambio).getTime());
  return (
    <div className="space-y-0">
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200 dark:border-slate-700">
        <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/30"><GitBranch className="w-4 h-4 text-purple-500" /></div>
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-white">Historial de Estados</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{ordenado.length} cambio{ordenado.length !== 1 ? "s" : ""} registrado{ordenado.length !== 1 ? "s" : ""}</p>
        </div>
      </div>
      <div className="relative">
        <div className="absolute left-[17px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-gray-200 via-gray-300 to-transparent dark:from-slate-600 dark:via-slate-600 dark:to-transparent" />
        <div className="space-y-0">
          {ordenado.map((h: any, idx: number) => {
            const ns = getNodeStyle(h.idEstadoNuevo?.nombreEstado);
            const esUltimo  = idx === ordenado.length - 1;
            const esPrimero = idx === 0;
            return (
              <div key={h.idHistorial} className="relative flex gap-4 pb-6 last:pb-0">
                <div className="relative z-10 shrink-0">
                  <div className={`w-9 h-9 rounded-xl ${ns.dot} ring-4 ${ns.ring} flex items-center justify-center shadow-sm`}>
                    <span className="text-sm leading-none">{ns.icon}</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400">{idx + 1}</span>
                  </div>
                </div>
                <div className={`flex-1 min-w-0 rounded-2xl border p-4 transition-all hover:shadow-md ${esUltimo ? "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50 shadow-sm" : "bg-gray-50 dark:bg-slate-800/60 border-gray-200 dark:border-slate-700"}`}>
                  {esUltimo  && <div className="flex items-center gap-1.5 mb-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /><span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Estado actual</span></div>}
                  {esPrimero && !esUltimo && <div className="flex items-center gap-1.5 mb-2"><span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Estado inicial</span></div>}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {h.idEstadoAnterior ? <Pill className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-semibold">{h.idEstadoAnterior.nombreEstado}</Pill> : <Pill className="bg-gray-100 dark:bg-slate-700 text-gray-400 italic">(sin estado)</Pill>}
                    <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                    <Pill className={`font-semibold ${esUltimo ? "bg-blue-500 text-white shadow-sm shadow-blue-500/30" : "bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-slate-600"}`}>{h.idEstadoNuevo?.nombreEstado}</Pill>
                  </div>
                  {h.motivo && <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3 bg-white dark:bg-slate-900/40 rounded-lg px-3 py-2 border border-gray-100 dark:border-slate-700 italic">"{h.motivo}"</p>}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtFechaHora(h.fechaCambio)}</span>
                    <span className="text-gray-300 dark:text-slate-600">·</span>
                    <span>{tiempoRelativo(h.fechaCambio)}</span>
                    {(h.usuario?.paterno || h.usuario?.nombres) && (
                      <><span className="text-gray-300 dark:text-slate-600">·</span>
                      <span className="flex items-center gap-1 font-medium text-gray-500 dark:text-gray-400">
                        <UserCheck className="w-3 h-3" />{h.usuario.paterno} {h.usuario.nombres}
                      </span></>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {ordenado.length > 1 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 dark:text-gray-500">Trayectoria:</span>
            {ordenado.map((h: any, idx: number) => (
              <div key={h.idHistorial} className="flex items-center gap-1">
                {idx === 0 && h.idEstadoAnterior && (
                  <><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400">{h.idEstadoAnterior.nombreEstado}</span>
                  <ArrowRight className="w-3 h-3 text-gray-300 dark:text-slate-600" /></>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full ${idx === ordenado.length - 1 ? "bg-blue-500 text-white font-semibold" : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400"}`}>{h.idEstadoNuevo?.nombreEstado}</span>
                {idx < ordenado.length - 1 && <ArrowRight className="w-3 h-3 text-gray-300 dark:text-slate-600" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// TIPOS para asistencia
// ══════════════════════════════════════════════════════════════════════════
type EstadoAsistencia = "PRESENTE" | "AUSENTE" | "JUSTIFICADO" | null;
interface RegistroLocal {
  idPersona: number;
  nombre: string;
  rolEnAudiencia: string;
  estado: EstadoAsistencia;
  motivoInasistencia: string;
}

// ══════════════════════════════════════════════════════════════════════════
// MODAL ASISTENCIA
// ══════════════════════════════════════════════════════════════════════════
function ModalAsistencia({ audiencia, partes, onClose }: { audiencia: any; partes: any[]; onClose: () => void }) {
  const { data: dataExistente, loading: loadingExistente } = useQuery(GET_ASISTENCIAS_AUDIENCIA, {
    variables: { idAudiencia: Number(audiencia.idAudiencia) },
    fetchPolicy: "network-only",
  });
  const [registrarBatch] = useMutation(REGISTRAR_ASISTENCIA_BATCH);
  const [guardando, setGuardando]     = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [yaGuardado, setYaGuardado]   = useState(false);
  const [mensajeOk, setMensajeOk]     = useState("");
  const [registros, setRegistros]     = useState<RegistroLocal[]>([]);

  useEffect(() => {
    if (!loadingExistente) {
      const asistenciasGuardadas: any[] = dataExistente?.asistenciasPorAudiencia ?? [];
      const hayDatos = asistenciasGuardadas.length > 0;
      setYaGuardado(hayDatos);
      setModoEdicion(!hayDatos);
      const iniciales: RegistroLocal[] = partes.map((p: any) => {
        const guardado = asistenciasGuardadas.find((a: any) => a.idPersona?.idPersona === p.idPersona?.idPersona);
        let estado: EstadoAsistencia = null;
        if (guardado) {
          if (guardado.asistio) estado = "PRESENTE";
          else if (guardado.motivoInasistencia?.toLowerCase().includes("justif")) estado = "JUSTIFICADO";
          else estado = "AUSENTE";
        }
        return {
          idPersona: Number(p.idPersona?.idPersona),
          nombre: `${p.idPersona?.nombre} ${p.idPersona?.primerApellido}`,
          rolEnAudiencia: p.idRol?.nombreRol ?? "Parte procesal",
          estado,
          motivoInasistencia: guardado?.motivoInasistencia ?? "",
        };
      });
      setRegistros(iniciales);
    }
  }, [loadingExistente, dataExistente]);

  const setEstado = (idPersona: number, estado: EstadoAsistencia) =>
    setRegistros(prev => prev.map(r => r.idPersona === idPersona ? { ...r, estado } : r));
  const setMotivo = (idPersona: number, motivo: string) =>
    setRegistros(prev => prev.map(r => r.idPersona === idPersona ? { ...r, motivoInasistencia: motivo } : r));
  const todosMarcados = registros.every(r => r.estado !== null);

  const guardar = async () => {
    if (!todosMarcados) return;
    setGuardando(true);
    try {
      const { data } = await registrarBatch({
        variables: {
          idAudiencia: Number(audiencia.idAudiencia),
          registros: registros.map(r => ({
            idPersona: Number(r.idPersona),
            rolEnAudiencia: r.rolEnAudiencia,
            estado: r.estado,
            motivoInasistencia: r.motivoInasistencia || null,
          })),
        },
      });
      if (data?.registrarAsistenciaBatch?.ok) {
        setYaGuardado(true); setModoEdicion(false); setMensajeOk(data.registrarAsistenciaBatch.mensaje);
      }
    } catch (e: any) { console.error(e); } finally { setGuardando(false); }
  };

  const estadoConfig = {
    PRESENTE:    { label: "Presente",    bgActivo: "bg-emerald-500 ring-2 ring-emerald-300 dark:ring-emerald-700 text-white", bgInactivo: "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30" },
    AUSENTE:     { label: "Ausente",     bgActivo: "bg-red-500 ring-2 ring-red-300 dark:ring-red-700 text-white",             bgInactivo: "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30" },
    JUSTIFICADO: { label: "Justificado", bgActivo: "bg-amber-500 ring-2 ring-amber-300 dark:ring-amber-700 text-white",       bgInactivo: "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 hover:bg-amber-100 dark:hover:bg-amber-900/30" },
  };

  const presentes    = registros.filter(r => r.estado === "PRESENTE").length;
  const ausentes     = registros.filter(r => r.estado === "AUSENTE").length;
  const justificados = registros.filter(r => r.estado === "JUSTIFICADO").length;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={!guardando ? onClose : undefined}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-lg flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center"><ClipboardList className="w-4 h-4 text-white" /></div>
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-white">{yaGuardado && !modoEdicion ? "Ver asistencia" : "Tomar asistencia"}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{audiencia.idTipoAudiencia?.nombre} · {new Date(audiencia.fechaHoraProgramada).toLocaleDateString("es-BO")}</p>
            </div>
          </div>
          {!guardando && <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"><X className="w-5 h-5" /></button>}
        </div>
        {registros.some(r => r.estado !== null) && (
          <div className="flex-shrink-0 px-6 py-3 border-b border-gray-200 dark:border-slate-700 flex gap-4">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{presentes} presentes</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /><span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{ausentes} ausentes</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{justificados} justificados</span></div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {loadingExistente ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" /></div>
          ) : registros.length === 0 ? (
            <div className="text-center py-10 text-gray-400 dark:text-gray-500"><Users className="w-10 h-10 mx-auto mb-2" /><p className="text-sm">No hay partes procesales activas</p></div>
          ) : (
            registros.map(r => (
              <div key={r.idPersona} className="p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{r.nombre.charAt(0)}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{r.nombre}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{r.rolEnAudiencia}</p>
                  </div>
                </div>
                {modoEdicion ? (
                  <div className="flex gap-2">
                    {(["PRESENTE", "AUSENTE", "JUSTIFICADO"] as EstadoAsistencia[]).map(est => {
                      const cfg = estadoConfig[est!];
                      const activo = r.estado === est;
                      return <button key={est} onClick={() => setEstado(r.idPersona, est)} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${activo ? cfg.bgActivo : cfg.bgInactivo}`}>{cfg.label}</button>;
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {r.estado && <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${r.estado === "PRESENTE" ? "bg-emerald-500" : r.estado === "AUSENTE" ? "bg-red-500" : "bg-amber-500"}`}>{estadoConfig[r.estado].label}</span>}
                    {r.motivoInasistencia && r.estado !== "PRESENTE" && <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{r.motivoInasistencia}</span>}
                  </div>
                )}
                {modoEdicion && (r.estado === "AUSENTE" || r.estado === "JUSTIFICADO") && (
                  <input type="text"
                    placeholder={r.estado === "JUSTIFICADO" ? "Motivo de justificación (opcional)..." : "Motivo de inasistencia (opcional)..."}
                    value={r.motivoInasistencia}
                    onChange={e => setMotivo(r.idPersona, e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-gray-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                )}
              </div>
            ))
          )}
          {mensajeOk && !modoEdicion && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" />{mensajeOk}
            </div>
          )}
        </div>
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex gap-2">
          {modoEdicion ? (
            <>
              <button onClick={yaGuardado ? () => setModoEdicion(false) : onClose} disabled={guardando} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm font-medium transition-colors disabled:opacity-40">Cancelar</button>
              <button onClick={guardar} disabled={guardando || !todosMarcados} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors">
                {guardando ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><Save className="w-4 h-4" /> Guardar asistencia</>}
              </button>
            </>
          ) : (
            <>
              <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm font-medium transition-colors">Cerrar</button>
              <button onClick={() => setModoEdicion(true)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors">
                <Edit2 className="w-4 h-4" /> Editar asistencia
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MODAL CITACIONES
// ══════════════════════════════════════════════════════════════════════════
function ModalCitaciones({ audiencia, partes, onClose }: { audiencia: any; partes: any[]; onClose: () => void }) {
  const [enviarCitaciones] = useMutation(ENVIAR_CITACIONES_AUDIENCIA);
  const [enviando, setEnviando]   = useState(false);
  const [resultado, setResultado] = useState<any | null>(null);

  const partesConEmail = partes.filter((p: any) => p.idPersona?.contactos?.some((c: any) => c.tipoContacto?.toLowerCase() === "email"));
  const partesSinEmail = partes.filter((p: any) => !p.idPersona?.contactos?.some((c: any) => c.tipoContacto?.toLowerCase() === "email"));

  const confirmar = async () => {
    setEnviando(true);
    try {
      const { data } = await enviarCitaciones({ variables: { idAudiencia: Number(audiencia.idAudiencia) } });
      setResultado(data?.enviarCitacionesAudiencia);
    } catch (e: any) { setResultado({ ok: false, mensaje: e.message ?? "Error al enviar." }); }
    finally { setEnviando(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={!enviando ? onClose : undefined}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center"><Send className="w-4 h-4 text-white" /></div>
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-white">Enviar Citaciones</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{audiencia.idTipoAudiencia?.nombre} · {fmtFechaHora(audiencia.fechaHoraProgramada)}</p>
            </div>
          </div>
          {!enviando && <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"><X className="w-5 h-5" /></button>}
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {!resultado ? (
            <>
              {partesConEmail.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Recibirán citación ({partesConEmail.length})</p>
                  <div className="space-y-2">
                    {partesConEmail.map((p: any) => {
                      const email = p.idPersona?.contactos?.find((c: any) => c.tipoContacto?.toLowerCase() === "email")?.valor;
                      return (
                        <div key={p.idParte} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50">
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{p.idPersona?.nombre} {p.idPersona?.primerApellido}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{p.idRol?.nombreRol} · {email}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {partesSinEmail.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Sin email registrado ({partesSinEmail.length})</p>
                  <div className="space-y-2">
                    {partesSinEmail.map((p: any) => (
                      <div key={p.idParte} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700">
                        <AlertCircle className="w-4 h-4 text-gray-400 shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{p.idPersona?.nombre} {p.idPersona?.primerApellido}</p>
                          <p className="text-xs text-gray-400">{p.idRol?.nombreRol} · Sin email</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {partesConEmail.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <AlertCircle className="w-10 h-10 text-amber-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Ninguna parte tiene email registrado</p>
                  <p className="text-xs text-gray-400">Registra los contactos de las partes antes de enviar citaciones.</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              {resultado.ok ? <CheckCircle className="w-12 h-12 text-emerald-500" /> : <AlertCircle className="w-12 h-12 text-amber-400" />}
              <p className="text-sm font-semibold text-gray-800 dark:text-white">{resultado.mensaje}</p>
              {resultado.destinatarios?.length > 0 && (
                <div className="w-full text-left space-y-1">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Enviados a:</p>
                  {resultado.destinatarios.map((d: string) => <p key={d} className="text-xs text-gray-600 dark:text-gray-300">✓ {d}</p>)}
                </div>
              )}
              {resultado.sinEmail?.length > 0 && (
                <div className="w-full text-left space-y-1">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sin email (no enviados):</p>
                  {resultado.sinEmail.map((d: string) => <p key={d} className="text-xs text-gray-400">✗ {d}</p>)}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex gap-2">
          {!resultado ? (
            <>
              <button onClick={onClose} disabled={enviando} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm font-medium transition-colors disabled:opacity-40">Cancelar</button>
              <button onClick={confirmar} disabled={enviando || partesConEmail.length === 0} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors">
                {enviando ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : <><Send className="w-4 h-4" /> Enviar {partesConEmail.length} citación{partesConEmail.length !== 1 ? "es" : ""}</>}
              </button>
            </>
          ) : (
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors">Cerrar</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// TARJETA DOCUMENTO
// ══════════════════════════════════════════════════════════════════════════
function TarjetaDocumento({ doc, eliminandoId, onEliminar, onArchivoSubido }: {
  doc: any; eliminandoId: number | null; onEliminar: () => void; onArchivoSubido: () => void;
}) {
  const [subiendo, setSubiendo]       = useState(false);
  const [errorSubida, setErrorSubida] = useState("");
  const [rutaLocal, setRutaLocal]     = useState<string | null>(doc.rutaArchivo || null);
  const [tamanoLocal, setTamanoLocal] = useState<number>(doc.tamanoKb ?? 0);
  const inputRef                      = useRef<HTMLInputElement>(null);

  const manejarReemplazo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    if (!archivo.name.toLowerCase().endsWith(".pdf")) { setErrorSubida("Solo se permiten archivos PDF."); return; }
    setSubiendo(true); setErrorSubida("");
    const formData = new FormData();
    formData.append("titulo", doc.titulo);
    formData.append("idExpediente", String(doc.idExpediente?.idExpediente ?? doc.idExpediente));
    formData.append("idTipoDoc", String(doc.idTipoDoc?.idTipoDoc ?? doc.idTipoDoc));
    formData.append("archivo", archivo);
    try {
      const resp = await fetch(`${DJANGO_BASE}/api/subir-documento/`, { method: "POST", body: formData });
      const json = await resp.json();
      if (json.ok) { setRutaLocal(json.rutaArchivo); setTamanoLocal(json.tamanoKb); onArchivoSubido(); }
      else { setErrorSubida(json.mensaje ?? "Error al subir."); }
    } catch { setErrorSubida("No se pudo conectar con el servidor."); }
    finally { setSubiendo(false); if (inputRef.current) inputRef.current.value = ""; }
  };

  const urlArchivo    = rutaLocal ? `${DJANGO_BASE}/media/${rutaLocal}` : null;
  const nombreArchivo = rutaLocal ? rutaLocal.split("/").pop() ?? "documento.pdf" : "documento.pdf";

  return (
    <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{doc.titulo}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Pill className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">{doc.idTipoDoc?.codigo}</Pill>
            {doc.idTipoDoc?.esPublico
              ? <Pill className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">Público</Pill>
              : <Pill className="bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400">Privado</Pill>}
            {doc.firmadoDigitalmente && <Pill className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">Firmado</Pill>}
          </div>
        </div>
        <BtnEliminar disabled={eliminandoId === doc.idDocumento} onClick={onEliminar} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <InfoCell label="Folio"              value={doc.numeroFolio ?? "—"} />
        <InfoCell label="Fecha presentación" value={fmtFecha(doc.fechaPresentacion)} />
        <InfoCell label="Tamaño"             value={tamanoLocal > 0 ? `${tamanoLocal} KB` : "—"} />
      </div>
      {urlArchivo ? (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40">
          <div className="w-9 h-9 rounded-lg bg-red-500 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-red-700 dark:text-red-400 truncate">{nombreArchivo}</p>
            <p className="text-[10px] text-red-400 dark:text-red-500 mt-0.5">{tamanoLocal > 0 ? `${tamanoLocal} KB` : "PDF"} · subido el {fmtFecha(doc.fechaPresentacion)}</p>
          </div>
          <a href={urlArchivo} target="_blank" rel="noreferrer" title="Ver PDF" className="p-1.5 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
          </a>
          <a href={urlArchivo} download={nombreArchivo} title="Descargar PDF" className="p-1.5 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </a>
          <button onClick={() => inputRef.current?.click()} title="Reemplazar archivo" disabled={subiendo}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-40">
            {subiendo ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
              </svg>
            )}
          </button>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()} disabled={subiendo}
          className="w-full flex flex-col items-center gap-2 py-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-400 dark:text-gray-500 hover:border-red-400 dark:hover:border-red-500 hover:text-red-500 dark:hover:text-red-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          {subiendo ? (
            <><Loader2 className="w-5 h-5 animate-spin" /><span className="text-xs font-medium">Subiendo...</span></>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
              </svg>
              <span className="text-xs font-medium">Agregar PDF</span>
            </>
          )}
        </button>
      )}
      {errorSubida && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errorSubida}
        </div>
      )}
      <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={manejarReemplazo} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════
export default function ExpedienteDetallePage() {
  const { id }       = useParams<{ id: string }>();
  const navigate     = useNavigate();
  const idExpediente = Number(id);

  const [tabActiva, setTabActiva]         = useState<TabId>("general");
  const [showForm, setShowForm]           = useState<Partial<Record<TabId, boolean>>>({});
  const [editandoAud, setEditandoAud]     = useState<any | null>(null);
  const [eliminandoId, setEliminandoId]   = useState<number | null>(null);
  const [generandoPdf, setGenerandoPdf]   = useState<number | null>(null);
  const [citacionAud, setCitacionAud]     = useState<any | null>(null);
  const [asistenciaAud, setAsistenciaAud] = useState<any | null>(null);
  // ── Nuevo: modal cambio de estado ─────────────────────────────────────
  const [showCambioEstado, setShowCambioEstado] = useState(false);

  const [enviarCitaciones]   = useMutation(ENVIAR_CITACIONES_AUDIENCIA);
  const { executeCreate, executeDelete } = useCrudNotifications("Expediente");

  const [eliminarAudiencia]    = useMutation(ELIMINAR_AUDIENCIA);
  const [eliminarParte]        = useMutation(ELIMINAR_PARTE);
  const [eliminarResolucion]   = useMutation(ELIMINAR_RESOLUCION);
  const [eliminarDocumento]    = useMutation(ELIMINAR_DOCUMENTO);
  const [eliminarActuacion]    = useMutation(ELIMINAR_ACTUACION);
  const [eliminarConformacion] = useMutation(ELIMINAR_CONFORMACION);

  const { data, loading, error, refetch } = useQuery(GET_DETALLE_EXPEDIENTE, {
    variables: { id: idExpediente },
    fetchPolicy: "cache-and-network",
  });

  const exp          = data?.expedienteById;
  const denunciaVinculada = exp?.denuncias?.[0] ?? null;
  const partes       = data?.partesPorExpediente         ?? [];
  const vocales      = data?.conformacionesPorExpediente ?? [];
  const audiencias   = data?.audienciasPorExpediente     ?? [];
  const resoluciones = data?.resolucionesPorExpediente   ?? [];
  const recursos     = data?.recursosPorExpediente       ?? [];
  const documentos   = data?.documentosPorExpediente     ?? [];
  const actuaciones  = data?.actuacionesPorExpediente    ?? [];
  const historial    = data?.historialPorExpediente      ?? [];

  const counts: Record<TabId, number | null> = {
    general: null, vocales: vocales.length, partes: partes.length,
    audiencias: audiencias.length, resoluciones: resoluciones.length,
    recursos: recursos.length, documentos: documentos.length,
    actuaciones: actuaciones.length, historial: historial.length,
  };

  const generarPdf = async (resolucion: any) => {
    setGenerandoPdf(resolucion.idResolucion);
    try {
      await generarDocumentoTribunal({
        tipo:               "RESOLUCION_FINAL",
        numeroExpediente:   exp.numeroExpediente,
        anioExpediente:     exp.ano,
        numeroDenuncia:     denunciaVinculada?.numeroDenuncia,
        nombreDestinatario: partes.length > 0
          ? partes.map((p: any) =>
              `${p.idPersona?.nombre ?? ""} ${p.idPersona?.primerApellido ?? ""}`.trim()
            ).join(" / ")
          : "Partes procesales",
        textoCuerpo:        resolucion.parteDispositiva ?? resolucion.fundamentacion ?? "",
        fechaDocumento:     resolucion.fechaResolucion,
      });
    } catch (e) {
      console.error("Error generando PDF:", e);
    } finally {
      setGenerandoPdf(null);
    }
  };

  const abrirForm  = (tab: TabId) => { setShowForm(p => ({ ...p, [tab]: true })); if (tab !== "audiencias") setEditandoAud(null); };
  const cerrarForm = (tab: TabId) => { setShowForm(p => ({ ...p, [tab]: false })); setEditandoAud(null); };
  const onSaved    = (tab: TabId) => { cerrarForm(tab); refetch(); };

  const eliminar = async (id: number, fn: () => Promise<any>, confirmMsg: string, toastMsgs: { loading: string; success: string; error: string }) => {
    await executeDelete(
      async () => {
        setEliminandoId(id);
        try {
          const { data: res } = await fn();
          const result = Object.values(res ?? {})[0] as any;
          if (!result?.ok) throw new Error(result?.mensaje ?? "No se pudo eliminar.");
          await refetch(); return true;
        } finally { setEliminandoId(null); }
      },
      toastMsgs, confirmMsg,
    );
  };

  return (
    <div className="space-y-0 animate-fade-in">

      {/* ENCABEZADO */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate("/expedientes")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium">
          <ChevronLeft className="w-4 h-4" /> Expedientes
        </button>
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="h-6 w-48 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse" />
          ) : exp ? (
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-blue-500 shrink-0" />
                Expediente <span className="font-mono text-blue-600 dark:text-blue-400">{exp.numeroExpediente}</span>
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {exp.idTipoProceso?.nombre} · {exp.idSala?.nombreSala} · {exp.idSala?.idTribunal?.nombreTribunal}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* LAYOUT */}
      <div className="flex gap-6 items-start">

        {/* SIDEBAR */}
        <nav className="w-44 shrink-0 bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {TABS.map(tab => {
            const Icon   = tab.icon;
            const count  = counts[tab.id];
            const activa = tabActiva === tab.id;
            return (
              <button key={tab.id} onClick={() => { setTabActiva(tab.id); setShowForm({}); setEditandoAud(null); }}
                className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition-all border-l-2 ${activa ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-gray-800 dark:hover:text-gray-200"}`}>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{tab.label}</span>
                {count !== null && count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activa ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300"}`}>{count}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* PANEL PRINCIPAL */}
        <div className="flex-1 min-w-0 bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" /><p className="text-sm">Cargando expediente...</p>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-red-400">
              <AlertCircle className="w-8 h-8" /><p className="text-sm">Error al cargar el expediente</p>
            </div>
          )}

          {!loading && !error && exp && (
            <>
              {/* ══ GENERAL ══ */}
              {tabActiva === "general" && (
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-slate-800/60 rounded-2xl p-5">
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Datos del expediente</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                      <InfoCell label="N° Expediente" value={<span className="font-mono text-blue-600 dark:text-blue-400 text-base font-bold">{exp.numeroExpediente}</span>} />
                      <InfoCell label="Año" value={exp.ano} />
                      <InfoCell label="Fecha de Ingreso" value={fmtFecha(exp.fechaIngreso)} />
                      <InfoCell label="Tipo de Proceso" value={<Pill className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 mt-0.5">{exp.idTipoProceso?.codigo} · {exp.idTipoProceso?.nombre}</Pill>} />
                      <InfoCell label="Estado" value={exp.idEstadoExpediente ? (
                        <Pill className={exp.idEstadoExpediente.esTerminal
                          ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 mt-0.5"
                          : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 mt-0.5"}>
                          {exp.idEstadoExpediente.esTerminal ? <Scale className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                          {exp.idEstadoExpediente.nombreEstado}
                        </Pill>) : "—"} />
                      <InfoCell label="Fecha de Conclusión" value={fmtFecha(exp.fechaConclusion)} />

                      {!exp.idEstadoExpediente?.esTerminal && (
                        <div className="col-span-full mt-1">
                          {denunciaVinculada ? (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                                  El estado de este expediente se gestiona desde la denuncia asociada
                                </p>
                                <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                                  Denuncia <span className="font-mono font-bold">{denunciaVinculada.numeroDenuncia}</span>
                                </p>
                              </div>
                              <button
                                onClick={() => navigate(`/denuncias/${denunciaVinculada.id}`)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors shrink-0"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                                Ir a la denuncia
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowCambioEstado(true)}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-sm font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                            >
                              <ArrowRight className="w-4 h-4" />
                              Cambiar estado
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {exp.descripcion && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Descripción</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{exp.descripcion}</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 dark:bg-slate-800/60 rounded-2xl p-5">
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Sala y Tribunal</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                      <InfoCell label="Sala" value={exp.idSala?.nombreSala} />
                      <InfoCell label="Tribunal" value={exp.idSala?.idTribunal?.nombreTribunal} />
                      <InfoCell label="Instancia" value={exp.idSala?.idTribunal?.instancia} />
                      <InfoCell label="Estado de Sala" value={
                        <Pill className={exp.idSala?.activa
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 mt-0.5"
                          : "bg-gray-100 dark:bg-slate-700 text-gray-500 mt-0.5"}>
                          {exp.idSala?.activa ? "Activa" : "Inactiva"}
                        </Pill>} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Partes procesales", count: partes.length,       color: "blue",    tab: "partes"       as TabId },
                      { label: "Actuaciones",        count: actuaciones.length,  color: "indigo",  tab: "actuaciones"  as TabId },
                      { label: "Audiencias",         count: audiencias.length,   color: "purple",  tab: "audiencias"   as TabId },
                      { label: "Resoluciones",       count: resoluciones.length, color: "emerald", tab: "resoluciones" as TabId },
                    ].map(({ label, count, color, tab }) => {
                      const s = RESUMEN_STYLES[color];
                      return (
                        <button key={label} onClick={() => setTabActiva(tab)} className={`${s.bg} rounded-xl p-4 border ${s.border} text-left hover:opacity-80 transition-opacity cursor-pointer`}>
                          <p className={`text-2xl font-bold ${s.text}`}>{count}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ══ CONFORMACIÓN ══ */}
              {tabActiva === "vocales" && (
                <div className="space-y-4">
                  <SeccionHeader count={vocales.length} singular="vocal asignado" plural="vocales asignados" onAgregar={() => abrirForm("vocales")} mostrarBoton={!showForm["vocales"]} />
                  {showForm["vocales"] && <FormConformacion idExpediente={idExpediente} vocalesYaAsignados={vocales.map((c: any) => Number(c.idVocal?.idVocal))} onSaved={() => onSaved("vocales")} onCancel={() => cerrarForm("vocales")} />}
                  {vocales.length === 0 && !showForm["vocales"] ? (
                    <TablaVacia icono={Building2} mensaje="Sin conformación de sala registrada" onAgregar={() => abrirForm("vocales")} labelAgregar="Asignar vocal" />
                  ) : (
                    <div className="space-y-3">
                      {vocales.map((c: any) => (
                        <div key={c.idConformacion} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center"><UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /></div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800 dark:text-white">{c.idVocal?.idPersona?.nombre} {c.idVocal?.idPersona?.primerApellido}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{c.idVocal?.cargo} · {c.idVocal?.idSala?.nombreSala}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Pill className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">{c.rolEnCaso}</Pill>
                            <BtnEliminar disabled={eliminandoId === c.idConformacion}
                              onClick={() => eliminar(c.idConformacion, () => eliminarConformacion({ variables: { id: Number(c.idConformacion) } }) as any,
                                `¿Quitar al vocal ${c.idVocal?.idPersona?.nombre} de este expediente?`,
                                { loading: "Quitando vocal...", success: "Vocal quitado del expediente", error: "Error al quitar el vocal" })} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ══ PARTES ══ */}
              {tabActiva === "partes" && (
                <div className="space-y-4">
                  <SeccionHeader count={partes.length} singular="parte procesal" plural="partes procesales" onAgregar={() => abrirForm("partes")} mostrarBoton={!showForm["partes"]} />
                  {showForm["partes"] && <FormParte idExpediente={idExpediente} onSaved={() => onSaved("partes")} onCancel={() => cerrarForm("partes")} />}
                  {partes.length === 0 && !showForm["partes"] ? (
                    <TablaVacia icono={Users} mensaje="Sin partes procesales registradas" onAgregar={() => abrirForm("partes")} labelAgregar="Agregar parte" />
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-slate-800/80">
                          <tr>{["Persona", "Documento", "Rol Procesal", "Abogado", "Estado", ""].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                          {partes.map((p: any) => (
                            <tr key={p.idParte} className="hover:bg-gray-50 dark:hover:bg-slate-800/40">
                              <td className="px-4 py-3"><p className="text-sm font-medium text-gray-800 dark:text-white">{p.idPersona?.nombre} {p.idPersona?.primerApellido} {p.idPersona?.segundoApellido}</p></td>
                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 font-mono">{p.idPersona?.numeroDocumento ?? "—"}</td>
                              <td className="px-4 py-3"><Pill className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">{p.idRol?.nombreRol}</Pill></td>
                              <td className="px-4 py-3">{p.idPersona?.esAbogado ? <Pill className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">Sí</Pill> : <span className="text-xs text-gray-400">No</span>}</td>
                              <td className="px-4 py-3"><Pill className={p.activo ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"}>{p.activo ? "Activo" : "Excluido"}</Pill></td>
                              <td className="px-4 py-3 text-right">
                                <BtnEliminar disabled={eliminandoId === p.idParte}
                                  onClick={() => eliminar(p.idParte, () => eliminarParte({ variables: { id: Number(p.idParte) } }) as any,
                                    `¿Eliminar a ${p.idPersona?.nombre} ${p.idPersona?.primerApellido} como parte procesal?`,
                                    { loading: "Eliminando parte...", success: "Parte procesal eliminada", error: "Error al eliminar la parte" })} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ══ ACTUACIONES ══ */}
              {tabActiva === "actuaciones" && (
                <div className="space-y-4">
                  <SeccionHeader count={actuaciones.length} singular="actuación" plural="actuaciones" onAgregar={() => abrirForm("actuaciones")} mostrarBoton={!showForm["actuaciones"]} />
                  {showForm["actuaciones"] && <FormActuacion idExpediente={idExpediente} onSaved={() => onSaved("actuaciones")} onCancel={() => cerrarForm("actuaciones")} />}
                  {actuaciones.length === 0 && !showForm["actuaciones"] ? (
                    <TablaVacia icono={ClipboardList} mensaje="Sin actuaciones procesales registradas" onAgregar={() => abrirForm("actuaciones")} labelAgregar="Registrar actuación" />
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-slate-800/80">
                          <tr>{["Tipo", "Fecha", "Folios", "Usuario", "Pública", "Descripción", ""].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                          {actuaciones.map((a: any) => (
                            <tr key={a.idActuacion} className="hover:bg-gray-50 dark:hover:bg-slate-800/40">
                              <td className="px-4 py-3"><Pill className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">{a.idTipoActuacion?.codigo}</Pill><p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{a.idTipoActuacion?.nombre}</p></td>
                              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{fmtFecha(a.fechaActuacion)}</td>
                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 font-mono">{a.folioInicio} – {a.folioFin}</td>
                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{a.usuario?.paterno} {a.usuario?.nombres}</td>
                              <td className="px-4 py-3">{a.esPublica ? <Pill className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">Sí</Pill> : <span className="text-xs text-gray-400">No</span>}</td>
                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">{a.descripcion ?? "—"}</td>
                              <td className="px-4 py-3 text-right">
                                <BtnEliminar disabled={eliminandoId === a.idActuacion}
                                  onClick={() => eliminar(a.idActuacion, () => eliminarActuacion({ variables: { id: Number(a.idActuacion) } }) as any,
                                    `¿Eliminar esta actuación procesal?`,
                                    { loading: "Eliminando actuación...", success: "Actuación eliminada", error: "Error al eliminar la actuación" })} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ══ AUDIENCIAS ══ */}
              {tabActiva === "audiencias" && (
                <div className="space-y-4">
                  <SeccionHeader count={audiencias.length} singular="audiencia" plural="audiencias" onAgregar={() => { setEditandoAud(null); abrirForm("audiencias"); }} mostrarBoton={!showForm["audiencias"]} />
                  {showForm["audiencias"] && <FormAudiencia idExpediente={idExpediente} editando={editandoAud} onSaved={() => onSaved("audiencias")} onCancel={() => cerrarForm("audiencias")} />}
                  {audiencias.length === 0 && !showForm["audiencias"] ? (
                    <TablaVacia icono={Calendar} mensaje="Sin audiencias registradas" onAgregar={() => abrirForm("audiencias")} labelAgregar="Programar audiencia" />
                  ) : (
                    <div className="space-y-3">
                      {audiencias.map((a: any) => (
                        <div key={a.idAudiencia} className={`p-4 rounded-xl border transition-all space-y-3 ${editandoAud?.idAudiencia === a.idAudiencia ? "bg-blue-50 dark:bg-blue-900/10 border-blue-300 dark:border-blue-700" : "bg-gray-50 dark:bg-slate-800/60 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${audBg[a.estadoAudiencia] ?? "bg-gray-100 dark:bg-slate-700"}`}>
                                <Calendar className={`w-4 h-4 ${audIc[a.estadoAudiencia] ?? "text-gray-500"}`} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{a.idTipoAudiencia?.nombre}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{fmtFechaHora(a.fechaHoraProgramada)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Pill className={estadoAudienciaColor[a.estadoAudiencia] ?? "bg-gray-100 text-gray-600"}>{a.estadoAudiencia}</Pill>
                              {!showForm["audiencias"] && (
                                <div className="flex items-center gap-1">
                                  <button onClick={() => setCitacionAud(a)} title="Enviar citaciones por email" className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Send className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => setAsistenciaAud(a)} title="Tomar asistencia" className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"><ClipboardList className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => { setEditandoAud(a); abrirForm("audiencias"); }} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                                  <BtnEliminar disabled={eliminandoId === a.idAudiencia}
                                    onClick={() => eliminar(a.idAudiencia, () => eliminarAudiencia({ variables: { id: Number(a.idAudiencia) } }) as any,
                                      `¿Eliminar la audiencia del ${fmtFechaHora(a.fechaHoraProgramada)}?`,
                                      { loading: "Eliminando audiencia...", success: "Audiencia eliminada", error: "Error al eliminar la audiencia" })} />
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                            <InfoCell label="Sala" value={a.idSalaAud?.nombreSala ?? "—"} />
                            <InfoCell label="Inicio" value={fmtFechaHora(a.fechaHoraInicio)} />
                            <InfoCell label="Fin" value={fmtFechaHora(a.fechaHoraFin)} />
                            {a.motivoSuspension && <div className="col-span-full"><InfoCell label="Motivo suspensión" value={<span className="text-amber-600 dark:text-amber-400">{a.motivoSuspension}</span>} /></div>}
                            {a.linkVideoconferencia && (
                              <div className="col-span-full">
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-0.5">Enlace</p>
                                <a href={a.linkVideoconferencia} target="_blank" rel="noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                                  <Video className="w-3.5 h-3.5" /> Videoconferencia
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {citacionAud  && <ModalCitaciones  audiencia={citacionAud}  partes={partes.filter((p: any) => p.activo)} onClose={() => setCitacionAud(null)} />}
                  {asistenciaAud && <ModalAsistencia audiencia={asistenciaAud} partes={partes.filter((p: any) => p.activo)} onClose={() => setAsistenciaAud(null)} />}
                </div>
              )}

              {/* ══ DOCUMENTOS ══ */}
              {tabActiva === "documentos" && (
                <div className="space-y-4">
                  <SeccionHeader count={documentos.length} singular="documento" plural="documentos" onAgregar={() => abrirForm("documentos")} mostrarBoton={!showForm["documentos"]} />
                  {showForm["documentos"] && <FormDocumento idExpediente={idExpediente} onSaved={() => onSaved("documentos")} onCancel={() => cerrarForm("documentos")} />}
                  {documentos.length === 0 && !showForm["documentos"] ? (
                    <TablaVacia icono={FileText} mensaje="Sin documentos registrados" onAgregar={() => abrirForm("documentos")} labelAgregar="Registrar documento" />
                  ) : (
                    <div className="space-y-3">
                      {documentos.map((d: any) => (
                        <TarjetaDocumento
                          key={d.idDocumento}
                          doc={d}
                          eliminandoId={eliminandoId}
                          onEliminar={() => eliminar(d.idDocumento, () => eliminarDocumento({ variables: { id: Number(d.idDocumento) } }) as any,
                            `¿Eliminar el documento "${d.titulo}"?`,
                            { loading: "Eliminando documento...", success: `"${d.titulo}" eliminado`, error: "Error al eliminar el documento" })}
                          onArchivoSubido={() => refetch()}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ══ RESOLUCIONES ══ */}
              {tabActiva === "resoluciones" && (
                <div className="space-y-4">
                  <SeccionHeader count={resoluciones.length} singular="resolución" plural="resoluciones" onAgregar={() => abrirForm("resoluciones")} mostrarBoton={!showForm["resoluciones"]} />
                  {showForm["resoluciones"] && <FormResolucion idExpediente={idExpediente} onSaved={() => onSaved("resoluciones")} onCancel={() => cerrarForm("resoluciones")} />}
                  {resoluciones.length === 0 && !showForm["resoluciones"] ? (
                    <TablaVacia icono={Scale} mensaje="Sin resoluciones registradas" onAgregar={() => abrirForm("resoluciones")} labelAgregar="Nueva resolución" />
                  ) : (
                    resoluciones.map((r: any) => (
                      <div key={r.idResolucion} className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-gray-800 dark:text-white font-mono">{r.numeroResolucion}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{r.idTipoRes?.codigo} · {r.idTipoRes?.nombre}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Pill className={r.estado === "VIGENTE" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"}>{r.estado}</Pill>
                            {r.esRecurrible && <Pill className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">Recurrible · {r.plazoRecursoDias}d</Pill>}
                            <button onClick={() => generarPdf(r)} disabled={generandoPdf === r.idResolucion} title="Descargar resolución en PDF"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold border border-red-200 dark:border-red-800/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                              {generandoPdf === r.idResolucion ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generando...</> : <><FileDown className="w-3.5 h-3.5" /> PDF</>}
                            </button>
                            <BtnEliminar disabled={eliminandoId === r.idResolucion}
                              onClick={() => eliminar(r.idResolucion, () => eliminarResolucion({ variables: { id: Number(r.idResolucion) } }) as any,
                                `¿Eliminar la resolución ${r.numeroResolucion}?`,
                                { loading: "Eliminando resolución...", success: `Resolución ${r.numeroResolucion} eliminada`, error: "Error al eliminar la resolución" })} />
                          </div>
                        </div>
                        <InfoCell label="Fecha de Resolución" value={fmtFecha(r.fechaResolucion)} />
                        {r.parteDispositiva && <div><p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Parte Dispositiva</p><p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900/50 rounded-lg p-3 border border-gray-200 dark:border-slate-700 leading-relaxed">{r.parteDispositiva}</p></div>}
                        {r.fundamentacion && <div><p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Fundamentación</p><p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900/50 rounded-lg p-3 border border-gray-200 dark:border-slate-700 leading-relaxed">{r.fundamentacion}</p></div>}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ══ RECURSOS ══ */}
              {tabActiva === "recursos" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{recursos.length} recurso{recursos.length !== 1 ? "s" : ""}</p>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-700/60 text-gray-400 dark:text-gray-500 text-xs">
                      <AlertCircle className="w-3.5 h-3.5" /> Se crean desde una resolución existente
                    </div>
                  </div>
                  {recursos.length === 0 ? (
                    <TablaVacia icono={Gavel} mensaje="Sin recursos registrados. Los recursos se interponen sobre resoluciones vigentes." />
                  ) : (
                    recursos.map((r: any) => (
                      <div key={r.idRecurso} className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-white">{r.idTipoRecurso?.nombre}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Resolución: <span className="font-mono">{r.idResolucionImpugnada?.numeroResolucion}</span></p>
                          </div>
                          <Pill className={estadoRecursoColor[r.estadoRecurso] ?? "bg-gray-100 text-gray-600"}>{r.estadoRecurso}</Pill>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <InfoCell label="Recurrente" value={`${r.idRecurrente?.idPersona?.nombre ?? ""} ${r.idRecurrente?.idPersona?.primerApellido ?? ""}`} />
                          <InfoCell label="Rol" value={r.idRecurrente?.idRol?.nombreRol} />
                          <InfoCell label="Fecha de Interposición" value={fmtFecha(r.fechaInterposicion)} />
                        </div>
                        {r.fundamentos && <div><p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Fundamentos</p><p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900/50 rounded-lg p-3 border border-gray-200 dark:border-slate-700 leading-relaxed">{r.fundamentos}</p></div>}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ══ HISTORIAL ══ */}
              {tabActiva === "historial" && <TimelineHistorial historial={historial} />}
            </>
          )}
        </div>
      </div>

      {/* ══ MODAL CAMBIO DE ESTADO ══ */}
      {showCambioEstado && exp && (
        <ModalCambioEstado
          expediente={exp}
          onClose={() => setShowCambioEstado(false)}
          onCambiado={() => { setShowCambioEstado(false); refetch(); }}
        />
      )}
    </div>
  );
}