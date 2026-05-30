// ─── src/pages/resoluciones/RecursosPage.tsx ─────────────────────────────────
import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_RECURSOS, GET_RESOLUCIONES, GET_TIPOS_RECURSO, GET_PARTES_PROCESALES_SIMPLE,
  CREAR_RECURSO, ACTUALIZAR_RECURSO, ELIMINAR_RECURSO,
} from "../../graphql/resoluciones";
import { Gavel, Plus, Edit, Trash2, Clock, CheckCircle, XCircle, Scale, Search, X } from "lucide-react";
import {
  Recurso, Resolucion, TipoRecurso, ParteProcesal,
  fmt,
  Modal, TextareaField,
  ErrorBox, ModalFooter, StatCard, TablaDesktop, ActionBtns,
  EstadoRecursoBadge,
} from "./shared";
import { useCrudNotifications } from "../../hooks/useCrudNotifications";
import { useToast } from "../../context/ToastContext";

// ============================================================
// COMPONENTE: Buscador de Resoluciones (Modal)
// ============================================================
function BuscadorResolucion({
  onSelect,
  onClose,
}: {
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, loading } = useQuery(GET_RESOLUCIONES);

  const resoluciones: Resolucion[] = data?.allResoluciones ?? [];

  const filtrados = resoluciones.filter(r =>
    r.esRecurrible &&
    `${r.numeroResolucion} ${r.idExpediente?.numeroExpediente || ''}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-500" />
            Seleccionar Resolución
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
              placeholder="Buscar por número de resolución o expediente..."
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
              <p>No se encontraron resoluciones recurribles</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filtrados.map((r: Resolucion, index: number) => (
                <button
                  key={r.idResolucion}
                  onClick={() => {
                    onSelect(r.idResolucion, `${r.numeroResolucion} — Exp. #${r.idExpediente.numeroExpediente}`);
                    onClose();
                  }}
                  className={`w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 ${
                    index === filtrados.length - 1 ? 'mb-0' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{r.numeroResolucion}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Exp. #{r.idExpediente.numeroExpediente}</p>
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
// COMPONENTE: Buscador de Tipos de Recurso (Modal)
// ============================================================
function BuscadorTipoRecurso({
  onSelect,
  onClose,
}: {
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, loading } = useQuery(GET_TIPOS_RECURSO);

  const tipos: TipoRecurso[] = data?.allTiposRecurso ?? [];

  const filtrados = tipos.filter(t =>
    t.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-500" />
            Seleccionar Tipo de Recurso
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
              placeholder="Buscar tipo de recurso..."
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
              <p>No se encontraron tipos de recurso</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filtrados.map((t: TipoRecurso, index: number) => (
                <button
                  key={t.idTipoRecurso}
                  onClick={() => {
                    onSelect(t.idTipoRecurso, t.nombre);
                    onClose();
                  }}
                  className={`w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 ${
                    index === filtrados.length - 1 ? 'mb-0' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{t.nombre}</p>
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
// COMPONENTE: Buscador de Partes Procesales (Modal)
// ============================================================
function BuscadorParteProcesal({
  onSelect,
  onClose,
}: {
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, loading } = useQuery(GET_PARTES_PROCESALES_SIMPLE);

  const partes: ParteProcesal[] = data?.allPartesProcesales ?? [];

  const filtrados = partes.filter(p =>
    p.activo &&
    `${p.idPersona?.nombre ?? ''} ${p.idPersona?.primerApellido ?? ''} ${p.idRol?.nombreRol ?? ''}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-500" />
            Seleccionar Parte Recurrente
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
              placeholder="Buscar por nombre o rol..."
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
              <p>No se encontraron partes procesales activas</p>
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

// ════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════
export default function RecursosPage() {
  const { data, loading, refetch } = useQuery(GET_RECURSOS);
  const { data: dRes }    = useQuery(GET_RESOLUCIONES);
  const { data: dTipo }   = useQuery(GET_TIPOS_RECURSO);
  const { data: dPartes } = useQuery(GET_PARTES_PROCESALES_SIMPLE);

  const [crear]      = useMutation(CREAR_RECURSO);
  const [actualizar] = useMutation(ACTUALIZAR_RECURSO);
  const [eliminar_m] = useMutation(ELIMINAR_RECURSO);

  // ✅ HOOK DE NOTIFICACIONES
  const { executeCreate, executeUpdate, executeDelete, toast } = useCrudNotifications("Recurso");

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<Recurso | null>(null);
  const [err, setErr]       = useState("");
  const [busqueda, setBusq] = useState("");

  // Estados para buscadores modales
  const [buscadorResAbierto, setBuscadorResAbierto] = useState(false);
  const [buscadorTipoAbierto, setBuscadorTipoAbierto] = useState(false);
  const [buscadorParteAbierto, setBuscadorParteAbierto] = useState(false);
  const [resolucionSeleccionada, setResolucionSeleccionada] = useState("");
  const [tipoSeleccionado, setTipoSeleccionado] = useState("");
  const [parteSeleccionada, setParteSeleccionada] = useState("");

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

  const seleccionarResolucion = (id: number, nombre: string) => {
    setForm(p => ({ ...p, idResolucionImpugnada: id }));
    setResolucionSeleccionada(nombre);
  };

  const seleccionarTipo = (id: number, nombre: string) => {
    setForm(p => ({ ...p, idTipoRecurso: id }));
    setTipoSeleccionado(nombre);
  };

  const seleccionarParte = (id: number, nombre: string) => {
    setForm(p => ({ ...p, idRecurrente: id }));
    setParteSeleccionada(nombre);
  };

  const abrirCrear = () => { 
    setEdit(null); 
    setForm(initForm); 
    setResolucionSeleccionada("");
    setTipoSeleccionado("");
    setParteSeleccionada("");
    setErr(""); 
    setModal(true); 
  };

  const abrirEditar = (r: Recurso) => {
    setEdit(r);
    setForm({ ...initForm, estadoRecurso: r.estadoRecurso, fundamentos: r.fundamentos });
    setResolucionSeleccionada(`${r.idResolucionImpugnada.numeroResolucion} — Exp. #${r.idResolucionImpugnada.idExpediente.numeroExpediente}`);
    setTipoSeleccionado(r.idTipoRecurso.nombre);
    // ✅ CORREGIDO: Sin idExpediente porque no está disponible en el tipo simple
    setParteSeleccionada(`${r.idRecurrente.idPersona.nombre} ${r.idRecurrente.idPersona.primerApellido} (${r.idRecurrente.idRol.nombreRol})`);
    setErr(""); 
    setModal(true);
  };

  // ✅ GUARDAR CON NOTIFICACIONES
  const guardar = async () => {
    try {
      if (editando) {
        await executeUpdate(async () => {
          await actualizar({ 
            variables: { 
              id: Number(editando.idRecurso), 
              input: {
                estadoRecurso: form.estadoRecurso,
                fundamentos: form.fundamentos || undefined,
              }
            } 
          });
          await refetch(); 
          setModal(false);
          return true;
        });
      } else {
        if (!form.idResolucionImpugnada || !form.idTipoRecurso || !form.idRecurrente) {
          toast.error("Resolución, tipo de recurso y parte recurrente son obligatorios.");
          return;
        }
        await executeCreate(async () => {
          await crear({ 
            variables: {
              idResolucionImpugnada: Number(form.idResolucionImpugnada),
              idTipoRecurso: Number(form.idTipoRecurso),
              idRecurrente: Number(form.idRecurrente),
              fundamentos: form.fundamentos || undefined,
            }
          });
          await refetch(); 
          setModal(false);
          setResolucionSeleccionada("");
          setTipoSeleccionado("");
          setParteSeleccionada("");
          return true;
        });
      }
    } catch (e: any) { 
      setErr(e.message ?? "Error al guardar."); 
    }
  };

  // ✅ ELIMINAR CON NOTIFICACIONES
  const eliminar = async (r: Recurso) => {
    await executeDelete(
      async () => {
        const { data } = await eliminar_m({ variables: { id: Number(r.idRecurso) } });
        if (!data?.eliminarRecurso?.ok) {
          throw new Error(data?.eliminarRecurso?.mensaje ?? "No se pudo eliminar.");
        }
        await refetch();
        return true;
      },
      {
        loading: `Eliminando recurso sobre ${r.idResolucionImpugnada.numeroResolucion}...`,
        success: `Recurso eliminado exitosamente`,
        error: `Error al eliminar el recurso`,
      },
      `¿Eliminar el recurso sobre ${r.idResolucionImpugnada.numeroResolucion}?`
    );
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
              {/* Resolución impugnada - Con buscador */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Resolución impugnada <span className="text-red-500">*</span>
                </label>
                {resolucionSeleccionada ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                    <span className="flex-1 text-sm text-gray-800 dark:text-white">{resolucionSeleccionada}</span>
                    <button
                      onClick={() => {
                        setForm(p => ({ ...p, idResolucionImpugnada: 0 }));
                        setResolucionSeleccionada("");
                      }}
                      className="p-1 rounded-lg text-gray-500 hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setBuscadorResAbierto(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-amber-400 dark:hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Buscar y seleccionar resolución
                  </button>
                )}
              </div>

              {/* Tipo de recurso - Con buscador */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Tipo de recurso <span className="text-red-500">*</span>
                </label>
                {tipoSeleccionado ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                    <span className="flex-1 text-sm text-gray-800 dark:text-white">{tipoSeleccionado}</span>
                    <button
                      onClick={() => {
                        setForm(p => ({ ...p, idTipoRecurso: 0 }));
                        setTipoSeleccionado("");
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
                    Buscar y seleccionar tipo de recurso
                  </button>
                )}
              </div>

              {/* Parte recurrente - Con buscador */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Parte recurrente <span className="text-red-500">*</span>
                </label>
                {parteSeleccionada ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                    <span className="flex-1 text-sm text-gray-800 dark:text-white">{parteSeleccionada}</span>
                    <button
                      onClick={() => {
                        setForm(p => ({ ...p, idRecurrente: 0 }));
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
                    Buscar y seleccionar parte recurrente
                  </button>
                )}
              </div>
            </>
          )}

          {/* En edición, mostrar la información como texto */}
          {editando && (
            <>
              <div className="mb-4 p-2.5 rounded-xl bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 text-sm">
                Resolución: {resolucionSeleccionada}
              </div>
              <div className="mb-4 p-2.5 rounded-xl bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 text-sm">
                Tipo: {tipoSeleccionado}
              </div>
              <div className="mb-4 p-2.5 rounded-xl bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 text-sm">
                Recurrente: {parteSeleccionada}
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Estado del recurso
                </label>
                <select
                  value={form.estadoRecurso}
                  onChange={e => setForm(p => ({ ...p, estadoRecurso: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none"
                >
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="ADMITIDO">Admitido</option>
                  <option value="RECHAZADO">Rechazado</option>
                  <option value="RESUELTO">Resuelto</option>
                </select>
              </div>
            </>
          )}

          <TextareaField label="Fundamentos" value={form.fundamentos} onChange={f("fundamentos")} rows={5} />
          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)} 
            onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Interponer recurso"}
          />
        </Modal>
      )}

      {/* Modales de buscadores */}
      {buscadorResAbierto && (
        <BuscadorResolucion
          onSelect={seleccionarResolucion}
          onClose={() => setBuscadorResAbierto(false)}
        />
      )}
      {buscadorTipoAbierto && (
        <BuscadorTipoRecurso
          onSelect={seleccionarTipo}
          onClose={() => setBuscadorTipoAbierto(false)}
        />
      )}
      {buscadorParteAbierto && (
        <BuscadorParteProcesal
          onSelect={seleccionarParte}
          onClose={() => setBuscadorParteAbierto(false)}
        />
      )}
    </div>
  );
}