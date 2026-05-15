import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_RESOLUCIONES,
  GET_TIPOS_RESOLUCION,
  GET_TIPOS_RECURSO,
  GET_RECURSOS,
  GET_EXPEDIENTES_SIMPLE,
  GET_PARTES_PROCESALES_SIMPLE,
  CREAR_RESOLUCION,
  ACTUALIZAR_RESOLUCION,
  ELIMINAR_RESOLUCION,
  CREAR_TIPO_RESOLUCION,
  ACTUALIZAR_TIPO_RESOLUCION,
  ELIMINAR_TIPO_RESOLUCION,
  CREAR_TIPO_RECURSO,
  ACTUALIZAR_TIPO_RECURSO,
  ELIMINAR_TIPO_RECURSO,
  CREAR_RECURSO,
  ACTUALIZAR_RECURSO,
  ELIMINAR_RECURSO,
} from "../graphql/resoluciones";

// ─── PALETA ──────────────────────────────────────────────
const C = {
  bg: "#0d1117",
  card: "#161b22",
  border: "#30363d",
  borderLight: "#21262d",
  text: "#e6edf3",
  muted: "#8b949e",
  blue: "#58a6ff",
  green: "#3fb950",
  red: "#f85149",
  yellow: "#d29922",
  purple: "#bc8cff",
  orange: "#e3b341",
};

const ESTADO_RES_COLORS: Record<string, { bg: string; color: string }> = {
  ACTIVA:  { bg: "#1a3d22", color: C.green },
  APELADA: { bg: "#1c2d3a", color: C.blue },
  ANULADA: { bg: "#3d1a1a", color: C.red },
  FIRME:   { bg: "#2a1f3d", color: C.purple },
};

const ESTADO_REC_COLORS: Record<string, { bg: string; color: string }> = {
  PENDIENTE: { bg: "#3d2a1a", color: C.orange },
  ADMITIDO:  { bg: "#1c2d3a", color: C.blue },
  RECHAZADO: { bg: "#3d1a1a", color: C.red },
  RESUELTO:  { bg: "#1a3d22", color: C.green },
};

const EstadoBadge = ({ estado, mapa }: { estado: string; mapa: Record<string, { bg: string; color: string }> }) => {
  const style = mapa[estado] ?? { bg: "#21262d", color: C.muted };
  return (
    <span style={{
      fontSize: 11, padding: "2px 9px", borderRadius: 4,
      backgroundColor: style.bg, color: style.color, fontWeight: 600,
    }}>
      {estado}
    </span>
  );
};

// ─── COMPONENTES BASE ─────────────────────────────────────
function Modal({ children, onClose, width = 560 }: {
  children: React.ReactNode; onClose: () => void; width?: number;
}) {
  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.65)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        backgroundColor: C.card, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: 28, width, maxHeight: "90vh", overflowY: "auto",
      }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

const Field = ({ label, value, onChange, type = "text", placeholder = "" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 5 }}>{label}</label>
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

const SelectField = ({ label, value, onChange, children }: {
  label: string; value: string | number; onChange: (v: string) => void; children: React.ReactNode;
}) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 5 }}>{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{
        width: "100%", padding: "8px 10px", backgroundColor: C.bg,
        border: `1px solid ${C.border}`, borderRadius: 6, color: C.text,
        fontSize: 13, outline: "none", boxSizing: "border-box",
      }}>
      {children}
    </select>
  </div>
);

const TextareaField = ({ label, value, onChange, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number;
}) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 5 }}>{label}</label>
    <textarea value={value} rows={rows} onChange={e => onChange(e.target.value)}
      style={{
        width: "100%", padding: "8px 10px", backgroundColor: C.bg,
        border: `1px solid ${C.border}`, borderRadius: 6, color: C.text,
        fontSize: 13, outline: "none", boxSizing: "border-box", resize: "vertical",
      }}
    />
  </div>
);

