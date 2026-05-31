import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useCrudNotifications } from '../../hooks/useCrudNotifications';
import {
  GET_USUARIOS,
  GET_ROLES,
  CREAR_USUARIO,
  ACTUALIZAR_USUARIO,
  ELIMINAR_USUARIO,
} from "../../graphql/usuarios/queries";
import { 
  Users, Plus, Search, Edit, Trash2, Power, Mail, 
  User, Briefcase, Shield, X, CheckCircle, Circle,
  MoreVertical, ChevronLeft, ChevronRight
} from "lucide-react";

// ─── TIPOS ───────────────────────────────────────────────
interface Rol { idRol: number; nombre: string; }
interface Usuario {
  idUsuario: number;
  nombres: string;
  paterno: string;
  materno?: string;
  email: string;
  username: string;
  documentoIdentidad: string;
  cargoOficial?: string;
  activo: boolean;
  fechaCreacion: string;
  rol: Rol;
}

const initialForm = {
  nombres: "", paterno: "", materno: "", documentoIdentidad: "",
  email: "", username: "", password: "", cargoOficial: "", idRol: 0,
};

// ─── MODAL ───────────────────────────────────────────────
function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            {title === "editar" ? <Edit className="w-5 h-5 text-blue-500" /> : <Users className="w-5 h-5 text-blue-500" />}
            {title === "editar" ? "Editar usuario" : "Nuevo usuario"}
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

// ─── CAMPO DE FORMULARIO ─────────────────────────────────
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

