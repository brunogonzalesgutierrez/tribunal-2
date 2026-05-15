import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_AUDIENCIAS,
  GET_TIPOS_AUDIENCIA,
  GET_SALAS_AUDIENCIA,
  GET_ASISTENCIAS,
  GET_ACTAS,
  GET_EXPEDIENTES_SIMPLE,
  GET_TRIBUNALES_SIMPLE,
  GET_TIPOS_PROCESO_SIMPLE,
  GET_PERSONAS_SIMPLE,
  GET_USUARIOS_SIMPLE,
  CREAR_AUDIENCIA,
  ACTUALIZAR_AUDIENCIA,
  ELIMINAR_AUDIENCIA,
  CREAR_TIPO_AUDIENCIA,
  ELIMINAR_TIPO_AUDIENCIA,
  CREAR_SALA_AUDIENCIA,
  ACTUALIZAR_SALA_AUDIENCIA,
  ELIMINAR_SALA_AUDIENCIA,
  REGISTRAR_ASISTENCIA,
  ACTUALIZAR_ASISTENCIA,
  ELIMINAR_ASISTENCIA,
  CREAR_ACTA,
  ACTUALIZAR_ACTA,
  ELIMINAR_ACTA,
} from "../graphql/audiencias";

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

// ─── ESTADO AUDIENCIA BADGE ───────────────────────────────
const ESTADO_COLORS: Record<string, { bg: string; color: string }> = {
  PROGRAMADA:  { bg: "#1c2d3a", color: C.blue },
  EN_CURSO:    { bg: "#1a3d22", color: C.green },
  FINALIZADA:  { bg: "#21262d", color: C.muted },
  SUSPENDIDA:  { bg: "#3d2a1a", color: C.orange },
};

const EstadoBadge = ({ estado }: { estado: string }) => {
  const style = ESTADO_COLORS[estado] ?? { bg: "#21262d", color: C.muted };
  return (
    <span style={{
      fontSize: 11, padding: "2px 9px", borderRadius: 4,
      backgroundColor: style.bg, color: style.color, fontWeight: 600,
    }}>
      {estado.replace("_", " ")}
    </span>
  );
};

// ─── MODAL ───────────────────────────────────────────────
function Modal({ children, onClose, width = 520 }: {
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

// ─── FIELD ───────────────────────────────────────────────
const Field = ({ label, value, onChange, type = "text", placeholder = "" }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string;
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
  label: string; value: string | number; onChange: (v: string) => void;
  children: React.ReactNode;
}) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 5 }}>{label}</label>
    <select
      value={value} onChange={e => onChange(e.target.value)}
      style={{
        width: "100%", padding: "8px 10px", backgroundColor: C.bg,
        border: `1px solid ${C.border}`, borderRadius: 6, color: C.text,
        fontSize: 13, outline: "none", boxSizing: "border-box",
      }}
    >
      {children}
    </select>
  </div>
);

const TextareaField = ({ label, value, onChange, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number;
}) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 5 }}>{label}</label>
    <textarea
      value={value} rows={rows}
      onChange={e => onChange(e.target.value)}
      style={{
        width: "100%", padding: "8px 10px", backgroundColor: C.bg,
        border: `1px solid ${C.border}`, borderRadius: 6, color: C.text,
        fontSize: 13, outline: "none", boxSizing: "border-box", resize: "vertical",
      }}
    />
  </div>
);

// ─── TABLA WRAPPER ────────────────────────────────────────
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
        {loading ? (
          [...Array(3)].map((_, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
              {[...Array(headers.length)].map((_, j) => (
                <td key={j} style={{ padding: "12px 16px" }}>
                  <div style={{ height: 12, backgroundColor: C.borderLight, borderRadius: 4, animation: "pulse 1.5s infinite" }} />
                </td>
              ))}
            </tr>
          ))
        ) : !children || (children as any[])?.length === 0 ? (
          <tr>
            <td colSpan={headers.length} style={{ padding: "32px 16px", textAlign: "center", color: C.muted }}>
              {emptyMsg}
            </td>
          </tr>
        ) : children}
      </tbody>
    </table>
  </div>
);

const ActionBtn = ({ onClick, color, label }: { onClick: () => void; color: string; label: string }) => (
  <button onClick={onClick} style={{
    backgroundColor: "transparent", color,
    border: `1px solid ${color}`, borderRadius: 5,
    padding: "4px 10px", fontSize: 12, cursor: "pointer",
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
      padding: "8px 16px", backgroundColor: "#238636",
      border: "none", borderRadius: 6, color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 500,
    }}>{saveLabel}</button>
  </div>
);

