import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_EXPEDIENTES,
  GET_SALAS_TRIBUNAL,
  GET_TIPOS_PROCESO,
  GET_ESTADOS_EXPEDIENTE,
  CREAR_EXPEDIENTE,
  ACTUALIZAR_EXPEDIENTE,
  ELIMINAR_EXPEDIENTE,
  GET_PARTES_PROCESALES_LISTA,
} from "../../graphql/expediente";
import { useCrudNotifications } from "../../hooks/useCrudNotifications";
import { useAuth } from "../../context/AuthContext";
import {
  FolderOpen, Plus, Search, Edit, Trash2, Eye,
  ChevronLeft, ChevronRight, Building2, FileText,
  Scale, X, CheckCircle, Sparkles, Shield,
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

interface ParteProcesalLista {
  idParte: number;
  activo: boolean;
  idExpediente: { idExpediente: number };
  idPersona: {
    idPersona: number;
    nombre: string;
    primerApellido: string;
    segundoApellido?: string;
  };
  idRol: { nombreRol: string };
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

const fmtFecha = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" });
};

// ============================================================
// COMPONENTE: Buscador de Salas (Modal) - CON FILTRO POR ROL
// ============================================================
function BuscadorSala({
  onSelect,
  onClose,
  soloMiSala = false,
  salaPermitidaId,
  salaPermitidaNombre,
}: {
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
  soloMiSala?: boolean;
  salaPermitidaId?: number;
  salaPermitidaNombre?: string;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, loading } = useQuery(GET_SALAS_TRIBUNAL);

  let salas: SalaTribunal[] = data?.allSalasTribunal ?? [];

  if (soloMiSala && salaPermitidaId) {
    salas = salas.filter(s => s.idSala === salaPermitidaId);
  }

  const filtrados = salas.filter(s =>
    `${s.nombreSala} ${s.idTribunal?.nombreTribunal || ''}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-500" />
            Seleccionar Sala
            {soloMiSala && salaPermitidaNombre && (
              <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                Tu sala: {salaPermitidaNombre}
              </span>
            )}
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
              placeholder={soloMiSala ? "Buscar en tu sala..." : "Buscar sala por nombre o tribunal..."}
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>No se encontraron salas</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filtrados.map((s: SalaTribunal, index: number) => (
                <button
                  key={s.idSala}
                  onClick={() => {
                    onSelect(s.idSala, `${s.nombreSala} — ${s.idTribunal?.nombreTribunal || ''}`);
                    onClose();
                  }}
                  className={`w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 ${
                    index === filtrados.length - 1 ? 'mb-0' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{s.nombreSala}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{s.idTribunal?.nombreTribunal}</p>
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
// COMPONENTE: Buscador de Tipos de Proceso (Modal)
// ============================================================
function BuscadorTipoProceso({
  onSelect,
  onClose,
}: {
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, loading } = useQuery(GET_TIPOS_PROCESO);

  const tipos: TipoProceso[] = data?.allTiposProceso ?? [];

  const filtrados = tipos.filter(t =>
    `${t.nombre} ${t.codigo}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-500" />
            Seleccionar Tipo de Proceso
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
              placeholder="Buscar tipo de proceso..."
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>No se encontraron tipos de proceso</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filtrados.map((t: TipoProceso, index: number) => (
                <button
                  key={t.idTipoProceso}
                  onClick={() => {
                    onSelect(t.idTipoProceso, `${t.nombre} (${t.codigo})`);
                    onClose();
                  }}
                  className={`w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 ${
                    index === filtrados.length - 1 ? 'mb-0' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{t.nombre}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Código: {t.codigo}</p>
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
            <Search className="w-5 h-5 text-blue-500" />
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
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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
                  className={`w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 ${
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
// ─── PÁGINA PRINCIPAL ────────────────────────────────────
export default function ExpedientesPage() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const miSalaId = usuario?.salaAsignadaId;
  const miSalaNombre = usuario?.salaAsignadaNombre;
  const esAdministrador = usuario?.rol === "Administrador";
  const soloMiSala = !esAdministrador && miSalaId !== undefined && miSalaId !== null;

  // ========== 1. TODOS LOS useState ==========
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Expediente | null>(null);
  const [form, setForm] = useState(initialForm);
  const [busqueda, setBusqueda] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [recienCreado, setRecienCreado] = useState<{ id: number; numero: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [buscadorSalaAbierto, setBuscadorSalaAbierto] = useState(false);
  const [buscadorTipoAbierto, setBuscadorTipoAbierto] = useState(false);
  const [buscadorEstadoAbierto, setBuscadorEstadoAbierto] = useState(false);
  const [salaSeleccionada, setSalaSeleccionada] = useState("");
  const [tipoProcSeleccionado, setTipoProcSeleccionado] = useState("");
  const [estadoSeleccionado, setEstadoSeleccionado] = useState("");

  // ========== 2. TODAS LAS QUERIES Y MUTATIONS ==========
  const itemsPerPage = 10;

  const { data, loading, refetch } = useQuery(GET_EXPEDIENTES);
  const { data: dataPartesLista } = useQuery(GET_PARTES_PROCESALES_LISTA);
  const { data: dataSalas } = useQuery(GET_SALAS_TRIBUNAL);
  const { data: dataTipos } = useQuery(GET_TIPOS_PROCESO);
  const { data: dataEstados } = useQuery(GET_ESTADOS_EXPEDIENTE);

  const [crearExp] = useMutation(CREAR_EXPEDIENTE);
  const [actualizarExp] = useMutation(ACTUALIZAR_EXPEDIENTE);
  const [eliminarExp] = useMutation(ELIMINAR_EXPEDIENTE);

  const { executeCreate, executeUpdate, executeDelete, toast } = useCrudNotifications('Expediente');

  // ========== 3. EXTRAER DATOS DE LAS QUERIES (ANTES de useEffect) ==========
  const tiposProceso: TipoProceso[] = dataTipos?.allTiposProceso ?? [];

  // ========== 4. TODOS LOS useEffect (AHORA tiposProceso YA EXISTE) ==========
  useEffect(() => {
    if (soloMiSala && miSalaId && !salaSeleccionada) {
      setForm(prev => ({ ...prev, idSala: String(miSalaId) }));
      setSalaSeleccionada(miSalaNombre || "Mi sala");
    }
  }, [soloMiSala, miSalaId, miSalaNombre, salaSeleccionada]);

  useEffect(() => {
    const id = sessionStorage.getItem("openExpedienteDetalle");
    if (id) {
      navigate(`/expedientes/${id}`);
      sessionStorage.removeItem("openExpedienteDetalle");
    }
  }, []);

  // ✅ Este useEffect ahora funciona porque tiposProceso ya está declarado
  useEffect(() => {
    if (tiposProceso.length > 0 && modalAbierto && !editando && !tipoProcSeleccionado) {
      const sumario = tiposProceso.find(t =>
        t.nombre.toLowerCase().includes("sumario")
      );
      if (sumario) {
        setForm(prev => ({ ...prev, idTipoProceso: String(sumario.idTipoProceso) }));
        setTipoProcSeleccionado(`${sumario.nombre} (${sumario.codigo})`);
      }
    }
  }, [tiposProceso, modalAbierto, editando, tipoProcSeleccionado]);

  // ========== 5. CONDICIONAL DE CARGA ==========
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Cargando expedientes...</p>
        </div>
      </div>
    );
  }

  // ========== 6. RESTO DE LA LÓGICA ==========
  let expedientes: Expediente[] = data?.allExpedientes ?? [];

  if (soloMiSala && miSalaId !== undefined && miSalaId !== null) {
    const salaIdUsuario = Number(miSalaId);
    expedientes = expedientes.filter(exp => {
      const salaIdExpediente = Number(exp.idSala?.idSala);
      return salaIdExpediente === salaIdUsuario;
    });
  }

  const todasLasPartes: ParteProcesalLista[] = dataPartesLista?.allPartesProcesales ?? [];
  const salas: SalaTribunal[] = dataSalas?.allSalasTribunal ?? [];
  const estados: EstadoExpediente[] = dataEstados?.allEstadosExpediente ?? [];

  const expedientesFiltrados = expedientes.filter(e => {
    const texto = busqueda.toLowerCase();
    const base = `${e.numeroExpediente} ${e.idSala?.nombreSala} ${e.idTipoProceso?.nombre}`.toLowerCase();
    const personas = todasLasPartes
      .filter(p => String(p.idExpediente?.idExpediente) === String(e.idExpediente) && p.activo)
      .map(p => `${p.idPersona.nombre} ${p.idPersona.primerApellido} ${p.idPersona.segundoApellido ?? ""}`.trim().toLowerCase())
      .join(" ");
    return base.includes(texto) || personas.includes(texto);
  });
  
  const totalPages = Math.ceil(expedientesFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpedientes = expedientesFiltrados.slice(startIndex, startIndex + itemsPerPage);

  const totalExpedientes = expedientes.length;
  const activos = expedientes.filter(e => !e.idEstadoExpediente?.esTerminal).length;
  const concluidos = expedientes.filter(e => e.idEstadoExpediente?.esTerminal).length;

  const f = (field: string) => (v: string) => setForm(prev => ({ ...prev, [field]: v }));

  const seleccionarSala = (id: number, nombre: string) => {
    setForm(prev => ({ ...prev, idSala: String(id) }));
    setSalaSeleccionada(nombre);
  };

  const seleccionarTipoProceso = (id: number, nombre: string) => {
    setForm(prev => ({ ...prev, idTipoProceso: String(id) }));
    setTipoProcSeleccionado(nombre);
  };

  const seleccionarEstado = (id: number, nombre: string) => {
    setForm(prev => ({ ...prev, idEstadoExpediente: String(id) }));
    setEstadoSeleccionado(nombre);
  };

  const abrirCrear = () => {
    setEditando(null);
    const sumario = tiposProceso.find(t =>
      t.nombre.toLowerCase().includes("sumario")
    );
    setForm({
      ...initialForm,
      idTipoProceso: sumario ? String(sumario.idTipoProceso) : "0",
      idSala: soloMiSala && miSalaId ? String(miSalaId) : "0",
    });
    setTipoProcSeleccionado(sumario ? `${sumario.nombre} (${sumario.codigo})` : "");
    setRecienCreado(null);
    setSalaSeleccionada(soloMiSala && miSalaNombre ? miSalaNombre : "");
    setEstadoSeleccionado("");
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
    setSalaSeleccionada(`${exp.idSala.nombreSala} — ${exp.idSala.idTribunal?.nombreTribunal || ''}`);
    setTipoProcSeleccionado(`${exp.idTipoProceso.nombre} (${exp.idTipoProceso.codigo})`);
    setEstadoSeleccionado(exp.idEstadoExpediente?.nombreEstado || "");
    setModalAbierto(true);
  };

  const cerrarModal = () => { setModalAbierto(false); setEditando(null); };

  const guardar = async () => {
    if (!form.numeroExpediente || form.idSala === "0" || form.idTipoProceso === "0") {
      toast.error("Número de expediente, sala y tipo de proceso son obligatorios.");
      return;
    }
    
    if (saving) return;
    setSaving(true);
    
    const input = {
      numeroExpediente: form.numeroExpediente,
      ano: Number(form.ano),
      idSala: Number(form.idSala),
      idTipoProceso: Number(form.idTipoProceso),
      ...(form.descripcion ? { descripcion: form.descripcion } : {}),
      ...(form.idEstadoExpediente !== "0" ? { idEstadoExpediente: Number(form.idEstadoExpediente) } : {}),
    };

    try {
      if (editando) {
        await executeUpdate(async () => {
          await actualizarExp({ variables: { id: Number(editando.idExpediente), input } });
          await refetch();
          cerrarModal();
          return true;
        });
      } else {
        await executeCreate(async () => {
          const result = await crearExp({ variables: { input } });
          await refetch();
          const nuevoId: number | undefined = result.data?.crearExpediente?.expediente?.idExpediente;
          const nuevoNumero = form.numeroExpediente;
          cerrarModal();
          if (nuevoId) {
            setRecienCreado({ id: nuevoId, numero: nuevoNumero });
            navigate(`/expedientes/${nuevoId}`);
          }
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
            <FolderOpen className="w-7 h-7 text-blue-500" />
            Expedientes
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestión de expedientes judiciales • {totalExpedientes} total
            {soloMiSala && miSalaNombre && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                <Shield className="w-3 h-3" />
                Sala: {miSalaNombre}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={abrirCrear}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <Plus className="w-4 h-4" />
          Nuevo expediente
        </button>
      </div>

      {/* BANNER POST-CREACIÓN */}
      {recienCreado && (
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
              onClick={() => navigate(`/expedientes/${recienCreado.id}`)}
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
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Expedientes</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{totalExpedientes}</p>
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

      {/* BUSCADOR */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          placeholder="Buscar por número, sala, tipo de proceso o nombre de parte..."
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
              {paginatedExpedientes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <FolderOpen className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                      <p>No se encontraron expedientes</p>
                      {soloMiSala && miSalaNombre && (
                        <p className="text-xs text-gray-400 mt-1">
                          Solo se muestran expedientes de la sala "{miSalaNombre}"
                        </p>
                      )}
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
                            onClick={() => navigate(`/expedientes/${exp.idExpediente}`)}
                            disabled={saving}
                            className={`p-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
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
                            disabled={saving}
                            className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => eliminar(exp.idExpediente, exp.numeroExpediente)}
                            disabled={deletingId === exp.idExpediente}
                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
            <Field 
              label="Número de expediente" 
              value={form.numeroExpediente} 
              onChange={f("numeroExpediente")} 
              required 
              placeholder="Ej: 001/2025"
              disabled={saving}
            />
            <Field 
              label="Año" 
              value={form.ano} 
              onChange={f("ano")} 
              type="number" 
              required
              disabled={saving}
            />
            
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Sala del tribunal <span className="text-red-500">*</span>
              </label>
              {salaSeleccionada ? (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                  <span className="flex-1 text-sm text-gray-800 dark:text-white">{salaSeleccionada}</span>
                  {!soloMiSala && (
                    <button
                      onClick={() => {
                        setForm(prev => ({ ...prev, idSala: "0" }));
                        setSalaSeleccionada("");
                      }}
                      disabled={saving}
                      className="p-1 rounded-lg text-gray-500 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {soloMiSala && (
                    <span className="text-xs text-blue-500 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-full">
                      Asignada a tu rol
                    </span>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setBuscadorSalaAbierto(true)}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Buscar y seleccionar sala
                </button>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Tipo de proceso <span className="text-red-500">*</span>
              </label>
              {tipoProcSeleccionado ? (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                  <span className="flex-1 text-sm text-gray-800 dark:text-white">{tipoProcSeleccionado}</span>
                  <button
                    onClick={() => {
                      setForm(prev => ({ ...prev, idTipoProceso: "0" }));
                      setTipoProcSeleccionado("");
                    }}
                    disabled={saving}
                    className="p-1 rounded-lg text-gray-500 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setBuscadorTipoAbierto(true)}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Buscar y seleccionar tipo de proceso
                </button>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Estado inicial</label>
              {estadoSeleccionado ? (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
                  <span className="flex-1 text-sm text-gray-800 dark:text-white">{estadoSeleccionado}</span>
                  <button
                    onClick={() => {
                      setForm(prev => ({ ...prev, idEstadoExpediente: "0" }));
                      setEstadoSeleccionado("");
                    }}
                    disabled={saving}
                    className="p-1 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setBuscadorEstadoAbierto(true)}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Buscar y seleccionar estado
                </button>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={e => f("descripcion")(e.target.value)}
                disabled={saving}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Descripción del expediente..."
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
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Guardando..." : (editando ? "Guardar cambios" : "Crear y ver detalle →")}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modales de buscadores */}
      {buscadorSalaAbierto && (
        <BuscadorSala
          onSelect={seleccionarSala}
          onClose={() => setBuscadorSalaAbierto(false)}
          soloMiSala={soloMiSala}
          salaPermitidaId={miSalaId}
          salaPermitidaNombre={miSalaNombre}
        />
      )}
      
      {buscadorTipoAbierto && (
        <BuscadorTipoProceso
          onSelect={seleccionarTipoProceso}
          onClose={() => setBuscadorTipoAbierto(false)}
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