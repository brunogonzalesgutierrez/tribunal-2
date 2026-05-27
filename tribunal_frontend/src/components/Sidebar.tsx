import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Gavel, ChevronRight,
  Folder, FileText, ListChecks,
  BarChart, Users, Calendar, Scale,
  LayoutDashboard, Building,
  ShieldCheck, Key, Shield,
  X, Star, TrendingUp, Clock, LogOut,
  History, ClipboardList, DoorOpen, Tag, Bell, Phone, Building2, Link2
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { PERMISOS } from '../config/permisos';

// Definir los tipos de los items del menú
interface SubmenuItem {
  name: string;
  path: string;
  icon: LucideIcon;
  requiredPermissions?: string[];
}

interface MenuItemLink {
  name: string;
  path: string;
  icon: LucideIcon;
  type: 'link';
  description?: string;
  requiredPermissions?: string[];
}

interface MenuItemDropdown {
  name: string;
  icon: LucideIcon;
  type: 'dropdown';
  description?: string;
  active?: boolean;
  submenu: SubmenuItem[];
  requiredPermissions?: string[];
}

type MenuItem = MenuItemLink | MenuItemDropdown;

interface SidebarProps {
  collapsed?: boolean;
  darkMode?: boolean;
}

export default function Sidebar({ collapsed = false, darkMode = true }: SidebarProps) {
  const { logout, hasPermission, usuario } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Array<{name: string, path: string}>>([]);
  const [recentItems, setRecentItems] = useState<Array<{name: string, path: string, timestamp: number}>>([]);
  const [showRecent, setShowRecent] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Cargar datos al iniciar
  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem('sidebarFavorites');
      const savedRecent = localStorage.getItem('sidebarRecent');
      const savedShowRecent = localStorage.getItem('sidebarShowRecent');
      
      if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
      if (savedRecent) setRecentItems(JSON.parse(savedRecent));
      if (savedShowRecent !== null) setShowRecent(JSON.parse(savedShowRecent));
    } catch (error) {
      console.error('Error loading sidebar data:', error);
    }
  }, []);

  // Guardar cambios
  useEffect(() => {
    localStorage.setItem('sidebarShowRecent', JSON.stringify(showRecent));
  }, [showRecent]);

  useEffect(() => {
    localStorage.setItem('sidebarFavorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('sidebarRecent', JSON.stringify(recentItems));
  }, [recentItems]);

  const toggleMenu = (menu: string) => {
    if (!collapsed) {
      setExpandedMenu(expandedMenu === menu ? null : menu);
    }
  };

  const isSubmenuActive = (paths: string[]): boolean => {
    return paths.some(path => location.pathname === path);
  };

  const addToFavorites = (itemName: string, itemPath: string) => {
    if (!favorites.some(f => f.path === itemPath)) {
      setFavorites([...favorites, { name: itemName, path: itemPath }]);
    }
  };

  const removeFromFavorites = (itemPath: string) => {
    setFavorites(favorites.filter(f => f.path !== itemPath));
  };

  const addToRecent = (itemName: string, itemPath: string) => {
    const newRecent = { name: itemName, path: itemPath, timestamp: Date.now() };
    const filtered = recentItems.filter(r => r.path !== itemPath);
    const newRecents = [newRecent, ...filtered].slice(0, 5);
    setRecentItems(newRecents);
  };

  const clearRecents = () => {
    setRecentItems([]);
  };

  // ✅ Menú completo con permisos requeridos
  const menuItems: MenuItem[] = [
    { 
      name: 'Dashboard', 
      path: '/dashboard', 
      icon: LayoutDashboard, 
      type: 'link', 
      description: 'Vista principal',
      requiredPermissions: [] 
    },
    { 
      name: 'Seguridad', 
      icon: ShieldCheck, 
      type: 'dropdown', 
      description: 'Usuarios y permisos',
      requiredPermissions: [PERMISOS.USR_GEST, PERMISOS.ROL_GEST],
      active: isSubmenuActive(['/usuarios', '/roles', '/permisos']),
      submenu: [
        { name: 'Usuarios', path: '/usuarios', icon: Users, requiredPermissions: [PERMISOS.USR_GEST] },
        { name: 'Roles', path: '/roles', icon: Shield, requiredPermissions: [PERMISOS.ROL_GEST] },
        { name: 'Permisos', path: '/permisos', icon: Key, requiredPermissions: [PERMISOS.ROL_GEST] }
      ] 
    },
    { 
      name: 'Expedientes', 
      icon: Folder,
      type: 'dropdown', 
      description: 'Gestión de expedientes',
      requiredPermissions: [PERMISOS.EXP_VER],
      active: isSubmenuActive(['/expedientes', '/historial', '/actuaciones']),
      submenu: [
        { name: 'Lista de Expedientes', path: '/expedientes', icon: Folder, requiredPermissions: [PERMISOS.EXP_VER] },
        { name: 'Historial de Estados', path: '/historial', icon: History, requiredPermissions: [PERMISOS.EXP_VER] },
        { name: 'Actuaciones', path: '/actuaciones', icon: FileText, requiredPermissions: [PERMISOS.EXP_VER] }
      ] 
    },
    {
      name: 'Tribunal',
      icon: Building2,
      type: 'dropdown',
      description: 'Tribunales y salas',
      requiredPermissions: [PERMISOS.EXP_VER],
      active: isSubmenuActive(['/tribunales', '/salas-tribunal', '/vocales', '/conformaciones']),
      submenu: [
        { name: 'Tribunales', path: '/tribunales', icon: Building2, requiredPermissions: [PERMISOS.EXP_VER] },
        { name: 'Salas', path: '/salas-tribunal', icon: DoorOpen, requiredPermissions: [PERMISOS.EXP_VER] },
        { name: 'Vocales', path: '/vocales', icon: Users, requiredPermissions: [PERMISOS.EXP_VER] },
        { name: 'Conformaciones', path: '/conformaciones', icon: Link2, requiredPermissions: [PERMISOS.EXP_VER] },
      ],
    },
    {
      name: 'Audiencias',
      icon: Scale,
      type: 'dropdown',
      description: 'Audiencias y actas',
      requiredPermissions: [PERMISOS.AUD_VER],
      active: isSubmenuActive(['/audiencias', '/tipos-audiencia', '/salas-audiencia', '/asistencias', '/actas']),
      submenu: [
        { name: 'Lista de Audiencias', path: '/audiencias', icon: Scale, requiredPermissions: [PERMISOS.AUD_VER] },
        { name: 'Tipos de Audiencia', path: '/tipos-audiencia', icon: ClipboardList, requiredPermissions: [PERMISOS.AUD_GEST] },
        { name: 'Salas', path: '/salas-audiencia', icon: DoorOpen, requiredPermissions: [PERMISOS.AUD_GEST] },
        { name: 'Asistencias', path: '/asistencias', icon: Users, requiredPermissions: [PERMISOS.AUD_VER] },
        { name: 'Actas', path: '/actas', icon: FileText, requiredPermissions: [PERMISOS.AUD_GEST] },
      ]
    },
    {
      name: 'Participantes',
      icon: Users,
      type: 'dropdown',
      description: 'Personas y partes',
      requiredPermissions: [PERMISOS.PER_GEST],
      active: isSubmenuActive(['/personas', '/contactos', '/roles-procesales', '/partes']),
      submenu: [
        { name: 'Lista de Personas', path: '/personas', icon: Users, requiredPermissions: [PERMISOS.PER_GEST] },
        { name: 'Contactos', path: '/contactos', icon: Phone, requiredPermissions: [PERMISOS.PER_GEST] },
        { name: 'Roles Procesales', path: '/roles-procesales', icon: Shield, requiredPermissions: [PERMISOS.PER_GEST] },
        { name: 'Partes', path: '/partes', icon: Scale, requiredPermissions: [PERMISOS.PER_GEST] },
      ],
    },
    {
      name: 'Documentos',
      icon: FileText,
      type: 'dropdown',
      description: 'Gestión documental',
      requiredPermissions: [PERMISOS.DOC_VER],
      active: isSubmenuActive(['/documentos', '/tipos-doc', '/notificaciones', '/solicitudes']),
      submenu: [
        { name: 'Lista de Documentos', path: '/documentos', icon: FileText, requiredPermissions: [PERMISOS.DOC_VER] },
        { name: 'Tipos de documento', path: '/tipos-doc', icon: Tag, requiredPermissions: [PERMISOS.DOC_SUBIR] },
        { name: 'Notificaciones', path: '/notificaciones', icon: Bell, requiredPermissions: [PERMISOS.NOT_VER] },
        { name: 'Solicitudes', path: '/solicitudes', icon: ClipboardList, requiredPermissions: [PERMISOS.DOC_VER] },
      ],
    },
    {
      name: 'Resoluciones',
      icon: Scale,
      type: 'dropdown',
      description: 'Resoluciones y recursos',
      requiredPermissions: [PERMISOS.RES_VER],
      active: isSubmenuActive(['/resoluciones', '/tipos-resolucion', '/tipos-recurso', '/recursos']),
      submenu: [
        { name: 'Lista de Resoluciones', path: '/resoluciones', icon: Scale, requiredPermissions: [PERMISOS.RES_VER] },
        { name: 'Tipos de resolución', path: '/tipos-resolucion', icon: FileText, requiredPermissions: [PERMISOS.RES_CREAR] },
        { name: 'Tipos de recurso', path: '/tipos-recurso', icon: ClipboardList, requiredPermissions: [PERMISOS.RES_CREAR] },
        { name: 'Recursos', path: '/recursos', icon: Gavel, requiredPermissions: [PERMISOS.RES_VER] },
      ],
    },
    { 
      name: 'Reportes', 
      path: '/reportes', 
      icon: BarChart, 
      type: 'link', 
      description: 'Estadísticas',
      requiredPermissions: [PERMISOS.EXP_VER] 
    },
  ];

  // ✅ Filtrar menús según permisos del usuario
  const filtrarPorPermisos = (item: MenuItem): boolean => {
    // Administrador ve todo
    if (usuario?.rol === "Administrador") return true;
    
    // Si no tiene permisos requeridos, no mostrar
    if (item.requiredPermissions && item.requiredPermissions.length > 0) {
      const tienePermiso = item.requiredPermissions.some(p => hasPermission(p));
      if (!tienePermiso) return false;
    }
    
    // Para dropdowns, filtrar también sus submenús
    if (item.type === 'dropdown' && item.submenu) {
      const submenuFiltrado = item.submenu.filter(sub => {
        if (!sub.requiredPermissions || sub.requiredPermissions.length === 0) return true;
        return sub.requiredPermissions.some(p => hasPermission(p));
      });
      // Si no quedan submenús, no mostrar el dropdown
      if (submenuFiltrado.length === 0) return false;
      // Actualizar submenu filtrado
      item.submenu = submenuFiltrado;
    }
    
    return true;
  };

  const menuItemsFiltrados = menuItems.filter(filtrarPorPermisos);

  const handleNavClick = (itemName: string, itemPath: string) => {
    addToRecent(itemName, itemPath);
  };

  const bgGradient = darkMode ? 'from-gray-900 to-gray-800' : 'from-white to-gray-50';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';
  const textColor = darkMode ? 'text-gray-300' : 'text-gray-600';
  const hoverBg = darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
  const activeBg = darkMode ? 'from-blue-600 to-blue-700' : 'from-blue-500 to-blue-600';

  // Función para verificar si un item es dropdown
  const isDropdown = (item: MenuItem): item is MenuItemDropdown => {
    return item.type === 'dropdown';
  };

  // Función para verificar si un item es link
  const isLink = (item: MenuItem): item is MenuItemLink => {
    return item.type === 'link';
  };

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-64'} bg-gradient-to-b ${bgGradient} flex flex-col shadow-2xl border-r ${borderColor} transition-all duration-300 ease-in-out z-20 h-full`}>
      
      {/* Logo */}
      <div className={`h-16 flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-5'} border-b ${borderColor} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500 rounded-xl blur-xl opacity-70 animate-pulse"></div>
          <img
            src="https://i.postimg.cc/BbmCyymq/justicia.png"
            alt="Logo"
            className="w-9 h-9 object-contain rounded-xl"
          />
        </div>
        {!collapsed && (
          <div className="flex-1">
            <h1 className={`font-bold text-lg tracking-wide ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Tribunal
            </h1>
            <p className={`text-xs ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              Sistema Judicial
            </p>
          </div>
        )}
      </div>

      {/* Favoritos */}
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
            {favorites.map((fav) => (
              <NavLink key={fav.path} to={fav.path} onClick={() => handleNavClick(fav.name, fav.path)} className={({ isActive }) => `flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm ${isActive ? (darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600') : `${textColor} ${hoverBg}`}`}>
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span className="flex-1 truncate">{fav.name}</span>
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFromFavorites(fav.path); }} className="opacity-0 group-hover:opacity-100"><X className="w-3 h-3 text-red-400" /></button>
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* Menú de navegación - usando menuItemsFiltrados */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
        <div className="space-y-1">
          {menuItemsFiltrados.map((item) => {
            // Si es un dropdown
            if (isDropdown(item)) {
              const isExpanded = expandedMenu === item.name;
              return (
                <div key={item.name} className="mb-1">
                  <button 
                    onClick={() => toggleMenu(item.name)} 
                    className={`group flex items-center justify-between w-full px-3 py-2 rounded-xl transition-all duration-200 ${item.active || isExpanded ? `bg-gradient-to-r ${activeBg} text-white shadow-lg` : `${textColor} ${hoverBg}`}`} 
                    title={collapsed ? item.name : ''}
                  >
                    <div className={`flex items-center ${collapsed ? 'justify-center w-full' : 'gap-3'}`}>
                      <item.icon className="w-5 h-5" />
                      {!collapsed && (
                        <div className="flex-1 text-left">
                          <span className="text-sm font-medium">{item.name}</span>
                          {item.description && <p className="text-xs opacity-75">{item.description}</p>}
                        </div>
                      )}
                    </div>
                    {!collapsed && <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />}
                  </button>
                  
                  {!collapsed && isExpanded && item.submenu && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-blue-500/50 pl-3">
                      {item.submenu.map((sub) => {
                        const Icon = sub.icon;
                        return (
                          <NavLink 
                            key={sub.path} 
                            to={sub.path} 
                            onClick={() => handleNavClick(sub.name, sub.path)} 
                            className={({ isActive }) => 
                              `group flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${isActive ? (darkMode ? 'text-blue-400 bg-gray-700' : 'text-blue-600 bg-gray-100') : `${textColor} ${hoverBg}`}`
                            }
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span className="flex-1">{sub.name}</span>
                            <button 
                              onClick={(e) => { 
                                e.preventDefault(); 
                                e.stopPropagation(); 
                                addToFavorites(sub.name, sub.path); 
                              }} 
                              className="opacity-0 group-hover:opacity-100"
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
            
            // Si es un link normal
            if (isLink(item)) {
              return (
                <NavLink 
                  key={item.name} 
                  to={item.path} 
                  end={item.path === '/dashboard'} 
                  onClick={() => handleNavClick(item.name, item.path)} 
                  className={({ isActive }) => 
                    `group flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-xl transition-all duration-200 ${isActive ? `bg-gradient-to-r ${activeBg} text-white shadow-lg` : `${textColor} ${hoverBg}`}`} 
                  title={collapsed ? item.name : ''}
                >
                  <item.icon className="w-5 h-5" />
                  {!collapsed && (
                    <div className="flex-1 text-left">
                      <span className="text-sm font-medium">{item.name}</span>
                      {item.description && <p className="text-xs opacity-75">{item.description}</p>}
                    </div>
                  )}
                  {!collapsed && location.pathname === item.path && (
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                  )}
                  {!collapsed && (
                    <button 
                      onClick={(e) => { 
                        e.preventDefault(); 
                        e.stopPropagation(); 
                        addToFavorites(item.name, item.path); 
                      }} 
                      className="opacity-0 group-hover:opacity-100"
                    >
                      <Star className="w-3.5 h-3.5 text-yellow-500" />
                    </button>
                  )}
                </NavLink>
              );
            }
            
            return null;
          })}
        </div>
      </nav>

      {/* Botón Cerrar Sesión */}
      <div className={`p-3 border-t ${borderColor}`}>
        <button
          onClick={handleLogout}
          className={`group flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 w-full rounded-xl transition-all duration-200 ${darkMode ? 'text-gray-400 hover:bg-red-500/10 hover:text-red-500' : 'text-gray-600 hover:bg-red-50 hover:text-red-600'}`}
          title={collapsed ? 'Cerrar Sesión' : ''}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="text-sm font-medium">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
}