// ─── TIPOS ───────────────────────────────────────────────
interface Expediente { idExpediente: number; numeroExpediente: string; ano: number; }
interface TipoAudiencia { idTipoAudiencia: number; nombre: string; duracionEstimada: number; descripcion?: string; idTipoProceso: { idTipoProceso: number; nombre: string; } }
interface SalaAudiencia { idSalaAud: number; nombreSala: string; capacidad: number; equipadaVideoconf: boolean; enlaceVirtual?: string; activa: boolean; idTribunal: { idTribunal: number; nombreTribunal: string; } }
interface Audiencia {
  idAudiencia: number;
  fechaHoraProgramada: string;
  fechaHoraInicio?: string;
  fechaHoraFin?: string;
  estadoAudiencia: string;
  motivoSuspension?: string;
  linkVideoconferencia?: string;
  idExpediente: { idExpediente: number; numeroExpediente: string; ano: number; };
  idTipoAudiencia: { idTipoAudiencia: number; nombre: string; duracionEstimada: number; };
  idSalaAud?: { idSalaAud: number; nombreSala: string; capacidad: number; equipadaVideoconf: boolean; };
}
interface Asistencia {
  idAsistencia: number;
  rolEnAudiencia: string;
  asistio: boolean;
  horaIngreso?: string;
  motivoInasistencia?: string;
  idAudiencia: { idAudiencia: number; fechaHoraProgramada: string; idExpediente: { numeroExpediente: string; } };
  idPersona: { idPersona: number; nombre: string; primerApellido: string; numeroDocumento: string; };
}
interface Acta {
  idActa: number;
  contenido: string;
  fechaActa: string;
  firmada: boolean;
  urlGrabacion?: string;
  idAudiencia: { idAudiencia: number; fechaHoraProgramada: string; idExpediente: { numeroExpediente: string; } };
  usuario: { idUsuario: number; nombres: string; paterno: string; };
}

const fmt = (dt?: string) => dt ? new Date(dt).toLocaleString("es-BO", { dateStyle: "short", timeStyle: "short" }) : "—";

