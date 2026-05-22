# Instrucciones de integración — Módulo Resoluciones

## Archivos generados

```
src/pages/resoluciones/
  shared.tsx               ← paleta, tipos, helpers y componentes base
  ResolucionesListPage.tsx ← lista principal + CRUD resoluciones
  TiposResolucionPage.tsx  ← CRUD tipos de resolución
  TiposRecursoPage.tsx     ← CRUD tipos de recurso
  RecursosPage.tsx         ← CRUD recursos / interposición
```

---

## 1 · Cambios en `Sidebar.tsx`

Reemplazar el item actual de Resoluciones (tipo `link`) por un `dropdown`:

```tsx
// ❌ ANTES (link simple)
{ name: 'Resoluciones', path: '/resoluciones', icon: Scale, type: 'link', description: 'Resoluciones' },

// ✅ DESPUÉS (dropdown igual que Expedientes / Audiencias)
{
  name: 'Resoluciones',
  icon: Scale,
  type: 'dropdown',
  description: 'Resoluciones y recursos',
  active: isSubmenuActive(['/resoluciones', '/tipos-resolucion', '/tipos-recurso', '/recursos']),
  submenu: [
    { name: 'Lista de Resoluciones', path: '/resoluciones',      icon: Scale },
    { name: 'Tipos de resolución',   path: '/tipos-resolucion',  icon: FileText },
    { name: 'Tipos de recurso',      path: '/tipos-recurso',     icon: ClipboardList },
    { name: 'Recursos',              path: '/recursos',           icon: Gavel },
  ],
},
```

> Los iconos `Scale`, `FileText`, `Gavel` ya están importados en tu Sidebar.
> `ClipboardList` también está importado (lo usas en Audiencias).

---

## 2 · Cambios en `App.tsx`

### Imports — agregar los 4 nuevos, quitar el antiguo

```tsx
// ❌ Quitar
import ResolucionesPage from "./pages/ResolucionesPage";

// ✅ Agregar
import ResolucionesListPage  from "./pages/resoluciones/ResolucionesListPage";
import TiposResolucionPage   from "./pages/resoluciones/TiposResolucionPage";
import TiposRecursoPage      from "./pages/resoluciones/TiposRecursoPage";
import RecursosPage          from "./pages/resoluciones/RecursosPage";
```

### Rutas — dentro del `<Route element={<Layout />}>`

```tsx
// ❌ Quitar
<Route path="/resoluciones" element={<ResolucionesPage />} />

// ✅ Agregar (4 rutas)
<Route path="/resoluciones"      element={<ResolucionesListPage />} />
<Route path="/tipos-resolucion"  element={<TiposResolucionPage />} />
<Route path="/tipos-recurso"     element={<TiposRecursoPage />} />
<Route path="/recursos"          element={<RecursosPage />} />
```

---

## Resumen de rutas

| Ruta                | Componente               | Descripción                  |
|---------------------|--------------------------|------------------------------|
| `/resoluciones`     | `ResolucionesListPage`   | Lista + CRUD resoluciones    |
| `/tipos-resolucion` | `TiposResolucionPage`    | CRUD tipos de resolución     |
| `/tipos-recurso`    | `TiposRecursoPage`       | CRUD tipos de recurso        |
| `/recursos`         | `RecursosPage`           | Interposición y seguimiento  |
