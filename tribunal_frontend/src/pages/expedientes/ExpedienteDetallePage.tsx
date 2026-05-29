import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import { GET_DETALLE_EXPEDIENTE } from "../../graphql/expedienteDetalle";
import {
  CREAR_AUDIENCIA, ACTUALIZAR_AUDIENCIA, ELIMINAR_AUDIENCIA,
  GET_TIPOS_AUDIENCIA, GET_SALAS_AUDIENCIA,
} from "../../graphql/audiencias";
import {
  X, FolderOpen, Users, Calendar, Scale, FileText,
  ClipboardList, History, Building2, CheckCircle, AlertCircle,
  Clock, Gavel, UserCheck, ArrowRight, Loader2, GitBranch,
  Plus, Edit2, Trash2, Save, XCircle, Video, ChevronLeft,
} from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────────────────

const fmtFecha = (iso?: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtFechaHora = (iso?: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-BO", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
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

// ── Estilos ────────────────────────────────────────────────────────────────

const estadoAudienciaColor: Record<string, string> = {
  PROGRAMADA: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  REALIZADA:  "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  SUSPENDIDA: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  CANCELADA:  "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  EN_CURSO:   "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400",
  FINALIZADA: "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300",
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
  blue:    { bg: "bg-blue-50 dark:bg-blue-900/10",    border: "border-blue-100 dark:border-blue-900/30",    text: "text-blue-600 dark:text-blue-400"    },
  indigo:  { bg: "bg-indigo-50 dark:bg-indigo-900/10", border: "border-indigo-100 dark:border-indigo-900/30", text: "text-indigo-600 dark:text-indigo-400" },
  purple:  { bg: "bg-purple-50 dark:bg-purple-900/10", border: "border-purple-100 dark:border-purple-900/30", text: "text-purple-600 dark:text-purple-400" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-900/10", border: "border-emerald-100 dark:border-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400" },
};

// ── Componentes pequeños ───────────────────────────────────────────────────

const Pill = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

const InfoCell = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div>
    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-0.5">{label}</p>
    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{value ?? "—"}</p>
  </div>
);

const TablaVacia = ({ icono: Icon, mensaje }: { icono: React.ElementType; mensaje: string }) => (
  <div className="flex flex-col items-center gap-3 py-10 text-gray-400 dark:text-gray-600">
    <Icon className="w-10 h-10" />
    <p className="text-sm">{mensaje}</p>
  </div>
);

// ── Tabs ───────────────────────────────────────────────────────────────────

const TABS = [
  { id: "general",      label: "General",      icon: FolderOpen    },
  { id: "vocales",      label: "Conformación", icon: Building2     },
  { id: "partes",       label: "Partes",       icon: Users         },
  { id: "audiencias",   label: "Audiencias",   icon: Calendar      },
  { id: "resoluciones", label: "Resoluciones", icon: Scale         },
  { id: "recursos",     label: "Recursos",     icon: Gavel         },
  { id: "documentos",   label: "Documentos",   icon: FileText      },
  { id: "actuaciones",  label: "Actuaciones",  icon: ClipboardList },
  { id: "historial",    label: "Historial",    icon: History       },
] as const;

type TabId = typeof TABS[number]["id"];

// ── Formulario inline de audiencia ────────────────────────────────────────

const INIT_FORM_AUD = {
  idTipoAudiencia: 0, idSalaAud: 0, fechaHoraProgramada: "",
  linkVideoconferencia: "", estadoAudiencia: "PROGRAMADA", motivoSuspension: "",
};

function AudienciaFormInline({
  idExpediente, editando, onSaved, onCancel,
}: {
  idExpediente: number; editando: any | null; onSaved: () => void; onCancel: () => void;
}) {
  const { data: dTipo } = useQuery(GET_TIPOS_AUDIENCIA);
  const { data: dSala } = useQuery(GET_SALAS_AUDIENCIA);
  const [crearAudiencia]      = useMutation(CREAR_AUDIENCIA);
  const [actualizarAudiencia] = useMutation(ACTUALIZAR_AUDIENCIA);

  const [form, setForm] = useState(
    editando ? {
      idTipoAudiencia: editando.idTipoAudiencia?.idTipoAudiencia ?? 0,
      idSalaAud: editando.idSalaAud?.idSalaAud ?? 0,
      fechaHoraProgramada: editando.fechaHoraProgramada?.slice(0, 16) ?? "",
      linkVideoconferencia: editando.linkVideoconferencia ?? "",
      estadoAudiencia: editando.estadoAudiencia ?? "PROGRAMADA",
      motivoSuspension: editando.motivoSuspension ?? "",
    } : { ...INIT_FORM_AUD }
  );
  const [err, setErr]       = useState("");
  const [saving, setSaving] = useState(false);

  const tipos: any[] = dTipo?.allTiposAudiencia ?? [];
  const salas: any[] = dSala?.allSalasAudiencia ?? [];
  const set = (k: string) => (e: React.ChangeEvent<any>) => setForm(p => ({ ...p, [k]: e.target.value }));

  const guardar = async () => {
    if (!form.idTipoAudiencia || !form.fechaHoraProgramada) {
      setErr("Tipo de audiencia y fecha son obligatorios."); return;
    }
    setSaving(true); setErr("");
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
          idExpediente: Number(idExpediente),
          idTipoAudiencia: Number(form.idTipoAudiencia),
          fechaHoraProgramada: form.fechaHoraProgramada,
          idSalaAud: Number(form.idSalaAud) || undefined,
          linkVideoconferencia: form.linkVideoconferencia || undefined,
        }}});
      }
      onSaved();
    } catch (e: any) {
      setErr(e.message ?? "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all";
  const labelCls = "block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1";

  return (
    <div className="rounded-2xl border-2 border-blue-200 dark:border-blue-800/60 bg-blue-50/60 dark:bg-blue-900/10 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <p className="text-sm font-bold text-gray-800 dark:text-white">
            {editando ? "Editar audiencia" : "Programar nueva audiencia"}
          </p>
        </div>
        <button onClick={onCancel} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Tipo de audiencia <span className="text-red-500">*</span></label>
          <select value={form.idTipoAudiencia} onChange={set("idTipoAudiencia")} className={inputCls}>
            <option value={0}>— Seleccionar tipo —</option>
            {tipos.map((t: any) => (
              <option key={t.idTipoAudiencia} value={t.idTipoAudiencia}>{t.nombre} ({t.duracionEstimada} min)</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Fecha y hora <span className="text-red-500">*</span></label>
          <input type="datetime-local" value={form.fechaHoraProgramada} onChange={set("fechaHoraProgramada")} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Sala de audiencia</label>
          <select value={form.idSalaAud} onChange={set("idSalaAud")} className={inputCls}>
            <option value={0}>— Sin sala asignada —</option>
            {salas.filter((s: any) => s.activa).map((s: any) => (
              <option key={s.idSalaAud} value={s.idSalaAud}>
                {s.nombreSala} (cap. {s.capacidad}){s.equipadaVideoconf ? " 📹" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Link videoconferencia</label>
          <input type="url" placeholder="https://meet.google.com/..." value={form.linkVideoconferencia} onChange={set("linkVideoconferencia")} className={inputCls} />
        </div>
        {editando && (
          <div>
            <label className={labelCls}>Estado</label>
            <select value={form.estadoAudiencia} onChange={set("estadoAudiencia")} className={inputCls}>
              <option value="PROGRAMADA">Programada</option>
              <option value="EN_CURSO">En curso</option>
              <option value="REALIZADA">Realizada</option>
              <option value="SUSPENDIDA">Suspendida</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>
        )}
        {editando && form.estadoAudiencia === "SUSPENDIDA" && (
          <div className="sm:col-span-2">
            <label className={labelCls}>Motivo de suspensión</label>
            <textarea rows={2} placeholder="Describe el motivo..." value={form.motivoSuspension} onChange={set("motivoSuspension")} className={`${inputCls} resize-none`} />
          </div>
        )}
      </div>

      {err && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{err}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm font-medium transition-colors flex items-center gap-1.5">
          <XCircle className="w-4 h-4" /> Cancelar
        </button>
        <button onClick={guardar} disabled={saving} className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-500/30">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {editando ? "Guardar cambios" : "Programar audiencia"}
        </button>
      </div>
    </div>
  );
}

// ── Timeline historial ─────────────────────────────────────────────────────

function TimelineHistorial({ historial }: { historial: any[] }) {
  if (historial.length === 0)
    return <TablaVacia icono={History} mensaje="Sin cambios de estado registrados" />;

  const ordenado = [...historial].sort(
    (a, b) => new Date(a.fechaCambio).getTime() - new Date(b.fechaCambio).getTime()
  );

  return (
    <div className="space-y-0">
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200 dark:border-slate-700">
        <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/30">
          <GitBranch className="w-4 h-4 text-purple-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-white">Historial de Estados</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {ordenado.length} cambio{ordenado.length !== 1 ? "s" : ""} registrado{ordenado.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
      <div className="relative">
        <div className="absolute left-[17px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-gray-200 via-gray-300 to-transparent dark:from-slate-600 dark:via-slate-600 dark:to-transparent" />
        <div className="space-y-0">
          {ordenado.map((h: any, idx: number) => {
            const ns      = getNodeStyle(h.idEstadoNuevo?.nombreEstado);
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
                <div className={`flex-1 min-w-0 rounded-2xl border p-4 transition-all hover:shadow-md ${
                  esUltimo ? "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50 shadow-sm"
                           : "bg-gray-50 dark:bg-slate-800/60 border-gray-200 dark:border-slate-700"
                }`}>
                  {esUltimo && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Estado actual</span>
                    </div>
                  )}
                  {esPrimero && !esUltimo && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Estado inicial</span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {h.idEstadoAnterior
                      ? <Pill className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-semibold">{h.idEstadoAnterior.nombreEstado}</Pill>
                      : <Pill className="bg-gray-100 dark:bg-slate-700 text-gray-400 italic">(sin estado)</Pill>
                    }
                    <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                    <Pill className={`font-semibold ${esUltimo ? "bg-blue-500 text-white shadow-sm shadow-blue-500/30" : "bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-slate-600"}`}>
                      {h.idEstadoNuevo?.nombreEstado}
                    </Pill>
                  </div>
                  {h.motivo && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3 bg-white dark:bg-slate-900/40 rounded-lg px-3 py-2 border border-gray-100 dark:border-slate-700 italic">
                      "{h.motivo}"
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtFechaHora(h.fechaCambio)}</span>
                    <span className="text-gray-300 dark:text-slate-600">·</span>
                    <span>{tiempoRelativo(h.fechaCambio)}</span>
                    {(h.usuario?.paterno || h.usuario?.nombres) && (
                      <>
                        <span className="text-gray-300 dark:text-slate-600">·</span>
                        <span className="flex items-center gap-1 font-medium text-gray-500 dark:text-gray-400">
                          <UserCheck className="w-3 h-3" />{h.usuario.paterno} {h.usuario.nombres}
                        </span>
                      </>
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
                  <>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400">{h.idEstadoAnterior.nombreEstado}</span>
                    <ArrowRight className="w-3 h-3 text-gray-300 dark:text-slate-600" />
                  </>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full ${idx === ordenado.length - 1 ? "bg-blue-500 text-white font-semibold" : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400"}`}>
                  {h.idEstadoNuevo?.nombreEstado}
                </span>
                {idx < ordenado.length - 1 && <ArrowRight className="w-3 h-3 text-gray-300 dark:text-slate-600" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────

export default function ExpedienteDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const idExpediente = Number(id);

  const [tabActiva, setTabActiva]       = useState<TabId>("general");
  const [showFormAud, setShowFormAud]   = useState(false);
  const [editandoAud, setEditandoAud]   = useState<any | null>(null);
  const [eliminarAudiencia]             = useMutation(ELIMINAR_AUDIENCIA);

  const { data, loading, error, refetch } = useQuery(GET_DETALLE_EXPEDIENTE, {
    variables: { id: idExpediente },
    fetchPolicy: "cache-and-network",
  });

  const exp          = data?.expedienteById;
  const partes       = data?.partesPorExpediente        ?? [];
  const vocales      = data?.conformacionesPorExpediente ?? [];
  const audiencias   = data?.audienciasPorExpediente    ?? [];
  const resoluciones = data?.resolucionesPorExpediente  ?? [];
  const recursos     = data?.recursosPorExpediente      ?? [];
  const documentos   = data?.documentosPorExpediente    ?? [];
  const actuaciones  = data?.actuacionesPorExpediente   ?? [];
  const historial    = data?.historialPorExpediente     ?? [];

  const counts: Record<TabId, number | null> = {
    general: null, vocales: vocales.length, partes: partes.length,
    audiencias: audiencias.length, resoluciones: resoluciones.length,
    recursos: recursos.length, documentos: documentos.length,
    actuaciones: actuaciones.length, historial: historial.length,
  };

  const abrirCrearAud  = () => { setEditandoAud(null); setShowFormAud(true); };
  const abrirEditarAud = (a: any) => { setEditandoAud(a); setShowFormAud(true); };
  const onAudSaved     = () => { setShowFormAud(false); setEditandoAud(null); refetch(); };
  const onAudCancelled = () => { setShowFormAud(false); setEditandoAud(null); };

  const eliminarAud = async (a: any) => {
    if (!window.confirm(`¿Eliminar la audiencia del ${fmtFechaHora(a.fechaHoraProgramada)}?`)) return;
    const { data: res } = await eliminarAudiencia({ variables: { id: Number(a.idAudiencia) } });
    if (!res?.eliminarAudiencia?.ok) {
      alert(res?.eliminarAudiencia?.mensaje ?? "No se pudo eliminar."); return;
    }
    refetch();
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-0 animate-fade-in">

      {/* ENCABEZADO DE PÁGINA */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/expedientes")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Expedientes
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

      {/* CONTENEDOR PRINCIPAL: sidebar izquierdo + contenido derecho */}
      <div className="flex gap-6 items-start">

        {/* ── SIDEBAR DE TABS (vertical) ── */}
        <nav className="w-44 shrink-0 bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {TABS.map(tab => {
            const Icon  = tab.icon;
            const count = counts[tab.id];
            const activa = tabActiva === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setTabActiva(tab.id);
                  if (tab.id !== "audiencias") { setShowFormAud(false); setEditandoAud(null); }
                }}
                className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition-all border-l-2 ${
                  activa
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{tab.label}</span>
                {count !== null && count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activa ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ── PANEL DE CONTENIDO ── */}
        <div className="flex-1 min-w-0 bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">

          {loading && (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm">Cargando expediente...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-red-400">
              <AlertCircle className="w-8 h-8" />
              <p className="text-sm">Error al cargar el expediente</p>
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
                      <InfoCell label="N° Expediente" value={
                        <span className="font-mono text-blue-600 dark:text-blue-400 text-base font-bold">{exp.numeroExpediente}</span>
                      } />
                      <InfoCell label="Año" value={exp.ano} />
                      <InfoCell label="Fecha de Ingreso" value={fmtFecha(exp.fechaIngreso)} />
                      <InfoCell label="Tipo de Proceso" value={
                        <Pill className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 mt-0.5">
                          {exp.idTipoProceso?.codigo} · {exp.idTipoProceso?.nombre}
                        </Pill>
                      } />
                      <InfoCell label="Estado" value={
                        exp.idEstadoExpediente ? (
                          <Pill className={exp.idEstadoExpediente.esTerminal
                            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 mt-0.5"
                            : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 mt-0.5"
                          }>
                            {exp.idEstadoExpediente.esTerminal ? <Scale className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                            {exp.idEstadoExpediente.nombreEstado}
                          </Pill>
                        ) : "—"
                      } />
                      <InfoCell label="Fecha de Conclusión" value={fmtFecha(exp.fechaConclusion)} />
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
                          : "bg-gray-100 dark:bg-slate-700 text-gray-500 mt-0.5"
                        }>{exp.idSala?.activa ? "Activa" : "Inactiva"}</Pill>
                      } />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Partes procesales", count: partes.length,       color: "blue"    },
                      { label: "Audiencias",         count: audiencias.length,   color: "indigo"  },
                      { label: "Resoluciones",       count: resoluciones.length, color: "purple"  },
                      { label: "Documentos",         count: documentos.length,   color: "emerald" },
                    ].map(({ label, count, color }) => {
                      const s = RESUMEN_STYLES[color];
                      return (
                        <div key={label} className={`${s.bg} rounded-xl p-4 border ${s.border}`}>
                          <p className={`text-2xl font-bold ${s.text}`}>{count}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ══ CONFORMACIÓN ══ */}
              {tabActiva === "vocales" && (
                <div>
                  {vocales.length === 0 ? <TablaVacia icono={Building2} mensaje="Sin conformación de sala registrada" /> : (
                    <div className="space-y-3">
                      {vocales.map((c: any) => (
                        <div key={c.idConformacion} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                              <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                {c.idVocal?.idPersona?.nombre} {c.idVocal?.idPersona?.primerApellido}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{c.idVocal?.cargo} · {c.idVocal?.idSala?.nombreSala}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Pill className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">{c.rolEnCaso}</Pill>
                            <Pill className={c.idVocal?.activo ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-slate-700 text-gray-500"}>
                              {c.idVocal?.activo ? "Activo" : "Inactivo"}
                            </Pill>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ══ PARTES ══ */}
              {tabActiva === "partes" && (
                <div>
                  {partes.length === 0 ? <TablaVacia icono={Users} mensaje="Sin partes procesales registradas" /> : (
                    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-slate-800/80">
                          <tr>
                            {["Persona", "Documento", "Rol Procesal", "Abogado", "Estado"].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                          {partes.map((p: any) => (
                            <tr key={p.idParte} className="hover:bg-gray-50 dark:hover:bg-slate-800/40">
                              <td className="px-4 py-3">
                                <p className="text-sm font-medium text-gray-800 dark:text-white">{p.idPersona?.nombre} {p.idPersona?.primerApellido} {p.idPersona?.segundoApellido}</p>
                                {p.idPersona?.estamento && <p className="text-xs text-gray-500 dark:text-gray-400">{p.idPersona.estamento}</p>}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 font-mono">{p.idPersona?.numeroDocumento ?? "—"}</td>
                              <td className="px-4 py-3"><Pill className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">{p.idRol?.nombreRol}</Pill></td>
                              <td className="px-4 py-3">
                                {p.idPersona?.esAbogado ? <Pill className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">Sí</Pill> : <span className="text-xs text-gray-400">No</span>}
                              </td>
                              <td className="px-4 py-3">
                                <Pill className={p.activo ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"}>
                                  {p.activo ? "Activo" : "Excluido"}
                                </Pill>
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
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                      {audiencias.length} audiencia{audiencias.length !== 1 ? "s" : ""} registrada{audiencias.length !== 1 ? "s" : ""}
                    </p>
                    {!showFormAud && (
                      <button onClick={abrirCrearAud} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition-all hover:scale-[1.02] shadow-sm shadow-blue-500/30">
                        <Plus className="w-3.5 h-3.5" /> Programar audiencia
                      </button>
                    )}
                  </div>

                  {showFormAud && (
                    <AudienciaFormInline idExpediente={idExpediente} editando={editandoAud} onSaved={onAudSaved} onCancel={onAudCancelled} />
                  )}

                  {audiencias.length === 0 && !showFormAud ? (
                    <div className="flex flex-col items-center gap-4 py-10 text-gray-400 dark:text-gray-600">
                      <Calendar className="w-10 h-10" />
                      <p className="text-sm">Sin audiencias registradas</p>
                      <button onClick={abrirCrearAud} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors shadow-sm shadow-blue-500/25">
                        <Plus className="w-4 h-4" /> Programar la primera audiencia
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {audiencias.map((a: any) => (
                        <div key={a.idAudiencia} className={`p-4 rounded-xl border transition-all ${
                          editandoAud?.idAudiencia === a.idAudiencia
                            ? "bg-blue-50 dark:bg-blue-900/10 border-blue-300 dark:border-blue-700 shadow-sm"
                            : "bg-gray-50 dark:bg-slate-800/60 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"
                        } space-y-3`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                a.estadoAudiencia === "PROGRAMADA" ? "bg-blue-100 dark:bg-blue-900/30" :
                                a.estadoAudiencia === "REALIZADA"  ? "bg-emerald-100 dark:bg-emerald-900/30" :
                                a.estadoAudiencia === "SUSPENDIDA" ? "bg-amber-100 dark:bg-amber-900/30" :
                                a.estadoAudiencia === "EN_CURSO"   ? "bg-indigo-100 dark:bg-indigo-900/30" :
                                "bg-gray-100 dark:bg-slate-700"
                              }`}>
                                <Calendar className={`w-4 h-4 ${
                                  a.estadoAudiencia === "PROGRAMADA" ? "text-blue-600 dark:text-blue-400" :
                                  a.estadoAudiencia === "REALIZADA"  ? "text-emerald-600 dark:text-emerald-400" :
                                  a.estadoAudiencia === "SUSPENDIDA" ? "text-amber-600 dark:text-amber-400" :
                                  a.estadoAudiencia === "EN_CURSO"   ? "text-indigo-600 dark:text-indigo-400" :
                                  "text-gray-500 dark:text-gray-400"
                                }`} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{a.idTipoAudiencia?.nombre}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{fmtFechaHora(a.fechaHoraProgramada)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Pill className={estadoAudienciaColor[a.estadoAudiencia] ?? "bg-gray-100 text-gray-600"}>{a.estadoAudiencia}</Pill>
                              {!showFormAud && (
                                <div className="flex items-center gap-1">
                                  <button onClick={() => abrirEditarAud(a)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Editar">
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => eliminarAud(a)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Eliminar">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                            <InfoCell label="Sala" value={a.idSalaAud?.nombreSala ?? "—"} />
                            <InfoCell label="Inicio" value={fmtFechaHora(a.fechaHoraInicio)} />
                            <InfoCell label="Fin" value={fmtFechaHora(a.fechaHoraFin)} />
                            {a.motivoSuspension && (
                              <div className="col-span-full">
                                <InfoCell label="Motivo de Suspensión" value={<span className="text-amber-600 dark:text-amber-400">{a.motivoSuspension}</span>} />
                              </div>
                            )}
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
                </div>
              )}

              {/* ══ RESOLUCIONES ══ */}
              {tabActiva === "resoluciones" && (
                <div className="space-y-4">
                  {resoluciones.length === 0 ? <TablaVacia icono={Scale} mensaje="Sin resoluciones registradas" /> : (
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
                          </div>
                        </div>
                        <InfoCell label="Fecha de Resolución" value={fmtFecha(r.fechaResolucion)} />
                        {r.parteDispositiva && (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Parte Dispositiva</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900/50 rounded-lg p-3 border border-gray-200 dark:border-slate-700 leading-relaxed">{r.parteDispositiva}</p>
                          </div>
                        )}
                        {r.fundamentacion && (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Fundamentación</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900/50 rounded-lg p-3 border border-gray-200 dark:border-slate-700 leading-relaxed">{r.fundamentacion}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ══ RECURSOS ══ */}
              {tabActiva === "recursos" && (
                <div className="space-y-3">
                  {recursos.length === 0 ? <TablaVacia icono={Gavel} mensaje="Sin recursos registrados" /> : (
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
                        {r.fundamentos && (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Fundamentos</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900/50 rounded-lg p-3 border border-gray-200 dark:border-slate-700 leading-relaxed">{r.fundamentos}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ══ DOCUMENTOS ══ */}
              {tabActiva === "documentos" && (
                <div>
                  {documentos.length === 0 ? <TablaVacia icono={FileText} mensaje="Sin documentos registrados" /> : (
                    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-slate-800/80">
                          <tr>
                            {["Título", "Tipo", "Folio", "Fecha", "Firma", "Público"].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                          {documentos.map((d: any) => (
                            <tr key={d.idDocumento} className="hover:bg-gray-50 dark:hover:bg-slate-800/40">
                              <td className="px-4 py-3">
                                <p className="text-sm font-medium text-gray-800 dark:text-white">{d.titulo}</p>
                                {d.tamanoKb > 0 && <p className="text-xs text-gray-400">{d.tamanoKb} KB</p>}
                              </td>
                              <td className="px-4 py-3"><Pill className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">{d.idTipoDoc?.codigo}</Pill></td>
                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{d.numeroFolio ?? "—"}</td>
                              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{fmtFecha(d.fechaPresentacion)}</td>
                              <td className="px-4 py-3">
                                {d.firmadoDigitalmente ? <Pill className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">Firmado</Pill> : <span className="text-xs text-gray-400">No</span>}
                              </td>
                              <td className="px-4 py-3">
                                {d.idTipoDoc?.esPublico ? <Pill className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">Sí</Pill> : <span className="text-xs text-gray-400">No</span>}
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
                <div>
                  {actuaciones.length === 0 ? <TablaVacia icono={ClipboardList} mensaje="Sin actuaciones procesales registradas" /> : (
                    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-slate-800/80">
                          <tr>
                            {["Tipo", "Fecha", "Folios", "Usuario", "Pública", "Descripción"].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                          {actuaciones.map((a: any) => (
                            <tr key={a.idActuacion} className="hover:bg-gray-50 dark:hover:bg-slate-800/40">
                              <td className="px-4 py-3">
                                <Pill className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">{a.idTipoActuacion?.codigo}</Pill>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{a.idTipoActuacion?.nombre}</p>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{fmtFecha(a.fechaActuacion)}</td>
                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 font-mono">{a.folioInicio} – {a.folioFin}</td>
                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{a.usuario?.paterno} {a.usuario?.nombres}</td>
                              <td className="px-4 py-3">
                                {a.esPublica ? <Pill className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">Sí</Pill> : <span className="text-xs text-gray-400">No</span>}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">{a.descripcion ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ══ HISTORIAL ══ */}
              {tabActiva === "historial" && <TimelineHistorial historial={historial} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}