import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_SOLICITUDES,
  GET_USUARIOS_SIMPLE,
  CREAR_SOLICITUD,
  ELIMINAR_SOLICITUD,
} from "../graphql/solicitudes";

// ─── TIPOS ───────────────────────────────────────────────

interface Usuario {
  idUsuario: number;
  nombres: string;
  paterno: string;
  email: string;
  activo: boolean;
}

interface Solicitud {
  idSolicitud: number;
  codigoIanus: string;
  codigoSala: string;
  estadoSolicitud: string;
  fechaSolicitud: string;
  fechaConfirmacion?: string;
  observacion?: string;
  usuario: Usuario;
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

// ─── HELPERS ─────────────────────────────────────────────

type BadgeColor = "green" | "red" | "yellow" | "blue";

const estadoColor = (e: string): BadgeColor => {
  if (e === "APROBADA")  return "green";
  if (e === "RECHAZADA") return "red";
  if (e === "PENDIENTE") return "yellow";
  return "blue";
};

const estadoLabel: Record<string, string> = {
  PENDIENTE:  "Pendiente",
  APROBADA:   "Aprobada",
  RECHAZADA:  "Rechazada",
};

function Badge({ texto, color }: { texto: string; color: BadgeColor }) {
  const map = {
    green:  { bg: "#1a3d22", fg: C.green },
    red:    { bg: "#3d1a1a", fg: C.red },
    yellow: { bg: "#3d2e1a", fg: C.yellow },
    blue:   { bg: "#1c2d3a", fg: C.blue },
  };
  const { bg, fg } = map[color];
  return (
    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, backgroundColor: bg, color: fg, fontWeight: 500 }}>
      {texto}
    </span>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.65)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
        padding: 28, width: 480, maxHeight: "90vh", overflowY: "auto",
      }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

const Field = ({
  label, value, onChange, type = "text", placeholder = "", required = false, readOnly = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; readOnly?: boolean;
}) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 5 }}>
      {label}{required && <span style={{ color: C.red }}> *</span>}
    </label>
    <input
      type={type} value={value} placeholder={placeholder} readOnly={readOnly}
      onChange={e => onChange(e.target.value)}
      style={{
        width: "100%", padding: "8px 10px", backgroundColor: readOnly ? "#0a0f14" : C.bg,
        border: `1px solid ${C.border}`, borderRadius: 6, color: readOnly ? C.muted : C.text,
        fontSize: 13, outline: "none", boxSizing: "border-box",
        cursor: readOnly ? "not-allowed" : "text",
      }}
    />
  </div>
);

const TextareaField = ({
  label, value, onChange, placeholder = "",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 5 }}>{label}</label>
    <textarea
      value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      rows={3}
      style={{
        width: "100%", padding: "8px 10px", backgroundColor: C.bg,
        border: `1px solid ${C.border}`, borderRadius: 6, color: C.text,
        fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box",
        fontFamily: "inherit",
      }}
    />
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

// ─── ESTADÍSTICAS ─────────────────────────────────────────

