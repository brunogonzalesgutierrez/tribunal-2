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
            <Search className="w-5 h-5 text-emerald-500" />
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
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
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
                  className={`w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 ${
                    index === filtrados.length - 1 ? 'mb-0' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{e.numeroExpediente}</p>
                    </div>
                    <div className="text-emerald-500">
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
// COMPONENTE: Buscador de Estados (Modal)
// ============================================================
function BuscadorEstado({
  onSelect,
  onClose,
}: {
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, loading } = useQuery(GET_ESTADOS_EXPEDIENTE);

  const estados: EstadoExpediente[] = data?.allEstadosExpediente ?? [];

  const filtrados = estados.filter(e =>
    e.nombreEstado.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-500" />
            Seleccionar Estado
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
              placeholder="Buscar estado..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>No se encontraron estados</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filtrados.map((e: EstadoExpediente, index: number) => (
                <button
                  key={e.idEstado}
                  onClick={() => {
                    onSelect(e.idEstado, e.nombreEstado);
                    onClose();
                  }}
                  className={`w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 ${
                    index === filtrados.length - 1 ? 'mb-0' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{e.nombreEstado}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {e.esTerminal ? '📌 Estado terminal' : '🔄 En proceso'}
                      </p>
                    </div>
                    <div className="text-emerald-500">
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
export default function HistorialEstadosPage() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [busqueda, setBusqueda] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ Estados para bloqueo de botones
  const [saving, setSaving] = useState(false);

  // Estados para buscadores modales
  const [buscadorExpAbierto, setBuscadorExpAbierto] = useState(false);
  const [buscadorEstadoAbierto, setBuscadorEstadoAbierto] = useState(false);
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState("");
  const [estadoSeleccionado, setEstadoSeleccionado] = useState("");

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

  const seleccionarExpediente = (id: number, nombre: string) => {
    setForm(p => ({ ...p, idExpediente: String(id) }));
    setExpedienteSeleccionado(nombre);
  };

  const seleccionarEstado = (id: number, nombre: string) => {
    setForm(p => ({ ...p, idEstadoNuevo: String(id) }));
    setEstadoSeleccionado(nombre);
  };

  const abrirModal = () => {
    setForm(initialForm);
    setExpedienteSeleccionado("");
    setEstadoSeleccionado("");
    setModalAbierto(true);
  };

  const cerrarModal = () => { setModalAbierto(false); };

  // ✅ Guardar con bloqueo
  const guardar = async () => {
    if (form.idExpediente === "0" || form.idEstadoNuevo === "0" || !form.motivo) {
      toast.error("Todos los campos son obligatorios.");
      return;
    }

    if (saving) return;
    setSaving(true);

    try {
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
        setExpedienteSeleccionado("");
        setEstadoSeleccionado("");
        return true;
      });
    } finally {
      setSaving(false);
    }
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
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <Plus className="w-4 h-4" />
          Cambiar estado
        </button>
      </div>

      {/* ============================================================ */}
      {/* TARJETAS DE ESTADÍSTICAS - CLASES FIJAS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Total Cambios */}
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

        {/* Expedientes */}
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

        {/* Estados */}
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
      {/* MODAL CON BUSCADORES */}
      {/* ============================================================ */}
      {modalAbierto && (
        <Modal onClose={cerrarModal} title="Registrar cambio de estado">
          <div className="space-y-4">
            {/* Expediente - Con buscador */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Expediente <span className="text-red-500">*</span>
              </label>
              {expedienteSeleccionado ? (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                  <span className="flex-1 text-sm text-gray-800 dark:text-white">{expedienteSeleccionado}</span>
                  <button
                    onClick={() => {
                      setForm(p => ({ ...p, idExpediente: "0" }));
                      setExpedienteSeleccionado("");
                    }}
                    disabled={saving}
                    className="p-1 rounded-lg text-gray-500 hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setBuscadorExpAbierto(true)}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-emerald-400 dark:hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Buscar y seleccionar expediente
                </button>
              )}
            </div>

            {/* Estado Nuevo - Con buscador */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Nuevo estado <span className="text-red-500">*</span>
              </label>
              {estadoSeleccionado ? (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                  <span className="flex-1 text-sm text-gray-800 dark:text-white">{estadoSeleccionado}</span>
                  <button
                    onClick={() => {
                      setForm(p => ({ ...p, idEstadoNuevo: "0" }));
                      setEstadoSeleccionado("");
                    }}
                    disabled={saving}
                    className="p-1 rounded-lg text-gray-500 hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setBuscadorEstadoAbierto(true)}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-emerald-400 dark:hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Buscar y seleccionar estado
                </button>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Motivo del cambio <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.motivo}
                onChange={e => setForm(p => ({ ...p, motivo: e.target.value }))}
                disabled={saving}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Describe el motivo del cambio de estado..."
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
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Guardando..." : "Registrar cambio"}
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
      {buscadorEstadoAbierto && (
        <BuscadorEstado
          onSelect={seleccionarEstado}
          onClose={() => setBuscadorEstadoAbierto(false)}
        />
      )}
    </div>
  );
}