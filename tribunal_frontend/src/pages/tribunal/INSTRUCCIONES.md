# Instrucciones de integración — Módulo Tribunal

## Archivos generados → `src/pages/tribunal/`

```
src/pages/tribunal/
├── shared.tsx              ← tipos, helpers, componentes compartidos
├── TribunalesPage.tsx      ← CRUD de tribunales
├── SalasTribunalPage.tsx   ← CRUD de salas
├── VocalesPage.tsx         ← CRUD de vocales (con activar/desactivar)
└── ConformacionesPage.tsx  ← asignación de vocales a expedientes
```

---

## 1. App.tsx — reemplazar la ruta de tribunal

Elimina:
```tsx
import TribunalPage from "./pages/TribunalPage";
// ...
<Route path="/tribunal" element={<TribunalPage />} />
```

Agrega en los imports:
```tsx
import TribunalesPage      from "./pages/tribunal/TribunalesPage";
import SalasTribunalPage   from "./pages/tribunal/SalasTribunalPage";
import VocalesPage         from "./pages/tribunal/VocalesPage";
import ConformacionesPage  from "./pages/tribunal/ConformacionesPage";
```

Agrega en las rutas (dentro del `<Route element={<Layout />}>`):
```tsx
<Route path="/tribunales"      element={<TribunalesPage />} />
<Route path="/salas-tribunal"  element={<SalasTribunalPage />} />
<Route path="/vocales"         element={<VocalesPage />} />
<Route path="/conformaciones"  element={<ConformacionesPage />} />
```

---

## 2. Sidebar.tsx — convertir Tribunal de link a dropdown

Reemplaza el item de Tribunal:
```tsx
{ name: 'Tribunal', path: '/tribunal', icon: Building, type: 'link', description: 'Configuración tribunal' },
```

Por:
```tsx
{
  name: 'Tribunal',
  icon: Building2,
  type: 'dropdown',
  description: 'Tribunales y salas',
  active: isSubmenuActive(['/tribunales', '/salas-tribunal', '/vocales', '/conformaciones']),
  submenu: [
    { name: 'Tribunales',     path: '/tribunales',     icon: Building2 },
    { name: 'Salas',          path: '/salas-tribunal', icon: DoorOpen },
    { name: 'Vocales',        path: '/vocales',         icon: Users },
    { name: 'Conformaciones', path: '/conformaciones', icon: Link2 },
  ],
},
```

Asegúrate de importar `Building2` y `Link2` de lucide-react en el Sidebar:
```tsx
import { ..., Building2, Link2 } from 'lucide-react';
```

---

## 3. Notas importantes

- Las **conformaciones no tienen edición**, solo crear y eliminar (igual que en el original).
- El `TribunalPageBeta` en `App.tsx` queda intacto, no lo tocamos.
- Puedes eliminar el archivo antiguo:
  ```
  src/pages/TribunalPage.tsx  ← ya no se usa
  ```