const Tabla = ({ headers, children, loading, emptyMsg }: {
  headers: string[]; children: React.ReactNode; loading: boolean; emptyMsg: string;
}) => (
  <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: C.bg }}>
          {headers.map(h => (
            <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: C.muted, fontWeight: 500, fontSize: 12 }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {loading
          ? [...Array(3)].map((_, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                {[...Array(headers.length)].map((_, j) => (
                  <td key={j} style={{ padding: "12px 16px" }}>
                    <div style={{ height: 12, backgroundColor: C.borderLight, borderRadius: 4, animation: "pulse 1.5s infinite" }} />
                  </td>
                ))}
              </tr>
            ))
          : !(children as any[])?.length
            ? <tr><td colSpan={headers.length} style={{ padding: "32px 16px", textAlign: "center", color: C.muted }}>{emptyMsg}</td></tr>
            : children}
      </tbody>
    </table>
  </div>
);

const ActionBtn = ({ onClick, color, label }: { onClick: () => void; color: string; label: string }) => (
  <button onClick={onClick} style={{
    backgroundColor: "transparent", color, border: `1px solid ${color}`,
    borderRadius: 5, padding: "4px 10px", fontSize: 12, cursor: "pointer",
  }}>{label}</button>
);

const ErrorBox = ({ msg }: { msg: string }) =>
  msg ? (
    <div style={{
      backgroundColor: "#3d1a1a", border: `1px solid ${C.red}`,
      borderRadius: 6, padding: "8px 12px", fontSize: 12, color: C.red, marginBottom: 14,
    }}>{msg}</div>
  ) : null;

const ModalFooter = ({ onCancel, onSave, saveLabel }: {
  onCancel: () => void; onSave: () => void; saveLabel: string;
}) => (
  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
    <button onClick={onCancel} style={{
      padding: "8px 16px", backgroundColor: "transparent",
      border: `1px solid ${C.border}`, borderRadius: 6, color: C.muted, fontSize: 13, cursor: "pointer",
    }}>Cancelar</button>
    <button onClick={onSave} style={{
      padding: "8px 16px", backgroundColor: "#238636", border: "none",
      borderRadius: 6, color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 500,
    }}>{saveLabel}</button>
  </div>
);

// ─── TIPOS ───────────────────────────────────────────────
interface Expediente { idExpediente: number; numeroExpediente: string; ano: number; }
interface TipoResolucion { idTipoRes: number; codigo: string; nombre: string; nivelJerarquico: number; descripcion?: string; }
interface TipoRecurso { idTipoRecurso: number; nombre: string; descripcion: string; }
interface Resolucion {
  idResolucion: number;
  numeroResolucion: string;
  fechaResolucion: string;
  fechaNotificacion?: string;
  parteDispositiva: string;
  fundamentacion: string;
  estado: string;
  esRecurrible: boolean;
  plazoRecursoDias: number;
  idExpediente: { idExpediente: number; numeroExpediente: string; ano: number; };
  idTipoRes: { idTipoRes: number; codigo: string; nombre: string; nivelJerarquico: number; };
  idDocumento?: { idDocumento: number; titulo: string; };
}
interface Recurso {
  idRecurso: number;
  fechaInterposicion: string;
  estadoRecurso: string;
  fundamentos: string;
  idResolucionImpugnada: { idResolucion: number; numeroResolucion: string; idExpediente: { numeroExpediente: string; } };
  idTipoRecurso: { idTipoRecurso: number; nombre: string; };
  idRecurrente: { idParte: number; idPersona: { nombre: string; primerApellido: string; }; idRol: { nombreRol: string; } };
  idExpedienteAlzada?: { idExpediente: number; numeroExpediente: string; };
  idResolucionRespuesta?: { idResolucion: number; numeroResolucion: string; };
}
interface ParteProcesal { idParte: number; idPersona: { nombre: string; primerApellido: string; }; idExpediente: { idExpediente: number; numeroExpediente: string; }; idRol: { nombreRol: string; }; activo: boolean; }

const fmt = (d?: string) => d ? new Date(d).toLocaleDateString("es-BO") : "—";

// ════════════════════════════════════════════════════════
// TAB: RESOLUCIONES
// ════════════════════════════════════════════════════════
function TabResoluciones() {
  const { data, loading, refetch } = useQuery(GET_RESOLUCIONES);
  const { data: dExp }  = useQuery(GET_EXPEDIENTES_SIMPLE);
  const { data: dTipo } = useQuery(GET_TIPOS_RESOLUCION);

  const [crear]      = useMutation(CREAR_RESOLUCION);
  const [actualizar] = useMutation(ACTUALIZAR_RESOLUCION);
  const [eliminar_m] = useMutation(ELIMINAR_RESOLUCION);

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<Resolucion | null>(null);
  const [err, setErr]       = useState("");
  const [busqueda, setBusq] = useState("");

  const initForm = {
    idExpediente: 0, idTipoRes: 0, numeroResolucion: "", fechaResolucion: "",
    parteDispositiva: "", fundamentacion: "", estado: "ACTIVA",
    esRecurrible: false, plazoRecursoDias: "0",
  };
  const [form, setForm] = useState(initForm);
  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const resoluciones: Resolucion[] = data?.allResoluciones ?? [];
  const expedientes: Expediente[]  = dExp?.allExpedientes ?? [];
  const tipos: TipoResolucion[]    = dTipo?.allTiposResolucion ?? [];

  const filtradas = resoluciones.filter(r =>
    `${r.numeroResolucion} ${r.idExpediente.numeroExpediente} ${r.idTipoRes.nombre} ${r.estado}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirCrear = () => { setEdit(null); setForm(initForm); setErr(""); setModal(true); };
  const abrirEditar = (r: Resolucion) => {
    setEdit(r);
    setForm({
      idExpediente: r.idExpediente.idExpediente,
      idTipoRes: r.idTipoRes.idTipoRes,
      numeroResolucion: r.numeroResolucion,
      fechaResolucion: r.fechaResolucion,
      parteDispositiva: r.parteDispositiva,
      fundamentacion: r.fundamentacion,
      estado: r.estado,
      esRecurrible: r.esRecurrible,
      plazoRecursoDias: String(r.plazoRecursoDias),
    });
    setErr(""); setModal(true);
  };

  const guardar = async () => {
    if (!form.numeroResolucion || !form.fechaResolucion || !form.parteDispositiva) {
      setErr("Número, fecha y parte dispositiva son obligatorios."); return;
    }
    try {
      if (editando) {
        await actualizar({ variables: { id: Number(editando.idResolucion), input: {
          idTipoRes: Number(form.idTipoRes) || undefined,
          numeroResolucion: form.numeroResolucion,
          fechaResolucion: form.fechaResolucion,
          parteDispositiva: form.parteDispositiva,
          fundamentacion: form.fundamentacion || undefined,
          estado: form.estado,
          esRecurrible: form.esRecurrible,
          plazoRecursoDias: Number(form.plazoRecursoDias),
        }}});
      } else {
        if (!form.idExpediente || !form.idTipoRes) { setErr("Expediente y tipo de resolución son obligatorios."); return; }
        await crear({ variables: { input: {
          idExpediente: Number(form.idExpediente),
          idTipoRes: Number(form.idTipoRes),
          numeroResolucion: form.numeroResolucion,
          fechaResolucion: form.fechaResolucion,
          parteDispositiva: form.parteDispositiva,
          fundamentacion: form.fundamentacion || undefined,
        }}});
      }
      await refetch(); setModal(false);
    } catch (e: any) { setErr(e.message ?? "Error al guardar."); }
  };

  // ── ELIMINAR RESOLUCIÓN ──────────────────────────────────
  const eliminar = async (id: number) => {
    if (!window.confirm("¿Eliminar esta resolución?")) return;
    const { data } = await eliminar_m({ variables: { id: Number(id) } });
    if (!data?.eliminarResolucion?.ok) {
      alert(data?.eliminarResolucion?.mensaje ?? "No se pudo eliminar la resolución.");
      return;
    }
    refetch();
  };

  const nivelLabel = (n: number) => ["", "★ Primera", "★★ Segunda", "★★★ Tercera"][n] ?? `Nivel ${n}`;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <input
          placeholder="Buscar por número, expediente, tipo o estado..."
          value={busqueda} onChange={e => setBusq(e.target.value)}
          style={{
            width: 320, padding: "8px 12px", backgroundColor: C.card,
            border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 13, outline: "none",
          }}
        />
        <button onClick={abrirCrear} style={{
          backgroundColor: "#238636", color: "#fff", border: "none",
          borderRadius: 6, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 500,
        }}>+ Nueva resolución</button>
      </div>

      <Tabla
        headers={["N° Resolución", "Expediente", "Tipo", "Fecha", "Estado", "Recurrible", "Parte dispositiva", "Acciones"]}
        loading={loading} emptyMsg="No hay resoluciones registradas"
      >
        {filtradas.map((r, i) => (
          <tr key={r.idResolucion}
            style={{ borderBottom: i < filtradas.length - 1 ? `1px solid ${C.borderLight}` : "none" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#1c2128")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <td style={{ padding: "12px 16px" }}>
              <span style={{ fontFamily: "monospace", color: C.text, fontWeight: 600 }}>{r.numeroResolucion}</span>
            </td>
            <td style={{ padding: "12px 16px" }}>
              <span style={{ color: C.blue }}>#{r.idExpediente.numeroExpediente}</span>
              <span style={{ fontSize: 11, color: C.muted, marginLeft: 5 }}>{r.idExpediente.ano}</span>
            </td>
            <td style={{ padding: "12px 16px" }}>
              <div style={{ fontSize: 12, color: C.text }}>{r.idTipoRes.nombre}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{nivelLabel(r.idTipoRes.nivelJerarquico)}</div>
            </td>
            <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>{fmt(r.fechaResolucion)}</td>
            <td style={{ padding: "12px 16px" }}><EstadoBadge estado={r.estado} mapa={ESTADO_RES_COLORS} /></td>
            <td style={{ padding: "12px 16px" }}>
              {r.esRecurrible
                ? <span style={{ color: C.yellow, fontSize: 12 }}>⚠ Sí ({r.plazoRecursoDias}d)</span>
                : <span style={{ color: C.muted, fontSize: 12 }}>No</span>}
            </td>
            <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12, maxWidth: 200 }}>
              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.parteDispositiva}
              </div>
            </td>
            <td style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", gap: 6 }}>
                <ActionBtn onClick={() => abrirEditar(r)} color={C.blue} label="Editar" />
                <ActionBtn onClick={() => eliminar(Number(r.idResolucion))} color={C.red} label="Eliminar" />
              </div>
            </td>
          </tr>
        ))}
      </Tabla>

      <div style={{ marginTop: 10, fontSize: 12, color: C.muted }}>
        {filtradas.length} resolución{filtradas.length !== 1 ? "es" : ""}
      </div>

      {modal && (
        <Modal onClose={() => setModal(false)} width={600}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: C.text }}>
            {editando ? "Editar resolución" : "Nueva resolución"}
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              {!editando && (
                <SelectField label="Expediente *" value={form.idExpediente} onChange={f("idExpediente")}>
                  <option value={0}>— Seleccionar expediente —</option>
                  {expedientes.map(e => <option key={e.idExpediente} value={e.idExpediente}>#{e.numeroExpediente} ({e.ano})</option>)}
                </SelectField>
              )}
            </div>
            <SelectField label="Tipo de resolución *" value={form.idTipoRes} onChange={f("idTipoRes")}>
              <option value={0}>— Seleccionar tipo —</option>
              {tipos.map(t => <option key={t.idTipoRes} value={t.idTipoRes}>{t.nombre} ({t.codigo})</option>)}
            </SelectField>
            <Field label="N° de resolución *" value={form.numeroResolucion} onChange={f("numeroResolucion")} placeholder="Ej: RES-2024-001" />
            <Field label="Fecha de resolución *" value={form.fechaResolucion} onChange={f("fechaResolucion")} type="date" />
            {editando && (
              <SelectField label="Estado" value={form.estado} onChange={f("estado")}>
                <option value="ACTIVA">Activa</option>
                <option value="APELADA">Apelada</option>
                <option value="ANULADA">Anulada</option>
                <option value="FIRME">Firme</option>
              </SelectField>
            )}
          </div>

          <TextareaField label="Parte dispositiva *" value={form.parteDispositiva} onChange={f("parteDispositiva")} rows={3} />
          <TextareaField label="Fundamentación" value={form.fundamentacion} onChange={f("fundamentacion")} rows={4} />

          {editando && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px", alignItems: "end" }}>
              <Field label="Plazo de recurso (días)" value={form.plazoRecursoDias} onChange={f("plazoRecursoDias")} type="number" />
              <div style={{ marginBottom: 14, paddingBottom: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.text, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.esRecurrible}
                    onChange={e => setForm(p => ({ ...p, esRecurrible: e.target.checked }))} />
                  Es recurrible
                </label>
              </div>
            </div>
          )}

          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)}
            onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Crear resolución"}
          />
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// TAB: TIPOS DE RESOLUCIÓN
// ════════════════════════════════════════════════════════
function TabTiposResolucion() {
  const { data, loading, refetch } = useQuery(GET_TIPOS_RESOLUCION);
  const [crear]      = useMutation(CREAR_TIPO_RESOLUCION);
  const [actualizar] = useMutation(ACTUALIZAR_TIPO_RESOLUCION);
  const [eliminar_m] = useMutation(ELIMINAR_TIPO_RESOLUCION);

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<TipoResolucion | null>(null);
  const [err, setErr]       = useState("");
  const initForm = { codigo: "", nombre: "", nivelJerarquico: "1", descripcion: "" };
  const [form, setForm] = useState(initForm);
  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const tipos: TipoResolucion[] = data?.allTiposResolucion ?? [];

  const abrirCrear = () => { setEdit(null); setForm(initForm); setErr(""); setModal(true); };
  const abrirEditar = (t: TipoResolucion) => {
    setEdit(t);
    setForm({ codigo: t.codigo, nombre: t.nombre, nivelJerarquico: String(t.nivelJerarquico), descripcion: t.descripcion ?? "" });
    setErr(""); setModal(true);
  };

  const guardar = async () => {
    if (!form.codigo || !form.nombre) { setErr("Código y nombre son obligatorios."); return; }
    try {
      if (editando) {
        await actualizar({ variables: { id: Number(editando.idTipoRes), input: {
          codigo: form.codigo, nombre: form.nombre,
          nivelJerarquico: Number(form.nivelJerarquico),
          descripcion: form.descripcion || undefined,
        }}});
      } else {
        await crear({ variables: { codigo: form.codigo, nombre: form.nombre, nivelJerarquico: Number(form.nivelJerarquico), descripcion: form.descripcion || undefined } });
      }
      await refetch(); setModal(false);
    } catch (e: any) { setErr(e.message ?? "Error."); }
  };

  // ── ELIMINAR TIPO RESOLUCIÓN ─────────────────────────────
  const eliminar = async (id: number) => {
    if (!window.confirm("¿Eliminar este tipo?")) return;
    const { data } = await eliminar_m({ variables: { id: Number(id) } });
    if (!data?.eliminarTipoResolucion?.ok) {
      alert(data?.eliminarTipoResolucion?.mensaje ?? "No se pudo eliminar el tipo de resolución.");
      return;
    }
    refetch();
  };

  const nivelStars = (n: number) => "★".repeat(Math.min(n, 5));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button onClick={abrirCrear} style={{
          backgroundColor: "#238636", color: "#fff", border: "none",
          borderRadius: 6, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 500,
        }}>+ Nuevo tipo</button>
      </div>

      <Tabla headers={["Código", "Nombre", "Nivel jerárquico", "Descripción", "Acciones"]}
        loading={loading} emptyMsg="No hay tipos de resolución">
        {tipos.map((t, i) => (
          <tr key={t.idTipoRes}
            style={{ borderBottom: i < tipos.length - 1 ? `1px solid ${C.borderLight}` : "none" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#1c2128")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <td style={{ padding: "12px 16px" }}>
              <span style={{ fontFamily: "monospace", color: C.purple, backgroundColor: "#2a1f3d", padding: "2px 8px", borderRadius: 4, fontSize: 12 }}>
                {t.codigo}
              </span>
            </td>
            <td style={{ padding: "12px 16px", fontWeight: 500 }}>{t.nombre}</td>
            <td style={{ padding: "12px 16px" }}>
              <span style={{ color: C.yellow, letterSpacing: 2 }}>{nivelStars(t.nivelJerarquico)}</span>
              <span style={{ color: C.muted, fontSize: 11, marginLeft: 6 }}>Nivel {t.nivelJerarquico}</span>
            </td>
            <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>{t.descripcion ?? "—"}</td>
            <td style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", gap: 6 }}>
                <ActionBtn onClick={() => abrirEditar(t)} color={C.blue} label="Editar" />
                <ActionBtn onClick={() => eliminar(Number(t.idTipoRes))} color={C.red} label="Eliminar" />
              </div>
            </td>
          </tr>
        ))}
      </Tabla>

      {modal && (
        <Modal onClose={() => setModal(false)} width={440}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: C.text }}>
            {editando ? "Editar tipo de resolución" : "Nuevo tipo de resolución"}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Field label="Código *" value={form.codigo} onChange={f("codigo")} placeholder="Ej: SENT" />
            <Field label="Nivel jerárquico" value={form.nivelJerarquico} onChange={f("nivelJerarquico")} type="number" />
          </div>
          <Field label="Nombre *" value={form.nombre} onChange={f("nombre")} placeholder="Ej: Sentencia" />
          <TextareaField label="Descripción" value={form.descripcion} onChange={f("descripcion")} />
          <ErrorBox msg={err} />
          <ModalFooter onCancel={() => setModal(false)} onSave={guardar} saveLabel={editando ? "Guardar" : "Crear tipo"} />
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// TAB: TIPOS DE RECURSO
// ════════════════════════════════════════════════════════
function TabTiposRecurso() {
  const { data, loading, refetch } = useQuery(GET_TIPOS_RECURSO);
  const [crear]      = useMutation(CREAR_TIPO_RECURSO);
  const [actualizar] = useMutation(ACTUALIZAR_TIPO_RECURSO);
  const [eliminar_m] = useMutation(ELIMINAR_TIPO_RECURSO);

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<TipoRecurso | null>(null);
  const [err, setErr]       = useState("");
  const initForm = { nombre: "", descripcion: "" };
  const [form, setForm] = useState(initForm);
  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const tipos: TipoRecurso[] = data?.allTiposRecurso ?? [];

  const abrirCrear = () => { setEdit(null); setForm(initForm); setErr(""); setModal(true); };
  const abrirEditar = (t: TipoRecurso) => {
    setEdit(t); setForm({ nombre: t.nombre, descripcion: t.descripcion ?? "" });
    setErr(""); setModal(true);
  };

  const guardar = async () => {
    if (!form.nombre) { setErr("El nombre es obligatorio."); return; }
    try {
      if (editando) {
        await actualizar({ variables: { id: Number(editando.idTipoRecurso), input: { nombre: form.nombre, descripcion: form.descripcion || undefined } } });
      } else {
        await crear({ variables: { nombre: form.nombre, descripcion: form.descripcion || undefined } });
      }
      await refetch(); setModal(false);
    } catch (e: any) { setErr(e.message ?? "Error."); }
  };

  // ── ELIMINAR TIPO RECURSO ────────────────────────────────
  const eliminar = async (id: number) => {
    if (!window.confirm("¿Eliminar este tipo?")) return;
    const { data } = await eliminar_m({ variables: { id: Number(id) } });
    if (!data?.eliminarTipoRecurso?.ok) {
      alert(data?.eliminarTipoRecurso?.mensaje ?? "No se pudo eliminar el tipo de recurso.");
      return;
    }
    refetch();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button onClick={abrirCrear} style={{
          backgroundColor: "#238636", color: "#fff", border: "none",
          borderRadius: 6, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 500,
        }}>+ Nuevo tipo</button>
      </div>

      <Tabla headers={["Nombre", "Descripción", "Acciones"]} loading={loading} emptyMsg="No hay tipos de recurso">
        {tipos.map((t, i) => (
          <tr key={t.idTipoRecurso}
            style={{ borderBottom: i < tipos.length - 1 ? `1px solid ${C.borderLight}` : "none" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#1c2128")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <td style={{ padding: "12px 16px", fontWeight: 500 }}>{t.nombre}</td>
            <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>{t.descripcion || "—"}</td>
            <td style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", gap: 6 }}>
                <ActionBtn onClick={() => abrirEditar(t)} color={C.blue} label="Editar" />
                <ActionBtn onClick={() => eliminar(Number(t.idTipoRecurso))} color={C.red} label="Eliminar" />
              </div>
            </td>
          </tr>
        ))}
      </Tabla>

      {modal && (
        <Modal onClose={() => setModal(false)} width={420}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: C.text }}>
            {editando ? "Editar tipo de recurso" : "Nuevo tipo de recurso"}
          </h2>
          <Field label="Nombre *" value={form.nombre} onChange={f("nombre")} placeholder="Ej: Apelación, Casación..." />
          <TextareaField label="Descripción" value={form.descripcion} onChange={f("descripcion")} />
          <ErrorBox msg={err} />
          <ModalFooter onCancel={() => setModal(false)} onSave={guardar} saveLabel={editando ? "Guardar" : "Crear tipo"} />
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// TAB: RECURSOS
// ════════════════════════════════════════════════════════
function TabRecursos() {
  const { data, loading, refetch } = useQuery(GET_RECURSOS);
  const { data: dRes }    = useQuery(GET_RESOLUCIONES);
  const { data: dTipo }   = useQuery(GET_TIPOS_RECURSO);
  const { data: dPartes } = useQuery(GET_PARTES_PROCESALES_SIMPLE);

  const [crear]      = useMutation(CREAR_RECURSO);
  const [actualizar] = useMutation(ACTUALIZAR_RECURSO);
  const [eliminar_m] = useMutation(ELIMINAR_RECURSO);

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<Recurso | null>(null);
  const [err, setErr]       = useState("");
  const [busqueda, setBusq] = useState("");

  const initForm = { idResolucionImpugnada: 0, idTipoRecurso: 0, idRecurrente: 0, fundamentos: "", estadoRecurso: "PENDIENTE" };
  const [form, setForm] = useState(initForm);
  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const recursos: Recurso[]     = data?.allRecursos ?? [];
  const resoluciones            = dRes?.allResoluciones ?? [];
  const tipos: TipoRecurso[]    = dTipo?.allTiposRecurso ?? [];
  const partes: ParteProcesal[] = dPartes?.allPartesProcesales ?? [];

  const filtrados = recursos.filter(r =>
    `${r.idResolucionImpugnada.numeroResolucion} ${r.idTipoRecurso.nombre} ${r.estadoRecurso} ${r.idRecurrente.idPersona.nombre}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirCrear = () => { setEdit(null); setForm(initForm); setErr(""); setModal(true); };
  const abrirEditar = (r: Recurso) => {
    setEdit(r);
    setForm({ ...initForm, estadoRecurso: r.estadoRecurso, fundamentos: r.fundamentos });
    setErr(""); setModal(true);
  };

  const guardar = async () => {
    try {
      if (editando) {
        await actualizar({ variables: { id: Number(editando.idRecurso), input: {
          estadoRecurso: form.estadoRecurso,
          fundamentos: form.fundamentos || undefined,
        }}});
      } else {
        if (!form.idResolucionImpugnada || !form.idTipoRecurso || !form.idRecurrente) {
          setErr("Resolución, tipo de recurso y parte recurrente son obligatorios."); return;
        }
        await crear({ variables: {
          idResolucionImpugnada: Number(form.idResolucionImpugnada),
          idTipoRecurso: Number(form.idTipoRecurso),
          idRecurrente: Number(form.idRecurrente),
          fundamentos: form.fundamentos || undefined,
        }});
      }
      await refetch(); setModal(false);
    } catch (e: any) { setErr(e.message ?? "Error al guardar."); }
  };

  // ── ELIMINAR RECURSO ─────────────────────────────────────
  const eliminar = async (id: number) => {
    if (!window.confirm("¿Eliminar este recurso?")) return;
    const { data } = await eliminar_m({ variables: { id: Number(id) } });
    if (!data?.eliminarRecurso?.ok) {
      alert(data?.eliminarRecurso?.mensaje ?? "No se pudo eliminar el recurso.");
      return;
    }
    refetch();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <input
          placeholder="Buscar por resolución, tipo, estado o recurrente..."
          value={busqueda} onChange={e => setBusq(e.target.value)}
          style={{
            width: 320, padding: "8px 12px", backgroundColor: C.card,
            border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 13, outline: "none",
          }}
        />
        <button onClick={abrirCrear} style={{
          backgroundColor: "#238636", color: "#fff", border: "none",
          borderRadius: 6, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 500,
        }}>+ Nuevo recurso</button>
      </div>

      <Tabla
        headers={["Resolución impugnada", "Tipo de recurso", "Recurrente", "Rol procesal", "Fecha", "Estado", "Exp. alzada", "Acciones"]}
        loading={loading} emptyMsg="No hay recursos registrados"
      >
        {filtrados.map((r, i) => (
          <tr key={r.idRecurso}
            style={{ borderBottom: i < filtrados.length - 1 ? `1px solid ${C.borderLight}` : "none" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#1c2128")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <td style={{ padding: "12px 16px" }}>
              <span style={{ fontFamily: "monospace", color: C.text, fontWeight: 500 }}>{r.idResolucionImpugnada.numeroResolucion}</span>
              <div style={{ fontSize: 11, color: C.muted }}>#{r.idResolucionImpugnada.idExpediente.numeroExpediente}</div>
            </td>
            <td style={{ padding: "12px 16px" }}>
              <span style={{ backgroundColor: "#1c2d3a", color: C.blue, fontSize: 11, padding: "2px 8px", borderRadius: 4 }}>
                {r.idTipoRecurso.nombre}
              </span>
            </td>
            <td style={{ padding: "12px 16px", fontWeight: 500 }}>
              {r.idRecurrente.idPersona.nombre} {r.idRecurrente.idPersona.primerApellido}
            </td>
            <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>{r.idRecurrente.idRol.nombreRol}</td>
            <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>{fmt(r.fechaInterposicion)}</td>
            <td style={{ padding: "12px 16px" }}><EstadoBadge estado={r.estadoRecurso} mapa={ESTADO_REC_COLORS} /></td>
            <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>
              {r.idExpedienteAlzada ? <span style={{ color: C.blue }}>#{r.idExpedienteAlzada.numeroExpediente}</span> : "—"}
            </td>
            <td style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", gap: 6 }}>
                <ActionBtn onClick={() => abrirEditar(r)} color={C.blue} label="Editar" />
                <ActionBtn onClick={() => eliminar(Number(r.idRecurso))} color={C.red} label="Eliminar" />
              </div>
            </td>
          </tr>
        ))}
      </Tabla>

      <div style={{ marginTop: 10, fontSize: 12, color: C.muted }}>
        {filtrados.length} recurso{filtrados.length !== 1 ? "s" : ""}
      </div>

      {modal && (
        <Modal onClose={() => setModal(false)} width={560}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: C.text }}>
            {editando ? "Editar recurso" : "Nuevo recurso"}
          </h2>

          {!editando && (
            <>
              <SelectField label="Resolución impugnada *" value={form.idResolucionImpugnada} onChange={f("idResolucionImpugnada")}>
                <option value={0}>— Seleccionar resolución —</option>
                {resoluciones
                  .filter((r: Resolucion) => r.esRecurrible)
                  .map((r: Resolucion) => (
                    <option key={r.idResolucion} value={r.idResolucion}>
                      {r.numeroResolucion} — #{r.idExpediente.numeroExpediente}
                    </option>
                  ))}
              </SelectField>
              <SelectField label="Tipo de recurso *" value={form.idTipoRecurso} onChange={f("idTipoRecurso")}>
                <option value={0}>— Seleccionar tipo —</option>
                {tipos.map(t => <option key={t.idTipoRecurso} value={t.idTipoRecurso}>{t.nombre}</option>)}
              </SelectField>
              <SelectField label="Parte recurrente *" value={form.idRecurrente} onChange={f("idRecurrente")}>
                <option value={0}>— Seleccionar parte procesal —</option>
                {partes.filter(p => p.activo).map(p => (
                  <option key={p.idParte} value={p.idParte}>
                    {p.idPersona.nombre} {p.idPersona.primerApellido} ({p.idRol.nombreRol}) — Exp. #{p.idExpediente.numeroExpediente}
                  </option>
                ))}
              </SelectField>
            </>
          )}

          {editando && (
            <SelectField label="Estado del recurso" value={form.estadoRecurso} onChange={f("estadoRecurso")}>
              <option value="PENDIENTE">Pendiente</option>
              <option value="ADMITIDO">Admitido</option>
              <option value="RECHAZADO">Rechazado</option>
              <option value="RESUELTO">Resuelto</option>
            </SelectField>
          )}

          <TextareaField label="Fundamentos" value={form.fundamentos} onChange={f("fundamentos")} rows={5} />

          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)}
            onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Interponer recurso"}
          />
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════
const TABS = [
  { id: "resoluciones",     label: "Resoluciones",        icon: "📜" },
  { id: "tipos-resolucion", label: "Tipos de resolución", icon: "🗂️" },
  { id: "tipos-recurso",    label: "Tipos de recurso",    icon: "📋" },
  { id: "recursos",         label: "Recursos",            icon: "⚖️" },
];

export default function ResolucionesPage() {
  const [tabActiva, setTab] = useState("resoluciones");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg, color: C.text, padding: "28px 32px" }}>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Resoluciones</h1>
        <p style={{ fontSize: 13, color: C.muted }}>Gestión de resoluciones, tipos y recursos legales</p>
      </div>

      <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: `1px solid ${C.border}` }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setTab(tab.id)} style={{
            padding: "8px 16px", fontSize: 13, cursor: "pointer",
            border: "none", outline: "none", backgroundColor: "transparent",
            color: tabActiva === tab.id ? C.blue : C.muted,
            borderBottom: tabActiva === tab.id ? `2px solid ${C.blue}` : "2px solid transparent",
            fontWeight: tabActiva === tab.id ? 600 : 400,
            transition: "all 0.15s", marginBottom: -1,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {tabActiva === "resoluciones"     && <TabResoluciones />}
      {tabActiva === "tipos-resolucion" && <TabTiposResolucion />}
      {tabActiva === "tipos-recurso"    && <TabTiposRecurso />}
      {tabActiva === "recursos"         && <TabRecursos />}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}