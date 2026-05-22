import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_DOCUMENTOS,
  GET_TIPOS_DOC,
  GET_EXPEDIENTES_SIMPLE,
  CREAR_DOCUMENTO,
  ACTUALIZAR_DOCUMENTO,
  ELIMINAR_DOCUMENTO,
} from "../../graphql/documento";
import { FileText, Plus, Edit, Trash2, CheckCircle, XCircle, Zap } from "lucide-react";
import {
  Documento, Expediente, TipoDoc,
  fmtFecha,
  BoolBadge,
  Modal, Field, SelectField, ErrorBox, ModalFooter,
  StatCard, TablaDesktop, ActionBtns, SearchBar,
} from "./shared";

const initForm = {
  titulo: "",
  idExpediente: "",
  idTipoDoc: "",
  numeroFolio: "",
  rutaArchivo: "",
  tamanoKb: "",
};

export default function DocumentosListPage() {
  const { data, loading, refetch } = useQuery(GET_DOCUMENTOS);
  const { data: dataExp }          = useQuery(GET_EXPEDIENTES_SIMPLE);
  const { data: dataTipo }         = useQuery(GET_TIPOS_DOC);
  const [crearDocumento]      = useMutation(CREAR_DOCUMENTO);
  const [actualizarDocumento] = useMutation(ACTUALIZAR_DOCUMENTO);
  const [eliminarDocumento]   = useMutation(ELIMINAR_DOCUMENTO);

  const [modal, setModal]     = useState(false);
  const [editando, setEdit]   = useState<Documento | null>(null);
  const [form, setForm]       = useState(initForm);
  const [busqueda, setBusq]   = useState("");
  const [err, setErr]         = useState("");

  const documentos: Documento[]   = data?.allDocumentos ?? [];
  const expedientes: Expediente[] = dataExp?.allExpedientes ?? [];
  const tipos: TipoDoc[]          = dataTipo?.allTiposDoc ?? [];

  const filtrados = documentos.filter(d =>
    `${d.titulo} ${d.idExpediente?.numeroExpediente ?? ""} ${d.idTipoDoc?.nombre ?? ""}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  // Stats
  const electronicos = documentos.filter(d => d.esElectronico).length;
  const firmados     = documentos.filter(d => d.firmadoDigitalmente).length;

  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const abrirCrear = () => { setEdit(null); setForm(initForm); setErr(""); setModal(true); };
  const abrirEditar = (d: Documento) => {
    setEdit(d);
    setForm({
      titulo:       d.titulo,
      idExpediente: String(d.idExpediente?.idExpediente ?? ""),
      idTipoDoc:    String(d.idTipoDoc?.idTipoDoc ?? ""),
      numeroFolio:  d.numeroFolio != null ? String(d.numeroFolio) : "",
      rutaArchivo:  d.rutaArchivo ?? "",
      tamanoKb:     String(d.tamanoKb ?? ""),
    });
    setErr(""); setModal(true);
  };

  const guardar = async () => {
    if (!form.titulo || !form.idExpediente || !form.idTipoDoc) {
      setErr("Título, expediente y tipo de documento son obligatorios."); return;
    }
    try {
      if (editando) {
        await actualizarDocumento({
          variables: {
            id: Number(editando.idDocumento),
            input: {
              titulo: form.titulo,
              numeroFolio: form.numeroFolio ? Number(form.numeroFolio) : undefined,
              rutaArchivo: form.rutaArchivo || undefined,
            },
          },
        });
      } else {
        await crearDocumento({
          variables: {
            idExpediente: Number(form.idExpediente),
            idTipoDoc:    Number(form.idTipoDoc),
            titulo:       form.titulo,
            numeroFolio:  form.numeroFolio ? Number(form.numeroFolio) : undefined,
            rutaArchivo:  form.rutaArchivo || undefined,
            tamanoKb:     form.tamanoKb ? Number(form.tamanoKb) : 0,
          },
        });
      }
      await refetch(); setModal(false);
    } catch (e: any) { setErr(e.message ?? "Error."); }
  };

  const eliminar = async (d: Documento) => {
    if (!window.confirm(`¿Eliminar el documento "${d.titulo}"?`)) return;
    const { data } = await eliminarDocumento({ variables: { id: Number(d.idDocumento) } });
    if (!data?.eliminarDocumento?.ok) {
      alert(data?.eliminarDocumento?.mensaje ?? "No se pudo eliminar."); return;
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
            Documentos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestión documental judicial • {documentos.length} registros
          </p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> Nuevo documento
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total documentos" value={documentos.length} color="text-blue-600 dark:text-blue-400"
          icon={<FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />} sub="Registrados en el sistema" />
        <StatCard label="Electrónicos" value={electronicos} color="text-emerald-600 dark:text-emerald-400"
          icon={<Zap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
          sub={`${Math.round((electronicos / (documentos.length || 1)) * 100)}% del total`} />
        <StatCard label="Firmados digitalmente" value={firmados} color="text-purple-600 dark:text-purple-400"
          icon={<CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
          sub={`${Math.round((firmados / (documentos.length || 1)) * 100)}% del total`} />
      </div>

      {/* Barra de búsqueda */}
      <div className="flex justify-between items-center">
        <SearchBar value={busqueda} onChange={setBusq} placeholder="Buscar por título, expediente o tipo..." />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla Desktop */}
      <TablaDesktop
        headers={["Título", "Expediente", "Tipo", "Folio", "Fecha", "Electrónico", "Firmado", "Acciones"]}
        loading={loading}
        emptyMsg="No hay documentos registrados"
        emptyIcon={<FileText className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
      >
        {filtrados.map(d => (
          <tr key={d.idDocumento} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td className="px-6 py-4">
              <span className="font-semibold text-gray-800 dark:text-white text-sm line-clamp-1">{d.titulo}</span>
            </td>
            <td className="px-6 py-4">
              <span className="text-blue-500 font-bold font-mono text-sm">
                #{d.idExpediente?.numeroExpediente ?? "—"}
              </span>
            </td>
            <td className="px-6 py-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                {d.idTipoDoc?.nombre ?? "—"}
              </span>
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
              {d.numeroFolio ?? "—"}
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">
              {fmtFecha(d.fechaPresentacion)}
            </td>
            <td className="px-6 py-4">
              <BoolBadge val={d.esElectronico} si="Sí" no="No" />
            </td>
            <td className="px-6 py-4">
              <BoolBadge val={d.firmadoDigitalmente} si="Firmado" no="Sin firma" />
            </td>
            <td className="px-6 py-4">
              <ActionBtns onEdit={() => abrirEditar(d)} onDelete={() => eliminar(d)} />
            </td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Cards Móvil */}
      <div className="lg:hidden space-y-3">
        {filtrados.map(d => (
          <div key={d.idDocumento} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">{d.titulo}</p>
                <span className="text-blue-500 font-mono text-xs">#{d.idExpediente?.numeroExpediente ?? "—"}</span>
              </div>
              <div className="flex gap-1 ml-2">
                <button onClick={() => abrirEditar(d)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => eliminar(d)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs text-gray-400">{d.idTipoDoc?.nombre ?? "—"}</span>
              <div className="flex gap-2">
                {d.esElectronico && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">Electrónico</span>
                )}
                {d.firmadoDigitalmente && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">Firmado</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title={editando ? "Editar documento" : "Nuevo documento"}
          icon={<FileText className="w-5 h-5 text-blue-500" />}
        >
          <Field label="Título" value={form.titulo} onChange={f("titulo")} required />

          {!editando && (
            <>
              <SelectField label="Expediente" value={form.idExpediente} onChange={f("idExpediente")} required>
                <option value="">— Seleccionar expediente —</option>
                {expedientes.map((e: Expediente) => (
                  <option key={e.idExpediente} value={e.idExpediente}>
                    {e.numeroExpediente} ({e.ano})
                  </option>
                ))}
              </SelectField>
              <SelectField label="Tipo de documento" value={form.idTipoDoc} onChange={f("idTipoDoc")} required>
                <option value="">— Seleccionar tipo —</option>
                {tipos.map((t: TipoDoc) => (
                  <option key={t.idTipoDoc} value={t.idTipoDoc}>
                    {t.codigo} - {t.nombre}
                  </option>
                ))}
              </SelectField>
              <Field label="Tamaño (KB)" value={form.tamanoKb} onChange={f("tamanoKb")} type="number" />
            </>
          )}

          <Field label="Número de folio" value={form.numeroFolio} onChange={f("numeroFolio")} type="number" />
          <Field label="Ruta / URL del archivo" value={form.rutaArchivo} onChange={f("rutaArchivo")} placeholder="ej: /docs/archivo.pdf" />

          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)} onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Crear documento"}
          />
        </Modal>
      )}
    </div>
  );
}
