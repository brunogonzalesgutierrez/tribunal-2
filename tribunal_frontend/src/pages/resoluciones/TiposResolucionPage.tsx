// ─── src/pages/resoluciones/TiposResolucionPage.tsx ──────────────────────────
import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_TIPOS_RESOLUCION,
  CREAR_TIPO_RESOLUCION, ACTUALIZAR_TIPO_RESOLUCION, ELIMINAR_TIPO_RESOLUCION,
} from "../../graphql/resoluciones";
import { Layers, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Search } from "lucide-react";
import {
  TipoResolucion, nivelStars,
  Modal, Field, TextareaField,
  ErrorBox, ModalFooter, StatCard, TablaDesktop, ActionBtns,
} from "./shared";
import { useCrudNotifications } from "../../hooks/useCrudNotifications";
import { useToast } from "../../context/ToastContext";

export default function TiposResolucionPage() {
  const { data, loading, refetch } = useQuery(GET_TIPOS_RESOLUCION);
  const [crear]      = useMutation(CREAR_TIPO_RESOLUCION);
  const [actualizar] = useMutation(ACTUALIZAR_TIPO_RESOLUCION);
  const [eliminar_m] = useMutation(ELIMINAR_TIPO_RESOLUCION);

  const { executeCreate, executeUpdate, executeDelete, toast } = useCrudNotifications("Tipo de Resolución");

  // ✅ Estado para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ Estado para bloqueo de botones
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ✅ Estado para búsqueda
  const [busqueda, setBusqueda] = useState("");

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<TipoResolucion | null>(null);
  const [err, setErr]       = useState("");

  const initForm = { codigo: "", nombre: "", nivelJerarquico: "1", descripcion: "" };
  const [form, setForm] = useState(initForm);
  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const tipos: TipoResolucion[] = data?.allTiposResolucion ?? [];

  // ✅ Filtrar tipos por búsqueda
  const tiposFiltrados = tipos.filter(t =>
    `${t.codigo} ${t.nombre} ${t.descripcion ?? ""}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  // ✅ Paginación
  const totalPages = Math.ceil(tiposFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTipos = tiposFiltrados.slice(startIndex, startIndex + itemsPerPage);

  // stats por nivel
  const nivel1 = tipos.filter(t => t.nivelJerarquico === 1).length;
  const nivel2 = tipos.filter(t => t.nivelJerarquico === 2).length;
  const nivel3 = tipos.filter(t => t.nivelJerarquico >= 3).length;

  const abrirCrear = () => { 
    setEdit(null); 
    setForm(initForm); 
    setErr(""); 
    setModal(true); 
  };
  
  const abrirEditar = (t: TipoResolucion) => {
    setEdit(t);
    setForm({ 
      codigo: t.codigo, 
      nombre: t.nombre, 
      nivelJerarquico: String(t.nivelJerarquico), 
      descripcion: t.descripcion ?? "" 
    });
    setErr(""); 
    setModal(true);
  };

  // Resetear página cuando cambia la búsqueda
  const handleBusquedaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusqueda(e.target.value);
    setCurrentPage(1);
  };

  // ✅ GUARDAR CON BLOQUEO
  const guardar = async () => {
    if (!form.codigo || !form.nombre) { 
      toast.error("Código y nombre son obligatorios."); 
      return; 
    }
    
    if (saving) return;
    setSaving(true);
    
    try {
      if (editando) {
        await executeUpdate(async () => {
          await actualizar({ 
            variables: { 
              id: Number(editando.idTipoRes), 
              input: {
                codigo: form.codigo, 
                nombre: form.nombre,
                nivelJerarquico: Number(form.nivelJerarquico),
                descripcion: form.descripcion || undefined,
              }
            } 
          });
          await refetch(); 
          setModal(false);
          return true;
        });
      } else {
        await executeCreate(async () => {
          await crear({ 
            variables: {
              codigo: form.codigo, 
              nombre: form.nombre,
              nivelJerarquico: Number(form.nivelJerarquico),
              descripcion: form.descripcion || undefined,
            } 
          });
          await refetch(); 
          setModal(false);
          return true;
        });
      }
    } catch (e: any) { 
      setErr(e.message ?? "Error."); 
    } finally {
      setSaving(false);
    }
  };

  // ✅ ELIMINAR CON BLOQUEO
  const eliminar = async (t: TipoResolucion) => {
    if (deletingId === t.idTipoRes) return;
    setDeletingId(t.idTipoRes);
    
    try {
      await executeDelete(
        async () => {
          const { data } = await eliminar_m({ variables: { id: Number(t.idTipoRes) } });
          if (!data?.eliminarTipoResolucion?.ok) {
            throw new Error(data?.eliminarTipoResolucion?.mensaje ?? "No se pudo eliminar.");
          }
          await refetch();
          return true;
        },
        {
          loading: `Eliminando tipo "${t.nombre}"...`,
          success: `Tipo "${t.nombre}" eliminado exitosamente`,
          error: `Error al eliminar el tipo "${t.nombre}"`,
        },
        `¿Eliminar el tipo de resolución "${t.nombre}"?`
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Layers className="w-7 h-7 text-purple-500" />
            Tipos de Resolución
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Clasificación y jerarquía de resoluciones judiciales • {tipos.length} tipos
          </p>
        </div>
        <button
          onClick={abrirCrear}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <Plus className="w-4 h-4" /> Nuevo tipo
        </button>
      </div>

      {/* Stats - Clases fijas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Primera instancia</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{nivel1}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-xl text-blue-500">★</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Nivel jerárquico 1</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Segunda instancia</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{nivel2}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-xl text-purple-500">★★</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Nivel jerárquico 2</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tercera o superior</p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">{nivel3}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-xl text-amber-500">★★★</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Nivel jerárquico 3+</p>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="flex justify-between items-center">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="Buscar por código, nombre o descripción..."
            value={busqueda}
            onChange={handleBusquedaChange}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
          />
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {tiposFiltrados.length} resultado{tiposFiltrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla Desktop con datos paginados */}
      <TablaDesktop
        headers={["Código", "Nombre", "Nivel jerárquico", "Descripción", "Acciones"]}
        loading={loading}
        emptyMsg="No hay tipos de resolución registrados"
        emptyIcon={<Layers className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
      >
        {paginatedTipos.map(t => (
          <tr key={t.idTipoRes} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td className="px-6 py-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-mono text-sm font-bold">
                {t.codigo}
              </span>
            </td>
            <td className="px-6 py-4 font-semibold text-gray-800 dark:text-white text-sm">{t.nombre}</td>
            <td className="px-6 py-4">
              <span className="text-amber-500 tracking-widest">{nivelStars(t.nivelJerarquico)}</span>
              <span className="text-xs text-gray-400 ml-2">Nivel {t.nivelJerarquico}</span>
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{t.descripcion ?? "—"}</td>
            <td className="px-6 py-4">
              <ActionBtns onEdit={() => abrirEditar(t)} onDelete={() => eliminar(t)} disabled={saving} />
            </td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, tiposFiltrados.length)} de {tiposFiltrados.length}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Cards Móvil con datos paginados */}
      <div className="lg:hidden space-y-3">
        {paginatedTipos.map(t => (
          <div key={t.idTipoRes} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-mono text-sm font-bold">
                  {t.codigo}
                </span>
                <p className="font-semibold text-gray-800 dark:text-white mt-1">{t.nombre}</p>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => abrirEditar(t)} 
                  disabled={saving}
                  className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => eliminar(t)} 
                  disabled={deletingId === t.idTipoRes}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <span className="text-amber-500 tracking-widest text-sm">{nivelStars(t.nivelJerarquico)}</span>
            <span className="text-xs text-gray-400 ml-2">Nivel {t.nivelJerarquico}</span>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title={editando ? "Editar tipo de resolución" : "Nuevo tipo de resolución"}
          icon={<Layers className="w-5 h-5 text-purple-500" />}
        >
          <div className="grid grid-cols-2 gap-x-4">
            <Field 
              label="Código" 
              value={form.codigo} 
              onChange={f("codigo")} 
              placeholder="Ej: SENT" 
              required 
              disabled={saving}
            />
            <Field 
              label="Nivel jerárquico" 
              value={form.nivelJerarquico} 
              onChange={f("nivelJerarquico")} 
              type="number" 
              disabled={saving}
            />
          </div>
          <Field 
            label="Nombre" 
            value={form.nombre} 
            onChange={f("nombre")} 
            placeholder="Ej: Sentencia" 
            required 
            disabled={saving}
          />
          <TextareaField 
            label="Descripción" 
            value={form.descripcion} 
            onChange={f("descripcion")}
            disabled={saving}
          />
          <ErrorBox msg={err} />
          <ModalFooter 
            onCancel={() => setModal(false)} 
            onSave={guardar} 
            saveLabel={editando ? "Guardar" : "Crear tipo"}
            saving={saving}
          />
        </Modal>
      )}
    </div>
  );
}