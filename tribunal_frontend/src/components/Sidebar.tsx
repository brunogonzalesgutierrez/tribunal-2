import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { useAuth } from '../context/AuthContext';
import { 
  Gavel, ChevronRight,
  Folder, FileText, ListChecks,
  BarChart, Users, Calendar, Scale,
  LayoutDashboard, Building,
  ShieldCheck, Key, Shield,
  X, Star, TrendingUp, Clock, LogOut,
  History, ClipboardList, DoorOpen, Tag, Bell, Phone, Building2, Link2,
  UserCircle
} from 'lucide-react';
import { LucideIcon, Flag, Layers,  // ← agregar estos dos
} from 'lucide-react';
import { PERMISOS } from '../config/permisos';

// ── Query de badges ────────────────────────────────────────
const GET_BADGES = gql`
  query GetSidebarBadges {
    allAudiencias {
      idAudiencia
      estadoAudiencia
      fechaHoraProgramada
    }
    allExpedientes {
      idExpediente
      idEstadoExpediente { esTerminal }
    }
    allNotificaciones {
      idNotificacion
      estadoNotificacion
    }
    allSolicitudes {
      idSolicitud
      estadoSolicitud
    }
    allDocumentos {
      idDocumento
      firmadoDigitalmente
      fechaPresentacion
    }
  }
`;

// ── Hook de badges ─────────────────────────────────────────
function useSidebarBadges() {
  const { data } = useQuery(GET_BADGES, {
    fetchPolicy: 'cache-and-network',
    pollInterval: 60000, // refresca cada 60s
  });

  const esHoy = (fechaStr: string) => {
    const f = new Date(fechaStr), h = new Date();
    return (
      f.getDate() === h.getDate() &&
      f.getMonth() === h.getMonth() &&
      f.getFullYear() === h.getFullYear()
    );
  };

  const audiencias  = data?.allAudiencias    ?? [];
  const expedientes = data?.allExpedientes   ?? [];
  const notifs      = data?.allNotificaciones ?? [];
  const solicitudes = data?.allSolicitudes   ?? [];

  return {
    // Audiencias programadas para HOY
    audienciasHoy: audiencias.filter(
      (a: any) => a.estadoAudiencia === 'PROGRAMADA' && esHoy(a.fechaHoraProgramada)
    ).length,

    // Expedientes activos (no terminales)
    expedientesActivos: expedientes.filter(
      (e: any) => !e.idEstadoExpediente?.esTerminal
    ).length,

    // Notificaciones pendientes
    notifPendientes: notifs.filter(
      (n: any) => n.estadoNotificacion === 'PENDIENTE'
    ).length,

    // Solicitudes pendientes
    solicitudesPendientes: solicitudes.filter(
      (s: any) => s.estadoSolicitud === 'PENDIENTE'
    ).length,
  };
}

// ── Badge visual ───────────────────────────────────────────
function Badge({ count, pulse = false }: { count: number; pulse?: boolean }) {
  if (count === 0) return null;
  return (
    <span className={`relative inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white bg-red-500 shadow-sm shadow-red-500/40 ${pulse ? 'animate-pulse' : ''}`}>
      {count > 99 ? '99+' : count}
    </span>
  );
}

// ── Tipos ──────────────────────────────────────────────────
interface SubmenuItem {
  name: string;
  path: string;
  icon: LucideIcon;
  requiredPermissions: string[];
  badgeKey?: string;
}

interface MenuItemLink {
  name: string;
  path: string;
  icon: LucideIcon;
  type: 'link';
  description?: string;
  requiredPermissions: string[];
  badgeKey?: string;
}

interface MenuItemDropdown {
  name: string;
  icon: LucideIcon;
  type: 'dropdown';
  description?: string;
  active?: boolean;
  submenu: SubmenuItem[];
}

type MenuItem = MenuItemLink | MenuItemDropdown;

interface SidebarProps {
  collapsed?: boolean;
  darkMode?: boolean;
}

