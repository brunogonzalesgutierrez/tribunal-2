import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import { gql } from "@apollo/client";
import { useAuth } from "../../context/AuthContext";
import { GET_DETALLE_EXPEDIENTE } from "../../graphql/expedienteDetalle";
import {
  CREAR_AUDIENCIA, ACTUALIZAR_AUDIENCIA, ELIMINAR_AUDIENCIA,
  GET_TIPOS_AUDIENCIA, GET_SALAS_AUDIENCIA,
} from "../../graphql/audiencias";

// ─── GraphQL adicional (mutations que no están en archivos separados) ──────
const GET_PERSONAS      = gql`query { allPersonas { idPersona nombre primerApellido segundoApellido numeroDocumento esAbogado } }`;
const GET_ROLES_PROC    = gql`query { allRolesProcesal { idRol nombreRol } }`;
const GET_VOCALES       = gql`query { allVocales { idVocal cargo activo idPersona { nombre primerApellido } idSala { nombreSala } } }`;
const GET_TIPOS_DOC     = gql`query { allTiposDoc { idTipoDoc codigo nombre requiereFirma esPublico } }`;
const GET_TIPOS_RES     = gql`query { allTiposResolucion { idTipoRes codigo nombre nivelJerarquico } }`;
const GET_TIPOS_ACT     = gql`query { allTiposActuacion { idTipoActuacion codigo nombre } }`;

const CREAR_PARTE       = gql`
  mutation CrearParteProcesal($idExpediente: Int!, $idPersona: Int!, $idRol: Int!) {
    crearParteProcesal(idExpediente: $idExpediente, idPersona: $idPersona, idRol: $idRol) {
      parte { idParte activo idPersona { nombre primerApellido } idRol { nombreRol } }
    }
  }`;
const ELIMINAR_PARTE    = gql`
  mutation EliminarParteProcesal($id: Int!) {
    eliminarParteProcesal(id: $id) { ok mensaje }
  }`;

const CREAR_RESOLUCION  = gql`
  mutation CrearResolucion($input: CrearResolucionInput!) {
    crearResolucion(input: $input) {
      resolucion { idResolucion numeroResolucion fechaResolucion estado }
    }
  }`;
const ELIMINAR_RESOLUCION = gql`
  mutation EliminarResolucion($id: Int!) {
    eliminarResolucion(id: $id) { ok mensaje }
  }`;

const CREAR_DOCUMENTO   = gql`
  mutation CrearDocumento($idExpediente: Int!, $idTipoDoc: Int!, $titulo: String!, $numeroFolio: Int, $tamanoKb: Int) {
    crearDocumento(idExpediente: $idExpediente, idTipoDoc: $idTipoDoc, titulo: $titulo, numeroFolio: $numeroFolio, tamanoKb: $tamanoKb) {
      documento { idDocumento titulo fechaPresentacion idTipoDoc { codigo nombre } }
    }
  }`;
const ELIMINAR_DOCUMENTO = gql`
  mutation EliminarDocumento($id: Int!) {
    eliminarDocumento(id: $id) { ok mensaje }
  }`;

const CREAR_ACTUACION   = gql`
  mutation CrearActuacionProcesal($idExpediente: Int!, $idTipoActuacion: Int!, $idUsuario: Int!, $folioInicio: Int!, $folioFin: Int!, $descripcion: String) {
    crearActuacionProcesal(idExpediente: $idExpediente, idTipoActuacion: $idTipoActuacion, idUsuario: $idUsuario, folioInicio: $folioInicio, folioFin: $folioFin, descripcion: $descripcion) {
      actuacion { idActuacion descripcion folioInicio folioFin idTipoActuacion { nombre } }
    }
  }`;
const ELIMINAR_ACTUACION = gql`
  mutation EliminarActuacionProcesal($id: Int!) {
    eliminarActuacionProcesal(id: $id) { ok mensaje }
  }`;

const CREAR_CONFORMACION = gql`
  mutation CrearConformacion($idExpediente: Int!, $idVocal: Int!, $rolEnCaso: String!) {
    crearConformacion(idExpediente: $idExpediente, idVocal: $idVocal, rolEnCaso: $rolEnCaso) {
      conformacion { idConformacion rolEnCaso idVocal { cargo idPersona { nombre primerApellido } } }
    }
  }`;
const ELIMINAR_CONFORMACION = gql`
  mutation EliminarConformacion($id: Int!) {
    eliminarConformacion(id: $id) { ok mensaje }
  }`;

// ─── Imports de iconos ─────────────────────────────────────────────────────
import {
  X, FolderOpen, Users, Calendar, Scale, FileText,
  ClipboardList, History, Building2, CheckCircle, AlertCircle,
  Clock, Gavel, UserCheck, ArrowRight, Loader2, GitBranch,
  Plus, Edit2, Trash2, Save, XCircle, Video, ChevronLeft,
} from "lucide-react";

// ─── Helpers ───────────────────────────────────────────────────────────────
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

