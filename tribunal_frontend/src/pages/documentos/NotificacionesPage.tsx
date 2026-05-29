import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_NOTIFICACIONES,
  GET_EXPEDIENTES_SIMPLE,
  GET_DOCUMENTOS,
  GET_PARTES_PROCESALES,
  CREAR_NOTIFICACION,
  ACTUALIZAR_NOTIFICACION,
  ELIMINAR_NOTIFICACION,
} from "../../graphql/documento";
import { Bell, Plus, Edit, Trash2, Clock, CheckCircle, XCircle, Search, X } from "lucide-react";
import {
  Notificacion, Expediente, Documento, ParteProcesal,
  fmtFechaHora,
  EstadoNotifBadge, TipoNotifBadge,
  Modal, Field, ErrorBox, ModalFooter,
  StatCard, TablaDesktop, ActionBtns, SearchBar,
} from "./shared";
import { useCrudNotifications } from "../../hooks/useCrudNotifications";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

const TIPO_NOTIF_OPTS = [
  { value: "CEDULA",      label: "Cédula" },
  { value: "ELECTRONICA", label: "Electrónica" },
  { value: "PERSONAL",    label: "Personal" },
  { value: "PUERTA",      label: "Puerta" },
];

const ESTADO_NOTIF_OPTS = [
  { value: "PENDIENTE",    label: "Pendiente" },
  { value: "DILIGENCIADA", label: "Diligenciada" },
  { value: "FALLIDA",      label: "Fallida" },
];

const initForm = {
  idExpediente:      "",
  idDocumento:       "",
  idParte:           "",
  tipoNotificacion:  "",
  estadoNotificacion: "PENDIENTE",
  fechaDiligencia:   "",
};

