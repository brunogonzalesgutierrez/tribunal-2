import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_CONFORMACIONES,
  GET_VOCALES,
  GET_EXPEDIENTES_SIMPLE,
  CREAR_CONFORMACION,
  ELIMINAR_CONFORMACION,
} from "../../graphql/tribunal";
import { Link2, Plus } from "lucide-react";
import {
  Conformacion, VocalTribunal, ExpedienteSimple,
  nombreCompleto, fmtFecha,
  CargoBadge, RolBadge,
  Modal, Field, SelectField, ErrorBox, ModalFooter,
  StatCard, TablaDesktop, ActionBtns, SearchBar,
} from "./shared";

const initForm = { idExpediente: "0", idVocal: "0", rolEnCaso: "" };

export default function ConformacionesPage() {
  const { data: dConf, loading, refetch } = useQuery(GET_CONFORMACIONES);
  const { data: dVoc  }                   = useQuery(GET_VOCALES);
  const { data: dExp  }                   = useQuery(GET_EXPEDIENTES_SIMPLE);
  const [crearConf]    = useMutation(CREAR_CONFORMACION);
  const [eliminarConf] = useMutation(ELIMINAR_CONFORMACION);

  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState(initForm);
  const [busqueda, setBusq] = useState("");
  const [err, setErr]       = useState("");

  const conformaciones: Conformacion[]    = dConf?.allConformaciones ?? [];
  const vocales:        VocalTribunal[]   = dVoc?.allVocales         ?? [];
  const expedientes:    ExpedienteSimple[] = dExp?.allExpedientes     ?? [];

  const filtrados = conformaciones.filter(c =>
    `${c.idExpediente.numeroExpediente} ${c.idVocal.idPersona.nombre} ${c.idVocal.idPersona.primerApellido} ${c.rolEnCaso} ${c.idVocal.cargo}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  // Stats: roles únicos y expedientes únicos en conformaciones
  const rolesUnicos      = [...new Set(conformaciones.map(c => c.rolEnCaso))].length;
  const expedientesUnicos = [...new Set(conformaciones.map(c => c.idExpediente.numeroExpediente))].length;

  const p = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const abrirCrear = () => { setForm(initForm); setErr(""); setModal(true); };

  const guardar = async () => {
    if (form.idExpediente === "0" || form.idVocal === "0" || !form.rolEnCaso) {
      setErr("Todos los campos son obligatorios."); return;
    }
    try {
      await crearConf({
        variables: {
          idExpediente: Number(form.idExpediente),
          idVocal:      Number(form.idVocal),
          rolEnCaso:    form.rolEnCaso,
        },
      });
      await refetch(); setModal(false);
    } catch (e: any) { setErr(e.message ?? "Error al guardar."); }
  };

  const eliminar = async (c: Conformacion) => {
    if (!window.confirm(`¿Remover la conformación del vocal en el expediente ${c.idExpediente.numeroExpediente}?`)) return;
    const { data } = await eliminarConf({ variables: { id: Number(c.idConformacion) } });
    if (!data?.eliminarConformacion?.ok) {
      alert(data?.eliminarConformacion?.mensaje ?? "No se pudo eliminar."); return;
    }
    refetch();
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

      {/* Buscador */}
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

      {/* Modal (solo crear, no hay edición de conformaciones) */}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title="Nueva conformación"
          icon={<Link2 className="w-5 h-5 text-amber-500" />}
        >
          <SelectField label="Expediente" value={form.idExpediente} onChange={p("idExpediente")} required>
            <option value="0">— Seleccionar expediente —</option>
            {expedientes.map((e: ExpedienteSimple) => (
              <option key={e.idExpediente} value={e.idExpediente}>
                {e.numeroExpediente} ({e.ano})
                {e.idEstadoExpediente ? ` — ${e.idEstadoExpediente.nombreEstado}` : ""}
              </option>
            ))}
          </SelectField>
          <SelectField label="Vocal" value={form.idVocal} onChange={p("idVocal")} required>
            <option value="0">— Seleccionar vocal —</option>
            {vocales.filter(v => v.activo).map((v: VocalTribunal) => (
              <option key={v.idVocal} value={v.idVocal}>
                {nombreCompleto(v.idPersona)} — {v.cargo}
              </option>
            ))}
          </SelectField>
          <Field
            label="Rol en el caso" value={form.rolEnCaso} onChange={p("rolEnCaso")} required
            placeholder="Ej: Presidente, Vocal Relator, Vocal..."
          />
          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)} onSave={guardar}
            saveLabel="Asignar conformación"
          />
        </Modal>
      )}
    </div>
  );
}
