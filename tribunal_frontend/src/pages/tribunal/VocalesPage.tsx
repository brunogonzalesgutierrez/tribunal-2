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
import { Users, Plus, UserCheck, UserX } from "lucide-react";
import {
  VocalTribunal, Persona, SalaTribunal,
  nombreCompleto, fmtFecha,
  CargoBadge, EstadoBadge,
  Modal, Field, SelectField, ErrorBox, ModalFooter,
  StatCard, TablaDesktop, ActionBtns, SearchBar,
} from "./shared";

const initForm = { idPersona: "0", idSala: "0", cargo: "", fechaPosesion: "", idUsuario: "1" };

export default function VocalesPage() {
  const { data: dVoc,  loading, refetch } = useQuery(GET_VOCALES);
  const { data: dPers }                   = useQuery(GET_PERSONAS);
  const { data: dSala }                   = useQuery(GET_SALAS_TRIBUNAL);
  const [crearVocal]      = useMutation(CREAR_VOCAL);
  const [actualizarVocal] = useMutation(ACTUALIZAR_VOCAL);
  const [eliminarVocal]   = useMutation(ELIMINAR_VOCAL);

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<VocalTribunal | null>(null);
  const [form, setForm]     = useState(initForm);
  const [busqueda, setBusq] = useState("");
  const [err, setErr]       = useState("");

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

  const abrirCrear = () => { setEdit(null); setForm(initForm); setErr(""); setModal(true); };
  const abrirEditar = (v: VocalTribunal) => {
    setEdit(v);
    setForm({
      idPersona:    String(v.idPersona.idPersona),
      idSala:       v.idSala ? String(v.idSala.idSala) : "0",
      cargo:        v.cargo,
      fechaPosesion: v.fechaPosesion?.slice(0, 10) ?? "",
      idUsuario:    v.usuario ? String(v.usuario.idUsuario) : "1",
    });
    setErr(""); setModal(true);
  };

  const guardar = async () => {
    if (form.idPersona === "0" || !form.cargo || !form.fechaPosesion) {
      setErr("Persona, cargo y fecha de posesión son obligatorios."); return;
    }
    try {
      if (editando) {
        await actualizarVocal({
          variables: {
            id: Number(editando.idVocal),
            input: {
              idSala: form.idSala !== "0" ? Number(form.idSala) : null,
              cargo:  form.cargo,
            },
          },
        });
      } else {
        await crearVocal({
          variables: {
            idPersona:    Number(form.idPersona),
            cargo:        form.cargo,
            fechaPosesion: form.fechaPosesion,
            idUsuario:    Number(form.idUsuario),
            idSala:       form.idSala !== "0" ? Number(form.idSala) : undefined,
          },
        });
      }
      await refetch(); setModal(false);
    } catch (e: any) { setErr(e.message ?? "Error al guardar."); }
  };

  const toggleActivo = async (v: VocalTribunal) => {
    await actualizarVocal({ variables: { id: Number(v.idVocal), input: { activo: !v.activo } } });
    refetch();
  };

  const eliminar = async (v: VocalTribunal) => {
    if (!window.confirm(`¿Eliminar al vocal ${nombreCompleto(v.idPersona)}?`)) return;
    const { data } = await eliminarVocal({ variables: { id: Number(v.idVocal) } });
    if (!data?.eliminarVocal?.ok) {
      alert(data?.eliminarVocal?.mensaje ?? "No se pudo eliminar."); return;
    }
    refetch();
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

      {/* Buscador */}
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

      {/* Modal */}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title={editando ? "Editar vocal" : "Nuevo vocal"}
          icon={<Users className="w-5 h-5 text-emerald-500" />}
        >
          {!editando && (
            <SelectField label="Persona" value={form.idPersona} onChange={p("idPersona")} required>
              <option value="0">— Seleccionar persona —</option>
              {personas.map((per: Persona) => (
                <option key={per.idPersona} value={per.idPersona}>
                  {nombreCompleto(per)} — {per.numeroDocumento}
                </option>
              ))}
            </SelectField>
          )}
          <Field
            label="Cargo" value={form.cargo} onChange={p("cargo")} required
            placeholder="Ej: Vocal Titular"
          />
          <SelectField label="Sala asignada" value={form.idSala} onChange={p("idSala")}>
            <option value="0">— Sin asignar —</option>
            {salas.filter(s => s.activa).map(s => (
              <option key={s.idSala} value={s.idSala}>
                {s.nombreSala} — {s.idTribunal.nombreTribunal}
              </option>
            ))}
          </SelectField>
          {!editando && (
            <Field
              label="Fecha de posesión" value={form.fechaPosesion}
              onChange={p("fechaPosesion")} type="date" required
            />
          )}
          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)} onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Registrar vocal"}
          />
        </Modal>
      )}
    </div>
  );
}
