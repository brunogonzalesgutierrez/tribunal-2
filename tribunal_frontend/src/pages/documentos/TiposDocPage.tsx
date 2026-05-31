import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_TIPOS_DOC,
  CREAR_TIPO_DOC,
  ACTUALIZAR_TIPO_DOC,
  ELIMINAR_TIPO_DOC,
} from "../../graphql/documento";
import { Tag, Plus, Edit, Trash2, ShieldCheck, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import {
  TipoDoc,
  BoolBadge,
  Modal, Field, CheckboxField, ErrorBox, ModalFooter,
  StatCard, TablaDesktop, ActionBtns, SearchBar,
} from "./shared";
import { useCrudNotifications } from "../../hooks/useCrudNotifications";
import { useToast } from "../../context/ToastContext";

const initForm = {
  codigo: "",
  nombre: "",
  descripcion: "",
  requiereFirma: false,
  esPublico: true,
};

export default function TiposDocPage() {
  const { data, loading, refetch } = useQuery(GET_TIPOS_DOC);
  const [crearTipoDoc]      = useMutation(CREAR_TIPO_DOC);
  const [actualizarTipoDoc] = useMutation(ACTUALIZAR_TIPO_DOC);
  const [eliminarTipoDoc]   = useMutation(ELIMINAR_TIPO_DOC);

  const { executeCreate, executeUpdate, executeDelete, toast } = useCrudNotifications("Tipo de Documento");

  // ✅ Estado para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ Estado para bloqueo de botones
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<TipoDoc | null>(null);
  const [form, setForm]     = useState(initForm);
  const [busqueda, setBusq] = useState("");
  const [err, setErr]       = useState("");

  const tipos: TipoDoc[] = data?.allTiposDoc ?? [];
  
  // ✅ Filtrar tipos por búsqueda
  const tiposFiltrados = tipos.filter(t =>
    `${t.codigo} ${t.nombre} ${t.descripcion ?? ""}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  // ✅ Paginación
  const totalPages = Math.ceil(tiposFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTipos = tiposFiltrados.slice(startIndex, startIndex + itemsPerPage);

  // Stats
  const requierenFirma = tipos.filter(t => t.requiereFirma).length;
  const publicos       = tipos.filter(t => t.esPublico).length;

  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));
  const fb = (k: string) => (v: boolean) => setForm(p => ({ ...p, [k]: v }));

  const abrirCrear = () => { 
    setEdit(null); 
    setForm(initForm); 
    setErr(""); 
    setModal(true); 
  };
  
  const abrirEditar = (t: TipoDoc) => {
    setEdit(t);
    setForm({
      codigo:       t.codigo,
      nombre:       t.nombre,
      descripcion:  t.descripcion ?? "",
      requiereFirma: t.requiereFirma,
      esPublico:    t.esPublico,
    });
    setErr(""); 
    setModal(true);
  };

  // Resetear página cuando cambia la búsqueda
  const handleBusquedaChange = (value: string) => {
    setBusq(value);
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
          await actualizarTipoDoc({
            variables: {
              id: Number(editando.idTipoDoc),
              input: {
                codigo:       form.codigo,
                nombre:       form.nombre,
                descripcion:  form.descripcion || undefined,
                requiereFirma: form.requiereFirma,
                esPublico:    form.esPublico,
              },
            },
          });
          await refetch(); 
          setModal(false);
          return true;
        });
      } else {
        await executeCreate(async () => {
          await crearTipoDoc({
            variables: {
              codigo:       form.codigo,
              nombre:       form.nombre,
              descripcion:  form.descripcion || undefined,
              requiereFirma: form.requiereFirma,
              esPublico:    form.esPublico,
            },
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
  const eliminar = async (t: TipoDoc) => {
    if (deletingId === t.idTipoDoc) return;
    setDeletingId(t.idTipoDoc);
    
    try {
      await executeDelete(
        async () => {
          const { data } = await eliminarTipoDoc({ variables: { id: Number(t.idTipoDoc) } });
          if (!data?.eliminarTipoDoc?.ok) {
            throw new Error(data?.eliminarTipoDoc?.mensaje ?? "No se pudo eliminar.");
          }
          await refetch();
          return true;
        },
        {
          loading: `Eliminando tipo "${t.nombre}"...`,
          success: `Tipo "${t.nombre}" eliminado exitosamente`,
          error: `Error al eliminar el tipo "${t.nombre}"`,
        },
        `¿Eliminar el tipo de documento "${t.nombre}"?`
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
            <Tag className="w-7 h-7 text-purple-500" />
            Tipos de Documento
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Clasificación documental • {tipos.length} tipos registrados
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
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total tipos</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{tipos.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Tag className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Tipos de documento</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Requieren firma</p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">{requierenFirma}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">{Math.round((requierenFirma / (tipos.length || 1)) * 100)}% del total</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Públicos</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{publicos}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Globe className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">{Math.round((publicos / (tipos.length || 1)) * 100)}% del total</p>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="flex justify-between items-center">
        <SearchBar value={busqueda} onChange={handleBusquedaChange} placeholder="Buscar por código o nombre..." />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {tiposFiltrados.length} resultado{tiposFiltrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla Desktop con datos paginados */}
      <TablaDesktop
        headers={["Código", "Nombre", "Requiere firma", "Público", "Descripción", "Acciones"]}
        loading={loading}
        emptyMsg="No hay tipos de documento"
        emptyIcon={<Tag className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
      >
        {paginatedTipos.map(t => (
          <tr key={t.idTipoDoc} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td className="px-6 py-4">
              <span className="font-mono text-blue-500 font-bold text-sm">{t.codigo}</span>
            </td>
            <td className="px-6 py-4 font-semibold text-gray-800 dark:text-white text-sm">
              {t.nombre}
            </td>
            <td className="px-6 py-4">
              <BoolBadge val={t.requiereFirma} si="Sí" no="No" />
            </td>
            <td className="px-6 py-4">
              <BoolBadge val={t.esPublico} si="Público" no="Privado" />
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
              {t.descripcion ?? "—"}
            </td>
            <td className="px-6 py-4">
              <ActionBtns 
                onEdit={() => abrirEditar(t)} 
                onDelete={() => eliminar(t)} 
                disabled={saving}
              />
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
          <div key={t.idTipoDoc} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="font-mono text-blue-500 font-bold">{t.codigo}</span>
                <p className="font-semibold text-gray-800 dark:text-white text-sm mt-0.5">{t.nombre}</p>
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
                  disabled={deletingId === t.idTipoDoc}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <BoolBadge val={t.requiereFirma} si="Requiere firma" no="Sin firma" />
              <BoolBadge val={t.esPublico} si="Público" no="Privado" />
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title={editando ? "Editar tipo de documento" : "Nuevo tipo de documento"}
          icon={<Tag className="w-5 h-5 text-purple-500" />}
        >
          <Field 
            label="Código" 
            value={form.codigo} 
            onChange={f("codigo")} 
            required 
            placeholder="ej: SENT, RES, MEM"
            disabled={saving}
          />
          <Field 
            label="Nombre" 
            value={form.nombre} 
            onChange={f("nombre")} 
            required
            disabled={saving}
          />
          <Field 
            label="Descripción" 
            value={form.descripcion} 
            onChange={f("descripcion")} 
            placeholder="Descripción opcional..."
            disabled={saving}
          />
          <CheckboxField 
            label="Requiere firma digital" 
            value={form.requiereFirma} 
            onChange={fb("requiereFirma")}
            disabled={saving}
          />
          <CheckboxField 
            label="Es público" 
            value={form.esPublico} 
            onChange={fb("esPublico")}
            disabled={saving}
          />
          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)} 
            onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Crear tipo"}
            saving={saving}
          />
        </Modal>
      )}
    </div>
  );
}