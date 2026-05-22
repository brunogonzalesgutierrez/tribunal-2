import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import OtpPage from "./pages/OtpPage";
import DashboardPage from "./pages/DashboardPage";
import PerfilPage from "./pages/PerfilPage";
import UsuariosPage from "./pages/UsuariosPage";
import RolesPage from "./pages/RolesPage";
import PermisosPage from "./pages/PermisosPage";
// import ExpedientePage from "./pages/ExpedientePage";
import TribunalPage from "./pages/TribunalPage";
import DocumentosPage from "./pages/DocumentosPage";
import SolicitudesPage from "./pages/SolicitudesPage";
import PersonasPage from "./pages/PersonasPage";
import AudienciasListPage   from "./pages/audiencias/AudienciasListPage";
import TiposAudienciaPage   from "./pages/audiencias/TiposAudienciaPage";
import SalasAudienciaPage   from "./pages/audiencias/SalasAudienciaPage";
import AsistenciasPage      from "./pages/audiencias/AsistenciasPage";
import ActasPage            from "./pages/audiencias/ActasPage";
import ResolucionesPage from "./pages/ResolucionesPage";
import ExpedientesPage from "./pages/expedientes/ExpedientesPage";
import HistorialEstadosPage from "./pages/expedientes/HistorialEstadosPage";
import ActuacionesPage from "./pages/expedientes/ActuacionesPage";
import ReportesPage from "./pages/ReportesPage";
// nuevo
import TribunalPageBeta from "./pages/Módulo de tribunal y salas/TribunalPage";
function App() {
  return (
    <Routes>
      {/* Rutas sin sidebar (login) */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/otp" element={<OtpPage />} />

      {/* Rutas con sidebar - todas dentro del Layout con Outlet */}
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/perfil" element={<PerfilPage />} />
        <Route path="/usuarios" element={<UsuariosPage />} />
        <Route path="/roles" element={<RolesPage />} />
        <Route path="/permisos" element={<PermisosPage />} />
        {/* <Route path="/expedientes" element={<ExpedientePage />} /> */}
        <Route path="/tribunal" element={<TribunalPage />} />
        <Route path="/documentos" element={<DocumentosPage />} />
        <Route path="/solicitudes" element={<SolicitudesPage />} />
        <Route path="/personas" element={<PersonasPage />} />
        <Route path="/audiencias"       element={<AudienciasListPage />} />
        <Route path="/tipos-audiencia"  element={<TiposAudienciaPage />} />
        <Route path="/salas-audiencia"  element={<SalasAudienciaPage />} />
        <Route path="/asistencias"      element={<AsistenciasPage />} />
        <Route path="/actas"            element={<ActasPage />} />
        <Route path="/resoluciones" element={<ResolucionesPage />} />
        <Route path="/expedientes" element={<ExpedientesPage />} />
        <Route path="/historial" element={<HistorialEstadosPage />} />
        <Route path="/actuaciones" element={<ActuacionesPage />} />
        <Route path="/tribunalBeta" element={<TribunalPageBeta />} />
        <Route path="/reportes" element={<ReportesPage />} />
      </Route>
    </Routes>
  );
}

export default App;