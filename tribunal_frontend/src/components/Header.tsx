import { useState, useEffect } from 'react';
import { Bell, Search, Settings, Sun, Moon, User, HelpCircle, LogOut, ChevronDown } from 'lucide-react';
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface HeaderProps {
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export default function Header({ darkMode = true, onToggleDarkMode, sidebarCollapsed = false, onToggleSidebar }: HeaderProps) {
  const { usuario, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Nuevo expediente', message: 'Se ha creado un nuevo expediente', read: false, time: 'hace 5 min' },
    { id: 2, title: 'Audiencia programada', message: 'Audiencia para mañana a las 10:00', read: false, time: 'hace 1 hora' },
    { id: 3, title: 'Resolución emitida', message: 'Resolución N° 123/2025 emitida', read: true, time: 'hace 2 horas' },
  ]);

  const nombre = usuario
    ? `${usuario.nombre} ${usuario.paterno}`.trim() || usuario.email?.split("@")[0]
    : "Usuario";
  
  const rol = usuario?.rol ?? "Administrador";
  const iniciales = nombre.charAt(0).toUpperCase();
  const userEmail = usuario?.email || 'usuario@tribunal.com';

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => {
      setShowUserMenu(false);
      setShowNotifications(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <header className={`h-16 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b flex items-center justify-between px-6 shadow-sm transition-colors duration-200`}>
      
      {/* Izquierda: Título o botón colapsar */}
      <div className="flex items-center gap-4">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className={`p-2 rounded-lg transition-all duration-200 ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            {sidebarCollapsed ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>
        )}
        
        <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
          Panel de Control
        </h2>
      </div>
      
      {/* Derecha: Acciones */}
      <div className="flex items-center gap-3">
        {/* Buscador */}
        <div className="relative hidden md:block">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-64 pl-9 pr-4 py-2 ${darkMode ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'} border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
          />
        </div>

        {/* Botón modo oscuro/claro */}
        {onToggleDarkMode && (
          <button
            onClick={onToggleDarkMode}
            className={`p-2 rounded-lg transition-all duration-200 ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        )}

        {/* Configuración */}
        <button className={`p-2 rounded-lg transition-all duration-200 ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>
          <Settings className="w-5 h-5" />
        </button>

        {/* Notificaciones */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className={`relative p-2 rounded-lg transition-all duration-200 ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </button>

          {/* Panel de notificaciones */}
          {showNotifications && (
            <div className={`absolute right-0 mt-2 w-80 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-xl z-50 animate-fade-in`}>
              <div className={`px-4 py-3 ${darkMode ? 'border-gray-700' : 'border-gray-100'} border-b flex justify-between items-center`}>
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Notificaciones</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs text-blue-500 hover:text-blue-600"
                  >
                    Marcar todas
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No hay notificaciones</div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`px-4 py-3 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} cursor-pointer transition-colors ${!notif.read ? (darkMode ? 'bg-gray-700/50' : 'bg-blue-50') : ''}`}
                    >
                      <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{notif.title}</p>
                      <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{notif.message}</p>
                      <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{notif.time}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Separador */}
        <div className={`w-px h-8 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>

        {/* Perfil usuario */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className={`flex items-center gap-3 pl-2 py-1 pr-3 rounded-lg transition-all duration-200 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold flex items-center justify-center rounded-lg shadow-md text-sm">
              {iniciales}
            </div>
            <div className="hidden lg:block text-left">
              <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{nombre}</p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{rol}</p>
            </div>
            <ChevronDown className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>

          {/* Menú desplegable de usuario */}
          {showUserMenu && (
            <div className={`absolute right-0 mt-2 w-56 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-xl py-1 z-50 animate-fade-in`}>
              <div className={`px-4 py-3 ${darkMode ? 'border-gray-700' : 'border-gray-100'} border-b`}>
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{nombre}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{userEmail}</p>
              </div>
              <NavLink
                to="/perfil"
                onClick={() => setShowUserMenu(false)}
                className={`w-full text-left px-4 py-2 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors flex items-center gap-3`}
              >
                <User className="w-4 h-4" />
                Mi Perfil
              </NavLink>
              <button className={`w-full text-left px-4 py-2 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors flex items-center gap-3`}>
                <HelpCircle className="w-4 h-4" />
                Ayuda
              </button>
              <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'} my-1`}></div>
              <button
                onClick={logout}
                className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-3 ${darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-gray-100'}`}
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}