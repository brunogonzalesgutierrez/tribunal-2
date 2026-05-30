// ─── src/pages/resoluciones/TiposResolucionPage.tsx ──────────────────────────
import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_TIPOS_RESOLUCION,
  CREAR_TIPO_RESOLUCION, ACTUALIZAR_TIPO_RESOLUCION, ELIMINAR_TIPO_RESOLUCION,
} from "../../graphql/resoluciones";
import { Layers, Plus, Edit, Trash2 } from "lucide-react";
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

  // ✅ HOOK DE NOTIFICACIONES
  const { executeCreate, executeUpdate, executeDelete, toast } = useCrudNotifications("Tipo de Resolución");

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<TipoResolucion | null>(null);
  const [err, setErr]       = useState("");

  const initForm = { codigo: "", nombre: "", nivelJerarquico: "1", descripcion: "" };
  const [form, setForm] = useState(initForm);
  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const tipos: TipoResolucion[] = data?.allTiposResolucion ?? [];

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

  // ✅ GUARDAR CON NOTIFICACIONES
  const guardar = async () => {
    if (!form.codigo || !form.nombre) { 
      toast.error("Código y nombre son obligatorios."); 
      return; 
    }
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
    }
  };

  // ✅ ELIMINAR CON NOTIFICACIONES
  const eliminar = async (t: TipoResolucion) => {
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
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> Nuevo tipo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Primera instancia" value={nivel1} color="text-blue-600 dark:text-blue-400"
          icon={<span className="text-xl text-blue-500">★</span>}
          sub="Nivel jerárquico 1" />
        <StatCard label="Segunda instancia" value={nivel2} color="text-purple-600 dark:text-purple-400"
          icon={<span className="text-xl text-purple-500">★★</span>}
          sub="Nivel jerárquico 2" />
        <StatCard label="Tercera o superior" value={nivel3} color="text-amber-600 dark:text-amber-400"
          icon={<span className="text-xl text-amber-500">★★★</span>}
          sub="Nivel jerárquico 3+" />
      </div>

      {/* Tabla Desktop */}
      <TablaDesktop
        headers={["Código", "Nombre", "Nivel jerárquico", "Descripción", "Acciones"]}
        loading={loading}
        emptyMsg="No hay tipos de resolución registrados"
        emptyIcon={<Layers className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
      >
        {tipos.map(t => (
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
              <ActionBtns onEdit={() => abrirEditar(t)} onDelete={() => eliminar(t)} />
            </td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Cards Móvil */}
      <div className="lg:hidden space-y-3">
        {tipos.map(t => (
          <div key={t.idTipoRes} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-mono text-sm font-bold">
                  {t.codigo}
                </span>
                <p className="font-semibold text-gray-800 dark:text-white mt-1">{t.nombre}</p>
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
            <Field label="Código" value={form.codigo} onChange={f("codigo")} placeholder="Ej: SENT" required />
            <Field label="Nivel jerárquico" value={form.nivelJerarquico} onChange={f("nivelJerarquico")} type="number" />
          </div>
          <Field label="Nombre" value={form.nombre} onChange={f("nombre")} placeholder="Ej: Sentencia" required />
          <TextareaField label="Descripción" value={form.descripcion} onChange={f("descripcion")} />
          <ErrorBox msg={err} />
          <ModalFooter 
            onCancel={() => setModal(false)} 
            onSave={guardar} 
            saveLabel={editando ? "Guardar" : "Crear tipo"} 
          />
        </Modal>
      )}
    </div>
  );
}