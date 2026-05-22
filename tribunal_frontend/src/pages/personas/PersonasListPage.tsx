import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_PERSONAS,
  CREAR_PERSONA,
  ACTUALIZAR_PERSONA,
  ELIMINAR_PERSONA,
} from "../../graphql/personas";
import { User, Plus, Edit, Trash2, Scale, GraduationCap } from "lucide-react";
import {
  Persona, nombreCompleto,
  AbogadoBadge,
  Modal, Field, CheckboxField, ErrorBox, ModalFooter,
  StatCard, TablaDesktop, ActionBtns, SearchBar,
} from "./shared";

const initForm = {
  nombre: "", primerApellido: "", segundoApellido: "",
  numeroDocumento: "", estamento: "", registroUniversitario: "",
  titularA: "", esAbogado: false,
};

export default function PersonasListPage() {
  const { data, loading, refetch } = useQuery(GET_PERSONAS);
  const [crearPersona]      = useMutation(CREAR_PERSONA);
  const [actualizarPersona] = useMutation(ACTUALIZAR_PERSONA);
  const [eliminarPersona]   = useMutation(ELIMINAR_PERSONA);

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<Persona | null>(null);
  const [form, setForm]     = useState(initForm);
  const [busqueda, setBusq] = useState("");
  const [err, setErr]       = useState("");

  const personas: Persona[] = data?.allPersonas ?? [];
  const filtradas = personas.filter(p =>
    `${p.nombre} ${p.primerApellido} ${p.segundoApellido ?? ""} ${p.numeroDocumento} ${p.estamento ?? ""}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  const abogados = personas.filter(p => p.esAbogado).length;

  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const abrirCrear = () => { setEdit(null); setForm(initForm); setErr(""); setModal(true); };
  const abrirEditar = (p: Persona) => {
    setEdit(p);
    setForm({
      nombre:               p.nombre,
      primerApellido:       p.primerApellido,
      segundoApellido:      p.segundoApellido ?? "",
      numeroDocumento:      p.numeroDocumento,
      estamento:            p.estamento ?? "",
      registroUniversitario: p.registroUniversitario ?? "",
      titularA:             p.titularA ?? "",
      esAbogado:            p.esAbogado,
    });
    setErr(""); setModal(true);
  };

  const guardar = async () => {
    if (!form.nombre || !form.primerApellido || !form.numeroDocumento) {
      setErr("Nombre, primer apellido y documento son obligatorios."); return;
    }
    try {
      if (editando) {
        await actualizarPersona({
          variables: {
            id: Number(editando.idPersona),
            input: {
              nombre:               form.nombre,
              primerApellido:       form.primerApellido,
              segundoApellido:      form.segundoApellido || undefined,
              estamento:            form.estamento || undefined,
              registroUniversitario: form.registroUniversitario || undefined,
              titularA:             form.titularA || undefined,
              esAbogado:            form.esAbogado,
              numeroDocumento:      form.numeroDocumento,
            },
          },
        });
      } else {
        await crearPersona({
          variables: {
            input: {
              numeroDocumento:      form.numeroDocumento,
              nombre:               form.nombre,
              primerApellido:       form.primerApellido,
              segundoApellido:      form.segundoApellido || undefined,
              estamento:            form.estamento || undefined,
              registroUniversitario: form.registroUniversitario || undefined,
              titularA:             form.titularA || undefined,
              esAbogado:            form.esAbogado,
            },
          },
        });
      }
      await refetch(); setModal(false);
    } catch (e: any) { setErr(e.message ?? "Error."); }
  };

  const eliminar = async (p: Persona) => {
    if (!window.confirm(`¿Eliminar a ${nombreCompleto(p)}?`)) return;
    const { data } = await eliminarPersona({ variables: { id: Number(p.idPersona) } });
    if (!data?.eliminarPersona?.ok) {
      alert(data?.eliminarPersona?.mensaje ?? "No se pudo eliminar."); return;
    }
    refetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <User className="w-7 h-7 text-blue-500" />
            Personas
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Registro de personas del sistema • {personas.length} registros
          </p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> Nueva persona
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total personas" value={personas.length} color="text-blue-600 dark:text-blue-400"
          icon={<User className="w-6 h-6 text-blue-600 dark:text-blue-400" />} sub="Registradas en el sistema" />
        <StatCard label="Abogados" value={abogados} color="text-purple-600 dark:text-purple-400"
          icon={<Scale className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
          sub={`${Math.round((abogados / (personas.length || 1)) * 100)}% del total`} />
        <StatCard label="Otros participantes" value={personas.length - abogados} color="text-emerald-600 dark:text-emerald-400"
          icon={<GraduationCap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
          sub="Sin perfil de abogado" />
      </div>

      {/* Buscador */}
      <div className="flex justify-between items-center">
        <SearchBar value={busqueda} onChange={setBusq} placeholder="Buscar por nombre, documento o estamento..." />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {filtradas.length} resultado{filtradas.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla Desktop */}
      <TablaDesktop
        headers={["Documento", "Nombre completo", "Estamento", "Reg. universitario", "Abogado", "Titular a", "Acciones"]}
        loading={loading}
        emptyMsg="No hay personas registradas"
        emptyIcon={<User className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
      >
        {filtradas.map(p => (
          <tr key={p.idPersona} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td className="px-6 py-4">
              <span className="font-mono text-blue-500 font-bold text-sm">{p.numeroDocumento}</span>
            </td>
            <td className="px-6 py-4 font-semibold text-gray-800 dark:text-white text-sm">
              {nombreCompleto(p)}
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
              {p.estamento ?? "—"}
            </td>
            <td className="px-6 py-4 text-sm font-mono text-gray-500 dark:text-gray-400">
              {p.registroUniversitario ?? "—"}
            </td>
            <td className="px-6 py-4">
              {p.esAbogado ? <AbogadoBadge /> : <span className="text-gray-400 text-sm">—</span>}
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
              {p.titularA ?? "—"}
            </td>
            <td className="px-6 py-4">
              <ActionBtns onEdit={() => abrirEditar(p)} onDelete={() => eliminar(p)} />
            </td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Cards Móvil */}
      <div className="lg:hidden space-y-3">
        {filtradas.map(p => (
          <div key={p.idPersona} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-gray-800 dark:text-white text-sm">{nombreCompleto(p)}</p>
                <span className="font-mono text-blue-500 text-xs">{p.numeroDocumento}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => abrirEditar(p)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => eliminar(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              {p.estamento && <span className="text-xs text-gray-400">{p.estamento}</span>}
              {p.esAbogado && <AbogadoBadge />}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title={editando ? "Editar persona" : "Nueva persona"}
          icon={<User className="w-5 h-5 text-blue-500" />}
        >
          <div className="grid grid-cols-2 gap-x-4">
            <Field label="Nombre" value={form.nombre} onChange={f("nombre")} required />
            <Field label="Primer apellido" value={form.primerApellido} onChange={f("primerApellido")} required />
            <Field label="Segundo apellido" value={form.segundoApellido} onChange={f("segundoApellido")} />
            <Field label="N° Documento" value={form.numeroDocumento} onChange={f("numeroDocumento")} required />
            <Field label="Estamento" value={form.estamento} onChange={f("estamento")} placeholder="ej: Docente, Estudiante" />
            <Field label="Registro universitario" value={form.registroUniversitario} onChange={f("registroUniversitario")} />
          </div>
          <Field label="Titular a" value={form.titularA} onChange={f("titularA")} placeholder="ej: Cargo o representación" />
          <CheckboxField label="Es abogado" value={form.esAbogado} onChange={v => setForm(p => ({ ...p, esAbogado: v }))} />
          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)} onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Crear persona"}
          />
        </Modal>
      )}
    </div>
  );
}
