import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_DOCUMENTOS,
  GET_TIPOS_DOC,
  GET_NOTIFICACIONES,
  GET_EXPEDIENTES_SIMPLE,
  GET_PARTES_PROCESALES,
  CREAR_DOCUMENTO,
  ACTUALIZAR_DOCUMENTO,
  ELIMINAR_DOCUMENTO,
  CREAR_TIPO_DOC,
  ACTUALIZAR_TIPO_DOC,
  ELIMINAR_TIPO_DOC,
  CREAR_NOTIFICACION,
  ACTUALIZAR_NOTIFICACION,
  ELIMINAR_NOTIFICACION,
} from "../graphql/documento";

// ─── TIPOS ───────────────────────────────────────────────

interface TipoDoc {
  idTipoDoc: number;
  codigo: string;
  nombre: string;
  requiereFirma: boolean;
  esPublico: boolean;
  descripcion?: string;
}

interface Expediente {
  idExpediente: number;
  numeroExpediente: string;
  ano: number;
  idEstadoExpediente?: { nombreEstado: string };
}

interface Persona {
  idPersona: number;
  nombre: string;
  primerApellido: string;
}

interface Documento {
  idDocumento: number;
  titulo: string;
  fechaPresentacion: string;
  numeroFolio?: number;
  rutaArchivo: string;
  tamanoKb: number;
  esElectronico: boolean;
  firmadoDigitalmente: boolean;
  idExpediente: Expediente;
  idTipoDoc: TipoDoc;
  idPersona?: Persona;
}

interface ParteProcesal {
  idParte: number;
  activo: boolean;
  idPersona: Persona;
  idExpediente: Expediente;
  idRol: { nombreRol: string };
}

interface Notificacion {
  idNotificacion: number;
  tipoNotificacion: string;
  fechaEmision: string;
  fechaDiligencia?: string;
  estadoNotificacion: string;
  idExpediente: Expediente;
  idDocumento: { idDocumento: number; titulo: string };
  idParte: { idParte: number; idPersona: Persona; idRol: { nombreRol: string } };
  usuario: { idUsuario: number; nombres: string; paterno: string };
}

// ─── COLORES ─────────────────────────────────────────────
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

// ─── HELPERS GENÉRICOS ────────────────────────────────────

function Badge({ texto, color }: { texto: string; color: "green" | "red" | "blue" | "yellow" }) {
  const map = {
    green:  { bg: "#1a3d22", fg: C.green },
    red:    { bg: "#3d1a1a", fg: C.red },
    blue:   { bg: "#1c2d3a", fg: C.blue },
    yellow: { bg: "#3d2e1a", fg: C.yellow },
  };
  const { bg, fg } = map[color];
  return (
    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, backgroundColor: bg, color: fg, fontWeight: 500 }}>
      {texto}
    </span>
  );
}

