import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_EXPEDIENTES,
  GET_SALAS_TRIBUNAL,
  GET_TIPOS_PROCESO,
  GET_ESTADOS_EXPEDIENTE,
  CREAR_EXPEDIENTE,
  ACTUALIZAR_EXPEDIENTE,
  ELIMINAR_EXPEDIENTE,
} from "../../graphql/expediente";
import { useCrudNotifications } from "../../hooks/useCrudNotifications";
import { 
  FolderOpen, Plus, Search, Edit, Trash2, 
  ChevronLeft, ChevronRight, Building2, FileText,
  Calendar, Scale, X, CheckCircle, Circle
} from "lucide-react";

// ─── TIPOS ───────────────────────────────────────────────
interface SalaTribunal {
  idSala: number;
  nombreSala: string;
  idTribunal: { nombreTribunal: string };
}
interface TipoProceso {
  idTipoProceso: number;
  nombre: string;
  codigo: string;
}
interface EstadoExpediente {
  idEstado: number;
  nombreEstado: string;
  esTerminal: boolean;
}
interface Expediente {
  idExpediente: number;
  numeroExpediente: string;
  ano: number;
  fechaIngreso: string;
  fechaConclusion?: string;
  descripcion?: string;
  idSala: SalaTribunal;
  idTipoProceso: TipoProceso;
  idEstadoExpediente?: EstadoExpediente;
}

const initialForm = {
  numeroExpediente: "", ano: String(new Date().getFullYear()),
  idSala: "0", idTipoProceso: "0", idEstadoExpediente: "0", descripcion: "",
};

// ─── MODAL ───────────────────────────────────────────────
function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-500" />
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

