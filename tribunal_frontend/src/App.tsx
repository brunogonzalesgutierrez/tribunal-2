import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { PERMISOS } from "./config/permisos";
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
import AudienciaDetallePage from "./pages/audiencias/AudienciaDetallePage";
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
import ExpedienteDetallePage from "./pages/expedientes/ExpedienteDetallePage";

// ── Nuevas páginas de catálogos ──────────────────────────
import TiposProcesoPage     from "./pages/catalogos/TiposProcesoPage";
import TiposActuacionPage   from "./pages/expedientes/TiposActuacionPage";
import EstadosExpedientePage from "./pages/expedientes/EstadosExpedientePage";

function App() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/otp" element={<OtpPage />} />

      {/* Rutas protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          {/* Sin permisos */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/perfil" element={<PerfilPage />} />

          {/* ============================================================ */}
          {/* SEGURIDAD */}
          {/* ============================================================ */}
          <Route element={<ProtectedRoute requiredPermissions={[PERMISOS.USUARIOS_VER]} />}>
            <Route path="/usuarios" element={<UsuariosPage />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermissions={[PERMISOS.ROLES_VER]} />}>
            <Route path="/roles" element={<RolesPage />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermissions={[PERMISOS.PERMISOS_VER]} />}>
            <Route path="/permisos" element={<PermisosPage />} />
          </Route>

          {/* ============================================================ */}
          {/* TRIBUNAL */}
          {/* ============================================================ */}
          <Route element={<ProtectedRoute requiredPermissions={[PERMISOS.TRIBUNALES_VER]} />}>
            <Route path="/tribunales" element={<TribunalesPage />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermissions={[PERMISOS.SALAS_TRIBUNAL_VER]} />}>
            <Route path="/salas-tribunal" element={<SalasTribunalPage />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermissions={[PERMISOS.VOCALES_VER]} />}>
            <Route path="/vocales" element={<VocalesPage />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermissions={[PERMISOS.CONFORMACIONES_VER]} />}>
            <Route path="/conformaciones" element={<ConformacionesPage />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermissions={[PERMISOS.SALAS_AUDIENCIA_VER]} />}>
            <Route path="/salas-audiencia" element={<SalasAudienciaPage />} />
          </Route>

          {/* ============================================================ */}
          {/* EXPEDIENTES */}
          {/* ============================================================ */}
          <Route element={<ProtectedRoute requiredPermissions={[PERMISOS.EXPEDIENTES_VER]} />}>
            <Route path="/expedientes" element={<ExpedientesPage />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermissions={[PERMISOS.EXPEDIENTES_VER]} />}>
            <Route path="/expedientes/:id" element={<ExpedienteDetallePage />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermissions={[PERMISOS.HISTORIAL_ESTADOS_VER]} />}>
            <Route path="/historial" element={<HistorialEstadosPage />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermissions={[PERMISOS.ACTUACIONES_VER]} />}>
            <Route path="/actuaciones" element={<ActuacionesPage />} />
          </Route>

          {/* ============================================================ */}
          {/* AUDIENCIAS */}
          {/* ============================================================ */}
          <Route element={<ProtectedRoute requiredPermissions={[PERMISOS.AUDIENCIAS_VER]} />}>
            <Route path="/audiencias" element={<AudienciasListPage />} />
            <Route path="/audiencias/:id" element={<AudienciaDetallePage />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermissions={[PERMISOS.TIPOS_AUDIENCIA_VER]} />}>
            <Route path="/tipos-audiencia" element={<TiposAudienciaPage />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermissions={[PERMISOS.ASISTENCIAS_VER]} />}>
            <Route path="/asistencias" element={<AsistenciasPage />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermissions={[PERMISOS.ACTAS_VER]} />}>
            <Route path="/actas" element={<ActasPage />} />
          </Route>

          {/* ============================================================ */}
          {/* RESOLUCIONES */}
          {/* ============================================================ */}
          <Route element={<ProtectedRoute requiredPermissions={[PERMISOS.RESOLUCIONES_VER]} />}>
            <Route path="/resoluciones" element={<ResolucionesListPage />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermissions={[PERMISOS.TIPOS_RESOLUCION_VER]} />}>
            <Route path="/tipos-resolucion" element={<TiposResolucionPage />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermissions={[PERMISOS.TIPOS_RECURSO_VER]} />}>
            <Route path="/tipos-recurso" element={<TiposRecursoPage />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermissions={[PERMISOS.RECURSOS_VER]} />}>
            <Route path="/recursos" element={<RecursosPage />} />
          </Route>

          {/* ============================================================ */}
          {/* DOCUMENTOS */}
          {/* ============================================================ */}
          <Route element={<ProtectedRoute requiredPermissions={[PERMISOS.DOCUMENTOS_VER]} />}>
            <Route path="/documentos" element={<DocumentosListPage />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermissions={[PERMISOS.TIPOS_DOCUMENTO_VER]} />}>
            <Route path="/tipos-doc" element={<TiposDocPage />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermissions={[PERMISOS.SOLICITUDES_VER]} />}>
            <Route path="/solicitudes" element={<SolicitudesPage />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermissions={[PERMISOS.NOTIFICACIONES_VER]} />}>
            <Route path="/notificaciones" element={<NotificacionesPage />} />
          </Route>

          {/* ============================================================ */}
          {/* PERSONAS */}
          {/* ============================================================ */}
          <Route element={<ProtectedRoute requiredPermissions={[PERMISOS.PERSONAS_VER]} />}>
            <Route path="/personas" element={<PersonasListPage />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermissions={[PERMISOS.CONTACTOS_VER]} />}>
            <Route path="/contactos" element={<ContactosPage />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermissions={[PERMISOS.ROLES_PROCESALES_VER]} />}>
            <Route path="/roles-procesales" element={<RolesProcesalesPage />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermissions={[PERMISOS.PARTES_PROCESALES_VER]} />}>
            <Route path="/partes" element={<PartesPage />} />
          </Route>

          {/* ============================================================ */}
          {/* CATÁLOGOS */}
          {/* ============================================================ */}
          <Route element={<ProtectedRoute requiredPermissions={[PERMISOS.TIPOS_PROCESO_VER]} />}>
            <Route path="/tipos-proceso" element={<TiposProcesoPage />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermissions={[PERMISOS.TIPOS_ACTUACION_VER]} />}>
            <Route path="/tipos-actuacion" element={<TiposActuacionPage />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermissions={[PERMISOS.ESTADOS_EXPEDIENTE_VER]} />}>
            <Route path="/estados-expediente" element={<EstadosExpedientePage />} />
          </Route>

          {/* ============================================================ */}
          {/* REPORTES */}
          {/* ============================================================ */}
          <Route element={<ProtectedRoute requiredPermissions={[PERMISOS.REPORTES_VER]} />}>
            <Route path="/reportes" element={<ReportesPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

export default App;