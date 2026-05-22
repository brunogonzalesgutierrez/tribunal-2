import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_TIPOS_AUDIENCIA,
  GET_TIPOS_PROCESO_SIMPLE,
  CREAR_TIPO_AUDIENCIA,
  ELIMINAR_TIPO_AUDIENCIA,
} from "../../graphql/audiencias";
import { ClipboardList, Plus, Trash2, Clock } from "lucide-react";
import {
  TipoAudiencia,
  Modal, Field, SelectField, TextareaField,
  ErrorBox, ModalFooter, StatCard, TablaDesktop,
} from "./shared";

export default function TiposAudienciaPage() {
  const { data, loading, refetch } = useQuery(GET_TIPOS_AUDIENCIA);
  const { data: dTipoProc }        = useQuery(GET_TIPOS_PROCESO_SIMPLE);
  const [crearTipo]    = useMutation(CREAR_TIPO_AUDIENCIA);
  const [eliminarTipo] = useMutation(ELIMINAR_TIPO_AUDIENCIA);

  const [modal, setModal] = useState(false);
  const [err, setErr]     = useState("");
  const [form, setForm]   = useState({ nombre: "", duracionEstimada: "", idTipoProceso: 0, descripcion: "" });
  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const tipos: TipoAudiencia[] = data?.allTiposAudiencia ?? [];
  const tiposProceso           = dTipoProc?.allTiposProceso ?? [];

  const guardar = async () => {
    if (!form.nombre || !form.duracionEstimada || !form.idTipoProceso) {
      setErr("Nombre, duración y tipo de proceso son obligatorios."); return;
    }
    try {
      await crearTipo({
        variables: {
          nombre: form.nombre,
          duracionEstimada: Number(form.duracionEstimada),
          idTipoProceso: Number(form.idTipoProceso),
          descripcion: form.descripcion || undefined,
        },
      });
      await refetch();
      setModal(false);
      setForm({ nombre: "", duracionEstimada: "", idTipoProceso: 0, descripcion: "" });
    } catch (e: any) { setErr(e.message ?? "Error."); }
  };

  const eliminar = async (t: TipoAudiencia) => {
    if (!window.confirm(`¿Eliminar el tipo "${t.nombre}"?`)) return;
    const { data } = await eliminarTipo({ variables: { id: Number(t.idTipoAudiencia) } });
    if (!data?.eliminarTipoAudiencia?.ok) {
      alert(data?.eliminarTipoAudiencia?.mensaje ?? "No se pudo eliminar."); return;
    }
    refetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-blue-500" />
            Tipos de Audiencia
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configuración de tipos de audiencia • {tipos.length} registros
          </p>
        </div>
        <button
          onClick={() => { setErr(""); setModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> Nuevo tipo
        </button>
      </div>

      {/* Stat */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total tipos" value={tipos.length}
          color="text-blue-600 dark:text-blue-400"
          icon={<ClipboardList className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
          sub="Tipos de audiencia registrados"
        />
        <StatCard
          label="Duración promedio"
          value={tipos.length ? `${Math.round(tipos.reduce((s, t) => s + t.duracionEstimada, 0) / tipos.length)} min` : "—"}
          color="text-emerald-600 dark:text-emerald-400"
          icon={<Clock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
          sub="Promedio de duración estimada"
        />
        <StatCard
          label="Tipos de proceso"
          value={new Set(tipos.map(t => t.idTipoProceso.idTipoProceso)).size}
          color="text-purple-600 dark:text-purple-400"
          icon={<ClipboardList className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
          sub="Procesos cubiertos"
        />
      </div>

      {/* Tabla */}
      <TablaDesktop
        headers={["Nombre", "Duración", "Tipo de proceso", "Descripción", "Acciones"]}
        loading={loading}
        emptyMsg="No hay tipos de audiencia"
        emptyIcon={<ClipboardList className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
      >
        {tipos.map(t => (
          <tr key={t.idTipoAudiencia} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td className="px-6 py-4 font-semibold text-gray-800 dark:text-white">{t.nombre}</td>
            <td className="px-6 py-4">
              <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                <Clock className="w-3.5 h-3.5 text-gray-400" /> {t.duracionEstimada} min
              </span>
            </td>
            <td className="px-6 py-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                {t.idTipoProceso.nombre}
              </span>
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{t.descripcion ?? "—"}</td>
            <td className="px-6 py-4">
              <button
                onClick={() => eliminar(t)}
                className="p-2 rounded-lg text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Cards Móvil */}
      <div className="lg:hidden space-y-3">
        {tipos.map(t => (
          <div key={t.idTipoAudiencia} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-gray-800 dark:text-white">{t.nombre}</p>
                <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {t.duracionEstimada} min
                </p>
              </div>
              <button
                onClick={() => eliminar(t)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                {t.idTipoProceso.nombre}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <Modal onClose={() => setModal(false)} title="Nuevo tipo de audiencia" icon={<ClipboardList className="w-5 h-5 text-blue-500" />}>
          <Field label="Nombre" value={form.nombre} onChange={f("nombre")} required />
          <Field label="Duración estimada (minutos)" value={form.duracionEstimada} onChange={f("duracionEstimada")} type="number" required />
          <SelectField label="Tipo de proceso" value={form.idTipoProceso} onChange={f("idTipoProceso")} required>
            <option value={0}>— Seleccionar —</option>
            {tiposProceso.map((tp: any) => (
              <option key={tp.idTipoProceso} value={tp.idTipoProceso}>{tp.nombre}</option>
            ))}
          </SelectField>
          <TextareaField label="Descripción" value={form.descripcion} onChange={f("descripcion")} />
          <ErrorBox msg={err} />
          <ModalFooter onCancel={() => setModal(false)} onSave={guardar} saveLabel="Crear tipo" />
        </Modal>
      )}
    </div>
  );
}
