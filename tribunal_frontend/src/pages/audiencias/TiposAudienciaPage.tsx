import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_TIPOS_AUDIENCIA,
  GET_TIPOS_PROCESO_SIMPLE,
  CREAR_TIPO_AUDIENCIA,
  ELIMINAR_TIPO_AUDIENCIA,
} from "../../graphql/audiencias";
import { ClipboardList, Plus, Trash2, Clock, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  TipoAudiencia,
  Modal, Field, SelectField, TextareaField,
  ErrorBox, ModalFooter, StatCard, TablaDesktop,
} from "../../shared/ui";
import { useCrudNotifications } from '../../hooks/useCrudNotifications';
import { useToast } from '../../context/ToastContext';

// ============================================================
// COMPONENTE: Buscador de Tipos de Proceso (Modal)
// ============================================================
function BuscadorTipoProceso({
  onSelect,
  onClose,
  disabled,
}: {
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
  disabled?: boolean;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, loading } = useQuery(GET_TIPOS_PROCESO_SIMPLE);

  const tiposProceso = data?.allTiposProceso ?? [];

  const filtrados = tiposProceso.filter((tp: any) =>
    tp.nombre.toLowerCase().includes(busqueda.toLowerCase())
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
              placeholder="Buscar tipo de proceso por nombre..."
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
              {filtrados.map((tp: any, index: number) => (
                <button
                  key={tp.idTipoProceso}
                  onClick={() => {
                    onSelect(tp.idTipoProceso, tp.nombre);
                    onClose();
                  }}
                  disabled={disabled}
                  className={`w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${
                    index === filtrados.length - 1 ? 'mb-0' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{tp.nombre}</p>
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
export default function TiposAudienciaPage() {
  const { data, loading, refetch } = useQuery(GET_TIPOS_AUDIENCIA);
  const { data: dTipoProc } = useQuery(GET_TIPOS_PROCESO_SIMPLE);
  const [crearTipo]    = useMutation(CREAR_TIPO_AUDIENCIA);
  const [eliminarTipo] = useMutation(ELIMINAR_TIPO_AUDIENCIA);

  const { executeCreate, executeDelete } = useCrudNotifications('Tipo de Audiencia');
  const toast = useToast();

  const [modal, setModal] = useState(false);
  const [buscadorTipoProcAbierto, setBuscadorTipoProcAbierto] = useState(false);
  const [tipoProcesoSeleccionado, setTipoProcesoSeleccionado] = useState("");
  const [err, setErr]     = useState("");
  
  // ✅ Estado para búsqueda en la página principal
  const [busqueda, setBusqueda] = useState("");
  
  // ✅ Estado para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // ✅ Estado para bloqueo de botones
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({ 
    nombre: "", 
    duracionEstimada: "", 
    idTipoProceso: 0, 
    descripcion: "" 
  });
  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const tipos: TipoAudiencia[] = data?.allTiposAudiencia ?? [];
  const tiposProceso           = dTipoProc?.allTiposProceso ?? [];

  // ✅ Filtrar tipos por búsqueda
  const tiposFiltrados = tipos.filter(t =>
    `${t.nombre} ${t.idTipoProceso.nombre} ${t.duracionEstimada}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  // ✅ Paginación
  const totalPages = Math.ceil(tiposFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTipos = tiposFiltrados.slice(startIndex, startIndex + itemsPerPage);

  const seleccionarTipoProceso = (id: number, nombre: string) => {
    setForm(f => ({ ...f, idTipoProceso: id }));
    setTipoProcesoSeleccionado(nombre);
  };

  const abrirModal = () => {
    setErr("");
    setTipoProcesoSeleccionado("");
    setForm({ nombre: "", duracionEstimada: "", idTipoProceso: 0, descripcion: "" });
    setModal(true);
  };

  // ✅ GUARDAR CON BLOQUEO
  const guardar = async () => {
    if (!form.nombre || !form.duracionEstimada || !form.idTipoProceso) {
      toast.error("Nombre, duración y tipo de proceso son obligatorios.");
      return;
    }
    
    if (saving) return;
    setSaving(true);
    
    try {
      await executeCreate(async () => {
        await crearTipo({
          variables: {
            nombre: form.nombre,
            duracionEstimada: Number(form.duracionEstimada),
            idTipoProceso: Number(form.idTipoProceso),
            descripcion: form.descripcion || undefined,
          },
        });
        await refetch();
        setModal(false);
        setForm({ nombre: "", duracionEstimada: "", idTipoProceso: 0, descripcion: "" });
        setTipoProcesoSeleccionado("");
        return true;
      });
    } finally {
      setSaving(false);
    }
  };

  // ✅ ELIMINAR CON BLOQUEO
  const eliminar = async (t: TipoAudiencia) => {
    await executeDelete(
      async () => {
        const { data } = await eliminarTipo({ variables: { id: Number(t.idTipoAudiencia) } });
        if (!data?.eliminarTipoAudiencia?.ok) {
          throw new Error(data?.eliminarTipoAudiencia?.mensaje ?? "No se pudo eliminar.");
        }
        await refetch();
        return true;
      },
      {
        loading: `Eliminando tipo "${t.nombre}"...`,
        success: `Tipo "${t.nombre}" eliminado exitosamente`,
        error: `Error al eliminar el tipo "${t.nombre}"`,
      },
      `¿Eliminar el tipo de audiencia "${t.nombre}"?`
    );
  };

  // Resetear página cuando cambia la búsqueda
  const handleBusquedaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusqueda(e.target.value);
    setCurrentPage(1);
  };

  // Duración promedio
  const duracionPromedio = tipos.length 
    ? `${Math.round(tipos.reduce((s, t) => s + t.duracionEstimada, 0) / tipos.length)} min`
    : "—";

  const tiposProcesoUnicos = new Set(tipos.map(t => t.idTipoProceso.idTipoProceso)).size;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-blue-500" />
            Tipos de Audiencia
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configuración de tipos de audiencia • {tipos.length} registros
          </p>
        </div>
        <button
          onClick={abrirModal}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <Plus className="w-4 h-4" /> Nuevo tipo
        </button>
      </div>

      {/* Stats - Clases fijas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total tipos</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{tipos.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ClipboardList className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Tipos de audiencia registrados</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duración promedio</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{duracionPromedio}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Promedio de duración estimada</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipos de proceso</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{tiposProcesoUnicos}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ClipboardList className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Procesos cubiertos</p>
          </div>
        </div>
      </div>

      {/* ✅ BUSCADOR EN LA PÁGINA PRINCIPAL */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          placeholder="Buscar por nombre, tipo de proceso o duración..."
          value={busqueda}
          onChange={handleBusquedaChange}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
        />
      </div>

      {/* Tabla Desktop con datos paginados */}
      <TablaDesktop
        headers={["Nombre", "Duración", "Tipo de proceso", "Descripción", "Acciones"]}
        loading={loading}
        emptyMsg="No hay tipos de audiencia"
        emptyIcon={<ClipboardList className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
      >
        {paginatedTipos.map(t => (
          <tr key={t.idTipoAudiencia} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td className="px-6 py-4 font-semibold text-gray-800 dark:text-white">{t.nombre}</td>
            <td className="px-6 py-4">
              <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                <Clock className="w-3.5 h-3.5 text-gray-400" /> {t.duracionEstimada} min
              </span>
            </td>
            <td className="px-6 py-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                {t.idTipoProceso.nombre}
              </span>
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{t.descripcion ?? "—"}</td>
            <td className="px-6 py-4">
              <button
                onClick={() => eliminar(t)}
                disabled={saving}
                className="p-2 rounded-lg text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Cards Móvil con datos paginados */}
      <div className="lg:hidden space-y-3">
        {paginatedTipos.map(t => (
          <div key={t.idTipoAudiencia} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-gray-800 dark:text-white">{t.nombre}</p>
                <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {t.duracionEstimada} min
                </p>
              </div>
              <button
                onClick={() => eliminar(t)}
                disabled={saving}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                {t.idTipoProceso.nombre}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, tiposFiltrados.length)} de {tiposFiltrados.length}
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
          title="Nuevo tipo de audiencia" 
          icon={<ClipboardList className="w-5 h-5 text-blue-500" />}
        >
          <Field 
            label="Nombre" 
            value={form.nombre} 
            onChange={f("nombre")} 
            required 
            disabled={saving}
          />
          
          <Field 
            label="Duración estimada (minutos)" 
            value={form.duracionEstimada} 
            onChange={f("duracionEstimada")} 
            type="number" 
            required 
            disabled={saving}
          />

          {/* Tipo de Proceso - Con buscador */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              Tipo de proceso <span className="text-red-500">*</span>
            </label>
            {tipoProcesoSeleccionado ? (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                <span className="flex-1 text-sm text-gray-800 dark:text-white">{tipoProcesoSeleccionado}</span>
                <button
                  onClick={() => {
                    setForm(f => ({ ...f, idTipoProceso: 0 }));
                    setTipoProcesoSeleccionado("");
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
                onClick={() => setBuscadorTipoProcAbierto(true)}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Buscar y seleccionar tipo de proceso
              </button>
            )}
          </div>

          <TextareaField 
            label="Descripción" 
            value={form.descripcion} 
            onChange={f("descripcion")} 
            disabled={saving}
          />
          
          <ErrorBox msg={err} />
          <ModalFooter 
            onCancel={() => setModal(false)} 
            onSave={guardar} 
            saveLabel="Crear tipo"
            saving={saving}
          />
        </Modal>
      )}

      {/* Modal del buscador */}
      {buscadorTipoProcAbierto && (
        <BuscadorTipoProceso
          onSelect={seleccionarTipoProceso}
          onClose={() => setBuscadorTipoProcAbierto(false)}
          disabled={saving}
        />
      )}
    </div>
  );
}