export default function Sidebar({ collapsed = false, darkMode = true }: SidebarProps) {
  const { logout, hasPermission, usuario } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
  const badges    = useSidebarBadges();

  const [expandedMenu, setExpandedMenu]   = useState<string | null>(null);
  const [favorites, setFavorites]         = useState<Array<{name: string, path: string}>>([]);
  const [recentItems, setRecentItems]     = useState<Array<{name: string, path: string, timestamp: number}>>([]);
  const [showRecent, setShowRecent]       = useState(true);

  const handleLogout = () => { logout(); navigate('/'); };

  // Persistencia
  useEffect(() => {
    try {
      const sf = localStorage.getItem('sidebarFavorites');
      const sr = localStorage.getItem('sidebarRecent');
      const ss = localStorage.getItem('sidebarShowRecent');
      if (sf) setFavorites(JSON.parse(sf));
      if (sr) setRecentItems(JSON.parse(sr));
      if (ss !== null) setShowRecent(JSON.parse(ss));
    } catch {}
  }, []);

  useEffect(() => { localStorage.setItem('sidebarShowRecent', JSON.stringify(showRecent)); }, [showRecent]);
  useEffect(() => { localStorage.setItem('sidebarFavorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('sidebarRecent', JSON.stringify(recentItems)); }, [recentItems]);

  const toggleMenu = (menu: string) => {
    if (!collapsed) setExpandedMenu(expandedMenu === menu ? null : menu);
  };

  const isSubmenuActive = (paths: string[]) =>
    paths.some(p => location.pathname === p);

  const addToFavorites = (name: string, path: string) => {
    if (!favorites.some(f => f.path === path))
      setFavorites(prev => [...prev, { name, path }]);
  };

  const removeFromFavorites = (path: string) =>
    setFavorites(prev => prev.filter(f => f.path !== path));

  const addToRecent = (name: string, path: string) => {
    const entry = { name, path, timestamp: Date.now() };
    setRecentItems(prev => [entry, ...prev.filter(r => r.path !== path)].slice(0, 5));
  };

  const filtrarSubmenu = (submenu: SubmenuItem[]) =>
    submenu.filter(sub => hasPermission(sub.requiredPermissions));

  // Mapa de badges por clave
  const badgeMap: Record<string, number> = {
    audienciasHoy:          badges.audienciasHoy,
    expedientesActivos:     badges.expedientesActivos,
    notifPendientes:        badges.notifPendientes,
    solicitudesPendientes:  badges.solicitudesPendientes,
  };

  // Total de badges para el grupo de Documentos (notif + solicitudes)
  const badgeDocumentos = badges.notifPendientes + badges.solicitudesPendientes;

  // ── MENÚ ──────────────────────────────────────────────────
  const menuItems: MenuItem[] = [
    { 
      name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard,
      type: 'link', description: 'Vista principal', requiredPermissions: [],
    },
    // { 
    //   name: 'Perfil', path: '/perfil', icon: UserCircle,
    //   type: 'link', description: 'Mi información personal', requiredPermissions: [],
    // },
    { 
      name: 'Seguridad', icon: ShieldCheck, type: 'dropdown',
      description: 'Usuarios y permisos',
      active: isSubmenuActive(['/usuarios', '/roles', '/permisos']),
      submenu: [
        { name: 'Usuarios',  path: '/usuarios',  icon: Users,   requiredPermissions: [PERMISOS.USUARIOS_VER]  },
        { name: 'Roles',     path: '/roles',     icon: Shield,  requiredPermissions: [PERMISOS.ROLES_VER]     },
        { name: 'Permisos',  path: '/permisos',  icon: Key,     requiredPermissions: [PERMISOS.PERMISOS_VER]  },
      ],
    },
    { 
      name: 'Expedientes', icon: Folder, type: 'dropdown',
      description: 'Gestión de expedientes',
      active: isSubmenuActive(['/expedientes', '/historial', '/actuaciones', '/tipos-actuacion', '/estados-expediente']),
      submenu: [
        { name: 'Lista de Expedientes', path: '/expedientes',        icon: Folder,        requiredPermissions: [PERMISOS.EXPEDIENTES_VER],        badgeKey: 'expedientesActivos' },
        { name: 'Historial de Estados', path: '/historial',          icon: History,       requiredPermissions: [PERMISOS.HISTORIAL_ESTADOS_VER]   },
        { name: 'Actuaciones',          path: '/actuaciones',        icon: FileText,      requiredPermissions: [PERMISOS.ACTUACIONES_VER]         },
        { name: 'Tipos de Actuación',   path: '/tipos-actuacion',    icon: ClipboardList, requiredPermissions: [PERMISOS.TIPOS_ACTUACION_VER]     },
        { name: 'Estados',              path: '/estados-expediente', icon: Flag,          requiredPermissions: [PERMISOS.ESTADOS_EXPEDIENTE_VER]  },
      ],
    },
    {
      name: 'Tribunal', icon: Building2, type: 'dropdown',
      description: 'Tribunales y salas',
      active: isSubmenuActive(['/tribunales', '/salas-tribunal', '/vocales', '/conformaciones']),
      submenu: [
        { name: 'Tribunales',       path: '/tribunales',    icon: Building2, requiredPermissions: [PERMISOS.TRIBUNALES_VER]      },
        { name: 'Salas de Tribunal',path: '/salas-tribunal',icon: DoorOpen,  requiredPermissions: [PERMISOS.SALAS_TRIBUNAL_VER]  },
        { name: 'Vocales',          path: '/vocales',       icon: Users,     requiredPermissions: [PERMISOS.VOCALES_VER]         },
        { name: 'Conformaciones',   path: '/conformaciones',icon: Link2,     requiredPermissions: [PERMISOS.CONFORMACIONES_VER]  },
      ],
    },
    {
      name: 'Audiencias', icon: Calendar, type: 'dropdown',
      description: 'Audiencias y actas',
      active: isSubmenuActive(['/audiencias', '/tipos-audiencia', '/salas-audiencia', '/asistencias', '/actas']),
      submenu: [
        { name: 'Audiencias',        path: '/audiencias',      icon: Calendar, requiredPermissions: [PERMISOS.AUDIENCIAS_VER],       badgeKey: 'audienciasHoy'  },
        { name: 'Tipos de Audiencia',path: '/tipos-audiencia', icon: Tag,      requiredPermissions: [PERMISOS.TIPOS_AUDIENCIA_VER]   },
        { name: 'Salas de Audiencia',path: '/salas-audiencia', icon: DoorOpen, requiredPermissions: [PERMISOS.SALAS_AUDIENCIA_VER]   },
        { name: 'Asistencias',       path: '/asistencias',     icon: Users,    requiredPermissions: [PERMISOS.ASISTENCIAS_VER]       },
        { name: 'Actas',             path: '/actas',           icon: FileText, requiredPermissions: [PERMISOS.ACTAS_VER]             },
      ],
    },
    {
      name: 'Participantes', icon: Users, type: 'dropdown',
      description: 'Personas y partes',
      active: isSubmenuActive(['/personas', '/contactos', '/roles-procesales', '/partes']),
      submenu: [
        { name: 'Personas',        path: '/personas',        icon: Users,  requiredPermissions: [PERMISOS.PERSONAS_VER]         },
        { name: 'Contactos',       path: '/contactos',       icon: Phone,  requiredPermissions: [PERMISOS.CONTACTOS_VER]        },
        { name: 'Roles Procesales',path: '/roles-procesales',icon: Shield, requiredPermissions: [PERMISOS.ROLES_PROCESALES_VER] },
        { name: 'Partes',          path: '/partes',          icon: Scale,  requiredPermissions: [PERMISOS.PARTES_PROCESALES_VER]},
        { name: 'Denuncias',        path: '/denuncias',        icon: Users,  requiredPermissions: [PERMISOS.PERSONAS_VER]         },
      ],
    },
    {
      name: 'Documentos', icon: FileText, type: 'dropdown',
      description: 'Gestión documental',
      active: isSubmenuActive(['/documentos', '/tipos-doc', '/notificaciones', '/solicitudes']),
      submenu: [
        { name: 'Documentos',         path: '/documentos',     icon: FileText,    requiredPermissions: [PERMISOS.DOCUMENTOS_VER]       },
        { name: 'Tipos de Documento', path: '/tipos-doc',      icon: Tag,         requiredPermissions: [PERMISOS.TIPOS_DOCUMENTO_VER]  },
        { name: 'Notificaciones',     path: '/notificaciones', icon: Bell,        requiredPermissions: [PERMISOS.NOTIFICACIONES_VER],  badgeKey: 'notifPendientes'       },
        { name: 'Solicitudes',        path: '/solicitudes',    icon: ClipboardList,requiredPermissions: [PERMISOS.SOLICITUDES_VER],    badgeKey: 'solicitudesPendientes' },
      ],
    },
    {
      name: 'Resoluciones', icon: Scale, type: 'dropdown',
      description: 'Resoluciones y recursos',
      active: isSubmenuActive(['/resoluciones', '/tipos-resolucion', '/tipos-recurso', '/recursos']),
      submenu: [
        { name: 'Resoluciones',      path: '/resoluciones',    icon: Scale, requiredPermissions: [PERMISOS.RESOLUCIONES_VER]    },
        { name: 'Tipos de Resolución',path: '/tipos-resolucion',icon: Tag,  requiredPermissions: [PERMISOS.TIPOS_RESOLUCION_VER]},
        { name: 'Tipos de Recurso',  path: '/tipos-recurso',   icon: Tag,  requiredPermissions: [PERMISOS.TIPOS_RECURSO_VER]   },
        { name: 'Recursos',          path: '/recursos',        icon: Gavel,requiredPermissions: [PERMISOS.RECURSOS_VER]        },
         { name: 'Resoluciones Antiguas', path: '/resoluciones-antiguas', icon: Scale, requiredPermissions: [PERMISOS.RESOLUCIONES_VER]    },
      ],
    },
    {
      name: 'Catálogos', icon: Layers, type: 'dropdown',
      description: 'Tablas de configuración',
      active: isSubmenuActive(['/tipos-proceso']),
      submenu: [
        { name: 'Tipos de Proceso', path: '/tipos-proceso', icon: Layers, requiredPermissions: [PERMISOS.TIPOS_PROCESO_VER] },
      ],
    },
    { 
      name: 'Reportes', path: '/reportes', icon: BarChart,
      type: 'link', description: 'Estadísticas',
      requiredPermissions: [PERMISOS.REPORTES_VER],
    },
  ];

  // Filtrar por permisos
  const filtrarPorPermisos = (item: MenuItem): MenuItem | null => {
    if (usuario?.rol === 'Administrador') return item;
    if (item.type === 'link') {
      if (item.requiredPermissions.length > 0 && !item.requiredPermissions.some(p => hasPermission(p))) return null;
      return item;
    }
    if (item.type === 'dropdown') {
      const sub = filtrarSubmenu(item.submenu);
      return sub.length === 0 ? null : { ...item, submenu: sub };
    }
    return null;
  };

  const menuFiltrado = menuItems
    .map(filtrarPorPermisos)
    .filter((item): item is MenuItem => item !== null);

  // Calcular badge total de un dropdown (suma de sus subitems con badge)
  const calcDropdownBadge = (item: MenuItemDropdown): number => {
    return item.submenu.reduce((sum, sub) => {
      const v = sub.badgeKey ? (badgeMap[sub.badgeKey] ?? 0) : 0;
      return sum + v;
    }, 0);
  };

  const handleNavClick = (name: string, path: string) => addToRecent(name, path);

  // Estilos dinámicos
  const bgGradient  = darkMode ? 'from-gray-900 to-gray-800' : 'from-white to-gray-50';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';
  const textColor   = darkMode ? 'text-gray-300' : 'text-gray-600';
  const hoverBg     = darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
  const activeBg    = darkMode ? 'from-blue-600 to-blue-700' : 'from-blue-500 to-blue-600';

  const isDropdown = (item: MenuItem): item is MenuItemDropdown => item.type === 'dropdown';
  const isLink     = (item: MenuItem): item is MenuItemLink     => item.type === 'link';

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-64'} bg-gradient-to-b ${bgGradient} flex flex-col shadow-2xl border-r ${borderColor} transition-all duration-300 ease-in-out z-20 h-full`}>

      {/* ── LOGO ── */}
      <div className={`h-16 flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-5'} border-b ${borderColor} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500 rounded-xl blur-xl opacity-70 animate-pulse" />
          <img
            src="https://i.postimg.cc/BbmCyymq/justicia.png"
            alt="Logo"
            className="w-9 h-9 object-contain rounded-xl relative"
          />
        </div>
        {!collapsed && (
          <div className="flex-1">
            <h1 className={`font-bold text-lg tracking-wide ${darkMode ? 'text-white' : 'text-gray-800'}`}>Tribunal</h1>
            <p className={`text-xs ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Sistema Judicial</p>
          </div>
        )}
        {/* Badge global en modo colapsado */}
        {collapsed && (badges.audienciasHoy + badges.notifPendientes + badges.solicitudesPendientes) > 0 && (
          <div className="absolute top-2 right-2">
            <Badge count={badges.audienciasHoy + badges.notifPendientes + badges.solicitudesPendientes} pulse />
          </div>
        )}
      </div>

      {/* ── FAVORITOS ── */}
      {!collapsed && favorites.length > 0 && (
        <div className={`px-3 py-3 border-b ${borderColor}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-yellow-500" />
              <span className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Favoritos</span>
            </div>
            <button onClick={() => setFavorites([])} className="text-xs text-gray-500 hover:text-red-400">Limpiar</button>
          </div>
          <div className="space-y-1">
            {favorites.map(fav => (
              <NavLink
                key={fav.path} to={fav.path}
                onClick={() => handleNavClick(fav.name, fav.path)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm ${
                    isActive
                      ? darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                      : `${textColor} ${hoverBg}`
                  }`
                }
              >
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span className="flex-1 truncate">{fav.name}</span>
                <button onClick={e => { e.preventDefault(); e.stopPropagation(); removeFromFavorites(fav.path); }}>
                  <X className="w-3 h-3 text-red-400" />
                </button>
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* ── NAVEGACIÓN ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
        <div className="space-y-1">
          {menuFiltrado.map(item => {

            // ── DROPDOWN ──
            if (isDropdown(item)) {
              const isExpanded    = expandedMenu === item.name;
              const dropdownBadge = calcDropdownBadge(item);

              return (
                <div key={item.name} className="mb-1">
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={`group flex items-center justify-between w-full px-3 py-2 rounded-xl transition-all duration-200 ${
                      item.active || isExpanded
                        ? `bg-gradient-to-r ${activeBg} text-white shadow-lg`
                        : `${textColor} ${hoverBg}`
                    }`}
                    title={collapsed ? item.name : ''}
                  >
                    <div className={`flex items-center ${collapsed ? 'justify-center w-full' : 'gap-3'}`}>
                      <item.icon className="w-5 h-5 shrink-0" />
                      {!collapsed && (
                        <div className="flex-1 text-left min-w-0">
                          <span className="text-sm font-medium">{item.name}</span>
                          {item.description && <p className="text-xs opacity-75">{item.description}</p>}
                        </div>
                      )}
                    </div>
                    {!collapsed && (
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Badge del grupo */}
                        {dropdownBadge > 0 && !isExpanded && (
                          <Badge count={dropdownBadge} pulse={item.name === 'Audiencias' && badges.audienciasHoy > 0} />
                        )}
                        <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    )}
                    {/* Badge en modo colapsado */}
                    {collapsed && dropdownBadge > 0 && (
                      <div className="absolute right-1 top-1">
                        <Badge count={dropdownBadge} />
                      </div>
                    )}
                  </button>

                  {/* Submenú */}
                  {!collapsed && isExpanded && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-blue-500/50 pl-3">
                      {item.submenu.map(sub => {
                        const SubIcon    = sub.icon;
                        const subBadge   = sub.badgeKey ? (badgeMap[sub.badgeKey] ?? 0) : 0;
                        const isPulse    = sub.badgeKey === 'audienciasHoy';

                        return (
                          <NavLink
                            key={sub.path} to={sub.path}
                            onClick={() => handleNavClick(sub.name, sub.path)}
                            className={({ isActive }) =>
                              `group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                                isActive
                                  ? darkMode ? 'text-blue-400 bg-gray-700' : 'text-blue-600 bg-gray-100'
                                  : `${textColor} ${hoverBg}`
                              }`
                            }
                          >
                            <SubIcon className="w-3.5 h-3.5 shrink-0" />
                            <span className="flex-1">{sub.name}</span>

                            {/* Badge del subítem */}
                            {subBadge > 0 && (
                              <Badge count={subBadge} pulse={isPulse} />
                            )}

                            <button
                              onClick={e => { e.preventDefault(); e.stopPropagation(); addToFavorites(sub.name, sub.path); }}
                              className="opacity-0 group-hover:opacity-100 ml-1"
                            >
                              <Star className="w-3 h-3 text-yellow-500" />
                            </button>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // ── LINK ──
            if (isLink(item)) {
              const linkBadge = item.badgeKey ? (badgeMap[item.badgeKey] ?? 0) : 0;
              return (
                <NavLink
                  key={item.name} to={item.path}
                  end={item.path === '/dashboard'}
                  onClick={() => handleNavClick(item.name, item.path)}
                  className={({ isActive }) =>
                    `group flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition-all duration-200 ${
                      isActive
                        ? `bg-gradient-to-r ${activeBg} text-white shadow-lg`
                        : `${textColor} ${hoverBg}`
                    }`
                  }
                  title={collapsed ? item.name : ''}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!collapsed && (
                    <>
                      <div className="flex-1 text-left min-w-0">
                        <span className="text-sm font-medium">{item.name}</span>
                        {item.description && <p className="text-xs opacity-75">{item.description}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {linkBadge > 0 && <Badge count={linkBadge} />}
                        {location.pathname === item.path && (
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                        )}
                        <button
                          onClick={e => { e.preventDefault(); e.stopPropagation(); addToFavorites(item.name, item.path); }}
                          className="opacity-0 group-hover:opacity-100"
                        >
                          <Star className="w-3.5 h-3.5 text-yellow-500" />
                        </button>
                      </div>
                    </>
                  )}
                </NavLink>
              );
            }

            return null;
          })}
        </div>
      </nav>

      {/* ── RESUMEN RÁPIDO (solo expandido) ── */}
      {!collapsed && (badges.audienciasHoy + badges.notifPendientes + badges.solicitudesPendientes) > 0 && (
        <div className={`px-3 py-3 border-t ${borderColor}`}>
          <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Pendientes
          </p>
          <div className="space-y-1.5">
            {badges.audienciasHoy > 0 && (
              <div className="flex items-center justify-between">
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-1.5`}>
                  <Calendar className="w-3 h-3 text-blue-400" />
                  Audiencias hoy
                </span>
                <span className="text-xs font-bold text-blue-400">{badges.audienciasHoy}</span>
              </div>
            )}
            {badges.notifPendientes > 0 && (
              <div className="flex items-center justify-between">
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-1.5`}>
                  <Bell className="w-3 h-3 text-amber-400" />
                  Notificaciones
                </span>
                <span className="text-xs font-bold text-amber-400">{badges.notifPendientes}</span>
              </div>
            )}
            {badges.solicitudesPendientes > 0 && (
              <div className="flex items-center justify-between">
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-1.5`}>
                  <ClipboardList className="w-3 h-3 text-purple-400" />
                  Solicitudes
                </span>
                <span className="text-xs font-bold text-purple-400">{badges.solicitudesPendientes}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CERRAR SESIÓN ── */}
      <div className={`p-3 border-t ${borderColor}`}>
        <button
          onClick={handleLogout}
          className={`group flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 w-full rounded-xl transition-all duration-200 ${
            darkMode ? 'text-gray-400 hover:bg-red-500/10 hover:text-red-500' : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
          }`}
          title={collapsed ? 'Cerrar Sesión' : ''}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="text-sm font-medium">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
}