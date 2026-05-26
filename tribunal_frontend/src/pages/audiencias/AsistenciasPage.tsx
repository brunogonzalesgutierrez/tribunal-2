import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_ASISTENCIAS,
  GET_AUDIENCIAS,
  GET_PERSONAS_SIMPLE,
  REGISTRAR_ASISTENCIA,
  ACTUALIZAR_ASISTENCIA,
  ELIMINAR_ASISTENCIA,
} from "../../graphql/audiencias";
import { Users, Plus, Edit, Trash2, CheckCircle, Circle } from "lucide-react";
import {
  Asistencia,
  fmt, Modal, SelectField, Field, TextareaField,
  ErrorBox, ModalFooter, StatCard, TablaDesktop, ActionBtns,
} from "./shared";

export default function AsistenciasPage() {
  const { data, loading, refetch } = useQuery(GET_ASISTENCIAS);
  const { data: dAud }  = useQuery(GET_AUDIENCIAS);
  const { data: dPers } = useQuery(GET_PERSONAS_SIMPLE);
  const [registrar]  = useMutation(REGISTRAR_ASISTENCIA);
  const [actualizar] = useMutation(ACTUALIZAR_ASISTENCIA);
  const [eliminarAs] = useMutation(ELIMINAR_ASISTENCIA);

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<Asistencia | null>(null);
  const [err, setErr]       = useState("");

  // ✅ AÑADIDO: campo horaIngreso al formulario
  const initForm = { 
    idAudiencia: 0, 
    idPersona: 0, 
    rolEnAudiencia: "", 
    asistio: true, 
    motivoInasistencia: "",
    horaIngreso: ""  // ← Campo nuevo
  };
  const [form, setForm] = useState(initForm);
  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const asistencias: Asistencia[] = data?.allAsistencias ?? [];
  const audiencias                = dAud?.allAudiencias ?? [];
  const personas                  = dPers?.allPersonas ?? [];

  const asistieron   = asistencias.filter(a => a.asistio).length;
  const noAsistieron = asistencias.filter(a => !a.asistio).length;

  const abrirCrear = () => { 
    setEdit(null); 
    setForm({ ...initForm, horaIngreso: "" }); 
    setErr(""); 
    setModal(true); 
  };

  // ✅ ACTUALIZADO: al editar, formatear la hora para el input datetime-local
  const abrirEditar = (a: Asistencia) => {
    setEdit(a);
    setForm({
      idAudiencia: a.idAudiencia.idAudiencia,
      idPersona: a.idPersona.idPersona,
      rolEnAudiencia: a.rolEnAudiencia,
      asistio: a.asistio,
      motivoInasistencia: a.motivoInasistencia ?? "",
      horaIngreso: a.horaIngreso ? new Date(a.horaIngreso).toISOString().slice(0, 16) : "",
    });
    setErr(""); 
    setModal(true);
  };

  // ✅ ACTUALIZADO: enviar horaIngreso en la mutación
  const guardar = async () => {
    try {
      if (editando) {
        await actualizar({
          variables: {
            id: Number(editando.idAsistencia),
            input: { 
              asistio: form.asistio, 
              motivoInasistencia: form.motivoInasistencia || undefined,
              horaIngreso: form.asistio ? (form.horaIngreso || null) : null
            },
          },
        });
      } else {
        if (!form.idAudiencia || !form.idPersona || !form.rolEnAudiencia) {
          setErr("Audiencia, persona y rol son obligatorios."); 
          return;
        }
        await registrar({
          variables: {
            idAudiencia: Number(form.idAudiencia),
            idPersona: Number(form.idPersona),
            rolEnAudiencia: form.rolEnAudiencia,
            asistio: form.asistio,
            horaIngreso: form.asistio ? (form.horaIngreso || null) : null
          },
        });
      }
      await refetch(); 
      setModal(false);
    } catch (e: any) { 
      setErr(e.message ?? "Error."); 
    }
  };

  const eliminar = async (a: Asistencia) => {
    if (!window.confirm(`¿Eliminar el registro de ${a.idPersona.nombre} ${a.idPersona.primerApellido}?`)) return;
    const { data } = await eliminarAs({ variables: { id: Number(a.idAsistencia) } });
    if (!data?.eliminarAsistencia?.ok) {
      alert(data?.eliminarAsistencia?.mensaje ?? "No se pudo eliminar."); 
      return;
    }
    refetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-500" />
            Asistencias
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Registro de asistencia a audiencias • {asistencias.length} registros
          </p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> Registrar asistencia
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total registros" value={asistencias.length} color="text-blue-600 dark:text-blue-400"
          icon={<Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />} sub="Participantes registrados" />
        <StatCard label="Asistieron" value={asistieron} color="text-emerald-600 dark:text-emerald-400"
          icon={<CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
          sub={`${Math.round((asistieron / (asistencias.length || 1)) * 100)}% del total`} />
        <StatCard label="Inasistencias" value={noAsistieron} color="text-red-600 dark:text-red-400"
          icon={<Circle className="w-6 h-6 text-red-600 dark:text-red-400" />}
          sub={`${Math.round((noAsistieron / (asistencias.length || 1)) * 100)}% del total`} />
      </div>

      {/* Tabla Desktop */}
      <TablaDesktop
        headers={["Persona", "Audiencia", "Rol", "Asistió", "Hora ingreso", "Acciones"]}
        loading={loading}
        emptyMsg="No hay registros de asistencia"
        emptyIcon={<Users className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
      >
        {asistencias.map(a => (
          <tr key={a.idAsistencia} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {a.idPersona.nombre.charAt(0)}{a.idPersona.primerApellido.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white text-sm">
                    {a.idPersona.nombre} {a.idPersona.primerApellido}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">{a.idPersona.numeroDocumento}</p>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="text-blue-500 font-medium">#{a.idAudiencia.idExpediente.numeroExpediente}</span>
              <div className="text-xs mt-0.5">{fmt(a.idAudiencia.fechaHoraProgramada)}</div>
            </td>
            <td className="px-6 py-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                {a.rolEnAudiencia}
              </span>
            </td>
            <td className="px-6 py-4">
              <span className={`font-semibold text-sm ${a.asistio ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                {a.asistio ? "✓ Sí" : "✗ No"}
              </span>
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">
              {a.horaIngreso ? fmt(a.horaIngreso) : "—"}
            </td>
            <td className="px-6 py-4">
              <ActionBtns onEdit={() => abrirEditar(a)} onDelete={() => eliminar(a)} />
            </td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Cards Móvil */}
      <div className="lg:hidden space-y-3">
        {asistencias.map(a => (
          <div key={a.idAsistencia} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {a.idPersona.nombre.charAt(0)}{a.idPersona.primerApellido.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white text-sm">
                    {a.idPersona.nombre} {a.idPersona.primerApellido}
                  </p>
                  <p className="text-xs text-gray-400">{a.rolEnAudiencia}</p>
                </div>
              </div>
              <span className={`font-bold text-sm ${a.asistio ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                {a.asistio ? "✓" : "✗"}
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center">
              <span className="text-xs text-blue-500">#{a.idAudiencia.idExpediente.numeroExpediente}</span>
              <div className="flex gap-1">
                <button onClick={() => abrirEditar(a)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => eliminar(a)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal actualizado con campo horaIngreso */}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title={editando ? "Editar asistencia" : "Registrar asistencia"}
          icon={<Users className="w-5 h-5 text-blue-500" />}
        >
          {!editando && (
            <>
              <SelectField label="Audiencia" value={form.idAudiencia} onChange={f("idAudiencia")} required>
                <option value={0}>— Seleccionar audiencia —</option>
                {audiencias.map((a: any) => (
                  <option key={a.idAudiencia} value={a.idAudiencia}>
                    #{a.idExpediente.numeroExpediente} — {fmt(a.fechaHoraProgramada)}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Persona" value={form.idPersona} onChange={f("idPersona")} required>
                <option value={0}>— Seleccionar persona —</option>
                {personas.map((p: any) => (
                  <option key={p.idPersona} value={p.idPersona}>
                    {p.nombre} {p.primerApellido} — {p.numeroDocumento}
                  </option>
                ))}
              </SelectField>
              <Field label="Rol en audiencia" value={form.rolEnAudiencia} onChange={f("rolEnAudiencia")}
                placeholder="Ej: Demandante, Abogado defensor..." required />
            </>
          )}

          {/* Checkbox de asistió */}
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
              <input 
                type="checkbox" 
                checked={form.asistio}
                onChange={e => setForm(p => ({ ...p, asistio: e.target.checked }))} 
                className="rounded" 
              />
              Asistió a la audiencia
            </label>
          </div>

          {/* ✅ Campo de hora de ingreso - solo si asistió */}
          {form.asistio && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Hora de ingreso <span className="text-gray-400">(opcional)</span>
              </label>
              <input
                type="datetime-local"
                value={form.horaIngreso}
                onChange={e => setForm(p => ({ ...p, horaIngreso: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">Dejar vacío para usar la hora actual</p>
            </div>
          )}

          {/* Motivo de inasistencia - solo si NO asistió */}
          {!form.asistio && (
            <TextareaField 
              label="Motivo de inasistencia" 
              value={form.motivoInasistencia} 
              onChange={f("motivoInasistencia")} 
            />
          )}

          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)} 
            onSave={guardar}
            saveLabel={editando ? "Guardar" : "Registrar"}
          />
        </Modal>
      )}
    </div>
  );
}