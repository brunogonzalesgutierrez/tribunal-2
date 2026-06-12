import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import { GET_DENUNCIA_BY_ID, ACTUALIZAR_DENUNCIA } from "../../graphql/denuncias";
import { GET_EXPEDIENTES_SIMPLE } from "../../graphql/audiencias";
import { useCrudNotifications } from "../../hooks/useCrudNotifications";
// En lugar de importar archivos individuales, importas desde este archivo único:
import {
  EtapaAdmision,
  EtapaSubsanacion,
  EtapaDeclaracionInformativa,
  EtapaPruebas,
  EtapaResolucion,
  EtapaApelacion,
  TimelineDenuncia
} from "./DenunciaEtapas";
import {
  AlertCircle, Calendar, CheckCircle, ChevronLeft, Clock,
  Edit, Eye, FileText, Send, User, X, Scale,
  Sparkles, FolderOpen, Users, Plus, Loader2, AlertTriangle,
  Gavel, FileCheck, ClipboardList, MessageSquare, Building2,
  GitBranch, History,
} from "lucide-react";

// ─── HELPERS ─────────────────────────────────────────────
const ESTADOS = [
  { value: "REGISTRADA", label: "Registrada", etapa: 1, color: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300", icon: FileText },
  { value: "SUBSANACION", label: "Subsanación", etapa: 2, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: AlertTriangle },
  { value: "ADMITIDA", label: "Admitida", etapa: 3, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: CheckCircle },
  { value: "DECLARACION_INFORMATIVA", label: "Declaración Informativa", etapa: 4, color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400", icon: MessageSquare },
  { value: "PRUEBAS", label: "Período Probatorio", etapa: 5, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: ClipboardList },
  { value: "CONCLUSION", label: "Conclusión", etapa: 6, color: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300", icon: Clock },
  { value: "RESUELTA", label: "Resuelta", etapa: 7, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: Gavel },
  { value: "APELADA", label: "Apelada", etapa: 8, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: Send },
  { value: "EJECUTADA", label: "Ejecutada", etapa: 9, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: FileCheck },
];

const TIPOS_DENUNCIADO = [
  { value: "ESTUDIANTE", label: "Estudiante", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "DOCENTE", label: "Docente", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  { value: "ADMINISTRATIVO", label: "Administrativo", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
];

const fmtFecha = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtFechaHora = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-BO");
};

// ─── TABS ──────────────────────────────────────────────
const TABS = [
  { id: "general", label: "General", icon: FileText },
  { id: "etapas", label: "Etapas", icon: GitBranch },
  { id: "documentos", label: "Documentos", icon: FolderOpen },
  { id: "historial", label: "Historial", icon: History },
] as const;
type TabId = typeof TABS[number]["id"];

// ─── COMPONENTE PRINCIPAL ────────────────────────────────
export default function DenunciaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tabActiva, setTabActiva] = useState<TabId>("general");
  const [saving, setSaving] = useState(false);
  const [generandoPdf, setGenerandoPdf] = useState(false);

  const { data, loading, refetch } = useQuery(GET_DENUNCIA_BY_ID, {
    variables: { id: Number(id) },
  });
  const [actualizarDenuncia] = useMutation(ACTUALIZAR_DENUNCIA);
  const { toast } = useCrudNotifications("Denuncia");

  const denuncia = data?.denunciaById;

  const getEstadoInfo = (estado: string) => {
    return ESTADOS.find(e => e.value === estado) || ESTADOS[0];
  };

  const avanzarEtapa = async (nuevoEstado: string, datosAdicionales?: any) => {
    if (saving) return;
    setSaving(true);
    try {
      const input: any = { estado: nuevoEstado };
      if (datosAdicionales) {
        if (datosAdicionales.resolucion) input.resolucion = datosAdicionales.resolucion;
        if (datosAdicionales.fechaResolucion) input.fechaResolucion = datosAdicionales.fechaResolucion;
        if (datosAdicionales.descripcion) input.descripcion = datosAdicionales.descripcion;
      }
      await actualizarDenuncia({
        variables: { id: Number(id), input },
      });
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
          </div>
        </div>
      </div>

      {/* TIMELINE PROGRESO */}
      <TimelineDenuncia estadoActual={denuncia.estado} estados={ESTADOS} />

      {/* LAYOUT PRINCIPAL CON TABS */}
      <div className="flex gap-6 items-start">

        {/* SIDEBAR */}
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

        {/* PANEL DE CONTENIDO */}
        <div className="flex-1 min-w-0 bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">

          {/* TAB GENERAL */}
          {tabActiva === "general" && (
            <div className="space-y-6">
              {/* Información de la denuncia */}
              <div className="bg-gray-50 dark:bg-slate-800/60 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Datos de la Denuncia</h3>
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

              {/* Resolución si existe */}
              {denuncia.resolucion && (
                <div className="bg-gray-50 dark:bg-slate-800/60 rounded-2xl p-5">
                  <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-purple-500" />
                    Resolución
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{denuncia.resolucion}</p>
                  {denuncia.fechaResolucion && (
                    <p className="text-xs text-gray-400 mt-2">Fecha: {fmtFecha(denuncia.fechaResolucion)}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB ETAPAS - Aquí van los componentes de flujo */}
          {tabActiva === "etapas" && (
            <div className="space-y-4">
              {denuncia.estado === "REGISTRADA" && (
                <EtapaAdmision
                  denuncia={denuncia}
                  onAvanzar={(nuevoEstado) => avanzarEtapa(nuevoEstado)}
                  onRechazar={() => avanzarEtapa("ARCHIVADA")}
                  onSolicitarSubsanacion={() => avanzarEtapa("SUBSANACION")}
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

              {denuncia.estado === "ADMITIDA" && (
                <EtapaDeclaracionInformativa
                  denuncia={denuncia}
                  onRegistrarDeclaracion={(datos) => avanzarEtapa("DECLARACION_INFORMATIVA", datos)}
                  saving={saving}
                />
              )}

              {denuncia.estado === "DECLARACION_INFORMATIVA" && (
                <EtapaPruebas
                  denuncia={denuncia}
                  onAbrirPruebas={() => avanzarEtapa("PRUEBAS")}
                  saving={saving}
                />
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
                  onEmitirResolucion={(resolucion, fecha, tipo) => 
                    avanzarEtapa("RESUELTA", { resolucion, fechaResolucion: fecha })
                  }
                  saving={saving}
                />
              )}

              {denuncia.estado === "RESUELTA" && (
                <EtapaApelacion
                  denuncia={denuncia}
                  onApelar={() => avanzarEtapa("APELADA")}
                  onEjecutar={() => avanzarEtapa("EJECUTADA")}
                  saving={saving}
                />
              )}

              {denuncia.estado === "APELADA" && (
                <EtapaApelacion
                  denuncia={denuncia}
                  onResolverApelacion={(resolucion) => avanzarEtapa("RESUELTA", { resolucion })}
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
            </div>
          )}

          {/* TAB DOCUMENTOS (placeholder) */}
          {tabActiva === "documentos" && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>No hay documentos asociados a esta denuncia</p>
              <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">
                Subir documento
              </button>
            </div>
          )}

          {/* TAB HISTORIAL (placeholder) */}
          {tabActiva === "historial" && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <History className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>No hay cambios de estado registrados</p>
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA - INFORMACIÓN ADICIONAL */}
        <div className="w-80 shrink-0 space-y-5">
          {/* Plazos */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Plazos Procesales
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-gray-600 dark:text-gray-400">Subsanación</span>
                <span className="font-mono">3 días</span>
              </div>
              <div className="flex justify-between py-1 border-t border-gray-100 dark:border-slate-700">
                <span className="text-gray-600 dark:text-gray-400">Defensa</span>
                <span className="font-mono">10 días</span>
              </div>
              <div className="flex justify-between py-1 border-t border-gray-100 dark:border-slate-700">
                <span className="text-gray-600 dark:text-gray-400">Pruebas</span>
                <span className="font-mono">30 días</span>
              </div>
              <div className="flex justify-between py-1 border-t border-gray-100 dark:border-slate-700">
                <span className="text-gray-600 dark:text-gray-400">Resolución</span>
                <span className="font-mono">15 días</span>
              </div>
              <div className="flex justify-between py-1 border-t border-gray-100 dark:border-slate-700">
                <span className="text-gray-600 dark:text-gray-400">Apelación</span>
                <span className="font-mono">5 días</span>
              </div>
            </div>
          </div>

          {/* Artículos relevantes */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Scale className="w-4 h-4 text-purple-500" />
              Referencias Legales
            </h3>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600 dark:text-gray-400">Art. 55 - Requisitos de la denuncia</p>
              <p className="text-gray-600 dark:text-gray-400">Art. 58 - Auto de admisión</p>
              <p className="text-gray-600 dark:text-gray-400">Art. 75 - Resolución final</p>
              <p className="text-gray-600 dark:text-gray-400">Art. 82 - Recurso de apelación</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}