function BoolBadge({ val, si, no }: { val: boolean; si: string; no: string }) {
  return <Badge texto={val ? si : no} color={val ? "green" : "red"} />;
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

const Field = ({
  label, value, onChange, type = "text", placeholder = "", required = false,
}: {
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

const SelectField = ({
  label, value, onChange, options, required = false,
}: {
  label: string; value: string | number; onChange: (v: string) => void;
  options: { value: string | number; label: string }[]; required?: boolean;
}) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 5 }}>
      {label}{required && <span style={{ color: C.red }}> *</span>}
    </label>
    <select
      value={value} onChange={e => onChange(e.target.value)}
      style={{
        width: "100%", padding: "8px 10px", backgroundColor: C.bg,
        border: `1px solid ${C.border}`, borderRadius: 6, color: C.text,
        fontSize: 13, outline: "none",
      }}
    >
      <option value="">— Seleccionar —</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const CheckField = ({
  label, value, onChange,
}: {
  label: string; value: boolean; onChange: (v: boolean) => void;
}) => (
  <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
    <input
      type="checkbox" checked={value} onChange={e => onChange(e.target.checked)}
      style={{ width: 15, height: 15, accentColor: C.blue, cursor: "pointer" }}
    />
    <label style={{ fontSize: 13, color: C.text, cursor: "pointer" }} onClick={() => onChange(!value)}>
      {label}
    </label>
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

function ModalBotones({ onCancel, onSave, guardando, labelSave }: {
  onCancel: () => void; onSave: () => void; guardando?: boolean; labelSave: string;
}) {
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
      <button onClick={onCancel} style={{
        padding: "8px 16px", backgroundColor: "transparent",
        border: `1px solid ${C.border}`, borderRadius: 6,
        color: C.muted, fontSize: 13, cursor: "pointer",
      }}>Cancelar</button>
      <button onClick={onSave} disabled={guardando} style={{
        padding: "8px 16px", backgroundColor: "#238636",
        border: "none", borderRadius: 6,
        color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 500,
        opacity: guardando ? 0.6 : 1,
      }}>{labelSave}</button>
    </div>
  );
}

function ThCell({ label }: { label: string }) {
  return (
    <th style={{ padding: "10px 16px", textAlign: "left", color: C.muted, fontWeight: 500, fontSize: 12 }}>
      {label}
    </th>
  );
}

function AccionBtn({ label, color, onClick }: { label: string; color: "blue" | "red" | "muted"; onClick: () => void }) {
  const map = {
    blue:  { bg: "#1c2d3a", fg: C.blue, border: "#1f4060" },
    red:   { bg: "#3d1a1a", fg: C.red,  border: C.red },
    muted: { bg: "transparent", fg: C.muted, border: C.border },
  };
  const s = map[color];
  return (
    <button onClick={onClick} style={{
      backgroundColor: s.bg, color: s.fg,
      border: `1px solid ${s.border}`, borderRadius: 5,
      padding: "4px 10px", fontSize: 12, cursor: "pointer",
    }}>{label}</button>
  );
}

// ─── SKELETON ────────────────────────────────────────────
function SkeletonRow({ cols }: { cols: number }) {
  return (
    <>
      {[...Array(4)].map((_, i) => (
        <tr key={i} style={{ borderBottom: `1px solid #21262d` }}>
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

function THead({ headers }: { headers: string[] }) {
  return (
    <thead>
      <tr style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: C.bg }}>
        {headers.map(h => <ThCell key={h} label={h} />)}
      </tr>
    </thead>
  );
}

// ─── SECCIÓN: TIPO DOC ───────────────────────────────────

const initTipoDoc = { codigo: "", nombre: "", descripcion: "", requiereFirma: false, esPublico: true };

function TiposDocTab() {
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<TipoDoc | null>(null);
  const [form, setForm] = useState(initTipoDoc);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");

  const { data, loading, refetch } = useQuery(GET_TIPOS_DOC);
  const [crearTipoDoc]      = useMutation(CREAR_TIPO_DOC);
  const [actualizarTipoDoc] = useMutation(ACTUALIZAR_TIPO_DOC);
  const [eliminarTipoDoc]   = useMutation(ELIMINAR_TIPO_DOC);

  const tipos: TipoDoc[] = data?.allTiposDoc ?? [];
  const filtrados = tipos.filter(t =>
    `${t.codigo} ${t.nombre} ${t.descripcion ?? ""}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirCrear = () => { setEditando(null); setForm(initTipoDoc); setError(""); setModal(true); };
  const abrirEditar = (t: TipoDoc) => {
    setEditando(t);
    setForm({ codigo: t.codigo, nombre: t.nombre, descripcion: t.descripcion ?? "", requiereFirma: t.requiereFirma, esPublico: t.esPublico });
    setError(""); setModal(true);
  };
  const cerrar = () => { setModal(false); setEditando(null); };

  const guardar = async () => {
    if (!form.codigo || !form.nombre) { setError("Código y nombre son obligatorios."); return; }
    try {
      if (editando) {
        await actualizarTipoDoc({
          variables: {
            id: Number(editando.idTipoDoc),
            input: { codigo: form.codigo, nombre: form.nombre, descripcion: form.descripcion || undefined, requiereFirma: form.requiereFirma, esPublico: form.esPublico },
          },
        });
      } else {
        await crearTipoDoc({
          variables: {
            codigo: form.codigo, nombre: form.nombre,
            descripcion: form.descripcion || undefined,
            requiereFirma: form.requiereFirma, esPublico: form.esPublico,
          },
        });
      }
      await refetch(); cerrar();
    } catch (e: any) { setError(e.message ?? "Error al guardar."); }
  };

  // TiposDocTab
  const eliminar = async (id: number) => {
    if (!window.confirm("¿Eliminar este tipo de documento?")) return;
    try {
      const { data } = await eliminarTipoDoc({ variables: { id: Number(id) } }); // ← Number()
      if (!data?.eliminarTipoDoc?.ok) {
        alert(data?.eliminarTipoDoc?.mensaje ?? "No se pudo eliminar el tipo de documento.");
        return;
      }
      refetch();
    } catch (e: any) {
      alert("Error al eliminar: " + (e.message ?? "Error desconocido"));
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <input
          placeholder="Buscar por código o nombre..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          style={{ width: 280, padding: "8px 12px", backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 13, outline: "none" }}
        />
        <button onClick={abrirCrear} style={{ backgroundColor: "#238636", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
          + Nuevo tipo
        </button>
      </div>

      <TablaWrapper>
        <THead headers={["Código", "Nombre", "Requiere firma", "Público", "Descripción", "Acciones"]} />
        <tbody>
          {loading ? <SkeletonRow cols={6} /> : filtrados.length === 0 ? (
            <tr><td colSpan={6} style={{ padding: "32px 16px", textAlign: "center", color: C.muted }}>No hay tipos de documento</td></tr>
          ) : filtrados.map((t, i) => (
            <tr key={t.idTipoDoc}
              style={{ borderBottom: i < filtrados.length - 1 ? `1px solid #21262d` : "none" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.row)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <td style={{ padding: "12px 16px", fontFamily: "monospace", color: C.blue }}>{t.codigo}</td>
              <td style={{ padding: "12px 16px", fontWeight: 500 }}>{t.nombre}</td>
              <td style={{ padding: "12px 16px" }}><BoolBadge val={t.requiereFirma} si="Sí" no="No" /></td>
              <td style={{ padding: "12px 16px" }}><BoolBadge val={t.esPublico} si="Público" no="Privado" /></td>
              <td style={{ padding: "12px 16px", color: C.muted, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.descripcion ?? "—"}</td>
              <td style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <AccionBtn label="Editar" color="blue" onClick={() => abrirEditar(t)} />
                  <AccionBtn label="Eliminar" color="muted" onClick={() => eliminar(Number(t.idTipoDoc))} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </TablaWrapper>

      <div style={{ marginTop: 10, fontSize: 12, color: C.muted }}>{filtrados.length} tipo{filtrados.length !== 1 ? "s" : ""}</div>

      {modal && (
        <Modal onClose={cerrar}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: C.text }}>
            {editando ? "Editar tipo de documento" : "Nuevo tipo de documento"}
          </h2>
          <Field label="Código" value={form.codigo} onChange={v => setForm(p => ({ ...p, codigo: v }))} required />
          <Field label="Nombre" value={form.nombre} onChange={v => setForm(p => ({ ...p, nombre: v }))} required />
          <Field label="Descripción" value={form.descripcion} onChange={v => setForm(p => ({ ...p, descripcion: v }))} />
          <CheckField label="Requiere firma" value={form.requiereFirma} onChange={v => setForm(p => ({ ...p, requiereFirma: v }))} />
          <CheckField label="Es público" value={form.esPublico} onChange={v => setForm(p => ({ ...p, esPublico: v }))} />
          <ErrorBox msg={error} />
          <ModalBotones onCancel={cerrar} onSave={guardar} labelSave={editando ? "Guardar cambios" : "Crear tipo"} />
        </Modal>
      )}
    </div>
  );
}

// ─── SECCIÓN: DOCUMENTOS ─────────────────────────────────

const initDoc = { titulo: "", idExpediente: "", idTipoDoc: "", numeroFolio: "", rutaArchivo: "", tamanoKb: "" };

function DocumentosTab() {
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Documento | null>(null);
  const [form, setForm] = useState(initDoc);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");

  const { data, loading, refetch }  = useQuery(GET_DOCUMENTOS);
  const { data: dataExp }           = useQuery(GET_EXPEDIENTES_SIMPLE);
  const { data: dataTipo }          = useQuery(GET_TIPOS_DOC);
  const [crearDocumento]      = useMutation(CREAR_DOCUMENTO);
  const [actualizarDocumento] = useMutation(ACTUALIZAR_DOCUMENTO);
  const [eliminarDocumento]   = useMutation(ELIMINAR_DOCUMENTO);

  const documentos: Documento[]   = data?.allDocumentos ?? [];
  const expedientes: Expediente[] = dataExp?.allExpedientes ?? [];
  const tipos: TipoDoc[]          = dataTipo?.allTiposDoc ?? [];

  const filtrados = documentos.filter(d =>
    `${d.titulo} ${d.idExpediente?.numeroExpediente ?? ""} ${d.idTipoDoc?.nombre ?? ""}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirCrear = () => { setEditando(null); setForm(initDoc); setError(""); setModal(true); };
  const abrirEditar = (d: Documento) => {
    setEditando(d);
    setForm({
      titulo: d.titulo,
      idExpediente: String(d.idExpediente?.idExpediente ?? ""),
      idTipoDoc: String(d.idTipoDoc?.idTipoDoc ?? ""),
      numeroFolio: d.numeroFolio != null ? String(d.numeroFolio) : "",
      rutaArchivo: d.rutaArchivo ?? "",
      tamanoKb: String(d.tamanoKb ?? ""),
    });
    setError(""); setModal(true);
  };
  const cerrar = () => { setModal(false); setEditando(null); };

  const guardar = async () => {
    if (!form.titulo || !form.idExpediente || !form.idTipoDoc) {
      setError("Título, expediente y tipo de documento son obligatorios."); return;
    }
    try {
      if (editando) {
        await actualizarDocumento({
          variables: {
            id: Number(editando.idDocumento),
            input: {
              titulo: form.titulo,
              numeroFolio: form.numeroFolio ? Number(form.numeroFolio) : undefined,
              rutaArchivo: form.rutaArchivo || undefined,
            },
          },
        });
      } else {
        await crearDocumento({
          variables: {
            idExpediente: Number(form.idExpediente),
            idTipoDoc: Number(form.idTipoDoc),
            titulo: form.titulo,
            numeroFolio: form.numeroFolio ? Number(form.numeroFolio) : undefined,
            rutaArchivo: form.rutaArchivo || undefined,
            tamanoKb: form.tamanoKb ? Number(form.tamanoKb) : 0,
          },
        });
      }
      await refetch(); cerrar();
    } catch (e: any) { setError(e.message ?? "Error al guardar."); }
  };

  // DocumentosTab
  const eliminar = async (id: number) => {
    if (!window.confirm("¿Eliminar este documento?")) return;
    try {
      const { data } = await eliminarDocumento({ variables: { id: Number(id) } }); // ← Number()
      if (!data?.eliminarDocumento?.ok) {
        alert(data?.eliminarDocumento?.mensaje ?? "No se pudo eliminar el documento.");
        return;
      }
      refetch();
    } catch (e: any) {
      alert("Error al eliminar: " + (e.message ?? "Error desconocido"));
    }
  };

  const fmtFecha = (iso?: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-BO", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <input
          placeholder="Buscar por título, expediente o tipo..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          style={{ width: 320, padding: "8px 12px", backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 13, outline: "none" }}
        />
        <button onClick={abrirCrear} style={{ backgroundColor: "#238636", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
          + Nuevo documento
        </button>
      </div>

      <TablaWrapper>
        <THead headers={["Título", "Expediente", "Tipo", "Folio", "Fecha", "Electrónico", "Firmado", "Acciones"]} />
        <tbody>
          {loading ? <SkeletonRow cols={8} /> : filtrados.length === 0 ? (
            <tr><td colSpan={8} style={{ padding: "32px 16px", textAlign: "center", color: C.muted }}>No hay documentos</td></tr>
          ) : filtrados.map((d, i) => (
            <tr key={d.idDocumento}
              style={{ borderBottom: i < filtrados.length - 1 ? `1px solid #21262d` : "none" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.row)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <td style={{ padding: "12px 16px", fontWeight: 500, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.titulo}</td>
              <td style={{ padding: "12px 16px" }}>
                <span style={{ color: C.blue, fontFamily: "monospace", fontSize: 12 }}>
                  {d.idExpediente?.numeroExpediente ?? "—"}
                </span>
              </td>
              <td style={{ padding: "12px 16px" }}>
                <span style={{ backgroundColor: "#1c2d3a", color: C.blue, fontSize: 11, padding: "2px 8px", borderRadius: 4 }}>
                  {d.idTipoDoc?.nombre ?? "—"}
                </span>
              </td>
              <td style={{ padding: "12px 16px", color: C.muted }}>{d.numeroFolio ?? "—"}</td>
              <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>{fmtFecha(d.fechaPresentacion)}</td>
              <td style={{ padding: "12px 16px" }}><BoolBadge val={d.esElectronico} si="Sí" no="No" /></td>
              <td style={{ padding: "12px 16px" }}><BoolBadge val={d.firmadoDigitalmente} si="Firmado" no="Sin firma" /></td>
              <td style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <AccionBtn label="Editar" color="blue" onClick={() => abrirEditar(d)} />
                  <AccionBtn label="Eliminar" color="muted" onClick={() => eliminar(Number(d.idDocumento))} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </TablaWrapper>

      <div style={{ marginTop: 10, fontSize: 12, color: C.muted }}>{filtrados.length} documento{filtrados.length !== 1 ? "s" : ""}</div>

      {modal && (
        <Modal onClose={cerrar} ancho={500}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: C.text }}>
            {editando ? "Editar documento" : "Nuevo documento"}
          </h2>
          <Field label="Título" value={form.titulo} onChange={v => setForm(p => ({ ...p, titulo: v }))} required />

          {!editando && (
            <>
              <SelectField
                label="Expediente"
                value={form.idExpediente}
                onChange={v => setForm(p => ({ ...p, idExpediente: v }))}
                options={expedientes.map(e => ({ value: e.idExpediente, label: `${e.numeroExpediente} (${e.ano})` }))}
                required
              />
              <SelectField
                label="Tipo de documento"
                value={form.idTipoDoc}
                onChange={v => setForm(p => ({ ...p, idTipoDoc: v }))}
                options={tipos.map(t => ({ value: t.idTipoDoc, label: `${t.codigo} - ${t.nombre}` }))}
                required
              />
              <Field label="Tamaño (KB)" value={form.tamanoKb} onChange={v => setForm(p => ({ ...p, tamanoKb: v }))} type="number" />
            </>
          )}

          <Field label="Número de folio" value={form.numeroFolio} onChange={v => setForm(p => ({ ...p, numeroFolio: v }))} type="number" />
          <Field label="Ruta / URL del archivo" value={form.rutaArchivo} onChange={v => setForm(p => ({ ...p, rutaArchivo: v }))} placeholder="ej: /docs/archivo.pdf" />
          <ErrorBox msg={error} />
          <ModalBotones onCancel={cerrar} onSave={guardar} labelSave={editando ? "Guardar cambios" : "Crear documento"} />
        </Modal>
      )}
    </div>
  );
}

// ─── SECCIÓN: NOTIFICACIONES ─────────────────────────────

const TIPO_NOTIF_OPTS = [
  { value: "CEDULA",      label: "Cédula" },
  { value: "ELECTRONICA", label: "Electrónica" },
  { value: "PERSONAL",    label: "Personal" },
  { value: "PUERTA",      label: "Puerta" },
];

const ESTADO_NOTIF_OPTS = [
  { value: "PENDIENTE",    label: "Pendiente" },
  { value: "DILIGENCIADA", label: "Diligenciada" },
  { value: "FALLIDA",      label: "Fallida" },
];

const estadoNotifColor = (e: string): "yellow" | "green" | "red" | "blue" => {
  if (e === "PENDIENTE")    return "yellow";
  if (e === "DILIGENCIADA") return "green";
  if (e === "FALLIDA")      return "red";
  return "blue";
};

const initNotif = { idExpediente: "", idDocumento: "", idParte: "", idUsuario: "", tipoNotificacion: "", estadoNotificacion: "PENDIENTE", fechaDiligencia: "" };

function NotificacionesTab() {
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Notificacion | null>(null);
  const [form, setForm] = useState(initNotif);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");

  const { data, loading, refetch } = useQuery(GET_NOTIFICACIONES);
  const { data: dataExp }          = useQuery(GET_EXPEDIENTES_SIMPLE);
  const { data: dataDoc }          = useQuery(GET_DOCUMENTOS);
  const { data: dataParte }        = useQuery(GET_PARTES_PROCESALES);

  const [crearNotificacion]      = useMutation(CREAR_NOTIFICACION);
  const [actualizarNotificacion] = useMutation(ACTUALIZAR_NOTIFICACION);
  const [eliminarNotificacion]   = useMutation(ELIMINAR_NOTIFICACION);

  const notificaciones: Notificacion[] = data?.allNotificaciones ?? [];
  const expedientes: Expediente[]      = dataExp?.allExpedientes ?? [];
  const documentos: Documento[]        = dataDoc?.allDocumentos ?? [];
  const partes: ParteProcesal[]        = dataParte?.allPartesProcesales ?? [];

  const partesDelExp = form.idExpediente
    ? partes.filter(p => String(p.idExpediente?.idExpediente) === form.idExpediente)
    : partes;

  const docsDelExp = form.idExpediente
    ? documentos.filter(d => String(d.idExpediente?.idExpediente) === form.idExpediente)
    : documentos;

  const filtrados = notificaciones.filter(n =>
    `${n.idExpediente?.numeroExpediente ?? ""} ${n.tipoNotificacion} ${n.estadoNotificacion} ${n.idParte?.idPersona?.nombre ?? ""} ${n.idParte?.idPersona?.primerApellido ?? ""}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirCrear = () => { setEditando(null); setForm(initNotif); setError(""); setModal(true); };
  const abrirEditar = (n: Notificacion) => {
    setEditando(n);
    setForm({
      idExpediente: String(n.idExpediente?.idExpediente ?? ""),
      idDocumento: String(n.idDocumento?.idDocumento ?? ""),
      idParte: String(n.idParte?.idParte ?? ""),
      idUsuario: String(n.usuario?.idUsuario ?? ""),
      tipoNotificacion: n.tipoNotificacion,
      estadoNotificacion: n.estadoNotificacion,
      fechaDiligencia: n.fechaDiligencia ? n.fechaDiligencia.substring(0, 16) : "",
    });
    setError(""); setModal(true);
  };
  const cerrar = () => { setModal(false); setEditando(null); };

  const guardar = async () => {
    if (!editando && (!form.idExpediente || !form.idDocumento || !form.idParte || !form.idUsuario || !form.tipoNotificacion)) {
      setError("Todos los campos marcados son obligatorios."); return;
    }
    try {
      if (editando) {
        await actualizarNotificacion({
          variables: {
            id: Number(editando.idNotificacion),
            input: {
              estadoNotificacion: form.estadoNotificacion,
              fechaDiligencia: form.fechaDiligencia || undefined,
            },
          },
        });
      } else {
        await crearNotificacion({
          variables: {
            idExpediente: Number(form.idExpediente),
            idDocumento: Number(form.idDocumento),
            idParte: Number(form.idParte),
            idUsuario: Number(form.idUsuario),
            tipoNotificacion: form.tipoNotificacion,
          },
        });
      }
      await refetch(); cerrar();
    } catch (e: any) { setError(e.message ?? "Error al guardar."); }
  };

  // NotificacionesTab
  const eliminar = async (id: number) => {
    if (!window.confirm("¿Eliminar esta notificación?")) return;
    try {
      const { data } = await eliminarNotificacion({ variables: { id: Number(id) } }); // ← Number()
      if (!data?.eliminarNotificacion?.ok) {
        alert(data?.eliminarNotificacion?.mensaje ?? "No se pudo eliminar la notificación.");
        return;
      }
      refetch();
    } catch (e: any) {
      alert("Error al eliminar: " + (e.message ?? "Error desconocido"));
    }
  };
  const fmtFecha = (iso?: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-BO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <input
          placeholder="Buscar por expediente, tipo, estado..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          style={{ width: 320, padding: "8px 12px", backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 13, outline: "none" }}
        />
        <button onClick={abrirCrear} style={{ backgroundColor: "#238636", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
          + Nueva notificación
        </button>
      </div>

      <TablaWrapper>
        <THead headers={["Expediente", "Documento", "Parte", "Tipo", "Estado", "Emitida", "Diligenciada", "Acciones"]} />
        <tbody>
          {loading ? <SkeletonRow cols={8} /> : filtrados.length === 0 ? (
            <tr><td colSpan={8} style={{ padding: "32px 16px", textAlign: "center", color: C.muted }}>No hay notificaciones</td></tr>
          ) : filtrados.map((n, i) => (
            <tr key={n.idNotificacion}
              style={{ borderBottom: i < filtrados.length - 1 ? `1px solid #21262d` : "none" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.row)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <td style={{ padding: "12px 16px" }}>
                <span style={{ color: C.blue, fontFamily: "monospace", fontSize: 12 }}>
                  {n.idExpediente?.numeroExpediente ?? "—"}
                </span>
              </td>
              <td style={{ padding: "12px 16px", color: C.muted, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {n.idDocumento?.titulo ?? "—"}
              </td>
              <td style={{ padding: "12px 16px", fontSize: 12 }}>
                {n.idParte?.idPersona ? `${n.idParte.idPersona.nombre} ${n.idParte.idPersona.primerApellido}` : "—"}
                {n.idParte?.idRol && <div style={{ color: C.muted, fontSize: 11 }}>{n.idParte.idRol.nombreRol}</div>}
              </td>
              <td style={{ padding: "12px 16px" }}>
                <Badge texto={n.tipoNotificacion} color="blue" />
              </td>
              <td style={{ padding: "12px 16px" }}>
                <Badge texto={n.estadoNotificacion} color={estadoNotifColor(n.estadoNotificacion)} />
              </td>
              <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>{fmtFecha(n.fechaEmision)}</td>
              <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>{fmtFecha(n.fechaDiligencia)}</td>
              <td style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <AccionBtn label="Editar" color="blue" onClick={() => abrirEditar(n)} />
                  <AccionBtn label="Eliminar" color="muted" onClick={() => eliminar(Number(n.idNotificacion))} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </TablaWrapper>

      <div style={{ marginTop: 10, fontSize: 12, color: C.muted }}>{filtrados.length} notificación{filtrados.length !== 1 ? "es" : ""}</div>

      {modal && (
        <Modal onClose={cerrar} ancho={520}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: C.text }}>
            {editando ? "Editar notificación" : "Nueva notificación"}
          </h2>

          {!editando ? (
            <>
              <SelectField
                label="Expediente"
                value={form.idExpediente}
                onChange={v => setForm(p => ({ ...p, idExpediente: v, idDocumento: "", idParte: "" }))}
                options={expedientes.map(e => ({ value: e.idExpediente, label: `${e.numeroExpediente} (${e.ano})` }))}
                required
              />
              <SelectField
                label="Documento"
                value={form.idDocumento}
                onChange={v => setForm(p => ({ ...p, idDocumento: v }))}
                options={docsDelExp.map(d => ({ value: d.idDocumento, label: d.titulo }))}
                required
              />
              <SelectField
                label="Parte procesal"
                value={form.idParte}
                onChange={v => setForm(p => ({ ...p, idParte: v }))}
                options={partesDelExp.map(p => ({ value: p.idParte, label: `${p.idPersona.nombre} ${p.idPersona.primerApellido} (${p.idRol.nombreRol})` }))}
                required
              />
              <Field
                label="ID Usuario responsable"
                value={form.idUsuario}
                onChange={v => setForm(p => ({ ...p, idUsuario: v }))}
                type="number"
                required
              />
              <SelectField
                label="Tipo de notificación"
                value={form.tipoNotificacion}
                onChange={v => setForm(p => ({ ...p, tipoNotificacion: v }))}
                options={TIPO_NOTIF_OPTS}
                required
              />
            </>
          ) : (
            <>
              <SelectField
                label="Estado"
                value={form.estadoNotificacion}
                onChange={v => setForm(p => ({ ...p, estadoNotificacion: v }))}
                options={ESTADO_NOTIF_OPTS}
                required
              />
              <Field
                label="Fecha de diligencia"
                value={form.fechaDiligencia}
                onChange={v => setForm(p => ({ ...p, fechaDiligencia: v }))}
                type="datetime-local"
              />
            </>
          )}

          <ErrorBox msg={error} />
          <ModalBotones onCancel={cerrar} onSave={guardar} labelSave={editando ? "Guardar cambios" : "Crear notificación"} />
        </Modal>
      )}
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ────────────────────────────────────

type Tab = "documentos" | "tipos" | "notificaciones";

const TABS: { id: Tab; label: string; icono: string }[] = [
  { id: "documentos",     label: "Documentos",         icono: "📄" },
  { id: "tipos",          label: "Tipos de documento",  icono: "🗂️" },
  { id: "notificaciones", label: "Notificaciones",      icono: "🔔" },
];

export default function DocumentosPage() {
  const [tabActiva, setTabActiva] = useState<Tab>("documentos");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg, color: C.text, padding: "28px 32px" }}>

      {/* Encabezado */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Gestión Documental</h1>
        <p style={{ fontSize: 13, color: C.muted }}>Documentos, tipos y notificaciones del sistema</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
        {TABS.map(tab => {
          const activa = tabActiva === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTabActiva(tab.id)}
              style={{
                padding: "9px 18px",
                backgroundColor: "transparent",
                border: "none",
                borderBottom: activa ? `2px solid ${C.blue}` : "2px solid transparent",
                color: activa ? C.blue : C.muted,
                fontSize: 13,
                fontWeight: activa ? 600 : 400,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "color 0.15s",
                marginBottom: -1,
              }}
            >
              <span>{tab.icono}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Contenido del tab */}
      {tabActiva === "documentos"     && <DocumentosTab />}
      {tabActiva === "tipos"          && <TiposDocTab />}
      {tabActiva === "notificaciones" && <NotificacionesTab />}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}