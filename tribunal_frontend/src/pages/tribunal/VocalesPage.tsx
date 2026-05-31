import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_VOCALES,
  GET_PERSONAS,
  GET_SALAS_TRIBUNAL,
  CREAR_VOCAL,
  ACTUALIZAR_VOCAL,
  ELIMINAR_VOCAL,
} from "../../graphql/tribunal";
import { Users, Plus, UserCheck, UserX, Search, X, ChevronLeft, ChevronRight, Edit, Trash2 } from "lucide-react";
import {
  VocalTribunal, Persona, SalaTribunal,
  nombreCompleto, fmtFecha,
  CargoBadge, EstadoBadge,
  Modal, Field, SelectField, ErrorBox, ModalFooter,
  StatCard, TablaDesktop, ActionBtns, SearchBar,
} from "./shared";
import { useCrudNotifications } from '../../hooks/useCrudNotifications';
import { useToast } from '../../context/ToastContext';

const initForm = { idPersona: "0", idSala: "0", cargo: "", fechaPosesion: "", idUsuario: "1" };

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
    `${p.nombre} ${p.primerApellido} ${p.numeroDocumento}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-500" />
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
              <p>No se encontraron personas</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filtrados.map((p, index) => (
                <button
                  key={p.idPersona}
                  onClick={() => {
                    onSelect(p.idPersona, `${p.nombre} ${p.primerApellido} - ${p.numeroDocumento}`);
                    onClose();
                  }}
                  disabled={disabled}
                  className={`w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed ${
                    index === filtrados.length - 1 ? 'mb-0' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{p.nombre} {p.primerApellido}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {p.numeroDocumento} {p.esAbogado && <span className="text-emerald-600 dark:text-emerald-400 ml-2">• Abogado</span>}
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

// ============================================================
// COMPONENTE: Buscador de Salas (Modal)
// ============================================================
function BuscadorSala({
  onSelect,
  onClose,
  disabled,
}: {
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
  disabled?: boolean;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, loading } = useQuery(GET_SALAS_TRIBUNAL);

  const salas: SalaTribunal[] = data?.allSalasTribunal ?? [];

  const filtrados = salas.filter(s =>
    `${s.nombreSala} ${s.idTribunal.nombreTribunal} ${s.idTribunal.instancia}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-500" />
            Seleccionar Sala
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
              placeholder="Buscar sala por nombre o tribunal..."
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
              <p>No se encontraron salas</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filtrados.map((s, index) => (
                <button
                  key={s.idSala}
                  onClick={() => {
                    onSelect(s.idSala, `${s.nombreSala} - ${s.idTribunal.nombreTribunal}`);
                    onClose();
                  }}
                  disabled={disabled}
                  className={`w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed ${
                    index === filtrados.length - 1 ? 'mb-0' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{s.nombreSala}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{s.idTribunal.nombreTribunal} - {s.idTribunal.instancia}</p>
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
// COMPONENTE PRINCIPAL
// ============================================================
export default function VocalesPage() {
  const { data: dVoc,  loading, refetch } = useQuery(GET_VOCALES);
  const { data: dPers }                   = useQuery(GET_PERSONAS);
  const { data: dSala }                   = useQuery(GET_SALAS_TRIBUNAL);
  const [crearVocal]      = useMutation(CREAR_VOCAL);
  const [actualizarVocal] = useMutation(ACTUALIZAR_VOCAL);
  const [eliminarVocal]   = useMutation(ELIMINAR_VOCAL);

  const { executeCreate, executeUpdate, executeDelete, executeToggle } = useCrudNotifications('Vocal');
  const toast = useToast();

  // ✅ Estado para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ Estado para bloqueo de botones
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [modal, setModal]           = useState(false);
  const [buscadorPersonaAbierto, setBuscadorPersonaAbierto] = useState(false);
  const [buscadorSalaAbierto, setBuscadorSalaAbierto] = useState(false);
  const [editando, setEdit]         = useState<VocalTribunal | null>(null);
  const [form, setForm]             = useState(initForm);
  const [personaSeleccionada, setPersonaSeleccionada] = useState("");
  const [salaSeleccionada, setSalaSeleccionada] = useState("");
  const [busqueda, setBusq]         = useState("");
  const [err, setErr]               = useState("");

  const vocales:  VocalTribunal[] = dVoc?.allVocales        ?? [];
  const personas: Persona[]       = dPers?.allPersonas       ?? [];
  const salas:    SalaTribunal[]  = dSala?.allSalasTribunal  ?? [];

  // ✅ Filtrar vocales por búsqueda
  const vocalesFiltrados = vocales.filter(v =>
    `${nombreCompleto(v.idPersona)} ${v.cargo} ${v.idSala?.nombreSala ?? ""} ${v.idPersona.numeroDocumento}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  // ✅ Paginación
  const totalPages = Math.ceil(vocalesFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVocales = vocalesFiltrados.slice(startIndex, startIndex + itemsPerPage);

  const activos   = vocales.filter(v => v.activo).length;
  const inactivos = vocales.filter(v => !v.activo).length;

  const p = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const abrirCrear = () => {
    setEdit(null);
    setForm(initForm);
    setPersonaSeleccionada("");
    setSalaSeleccionada("");
    setErr("");
    setModal(true);
  };

  const abrirEditar = (v: VocalTribunal) => {
    setEdit(v);
    setForm({
      idPersona:    String(v.idPersona.idPersona),
      idSala:       v.idSala ? String(v.idSala.idSala) : "0",
      cargo:        v.cargo,
      fechaPosesion: v.fechaPosesion?.slice(0, 10) ?? "",
      idUsuario:    v.usuario ? String(v.usuario.idUsuario) : "1",
    });
    setPersonaSeleccionada(nombreCompleto(v.idPersona));
    setSalaSeleccionada(v.idSala ? `${v.idSala.nombreSala} - ${v.idSala.idTribunal.nombreTribunal}` : "");
    setErr("");
    setModal(true);
  };

  const seleccionarPersona = (id: number, nombre: string) => {
    setForm(f => ({ ...f, idPersona: String(id) }));
    setPersonaSeleccionada(nombre);
  };

  const seleccionarSala = (id: number, nombre: string) => {
    setForm(f => ({ ...f, idSala: String(id) }));
    setSalaSeleccionada(nombre);
  };

  // Resetear página cuando cambia la búsqueda
  const handleBusquedaChange = (value: string) => {
    setBusq(value);
    setCurrentPage(1);
  };

  // ✅ GUARDAR CON BLOQUEO
  const guardar = async () => {
    if (form.idPersona === "0" || !form.cargo || !form.fechaPosesion) {
      toast.error("Persona, cargo y fecha de posesión son obligatorios.");
      return;
    }
    
    if (saving) return;
    setSaving(true);
    
    try {
      if (editando) {
        await executeUpdate(async () => {
          await actualizarVocal({
            variables: {
              id: Number(editando.idVocal),
              input: {
                idSala: form.idSala !== "0" ? Number(form.idSala) : null,
                cargo:  form.cargo,
              },
            },
          });
          await refetch();
          setModal(false);
          return true;
        });
      } else {
        await executeCreate(async () => {
          await crearVocal({
            variables: {
              idPersona:    Number(form.idPersona),
              cargo:        form.cargo,
              fechaPosesion: form.fechaPosesion,
              idUsuario:    Number(form.idUsuario),
              idSala:       form.idSala !== "0" ? Number(form.idSala) : undefined,
            },
          });
          await refetch();
          setModal(false);
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
  const toggleActivo = async (v: VocalTribunal) => {
    if (togglingId === v.idVocal) return;
    setTogglingId(v.idVocal);
    
    try {
      await executeToggle(
        async () => {
          await actualizarVocal({ 
            variables: { 
              id: Number(v.idVocal), 
              input: { activo: !v.activo } 
            } 
          });
          await refetch();
          return true;
        },
        !v.activo,
        {
          loading: `Cambiando estado de ${nombreCompleto(v.idPersona)}...`,
          success: (isActive: boolean) => `${nombreCompleto(v.idPersona)} ha sido ${isActive ? 'activado' : 'desactivado'}`,
          error: `Error al cambiar estado`,
        }
      );
    } finally {
      setTogglingId(null);
    }
  };

  // ✅ ELIMINAR CON BLOQUEO
  const eliminar = async (v: VocalTribunal) => {
    if (deletingId === v.idVocal) return;
    setDeletingId(v.idVocal);
    
    try {
      await executeDelete(
        async () => {
          const { data } = await eliminarVocal({ variables: { id: Number(v.idVocal) } });
          if (!data?.eliminarVocal?.ok) {
            throw new Error(data?.eliminarVocal?.mensaje ?? "No se pudo eliminar.");
          }
          await refetch();
          return true;
        },
        {
          loading: `Eliminando a ${nombreCompleto(v.idPersona)}...`,
          success: `${nombreCompleto(v.idPersona)} eliminado exitosamente`,
          error: `Error al eliminar vocal`,
        },
        `¿Eliminar al vocal ${nombreCompleto(v.idPersona)}?`
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
            <Users className="w-7 h-7 text-emerald-500" />
            Vocales
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Vocales de tribunales • {vocales.length} registros
          </p>
        </div>
        <button
          onClick={abrirCrear}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <Plus className="w-4 h-4" /> Nuevo vocal
        </button>
      </div>

      {/* Stats - Clases fijas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total vocales</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{vocales.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Registrados en el sistema</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Activos</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{activos}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">{Math.round((activos / (vocales.length || 1)) * 100)}% del total</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Inactivos</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{inactivos}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserX className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Con mandato concluido</p>
          </div>
        </div>
      </div>

      {/* Buscador de tabla */}
      <div className="flex justify-between items-center gap-4">
        <SearchBar value={busqueda} onChange={handleBusquedaChange} placeholder="Buscar por nombre, cargo o sala..." />
        <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">
          {vocalesFiltrados.length} resultado{vocalesFiltrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla con datos paginados */}
      <TablaDesktop
        headers={["Vocal", "Documento", "Cargo", "Sala asignada", "Posesión", "Estado", "Acciones"]}
        loading={loading}
        emptyMsg="No hay vocales registrados"
      >
        {paginatedVocales.map(v => (
          <tr key={v.idVocal} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td className="px-6 py-4">
              <p className="font-semibold text-sm text-gray-800 dark:text-white">
                {nombreCompleto(v.idPersona)}
              </p>
              {v.idPersona.esAbogado && (
                <p className="text-xs text-amber-500 dark:text-amber-400">Abogado</p>
              )}
            </td>
            <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400">
              {v.idPersona.numeroDocumento}
            </td>
            <td className="px-6 py-4">
              <CargoBadge cargo={v.cargo} />
            </td>
            <td className="px-6 py-4">
              {v.idSala ? (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{v.idSala.nombreSala}</p>
                  <p className="text-xs text-gray-400">{v.idSala.idTribunal.nombreTribunal}</p>
                </div>
              ) : (
                <span className="text-xs text-gray-400">Sin asignar</span>
              )}
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
              {fmtFecha(v.fechaPosesion)}
            </td>
            <td className="px-6 py-4">
              <EstadoBadge activo={v.activo} />
            </td>
            <td className="px-6 py-4">
              <ActionBtns
                onEdit={() => abrirEditar(v)}
                onDelete={() => eliminar(v)}
                disabled={saving}
                extraLabel={v.activo ? "Desactivar" : "Activar"}
                extraVariant={v.activo ? "red" : "emerald"}
                onExtra={() => toggleActivo(v)}
              />
            </td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, vocalesFiltrados.length)} de {vocalesFiltrados.length}
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
        {paginatedVocales.map(v => (
          <div key={v.idVocal} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <p className="font-semibold text-gray-800 dark:text-white text-sm">{nombreCompleto(v.idPersona)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{v.cargo}</p>
                {v.idSala && (
                  <p className="text-xs text-gray-400 mt-0.5">{v.idSala.nombreSala}</p>
                )}
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => abrirEditar(v)} 
                  disabled={saving}
                  className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => eliminar(v)} 
                  disabled={deletingId === v.idVocal}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <EstadoBadge activo={v.activo} />
              <span className="text-xs text-gray-400">{fmtFecha(v.fechaPosesion)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal CREAR/EDITAR con buscadores */}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title={editando ? "Editar vocal" : "Nuevo vocal"}
          icon={<Users className="w-5 h-5 text-emerald-500" />}
        >
          {/* Selección de Persona - Con buscador */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              Persona <span className="text-red-500">*</span>
            </label>
            {!editando ? (
              <div>
                {personaSeleccionada ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                    <span className="flex-1 text-sm text-gray-800 dark:text-white">{personaSeleccionada}</span>
                    <button
                      onClick={() => {
                        setForm(f => ({ ...f, idPersona: "0" }));
                        setPersonaSeleccionada("");
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
                    onClick={() => setBuscadorPersonaAbierto(true)}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-emerald-400 dark:hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Buscar y seleccionar persona
                  </button>
                )}
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 text-sm">
                {personaSeleccionada}
              </div>
            )}
          </div>

          <Field
            label="Cargo"
            value={form.cargo}
            onChange={p("cargo")}
            required
            placeholder="Ej: Vocal Titular"
            disabled={saving}
          />

          {/* Selección de Sala - Con buscador */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              Sala asignada
            </label>
            {salaSeleccionada ? (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
                <span className="flex-1 text-sm text-gray-800 dark:text-white">{salaSeleccionada}</span>
                <button
                  onClick={() => {
                    setForm(f => ({ ...f, idSala: "0" }));
                    setSalaSeleccionada("");
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
                onClick={() => setBuscadorSalaAbierto(true)}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-emerald-400 dark:hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Buscar y seleccionar sala
              </button>
            )}
          </div>

          {!editando && (
            <Field
              label="Fecha de posesión"
              value={form.fechaPosesion}
              onChange={p("fechaPosesion")}
              type="date"
              required
              disabled={saving}
            />
          )}

          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)}
            onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Registrar vocal"}
            saving={saving}
          />
        </Modal>
      )}

      {/* Modales de buscadores */}
      {buscadorPersonaAbierto && (
        <BuscadorPersona
          onSelect={seleccionarPersona}
          onClose={() => setBuscadorPersonaAbierto(false)}
          disabled={saving}
        />
      )}
      {buscadorSalaAbierto && (
        <BuscadorSala
          onSelect={seleccionarSala}
          onClose={() => setBuscadorSalaAbierto(false)}
          disabled={saving}
        />
      )}
    </div>
  );
}