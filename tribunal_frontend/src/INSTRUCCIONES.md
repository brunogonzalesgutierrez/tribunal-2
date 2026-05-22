# Cambios necesarios en Sidebar.tsx y App.tsx

## 1. Sidebar.tsx — actualizar el submenu de Audiencias

Reemplaza el item de Audiencias en el array `menuItems`:

```tsx
// ANTES (link simple):
{ name: 'Audiencias', path: '/audiencias', icon: Calendar, type: 'link', description: 'Gestión de audiencias' },

// DESPUÉS (dropdown como Expedientes):
{
  name: 'Audiencias',
  icon: Scale,            // ya está importado arriba
  type: 'dropdown',
  description: 'Audiencias y actas',
  active: isSubmenuActive(['/audiencias', '/tipos-audiencia', '/salas-audiencia', '/asistencias', '/actas']),
  submenu: [
    { name: 'Lista de Audiencias',  path: '/audiencias',        icon: Scale },
    { name: 'Tipos de Audiencia',   path: '/tipos-audiencia',   icon: ClipboardList },
    { name: 'Salas',                path: '/salas-audiencia',   icon: DoorOpen },
    { name: 'Asistencias',          path: '/asistencias',       icon: Users },
    { name: 'Actas',                path: '/actas',             icon: FileText },
  ]
},
```

Agrega los imports que faltan en Sidebar.tsx (ya tienes Calendar, Scale, Users, FileText):
```tsx
import { ..., ClipboardList, DoorOpen } from 'lucide-react';
```

---

## 2. App.tsx — reemplazar la ruta única por 5 rutas separadas

```tsx
// Agrega los imports:
import AudienciasListPage   from "./pages/audiencias/AudienciasListPage";
import TiposAudienciaPage   from "./pages/audiencias/TiposAudienciaPage";
import SalasAudienciaPage   from "./pages/audiencias/SalasAudienciaPage";
import AsistenciasPage      from "./pages/audiencias/AsistenciasPage";
import ActasPage            from "./pages/audiencias/ActasPage";

// Elimina o comenta:
// import AudienciasPage from "./pages/AudienciasPage";

// Reemplaza la ruta:
// <Route path="/audiencias" element={<AudienciasPage />} />

// Por estas 5:
<Route path="/audiencias"       element={<AudienciasListPage />} />
<Route path="/tipos-audiencia"  element={<TiposAudienciaPage />} />
<Route path="/salas-audiencia"  element={<SalasAudienciaPage />} />
<Route path="/asistencias"      element={<AsistenciasPage />} />
<Route path="/actas"            element={<ActasPage />} />
```

---

## 3. Estructura de carpetas resultante

```
src/pages/audiencias/
├── shared.tsx            ← tipos, componentes y utils compartidos
├── AudienciasListPage.tsx
├── TiposAudienciaPage.tsx
├── SalasAudienciaPage.tsx
├── AsistenciasPage.tsx
└── ActasPage.tsx
```
