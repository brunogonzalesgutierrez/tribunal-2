import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { useAuth } from "../context/AuthContext";
import { User, Briefcase, Calendar, Clock, Shield, LogOut, ArrowLeft, Database, Server, Mail, CheckCircle } from "lucide-react";

const GET_USUARIO = gql`
  query {
    allUsuarios {
      idUsuario
      nombres
      paterno
      materno
      email
      username
      cargo_oficial: cargoOficial
      activo
      fechaCreacion
      ultimoAcceso
      rol { nombre }
    }
  }
`;

export default function PerfilPage() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const { data, loading } = useQuery(GET_USUARIO);

  const usuarioCompleto = data?.allUsuarios?.find(
    (u: any) => u.email === usuario?.email
  );

  const nombre = usuario
    ? `${usuario.nombre} ${usuario.paterno}`.trim() || usuario.email?.split("@")[0]
    : "Usuario";

  const rol = usuarioCompleto?.rol?.nombre ?? usuario?.rol ?? "—";

  const getRolColors = (rolNombre: string) => {
    const colors: Record<string, { 
      lightBg: string; lightText: string; lightBorder: string;
      darkBg: string; darkText: string; darkBorder: string;
      gradientLight: string; gradientDark: string;
    }> = {
      Administrador: { 
        lightBg: "bg-red-50", lightText: "text-red-700", lightBorder: "border-red-200",
        darkBg: "bg-red-950/40", darkText: "text-red-400", darkBorder: "border-red-900",
        gradientLight: "from-red-500 to-red-600",
        gradientDark: "from-red-800 to-red-950"
      },
      Juez: { 
        lightBg: "bg-amber-50", lightText: "text-amber-700", lightBorder: "border-amber-200",
        darkBg: "bg-amber-950/40", darkText: "text-amber-400", darkBorder: "border-amber-900",
        gradientLight: "from-amber-500 to-amber-600",
        gradientDark: "from-amber-800 to-amber-950"
      },
      Secretario: { 
        lightBg: "bg-blue-50", lightText: "text-blue-700", lightBorder: "border-blue-200",
        darkBg: "bg-blue-950/40", darkText: "text-blue-400", darkBorder: "border-blue-900",
        gradientLight: "from-blue-500 to-blue-600",
        gradientDark: "from-blue-800 to-blue-950"
      },
      Vocal: { 
        lightBg: "bg-emerald-50", lightText: "text-emerald-700", lightBorder: "border-emerald-200",
        darkBg: "bg-emerald-950/40", darkText: "text-emerald-400", darkBorder: "border-emerald-900",
        gradientLight: "from-emerald-500 to-emerald-600",
        gradientDark: "from-emerald-800 to-emerald-950"
      },
    };
    return colors[rolNombre] || { 
      lightBg: "bg-gray-50", lightText: "text-gray-700", lightBorder: "border-gray-200",
      darkBg: "bg-slate-800/50", darkText: "text-slate-300", darkBorder: "border-slate-700",
      gradientLight: "from-slate-500 to-slate-600",
      gradientDark: "from-slate-700 to-slate-800"
    };
  };

  const rolColors = getRolColors(rol);

  const fmtFecha = (f: string) =>
    f ? new Date(f).toLocaleDateString("es-BO", { day: "2-digit", month: "long", year: "numeric" }) : "—";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header con botón volver */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700/80 transition-all duration-200 shadow-sm dark:shadow-none border border-gray-200 dark:border-slate-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Mi Perfil
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Información de tu cuenta</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ============================================================ */}
        {/* COLUMNA IZQUIERDA - TARJETA DE PERFIL */}
        {/* ============================================================ */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-lg dark:shadow-slate-900/30 overflow-hidden transition-all duration-300 hover:shadow-xl dark:hover:shadow-slate-900/50">
            
            <div className={`h-28 bg-gradient-to-br ${rolColors.gradientLight} dark:bg-gradient-to-br dark:${rolColors.gradientDark} relative`}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent dark:from-black/50"></div>
            </div>
            
            <div className="relative px-6 pb-6">
              <div className="absolute -top-12 left-6">
                <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-900 p-1 shadow-xl">
                  <div className={`w-full h-full rounded-xl bg-gradient-to-br ${rolColors.gradientLight} dark:bg-gradient-to-br dark:${rolColors.gradientDark} flex items-center justify-center`}>
                    <span className="text-3xl font-bold text-white">
                      {nombre.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 pt-14">
              <div className="text-center mb-5">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{nombre}</h2>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Mail className="w-3 h-3 text-gray-400 dark:text-slate-500" />
                  <p className="text-sm text-gray-500 dark:text-slate-400">{usuario?.email}</p>
                </div>
                <div className="inline-block mt-3">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${rolColors.lightText} ${rolColors.lightBorder} border ${rolColors.lightBg} dark:${rolColors.darkText} dark:${rolColors.darkBorder} dark:${rolColors.darkBg}`}>
                    {rol}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-500 dark:text-slate-400 flex items-center gap-2 text-sm">
                    <User className="w-4 h-4" /> Username
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-slate-200">
                    {usuarioCompleto?.username ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-500 dark:text-slate-400 flex items-center gap-2 text-sm">
                    <Briefcase className="w-4 h-4" /> Cargo
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-slate-200">
                    {usuarioCompleto?.cargo_oficial ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-500 dark:text-slate-400 flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4" /> Estado
                  </span>
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                    usuarioCompleto?.activo 
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' 
                      : 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400'
                  }`}>
                    <CheckCircle className="w-3 h-3" />
                    {usuarioCompleto?.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all duration-200 text-sm font-semibold shadow-md shadow-red-500/25 dark:shadow-red-900/30"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* COLUMNA DERECHA */}
        {/* ============================================================ */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* DATOS PERSONALES */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-lg dark:shadow-slate-900/30 overflow-hidden transition-all duration-300 hover:shadow-xl dark:hover:shadow-slate-900/50">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/40">
                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                Datos Personales
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  ["Nombres", usuarioCompleto?.nombres ?? "—"],
                  ["Apellido paterno", usuarioCompleto?.paterno ?? "—"],
                  ["Apellido materno", usuarioCompleto?.materno ?? "—"],
                  ["Email", usuarioCompleto?.email ?? "—"],
                  ["Cargo oficial", usuarioCompleto?.cargo_oficial ?? "—"],
                  ["Username", usuarioCompleto?.username ?? "—"],
                ].map(([label, val]) => (
                  <div key={label} className="group">
                    <span className="text-xs text-gray-500 dark:text-slate-500 mb-1 block">{label}</span>
                    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 group-hover:border-blue-300 dark:group-hover:border-blue-700 transition-all duration-200">
                      <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{val}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* ACTIVIDAD RECIENTE - CORREGIDO (sin fondos blancos) */}
          {/* ============================================================ */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-lg dark:shadow-slate-900/30 overflow-hidden transition-all duration-300 hover:shadow-xl dark:hover:shadow-slate-900/50">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/40">
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                Actividad Reciente
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  ["Fecha de creación", fmtFecha(usuarioCompleto?.fechaCreacion), "📅"],
                  ["Último acceso", fmtFecha(usuarioCompleto?.ultimoAcceso), "🕐"],
                  ["Rol asignado", rol, "🎭"],
                ].map(([label, val, emoji]) => (
                  <div key={label} className="p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 transition-all duration-200">
                    <div className="text-2xl mb-2 opacity-70">{emoji}</div>
                    <span className="text-xs text-gray-500 dark:text-slate-500 block">{label}</span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-slate-300 mt-1 block">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* INFORMACIÓN DEL SISTEMA */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-lg dark:shadow-slate-900/30 overflow-hidden transition-all duration-300 hover:shadow-xl dark:hover:shadow-slate-900/50">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/40">
                  <Database className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                Información del Sistema
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  ["Aplicación", "Tribunal App v2.0.0", "⚖️"],
                  ["Backend", "Django + GraphQL", "🐍"],
                  ["Frontend", "React + TypeScript + Tailwind", "⚛️"],
                  ["Base de datos", "PostgreSQL", "🐘"],
                ].map(([label, val, emoji]) => (
                  <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700">
                    <div className="text-xl opacity-70">{emoji}</div>
                    <div className="flex-1">
                      <span className="text-xs text-gray-500 dark:text-slate-500 block">{label}</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{val}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ESTADÍSTICAS RÁPIDAS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { label: "Expedientes", value: "24", icon: "📁", color: "blue" },
              { label: "Audiencias", value: "12", icon: "📅", color: "emerald" },
              { label: "Documentos", value: "156", icon: "📄", color: "purple" },
            ].map((stat) => (
              <div key={stat.label} className="group bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl dark:hover:shadow-slate-900/50 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-800 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{stat.label}</p>
                  </div>
                  <div className="text-4xl opacity-60 group-hover:opacity-100 transition-opacity">
                    {stat.icon}
                  </div>
                </div>
                <div className="mt-4 h-1 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full w-2/3 rounded-full bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-600 dark:from-${stat.color}-600 dark:to-${stat.color}-700`}></div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}