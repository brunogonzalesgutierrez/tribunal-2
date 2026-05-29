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
      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
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
      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
    >
      {children}
    </select>
  </div>
);

const fmtFecha = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-BO", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

// ─── PÁGINA PRINCIPAL ────────────────────────────────────
export default function ActuacionesPage() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [busqueda, setBusqueda] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const abrirModal = () => {
    setForm(initialForm);
    setModalAbierto(true);
  };

  const cerrarModal = () => { setModalAbierto(false); };

  const guardar = async () => {
    if (form.idExpediente === "0" || form.idTipoActuacion === "0" || !form.folioInicio || !form.folioFin) {
      toast.error("Expediente, tipo de actuación y folios son obligatorios.");
      return;
    }

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
      return true;
    });
  };

  const eliminar = async (id: number, tipo: string, expediente: string) => {
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
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 transition-all duration-200 transform hover:scale-[1.02]"
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
                        <button onClick={() => eliminar(a.idActuacion, a.idTipoActuacion?.nombre, a.idExpediente?.numeroExpediente)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors" title="Eliminar">
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
      {/* MODAL */}
      {/* ============================================================ */}
      {modalAbierto && (
        <Modal onClose={cerrarModal} title="Nueva actuación procesal">
          <div className="space-y-4">
            <SelectField label="Expediente" value={form.idExpediente} onChange={v => setForm(p => ({ ...p, idExpediente: v }))} required>
              <option value="0">— Selecciona un expediente —</option>
              {expedientes.map(e => (
                <option key={e.idExpediente} value={e.idExpediente}>{e.numeroExpediente}</option>
              ))}
            </SelectField>

            <SelectField label="Tipo de actuación" value={form.idTipoActuacion} onChange={v => setForm(p => ({ ...p, idTipoActuacion: v }))} required>
              <option value="0">— Selecciona un tipo —</option>
              {tiposActuacion.map(t => (
                <option key={t.idTipoActuacion} value={t.idTipoActuacion}>{t.nombre} ({t.codigo})</option>
              ))}
            </SelectField>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Folio inicio" value={form.folioInicio} onChange={v => setForm(p => ({ ...p, folioInicio: v }))} type="number" required />
              <Field label="Folio fin" value={form.folioFin} onChange={v => setForm(p => ({ ...p, folioFin: v }))} type="number" required />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none resize-none"
                placeholder="Descripción de la actuación..."
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button onClick={cerrarModal} className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium">
                Cancelar
              </button>
              <button onClick={guardar} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium text-sm shadow-md transition-all">
                Registrar actuación
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}