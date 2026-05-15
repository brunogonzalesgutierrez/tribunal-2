import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_PERSONAS,
  GET_CONTACTOS,
  GET_ROLES_PROCESAL,
  GET_PARTES_PROCESALES,
  GET_EXPEDIENTES_SIMPLE,
  CREAR_PERSONA,
  ACTUALIZAR_PERSONA,
  ELIMINAR_PERSONA,
  CREAR_CONTACTO,
  ACTUALIZAR_CONTACTO,
  ELIMINAR_CONTACTO,
  CREAR_ROL_PROCESAL,
  ACTUALIZAR_ROL_PROCESAL,
  ELIMINAR_ROL_PROCESAL,
  CREAR_PARTE_PROCESAL,
  ACTUALIZAR_PARTE_PROCESAL,
  ELIMINAR_PARTE_PROCESAL,
} from "../graphql/personas";

// ─── TIPOS ───────────────────────────────────────────────

interface Persona {
  idPersona: number;
  numeroDocumento: string;
  nombre: string;
  primerApellido: string;
  segundoApellido?: string;
  estamento?: string;
  registroUniversitario?: string;
  esAbogado: boolean;
  titularA?: string;
}

interface Contacto {
  idContacto: number;
  tipoContacto: string;
  valor: string;
  esPrincipal: boolean;
  validado: boolean;
  idPersona: Persona;
}

interface RolProcesal {
  idRol: number;
  nombreRol: string;
}

interface Expediente {
  idExpediente: number;
  numeroExpediente: string;
  ano: number;
  idEstadoExpediente?: { nombreEstado: string };
}

interface ParteProcesal {
  idParte: number;
  fechaInclusion: string;
  fechaExclusion?: string;
  activo: boolean;
  idExpediente: Expediente;
  idPersona: Persona;
  idRol: RolProcesal;
}

// ─── PALETA ──────────────────────────────────────────────
const C = {
  bg: "#0d1117",
  card: "#161b22",
  border: "#30363d",
  text: "#e6edf3",
  muted: "#8b949e",
  blue: "#58a6ff",
  green: "#3fb950",
  red: "#f85149",
  yellow: "#e3b341",
  row: "#1c2128",
};

// ─── COMPONENTES COMPARTIDOS ──────────────────────────────

function Badge({ texto, color }: { texto: string; color: "green" | "red" | "blue" | "yellow" | "purple" }) {
  const map = {
    green:  { bg: "#1a3d22", fg: C.green },
    red:    { bg: "#3d1a1a", fg: C.red },
    blue:   { bg: "#1c2d3a", fg: C.blue },
    yellow: { bg: "#3d2e1a", fg: C.yellow },
    purple: { bg: "#2d1a3d", fg: "#bc8cff" },
  };
  const { bg, fg } = map[color];
  return (
    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, backgroundColor: bg, color: fg, fontWeight: 500 }}>
      {texto}
    </span>
  );
}

function Modal({ children, onClose, ancho = 480 }: { children: React.ReactNode; onClose: () => void; ancho?: number }) {
  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.65)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
        padding: 28, width: ancho, maxHeight: "90vh", overflowY: "auto",
      }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

const Field = ({ label, value, onChange, type = "text", placeholder = "", required = false }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
}) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 5 }}>
      {label}{required && <span style={{ color: C.red }}> *</span>}
    </label>
    <input
      type={type} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      style={{
        width: "100%", padding: "8px 10px", backgroundColor: C.bg,
        border: `1px solid ${C.border}`, borderRadius: 6, color: C.text,
        fontSize: 13, outline: "none", boxSizing: "border-box",
      }}
    />
  </div>
);

const SelectField = ({ label, value, onChange, options, required = false }: {
  label: string; value: string | number;
  onChange: (v: string) => void;
  options: { value: string | number; label: string }[];
  required?: boolean;
}) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 5 }}>
      {label}{required && <span style={{ color: C.red }}> *</span>}
    </label>
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      width: "100%", padding: "8px 10px", backgroundColor: C.bg,
      border: `1px solid ${C.border}`, borderRadius: 6, color: C.text,
      fontSize: 13, outline: "none",
    }}>
      <option value="">— Seleccionar —</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const CheckField = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
  <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
    <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)}
      style={{ width: 15, height: 15, accentColor: C.blue, cursor: "pointer" }} />
    <label style={{ fontSize: 13, color: C.text, cursor: "pointer" }} onClick={() => onChange(!value)}>{label}</label>
  </div>
);

