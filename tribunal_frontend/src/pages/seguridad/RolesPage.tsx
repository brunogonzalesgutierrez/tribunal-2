import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useCrudNotifications } from '../../hooks/useCrudNotifications';
import {
  GET_ROLES,
  GET_PERMISOS,
  CREAR_ROL,
  ACTUALIZAR_ROL,
  ELIMINAR_ROL,
  ASIGNAR_PERMISO_ROL,
  REMOVER_PERMISO_ROL,
} from "../../graphql/usuarios/queries";
import { GET_SALAS_TRIBUNAL } from "../../graphql/expediente";
import { 
  Shield, Plus, Search, Edit, Trash2, Key, 
  X, CheckCircle, Circle, ChevronLeft, ChevronRight,
  Users, Lock, Eye, Building2
} from "lucide-react";

// ─── TIPOS ───────────────────────────────────────────────
interface Permiso { idPermiso: number; nombre: string; codigo: string; modulo: string; }
interface RolPermiso { idRolPermiso: number; permiso: Permiso; }
interface SalaAsignada {
  idSala: number;
  nombreSala: string;
  idTribunal?: {
    idTribunal: number;
    nombreTribunal: string;
  };
}
interface Rol {
  idRol: number; nombre: string; descripcion?: string;
  activo: boolean; fechaCreacion: string;
  salaAsignada?: SalaAsignada;
  permisosAsignados: RolPermiso[];
}

