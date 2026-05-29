import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { useAuth } from "../context/AuthContext";
import {
  User, Briefcase, Calendar, Clock, Shield, LogOut, ArrowLeft,
  Database, Mail, CheckCircle, Key, FolderOpen, Mic, FileText,
  ClipboardList, Hash, Star,
} from "lucide-react";

// ── Queries ───────────────────────────────────────────────────────────────────

const GET_PERFIL = gql`
  query GetPerfil {
    allUsuarios {
      idUsuario
      nombres
      paterno
      materno
      email
      username
      cargoOficial
      activo
      fechaCreacion
      ultimoAcceso
      rol {
        nombre
        descripcion
        permisosAsignados {
          permiso {
            nombre
            codigo
            modulo
          }
        }
      }
    }
    allExpedientes  { idExpediente }
    allAudiencias   { idAudiencia  }
    allDocumentos   { idDocumento  }
    allActuaciones  { idActuacion  }
  }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtFecha = (f: string) =>
  f
    ? new Date(f).toLocaleDateString("es-BO", {
        day: "2-digit", month: "long", year: "numeric",
      })
    : "—";

const fmtFechaHora = (f: string) =>
  f
    ? new Date(f).toLocaleString("es-BO", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—";

const saludoPorHora = () => {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
};

// ── Rol config ────────────────────────────────────────────────────────────────

const ROL_CONFIG: Record<string, { gradient: string; badge: string; icon: string }> = {
  Administrador: {
    gradient: "from-red-500 via-rose-500 to-pink-600",
    badge: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    icon: "👑",
  },
  Juez: {
    gradient: "from-amber-500 via-orange-500 to-yellow-600",
    badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
    icon: "⚖️",
  },
  Vocal: {
    gradient: "from-emerald-500 via-teal-500 to-cyan-600",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
    icon: "🏛️",
  },
  Secretario: {
    gradient: "from-blue-500 via-indigo-500 to-violet-600",
    badge: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    icon: "📋",
  },
};

const getRolConfig = (rol: string) =>
  ROL_CONFIG[rol] ?? {
    gradient: "from-slate-500 via-gray-500 to-zinc-600",
    badge: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600",
    icon: "👤",
  };

// ── Módulo config (colores por módulo de permiso) ─────────────────────────────

const MODULO_COLORS: Record<string, string> = {
  usuarios:     "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  expedientes:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  audiencias:   "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  resoluciones: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  documentos:   "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  personas:     "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  reportes:     "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
};

const getModuloColor = (modulo: string) =>
  MODULO_COLORS[modulo?.toLowerCase()] ??
  "bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300";

// ── Skeleton ──────────────────────────────────────────────────────────────────

const Sk = ({ w = "w-full", h = "h-3" }: { w?: string; h?: string }) => (
  <div className={`${w} ${h} bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse`} />
);

// ── Componente principal ──────────────────────────────────────────────────────

export default function PerfilPage() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const { data, loading } = useQuery(GET_PERFIL, { fetchPolicy: "cache-and-network" });

  // Usuario completo desde la DB
  const usuarioCompleto = data?.allUsuarios?.find(
    (u: any) => u.email === usuario?.email || u.username === usuario?.username
  );

  const nombre = usuarioCompleto
    ? `${usuarioCompleto.nombres} ${usuarioCompleto.paterno}`.trim()
    : usuario?.nombre ?? usuario?.username ?? "Usuario";

  const rol = usuarioCompleto?.rol?.nombre ?? usuario?.rol ?? "—";
  const rolConfig = getRolConfig(rol);
  const inicial = nombre.charAt(0).toUpperCase();

  // Permisos agrupados por módulo
  const permisos: any[] =
    usuarioCompleto?.rol?.permisosAsignados?.map((p: any) => p.permiso) ?? [];

  const permisosPorModulo = permisos.reduce((acc: Record<string, any[]>, p: any) => {
    const mod = p.modulo ?? "general";
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {});

  // Estadísticas reales del sistema (no filtradas por usuario porque no hay FK directo)
  const totalExpedientes = data?.allExpedientes?.length ?? 0;
  const totalAudiencias  = data?.allAudiencias?.length  ?? 0;
  const totalDocumentos  = data?.allDocumentos?.length  ?? 0;
  const totalActuaciones = data?.allActuaciones?.length ?? 0;

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── ENCABEZADO ── */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all border border-gray-200 dark:border-slate-700 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <User className="w-6 h-6 text-blue-500" />
            Mi Perfil
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {saludoPorHora()}, {usuario?.nombre ?? usuario?.username ?? "Usuario"} 👋
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── COLUMNA IZQUIERDA ── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Tarjeta de identidad */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
            {/* Banner */}
            <div className={`h-24 bg-gradient-to-r ${rolConfig.gradient} relative`}>
              <div className="absolute inset-0 bg-black/10" />
              <div className="absolute top-3 right-3">
                <span className="text-2xl">{rolConfig.icon}</span>
              </div>
            </div>

            {/* Avatar */}
            <div className="relative px-6 pb-6">
              <div className="absolute -top-10 left-6 w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 p-1 shadow-xl ring-4 ring-white dark:ring-slate-800">
                <div className={`w-full h-full rounded-xl bg-gradient-to-br ${rolConfig.gradient} flex items-center justify-center`}>
                  <span className="text-2xl font-black text-white">{inicial}</span>
                </div>
              </div>

              <div className="pt-12">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">{nombre}</h2>
                <div className="flex items-center gap-1.5 mt-1">
                  <Mail className="w-3 h-3 text-gray-400" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{usuarioCompleto?.email ?? usuario?.email}</p>
                </div>
                <div className="mt-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${rolConfig.badge}`}>
                    <span>{rolConfig.icon}</span>
                    {rol}
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-2.5 pt-4 border-t border-gray-100 dark:border-slate-700">
                {[
                  { icon: User,     label: "Username", value: usuarioCompleto?.username ?? "—" },
                  { icon: Briefcase, label: "Cargo",   value: usuarioCompleto?.cargoOficial ?? "—" },
                  { icon: Shield,   label: "Estado",   value: null },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <Icon className="w-3.5 h-3.5" /> {label}
                    </span>
                    {label === "Estado" ? (
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        usuarioCompleto?.activo
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        <CheckCircle className="w-3 h-3" />
                        {usuarioCompleto?.activo ? "Activo" : "Inactivo"}
                      </span>
                    ) : (
                      <span className="font-semibold text-gray-800 dark:text-white text-xs max-w-[120px] truncate text-right">
                        {value}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleLogout}
                className="w-full mt-5 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-semibold shadow-md shadow-red-500/20 transition-all hover:scale-[1.01]"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          </div>

          {/* Actividad */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-blue-500" />
              Actividad
            </h3>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <Sk key={i} />)}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Cuenta creada</p>
                  <p className="text-sm font-semibold text-gray-700 dark:text-white">
                    {fmtFecha(usuarioCompleto?.fechaCreacion)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
                  <p className="text-[10px] text-blue-500 uppercase tracking-wider mb-0.5">Último acceso</p>
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                    {fmtFechaHora(usuarioCompleto?.ultimoAcceso)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">ID de usuario</p>
                  <p className="text-sm font-mono font-semibold text-gray-700 dark:text-white flex items-center gap-1">
                    <Hash className="w-3 h-3 text-gray-400" />
                    {usuarioCompleto?.idUsuario ?? "—"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Info del sistema */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
              <Database className="w-4 h-4 text-purple-500" />
              Stack tecnológico
            </h3>
            <div className="space-y-2">
              {[
                ["⚖️", "Tribunal App", "v2.0.0"],
                ["🐍", "Django + GraphQL", "Backend"],
                ["⚛️",  "React + TypeScript", "Frontend"],
                ["🐘", "PostgreSQL", "Base de datos"],
              ].map(([emoji, name, tag]) => (
                <div key={name} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700">
                  <span className="text-lg">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700 dark:text-white">{name}</p>
                    <p className="text-[10px] text-gray-400">{tag}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── COLUMNA DERECHA ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Datos personales */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                <User className="w-4 h-4 text-blue-500" />
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-white">Datos Personales</h3>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-2"><Sk h="h-2.5" w="w-24" /><Sk h="h-9" /></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    ["Nombres", usuarioCompleto?.nombres ?? "—"],
                    ["Apellido paterno", usuarioCompleto?.paterno ?? "—"],
                    ["Apellido materno", usuarioCompleto?.materno ?? "—"],
                    ["Email", usuarioCompleto?.email ?? "—"],
                    ["Cargo oficial", usuarioCompleto?.cargoOficial ?? "—"],
                    ["Username", usuarioCompleto?.username ?? "—"],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">{label}</p>
                      <div className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700">
                        <p className="text-sm font-medium text-gray-800 dark:text-white">{val}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Estadísticas del sistema (datos reales) */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                <Star className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-white">Estadísticas del Sistema</h3>
              <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">Datos en tiempo real</span>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="p-4 rounded-xl border border-gray-200 dark:border-slate-700 space-y-2">
                    <Sk h="h-7" w="w-12" /><Sk h="h-2.5" w="w-20" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Expedientes", value: totalExpedientes, icon: FolderOpen, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", bar: "bg-emerald-500" },
                  { label: "Audiencias",  value: totalAudiencias,  icon: Mic,        color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-900/20",    bar: "bg-blue-500"    },
                  { label: "Documentos",  value: totalDocumentos,  icon: FileText,   color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20", bar: "bg-purple-500" },
                  { label: "Actuaciones", value: totalActuaciones, icon: ClipboardList, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20", bar: "bg-amber-500" },
                ].map(({ label, value, icon: Icon, color, bg, bar }) => {
                  const maxVal = Math.max(totalExpedientes, totalAudiencias, totalDocumentos, totalActuaciones, 1);
                  const pct = Math.round((value / maxVal) * 100);
                  return (
                    <div key={label} className={`p-4 rounded-xl border border-gray-100 dark:border-slate-700 ${bg} transition-all hover:scale-[1.02]`}>
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-4 h-4 ${color}`} />
                      </div>
                      <p className={`text-2xl font-black ${color}`}>{value}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
                      <div className="mt-2.5 h-1.5 bg-white/60 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full ${bar} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Permisos del rol */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/30">
                  <Key className="w-4 h-4 text-purple-500" />
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-white">Permisos del Rol</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{permisos.length} permisos</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${rolConfig.badge}`}>
                  {rolConfig.icon} {rol}
                </span>
              </div>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => <Sk key={i} />)}
                </div>
              ) : permisos.length === 0 ? (
                <div className="text-center py-8">
                  <Key className="w-8 h-8 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No hay permisos asignados a este rol</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(permisosPorModulo).map(([modulo, perms]) => (
                    <div key={modulo}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${getModuloColor(modulo)}`}>
                          {modulo}
                        </span>
                        <span className="text-xs text-gray-400">{(perms as any[]).length} permisos</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(perms as any[]).map((p: any) => (
                          <div
                            key={p.codigo}
                            title={p.nombre}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                          >
                            <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span className="text-xs font-mono text-gray-600 dark:text-gray-300">{p.codigo}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}