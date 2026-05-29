import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_TIPOS_ACTUACION,
  CREAR_TIPO_ACTUACION,
  ELIMINAR_TIPO_ACTUACION,
} from "../../graphql/expediente";
import { useCrudNotifications } from "../../hooks/useCrudNotifications";
import {
  ClipboardList, Plus, Search, Trash2,
  ChevronLeft, ChevronRight, X, Hash,
} from "lucide-react";

// ─── TIPOS ───────────────────────────────────────────────
interface TipoActuacion {
  idTipoActuacion: number;
  codigo: string;
  nombre: string;
}

const initialForm = { nombre: "", codigo: "" };

// ─── MODAL ───────────────────────────────────────────────
function Modal({ children, onClose, title }: {
  children: React.ReactNode; onClose: () => void; title: string;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-violet-500" />
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

const Field = ({ label, value, onChange, placeholder = "", required = false }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean;
}) => (
  <div className="mb-4">
    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all outline-none"
    />
  </div>
);

// ─── PÁGINA PRINCIPAL ────────────────────────────────────
export default function TiposActuacionPage() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [busqueda, setBusqueda] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data, loading, refetch } = useQuery(GET_TIPOS_ACTUACION);
  const [crearTipo] = useMutation(CREAR_TIPO_ACTUACION);
  const [eliminarTipo] = useMutation(ELIMINAR_TIPO_ACTUACION);
  const { executeCreate, executeDelete, toast } = useCrudNotifications("Tipo de actuación");

  const tipos: TipoActuacion[] = data?.allTiposActuacion ?? [];

  const tiposFiltrados = tipos.filter(t =>
    `${t.nombre} ${t.codigo}`.toLowerCase().includes(busqueda.toLowerCase())
  );
  const totalPages = Math.ceil(tiposFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginados = tiposFiltrados.slice(startIndex, startIndex + itemsPerPage);

  const abrirCrear = () => { setForm(initialForm); setModalAbierto(true); };
  const cerrar = () => setModalAbierto(false);

  const guardar = async () => {
    if (!form.nombre || !form.codigo) {
      toast.error("Nombre y código son obligatorios.");
      return;
    }
    await executeCreate(async () => {
      await crearTipo({ variables: { nombre: form.nombre, codigo: form.codigo } });
      await refetch(); cerrar(); return true;
    });
  };

  const eliminar = async (id: number, nombre: string) => {
    await executeDelete(
      async () => {
        const { data } = await eliminarTipo({ variables: { id } });
        if (!data?.eliminarTipoActuacion?.ok) throw new Error(data?.eliminarTipoActuacion?.mensaje ?? "Error");
        await refetch(); return true;
      },
      { loading: `Eliminando ${nombre}...`, success: `${nombre} eliminado`, error: "Error al eliminar" },
      `¿Eliminar el tipo de actuación "${nombre}"?`
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-violet-500" />
            Tipos de Actuación
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Catálogo de tipos de actuación procesal • {tipos.length} registros
          </p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white font-semibold text-sm shadow-lg shadow-violet-500/25 transition-all duration-200 hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Nuevo tipo
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg hover:shadow-xl transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total tipos</p>
              <p className="text-3xl font-bold text-violet-600 dark:text-violet-400 mt-2">{tipos.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ClipboardList className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Tipos de actuación registrados</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg hover:shadow-xl transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Resultados</p>
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">{tiposFiltrados.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Search className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Coinciden con la búsqueda</p>
          </div>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          placeholder="Buscar por nombre o código..."
          value={busqueda}
          onChange={e => { setBusqueda(e.target.value); setCurrentPage(1); }}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all outline-none"
        />
      </div>

      {/* TABLA */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700">
              <tr>
                {["Código", "Nombre", "Acciones"].map(h => (
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
                    <ClipboardList className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                    <p>No se encontraron tipos de actuación</p>
                  </div>
                </td></tr>
              ) : (
                paginados.map(t => (
                  <tr key={t.idTipoActuacion} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-mono">
                        <Hash className="w-3 h-3" />{t.codigo}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white">{t.nombre}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        <button onClick={() => eliminar(t.idTipoActuacion, t.nombre)} className="p-2 rounded-lg text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors" title="Eliminar">
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
            Mostrando {startIndex + 1}–{Math.min(startIndex + itemsPerPage, tiposFiltrados.length)} de {tiposFiltrados.length}
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
        <Modal onClose={cerrar} title="Nuevo tipo de actuación">
          <div className="space-y-1">
            <Field label="Código" value={form.codigo} onChange={v => setForm(p => ({ ...p, codigo: v }))} placeholder="Ej: ACT-DEM" required />
            <Field label="Nombre" value={form.nombre} onChange={v => setForm(p => ({ ...p, nombre: v }))} placeholder="Ej: Presentación de Demanda" required />
            <div className="flex gap-3 justify-end pt-4">
              <button onClick={cerrar} className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium">
                Cancelar
              </button>
              <button onClick={guardar} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white font-medium text-sm shadow-md transition-all">
                Crear tipo
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
