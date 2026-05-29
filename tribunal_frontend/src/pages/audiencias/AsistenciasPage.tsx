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
import { Users, Plus, Edit, Trash2, CheckCircle, Circle, Search, X } from "lucide-react";
import {
  Asistencia,
  fmt, Modal, Field, TextareaField,
  ErrorBox, ModalFooter, StatCard, TablaDesktop, ActionBtns,
} from "./shared";
import { useCrudNotifications } from '../../hooks/useCrudNotifications';
import { useToast } from '../../context/ToastContext';

// ✅ Función auxiliar para mostrar solo la hora
const fmtHora = (fecha?: string | null) => {
  if (!fecha) return "—";
  const d = new Date(fecha);
  return d.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });
};

// ✅ Función para obtener la hora actual en formato HH:MM
const getCurrentTime = () => {
  const now = new Date();
  return now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
};

// ============================================================
// COMPONENTE: Buscador de Audiencias (Modal)
// ============================================================
function BuscadorAudiencia({
  onSelect,
  onClose,
}: {
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, loading } = useQuery(GET_AUDIENCIAS);

  const audiencias = data?.allAudiencias ?? [];

  const filtrados = audiencias.filter((a: any) =>
    `${a.idExpediente?.numeroExpediente || ''} ${a.idTipoAudiencia?.nombre || ''}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-500" />
            Seleccionar Audiencia
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
              placeholder="Buscar por expediente o tipo de audiencia..."
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
              <p>No se encontraron audiencias</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filtrados.map((a: any, index: number) => (
                <button
                  key={a.idAudiencia}
                  onClick={() => {
                    onSelect(a.idAudiencia, `#${a.idExpediente.numeroExpediente} - ${a.idTipoAudiencia?.nombre || 'Tipo no especificado'} (${fmt(a.fechaHoraProgramada)})`);
                    onClose();
                  }}
                  className={`w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 ${
                    index === filtrados.length - 1 ? 'mb-0' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">#{a.idExpediente.numeroExpediente}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{a.idTipoAudiencia?.nombre || 'Tipo no especificado'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{fmt(a.fechaHoraProgramada)}</p>
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
// COMPONENTE: Buscador de Personas (Modal)
// ============================================================
function BuscadorPersona({
  onSelect,
  onClose,
}: {
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, loading } = useQuery(GET_PERSONAS_SIMPLE);

  const personas = data?.allPersonas ?? [];

  const filtrados = personas.filter((p: any) =>
    `${p.nombre} ${p.primerApellido} ${p.numeroDocumento}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-500" />
            Seleccionar Persona
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
              placeholder="Buscar por nombre, apellido o documento..."
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
              <p>No se encontraron personas</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filtrados.map((p: any, index: number) => (
                <button
                  key={p.idPersona}
                  onClick={() => {
                    onSelect(p.idPersona, `${p.nombre} ${p.primerApellido} (${p.numeroDocumento})`);
                    onClose();
                  }}
                  className={`w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 ${
                    index === filtrados.length - 1 ? 'mb-0' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{p.nombre} {p.primerApellido}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{p.numeroDocumento}</p>
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

// ════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════
export default function AsistenciasPage() {
  const { data, loading, refetch } = useQuery(GET_ASISTENCIAS);
  const { data: dAud }  = useQuery(GET_AUDIENCIAS);
  const { data: dPers } = useQuery(GET_PERSONAS_SIMPLE);
  const [registrar]  = useMutation(REGISTRAR_ASISTENCIA);
  const [actualizar] = useMutation(ACTUALIZAR_ASISTENCIA);
  const [eliminarAs] = useMutation(ELIMINAR_ASISTENCIA);

  // ✅ HOOK DE NOTIFICACIONES
  const { executeCreate, executeUpdate, executeDelete } = useCrudNotifications('Asistencia');
  const toast = useToast();

  const [modal, setModal] = useState(false);
  const [buscadorAudAbierto, setBuscadorAudAbierto] = useState(false);
  const [buscadorPersAbierto, setBuscadorPersAbierto] = useState(false);
  const [editando, setEdit] = useState<Asistencia | null>(null);
  const [audienciaSeleccionada, setAudienciaSeleccionada] = useState("");
  const [personaSeleccionada, setPersonaSeleccionada] = useState("");
  const [err, setErr] = useState("");

  const initForm = { 
    idAudiencia: 0, 
    idPersona: 0, 
    rolEnAudiencia: "", 
    asistio: true, 
    motivoInasistencia: "",
    horaIngreso: getCurrentTime()  // ← Prellenar con hora actual
  };
  const [form, setForm] = useState(initForm);
  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const asistencias: Asistencia[] = data?.allAsistencias ?? [];
  const audiencias                = dAud?.allAudiencias ?? [];
  const personas                  = dPers?.allPersonas ?? [];

  const asistieron   = asistencias.filter(a => a.asistio).length;
  const noAsistieron = asistencias.filter(a => !a.asistio).length;

  const seleccionarAudiencia = (id: number, nombre: string) => {
    setForm(f => ({ ...f, idAudiencia: id }));
    setAudienciaSeleccionada(nombre);
  };

  const seleccionarPersona = (id: number, nombre: string) => {
    setForm(f => ({ ...f, idPersona: id }));
    setPersonaSeleccionada(nombre);
  };

  const abrirCrear = () => { 
    setEdit(null); 
    setForm({ 
      ...initForm, 
      horaIngreso: getCurrentTime(),
      asistio: true 
    }); 
    setAudienciaSeleccionada("");
    setPersonaSeleccionada("");
    setErr(""); 
    setModal(true); 
  };

  const abrirEditar = (a: Asistencia) => {
    setEdit(a);
    setForm({
      idAudiencia: a.idAudiencia.idAudiencia,
      idPersona: a.idPersona.idPersona,
      rolEnAudiencia: a.rolEnAudiencia,
      asistio: a.asistio,
      motivoInasistencia: a.motivoInasistencia ?? "",
      horaIngreso: a.horaIngreso ? new Date(a.horaIngreso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : "",
    });
    setAudienciaSeleccionada(`#${a.idAudiencia.idExpediente.numeroExpediente}`);
    setPersonaSeleccionada(`${a.idPersona.nombre} ${a.idPersona.primerApellido} (${a.idPersona.numeroDocumento})`);
    setErr(""); 
    setModal(true);
  };

  // ✅ GUARDAR CON NOTIFICACIONES
  const guardar = async () => {
    const convertirHoraAIso = (horaStr: string) => {
      if (!horaStr || horaStr.trim() === "") return null;
      const hoy = new Date();
      const [horas, minutos] = horaStr.split(':');
      hoy.setHours(parseInt(horas), parseInt(minutos), 0, 0);
      return hoy.toISOString();
    };

    if (editando) {
      await executeUpdate(async () => {
        await actualizar({
          variables: {
            id: Number(editando.idAsistencia),
            input: { 
              asistio: form.asistio, 
              motivoInasistencia: form.motivoInasistencia || undefined,
              horaIngreso: form.asistio ? convertirHoraAIso(form.horaIngreso) : null
            },
          },
        });
        await refetch();
        setModal(false);
        return true;
      });
    } else {
      if (!form.idAudiencia || !form.idPersona || !form.rolEnAudiencia) {
        toast.error("Audiencia, persona y rol son obligatorios."); 
        return;
      }
      
      await executeCreate(async () => {
        await registrar({
          variables: {
            idAudiencia: Number(form.idAudiencia),
            idPersona: Number(form.idPersona),
            rolEnAudiencia: form.rolEnAudiencia,
            asistio: form.asistio,
            horaIngreso: form.asistio ? convertirHoraAIso(form.horaIngreso) : null
          },
        });
        await refetch();
        setModal(false);
        setAudienciaSeleccionada("");
        setPersonaSeleccionada("");
        return true;
      });
    }
  };

  // ✅ ELIMINAR CON NOTIFICACIONES
  const eliminar = async (a: Asistencia) => {
    await executeDelete(
      async () => {
        const { data } = await eliminarAs({ variables: { id: Number(a.idAsistencia) } });
        if (!data?.eliminarAsistencia?.ok) {
          throw new Error(data?.eliminarAsistencia?.mensaje ?? "No se pudo eliminar.");
        }
        await refetch();
        return true;
      },
      {
        loading: `Eliminando registro de ${a.idPersona.nombre} ${a.idPersona.primerApellido}...`,
        success: `Registro eliminado exitosamente`,
        error: `Error al eliminar el registro`,
      },
      `¿Eliminar el registro de ${a.idPersona.nombre} ${a.idPersona.primerApellido}?`
    );
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
        headers={["Persona", "Audiencia", "Rol", "Asistió", "Hora ingreso", "Motivo", "Acciones"]}
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
              {fmtHora(a.horaIngreso)}
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
              {!a.asistio && a.motivoInasistencia ? a.motivoInasistencia : "—"}
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
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="text-blue-500">#{a.idAudiencia.idExpediente.numeroExpediente}</span>
              <span className="mx-2">•</span>
              <span>{fmtHora(a.horaIngreso)}</span>
            </div>
            {!a.asistio && a.motivoInasistencia && (
              <div className="mt-2 text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-2 rounded-lg">
                Motivo: {a.motivoInasistencia}
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-1">
              <button onClick={() => abrirEditar(a)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => eliminar(a)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title={editando ? "Editar asistencia" : "Registrar asistencia"}
          icon={<Users className="w-5 h-5 text-blue-500" />}
        >
          {!editando && (
            <>
              {/* Audiencia - Con buscador */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Audiencia <span className="text-red-500">*</span>
                </label>
                {audienciaSeleccionada ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                    <span className="flex-1 text-sm text-gray-800 dark:text-white">{audienciaSeleccionada}</span>
                    <button
                      onClick={() => {
                        setForm(f => ({ ...f, idAudiencia: 0 }));
                        setAudienciaSeleccionada("");
                      }}
                      className="p-1 rounded-lg text-gray-500 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setBuscadorAudAbierto(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Buscar y seleccionar audiencia
                  </button>
                )}
              </div>

              {/* Persona - Con buscador */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Persona <span className="text-red-500">*</span>
                </label>
                {personaSeleccionada ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                    <span className="flex-1 text-sm text-gray-800 dark:text-white">{personaSeleccionada}</span>
                    <button
                      onClick={() => {
                        setForm(f => ({ ...f, idPersona: 0 }));
                        setPersonaSeleccionada("");
                      }}
                      className="p-1 rounded-lg text-gray-500 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setBuscadorPersAbierto(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Buscar y seleccionar persona
                  </button>
                )}
              </div>

              <Field label="Rol en audiencia" value={form.rolEnAudiencia} onChange={f("rolEnAudiencia")}
                placeholder="Ej: Demandante, Abogado defensor..." required />
            </>
          )}

          {/* En edición, mostrar la información como texto */}
          {editando && (
            <>
              <div className="mb-4 p-2.5 rounded-xl bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 text-sm">
                Audiencia: {audienciaSeleccionada}
              </div>
              <div className="mb-4 p-2.5 rounded-xl bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 text-sm">
                Persona: {personaSeleccionada}
              </div>
              <Field label="Rol en audiencia" value={form.rolEnAudiencia} onChange={f("rolEnAudiencia")} required />
            </>
          )}

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

          {form.asistio && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Hora de ingreso <span className="text-gray-400">(opcional)</span>
              </label>
              <input
                type="time"
                value={form.horaIngreso}
                onChange={e => setForm(p => ({ ...p, horaIngreso: e.target.value }))}
                step="60"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">Formato HH:MM - Dejar vacío para usar la hora actual</p>
            </div>
          )}

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

      {/* Modales de buscadores */}
      {buscadorAudAbierto && (
        <BuscadorAudiencia
          onSelect={seleccionarAudiencia}
          onClose={() => setBuscadorAudAbierto(false)}
        />
      )}
      {buscadorPersAbierto && (
        <BuscadorPersona
          onSelect={seleccionarPersona}
          onClose={() => setBuscadorPersAbierto(false)}
        />
      )}
    </div>
  );
}