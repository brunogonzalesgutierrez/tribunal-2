// ─── src/pages/resoluciones/ResolucionesListPage.tsx ─────────────────────────
import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_RESOLUCIONES, GET_TIPOS_RESOLUCION, GET_EXPEDIENTES_SIMPLE,
  CREAR_RESOLUCION, ACTUALIZAR_RESOLUCION, ELIMINAR_RESOLUCION,
} from "../../graphql/resoluciones";
import {
  ScrollText, Plus, Edit, Trash2,
  CheckCircle, Clock, XCircle, Shield, AlertTriangle, Search, X, ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  Resolucion, Expediente, TipoResolucion,
  fmt, nivelLabel,
  Modal, Field, TextareaField,
  ErrorBox, ModalFooter, StatCard, TablaDesktop, ActionBtns,
  EstadoResolucionBadge,
} from "./shared";
import { useCrudNotifications } from "../../hooks/useCrudNotifications";
import { useToast } from "../../context/ToastContext";

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
// COMPONENTE: Buscador de Tipos de Resolución (Modal)
// ============================================================
function BuscadorTipoResolucion({
  onSelect,
  onClose,
  disabled,
}: {
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
  disabled?: boolean;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, loading } = useQuery(GET_TIPOS_RESOLUCION);

  const tipos: TipoResolucion[] = data?.allTiposResolucion ?? [];

  const filtrados = tipos.filter(t =>
    `${t.codigo} ${t.nombre}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-500" />
            Seleccionar Tipo de Resolución
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
              placeholder="Buscar tipo de resolución..."
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
              <p>No se encontraron tipos de resolución</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filtrados.map((t: TipoResolucion, index: number) => (
                <button
                  key={t.idTipoRes}
                  onClick={() => {
                    onSelect(t.idTipoRes, `${t.codigo} - ${t.nombre} (${nivelLabel(t.nivelJerarquico)})`);
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
                      <p className="text-xs text-gray-400 mt-0.5">{nivelLabel(t.nivelJerarquico)}</p>
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
export default function ResolucionesListPage() {
  const { data, loading, refetch } = useQuery(GET_RESOLUCIONES);
  const { data: dExp }  = useQuery(GET_EXPEDIENTES_SIMPLE);
  const { data: dTipo } = useQuery(GET_TIPOS_RESOLUCION);

  const [crear]      = useMutation(CREAR_RESOLUCION);
  const [actualizar] = useMutation(ACTUALIZAR_RESOLUCION);
  const [eliminar_m] = useMutation(ELIMINAR_RESOLUCION);

  const { executeCreate, executeUpdate, executeDelete, toast } = useCrudNotifications("Resolución");

  // ✅ Estado para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ Estado para bloqueo de botones
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<Resolucion | null>(null);
  const [err, setErr]       = useState("");
  const [busqueda, setBusq] = useState("");

  // Estados para buscadores modales
  const [buscadorExpAbierto, setBuscadorExpAbierto] = useState(false);
  const [buscadorTipoAbierto, setBuscadorTipoAbierto] = useState(false);
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState("");
  const [tipoSeleccionado, setTipoSeleccionado] = useState("");

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

  // ✅ Filtrar resoluciones por búsqueda
  const resolucionesFiltradas = resoluciones.filter(r =>
    `${r.numeroResolucion} ${r.idExpediente.numeroExpediente} ${r.idTipoRes.nombre} ${r.estado}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  // ✅ Paginación
  const totalPages = Math.ceil(resolucionesFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResoluciones = resolucionesFiltradas.slice(startIndex, startIndex + itemsPerPage);

  // stats
  const activas  = resoluciones.filter(r => r.estado === "ACTIVA").length;
  const firmes   = resoluciones.filter(r => r.estado === "FIRME").length;
  const apeladas = resoluciones.filter(r => r.estado === "APELADA").length;
  const recurribles = resoluciones.filter(r => r.esRecurrible).length;

  const seleccionarExpediente = (id: number, nombre: string) => {
    setForm(p => ({ ...p, idExpediente: id }));
    setExpedienteSeleccionado(nombre);
  };

  const seleccionarTipo = (id: number, nombre: string) => {
    setForm(p => ({ ...p, idTipoRes: id }));
    setTipoSeleccionado(nombre);
  };

  const abrirCrear = () => { 
    setEdit(null); 
    setForm(initForm); 
    setExpedienteSeleccionado("");
    setTipoSeleccionado("");
    setErr(""); 
    setModal(true); 
  };

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
    setExpedienteSeleccionado(`#${r.idExpediente.numeroExpediente} (${r.idExpediente.ano})`);
    setTipoSeleccionado(`${r.idTipoRes.codigo} - ${r.idTipoRes.nombre}`);
    setErr(""); 
    setModal(true);
  };

  // Resetear página cuando cambia la búsqueda
  const handleBusquedaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusq(e.target.value);
    setCurrentPage(1);
  };

  // ✅ GUARDAR CON BLOQUEO
  const guardar = async () => {
    if (!form.numeroResolucion || !form.fechaResolucion || !form.parteDispositiva) {
      toast.error("Número, fecha y parte dispositiva son obligatorios.");
      return;
    }
    
    if (saving) return;
    setSaving(true);
    
    try {
      if (editando) {
        await executeUpdate(async () => {
          await actualizar({ 
            variables: { 
              id: Number(editando.idResolucion), 
              input: {
                idTipoRes: Number(form.idTipoRes) || undefined,
                numeroResolucion: form.numeroResolucion,
                fechaResolucion: form.fechaResolucion,
                parteDispositiva: form.parteDispositiva,
                fundamentacion: form.fundamentacion || undefined,
                estado: form.estado,
                esRecurrible: form.esRecurrible,
                plazoRecursoDias: Number(form.plazoRecursoDias),
              }
            } 
          });
          await refetch(); 
          setModal(false);
          return true;
        });
      } else {
        if (!form.idExpediente || !form.idTipoRes) {
          toast.error("Expediente y tipo de resolución son obligatorios.");
          return;
        }
        await executeCreate(async () => {
          await crear({ 
            variables: { 
              input: {
                idExpediente: Number(form.idExpediente),
                idTipoRes: Number(form.idTipoRes),
                numeroResolucion: form.numeroResolucion,
                fechaResolucion: form.fechaResolucion,
                parteDispositiva: form.parteDispositiva,
                fundamentacion: form.fundamentacion || undefined,
              }
            } 
          });
          await refetch(); 
          setModal(false);
          setExpedienteSeleccionado("");
          setTipoSeleccionado("");
          return true;
        });
      }
    } catch (e: any) { 
      setErr(e.message ?? "Error al guardar."); 
    } finally {
      setSaving(false);
    }
  };

  // ✅ ELIMINAR CON BLOQUEO
  const eliminar = async (r: Resolucion) => {
    if (deletingId === r.idResolucion) return;
    setDeletingId(r.idResolucion);
    
    try {
      await executeDelete(
        async () => {
          const { data } = await eliminar_m({ variables: { id: Number(r.idResolucion) } });
          if (!data?.eliminarResolucion?.ok) {
            throw new Error(data?.eliminarResolucion?.mensaje ?? "No se pudo eliminar.");
          }
          await refetch();
          return true;
        },
        {
          loading: `Eliminando resolución ${r.numeroResolucion}...`,
          success: `Resolución ${r.numeroResolucion} eliminada exitosamente`,
          error: `Error al eliminar la resolución`,
        },
        `¿Eliminar la resolución ${r.numeroResolucion}?`
      );
    } finally {
      setDeletingId(null);
    }
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
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <Plus className="w-4 h-4" /> Nueva resolución
        </button>
      </div>

      {/* Stats - Clases fijas */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{resoluciones.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ScrollText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Registradas en el sistema</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Activas</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{activas}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">{Math.round((activas / (resoluciones.length || 1)) * 100)}% del total</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Firmes</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{firmes}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Sin recurso posible</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Recurribles</p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">{recurribles}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">{apeladas} apeladas</p>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-3">
        <input
          placeholder="Buscar por número, expediente, tipo o estado..."
          value={busqueda}
          onChange={handleBusquedaChange}
          className="flex-1 max-w-sm px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {resolucionesFiltradas.length} resultado{resolucionesFiltradas.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla Desktop con datos paginados */}
      <TablaDesktop
        headers={["N° Resolución", "Expediente", "Tipo / Nivel", "Fecha", "Estado", "Recurrible", "Parte dispositiva", "Acciones"]}
        loading={loading}
        emptyMsg="No hay resoluciones registradas"
        emptyIcon={<ScrollText className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
      >
        {paginatedResoluciones.map(r => (
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
              <ActionBtns onEdit={() => abrirEditar(r)} onDelete={() => eliminar(r)} disabled={saving} />
            </td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, resolucionesFiltradas.length)} de {resolucionesFiltradas.length}
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

      {/* Cards Móvil con datos paginados */}
      <div className="lg:hidden space-y-3">
        {paginatedResoluciones.map(r => (
          <div key={r.idResolucion} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="font-mono font-bold text-gray-800 dark:text-white">{r.numeroResolucion}</span>
                <p className="text-sm text-blue-500 mt-0.5">Exp. #{r.idExpediente.numeroExpediente}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{r.idTipoRes.nombre}</p>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => abrirEditar(r)} 
                  disabled={saving}
                  className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => eliminar(r)} 
                  disabled={deletingId === r.idResolucion}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
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
            <>
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
                        setForm(p => ({ ...p, idExpediente: 0 }));
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

              {/* Tipo de resolución - Con buscador */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Tipo de resolución <span className="text-red-500">*</span>
                </label>
                {tipoSeleccionado ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                    <span className="flex-1 text-sm text-gray-800 dark:text-white">{tipoSeleccionado}</span>
                    <button
                      onClick={() => {
                        setForm(p => ({ ...p, idTipoRes: 0 }));
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
                    Buscar y seleccionar tipo de resolución
                  </button>
                )}
              </div>
            </>
          )}

          {/* En edición, mostrar la información como texto */}
          {editando && (
            <>
              <div className="mb-4 p-2.5 rounded-xl bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 text-sm">
                Expediente: {expedienteSeleccionado}
              </div>
              <div className="mb-4 p-2.5 rounded-xl bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 text-sm">
                Tipo: {tipoSeleccionado}
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-x-4">
            <Field 
              label="N° de resolución" 
              value={form.numeroResolucion} 
              onChange={f("numeroResolucion")} 
              placeholder="RES-2024-001" 
              required 
              disabled={saving}
            />
            <Field 
              label="Fecha de resolución" 
              value={form.fechaResolucion} 
              onChange={f("fechaResolucion")} 
              type="date" 
              required 
              disabled={saving}
            />
          </div>

          <TextareaField 
            label="Parte dispositiva" 
            value={form.parteDispositiva} 
            onChange={f("parteDispositiva")} 
            rows={3} 
            required 
            disabled={saving}
          />
          <TextareaField 
            label="Fundamentación" 
            value={form.fundamentacion} 
            onChange={f("fundamentacion")} 
            rows={4} 
            disabled={saving}
          />

          {editando && (
            <div className="grid grid-cols-2 gap-x-4">
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Estado
                </label>
                <select
                  value={form.estado}
                  onChange={e => setForm(p => ({ ...p, estado: e.target.value }))}
                  disabled={saving}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="ACTIVA">Activa</option>
                  <option value="APELADA">Apelada</option>
                  <option value="ANULADA">Anulada</option>
                  <option value="FIRME">Firme</option>
                </select>
              </div>
              <div className="mb-4">
                <Field 
                  label="Plazo de recurso (días)" 
                  value={form.plazoRecursoDias} 
                  onChange={f("plazoRecursoDias")} 
                  type="number" 
                  disabled={saving}
                />
              </div>
            </div>
          )}

          {editando && (
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={form.esRecurrible as unknown as boolean}
                  onChange={e => setForm(p => ({ ...p, esRecurrible: e.target.checked }))}
                  disabled={saving}
                  className="rounded disabled:opacity-50 disabled:cursor-not-allowed" 
                />
                Es recurrible
              </label>
            </div>
          )}

          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)} 
            onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Crear resolución"}
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
        <BuscadorTipoResolucion
          onSelect={seleccionarTipo}
          onClose={() => setBuscadorTipoAbierto(false)}
          disabled={saving}
        />
      )}
    </div>
  );
}