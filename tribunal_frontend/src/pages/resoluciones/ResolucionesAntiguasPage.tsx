import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_RESOLUCIONES_ANTIGUAS,
  GET_PERSONAS,
  CREAR_RESOLUCION_ANTIGUA,
  ACTUALIZAR_RESOLUCION_ANTIGUA,
  ELIMINAR_RESOLUCION_ANTIGUA,
} from "../../graphql/denuncias";
import { useCrudNotifications } from "../../hooks/useCrudNotifications";
import {
  FileText, Plus, Search, Edit, Trash2, Eye,
  ChevronLeft, ChevronRight, User, Calendar, X,
  Scale, AlertCircle, CheckCircle, Sparkles,
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
  personaAfectada: Persona;
  tipoSancion: string;
  descripcion?: string;
  sancion?: string;
  documentoUrl?: string;
}

const initialForm = {
  numeroResolucion: "",
  fechaResolucion: "",
  idPersonaAfectada: 0,
  tipoSancion: "SANCION",
  descripcion: "",
  sancion: "",
  documentoUrl: "",
};

const TIPOS_SANCION = [
  { value: "SANCION", label: "Sanción", color: "bg-red-100 text-red-700" },
  { value: "ABSOLUCION", label: "Absolución", color: "bg-emerald-100 text-emerald-700" },
  { value: "ARCHIVO", label: "Archivo", color: "bg-gray-100 text-gray-700" },
];

const fmtFecha = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" });
};

// ─── MODAL ──────────────────────────────────────────────
function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
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
      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
    />
  </div>
);

