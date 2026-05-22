import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_PARTES_PROCESALES,
  GET_PERSONAS,
  GET_ROLES_PROCESAL,
  GET_EXPEDIENTES_SIMPLE,
  CREAR_PARTE_PROCESAL,
  ACTUALIZAR_PARTE_PROCESAL,
  ELIMINAR_PARTE_PROCESAL,
} from "../../graphql/personas";
import { Users, Plus, Edit, Trash2, UserCheck, UserX } from "lucide-react";
import {
  ParteProcesal, Persona, RolProcesal, Expediente, nombreCompleto, fmtFecha,
  AbogadoBadge, RolBadge, EstadoBadge,
  Modal, Field, SelectField, ErrorBox, ModalFooter,
  StatCard, TablaDesktop, ActionBtns, SearchBar,
} from "./shared";

type FiltroActivo = "TODOS" | "ACTIVO" | "INACTIVO";

const initForm = { idExpediente: "", idPersona: "", idRol: "", fechaExclusion: "" };

export default function PartesPage() {
  const { data, loading, refetch } = useQuery(GET_PARTES_PROCESALES);
  const { data: dataPersonas }     = useQuery(GET_PERSONAS);
  const { data: dataRoles }        = useQuery(GET_ROLES_PROCESAL);
  const { data: dataExp }          = useQuery(GET_EXPEDIENTES_SIMPLE);
  const [crearParte]      = useMutation(CREAR_PARTE_PROCESAL);
  const [actualizarParte] = useMutation(ACTUALIZAR_PARTE_PROCESAL);
  const [eliminarParte]   = useMutation(ELIMINAR_PARTE_PROCESAL);

  const [modal, setModal]        = useState(false);
  const [editando, setEdit]      = useState<ParteProcesal | null>(null);
  const [form, setForm]          = useState(initForm);
  const [busqueda, setBusq]      = useState("");
  const [filtroActivo, setFiltro] = useState<FiltroActivo>("TODOS");
  const [err, setErr]            = useState("");

  const partes: ParteProcesal[] = data?.allPartesProcesales ?? [];
  const personas: Persona[]     = dataPersonas?.allPersonas ?? [];
  const roles: RolProcesal[]    = dataRoles?.allRolesProcesal ?? [];
  const expedientes: Expediente[] = dataExp?.allExpedientes ?? [];

  const filtradas = partes.filter(p => {
    const matchBusq = `${p.idPersona?.nombre ?? ""} ${p.idPersona?.primerApellido ?? ""} ${p.idExpediente?.numeroExpediente ?? ""} ${p.idRol?.nombreRol ?? ""}`
      .toLowerCase().includes(busqueda.toLowerCase());
    const matchActivo =
      filtroActivo === "TODOS" ||
      (filtroActivo === "ACTIVO" ? p.activo : !p.activo);
    return matchBusq && matchActivo;
  });

  // Stats
  const activos   = partes.filter(p => p.activo).length;
  const inactivos = partes.filter(p => !p.activo).length;

  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const abrirCrear = () => { setEdit(null); setForm(initForm); setErr(""); setModal(true); };
  const abrirEditar = (p: ParteProcesal) => {
    setEdit(p);
    setForm({
      idExpediente:  String(p.idExpediente?.idExpediente ?? ""),
      idPersona:     String(p.idPersona?.idPersona ?? ""),
      idRol:         String(p.idRol?.idRol ?? ""),
      fechaExclusion: p.fechaExclusion ?? "",
    });
    setErr(""); setModal(true);
  };

  const guardar = async () => {
    if (!editando && (!form.idExpediente || !form.idPersona || !form.idRol)) {
      setErr("Expediente, persona y rol son obligatorios."); return;
    }
    try {
      if (editando) {
        await actualizarParte({
          variables: {
            id: Number(editando.idParte),
            input: { activo: editando.activo, fechaExclusion: form.fechaExclusion || undefined },
          },
        });
      } else {
        await crearParte({
          variables: {
            idExpediente: Number(form.idExpediente),
            idPersona:    Number(form.idPersona),
            idRol:        Number(form.idRol),
          },
        });
      }
      await refetch(); setModal(false);
    } catch (e: any) { setErr(e.message ?? "Error."); }
  };

  const toggleActivo = async (p: ParteProcesal) => {
    await actualizarParte({
      variables: {
        id: Number(p.idParte),
        input: {
          activo:         !p.activo,
          fechaExclusion: !p.activo ? undefined : new Date().toISOString().split("T")[0],
        },
      },
    });
    refetch();
  };

  const eliminar = async (p: ParteProcesal) => {
    if (!window.confirm("¿Eliminar esta parte procesal?")) return;
    const { data } = await eliminarParte({ variables: { id: Number(p.idParte) } });
    if (!data?.eliminarParteProcesal?.ok) {
      alert(data?.eliminarParteProcesal?.mensaje ?? "No se pudo eliminar."); return;
    }
    refetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-amber-500" />
            Partes Procesales
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Participantes en expedientes judiciales • {partes.length} registros
          </p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-sm shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> Nueva parte
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total partes" value={partes.length} color="text-amber-600 dark:text-amber-400"
          icon={<Users className="w-6 h-6 text-amber-600 dark:text-amber-400" />} sub="Registradas en el sistema" />
        <StatCard label="Activas" value={activos} color="text-emerald-600 dark:text-emerald-400"
          icon={<UserCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
          sub={`${Math.round((activos / (partes.length || 1)) * 100)}% del total`} />
        <StatCard label="Inactivas" value={inactivos} color="text-red-600 dark:text-red-400"
          icon={<UserX className="w-6 h-6 text-red-600 dark:text-red-400" />} sub="Excluidas del proceso" />
      </div>

      {/* Buscador + filtro estado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <SearchBar value={busqueda} onChange={setBusq} placeholder="Buscar por persona, expediente o rol..." />
          <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-1">
            {(["TODOS", "ACTIVO", "INACTIVO"] as FiltroActivo[]).map(op => (
              <button
                key={op}
                onClick={() => setFiltro(op)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filtroActivo === op
                    ? "bg-white dark:bg-slate-700 text-gray-800 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {op === "TODOS" ? "Todos" : op === "ACTIVO" ? "Activos" : "Inactivos"}
              </button>
            ))}
          </div>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {filtradas.length} resultado{filtradas.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla Desktop */}
      <TablaDesktop
        headers={["Persona", "Documento", "Expediente", "Rol procesal", "Inclusión", "Exclusión", "Estado", "Acciones"]}
        loading={loading}
        emptyMsg="No hay partes procesales"
        emptyIcon={<Users className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
      >
        {filtradas.map(p => (
          <tr key={p.idParte} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td className="px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800 dark:text-white text-sm">
                  {nombreCompleto(p.idPersona)}
                </span>
                {p.idPersona?.esAbogado && <AbogadoBadge />}
              </div>
            </td>
            <td className="px-6 py-4 font-mono text-gray-500 dark:text-gray-400 text-xs">
              {p.idPersona?.numeroDocumento}
            </td>
            <td className="px-6 py-4">
              <span className="text-blue-500 font-mono font-bold text-sm">
                {p.idExpediente?.numeroExpediente}
              </span>
              <div className="text-xs text-gray-400 mt-0.5">{p.idExpediente?.ano}</div>
            </td>
            <td className="px-6 py-4">
              <RolBadge rol={p.idRol?.nombreRol ?? "—"} />
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">
              {fmtFecha(p.fechaInclusion)}
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">
              {fmtFecha(p.fechaExclusion)}
            </td>
            <td className="px-6 py-4">
              <EstadoBadge activo={p.activo} />
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => abrirEditar(p)}
                  className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleActivo(p)}
                  title={p.activo ? "Excluir" : "Reincorporar"}
                  className={`p-2 rounded-lg transition-colors text-xs font-semibold ${
                    p.activo
                      ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30"
                      : "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                  }`}
                >
                  {p.activo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => eliminar(p)}
                  className="p-2 rounded-lg text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Cards Móvil */}
      <div className="lg:hidden space-y-3">
        {filtradas.map(p => (
          <div key={p.idParte} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-semibold text-gray-800 dark:text-white text-sm">{nombreCompleto(p.idPersona)}</p>
                <span className="text-blue-500 font-mono text-xs">#{p.idExpediente?.numeroExpediente}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => abrirEditar(p)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => toggleActivo(p)} className={`p-1.5 rounded-lg ${p.activo ? "text-amber-500 hover:bg-amber-50" : "text-emerald-500 hover:bg-emerald-50"}`}>
                  {p.activo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                </button>
                <button onClick={() => eliminar(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <RolBadge rol={p.idRol?.nombreRol ?? "—"} />
              <EstadoBadge activo={p.activo} />
              {p.idPersona?.esAbogado && <AbogadoBadge />}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title={editando ? "Editar parte procesal" : "Nueva parte procesal"}
          icon={<Users className="w-5 h-5 text-amber-500" />}
        >
          {!editando ? (
            <>
              <SelectField label="Expediente" value={form.idExpediente} onChange={f("idExpediente")} required>
                <option value="">— Seleccionar expediente —</option>
                {expedientes.map((e: Expediente) => (
                  <option key={e.idExpediente} value={e.idExpediente}>
                    {e.numeroExpediente} ({e.ano}){e.idEstadoExpediente ? ` — ${e.idEstadoExpediente.nombreEstado}` : ""}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Persona" value={form.idPersona} onChange={f("idPersona")} required>
                <option value="">— Seleccionar persona —</option>
                {personas.map((p: Persona) => (
                  <option key={p.idPersona} value={p.idPersona}>
                    {nombreCompleto(p)} — {p.numeroDocumento}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Rol procesal" value={form.idRol} onChange={f("idRol")} required>
                <option value="">— Seleccionar rol —</option>
                {roles.map((r: RolProcesal) => (
                  <option key={r.idRol} value={r.idRol}>{r.nombreRol}</option>
                ))}
              </SelectField>
            </>
          ) : (
            <Field
              label="Fecha de exclusión" value={form.fechaExclusion}
              onChange={f("fechaExclusion")} type="date"
            />
          )}
          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)} onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Agregar parte"}
          />
        </Modal>
      )}
    </div>
  );
}
