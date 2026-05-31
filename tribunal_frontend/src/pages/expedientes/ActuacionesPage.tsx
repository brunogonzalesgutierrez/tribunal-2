import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_EXPEDIENTES,
  GET_TIPOS_ACTUACION,
  GET_ACTUACIONES,
  CREAR_ACTUACION_PROCESAL,
  ELIMINAR_ACTUACION_PROCESAL,
} from "../../graphql/expediente";
import { useCrudNotifications } from "../../hooks/useCrudNotifications";
import { 
  FileText, Plus, Search, Trash2, 
  ChevronLeft, ChevronRight, X, Calendar, User, BookOpen, Hash
} from "lucide-react";

// ─── TIPOS ───────────────────────────────────────────────
interface TipoActuacion {
  idTipoActuacion: number;
  codigo: string;
  nombre: string;
}
interface Expediente {
  idExpediente: number;
  numeroExpediente: string;
}
interface ActuacionProcesal {
  idActuacion: number;
  folioInicio: number;
  folioFin: number;
  esPublica: boolean;
  fechaActuacion: string;
  descripcion: string;
  idExpediente: Expediente;
  idTipoActuacion: TipoActuacion;
  usuario: { idUsuario: number; nombres: string; paterno: string };
}

const initialForm = {
  idExpediente: "0", idTipoActuacion: "0",
  folioInicio: "", folioFin: "", descripcion: "",
};

// ─── MODAL ───────────────────────────────────────────────
function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-500" />
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

const Field = ({ label, value, onChange, type = "text", placeholder = "", required = false, disabled = false }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; disabled?: boolean;
}) => (
  <div className="mb-4">
    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
    />
  </div>
);

const fmtFecha = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-BO", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

