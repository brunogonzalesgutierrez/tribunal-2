import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Usuario {
  idUsuario: number;
  email: string;
  nombre: string;
  paterno: string;
  rol: string;
  rolId?: number;
  salaAsignadaId?: number;      // ← NUEVO
  salaAsignadaNombre?: string;   // ← NUEVO
  username: string;
  permisos: string[];
}

interface AuthContextType {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (userData: Usuario, token: string) => void;
  completeOtp: () => void;
  logout: () => void;
  hasPermission: (permiso: string | string[]) => boolean;
  getSalaUsuario: () => { id: number | null; nombre: string | null };
  esAdministrador: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("usuario");
    const token = localStorage.getItem("token");
    const authStatus = localStorage.getItem("isAuthenticated");
    
    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUsuario(parsedUser);
        setIsAuthenticated(authStatus === "true");
      } catch (error) {
        console.error("Error al cargar usuario:", error);
        localStorage.removeItem("usuario");
        localStorage.removeItem("token");
        localStorage.removeItem("isAuthenticated");
      }
    }
    setLoading(false);
  }, []);

  const login = (userData: Usuario, token: string) => {
    setUsuario(userData);
    setIsAuthenticated(false);
    localStorage.setItem("usuario", JSON.stringify(userData));
    localStorage.setItem("token", token);
    localStorage.setItem("isAuthenticated", "false");
    if (userData.email) {
      localStorage.setItem("userEmail", userData.email);
    }
  };

  const completeOtp = () => {
    setIsAuthenticated(true);
    localStorage.setItem("isAuthenticated", "true");
  };

  const logout = () => {
    setUsuario(null);
    setIsAuthenticated(false);
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("isAuthenticated");
    sessionStorage.clear();
  };

  const hasPermission = (permiso: string | string[]): boolean => {
    if (!usuario) return false;
    if (usuario.rol === "Administrador" || usuario.username === "admin") {
      return true;
    }
    if (Array.isArray(permiso)) {
      return permiso.some(p => usuario.permisos?.includes(p));
    }
    return usuario.permisos?.includes(permiso) ?? false;
  };

  // 👈 Helper para obtener la sala del usuario
  const getSalaUsuario = (): { id: number | null; nombre: string | null } => {
    if (!usuario) return { id: null, nombre: null };
    if (usuario.rol === "Administrador") {
      return { id: null, nombre: null };
    }
    return {
      id: usuario.salaAsignadaId ?? null,
      nombre: usuario.salaAsignadaNombre ?? null,
    };
  };

  const esAdministrador = (): boolean => {
    return usuario?.rol === "Administrador" || usuario?.username === "admin";
  };

  return (
    <AuthContext.Provider value={{ 
      usuario, 
      isAuthenticated, 
      loading, 
      login, 
      completeOtp, 
      logout, 
      hasPermission,
      getSalaUsuario,
      esAdministrador,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}