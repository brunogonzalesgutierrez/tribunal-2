import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_SALAS_TRIBUNAL,
  GET_TRIBUNALES,
  CREAR_SALA_TRIBUNAL,
  ACTUALIZAR_SALA_TRIBUNAL,
  ELIMINAR_SALA_TRIBUNAL,
} from "../../graphql/tribunal";
import { DoorOpen, Plus } from "lucide-react";
import {
  SalaTribunal, Tribunal,
  InstanciaBadge, EstadoBadge,
  Modal, Field, SelectField, ErrorBox, ModalFooter,
  StatCard, TablaDesktop, ActionBtns, SearchBar,
} from "./shared";

const initForm = { idTribunal: "0", nombreSala: "", activa: "true" };

export default function SalasTribunalPage() {
  const { data: dSala, loading, refetch } = useQuery(GET_SALAS_TRIBUNAL);
  const { data: dTrib }                   = useQuery(GET_TRIBUNALES);
  const [crearSala]      = useMutation(CREAR_SALA_TRIBUNAL);
  const [actualizarSala] = useMutation(ACTUALIZAR_SALA_TRIBUNAL);
  const [eliminarSala]   = useMutation(ELIMINAR_SALA_TRIBUNAL);

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<SalaTribunal | null>(null);
  const [form, setForm]     = useState(initForm);
  const [busqueda, setBusq] = useState("");
  const [err, setErr]       = useState("");

  const salas:      SalaTribunal[] = dSala?.allSalasTribunal ?? [];
  const tribunales: Tribunal[]     = dTrib?.allTribunales    ?? [];

  const filtradas = salas.filter(s =>
    `${s.nombreSala} ${s.idTribunal.nombreTribunal} ${s.idTribunal.instancia}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  const activas   = salas.filter(s => s.activa).length;
  const inactivas = salas.filter(s => !s.activa).length;

  const p = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const abrirCrear = () => { setEdit(null); setForm(initForm); setErr(""); setModal(true); };
  const abrirEditar = (s: SalaTribunal) => {
    setEdit(s);
    setForm({
      idTribunal: String(s.idTribunal.idTribunal),
      nombreSala: s.nombreSala,
      activa:     String(s.activa),
    });
    setErr(""); setModal(true);
  };

  const guardar = async () => {
    if (form.idTribunal === "0" || !form.nombreSala) {
      setErr("Tribunal y nombre son obligatorios."); return;
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
      await refetch(); setModal(false);
    } catch (e: any) { setErr(e.message ?? "Error al guardar."); }
  };

  const eliminar = async (s: SalaTribunal) => {
    if (!window.confirm(`¿Eliminar la sala "${s.nombreSala}"?`)) return;
    const { data } = await eliminarSala({ variables: { id: Number(s.idSala) } });
    if (!data?.eliminarSalaTribunal?.ok) {
      alert(data?.eliminarSalaTribunal?.mensaje ?? "No se pudo eliminar."); return;
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

      {/* Buscador */}
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

      {/* Modal */}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title={editando ? "Editar sala" : "Nueva sala"}
          icon={<DoorOpen className="w-5 h-5 text-purple-500" />}
        >
          {!editando && (
            <SelectField label="Tribunal" value={form.idTribunal} onChange={p("idTribunal")} required>
              <option value="0">— Seleccionar tribunal —</option>
              {tribunales.map(t => (
                <option key={t.idTribunal} value={t.idTribunal}>{t.nombreTribunal}</option>
              ))}
            </SelectField>
          )}
          <Field
            label="Nombre de sala" value={form.nombreSala}
            onChange={p("nombreSala")} required placeholder="Ej: Sala A"
          />
          <SelectField label="Estado" value={form.activa} onChange={p("activa")}>
            <option value="true">Activa</option>
            <option value="false">Inactiva</option>
          </SelectField>
          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)} onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Crear sala"}
          />
        </Modal>
      )}
    </div>
  );
}
