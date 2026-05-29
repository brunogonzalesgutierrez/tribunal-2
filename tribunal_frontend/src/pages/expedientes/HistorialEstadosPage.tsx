import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_EXPEDIENTES,
  GET_ESTADOS_EXPEDIENTE,
  GET_HISTORIALES,
  CREAR_HISTORIAL_ESTADO,
} from "../../graphql/expediente";
import { useCrudNotifications } from "../../hooks/useCrudNotifications";
import { 
  History, Plus, Search, Calendar, User, FileText,
  ChevronLeft, ChevronRight, X, CheckCircle, AlertCircle
} from "lucide-react";

// ─── TIPOS ───────────────────────────────────────────────
interface EstadoExpediente {
  idEstado: number;
  nombreEstado: string;
  esTerminal: boolean;
}
interface Expediente {
  idExpediente: number;
  numeroExpediente: string;
}
interface HistorialEstado {
  idHistorial: number;
  fechaCambio: string;
  motivo: string;
  idExpediente: Expediente;
  idEstadoAnterior?: EstadoExpediente;
  idEstadoNuevo: EstadoExpediente;
  usuario: { idUsuario: number; nombres: string; paterno: string };
}

const initialForm = {
  idExpediente: "0", idEstadoNuevo: "0", motivo: "",
};

// ─── MODAL ───────────────────────────────────────────────
function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-500" />
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
      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
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
export default function HistorialEstadosPage() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [busqueda, setBusqueda] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: dataExp, loading: lExp } = useQuery(GET_EXPEDIENTES);
  const { data: dataEstados } = useQuery(GET_ESTADOS_EXPEDIENTE);
  const { data: dataHist, loading: lHist, refetch } = useQuery(GET_HISTORIALES);
  const [crearHist] = useMutation(CREAR_HISTORIAL_ESTADO);

  const { executeCreate, toast } = useCrudNotifications('Cambio de estado');

  const expedientes: Expediente[] = dataExp?.allExpedientes ?? [];
  const estados: EstadoExpediente[] = dataEstados?.allEstadosExpediente ?? [];
  const historiales: HistorialEstado[] = dataHist?.allHistoriales ?? [];

  const historialesFiltrados = historiales.filter(h =>
    `${h.idExpediente?.numeroExpediente} ${h.motivo} ${h.idEstadoNuevo?.nombreEstado}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalPages = Math.ceil(historialesFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHistoriales = historialesFiltrados.slice(startIndex, startIndex + itemsPerPage);

  const abrirModal = () => {
    setForm(initialForm);
    setModalAbierto(true);
  };

  const cerrarModal = () => { setModalAbierto(false); };

  const guardar = async () => {
    if (form.idExpediente === "0" || form.idEstadoNuevo === "0" || !form.motivo) {
      toast.error("Todos los campos son obligatorios.");
      return;
    }

    await executeCreate(async () => {
      await crearHist({
        variables: {
          idExpediente: Number(form.idExpediente),
          idEstadoNuevo: Number(form.idEstadoNuevo),
          idUsuario: 1, // TODO: Obtener del contexto
          motivo: form.motivo,
        },
      });
      await refetch();
      cerrarModal();
      return true;
    });
  };

  const totalCambios = historiales.length;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* ============================================================ */}
      {/* ENCABEZADO */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <History className="w-7 h-7 text-emerald-500" />
            Historial de Estados
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Registro de cambios de estado de expedientes • {totalCambios} registros
          </p>
        </div>
        <button
          onClick={abrirModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 transition-all duration-200 transform hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Cambiar estado
        </button>
      </div>

      {/* ============================================================ */}
      {/* TARJETAS DE ESTADÍSTICAS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Cambios</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{totalCambios}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <History className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Registros en el historial</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expedientes</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{expedientes.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Expedientes activos</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estados</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{estados.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Estados disponibles</p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* BUSCADOR */}
      {/* ============================================================ */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          placeholder="Buscar por expediente, estado o motivo..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
        />
      </div>

      {/* ============================================================ */}
      {/* TABLA DE HISTORIAL */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-lg dark:shadow-slate-900/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expediente</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado Anterior</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado Nuevo</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {lHist ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse w-20"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedHistoriales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <History className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                      <p>No hay registros en el historial</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedHistoriales.map((h) => (
                  <tr key={h.idHistorial} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {h.idExpediente?.numeroExpediente}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {h.idEstadoAnterior ? (
                        <span className="text-sm text-gray-600 dark:text-gray-400">{h.idEstadoAnterior.nombreEstado}</span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle className="w-3 h-3" />
                        {h.idEstadoNuevo?.nombreEstado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {fmtFecha(h.fechaCambio)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {h.usuario?.nombres} {h.usuario?.paterno}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {h.motivo}
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
            Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, historialesFiltrados.length)} de {historialesFiltrados.length}
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
        <Modal onClose={cerrarModal} title="Registrar cambio de estado">
          <div className="space-y-4">
            <SelectField label="Expediente" value={form.idExpediente} onChange={v => setForm(p => ({ ...p, idExpediente: v }))} required>
              <option value="0">— Selecciona un expediente —</option>
              {expedientes.map(e => (
                <option key={e.idExpediente} value={e.idExpediente}>{e.numeroExpediente}</option>
              ))}
            </SelectField>

            <SelectField label="Nuevo estado" value={form.idEstadoNuevo} onChange={v => setForm(p => ({ ...p, idEstadoNuevo: v }))} required>
              <option value="0">— Selecciona un estado —</option>
              {estados.map(e => (
                <option key={e.idEstado} value={e.idEstado}>{e.nombreEstado}</option>
              ))}
            </SelectField>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Motivo del cambio <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.motivo}
                onChange={e => setForm(p => ({ ...p, motivo: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none resize-none"
                placeholder="Describe el motivo del cambio de estado..."
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button onClick={cerrarModal} className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium">
                Cancelar
              </button>
              <button onClick={guardar} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium text-sm shadow-md transition-all">
                Registrar cambio
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}