# Instrucciones — SolicitudesPage dentro del módulo Documentos

## Archivo generado
```
src/pages/documentos/SolicitudesPage.tsx
```

---

## 1. App.tsx

Elimina:
```tsx
import SolicitudesPage from "./pages/SolicitudesPage";
// ...
<Route path="/solicitudes" element={<SolicitudesPage />} />
```

Agrega en los imports:
```tsx
import SolicitudesPage from "./pages/documentos/SolicitudesPage";
```

La ruta no cambia:
```tsx
<Route path="/solicitudes" element={<SolicitudesPage />} />
```

---

## 2. Sidebar.tsx — agregar Solicitudes al dropdown de Documentos

El dropdown de Documentos pasa de 3 a 4 subitems:

```tsx
{
  name: 'Documentos',
  icon: FileText,
  type: 'dropdown',
  description: 'Gestión documental',
  active: isSubmenuActive(['/documentos', '/tipos-doc', '/notificaciones', '/solicitudes']),
  submenu: [
    { name: 'Lista de Documentos', path: '/documentos',     icon: FileText },
    { name: 'Tipos de documento',  path: '/tipos-doc',      icon: Tag },
    { name: 'Notificaciones',      path: '/notificaciones', icon: Bell },
    { name: 'Solicitudes',         path: '/solicitudes',    icon: ClipboardList },  // ← nuevo
  ],
},
```

Asegúrate de importar `ClipboardList` de lucide-react en el Sidebar:
```tsx
import { ..., ClipboardList } from 'lucide-react';
```

---

## 3. Puedes eliminar el archivo antiguo
```
src/pages/SolicitudesPage.tsx  ← ya no se usa
```
