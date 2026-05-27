import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Usuario {
  idUsuario: number;
  email: string;
  nombre: string;
  paterno: string;
  rol: string;
  username: string;
  permisos: string[];
}

interface AuthContextType {
  usuario: Usuario | null;
  isAuthenticated: boolean;  // ← NUEVO: solo true después del OTP
  loading: boolean;
  login: (userData: Usuario, token: string) => void;
  completeOtp: () => void;   // ← NUEVO: marca autenticación como completa
  logout: () => void;
  hasPermission: (permiso: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar usuario desde localStorage al iniciar la app
  useEffect(() => {
    const storedUser = localStorage.getItem("usuario");
    const token = localStorage.getItem("token");
    const authStatus = localStorage.getItem("isAuthenticated");
    
    if (storedUser && token) {
      try {
        setUsuario(JSON.parse(storedUser));
        // Solo mantener autenticado si completó OTP
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
    setIsAuthenticated(false); // Login no es suficiente, necesita OTP
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

  // Verificar si el usuario tiene un permiso específico
  const hasPermission = (permiso: string | string[]): boolean => {
    if (!usuario) return false;
    
    // Super administrador tiene todos los permisos
    if (usuario.rol === "Administrador" || usuario.username === "admin") {
      return true;
    }
    
    // Si es un array, verificar si tiene al menos uno
    if (Array.isArray(permiso)) {
      return permiso.some(p => usuario.permisos?.includes(p));
    }
    
    // Verificar permiso individual
    return usuario.permisos?.includes(permiso) ?? false;
  };

  return (
    <AuthContext.Provider value={{ 
      usuario, 
      isAuthenticated, 
      loading, 
      login, 
      completeOtp, 
      logout, 
      hasPermission 
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