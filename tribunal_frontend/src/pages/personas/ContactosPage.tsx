import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_CONTACTOS,
  GET_PERSONAS,
  CREAR_CONTACTO,
  ACTUALIZAR_CONTACTO,
  ELIMINAR_CONTACTO,
} from "../../graphql/personas";
import { Phone, Plus, Edit, Trash2, Mail, Smartphone, Home, CheckCircle } from "lucide-react";
import {
  Contacto, Persona, nombreCompleto,
  TipoContactoBadge, PrincipalBadge, ValidadoBadge,
  Modal, Field, SelectField, CheckboxField, ErrorBox, ModalFooter,
  StatCard, TablaDesktop, ActionBtns, SearchBar,
} from "./shared";

const TIPO_CONTACTO_OPTS = [
  { value: "EMAIL",     label: "📧 Email" },
  { value: "TELEFONO",  label: "📞 Teléfono" },
  { value: "CELULAR",   label: "📱 Celular" },
  { value: "DOMICILIO", label: "🏠 Domicilio" },
];

const initForm = { idPersona: "", tipoContacto: "", valor: "", esPrincipal: false };

export default function ContactosPage() {
  const { data, loading, refetch }   = useQuery(GET_CONTACTOS);
  const { data: dataPersonas }       = useQuery(GET_PERSONAS);
  const [crearContacto]      = useMutation(CREAR_CONTACTO);
  const [actualizarContacto] = useMutation(ACTUALIZAR_CONTACTO);
  const [eliminarContacto]   = useMutation(ELIMINAR_CONTACTO);

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<Contacto | null>(null);
  const [form, setForm]     = useState(initForm);
  const [busqueda, setBusq] = useState("");
  const [err, setErr]       = useState("");

  const contactos: Contacto[] = data?.allContactos ?? [];
  const personas: Persona[]   = dataPersonas?.allPersonas ?? [];

  const filtrados = contactos.filter(c =>
    `${c.valor} ${c.tipoContacto} ${c.idPersona?.nombre ?? ""} ${c.idPersona?.primerApellido ?? ""}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  // Stats
  const validados   = contactos.filter(c => c.validado).length;
  const principales = contactos.filter(c => c.esPrincipal).length;

  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const abrirCrear = () => { setEdit(null); setForm(initForm); setErr(""); setModal(true); };
  const abrirEditar = (c: Contacto) => {
    setEdit(c);
    setForm({
      idPersona:     String(c.idPersona?.idPersona ?? ""),
      tipoContacto:  c.tipoContacto,
      valor:         c.valor,
      esPrincipal:   c.esPrincipal,
    });
    setErr(""); setModal(true);
  };

  const guardar = async () => {
    if (!form.valor || !form.tipoContacto) { setErr("Tipo y valor son obligatorios."); return; }
    try {
      if (editando) {
        await actualizarContacto({
          variables: {
            id: Number(editando.idContacto),
            input: { valor: form.valor, esPrincipal: form.esPrincipal, validado: false },
          },
        });
      } else {
        if (!form.idPersona) { setErr("Seleccioná una persona."); return; }
        await crearContacto({
          variables: {
            idPersona:    Number(form.idPersona),
            tipoContacto: form.tipoContacto,
            valor:        form.valor,
            esPrincipal:  form.esPrincipal,
          },
        });
      }
      await refetch(); setModal(false);
    } catch (e: any) { setErr(e.message ?? "Error."); }
  };

  const eliminar = async (c: Contacto) => {
    if (!window.confirm("¿Eliminar este contacto?")) return;
    const { data } = await eliminarContacto({ variables: { id: Number(c.idContacto) } });
    if (!data?.eliminarContacto?.ok) {
      alert(data?.eliminarContacto?.mensaje ?? "No se pudo eliminar."); return;
    }
    refetch();
  };

  const toggleValidado = async (c: Contacto) => {
    await actualizarContacto({
      variables: { id: Number(c.idContacto), input: { validado: !c.validado } },
    });
    refetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Phone className="w-7 h-7 text-emerald-500" />
            Contactos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Información de contacto de personas • {contactos.length} registros
          </p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> Nuevo contacto
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total contactos" value={contactos.length} color="text-emerald-600 dark:text-emerald-400"
          icon={<Phone className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />} sub="Registrados en el sistema" />
        <StatCard label="Validados" value={validados} color="text-blue-600 dark:text-blue-400"
          icon={<CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
          sub={`${Math.round((validados / (contactos.length || 1)) * 100)}% del total`} />
        <StatCard label="Principales" value={principales} color="text-purple-600 dark:text-purple-400"
          icon={<Smartphone className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
          sub="Contacto de referencia" />
      </div>

      {/* Buscador */}
      <div className="flex justify-between items-center">
        <SearchBar value={busqueda} onChange={setBusq} placeholder="Buscar por valor, tipo o persona..." />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla Desktop */}
      <TablaDesktop
        headers={["Persona", "Documento", "Tipo", "Valor", "Principal", "Validado", "Acciones"]}
        loading={loading}
        emptyMsg="No hay contactos registrados"
        emptyIcon={<Phone className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
      >
        {filtrados.map(c => (
          <tr key={c.idContacto} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td className="px-6 py-4 font-semibold text-gray-800 dark:text-white text-sm">
              {c.idPersona?.nombre} {c.idPersona?.primerApellido}
            </td>
            <td className="px-6 py-4 font-mono text-gray-500 dark:text-gray-400 text-xs">
              {c.idPersona?.numeroDocumento}
            </td>
            <td className="px-6 py-4">
              <TipoContactoBadge tipo={c.tipoContacto} />
            </td>
            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">{c.valor}</td>
            <td className="px-6 py-4">
              {c.esPrincipal ? <PrincipalBadge /> : <span className="text-gray-400 text-sm">—</span>}
            </td>
            <td className="px-6 py-4">
              <ValidadoBadge validado={c.validado} onClick={() => toggleValidado(c)} />
            </td>
            <td className="px-6 py-4">
              <ActionBtns onEdit={() => abrirEditar(c)} onDelete={() => eliminar(c)} />
            </td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Cards Móvil */}
      <div className="lg:hidden space-y-3">
        {filtrados.map(c => (
          <div key={c.idContacto} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-gray-800 dark:text-white text-sm">
                  {c.idPersona?.nombre} {c.idPersona?.primerApellido}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200 mt-0.5">{c.valor}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => abrirEditar(c)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => eliminar(c)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <TipoContactoBadge tipo={c.tipoContacto} />
              {c.esPrincipal && <PrincipalBadge />}
              <ValidadoBadge validado={c.validado} onClick={() => toggleValidado(c)} />
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title={editando ? "Editar contacto" : "Nuevo contacto"}
          icon={<Phone className="w-5 h-5 text-emerald-500" />}
        >
          {!editando && (
            <SelectField label="Persona" value={form.idPersona} onChange={f("idPersona")} required>
              <option value="">— Seleccionar persona —</option>
              {personas.map((p: Persona) => (
                <option key={p.idPersona} value={p.idPersona}>
                  {nombreCompleto(p)} — {p.numeroDocumento}
                </option>
              ))}
            </SelectField>
          )}
          <SelectField label="Tipo de contacto" value={form.tipoContacto} onChange={f("tipoContacto")} required>
            <option value="">— Seleccionar tipo —</option>
            {TIPO_CONTACTO_OPTS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </SelectField>
          <Field
            label="Valor" value={form.valor} onChange={f("valor")} required
            placeholder="ej: correo@ejemplo.com / +591 71234567"
          />
          <CheckboxField label="Es contacto principal" value={form.esPrincipal} onChange={v => setForm(p => ({ ...p, esPrincipal: v }))} />
          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)} onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Crear contacto"}
          />
        </Modal>
      )}
    </div>
  );
}