// ─── Estilos compartidos ───────────────────────────────────────────────────
const inputCls  = "w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all";
const labelCls  = "block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1";

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
  REALIZADA: "bg-emerald-100 dark:bg-emerald-900/30",
  SUSPENDIDA: "bg-amber-100 dark:bg-amber-900/30",
  EN_CURSO: "bg-indigo-100 dark:bg-indigo-900/30",
};

const audIc: Record<string, string> = {
  PROGRAMADA: "text-blue-600 dark:text-blue-400",
  REALIZADA: "text-emerald-600 dark:text-emerald-400",
  SUSPENDIDA: "text-amber-600 dark:text-amber-400",
  EN_CURSO: "text-indigo-600 dark:text-indigo-400",
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

// ─── Componentes base ──────────────────────────────────────────────────────
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
const TablaVacia = ({ icono: Icon, mensaje, onAgregar, labelAgregar }: {
  icono: React.ElementType; mensaje: string; onAgregar?: () => void; labelAgregar?: string;
}) => (
  <div className="flex flex-col items-center gap-4 py-10 text-gray-400 dark:text-gray-600">
    <Icon className="w-10 h-10" />
    <p className="text-sm">{mensaje}</p>
    {onAgregar && (
      <button
        onClick={onAgregar}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors shadow-sm shadow-blue-500/25"
      >
        <Plus className="w-4 h-4" /> {labelAgregar ?? "Agregar"}
      </button>
    )}
  </div>
);

// ─── Cabecera de sección con botón agregar ─────────────────────────────────
const SeccionHeader = ({ count, singular, plural, onAgregar, mostrarBoton }: {
  count: number; singular: string; plural: string; onAgregar: () => void; mostrarBoton: boolean;
}) => (
  <div className="flex items-center justify-between mb-4">
    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
      {count} {count === 1 ? singular : plural}
    </p>
    {mostrarBoton && (
      <button
        onClick={onAgregar}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition-all hover:scale-[1.02] shadow-sm shadow-blue-500/30"
      >
        <Plus className="w-3.5 h-3.5" /> Agregar
      </button>
    )}
  </div>
);

// ─── Wrapper de formulario inline ──────────────────────────────────────────
const FormInline = ({ titulo, icono: Icon, color = "blue", onCancel, onSave, saving, error, children }: {
  titulo: string; icono: React.ElementType; color?: string;
  onCancel: () => void; onSave: () => void; saving: boolean; error: string; children: React.ReactNode;
}) => {
  const bg   = { blue: "border-blue-200 dark:border-blue-800/60 bg-blue-50/60 dark:bg-blue-900/10", emerald: "border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-900/10", purple: "border-purple-200 dark:border-purple-800/60 bg-purple-50/60 dark:bg-purple-900/10", indigo: "border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/60 dark:bg-indigo-900/10" }[color] ?? "";
  const ic   = { blue: "bg-blue-500", emerald: "bg-emerald-500", purple: "bg-purple-500", indigo: "bg-indigo-500" }[color] ?? "bg-blue-500";
  return (
    <div className={`rounded-2xl border-2 ${bg} p-5 space-y-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg ${ic} flex items-center justify-center`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <p className="text-sm font-bold text-gray-800 dark:text-white">{titulo}</p>
        </div>
        <button onClick={onCancel} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
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
        <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm font-medium transition-colors flex items-center gap-1.5">
          <XCircle className="w-4 h-4" /> Cancelar
        </button>
        <button onClick={onSave} disabled={saving} className={`px-4 py-2 rounded-xl ${ic} hover:opacity-90 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-sm`}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar
        </button>
      </div>
    </div>
  );
};

// ─── Botón eliminar pequeño ────────────────────────────────────────────────
const BtnEliminar = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Eliminar">
    <Trash2 className="w-3.5 h-3.5" />
  </button>
);

// ─── TABS ──────────────────────────────────────────────────────────────────
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

// ─── Form Audiencia ────────────────────────────────────────────────────────
const INIT_AUD = { idTipoAudiencia: 0, idSalaAud: 0, fechaHoraProgramada: "", linkVideoconferencia: "", estadoAudiencia: "PROGRAMADA", motivoSuspension: "" };
function FormAudiencia({ idExpediente, editando, onSaved, onCancel }: { idExpediente: number; editando: any | null; onSaved: () => void; onCancel: () => void }) {
  const { data: dTipo } = useQuery(GET_TIPOS_AUDIENCIA);
  const { data: dSala } = useQuery(GET_SALAS_AUDIENCIA);
  const [crear]      = useMutation(CREAR_AUDIENCIA);
  const [actualizar] = useMutation(ACTUALIZAR_AUDIENCIA);
  const [form, setForm] = useState(editando ? {
    idTipoAudiencia: editando.idTipoAudiencia?.idTipoAudiencia ?? 0,
    idSalaAud: editando.idSalaAud?.idSalaAud ?? 0,
    fechaHoraProgramada: editando.fechaHoraProgramada?.slice(0, 16) ?? "",
    linkVideoconferencia: editando.linkVideoconferencia ?? "",
    estadoAudiencia: editando.estadoAudiencia ?? "PROGRAMADA",
    motivoSuspension: editando.motivoSuspension ?? "",
  } : { ...INIT_AUD });
  const [err, setErr] = useState(""); const [saving, setSaving] = useState(false);
  const tipos: any[] = dTipo?.allTiposAudiencia ?? [];
  const salas: any[] = dSala?.allSalasAudiencia ?? [];
  const set = (k: string) => (e: React.ChangeEvent<any>) => setForm(p => ({ ...p, [k]: e.target.value }));
  const guardar = async () => {
    if (!form.idTipoAudiencia || !form.fechaHoraProgramada) { setErr("Tipo y fecha son obligatorios."); return; }
    setSaving(true); setErr("");
    try {
      if (editando) {
        await actualizar({ variables: { id: Number(editando.idAudiencia), input: { idTipoAudiencia: Number(form.idTipoAudiencia) || undefined, idSalaAud: Number(form.idSalaAud) || undefined, fechaHoraProgramada: form.fechaHoraProgramada, estadoAudiencia: form.estadoAudiencia || undefined, motivoSuspension: form.motivoSuspension || undefined, linkVideoconferencia: form.linkVideoconferencia || undefined } } });
      } else {
        await crear({ variables: { input: { idExpediente: Number(idExpediente), idTipoAudiencia: Number(form.idTipoAudiencia), fechaHoraProgramada: form.fechaHoraProgramada, idSalaAud: Number(form.idSalaAud) || undefined, linkVideoconferencia: form.linkVideoconferencia || undefined } } });
      }
      onSaved();
    } catch (e: any) { setErr(e.message ?? "Error al guardar."); } finally { setSaving(false); }
  };
  return (
    <FormInline titulo={editando ? "Editar audiencia" : "Programar audiencia"} icono={Calendar} color="blue" onCancel={onCancel} onSave={guardar} saving={saving} error={err}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className={labelCls}>Tipo <span className="text-red-500">*</span></label>
          <select value={form.idTipoAudiencia} onChange={set("idTipoAudiencia")} className={inputCls}>
            <option value={0}>— Seleccionar —</option>
            {tipos.map((t: any) => <option key={t.idTipoAudiencia} value={t.idTipoAudiencia}>{t.nombre} ({t.duracionEstimada} min)</option>)}
          </select></div>
        <div><label className={labelCls}>Fecha y hora <span className="text-red-500">*</span></label>
          <input type="datetime-local" value={form.fechaHoraProgramada} onChange={set("fechaHoraProgramada")} className={inputCls} /></div>
        <div><label className={labelCls}>Sala</label>
          <select value={form.idSalaAud} onChange={set("idSalaAud")} className={inputCls}>
            <option value={0}>— Sin sala —</option>
            {salas.filter((s: any) => s.activa).map((s: any) => <option key={s.idSalaAud} value={s.idSalaAud}>{s.nombreSala} (cap. {s.capacidad}){s.equipadaVideoconf ? " 📹" : ""}</option>)}
          </select></div>
        <div><label className={labelCls}>Link videoconf.</label>
          <input type="url" placeholder="https://meet.google.com/..." value={form.linkVideoconferencia} onChange={set("linkVideoconferencia")} className={inputCls} /></div>
        {editando && (<div><label className={labelCls}>Estado</label>
          <select value={form.estadoAudiencia} onChange={set("estadoAudiencia")} className={inputCls}>
            <option value="PROGRAMADA">Programada</option><option value="EN_CURSO">En curso</option>
            <option value="REALIZADA">Realizada</option><option value="SUSPENDIDA">Suspendida</option><option value="CANCELADA">Cancelada</option>
          </select></div>)}
        {editando && form.estadoAudiencia === "SUSPENDIDA" && (
          <div className="sm:col-span-2"><label className={labelCls}>Motivo suspensión</label>
            <textarea rows={2} value={form.motivoSuspension} onChange={set("motivoSuspension")} className={`${inputCls} resize-none`} /></div>
        )}
      </div>
    </FormInline>
  );
}

// ─── Form Parte Procesal ───────────────────────────────────────────────────
function FormParte({ idExpediente, onSaved, onCancel }: { idExpediente: number; onSaved: () => void; onCancel: () => void }) {
  const { data: dP } = useQuery(GET_PERSONAS);
  const { data: dR } = useQuery(GET_ROLES_PROC);
  const [crear] = useMutation(CREAR_PARTE);
  const [form, setForm] = useState({ idPersona: 0, idRol: 0 });
  const [err, setErr] = useState(""); const [saving, setSaving] = useState(false);
  const personas: any[] = dP?.allPersonas ?? [];
  const roles: any[]    = dR?.allRolesProcesal ?? [];
  const set = (k: string) => (e: React.ChangeEvent<any>) => setForm(p => ({ ...p, [k]: e.target.value }));
  const guardar = async () => {
    if (!form.idPersona || !form.idRol) { setErr("Persona y rol son obligatorios."); return; }
    setSaving(true); setErr("");
    try {
      await crear({ variables: { idExpediente: Number(idExpediente), idPersona: Number(form.idPersona), idRol: Number(form.idRol) } });
      onSaved();
    } catch (e: any) { setErr(e.message ?? "Error al guardar."); } finally { setSaving(false); }
  };
  return (
    <FormInline titulo="Agregar parte procesal" icono={Users} color="indigo" onCancel={onCancel} onSave={guardar} saving={saving} error={err}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2"><label className={labelCls}>Persona <span className="text-red-500">*</span></label>
          <select value={form.idPersona} onChange={set("idPersona")} className={inputCls}>
            <option value={0}>— Seleccionar persona —</option>
            {personas.map((p: any) => <option key={p.idPersona} value={p.idPersona}>{p.nombre} {p.primerApellido} {p.segundoApellido} — {p.numeroDocumento}</option>)}
          </select></div>
        <div className="sm:col-span-2"><label className={labelCls}>Rol procesal <span className="text-red-500">*</span></label>
          <select value={form.idRol} onChange={set("idRol")} className={inputCls}>
            <option value={0}>— Seleccionar rol —</option>
            {roles.map((r: any) => <option key={r.idRol} value={r.idRol}>{r.nombreRol}</option>)}
          </select></div>
      </div>
    </FormInline>
  );
}

// ─── Form Resolución ───────────────────────────────────────────────────────
function FormResolucion({ idExpediente, onSaved, onCancel }: { idExpediente: number; onSaved: () => void; onCancel: () => void }) {
  const { data: dR } = useQuery(GET_TIPOS_RES);
  const [crear] = useMutation(CREAR_RESOLUCION);
  const [form, setForm] = useState({ idTipoRes: 0, numeroResolucion: "", fechaResolucion: "", parteDispositiva: "", fundamentacion: "" });
  const [err, setErr] = useState(""); const [saving, setSaving] = useState(false);
  const tipos: any[] = dR?.allTiposResolucion ?? [];
  const set = (k: string) => (e: React.ChangeEvent<any>) => setForm(p => ({ ...p, [k]: e.target.value }));
  const guardar = async () => {
    if (!form.idTipoRes || !form.numeroResolucion || !form.fechaResolucion || !form.parteDispositiva) {
      setErr("Tipo, número, fecha y parte dispositiva son obligatorios."); return;
    }
    setSaving(true); setErr("");
    try {
      await crear({ variables: { input: { idExpediente: Number(idExpediente), idTipoRes: Number(form.idTipoRes), numeroResolucion: form.numeroResolucion, fechaResolucion: form.fechaResolucion, parteDispositiva: form.parteDispositiva, fundamentacion: form.fundamentacion || undefined } } });
      onSaved();
    } catch (e: any) { setErr(e.message ?? "Error al guardar."); } finally { setSaving(false); }
  };
  return (
    <FormInline titulo="Nueva resolución" icono={Scale} color="purple" onCancel={onCancel} onSave={guardar} saving={saving} error={err}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className={labelCls}>Tipo de resolución <span className="text-red-500">*</span></label>
          <select value={form.idTipoRes} onChange={set("idTipoRes")} className={inputCls}>
            <option value={0}>— Seleccionar tipo —</option>
            {tipos.map((t: any) => <option key={t.idTipoRes} value={t.idTipoRes}>{t.codigo} · {t.nombre}</option>)}
          </select></div>
        <div><label className={labelCls}>N° Resolución <span className="text-red-500">*</span></label>
          <input type="text" placeholder="Ej: RES-001/2025" value={form.numeroResolucion} onChange={set("numeroResolucion")} className={inputCls} /></div>
        <div><label className={labelCls}>Fecha <span className="text-red-500">*</span></label>
          <input type="date" value={form.fechaResolucion} onChange={set("fechaResolucion")} className={inputCls} /></div>
        <div className="sm:col-span-2"><label className={labelCls}>Parte dispositiva <span className="text-red-500">*</span></label>
          <textarea rows={3} placeholder="Decisión principal de la resolución..." value={form.parteDispositiva} onChange={set("parteDispositiva")} className={`${inputCls} resize-none`} /></div>
        <div className="sm:col-span-2"><label className={labelCls}>Fundamentación</label>
          <textarea rows={3} placeholder="Fundamentos jurídicos (opcional)..." value={form.fundamentacion} onChange={set("fundamentacion")} className={`${inputCls} resize-none`} /></div>
      </div>
    </FormInline>
  );
}

// ─── Form Documento ────────────────────────────────────────────────────────
function FormDocumento({ idExpediente, onSaved, onCancel }: { idExpediente: number; onSaved: () => void; onCancel: () => void }) {
  const { data: dD } = useQuery(GET_TIPOS_DOC);
  const [crear] = useMutation(CREAR_DOCUMENTO);
  const [form, setForm] = useState({ idTipoDoc: 0, titulo: "", numeroFolio: "", tamanoKb: "" });
  const [err, setErr] = useState(""); const [saving, setSaving] = useState(false);
  const tipos: any[] = dD?.allTiposDoc ?? [];
  const set = (k: string) => (e: React.ChangeEvent<any>) => setForm(p => ({ ...p, [k]: e.target.value }));
  const guardar = async () => {
    if (!form.idTipoDoc || !form.titulo) { setErr("Tipo y título son obligatorios."); return; }
    setSaving(true); setErr("");
    try {
      await crear({ variables: { idExpediente: Number(idExpediente), idTipoDoc: Number(form.idTipoDoc), titulo: form.titulo, numeroFolio: form.numeroFolio ? Number(form.numeroFolio) : undefined, tamanoKb: form.tamanoKb ? Number(form.tamanoKb) : 0 } });
      onSaved();
    } catch (e: any) { setErr(e.message ?? "Error al guardar."); } finally { setSaving(false); }
  };
  return (
    <FormInline titulo="Registrar documento" icono={FileText} color="emerald" onCancel={onCancel} onSave={guardar} saving={saving} error={err}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className={labelCls}>Tipo de documento <span className="text-red-500">*</span></label>
          <select value={form.idTipoDoc} onChange={set("idTipoDoc")} className={inputCls}>
            <option value={0}>— Seleccionar tipo —</option>
            {tipos.map((t: any) => <option key={t.idTipoDoc} value={t.idTipoDoc}>{t.codigo} · {t.nombre}</option>)}
          </select></div>
        <div><label className={labelCls}>Título <span className="text-red-500">*</span></label>
          <input type="text" placeholder="Nombre del documento..." value={form.titulo} onChange={set("titulo")} className={inputCls} /></div>
        <div><label className={labelCls}>N° Folio</label>
          <input type="number" placeholder="Ej: 42" value={form.numeroFolio} onChange={set("numeroFolio")} className={inputCls} /></div>
        <div><label className={labelCls}>Tamaño (KB)</label>
          <input type="number" placeholder="Ej: 256" value={form.tamanoKb} onChange={set("tamanoKb")} className={inputCls} /></div>
      </div>
    </FormInline>
  );
}

// ─── Form Actuación ────────────────────────────────────────────────────────
function FormActuacion({ idExpediente, onSaved, onCancel }: { idExpediente: number; onSaved: () => void; onCancel: () => void }) {
  const { usuario } = useAuth();
  const { data: dA } = useQuery(GET_TIPOS_ACT);
  const [crear] = useMutation(CREAR_ACTUACION);
  const [form, setForm] = useState({ idTipoActuacion: 0, folioInicio: "", folioFin: "", descripcion: "" });
  const [err, setErr] = useState(""); const [saving, setSaving] = useState(false);
  const tipos: any[] = dA?.allTiposActuacion ?? [];
  const set = (k: string) => (e: React.ChangeEvent<any>) => setForm(p => ({ ...p, [k]: e.target.value }));
  const guardar = async () => {
    if (!form.idTipoActuacion || !form.folioInicio || !form.folioFin) { setErr("Tipo, folio inicio y folio fin son obligatorios."); return; }
    if (!usuario?.idUsuario) { setErr("No se pudo identificar al usuario. Volvé a iniciar sesión."); return; }
    setSaving(true); setErr("");
    try {
      await crear({ variables: { idExpediente: Number(idExpediente), idTipoActuacion: Number(form.idTipoActuacion), idUsuario: Number(usuario.idUsuario), folioInicio: Number(form.folioInicio), folioFin: Number(form.folioFin), descripcion: form.descripcion || undefined } });
      onSaved();
    } catch (e: any) { setErr(e.message ?? "Error al guardar."); } finally { setSaving(false); }
  };
  return (
    <FormInline titulo="Registrar actuación" icono={ClipboardList} color="blue" onCancel={onCancel} onSave={guardar} saving={saving} error={err}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2"><label className={labelCls}>Tipo de actuación <span className="text-red-500">*</span></label>
          <select value={form.idTipoActuacion} onChange={set("idTipoActuacion")} className={inputCls}>
            <option value={0}>— Seleccionar tipo —</option>
            {tipos.map((t: any) => <option key={t.idTipoActuacion} value={t.idTipoActuacion}>{t.codigo} · {t.nombre}</option>)}
          </select></div>
        <div><label className={labelCls}>Folio inicio <span className="text-red-500">*</span></label>
          <input type="number" placeholder="Ej: 1" value={form.folioInicio} onChange={set("folioInicio")} className={inputCls} /></div>
        <div><label className={labelCls}>Folio fin <span className="text-red-500">*</span></label>
          <input type="number" placeholder="Ej: 5" value={form.folioFin} onChange={set("folioFin")} className={inputCls} /></div>
        <div className="sm:col-span-2"><label className={labelCls}>Descripción</label>
          <textarea rows={2} placeholder="Descripción de la actuación (opcional)..." value={form.descripcion} onChange={set("descripcion")} className={`${inputCls} resize-none`} /></div>
        <div className="sm:col-span-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 text-xs text-gray-500 dark:text-gray-400">
          Usuario registrador: <span className="font-semibold text-gray-700 dark:text-gray-300">{usuario?.paterno} {usuario?.nombre}</span>
        </div>
      </div>
    </FormInline>
  );
}

// ─── Form Conformación ─────────────────────────────────────────────────────
function FormConformacion({ idExpediente, onSaved, onCancel }: { idExpediente: number; onSaved: () => void; onCancel: () => void }) {
  const { data: dV } = useQuery(GET_VOCALES);
  const [crear] = useMutation(CREAR_CONFORMACION);
  const [form, setForm] = useState({ idVocal: 0, rolEnCaso: "" });
  const [err, setErr] = useState(""); const [saving, setSaving] = useState(false);
  const vocales: any[] = (dV?.allVocales ?? []).filter((v: any) => v.activo);
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
    <FormInline titulo="Asignar vocal" icono={Building2} color="indigo" onCancel={onCancel} onSave={guardar} saving={saving} error={err}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2"><label className={labelCls}>Vocal <span className="text-red-500">*</span></label>
          <select value={form.idVocal} onChange={set("idVocal")} className={inputCls}>
            <option value={0}>— Seleccionar vocal activo —</option>
            {vocales.map((v: any) => <option key={v.idVocal} value={v.idVocal}>{v.idPersona?.nombre} {v.idPersona?.primerApellido} — {v.cargo} · {v.idSala?.nombreSala}</option>)}
          </select></div>
        <div className="sm:col-span-2"><label className={labelCls}>Rol en el caso <span className="text-red-500">*</span></label>
          <input type="text" placeholder="Ej: Vocal Relator, Presidente de Sala..." value={form.rolEnCaso} onChange={set("rolEnCaso")} className={inputCls} /></div>
      </div>
    </FormInline>
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
            const esUltimo = idx === ordenado.length - 1;
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
                  {esUltimo && <div className="flex items-center gap-1.5 mb-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /><span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Estado actual</span></div>}
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
                    {(h.usuario?.paterno || h.usuario?.nombres) && (<><span className="text-gray-300 dark:text-slate-600">·</span><span className="flex items-center gap-1 font-medium text-gray-500 dark:text-gray-400"><UserCheck className="w-3 h-3" />{h.usuario.paterno} {h.usuario.nombres}</span></>)}
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
                {idx === 0 && h.idEstadoAnterior && (<><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400">{h.idEstadoAnterior.nombreEstado}</span><ArrowRight className="w-3 h-3 text-gray-300 dark:text-slate-600" /></>)}
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
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════
export default function ExpedienteDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const idExpediente = Number(id);

  const [tabActiva, setTabActiva] = useState<TabId>("general");

  // Estado de formularios por tab
  const [showForm, setShowForm] = useState<Partial<Record<TabId, boolean>>>({});
  const [editandoAud, setEditandoAud] = useState<any | null>(null);

  // Mutations de eliminación
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

  // Helpers de formulario
  const abrirForm  = (tab: TabId) => { setShowForm(p => ({ ...p, [tab]: true })); if (tab !== "audiencias") { setEditandoAud(null); } };
  const cerrarForm = (tab: TabId) => { setShowForm(p => ({ ...p, [tab]: false })); setEditandoAud(null); };
  const onSaved    = (tab: TabId) => { cerrarForm(tab); refetch(); };

  const confirmarEliminar = (msg: string) => window.confirm(msg);

  const eliminar = async (fn: () => Promise<any>, msg: string, confirmMsg: string) => {
    if (!confirmarEliminar(confirmMsg)) return;
    const { data: res } = await fn();
    const result = Object.values(res ?? {})[0] as any;
    if (!result?.ok) { alert(result?.mensaje ?? "No se pudo eliminar."); return; }
    refetch();
  };

  // Tabs con formularios habilitados (Recursos no tiene crear por ahora — depende de resolución)
  const TABS_CON_FORM: TabId[] = ["audiencias", "partes", "resoluciones", "documentos", "actuaciones", "vocales"];

  return (
    <div className="space-y-0 animate-fade-in">

      {/* ENCABEZADO */}
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

      {/* LAYOUT: sidebar + contenido */}
      <div className="flex gap-6 items-start">

        {/* SIDEBAR DE TABS */}
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
                  setShowForm({});
                  setEditandoAud(null);
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
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activa ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* PANEL DE CONTENIDO */}
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
                      <InfoCell label="N° Expediente" value={<span className="font-mono text-blue-600 dark:text-blue-400 text-base font-bold">{exp.numeroExpediente}</span>} />
                      <InfoCell label="Año" value={exp.ano} />
                      <InfoCell label="Fecha de Ingreso" value={fmtFecha(exp.fechaIngreso)} />
                      <InfoCell label="Tipo de Proceso" value={<Pill className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 mt-0.5">{exp.idTipoProceso?.codigo} · {exp.idTipoProceso?.nombre}</Pill>} />
                      <InfoCell label="Estado" value={exp.idEstadoExpediente ? (
                        <Pill className={exp.idEstadoExpediente.esTerminal ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 mt-0.5" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 mt-0.5"}>
                          {exp.idEstadoExpediente.esTerminal ? <Scale className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                          {exp.idEstadoExpediente.nombreEstado}
                        </Pill>) : "—"} />
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
                      <InfoCell label="Estado de Sala" value={<Pill className={exp.idSala?.activa ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 mt-0.5" : "bg-gray-100 dark:bg-slate-700 text-gray-500 mt-0.5"}>{exp.idSala?.activa ? "Activa" : "Inactiva"}</Pill>} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Partes procesales", count: partes.length, color: "blue", tab: "partes" as TabId },
                      { label: "Audiencias",         count: audiencias.length, color: "indigo", tab: "audiencias" as TabId },
                      { label: "Resoluciones",       count: resoluciones.length, color: "purple", tab: "resoluciones" as TabId },
                      { label: "Documentos",         count: documentos.length, color: "emerald", tab: "documentos" as TabId },
                    ].map(({ label, count, color, tab }) => {
                      const s = RESUMEN_STYLES[color];
                      return (
                        <button
                          key={label}
                          onClick={() => setTabActiva(tab)}
                          className={`${s.bg} rounded-xl p-4 border ${s.border} text-left hover:opacity-80 transition-opacity cursor-pointer`}
                        >
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
                  {showForm["vocales"] && <FormConformacion idExpediente={idExpediente} onSaved={() => onSaved("vocales")} onCancel={() => cerrarForm("vocales")} />}
                  {vocales.length === 0 && !showForm["vocales"] ? (
                    <TablaVacia icono={Building2} mensaje="Sin conformación de sala registrada" onAgregar={() => abrirForm("vocales")} labelAgregar="Asignar vocal" />
                  ) : (
                    <div className="space-y-3">
                      {vocales.map((c: any) => (
                        <div key={c.idConformacion} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                              <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800 dark:text-white">{c.idVocal?.idPersona?.nombre} {c.idVocal?.idPersona?.primerApellido}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{c.idVocal?.cargo} · {c.idVocal?.idSala?.nombreSala}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Pill className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">{c.rolEnCaso}</Pill>
                            <BtnEliminar onClick={() => eliminar(() => eliminarConformacion({ variables: { id: Number(c.idConformacion) } }) as any, "", `¿Quitar al vocal ${c.idVocal?.idPersona?.nombre} de este expediente?`)} />
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
                          <tr>
                            {["Persona", "Documento", "Rol Procesal", "Abogado", "Estado", ""].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                          {partes.map((p: any) => (
                            <tr key={p.idParte} className="hover:bg-gray-50 dark:hover:bg-slate-800/40">
                              <td className="px-4 py-3"><p className="text-sm font-medium text-gray-800 dark:text-white">{p.idPersona?.nombre} {p.idPersona?.primerApellido} {p.idPersona?.segundoApellido}</p>{p.idPersona?.estamento && <p className="text-xs text-gray-500 dark:text-gray-400">{p.idPersona.estamento}</p>}</td>
                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 font-mono">{p.idPersona?.numeroDocumento ?? "—"}</td>
                              <td className="px-4 py-3"><Pill className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">{p.idRol?.nombreRol}</Pill></td>
                              <td className="px-4 py-3">{p.idPersona?.esAbogado ? <Pill className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">Sí</Pill> : <span className="text-xs text-gray-400">No</span>}</td>
                              <td className="px-4 py-3"><Pill className={p.activo ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"}>{p.activo ? "Activo" : "Excluido"}</Pill></td>
                              <td className="px-4 py-3 text-right"><BtnEliminar onClick={() => eliminar(() => eliminarParte({ variables: { id: Number(p.idParte) } }) as any, "", `¿Eliminar a ${p.idPersona?.nombre} ${p.idPersona?.primerApellido} como parte procesal?`)} /></td>
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
                              <div className="min-w-0"><p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{a.idTipoAudiencia?.nombre}</p><p className="text-xs text-gray-500 dark:text-gray-400">{fmtFechaHora(a.fechaHoraProgramada)}</p></div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Pill className={estadoAudienciaColor[a.estadoAudiencia] ?? "bg-gray-100 text-gray-600"}>{a.estadoAudiencia}</Pill>
                              {!showForm["audiencias"] && (
                                <div className="flex items-center gap-1">
                                  <button onClick={() => { setEditandoAud(a); abrirForm("audiencias"); }} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                                  <BtnEliminar onClick={() => eliminar(() => eliminarAudiencia({ variables: { id: Number(a.idAudiencia) } }) as any, "", `¿Eliminar la audiencia del ${fmtFechaHora(a.fechaHoraProgramada)}?`)} />
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                            <InfoCell label="Sala" value={a.idSalaAud?.nombreSala ?? "—"} />
                            <InfoCell label="Inicio" value={fmtFechaHora(a.fechaHoraInicio)} />
                            <InfoCell label="Fin" value={fmtFechaHora(a.fechaHoraFin)} />
                            {a.motivoSuspension && <div className="col-span-full"><InfoCell label="Motivo suspensión" value={<span className="text-amber-600 dark:text-amber-400">{a.motivoSuspension}</span>} /></div>}
                            {a.linkVideoconferencia && <div className="col-span-full"><p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-0.5">Enlace</p><a href={a.linkVideoconferencia} target="_blank" rel="noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"><Video className="w-3.5 h-3.5" /> Videoconferencia</a></div>}
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
                  <SeccionHeader count={resoluciones.length} singular="resolución" plural="resoluciones" onAgregar={() => abrirForm("resoluciones")} mostrarBoton={!showForm["resoluciones"]} />
                  {showForm["resoluciones"] && <FormResolucion idExpediente={idExpediente} onSaved={() => onSaved("resoluciones")} onCancel={() => cerrarForm("resoluciones")} />}
                  {resoluciones.length === 0 && !showForm["resoluciones"] ? (
                    <TablaVacia icono={Scale} mensaje="Sin resoluciones registradas" onAgregar={() => abrirForm("resoluciones")} labelAgregar="Nueva resolución" />
                  ) : (
                    resoluciones.map((r: any) => (
                      <div key={r.idResolucion} className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div><p className="text-sm font-bold text-gray-800 dark:text-white font-mono">{r.numeroResolucion}</p><p className="text-xs text-gray-500 dark:text-gray-400">{r.idTipoRes?.codigo} · {r.idTipoRes?.nombre}</p></div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Pill className={r.estado === "VIGENTE" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"}>{r.estado}</Pill>
                            {r.esRecurrible && <Pill className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">Recurrible · {r.plazoRecursoDias}d</Pill>}
                            <BtnEliminar onClick={() => eliminar(() => eliminarResolucion({ variables: { id: Number(r.idResolucion) } }) as any, "", `¿Eliminar la resolución ${r.numeroResolucion}?`)} />
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
                      <AlertCircle className="w-3.5 h-3.5" />
                      Se crean desde una resolución existente
                    </div>
                  </div>
                  {recursos.length === 0 ? (
                    <TablaVacia icono={Gavel} mensaje="Sin recursos registrados. Los recursos se interponen sobre resoluciones vigentes." />
                  ) : (
                    recursos.map((r: any) => (
                      <div key={r.idRecurso} className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div><p className="text-sm font-semibold text-gray-800 dark:text-white">{r.idTipoRecurso?.nombre}</p><p className="text-xs text-gray-500 dark:text-gray-400">Resolución: <span className="font-mono">{r.idResolucionImpugnada?.numeroResolucion}</span></p></div>
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

              {/* ══ DOCUMENTOS ══ */}
              {tabActiva === "documentos" && (
                <div className="space-y-4">
                  <SeccionHeader count={documentos.length} singular="documento" plural="documentos" onAgregar={() => abrirForm("documentos")} mostrarBoton={!showForm["documentos"]} />
                  {showForm["documentos"] && <FormDocumento idExpediente={idExpediente} onSaved={() => onSaved("documentos")} onCancel={() => cerrarForm("documentos")} />}
                  {documentos.length === 0 && !showForm["documentos"] ? (
                    <TablaVacia icono={FileText} mensaje="Sin documentos registrados" onAgregar={() => abrirForm("documentos")} labelAgregar="Registrar documento" />
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-slate-800/80">
                          <tr>
                            {["Título", "Tipo", "Folio", "Fecha", "Firma", "Público", ""].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                          {documentos.map((d: any) => (
                            <tr key={d.idDocumento} className="hover:bg-gray-50 dark:hover:bg-slate-800/40">
                              <td className="px-4 py-3"><p className="text-sm font-medium text-gray-800 dark:text-white">{d.titulo}</p>{d.tamanoKb > 0 && <p className="text-xs text-gray-400">{d.tamanoKb} KB</p>}</td>
                              <td className="px-4 py-3"><Pill className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">{d.idTipoDoc?.codigo}</Pill></td>
                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{d.numeroFolio ?? "—"}</td>
                              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{fmtFecha(d.fechaPresentacion)}</td>
                              <td className="px-4 py-3">{d.firmadoDigitalmente ? <Pill className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">Firmado</Pill> : <span className="text-xs text-gray-400">No</span>}</td>
                              <td className="px-4 py-3">{d.idTipoDoc?.esPublico ? <Pill className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">Sí</Pill> : <span className="text-xs text-gray-400">No</span>}</td>
                              <td className="px-4 py-3 text-right"><BtnEliminar onClick={() => eliminar(() => eliminarDocumento({ variables: { id: Number(d.idDocumento) } }) as any, "", `¿Eliminar el documento "${d.titulo}"?`)} /></td>
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
                          <tr>
                            {["Tipo", "Fecha", "Folios", "Usuario", "Pública", "Descripción", ""].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
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
                              <td className="px-4 py-3 text-right"><BtnEliminar onClick={() => eliminar(() => eliminarActuacion({ variables: { id: Number(a.idActuacion) } }) as any, "", `¿Eliminar esta actuación procesal?`)} /></td>
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