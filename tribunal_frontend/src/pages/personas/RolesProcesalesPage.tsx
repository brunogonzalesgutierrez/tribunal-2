import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_ROLES_PROCESAL,
  CREAR_ROL_PROCESAL,
  ACTUALIZAR_ROL_PROCESAL,
  ELIMINAR_ROL_PROCESAL,
} from "../../graphql/personas";
import { Shield, Plus, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import {
  RolProcesal,
  RolBadge,
  Modal, Field, ErrorBox, ModalFooter,
  StatCard, TablaDesktop, ActionBtns, SearchBar,
} from "./shared";
import { useCrudNotifications } from '../../hooks/useCrudNotifications';
import { useToast } from '../../context/ToastContext';

export default function RolesProcesalesPage() {
  const { data, loading, refetch } = useQuery(GET_ROLES_PROCESAL);
  const [crearRolProcesal]      = useMutation(CREAR_ROL_PROCESAL);
  const [actualizarRolProcesal] = useMutation(ACTUALIZAR_ROL_PROCESAL);
  const [eliminarRolProcesal]   = useMutation(ELIMINAR_ROL_PROCESAL);

  const { executeCreate, executeUpdate, executeDelete } = useCrudNotifications('Rol Procesal');
  const toast = useToast();

  // ✅ Estado para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ Estado para bloqueo de botones
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [modal, setModal]    = useState(false);
  const [editando, setEdit]  = useState<RolProcesal | null>(null);
  const [nombreRol, setNombre] = useState("");
  const [busqueda, setBusq]  = useState("");
  const [err, setErr]        = useState("");

  const roles: RolProcesal[] = data?.allRolesProcesal ?? [];
  
  // ✅ Filtrar roles por búsqueda
  const rolesFiltrados = roles.filter(r =>
    r.nombreRol.toLowerCase().includes(busqueda.toLowerCase())
  );

  // ✅ Paginación
  const totalPages = Math.ceil(rolesFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRoles = rolesFiltrados.slice(startIndex, startIndex + itemsPerPage);

  const abrirCrear = () => { 
    setEdit(null); 
    setNombre(""); 
    setErr(""); 
    setModal(true); 
  };

  const abrirEditar = (r: RolProcesal) => { 
    setEdit(r); 
    setNombre(r.nombreRol); 
    setErr(""); 
    setModal(true); 
  };

  // Resetear página cuando cambia la búsqueda
  const handleBusquedaChange = (value: string) => {
    setBusq(value);
    setCurrentPage(1);
  };

  // ✅ GUARDAR CON BLOQUEO
  const guardar = async () => {
    if (!nombreRol.trim()) { 
      toast.error("El nombre del rol es obligatorio."); 
      return; 
    }
    
    if (saving) return;
    setSaving(true);
    
    try {
      if (editando) {
        await executeUpdate(async () => {
          await actualizarRolProcesal({ 
            variables: { 
              id: Number(editando.idRol), 
              input: { nombreRol } 
            } 
          });
          await refetch();
          setModal(false);
          return true;
        });
      } else {
        await executeCreate(async () => {
          await crearRolProcesal({ variables: { nombreRol } });
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
  const eliminar = async (r: RolProcesal) => {
    if (deletingId === r.idRol) return;
    setDeletingId(r.idRol);
    
    try {
      await executeDelete(
        async () => {
          const { data } = await eliminarRolProcesal({ variables: { id: Number(r.idRol) } });
          if (!data?.eliminarRolProcesal?.ok) {
            throw new Error(data?.eliminarRolProcesal?.mensaje ?? "No se pudo eliminar.");
          }
          await refetch();
          return true;
        },
        {
          loading: `Eliminando rol "${r.nombreRol}"...`,
          success: `Rol "${r.nombreRol}" eliminado exitosamente`,
          error: `Error al eliminar el rol "${r.nombreRol}"`,
        },
        `¿Eliminar el rol "${r.nombreRol}"?`
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
            <Shield className="w-7 h-7 text-purple-500" />
            Roles Procesales
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Roles de partes en procesos judiciales • {roles.length} roles registrados
          </p>
        </div>
        <button
          onClick={abrirCrear}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <Plus className="w-4 h-4" /> Nuevo rol
        </button>
      </div>

      {/* Stats - Clases fijas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total roles</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{roles.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Roles procesales definidos</p>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="flex justify-between items-center">
        <SearchBar value={busqueda} onChange={handleBusquedaChange} placeholder="Buscar rol procesal..." />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {rolesFiltrados.length} resultado{rolesFiltrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla Desktop con datos paginados */}
      <TablaDesktop
        headers={["ID", "Nombre del rol", "Acciones"]}
        loading={loading}
        emptyMsg="No hay roles procesales"
        emptyIcon={<Shield className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
      >
        {paginatedRoles.map(r => (
          <tr key={r.idRol} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td className="px-6 py-4">
              <span className="font-mono text-gray-400 text-xs">#{r.idRol}</span>
            </td>
            <td className="px-6 py-4">
              <RolBadge rol={r.nombreRol} />
            </td>
            <td className="px-6 py-4">
              <ActionBtns onEdit={() => abrirEditar(r)} onDelete={() => eliminar(r)} disabled={saving} />
            </td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, rolesFiltrados.length)} de {rolesFiltrados.length}
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
        {paginatedRoles.map(r => (
          <div key={r.idRol} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="font-mono text-gray-400 text-xs">#{r.idRol}</span>
                <RolBadge rol={r.nombreRol} />
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => abrirEditar(r)} 
                  disabled={saving}
                  className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => eliminar(r)} 
                  disabled={deletingId === r.idRol}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title={editando ? "Editar rol procesal" : "Nuevo rol procesal"}
          icon={<Shield className="w-5 h-5 text-purple-500" />}
        >
          <Field
            label="Nombre del rol" 
            value={nombreRol} 
            onChange={setNombre} 
            required
            placeholder="ej: Demandante, Demandado, Abogado defensor..."
            disabled={saving}
          />
          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)} 
            onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Crear rol"}
            saving={saving}
          />
        </Modal>
      )}
    </div>
  );
}