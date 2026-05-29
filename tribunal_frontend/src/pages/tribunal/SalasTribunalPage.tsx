import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_SALAS_TRIBUNAL,
  GET_TRIBUNALES,
  CREAR_SALA_TRIBUNAL,
  ACTUALIZAR_SALA_TRIBUNAL,
  ELIMINAR_SALA_TRIBUNAL,
} from "../../graphql/tribunal";
import { DoorOpen, Plus, Search, X } from "lucide-react";
import {
  SalaTribunal, Tribunal,
  InstanciaBadge, EstadoBadge,
  Modal, Field, SelectField, ErrorBox, ModalFooter,
  StatCard, TablaDesktop, ActionBtns, SearchBar,
} from "./shared";

const initForm = { idTribunal: "0", nombreSala: "", activa: "true" };

// ============================================================
// COMPONENTE: Buscador de Tribunales (Modal) - CORREGIDO
// ============================================================
function BuscadorTribunal({
  onSelect,
  onClose,
}: {
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const { data, loading } = useQuery(GET_TRIBUNALES);

  const tribunales: Tribunal[] = data?.allTribunales ?? [];

  const filtrados = tribunales.filter(t =>
    `${t.nombreTribunal} ${t.instancia}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        
        {/* Header - fijo */}
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-purple-500" />
            Seleccionar Tribunal
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Buscador - fijo */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar tribunal por nombre o instancia..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
              autoFocus
            />
          </div>
        </div>

        {/* Lista de tribunales - scrollable */}
        <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>No se encontraron tribunales</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filtrados.map((t, index) => (
                <button
                  key={t.idTribunal}
                  onClick={() => {
                    onSelect(t.idTribunal, t.nombreTribunal);
                    onClose();
                  }}
                  className={`w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 ${
                    index === filtrados.length - 1 ? 'mb-0' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{t.nombreTribunal}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t.instancia}</p>
                    </div>
                    <div className="text-purple-500 opacity-0 group-hover:opacity-100">
                      <Plus className="w-5 h-5" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer con botón Cancelar - fijo */}
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
export default function SalasTribunalPage() {
  const { data: dSala, loading, refetch } = useQuery(GET_SALAS_TRIBUNAL);
  const { data: dTrib }                   = useQuery(GET_TRIBUNALES);
  const [crearSala]      = useMutation(CREAR_SALA_TRIBUNAL);
  const [actualizarSala] = useMutation(ACTUALIZAR_SALA_TRIBUNAL);
  const [eliminarSala]   = useMutation(ELIMINAR_SALA_TRIBUNAL);

  const [modal, setModal]         = useState(false);
  const [buscadorAbierto, setBuscadorAbierto] = useState(false);
  const [editando, setEdit]       = useState<SalaTribunal | null>(null);
  const [form, setForm]           = useState(initForm);
  const [tribunalSeleccionado, setTribunalSeleccionado] = useState("");
  const [busqueda, setBusq]       = useState("");
  const [err, setErr]             = useState("");

  const salas:      SalaTribunal[] = dSala?.allSalasTribunal ?? [];
  const tribunales: Tribunal[]     = dTrib?.allTribunales    ?? [];

  const filtradas = salas.filter(s =>
    `${s.nombreSala} ${s.idTribunal.nombreTribunal} ${s.idTribunal.instancia}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  const activas   = salas.filter(s => s.activa).length;
  const inactivas = salas.filter(s => !s.activa).length;

  const p = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const abrirCrear = () => {
    setEdit(null);
    setForm(initForm);
    setTribunalSeleccionado("");
    setErr("");
    setModal(true);
  };

  const abrirEditar = (s: SalaTribunal) => {
    setEdit(s);
    setForm({
      idTribunal: String(s.idTribunal.idTribunal),
      nombreSala: s.nombreSala,
      activa:     String(s.activa),
    });
    setTribunalSeleccionado(s.idTribunal.nombreTribunal);
    setErr("");
    setModal(true);
  };

  const seleccionarTribunal = (id: number, nombre: string) => {
    setForm(f => ({ ...f, idTribunal: String(id) }));
    setTribunalSeleccionado(nombre);
  };

  const guardar = async () => {
    if (form.idTribunal === "0" || !form.nombreSala) {
      setErr("Tribunal y nombre son obligatorios.");
      return;
    }
    try {
      if (editando) {
        await actualizarSala({
          variables: {
            id:        Number(editando.idSala),
            nombreSala: form.nombreSala,
            activa:    form.activa === "true",
          },
        });
      } else {
        await crearSala({
          variables: {
            idTribunal: Number(form.idTribunal),
            nombreSala: form.nombreSala,
            activa:     form.activa === "true",
          },
        });
      }
      await refetch();
      setModal(false);
    } catch (e: any) {
      setErr(e.message ?? "Error al guardar.");
    }
  };

  const eliminar = async (s: SalaTribunal) => {
    if (!window.confirm(`¿Eliminar la sala "${s.nombreSala}"?`)) return;
    const { data } = await eliminarSala({ variables: { id: Number(s.idSala) } });
    if (!data?.eliminarSalaTribunal?.ok) {
      alert(data?.eliminarSalaTribunal?.mensaje ?? "No se pudo eliminar.");
      return;
    }
    refetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <DoorOpen className="w-7 h-7 text-purple-500" />
            Salas de Tribunal
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Salas asignadas a tribunales • {salas.length} registros
          </p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> Nueva sala
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total salas" value={salas.length} color="text-purple-600 dark:text-purple-400"
          icon={<DoorOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />} sub="Registradas en el sistema" />
        <StatCard label="Activas" value={activas} color="text-emerald-600 dark:text-emerald-400"
          icon={<DoorOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
          sub={`${Math.round((activas / (salas.length || 1)) * 100)}% del total`} />
        <StatCard label="Inactivas" value={inactivas} color="text-red-600 dark:text-red-400"
          icon={<DoorOpen className="w-6 h-6 text-red-600 dark:text-red-400" />} sub="Fuera de servicio" />
      </div>

      {/* Buscador de tabla */}
      <div className="flex justify-between items-center">
        <SearchBar value={busqueda} onChange={setBusq} placeholder="Buscar por nombre, tribunal o instancia..." />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {filtradas.length} resultado{filtradas.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla */}
      <TablaDesktop
        headers={["Nombre de sala", "Tribunal", "Instancia", "Estado", "Acciones"]}
        loading={loading}
        emptyMsg="No hay salas registradas"
      >
        {filtradas.map(s => (
          <tr key={s.idSala} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td className="px-6 py-4 font-semibold text-gray-800 dark:text-white text-sm">
              {s.nombreSala}
            </td>
            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">
              {s.idTribunal.nombreTribunal}
            </td>
            <td className="px-6 py-4">
              <InstanciaBadge instancia={s.idTribunal.instancia} />
            </td>
            <td className="px-6 py-4">
              <EstadoBadge activo={s.activa} />
            </td>
            <td className="px-6 py-4">
              <ActionBtns onEdit={() => abrirEditar(s)} onDelete={() => eliminar(s)} />
            </td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Modal CREAR/EDITAR con buscador de tribunales */}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title={editando ? "Editar sala" : "Nueva sala"}
          icon={<DoorOpen className="w-5 h-5 text-purple-500" />}
        >
          {/* Selección de tribunal - Con buscador */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              Tribunal <span className="text-red-500">*</span>
            </label>
            {!editando ? (
              <div>
                {tribunalSeleccionado ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800">
                    <span className="flex-1 text-sm text-gray-800 dark:text-white">{tribunalSeleccionado}</span>
                    <button
                      onClick={() => {
                        setForm(f => ({ ...f, idTribunal: "0" }));
                        setTribunalSeleccionado("");
                      }}
                      className="p-1 rounded-lg text-gray-500 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setBuscadorAbierto(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-purple-400 dark:hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Buscar y seleccionar tribunal
                  </button>
                )}
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 text-sm">
                {tribunalSeleccionado || (tribunales.find(t => t.idTribunal === Number(form.idTribunal))?.nombreTribunal)}
              </div>
            )}
          </div>

          <Field
            label="Nombre de sala"
            value={form.nombreSala}
            onChange={p("nombreSala")}
            required
            placeholder="Ej: Sala A"
          />

          <SelectField label="Estado" value={form.activa} onChange={p("activa")}>
            <option value="true">Activa</option>
            <option value="false">Inactiva</option>
          </SelectField>

          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)}
            onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Crear sala"}
          />
        </Modal>
      )}

      {/* Modal del buscador de tribunales */}
      {buscadorAbierto && (
        <BuscadorTribunal
          onSelect={seleccionarTribunal}
          onClose={() => setBuscadorAbierto(false)}
        />
      )}
    </div>
  );
}