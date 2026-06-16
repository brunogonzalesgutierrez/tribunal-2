// src/pages/denuncias/DenunciaDocumentos.tsx
import { useState, useRef } from "react";
import { useQuery } from "@apollo/client";
import { GET_TIPOS_DOC } from "../../graphql/documento";
import {
  FileText, Search, Plus, X, Loader2, AlertCircle,
  Save, Trash2, Upload,
} from "lucide-react";

const DJANGO_BASE = "http://localhost:8000";

const inputCls =
  "w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all";
const labelCls =
  "block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1";

interface OpcionModal { id: number; titulo: string; subtitulo?: string; extra?: string; }

function BuscadorTipoDoc({
  opciones, loading, onSelect, onClose,
}: {
  opciones: OpcionModal[]; loading: boolean;
  onSelect: (id: number, label: string) => void; onClose: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const filtradas = opciones.filter(o =>
    `${o.titulo} ${o.extra ?? ""}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-emerald-500" /> Seleccionar tipo de documento
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar por nombre o código..." value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              autoFocus />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
          ) : filtradas.length === 0 ? (
            <div className="text-center py-10 text-gray-400 dark:text-gray-500 text-sm">Sin resultados</div>
          ) : (
            <div className="space-y-1.5 pb-2">
              {filtradas.map(o => (
                <button key={o.id}
                  onClick={() => { onSelect(o.id, o.titulo); onClose(); }}
                  className="w-full text-left p-3 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-gray-200 dark:border-slate-700 hover:border-emerald-300 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">{o.titulo}</p>
                      {o.extra && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">{o.extra}</p>}
                      {o.subtitulo && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{o.subtitulo}</p>}
                    </div>
                    <Plus className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex-shrink-0 px-6 py-3 border-t border-gray-200 dark:border-slate-700">
          <button onClick={onClose} className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm font-medium transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// FORM DOCUMENTO DENUNCIA
// ══════════════════════════════════════════════════════════════════════════
export function FormDocumentoDenuncia({
  idExpediente, onSaved, onCancel,
}: {
  idExpediente: number;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { data: dTipos, loading: lTipos } = useQuery(GET_TIPOS_DOC);
  const [form, setForm] = useState({ idTipoDoc: 0, tipoLabel: "", titulo: "", numeroFolio: "" });
  const [archivo, setArchivo]           = useState<File | null>(null);
  const [err, setErr]                   = useState("");
  const [saving, setSaving]             = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const inputFileRef                    = useRef<HTMLInputElement>(null);

  const tipos: any[] = dTipos?.allTiposDoc ?? [];
  const opciones: OpcionModal[] = tipos.map((t: any) => ({
    id: t.idTipoDoc,
    titulo: t.nombre,
    extra: t.codigo,
    subtitulo: t.esPublico ? "Público" : "Privado",
  }));

  const set = (k: string) => (e: React.ChangeEvent<any>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const manejarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f && !f.name.toLowerCase().endsWith(".pdf")) {
      setErr("Solo se permiten archivos PDF."); return;
    }
    setArchivo(f); setErr("");
  };

  const guardar = async () => {
    if (!form.idTipoDoc || !form.titulo.trim()) {
      setErr("Tipo y título son obligatorios."); return;
    }
    setSaving(true); setErr("");
    try {
      const formData = new FormData();
      formData.append("titulo", form.titulo.trim());
      formData.append("idExpediente", String(idExpediente));
      formData.append("idTipoDoc", String(form.idTipoDoc));
      if (form.numeroFolio) formData.append("numeroFolio", form.numeroFolio);
      if (archivo) formData.append("archivo", archivo);

      const resp = await fetch(`${DJANGO_BASE}/api/subir-documento/`, { method: "POST", body: formData });
      const json = await resp.json();
      if (!json.ok) { setErr(json.mensaje ?? "Error al guardar."); return; }
      onSaved();
    } catch {
      setErr("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border-2 border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-900/10 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <p className="text-sm font-bold text-gray-800 dark:text-white">Registrar documento</p>
          </div>
          <button onClick={onCancel} disabled={saving}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-40">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>Tipo de documento <span className="text-red-500">*</span></label>
            {form.tipoLabel ? (
              <div className="flex items-center gap-2 p-2.5 rounded-xl border bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800">
                <span className="flex-1 text-sm text-gray-800 dark:text-white truncate">{form.tipoLabel}</span>
                <button type="button" onClick={() => setForm(p => ({ ...p, idTipoDoc: 0, tipoLabel: "" }))}
                  className="p-1 rounded-lg text-gray-500 hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setModalAbierto(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-emerald-400 hover:text-emerald-600 transition-all">
                <Search className="w-4 h-4" /> Buscar tipo de documento
              </button>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className={labelCls}>Título <span className="text-red-500">*</span></label>
            <input type="text" placeholder="Nombre del documento..." value={form.titulo}
              onChange={set("titulo")} className={inputCls} disabled={saving} />
          </div>

          <div>
            <label className={labelCls}>N° Folio</label>
            <input type="number" placeholder="Ej: 42" value={form.numeroFolio}
              onChange={set("numeroFolio")} className={inputCls} disabled={saving} />
          </div>

          <div>
            <label className={labelCls}>Archivo PDF (opcional)</label>
            <div
              onClick={() => !saving && inputFileRef.current?.click()}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                archivo
                  ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20"
                  : "border-dashed border-gray-300 dark:border-slate-600 hover:border-emerald-400 bg-white dark:bg-slate-900"
              } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {archivo ? (
                <>
                  <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="flex-1 text-xs text-emerald-700 dark:text-emerald-400 font-medium truncate">{archivo.name}</span>
                  <button type="button" onClick={e => { e.stopPropagation(); setArchivo(null); if (inputFileRef.current) inputFileRef.current.value = ""; }}
                    className="p-0.5 rounded text-gray-400 hover:text-red-500 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-400 dark:text-gray-500">Clic para seleccionar PDF</span>
                </>
              )}
            </div>
            <input ref={inputFileRef} type="file" accept="application/pdf" className="hidden" onChange={manejarArchivo} />
          </div>
        </div>

        {err && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />{err}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button onClick={onCancel} disabled={saving}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-40">
            <X className="w-4 h-4" /> Cancelar
          </button>
          <button onClick={guardar} disabled={saving}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>

      {modalAbierto && (
        <BuscadorTipoDoc
          opciones={opciones} loading={lTipos}
          onSelect={(id, label) => setForm(p => ({ ...p, idTipoDoc: id, tipoLabel: label }))}
          onClose={() => setModalAbierto(false)}
        />
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// TARJETA DOCUMENTO DENUNCIA
// ══════════════════════════════════════════════════════════════════════════
const fmtFecha = (iso?: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" });
};

export function TarjetaDocumentoDenuncia({
  doc, idExpediente, eliminandoId, onEliminar, onArchivoSubido,
}: {
  doc: any;
  idExpediente: number;
  eliminandoId: number | null;
  onEliminar: () => void;
  onArchivoSubido: () => void;
}) {
  const [subiendo, setSubiendo]       = useState(false);
  const [errorSubida, setErrorSubida] = useState("");
  const [rutaLocal, setRutaLocal]     = useState<string | null>(doc.rutaArchivo || null);
  const [tamanoLocal, setTamanoLocal] = useState<number>(doc.tamanoKb ?? 0);
  const inputRef                      = useRef<HTMLInputElement>(null);

  const manejarReemplazo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    if (!archivo.name.toLowerCase().endsWith(".pdf")) { setErrorSubida("Solo se permiten archivos PDF."); return; }
    setSubiendo(true); setErrorSubida("");
    const formData = new FormData();
    formData.append("titulo", doc.titulo);
    formData.append("idExpediente", String(idExpediente));
    formData.append("idTipoDoc", String(doc.idTipoDoc?.idTipoDoc ?? doc.idTipoDoc));
    formData.append("archivo", archivo);
    try {
      const resp = await fetch(`${DJANGO_BASE}/api/subir-documento/`, { method: "POST", body: formData });
      const json = await resp.json();
      if (json.ok) { setRutaLocal(json.rutaArchivo); setTamanoLocal(json.tamanoKb); onArchivoSubido(); }
      else { setErrorSubida(json.mensaje ?? "Error al subir."); }
    } catch { setErrorSubida("No se pudo conectar con el servidor."); }
    finally { setSubiendo(false); if (inputRef.current) inputRef.current.value = ""; }
  };

  const urlArchivo    = rutaLocal ? `${DJANGO_BASE}/media/${rutaLocal}` : null;
  const nombreArchivo = rutaLocal ? rutaLocal.split("/").pop() ?? "documento.pdf" : "documento.pdf";

  return (
    <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{doc.titulo}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
              {doc.idTipoDoc?.codigo}
            </span>
            {doc.idTipoDoc?.esPublico
              ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">Público</span>
              : <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400">Privado</span>
            }
            {doc.firmadoDigitalmente && (
              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">Firmado</span>
            )}
          </div>
        </div>
        <button
          onClick={onEliminar}
          disabled={eliminandoId === doc.idDocumento}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Eliminar">
          {eliminandoId === doc.idDocumento
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Trash2 className="w-3.5 h-3.5" />
          }
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs">
        <div>
          <p className="text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider mb-0.5">Folio</p>
          <p className="text-gray-700 dark:text-gray-300 font-medium">{doc.numeroFolio ?? "—"}</p>
        </div>
        <div>
          <p className="text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider mb-0.5">Fecha</p>
          <p className="text-gray-700 dark:text-gray-300 font-medium">{fmtFecha(doc.fechaPresentacion)}</p>
        </div>
        <div>
          <p className="text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider mb-0.5">Tamaño</p>
          <p className="text-gray-700 dark:text-gray-300 font-medium">{tamanoLocal > 0 ? `${tamanoLocal} KB` : "—"}</p>
        </div>
      </div>

      {urlArchivo ? (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40">
          <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-red-700 dark:text-red-400 truncate">{nombreArchivo}</p>
            <p className="text-[10px] text-red-400 dark:text-red-500 mt-0.5">{tamanoLocal > 0 ? `${tamanoLocal} KB` : "PDF"}</p>
          </div>
          <a href={urlArchivo} target="_blank" rel="noreferrer" title="Ver PDF"
            className="p-1.5 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
          </a>
          <a href={urlArchivo} download={nombreArchivo} title="Descargar PDF"
            className="p-1.5 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </a>
          <button onClick={() => inputRef.current?.click()} title="Reemplazar PDF" disabled={subiendo}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-40">
            {subiendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          </button>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()} disabled={subiendo}
          className="w-full flex flex-col items-center gap-2 py-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-400 dark:text-gray-500 hover:border-emerald-400 hover:text-emerald-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          {subiendo
            ? <><Loader2 className="w-5 h-5 animate-spin" /><span className="text-xs font-medium">Subiendo...</span></>
            : <><Upload className="w-5 h-5" /><span className="text-xs font-medium">Agregar PDF</span></>
          }
        </button>
      )}

      {errorSubida && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />{errorSubida}
        </div>
      )}

      <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={manejarReemplazo} />
    </div>
  );
}