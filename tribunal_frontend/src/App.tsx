import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/login/LoginPage";
import OtpPage from "./pages/login/OtpPage";
import DashboardPage from "./pages/DashboardPage";
import PerfilPage from "./pages/PerfilPage";
import UsuariosPage from "./pages/seguridad/UsuariosPage";
import RolesPage from "./pages/seguridad/RolesPage";
import PermisosPage from "./pages/seguridad/PermisosPage";
import TribunalesPage from "./pages/tribunal/TribunalesPage";
import SalasTribunalPage from "./pages/tribunal/SalasTribunalPage";
import VocalesPage from "./pages/tribunal/VocalesPage";
import ConformacionesPage from "./pages/tribunal/ConformacionesPage";
import DocumentosListPage from "./pages/documentos/DocumentosListPage";
import TiposDocPage from "./pages/documentos/TiposDocPage";
import NotificacionesPage from "./pages/documentos/NotificacionesPage";
import SolicitudesPage from "./pages/documentos/SolicitudesPage";
import PersonasListPage from "./pages/personas/PersonasListPage";
import ContactosPage from "./pages/personas/ContactosPage";
import RolesProcesalesPage from "./pages/personas/RolesProcesalesPage";
import PartesPage from "./pages/personas/PartesPage";
import AudienciasListPage from "./pages/audiencias/AudienciasListPage";
import TiposAudienciaPage from "./pages/audiencias/TiposAudienciaPage";
import SalasAudienciaPage from "./pages/audiencias/SalasAudienciaPage";
import AsistenciasPage from "./pages/audiencias/AsistenciasPage";
import ActasPage from "./pages/audiencias/ActasPage";
import ResolucionesListPage from "./pages/resoluciones/ResolucionesListPage";
import TiposResolucionPage from "./pages/resoluciones/TiposResolucionPage";
import TiposRecursoPage from "./pages/resoluciones/TiposRecursoPage";
import RecursosPage from "./pages/resoluciones/RecursosPage";
import ExpedientesPage from "./pages/expedientes/ExpedientesPage";
import HistorialEstadosPage from "./pages/expedientes/HistorialEstadosPage";
import ActuacionesPage from "./pages/expedientes/ActuacionesPage";
import ReportesPage from "./pages/reportes/ReportesPage";

function App() {
  return (
    <Routes>
      {/* Rutas públicas - sin autenticación */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/otp" element={<OtpPage />} />

      {/* Rutas protegidas - requieren autenticación */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          {/* Todos pueden ver (sin permisos específicos) */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/perfil" element={<PerfilPage />} />

          {/* Seguridad - requieren permisos de gestión */}
          <Route element={<ProtectedRoute requiredPermissions={["USR_GEST"]} />}>
            <Route path="/usuarios" element={<UsuariosPage />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermissions={["ROL_GEST"]} />}>
            <Route path="/roles" element={<RolesPage />} />
            <Route path="/permisos" element={<PermisosPage />} />
          </Route>

          {/* Expedientes */}
          <Route element={<ProtectedRoute requiredPermissions={["EXP_VER"]} />}>
            <Route path="/expedientes" element={<ExpedientesPage />} />
            <Route path="/historial" element={<HistorialEstadosPage />} />
            <Route path="/actuaciones" element={<ActuacionesPage />} />
          </Route>

          {/* Tribunal */}
          <Route element={<ProtectedRoute requiredPermissions={["EXP_VER"]} />}>
            <Route path="/tribunales" element={<TribunalesPage />} />
            <Route path="/salas-tribunal" element={<SalasTribunalPage />} />
            <Route path="/vocales" element={<VocalesPage />} />
            <Route path="/conformaciones" element={<ConformacionesPage />} />
          </Route>

          {/* Documentos */}
          <Route element={<ProtectedRoute requiredPermissions={["DOC_VER"]} />}>
            <Route path="/documentos" element={<DocumentosListPage />} />
            <Route path="/tipos-doc" element={<TiposDocPage />} />
            <Route path="/solicitudes" element={<SolicitudesPage />} />
          </Route>

          {/* Notificaciones */}
          <Route element={<ProtectedRoute requiredPermissions={["NOT_VER"]} />}>
            <Route path="/notificaciones" element={<NotificacionesPage />} />
          </Route>

          {/* Personas */}
          <Route element={<ProtectedRoute requiredPermissions={["PER_GEST"]} />}>
            <Route path="/personas" element={<PersonasListPage />} />
            <Route path="/contactos" element={<ContactosPage />} />
            <Route path="/roles-procesales" element={<RolesProcesalesPage />} />
            <Route path="/partes" element={<PartesPage />} />
          </Route>

          {/* Audiencias */}
          <Route element={<ProtectedRoute requiredPermissions={["AUD_VER"]} />}>
            <Route path="/audiencias" element={<AudienciasListPage />} />
            <Route path="/tipos-audiencia" element={<TiposAudienciaPage />} />
            <Route path="/salas-audiencia" element={<SalasAudienciaPage />} />
            <Route path="/asistencias" element={<AsistenciasPage />} />
            <Route path="/actas" element={<ActasPage />} />
          </Route>

          {/* Resoluciones */}
          <Route element={<ProtectedRoute requiredPermissions={["RES_VER"]} />}>
            <Route path="/resoluciones" element={<ResolucionesListPage />} />
            <Route path="/tipos-resolucion" element={<TiposResolucionPage />} />
            <Route path="/tipos-recurso" element={<TiposRecursoPage />} />
            <Route path="/recursos" element={<RecursosPage />} />
          </Route>

          {/* Reportes */}
          <Route element={<ProtectedRoute requiredPermissions={["EXP_VER"]} />}>
            <Route path="/reportes" element={<ReportesPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

export default App;