import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_DOCUMENTOS,
  GET_TIPOS_DOC,
  GET_EXPEDIENTES_SIMPLE,
  ACTUALIZAR_DOCUMENTO,
  ELIMINAR_DOCUMENTO,
} from "../../graphql/documento";
import {
  FileText, Plus, Edit, Trash2, CheckCircle,
  Zap, UploadCloud, File, X, Download, Eye,
  Search, ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  Documento, Expediente, TipoDoc,
  fmtFecha, BoolBadge,
  Modal, Field, SelectField, ErrorBox, ModalFooter,
  StatCard, TablaDesktop, ActionBtns, SearchBar,
} from "./shared";
import { useCrudNotifications } from "../../hooks/useCrudNotifications";
import { useToast } from "../../context/ToastContext";

// ─── URL base del backend ─────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

// ─── COMPONENTE DRAG & DROP ───────────────────────────────
interface DropZoneProps {
  archivo: File | null;
  onArchivo: (f: File | null) => void;
  disabled?: boolean;
}

function DropZone({ archivo, onArchivo, disabled = false }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const validar = (f: File) => {
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      alert("Solo se permiten archivos PDF."); return false;
    }
    if (f.size > 10 * 1024 * 1024) {
      alert("El archivo supera el límite de 10 MB."); return false;
    }
    return true;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    if (disabled) return;
    const f = e.dataTransfer.files[0];
    if (f && validar(f)) onArchivo(f);
  }, [onArchivo, disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && validar(f)) onArchivo(f);
  };

  const tamanoLegible = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div
      onDragOver={e => { if (!disabled) { e.preventDefault(); setDragging(true); } }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && !archivo && inputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer select-none
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${dragging && !disabled
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
          : archivo
            ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 cursor-default"
            : "border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/40 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10"
        }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />

      {archivo ? (
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
            <File className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">{archivo.name}</p>
          <p className="text-xs text-gray-500">{tamanoLegible(archivo.size)} · PDF listo para subir</p>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onArchivo(null); inputRef.current && (inputRef.current.value = ""); }}
            disabled={disabled}
            className="mt-1 flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-3 h-3" /> Quitar archivo
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors
            ${dragging ? "bg-blue-100 dark:bg-blue-900/40" : "bg-gray-100 dark:bg-slate-800"}`}>
            <UploadCloud className={`w-6 h-6 ${dragging ? "text-blue-500" : "text-gray-400"}`} />
          </div>
          <p className="font-semibold text-gray-700 dark:text-gray-300 text-sm">
            {dragging ? "Suelta el archivo aquí" : "Arrastra tu PDF aquí"}
          </p>
          <p className="text-xs text-gray-400">o haz clic para buscar · máx. 10 MB</p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// COMPONENTE: Buscador de Expedientes (Modal)
// ============================================================
function BuscadorExpediente({
  onSelect,
  onClose,
  disabled,
}: {
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
  disabled?: boolean;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, loading } = useQuery(GET_EXPEDIENTES_SIMPLE);

  const expedientes: Expediente[] = data?.allExpedientes ?? [];

  const filtrados = expedientes.filter(e =>
    `${e.numeroExpediente} ${e.ano}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-500" />
            Seleccionar Expediente
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar expediente por número..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>No se encontraron expedientes</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filtrados.map((e: Expediente, index: number) => (
                <button
                  key={e.idExpediente}
                  onClick={() => {
                    onSelect(e.idExpediente, `${e.numeroExpediente} (${e.ano})`);
                    onClose();
                  }}
                  disabled={disabled}
                  className={`w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${
                    index === filtrados.length - 1 ? 'mb-0' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{e.numeroExpediente}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Año: {e.ano}</p>
                    </div>
                    <div className="text-blue-500">
                      <Plus className="w-5 h-5" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 px-6 py-4 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE: Buscador de Tipos de Documento (Modal)
// ============================================================
function BuscadorTipoDocumento({
  onSelect,
  onClose,
  disabled,
}: {
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
  disabled?: boolean;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, loading } = useQuery(GET_TIPOS_DOC);

  const tipos: TipoDoc[] = data?.allTiposDoc ?? [];

  const filtrados = tipos.filter(t =>
    `${t.codigo} ${t.nombre}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-500" />
            Seleccionar Tipo de Documento
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar tipo de documento..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>No se encontraron tipos de documento</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filtrados.map((t: TipoDoc, index: number) => (
                <button
                  key={t.idTipoDoc}
                  onClick={() => {
                    onSelect(t.idTipoDoc, `${t.codigo} - ${t.nombre}`);
                    onClose();
                  }}
                  disabled={disabled}
                  className={`w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${
                    index === filtrados.length - 1 ? 'mb-0' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{t.nombre}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Código: {t.codigo}</p>
                    </div>
                    <div className="text-blue-500">
                      <Plus className="w-5 h-5" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 px-6 py-4 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL SUBIR DOCUMENTO (ACTUALIZADO CON BUSCADORES) ───
interface ModalSubirProps {
  expedientes: Expediente[];
  tipos: TipoDoc[];
  onClose: () => void;
  onExito: () => void;
}

function ModalSubirDocumento({ expedientes, tipos, onClose, onExito }: ModalSubirProps) {
  const [form, setForm] = useState({
    titulo: "", idExpediente: "", idTipoDoc: "", numeroFolio: "",
  });
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [err, setErr] = useState("");
  const [buscadorExpAbierto, setBuscadorExpAbierto] = useState(false);
  const [buscadorTipoAbierto, setBuscadorTipoAbierto] = useState(false);
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState("");
  const [tipoSeleccionado, setTipoSeleccionado] = useState("");

  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const seleccionarExpediente = (id: number, nombre: string) => {
    setForm(p => ({ ...p, idExpediente: String(id) }));
    setExpedienteSeleccionado(nombre);
  };

  const seleccionarTipo = (id: number, nombre: string) => {
    setForm(p => ({ ...p, idTipoDoc: String(id) }));
    setTipoSeleccionado(nombre);
  };

  const handleSubir = async () => {
    if (!form.titulo.trim()) { setErr("El título es obligatorio."); return; }
    if (!form.idExpediente)  { setErr("Selecciona un expediente."); return; }
    if (!form.idTipoDoc)     { setErr("Selecciona el tipo de documento."); return; }
    if (!archivo)            { setErr("Selecciona un archivo PDF."); return; }

    setErr(""); setSubiendo(true); setProgreso(0);

    try {
      const formData = new FormData();
      formData.append("archivo",       archivo);
      formData.append("titulo",        form.titulo);
      formData.append("idExpediente",  form.idExpediente);
      formData.append("idTipoDoc",     form.idTipoDoc);
      if (form.numeroFolio) formData.append("numeroFolio", form.numeroFolio);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API_URL}/subir-documento/`);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgreso(Math.round((e.loaded / e.total) * 100));
        };

        xhr.onload = () => {
          const res = JSON.parse(xhr.responseText);
          if (res.ok) { resolve(); }
          else { reject(new Error(res.mensaje ?? "Error al subir.")); }
        };

        xhr.onerror = () => reject(new Error("Error de conexión con el servidor."));
        xhr.send(formData);
      });

      onExito();
      onClose();
    } catch (e: any) {
      setErr(e.message ?? "Error desconocido.");
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Subir documento PDF" icon={<UploadCloud className="w-5 h-5 text-blue-500" />}>
      <Field 
        label="Título del documento" 
        value={form.titulo} 
        onChange={f("titulo")} 
        required
        placeholder="Ej: Demanda inicial, Resolución 04..."
        disabled={subiendo}
      />

      {/* Expediente - Con buscador */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
          Expediente <span className="text-red-500">*</span>
        </label>
        {expedienteSeleccionado ? (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
            <span className="flex-1 text-sm text-gray-800 dark:text-white">{expedienteSeleccionado}</span>
            <button
              onClick={() => {
                setForm(p => ({ ...p, idExpediente: "" }));
                setExpedienteSeleccionado("");
              }}
              disabled={subiendo}
              className="p-1 rounded-lg text-gray-500 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setBuscadorExpAbierto(true)}
            disabled={subiendo}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Buscar y seleccionar expediente
          </button>
        )}
      </div>

      {/* Tipo de documento - Con buscador */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
          Tipo de documento <span className="text-red-500">*</span>
        </label>
        {tipoSeleccionado ? (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
            <span className="flex-1 text-sm text-gray-800 dark:text-white">{tipoSeleccionado}</span>
            <button
              onClick={() => {
                setForm(p => ({ ...p, idTipoDoc: "" }));
                setTipoSeleccionado("");
              }}
              disabled={subiendo}
              className="p-1 rounded-lg text-gray-500 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setBuscadorTipoAbierto(true)}
            disabled={subiendo}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Buscar y seleccionar tipo de documento
          </button>
        )}
      </div>

      <Field 
        label="Número de folio" 
        value={form.numeroFolio} 
        onChange={f("numeroFolio")} 
        type="number" 
        disabled={subiendo}
      />

      {/* Drop Zone */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
          Archivo PDF <span className="text-red-500">*</span>
        </label>
        <DropZone archivo={archivo} onArchivo={setArchivo} disabled={subiendo} />
      </div>

      {/* Barra de progreso */}
      {subiendo && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Subiendo archivo...</span>
            <span>{progreso}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>
      )}

      <ErrorBox msg={err} />

      <div className="flex gap-3 justify-end pt-2">
        <button 
          onClick={onClose} 
          disabled={subiendo}
          className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancelar
        </button>
        <button 
          onClick={handleSubir} 
          disabled={subiendo || !archivo}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <UploadCloud className="w-4 h-4" />
          {subiendo ? "Subiendo..." : "Subir a bóveda"}
        </button>
      </div>

      {/* Modales de buscadores internos */}
      {buscadorExpAbierto && (
        <BuscadorExpediente
          onSelect={seleccionarExpediente}
          onClose={() => setBuscadorExpAbierto(false)}
          disabled={subiendo}
        />
      )}
      {buscadorTipoAbierto && (
        <BuscadorTipoDocumento
          onSelect={seleccionarTipo}
          onClose={() => setBuscadorTipoAbierto(false)}
          disabled={subiendo}
        />
      )}
    </Modal>
  );
}

// ─── MODAL EDITAR ─────────────────────────────────────────
const initFormEditar = { titulo: "", numeroFolio: "" };

// ─── PAGINACIÓN ───────────────────────────────────────────
const PER_PAGE = 10;

// ═══════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function DocumentosListPage() {
  const { data, loading, refetch } = useQuery(GET_DOCUMENTOS);
  const { data: dataExp }          = useQuery(GET_EXPEDIENTES_SIMPLE);
  const { data: dataTipo }         = useQuery(GET_TIPOS_DOC);
  const [actualizarDocumento] = useMutation(ACTUALIZAR_DOCUMENTO);
  const [eliminarDocumento]   = useMutation(ELIMINAR_DOCUMENTO);

  const { executeUpdate, executeDelete, toast } = useCrudNotifications("Documento");

  // Modales
  const [modalSubir, setModalSubir]   = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [editando, setEdit]           = useState<Documento | null>(null);
  const [formEditar, setFormEditar]   = useState(initFormEditar);
  const [err, setErr]                 = useState("");

  // ✅ Estados para bloqueo de botones
  const [saving, setSaving] = useState(false);

  // Filtros y paginación
  const [busqueda, setBusq] = useState("");
  const [page, setPage]     = useState(1);

  const documentos: Documento[]   = data?.allDocumentos ?? [];
  const expedientes: Expediente[] = dataExp?.allExpedientes ?? [];
  const tipos: TipoDoc[]          = dataTipo?.allTiposDoc ?? [];

  const filtrados = documentos.filter(d =>
    `${d.titulo} ${d.idExpediente?.numeroExpediente ?? ""} ${d.idTipoDoc?.nombre ?? ""}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalPages = Math.ceil(filtrados.length / PER_PAGE);
  const paginados  = filtrados.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Stats
  const electronicos = documentos.filter(d => d.esElectronico).length;
  const firmados     = documentos.filter(d => d.firmadoDigitalmente).length;
  const conArchivo   = documentos.filter(d => d.rutaArchivo).length;

  const fe = (k: string) => (v: string) => setFormEditar(p => ({ ...p, [k]: v }));

  const abrirEditar = (d: Documento) => {
    setEdit(d);
    setFormEditar({
      titulo:      d.titulo,
      numeroFolio: d.numeroFolio != null ? String(d.numeroFolio) : "",
    });
    setErr(""); setModalEditar(true);
  };

  // ✅ GUARDAR EDICIÓN CON BLOQUEO
  const guardarEdicion = async () => {
    if (!formEditar.titulo.trim()) { 
      toast.error("El título es obligatorio."); 
      return; 
    }
    
    if (saving) return;
    setSaving(true);
    
    try {
      await executeUpdate(async () => {
        await actualizarDocumento({
          variables: {
            id: Number(editando!.idDocumento),
            input: {
            titulo:      formEditar.titulo,
            numeroFolio: formEditar.numeroFolio ? Number(formEditar.numeroFolio) : undefined,
          },
          },
        });
        await refetch(); 
        setModalEditar(false);
        return true;
      });
    } finally {
      setSaving(false);
    }
  };

  // ✅ ELIMINAR CON BLOQUEO
  const eliminar = async (d: Documento) => {
    await executeDelete(
      async () => {
        const { data } = await eliminarDocumento({ variables: { id: Number(d.idDocumento) } });
        if (!data?.eliminarDocumento?.ok) {
          throw new Error(data?.eliminarDocumento?.mensaje ?? "No se pudo eliminar.");
        }
        await refetch();
        return true;
      },
      {
        loading: `Eliminando documento "${d.titulo}"...`,
        success: `Documento "${d.titulo}" eliminado exitosamente`,
        error: `Error al eliminar el documento`,
      },
      `¿Eliminar el documento "${d.titulo}"?`
    );
  };

  const verArchivo = (d: Documento) => {
    if (!d.rutaArchivo) { 
      toast.error("Este documento no tiene archivo adjunto."); 
      return; 
    }
    window.open(`${API_URL}/documento/${d.idDocumento}/descargar/`, "_blank");
  };

  // Resetear página cuando cambia la búsqueda
  const handleBusquedaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusq(e.target.value);
    setPage(1);
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
            Bóveda digital judicial · {documentos.length} registros
          </p>
        </div>
        <button
          onClick={() => setModalSubir(true)}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <UploadCloud className="w-4 h-4" /> Subir documento
        </button>
      </div>

      {/* Stats - Clases fijas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total documentos</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{documentos.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Registrados en el sistema</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Con archivo PDF</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{conArchivo}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UploadCloud className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">{Math.round((conArchivo / (documentos.length || 1)) * 100)}% del total</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Electrónicos</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{electronicos}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">{Math.round((electronicos / (documentos.length || 1)) * 100)}% del total</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Firmados digitalmente</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{firmados}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">{Math.round((firmados / (documentos.length || 1)) * 100)}% del total</p>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="Buscar por título, expediente o tipo..."
            value={busqueda}
            onChange={handleBusquedaChange}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla */}
      <TablaDesktop
        headers={["Título", "Expediente", "Tipo", "Folio", "Fecha", "Archivo", "Electrónico", "Firmado", "Acciones"]}
        loading={loading}
        emptyMsg="No hay documentos registrados"
        emptyIcon={<FileText className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
      >
        {paginados.map(d => (
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
              {d.rutaArchivo ? (
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                    <File className="w-3 h-3" /> PDF
                  </span>
                  <button onClick={() => verArchivo(d)} title="Ver archivo"
                    disabled={saving}
                    className="p-1 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <a href={`${API_URL}/documento/${d.idDocumento}/descargar/`} download title="Descargar"
                    className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <span className="text-xs text-gray-400 dark:text-gray-600">Sin archivo</span>
              )}
            </td>
            <td className="px-6 py-4">
              <BoolBadge val={d.esElectronico} si="Sí" no="No" />
            </td>
            <td className="px-6 py-4">
              <BoolBadge val={d.firmadoDigitalmente} si="Firmado" no="Sin firma" />
            </td>
            <td className="px-6 py-4">
              <ActionBtns onEdit={() => abrirEditar(d)} onDelete={() => eliminar(d)} disabled={saving} />
            </td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtrados.length)} de {filtrados.length}
          </p>
          <div className="flex gap-1">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
              {page} / {totalPages}
            </span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Cards móvil */}
      <div className="lg:hidden space-y-3">
        {paginados.map(d => (
          <div key={d.idDocumento} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">{d.titulo}</p>
                <span className="text-blue-500 font-mono text-xs">#{d.idExpediente?.numeroExpediente ?? "—"}</span>
              </div>
              <div className="flex gap-1 ml-2">
                {d.rutaArchivo && (
                  <button onClick={() => verArchivo(d)} disabled={saving}
                    className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-40 disabled:cursor-not-allowed">
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => abrirEditar(d)} disabled={saving}
                  className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-40 disabled:cursor-not-allowed">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => eliminar(d)} disabled={saving}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 disabled:cursor-not-allowed">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs text-gray-400">{d.idTipoDoc?.nombre ?? "—"}</span>
              <div className="flex gap-2">
                {d.rutaArchivo && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">PDF</span>
                )}
                {d.esElectronico && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">Electrónico</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal subir PDF */}
      {modalSubir && (
        <ModalSubirDocumento
          expedientes={expedientes}
          tipos={tipos}
          onClose={() => setModalSubir(false)}
          onExito={() => { refetch(); }}
        />
      )}

      {/* Modal editar */}
      {modalEditar && editando && (
        <Modal onClose={() => setModalEditar(false)} title="Editar documento"
          icon={<FileText className="w-5 h-5 text-blue-500" />}>
          <Field 
            label="Título" 
            value={formEditar.titulo} 
            onChange={fe("titulo")} 
            required 
            disabled={saving}
          />
          <Field 
            label="Número de folio" 
            value={formEditar.numeroFolio} 
            onChange={fe("numeroFolio")} 
            type="number" 
            disabled={saving}
          />
          <ErrorBox msg={err} />
          <ModalFooter 
            onCancel={() => setModalEditar(false)} 
            onSave={guardarEdicion} 
            saveLabel="Guardar cambios"
            saving={saving}
          />
        </Modal>
      )}
    </div>
  );
}