// ════════════════════════════════════════════════════════
// TAB: AUDIENCIAS
// ════════════════════════════════════════════════════════
function TabAudiencias() {
  const { data, loading, refetch } = useQuery(GET_AUDIENCIAS);
  const { data: dExp }  = useQuery(GET_EXPEDIENTES_SIMPLE);
  const { data: dTipo } = useQuery(GET_TIPOS_AUDIENCIA);
  const { data: dSala } = useQuery(GET_SALAS_AUDIENCIA);

  const [crearAudiencia]      = useMutation(CREAR_AUDIENCIA);
  const [actualizarAudiencia] = useMutation(ACTUALIZAR_AUDIENCIA);
  const [eliminarAudiencia]   = useMutation(ELIMINAR_AUDIENCIA);

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<Audiencia | null>(null);
  const [err, setErr]       = useState("");
  const [busqueda, setBusq] = useState("");

  const initForm = { idExpediente: 0, idTipoAudiencia: 0, idSalaAud: 0, fechaHoraProgramada: "", linkVideoconferencia: "", estadoAudiencia: "PROGRAMADA", motivoSuspension: "" };
  const [form, setForm] = useState(initForm);
  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const audiencias: Audiencia[] = data?.allAudiencias ?? [];
  const expedientes: Expediente[] = dExp?.allExpedientes ?? [];
  const tipos: TipoAudiencia[] = dTipo?.allTiposAudiencia ?? [];
  const salas: SalaAudiencia[] = dSala?.allSalasAudiencia ?? [];

  const filtradas = audiencias.filter(a =>
    `${a.idExpediente.numeroExpediente} ${a.estadoAudiencia} ${a.idTipoAudiencia.nombre}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirCrear = () => { setEdit(null); setForm(initForm); setErr(""); setModal(true); };
  const abrirEditar = (a: Audiencia) => {
    setEdit(a);
    setForm({
      idExpediente: a.idExpediente.idExpediente,
      idTipoAudiencia: a.idTipoAudiencia.idTipoAudiencia,
      idSalaAud: a.idSalaAud?.idSalaAud ?? 0,
      fechaHoraProgramada: a.fechaHoraProgramada?.slice(0, 16) ?? "",
      linkVideoconferencia: a.linkVideoconferencia ?? "",
      estadoAudiencia: a.estadoAudiencia,
      motivoSuspension: a.motivoSuspension ?? "",
    });
    setErr(""); setModal(true);
  };

  const guardar = async () => {
    if (!form.idExpediente || !form.idTipoAudiencia || !form.fechaHoraProgramada) {
      setErr("Expediente, tipo de audiencia y fecha son obligatorios."); return;
    }
    try {
      if (editando) {
        await actualizarAudiencia({ variables: { id: Number(editando.idAudiencia), input: {
          idTipoAudiencia: Number(form.idTipoAudiencia) || undefined,
          idSalaAud: Number(form.idSalaAud) || undefined,
          fechaHoraProgramada: form.fechaHoraProgramada,
          estadoAudiencia: form.estadoAudiencia || undefined,
          motivoSuspension: form.motivoSuspension || undefined,
          linkVideoconferencia: form.linkVideoconferencia || undefined,
        }}});
      } else {
        await crearAudiencia({ variables: { input: {
          idExpediente: Number(form.idExpediente),
          idTipoAudiencia: Number(form.idTipoAudiencia),
          fechaHoraProgramada: form.fechaHoraProgramada,
          idSalaAud: Number(form.idSalaAud) || undefined,
          linkVideoconferencia: form.linkVideoconferencia || undefined,
        }}});
      }
      await refetch(); setModal(false);
    } catch (e: any) { setErr(e.message ?? "Error al guardar."); }
  };

  const eliminar = async (id: number) => {
    if (!window.confirm("¿Eliminar esta audiencia?")) return;
    const { data } = await eliminarAudiencia({ variables: { id: Number(id) } });
    if (!data?.eliminarAudiencia?.ok) {
      alert(data?.eliminarAudiencia?.mensaje ?? "No se pudo eliminar la audiencia.");
      return;
    }
    refetch();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <input
          placeholder="Buscar por expediente, tipo o estado..."
          value={busqueda} onChange={e => setBusq(e.target.value)}
          style={{
            width: 300, padding: "8px 12px", backgroundColor: C.card,
            border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 13, outline: "none",
          }}
        />
        <button onClick={abrirCrear} style={{
          backgroundColor: "#238636", color: "#fff", border: "none",
          borderRadius: 6, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 500,
        }}>+ Nueva audiencia</button>
      </div>

      <Tabla
        headers={["Expediente", "Tipo", "Fecha programada", "Sala", "Estado", "Link", "Acciones"]}
        loading={loading} emptyMsg="No hay audiencias registradas"
      >
        {filtradas.map((a, i) => (
          <tr key={a.idAudiencia} style={{ borderBottom: i < filtradas.length - 1 ? `1px solid ${C.borderLight}` : "none" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#1c2128")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <td style={{ padding: "12px 16px", fontWeight: 500 }}>
              <span style={{ color: C.blue }}>#{a.idExpediente.numeroExpediente}</span>
              <span style={{ fontSize: 11, color: C.muted, marginLeft: 6 }}>{a.idExpediente.ano}</span>
            </td>
            <td style={{ padding: "12px 16px", color: C.text }}>{a.idTipoAudiencia.nombre}</td>
            <td style={{ padding: "12px 16px", color: C.muted, fontFamily: "monospace", fontSize: 12 }}>{fmt(a.fechaHoraProgramada)}</td>
            <td style={{ padding: "12px 16px", color: C.muted }}>
              {a.idSalaAud ? (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {a.idSalaAud.nombreSala}
                  {a.idSalaAud.equipadaVideoconf && <span style={{ fontSize: 10, color: C.purple, backgroundColor: "#2a1f3d", padding: "1px 5px", borderRadius: 3 }}>📹</span>}
                </span>
              ) : "—"}
            </td>
            <td style={{ padding: "12px 16px" }}><EstadoBadge estado={a.estadoAudiencia} /></td>
            <td style={{ padding: "12px 16px" }}>
              {a.linkVideoconferencia
                ? <a href={a.linkVideoconferencia} target="_blank" rel="noreferrer" style={{ color: C.blue, fontSize: 12 }}>🔗 Enlace</a>
                : <span style={{ color: C.muted }}>—</span>}
            </td>
            <td style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", gap: 6 }}>
                <ActionBtn onClick={() => abrirEditar(a)} color={C.blue} label="Editar" />
                <ActionBtn onClick={() => eliminar(Number(a.idAudiencia))} color={C.red} label="Eliminar" />
              </div>
            </td>
          </tr>
        ))}
      </Tabla>

      <div style={{ marginTop: 10, fontSize: 12, color: C.muted }}>
        {filtradas.length} audiencia{filtradas.length !== 1 ? "s" : ""}
      </div>

      {modal && (
        <Modal onClose={() => setModal(false)}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: C.text }}>
            {editando ? "Editar audiencia" : "Nueva audiencia"}
          </h2>

          {!editando && (
            <SelectField label="Expediente *" value={form.idExpediente} onChange={f("idExpediente")}>
              <option value={0}>— Seleccionar expediente —</option>
              {expedientes.map(e => <option key={e.idExpediente} value={e.idExpediente}>#{e.numeroExpediente} ({e.ano})</option>)}
            </SelectField>
          )}

          <SelectField label="Tipo de audiencia *" value={form.idTipoAudiencia} onChange={f("idTipoAudiencia")}>
            <option value={0}>— Seleccionar tipo —</option>
            {tipos.map(t => <option key={t.idTipoAudiencia} value={t.idTipoAudiencia}>{t.nombre} ({t.duracionEstimada} min)</option>)}
          </SelectField>

          <Field label="Fecha y hora programada *" value={form.fechaHoraProgramada} onChange={f("fechaHoraProgramada")} type="datetime-local" />

          <SelectField label="Sala de audiencia" value={form.idSalaAud} onChange={f("idSalaAud")}>
            <option value={0}>— Sin sala asignada —</option>
            {salas.filter(s => s.activa).map(s => <option key={s.idSalaAud} value={s.idSalaAud}>{s.nombreSala} (cap. {s.capacidad})</option>)}
          </SelectField>

          <Field label="Link videoconferencia" value={form.linkVideoconferencia} onChange={f("linkVideoconferencia")} placeholder="https://..." />

          {editando && (
            <>
              <SelectField label="Estado" value={form.estadoAudiencia} onChange={f("estadoAudiencia")}>
                <option value="PROGRAMADA">Programada</option>
                <option value="EN_CURSO">En curso</option>
                <option value="FINALIZADA">Finalizada</option>
                <option value="SUSPENDIDA">Suspendida</option>
              </SelectField>
              {form.estadoAudiencia === "SUSPENDIDA" && (
                <TextareaField label="Motivo de suspensión" value={form.motivoSuspension} onChange={f("motivoSuspension")} />
              )}
            </>
          )}

          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)}
            onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Crear audiencia"}
          />
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// TAB: TIPOS DE AUDIENCIA
// ════════════════════════════════════════════════════════
function TabTiposAudiencia() {
  const { data, loading, refetch } = useQuery(GET_TIPOS_AUDIENCIA);
  const { data: dTipoProc } = useQuery(GET_TIPOS_PROCESO_SIMPLE);

  const [crearTipo]    = useMutation(CREAR_TIPO_AUDIENCIA);
  const [eliminarTipo] = useMutation(ELIMINAR_TIPO_AUDIENCIA);

  const [modal, setModal] = useState(false);
  const [err, setErr]     = useState("");
  const [form, setForm]   = useState({ nombre: "", duracionEstimada: "", idTipoProceso: 0, descripcion: "" });
  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const tipos: TipoAudiencia[]    = data?.allTiposAudiencia ?? [];
  const tiposProceso              = dTipoProc?.allTiposProceso ?? [];

  const guardar = async () => {
    if (!form.nombre || !form.duracionEstimada || !form.idTipoProceso) {
      setErr("Nombre, duración y tipo de proceso son obligatorios."); return;
    }
    try {
      await crearTipo({ variables: { nombre: form.nombre, duracionEstimada: Number(form.duracionEstimada), idTipoProceso: Number(form.idTipoProceso), descripcion: form.descripcion || undefined } });
      await refetch(); setModal(false); setForm({ nombre: "", duracionEstimada: "", idTipoProceso: 0, descripcion: "" });
    } catch (e: any) { setErr(e.message ?? "Error."); }
  };

  const eliminar = async (id: number) => {
    if (!window.confirm("¿Eliminar este tipo de audiencia?")) return;
    const { data } = await eliminarTipo({ variables: { id: Number(id) } });
    if (!data?.eliminarTipoAudiencia?.ok) {
      alert(data?.eliminarTipoAudiencia?.mensaje ?? "No se pudo eliminar el tipo de audiencia.");
      return;
    }
    refetch();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button onClick={() => { setErr(""); setModal(true); }} style={{
          backgroundColor: "#238636", color: "#fff", border: "none",
          borderRadius: 6, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 500,
        }}>+ Nuevo tipo</button>
      </div>

      <Tabla headers={["Nombre", "Duración estimada", "Tipo de proceso", "Descripción", "Acciones"]}
        loading={loading} emptyMsg="No hay tipos de audiencia">
        {tipos.map((t, i) => (
          <tr key={t.idTipoAudiencia} style={{ borderBottom: i < tipos.length - 1 ? `1px solid ${C.borderLight}` : "none" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#1c2128")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <td style={{ padding: "12px 16px", fontWeight: 500 }}>{t.nombre}</td>
            <td style={{ padding: "12px 16px", color: C.muted }}>{t.duracionEstimada} min</td>
            <td style={{ padding: "12px 16px" }}>
              <span style={{ backgroundColor: "#1c2d3a", color: C.blue, fontSize: 11, padding: "2px 8px", borderRadius: 4 }}>
                {t.idTipoProceso.nombre}
              </span>
            </td>
            <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>{t.descripcion ?? "—"}</td>
            <td style={{ padding: "12px 16px" }}>
              <ActionBtn onClick={() => eliminar(Number(t.idTipoAudiencia))} color={C.red} label="Eliminar" />
            </td>
          </tr>
        ))}
      </Tabla>

      {modal && (
        <Modal onClose={() => setModal(false)} width={460}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: C.text }}>Nuevo tipo de audiencia</h2>
          <Field label="Nombre *" value={form.nombre} onChange={f("nombre")} />
          <Field label="Duración estimada (minutos) *" value={form.duracionEstimada} onChange={f("duracionEstimada")} type="number" />
          <SelectField label="Tipo de proceso *" value={form.idTipoProceso} onChange={f("idTipoProceso")}>
            <option value={0}>— Seleccionar —</option>
            {tiposProceso.map((tp: any) => <option key={tp.idTipoProceso} value={tp.idTipoProceso}>{tp.nombre}</option>)}
          </SelectField>
          <TextareaField label="Descripción" value={form.descripcion} onChange={f("descripcion")} />
          <ErrorBox msg={err} />
          <ModalFooter onCancel={() => setModal(false)} onSave={guardar} saveLabel="Crear tipo" />
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// TAB: SALAS DE AUDIENCIA
// ════════════════════════════════════════════════════════
function TabSalasAudiencia() {
  const { data, loading, refetch } = useQuery(GET_SALAS_AUDIENCIA);
  const { data: dTrib }            = useQuery(GET_TRIBUNALES_SIMPLE);

  const [crearSala]      = useMutation(CREAR_SALA_AUDIENCIA);
  const [actualizarSala] = useMutation(ACTUALIZAR_SALA_AUDIENCIA);
  const [eliminarSala]   = useMutation(ELIMINAR_SALA_AUDIENCIA);

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<SalaAudiencia | null>(null);
  const [err, setErr]       = useState("");
  const initForm = { idTribunal: 0, nombreSala: "", capacidad: "", equipadaVideoconf: false, enlaceVirtual: "", activa: true };
  const [form, setForm] = useState(initForm);
  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const salas: SalaAudiencia[] = data?.allSalasAudiencia ?? [];
  const tribunales              = dTrib?.allTribunales ?? [];

  const abrirCrear = () => { setEdit(null); setForm(initForm); setErr(""); setModal(true); };
  const abrirEditar = (s: SalaAudiencia) => {
    setEdit(s);
    setForm({ idTribunal: s.idTribunal.idTribunal, nombreSala: s.nombreSala, capacidad: String(s.capacidad), equipadaVideoconf: s.equipadaVideoconf, enlaceVirtual: s.enlaceVirtual ?? "", activa: s.activa });
    setErr(""); setModal(true);
  };

  const guardar = async () => {
    if (!form.nombreSala || !form.capacidad) { setErr("Nombre y capacidad son obligatorios."); return; }
    try {
      if (editando) {
        await actualizarSala({ variables: { id: Number(editando.idSalaAud), input: {
          nombreSala: form.nombreSala, capacidad: Number(form.capacidad),
          equipadaVideoconf: form.equipadaVideoconf,
          enlaceVirtual: form.enlaceVirtual || undefined,
          activa: form.activa,
        }}});
      } else {
        if (!form.idTribunal) { setErr("El tribunal es obligatorio."); return; }
        await crearSala({ variables: {
          idTribunal: Number(form.idTribunal), nombreSala: form.nombreSala,
          capacidad: Number(form.capacidad), equipadaVideoconf: form.equipadaVideoconf,
          enlaceVirtual: form.enlaceVirtual || undefined, activa: form.activa,
        }});
      }
      await refetch(); setModal(false);
    } catch (e: any) { setErr(e.message ?? "Error."); }
  };

  const eliminar = async (id: number) => {
    if (!window.confirm("¿Eliminar esta sala?")) return;
    const { data } = await eliminarSala({ variables: { id: Number(id) } });
    if (!data?.eliminarSalaAudiencia?.ok) {
      alert(data?.eliminarSalaAudiencia?.mensaje ?? "No se pudo eliminar la sala.");
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
        }}>+ Nueva sala</button>
      </div>

      <Tabla headers={["Nombre", "Tribunal", "Capacidad", "Videoconf.", "Enlace virtual", "Estado", "Acciones"]}
        loading={loading} emptyMsg="No hay salas de audiencia">
        {salas.map((s, i) => (
          <tr key={s.idSalaAud} style={{ borderBottom: i < salas.length - 1 ? `1px solid ${C.borderLight}` : "none" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#1c2128")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <td style={{ padding: "12px 16px", fontWeight: 500 }}>{s.nombreSala}</td>
            <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>{s.idTribunal.nombreTribunal}</td>
            <td style={{ padding: "12px 16px", color: C.text }}>{s.capacidad} personas</td>
            <td style={{ padding: "12px 16px" }}>
              <span style={{ color: s.equipadaVideoconf ? C.purple : C.muted }}>
                {s.equipadaVideoconf ? "✓ Sí" : "✗ No"}
              </span>
            </td>
            <td style={{ padding: "12px 16px" }}>
              {s.enlaceVirtual
                ? <a href={s.enlaceVirtual} target="_blank" rel="noreferrer" style={{ color: C.blue, fontSize: 12 }}>🔗 Enlace</a>
                : <span style={{ color: C.muted }}>—</span>}
            </td>
            <td style={{ padding: "12px 16px" }}>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, backgroundColor: s.activa ? "#1a3d22" : "#3d1a1a", color: s.activa ? C.green : C.red }}>
                {s.activa ? "Activa" : "Inactiva"}
              </span>
            </td>
            <td style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", gap: 6 }}>
                <ActionBtn onClick={() => abrirEditar(s)} color={C.blue} label="Editar" />
                <ActionBtn onClick={() => eliminar(Number(s.idSalaAud))} color={C.red} label="Eliminar" />
              </div>
            </td>
          </tr>
        ))}
      </Tabla>

      {modal && (
        <Modal onClose={() => setModal(false)} width={460}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: C.text }}>
            {editando ? "Editar sala" : "Nueva sala de audiencia"}
          </h2>
          {!editando && (
            <SelectField label="Tribunal *" value={form.idTribunal} onChange={f("idTribunal")}>
              <option value={0}>— Seleccionar tribunal —</option>
              {tribunales.map((t: any) => <option key={t.idTribunal} value={t.idTribunal}>{t.nombreTribunal}</option>)}
            </SelectField>
          )}
          <Field label="Nombre de la sala *" value={form.nombreSala} onChange={f("nombreSala")} />
          <Field label="Capacidad (personas) *" value={form.capacidad} onChange={f("capacidad")} type="number" />
          <Field label="Enlace virtual" value={form.enlaceVirtual} onChange={f("enlaceVirtual")} placeholder="https://..." />
          <div style={{ marginBottom: 14, display: "flex", gap: 20 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.text, cursor: "pointer" }}>
              <input type="checkbox" checked={form.equipadaVideoconf}
                onChange={e => setForm(p => ({ ...p, equipadaVideoconf: e.target.checked }))} />
              Equipada para videoconferencia
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.text, cursor: "pointer" }}>
              <input type="checkbox" checked={form.activa}
                onChange={e => setForm(p => ({ ...p, activa: e.target.checked }))} />
              Activa
            </label>
          </div>
          <ErrorBox msg={err} />
          <ModalFooter onCancel={() => setModal(false)} onSave={guardar} saveLabel={editando ? "Guardar cambios" : "Crear sala"} />
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// TAB: ASISTENCIAS
// ════════════════════════════════════════════════════════
function TabAsistencias() {
  const { data, loading, refetch } = useQuery(GET_ASISTENCIAS);
  const { data: dAud }  = useQuery(GET_AUDIENCIAS);
  const { data: dPers } = useQuery(GET_PERSONAS_SIMPLE);

  const [registrar]    = useMutation(REGISTRAR_ASISTENCIA);
  const [actualizar]   = useMutation(ACTUALIZAR_ASISTENCIA);
  const [eliminarAs]   = useMutation(ELIMINAR_ASISTENCIA);

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<Asistencia | null>(null);
  const [err, setErr]       = useState("");
  const initForm = { idAudiencia: 0, idPersona: 0, rolEnAudiencia: "", asistio: true, motivoInasistencia: "" };
  const [form, setForm] = useState(initForm);
  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const asistencias: Asistencia[] = data?.allAsistencias ?? [];
  const audiencias                = dAud?.allAudiencias ?? [];
  const personas                  = dPers?.allPersonas ?? [];

  const abrirCrear = () => { setEdit(null); setForm(initForm); setErr(""); setModal(true); };
  const abrirEditar = (a: Asistencia) => {
    setEdit(a);
    setForm({ idAudiencia: a.idAudiencia.idAudiencia, idPersona: a.idPersona.idPersona, rolEnAudiencia: a.rolEnAudiencia, asistio: a.asistio, motivoInasistencia: a.motivoInasistencia ?? "" });
    setErr(""); setModal(true);
  };

  const guardar = async () => {
    try {
      if (editando) {
        await actualizar({ variables: { id: Number(editando.idAsistencia), input: { asistio: form.asistio, motivoInasistencia: form.motivoInasistencia || undefined } } });
      } else {
        if (!form.idAudiencia || !form.idPersona || !form.rolEnAudiencia) { setErr("Audiencia, persona y rol son obligatorios."); return; }
        await registrar({ variables: { idAudiencia: Number(form.idAudiencia), idPersona: Number(form.idPersona), rolEnAudiencia: form.rolEnAudiencia, asistio: form.asistio } });
      }
      await refetch(); setModal(false);
    } catch (e: any) { setErr(e.message ?? "Error."); }
  };

  const eliminar = async (id: number) => {
    if (!window.confirm("¿Eliminar este registro?")) return;
    const { data } = await eliminarAs({ variables: { id: Number(id) } });
    if (!data?.eliminarAsistencia?.ok) {
      alert(data?.eliminarAsistencia?.mensaje ?? "No se pudo eliminar el registro de asistencia.");
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
        }}>+ Registrar asistencia</button>
      </div>

      <Tabla headers={["Persona", "Audiencia", "Rol en audiencia", "Asistió", "Hora ingreso", "Motivo inasistencia", "Acciones"]}
        loading={loading} emptyMsg="No hay registros de asistencia">
        {asistencias.map((a, i) => (
          <tr key={a.idAsistencia} style={{ borderBottom: i < asistencias.length - 1 ? `1px solid ${C.borderLight}` : "none" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#1c2128")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <td style={{ padding: "12px 16px", fontWeight: 500 }}>
              {a.idPersona.nombre} {a.idPersona.primerApellido}
              <div style={{ fontSize: 11, color: C.muted }}>{a.idPersona.numeroDocumento}</div>
            </td>
            <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>
              #{a.idAudiencia.idExpediente.numeroExpediente}
              <div>{fmt(a.idAudiencia.fechaHoraProgramada)}</div>
            </td>
            <td style={{ padding: "12px 16px" }}>
              <span style={{ backgroundColor: "#1c2d3a", color: C.blue, fontSize: 11, padding: "2px 8px", borderRadius: 4 }}>
                {a.rolEnAudiencia}
              </span>
            </td>
            <td style={{ padding: "12px 16px" }}>
              <span style={{ color: a.asistio ? C.green : C.red, fontWeight: 600 }}>
                {a.asistio ? "✓ Sí" : "✗ No"}
              </span>
            </td>
            <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>{a.horaIngreso ? fmt(a.horaIngreso) : "—"}</td>
            <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>{a.motivoInasistencia ?? "—"}</td>
            <td style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", gap: 6 }}>
                <ActionBtn onClick={() => abrirEditar(a)} color={C.blue} label="Editar" />
                <ActionBtn onClick={() => eliminar(Number(a.idAsistencia))} color={C.red} label="Eliminar" />
              </div>
            </td>
          </tr>
        ))}
      </Tabla>

      {modal && (
        <Modal onClose={() => setModal(false)} width={460}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: C.text }}>
            {editando ? "Editar asistencia" : "Registrar asistencia"}
          </h2>
          {!editando && (
            <>
              <SelectField label="Audiencia *" value={form.idAudiencia} onChange={f("idAudiencia")}>
                <option value={0}>— Seleccionar audiencia —</option>
                {audiencias.map((a: any) => (
                  <option key={a.idAudiencia} value={a.idAudiencia}>
                    #{a.idExpediente.numeroExpediente} — {fmt(a.fechaHoraProgramada)}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Persona *" value={form.idPersona} onChange={f("idPersona")}>
                <option value={0}>— Seleccionar persona —</option>
                {personas.map((p: any) => (
                  <option key={p.idPersona} value={p.idPersona}>{p.nombre} {p.primerApellido} — {p.numeroDocumento}</option>
                ))}
              </SelectField>
              <Field label="Rol en audiencia *" value={form.rolEnAudiencia} onChange={f("rolEnAudiencia")} placeholder="Ej: Demandante, Abogado defensor..." />
            </>
          )}
          <div style={{ marginBottom: 14, display: "flex", gap: 20 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.text, cursor: "pointer" }}>
              <input type="checkbox" checked={form.asistio}
                onChange={e => setForm(p => ({ ...p, asistio: e.target.checked }))} />
              Asistió a la audiencia
            </label>
          </div>
          {!form.asistio && (
            <TextareaField label="Motivo de inasistencia" value={form.motivoInasistencia} onChange={f("motivoInasistencia")} />
          )}
          <ErrorBox msg={err} />
          <ModalFooter onCancel={() => setModal(false)} onSave={guardar} saveLabel={editando ? "Guardar" : "Registrar"} />
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// TAB: ACTAS
// ════════════════════════════════════════════════════════
function TabActas() {
  const { data, loading, refetch } = useQuery(GET_ACTAS);
  const { data: dAud }  = useQuery(GET_AUDIENCIAS);
  const { data: dUsu }  = useQuery(GET_USUARIOS_SIMPLE);

  const [crearActa]    = useMutation(CREAR_ACTA);
  const [actualizarAc] = useMutation(ACTUALIZAR_ACTA);
  const [eliminarAc]   = useMutation(ELIMINAR_ACTA);

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<Acta | null>(null);
  const [err, setErr]       = useState("");
  const initForm = { idAudiencia: 0, idUsuario: 0, contenido: "", firmada: false, urlGrabacion: "" };
  const [form, setForm] = useState(initForm);
  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const actas: Acta[] = data?.allActas ?? [];
  const audiencias    = dAud?.allAudiencias ?? [];
  const usuarios      = dUsu?.allUsuarios ?? [];

  const abrirCrear = () => { setEdit(null); setForm(initForm); setErr(""); setModal(true); };
  const abrirEditar = (a: Acta) => {
    setEdit(a);
    setForm({ idAudiencia: a.idAudiencia.idAudiencia, idUsuario: a.usuario.idUsuario, contenido: a.contenido, firmada: a.firmada, urlGrabacion: a.urlGrabacion ?? "" });
    setErr(""); setModal(true);
  };

  const guardar = async () => {
    if (!form.contenido) { setErr("El contenido del acta es obligatorio."); return; }
    try {
      if (editando) {
        await actualizarAc({ variables: { id: Number(editando.idActa), input: { contenido: form.contenido, firmada: form.firmada, urlGrabacion: form.urlGrabacion || undefined } } });
      } else {
        if (!form.idAudiencia || !form.idUsuario) { setErr("Audiencia y usuario son obligatorios."); return; }
        await crearActa({ variables: { idAudiencia: Number(form.idAudiencia), idUsuario: Number(form.idUsuario), contenido: form.contenido, firmada: form.firmada } });
      }
      await refetch(); setModal(false);
    } catch (e: any) { setErr(e.message ?? "Error."); }
  };

  const eliminar = async (id: number) => {
    if (!window.confirm("¿Eliminar esta acta?")) return;
    const { data } = await eliminarAc({ variables: { id: Number(id) } });
    if (!data?.eliminarActa?.ok) {
      alert(data?.eliminarActa?.mensaje ?? "No se pudo eliminar el acta.");
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
        }}>+ Nueva acta</button>
      </div>

      <Tabla headers={["Expediente", "Fecha acta", "Registrado por", "Firmada", "Grabación", "Acciones"]}
        loading={loading} emptyMsg="No hay actas registradas">
        {actas.map((a, i) => (
          <tr key={a.idActa} style={{ borderBottom: i < actas.length - 1 ? `1px solid ${C.borderLight}` : "none" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#1c2128")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <td style={{ padding: "12px 16px" }}>
              <span style={{ color: C.blue, fontWeight: 500 }}>#{a.idAudiencia.idExpediente.numeroExpediente}</span>
              <div style={{ fontSize: 11, color: C.muted }}>{fmt(a.idAudiencia.fechaHoraProgramada)}</div>
            </td>
            <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>{fmt(a.fechaActa)}</td>
            <td style={{ padding: "12px 16px", color: C.text }}>{a.usuario.nombres} {a.usuario.paterno}</td>
            <td style={{ padding: "12px 16px" }}>
              <span style={{ color: a.firmada ? C.green : C.yellow, fontWeight: 600 }}>
                {a.firmada ? "✓ Firmada" : "⏳ Pendiente"}
              </span>
            </td>
            <td style={{ padding: "12px 16px" }}>
              {a.urlGrabacion
                ? <a href={a.urlGrabacion} target="_blank" rel="noreferrer" style={{ color: C.blue, fontSize: 12 }}>🎥 Ver</a>
                : <span style={{ color: C.muted }}>—</span>}
            </td>
            <td style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", gap: 6 }}>
                <ActionBtn onClick={() => abrirEditar(a)} color={C.blue} label="Editar" />
                <ActionBtn onClick={() => eliminar(Number(a.idActa))} color={C.red} label="Eliminar" />
              </div>
            </td>
          </tr>
        ))}
      </Tabla>

      {modal && (
        <Modal onClose={() => setModal(false)} width={560}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: C.text }}>
            {editando ? "Editar acta" : "Nueva acta de audiencia"}
          </h2>
          {!editando && (
            <>
              <SelectField label="Audiencia *" value={form.idAudiencia} onChange={f("idAudiencia")}>
                <option value={0}>— Seleccionar audiencia —</option>
                {audiencias.map((a: any) => (
                  <option key={a.idAudiencia} value={a.idAudiencia}>
                    #{a.idExpediente.numeroExpediente} — {fmt(a.fechaHoraProgramada)}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Usuario responsable *" value={form.idUsuario} onChange={f("idUsuario")}>
                <option value={0}>— Seleccionar usuario —</option>
                {usuarios.map((u: any) => (
                  <option key={u.idUsuario} value={u.idUsuario}>{u.nombres} {u.paterno}</option>
                ))}
              </SelectField>
            </>
          )}
          <TextareaField label="Contenido del acta *" value={form.contenido} onChange={f("contenido")} rows={6} />
          <Field label="URL de grabación" value={form.urlGrabacion} onChange={f("urlGrabacion")} placeholder="https://..." />
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.text, cursor: "pointer" }}>
              <input type="checkbox" checked={form.firmada}
                onChange={e => setForm(p => ({ ...p, firmada: e.target.checked }))} />
              Acta firmada
            </label>
          </div>
          <ErrorBox msg={err} />
          <ModalFooter onCancel={() => setModal(false)} onSave={guardar} saveLabel={editando ? "Guardar cambios" : "Crear acta"} />
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════
const TABS = [
  { id: "audiencias",    label: "Audiencias",         icon: "⚖️" },
  { id: "tipos",         label: "Tipos de audiencia", icon: "📋" },
  { id: "salas",         label: "Salas",              icon: "🏛️" },
  { id: "asistencias",   label: "Asistencias",        icon: "👥" },
  { id: "actas",         label: "Actas",              icon: "📄" },
];

export default function AudienciasPage() {
  const [tabActiva, setTab] = useState("audiencias");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg, color: C.text, padding: "28px 32px" }}>

      {/* Encabezado */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Audiencias</h1>
        <p style={{ fontSize: 13, color: C.muted }}>Gestión de audiencias, salas, asistencias y actas</p>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 2, marginBottom: 24,
        borderBottom: `1px solid ${C.border}`, paddingBottom: 0,
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            style={{
              padding: "8px 16px", fontSize: 13, cursor: "pointer",
              border: "none", outline: "none",
              backgroundColor: "transparent",
              color: tabActiva === tab.id ? C.blue : C.muted,
              borderBottom: tabActiva === tab.id ? `2px solid ${C.blue}` : "2px solid transparent",
              fontWeight: tabActiva === tab.id ? 600 : 400,
              transition: "all 0.15s",
              marginBottom: -1,
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido por tab */}
      {tabActiva === "audiencias"  && <TabAudiencias />}
      {tabActiva === "tipos"       && <TabTiposAudiencia />}
      {tabActiva === "salas"       && <TabSalasAudiencia />}
      {tabActiva === "asistencias" && <TabAsistencias />}
      {tabActiva === "actas"       && <TabActas />}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}