import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_CONFORMACIONES,
  GET_VOCALES,
  GET_EXPEDIENTES_SIMPLE,
  CREAR_CONFORMACION,
  ELIMINAR_CONFORMACION,
} from "../../graphql/tribunal";
import { Link2, Plus, Search, X } from "lucide-react";
import {
  Conformacion, VocalTribunal, ExpedienteSimple,
  nombreCompleto, fmtFecha,
  CargoBadge, RolBadge,
  Modal, Field, SelectField, ErrorBox, ModalFooter,
  StatCard, TablaDesktop, ActionBtns, SearchBar,
} from "./shared";
import { useCrudNotifications } from '../../hooks/useCrudNotifications';
import { useToast } from '../../context/ToastContext';

const initForm = { idExpediente: "0", idVocal: "0", rolEnCaso: "" };

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

  const expedientes: ExpedienteSimple[] = data?.allExpedientes ?? [];

  const filtrados = expedientes.filter(e =>
    `${e.numeroExpediente} ${e.ano} ${e.idEstadoExpediente?.nombreEstado ?? ""}`.toLowerCase().includes(busqueda.toLowerCase())
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
              placeholder="Buscar expediente por número, año o estado..."
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
              {filtrados.map((e, index) => (
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
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Año: {e.ano} | Estado: {e.idEstadoExpediente?.nombreEstado ?? "Sin estado"}
                      </p>
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
// COMPONENTE: Buscador de Vocales (Modal)
// ============================================================
function BuscadorVocal({
  onSelect,
  onClose,
}: {
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, loading } = useQuery(GET_VOCALES);

  const vocales: VocalTribunal[] = data?.allVocales ?? [];

  const filtrados = vocales.filter(v =>
    v.activo && `${nombreCompleto(v.idPersona)} ${v.cargo} ${v.idPersona.numeroDocumento}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-500" />
            Seleccionar Vocal
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
              placeholder="Buscar vocal por nombre, cargo o documento..."
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
              <p>No se encontraron vocales activos</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filtrados.map((v, index) => (
                <button
                  key={v.idVocal}
                  onClick={() => {
                    onSelect(v.idVocal, `${nombreCompleto(v.idPersona)} - ${v.cargo}`);
                    onClose();
                  }}
                  className={`w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 ${
                    index === filtrados.length - 1 ? 'mb-0' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{nombreCompleto(v.idPersona)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{v.cargo} • {v.idPersona.numeroDocumento}</p>
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
// COMPONENTE PRINCIPAL
// ============================================================
export default function ConformacionesPage() {
  const { data: dConf, loading, refetch } = useQuery(GET_CONFORMACIONES);
  const { data: dVoc  }                   = useQuery(GET_VOCALES);
  const { data: dExp  }                   = useQuery(GET_EXPEDIENTES_SIMPLE);
  const [crearConf]    = useMutation(CREAR_CONFORMACION);
  const [eliminarConf] = useMutation(ELIMINAR_CONFORMACION);

  // ✅ HOOK DE NOTIFICACIONES
  const { executeCreate, executeDelete } = useCrudNotifications('Conformación');
  const toast = useToast();

  const [modal, setModal]                 = useState(false);
  const [buscadorExpAbierto, setBuscadorExpAbierto] = useState(false);
  const [buscadorVocalAbierto, setBuscadorVocalAbierto] = useState(false);
  const [form, setForm]                   = useState(initForm);
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState("");
  const [vocalSeleccionado, setVocalSeleccionado] = useState("");
  const [busqueda, setBusq]               = useState("");
  const [err, setErr]                     = useState("");

  const conformaciones: Conformacion[]    = dConf?.allConformaciones ?? [];
  const vocales:        VocalTribunal[]   = dVoc?.allVocales         ?? [];
  const expedientes:    ExpedienteSimple[] = dExp?.allExpedientes     ?? [];

  const filtrados = conformaciones.filter(c =>
    `${c.idExpediente.numeroExpediente} ${c.idVocal.idPersona.nombre} ${c.idVocal.idPersona.primerApellido} ${c.rolEnCaso} ${c.idVocal.cargo}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  const rolesUnicos      = [...new Set(conformaciones.map(c => c.rolEnCaso))].length;
  const expedientesUnicos = [...new Set(conformaciones.map(c => c.idExpediente.numeroExpediente))].length;

  const p = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const abrirCrear = () => {
    setForm(initForm);
    setExpedienteSeleccionado("");
    setVocalSeleccionado("");
    setErr("");
    setModal(true);
  };

  const seleccionarExpediente = (id: number, nombre: string) => {
    setForm(f => ({ ...f, idExpediente: String(id) }));
    setExpedienteSeleccionado(nombre);
  };

  const seleccionarVocal = (id: number, nombre: string) => {
    setForm(f => ({ ...f, idVocal: String(id) }));
    setVocalSeleccionado(nombre);
  };

  // ✅ GUARDAR CON NOTIFICACIONES
  const guardar = async () => {
    if (form.idExpediente === "0" || form.idVocal === "0" || !form.rolEnCaso) {
      toast.error("Todos los campos son obligatorios.");
      return;
    }
    
    await executeCreate(async () => {
      await crearConf({
        variables: {
          idExpediente: Number(form.idExpediente),
          idVocal:      Number(form.idVocal),
          rolEnCaso:    form.rolEnCaso,
        },
      });
      await refetch();
      setModal(false);
      return true;
    });
  };

  // ✅ ELIMINAR CON NOTIFICACIONES
  const eliminar = async (c: Conformacion) => {
    await executeDelete(
      async () => {
        const { data } = await eliminarConf({ variables: { id: Number(c.idConformacion) } });
        if (!data?.eliminarConformacion?.ok) {
          throw new Error(data?.eliminarConformacion?.mensaje ?? "No se pudo eliminar.");
        }
        await refetch();
        return true;
      },
      {
        loading: `Eliminando conformación del expediente ${c.idExpediente.numeroExpediente}...`,
        success: `Conformación eliminada exitosamente`,
        error: `Error al eliminar conformación`,
      },
      `¿Remover la conformación del vocal en el expediente ${c.idExpediente.numeroExpediente}?`
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Link2 className="w-7 h-7 text-amber-500" />
            Conformaciones
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Asignación de vocales a expedientes • {conformaciones.length} registros
          </p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-sm shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> Nueva conformación
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total conformaciones" value={conformaciones.length} color="text-amber-600 dark:text-amber-400"
          icon={<Link2 className="w-6 h-6 text-amber-600 dark:text-amber-400" />} sub="Asignaciones registradas" />
        <StatCard label="Expedientes con vocal" value={expedientesUnicos} color="text-blue-600 dark:text-blue-400"
          icon={<Link2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />} sub="Expedientes asignados" />
        <StatCard label="Roles distintos" value={rolesUnicos} color="text-purple-600 dark:text-purple-400"
          icon={<Link2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />} sub="Tipos de rol en caso" />
      </div>

      {/* Buscador de tabla */}
      <div className="flex justify-between items-center">
        <SearchBar value={busqueda} onChange={setBusq} placeholder="Buscar por expediente, vocal o rol..." />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla */}
      <TablaDesktop
        headers={["Expediente", "Vocal", "Cargo del vocal", "Rol en caso", "Fecha asignación", "Acciones"]}
        loading={loading}
        emptyMsg="No hay conformaciones registradas"
      >
        {filtrados.map(c => (
          <tr key={c.idConformacion} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td className="px-6 py-4 font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
              {c.idExpediente.numeroExpediente}
            </td>
            <td className="px-6 py-4 font-semibold text-sm text-gray-800 dark:text-white">
              {c.idVocal.idPersona.nombre} {c.idVocal.idPersona.primerApellido}
            </td>
            <td className="px-6 py-4">
              <CargoBadge cargo={c.idVocal.cargo} />
            </td>
            <td className="px-6 py-4">
              <RolBadge rol={c.rolEnCaso} />
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
              {fmtFecha(c.fechaAsignacion)}
            </td>
            <td className="px-6 py-4">
              <ActionBtns onDelete={() => eliminar(c)} />
            </td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Modal CREAR con buscadores */}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title="Nueva conformación"
          icon={<Link2 className="w-5 h-5 text-amber-500" />}
        >
          {/* Selección de Expediente - Con buscador */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              Expediente <span className="text-red-500">*</span>
            </label>
            {expedienteSeleccionado ? (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                <span className="flex-1 text-sm text-gray-800 dark:text-white">{expedienteSeleccionado}</span>
                <button
                  onClick={() => {
                    setForm(f => ({ ...f, idExpediente: "0" }));
                    setExpedienteSeleccionado("");
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

          {/* Selección de Vocal - Con buscador */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              Vocal <span className="text-red-500">*</span>
            </label>
            {vocalSeleccionado ? (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                <span className="flex-1 text-sm text-gray-800 dark:text-white">{vocalSeleccionado}</span>
                <button
                  onClick={() => {
                    setForm(f => ({ ...f, idVocal: "0" }));
                    setVocalSeleccionado("");
                  }}
                  className="p-1 rounded-lg text-gray-500 hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setBuscadorVocalAbierto(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-amber-400 dark:hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-all"
              >
                <Plus className="w-4 h-4" />
                Buscar y seleccionar vocal
              </button>
            )}
          </div>

          <Field
            label="Rol en el caso"
            value={form.rolEnCaso}
            onChange={p("rolEnCaso")}
            required
            placeholder="Ej: Presidente, Vocal Relator, Vocal..."
          />

          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)}
            onSave={guardar}
            saveLabel="Asignar conformación"
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
      {buscadorVocalAbierto && (
        <BuscadorVocal
          onSelect={seleccionarVocal}
          onClose={() => setBuscadorVocalAbierto(false)}
        />
      )}
    </div>
  );
}