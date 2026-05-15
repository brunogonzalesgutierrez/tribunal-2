import { useState } from "react";
import { useQuery } from "@apollo/client";
import {
  GET_PERMISOS,
} from "../graphql/usuarios/queries";
import { 
  Key, Search, Shield, Lock, 
  AlertCircle
} from "lucide-react";

// ─── TIPOS ───────────────────────────────────────────────
interface Permiso {
  idPermiso: number;
  nombre: string;
  codigo: string;
  modulo: string;
  descripcion?: string;
}

// ─── PÁGINA PRINCIPAL ────────────────────────────────────
export default function PermisosPage() {
  const [busqueda, setBusqueda] = useState("");
  const [moduloFiltro, setModuloFiltro] = useState("todos");

  const { data, loading } = useQuery(GET_PERMISOS);

  const permisos: Permiso[] = data?.allPermisos ?? [];

  const modulos = ["todos", ...new Set(permisos.map(p => p.modulo))].sort();

  const permisosFiltrados = permisos.filter(p => {
    const coincideBusqueda = `${p.nombre} ${p.codigo} ${p.modulo}`
      .toLowerCase().includes(busqueda.toLowerCase());
    const coincideModulo = moduloFiltro === "todos" || p.modulo === moduloFiltro;
    return coincideBusqueda && coincideModulo;
  });

  const modulosEnVista = [...new Set(permisosFiltrados.map(p => p.modulo))].sort();

  // Estadísticas
  const totalPermisos = permisos.length;
  const totalModulos = modulos.filter(m => m !== "todos").length;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* ============================================================ */}
      {/* ENCABEZADO */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Key className="w-7 h-7 text-purple-500 dark:text-purple-400" />
            Permisos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestión de permisos del sistema 
          </p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5" />
            Permisos de solo lectura - No se pueden modificar
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TARJETAS DE ESTADÍSTICAS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Permisos</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{totalPermisos}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Key className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Permisos definidos en el sistema</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Módulos</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{totalModulos}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Módulos del sistema</p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* FILTROS */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            placeholder="Buscar permiso por nombre, código o módulo..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {modulos.map(m => (
            <button
              key={m}
              onClick={() => setModuloFiltro(m)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 capitalize ${
                moduloFiltro === m
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-300 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-700 dark:hover:to-slate-600'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* LISTA DE PERMISOS AGRUPADOS POR MÓDULO */}
      {/* ============================================================ */}
      {loading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
                <div className="h-5 bg-gray-200 dark:bg-slate-600 rounded w-32 animate-pulse"></div>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-slate-700">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="p-4 flex items-center gap-4">
                    <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-1/4 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-1/3 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-1/4 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : permisosFiltrados.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <Key className="w-16 h-16 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400">No se encontraron permisos</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Intenta con otros filtros de búsqueda</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {modulosEnVista.map(modulo => {
            const permsMod = permisosFiltrados.filter(p => p.modulo === modulo);
            return (
              <div key={modulo} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-lg dark:shadow-slate-900/30 overflow-hidden">
                
                {/* Header del módulo */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white capitalize">
                        {modulo}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {permsMod.length} permisos
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tabla de permisos */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-slate-700/30 border-b border-gray-200 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descripción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                      {permsMod.map((permiso) => (
                        <tr key={permiso.idPermiso} className="hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                                <Key className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                              </div>
                              <span className="font-medium text-gray-800 dark:text-white">
                                {permiso.nombre}
                              </span>
                            </div>
                           </td>
                          <td className="px-6 py-4">
                            <code className="text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded text-purple-600 dark:text-purple-400 font-mono">
                              {permiso.codigo}
                            </code>
                            </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                            {permiso.descripcion ?? "—"}
                            </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* CONTADOR Y NOTA */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Mostrando {permisosFiltrados.length} de {totalPermisos} permisos
        </p>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-xs text-gray-600 dark:text-gray-400">
          <AlertCircle className="w-3.5 h-3.5" />
          Los permisos son parte del núcleo del sistema y no pueden ser modificados
        </div>
      </div>

    </div>
  );
}