function ErrorBox({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div style={{
      backgroundColor: "#3d1a1a", border: `1px solid ${C.red}`, borderRadius: 6,
      padding: "8px 12px", fontSize: 12, color: C.red, marginBottom: 14,
    }}>{msg}</div>
  );
}

function ModalBotones({ onCancel, onSave, labelSave }: { onCancel: () => void; onSave: () => void; labelSave: string }) {
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
      <button onClick={onCancel} style={{
        padding: "8px 16px", backgroundColor: "transparent",
        border: `1px solid ${C.border}`, borderRadius: 6, color: C.muted, fontSize: 13, cursor: "pointer",
      }}>Cancelar</button>
      <button onClick={onSave} style={{
        padding: "8px 16px", backgroundColor: "#238636", border: "none",
        borderRadius: 6, color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 500,
      }}>{labelSave}</button>
    </div>
  );
}

function THead({ headers }: { headers: string[] }) {
  return (
    <thead>
      <tr style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: C.bg }}>
        {headers.map(h => (
          <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: C.muted, fontWeight: 500, fontSize: 12 }}>{h}</th>
        ))}
      </tr>
    </thead>
  );
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <>
      {[...Array(4)].map((_, i) => (
        <tr key={i} style={{ borderBottom: "1px solid #21262d" }}>
          {[...Array(cols)].map((_, j) => (
            <td key={j} style={{ padding: "12px 16px" }}>
              <div style={{ height: 12, backgroundColor: "#21262d", borderRadius: 4 }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function TablaWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        {children}
      </table>
    </div>
  );
}

function Buscador({ value, onChange, placeholder, onNuevo, labelNuevo }: {
  value: string; onChange: (v: string) => void;
  placeholder: string; onNuevo: () => void; labelNuevo: string;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <input placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
        style={{
          width: 320, padding: "8px 12px", backgroundColor: C.card,
          border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 13, outline: "none",
        }} />
      <button onClick={onNuevo} style={{
        backgroundColor: "#238636", color: "#fff", border: "none",
        borderRadius: 6, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 500,
      }}>{labelNuevo}</button>
    </div>
  );
}

function Contador({ n, label }: { n: number; label: string }) {
  return <div style={{ marginTop: 10, fontSize: 12, color: C.muted }}>{n} {label}{n !== 1 ? "s" : ""}</div>;
}

function BtnAccion({ label, color, onClick }: { label: string; color: "blue" | "red" | "muted" | "yellow" | "green"; onClick: () => void }) {
  const map = {
    blue:   { bg: "#1c2d3a", fg: C.blue,   border: "#1f4060" },
    red:    { bg: "#3d1a1a", fg: C.red,    border: C.red },
    yellow: { bg: "#3d2e1a", fg: C.yellow, border: C.yellow },
    green:  { bg: "#1a3d22", fg: C.green,  border: C.green },
    muted:  { bg: "transparent", fg: C.muted, border: C.border },
  };
  const s = map[color];
  return (
    <button onClick={onClick} style={{
      backgroundColor: s.bg, color: s.fg, border: `1px solid ${s.border}`,
      borderRadius: 5, padding: "4px 10px", fontSize: 12, cursor: "pointer",
    }}>{label}</button>
  );
}

const fmtFecha = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-BO", { day: "2-digit", month: "2-digit", year: "numeric" });
};

// ════════════════════════════════════════════════════════
// TAB 1 — PERSONAS
// ════════════════════════════════════════════════════════

const initPersona = {
  numeroDocumento: "", nombre: "", primerApellido: "", segundoApellido: "",
  estamento: "", registroUniversitario: "", titularA: "", esAbogado: false,
};

function PersonasTab() {
  const [modal, setModal]       = useState(false);
  const [editando, setEditando] = useState<Persona | null>(null);
  const [form, setForm]         = useState(initPersona);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError]       = useState("");

  const { data, loading, refetch } = useQuery(GET_PERSONAS);
  const [crearPersona]      = useMutation(CREAR_PERSONA);
  const [actualizarPersona] = useMutation(ACTUALIZAR_PERSONA);
  const [eliminarPersona]   = useMutation(ELIMINAR_PERSONA);

  const personas: Persona[] = data?.allPersonas ?? [];
  const filtradas = personas.filter(p =>
    `${p.nombre} ${p.primerApellido} ${p.segundoApellido ?? ""} ${p.numeroDocumento} ${p.estamento ?? ""}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirCrear = () => { setEditando(null); setForm(initPersona); setError(""); setModal(true); };
  const abrirEditar = (p: Persona) => {
    setEditando(p);
    setForm({
      numeroDocumento: p.numeroDocumento, nombre: p.nombre,
      primerApellido: p.primerApellido, segundoApellido: p.segundoApellido ?? "",
      estamento: p.estamento ?? "", registroUniversitario: p.registroUniversitario ?? "",
      titularA: p.titularA ?? "", esAbogado: p.esAbogado,
    });
    setError(""); setModal(true);
  };
  const cerrar = () => { setModal(false); setEditando(null); };
  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const guardar = async () => {
    if (!form.nombre || !form.primerApellido || !form.numeroDocumento) {
      setError("Nombre, primer apellido y documento son obligatorios."); return;
    }
    try {
      if (editando) {
        await actualizarPersona({
          variables: {
            id: Number(editando.idPersona),
            input: {
              nombre: form.nombre, primerApellido: form.primerApellido,
              segundoApellido: form.segundoApellido || undefined,
              estamento: form.estamento || undefined,
              registroUniversitario: form.registroUniversitario || undefined,
              titularA: form.titularA || undefined, esAbogado: form.esAbogado,
              numeroDocumento: form.numeroDocumento,
            },
          },
        });
      } else {
        await crearPersona({
          variables: {
            input: {
              numeroDocumento: form.numeroDocumento, nombre: form.nombre,
              primerApellido: form.primerApellido,
              segundoApellido: form.segundoApellido || undefined,
              estamento: form.estamento || undefined,
              registroUniversitario: form.registroUniversitario || undefined,
              titularA: form.titularA || undefined, esAbogado: form.esAbogado,
            },
          },
        });
      }
      await refetch(); cerrar();
    } catch (e: any) { setError(e.message ?? "Error al guardar."); }
  };

  // ── ELIMINAR PERSONA ─────────────────────────────────────
  const eliminar = async (id: number) => {
    if (!window.confirm("¿Eliminar esta persona?")) return;
    const { data } = await eliminarPersona({ variables: { id: Number(id) } });
    if (!data?.eliminarPersona?.ok) {
      alert(data?.eliminarPersona?.mensaje ?? "No se pudo eliminar la persona.");
      return;
    }
    refetch();
  };

  return (
    <div>
      <Buscador value={busqueda} onChange={setBusqueda}
        placeholder="Buscar por nombre, documento o estamento..."
        onNuevo={abrirCrear} labelNuevo="+ Nueva persona" />

      <TablaWrapper>
        <THead headers={["Documento", "Nombre completo", "Estamento", "Reg. universitario", "Abogado", "Titular a", "Acciones"]} />
        <tbody>
          {loading ? <SkeletonRow cols={7} /> : filtradas.length === 0 ? (
            <tr><td colSpan={7} style={{ padding: "32px 16px", textAlign: "center", color: C.muted }}>No hay personas registradas</td></tr>
          ) : filtradas.map((p, i) => (
            <tr key={p.idPersona}
              style={{ borderBottom: i < filtradas.length - 1 ? "1px solid #21262d" : "none" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.row)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <td style={{ padding: "12px 16px", fontFamily: "monospace", color: C.blue, fontSize: 12 }}>{p.numeroDocumento}</td>
              <td style={{ padding: "12px 16px", fontWeight: 500 }}>
                {p.nombre} {p.primerApellido}{p.segundoApellido ? ` ${p.segundoApellido}` : ""}
              </td>
              <td style={{ padding: "12px 16px", color: C.muted }}>{p.estamento ?? "—"}</td>
              <td style={{ padding: "12px 16px", color: C.muted, fontFamily: "monospace", fontSize: 12 }}>{p.registroUniversitario ?? "—"}</td>
              <td style={{ padding: "12px 16px" }}>
                {p.esAbogado ? <Badge texto="Abogado" color="purple" /> : <span style={{ color: C.muted, fontSize: 12 }}>—</span>}
              </td>
              <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>{p.titularA ?? "—"}</td>
              <td style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <BtnAccion label="Editar" color="blue" onClick={() => abrirEditar(p)} />
                  <BtnAccion label="Eliminar" color="muted" onClick={() => eliminar(Number(p.idPersona))} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </TablaWrapper>
      <Contador n={filtradas.length} label="persona" />

      {modal && (
        <Modal onClose={cerrar} ancho={500}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: C.text }}>
            {editando ? "Editar persona" : "Nueva persona"}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Nombre" value={form.nombre} onChange={f("nombre")} required />
            <Field label="Primer apellido" value={form.primerApellido} onChange={f("primerApellido")} required />
            <Field label="Segundo apellido" value={form.segundoApellido} onChange={f("segundoApellido")} />
            <Field label="N° Documento" value={form.numeroDocumento} onChange={f("numeroDocumento")} required />
            <Field label="Estamento" value={form.estamento} onChange={f("estamento")} placeholder="ej: Docente, Estudiante" />
            <Field label="Registro universitario" value={form.registroUniversitario} onChange={f("registroUniversitario")} />
          </div>
          <Field label="Titular a" value={form.titularA} onChange={f("titularA")} placeholder="ej: Cargo o representación" />
          <CheckField label="Es abogado" value={form.esAbogado} onChange={v => setForm(p => ({ ...p, esAbogado: v }))} />
          <ErrorBox msg={error} />
          <ModalBotones onCancel={cerrar} onSave={guardar} labelSave={editando ? "Guardar cambios" : "Crear persona"} />
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// TAB 2 — CONTACTOS
// ════════════════════════════════════════════════════════

const TIPO_CONTACTO_OPTS = [
  { value: "EMAIL",     label: "📧 Email" },
  { value: "TELEFONO",  label: "📞 Teléfono" },
  { value: "CELULAR",   label: "📱 Celular" },
  { value: "DOMICILIO", label: "🏠 Domicilio" },
];

const tipoContactoColor = (t: string): "blue" | "green" | "yellow" | "purple" => {
  if (t === "EMAIL")    return "blue";
  if (t === "TELEFONO") return "green";
  if (t === "CELULAR")  return "yellow";
  return "purple";
};

const initContacto = { idPersona: "", tipoContacto: "", valor: "", esPrincipal: false };

function ContactosTab() {
  const [modal, setModal]       = useState(false);
  const [editando, setEditando] = useState<Contacto | null>(null);
  const [form, setForm]         = useState(initContacto);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError]       = useState("");

  const { data, loading, refetch } = useQuery(GET_CONTACTOS);
  const { data: dataPersonas }     = useQuery(GET_PERSONAS);
  const [crearContacto]      = useMutation(CREAR_CONTACTO);
  const [actualizarContacto] = useMutation(ACTUALIZAR_CONTACTO);
  const [eliminarContacto]   = useMutation(ELIMINAR_CONTACTO);

  const contactos: Contacto[] = data?.allContactos ?? [];
  const personas: Persona[]   = dataPersonas?.allPersonas ?? [];

  const filtrados = contactos.filter(c =>
    `${c.valor} ${c.tipoContacto} ${c.idPersona?.nombre ?? ""} ${c.idPersona?.primerApellido ?? ""}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirCrear = () => { setEditando(null); setForm(initContacto); setError(""); setModal(true); };
  const abrirEditar = (c: Contacto) => {
    setEditando(c);
    setForm({ idPersona: String(c.idPersona?.idPersona ?? ""), tipoContacto: c.tipoContacto, valor: c.valor, esPrincipal: c.esPrincipal });
    setError(""); setModal(true);
  };
  const cerrar = () => { setModal(false); setEditando(null); };
  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const guardar = async () => {
    if (!form.valor || !form.tipoContacto) { setError("Tipo y valor son obligatorios."); return; }
    try {
      if (editando) {
        await actualizarContacto({
          variables: { id: Number(editando.idContacto), input: {  valor: form.valor, esPrincipal: form.esPrincipal, validado: false } },
        });
      } else {
        if (!form.idPersona) { setError("Seleccioná una persona."); return; }
        await crearContacto({
          variables: { idPersona: Number(form.idPersona), tipoContacto: form.tipoContacto, valor: form.valor, esPrincipal: form.esPrincipal },
        });
      }
      await refetch(); cerrar();
    } catch (e: any) { setError(e.message ?? "Error al guardar."); }
  };

  // ── ELIMINAR CONTACTO ────────────────────────────────────
  const eliminar = async (id: number) => {
    if (!window.confirm("¿Eliminar este contacto?")) return;
    const { data } = await eliminarContacto({ variables: { id: Number(id) } });
    if (!data?.eliminarContacto?.ok) {
      alert(data?.eliminarContacto?.mensaje ?? "No se pudo eliminar el contacto.");
      return;
    }
    refetch();
  };

  const toggleValidado = async (c: Contacto) => {
    await actualizarContacto({ variables: { id: Number(c.idContacto), input: { validado: !c.validado } } });
    refetch();
  };

  return (
    <div>
      <Buscador value={busqueda} onChange={setBusqueda}
        placeholder="Buscar por valor, tipo o persona..."
        onNuevo={abrirCrear} labelNuevo="+ Nuevo contacto" />

      <TablaWrapper>
        <THead headers={["Persona", "Documento", "Tipo", "Valor", "Principal", "Validado", "Acciones"]} />
        <tbody>
          {loading ? <SkeletonRow cols={7} /> : filtrados.length === 0 ? (
            <tr><td colSpan={7} style={{ padding: "32px 16px", textAlign: "center", color: C.muted }}>No hay contactos registrados</td></tr>
          ) : filtrados.map((c, i) => (
            <tr key={c.idContacto}
              style={{ borderBottom: i < filtrados.length - 1 ? "1px solid #21262d" : "none" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.row)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <td style={{ padding: "12px 16px", fontWeight: 500 }}>
                {c.idPersona?.nombre} {c.idPersona?.primerApellido}
              </td>
              <td style={{ padding: "12px 16px", fontFamily: "monospace", color: C.muted, fontSize: 12 }}>
                {c.idPersona?.numeroDocumento}
              </td>
              <td style={{ padding: "12px 16px" }}>
                <Badge texto={c.tipoContacto} color={tipoContactoColor(c.tipoContacto)} />
              </td>
              <td style={{ padding: "12px 16px", color: C.text }}>{c.valor}</td>
              <td style={{ padding: "12px 16px" }}>
                {c.esPrincipal ? <Badge texto="Principal" color="green" /> : <span style={{ color: C.muted, fontSize: 12 }}>—</span>}
              </td>
              <td style={{ padding: "12px 16px" }}>
                <button onClick={() => toggleValidado(c)} style={{
                  backgroundColor: c.validado ? "#1a3d22" : "#3d1a1a",
                  color: c.validado ? C.green : C.red,
                  border: `1px solid ${c.validado ? C.green : C.red}`,
                  borderRadius: 5, padding: "3px 10px", fontSize: 11, cursor: "pointer",
                }}>
                  {c.validado ? "Validado" : "Sin validar"}
                </button>
              </td>
              <td style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <BtnAccion label="Editar" color="blue" onClick={() => abrirEditar(c)} />
                  <BtnAccion label="Eliminar" color="muted" onClick={() => eliminar(Number(c.idContacto))} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </TablaWrapper>
      <Contador n={filtrados.length} label="contacto" />

      {modal && (
        <Modal onClose={cerrar}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: C.text }}>
            {editando ? "Editar contacto" : "Nuevo contacto"}
          </h2>
          {!editando && (
            <SelectField label="Persona" value={form.idPersona} onChange={f("idPersona")}
              options={personas.map(p => ({ value: p.idPersona, label: `${p.nombre} ${p.primerApellido} — ${p.numeroDocumento}` }))}
              required />
          )}
          <SelectField label="Tipo de contacto" value={form.tipoContacto} onChange={f("tipoContacto")}
            options={TIPO_CONTACTO_OPTS} required />
          <Field label="Valor" value={form.valor} onChange={f("valor")}
            placeholder="ej: correo@ejemplo.com / +591 71234567" required />
          <CheckField label="Es contacto principal" value={form.esPrincipal}
            onChange={v => setForm(p => ({ ...p, esPrincipal: v }))} />
          <ErrorBox msg={error} />
          <ModalBotones onCancel={cerrar} onSave={guardar} labelSave={editando ? "Guardar cambios" : "Crear contacto"} />
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// TAB 3 — ROLES PROCESALES
// ════════════════════════════════════════════════════════

function RolesProcesalesTab() {
  const [modal, setModal]         = useState(false);
  const [editando, setEditando]   = useState<RolProcesal | null>(null);
  const [nombreRol, setNombreRol] = useState("");
  const [busqueda, setBusqueda]   = useState("");
  const [error, setError]         = useState("");

  const { data, loading, refetch } = useQuery(GET_ROLES_PROCESAL);
  const [crearRolProcesal]      = useMutation(CREAR_ROL_PROCESAL);
  const [actualizarRolProcesal] = useMutation(ACTUALIZAR_ROL_PROCESAL);
  const [eliminarRolProcesal]   = useMutation(ELIMINAR_ROL_PROCESAL);

  const roles: RolProcesal[] = data?.allRolesProcesal ?? [];
  const filtrados = roles.filter(r =>
    r.nombreRol.toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirCrear = () => { setEditando(null); setNombreRol(""); setError(""); setModal(true); };
  const abrirEditar = (r: RolProcesal) => { setEditando(r); setNombreRol(r.nombreRol); setError(""); setModal(true); };
  const cerrar = () => { setModal(false); setEditando(null); };

  const guardar = async () => {
    if (!nombreRol.trim()) { setError("El nombre del rol es obligatorio."); return; }
    try {
      if (editando) {
        await actualizarRolProcesal({ variables: { id: Number(editando.idRol), input: { nombreRol } } });
      } else {
        await crearRolProcesal({ variables: { nombreRol } });
      }
      await refetch(); cerrar();
    } catch (e: any) { setError(e.message ?? "Error al guardar."); }
  };

  // ── ELIMINAR ROL PROCESAL ────────────────────────────────
  const eliminar = async (id: number) => {
    if (!window.confirm("¿Eliminar este rol procesal?")) return;
    const { data } = await eliminarRolProcesal({ variables: { id: Number(id) } });
    if (!data?.eliminarRolProcesal?.ok) {
      alert(data?.eliminarRolProcesal?.mensaje ?? "No se pudo eliminar el rol procesal.");
      return;
    }
    refetch();
  };

  return (
    <div>
      <Buscador value={busqueda} onChange={setBusqueda}
        placeholder="Buscar rol procesal..."
        onNuevo={abrirCrear} labelNuevo="+ Nuevo rol" />

      <TablaWrapper>
        <THead headers={["ID", "Nombre del rol", "Acciones"]} />
        <tbody>
          {loading ? <SkeletonRow cols={3} /> : filtrados.length === 0 ? (
            <tr><td colSpan={3} style={{ padding: "32px 16px", textAlign: "center", color: C.muted }}>No hay roles procesales</td></tr>
          ) : filtrados.map((r, i) => (
            <tr key={r.idRol}
              style={{ borderBottom: i < filtrados.length - 1 ? "1px solid #21262d" : "none" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.row)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12, fontFamily: "monospace" }}>#{r.idRol}</td>
              <td style={{ padding: "12px 16px", fontWeight: 500 }}>
                <Badge texto={r.nombreRol} color="purple" />
              </td>
              <td style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <BtnAccion label="Editar" color="blue" onClick={() => abrirEditar(r)} />
                  <BtnAccion label="Eliminar" color="muted" onClick={() => eliminar(Number(r.idRol))} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </TablaWrapper>
      <Contador n={filtrados.length} label="rol procesal" />

      {modal && (
        <Modal onClose={cerrar} ancho={400}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: C.text }}>
            {editando ? "Editar rol procesal" : "Nuevo rol procesal"}
          </h2>
          <Field label="Nombre del rol" value={nombreRol} onChange={setNombreRol}
            placeholder="ej: Demandante, Demandado, Abogado..." required />
          <ErrorBox msg={error} />
          <ModalBotones onCancel={cerrar} onSave={guardar} labelSave={editando ? "Guardar cambios" : "Crear rol"} />
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// TAB 4 — PARTES PROCESALES
// ════════════════════════════════════════════════════════

const initParte = { idExpediente: "", idPersona: "", idRol: "", fechaExclusion: "" };

function PartesTab() {
  const [modal, setModal]       = useState(false);
  const [editando, setEditando] = useState<ParteProcesal | null>(null);
  const [form, setForm]         = useState(initParte);
  const [busqueda, setBusqueda] = useState("");
  const [filtroActivo, setFiltroActivo] = useState<"TODOS" | "ACTIVO" | "INACTIVO">("TODOS");
  const [error, setError]       = useState("");

  const { data, loading, refetch } = useQuery(GET_PARTES_PROCESALES);
  const { data: dataPersonas }     = useQuery(GET_PERSONAS);
  const { data: dataRoles }        = useQuery(GET_ROLES_PROCESAL);
  const { data: dataExp }          = useQuery(GET_EXPEDIENTES_SIMPLE);
  const [crearParte]      = useMutation(CREAR_PARTE_PROCESAL);
  const [actualizarParte] = useMutation(ACTUALIZAR_PARTE_PROCESAL);
  const [eliminarParte]   = useMutation(ELIMINAR_PARTE_PROCESAL);

  const partes: ParteProcesal[] = data?.allPartesProcesales ?? [];
  const personas: Persona[]     = dataPersonas?.allPersonas ?? [];
  const roles: RolProcesal[]    = dataRoles?.allRolesProcesal ?? [];
  const expedientes: Expediente[] = dataExp?.allExpedientes ?? [];

  const filtradas = partes.filter(p => {
    const matchBusq = `${p.idPersona?.nombre ?? ""} ${p.idPersona?.primerApellido ?? ""} ${p.idExpediente?.numeroExpediente ?? ""} ${p.idRol?.nombreRol ?? ""}`
      .toLowerCase().includes(busqueda.toLowerCase());
    const matchActivo = filtroActivo === "TODOS" || (filtroActivo === "ACTIVO" ? p.activo : !p.activo);
    return matchBusq && matchActivo;
  });

  const abrirCrear = () => { setEditando(null); setForm(initParte); setError(""); setModal(true); };
  const abrirEditar = (p: ParteProcesal) => {
    setEditando(p);
    setForm({ idExpediente: String(p.idExpediente?.idExpediente ?? ""), idPersona: String(p.idPersona?.idPersona ?? ""), idRol: String(p.idRol?.idRol ?? ""), fechaExclusion: p.fechaExclusion ?? "" });
    setError(""); setModal(true);
  };
  const cerrar = () => { setModal(false); setEditando(null); };
  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const guardar = async () => {
    if (!editando && (!form.idExpediente || !form.idPersona || !form.idRol)) {
      setError("Expediente, persona y rol son obligatorios."); return;
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
          variables: { idExpediente: Number(form.idExpediente), idPersona: Number(form.idPersona), idRol: Number(form.idRol) },
        });
      }
      await refetch(); cerrar();
    } catch (e: any) { setError(e.message ?? "Error al guardar."); }
  };

  const toggleActivo = async (p: ParteProcesal) => {
    await actualizarParte({
      variables: {
        id: Number(p.idParte),
        input: {
          activo: !p.activo,
          fechaExclusion: !p.activo ? undefined : new Date().toISOString().split("T")[0],
        },
      },
    });
    refetch();
  };

  // ── ELIMINAR PARTE PROCESAL ──────────────────────────────
  const eliminar = async (id: number) => {
    if (!window.confirm("¿Eliminar esta parte procesal?")) return;
    const { data } = await eliminarParte({ variables: { id: Number(id) } });
    if (!data?.eliminarParteProcesal?.ok) {
      alert(data?.eliminarParteProcesal?.mensaje ?? "No se pudo eliminar la parte procesal.");
      return;
    }
    refetch();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input placeholder="Buscar por persona, expediente o rol..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            style={{ width: 300, padding: "8px 12px", backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 13, outline: "none" }} />
          <div style={{ display: "flex", gap: 4, backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 4 }}>
            {(["TODOS", "ACTIVO", "INACTIVO"] as const).map(op => (
              <button key={op} onClick={() => setFiltroActivo(op)} style={{
                padding: "4px 12px", borderRadius: 6, border: "none",
                backgroundColor: filtroActivo === op ? "#238636" : "transparent",
                color: filtroActivo === op ? "#fff" : C.muted,
                fontSize: 12, cursor: "pointer", fontWeight: filtroActivo === op ? 600 : 400,
              }}>{op === "TODOS" ? "Todos" : op === "ACTIVO" ? "Activos" : "Inactivos"}</button>
            ))}
          </div>
        </div>
        <button onClick={abrirCrear} style={{ backgroundColor: "#238636", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
          + Nueva parte
        </button>
      </div>

      <TablaWrapper>
        <THead headers={["Persona", "Documento", "Expediente", "Rol procesal", "Inclusión", "Exclusión", "Estado", "Acciones"]} />
        <tbody>
          {loading ? <SkeletonRow cols={8} /> : filtradas.length === 0 ? (
            <tr><td colSpan={8} style={{ padding: "32px 16px", textAlign: "center", color: C.muted }}>No hay partes procesales</td></tr>
          ) : filtradas.map((p, i) => (
            <tr key={p.idParte}
              style={{ borderBottom: i < filtradas.length - 1 ? "1px solid #21262d" : "none" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.row)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <td style={{ padding: "12px 16px", fontWeight: 500 }}>
                {p.idPersona?.nombre} {p.idPersona?.primerApellido}
                {p.idPersona?.esAbogado && (
                  <span style={{ marginLeft: 6 }}><Badge texto="Abg." color="purple" /></span>
                )}
              </td>
              <td style={{ padding: "12px 16px", fontFamily: "monospace", color: C.muted, fontSize: 12 }}>
                {p.idPersona?.numeroDocumento}
              </td>
              <td style={{ padding: "12px 16px" }}>
                <span style={{ color: C.blue, fontFamily: "monospace", fontSize: 12 }}>
                  {p.idExpediente?.numeroExpediente}
                </span>
                <div style={{ fontSize: 11, color: C.muted }}>{p.idExpediente?.ano}</div>
              </td>
              <td style={{ padding: "12px 16px" }}>
                <Badge texto={p.idRol?.nombreRol ?? "—"} color="purple" />
              </td>
              <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>{fmtFecha(p.fechaInclusion)}</td>
              <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>{fmtFecha(p.fechaExclusion)}</td>
              <td style={{ padding: "12px 16px" }}>
                <Badge texto={p.activo ? "Activo" : "Inactivo"} color={p.activo ? "green" : "red"} />
              </td>
              <td style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <BtnAccion label="Editar" color="blue" onClick={() => abrirEditar(p)} />
                  <BtnAccion
                    label={p.activo ? "Excluir" : "Reincorporar"}
                    color={p.activo ? "yellow" : "green"}
                    onClick={() => toggleActivo(p)} />
                  <BtnAccion label="Eliminar" color="muted" onClick={() => eliminar(Number(p.idParte))} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </TablaWrapper>
      <Contador n={filtradas.length} label="parte procesal" />

      {modal && (
        <Modal onClose={cerrar} ancho={500}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: C.text }}>
            {editando ? "Editar parte procesal" : "Nueva parte procesal"}
          </h2>
          {!editando ? (
            <>
              <SelectField label="Expediente" value={form.idExpediente} onChange={f("idExpediente")}
                options={expedientes.map(e => ({ value: e.idExpediente, label: `${e.numeroExpediente} (${e.ano}) — ${e.idEstadoExpediente?.nombreEstado ?? ""}` }))}
                required />
              <SelectField label="Persona" value={form.idPersona} onChange={f("idPersona")}
                options={personas.map(p => ({ value: p.idPersona, label: `${p.nombre} ${p.primerApellido} — ${p.numeroDocumento}` }))}
                required />
              <SelectField label="Rol procesal" value={form.idRol} onChange={f("idRol")}
                options={roles.map(r => ({ value: r.idRol, label: r.nombreRol }))}
                required />
            </>
          ) : (
            <Field label="Fecha de exclusión" value={form.fechaExclusion}
              onChange={f("fechaExclusion")} type="date" />
          )}
          <ErrorBox msg={error} />
          <ModalBotones onCancel={cerrar} onSave={guardar} labelSave={editando ? "Guardar cambios" : "Agregar parte"} />
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════

type Tab = "personas" | "contactos" | "roles" | "partes";

const TABS: { id: Tab; label: string; icono: string }[] = [
  { id: "personas",  label: "Personas",         icono: "👤" },
  { id: "contactos", label: "Contactos",         icono: "📋" },
  { id: "roles",     label: "Roles Procesales",  icono: "⚖️" },
  { id: "partes",    label: "Partes Procesales", icono: "👥" },
];

export default function PersonasPage() {
  const [tabActiva, setTabActiva] = useState<Tab>("personas");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg, color: C.text, padding: "28px 32px" }}>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Gestión de Personas</h1>
        <p style={{ fontSize: 13, color: C.muted }}>Personas, contactos, roles y partes procesales</p>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
        {TABS.map(tab => {
          const activa = tabActiva === tab.id;
          return (
            <button key={tab.id} onClick={() => setTabActiva(tab.id)} style={{
              padding: "9px 18px", backgroundColor: "transparent", border: "none",
              borderBottom: activa ? `2px solid ${C.blue}` : "2px solid transparent",
              color: activa ? C.blue : C.muted,
              fontSize: 13, fontWeight: activa ? 600 : 400,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              transition: "color 0.15s", marginBottom: -1,
            }}>
              <span>{tab.icono}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {tabActiva === "personas"  && <PersonasTab />}
      {tabActiva === "contactos" && <ContactosTab />}
      {tabActiva === "roles"     && <RolesProcesalesTab />}
      {tabActiva === "partes"    && <PartesTab />}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}