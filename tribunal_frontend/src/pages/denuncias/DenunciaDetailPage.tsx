import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import { GET_DENUNCIA_BY_ID, ACTUALIZAR_DENUNCIA } from "../../graphql/denuncias";
import { useCrudNotifications } from "../../hooks/useCrudNotifications";
import {
  EtapaAdmision,
  EtapaSubsanacion,
  EtapaDeclaracionInformativa,
  EtapaPruebas,
  EtapaResolucion,
  EtapaApelacion,
  EtapaRetiro,
  EtapaConciliacion,
  TimelineDenuncia
} from "./DenunciaEtapas";
import {
  AlertCircle, CheckCircle, ChevronLeft, Clock,
  FileText, Send, Scale, FolderOpen, Plus, Loader2, AlertTriangle,
  Gavel, FileCheck, ClipboardList, MessageSquare,
  GitBranch, History, XCircle, User, HandshakeIcon,
} from "lucide-react";

// ─── HELPERS ─────────────────────────────────────────────
const ESTADOS = [
  { value: "REGISTRADA",             label: "Registrada",             etapa: 1,  color: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",          icon: FileText },
  { value: "SUBSANACION",            label: "Subsanación",            etapa: 2,  color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",    icon: AlertTriangle },
  { value: "ADMITIDA",               label: "Admitida",               etapa: 3,  color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",        icon: CheckCircle },
  { value: "DECLARACION_INFORMATIVA",label: "Declaración Informativa",etapa: 4,  color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",icon: MessageSquare },
  { value: "PRUEBAS",                label: "Período Probatorio",     etapa: 5,  color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",icon: ClipboardList },
  { value: "CONCLUSION",             label: "Conclusión",             etapa: 6,  color: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",        icon: Clock },
  { value: "RESUELTA",               label: "Resuelta",               etapa: 7,  color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: Gavel },
  { value: "APELADA",                label: "Apelada",                etapa: 8,  color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",icon: Send },
  { value: "EJECUTADA",              label: "Ejecutada",              etapa: 9,  color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",    icon: FileCheck },
];

const ESTADOS_TERMINALES: Record<string, { color: string; icon: any; label: string }> = {
  ARCHIVADA:   { label: "Archivada",   color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",         icon: XCircle },
  RETIRADA:    { label: "Retirada",    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: XCircle },
  CONCILIADA:  { label: "Conciliada",  color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",     icon: CheckCircle },
};

const TIPOS_DENUNCIADO = [
  { value: "ESTUDIANTE",    label: "Estudiante",    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "DOCENTE",       label: "Docente",       color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  { value: "ADMINISTRATIVO",label: "Administrativo",color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { value: "AUTORIDAD",     label: "Autoridad",     color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
];

const TIPOS_SANCION_LABEL: Record<string, string> = {
  MULTA:               "Multa hasta 20% haber mensual",
  SUSPENSION_TEMPORAL: "Suspensión temporal (1 mes - 1 año)",
  REMOCION:            "Remoción del cargo",
  RETIRO:              "Retiro de la Universidad",
  AMONESTACION:        "Amonestación por escrito",
  SUSPENSION_ESTUDIANTE:"Suspensión temporal (6 meses - 3 años)",
  EXPULSION:           "Expulsión de la Universidad",
};

const fmtFecha = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" });
};

// ─── TABS ──────────────────────────────────────────────
const TABS = [
  { id: "general",   label: "General",   icon: FileText },
  { id: "etapas",    label: "Etapas",    icon: GitBranch },
  { id: "documentos",label: "Documentos",icon: FolderOpen },
  { id: "historial", label: "Historial", icon: History },
] as const;
type TabId = typeof TABS[number]["id"];

// ─── COMPONENTE PRINCIPAL ────────────────────────────────
export default function DenunciaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tabActiva, setTabActiva] = useState<TabId>("general");
  const [saving, setSaving] = useState(false);

  const { data, loading, refetch } = useQuery(GET_DENUNCIA_BY_ID, {
    variables: { id: Number(id) },
  });
  const [actualizarDenuncia] = useMutation(ACTUALIZAR_DENUNCIA);
  const { toast } = useCrudNotifications("Denuncia");

  const denuncia = data?.denunciaById;

  const getEstadoInfo = (estado: string) => {
    if (ESTADOS_TERMINALES[estado]) {
      return { value: estado, etapa: 0, ...ESTADOS_TERMINALES[estado] };
    }
    return ESTADOS.find(e => e.value === estado) || ESTADOS[0];
  };

  const avanzarEtapa = async (nuevoEstado: string, datosAdicionales?: any) => {
    if (saving) return;
    setSaving(true);
    try {
      const input: any = { estado: nuevoEstado };
      if (datosAdicionales) {
        if (datosAdicionales.resolucion)             input.resolucion = datosAdicionales.resolucion;
        if (datosAdicionales.fechaResolucion)        input.fechaResolucion = datosAdicionales.fechaResolucion;
        if (datosAdicionales.tipoResolucion)         input.tipoResolucion = datosAdicionales.tipoResolucion;
        if (datosAdicionales.tipoSancion)            input.tipoSancion = datosAdicionales.tipoSancion;
        if (datosAdicionales.detalleSancion)         input.detalleSancion = datosAdicionales.detalleSancion;
        if (datosAdicionales.descripcion)            input.descripcion = datosAdicionales.descripcion;
        if (datosAdicionales.motivoRetiro)           input.motivoRetiro = datosAdicionales.motivoRetiro;
        if (datosAdicionales.fechaRetiro)            input.fechaRetiro = datosAdicionales.fechaRetiro;
        if (datosAdicionales.actaConciliacion)       input.actaConciliacion = datosAdicionales.actaConciliacion;
        if (datosAdicionales.fechaConciliacion)      input.fechaConciliacion = datosAdicionales.fechaConciliacion;
        if (datosAdicionales.fechaApelacion)         input.fechaApelacion = datosAdicionales.fechaApelacion;
        if (datosAdicionales.resolucionApelacion)    input.resolucionApelacion = datosAdicionales.resolucionApelacion;
        if (datosAdicionales.fechaRemisionSuperior)  input.fechaRemisionSuperior = datosAdicionales.fechaRemisionSuperior;
      }
      await actualizarDenuncia({ variables: { id: Number(id), input } });
      await refetch();
      toast.success(`Denuncia movida a ${getEstadoInfo(nuevoEstado).label}`);
    } catch (error: any) {
      toast.error(error.message || "Error al avanzar etapa");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!denuncia) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto text-gray-400" />
        <p className="mt-2 text-gray-500">Denuncia no encontrada</p>
        <button onClick={() => navigate("/denuncias")} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg">
          Volver
        </button>
      </div>
    );
  }

  const estadoActual = getEstadoInfo(denuncia.estado);
  const EstadoIcon = estadoActual.icon;
  const esTerminal = ["ARCHIVADA", "RETIRADA", "CONCILIADA", "EJECUTADA"].includes(denuncia.estado);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ENCABEZADO */}
      <div className="flex items-center gap-4 mb-2">
        <button
          onClick={() => navigate("/denuncias")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Denuncias
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-500" />
            Denuncia <span className="font-mono text-blue-600 dark:text-blue-400">{denuncia.numeroDenuncia}</span>
          </h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${estadoActual.color}`}>
              <EstadoIcon className="w-3.5 h-3.5" />
              {estadoActual.label}
            </span>
            <span className="text-xs text-gray-500">Creada: {fmtFecha(denuncia.fechaDenuncia)}</span>
            {denuncia.fechaHecho && (
              <span className="text-xs text-gray-500">Fecha del hecho: {fmtFecha(denuncia.fechaHecho)}</span>
            )}
          </div>
        </div>
      </div>

      {/* TIMELINE — solo si no es terminal lateral */}
      {!["RETIRADA", "CONCILIADA", "ARCHIVADA"].includes(denuncia.estado) && (
        <TimelineDenuncia estadoActual={denuncia.estado} estados={ESTADOS} />
      )}

      {/* LAYOUT PRINCIPAL */}
      <div className="flex gap-6 items-start">

        {/* SIDEBAR TABS */}
        <nav className="w-44 shrink-0 bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const activa = tabActiva === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTabActiva(tab.id)}
                className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition-all border-l-2 ${
                  activa
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* PANEL CONTENIDO */}
        <div className="flex-1 min-w-0 bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">

          {/* ── TAB GENERAL ── */}
          {tabActiva === "general" && (
            <div className="space-y-6">

              {/* Datos principales */}
              <div className="bg-gray-50 dark:bg-slate-800/60 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
                  Datos de la Denuncia
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Denunciante</p>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-800 dark:text-white">
                        {denuncia.denunciante?.nombre} {denuncia.denunciante?.primerApellido}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">CI: {denuncia.denunciante?.numeroDocumento}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Denunciado</p>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-800 dark:text-white">
                        {denuncia.denunciado?.nombre} {denuncia.denunciado?.primerApellido}
                      </span>
                    </div>
                    <span className={`inline-flex mt-1 text-xs px-2 py-0.5 rounded-full ${TIPOS_DENUNCIADO.find(t => t.value === denuncia.tipoDenunciado)?.color}`}>
                      {TIPOS_DENUNCIADO.find(t => t.value === denuncia.tipoDenunciado)?.label}
                    </span>
                  </div>
                  {denuncia.expediente && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Expediente relacionado</p>
                      <div className="flex items-center gap-2 mt-1">
                        <FolderOpen className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-mono text-blue-600 dark:text-blue-400">
                          {denuncia.expediente.numeroExpediente}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Descripción de los hechos</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{denuncia.descripcion}</p>
                </div>
              </div>

              {/* Resolución */}
              {denuncia.resolucion && (
                <div className="bg-gray-50 dark:bg-slate-800/60 rounded-2xl p-5">
                  <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-purple-500" />
                    Resolución Final
                  </h3>
                  {denuncia.tipoResolucion && (
                    <span className={`inline-flex mb-3 text-xs px-2.5 py-1 rounded-full font-medium ${
                      denuncia.tipoResolucion === "SANCIONATORIA"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    }`}>
                      {denuncia.tipoResolucion === "SANCIONATORIA" ? "Sancionatoria" : "Absolutoria"}
                    </span>
                  )}
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{denuncia.resolucion}</p>
                  {denuncia.tipoSancion && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                      <p className="text-xs font-semibold text-red-700 dark:text-red-400">Sanción impuesta</p>
                      <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                        {TIPOS_SANCION_LABEL[denuncia.tipoSancion] || denuncia.tipoSancion}
                      </p>
                      {denuncia.detalleSancion && (
                        <p className="text-xs text-red-500 mt-1">{denuncia.detalleSancion}</p>
                      )}
                    </div>
                  )}
                  {denuncia.fechaResolucion && (
                    <p className="text-xs text-gray-400 mt-2">Fecha: {fmtFecha(denuncia.fechaResolucion)}</p>
                  )}
                </div>
              )}

              {/* Retiro */}
              {denuncia.estado === "RETIRADA" && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-5 border border-yellow-200 dark:border-yellow-800">
                  <h3 className="text-xs font-bold text-yellow-700 dark:text-yellow-400 uppercase tracking-widest mb-3">
                    Denuncia Retirada (Art. 22)
                  </h3>
                  {denuncia.motivoRetiro && (
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">{denuncia.motivoRetiro}</p>
                  )}
                  {denuncia.fechaRetiro && (
                    <p className="text-xs text-yellow-500 mt-2">Fecha: {fmtFecha(denuncia.fechaRetiro)}</p>
                  )}
                </div>
              )}

              {/* Conciliación */}
              {denuncia.estado === "CONCILIADA" && (
                <div className="bg-teal-50 dark:bg-teal-900/20 rounded-2xl p-5 border border-teal-200 dark:border-teal-800">
                  <h3 className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-widest mb-3">
                    Acta de Conciliación (Art. 59)
                  </h3>
                  {denuncia.actaConciliacion && (
                    <p className="text-sm text-teal-700 dark:text-teal-300 leading-relaxed">{denuncia.actaConciliacion}</p>
                  )}
                  {denuncia.fechaConciliacion && (
                    <p className="text-xs text-teal-500 mt-2">Fecha: {fmtFecha(denuncia.fechaConciliacion)}</p>
                  )}
                </div>
              )}

              {/* Apelación */}
              {(denuncia.estado === "APELADA" || denuncia.resolucionApelacion) && (
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-5 border border-orange-200 dark:border-orange-800">
                  <h3 className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase tracking-widest mb-3">
                    Recurso de Apelación (Art. 82)
                  </h3>
                  {denuncia.fechaApelacion && (
                    <p className="text-xs text-orange-500 mb-2">Interpuesta: {fmtFecha(denuncia.fechaApelacion)}</p>
                  )}
                  {denuncia.fechaRemisionSuperior && (
                    <p className="text-xs text-orange-500 mb-2">
                      Remitida al Superior: {fmtFecha(denuncia.fechaRemisionSuperior)}
                    </p>
                  )}
                  {denuncia.resolucionApelacion && (
                    <p className="text-sm text-orange-700 dark:text-orange-300 leading-relaxed">
                      {denuncia.resolucionApelacion}
                    </p>
                  )}
                </div>
              )}

            </div>
          )}

          {/* ── TAB ETAPAS ── */}
          {tabActiva === "etapas" && (
            <div className="space-y-4">

              {denuncia.estado === "REGISTRADA" && (
                <EtapaAdmision
                  denuncia={denuncia}
                  onAvanzar={(nuevoEstado) => avanzarEtapa(nuevoEstado)}
                  onRechazar={() => avanzarEtapa("ARCHIVADA")}
                  onSolicitarSubsanacion={() => avanzarEtapa("SUBSANACION")}
                  onRetirar={() => setTabActiva("etapas")}
                  saving={saving}
                />
              )}

              {denuncia.estado === "SUBSANACION" && (
                <EtapaSubsanacion
                  denuncia={denuncia}
                  onSubsanar={(datos) => avanzarEtapa("ADMITIDA", datos)}
                  onRechazar={() => avanzarEtapa("ARCHIVADA")}
                  saving={saving}
                />
              )}

              {/* Retiro — disponible antes de la citación (estado REGISTRADA o SUBSANACION) */}
              {(denuncia.estado === "REGISTRADA" || denuncia.estado === "SUBSANACION") && (
                <EtapaRetiro
                  denuncia={denuncia}
                  onRetirar={(datos) => avanzarEtapa("RETIRADA", datos)}
                  saving={saving}
                />
              )}

              {denuncia.estado === "ADMITIDA" && (
                <>
                  <EtapaDeclaracionInformativa
                    denuncia={denuncia}
                    onRegistrarDeclaracion={(datos) => avanzarEtapa("DECLARACION_INFORMATIVA", datos)}
                    saving={saving}
                  />
                  <EtapaConciliacion
                    denuncia={denuncia}
                    onConciliar={(datos) => avanzarEtapa("CONCILIADA", datos)}
                    saving={saving}
                  />
                </>
              )}

              {denuncia.estado === "DECLARACION_INFORMATIVA" && (
                <>
                  <EtapaPruebas
                    denuncia={denuncia}
                    onAbrirPruebas={() => avanzarEtapa("PRUEBAS")}
                    saving={saving}
                  />
                  <EtapaConciliacion
                    denuncia={denuncia}
                    onConciliar={(datos) => avanzarEtapa("CONCILIADA", datos)}
                    saving={saving}
                  />
                </>
              )}

              {denuncia.estado === "PRUEBAS" && (
                <EtapaPruebas
                  denuncia={denuncia}
                  onCerrarPruebas={() => avanzarEtapa("CONCLUSION")}
                  saving={saving}
                />
              )}

              {denuncia.estado === "CONCLUSION" && (
                <EtapaResolucion
                  denuncia={denuncia}
                  onEmitirResolucion={(resolucion, fecha, tipo, tipoSancion, detalleSancion) =>
                    avanzarEtapa("RESUELTA", { resolucion, fechaResolucion: fecha, tipoResolucion: tipo, tipoSancion, detalleSancion })
                  }
                  saving={saving}
                />
              )}

              {denuncia.estado === "RESUELTA" && (
                <EtapaApelacion
                  denuncia={denuncia}
                  onApelar={(datos) => avanzarEtapa("APELADA", datos)}
                  onEjecutar={() => avanzarEtapa("EJECUTADA")}
                  saving={saving}
                />
              )}

              {denuncia.estado === "APELADA" && (
                <EtapaApelacion
                  denuncia={denuncia}
                  onRemitirSuperior={(datos) => avanzarEtapa("APELADA", datos)}
                  onResolverApelacion={(datos) => avanzarEtapa("EJECUTADA", datos)}
                  saving={saving}
                />
              )}

              {denuncia.estado === "EJECUTADA" && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800 p-6 text-center">
                  <FileCheck className="w-12 h-12 mx-auto text-green-500 mb-3" />
                  <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">Proceso Concluido</h3>
                  <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                    Esta denuncia ha sido ejecutada y el proceso ha finalizado.
                  </p>
                </div>
              )}

              {denuncia.estado === "ARCHIVADA" && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 p-6 text-center">
                  <XCircle className="w-12 h-12 mx-auto text-red-500 mb-3" />
                  <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">Denuncia Archivada</h3>
                  <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                    Esta denuncia fue rechazada o archivada y no continuará su tramitación.
                  </p>
                </div>
              )}

              {denuncia.estado === "RETIRADA" && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-200 dark:border-yellow-800 p-6 text-center">
                  <XCircle className="w-12 h-12 mx-auto text-yellow-500 mb-3" />
                  <h3 className="text-lg font-semibold text-yellow-700 dark:text-yellow-400">Denuncia Retirada</h3>
                  <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">
                    El denunciante retiró la denuncia antes de la citación (Art. 22).
                  </p>
                  {denuncia.motivoRetiro && (
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 font-medium">{denuncia.motivoRetiro}</p>
                  )}
                </div>
              )}

              {denuncia.estado === "CONCILIADA" && (
                <div className="bg-teal-50 dark:bg-teal-900/20 rounded-2xl border border-teal-200 dark:border-teal-800 p-6 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto text-teal-500 mb-3" />
                  <h3 className="text-lg font-semibold text-teal-700 dark:text-teal-400">Proceso Conciliado</h3>
                  <p className="text-sm text-teal-600 dark:text-teal-300 mt-1">
                    Las partes llegaron a un acuerdo (Art. 59). Se elaboró acta de conciliación.
                  </p>
                </div>
              )}

            </div>
          )}

          {/* ── TAB DOCUMENTOS ── */}
          {tabActiva === "documentos" && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>No hay documentos asociados a esta denuncia</p>
              <label className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm cursor-pointer transition-colors">
                <Plus className="w-4 h-4" />
                Subir documento
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.png"
                  onChange={e => {
                    const archivo = e.target.files?.[0];
                    if (archivo) {
                      alert(`Archivo seleccionado: ${archivo.name}\n\nFuncionalidad de subida pendiente de implementar.`);
                    }
                  }}
                />
              </label>
            </div>
          )}

          {/* ── TAB HISTORIAL ── */}
          {tabActiva === "historial" && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <History className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>No hay cambios de estado registrados</p>
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA */}
        <div className="w-80 shrink-0 space-y-5">
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Plazos Procesales
            </h3>
            <div className="space-y-2 text-sm">
              {[
                ["Admisión (Art. 58)",     "5 días"],
                ["Subsanación (Art. 56)",  "3 días"],
                ["Defensa (Art. 58a)",     "10 días"],
                ["Pruebas (Art. 60)",      "30 días"],
                ["Resolución (Art. 75)",   "15 días"],
                ["Apelación (Art. 82)",    "5 días"],
                ["Remisión Superior (Art. 86)", "3 días"],
                ["Ejecución (Art. 90)",    "5 días"],
              ].map(([label, dias], i) => (
                <div key={i} className={`flex justify-between py-1 ${i > 0 ? "border-t border-gray-100 dark:border-slate-700" : ""}`}>
                  <span className="text-gray-600 dark:text-gray-400">{label}</span>
                  <span className="font-mono">{dias}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Scale className="w-4 h-4 text-purple-500" />
              Referencias Legales
            </h3>
            <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
              <p>Art. 22 - Retiro de denuncia</p>
              <p>Art. 55 - Requisitos de la denuncia</p>
              <p>Art. 56 - Denuncia defectuosa</p>
              <p>Art. 57 - Rechazo de denuncia</p>
              <p>Art. 58 - Auto de admisión</p>
              <p>Art. 59 - Conciliación</p>
              <p>Art. 60 - Período probatorio</p>
              <p>Art. 75 - Resolución final</p>
              <p>Art. 82 - Recurso de apelación</p>
              <p>Art. 86 - Remisión al Superior</p>
              <p>Art. 90 - Ejecución de fallos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}