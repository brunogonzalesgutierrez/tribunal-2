import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_ESTADOS_EXPEDIENTE,
  CREAR_ESTADO_EXPEDIENTE,
  ACTUALIZAR_ESTADO_EXPEDIENTE,
  ELIMINAR_ESTADO_EXPEDIENTE,
} from "../../graphql/expediente";
import { useCrudNotifications } from "../../hooks/useCrudNotifications";
import {
  Flag, Plus, Search, Edit, Trash2,
  ChevronLeft, ChevronRight, X, CheckCircle, Scale,
} from "lucide-react";

// ─── TIPOS ───────────────────────────────────────────────
interface EstadoExpediente {
  idEstado: number;
  nombreEstado: string;
  esTerminal: boolean;
}

const initialForm = { nombreEstado: "", esTerminal: false };

// ─── MODAL ───────────────────────────────────────────────
function Modal({ children, onClose, title }: {
  children: React.ReactNode; onClose: () => void; title: string;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Flag className="w-5 h-5 text-amber-500" />
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

const Field = ({ label, value, onChange, placeholder = "", required = false, disabled = false }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; disabled?: boolean;
}) => (
  <div className="mb-4">
    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
    />
  </div>
);

// ─── PÁGINA PRINCIPAL ────────────────────────────────────
export default function EstadosExpedientePage() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<EstadoExpediente | null>(null);
  const [form, setForm] = useState(initialForm);
  const [busqueda, setBusqueda] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ Estados para bloqueo de botones
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data, loading, refetch } = useQuery(GET_ESTADOS_EXPEDIENTE);
  const [crearEstado] = useMutation(CREAR_ESTADO_EXPEDIENTE);
  const [actualizarEstado] = useMutation(ACTUALIZAR_ESTADO_EXPEDIENTE);
  const [eliminarEstado] = useMutation(ELIMINAR_ESTADO_EXPEDIENTE);
  const { executeCreate, executeUpdate, executeDelete, toast } = useCrudNotifications("Estado");

  const estados: EstadoExpediente[] = data?.allEstadosExpediente ?? [];
  const activos   = estados.filter(e => !e.esTerminal).length;
  const terminales = estados.filter(e => e.esTerminal).length;

  const estadosFiltrados = estados.filter(e =>
    e.nombreEstado.toLowerCase().includes(busqueda.toLowerCase())
  );
  const totalPages = Math.ceil(estadosFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginados  = estadosFiltrados.slice(startIndex, startIndex + itemsPerPage);

  const abrirCrear = () => { setEditando(null); setForm(initialForm); setModalAbierto(true); };
  const abrirEditar = (e: EstadoExpediente) => {
    setEditando(e);
    setForm({ nombreEstado: e.nombreEstado, esTerminal: e.esTerminal });
    setModalAbierto(true);
  };
  const cerrar = () => { setModalAbierto(false); setEditando(null); };

  // ✅ Guardar con bloqueo
  const guardar = async () => {
    if (!form.nombreEstado) { 
      toast.error("El nombre del estado es obligatorio."); 
      return; 
    }
    
    if (saving) return;
    setSaving(true);
    
    try {
      if (editando) {
        await executeUpdate(async () => {
          await actualizarEstado({ 
            variables: { 
              id: Number(editando.idEstado), 
              nombreEstado: form.nombreEstado, 
              esTerminal: form.esTerminal 
            } 
          });
          await refetch(); 
          cerrar(); 
          return true;
        });
      } else {
        await executeCreate(async () => {
          await crearEstado({ 
            variables: { 
              nombreEstado: form.nombreEstado, 
              esTerminal: form.esTerminal 
            } 
          });
          await refetch(); 
          cerrar(); 
          return true;
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // ✅ Eliminar con bloqueo
  const eliminar = async (id: number, nombre: string) => {
    if (deletingId === id) return;
    setDeletingId(id);
    
    try {
      await executeDelete(
        async () => {
          const { data } = await eliminarEstado({ variables: { id: Number(id) } });
          if (!data?.eliminarEstadoExpediente?.ok) 
            throw new Error(data?.eliminarEstadoExpediente?.mensaje ?? "Error");
          await refetch(); 
          return true;
        },
        { 
          loading: `Eliminando ${nombre}...`, 
          success: `${nombre} eliminado`, 
          error: "Error al eliminar" 
        },
        `¿Eliminar el estado "${nombre}"?`
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Flag className="w-7 h-7 text-amber-500" />
            Estados de Expediente
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Catálogo de estados de expediente judicial • {estados.length} registros
          </p>
        </div>
        <button
          onClick={abrirCrear}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-sm shadow-lg shadow-amber-500/25 transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <Plus className="w-4 h-4" />
          Nuevo estado
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg hover:shadow-xl transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total estados</p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">{estados.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Flag className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Estados registrados</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg hover:shadow-xl transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">En proceso</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{activos}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Estados no terminales</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg hover:shadow-xl transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Terminales</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{terminales}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Scale className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Estados finales</p>
          </div>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          placeholder="Buscar por nombre de estado..."
          value={busqueda}
          onChange={e => { setBusqueda(e.target.value); setCurrentPage(1); }}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none"
        />
      </div>

      {/* TABLA */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700">
              <tr>
                {["Nombre", "Tipo", "Acciones"].map(h => (
                  <th key={h} className={`px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${h === "Acciones" ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>{[...Array(3)].map((_, j) => (
                    <td key={j} className="px-6 py-4"><div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse w-24" /></td>
                  ))}</tr>
                ))
              ) : paginados.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <Flag className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                    <p>No se encontraron estados</p>
                  </div>
                </td></tr>
              ) : (
                paginados.map(e => (
                  <tr key={e.idEstado} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white">{e.nombreEstado}</td>
                    <td className="px-6 py-4">
                      {e.esTerminal ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                          <Scale className="w-3 h-3" /> Terminal
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle className="w-3 h-3" /> En proceso
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => abrirEditar(e)} 
                          disabled={saving}
                          className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" 
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => eliminar(e.idEstado, e.nombreEstado)} 
                          disabled={deletingId === e.idEstado}
                          className="p-2 rounded-lg text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" 
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

      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {startIndex + 1}–{Math.min(startIndex + itemsPerPage, estadosFiltrados.length)} de {estadosFiltrados.length}
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

      {/* MODAL */}
      {modalAbierto && (
        <Modal onClose={cerrar} title={editando ? "Editar estado" : "Nuevo estado"}>
          <div className="space-y-1">
            <Field
              label="Nombre del estado"
              value={form.nombreEstado}
              onChange={v => setForm(p => ({ ...p, nombreEstado: v }))}
              placeholder="Ej: En Investigación"
              required
              disabled={saving}
            />
            <div className="mb-4">
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                <input
                  type="checkbox"
                  checked={form.esTerminal}
                  onChange={e => setForm(p => ({ ...p, esTerminal: e.target.checked }))}
                  disabled={saving}
                  className="w-4 h-4 rounded accent-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Estado terminal</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Marca el expediente como finalizado</p>
                </div>
              </label>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button 
                onClick={cerrar} 
                disabled={saving}
                className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button 
                onClick={guardar} 
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Guardando..." : (editando ? "Guardar cambios" : "Crear estado")}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}