// ─── src/pages/resoluciones/ResolucionesListPage.tsx ─────────────────────────
import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_RESOLUCIONES, GET_TIPOS_RESOLUCION, GET_EXPEDIENTES_SIMPLE,
  CREAR_RESOLUCION, ACTUALIZAR_RESOLUCION, ELIMINAR_RESOLUCION,
} from "../../graphql/resoluciones";
import {
  ScrollText, Plus, Edit, Trash2,
  CheckCircle, Clock, XCircle, Shield, AlertTriangle,
} from "lucide-react";
import {
  Resolucion, Expediente, TipoResolucion,
  fmt, nivelLabel,
  Modal, Field, SelectField, TextareaField,
  ErrorBox, ModalFooter, StatCard, TablaDesktop, ActionBtns,
  EstadoResolucionBadge,
} from "./shared";

export default function ResolucionesListPage() {
  const { data, loading, refetch } = useQuery(GET_RESOLUCIONES);
  const { data: dExp }  = useQuery(GET_EXPEDIENTES_SIMPLE);
  const { data: dTipo } = useQuery(GET_TIPOS_RESOLUCION);

  const [crear]      = useMutation(CREAR_RESOLUCION);
  const [actualizar] = useMutation(ACTUALIZAR_RESOLUCION);
  const [eliminar_m] = useMutation(ELIMINAR_RESOLUCION);

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<Resolucion | null>(null);
  const [err, setErr]       = useState("");
  const [busqueda, setBusq] = useState("");

  const initForm = {
    idExpediente: 0, idTipoRes: 0,
    numeroResolucion: "", fechaResolucion: "",
    parteDispositiva: "", fundamentacion: "",
    estado: "ACTIVA", esRecurrible: false, plazoRecursoDias: "0",
  };
  const [form, setForm] = useState(initForm);
  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const resoluciones: Resolucion[] = data?.allResoluciones ?? [];
  const expedientes: Expediente[]  = dExp?.allExpedientes ?? [];
  const tipos: TipoResolucion[]    = dTipo?.allTiposResolucion ?? [];

  const filtradas = resoluciones.filter(r =>
    `${r.numeroResolucion} ${r.idExpediente.numeroExpediente} ${r.idTipoRes.nombre} ${r.estado}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  // ── stats ─────────────────────────────────────────────
  const activas  = resoluciones.filter(r => r.estado === "ACTIVA").length;
  const firmes   = resoluciones.filter(r => r.estado === "FIRME").length;
  const apeladas = resoluciones.filter(r => r.estado === "APELADA").length;
  const recurribles = resoluciones.filter(r => r.esRecurrible).length;

  const abrirCrear = () => { setEdit(null); setForm(initForm); setErr(""); setModal(true); };
  const abrirEditar = (r: Resolucion) => {
    setEdit(r);
    setForm({
      idExpediente: r.idExpediente.idExpediente,
      idTipoRes: r.idTipoRes.idTipoRes,
      numeroResolucion: r.numeroResolucion,
      fechaResolucion: r.fechaResolucion,
      parteDispositiva: r.parteDispositiva,
      fundamentacion: r.fundamentacion,
      estado: r.estado,
      esRecurrible: r.esRecurrible,
      plazoRecursoDias: String(r.plazoRecursoDias),
    });
    setErr(""); setModal(true);
  };

  const guardar = async () => {
    if (!form.numeroResolucion || !form.fechaResolucion || !form.parteDispositiva) {
      setErr("Número, fecha y parte dispositiva son obligatorios."); return;
    }
    try {
      if (editando) {
        await actualizar({ variables: { id: Number(editando.idResolucion), input: {
          idTipoRes: Number(form.idTipoRes) || undefined,
          numeroResolucion: form.numeroResolucion,
          fechaResolucion: form.fechaResolucion,
          parteDispositiva: form.parteDispositiva,
          fundamentacion: form.fundamentacion || undefined,
          estado: form.estado,
          esRecurrible: form.esRecurrible,
          plazoRecursoDias: Number(form.plazoRecursoDias),
        }}});
      } else {
        if (!form.idExpediente || !form.idTipoRes) {
          setErr("Expediente y tipo de resolución son obligatorios."); return;
        }
        await crear({ variables: { input: {
          idExpediente: Number(form.idExpediente),
          idTipoRes: Number(form.idTipoRes),
          numeroResolucion: form.numeroResolucion,
          fechaResolucion: form.fechaResolucion,
          parteDispositiva: form.parteDispositiva,
          fundamentacion: form.fundamentacion || undefined,
        }}});
      }
      await refetch(); setModal(false);
    } catch (e: any) { setErr(e.message ?? "Error al guardar."); }
  };

  const eliminar = async (r: Resolucion) => {
    if (!window.confirm(`¿Eliminar la resolución ${r.numeroResolucion}?`)) return;
    const { data } = await eliminar_m({ variables: { id: Number(r.idResolucion) } });
    if (!data?.eliminarResolucion?.ok) {
      alert(data?.eliminarResolucion?.mensaje ?? "No se pudo eliminar."); return;
    }
    refetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <ScrollText className="w-7 h-7 text-blue-500" />
            Resoluciones
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestión de resoluciones judiciales • {resoluciones.length} registros
          </p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> Nueva resolución
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total" value={resoluciones.length} color="text-blue-600 dark:text-blue-400"
          icon={<ScrollText className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
          sub="Registradas en el sistema" />
        <StatCard label="Activas" value={activas} color="text-emerald-600 dark:text-emerald-400"
          icon={<CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
          sub={`${Math.round((activas / (resoluciones.length || 1)) * 100)}% del total`} />
        <StatCard label="Firmes" value={firmes} color="text-purple-600 dark:text-purple-400"
          icon={<Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
          sub="Sin recurso posible" />
        <StatCard label="Recurribles" value={recurribles} color="text-amber-600 dark:text-amber-400"
          icon={<AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
          sub={`${apeladas} apeladas`} />
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-3">
        <input
          placeholder="Buscar por número, expediente, tipo o estado..."
          value={busqueda} onChange={e => setBusq(e.target.value)}
          className="flex-1 max-w-sm px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {filtradas.length} resultado{filtradas.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla Desktop */}
      <TablaDesktop
        headers={["N° Resolución", "Expediente", "Tipo / Nivel", "Fecha", "Estado", "Recurrible", "Parte dispositiva", "Acciones"]}
        loading={loading}
        emptyMsg="No hay resoluciones registradas"
        emptyIcon={<ScrollText className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
      >
        {filtradas.map(r => (
          <tr key={r.idResolucion} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td className="px-6 py-4">
              <span className="font-mono font-bold text-gray-800 dark:text-white text-sm">
                {r.numeroResolucion}
              </span>
            </td>
            <td className="px-6 py-4">
              <span className="text-blue-500 font-bold">#{r.idExpediente.numeroExpediente}</span>
              <div className="text-xs text-gray-400 mt-0.5">{r.idExpediente.ano}</div>
            </td>
            <td className="px-6 py-4">
              <div className="text-sm text-gray-700 dark:text-gray-200">{r.idTipoRes.nombre}</div>
              <div className="text-xs text-amber-500 mt-0.5">{nivelLabel(r.idTipoRes.nivelJerarquico)}</div>
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">
              {fmt(r.fechaResolucion)}
            </td>
            <td className="px-6 py-4">
              <EstadoResolucionBadge estado={r.estado} />
            </td>
            <td className="px-6 py-4">
              {r.esRecurrible
                ? <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-3 h-3" /> Sí ({r.plazoRecursoDias}d)
                  </span>
                : <span className="text-xs text-gray-400">No</span>}
            </td>
            <td className="px-6 py-4 max-w-[200px]">
              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{r.parteDispositiva}</p>
            </td>
            <td className="px-6 py-4">
              <ActionBtns onEdit={() => abrirEditar(r)} onDelete={() => eliminar(r)} />
            </td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Cards Móvil */}
      <div className="lg:hidden space-y-3">
        {filtradas.map(r => (
          <div key={r.idResolucion} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="font-mono font-bold text-gray-800 dark:text-white">{r.numeroResolucion}</span>
                <p className="text-sm text-blue-500 mt-0.5">Exp. #{r.idExpediente.numeroExpediente}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{r.idTipoRes.nombre}</p>
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
              <EstadoResolucionBadge estado={r.estado} />
              <span className="text-xs text-gray-400 font-mono">{fmt(r.fechaResolucion)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title={editando ? "Editar resolución" : "Nueva resolución"}
          icon={<ScrollText className="w-5 h-5 text-blue-500" />}
        >
          {!editando && (
            <SelectField label="Expediente" value={form.idExpediente} onChange={f("idExpediente")} required>
              <option value={0}>— Seleccionar expediente —</option>
              {expedientes.map(e => (
                <option key={e.idExpediente} value={e.idExpediente}>#{e.numeroExpediente} ({e.ano})</option>
              ))}
            </SelectField>
          )}

          <div className="grid grid-cols-2 gap-x-4">
            <SelectField label="Tipo de resolución" value={form.idTipoRes} onChange={f("idTipoRes")} required>
              <option value={0}>— Seleccionar tipo —</option>
              {tipos.map(t => (
                <option key={t.idTipoRes} value={t.idTipoRes}>{t.nombre} ({t.codigo})</option>
              ))}
            </SelectField>
            <Field label="N° de resolución" value={form.numeroResolucion} onChange={f("numeroResolucion")} placeholder="RES-2024-001" required />
          </div>

          <div className="grid grid-cols-2 gap-x-4">
            <Field label="Fecha de resolución" value={form.fechaResolucion} onChange={f("fechaResolucion")} type="date" required />
            {editando && (
              <SelectField label="Estado" value={form.estado} onChange={f("estado")}>
                <option value="ACTIVA">Activa</option>
                <option value="APELADA">Apelada</option>
                <option value="ANULADA">Anulada</option>
                <option value="FIRME">Firme</option>
              </SelectField>
            )}
          </div>

          <TextareaField label="Parte dispositiva" value={form.parteDispositiva} onChange={f("parteDispositiva")} rows={3} required />
          <TextareaField label="Fundamentación" value={form.fundamentacion} onChange={f("fundamentacion")} rows={4} />

          {editando && (
            <div className="grid grid-cols-2 gap-x-4 items-end">
              <Field label="Plazo de recurso (días)" value={form.plazoRecursoDias} onChange={f("plazoRecursoDias")} type="number" />
              <div className="mb-4 pb-1">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
                  <input type="checkbox" checked={form.esRecurrible as unknown as boolean}
                    onChange={e => setForm(p => ({ ...p, esRecurrible: e.target.checked }))}
                    className="rounded" />
                  Es recurrible
                </label>
              </div>
            </div>
          )}

          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)} onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Crear resolución"}
          />
        </Modal>
      )}
    </div>
  );
}