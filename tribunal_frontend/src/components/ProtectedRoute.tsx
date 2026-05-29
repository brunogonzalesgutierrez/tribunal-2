import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { RUTAS_PERMISOS } from "../config/permisos";

interface ProtectedRouteProps {
  requiredPermissions?: string[];
  allowedRoles?: string[];
}

export default function ProtectedRoute({ 
  requiredPermissions = [], 
  allowedRoles = [] 
}: ProtectedRouteProps) {
  const { usuario, isAuthenticated, loading, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // No autenticado (ni siquiera email/password)
  if (!usuario) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // ✅ Autenticado pero sin completar OTP → redirigir a OTP
  if (!isAuthenticated) {
    return <Navigate to="/otp" state={{ email: usuario.email }} replace />;
  }

  // Verificar roles permitidos (si se especificaron)
  if (allowedRoles.length > 0) {
    if (!allowedRoles.includes(usuario.rol)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Verificar permisos específicos pasados como prop
  if (requiredPermissions.length > 0) {
    const tienePermisos = requiredPermissions.some(p => hasPermission(p));
    if (!tienePermisos) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Verificar permisos según la ruta actual (usando RUTAS_PERMISOS)
  const rutaPermisos = RUTAS_PERMISOS[location.pathname];
  if (rutaPermisos && rutaPermisos.length > 0) {
    const tienePermiso = rutaPermisos.some(p => hasPermission(p));
    if (!tienePermiso) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
}