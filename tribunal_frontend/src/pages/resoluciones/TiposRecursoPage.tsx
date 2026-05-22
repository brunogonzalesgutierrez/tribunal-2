// ─── src/pages/resoluciones/TiposRecursoPage.tsx ─────────────────────────────
import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_TIPOS_RECURSO,
  CREAR_TIPO_RECURSO, ACTUALIZAR_TIPO_RECURSO, ELIMINAR_TIPO_RECURSO,
} from "../../graphql/resoluciones";
import { ClipboardList, Plus, Edit, Trash2 } from "lucide-react";
import {
  TipoRecurso,
  Modal, Field, TextareaField,
  ErrorBox, ModalFooter, StatCard, TablaDesktop, ActionBtns,
} from "./shared";

export default function TiposRecursoPage() {
  const { data, loading, refetch } = useQuery(GET_TIPOS_RECURSO);
  const [crear]      = useMutation(CREAR_TIPO_RECURSO);
  const [actualizar] = useMutation(ACTUALIZAR_TIPO_RECURSO);
  const [eliminar_m] = useMutation(ELIMINAR_TIPO_RECURSO);

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<TipoRecurso | null>(null);
  const [err, setErr]       = useState("");

  const initForm = { nombre: "", descripcion: "" };
  const [form, setForm] = useState(initForm);
  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const tipos: TipoRecurso[] = data?.allTiposRecurso ?? [];

  const conDesc    = tipos.filter(t => t.descripcion?.trim()).length;
  const sinDesc    = tipos.filter(t => !t.descripcion?.trim()).length;

  const abrirCrear = () => { setEdit(null); setForm(initForm); setErr(""); setModal(true); };
  const abrirEditar = (t: TipoRecurso) => {
    setEdit(t);
    setForm({ nombre: t.nombre, descripcion: t.descripcion ?? "" });
    setErr(""); setModal(true);
  };

  const guardar = async () => {
    if (!form.nombre) { setErr("El nombre es obligatorio."); return; }
    try {
      if (editando) {
        await actualizar({ variables: { id: Number(editando.idTipoRecurso), input: {
          nombre: form.nombre, descripcion: form.descripcion || undefined,
        }}});
      } else {
        await crear({ variables: { nombre: form.nombre, descripcion: form.descripcion || undefined } });
      }
      await refetch(); setModal(false);
    } catch (e: any) { setErr(e.message ?? "Error."); }
  };

  const eliminar = async (t: TipoRecurso) => {
    if (!window.confirm(`¿Eliminar el tipo "${t.nombre}"?`)) return;
    const { data } = await eliminar_m({ variables: { id: Number(t.idTipoRecurso) } });
    if (!data?.eliminarTipoRecurso?.ok) {
      alert(data?.eliminarTipoRecurso?.mensaje ?? "No se pudo eliminar."); return;
    }
    refetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-emerald-500" />
            Tipos de Recurso
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Clasificación de recursos legales disponibles • {tipos.length} tipos
          </p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> Nuevo tipo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total tipos" value={tipos.length} color="text-emerald-600 dark:text-emerald-400"
          icon={<ClipboardList className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
          sub="Registrados en el sistema" />
        <StatCard label="Con descripción" value={conDesc} color="text-blue-600 dark:text-blue-400"
          icon={<ClipboardList className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
          sub={`${Math.round((conDesc / (tipos.length || 1)) * 100)}% del total`} />
        <StatCard label="Sin descripción" value={sinDesc} color="text-amber-600 dark:text-amber-400"
          icon={<ClipboardList className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
          sub="Pendientes de documentar" />
      </div>

      {/* Tabla Desktop */}
      <TablaDesktop
        headers={["Nombre", "Descripción", "Acciones"]}
        loading={loading}
        emptyMsg="No hay tipos de recurso registrados"
        emptyIcon={<ClipboardList className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
      >
        {tipos.map(t => (
          <tr key={t.idTipoRecurso} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td className="px-6 py-4 font-semibold text-gray-800 dark:text-white text-sm">{t.nombre}</td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-md">
              {t.descripcion || <span className="italic text-gray-400">Sin descripción</span>}
            </td>
            <td className="px-6 py-4">
              <ActionBtns onEdit={() => abrirEditar(t)} onDelete={() => eliminar(t)} />
            </td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Cards Móvil */}
      <div className="lg:hidden space-y-3">
        {tipos.map(t => (
          <div key={t.idTipoRecurso} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1 pr-2">
                <p className="font-semibold text-gray-800 dark:text-white">{t.nombre}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t.descripcion || <span className="italic">Sin descripción</span>}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => abrirEditar(t)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => eliminar(t)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title={editando ? "Editar tipo de recurso" : "Nuevo tipo de recurso"}
          icon={<ClipboardList className="w-5 h-5 text-emerald-500" />}
        >
          <Field label="Nombre" value={form.nombre} onChange={f("nombre")} placeholder="Ej: Apelación, Casación..." required />
          <TextareaField label="Descripción" value={form.descripcion} onChange={f("descripcion")} />
          <ErrorBox msg={err} />
          <ModalFooter onCancel={() => setModal(false)} onSave={guardar} saveLabel={editando ? "Guardar" : "Crear tipo"} />
        </Modal>
      )}
    </div>
  );
}