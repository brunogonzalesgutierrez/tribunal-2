import { useState, useEffect } from "react";

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
  FolderOpen, Plus, Search, Edit, Trash2, Eye,
  ChevronLeft, ChevronRight, Building2, FileText,
  Scale, X, CheckCircle, Sparkles,
} from "lucide-react";
import DetalleExpedienteModal from "./DetalleExpedienteModal";

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

// ─── MODAL CREAR/EDITAR ──────────────────────────────────
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
  return new Date(iso).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" });
};

// ─── PÁGINA PRINCIPAL ────────────────────────────────────
export default function ExpedientesPage() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Expediente | null>(null);
  const [form, setForm] = useState(initialForm);
  const [busqueda, setBusqueda] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expedienteDetalle, setExpedienteDetalle] = useState<number | null>(null);
  // ✅ Guarda el expediente recién creado para el banner y el highlight en tabla
  const [recienCreado, setRecienCreado] = useState<{ id: number; numero: string } | null>(null);
  
  useEffect(() => {
    const id = sessionStorage.getItem("openExpedienteDetalle");
    if (id) {
      setExpedienteDetalle(Number(id));
      sessionStorage.removeItem("openExpedienteDetalle");
    }
  }, []);
  
  
  
  
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
    setRecienCreado(null);
    setModalAbierto(true);
  };

  const abrirEditar = (exp: Expediente) => {
    setEditando(exp);
    setRecienCreado(null);
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
      // ✅ FLUJO POST-CREACIÓN: cierra el form, abre el detalle directo
      await executeCreate(async () => {
        const result = await crearExp({ variables: { input } });
        await refetch();

        const nuevoId: number | undefined = result.data?.crearExpediente?.expediente?.idExpediente;
        const nuevoNumero = form.numeroExpediente;

        cerrarModal();

        if (nuevoId) {
          setRecienCreado({ id: nuevoId, numero: nuevoNumero });
          setExpedienteDetalle(nuevoId);  // abre el detalle inmediatamente
        }

        return true;
      });
    }
  };

  const eliminar = async (id: number, numero: string) => {
    await executeDelete(
      async () => {
        const { data } = await eliminarExp({ variables: { id: Number(id) } });
        if (!data?.eliminarExpediente?.ok) throw new Error(data?.eliminarExpediente?.mensaje ?? "No se pudo eliminar");
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

      {/* ENCABEZADO */}
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

      {/* ✅ BANNER POST-CREACIÓN */}
      {recienCreado && !expedienteDetalle && (
        <div className="flex items-center justify-between gap-4 px-5 py-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800/50 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow shadow-emerald-500/30 shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                Expediente <span className="font-mono">{recienCreado.numero}</span> creado exitosamente
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                Agrega partes procesales, audiencias, documentos y actuaciones desde el detalle.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setExpedienteDetalle(recienCreado.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors shadow shadow-emerald-500/30"
            >
              <Eye className="w-3.5 h-3.5" />
              Completar expediente
            </button>
            <button
              onClick={() => setRecienCreado(null)}
              className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ESTADÍSTICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: "Total Expedientes", value: totalExpedientes, color: "blue",    Icon: FolderOpen,   sub: "Expedientes registrados" },
          { label: "Activos",           value: activos,          color: "emerald", Icon: CheckCircle,  sub: "En proceso" },
          { label: "Concluidos",        value: concluidos,       color: "purple",  Icon: Scale,        sub: "Expedientes finalizados" },
        ].map(({ label, value, color, Icon, sub }) => (
          <div key={label} className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
                <p className={`text-3xl font-bold mt-2 text-${color}-600 dark:text-${color}-400`}>{value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-${color}-100 dark:bg-${color}-900/30 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* BUSCADOR */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          placeholder="Buscar por número, sala o tipo de proceso..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
        />
      </div>

      {/* TABLA */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-lg dark:shadow-slate-900/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700">
              <tr>
                {["N° Expediente", "Sala / Tribunal", "Tipo de Proceso", "Estado", "F. Ingreso", "Acciones"].map(h => (
                  <th key={h} className={`px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${h === "Acciones" ? "text-right" : "text-left"}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse w-20" />
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
                paginatedExpedientes.map((exp) => {
                  const esNuevo = recienCreado?.id === exp.idExpediente;
                  return (
                    <tr
                      key={exp.idExpediente}
                      className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group ${
                        esNuevo ? "bg-emerald-50/60 dark:bg-emerald-900/10 ring-1 ring-inset ring-emerald-200 dark:ring-emerald-800/40" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                            {exp.numeroExpediente}
                          </span>
                          {esNuevo && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
                              <Sparkles className="w-2.5 h-2.5" />
                              Nuevo
                            </span>
                          )}
                        </div>
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
                          <button
                            onClick={() => { setExpedienteDetalle(exp.idExpediente); }}
                            className={`p-2 rounded-lg transition-colors ${
                              esNuevo
                                ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                                : "text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                            }`}
                            title={esNuevo ? "Completar expediente" : "Ver detalle completo"}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => abrirEditar(exp)}
                            className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => eliminar(exp.idExpediente, exp.numeroExpediente)}
                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINACIÓN */}
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

      {/* MODAL CREAR/EDITAR */}
      {modalAbierto && (
        <Modal onClose={cerrarModal} title={editando ? "Editar expediente" : "Nuevo expediente"}>
          <div className="space-y-4">
            {/* Banner informativo al crear */}
            {!editando && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 text-xs text-blue-700 dark:text-blue-400">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Al crear el expediente se abrirá su detalle automáticamente para agregar partes, audiencias y documentos.</span>
              </div>
            )}
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
                {editando ? "Guardar cambios" : "Crear y ver detalle →"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL DETALLE */}
      {expedienteDetalle !== null && (
        <DetalleExpedienteModal
          idExpediente={expedienteDetalle}
          onClose={() => setExpedienteDetalle(null)}
        />
      )}
    </div>
  );
}