function StatCard({ label, valor, color }: { label: string; valor: number; color: string }) {
  return (
    <div style={{
      backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
      padding: "16px 20px", flex: 1, minWidth: 130,
    }}>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{valor}</div>
      <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ─── DETALLE MODAL (solo lectura) ────────────────────────

function DetalleModal({ solicitud, onClose }: { solicitud: Solicitud; onClose: () => void }) {
  const fmtFecha = (iso?: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("es-BO", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const color = estadoColor(solicitud.estadoSolicitud);

  return (
    <Modal onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: C.text }}>
          Detalle de solicitud #{solicitud.idSolicitud}
        </h2>
        <Badge texto={estadoLabel[solicitud.estadoSolicitud] ?? solicitud.estadoSolicitud} color={color} />
      </div>

      {/* Códigos */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Código IANUS</div>
          <div style={{ fontSize: 14, fontFamily: "monospace", color: C.blue, fontWeight: 600 }}>{solicitud.codigoIanus}</div>
        </div>
        <div style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Código de sala</div>
          <div style={{ fontSize: 14, fontFamily: "monospace", color: C.blue, fontWeight: 600 }}>{solicitud.codigoSala}</div>
        </div>
      </div>

      {/* Usuario */}
      <div style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px", marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Usuario solicitante</div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{solicitud.usuario.nombres} {solicitud.usuario.paterno}</div>
        <div style={{ fontSize: 12, color: C.muted }}>{solicitud.usuario.email}</div>
      </div>

      {/* Fechas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Fecha de solicitud</div>
          <div style={{ fontSize: 13 }}>{fmtFecha(solicitud.fechaSolicitud)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Fecha de confirmación</div>
          <div style={{ fontSize: 13 }}>{fmtFecha(solicitud.fechaConfirmacion)}</div>
        </div>
      </div>

      {/* Observación */}
      {solicitud.observacion && (
        <div style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px", marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Observación</div>
          <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{solicitud.observacion}</div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <button onClick={onClose} style={{
          padding: "8px 20px", backgroundColor: "transparent",
          border: `1px solid ${C.border}`, borderRadius: 6,
          color: C.muted, fontSize: 13, cursor: "pointer",
        }}>Cerrar</button>
      </div>
    </Modal>
  );
}

// ─── FORM NUEVA SOLICITUD ─────────────────────────────────

const initForm = { idUsuario: "", codigoIanus: "", codigoSala: "", observacion: "" };

function NuevaSolicitudModal({
  usuarios, onClose, onGuardado,
}: {
  usuarios: Usuario[]; onClose: () => void; onGuardado: () => void;
}) {
  const [form, setForm] = useState(initForm);
  const [error, setError] = useState("");
  const [crearSolicitud] = useMutation(CREAR_SOLICITUD);

  const f = (field: string) => (v: string) => setForm(p => ({ ...p, [field]: v }));

  const guardar = async () => {
    if (!form.idUsuario || !form.codigoIanus || !form.codigoSala) {
      setError("Usuario, código IANUS y código de sala son obligatorios."); return;
    }
    try {
      await crearSolicitud({
        variables: {
          idUsuario: Number(form.idUsuario),
          codigoIanus: form.codigoIanus,
          codigoSala: form.codigoSala,
          observacion: form.observacion || undefined,
        },
      });
      onGuardado();
    } catch (e: any) { setError(e.message ?? "Error al guardar."); }
  };

  return (
    <Modal onClose={onClose}>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: C.text }}>
        Nueva solicitud de actualización
      </h2>

      {/* Selector de usuario */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 5 }}>
          Usuario solicitante <span style={{ color: C.red }}>*</span>
        </label>
        <select
          value={form.idUsuario}
          onChange={e => f("idUsuario")(e.target.value)}
          style={{
            width: "100%", padding: "8px 10px", backgroundColor: C.bg,
            border: `1px solid ${C.border}`, borderRadius: 6, color: C.text,
            fontSize: 13, outline: "none",
          }}
        >
          <option value="">— Seleccionar usuario —</option>
          {usuarios.filter(u => u.activo).map(u => (
            <option key={u.idUsuario} value={u.idUsuario}>
              {u.nombres} {u.paterno} — {u.email}
            </option>
          ))}
        </select>
      </div>

      <Field label="Código IANUS"   value={form.codigoIanus} onChange={f("codigoIanus")} required placeholder="ej: IANUS-2024-001" />
      <Field label="Código de sala" value={form.codigoSala}  onChange={f("codigoSala")}  required placeholder="ej: SALA-A1" />
      <TextareaField label="Observación" value={form.observacion} onChange={f("observacion")} placeholder="Descripción opcional de la solicitud..." />

      <ErrorBox msg={error} />

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <button onClick={onClose} style={{
          padding: "8px 16px", backgroundColor: "transparent",
          border: `1px solid ${C.border}`, borderRadius: 6,
          color: C.muted, fontSize: 13, cursor: "pointer",
        }}>Cancelar</button>
        <button onClick={guardar} style={{
          padding: "8px 16px", backgroundColor: "#238636",
          border: "none", borderRadius: 6,
          color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 500,
        }}>Crear solicitud</button>
      </div>
    </Modal>
  );
}

// ─── PÁGINA PRINCIPAL ────────────────────────────────────

type FiltroEstado = "TODOS" | "PENDIENTE" | "APROBADA" | "RECHAZADA";

const FILTROS: { id: FiltroEstado; label: string }[] = [
  { id: "TODOS",     label: "Todos" },
  { id: "PENDIENTE", label: "Pendientes" },
  { id: "APROBADA",  label: "Aprobadas" },
  { id: "RECHAZADA", label: "Rechazadas" },
];

export default function SolicitudesPage() {
  const [modalNuevo, setModalNuevo]         = useState(false);
  const [solicitudDetalle, setSolicitudDetalle] = useState<Solicitud | null>(null);
  const [busqueda, setBusqueda]             = useState("");
  const [filtroEstado, setFiltroEstado]     = useState<FiltroEstado>("TODOS");

  const { data, loading, refetch } = useQuery(GET_SOLICITUDES);
  const { data: dataUsuarios }     = useQuery(GET_USUARIOS_SIMPLE);
  const [eliminarSolicitud]        = useMutation(ELIMINAR_SOLICITUD);

  const solicitudes: Solicitud[] = data?.allSolicitudes ?? [];
  const usuarios: Usuario[]      = dataUsuarios?.allUsuarios ?? [];

  // Estadísticas
  const total     = solicitudes.length;
  const pendientes  = solicitudes.filter(s => s.estadoSolicitud === "PENDIENTE").length;
  const aprobadas   = solicitudes.filter(s => s.estadoSolicitud === "APROBADA").length;
  const rechazadas  = solicitudes.filter(s => s.estadoSolicitud === "RECHAZADA").length;

  // Filtrado
  const filtradas = solicitudes.filter(s => {
    const matchEstado  = filtroEstado === "TODOS" || s.estadoSolicitud === filtroEstado;
    const matchBusqueda = `${s.codigoIanus} ${s.codigoSala} ${s.usuario?.nombres ?? ""} ${s.usuario?.paterno ?? ""} ${s.observacion ?? ""}`
      .toLowerCase().includes(busqueda.toLowerCase());
    return matchEstado && matchBusqueda;
  });

  const eliminar = async (id: number) => {
    if (!window.confirm("¿Eliminar esta solicitud?")) return;
    const { data } = await eliminarSolicitud({ variables: { id: Number(id) } });
    if (!data?.eliminarSolicitud?.ok) {
      alert(data?.eliminarSolicitud?.mensaje ?? "No se pudo eliminar");
      return;
    }
    refetch();
  };

  const fmtFecha = (iso?: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-BO", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg, color: C.text, padding: "28px 32px" }}>

      {/* Encabezado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Solicitudes de actualización</h1>
          <p style={{ fontSize: 13, color: C.muted }}>Gestión de solicitudes de sincronización IANUS</p>
        </div>
        <button onClick={() => setModalNuevo(true)} style={{
          backgroundColor: "#238636", color: "#fff", border: "none",
          borderRadius: 6, padding: "8px 16px", fontSize: 13,
          cursor: "pointer", fontWeight: 500,
        }}>
          + Nueva solicitud
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard label="Total"      valor={total}      color={C.text} />
        <StatCard label="Pendientes" valor={pendientes}  color={C.yellow} />
        <StatCard label="Aprobadas"  valor={aprobadas}   color={C.green} />
        <StatCard label="Rechazadas" valor={rechazadas}  color={C.red} />
      </div>

      {/* Filtros + búsqueda */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        {/* Filtros por estado */}
        <div style={{ display: "flex", gap: 4, backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 4 }}>
          {FILTROS.map(f => {
            const activo = filtroEstado === f.id;
            return (
              <button key={f.id} onClick={() => setFiltroEstado(f.id)} style={{
                padding: "5px 14px", borderRadius: 6, border: "none",
                backgroundColor: activo ? "#238636" : "transparent",
                color: activo ? "#fff" : C.muted,
                fontSize: 12, cursor: "pointer", fontWeight: activo ? 600 : 400,
                transition: "all 0.15s",
              }}>
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Búsqueda */}
        <input
          placeholder="Buscar por código, usuario u observación..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          style={{
            flex: 1, minWidth: 240, padding: "8px 12px",
            backgroundColor: C.card, border: `1px solid ${C.border}`,
            borderRadius: 6, color: C.text, fontSize: 13, outline: "none",
          }}
        />
      </div>

      {/* Tabla */}
      <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: C.bg }}>
              {["#", "Código IANUS", "Código sala", "Usuario", "Estado", "Fecha solicitud", "Fecha confirmación", "Acciones"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: C.muted, fontWeight: 500, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <SkeletonRow cols={8} /> : filtradas.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: "40px 16px", textAlign: "center", color: C.muted }}>
                  No se encontraron solicitudes
                </td>
              </tr>
            ) : (
              filtradas.map((s, i) => (
                <tr key={s.idSolicitud}
                  style={{ borderBottom: i < filtradas.length - 1 ? "1px solid #21262d" : "none" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.row)}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>#{s.idSolicitud}</td>
                  <td style={{ padding: "12px 16px", fontFamily: "monospace", color: C.blue, fontWeight: 600 }}>{s.codigoIanus}</td>
                  <td style={{ padding: "12px 16px", fontFamily: "monospace", color: C.muted }}>{s.codigoSala}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 500 }}>{s.usuario?.nombres} {s.usuario?.paterno}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{s.usuario?.email}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <Badge
                      texto={estadoLabel[s.estadoSolicitud] ?? s.estadoSolicitud}
                      color={estadoColor(s.estadoSolicitud)}
                    />
                  </td>
                  <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>{fmtFecha(s.fechaSolicitud)}</td>
                  <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>{fmtFecha(s.fechaConfirmacion)}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setSolicitudDetalle(s)} style={{
                        backgroundColor: "#1c2d3a", color: C.blue,
                        border: `1px solid #1f4060`, borderRadius: 5,
                        padding: "4px 10px", fontSize: 12, cursor: "pointer",
                      }}>Ver</button>
                      <button onClick={() => eliminar(Number(s.idSolicitud))} style={{
                        backgroundColor: "transparent", color: C.muted,
                        border: `1px solid ${C.border}`, borderRadius: 5,
                        padding: "4px 10px", fontSize: 12, cursor: "pointer",
                      }}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: C.muted }}>
        {filtradas.length} solicitud{filtradas.length !== 1 ? "es" : ""}
        {filtroEstado !== "TODOS" && ` · filtrado por ${estadoLabel[filtroEstado]}`}
      </div>

      {/* Modal nueva solicitud */}
      {modalNuevo && (
        <NuevaSolicitudModal
          usuarios={usuarios}
          onClose={() => setModalNuevo(false)}
          onGuardado={() => { refetch(); setModalNuevo(false); }}
        />
      )}

      {/* Modal detalle */}
      {solicitudDetalle && (
        <DetalleModal
          solicitud={solicitudDetalle}
          onClose={() => setSolicitudDetalle(null)}
        />
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