// ─── CAMPO DE FORMULARIO ─────────────────────────────────
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
      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
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
      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
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
export default function ExpedientesPage() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Expediente | null>(null);
  const [form, setForm] = useState(initialForm);
  const [busqueda, setBusqueda] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data, loading, refetch } = useQuery(GET_EXPEDIENTES);
  const { data: dataSalas } = useQuery(GET_SALAS_TRIBUNAL);
  const { data: dataTipos } = useQuery(GET_TIPOS_PROCESO);
  const { data: dataEstados } = useQuery(GET_ESTADOS_EXPEDIENTE);

  const [crearExp] = useMutation(CREAR_EXPEDIENTE);
  const [actualizarExp] = useMutation(ACTUALIZAR_EXPEDIENTE);
  const [eliminarExp] = useMutation(ELIMINAR_EXPEDIENTE);

  const { executeCreate, executeUpdate, executeDelete, toast } = useCrudNotifications('Expediente');

  const expedientes: Expediente[] = data?.allExpedientes ?? [];
  const salas: SalaTribunal[] = dataSalas?.allSalasTribunal ?? [];
  const tiposProceso: TipoProceso[] = dataTipos?.allTiposProceso ?? [];
  const estados: EstadoExpediente[] = dataEstados?.allEstadosExpediente ?? [];

  const expedientesFiltrados = expedientes.filter(e =>
    `${e.numeroExpediente} ${e.idSala?.nombreSala} ${e.idTipoProceso?.nombre}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalPages = Math.ceil(expedientesFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpedientes = expedientesFiltrados.slice(startIndex, startIndex + itemsPerPage);

  const totalExpedientes = expedientes.length;
  const activos = expedientes.filter(e => !e.idEstadoExpediente?.esTerminal).length;
  const concluidos = expedientes.filter(e => e.idEstadoExpediente?.esTerminal).length;

  const abrirCrear = () => {
    setEditando(null);
    setForm(initialForm);
    setModalAbierto(true);
  };

  const abrirEditar = (exp: Expediente) => {
    setEditando(exp);
    setForm({
      numeroExpediente: exp.numeroExpediente,
      ano: String(exp.ano),
      idSala: String(exp.idSala.idSala),
      idTipoProceso: String(exp.idTipoProceso.idTipoProceso),
      idEstadoExpediente: exp.idEstadoExpediente ? String(exp.idEstadoExpediente.idEstado) : "0",
      descripcion: exp.descripcion ?? "",
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => { setModalAbierto(false); setEditando(null); };
  const f = (field: string) => (v: string) => setForm(prev => ({ ...prev, [field]: v }));

  const guardar = async () => {
    if (!form.numeroExpediente || form.idSala === "0" || form.idTipoProceso === "0") {
      toast.error("Número de expediente, sala y tipo de proceso son obligatorios.");
      return;
    }

    const input = {
      numeroExpediente: form.numeroExpediente,
      ano: Number(form.ano),
      idSala: Number(form.idSala),
      idTipoProceso: Number(form.idTipoProceso),
      ...(form.descripcion ? { descripcion: form.descripcion } : {}),
      ...(form.idEstadoExpediente !== "0" ? { idEstadoExpediente: Number(form.idEstadoExpediente) } : {}),
    };

    if (editando) {
      await executeUpdate(async () => {
        await actualizarExp({ variables: { id: Number(editando.idExpediente), input } });
        await refetch();
        cerrarModal();
        return true;
      });
    } else {
      await executeCreate(async () => {
        await crearExp({ variables: { input } });
        await refetch();
        cerrarModal();
        return true;
      });
    }
  };

  const eliminar = async (id: number, numero: string) => {
    await executeDelete(
      async () => {
        const { data } = await eliminarExp({ variables: { id: Number(id) } });
        if (!data?.eliminarExpediente?.ok) {
          throw new Error(data?.eliminarExpediente?.mensaje ?? "No se pudo eliminar");
        }
        await refetch();
        return true;
      },
      {
        loading: `Eliminando expediente ${numero}...`,
        success: `Expediente ${numero} eliminado exitosamente`,
        error: `Error al eliminar el expediente`,
      },
      `¿Eliminar el expediente ${numero}? Esta acción no se puede deshacer.`
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
            <FolderOpen className="w-7 h-7 text-blue-500" />
            Expedientes
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestión de expedientes judiciales • {totalExpedientes} total
          </p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all duration-200 transform hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Nuevo expediente
        </button>
      </div>

      {/* ============================================================ */}
      {/* TARJETAS DE ESTADÍSTICAS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Expedientes</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{totalExpedientes}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FolderOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Expedientes registrados</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Activos</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{activos}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">En proceso</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Concluidos</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{concluidos}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Scale className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Expedientes finalizados</p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* BUSCADOR */}
      {/* ============================================================ */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          placeholder="Buscar por número, sala o tipo de proceso..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
        />
      </div>

      {/* ============================================================ */}
      {/* TABLA DE EXPEDIENTES */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-lg dark:shadow-slate-900/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">N° Expediente</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sala / Tribunal</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo de Proceso</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">F. Ingreso</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse w-20"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedExpedientes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <FolderOpen className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                      <p>No se encontraron expedientes</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedExpedientes.map((exp) => (
                  <tr key={exp.idExpediente} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {exp.numeroExpediente}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-800 dark:text-white">{exp.idSala?.nombreSala}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{exp.idSala?.idTribunal?.nombreTribunal}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        <FileText className="w-3 h-3" />
                        {exp.idTipoProceso?.nombre}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {exp.idEstadoExpediente ? (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          exp.idEstadoExpediente.esTerminal 
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                            : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        }`}>
                          {exp.idEstadoExpediente.esTerminal ? <Scale className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                          {exp.idEstadoExpediente.nombreEstado}
                        </span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {fmtFecha(exp.fechaIngreso)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => abrirEditar(exp)} className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors" title="Editar">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => eliminar(exp.idExpediente, exp.numeroExpediente)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors" title="Eliminar">
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
            Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, expedientesFiltrados.length)} de {expedientesFiltrados.length}
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
      {/* MODAL CREAR/EDITAR */}
      {/* ============================================================ */}
      {modalAbierto && (
        <Modal onClose={cerrarModal} title={editando ? "Editar expediente" : "Nuevo expediente"}>
          <div className="space-y-4">
            <Field label="Número de expediente" value={form.numeroExpediente} onChange={f("numeroExpediente")} required placeholder="Ej: 001/2025" />
            <Field label="Año" value={form.ano} onChange={f("ano")} type="number" required />

            <SelectField label="Sala del tribunal" value={form.idSala} onChange={f("idSala")} required>
              <option value="0">— Selecciona una sala —</option>
              {salas.map(s => (
                <option key={s.idSala} value={s.idSala}>{s.nombreSala} — {s.idTribunal?.nombreTribunal}</option>
              ))}
            </SelectField>

            <SelectField label="Tipo de proceso" value={form.idTipoProceso} onChange={f("idTipoProceso")} required>
              <option value="0">— Selecciona tipo de proceso —</option>
              {tiposProceso.map(t => (
                <option key={t.idTipoProceso} value={t.idTipoProceso}>{t.nombre} ({t.codigo})</option>
              ))}
            </SelectField>

            <SelectField label="Estado inicial" value={form.idEstadoExpediente} onChange={f("idEstadoExpediente")}>
              <option value="0">— Sin estado —</option>
              {estados.map(e => (
                <option key={e.idEstado} value={e.idEstado}>{e.nombreEstado}</option>
              ))}
            </SelectField>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={e => f("descripcion")(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
                placeholder="Descripción del expediente..."
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button onClick={cerrarModal} className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium">
                Cancelar
              </button>
              <button onClick={guardar} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium text-sm shadow-md transition-all">
                {editando ? "Guardar cambios" : "Crear expediente"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}