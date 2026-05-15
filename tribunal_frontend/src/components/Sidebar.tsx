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
  History
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

// Definir los tipos de los items del menú
interface SubmenuItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

interface MenuItemLink {
  name: string;
  path: string;
  icon: LucideIcon;
  type: 'link';
  description?: string;
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
  const { logout } = useAuth();
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

  // ✅ MENÚ COMPLETO CON SUBMENÚS
  const menuItems: MenuItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, type: 'link', description: 'Vista principal' },
    { 
      name: 'Seguridad', 
      icon: ShieldCheck, 
      type: 'dropdown', 
      description: 'Usuarios y permisos',
      active: isSubmenuActive(['/usuarios', '/roles', '/permisos']),
      submenu: [
        { name: 'Usuarios', path: '/usuarios', icon: Users },
        { name: 'Roles', path: '/roles', icon: Shield },
        { name: 'Permisos', path: '/permisos', icon: Key }
      ] 
    },
    { 
      name: 'Expedientes', 
      icon: Folder,
      type: 'dropdown', 
      description: 'Gestión de expedientes',
      active: isSubmenuActive(['/expedientes', '/historial', '/actuaciones']),
      submenu: [
        { name: 'Lista de Expedientes', path: '/expedientes', icon: Folder },
        { name: 'Historial de Estados', path: '/historial', icon: History },
        { name: 'Actuaciones', path: '/actuaciones', icon: FileText }
      ] 
    },
    
    { name: 'Audiencias', path: '/audiencias', icon: Calendar, type: 'link', description: 'Gestión de audiencias' },
    { name: 'Participantes', path: '/personas', icon: Users, type: 'link', description: 'Personas y partes' },
    { name: 'Documentos', path: '/documentos', icon: FileText, type: 'link', description: 'Documentos digitales' },
    { name: 'Solicitudes', path: '/solicitudes', icon: ListChecks, type: 'link', description: 'Trámites' },
    { name: 'Resoluciones', path: '/resoluciones', icon: Scale, type: 'link', description: 'Resoluciones' },
    { name: 'Reportes', path: '/reportes', icon: BarChart, type: 'link', description: 'Estadísticas' },
    
    
    
    { name: 'Tribunal', path: '/tribunal', icon: Building, type: 'link', description: 'Configuración tribunal' },
  ];

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
          <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-xl shadow-lg">
            <Gavel className="w-5 h-5 text-white" />
          </div>
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

      {/* Menú de navegación */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
        <div className="space-y-1">
          {menuItems.map((item) => {
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

      {/* Recientes */}
      {!collapsed && recentItems.length > 0 && (
        <div className={`px-3 py-3 border-t ${borderColor}`}>
          <div className="flex items-center justify-between mb-2">
            <button 
              onClick={() => setShowRecent(!showRecent)} 
              className={`flex items-center gap-2 text-xs font-semibold ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="uppercase tracking-wider">Recientes</span>
              <ChevronRight className={`w-3 h-3 transition-transform ${showRecent ? 'rotate-90' : ''}`} />
            </button>
            <button onClick={clearRecents} className="text-xs text-gray-500 hover:text-red-400">Limpiar</button>
          </div>
          {showRecent && (
            <div className="space-y-1 mt-2">
              {recentItems.map((item) => (
                <NavLink 
                  key={item.path} 
                  to={item.path} 
                  className={({ isActive }) => 
                    `flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm ${isActive ? (darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600') : `${darkMode ? 'text-gray-500' : 'text-gray-400'} ${hoverBg}`}`
                  }
                >
                  <TrendingUp className="w-3 h-3" />
                  <span className="truncate">{item.name}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      )}

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

      {/* Versión */}
      {!collapsed && (
        <div className="px-5 pb-4">
          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>v2.0.0</p>
        </div>
      )}
    </aside>
  );
}