// ─── BUSCADOR DE PERSONAS ──────────────────────────────
function BuscadorPersona({
  onSelect,
  onClose,
  title = "Seleccionar Persona",
}: {
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
  title?: string;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, loading } = useQuery(GET_PERSONAS);

  const personas: Persona[] = data?.allPersonas ?? [];

  const filtrados = personas.filter(p =>
    `${p.nombre} ${p.primerApellido} ${p.segundoApellido || ""} ${p.numeroDocumento}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-500" />
            {title}
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
              placeholder="Buscar por nombre o documento..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>No se encontraron personas</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filtrados.map((p) => (
                <button
                  key={p.idPersona}
                  onClick={() => {
                    onSelect(p.idPersona, `${p.nombre} ${p.primerApellido} - ${p.numeroDocumento}`);
                    onClose();
                  }}
                  className="w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">
                        {p.nombre} {p.primerApellido} {p.segundoApellido || ""}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">CI: {p.numeroDocumento}</p>
                    </div>
                    <div className="text-blue-500">
                      <Plus className="w-5 h-5" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 px-6 py-4 rounded-b-2xl">
          <button onClick={onClose} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ────────────────────────────────────
export default function ResolucionesAntiguasPage() {
  const navigate = useNavigate();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<ResolucionAntigua | null>(null);
  const [form, setForm] = useState(initialForm);
  const [busqueda, setBusqueda] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [buscadorPersonaAbierto, setBuscadorPersonaAbierto] = useState(false);
  const [personaSeleccionada, setPersonaSeleccionada] = useState("");

  const { data, loading, refetch } = useQuery(GET_RESOLUCIONES_ANTIGUAS);
  const [crearResolucion] = useMutation(CREAR_RESOLUCION_ANTIGUA);
  const [actualizarResolucion] = useMutation(ACTUALIZAR_RESOLUCION_ANTIGUA);
  const [eliminarResolucion] = useMutation(ELIMINAR_RESOLUCION_ANTIGUA);

  const { executeCreate, executeUpdate, executeDelete, toast } = useCrudNotifications('Resolución Antigua');

  const resoluciones: ResolucionAntigua[] = data?.allResolucionesAntiguas ?? [];

  const resolucionesFiltradas = resoluciones.filter(r =>
    `${r.numeroResolucion} ${r.personaAfectada?.nombre || ''} ${r.personaAfectada?.primerApellido || ''}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalPages = Math.ceil(resolucionesFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResoluciones = resolucionesFiltradas.slice(startIndex, startIndex + itemsPerPage);

  const totalResoluciones = resoluciones.length;

  const f = (field: string) => (v: string) => setForm(prev => ({ ...prev, [field]: v }));

  const seleccionarPersona = (id: number, nombre: string) => {
    setForm(prev => ({ ...prev, idPersonaAfectada: id }));
    setPersonaSeleccionada(nombre);
  };

  const abrirCrear = () => {
    setEditando(null);
    setForm(initialForm);
    setPersonaSeleccionada("");
    setModalAbierto(true);
  };

  const abrirEditar = (r: ResolucionAntigua) => {
    setEditando(r);
    setForm({
      numeroResolucion: r.numeroResolucion,
      fechaResolucion: r.fechaResolucion,
      idPersonaAfectada: r.personaAfectada?.idPersona || 0,
      tipoSancion: r.tipoSancion,
      descripcion: r.descripcion || "",
      sancion: r.sancion || "",
      documentoUrl: r.documentoUrl || "",
    });
    setPersonaSeleccionada(r.personaAfectada ? `${r.personaAfectada.nombre} ${r.personaAfectada.primerApellido}` : "");
    setModalAbierto(true);
  };

  const cerrarModal = () => { setModalAbierto(false); setEditando(null); };

  const guardar = async () => {
    if (!form.numeroResolucion || !form.fechaResolucion || !form.idPersonaAfectada || !form.tipoSancion) {
      toast.error("Número, fecha, persona afectada y tipo de sanción son obligatorios.");
      return;
    }

    if (saving) return;
    setSaving(true);

    const input = {
      numeroResolucion: form.numeroResolucion,
      fechaResolucion: form.fechaResolucion,
      idPersonaAfectada: Number(form.idPersonaAfectada),
      tipoSancion: form.tipoSancion,
      descripcion: form.descripcion || undefined,
      sancion: form.sancion || undefined,
      documentoUrl: form.documentoUrl || undefined,
    };

    try {
      if (editando) {
        await executeUpdate(async () => {
          await actualizarResolucion({
            variables: { id: Number(editando.idResolucionAntigua), input },
          });
          await refetch();
          cerrarModal();
          return true;
        });
      } else {
        await executeCreate(async () => {
          await crearResolucion({ variables: { input } });
          await refetch();
          cerrarModal();
          return true;
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (id: number, numero: string) => {
    if (deletingId === id) return;
    setDeletingId(id);
    try {
      await executeDelete(
        async () => {
          const { data } = await eliminarResolucion({ variables: { id: Number(id) } });
          if (!data?.eliminarResolucionAntigua?.ok) throw new Error(data?.eliminarResolucionAntigua?.mensaje);
          await refetch();
          return true;
        },
        {
          loading: `Eliminando resolución ${numero}...`,
          success: `Resolución ${numero} eliminada exitosamente`,
          error: `Error al eliminar la resolución`,
        },
        `¿Eliminar la resolución ${numero}?`
      );
    } finally {
      setDeletingId(null);
    }
  };

  const getTipoBadge = (tipo: string) => {
    const found = TIPOS_SANCION.find(t => t.value === tipo);
    return found?.color || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-500" />
            Resoluciones Antiguas
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Registro histórico de resoluciones anteriores al sistema • {totalResoluciones} registros
          </p>
        </div>
        <button
          onClick={abrirCrear}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Nueva resolución
        </button>
      </div>

      {/* ESTADÍSTICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{totalResoluciones}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sanciones</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                {resoluciones.filter(r => r.tipoSancion === "SANCION").length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Absoluciones</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                {resoluciones.filter(r => r.tipoSancion === "ABSOLUCION").length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          placeholder="Buscar por número o persona afectada..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
        />
      </div>

      {/* TABLA */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700">
              <tr>
                {["N° Resolución", "Persona Afectada", "Tipo", "Fecha", "Acciones"].map(h => (
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
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedResoluciones.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                      <p>No se encontraron resoluciones</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedResoluciones.map((res) => (
                  <tr key={res.idResolucionAntigua} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {res.numeroResolucion}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-800 dark:text-white">
                          {res.personaAfectada?.nombre} {res.personaAfectada?.primerApellido}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getTipoBadge(res.tipoSancion)}`}>
                        {TIPOS_SANCION.find(t => t.value === res.tipoSancion)?.label || res.tipoSancion}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {fmtFecha(res.fechaResolucion)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/resoluciones-antiguas/${res.idResolucionAntigua}`)}
                          disabled={saving}
                          className="p-2 rounded-lg text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors disabled:opacity-40"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => abrirEditar(res)}
                          disabled={saving}
                          className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-40"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => eliminar(res.idResolucionAntigua, res.numeroResolucion)}
                          disabled={deletingId === res.idResolucionAntigua}
                          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-40"
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
            Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, resolucionesFiltradas.length)} de {resolucionesFiltradas.length}
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
        <Modal onClose={cerrarModal} title={editando ? "Editar resolución" : "Nueva resolución antigua"}>
          <div className="space-y-4">
            <Field
              label="Número de resolución"
              value={form.numeroResolucion}
              onChange={f("numeroResolucion")}
              required
              placeholder="Ej: RES-001/2020"
              disabled={saving}
            />

            <Field
              label="Fecha de resolución"
              value={form.fechaResolucion}
              onChange={f("fechaResolucion")}
              type="date"
              required
              disabled={saving}
            />

            {/* Persona afectada */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Persona afectada <span className="text-red-500">*</span>
              </label>
              {personaSeleccionada ? (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                  <span className="flex-1 text-sm text-gray-800 dark:text-white">{personaSeleccionada}</span>
                  <button
                    onClick={() => {
                      setForm(prev => ({ ...prev, idPersonaAfectada: 0 }));
                      setPersonaSeleccionada("");
                    }}
                    disabled={saving}
                    className="p-1 rounded-lg text-gray-500 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setBuscadorPersonaAbierto(true)}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Buscar persona
                </button>
              )}
            </div>

            {/* Tipo de sanción */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Tipo de sanción <span className="text-red-500">*</span>
              </label>
              <select
                value={form.tipoSancion}
                onChange={e => f("tipoSancion")(e.target.value)}
                disabled={saving}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              >
                {TIPOS_SANCION.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Sanción impuesta (solo si es SANCION) */}
            {form.tipoSancion === "SANCION" && (
              <Field
                label="Sanción impuesta"
                value={form.sancion}
                onChange={f("sancion")}
                placeholder="Ej: Suspensión 3 meses, Multa de Bs. 1000, etc."
                disabled={saving}
              />
            )}

            {/* Descripción */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Descripción
              </label>
              <textarea
                value={form.descripcion}
                onChange={e => f("descripcion")(e.target.value)}
                disabled={saving}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
                placeholder="Descripción del caso y lo resuelto..."
              />
            </div>

            {/* URL del documento */}
            <Field
              label="URL del documento"
              value={form.documentoUrl}
              onChange={f("documentoUrl")}
              placeholder="https://..."
              disabled={saving}
            />

            <div className="flex gap-3 justify-end pt-4">
              <button onClick={cerrarModal} disabled={saving} className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium">
                Cancelar
              </button>
              <button onClick={guardar} disabled={saving} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium text-sm shadow-md transition-all disabled:opacity-50">
                {saving ? "Guardando..." : (editando ? "Guardar cambios" : "Crear resolución")}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL BUSCADOR PERSONA */}
      {buscadorPersonaAbierto && (
        <BuscadorPersona
          onSelect={seleccionarPersona}
          onClose={() => setBuscadorPersonaAbierto(false)}
          title="Seleccionar Persona Afectada"
        />
      )}
    </div>
  );
}