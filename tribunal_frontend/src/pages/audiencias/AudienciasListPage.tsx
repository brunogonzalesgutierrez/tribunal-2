import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_AUDIENCIAS,
  GET_TIPOS_AUDIENCIA,
  GET_SALAS_AUDIENCIA,
  GET_EXPEDIENTES_SIMPLE,
} from "../../graphql/audiencias";
import {
  CREAR_AUDIENCIA,
  ACTUALIZAR_AUDIENCIA,
  ELIMINAR_AUDIENCIA,
} from "../../graphql/audiencias";
import {
  Scale, Plus, Search, Edit, Trash2,
  Calendar, DoorOpen, Video, MoreVertical,
  CheckCircle, Circle, AlertCircle, X, ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  Audiencia, Expediente, TipoAudiencia, SalaAudiencia,
  fmt, EstadoBadge, Modal, Field, SelectField, TextareaField,
  ErrorBox, ModalFooter, StatCard, TablaDesktop, ActionBtns, Paginacion,
} from "./shared";
import { useCrudNotifications } from '../../hooks/useCrudNotifications';
import { useToast } from '../../context/ToastContext';

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
              {filtrados.map((e, index) => (
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
// COMPONENTE: Buscador de Tipos de Audiencia (Modal)
// ============================================================
function BuscadorTipoAudiencia({
  onSelect,
  onClose,
  disabled,
}: {
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
  disabled?: boolean;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, loading } = useQuery(GET_TIPOS_AUDIENCIA);

  const tipos: TipoAudiencia[] = data?.allTiposAudiencia ?? [];

  const filtrados = tipos.filter(t =>
    `${t.nombre} ${t.duracionEstimada}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-500" />
            Seleccionar Tipo de Audiencia
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
              placeholder="Buscar tipo de audiencia por nombre o duración..."
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
              <p>No se encontraron tipos de audiencia</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filtrados.map((t, index) => (
                <button
                  key={t.idTipoAudiencia}
                  onClick={() => {
                    onSelect(t.idTipoAudiencia, `${t.nombre} (${t.duracionEstimada} min)`);
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
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Duración: {t.duracionEstimada} minutos</p>
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
// COMPONENTE: Buscador de Salas (Modal)
// ============================================================
function BuscadorSalaAudiencia({
  onSelect,
  onClose,
  disabled,
}: {
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
  disabled?: boolean;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, loading } = useQuery(GET_SALAS_AUDIENCIA);

  const salas: SalaAudiencia[] = data?.allSalasAudiencia ?? [];

  const filtrados = salas.filter(s =>
    `${s.nombreSala} ${s.capacidad}`.toLowerCase().includes(busqueda.toLowerCase()) && s.activa
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-500" />
            Seleccionar Sala
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
              placeholder="Buscar sala por nombre o capacidad..."
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
              <p>No se encontraron salas</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filtrados.map((s, index) => (
                <button
                  key={s.idSalaAud}
                  onClick={() => {
                    onSelect(s.idSalaAud, `${s.nombreSala} (Cap. ${s.capacidad})`);
                    onClose();
                  }}
                  disabled={disabled}
                  className={`w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${
                    index === filtrados.length - 1 ? 'mb-0' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{s.nombreSala}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Capacidad: {s.capacidad} personas</p>
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

// ─── CARD MÓVIL ──────────────────────────────────────────
function AudienciaCard({
  a, onEdit, onDelete, disabled,
}: {
  a: Audiencia; onEdit: () => void; onDelete: () => void; disabled?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-blue-500 dark:text-blue-400 font-bold">
            #{a.idExpediente.numeroExpediente}
          </span>
          <span className="text-xs text-gray-400 ml-2">{a.idExpediente.ano}</span>
          <p className="text-sm text-gray-700 dark:text-gray-200 font-medium mt-0.5">
            {a.idTipoAudiencia.nombre}
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            disabled={disabled}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <MoreVertical className="w-5 h-5 text-gray-500" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg z-10 py-1">
              <button
                onClick={onEdit}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" /> Editar
              </button>
              <button
                onClick={onDelete}
                className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Eliminar
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Calendar className="w-3.5 h-3.5" />
          {fmt(a.fechaHoraProgramada)}
        </div>
        {a.idSalaAud && (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <DoorOpen className="w-3.5 h-3.5" />
            {a.idSalaAud.nombreSala}
          </div>
        )}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
        <EstadoBadge estado={a.estadoAudiencia} />
        {a.linkVideoconferencia && (
          <a
            href={a.linkVideoconferencia}
            target="_blank"
            rel="noreferrer"
            className="text-blue-500 text-xs flex items-center gap-1"
          >
            <Video className="w-3.5 h-3.5" /> Enlace
          </a>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════
export default function AudienciasListPage() {
  const { data, loading, refetch } = useQuery(GET_AUDIENCIAS);
  const { data: dExp }  = useQuery(GET_EXPEDIENTES_SIMPLE);
  const { data: dTipo } = useQuery(GET_TIPOS_AUDIENCIA);
  const { data: dSala } = useQuery(GET_SALAS_AUDIENCIA);

  const [crearAudiencia]      = useMutation(CREAR_AUDIENCIA);
  const [actualizarAudiencia] = useMutation(ACTUALIZAR_AUDIENCIA);
  const [eliminarAudiencia]   = useMutation(ELIMINAR_AUDIENCIA);

  const { executeCreate, executeUpdate, executeDelete } = useCrudNotifications('Audiencia');
  const toast = useToast();

  const [modal, setModal] = useState(false);
  const [buscadorExpAbierto, setBuscadorExpAbierto] = useState(false);
  const [buscadorTipoAbierto, setBuscadorTipoAbierto] = useState(false);
  const [buscadorSalaAbierto, setBuscadorSalaAbierto] = useState(false);
  const [editando, setEdit] = useState<Audiencia | null>(null);
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState("");
  const [tipoSeleccionado, setTipoSeleccionado] = useState("");
  const [salaSeleccionada, setSalaSeleccionada] = useState("");
  const [err, setErr] = useState("");
  const [busqueda, setBusq] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ Estado para bloqueo de botones
  const [saving, setSaving] = useState(false);

  const initForm = {
    idExpediente: 0, idTipoAudiencia: 0, idSalaAud: 0,
    fechaHoraProgramada: "", linkVideoconferencia: "",
    estadoAudiencia: "PROGRAMADA", motivoSuspension: "",
  };
  const [form, setForm] = useState(initForm);
  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const audiencias: Audiencia[] = data?.allAudiencias ?? [];
  const expedientes: Expediente[] = dExp?.allExpedientes ?? [];
  const tipos: TipoAudiencia[] = dTipo?.allTiposAudiencia ?? [];
  const salas: SalaAudiencia[] = dSala?.allSalasAudiencia ?? [];

  const filtradas = audiencias.filter(a =>
    `${a.idExpediente.numeroExpediente} ${a.estadoAudiencia} ${a.idTipoAudiencia.nombre}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalPages = Math.ceil(filtradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtradas.slice(startIndex, startIndex + itemsPerPage);

  const programadas = audiencias.filter(a => a.estadoAudiencia === "PROGRAMADA").length;
  const enCurso = audiencias.filter(a => a.estadoAudiencia === "EN_CURSO").length;
  const finalizadas = audiencias.filter(a => a.estadoAudiencia === "FINALIZADA").length;
  const suspendidas = audiencias.filter(a => a.estadoAudiencia === "SUSPENDIDA").length;

  const abrirCrear = () => {
    setEdit(null);
    setForm(initForm);
    setExpedienteSeleccionado("");
    setTipoSeleccionado("");
    setSalaSeleccionada("");
    setErr("");
    setModal(true);
  };

  const abrirEditar = (a: Audiencia) => {
    setEdit(a);
    setForm({
      idExpediente: a.idExpediente.idExpediente,
      idTipoAudiencia: a.idTipoAudiencia.idTipoAudiencia,
      idSalaAud: a.idSalaAud?.idSalaAud ?? 0,
      fechaHoraProgramada: a.fechaHoraProgramada?.slice(0, 16) ?? "",
      linkVideoconferencia: a.linkVideoconferencia ?? "",
      estadoAudiencia: a.estadoAudiencia,
      motivoSuspension: a.motivoSuspension ?? "",
    });
    setExpedienteSeleccionado(`${a.idExpediente.numeroExpediente} (${a.idExpediente.ano})`);
    setTipoSeleccionado(`${a.idTipoAudiencia.nombre} (${a.idTipoAudiencia.duracionEstimada} min)`);
    setSalaSeleccionada(a.idSalaAud ? `${a.idSalaAud.nombreSala} (Cap. ${a.idSalaAud.capacidad})` : "");
    setErr("");
    setModal(true);
  };

  const seleccionarExpediente = (id: number, nombre: string) => {
    setForm(f => ({ ...f, idExpediente: id }));
    setExpedienteSeleccionado(nombre);
  };

  const seleccionarTipo = (id: number, nombre: string) => {
    setForm(f => ({ ...f, idTipoAudiencia: id }));
    setTipoSeleccionado(nombre);
  };

  const seleccionarSala = (id: number, nombre: string) => {
    setForm(f => ({ ...f, idSalaAud: id }));
    setSalaSeleccionada(nombre);
  };

  const resetBusqueda = () => {
    setBusq("");
    setCurrentPage(1);
  };

  // ✅ GUARDAR CON BLOQUEO
  const guardar = async () => {
    if (!form.idExpediente || !form.idTipoAudiencia || !form.fechaHoraProgramada) {
      toast.error("Expediente, tipo de audiencia y fecha son obligatorios.");
      return;
    }
    
    if (saving) return;
    setSaving(true);
    
    const salaId = form.idSalaAud && form.idSalaAud !== 0 ? Number(form.idSalaAud) : undefined;
    
    try {
      if (editando) {
        await executeUpdate(async () => {
          await actualizarAudiencia({
            variables: {
              id: Number(editando.idAudiencia),
              input: {
                idTipoAudiencia: Number(form.idTipoAudiencia) || undefined,
                idSalaAud: salaId,
                fechaHoraProgramada: form.fechaHoraProgramada,
                estadoAudiencia: form.estadoAudiencia || undefined,
                motivoSuspension: form.motivoSuspension || undefined,
                linkVideoconferencia: form.linkVideoconferencia || undefined,
              },
            },
          });
          await refetch();
          setModal(false);
          return true;
        });
      } else {
        await executeCreate(async () => {
          await crearAudiencia({
            variables: {
              input: {
                idExpediente: Number(form.idExpediente),
                idTipoAudiencia: Number(form.idTipoAudiencia),
                fechaHoraProgramada: form.fechaHoraProgramada,
                idSalaAud: salaId,
                linkVideoconferencia: form.linkVideoconferencia || undefined,
              },
            },
          });
          await refetch();
          setModal(false);
          return true;
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // ✅ ELIMINAR CON BLOQUEO
  const eliminar = async (a: Audiencia) => {
    await executeDelete(
      async () => {
        const { data } = await eliminarAudiencia({ variables: { id: Number(a.idAudiencia) } });
        if (!data?.eliminarAudiencia?.ok) {
          throw new Error(data?.eliminarAudiencia?.mensaje ?? "No se pudo eliminar.");
        }
        await refetch();
        return true;
      },
      {
        loading: `Eliminando audiencia del expediente #${a.idExpediente.numeroExpediente}...`,
        success: `Audiencia eliminada exitosamente`,
        error: `Error al eliminar la audiencia`,
      },
      `¿Eliminar la audiencia del expediente #${a.idExpediente.numeroExpediente}?`
    );
  };

  // Resetear página cuando cambia la búsqueda
  const handleBusquedaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusq(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Scale className="w-7 h-7 text-blue-500" />
            Audiencias
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestión de audiencias judiciales • {audiencias.length} registros
          </p>
        </div>
        <button
          onClick={abrirCrear}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <Plus className="w-4 h-4" /> Nueva audiencia
        </button>
      </div>

      {/* Stats - Clases fijas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Programadas</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{programadas}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Próximas a realizarse</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">En curso</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{enCurso}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Activas ahora mismo</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Finalizadas</p>
              <p className="text-3xl font-bold text-gray-600 dark:text-gray-400 mt-2">{finalizadas}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Circle className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Completadas</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Suspendidas</p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">{suspendidas}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Requieren reprogramación</p>
          </div>
        </div>
      </div>

      {/* Buscador de tabla */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          placeholder="Buscar por expediente, tipo o estado..."
          value={busqueda}
          onChange={handleBusquedaChange}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
        />
      </div>

      {/* Tabla Desktop */}
      <TablaDesktop
        headers={["Expediente", "Tipo", "Fecha programada", "Sala", "Estado", "Link", "Acciones"]}
        loading={loading}
        emptyMsg="No hay audiencias registradas"
        emptyIcon={<Scale className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
      >
        {paginated.map(a => (
          <tr key={a.idAudiencia} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td className="px-6 py-4">
              <span className="font-bold text-blue-500 dark:text-blue-400">#{a.idExpediente.numeroExpediente}</span>
              <span className="text-xs text-gray-400 ml-2">{a.idExpediente.ano}</span>
            </td>
            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">{a.idTipoAudiencia.nombre}</td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">{fmt(a.fechaHoraProgramada)}</td>
            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
              {a.idSalaAud ? (
                <span className="flex items-center gap-1.5">
                  {a.idSalaAud.nombreSala}
                  {a.idSalaAud.equipadaVideoconf && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                      <Video className="w-3 h-3 inline" />
                    </span>
                  )}
                </span>
              ) : <span className="text-gray-400">—</span>}
            </td>
            <td className="px-6 py-4"><EstadoBadge estado={a.estadoAudiencia} /></td>
            <td className="px-6 py-4">
              {a.linkVideoconferencia ? (
                <a href={a.linkVideoconferencia} target="_blank" rel="noreferrer"
                  className="text-blue-500 text-xs flex items-center gap-1 hover:underline">
                  <Video className="w-3.5 h-3.5" /> Enlace
                </a>
              ) : <span className="text-gray-400 text-sm">—</span>}
            </td>
            <td className="px-6 py-4">
              <ActionBtns onEdit={() => abrirEditar(a)} onDelete={() => eliminar(a)} disabled={saving} />
            </td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Cards Móvil */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4 animate-pulse h-36" />
          ))
        ) : paginated.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Scale className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p>No se encontraron audiencias</p>
          </div>
        ) : paginated.map(a => (
          <AudienciaCard key={a.idAudiencia} a={a} onEdit={() => abrirEditar(a)} onDelete={() => eliminar(a)} disabled={saving} />
        ))}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filtradas.length)} de {filtradas.length}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title={editando ? "Editar audiencia" : "Nueva audiencia"}
          icon={<Scale className="w-5 h-5 text-blue-500" />}
        >
          {/* Expediente - Con buscador (solo en creación) */}
          {!editando && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Expediente <span className="text-red-500">*</span>
              </label>
              {expedienteSeleccionado ? (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                  <span className="flex-1 text-sm text-gray-800 dark:text-white">{expedienteSeleccionado}</span>
                  <button
                    onClick={() => {
                      setForm(f => ({ ...f, idExpediente: 0 }));
                      setExpedienteSeleccionado("");
                    }}
                    disabled={saving}
                    className="p-1 rounded-lg text-gray-500 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setBuscadorExpAbierto(true)}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Buscar y seleccionar expediente
                </button>
              )}
            </div>
          )}

          {/* En edición, mostrar el expediente como texto */}
          {editando && (
            <div className="mb-4 p-2.5 rounded-xl bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 text-sm">
              Expediente: {expedienteSeleccionado}
            </div>
          )}

          {/* Tipo de Audiencia - Con buscador */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              Tipo de audiencia <span className="text-red-500">*</span>
            </label>
            {tipoSeleccionado ? (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                <span className="flex-1 text-sm text-gray-800 dark:text-white">{tipoSeleccionado}</span>
                <button
                  onClick={() => {
                    setForm(f => ({ ...f, idTipoAudiencia: 0 }));
                    setTipoSeleccionado("");
                  }}
                  disabled={saving}
                  className="p-1 rounded-lg text-gray-500 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setBuscadorTipoAbierto(true)}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Buscar y seleccionar tipo de audiencia
              </button>
            )}
          </div>

          <Field 
            label="Fecha y hora programada" 
            value={form.fechaHoraProgramada} 
            onChange={f("fechaHoraProgramada")} 
            type="datetime-local" 
            required 
            disabled={saving}
          />

          {/* Sala - Con buscador */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              Sala de audiencia
            </label>
            {salaSeleccionada ? (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
                <span className="flex-1 text-sm text-gray-800 dark:text-white">{salaSeleccionada}</span>
                <button
                  onClick={() => {
                    setForm(f => ({ ...f, idSalaAud: 0 }));
                    setSalaSeleccionada("");
                  }}
                  disabled={saving}
                  className="p-1 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setBuscadorSalaAbierto(true)}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Buscar y seleccionar sala
              </button>
            )}
          </div>

          <Field 
            label="Link videoconferencia" 
            value={form.linkVideoconferencia} 
            onChange={f("linkVideoconferencia")} 
            placeholder="https://..." 
            disabled={saving}
          />

          {editando && (
            <>
              <SelectField label="Estado" value={form.estadoAudiencia} onChange={f("estadoAudiencia")} disabled={saving}>
                <option value="PROGRAMADA">Programada</option>
                <option value="EN_CURSO">En curso</option>
                <option value="FINALIZADA">Finalizada</option>
                <option value="SUSPENDIDA">Suspendida</option>
              </SelectField>
              {form.estadoAudiencia === "SUSPENDIDA" && (
                <TextareaField 
                  label="Motivo de suspensión" 
                  value={form.motivoSuspension} 
                  onChange={f("motivoSuspension")}
                  disabled={saving}
                />
              )}
            </>
          )}

          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)}
            onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Crear audiencia"}
            saving={saving}
          />
        </Modal>
      )}

      {/* Modales de buscadores */}
      {buscadorExpAbierto && (
        <BuscadorExpediente
          onSelect={seleccionarExpediente}
          onClose={() => setBuscadorExpAbierto(false)}
          disabled={saving}
        />
      )}
      {buscadorTipoAbierto && (
        <BuscadorTipoAudiencia
          onSelect={seleccionarTipo}
          onClose={() => setBuscadorTipoAbierto(false)}
          disabled={saving}
        />
      )}
      {buscadorSalaAbierto && (
        <BuscadorSalaAudiencia
          onSelect={seleccionarSala}
          onClose={() => setBuscadorSalaAbierto(false)}
          disabled={saving}
        />
      )}
    </div>
  );
}