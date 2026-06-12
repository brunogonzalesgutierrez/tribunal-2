import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_SALAS_AUDIENCIA,
  GET_TRIBUNALES_SIMPLE,
  CREAR_SALA_AUDIENCIA,
  ACTUALIZAR_SALA_AUDIENCIA,
  ELIMINAR_SALA_AUDIENCIA,
} from "../../graphql/audiencias";
import { DoorOpen, Plus, Edit, Trash2, CheckCircle, Circle, Video, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  SalaAudiencia,
  Modal, Field, SelectField,
  ErrorBox, ModalFooter, StatCard, TablaDesktop, ActionBtns,
} from "../../shared/ui";
import { useCrudNotifications } from '../../hooks/useCrudNotifications';
import { useToast } from '../../context/ToastContext';

// ============================================================
// COMPONENTE: Buscador de Tribunales (Modal)
// ============================================================
function BuscadorTribunal({
  onSelect,
  onClose,
  disabled,
}: {
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
  disabled?: boolean;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, loading } = useQuery(GET_TRIBUNALES_SIMPLE);

  const tribunales = data?.allTribunales ?? [];

  const filtrados = tribunales.filter((t: any) =>
    t.nombreTribunal.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-500" />
            Seleccionar Tribunal
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
              placeholder="Buscar tribunal por nombre..."
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
              <p>No se encontraron tribunales</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filtrados.map((t: any, index: number) => (
                <button
                  key={t.idTribunal}
                  onClick={() => {
                    onSelect(t.idTribunal, t.nombreTribunal);
                    onClose();
                  }}
                  disabled={disabled}
                  className={`w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${
                    index === filtrados.length - 1 ? 'mb-0' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{t.nombreTribunal}</p>
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

// ════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════
export default function SalasAudienciaPage() {
  const { data, loading, refetch } = useQuery(GET_SALAS_AUDIENCIA);
  const { data: dTrib }            = useQuery(GET_TRIBUNALES_SIMPLE);
  const [crearSala]      = useMutation(CREAR_SALA_AUDIENCIA);
  const [actualizarSala] = useMutation(ACTUALIZAR_SALA_AUDIENCIA);
  const [eliminarSala]   = useMutation(ELIMINAR_SALA_AUDIENCIA);

  const { executeCreate, executeUpdate, executeDelete } = useCrudNotifications('Sala de Audiencia');
  const toast = useToast();

  const [modal, setModal]   = useState(false);
  const [buscadorTribunalAbierto, setBuscadorTribunalAbierto] = useState(false);
  const [tribunalSeleccionado, setTribunalSeleccionado] = useState("");
  const [editando, setEdit] = useState<SalaAudiencia | null>(null);
  const [err, setErr]       = useState("");

  // ✅ Estado para búsqueda en la página principal
  const [busqueda, setBusqueda] = useState("");
  
  // ✅ Estado para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // ✅ Estado para bloqueo de botones
  const [saving, setSaving] = useState(false);

  const initForm = {
    idTribunal: 0, nombreSala: "", capacidad: "",
    equipadaVideoconf: false, enlaceVirtual: "", activa: true,
  };
  const [form, setForm] = useState(initForm);
  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const salas: SalaAudiencia[] = data?.allSalasAudiencia ?? [];
  const tribunales              = dTrib?.allTribunales ?? [];

  // ✅ Filtrar salas por búsqueda
  const salasFiltradas = salas.filter(s =>
    `${s.nombreSala} ${s.idTribunal.nombreTribunal} ${s.capacidad}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  // ✅ Paginación
  const totalPages = Math.ceil(salasFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSalas = salasFiltradas.slice(startIndex, startIndex + itemsPerPage);

  const activas   = salas.filter(s => s.activa).length;
  const videoconf = salas.filter(s => s.equipadaVideoconf).length;

  const seleccionarTribunal = (id: number, nombre: string) => {
    setForm(f => ({ ...f, idTribunal: id }));
    setTribunalSeleccionado(nombre);
  };

  const abrirCrear = () => { 
    setEdit(null); 
    setForm(initForm); 
    setTribunalSeleccionado("");
    setErr(""); 
    setModal(true); 
  };

  const abrirEditar = (s: SalaAudiencia) => {
    setEdit(s);
    setForm({
      idTribunal: s.idTribunal.idTribunal, nombreSala: s.nombreSala,
      capacidad: String(s.capacidad), equipadaVideoconf: s.equipadaVideoconf,
      enlaceVirtual: s.enlaceVirtual ?? "", activa: s.activa,
    });
    setTribunalSeleccionado(s.idTribunal.nombreTribunal);
    setErr(""); 
    setModal(true);
  };

  // ✅ GUARDAR CON BLOQUEO
  const guardar = async () => {
    if (!form.nombreSala || !form.capacidad) { 
      toast.error("Nombre y capacidad son obligatorios."); 
      return; 
    }
    
    if (saving) return;
    setSaving(true);
    
    try {
      if (editando) {
        await executeUpdate(async () => {
          await actualizarSala({
            variables: {
              id: Number(editando.idSalaAud),
              input: {
                nombreSala: form.nombreSala, 
                capacidad: Number(form.capacidad),
                equipadaVideoconf: form.equipadaVideoconf,
                enlaceVirtual: form.enlaceVirtual || undefined, 
                activa: form.activa,
              },
            },
          });
          await refetch();
          setModal(false);
          return true;
        });
      } else {
        if (!form.idTribunal) { 
          toast.error("El tribunal es obligatorio."); 
          return; 
        }
        await executeCreate(async () => {
          await crearSala({
            variables: {
              idTribunal: Number(form.idTribunal), 
              nombreSala: form.nombreSala,
              capacidad: Number(form.capacidad), 
              equipadaVideoconf: form.equipadaVideoconf,
              enlaceVirtual: form.enlaceVirtual || undefined, 
              activa: form.activa,
            },
          });
          await refetch();
          setModal(false);
          setTribunalSeleccionado("");
          return true;
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // ✅ ELIMINAR CON BLOQUEO
  const eliminar = async (s: SalaAudiencia) => {
    await executeDelete(
      async () => {
        const { data } = await eliminarSala({ variables: { id: Number(s.idSalaAud) } });
        if (!data?.eliminarSalaAudiencia?.ok) {
          throw new Error(data?.eliminarSalaAudiencia?.mensaje ?? "No se pudo eliminar.");
        }
        await refetch();
        return true;
      },
      {
        loading: `Eliminando sala "${s.nombreSala}"...`,
        success: `Sala "${s.nombreSala}" eliminada exitosamente`,
        error: `Error al eliminar la sala "${s.nombreSala}"`,
      },
      `¿Eliminar la sala "${s.nombreSala}"?`
    );
  };

  // Resetear página cuando cambia la búsqueda
  const handleBusquedaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusqueda(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <DoorOpen className="w-7 h-7 text-blue-500" />
            Salas de Audiencia
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestión de salas judiciales • {salas.length} registradas
          </p>
        </div>
        <button
          onClick={abrirCrear}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <Plus className="w-4 h-4" /> Nueva sala
        </button>
      </div>

      {/* Stats - Clases fijas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total salas</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{salas.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DoorOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Registradas en el sistema</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Salas activas</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{activas}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">{salas.length - activas} inactiva{salas.length - activas !== 1 ? "s" : ""}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Con videoconf.</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{videoconf}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Video className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Equipadas para sesiones remotas</p>
          </div>
        </div>
      </div>

      {/* ✅ BUSCADOR EN LA PÁGINA PRINCIPAL */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          placeholder="Buscar por nombre, tribunal o capacidad..."
          value={busqueda}
          onChange={handleBusquedaChange}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
        />
      </div>

      {/* Tabla Desktop con datos paginados */}
      <TablaDesktop
        headers={["Nombre", "Tribunal", "Capacidad", "Videoconf.", "Enlace virtual", "Estado", "Acciones"]}
        loading={loading}
        emptyMsg="No hay salas de audiencia"
        emptyIcon={<DoorOpen className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
      >
        {paginatedSalas.map(s => (
          <tr key={s.idSalaAud} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td className="px-6 py-4 font-semibold text-gray-800 dark:text-white">{s.nombreSala}</td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{s.idTribunal.nombreTribunal}</td>
            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">{s.capacidad} personas</td>
            <td className="px-6 py-4">
              <span className={`text-sm font-medium ${s.equipadaVideoconf ? "text-purple-600 dark:text-purple-400" : "text-gray-400"}`}>
                {s.equipadaVideoconf ? "✓ Sí" : "✗ No"}
              </span>
            </td>
            <td className="px-6 py-4">
              {s.enlaceVirtual ? (
                <a href={s.enlaceVirtual} target="_blank" rel="noreferrer"
                  className="text-blue-500 text-xs flex items-center gap-1 hover:underline">
                  <Video className="w-3.5 h-3.5" /> Enlace
                </a>
              ) : <span className="text-gray-400 text-sm">—</span>}
            </td>
            <td className="px-6 py-4">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                s.activa
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
              }`}>
                {s.activa ? <CheckCircle className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                {s.activa ? "Activa" : "Inactiva"}
              </span>
            </td>
            <td className="px-6 py-4">
              <ActionBtns onEdit={() => abrirEditar(s)} onDelete={() => eliminar(s)} disabled={saving} />
            </td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Cards Móvil con datos paginados */}
      <div className="lg:hidden space-y-3">
        {paginatedSalas.map(s => (
          <div key={s.idSalaAud} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-semibold text-gray-800 dark:text-white">{s.nombreSala}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.idTribunal.nombreTribunal}</p>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => abrirEditar(s)} 
                  disabled={saving}
                  className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => eliminar(s)} 
                  disabled={saving}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${s.equipadaVideoconf ? "text-purple-600 dark:text-purple-400" : "text-gray-400"}`}>
                {s.equipadaVideoconf ? "📹 Videoconf." : "Sin videoconf."}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                s.activa
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
              }`}>
                {s.activa ? "Activa" : "Inactiva"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, salasFiltradas.length)} de {salasFiltradas.length}
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

      {/* Modal */}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title={editando ? "Editar sala" : "Nueva sala de audiencia"}
          icon={<DoorOpen className="w-5 h-5 text-blue-500" />}
        >
          {/* Tribunal - Con buscador (solo en creación) */}
          {!editando && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Tribunal <span className="text-red-500">*</span>
              </label>
              {tribunalSeleccionado ? (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                  <span className="flex-1 text-sm text-gray-800 dark:text-white">{tribunalSeleccionado}</span>
                  <button
                    onClick={() => {
                      setForm(f => ({ ...f, idTribunal: 0 }));
                      setTribunalSeleccionado("");
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
                  onClick={() => setBuscadorTribunalAbierto(true)}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Buscar y seleccionar tribunal
                </button>
              )}
            </div>
          )}

          {/* En edición, mostrar el tribunal como texto */}
          {editando && (
            <div className="mb-4 p-2.5 rounded-xl bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 text-sm">
              Tribunal: {tribunalSeleccionado}
            </div>
          )}

          <Field 
            label="Nombre de la sala" 
            value={form.nombreSala} 
            onChange={f("nombreSala")} 
            required 
            disabled={saving}
          />
          <Field 
            label="Capacidad (personas)" 
            value={form.capacidad} 
            onChange={f("capacidad")} 
            type="number" 
            required 
            disabled={saving}
          />
          <Field 
            label="Enlace virtual" 
            value={form.enlaceVirtual} 
            onChange={f("enlaceVirtual")} 
            placeholder="https://..." 
            disabled={saving}
          />
          
          <div className="mb-4 flex gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
              <input 
                type="checkbox" 
                checked={form.equipadaVideoconf}
                onChange={e => setForm(p => ({ ...p, equipadaVideoconf: e.target.checked }))} 
                disabled={saving}
                className="rounded disabled:opacity-50 disabled:cursor-not-allowed" 
              />
              Equipada para videoconferencia
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
              <input 
                type="checkbox" 
                checked={form.activa}
                onChange={e => setForm(p => ({ ...p, activa: e.target.checked }))} 
                disabled={saving}
                className="rounded disabled:opacity-50 disabled:cursor-not-allowed" 
              />
              Activa
            </label>
          </div>

          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)} 
            onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Crear sala"}
            saving={saving}
          />
        </Modal>
      )}

      {/* Modal del buscador */}
      {buscadorTribunalAbierto && (
        <BuscadorTribunal
          onSelect={seleccionarTribunal}
          onClose={() => setBuscadorTribunalAbierto(false)}
          disabled={saving}
        />
      )}
    </div>
  );
}