// ─── TARJETA DE USUARIO (para móvil/tablet) ─────────────────
function UserCard({ usuario, onEdit, onToggleActivo, onDelete, isToggling, isDeleting }: { 
  usuario: Usuario; 
  onEdit: () => void; 
  onToggleActivo: () => void; 
  onDelete: () => void;
  isToggling: boolean;
  isDeleting: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
              {usuario.nombres.charAt(0)}{usuario.paterno.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white">
                {usuario.nombres} {usuario.paterno}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">@{usuario.username}</p>
            </div>
          </div>
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
              <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg z-10 py-1">
                <button onClick={onEdit} className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2">
                  <Edit className="w-4 h-4" /> Editar
                </button>
                <button onClick={onToggleActivo} disabled={isToggling} className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${usuario.activo ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'}`}>
                  <Power className="w-4 h-4" /> {isToggling ? "Procesando..." : (usuario.activo ? "Desactivar" : "Activar")}
                </button>
                <button onClick={onDelete} disabled={isDeleting} className="w-full px-4 py-2 text-left text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Trash2 className="w-4 h-4" /> {isDeleting ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-300">{usuario.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Briefcase className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-300">{usuario.cargoOficial || "Sin cargo"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Shield className="w-3.5 h-3.5 text-gray-400" />
            <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium">
              {usuario.rol.nombre}
            </span>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center">
          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${usuario.activo ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
            {usuario.activo ? <CheckCircle className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
            {usuario.activo ? "Activo" : "Inactivo"}
          </span>
          <div className="flex gap-1">
            <button onClick={onEdit} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
              <Edit className="w-4 h-4" />
            </button>
            <button onClick={onToggleActivo} disabled={isToggling} className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${usuario.activo ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30' : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'}`}>
              <Power className="w-4 h-4" />
            </button>
            <button onClick={onDelete} disabled={isDeleting} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ────────────────────────────────────
export default function UsuariosPage() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalType, setModalType] = useState<"crear" | "editar">("crear");
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [form, setForm] = useState(initialForm);
  const [busqueda, setBusqueda] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ Estados para bloqueo de botones
  const [saving, setSaving] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState<number | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  const { data, loading, refetch } = useQuery(GET_USUARIOS);
  const { data: dataRoles } = useQuery(GET_ROLES);

  const [crearUsuario] = useMutation(CREAR_USUARIO);
  const [actualizarUsuario] = useMutation(ACTUALIZAR_USUARIO);
  const [eliminarUsuario] = useMutation(ELIMINAR_USUARIO);

  // ✅ Inicializar hook de notificaciones
  const { executeCreate, executeUpdate, executeDelete, executeToggle, toast } = useCrudNotifications('Usuario');

  const usuarios: Usuario[] = data?.allUsuarios ?? [];
  const roles: Rol[] = dataRoles?.allRoles ?? [];

  const usuariosFiltrados = usuarios.filter(u =>
    `${u.nombres} ${u.paterno} ${u.email} ${u.username}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalPages = Math.ceil(usuariosFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsuarios = usuariosFiltrados.slice(startIndex, startIndex + itemsPerPage);

  const abrirCrear = () => {
    setModalType("crear");
    setEditando(null);
    setForm(initialForm);
    setModalAbierto(true);
  };

  const abrirEditar = (u: Usuario) => {
    setModalType("editar");
    setEditando(u);
    setForm({
      nombres: u.nombres, paterno: u.paterno, materno: u.materno ?? "",
      documentoIdentidad: u.documentoIdentidad, email: u.email,
      username: u.username, password: "", cargoOficial: u.cargoOficial ?? "",
      idRol: u.rol.idRol,
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => { setModalAbierto(false); setEditando(null); };
  const f = (field: string) => (v: string) => setForm(prev => ({ ...prev, [field]: v }));

  // ✅ Guardar con notificaciones y bloqueo
  const guardar = async () => {
    if (!form.nombres || !form.paterno || !form.email || !form.idRol) {
      toast.error("Nombres, apellido, email y rol son obligatorios.");
      return;
    }
    
    if (!editando && !form.password) {
      toast.error("La contraseña es obligatoria al crear un usuario.");
      return;
    }

    if (saving) return;
    setSaving(true);

    try {
      if (editando) {
        const input: any = {
          nombres: form.nombres,
          paterno: form.paterno,
          email: form.email,
          cargoOficial: form.cargoOficial,
          idRol: Number(form.idRol),
        };
        
        if (form.password && form.password.trim() !== "") {
          input.password = form.password;
        }
        
        await executeUpdate(async () => {
          await actualizarUsuario({
            variables: { id: Number(editando.idUsuario), input: input },
          });
          await refetch();
          cerrarModal();
          return true;
        });
      } else {
        await executeCreate(async () => {
          await crearUsuario({
            variables: {
              input: {
                nombres: form.nombres,
                paterno: form.paterno,
                materno: form.materno || undefined,
                documentoIdentidad: form.documentoIdentidad,
                email: form.email,
                username: form.username,
                password: form.password,
                cargoOficial: form.cargoOficial || undefined,
                idRol: Number(form.idRol),
              },
            },
          });
          await refetch();
          cerrarModal();
          return true;
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // ✅ Toggle activo con notificaciones y bloqueo
  const toggleActivo = async (u: Usuario) => {
    if (togglingUserId === u.idUsuario) return;
    const nuevoEstado = !u.activo;
    setTogglingUserId(u.idUsuario);
    
    try {
      await executeToggle(
        async () => {
          await actualizarUsuario({
            variables: { id: Number(u.idUsuario), input: { activo: nuevoEstado } },
          });
          await refetch();
          return true;
        },
        nuevoEstado,
        {
          loading: `Cambiando estado de ${u.nombres} ${u.paterno}...`,
          success: (isActive: boolean) => `${u.nombres} ${u.paterno} ha sido ${isActive ? 'activado' : 'desactivado'}`,
          error: `Error al cambiar estado del usuario`,
        }
      );
    } finally {
      setTogglingUserId(null);
    }
  };

  // ✅ Eliminar con notificaciones y bloqueo
  const eliminar = async (id: number, nombreCompleto: string) => {
    if (deletingUserId === id) return;
    setDeletingUserId(id);
    
    try {
      await executeDelete(
        async () => {
          const { data } = await eliminarUsuario({ variables: { id: Number(id) } });
          if (!data?.eliminarUsuario?.ok) {
            throw new Error(data?.eliminarUsuario?.mensaje ?? "No se pudo eliminar");
          }
          await refetch();
          return true;
        },
        {
          loading: `Eliminando a ${nombreCompleto}...`,
          success: `${nombreCompleto} eliminado exitosamente`,
          error: `Error al eliminar ${nombreCompleto}`,
        },
        `¿Eliminar a ${nombreCompleto}? Esta acción no se puede deshacer.`
      );
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* ============================================================ */}
      {/* ENCABEZADO */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-500" />
            Usuarios
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestión de usuarios del sistema
          </p>
        </div>
        <button
          onClick={abrirCrear}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <Plus className="w-4 h-4" />
          Nuevo usuario
        </button>
      </div>

      {/* ============================================================ */}
      {/* TARJETAS DE ESTADÍSTICAS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Usuarios</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{usuarios.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Registrados en el sistema</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuarios Activos</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                {usuarios.filter(u => u.activo).length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {Math.round((usuarios.filter(u => u.activo).length / (usuarios.length || 1)) * 100)}% del total
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuarios Inactivos</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                {usuarios.filter(u => !u.activo).length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Circle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {Math.round((usuarios.filter(u => !u.activo).length / (usuarios.length || 1)) * 100)}% del total
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Roles</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{roles.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Asignados a los usuarios</p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* BUSCADOR Y FILTROS */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="Buscar por nombre, email o username..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
          />
        </div>
      </div>

      {/* ============================================================ */}
      {/* TABLA (Desktop) */}
      {/* ============================================================ */}
      <div className="hidden lg:block bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-lg dark:shadow-slate-900/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contacto</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse w-24"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedUsuarios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                      <p>No se encontraron usuarios</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsuarios.map((usuario) => (
                  <tr key={usuario.idUsuario} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {usuario.nombres.charAt(0)}{usuario.paterno.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white">{usuario.nombres} {usuario.paterno}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">@{usuario.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300">{usuario.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{usuario.cargoOficial || "Sin cargo"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        <Shield className="w-3 h-3" />
                        {usuario.rol.nombre}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${usuario.activo ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                        {usuario.activo ? <CheckCircle className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                        {usuario.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => abrirEditar(usuario)} 
                          disabled={saving}
                          className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" 
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => toggleActivo(usuario)} 
                          disabled={togglingUserId === usuario.idUsuario}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${usuario.activo ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30' : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'}`} 
                          title={usuario.activo ? "Desactivar" : "Activar"}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => eliminar(usuario.idUsuario, `${usuario.nombres} ${usuario.paterno}`)} 
                          disabled={deletingUserId === usuario.idUsuario}
                          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" 
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

      {/* ============================================================ */}
      {/* TARJETAS (Móvil/Tablet) */}
      {/* ============================================================ */}
      <div className="lg:hidden space-y-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-slate-700 animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-32 animate-pulse mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-24 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))
        ) : paginatedUsuarios.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p>No se encontraron usuarios</p>
          </div>
        ) : (
          paginatedUsuarios.map((usuario) => (
            <UserCard
              key={usuario.idUsuario}
              usuario={usuario}
              onEdit={() => abrirEditar(usuario)}
              onToggleActivo={() => toggleActivo(usuario)}
              onDelete={() => eliminar(usuario.idUsuario, `${usuario.nombres} ${usuario.paterno}`)}
              isToggling={togglingUserId === usuario.idUsuario}
              isDeleting={deletingUserId === usuario.idUsuario}
            />
          ))
        )}
      </div>

      {/* ============================================================ */}
      {/* PAGINACIÓN */}
      {/* ============================================================ */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, usuariosFiltrados.length)} de {usuariosFiltrados.length}
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

      {/* ============================================================ */}
      {/* MODAL CREAR/EDITAR */}
      {/* ============================================================ */}
      {modalAbierto && (
        <Modal onClose={cerrarModal} title={modalType}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nombres" value={form.nombres} onChange={f("nombres")} required disabled={saving} />
              <Field label="Apellido paterno" value={form.paterno} onChange={f("paterno")} required disabled={saving} />
            </div>
            <Field label="Apellido materno" value={form.materno} onChange={f("materno")} disabled={saving} />
            <Field label="Email" value={form.email} onChange={f("email")} type="email" required disabled={saving} />

            {modalType === "crear" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Username" value={form.username} onChange={f("username")} required disabled={saving} />
                  <Field label="CI / Documento" value={form.documentoIdentidad} onChange={f("documentoIdentidad")} required disabled={saving} />
                </div>
                <Field label="Contraseña" value={form.password} onChange={f("password")} type="password" required disabled={saving} />
              </>
            )}

            {modalType === "editar" && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Nueva contraseña <span className="text-gray-400">(opcional)</span>
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => f("password")(e.target.value)}
                  disabled={saving}
                  placeholder="Dejar en blanco para mantener la actual"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Solo completar si deseas cambiar la contraseña</p>
              </div>
            )}

            <Field label="Cargo oficial" value={form.cargoOficial} onChange={f("cargoOficial")} disabled={saving} />

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Rol <span className="text-red-500">*</span>
              </label>
              <select
                value={form.idRol}
                onChange={e => setForm(prev => ({ ...prev, idRol: Number(e.target.value) }))}
                disabled={saving}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value={0}>— Selecciona un rol —</option>
                {roles.map(r => <option key={r.idRol} value={r.idRol}>{r.nombre}</option>)}
              </select>
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
                {saving ? "Guardando..." : (modalType === "editar" ? "Guardar cambios" : "Crear usuario")}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}