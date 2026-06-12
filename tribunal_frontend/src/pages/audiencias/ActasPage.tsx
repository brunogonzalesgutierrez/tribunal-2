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
import { FileText, Plus, Edit, Trash2, CheckCircle, AlertCircle, Mic, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Acta,
  fmt, Modal, Field, TextareaField,
  ErrorBox, ModalFooter, StatCard, TablaDesktop, ActionBtns,
} from "../../shared/ui";
import { useCrudNotifications } from '../../hooks/useCrudNotifications';
import { useToast } from '../../context/ToastContext';

// ============================================================
// COMPONENTE: Buscador de Audiencias (Modal)
// SOLO muestra audiencias que NO tienen acta asociada
// ============================================================
function BuscadorAudiencia({
  onSelect,
  onClose,
  actas,
}: {
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
  actas: Acta[];
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, loading } = useQuery(GET_AUDIENCIAS);

  const audiencias = data?.allAudiencias ?? [];

  const idsConActa = new Set(actas.map(a => a.idAudiencia.idAudiencia));
  const audienciasDisponibles = audiencias.filter((a: any) => !idsConActa.has(a.idAudiencia));

  const filtrados = audienciasDisponibles.filter((a: any) =>
    `${a.idExpediente?.numeroExpediente || ''} ${a.idTipoAudiencia?.nombre || ''}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-500" />
            Seleccionar Audiencia (Sin acta registrada)
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
          <p className="text-xs text-gray-400 mt-2">⚠️ Solo se muestran audiencias que aún no tienen acta</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>No hay audiencias disponibles para acta</p>
              <p className="text-xs mt-2">Todas las audiencias ya tienen un acta registrada</p>
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
// COMPONENTE: Buscador de Usuarios (Modal)
// ============================================================
function BuscadorUsuario({
  onSelect,
  onClose,
}: {
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, loading } = useQuery(GET_USUARIOS_SIMPLE);

  const usuarios = data?.allUsuarios ?? [];

  const filtrados = usuarios.filter((u: any) =>
    `${u.nombres} ${u.paterno} ${u.materno || ''}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-500" />
            Seleccionar Usuario
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
              placeholder="Buscar por nombre o apellido..."
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
              <p>No se encontraron usuarios</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filtrados.map((u: any, index: number) => (
                <button
                  key={u.idUsuario}
                  onClick={() => {
                    onSelect(u.idUsuario, `${u.nombres} ${u.paterno}`);
                    onClose();
                  }}
                  className={`w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 ${
                    index === filtrados.length - 1 ? 'mb-0' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{u.nombres} {u.paterno}</p>
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
export default function ActasPage() {
  const [modal, setModal] = useState(false);
  const [buscadorAudAbierto, setBuscadorAudAbierto] = useState(false);
  const [buscadorUsuAbierto, setBuscadorUsuAbierto] = useState(false);
  const [editando, setEdit] = useState<Acta | null>(null);
  const [audienciaSeleccionada, setAudienciaSeleccionada] = useState("");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState("");
  const [err, setErr] = useState("");
  
  // ✅ Estado para búsqueda en la página principal
  const [busquedaPrincipal, setBusquedaPrincipal] = useState("");
  
  // ✅ Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ Estado para bloqueo de botones
  const [saving, setSaving] = useState(false);

  const { data, loading, refetch } = useQuery(GET_ACTAS);
  const { data: dAud } = useQuery(GET_AUDIENCIAS);
  const { data: dUsu } = useQuery(GET_USUARIOS_SIMPLE);
  const [crearActa]    = useMutation(CREAR_ACTA);
  const [actualizarAc] = useMutation(ACTUALIZAR_ACTA);
  const [eliminarAc]   = useMutation(ELIMINAR_ACTA);

  const { executeCreate, executeUpdate, executeDelete } = useCrudNotifications('Acta');
  const toast = useToast();

  const initForm = { idAudiencia: 0, idUsuario: 0, contenido: "", firmada: false, urlGrabacion: "" };
  const [form, setForm] = useState(initForm);
  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const actas: Acta[] = data?.allActas ?? [];
  const audiencias    = dAud?.allAudiencias ?? [];
  const usuarios      = dUsu?.allUsuarios ?? [];

  // ✅ Filtrar actas por búsqueda
  const actasFiltradas = actas.filter(a =>
    `${a.idAudiencia.idExpediente.numeroExpediente} ${a.usuario.nombres} ${a.usuario.paterno}`
      .toLowerCase().includes(busquedaPrincipal.toLowerCase())
  );

  // ✅ Paginación
  const totalPages = Math.ceil(actasFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedActas = actasFiltradas.slice(startIndex, startIndex + itemsPerPage);

  const firmadas   = actas.filter(a => a.firmada).length;
  const pendientes = actas.filter(a => !a.firmada).length;

  const seleccionarAudiencia = (id: number, nombre: string) => {
    setForm(f => ({ ...f, idAudiencia: id }));
    setAudienciaSeleccionada(nombre);
  };

  const seleccionarUsuario = (id: number, nombre: string) => {
    setForm(f => ({ ...f, idUsuario: id }));
    setUsuarioSeleccionado(nombre);
  };

  const abrirCrear = () => { 
    setEdit(null); 
    setForm(initForm); 
    setAudienciaSeleccionada("");
    setUsuarioSeleccionado("");
    setErr(""); 
    setModal(true); 
  };

  const abrirEditar = (a: Acta) => {
    setEdit(a);
    setForm({
      idAudiencia: a.idAudiencia.idAudiencia,
      idUsuario: a.usuario.idUsuario,
      contenido: a.contenido,
      firmada: a.firmada,
      urlGrabacion: a.urlGrabacion ?? "",
    });
    setAudienciaSeleccionada(`#${a.idAudiencia.idExpediente.numeroExpediente} - ${fmt(a.idAudiencia.fechaHoraProgramada)}`);
    setUsuarioSeleccionado(`${a.usuario.nombres} ${a.usuario.paterno}`);
    setErr(""); 
    setModal(true);
  };

  // ✅ GUARDAR CON BLOQUEO
  const guardar = async () => {
    if (!form.contenido) { 
      toast.error("El contenido del acta es obligatorio."); 
      return; 
    }
    
    if (saving) return;
    setSaving(true);

    try {
      if (editando) {
        await executeUpdate(async () => {
          await actualizarAc({
            variables: {
              id: Number(editando.idActa),
              input: {
                contenido: form.contenido,
                firmada: form.firmada,
                urlGrabacion: form.urlGrabacion || undefined,
              },
            },
          });
          await refetch();
          setModal(false);
          return true;
        });
      } else {
        if (!form.idAudiencia || !form.idUsuario) {
          toast.error("Audiencia y usuario son obligatorios.");
          return;
        }
        
        const yaTieneActa = actas.some(a => a.idAudiencia.idAudiencia === form.idAudiencia);
        if (yaTieneActa) {
          toast.error("Esta audiencia ya tiene un acta registrada. Use la opción de edición.");
          return;
        }

        await executeCreate(async () => {
          await crearActa({
            variables: {
              idAudiencia: Number(form.idAudiencia),
              idUsuario: Number(form.idUsuario),
              contenido: form.contenido,
              firmada: form.firmada,
              urlGrabacion: form.urlGrabacion || undefined,
            },
          });
          await refetch();
          setModal(false);
          setAudienciaSeleccionada("");
          setUsuarioSeleccionado("");
          return true;
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // ✅ ELIMINAR CON BLOQUEO
  const eliminar = async (a: Acta) => {
    await executeDelete(
      async () => {
        const { data } = await eliminarAc({ variables: { id: Number(a.idActa) } });
        if (!data?.eliminarActa?.ok) {
          throw new Error(data?.eliminarActa?.mensaje ?? "No se pudo eliminar.");
        }
        await refetch();
        return true;
      },
      {
        loading: `Eliminando acta del expediente #${a.idAudiencia.idExpediente.numeroExpediente}...`,
        success: `Acta eliminada exitosamente`,
        error: `Error al eliminar el acta`,
      },
      `¿Eliminar el acta del expediente #${a.idAudiencia.idExpediente.numeroExpediente}?`
    );
  };

  // Resetear página cuando cambia la búsqueda
  const handleBusquedaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusquedaPrincipal(e.target.value);
    setCurrentPage(1);
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
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <Plus className="w-4 h-4" /> Nueva acta
        </button>
      </div>

      {/* Stats - Clases fijas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total actas</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{actas.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Registradas en el sistema</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Firmadas</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{firmadas}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">{Math.round((firmadas / (actas.length || 1)) * 100)}% del total</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg dark:shadow-slate-900/30 hover:shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pendientes</p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">{pendientes}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Esperando firma</p>
          </div>
        </div>
      </div>

      {/* BUSCADOR EN LA PÁGINA PRINCIPAL */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          placeholder="Buscar por expediente o usuario..."
          value={busquedaPrincipal}
          onChange={handleBusquedaChange}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
        />
      </div>

      {/* Tabla Desktop con datos paginados */}
      <TablaDesktop
        headers={["Expediente", "Fecha acta", "Registrado por", "Firmada", "Grabación", "Acciones"]}
        loading={loading}
        emptyMsg="No hay actas registradas"
        emptyIcon={<FileText className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
      >
        {paginatedActas.map(a => (
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

      {/* Cards Móvil con datos paginados */}
      <div className="lg:hidden space-y-3">
        {paginatedActas.map(a => (
          <div key={a.idActa} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-blue-500 font-bold">#{a.idAudiencia.idExpediente.numeroExpediente}</span>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{a.usuario.nombres} {a.usuario.paterno}</p>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => abrirEditar(a)} 
                  disabled={saving}
                  className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => eliminar(a)} 
                  disabled={saving}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
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

      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, actasFiltradas.length)} de {actasFiltradas.length}
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
          title={editando ? "Editar acta" : "Nueva acta de audiencia"}
          icon={<FileText className="w-5 h-5 text-blue-500" />}
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
                      disabled={saving}
                      className="p-1 rounded-lg text-gray-500 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setBuscadorAudAbierto(true)}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Buscar y seleccionar audiencia (sin acta)
                  </button>
                )}
              </div>

              {/* Usuario - Con buscador */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Usuario responsable <span className="text-red-500">*</span>
                </label>
                {usuarioSeleccionado ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                    <span className="flex-1 text-sm text-gray-800 dark:text-white">{usuarioSeleccionado}</span>
                    <button
                      onClick={() => {
                        setForm(f => ({ ...f, idUsuario: 0 }));
                        setUsuarioSeleccionado("");
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
                    onClick={() => setBuscadorUsuAbierto(true)}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Buscar y seleccionar usuario
                  </button>
                )}
              </div>
            </>
          )}

          {/* En edición, mostrar la información como texto */}
          {editando && (
            <>
              <div className="mb-4 p-2.5 rounded-xl bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 text-sm">
                Audiencia: {audienciaSeleccionada}
              </div>
              <div className="mb-4 p-2.5 rounded-xl bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 text-sm">
                Usuario: {usuarioSeleccionado}
              </div>
            </>
          )}

          <TextareaField 
            label="Contenido del acta" 
            value={form.contenido} 
            onChange={f("contenido")} 
            rows={6} 
            required 
            disabled={saving}
          />
          <Field 
            label="URL de grabación" 
            value={form.urlGrabacion} 
            onChange={f("urlGrabacion")} 
            placeholder="https://..." 
            disabled={saving}
          />
          
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
              <input 
                type="checkbox" 
                checked={form.firmada}
                onChange={e => setForm(p => ({ ...p, firmada: e.target.checked }))} 
                disabled={saving}
                className="rounded disabled:opacity-50 disabled:cursor-not-allowed" 
              />
              Acta firmada
            </label>
          </div>

          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)} 
            onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Crear acta"}
            saving={saving}
          />
        </Modal>
      )}

      {/* Modales de buscadores */}
      {buscadorAudAbierto && (
        <BuscadorAudiencia
          onSelect={seleccionarAudiencia}
          onClose={() => setBuscadorAudAbierto(false)}
          actas={actas}
        />
      )}
      {buscadorUsuAbierto && (
        <BuscadorUsuario
          onSelect={seleccionarUsuario}
          onClose={() => setBuscadorUsuAbierto(false)}
        />
      )}
    </div>
  );
}