// ============================================================
// COMPONENTE: Buscador de Expedientes (Modal)
// ============================================================
function BuscadorExpediente({
  onSelect,
  onClose,
}: {
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, loading } = useQuery(GET_EXPEDIENTES);

  const expedientes: Expediente[] = data?.allExpedientes ?? [];

  const filtrados = expedientes.filter(e =>
    e.numeroExpediente.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-purple-500" />
            Seleccionar Expediente
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar expediente por número..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>No se encontraron expedientes</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filtrados.map((e: Expediente, index: number) => (
                <button
                  key={e.idExpediente}
                  onClick={() => {
                    onSelect(e.idExpediente, e.numeroExpediente);
                    onClose();
                  }}
                  className={`w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 ${
                    index === filtrados.length - 1 ? 'mb-0' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{e.numeroExpediente}</p>
                    </div>
                    <div className="text-purple-500">
                      <Plus className="w-5 h-5" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 px-6 py-4 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE: Buscador de Tipos de Actuación (Modal)
// ============================================================
function BuscadorTipoActuacion({
  onSelect,
  onClose,
}: {
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, loading } = useQuery(GET_TIPOS_ACTUACION);

  const tipos: TipoActuacion[] = data?.allTiposActuacion ?? [];

  const filtrados = tipos.filter(t =>
    `${t.nombre} ${t.codigo}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-purple-500" />
            Seleccionar Tipo de Actuación
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar tipo de actuación..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>No se encontraron tipos de actuación</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filtrados.map((t: TipoActuacion, index: number) => (
                <button
                  key={t.idTipoActuacion}
                  onClick={() => {
                    onSelect(t.idTipoActuacion, `${t.nombre} (${t.codigo})`);
                    onClose();
                  }}
                  className={`w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 ${
                    index === filtrados.length - 1 ? 'mb-0' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{t.nombre}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Código: {t.codigo}</p>
                    </div>
                    <div className="text-purple-500">
                      <Plus className="w-5 h-5" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 px-6 py-4 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ────────────────────────────────────
export default function ActuacionesPage() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [busqueda, setBusqueda] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ Estados para bloqueo de botones
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Estados para buscadores modales
  const [buscadorExpAbierto, setBuscadorExpAbierto] = useState(false);
  const [buscadorTipoAbierto, setBuscadorTipoAbierto] = useState(false);
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState("");
  const [tipoSeleccionado, setTipoSeleccionado] = useState("");

  const { data: dataExp } = useQuery(GET_EXPEDIENTES);
  const { data: dataTipos } = useQuery(GET_TIPOS_ACTUACION);
  const { data: dataAct, loading, refetch } = useQuery(GET_ACTUACIONES);
  const [crearAct] = useMutation(CREAR_ACTUACION_PROCESAL);
  const [eliminarAct] = useMutation(ELIMINAR_ACTUACION_PROCESAL);

  const { executeCreate, executeDelete, toast } = useCrudNotifications('Actuación');

  const expedientes: Expediente[] = dataExp?.allExpedientes ?? [];
  const tiposActuacion: TipoActuacion[] = dataTipos?.allTiposActuacion ?? [];
  const actuaciones: ActuacionProcesal[] = dataAct?.allActuaciones ?? [];

  const actuacionesFiltradas = actuaciones.filter(a =>
    `${a.idExpediente?.numeroExpediente} ${a.idTipoActuacion?.nombre} ${a.descripcion}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalPages = Math.ceil(actuacionesFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedActuaciones = actuacionesFiltradas.slice(startIndex, startIndex + itemsPerPage);

  const seleccionarExpediente = (id: number, nombre: string) => {
    setForm(p => ({ ...p, idExpediente: String(id) }));
    setExpedienteSeleccionado(nombre);
  };

  const seleccionarTipo = (id: number, nombre: string) => {
    setForm(p => ({ ...p, idTipoActuacion: String(id) }));
    setTipoSeleccionado(nombre);
  };

  const abrirModal = () => {
    setForm(initialForm);
    setExpedienteSeleccionado("");
    setTipoSeleccionado("");
    setModalAbierto(true);
  };

  const cerrarModal = () => { setModalAbierto(false); };

  // ✅ Guardar con bloqueo
  const guardar = async () => {
    if (form.idExpediente === "0" || form.idTipoActuacion === "0" || !form.folioInicio || !form.folioFin) {
      toast.error("Expediente, tipo de actuación y folios son obligatorios.");
      return;
    }

    if (saving) return;
    setSaving(true);

    try {
      await executeCreate(async () => {
        await crearAct({
          variables: {
            idExpediente: Number(form.idExpediente),
            idTipoActuacion: Number(form.idTipoActuacion),
            idUsuario: 1, // TODO: Obtener del contexto
            folioInicio: Number(form.folioInicio),
            folioFin: Number(form.folioFin),
            descripcion: form.descripcion || undefined,
          },
        });
        await refetch();
        cerrarModal();
        setExpedienteSeleccionado("");
        setTipoSeleccionado("");
        return true;
      });
    } finally {
      setSaving(false);
    }
  };

  // ✅ Eliminar con bloqueo
  const eliminar = async (id: number, tipo: string, expediente: string) => {
    if (deletingId === id) return;
    setDeletingId(id);

    try {
      await executeDelete(
        async () => {
          const { data } = await eliminarAct({ variables: { id: Number(id) } });
          if (!data?.eliminarActuacionProcesal?.ok) {
            throw new Error(data?.eliminarActuacionProcesal?.mensaje ?? "No se pudo eliminar");
          }
          await refetch();
          return true;
        },
        {
          loading: `Eliminando actuación ${tipo}...`,
          success: `Actuación ${tipo} eliminada exitosamente`,
          error: `Error al eliminar la actuación`,
        },
        `¿Eliminar la actuación "${tipo}" del expediente ${expediente}?`
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* ============================================================ */}
      {/* ENCABEZADO */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-purple-500" />
            Actuaciones Procesales
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestión de actuaciones procesales • {actuaciones.length} registros
          </p>
        </div>
        <button
          onClick={abrirModal}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <Plus className="w-4 h-4" />
          Nueva actuación
        </button>
      </div>

      {/* ============================================================ */}
      {/* BUSCADOR */}
      {/* ============================================================ */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          placeholder="Buscar por expediente, tipo o descripción..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
        />
      </div>

      {/* ============================================================ */}
      {/* TABLA DE ACTUACIONES */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-lg dark:shadow-slate-900/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expediente</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Folios</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse w-20"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedActuaciones.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                      <p>No hay actuaciones procesales registradas</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedActuaciones.map((a) => (
                  <tr key={a.idActuacion} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {a.idExpediente?.numeroExpediente}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-medium text-gray-800 dark:text-white">{a.idTipoActuacion?.nombre}</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{a.idTipoActuacion?.codigo}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 font-mono">
                        <Hash className="w-3 h-3" />
                        {a.folioInicio} - {a.folioFin}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {fmtFecha(a.fechaActuacion)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {a.usuario?.nombres} {a.usuario?.paterno}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {a.descripcion || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        <button 
                          onClick={() => eliminar(a.idActuacion, a.idTipoActuacion?.nombre, a.idExpediente?.numeroExpediente)} 
                          disabled={deletingId === a.idActuacion}
                          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" 
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* PAGINACIÓN */}
      {/* ============================================================ */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, actuacionesFiltradas.length)} de {actuacionesFiltradas.length}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL CON BUSCADORES */}
      {/* ============================================================ */}
      {modalAbierto && (
        <Modal onClose={cerrarModal} title="Nueva actuación procesal">
          <div className="space-y-4">
            {/* Expediente - Con buscador */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Expediente <span className="text-red-500">*</span>
              </label>
              {expedienteSeleccionado ? (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800">
                  <span className="flex-1 text-sm text-gray-800 dark:text-white">{expedienteSeleccionado}</span>
                  <button
                    onClick={() => {
                      setForm(p => ({ ...p, idExpediente: "0" }));
                      setExpedienteSeleccionado("");
                    }}
                    disabled={saving}
                    className="p-1 rounded-lg text-gray-500 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setBuscadorExpAbierto(true)}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-purple-400 dark:hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Buscar y seleccionar expediente
                </button>
              )}
            </div>

            {/* Tipo de Actuación - Con buscador */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Tipo de actuación <span className="text-red-500">*</span>
              </label>
              {tipoSeleccionado ? (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800">
                  <span className="flex-1 text-sm text-gray-800 dark:text-white">{tipoSeleccionado}</span>
                  <button
                    onClick={() => {
                      setForm(p => ({ ...p, idTipoActuacion: "0" }));
                      setTipoSeleccionado("");
                    }}
                    disabled={saving}
                    className="p-1 rounded-lg text-gray-500 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setBuscadorTipoAbierto(true)}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-purple-400 dark:hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Buscar y seleccionar tipo de actuación
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field 
                label="Folio inicio" 
                value={form.folioInicio} 
                onChange={v => setForm(p => ({ ...p, folioInicio: v }))} 
                type="number" 
                required 
                disabled={saving}
              />
              <Field 
                label="Folio fin" 
                value={form.folioFin} 
                onChange={v => setForm(p => ({ ...p, folioFin: v }))} 
                type="number" 
                required 
                disabled={saving}
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                disabled={saving}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Descripción de la actuación..."
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button 
                onClick={cerrarModal} 
                disabled={saving}
                className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button 
                onClick={guardar} 
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Guardando..." : "Registrar actuación"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modales de buscadores */}
      {buscadorExpAbierto && (
        <BuscadorExpediente
          onSelect={seleccionarExpediente}
          onClose={() => setBuscadorExpAbierto(false)}
        />
      )}
      {buscadorTipoAbierto && (
        <BuscadorTipoActuacion
          onSelect={seleccionarTipo}
          onClose={() => setBuscadorTipoAbierto(false)}
        />
      )}
    </div>
  );
}