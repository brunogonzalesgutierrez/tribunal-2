import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { useAuth } from '../context/AuthContext';
import {
  // Flujo procesal
  FileText, Folder, Calendar, Bell, Scale, Users,
  BarChart, ClipboardList,
  // Administración
  Building2, ShieldCheck, List,
  // Comunes
  LogOut, ChevronRight, Gavel,
  // Submenús
  History, Tag, DoorOpen, Link2, Phone,
  Key, Shield, Flag, Layers,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { PERMISOS } from '../config/permisos';

// ─────────────────────────────────────────────
// Query de badges
// ─────────────────────────────────────────────
const GET_BADGES = gql`
  query GetSidebarBadges {
    allAudiencias {
      idAudiencia
      estadoAudiencia
      fechaHoraProgramada
      idExpediente {
        idSala { idSala }
      }
    }
    allExpedientes {
      idExpediente
      idEstadoExpediente { esTerminal }
      idSala { idSala }
    }
    allNotificaciones {
      idNotificacion
      estadoNotificacion
      idExpediente {
        idSala { idSala }
      }
    }
    allSolicitudes {
      idSolicitud
      estadoSolicitud
    }
  }
`;

// ─────────────────────────────────────────────
// Hook de badges
// ─────────────────────────────────────────────
function useSidebarBadges(salaId: number | null | undefined, esAdmin: boolean) {
  const { data } = useQuery(GET_BADGES, {
    fetchPolicy: 'cache-and-network',
    pollInterval: 60000,
  });

  const esHoy = (fechaStr: string) => {
    if (!fechaStr) return false;
    const f = new Date(fechaStr);
    const h = new Date();
    return (
      f.getDate() === h.getDate() &&
      f.getMonth() === h.getMonth() &&
      f.getFullYear() === h.getFullYear()
    );
  };

  let audiencias  = data?.allAudiencias    ?? [];
  let expedientes = data?.allExpedientes   ?? [];
  let notifs      = data?.allNotificaciones ?? [];
  let solicitudes = data?.allSolicitudes   ?? [];

  if (!esAdmin && salaId) {
    const sid = Number(salaId);
    audiencias  = audiencias.filter((a: any)  => Number(a.idExpediente?.idSala?.idSala) === sid);
    expedientes = expedientes.filter((e: any) => Number(e.idSala?.idSala) === sid);
    notifs      = notifs.filter((n: any)      => Number(n.idExpediente?.idSala?.idSala) === sid);
  }

  return {
    audienciasHoy:         audiencias.filter((a: any) => a.estadoAudiencia === 'PROGRAMADA' && esHoy(a.fechaHoraProgramada)).length,
    expedientesActivos:    expedientes.filter((e: any) => !e.idEstadoExpediente?.esTerminal).length,
    notifPendientes:       notifs.filter((n: any) => n.estadoNotificacion === 'PENDIENTE').length,
    solicitudesPendientes: solicitudes.filter((s: any) => s.estadoSolicitud === 'PENDIENTE').length,
    denunciasPendientes:   0,
  };
}

// ─────────────────────────────────────────────
// Badge visual
// ─────────────────────────────────────────────
function Badge({ count, pulse = false }: { count: number; pulse?: boolean }) {
  if (count === 0) return null;
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white bg-red-500 shadow-sm shadow-red-500/40 ${
        pulse ? 'animate-pulse' : ''
      }`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────
interface SubmenuItem {
  name: string;
  path: string;
  icon: LucideIcon;
  requiredPermissions: string[];
  badgeKey?: string;
}

interface MenuItemLink {
  type: 'link';
  name: string;
  path: string;
  icon: LucideIcon;
  description?: string;
  requiredPermissions: string[];
  badgeKey?: string;
}

interface MenuItemDropdown {
  type: 'dropdown';
  name: string;
  icon: LucideIcon;
  description?: string;
  submenu: SubmenuItem[];
}

interface MenuItemDivider {
  type: 'divider';
  label: string;
}

type MenuItem = MenuItemLink | MenuItemDropdown | MenuItemDivider;

interface SidebarProps {
  collapsed?: boolean;
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
export default function Sidebar({ collapsed = false }: SidebarProps) {
  const { logout, hasPermission, usuario } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const salaId  = usuario?.salaAsignadaId;
  const esAdmin = usuario?.rol === 'Administrador';
  const badges  = useSidebarBadges(salaId, esAdmin);

  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const handleLogout = () => { logout(); navigate('/'); };

  const toggleMenu = (menu: string) => {
    if (!collapsed) setExpandedMenu(expandedMenu === menu ? null : menu);
  };

  const isSubmenuActive = (paths: string[]) =>
    paths.some(p => location.pathname === p);

  const filtrarSubmenu = (submenu: SubmenuItem[]) =>
    submenu.filter(sub =>
      sub.requiredPermissions.length === 0 ||
      sub.requiredPermissions.some(p => hasPermission(p))
    );

  // Mapa de badges por clave
  const badgeMap: Record<string, number> = {
    audienciasHoy:         badges.audienciasHoy,
    expedientesActivos:    badges.expedientesActivos,
    notifPendientes:       badges.notifPendientes,
    solicitudesPendientes: badges.solicitudesPendientes,
    denunciasPendientes:   0,
    documentosPendientes:  badges.notifPendientes + badges.solicitudesPendientes,
  };

  // ── MENÚ ────────────────────────────────────
  //
  // Organizado en dos secciones:
  //   1. FLUJO PROCESAL   — lo que el secretario/vocal usa a diario
  //   2. ADMINISTRACIÓN   — configuración, solo admin/adminSala
  //
  const menuItems: MenuItem[] = [
    // ── Dashboard ──────────────────────────────
    {
      type: 'link',
      name: 'Dashboard',
      path: '/dashboard',
      icon: BarChart,
      requiredPermissions: [],
    },

    // ── Separador: Flujo procesal ───────────────
    { type: 'divider', label: 'Flujo procesal' },

    // ── Denuncias (Art. 54–58 ICU 048-2018) ────
    {
      type: 'dropdown',
      name: 'Denuncias',
      icon: FileText,
      description: 'Ingreso y seguimiento de denuncias',
      // POR ESTO:
      submenu: [
        {
          name: 'Lista de denuncias',
          path: '/denuncias',
          icon: FileText,
          requiredPermissions: [PERMISOS.DENUNCIAS_VER],
          badgeKey: 'denunciasPendientes',
        },
      ],
    },

    // ── Expedientes (Art. 9, 60, 74 ICU 048-2018) ──
    {
      type: 'dropdown',
      name: 'Expedientes',
      icon: Folder,
      description: 'Gestión central de expedientes',
      submenu: [
        {
          name: 'Lista de expedientes',
          path: '/expedientes',
          icon: Folder,
          requiredPermissions: [PERMISOS.EXPEDIENTES_VER],
          badgeKey: 'expedientesActivos',
        },
        {
          name: 'Actuaciones',
          path: '/actuaciones',
          icon: ClipboardList,
          requiredPermissions: [PERMISOS.ACTUACIONES_VER],
        },
        {
          name: 'Historial de estados',
          path: '/historial',
          icon: History,
          requiredPermissions: [PERMISOS.HISTORIAL_ESTADOS_VER],
        },
      ],
    },

    // ── Audiencias (Art. 58, 60, 67–73 ICU 048-2018) ──
    {
      type: 'dropdown',
      name: 'Audiencias',
      icon: Calendar,
      description: 'Programación y actas de audiencias',
      submenu: [
        {
          name: 'Lista de audiencias',
          path: '/audiencias',
          icon: Calendar,
          requiredPermissions: [PERMISOS.AUDIENCIAS_VER],
          badgeKey: 'audienciasHoy',
        },
        {
          name: 'Asistencias',
          path: '/asistencias',
          icon: Users,
          requiredPermissions: [PERMISOS.ASISTENCIAS_VER],
        },
        {
          name: 'Actas',
          path: '/actas',
          icon: FileText,
          requiredPermissions: [PERMISOS.ACTAS_VER],
        },
      ],
    },

    // ── Notificaciones & Documentos (Art. 44–48 ICU 048-2018) ──
    {
      type: 'dropdown',
      name: 'Notificaciones',
      icon: Bell,
      description: 'Citaciones, notificaciones y documentos',
      submenu: [
        {
          name: 'Notificaciones',
          path: '/notificaciones',
          icon: Bell,
          requiredPermissions: [PERMISOS.NOTIFICACIONES_VER],
          badgeKey: 'notifPendientes',
        },
        {
          name: 'Solicitudes',
          path: '/solicitudes',
          icon: ClipboardList,
          requiredPermissions: [PERMISOS.SOLICITUDES_VER],
          badgeKey: 'solicitudesPendientes',
        },
        {
          name: 'Documentos',
          path: '/documentos',
          icon: FileText,
          requiredPermissions: [PERMISOS.DOCUMENTOS_VER],
        },
      ],
    },

    // ── Resoluciones & Recursos (Art. 75, 82–86 ICU 048-2018) ──
    // ── Resoluciones & Recursos (Art. 75, 82–86 ICU 048-2018) ──
    {
      type: 'dropdown',
      name: 'Resoluciones',
      icon: Scale,
      description: 'Resoluciones y recursos de apelación',
      submenu: [
        {
          name: 'Resoluciones',
          path: '/resoluciones',
          icon: Scale,
          requiredPermissions: [PERMISOS.RESOLUCIONES_VER],
        },
        {
          name: 'Resoluciones antiguas',
          path: '/resoluciones-antiguas',
          icon: History,
          requiredPermissions: [PERMISOS.RESOLUCIONES_VER],
        },
        {
          name: 'Recursos de apelación',
          path: '/recursos',
          icon: Gavel,
          requiredPermissions: [PERMISOS.RECURSOS_VER],
        },
      ],
    },

    // ── Personas y partes procesales ────────────
    {
      type: 'dropdown',
      name: 'Personas y partes',
      icon: Users,
      description: 'Denunciantes, denunciados y partes',
      submenu: [
        {
          name: 'Personas',
          path: '/personas',
          icon: Users,
          requiredPermissions: [PERMISOS.PERSONAS_VER],
        },
        {
          name: 'Contactos',
          path: '/contactos',
          icon: Phone,
          requiredPermissions: [PERMISOS.CONTACTOS_VER],
        },
        {
          name: 'Partes procesales',
          path: '/partes',
          icon: Scale,
          requiredPermissions: [PERMISOS.PARTES_PROCESALES_VER],
        },
      ],
    },

    // ── Reportes ────────────────────────────────
    {
      type: 'link',
      name: 'Reportes',
      path: '/reportes',
      icon: BarChart,
      requiredPermissions: [PERMISOS.REPORTES_VER],
    },

    // ── Separador: Administración ───────────────
    { type: 'divider', label: 'Administración' },

    // ── Tribunal y salas ────────────────────────
    {
      type: 'dropdown',
      name: 'Tribunal y salas',
      icon: Building2,
      description: 'Estructura del tribunal',
      submenu: [
        {
          name: 'Tribunales',
          path: '/tribunales',
          icon: Building2,
          requiredPermissions: [PERMISOS.TRIBUNALES_VER],
        },
        {
          name: 'Salas de tribunal',
          path: '/salas-tribunal',
          icon: DoorOpen,
          requiredPermissions: [PERMISOS.SALAS_TRIBUNAL_VER],
        },
        {
          name: 'Salas de audiencia',
          path: '/salas-audiencia',
          icon: DoorOpen,
          requiredPermissions: [PERMISOS.SALAS_AUDIENCIA_VER],
        },
        {
          name: 'Vocales',
          path: '/vocales',
          icon: Users,
          requiredPermissions: [PERMISOS.VOCALES_VER],
        },
        {
          name: 'Conformaciones',
          path: '/conformaciones',
          icon: Link2,
          requiredPermissions: [PERMISOS.CONFORMACIONES_VER],
        },
      ],
    },

    // ── Seguridad ───────────────────────────────
    {
      type: 'dropdown',
      name: 'Seguridad',
      icon: ShieldCheck,
      description: 'Usuarios, roles y permisos',
      submenu: [
        {
          name: 'Usuarios',
          path: '/usuarios',
          icon: Users,
          requiredPermissions: [PERMISOS.USUARIOS_VER],
        },
        {
          name: 'Roles',
          path: '/roles',
          icon: Shield,
          requiredPermissions: [PERMISOS.ROLES_VER],
        },
        {
          name: 'Permisos',
          path: '/permisos',
          icon: Key,
          requiredPermissions: [PERMISOS.PERMISOS_VER],
        },
      ],
    },

    // ── Catálogos (solo admin, no operativo) ───
    {
      type: 'dropdown',
      name: 'Catálogos',
      icon: Layers,
      description: 'Tablas de configuración del sistema',
      submenu: [
        {
          name: 'Tipos de proceso',
          path: '/tipos-proceso',
          icon: List,
          requiredPermissions: [PERMISOS.TIPOS_PROCESO_VER],
        },
        {
          name: 'Tipos de actuación',
          path: '/tipos-actuacion',
          icon: List,
          requiredPermissions: [PERMISOS.TIPOS_ACTUACION_VER],
        },
        {
          name: 'Tipos de audiencia',
          path: '/tipos-audiencia',
          icon: List,
          requiredPermissions: [PERMISOS.TIPOS_AUDIENCIA_VER],
        },
        {
          name: 'Tipos de documento',
          path: '/tipos-doc',
          icon: List,
          requiredPermissions: [PERMISOS.TIPOS_DOCUMENTO_VER],
        },
        {
          name: 'Tipos de resolución',
          path: '/tipos-resolucion',
          icon: List,
          requiredPermissions: [PERMISOS.TIPOS_RESOLUCION_VER],
        },
        {
          name: 'Tipos de recurso',
          path: '/tipos-recurso',
          icon: List,
          requiredPermissions: [PERMISOS.TIPOS_RECURSO_VER],
        },
        {
          name: 'Estados de expediente',
          path: '/estados-expediente',
          icon: Flag,
          requiredPermissions: [PERMISOS.ESTADOS_EXPEDIENTE_VER],
        },
        {
          name: 'Roles procesales',
          path: '/roles-procesales',
          icon: Shield,
          requiredPermissions: [PERMISOS.ROLES_PROCESALES_VER],
        },
      ],
    },
  ];

  // ── Filtrado por permisos ────────────────────
  const puedeVerItem = (item: MenuItem): MenuItem | null => {
    if (item.type === 'divider') return item;

    if (esAdmin) return item;

    if (item.type === 'link') {
      if (
        item.requiredPermissions.length > 0 &&
        !item.requiredPermissions.some(p => hasPermission(p))
      )
        return null;
      return item;
    }

    if (item.type === 'dropdown') {
      const sub = filtrarSubmenu(item.submenu);
      return sub.length === 0 ? null : { ...item, submenu: sub };
    }

    return null;
  };

  const menuFiltrado = menuItems
    .map(puedeVerItem)
    .filter((item): item is MenuItem => item !== null)
    // Quitar dividers huérfanos (si todos los ítems de esa sección fueron filtrados)
    .filter((item, idx, arr) => {
      if (item.type !== 'divider') return true;
      const next = arr[idx + 1];
      return next && next.type !== 'divider';
    });

  // Badge total de un dropdown
  const calcDropdownBadge = (item: MenuItemDropdown): number =>
    item.submenu.reduce((sum, sub) => sum + (sub.badgeKey ? (badgeMap[sub.badgeKey] ?? 0) : 0), 0);

  const isDropdown = (i: MenuItem): i is MenuItemDropdown => i.type === 'dropdown';
  const isLink     = (i: MenuItem): i is MenuItemLink     => i.type === 'link';
  const isDivider  = (i: MenuItem): i is MenuItemDivider  => i.type === 'divider';

  // ── Badge global para modo colapsado ────────
  const badgeGlobal =
    badges.audienciasHoy +
    badges.notifPendientes +
    badges.solicitudesPendientes +
    badges.denunciasPendientes;

  return (
    <aside
      className={`${
        collapsed ? 'w-16' : 'w-56'
      } bg-white flex flex-col border-r border-gray-200 transition-all duration-300 ease-in-out z-20 h-full`}
    >
      {/* ── LOGO ── */}
      <div
        className={`h-16 flex items-center ${
          collapsed ? 'justify-center' : 'gap-3 px-5'
        } border-b border-gray-100 relative`}
      >
        <img
          src="https://i.postimg.cc/BbmCyymq/justicia.png"
          alt="Logo"
          className="w-9 h-9 object-contain rounded-xl relative flex-shrink-0"
        />
        {!collapsed && (
          <div className="flex-1">
            <h1 className="font-bold text-lg tracking-wide text-gray-900">Tribunal</h1>
            <p className="text-xs text-gray-400">Sistema Judicial</p>
          </div>
        )}
        {collapsed && badgeGlobal > 0 && (
          <div className="absolute top-2 right-2">
            <Badge count={badgeGlobal} pulse />
          </div>
        )}
      </div>

      {/* ── NAVEGACIÓN ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 custom-scrollbar">
        <div className="space-y-0.5">
          {menuFiltrado.map((item, idx) => {

            // ── DIVIDER ──
            if (isDivider(item)) {
              if (collapsed) return <div key={idx} className="my-2 border-t border-gray-100" />;
              return (
                <div key={idx} className="pt-3 pb-1 px-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    {item.label}
                  </p>
                </div>
              );
            }

            // ── DROPDOWN ──
            if (isDropdown(item)) {
              const isExpanded    = expandedMenu === item.name;
              const dropdownBadge = calcDropdownBadge(item);
              const anySubActive  = item.submenu.some(s => location.pathname === s.path);

              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggleMenu(item.name)}
                    title={collapsed ? item.name : undefined}
                    className={`group flex items-center justify-between w-full px-3 py-2 rounded-xl transition-all duration-150 ${
                      anySubActive || isExpanded
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                  >
                    <div className={`flex items-center ${collapsed ? 'justify-center w-full' : 'gap-3'}`}>
                      <item.icon className="w-5 h-5 shrink-0" />
                      {!collapsed && (
                        <span className="flex-1 text-left text-sm font-medium">{item.name}</span>
                      )}
                    </div>
                    {!collapsed && (
                      <div className="flex items-center gap-2 shrink-0">
                        {dropdownBadge > 0 && !isExpanded && (
                          <Badge
                            count={dropdownBadge}
                            pulse={item.name === 'Audiencias' && badges.audienciasHoy > 0}
                          />
                        )}
                        <ChevronRight
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </div>
                    )}
                    {collapsed && dropdownBadge > 0 && (
                      <span className="absolute right-1 top-1">
                        <Badge count={dropdownBadge} />
                      </span>
                    )}
                  </button>

                  {/* Submenú */}
                  {!collapsed && isExpanded && (
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-gray-100 pl-3">
                      {item.submenu.map(sub => {
                        const SubIcon  = sub.icon;
                        const subBadge = sub.badgeKey ? (badgeMap[sub.badgeKey] ?? 0) : 0;
                        const isPulse  = sub.badgeKey === 'audienciasHoy';

                        return (
                          <NavLink
                            key={sub.path}
                            to={sub.path}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                                isActive
                                  ? 'bg-gray-100 text-gray-900 font-medium'
                                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                              }`
                            }
                          >
                            <SubIcon className="w-3.5 h-3.5 shrink-0" />
                            <span className="flex-1">{sub.name}</span>
                            {subBadge > 0 && <Badge count={subBadge} pulse={isPulse} />}
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
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  title={collapsed ? item.name : undefined}
                  className={({ isActive }) =>
                    `flex items-center ${
                      collapsed ? 'justify-center' : 'gap-3'
                    } px-3 py-2 rounded-xl transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!collapsed && (
                    <span className="flex-1 text-sm font-medium">{item.name}</span>
                  )}
                </NavLink>
              );
            }

            return null;
          })}
        </div>
      </nav>

      {/* ── RESUMEN RÁPIDO DE PENDIENTES (solo expandido) ── */}
      {!collapsed && badgeGlobal > 0 && (
        <div className="px-3 py-3 border-t border-gray-100 space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
            Pendientes
          </p>
          {badges.denunciasPendientes > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-red-500" /> Denuncias nuevas
              </span>
              <span className="font-bold text-red-600">{badges.denunciasPendientes}</span>
            </div>
          )}
          {badges.audienciasHoy > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-blue-500" /> Audiencias hoy
              </span>
              <span className="font-bold text-blue-600">{badges.audienciasHoy}</span>
            </div>
          )}
          {badges.notifPendientes > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 flex items-center gap-1.5">
                <Bell className="w-3 h-3 text-amber-500" /> Notificaciones
              </span>
              <span className="font-bold text-amber-600">{badges.notifPendientes}</span>
            </div>
          )}
          {badges.solicitudesPendientes > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 flex items-center gap-1.5">
                <ClipboardList className="w-3 h-3 text-purple-500" /> Solicitudes
              </span>
              <span className="font-bold text-purple-600">{badges.solicitudesPendientes}</span>
            </div>
          )}
        </div>
      )}

      {/* ── CERRAR SESIÓN ── */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          title={collapsed ? 'Cerrar Sesión' : undefined}
          className={`flex items-center ${
            collapsed ? 'justify-center' : 'gap-3'
          } px-3 py-2 w-full rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150`}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="text-sm font-medium">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
}