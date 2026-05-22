// ─── src/pages/resoluciones/RecursosPage.tsx ─────────────────────────────────
import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_RECURSOS, GET_RESOLUCIONES, GET_TIPOS_RECURSO, GET_PARTES_PROCESALES_SIMPLE,
  CREAR_RECURSO, ACTUALIZAR_RECURSO, ELIMINAR_RECURSO,
} from "../../graphql/resoluciones";
import { Gavel, Plus, Edit, Trash2, Clock, CheckCircle, XCircle, Scale } from "lucide-react";
import {
  Recurso, Resolucion, TipoRecurso, ParteProcesal,
  fmt,
  Modal, SelectField, TextareaField,
  ErrorBox, ModalFooter, StatCard, TablaDesktop, ActionBtns,
  EstadoRecursoBadge,
} from "./shared";

export default function RecursosPage() {
  const { data, loading, refetch } = useQuery(GET_RECURSOS);
  const { data: dRes }    = useQuery(GET_RESOLUCIONES);
  const { data: dTipo }   = useQuery(GET_TIPOS_RECURSO);
  const { data: dPartes } = useQuery(GET_PARTES_PROCESALES_SIMPLE);

  const [crear]      = useMutation(CREAR_RECURSO);
  const [actualizar] = useMutation(ACTUALIZAR_RECURSO);
  const [eliminar_m] = useMutation(ELIMINAR_RECURSO);

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<Recurso | null>(null);
  const [err, setErr]       = useState("");
  const [busqueda, setBusq] = useState("");

  const initForm = {
    idResolucionImpugnada: 0, idTipoRecurso: 0, idRecurrente: 0,
    fundamentos: "", estadoRecurso: "PENDIENTE",
  };
  const [form, setForm] = useState(initForm);
  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const recursos: Recurso[]     = data?.allRecursos ?? [];
  const resoluciones            = dRes?.allResoluciones ?? [];
  const tipos: TipoRecurso[]    = dTipo?.allTiposRecurso ?? [];
  const partes: ParteProcesal[] = dPartes?.allPartesProcesales ?? [];

  const filtrados = recursos.filter(r =>
    `${r.idResolucionImpugnada.numeroResolucion} ${r.idTipoRecurso.nombre} ${r.estadoRecurso} ${r.idRecurrente.idPersona.nombre}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  // stats
  const pendientes = recursos.filter(r => r.estadoRecurso === "PENDIENTE").length;
  const admitidos  = recursos.filter(r => r.estadoRecurso === "ADMITIDO").length;
  const resueltos  = recursos.filter(r => r.estadoRecurso === "RESUELTO").length;
  const rechazados = recursos.filter(r => r.estadoRecurso === "RECHAZADO").length;

  const abrirCrear = () => { setEdit(null); setForm(initForm); setErr(""); setModal(true); };
  const abrirEditar = (r: Recurso) => {
    setEdit(r);
    setForm({ ...initForm, estadoRecurso: r.estadoRecurso, fundamentos: r.fundamentos });
    setErr(""); setModal(true);
  };

  const guardar = async () => {
    try {
      if (editando) {
        await actualizar({ variables: { id: Number(editando.idRecurso), input: {
          estadoRecurso: form.estadoRecurso,
          fundamentos: form.fundamentos || undefined,
        }}});
      } else {
        if (!form.idResolucionImpugnada || !form.idTipoRecurso || !form.idRecurrente) {
          setErr("Resolución, tipo de recurso y parte recurrente son obligatorios."); return;
        }
        await crear({ variables: {
          idResolucionImpugnada: Number(form.idResolucionImpugnada),
          idTipoRecurso: Number(form.idTipoRecurso),
          idRecurrente: Number(form.idRecurrente),
          fundamentos: form.fundamentos || undefined,
        }});
      }
      await refetch(); setModal(false);
    } catch (e: any) { setErr(e.message ?? "Error al guardar."); }
  };

  const eliminar = async (r: Recurso) => {
    if (!window.confirm(`¿Eliminar el recurso sobre ${r.idResolucionImpugnada.numeroResolucion}?`)) return;
    const { data } = await eliminar_m({ variables: { id: Number(r.idRecurso) } });
    if (!data?.eliminarRecurso?.ok) {
      alert(data?.eliminarRecurso?.mensaje ?? "No se pudo eliminar."); return;
    }
    refetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Gavel className="w-7 h-7 text-amber-500" />
            Recursos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Interposición y seguimiento de recursos legales • {recursos.length} registros
          </p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-sm shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> Nuevo recurso
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Pendientes" value={pendientes} color="text-amber-600 dark:text-amber-400"
          icon={<Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
          sub="Esperando resolución" />
        <StatCard label="Admitidos" value={admitidos} color="text-blue-600 dark:text-blue-400"
          icon={<Scale className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
          sub="En proceso" />
        <StatCard label="Resueltos" value={resueltos} color="text-emerald-600 dark:text-emerald-400"
          icon={<CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
          sub="Finalizados" />
        <StatCard label="Rechazados" value={rechazados} color="text-red-600 dark:text-red-400"
          icon={<XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />}
          sub="No admitidos" />
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-3">
        <input
          placeholder="Buscar por resolución, tipo, estado o recurrente..."
          value={busqueda} onChange={e => setBusq(e.target.value)}
          className="flex-1 max-w-sm px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla Desktop */}
      <TablaDesktop
        headers={["Resolución impugnada", "Tipo de recurso", "Recurrente", "Rol", "Fecha", "Estado", "Exp. alzada", "Acciones"]}
        loading={loading}
        emptyMsg="No hay recursos registrados"
        emptyIcon={<Gavel className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
      >
        {filtrados.map(r => (
          <tr key={r.idRecurso} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td className="px-6 py-4">
              <span className="font-mono font-bold text-gray-800 dark:text-white text-sm">
                {r.idResolucionImpugnada.numeroResolucion}
              </span>
              <div className="text-xs text-gray-400 mt-0.5">
                #{r.idResolucionImpugnada.idExpediente.numeroExpediente}
              </div>
            </td>
            <td className="px-6 py-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                {r.idTipoRecurso.nombre}
              </span>
            </td>
            <td className="px-6 py-4 font-semibold text-gray-800 dark:text-white text-sm">
              {r.idRecurrente.idPersona.nombre} {r.idRecurrente.idPersona.primerApellido}
            </td>
            <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
              {r.idRecurrente.idRol.nombreRol}
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">
              {fmt(r.fechaInterposicion)}
            </td>
            <td className="px-6 py-4">
              <EstadoRecursoBadge estado={r.estadoRecurso} />
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
              {r.idExpedienteAlzada
                ? <span className="text-blue-500 font-medium">#{r.idExpedienteAlzada.numeroExpediente}</span>
                : "—"}
            </td>
            <td className="px-6 py-4">
              <ActionBtns onEdit={() => abrirEditar(r)} onDelete={() => eliminar(r)} />
            </td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Cards Móvil */}
      <div className="lg:hidden space-y-3">
        {filtrados.map(r => (
          <div key={r.idRecurso} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="font-mono font-bold text-gray-800 dark:text-white">
                  {r.idResolucionImpugnada.numeroResolucion}
                </span>
                <p className="text-sm text-blue-500 mt-0.5">
                  Exp. #{r.idResolucionImpugnada.idExpediente.numeroExpediente}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                  {r.idRecurrente.idPersona.nombre} {r.idRecurrente.idPersona.primerApellido}
                </p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => abrirEditar(r)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => eliminar(r)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <EstadoRecursoBadge estado={r.estadoRecurso} />
              <span className="text-xs text-gray-400 font-mono">{fmt(r.fechaInterposicion)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title={editando ? "Editar recurso" : "Nuevo recurso"}
          icon={<Gavel className="w-5 h-5 text-amber-500" />}
        >
          {!editando && (
            <>
              <SelectField label="Resolución impugnada" value={form.idResolucionImpugnada} onChange={f("idResolucionImpugnada")} required>
                <option value={0}>— Seleccionar resolución —</option>
                {resoluciones
                  .filter((r: Resolucion) => r.esRecurrible)
                  .map((r: Resolucion) => (
                    <option key={r.idResolucion} value={r.idResolucion}>
                      {r.numeroResolucion} — #{r.idExpediente.numeroExpediente}
                    </option>
                  ))}
              </SelectField>
              <SelectField label="Tipo de recurso" value={form.idTipoRecurso} onChange={f("idTipoRecurso")} required>
                <option value={0}>— Seleccionar tipo —</option>
                {tipos.map(t => (
                  <option key={t.idTipoRecurso} value={t.idTipoRecurso}>{t.nombre}</option>
                ))}
              </SelectField>
              <SelectField label="Parte recurrente" value={form.idRecurrente} onChange={f("idRecurrente")} required>
                <option value={0}>— Seleccionar parte procesal —</option>
                {partes.filter(p => p.activo).map(p => (
                  <option key={p.idParte} value={p.idParte}>
                    {p.idPersona.nombre} {p.idPersona.primerApellido} ({p.idRol.nombreRol}) — Exp. #{p.idExpediente.numeroExpediente}
                  </option>
                ))}
              </SelectField>
            </>
          )}

          {editando && (
            <SelectField label="Estado del recurso" value={form.estadoRecurso} onChange={f("estadoRecurso")}>
              <option value="PENDIENTE">Pendiente</option>
              <option value="ADMITIDO">Admitido</option>
              <option value="RECHAZADO">Rechazado</option>
              <option value="RESUELTO">Resuelto</option>
            </SelectField>
          )}

          <TextareaField label="Fundamentos" value={form.fundamentos} onChange={f("fundamentos")} rows={5} />
          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)} onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Interponer recurso"}
          />
        </Modal>
      )}
    </div>
  );
}