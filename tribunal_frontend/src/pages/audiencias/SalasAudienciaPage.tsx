import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_SALAS_AUDIENCIA,
  GET_TRIBUNALES_SIMPLE,
  CREAR_SALA_AUDIENCIA,
  ACTUALIZAR_SALA_AUDIENCIA,
  ELIMINAR_SALA_AUDIENCIA,
} from "../../graphql/audiencias";
import { DoorOpen, Plus, Edit, Trash2, CheckCircle, Circle, Video } from "lucide-react";
import {
  SalaAudiencia,
  Modal, Field, SelectField,
  ErrorBox, ModalFooter, StatCard, TablaDesktop, ActionBtns,
} from "./shared";

export default function SalasAudienciaPage() {
  const { data, loading, refetch } = useQuery(GET_SALAS_AUDIENCIA);
  const { data: dTrib }            = useQuery(GET_TRIBUNALES_SIMPLE);
  const [crearSala]      = useMutation(CREAR_SALA_AUDIENCIA);
  const [actualizarSala] = useMutation(ACTUALIZAR_SALA_AUDIENCIA);
  const [eliminarSala]   = useMutation(ELIMINAR_SALA_AUDIENCIA);

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<SalaAudiencia | null>(null);
  const [err, setErr]       = useState("");

  const initForm = {
    idTribunal: 0, nombreSala: "", capacidad: "",
    equipadaVideoconf: false, enlaceVirtual: "", activa: true,
  };
  const [form, setForm] = useState(initForm);
  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const salas: SalaAudiencia[] = data?.allSalasAudiencia ?? [];
  const tribunales              = dTrib?.allTribunales ?? [];

  const activas   = salas.filter(s => s.activa).length;
  const videoconf = salas.filter(s => s.equipadaVideoconf).length;

  const abrirCrear = () => { setEdit(null); setForm(initForm); setErr(""); setModal(true); };
  const abrirEditar = (s: SalaAudiencia) => {
    setEdit(s);
    setForm({
      idTribunal: s.idTribunal.idTribunal, nombreSala: s.nombreSala,
      capacidad: String(s.capacidad), equipadaVideoconf: s.equipadaVideoconf,
      enlaceVirtual: s.enlaceVirtual ?? "", activa: s.activa,
    });
    setErr(""); setModal(true);
  };

  const guardar = async () => {
    if (!form.nombreSala || !form.capacidad) { setErr("Nombre y capacidad son obligatorios."); return; }
    try {
      if (editando) {
        await actualizarSala({
          variables: {
            id: Number(editando.idSalaAud),
            input: {
              nombreSala: form.nombreSala, capacidad: Number(form.capacidad),
              equipadaVideoconf: form.equipadaVideoconf,
              enlaceVirtual: form.enlaceVirtual || undefined, activa: form.activa,
            },
          },
        });
      } else {
        if (!form.idTribunal) { setErr("El tribunal es obligatorio."); return; }
        await crearSala({
          variables: {
            idTribunal: Number(form.idTribunal), nombreSala: form.nombreSala,
            capacidad: Number(form.capacidad), equipadaVideoconf: form.equipadaVideoconf,
            enlaceVirtual: form.enlaceVirtual || undefined, activa: form.activa,
          },
        });
      }
      await refetch(); setModal(false);
    } catch (e: any) { setErr(e.message ?? "Error."); }
  };

  const eliminar = async (s: SalaAudiencia) => {
    if (!window.confirm(`¿Eliminar la sala "${s.nombreSala}"?`)) return;
    const { data } = await eliminarSala({ variables: { id: Number(s.idSalaAud) } });
    if (!data?.eliminarSalaAudiencia?.ok) {
      alert(data?.eliminarSalaAudiencia?.mensaje ?? "No se pudo eliminar."); return;
    }
    refetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <DoorOpen className="w-7 h-7 text-blue-500" />
            Salas de Audiencia
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestión de salas judiciales • {salas.length} registradas
          </p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> Nueva sala
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total salas" value={salas.length} color="text-blue-600 dark:text-blue-400"
          icon={<DoorOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />} sub="Registradas en el sistema" />
        <StatCard label="Salas activas" value={activas} color="text-emerald-600 dark:text-emerald-400"
          icon={<CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
          sub={`${salas.length - activas} inactiva${salas.length - activas !== 1 ? "s" : ""}`} />
        <StatCard label="Con videoconf." value={videoconf} color="text-purple-600 dark:text-purple-400"
          icon={<Video className="w-6 h-6 text-purple-600 dark:text-purple-400" />} sub="Equipadas para sesiones remotas" />
      </div>

      {/* Tabla Desktop */}
      <TablaDesktop
        headers={["Nombre", "Tribunal", "Capacidad", "Videoconf.", "Enlace virtual", "Estado", "Acciones"]}
        loading={loading}
        emptyMsg="No hay salas de audiencia"
        emptyIcon={<DoorOpen className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
      >
        {salas.map(s => (
          <tr key={s.idSalaAud} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td className="px-6 py-4 font-semibold text-gray-800 dark:text-white">{s.nombreSala}</td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{s.idTribunal.nombreTribunal}</td>
            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">{s.capacidad} personas</td>
            <td className="px-6 py-4">
              <span className={`text-sm font-medium ${s.equipadaVideoconf ? "text-purple-600 dark:text-purple-400" : "text-gray-400"}`}>
                {s.equipadaVideoconf ? "✓ Sí" : "✗ No"}
              </span>
            </td>
            <td className="px-6 py-4">
              {s.enlaceVirtual ? (
                <a href={s.enlaceVirtual} target="_blank" rel="noreferrer"
                  className="text-blue-500 text-xs flex items-center gap-1 hover:underline">
                  <Video className="w-3.5 h-3.5" /> Enlace
                </a>
              ) : <span className="text-gray-400 text-sm">—</span>}
            </td>
            <td className="px-6 py-4">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                s.activa
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
              }`}>
                {s.activa ? <CheckCircle className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                {s.activa ? "Activa" : "Inactiva"}
              </span>
            </td>
            <td className="px-6 py-4">
              <ActionBtns onEdit={() => abrirEditar(s)} onDelete={() => eliminar(s)} />
            </td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Cards Móvil */}
      <div className="lg:hidden space-y-3">
        {salas.map(s => (
          <div key={s.idSalaAud} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-semibold text-gray-800 dark:text-white">{s.nombreSala}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.idTribunal.nombreTribunal}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => abrirEditar(s)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => eliminar(s)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${s.equipadaVideoconf ? "text-purple-600 dark:text-purple-400" : "text-gray-400"}`}>
                {s.equipadaVideoconf ? "📹 Videoconf." : "Sin videoconf."}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                s.activa
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
              }`}>
                {s.activa ? "Activa" : "Inactiva"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title={editando ? "Editar sala" : "Nueva sala de audiencia"}
          icon={<DoorOpen className="w-5 h-5 text-blue-500" />}
        >
          {!editando && (
            <SelectField label="Tribunal" value={form.idTribunal} onChange={f("idTribunal")} required>
              <option value={0}>— Seleccionar tribunal —</option>
              {tribunales.map((t: any) => (
                <option key={t.idTribunal} value={t.idTribunal}>{t.nombreTribunal}</option>
              ))}
            </SelectField>
          )}
          <Field label="Nombre de la sala" value={form.nombreSala} onChange={f("nombreSala")} required />
          <Field label="Capacidad (personas)" value={form.capacidad} onChange={f("capacidad")} type="number" required />
          <Field label="Enlace virtual" value={form.enlaceVirtual} onChange={f("enlaceVirtual")} placeholder="https://..." />
          <div className="mb-4 flex gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
              <input type="checkbox" checked={form.equipadaVideoconf}
                onChange={e => setForm(p => ({ ...p, equipadaVideoconf: e.target.checked }))} className="rounded" />
              Equipada para videoconferencia
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
              <input type="checkbox" checked={form.activa}
                onChange={e => setForm(p => ({ ...p, activa: e.target.checked }))} className="rounded" />
              Activa
            </label>
          </div>
          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)} onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Crear sala"}
          />
        </Modal>
      )}
    </div>
  );
}
