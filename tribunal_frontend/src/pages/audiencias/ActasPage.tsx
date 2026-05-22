import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_ACTAS,
  GET_AUDIENCIAS,
  GET_USUARIOS_SIMPLE,
  CREAR_ACTA,
  ACTUALIZAR_ACTA,
  ELIMINAR_ACTA,
} from "../../graphql/audiencias";
import { FileText, Plus, Edit, Trash2, CheckCircle, AlertCircle, Mic } from "lucide-react";
import {
  Acta,
  fmt, Modal, SelectField, Field, TextareaField,
  ErrorBox, ModalFooter, StatCard, TablaDesktop, ActionBtns,
} from "./shared";

export default function ActasPage() {
  const { data, loading, refetch } = useQuery(GET_ACTAS);
  const { data: dAud } = useQuery(GET_AUDIENCIAS);
  const { data: dUsu } = useQuery(GET_USUARIOS_SIMPLE);
  const [crearActa]    = useMutation(CREAR_ACTA);
  const [actualizarAc] = useMutation(ACTUALIZAR_ACTA);
  const [eliminarAc]   = useMutation(ELIMINAR_ACTA);

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<Acta | null>(null);
  const [err, setErr]       = useState("");

  const initForm = { idAudiencia: 0, idUsuario: 0, contenido: "", firmada: false, urlGrabacion: "" };
  const [form, setForm] = useState(initForm);
  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const actas: Acta[] = data?.allActas ?? [];
  const audiencias    = dAud?.allAudiencias ?? [];
  const usuarios      = dUsu?.allUsuarios ?? [];

  const firmadas   = actas.filter(a => a.firmada).length;
  const pendientes = actas.filter(a => !a.firmada).length;

  const abrirCrear = () => { setEdit(null); setForm(initForm); setErr(""); setModal(true); };
  const abrirEditar = (a: Acta) => {
    setEdit(a);
    setForm({
      idAudiencia: a.idAudiencia.idAudiencia, idUsuario: a.usuario.idUsuario,
      contenido: a.contenido, firmada: a.firmada, urlGrabacion: a.urlGrabacion ?? "",
    });
    setErr(""); setModal(true);
  };

  const guardar = async () => {
    if (!form.contenido) { setErr("El contenido del acta es obligatorio."); return; }
    try {
      if (editando) {
        await actualizarAc({
          variables: {
            id: Number(editando.idActa),
            input: {
              contenido: form.contenido, firmada: form.firmada,
              urlGrabacion: form.urlGrabacion || undefined,
            },
          },
        });
      } else {
        if (!form.idAudiencia || !form.idUsuario) {
          setErr("Audiencia y usuario son obligatorios."); return;
        }
        await crearActa({
          variables: {
            idAudiencia: Number(form.idAudiencia), idUsuario: Number(form.idUsuario),
            contenido: form.contenido, firmada: form.firmada,
          },
        });
      }
      await refetch(); setModal(false);
    } catch (e: any) { setErr(e.message ?? "Error."); }
  };

  const eliminar = async (a: Acta) => {
    if (!window.confirm(`¿Eliminar el acta del expediente #${a.idAudiencia.idExpediente.numeroExpediente}?`)) return;
    const { data } = await eliminarAc({ variables: { id: Number(a.idActa) } });
    if (!data?.eliminarActa?.ok) {
      alert(data?.eliminarActa?.mensaje ?? "No se pudo eliminar."); return;
    }
    refetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-500" />
            Actas de Audiencia
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestión de actas judiciales • {actas.length} registros
          </p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> Nueva acta
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total actas" value={actas.length} color="text-blue-600 dark:text-blue-400"
          icon={<FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />} sub="Registradas en el sistema" />
        <StatCard label="Firmadas" value={firmadas} color="text-emerald-600 dark:text-emerald-400"
          icon={<CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
          sub={`${Math.round((firmadas / (actas.length || 1)) * 100)}% del total`} />
        <StatCard label="Pendientes" value={pendientes} color="text-amber-600 dark:text-amber-400"
          icon={<AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />} sub="Esperando firma" />
      </div>

      {/* Tabla Desktop */}
      <TablaDesktop
        headers={["Expediente", "Fecha acta", "Registrado por", "Firmada", "Grabación", "Acciones"]}
        loading={loading}
        emptyMsg="No hay actas registradas"
        emptyIcon={<FileText className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
      >
        {actas.map(a => (
          <tr key={a.idActa} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td className="px-6 py-4">
              <span className="text-blue-500 font-bold">#{a.idAudiencia.idExpediente.numeroExpediente}</span>
              <div className="text-xs text-gray-400 mt-0.5">{fmt(a.idAudiencia.fechaHoraProgramada)}</div>
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">{fmt(a.fechaActa)}</td>
            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">{a.usuario.nombres} {a.usuario.paterno}</td>
            <td className="px-6 py-4">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                a.firmada
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
              }`}>
                {a.firmada
                  ? <><CheckCircle className="w-3 h-3" /> Firmada</>
                  : <><AlertCircle className="w-3 h-3" /> Pendiente</>}
              </span>
            </td>
            <td className="px-6 py-4">
              {a.urlGrabacion ? (
                <a href={a.urlGrabacion} target="_blank" rel="noreferrer"
                  className="text-blue-500 text-xs flex items-center gap-1 hover:underline">
                  <Mic className="w-3.5 h-3.5" /> Ver
                </a>
              ) : <span className="text-gray-400 text-sm">—</span>}
            </td>
            <td className="px-6 py-4">
              <ActionBtns onEdit={() => abrirEditar(a)} onDelete={() => eliminar(a)} />
            </td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Cards Móvil */}
      <div className="lg:hidden space-y-3">
        {actas.map(a => (
          <div key={a.idActa} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-blue-500 font-bold">#{a.idAudiencia.idExpediente.numeroExpediente}</span>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{a.usuario.nombres} {a.usuario.paterno}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => abrirEditar(a)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => eliminar(a)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                a.firmada
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
              }`}>
                {a.firmada ? "✓ Firmada" : "⏳ Pendiente"}
              </span>
              <span className="text-xs text-gray-400">{fmt(a.fechaActa)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title={editando ? "Editar acta" : "Nueva acta de audiencia"}
          icon={<FileText className="w-5 h-5 text-blue-500" />}
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
              <SelectField label="Usuario responsable" value={form.idUsuario} onChange={f("idUsuario")} required>
                <option value={0}>— Seleccionar usuario —</option>
                {usuarios.map((u: any) => (
                  <option key={u.idUsuario} value={u.idUsuario}>{u.nombres} {u.paterno}</option>
                ))}
              </SelectField>
            </>
          )}
          <TextareaField label="Contenido del acta" value={form.contenido} onChange={f("contenido")} rows={6} required />
          <Field label="URL de grabación" value={form.urlGrabacion} onChange={f("urlGrabacion")} placeholder="https://..." />
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
              <input type="checkbox" checked={form.firmada}
                onChange={e => setForm(p => ({ ...p, firmada: e.target.checked }))} className="rounded" />
              Acta firmada
            </label>
          </div>
          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)} onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Crear acta"}
          />
        </Modal>
      )}
    </div>
  );
}
