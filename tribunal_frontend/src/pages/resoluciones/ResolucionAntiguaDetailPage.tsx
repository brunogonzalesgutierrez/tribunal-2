// src/pages/resolucionesAntiguas/ResolucionAntiguaDetailPage.tsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import {
  GET_RESOLUCION_ANTIGUA_BY_ID,
} from "../../graphql/resolucionesAntiguas";
import {
  ChevronLeft, FileText, User, Calendar, Scale,
  AlertCircle, Loader2, Link as LinkIcon, FileCheck,
  AlertTriangle, CheckCircle, Archive, X,
} from "lucide-react";

// ─── TIPOS ───────────────────────────────────────────────
interface Persona {
  idPersona: number;
  nombre: string;
  primerApellido: string;
  segundoApellido?: string;
  numeroDocumento: string;
}

interface ResolucionAntigua {
  idResolucionAntigua: number;
  numeroResolucion: string;
  fechaResolucion: string;
  personaDenunciante?: Persona;
  personaDenunciada: Persona;
  tipoSancion: string;
  descripcion?: string;
  sancion?: string;
  documentoUrl?: string;
}

const TIPOS_SANCION_CONFIG: Record<string, { label: string; color: string; icon: any; bgLight: string }> = {
  SANCION: {
    label: "Sanción",
    color: "text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30",
    icon: AlertCircle,
    bgLight: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
  },
  ABSOLUCION: {
    label: "Absolución",
    color: "text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30",
    icon: CheckCircle,
    bgLight: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800",
  },
  ARCHIVO: {
    label: "Archivo",
    color: "text-gray-700 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/50",
    icon: Archive,
    bgLight: "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700",
  },
};

const fmtFecha = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

// ─── MODAL PARA PDF O DOCUMENTO ──────────────────────────
function ModalDocumento({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Documento adjunto
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <iframe src={url} className="w-full h-[70vh] rounded-lg" title="Documento" />
        </div>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 px-6 py-4 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────
export default function ResolucionAntiguaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [modalDocumentoAbierto, setModalDocumentoAbierto] = useState(false);

  const { data, loading, error } = useQuery(GET_RESOLUCION_ANTIGUA_BY_ID, {
    variables: { id: Number(id) },
  });

  const resolucion: ResolucionAntigua | undefined = data?.resolucionAntiguaById;

  const config = TIPOS_SANCION_CONFIG[resolucion?.tipoSancion || "ARCHIVO"];
  const Icon = config?.icon || Archive;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !resolucion) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto text-gray-400" />
        <p className="mt-2 text-gray-500">Resolución no encontrada</p>
        <button
          onClick={() => navigate("/resoluciones-antiguas")}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ENCABEZADO */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/resoluciones-antiguas")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Resoluciones
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Resolución <span className="font-mono text-blue-600 dark:text-blue-400">{resolucion.numeroResolucion}</span>
          </h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config?.color}`}>
              <Icon className="w-3.5 h-3.5" />
              {config?.label}
            </span>
            <span className="text-xs text-gray-500">Fecha: {fmtFecha(resolucion.fechaResolucion)}</span>
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL - 2 COLUMNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA - INFORMACIÓN (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tarjeta de personas involucradas */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" />
              Personas involucradas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Denunciante */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Denunciante
                </p>
                {resolucion.personaDenunciante ? (
                  <>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                      {resolucion.personaDenunciante.nombre} {resolucion.personaDenunciante.primerApellido}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      CI: {resolucion.personaDenunciante.numeroDocumento}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 italic">No registrado</p>
                )}
              </div>

              {/* Denunciado */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Denunciado / Afectado
                </p>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                  {resolucion.personaDenunciada.nombre} {resolucion.personaDenunciada.primerApellido}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  CI: {resolucion.personaDenunciada.numeroDocumento}
                </p>
              </div>
            </div>
          </div>

          {/* Descripción */}
          {resolucion.descripcion && (
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                Descripción del caso
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {resolucion.descripcion}
              </p>
            </div>
          )}

          {/* Sanción impuesta */}
          {resolucion.tipoSancion === "SANCION" && resolucion.sancion && (
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Scale className="w-4 h-4 text-purple-500" />
                Sanción impuesta
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {resolucion.sancion}
              </p>
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA - INFORMACIÓN ADICIONAL (1/3) */}
        <div className="space-y-6">
          
          {/* Documento adjunto */}
          {resolucion.documentoUrl && (
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-blue-500" />
                Documento adjunto
              </h3>
              <button
                onClick={() => setModalDocumentoAbierto(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium"
              >
                <FileText className="w-4 h-4" />
                Ver documento
              </button>
              <p className="text-xs text-gray-400 mt-2 truncate">
                {resolucion.documentoUrl}
              </p>
            </div>
          )}

          {/* Resumen de la resolución */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-500" />
              Resumen
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">N° Resolución</span>
                <span className="text-sm font-mono font-semibold text-gray-800 dark:text-white">
                  {resolucion.numeroResolucion}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Fecha</span>
                <span className="text-sm text-gray-800 dark:text-white">
                  {fmtFecha(resolucion.fechaResolucion)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Tipo</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config?.color}`}>
                  <Icon className="w-3 h-3" />
                  {config?.label}
                </span>
              </div>
              {resolucion.tipoSancion === "SANCION" && (
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Sanción</span>
                  <span className="text-sm text-gray-800 dark:text-white font-medium">
                    {resolucion.sancion ? "Sí" : "No especificada"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Acciones */}
          {/* <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Acciones
            </h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate(`/resoluciones-antiguas/editar/${resolucion.idResolucionAntigua}`)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors"
              >
                Editar resolución
              </button>
              <button
                onClick={() => navigate("/resoluciones-antiguas")}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
              >
                Volver al listado
              </button>
            </div>
          </div> */}
        </div>
      </div>

      {/* MODAL DE DOCUMENTO */}
      {modalDocumentoAbierto && resolucion.documentoUrl && (
        <ModalDocumento
          url={resolucion.documentoUrl}
          onClose={() => setModalDocumentoAbierto(false)}
        />
      )}
    </div>
  );
}