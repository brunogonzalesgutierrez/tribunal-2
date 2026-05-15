import { createContext, useContext, useState, ReactNode } from "react";

interface Usuario {
  email: string;
  nombre: string;
  paterno: string;
  rol: string;
  idUsuario: number | null;
}

interface AuthContextType {
  usuario: Usuario | null;
  setUsuario: (u: Usuario | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
  };

  return (
    <AuthContext.Provider value={{ usuario, setUsuario, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}