// ============================================================
// COMPONENTE: Buscador de Expedientes (Modal)
// ============================================================
function BuscadorExpediente({
  onSelect,
  onClose,
}: {
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
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
            <Search className="w-5 h-5 text-amber-500" />
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
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
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
                  className={`w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 ${
                    index === filtrados.length - 1 ? 'mb-0' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{e.numeroExpediente}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Año: {e.ano}</p>
                    </div>
                    <div className="text-amber-500">
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
// COMPONENTE: Buscador de Documentos (Modal) - CORREGIDO
// ============================================================
function BuscadorDocumento({
  expedienteId,
  onSelect,
  onClose,
}: {
  expedienteId: number;
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, loading } = useQuery(GET_DOCUMENTOS);

  const documentos: Documento[] = data?.allDocumentos ?? [];

  // ✅ CORRECCIÓN: Convertir a number para comparar
  const filtrados = documentos.filter(d => {
    const docExpId = d.idExpediente?.idExpediente;
    // Convertir ambos a número para comparar
    return Number(docExpId) === Number(expedienteId) &&
      d.titulo.toLowerCase().includes(busqueda.toLowerCase());
  });

  console.log("BuscadorDocumento - expedienteId:", expedienteId, "documentos encontrados:", filtrados.length);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-500" />
            Seleccionar Documento
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
              placeholder="Buscar documento por título..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            </div>
          ) : !expedienteId || expedienteId === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>Primero selecciona un expediente</p>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>No se encontraron documentos para este expediente</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filtrados.map((d: Documento, index: number) => (
                <button
                  key={d.idDocumento}
                  onClick={() => {
                    onSelect(d.idDocumento, d.titulo);
                    onClose();
                  }}
                  className={`w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 ${
                    index === filtrados.length - 1 ? 'mb-0' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{d.titulo}</p>
                    </div>
                    <div className="text-amber-500">
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
// COMPONENTE: Buscador de Partes (Modal) - CORREGIDO
// ============================================================
function BuscadorParte({
  expedienteId,
  onSelect,
  onClose,
}: {
  expedienteId: number;
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, loading } = useQuery(GET_PARTES_PROCESALES);

  const partes: ParteProcesal[] = data?.allPartesProcesales ?? [];

  // ✅ CORRECCIÓN: Convertir a number para comparar
  const filtrados = partes.filter(p => {
    const parteExpId = p.idExpediente?.idExpediente;
    const nombreParte = `${p.idPersona?.nombre ?? ''} ${p.idPersona?.primerApellido ?? ''} ${p.idRol?.nombreRol ?? ''}`;
    // Convertir ambos a número para comparar
    return Number(parteExpId) === Number(expedienteId) &&
      nombreParte.toLowerCase().includes(busqueda.toLowerCase());
  });

  console.log("BuscadorParte - expedienteId:", expedienteId, "partes encontradas:", filtrados.length);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-500" />
            Seleccionar Parte Procesal
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
              placeholder="Buscar parte por nombre o rol..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            </div>
          ) : !expedienteId || expedienteId === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>Primero selecciona un expediente</p>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>No se encontraron partes para este expediente</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filtrados.map((p: ParteProcesal, index: number) => (
                <button
                  key={p.idParte}
                  onClick={() => {
                    onSelect(p.idParte, `${p.idPersona?.nombre ?? ''} ${p.idPersona?.primerApellido ?? ''} (${p.idRol?.nombreRol ?? ''})`);
                    onClose();
                  }}
                  className={`w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 ${
                    index === filtrados.length - 1 ? 'mb-0' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">
                        {p.idPersona?.nombre ?? ''} {p.idPersona?.primerApellido ?? ''}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{p.idRol?.nombreRol ?? ''}</p>
                    </div>
                    <div className="text-amber-500">
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
// COMPONENTE: Buscador de Tipos de Notificación (Modal)
// ============================================================
function BuscadorTipoNotificacion({
  onSelect,
  onClose,
}: {
  onSelect: (tipo: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-500" />
            Seleccionar Tipo de Notificación
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
          <div className="space-y-2 pb-4">
            {TIPO_NOTIF_OPTS.map((t, index) => (
              <button
                key={t.value}
                onClick={() => {
                  onSelect(t.value);
                  onClose();
                }}
                className={`w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 ${
                  index === TIPO_NOTIF_OPTS.length - 1 ? 'mb-0' : ''
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">{t.label}</p>
                  </div>
                  <div className="text-amber-500">
                    <Plus className="w-5 h-5" />
                  </div>
                </div>
              </button>
            ))}
          </div>
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

// ════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════
export default function NotificacionesPage() {
  const { usuario } = useAuth();
  
  const { data, loading, refetch } = useQuery(GET_NOTIFICACIONES);
  const { data: dataExp }          = useQuery(GET_EXPEDIENTES_SIMPLE);
  const { data: dataDoc }          = useQuery(GET_DOCUMENTOS);
  const { data: dataParte }        = useQuery(GET_PARTES_PROCESALES);
  const [crearNotificacion]      = useMutation(CREAR_NOTIFICACION);
  const [actualizarNotificacion] = useMutation(ACTUALIZAR_NOTIFICACION);
  const [eliminarNotificacion]   = useMutation(ELIMINAR_NOTIFICACION);

  // ✅ HOOK DE NOTIFICACIONES
  const { executeCreate, executeUpdate, executeDelete, toast } = useCrudNotifications("Notificación");

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<Notificacion | null>(null);
  const [form, setForm]     = useState(initForm);
  const [busqueda, setBusq] = useState("");
  const [err, setErr]       = useState("");

  // Estados para buscadores modales
  const [buscadorExpAbierto, setBuscadorExpAbierto] = useState(false);
  const [buscadorDocAbierto, setBuscadorDocAbierto] = useState(false);
  const [buscadorParteAbierto, setBuscadorParteAbierto] = useState(false);
  const [buscadorTipoAbierto, setBuscadorTipoAbierto] = useState(false);
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState("");
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState("");
  const [parteSeleccionada, setParteSeleccionada] = useState("");
  const [tipoNotifSeleccionado, setTipoNotifSeleccionado] = useState("");

  const notificaciones: Notificacion[] = data?.allNotificaciones ?? [];
  const expedientes: Expediente[]      = dataExp?.allExpedientes ?? [];
  const documentos: Documento[]        = dataDoc?.allDocumentos ?? [];
  const partes: ParteProcesal[]        = dataParte?.allPartesProcesales ?? [];

  const filtrados = notificaciones.filter(n =>
    `${n.idExpediente?.numeroExpediente ?? ""} ${n.tipoNotificacion} ${n.estadoNotificacion} ${n.idParte?.idPersona?.nombre ?? ""} ${n.idParte?.idPersona?.primerApellido ?? ""}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  // Stats
  const pendientes    = notificaciones.filter(n => n.estadoNotificacion === "PENDIENTE").length;
  const diligenciadas = notificaciones.filter(n => n.estadoNotificacion === "DILIGENCIADA").length;
  const fallidas      = notificaciones.filter(n => n.estadoNotificacion === "FALLIDA").length;

  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const seleccionarExpediente = (id: number, nombre: string) => {
    setForm(p => ({ ...p, idExpediente: String(id), idDocumento: "", idParte: "" }));
    setExpedienteSeleccionado(nombre);
    setDocumentoSeleccionado("");
    setParteSeleccionada("");
  };

  const seleccionarDocumento = (id: number, nombre: string) => {
    setForm(p => ({ ...p, idDocumento: String(id) }));
    setDocumentoSeleccionado(nombre);
  };

  const seleccionarParte = (id: number, nombre: string) => {
    setForm(p => ({ ...p, idParte: String(id) }));
    setParteSeleccionada(nombre);
  };

  const seleccionarTipoNotificacion = (tipo: string) => {
    setForm(p => ({ ...p, tipoNotificacion: tipo }));
    const opcion = TIPO_NOTIF_OPTS.find(o => o.value === tipo);
    setTipoNotifSeleccionado(opcion?.label ?? tipo);
  };

  const abrirCrear = () => { 
    setEdit(null); 
    setForm(initForm); 
    setExpedienteSeleccionado("");
    setDocumentoSeleccionado("");
    setParteSeleccionada("");
    setTipoNotifSeleccionado("");
    setErr(""); 
    setModal(true); 
  };
  
  const abrirEditar = (n: Notificacion) => {
    setEdit(n);
    setForm({
      idExpediente:      String(n.idExpediente?.idExpediente ?? ""),
      idDocumento:       String(n.idDocumento?.idDocumento ?? ""),
      idParte:           String(n.idParte?.idParte ?? ""),
      tipoNotificacion:  n.tipoNotificacion,
      estadoNotificacion: n.estadoNotificacion,
      fechaDiligencia:   n.fechaDiligencia ? n.fechaDiligencia.substring(0, 16) : "",
    });
    setExpedienteSeleccionado(`${n.idExpediente?.numeroExpediente ?? ''}`);
    setDocumentoSeleccionado(n.idDocumento?.titulo ?? "");
    setParteSeleccionada(n.idParte?.idPersona ? `${n.idParte.idPersona.nombre} ${n.idParte.idPersona.primerApellido}` : "");
    setTipoNotifSeleccionado(TIPO_NOTIF_OPTS.find(o => o.value === n.tipoNotificacion)?.label ?? n.tipoNotificacion);
    setErr(""); 
    setModal(true);
  };

  // ✅ GUARDAR CON NOTIFICACIONES
  const guardar = async () => {
    if (!editando && (!form.idExpediente || !form.idDocumento || !form.idParte || !form.tipoNotificacion)) {
      toast.error("Todos los campos son obligatorios."); 
      return;
    }
    try {
      if (editando) {
        await executeUpdate(async () => {
          await actualizarNotificacion({
            variables: {
              id: Number(editando.idNotificacion),
              input: {
                estadoNotificacion: form.estadoNotificacion,
                fechaDiligencia:    form.fechaDiligencia || undefined,
              },
            },
          });
          await refetch(); 
          setModal(false);
          return true;
        });
      } else {
        if (!usuario?.idUsuario) {
          toast.error("No se ha encontrado el usuario actual."); 
          return;
        }
        
        await executeCreate(async () => {
          await crearNotificacion({
            variables: {
              idExpediente:     Number(form.idExpediente),
              idDocumento:      Number(form.idDocumento),
              idParte:          Number(form.idParte),
              idUsuario:        Number(usuario.idUsuario),
              tipoNotificacion: form.tipoNotificacion,
            },
          });
          await refetch(); 
          setModal(false);
          setExpedienteSeleccionado("");
          setDocumentoSeleccionado("");
          setParteSeleccionada("");
          setTipoNotifSeleccionado("");
          return true;
        });
      }
    } catch (e: any) { 
      setErr(e.message ?? "Error."); 
    }
  };

  // ✅ ELIMINAR CON NOTIFICACIONES
  const eliminar = async (n: Notificacion) => {
    await executeDelete(
      async () => {
        const { data } = await eliminarNotificacion({ variables: { id: Number(n.idNotificacion) } });
        if (!data?.eliminarNotificacion?.ok) {
          throw new Error(data?.eliminarNotificacion?.mensaje ?? "No se pudo eliminar.");
        }
        await refetch();
        return true;
      },
      {
        loading: `Eliminando notificación del expediente #${n.idExpediente?.numeroExpediente ?? 'N/A'}...`,
        success: `Notificación eliminada exitosamente`,
        error: `Error al eliminar la notificación`,
      },
      `¿Eliminar esta notificación?`
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Bell className="w-7 h-7 text-amber-500" />
            Notificaciones
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Notificaciones judiciales • {notificaciones.length} registros
          </p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-sm shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> Nueva notificación
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Pendientes" value={pendientes} color="text-amber-600 dark:text-amber-400"
          icon={<Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />} sub="Esperando diligencia" />
        <StatCard label="Diligenciadas" value={diligenciadas} color="text-emerald-600 dark:text-emerald-400"
          icon={<CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
          sub={`${Math.round((diligenciadas / (notificaciones.length || 1)) * 100)}% completadas`} />
        <StatCard label="Fallidas" value={fallidas} color="text-red-600 dark:text-red-400"
          icon={<XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />} sub="Requieren atención" />
      </div>

      {/* Barra de búsqueda */}
      <div className="flex justify-between items-center">
        <SearchBar value={busqueda} onChange={setBusq} placeholder="Buscar por expediente, tipo, estado..." />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla Desktop */}
      <TablaDesktop
        headers={["Expediente", "Documento", "Parte", "Tipo", "Estado", "Emitida", "Diligenciada", "Acciones"]}
        loading={loading}
        emptyMsg="No hay notificaciones registradas"
        emptyIcon={<Bell className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
      >
        {filtrados.map(n => (
          <tr key={n.idNotificacion} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td className="px-6 py-4">
              <span className="text-blue-500 font-bold font-mono text-sm">
                #{n.idExpediente?.numeroExpediente ?? "—"}
              </span>
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-[150px] truncate">
              {n.idDocumento?.titulo ?? "—"}
            </td>
            <td className="px-6 py-4">
              <span className="text-sm text-gray-700 dark:text-gray-200">
                {n.idParte?.idPersona
                  ? `${n.idParte.idPersona.nombre} ${n.idParte.idPersona.primerApellido}`
                  : "—"}
              </span>
              {n.idParte?.idRol && (
                <div className="text-xs text-gray-400 mt-0.5">{n.idParte.idRol.nombreRol}</div>
              )}
            </td>
            <td className="px-6 py-4">
              <TipoNotifBadge tipo={n.tipoNotificacion} />
            </td>
            <td className="px-6 py-4">
              <EstadoNotifBadge estado={n.estadoNotificacion} />
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">
              {fmtFechaHora(n.fechaEmision)}
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">
              {fmtFechaHora(n.fechaDiligencia)}
            </td>
            <td className="px-6 py-4">
              <ActionBtns onEdit={() => abrirEditar(n)} onDelete={() => eliminar(n)} />
            </td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Cards Móvil */}
      <div className="lg:hidden space-y-3">
        {filtrados.map(n => (
          <div key={n.idNotificacion} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-blue-500 font-mono font-bold text-sm">
                  #{n.idExpediente?.numeroExpediente ?? "—"}
                </span>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                  {n.idParte?.idPersona
                    ? `${n.idParte.idPersona.nombre} ${n.idParte.idPersona.primerApellido}`
                    : "—"}
                </p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => abrirEditar(n)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => eliminar(n)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex gap-2">
                <TipoNotifBadge tipo={n.tipoNotificacion} />
                <EstadoNotifBadge estado={n.estadoNotificacion} />
              </div>
              <span className="text-xs text-gray-400">{fmtFechaHora(n.fechaEmision)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title={editando ? "Editar notificación" : "Nueva notificación"}
          icon={<Bell className="w-5 h-5 text-amber-500" />}
        >
          {!editando ? (
            <>
              {/* Expediente - Con buscador */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Expediente <span className="text-red-500">*</span>
                </label>
                {expedienteSeleccionado ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                    <span className="flex-1 text-sm text-gray-800 dark:text-white">{expedienteSeleccionado}</span>
                    <button
                      onClick={() => {
                        setForm(p => ({ ...p, idExpediente: "", idDocumento: "", idParte: "" }));
                        setExpedienteSeleccionado("");
                        setDocumentoSeleccionado("");
                        setParteSeleccionada("");
                      }}
                      className="p-1 rounded-lg text-gray-500 hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setBuscadorExpAbierto(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-amber-400 dark:hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Buscar y seleccionar expediente
                  </button>
                )}
              </div>

              {/* Documento - Con buscador (solo si hay expediente) */}
              {form.idExpediente && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                    Documento <span className="text-red-500">*</span>
                  </label>
                  {documentoSeleccionado ? (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                      <span className="flex-1 text-sm text-gray-800 dark:text-white">{documentoSeleccionado}</span>
                      <button
                        onClick={() => {
                          setForm(p => ({ ...p, idDocumento: "" }));
                          setDocumentoSeleccionado("");
                        }}
                        className="p-1 rounded-lg text-gray-500 hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setBuscadorDocAbierto(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-amber-400 dark:hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Buscar y seleccionar documento
                    </button>
                  )}
                </div>
              )}

              {/* Parte Procesal - Con buscador (solo si hay expediente) */}
              {form.idExpediente && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                    Parte procesal <span className="text-red-500">*</span>
                  </label>
                  {parteSeleccionada ? (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                      <span className="flex-1 text-sm text-gray-800 dark:text-white">{parteSeleccionada}</span>
                      <button
                        onClick={() => {
                          setForm(p => ({ ...p, idParte: "" }));
                          setParteSeleccionada("");
                        }}
                        className="p-1 rounded-lg text-gray-500 hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setBuscadorParteAbierto(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-amber-400 dark:hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Buscar y seleccionar parte
                    </button>
                  )}
                </div>
              )}

              {/* Tipo de Notificación - Con buscador */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Tipo de notificación <span className="text-red-500">*</span>
                </label>
                {tipoNotifSeleccionado ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                    <span className="flex-1 text-sm text-gray-800 dark:text-white">{tipoNotifSeleccionado}</span>
                    <button
                      onClick={() => {
                        setForm(p => ({ ...p, tipoNotificacion: "" }));
                        setTipoNotifSeleccionado("");
                      }}
                      className="p-1 rounded-lg text-gray-500 hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setBuscadorTipoAbierto(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-amber-400 dark:hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Buscar y seleccionar tipo de notificación
                  </button>
                )}
              </div>

              {/* Mensaje informativo sobre el usuario */}
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-700 dark:text-blue-400">
                La notificación será registrada por: <strong>{usuario?.nombre} {usuario?.paterno}</strong>
              </div>
            </>
          ) : (
            <>
              {/* En edición, mostrar la información como texto */}
              <div className="mb-4 p-2.5 rounded-xl bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 text-sm">
                Expediente: #{expedienteSeleccionado}
              </div>
              <div className="mb-4 p-2.5 rounded-xl bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 text-sm">
                Documento: {documentoSeleccionado}
              </div>
              <div className="mb-4 p-2.5 rounded-xl bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 text-sm">
                Parte: {parteSeleccionada}
              </div>
              <div className="mb-4 p-2.5 rounded-xl bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 text-sm">
                Tipo: {tipoNotifSeleccionado}
              </div>

              {/* Estado - Select para edición */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Estado <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.estadoNotificacion}
                  onChange={e => setForm(p => ({ ...p, estadoNotificacion: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none"
                >
                  {ESTADO_NOTIF_OPTS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <Field
                label="Fecha de diligencia" value={form.fechaDiligencia}
                onChange={f("fechaDiligencia")} type="datetime-local"
              />
            </>
          )}
          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)} 
            onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Crear notificación"}
          />
        </Modal>
      )}

      {/* Modales de buscadores */}
      {buscadorExpAbierto && (
        <BuscadorExpediente
          onSelect={seleccionarExpediente}
          onClose={() => setBuscadorExpAbierto(false)}
        />
      )}
      {buscadorDocAbierto && (
  <BuscadorDocumento
    expedienteId={form.idExpediente ? Number(form.idExpediente) : 0}
    onSelect={seleccionarDocumento}
    onClose={() => setBuscadorDocAbierto(false)}
  />
)}
{buscadorParteAbierto && (
  <BuscadorParte
    expedienteId={form.idExpediente ? Number(form.idExpediente) : 0}
    onSelect={seleccionarParte}
    onClose={() => setBuscadorParteAbierto(false)}
  />
)}
      {buscadorTipoAbierto && (
        <BuscadorTipoNotificacion
          onSelect={seleccionarTipoNotificacion}
          onClose={() => setBuscadorTipoAbierto(false)}
        />
      )}
    </div>
  );
}