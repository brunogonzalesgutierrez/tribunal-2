import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_TRIBUNALES,
  GET_SALAS_TRIBUNAL,
  CREAR_TRIBUNAL,
  ACTUALIZAR_TRIBUNAL,
  ELIMINAR_TRIBUNAL,
} from "../../graphql/tribunal";
import { Building2, Plus, ChevronLeft, ChevronRight, Search, Edit, Trash2 } from "lucide-react";
import {
  Tribunal, SalaTribunal,
  InstanciaBadge,
  Modal, Field, TextAreaField, ErrorBox, ModalFooter,
  StatCard, TablaDesktop, ActionBtns, SearchBar,
} from "./shared";
import { useCrudNotifications } from '../../hooks/useCrudNotifications';
import { useToast } from '../../context/ToastContext';

const initForm = { nombreTribunal: "", instancia: "", normaCreacion: "" };

export default function TribunalesPage() {
  const { data: dTrib, loading, refetch } = useQuery(GET_TRIBUNALES);
  const { data: dSala }                   = useQuery(GET_SALAS_TRIBUNAL);
  const [crearTribunal]  = useMutation(CREAR_TRIBUNAL);
  const [actualizarTrib] = useMutation(ACTUALIZAR_TRIBUNAL);
  const [eliminarTrib]   = useMutation(ELIMINAR_TRIBUNAL);

  const { executeCreate, executeUpdate, executeDelete } = useCrudNotifications('Tribunal');
  const toast = useToast();

  // ✅ Estado para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ Estado para bloqueo de botones
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ✅ Estado para búsqueda
  const [busqueda, setBusqueda] = useState("");

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<Tribunal | null>(null);
  const [form, setForm]     = useState(initForm);
  const [err, setErr]       = useState("");

  const tribunales: Tribunal[]     = dTrib?.allTribunales   ?? [];
  const salas:      SalaTribunal[] = dSala?.allSalasTribunal ?? [];

  // ✅ Filtrar tribunales por búsqueda
  const tribunalesFiltrados = tribunales.filter(t =>
    `${t.nombreTribunal} ${t.instancia} ${t.normaCreacion}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  // ✅ Paginación
  const totalPages = Math.ceil(tribunalesFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTribunales = tribunalesFiltrados.slice(startIndex, startIndex + itemsPerPage);

  const p = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const abrirCrear = () => { 
    setEdit(null); 
    setForm(initForm); 
    setErr(""); 
    setModal(true); 
  };
  
  const abrirEditar = (t: Tribunal) => {
    setEdit(t);
    setForm({ 
      nombreTribunal: t.nombreTribunal, 
      instancia: t.instancia, 
      normaCreacion: t.normaCreacion 
    });
    setErr(""); 
    setModal(true);
  };

  // Resetear página cuando cambia la búsqueda
  const handleBusquedaChange = (value: string) => {
    setBusqueda(value);
    setCurrentPage(1);
  };

  // ✅ GUARDAR CON BLOQUEO
  const guardar = async () => {
    if (!form.nombreTribunal || !form.instancia || !form.normaCreacion) {
      toast.error("Todos los campos son obligatorios.");
      return;
    }
    
    if (saving) return;
    setSaving(true);
    
    try {
      if (editando) {
        await executeUpdate(async () => {
          await actualizarTrib({ 
            variables: { 
              id: Number(editando.idTribunal), 
              ...form 
            } 
          });
          await refetch();
          setModal(false);
          return true;
        });
      } else {
        await executeCreate(async () => {
          await crearTribunal({ variables: form });
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

  // ✅ ELIMINAR CON BLOQUEO
  const eliminar = async (t: Tribunal) => {
    if (deletingId === t.idTribunal) return;
    setDeletingId(t.idTribunal);
    
    try {
      await executeDelete(
        async () => {
          const { data } = await eliminarTrib({ variables: { id: Number(t.idTribunal) } });
          if (!data?.eliminarTribunal?.ok) {
            throw new Error(data?.eliminarTribunal?.mensaje ?? "No se pudo eliminar.");
          }
          await refetch();
          return true;
        },
        {
          loading: `Eliminando tribunal ${t.nombreTribunal}...`,
          success: `Tribunal ${t.nombreTribunal} eliminado exitosamente`,
          error: `Error al eliminar el tribunal`,
        },
        `¿Eliminar "${t.nombreTribunal}"? Se eliminarán todas sus salas.`
      );
    } finally {
      setDeletingId(null);
    }
  };

  const salasPorTribunal = (idTribunal: number) =>
    salas.filter(s => s.idTribunal.idTribunal === idTribunal).length;

  const totalSalas  = salas.length;
  const instancias  = [...new Set(tribunales.map(t => t.instancia))].length;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Building2 className="w-7 h-7 text-blue-500" />
            Tribunales
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Registro de tribunales judiciales • {tribunales.length} registros
          </p>
        </div>
        <button
          onClick={abrirCrear}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <Plus className="w-4 h-4" /> Nuevo tribunal
        </button>
      </div>

      {/* Stats - Clases fijas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total tribunales</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{tribunales.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Registrados en el sistema</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total salas</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{totalSalas}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Salas activas e inactivas</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Instancias</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{instancias}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Instancias distintas</p>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="Buscar por nombre, instancia o norma de creación..."
            value={busqueda}
            onChange={e => handleBusquedaChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
          />
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">
          {tribunalesFiltrados.length} resultado{tribunalesFiltrados.length !== 1 ? "s" : ""}
        </span>
      </div>
      {/* Tabla Desktop con datos paginados */}
      <TablaDesktop
        headers={["Nombre del tribunal", "Instancia", "Norma de creación", "Salas", "Acciones"]}
        loading={loading}
        emptyMsg="No hay tribunales registrados"
      >
        {paginatedTribunales.map(t => {
          const nSalas = salasPorTribunal(t.idTribunal);
          return (
            <tr key={t.idTribunal} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
              <td className="px-6 py-4 font-semibold text-gray-800 dark:text-white text-sm">
                {t.nombreTribunal}
              </td>
              <td className="px-6 py-4">
                <InstanciaBadge instancia={t.instancia} />
              </td>
              <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
                {t.normaCreacion}
              </td>
              <td className="px-6 py-4">
                <span className="font-bold text-purple-600 dark:text-purple-400">{nSalas}</span>
                <span className="text-xs text-gray-400 ml-1">sala{nSalas !== 1 ? "s" : ""}</span>
              </td>
              <td className="px-6 py-4">
                <ActionBtns onEdit={() => abrirEditar(t)} onDelete={() => eliminar(t)} disabled={saving} />
              </td>
            </tr>
          );
        })}
      </TablaDesktop>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, tribunalesFiltrados.length)} de {tribunalesFiltrados.length}
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
        {paginatedTribunales.map(t => {
          const nSalas = salasPorTribunal(t.idTribunal);
          return (
            <div key={t.idTribunal} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 dark:text-white">{t.nombreTribunal}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    <InstanciaBadge instancia={t.instancia} />
                  </p>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{t.normaCreacion}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button 
                    onClick={() => abrirEditar(t)} 
                    disabled={saving}
                    className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => eliminar(t)} 
                    disabled={deletingId === t.idTribunal}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                <span className="font-bold text-purple-600 dark:text-purple-400">{nSalas}</span>
                <span className="text-xs text-gray-400">sala{nSalas !== 1 ? "s" : ""}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title={editando ? "Editar tribunal" : "Nuevo tribunal"}
          icon={<Building2 className="w-5 h-5 text-blue-500" />}
        >
          <Field
            label="Nombre del tribunal"
            value={form.nombreTribunal}
            onChange={p("nombreTribunal")}
            required
            placeholder="Ej: Tribunal Disciplinario Universitario"
            disabled={saving}
          />
          <Field
            label="Instancia"
            value={form.instancia}
            onChange={p("instancia")}
            required
            placeholder="Ej: Primera instancia"
            disabled={saving}
          />
          <TextAreaField
            label="Norma de creación"
            value={form.normaCreacion}
            onChange={p("normaCreacion")}
            required
            placeholder="Ej: Resolución HCU N° 001/2020"
            disabled={saving}
          />
          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)}
            onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Crear tribunal"}
            saving={saving}
          />
        </Modal>
      )}
    </div>
  );
}