import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_PARTES_PROCESALES,
  GET_PERSONAS,
  GET_ROLES_PROCESAL,
  GET_EXPEDIENTES_SIMPLE,
  CREAR_PARTE_PROCESAL,
  ACTUALIZAR_PARTE_PROCESAL,
  ELIMINAR_PARTE_PROCESAL,
} from "../../graphql/personas";
import { Users, Plus, Edit, Trash2, UserCheck, UserX, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  ParteProcesal, Persona, RolProcesal, Expediente, nombreCompleto, fmtFecha,
  AbogadoBadge, RolBadge, EstadoBadge,
  Modal, Field, ErrorBox, ModalFooter,
  StatCard, SearchBar,
} from "./shared";
import { useCrudNotifications } from '../../hooks/useCrudNotifications';
import { useToast } from '../../context/ToastContext';

type FiltroActivo = "TODOS" | "ACTIVO" | "INACTIVO";

const initForm = { idExpediente: "", idPersona: "", idRol: "", fechaExclusion: "" };

// ============================================================
// COMPONENTE: Buscador de Expedientes (Modal)
// ============================================================
function BuscadorExpediente({
  onSelect,
  onClose,
  disabled,
}: {
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
  disabled?: boolean;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, loading } = useQuery(GET_EXPEDIENTES_SIMPLE);

  const expedientes: Expediente[] = data?.allExpedientes ?? [];

  const filtrados = expedientes.filter(e =>
    `${e.numeroExpediente} ${e.ano}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-500" />
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
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
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
                    onSelect(e.idExpediente, `${e.numeroExpediente} (${e.ano})`);
                    onClose();
                  }}
                  disabled={disabled}
                  className={`w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 disabled:opacity-50 disabled:cursor-not-allowed ${
                    index === filtrados.length - 1 ? 'mb-0' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{e.numeroExpediente}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Año: {e.ano}</p>
                    </div>
                    <div className="text-amber-500">
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
// COMPONENTE: Buscador de Personas (Modal)
// ============================================================
function BuscadorPersona({
  onSelect,
  onClose,
  disabled,
}: {
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
  disabled?: boolean;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, loading } = useQuery(GET_PERSONAS);

  const personas: Persona[] = data?.allPersonas ?? [];

  const filtrados = personas.filter(p =>
    `${p.nombre} ${p.primerApellido} ${p.numeroDocumento}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-500" />
            Seleccionar Persona
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
              placeholder="Buscar por nombre, apellido o documento..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>No se encontraron personas</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filtrados.map((p: Persona, index: number) => (
                <button
                  key={p.idPersona}
                  onClick={() => {
                    onSelect(p.idPersona, `${p.nombre} ${p.primerApellido} (${p.numeroDocumento})`);
                    onClose();
                  }}
                  disabled={disabled}
                  className={`w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 disabled:opacity-50 disabled:cursor-not-allowed ${
                    index === filtrados.length - 1 ? 'mb-0' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{p.nombre} {p.primerApellido}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{p.numeroDocumento}</p>
                    </div>
                    <div className="text-amber-500">
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
// COMPONENTE: Buscador de Roles (Modal)
// ============================================================
function BuscadorRol({
  onSelect,
  onClose,
  disabled,
}: {
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
  disabled?: boolean;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, loading } = useQuery(GET_ROLES_PROCESAL);

  const roles: RolProcesal[] = data?.allRolesProcesal ?? [];

  const filtrados = roles.filter(r =>
    r.nombreRol.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-500" />
            Seleccionar Rol Procesal
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
              placeholder="Buscar rol por nombre..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>No se encontraron roles</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filtrados.map((r: RolProcesal, index: number) => (
                <button
                  key={r.idRol}
                  onClick={() => {
                    onSelect(r.idRol, r.nombreRol);
                    onClose();
                  }}
                  disabled={disabled}
                  className={`w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 disabled:opacity-50 disabled:cursor-not-allowed ${
                    index === filtrados.length - 1 ? 'mb-0' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{r.nombreRol}</p>
                    </div>
                    <div className="text-amber-500">
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

// ════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════
export default function PartesPage() {
  const { data, loading, refetch } = useQuery(GET_PARTES_PROCESALES);
  const { data: dataPersonas }     = useQuery(GET_PERSONAS);
  const { data: dataRoles }        = useQuery(GET_ROLES_PROCESAL);
  const { data: dataExp }          = useQuery(GET_EXPEDIENTES_SIMPLE);
  const [crearParte]      = useMutation(CREAR_PARTE_PROCESAL);
  const [actualizarParte] = useMutation(ACTUALIZAR_PARTE_PROCESAL);
  const [eliminarParte]   = useMutation(ELIMINAR_PARTE_PROCESAL);

  const { executeCreate, executeUpdate, executeDelete } = useCrudNotifications('Parte Procesal');
  const toast = useToast();

  // ✅ Estado para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ Estado para bloqueo de botones
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [modal, setModal]        = useState(false);
  const [buscadorExpAbierto, setBuscadorExpAbierto] = useState(false);
  const [buscadorPersonaAbierto, setBuscadorPersonaAbierto] = useState(false);
  const [buscadorRolAbierto, setBuscadorRolAbierto] = useState(false);
  const [editando, setEdit]      = useState<ParteProcesal | null>(null);
  const [form, setForm]          = useState(initForm);
  const [busqueda, setBusq]      = useState("");
  const [filtroActivo, setFiltro] = useState<FiltroActivo>("TODOS");
  const [err, setErr]            = useState("");
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState("");
  const [personaSeleccionada, setPersonaSeleccionada] = useState("");
  const [rolSeleccionado, setRolSeleccionado] = useState("");

  const partes: ParteProcesal[] = data?.allPartesProcesales ?? [];
  const personas: Persona[]     = dataPersonas?.allPersonas ?? [];
  const roles: RolProcesal[]    = dataRoles?.allRolesProcesal ?? [];
  const expedientes: Expediente[] = dataExp?.allExpedientes ?? [];

  // ✅ Filtrar partes por búsqueda y estado
  const partesFiltradas = partes.filter(p => {
    const matchBusq = `${p.idPersona?.nombre ?? ""} ${p.idPersona?.primerApellido ?? ""} ${p.idExpediente?.numeroExpediente ?? ""} ${p.idRol?.nombreRol ?? ""}`
      .toLowerCase().includes(busqueda.toLowerCase());
    const matchActivo =
      filtroActivo === "TODOS" ||
      (filtroActivo === "ACTIVO" ? p.activo : !p.activo);
    return matchBusq && matchActivo;
  });

  // ✅ Paginación
  const totalPages = Math.ceil(partesFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPartes = partesFiltradas.slice(startIndex, startIndex + itemsPerPage);

  // Stats
  const activos   = partes.filter(p => p.activo).length;
  const inactivos = partes.filter(p => !p.activo).length;

  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const seleccionarExpediente = (id: number, nombre: string) => {
    setForm(p => ({ ...p, idExpediente: String(id) }));
    setExpedienteSeleccionado(nombre);
  };

  const seleccionarPersona = (id: number, nombre: string) => {
    setForm(p => ({ ...p, idPersona: String(id) }));
    setPersonaSeleccionada(nombre);
  };

  const seleccionarRol = (id: number, nombre: string) => {
    setForm(p => ({ ...p, idRol: String(id) }));
    setRolSeleccionado(nombre);
  };

  const abrirCrear = () => { 
    setEdit(null); 
    setForm(initForm); 
    setExpedienteSeleccionado("");
    setPersonaSeleccionada("");
    setRolSeleccionado("");
    setErr(""); 
    setModal(true); 
  };

  const abrirEditar = (p: ParteProcesal) => {
    setEdit(p);
    setForm({
      idExpediente:  String(p.idExpediente?.idExpediente ?? ""),
      idPersona:     String(p.idPersona?.idPersona ?? ""),
      idRol:         String(p.idRol?.idRol ?? ""),
      fechaExclusion: p.fechaExclusion ?? "",
    });
    setExpedienteSeleccionado(`${p.idExpediente?.numeroExpediente} (${p.idExpediente?.ano})`);
    setPersonaSeleccionada(`${p.idPersona?.nombre} ${p.idPersona?.primerApellido} (${p.idPersona?.numeroDocumento})`);
    setRolSeleccionado(p.idRol?.nombreRol ?? "");
    setErr(""); 
    setModal(true);
  };

  // Resetear página cuando cambia la búsqueda o el filtro
  const handleBusquedaChange = (value: string) => {
    setBusq(value);
    setCurrentPage(1);
  };

  const handleFiltroChange = (filtro: FiltroActivo) => {
    setFiltro(filtro);
    setCurrentPage(1);
  };

  // ✅ GUARDAR CON BLOQUEO
  const guardar = async () => {
    if (!editando && (!form.idExpediente || !form.idPersona || !form.idRol)) {
      toast.error("Expediente, persona y rol son obligatorios.");
      return;
    }
    
    if (saving) return;
    setSaving(true);
    
    try {
      if (editando) {
        await executeUpdate(async () => {
          await actualizarParte({
            variables: {
              id: Number(editando.idParte),
              input: { 
                activo: editando.activo, 
                fechaExclusion: form.fechaExclusion || undefined 
              },
            },
          });
          await refetch();
          setModal(false);
          return true;
        });
      } else {
        await executeCreate(async () => {
          await crearParte({
            variables: {
              idExpediente: Number(form.idExpediente),
              idPersona:    Number(form.idPersona),
              idRol:        Number(form.idRol),
            },
          });
          await refetch();
          setModal(false);
          setExpedienteSeleccionado("");
          setPersonaSeleccionada("");
          setRolSeleccionado("");
          return true;
        });
      }
    } catch (e: any) { 
      setErr(e.message ?? "Error."); 
    } finally {
      setSaving(false);
    }
  };

  // ✅ TOGGLE ACTIVO CON BLOQUEO
  const toggleActivo = async (p: ParteProcesal) => {
    if (togglingId === p.idParte) return;
    setTogglingId(p.idParte);
    
    try {
      const nuevaFechaExclusion = p.activo ? new Date().toISOString().split("T")[0] : null;
      await actualizarParte({
        variables: {
          id: Number(p.idParte),
          input: {
            activo: !p.activo,
            fechaExclusion: nuevaFechaExclusion,
          },
        },
      });
      await refetch();
      toast.success(`Parte ${p.activo ? 'excluida' : 'reincorporada'} correctamente`);
    } catch (error: any) {
      toast.error(error.message ?? "Error al cambiar estado");
    } finally {
      setTogglingId(null);
    }
  };

  // ✅ ELIMINAR CON BLOQUEO
  const eliminar = async (p: ParteProcesal) => {
    if (deletingId === p.idParte) return;
    setDeletingId(p.idParte);
    
    try {
      await executeDelete(
        async () => {
          const { data } = await eliminarParte({ variables: { id: Number(p.idParte) } });
          if (!data?.eliminarParteProcesal?.ok) {
            throw new Error(data?.eliminarParteProcesal?.mensaje ?? "No se pudo eliminar.");
          }
          await refetch();
          return true;
        },
        {
          loading: `Eliminando parte ${p.idPersona?.nombre} ${p.idPersona?.primerApellido}...`,
          success: `Parte eliminada exitosamente`,
          error: `Error al eliminar la parte`,
        },
        `¿Eliminar a ${p.idPersona?.nombre} ${p.idPersona?.primerApellido} del expediente?`
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-amber-500" />
            Partes Procesales
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Participantes en expedientes judiciales • {partes.length} registros
          </p>
        </div>
        <button
          onClick={abrirCrear}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-sm shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <Plus className="w-4 h-4" /> Nueva parte
        </button>
      </div>

      {/* Stats - Clases fijas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total partes</p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">{partes.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Registradas en el sistema</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Activas</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{activos}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">{Math.round((activos / (partes.length || 1)) * 100)}% del total</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Inactivas</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{inactivos}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserX className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Excluidas del proceso</p>
          </div>
        </div>
      </div>

      {/* Buscador + filtro estado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <SearchBar value={busqueda} onChange={handleBusquedaChange} placeholder="Buscar por persona, expediente o rol..." />
          <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-1">
            {(["TODOS", "ACTIVO", "INACTIVO"] as FiltroActivo[]).map(op => (
              <button
                key={op}
                onClick={() => handleFiltroChange(op)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filtroActivo === op
                    ? "bg-white dark:bg-slate-700 text-gray-800 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {op === "TODOS" ? "Todos" : op === "ACTIVO" ? "Activos" : "Inactivos"}
              </button>
            ))}
          </div>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {partesFiltradas.length} resultado{partesFiltradas.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla Desktop con datos paginados */}
      <div className="hidden lg:block bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700">
              <tr>
                {["Persona", "Documento", "Expediente", "Rol procesal", "Inclusión", "Exclusión", "Estado", "Acciones"].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                    </div>
                  </td>
                </tr>
              ) : paginatedPartes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                      <p>No hay partes procesales</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPartes.map(p => (
                  <tr key={p.idParte} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800 dark:text-white text-sm">
                          {nombreCompleto(p.idPersona)}
                        </span>
                        {p.idPersona?.esAbogado && <AbogadoBadge />}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-500 dark:text-gray-400 text-xs">
                      {p.idPersona?.numeroDocumento}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-blue-500 font-mono font-bold text-sm">
                        {p.idExpediente?.numeroExpediente}
                      </span>
                      <div className="text-xs text-gray-400 mt-0.5">{p.idExpediente?.ano}</div>
                    </td>
                    <td className="px-6 py-4">
                      <RolBadge rol={p.idRol?.nombreRol ?? "—"} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {fmtFecha(p.fechaInclusion)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {fmtFecha(p.fechaExclusion)}
                    </td>
                    <td className="px-6 py-4">
                      <EstadoBadge activo={p.activo} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => abrirEditar(p)}
                          disabled={saving}
                          className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleActivo(p)}
                          disabled={togglingId === p.idParte}
                          title={p.activo ? "Excluir" : "Reincorporar"}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                            p.activo
                              ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30"
                              : "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                          }`}
                        >
                          {p.activo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => eliminar(p)}
                          disabled={deletingId === p.idParte}
                          className="p-2 rounded-lg text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, partesFiltradas.length)} de {partesFiltradas.length}
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

      {/* Cards Móvil con datos paginados */}
      <div className="lg:hidden space-y-3">
        {paginatedPartes.map(p => (
          <div key={p.idParte} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-semibold text-gray-800 dark:text-white text-sm">{nombreCompleto(p.idPersona)}</p>
                <span className="text-blue-500 font-mono text-xs">#{p.idExpediente?.numeroExpediente}</span>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => abrirEditar(p)} 
                  disabled={saving}
                  className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => toggleActivo(p)} 
                  disabled={togglingId === p.idParte}
                  className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${p.activo ? "text-amber-500 hover:bg-amber-50" : "text-emerald-500 hover:bg-emerald-50"}`}
                >
                  {p.activo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => eliminar(p)} 
                  disabled={deletingId === p.idParte}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <RolBadge rol={p.idRol?.nombreRol ?? "—"} />
              <EstadoBadge activo={p.activo} />
              {p.idPersona?.esAbogado && <AbogadoBadge />}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title={editando ? "Editar parte procesal" : "Nueva parte procesal"}
          icon={<Users className="w-5 h-5 text-amber-500" />}
        >
          {!editando ? (
            <>
              {/* Expediente - Con buscador */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Expediente <span className="text-red-500">*</span>
                </label>
                {expedienteSeleccionado ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                    <span className="flex-1 text-sm text-gray-800 dark:text-white">{expedienteSeleccionado}</span>
                    <button
                      onClick={() => {
                        setForm(p => ({ ...p, idExpediente: "" }));
                        setExpedienteSeleccionado("");
                      }}
                      disabled={saving}
                      className="p-1 rounded-lg text-gray-500 hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setBuscadorExpAbierto(true)}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-amber-400 dark:hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Buscar y seleccionar expediente
                  </button>
                )}
              </div>

              {/* Persona - Con buscador */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Persona <span className="text-red-500">*</span>
                </label>
                {personaSeleccionada ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                    <span className="flex-1 text-sm text-gray-800 dark:text-white">{personaSeleccionada}</span>
                    <button
                      onClick={() => {
                        setForm(p => ({ ...p, idPersona: "" }));
                        setPersonaSeleccionada("");
                      }}
                      disabled={saving}
                      className="p-1 rounded-lg text-gray-500 hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setBuscadorPersonaAbierto(true)}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-amber-400 dark:hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Buscar y seleccionar persona
                  </button>
                )}
              </div>

              {/* Rol - Con buscador */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Rol procesal <span className="text-red-500">*</span>
                </label>
                {rolSeleccionado ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                    <span className="flex-1 text-sm text-gray-800 dark:text-white">{rolSeleccionado}</span>
                    <button
                      onClick={() => {
                        setForm(p => ({ ...p, idRol: "" }));
                        setRolSeleccionado("");
                      }}
                      disabled={saving}
                      className="p-1 rounded-lg text-gray-500 hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setBuscadorRolAbierto(true)}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-amber-400 dark:hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Buscar y seleccionar rol
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="mb-4 p-2.5 rounded-xl bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 text-sm">
                Expediente: {expedienteSeleccionado}
              </div>
              <div className="mb-4 p-2.5 rounded-xl bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 text-sm">
                Persona: {personaSeleccionada}
              </div>
              <div className="mb-4 p-2.5 rounded-xl bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 text-sm">
                Rol: {rolSeleccionado}
              </div>
              <Field
                label="Fecha de exclusión" 
                value={form.fechaExclusion}
                onChange={f("fechaExclusion")} 
                type="date"
                disabled={saving}
              />
            </>
          )}
          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)} 
            onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Agregar parte"}
            saving={saving}
          />
        </Modal>
      )}

      {/* Modales de buscadores */}
      {buscadorExpAbierto && (
        <BuscadorExpediente
          onSelect={seleccionarExpediente}
          onClose={() => setBuscadorExpAbierto(false)}
          disabled={saving}
        />
      )}
      {buscadorPersonaAbierto && (
        <BuscadorPersona
          onSelect={seleccionarPersona}
          onClose={() => setBuscadorPersonaAbierto(false)}
          disabled={saving}
        />
      )}
      {buscadorRolAbierto && (
        <BuscadorRol
          onSelect={seleccionarRol}
          onClose={() => setBuscadorRolAbierto(false)}
          disabled={saving}
        />
      )}
    </div>
  );
}