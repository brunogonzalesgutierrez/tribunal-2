import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_TIPOS_DOC,
  CREAR_TIPO_DOC,
  ACTUALIZAR_TIPO_DOC,
  ELIMINAR_TIPO_DOC,
} from "../../graphql/documento";
import { Tag, Plus, Edit, Trash2, ShieldCheck, Globe } from "lucide-react";
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

  // ✅ HOOK DE NOTIFICACIONES
  const { executeCreate, executeUpdate, executeDelete, toast } = useCrudNotifications("Tipo de Documento");

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<TipoDoc | null>(null);
  const [form, setForm]     = useState(initForm);
  const [busqueda, setBusq] = useState("");
  const [err, setErr]       = useState("");

  const tipos: TipoDoc[] = data?.allTiposDoc ?? [];
  const filtrados = tipos.filter(t =>
    `${t.codigo} ${t.nombre} ${t.descripcion ?? ""}`.toLowerCase().includes(busqueda.toLowerCase())
  );

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

  // ✅ GUARDAR CON NOTIFICACIONES
  const guardar = async () => {
    if (!form.codigo || !form.nombre) { 
      toast.error("Código y nombre son obligatorios."); 
      return; 
    }
    
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
    }
  };

  // ✅ ELIMINAR CON NOTIFICACIONES
  const eliminar = async (t: TipoDoc) => {
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
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> Nuevo tipo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total tipos" value={tipos.length} color="text-purple-600 dark:text-purple-400"
          icon={<Tag className="w-6 h-6 text-purple-600 dark:text-purple-400" />} sub="Tipos de documento" />
        <StatCard label="Requieren firma" value={requierenFirma} color="text-amber-600 dark:text-amber-400"
          icon={<ShieldCheck className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
          sub={`${Math.round((requierenFirma / (tipos.length || 1)) * 100)}% del total`} />
        <StatCard label="Públicos" value={publicos} color="text-emerald-600 dark:text-emerald-400"
          icon={<Globe className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
          sub={`${Math.round((publicos / (tipos.length || 1)) * 100)}% del total`} />
      </div>

      {/* Barra de búsqueda */}
      <div className="flex justify-between items-center">
        <SearchBar value={busqueda} onChange={setBusq} placeholder="Buscar por código o nombre..." />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla Desktop */}
      <TablaDesktop
        headers={["Código", "Nombre", "Requiere firma", "Público", "Descripción", "Acciones"]}
        loading={loading}
        emptyMsg="No hay tipos de documento"
        emptyIcon={<Tag className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
      >
        {filtrados.map(t => (
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
              <ActionBtns onEdit={() => abrirEditar(t)} onDelete={() => eliminar(t)} />
            </td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Cards Móvil */}
      <div className="lg:hidden space-y-3">
        {filtrados.map(t => (
          <div key={t.idTipoDoc} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="font-mono text-blue-500 font-bold">{t.codigo}</span>
                <p className="font-semibold text-gray-800 dark:text-white text-sm mt-0.5">{t.nombre}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => abrirEditar(t)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => eliminar(t)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
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
          <Field label="Código" value={form.codigo} onChange={f("codigo")} required placeholder="ej: SENT, RES, MEM" />
          <Field label="Nombre" value={form.nombre} onChange={f("nombre")} required />
          <Field label="Descripción" value={form.descripcion} onChange={f("descripcion")} placeholder="Descripción opcional..." />
          <CheckboxField label="Requiere firma digital" value={form.requiereFirma} onChange={fb("requiereFirma")} />
          <CheckboxField label="Es público" value={form.esPublico} onChange={fb("esPublico")} />
          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)} 
            onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Crear tipo"}
          />
        </Modal>
      )}
    </div>
  );
}