// ─── MODAL ───────────────────────────────────────────────
function Modal({ children, onClose, title, rolNombre }: { 
  children: React.ReactNode; 
  onClose: () => void; 
  title: string;
  rolNombre?: string;
}) {
  const getTitle = () => {
    if (title === "permisos") return `Permisos de ${rolNombre || "rol"}`;
    if (title === "editar") return "Editar rol";
    return "Nuevo rol";
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            {title === "permisos" ? <Key className="w-5 h-5 text-emerald-500" /> : <Shield className="w-5 h-5 text-blue-500" />}
            {getTitle()}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── BUSCADOR DE SALAS ───────────────────────────────────
function BuscadorSala({
  onSelect,
  onClose,
}: {
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, loading } = useQuery(GET_SALAS_TRIBUNAL);

  const salas: any[] = data?.allSalasTribunal ?? [];

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
              <p>No se encontraron salas</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filtrados.map((s) => (
                <button
                  key={s.idSala}
                  onClick={() => {
                    onSelect(s.idSala, `${s.nombreSala} — ${s.idTribunal?.nombreTribunal || ''}`);
                    onClose();
                  }}
                  className="w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700"
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
          <button onClick={onClose} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ────────────────────────────────────
export default function RolesPage() {
  const [modalForm, setModalForm] = useState(false);
  const [modalPermisos, setModalPermisos] = useState(false);
  const [editando, setEditando] = useState<Rol | null>(null);
  const [rolSeleccionado, setRolSeleccionado] = useState<Rol | null>(null);
  const [form, setForm] = useState({ nombre: "", descripcion: "", idSala: null as number | null });
  const [busqueda, setBusqueda] = useState("");
  const [busquedaPerm, setBusquedaPerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Estados para buscador de sala
  const [buscadorSalaAbierto, setBuscadorSalaAbierto] = useState(false);
  const [salaSeleccionada, setSalaSeleccionada] = useState("");

  // Estados para bloquear botones
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingPermiso, setTogglingPermiso] = useState<number | null>(null);

  const { data, loading, refetch } = useQuery(GET_ROLES);
  const { data: dataPermisos } = useQuery(GET_PERMISOS);

  const [crearRol] = useMutation(CREAR_ROL);
  const [actualizarRol] = useMutation(ACTUALIZAR_ROL);
  const [eliminarRol] = useMutation(ELIMINAR_ROL);
  const [asignarPermiso] = useMutation(ASIGNAR_PERMISO_ROL);
  const [removerPermiso] = useMutation(REMOVER_PERMISO_ROL);

  const { executeCreate, executeUpdate, executeDelete, toast } = useCrudNotifications('Rol');

  const roles: Rol[] = data?.allRoles ?? [];
  const permisos: Permiso[] = dataPermisos?.allPermisos ?? [];

  const rolesFiltrados = roles.filter(r =>
    r.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalPages = Math.ceil(rolesFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRoles = rolesFiltrados.slice(startIndex, startIndex + itemsPerPage);

  const modulosDisponibles = [...new Set(permisos.map(p => p.modulo))].sort();

  const seleccionarSala = (id: number, nombre: string) => {
    setForm(prev => ({ ...prev, idSala: id }));
    setSalaSeleccionada(nombre);
  };

  const abrirCrear = () => {
    setEditando(null);
    setForm({ nombre: "", descripcion: "", idSala: null });
    setSalaSeleccionada("");
    setModalForm(true);
  };

  const abrirEditar = (r: Rol) => {
    setEditando(r);
    setForm({ 
      nombre: r.nombre, 
      descripcion: r.descripcion ?? "",
      idSala: r.salaAsignada?.idSala ?? null
    });
    setSalaSeleccionada(r.salaAsignada ? `${r.salaAsignada.nombreSala}` : "");
    setModalForm(true);
  };

  const abrirPermisos = (r: Rol) => {
    setRolSeleccionado(r);
    setBusquedaPerm("");
    setModalPermisos(true);
  };

  const cerrarForm = () => { setModalForm(false); setEditando(null); };
  const cerrarPermisos = () => { setModalPermisos(false); setRolSeleccionado(null); };

  const guardar = async () => {
    if (!form.nombre.trim()) {
      toast.error("El nombre es obligatorio.");
      return;
    }

    if (saving) return;
    setSaving(true);

    try {
      if (editando) {
        await executeUpdate(async () => {
          const input: any = { 
            nombre: form.nombre, 
            descripcion: form.descripcion,
            idSala: form.idSala
          };
          
          await actualizarRol({
            variables: { 
              id: Number(editando.idRol), 
              input
            },
          });
          await refetch();
          cerrarForm();
          return true;
        });
      } else {
        await executeCreate(async () => {
          const input: any = { 
            nombre: form.nombre, 
            descripcion: form.descripcion
          };
          if (form.idSala) {
            input.idSala = form.idSala;
          }
          await crearRol({ variables: input });
          await refetch();
          cerrarForm();
          return true;
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (id: number, nombre: string) => {
    if (deletingId === id) return;
    
    setDeletingId(id);
    try {
      await executeDelete(
        async () => {
          const { data } = await eliminarRol({ variables: { id: Number(id) } });
          if (!data?.eliminarRol?.ok) {
            const msg = data?.eliminarRol?.mensaje ?? "No se pudo eliminar";
            const estaEnUso = msg.includes("usuarios asignados");
            throw new Error(estaEnUso 
              ? "No se puede eliminar este rol porque tiene usuarios asignados. Reasigna esos usuarios a otro rol antes de eliminarlo."
              : msg);
          }
          await refetch();
          return true;
        },
        {
          loading: `Eliminando rol ${nombre}...`,
          success: `Rol ${nombre} eliminado exitosamente`,
          error: `Error al eliminar el rol`,
        },
        `¿Eliminar el rol "${nombre}"? Esta acción no se puede deshacer.`
      );
    } finally {
      setDeletingId(null);
    }
  };

  const togglePermiso = async (idPermiso: number, permisoNombre: string) => {
    if (!rolSeleccionado) return;
    if (togglingPermiso === idPermiso) return;
    
    const yaAsignado = rolSeleccionado.permisosAsignados.some(rp => rp.permiso.idPermiso === idPermiso);
    setTogglingPermiso(idPermiso);
    
    const loadingId = toast.loading(`${yaAsignado ? 'Quitando' : 'Asignando'} permiso ${permisoNombre}...`);
    
    try {
      if (yaAsignado) {
        await removerPermiso({ variables: { idRol: Number(rolSeleccionado.idRol), idPermiso: Number(idPermiso) } });
      } else {
        await asignarPermiso({ variables: { idRol: Number(rolSeleccionado.idRol), idPermiso: Number(idPermiso) } });
      }
      const result = await refetch();
      const actualizado = result.data?.allRoles?.find((r: Rol) => r.idRol === rolSeleccionado.idRol);
      if (actualizado) setRolSeleccionado(actualizado);
      toast.dismiss(loadingId);
      toast.success(`Permiso ${yaAsignado ? 'removido' : 'asignado'} exitosamente`);
    } catch (error: any) {
      toast.dismiss(loadingId);
      toast.error(error.message || `Error al ${yaAsignado ? 'quitar' : 'asignar'} el permiso`);
    } finally {
      setTogglingPermiso(null);
    }
  };

  const permisosFiltrados = permisos.filter(p =>
    `${p.nombre} ${p.codigo} ${p.modulo}`.toLowerCase().includes(busquedaPerm.toLowerCase())
  );

  const totalRoles = roles.length;
  const rolesActivos = roles.filter(r => r.activo).length;
  const totalPermisos = permisos.length;
  const rolesConSala = roles.filter(r => r.salaAsignada).length;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Shield className="w-7 h-7 text-blue-500" />
            Roles
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestión de roles y sus permisos
          </p>
        </div>
        <button
          onClick={abrirCrear}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Nuevo rol
        </button>
      </div>

      {/* TARJETAS DE ESTADÍSTICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Roles</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{totalRoles}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Roles Activos</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{rolesActivos}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Roles con Sala</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{rolesConSala}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Permisos</p>
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">{totalPermisos}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Key className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          placeholder="Buscar rol..."
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sala Asignada</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Permisos</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse w-24"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedRoles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Shield className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                      <p>No se encontraron roles</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRoles.map((rol) => (
                  <tr key={rol.idRol} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                          {rol.nombre.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-800 dark:text-white">{rol.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{rol.descripcion ?? "—"}</td>
                    <td className="px-6 py-4">
                      {rol.salaAsignada ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-800 dark:text-white">{rol.salaAsignada.nombreSala}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {rol.salaAsignada.idTribunal?.nombreTribunal}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        <Key className="w-3 h-3" />
                        {rol.permisosAsignados.length} permiso{rol.permisosAsignados.length !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${rol.activo ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                        {rol.activo ? <CheckCircle className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                        {rol.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => abrirEditar(rol)} 
                          disabled={saving}
                          className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-40" 
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => abrirPermisos(rol)} 
                          disabled={saving}
                          className="p-2 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors disabled:opacity-40" 
                          title="Permisos"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => eliminar(rol.idRol, rol.nombre)} 
                          disabled={deletingId === rol.idRol}
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

      {/* MODAL CREAR/EDITAR ROL */}
      {modalForm && (
        <Modal onClose={cerrarForm} title={editando ? "editar" : "crear"}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                value={form.nombre}
                onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                disabled={saving}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Ej: Administrador, Vocal, Secretario..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Sala Asignada <span className="text-gray-400 text-xs">(opcional)</span>
              </label>
              {salaSeleccionada ? (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="flex-1 text-sm text-gray-800 dark:text-white">{salaSeleccionada}</span>
                  <button
                    onClick={() => {
                      setForm(prev => ({ ...prev, idSala: null }));
                      setSalaSeleccionada("");
                    }}
                    disabled={saving}
                    className="p-1 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setBuscadorSalaAbierto(true)}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                >
                  <Search className="w-4 h-4" />
                  Buscar sala
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                disabled={saving}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Descripción del rol..."
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button 
                onClick={cerrarForm} 
                disabled={saving}
                className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={guardar} 
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium text-sm shadow-md transition-all"
              >
                {saving ? "Guardando..." : (editando ? "Guardar cambios" : "Crear rol")}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL PERMISOS */}
      {modalPermisos && rolSeleccionado && (
        <Modal onClose={cerrarPermisos} title="permisos" rolNombre={rolSeleccionado.nombre}>
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                Permisos asignados a <span className="font-bold">{rolSeleccionado.nombre}</span>
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Activa o desactiva permisos. Los cambios se aplican de inmediato.
              </p>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                placeholder="Buscar permiso por nombre, código o módulo..."
                value={busquedaPerm}
                onChange={e => setBusquedaPerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              />
            </div>

            {modulosDisponibles.map(modulo => {
              const permsMod = permisosFiltrados.filter(p => p.modulo === modulo);
              if (permsMod.length === 0) return null;
              return (
                <div key={modulo} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      {modulo}
                    </span>
                    <span className="text-xs text-gray-400">({permsMod.length})</span>
                  </div>
                  <div className="space-y-2 pl-3">
                    {permsMod.map(p => {
                      const asignado = rolSeleccionado.permisosAsignados.some(rp => rp.permiso.idPermiso === p.idPermiso);
                      const isToggling = togglingPermiso === p.idPermiso;
                      return (
                        <div key={p.idPermiso} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-white">{p.nombre}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{p.codigo}</p>
                          </div>
                          <button
                            onClick={() => togglePermiso(p.idPermiso, p.nombre)}
                            disabled={isToggling}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                              asignado 
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50' 
                                : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                            }`}
                          >
                            {isToggling ? "Procesando..." : (asignado ? "Quitar" : "Asignar")}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {permisosFiltrados.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Key className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p>No se encontraron permisos</p>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button onClick={cerrarPermisos} className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium">
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL BUSCADOR DE SALA */}
      {buscadorSalaAbierto && (
        <BuscadorSala
          onSelect={seleccionarSala}
          onClose={() => setBuscadorSalaAbierto(false)}
        />
      )}
    </div>
  );
}