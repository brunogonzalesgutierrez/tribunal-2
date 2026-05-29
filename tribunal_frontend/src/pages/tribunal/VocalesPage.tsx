import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_VOCALES,
  GET_PERSONAS,
  GET_SALAS_TRIBUNAL,
  CREAR_VOCAL,
  ACTUALIZAR_VOCAL,
  ELIMINAR_VOCAL,
} from "../../graphql/tribunal";
import { Users, Plus, UserCheck, UserX, Search, X } from "lucide-react";
import {
  VocalTribunal, Persona, SalaTribunal,
  nombreCompleto, fmtFecha,
  CargoBadge, EstadoBadge,
  Modal, Field, SelectField, ErrorBox, ModalFooter,
  StatCard, TablaDesktop, ActionBtns, SearchBar,
} from "./shared";
import { useCrudNotifications } from '../../hooks/useCrudNotifications';
import { useToast } from '../../context/ToastContext';

const initForm = { idPersona: "0", idSala: "0", cargo: "", fechaPosesion: "", idUsuario: "1" };

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
  const { data, loading } = useQuery(GET_PERSONAS);

  const personas: Persona[] = data?.allPersonas ?? [];

  const filtrados = personas.filter(p =>
    `${p.nombre} ${p.primerApellido} ${p.numeroDocumento}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-500" />
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
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>No se encontraron personas</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filtrados.map((p, index) => (
                <button
                  key={p.idPersona}
                  onClick={() => {
                    onSelect(p.idPersona, `${p.nombre} ${p.primerApellido} - ${p.numeroDocumento}`);
                    onClose();
                  }}
                  className={`w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 ${
                    index === filtrados.length - 1 ? 'mb-0' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{p.nombre} {p.primerApellido}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {p.numeroDocumento} {p.esAbogado && <span className="text-emerald-600 dark:text-emerald-400 ml-2">• Abogado</span>}
                      </p>
                    </div>
                    <div className="text-emerald-500">
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
function BuscadorSala({
  onSelect,
  onClose,
}: {
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, loading } = useQuery(GET_SALAS_TRIBUNAL);

  const salas: SalaTribunal[] = data?.allSalasTribunal ?? [];

  const filtrados = salas.filter(s =>
    `${s.nombreSala} ${s.idTribunal.nombreTribunal} ${s.idTribunal.instancia}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-500" />
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
              placeholder="Buscar sala por nombre o tribunal..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
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
                  key={s.idSala}
                  onClick={() => {
                    onSelect(s.idSala, `${s.nombreSala} - ${s.idTribunal.nombreTribunal}`);
                    onClose();
                  }}
                  className={`w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 ${
                    index === filtrados.length - 1 ? 'mb-0' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{s.nombreSala}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{s.idTribunal.nombreTribunal} - {s.idTribunal.instancia}</p>
                    </div>
                    <div className="text-emerald-500">
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
export default function VocalesPage() {
  const { data: dVoc,  loading, refetch } = useQuery(GET_VOCALES);
  const { data: dPers }                   = useQuery(GET_PERSONAS);
  const { data: dSala }                   = useQuery(GET_SALAS_TRIBUNAL);
  const [crearVocal]      = useMutation(CREAR_VOCAL);
  const [actualizarVocal] = useMutation(ACTUALIZAR_VOCAL);
  const [eliminarVocal]   = useMutation(ELIMINAR_VOCAL);

  // ✅ HOOK DE NOTIFICACIONES
  const { executeCreate, executeUpdate, executeDelete, executeToggle } = useCrudNotifications('Vocal');
  const toast = useToast();

  const [modal, setModal]           = useState(false);
  const [buscadorPersonaAbierto, setBuscadorPersonaAbierto] = useState(false);
  const [buscadorSalaAbierto, setBuscadorSalaAbierto] = useState(false);
  const [editando, setEdit]         = useState<VocalTribunal | null>(null);
  const [form, setForm]             = useState(initForm);
  const [personaSeleccionada, setPersonaSeleccionada] = useState("");
  const [salaSeleccionada, setSalaSeleccionada] = useState("");
  const [busqueda, setBusq]         = useState("");
  const [err, setErr]               = useState("");

  const vocales:  VocalTribunal[] = dVoc?.allVocales        ?? [];
  const personas: Persona[]       = dPers?.allPersonas       ?? [];
  const salas:    SalaTribunal[]  = dSala?.allSalasTribunal  ?? [];

  const filtrados = vocales.filter(v =>
    `${nombreCompleto(v.idPersona)} ${v.cargo} ${v.idSala?.nombreSala ?? ""} ${v.idPersona.numeroDocumento}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  const activos   = vocales.filter(v => v.activo).length;
  const inactivos = vocales.filter(v => !v.activo).length;

  const p = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const abrirCrear = () => {
    setEdit(null);
    setForm(initForm);
    setPersonaSeleccionada("");
    setSalaSeleccionada("");
    setErr("");
    setModal(true);
  };

  const abrirEditar = (v: VocalTribunal) => {
    setEdit(v);
    setForm({
      idPersona:    String(v.idPersona.idPersona),
      idSala:       v.idSala ? String(v.idSala.idSala) : "0",
      cargo:        v.cargo,
      fechaPosesion: v.fechaPosesion?.slice(0, 10) ?? "",
      idUsuario:    v.usuario ? String(v.usuario.idUsuario) : "1",
    });
    setPersonaSeleccionada(nombreCompleto(v.idPersona));
    setSalaSeleccionada(v.idSala ? `${v.idSala.nombreSala} - ${v.idSala.idTribunal.nombreTribunal}` : "");
    setErr("");
    setModal(true);
  };

  const seleccionarPersona = (id: number, nombre: string) => {
    setForm(f => ({ ...f, idPersona: String(id) }));
    setPersonaSeleccionada(nombre);
  };

  const seleccionarSala = (id: number, nombre: string) => {
    setForm(f => ({ ...f, idSala: String(id) }));
    setSalaSeleccionada(nombre);
  };

  // ✅ GUARDAR CON NOTIFICACIONES (con sala editable en edición)
  const guardar = async () => {
    if (form.idPersona === "0" || !form.cargo || !form.fechaPosesion) {
      toast.error("Persona, cargo y fecha de posesión son obligatorios.");
      return;
    }
    
    if (editando) {
      await executeUpdate(async () => {
        await actualizarVocal({
          variables: {
            id: Number(editando.idVocal),
            input: {
              idSala: form.idSala !== "0" ? Number(form.idSala) : null,
              cargo:  form.cargo,
            },
          },
        });
        await refetch();
        setModal(false);
        return true;
      });
    } else {
      await executeCreate(async () => {
        await crearVocal({
          variables: {
            idPersona:    Number(form.idPersona),
            cargo:        form.cargo,
            fechaPosesion: form.fechaPosesion,
            idUsuario:    Number(form.idUsuario),
            idSala:       form.idSala !== "0" ? Number(form.idSala) : undefined,
          },
        });
        await refetch();
        setModal(false);
        return true;
      });
    }
  };

  // ✅ TOGGLE ACTIVO CON NOTIFICACIONES
  const toggleActivo = async (v: VocalTribunal) => {
    await executeToggle(
      async () => {
        await actualizarVocal({ 
          variables: { 
            id: Number(v.idVocal), 
            input: { activo: !v.activo } 
          } 
        });
        await refetch();
        return true;
      },
      !v.activo,
      {
        loading: `Cambiando estado de ${nombreCompleto(v.idPersona)}...`,
        success: (isActive: boolean) => `${nombreCompleto(v.idPersona)} ha sido ${isActive ? 'activado' : 'desactivado'}`,
        error: `Error al cambiar estado`,
      }
    );
  };

  // ✅ ELIMINAR CON NOTIFICACIONES
  const eliminar = async (v: VocalTribunal) => {
    await executeDelete(
      async () => {
        const { data } = await eliminarVocal({ variables: { id: Number(v.idVocal) } });
        if (!data?.eliminarVocal?.ok) {
          throw new Error(data?.eliminarVocal?.mensaje ?? "No se pudo eliminar.");
        }
        await refetch();
        return true;
      },
      {
        loading: `Eliminando a ${nombreCompleto(v.idPersona)}...`,
        success: `${nombreCompleto(v.idPersona)} eliminado exitosamente`,
        error: `Error al eliminar vocal`,
      },
      `¿Eliminar al vocal ${nombreCompleto(v.idPersona)}?`
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-500" />
            Vocales
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Vocales de tribunales • {vocales.length} registros
          </p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> Nuevo vocal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total vocales" value={vocales.length} color="text-emerald-600 dark:text-emerald-400"
          icon={<Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />} sub="Registrados en el sistema" />
        <StatCard label="Activos" value={activos} color="text-blue-600 dark:text-blue-400"
          icon={<UserCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
          sub={`${Math.round((activos / (vocales.length || 1)) * 100)}% del total`} />
        <StatCard label="Inactivos" value={inactivos} color="text-red-600 dark:text-red-400"
          icon={<UserX className="w-6 h-6 text-red-600 dark:text-red-400" />} sub="Con mandato concluido" />
      </div>

      {/* Buscador de tabla */}
      <div className="flex justify-between items-center">
        <SearchBar value={busqueda} onChange={setBusq} placeholder="Buscar por nombre, cargo o sala..." />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla */}
      <TablaDesktop
        headers={["Vocal", "Documento", "Cargo", "Sala asignada", "Posesión", "Estado", "Acciones"]}
        loading={loading}
        emptyMsg="No hay vocales registrados"
      >
        {filtrados.map(v => (
          <tr key={v.idVocal} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td className="px-6 py-4">
              <p className="font-semibold text-sm text-gray-800 dark:text-white">
                {nombreCompleto(v.idPersona)}
              </p>
              {v.idPersona.esAbogado && (
                <p className="text-xs text-amber-500 dark:text-amber-400">Abogado</p>
              )}
            </td>
            <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400">
              {v.idPersona.numeroDocumento}
            </td>
            <td className="px-6 py-4">
              <CargoBadge cargo={v.cargo} />
            </td>
            <td className="px-6 py-4">
              {v.idSala ? (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{v.idSala.nombreSala}</p>
                  <p className="text-xs text-gray-400">{v.idSala.idTribunal.nombreTribunal}</p>
                </div>
              ) : (
                <span className="text-xs text-gray-400">Sin asignar</span>
              )}
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
              {fmtFecha(v.fechaPosesion)}
            </td>
            <td className="px-6 py-4">
              <EstadoBadge activo={v.activo} />
            </td>
            <td className="px-6 py-4">
              <ActionBtns
                onEdit={() => abrirEditar(v)}
                onDelete={() => eliminar(v)}
                extraLabel={v.activo ? "Desactivar" : "Activar"}
                extraVariant={v.activo ? "red" : "emerald"}
                onExtra={() => toggleActivo(v)}
              />
            </td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Modal CREAR/EDITAR con buscadores */}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title={editando ? "Editar vocal" : "Nuevo vocal"}
          icon={<Users className="w-5 h-5 text-emerald-500" />}
        >
          {/* Selección de Persona - Con buscador */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              Persona <span className="text-red-500">*</span>
            </label>
            {!editando ? (
              <div>
                {personaSeleccionada ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                    <span className="flex-1 text-sm text-gray-800 dark:text-white">{personaSeleccionada}</span>
                    <button
                      onClick={() => {
                        setForm(f => ({ ...f, idPersona: "0" }));
                        setPersonaSeleccionada("");
                      }}
                      className="p-1 rounded-lg text-gray-500 hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setBuscadorPersonaAbierto(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-emerald-400 dark:hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Buscar y seleccionar persona
                  </button>
                )}
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 text-sm">
                {personaSeleccionada}
              </div>
            )}
          </div>

          <Field
            label="Cargo"
            value={form.cargo}
            onChange={p("cargo")}
            required
            placeholder="Ej: Vocal Titular"
          />

          {/* ✅ Selección de Sala - Con buscador (editable también en edición) */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              Sala asignada
            </label>
            {salaSeleccionada ? (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
                <span className="flex-1 text-sm text-gray-800 dark:text-white">{salaSeleccionada}</span>
                <button
                  onClick={() => {
                    setForm(f => ({ ...f, idSala: "0" }));
                    setSalaSeleccionada("");
                  }}
                  className="p-1 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setBuscadorSalaAbierto(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-emerald-400 dark:hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
              >
                <Plus className="w-4 h-4" />
                Buscar y seleccionar sala
              </button>
            )}
          </div>

          {!editando && (
            <Field
              label="Fecha de posesión"
              value={form.fechaPosesion}
              onChange={p("fechaPosesion")}
              type="date"
              required
            />
          )}

          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)}
            onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Registrar vocal"}
          />
        </Modal>
      )}

      {/* Modales de buscadores */}
      {buscadorPersonaAbierto && (
        <BuscadorPersona
          onSelect={seleccionarPersona}
          onClose={() => setBuscadorPersonaAbierto(false)}
        />
      )}
      {buscadorSalaAbierto && (
        <BuscadorSala
          onSelect={seleccionarSala}
          onClose={() => setBuscadorSalaAbierto(false)}
        />
      )}
    </div>
  );
}