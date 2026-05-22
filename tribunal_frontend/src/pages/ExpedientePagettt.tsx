import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_EXPEDIENTES,
  GET_SALAS_TRIBUNAL,
  GET_TIPOS_PROCESO,
  GET_ESTADOS_EXPEDIENTE,
  GET_HISTORIALES,
  GET_ACTUACIONES,
  GET_TIPOS_ACTUACION,
  CREAR_EXPEDIENTE,
  ACTUALIZAR_EXPEDIENTE,
  ELIMINAR_EXPEDIENTE,
  CREAR_HISTORIAL_ESTADO,
  CREAR_ACTUACION_PROCESAL,
  ELIMINAR_ACTUACION_PROCESAL,
} from "../graphql/expediente";

// ─── TIPOS ───────────────────────────────────────────────
interface SalaTribunal {
  idSala: number;
  nombreSala: string;
  idTribunal: { nombreTribunal: string };
}
interface TipoProceso {
  idTipoProceso: number;
  nombre: string;
  codigo: string;
}
interface EstadoExpediente {
  idEstado: number;
  nombreEstado: string;
  esTerminal: boolean;
}
interface Expediente {
  idExpediente: number;
  numeroExpediente: string;
  ano: number;
  fechaIngreso: string;
  fechaConclusion?: string;
  descripcion?: string;
  idSala: SalaTribunal;
  idTipoProceso: TipoProceso;
  idEstadoExpediente?: EstadoExpediente;
}
interface HistorialEstado {
  idHistorial: number;
  fechaCambio: string;
  motivo: string;
  idExpediente: { idExpediente: number; numeroExpediente: string };
  idEstadoAnterior?: { idEstado: number; nombreEstado: string };
  idEstadoNuevo: { idEstado: number; nombreEstado: string };
  usuario: { idUsuario: number; nombres: string; paterno: string };
}
interface TipoActuacion {
  idTipoActuacion: number;
  codigo: string;
  nombre: string;
}
interface ActuacionProcesal {
  idActuacion: number;
  folioInicio: number;
  folioFin: number;
  esPublica: boolean;
  fechaActuacion: string;
  descripcion: string;
  idExpediente: { idExpediente: number; numeroExpediente: string };
  idTipoActuacion: TipoActuacion;
  usuario: { idUsuario: number; nombres: string; paterno: string };
}

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
  orange: "#db6d28",
  purple: "#bc8cff",
};

// ─── HELPERS ─────────────────────────────────────────────

const fmtFecha = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-BO", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const EstadoBadge = ({ estado }: { estado?: EstadoExpediente }) => {
  if (!estado) return <span style={{ color: C.muted, fontSize: 11 }}>Sin estado</span>;
  const color = estado.esTerminal ? C.red : C.green;
  const bg    = estado.esTerminal ? "#3d1a1a" : "#1a3d22";
  return (
    <span style={{
      fontSize: 11, padding: "2px 8px", borderRadius: 4,
      backgroundColor: bg, color, fontWeight: 500,
    }}>
      {estado.nombreEstado}
    </span>
  );
};

// ─── MODAL ───────────────────────────────────────────────
function Modal({ children, onClose, width = 500 }: {
  children: React.ReactNode; onClose: () => void; width?: number;
}) {
  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.65)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
        padding: 28, width, maxHeight: "90vh", overflowY: "auto",
      }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// ─── FIELD ───────────────────────────────────────────────
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
  label, value, onChange, children, required = false,
}: {
  label: string; value: string | number; onChange: (v: string) => void;
  children: React.ReactNode; required?: boolean;
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
      {children}
    </select>
  </div>
);

const Btn = ({
  onClick, children, variant = "ghost", disabled = false,
}: {
  onClick: () => void; children: React.ReactNode;
  variant?: "primary" | "danger" | "ghost" | "blue";
  disabled?: boolean;
}) => {
  const styles: Record<string, React.CSSProperties> = {
    primary: { backgroundColor: "#238636", color: "#fff", border: "none" },
    danger:  { backgroundColor: "transparent", color: C.red, border: `1px solid ${C.red}` },
    ghost:   { backgroundColor: "transparent", color: C.muted, border: `1px solid ${C.border}` },
    blue:    { backgroundColor: "#1c2d3a", color: C.blue, border: `1px solid #1f4060` },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles[variant],
        borderRadius: 6, padding: "6px 14px", fontSize: 12,
        cursor: disabled ? "not-allowed" : "pointer", fontWeight: 500,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
};

// ─── TABS ────────────────────────────────────────────────
type Tab = "expedientes" | "historial" | "actuaciones";

// ─── FORMULARIOS INICIALES ───────────────────────────────
const initExpediente = {
  numeroExpediente: "", ano: String(new Date().getFullYear()),
  idSala: "0", idTipoProceso: "0", idEstadoExpediente: "0", descripcion: "",
};

const initHistorial = { idExpediente: "0", idEstadoNuevo: "0", idUsuario: "1", motivo: "" };

const initActuacion = {
  idExpediente: "0", idTipoActuacion: "0", idUsuario: "1",
  folioInicio: "", folioFin: "", descripcion: "",
};

// ─── COMPONENTE PRINCIPAL ────────────────────────────────
export default function ExpedientePage() {
  const [tab, setTab] = useState<Tab>("expedientes");
  const [busqueda, setBusqueda]   = useState("");
  const [modalExp, setModalExp]   = useState(false);
  const [modalHist, setModalHist] = useState(false);
  const [modalAct, setModalAct]   = useState(false);
  const [editando, setEditando]   = useState<Expediente | null>(null);
  const [formExp,  setFormExp]    = useState(initExpediente);
  const [formHist, setFormHist]   = useState(initHistorial);
  const [formAct,  setFormAct]    = useState(initActuacion);
  const [error, setError]         = useState("");

  // ── queries ──
  const { data: dExp,   loading: lExp,  refetch: rExp  } = useQuery(GET_EXPEDIENTES);
  const { data: dSalas }  = useQuery(GET_SALAS_TRIBUNAL);
  const { data: dTipos }  = useQuery(GET_TIPOS_PROCESO);
  const { data: dEst }    = useQuery(GET_ESTADOS_EXPEDIENTE);
  const { data: dHist,  loading: lHist, refetch: rHist } = useQuery(GET_HISTORIALES);
  const { data: dAct,   loading: lAct,  refetch: rAct  } = useQuery(GET_ACTUACIONES);
  const { data: dTAct }   = useQuery(GET_TIPOS_ACTUACION);

  // ── mutations ──
  const [crearExp]      = useMutation(CREAR_EXPEDIENTE);
  const [actualizarExp] = useMutation(ACTUALIZAR_EXPEDIENTE);
  const [eliminarExp]   = useMutation(ELIMINAR_EXPEDIENTE);
  const [crearHist]     = useMutation(CREAR_HISTORIAL_ESTADO);
  const [crearAct]      = useMutation(CREAR_ACTUACION_PROCESAL);
  const [eliminarAct]   = useMutation(ELIMINAR_ACTUACION_PROCESAL);

  const expedientes: Expediente[]      = dExp?.allExpedientes   ?? [];
  const salas: SalaTribunal[]          = dSalas?.allSalasTribunal ?? [];
  const tiposProceso: TipoProceso[]    = dTipos?.allTiposProceso ?? [];
  const estados: EstadoExpediente[]    = dEst?.allEstadosExpediente ?? [];
  const historiales: HistorialEstado[] = dHist?.allHistoriales ?? [];
  const actuaciones: ActuacionProcesal[] = dAct?.allActuaciones ?? [];
  const tiposActuacion: TipoActuacion[]  = dTAct?.allTiposActuacion ?? [];

  const expFiltrados = expedientes.filter(e =>
    `${e.numeroExpediente} ${e.idSala?.idTribunal?.nombreTribunal} ${e.idTipoProceso?.nombre}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  // ── expediente ──
  const abrirCrearExp = () => {
    setEditando(null); setFormExp(initExpediente); setError(""); setModalExp(true);
  };
  const abrirEditarExp = (exp: Expediente) => {
    setEditando(exp);
    setFormExp({
      numeroExpediente: exp.numeroExpediente,
      ano: String(exp.ano),
      idSala: String(exp.idSala.idSala),
      idTipoProceso: String(exp.idTipoProceso.idTipoProceso),
      idEstadoExpediente: exp.idEstadoExpediente ? String(exp.idEstadoExpediente.idEstado) : "0",
      descripcion: exp.descripcion ?? "",
    });
    setError(""); setModalExp(true);
  };

  const guardarExp = async () => {
    if (!formExp.numeroExpediente || formExp.idSala === "0" || formExp.idTipoProceso === "0") {
      setError("Número de expediente, sala y tipo de proceso son obligatorios."); return;
    }
    try {
      const input: Record<string, unknown> = {
        numeroExpediente: formExp.numeroExpediente,
        ano: Number(formExp.ano),
        idSala: Number(formExp.idSala),
        idTipoProceso: Number(formExp.idTipoProceso),
        ...(formExp.descripcion ? { descripcion: formExp.descripcion } : {}),
        ...(formExp.idEstadoExpediente !== "0"
          ? { idEstadoExpediente: Number(formExp.idEstadoExpediente) }
          : {}),
      };
      if (editando) {
        await actualizarExp({ variables: { id: Number(editando.idExpediente), input } });
      } else {
        await crearExp({ variables: { input } });
      }
      await rExp(); setModalExp(false); setEditando(null);
    } catch (e: any) { setError(e.message ?? "Error al guardar."); }
  };

  // ── ELIMINAR EXPEDIENTE ──────────────────────────────────
  const eliminarExpediente = async (id: number) => {
    if (!window.confirm("¿Eliminar este expediente? Esta acción no se puede deshacer.")) return;
    const { data } = await eliminarExp({ variables: { id: Number(id) } });
    if (!data?.eliminarExpediente?.ok) {
      alert(data?.eliminarExpediente?.mensaje ?? "No se pudo eliminar el expediente.");
      return;
    }
    rExp();
  };

  // ── historial ──
  const guardarHist = async () => {
    if (formHist.idExpediente === "0" || formHist.idEstadoNuevo === "0" || !formHist.motivo) {
      setError("Todos los campos del historial son obligatorios."); return;
    }
    try {
      await crearHist({
        variables: {
          idExpediente: Number(formHist.idExpediente),
          idEstadoNuevo: Number(formHist.idEstadoNuevo),
          idUsuario: Number(formHist.idUsuario),
          motivo: formHist.motivo,
        },
      });
      await rHist(); await rExp();
      setModalHist(false); setFormHist(initHistorial); setError("");
    } catch (e: any) { setError(e.message ?? "Error."); }
  };

  // ── actuación ──
  const guardarAct = async () => {
    if (
      formAct.idExpediente === "0" ||
      formAct.idTipoActuacion === "0" ||
      !formAct.folioInicio || !formAct.folioFin
    ) {
      setError("Expediente, tipo de actuación y folios son obligatorios."); return;
    }
    try {
      await crearAct({
        variables: {
          idExpediente: Number(formAct.idExpediente),
          idTipoActuacion: Number(formAct.idTipoActuacion),
          idUsuario: Number(formAct.idUsuario),
          folioInicio: Number(formAct.folioInicio),
          folioFin: Number(formAct.folioFin),
          descripcion: formAct.descripcion || undefined,
        },
      });
      await rAct(); setModalAct(false); setFormAct(initActuacion); setError("");
    } catch (e: any) { setError(e.message ?? "Error."); }
  };

  // ── ELIMINAR ACTUACIÓN ───────────────────────────────────
  const eliminarActuacion = async (id: number) => {
    if (!window.confirm("¿Eliminar esta actuación procesal?")) return;
    const { data } = await eliminarAct({ variables: { id: Number(id) } });
    if (!data?.eliminarActuacionProcesal?.ok) {
      alert(data?.eliminarActuacionProcesal?.mensaje ?? "No se pudo eliminar la actuación.");
      return;
    }
    rAct();
  };

  // ─── RENDER ───────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg, color: C.text, padding: "28px 32px" }}>

      {/* Encabezado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Expedientes</h1>
          <p style={{ fontSize: 13, color: C.muted }}>Gestión de expedientes, estados y actuaciones procesales</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {tab === "expedientes" && (
            <button onClick={abrirCrearExp} style={{
              backgroundColor: "#238636", color: "#fff", border: "none",
              borderRadius: 6, padding: "8px 16px", fontSize: 13,
              cursor: "pointer", fontWeight: 500,
            }}>
              + Nuevo expediente
            </button>
          )}
          {tab === "historial" && (
            <button onClick={() => { setFormHist(initHistorial); setError(""); setModalHist(true); }} style={{
              backgroundColor: "#238636", color: "#fff", border: "none",
              borderRadius: 6, padding: "8px 16px", fontSize: 13,
              cursor: "pointer", fontWeight: 500,
            }}>
              + Cambiar estado
            </button>
          )}
          {tab === "actuaciones" && (
            <button onClick={() => { setFormAct(initActuacion); setError(""); setModalAct(true); }} style={{
              backgroundColor: "#238636", color: "#fff", border: "none",
              borderRadius: 6, padding: "8px 16px", fontSize: 13,
              cursor: "pointer", fontWeight: 500,
            }}>
              + Nueva actuación
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
        {(["expedientes", "historial", "actuaciones"] as Tab[]).map(t => {
          const labels: Record<Tab, string> = {
            expedientes: "Expedientes",
            historial:   "Historial de estados",
            actuaciones: "Actuaciones procesales",
          };
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "8px 18px", fontSize: 13, cursor: "pointer",
                backgroundColor: "transparent", border: "none",
                borderBottom: active ? `2px solid ${C.blue}` : "2px solid transparent",
                color: active ? C.blue : C.muted,
                fontWeight: active ? 600 : 400,
                marginBottom: -1,
              }}
            >
              {labels[t]}
            </button>
          );
        })}
      </div>

      {/* ── TAB: EXPEDIENTES ─────────────────────────────── */}
      {tab === "expedientes" && (
        <>
          <div style={{ marginBottom: 16 }}>
            <input
              placeholder="Buscar por número, tribunal o tipo de proceso..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{
                width: 360, padding: "8px 12px", backgroundColor: C.card,
                border: `1px solid ${C.border}`, borderRadius: 6, color: C.text,
                fontSize: 13, outline: "none",
              }}
            />
          </div>

          <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: C.bg }}>
                  {["Número", "Año", "Sala / Tribunal", "Tipo de proceso", "Estado", "Fecha ingreso", "Acciones"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: C.muted, fontWeight: 500, fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lExp ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                      {[...Array(7)].map((_, j) => (
                        <td key={j} style={{ padding: "12px 16px" }}>
                          <div style={{ height: 12, backgroundColor: C.borderLight, borderRadius: 4 }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : expFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "36px 16px", textAlign: "center", color: C.muted }}>
                      No se encontraron expedientes
                    </td>
                  </tr>
                ) : (
                  expFiltrados.map((exp, i) => (
                    <tr
                      key={exp.idExpediente}
                      style={{ borderBottom: i < expFiltrados.length - 1 ? `1px solid ${C.borderLight}` : "none" }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#1c2128")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: C.blue, fontFamily: "monospace" }}>
                        {exp.numeroExpediente}
                      </td>
                      <td style={{ padding: "12px 16px", color: C.muted }}>{exp.ano}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 500 }}>{exp.idSala?.nombreSala}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{exp.idSala?.idTribunal?.nombreTribunal}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          backgroundColor: "#1c2d3a", color: C.blue,
                          fontSize: 11, padding: "2px 7px", borderRadius: 4,
                        }}>
                          {exp.idTipoProceso?.nombre}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <EstadoBadge estado={exp.idEstadoExpediente} />
                      </td>
                      <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>
                        {fmtFecha(exp.fechaIngreso)}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Btn variant="blue" onClick={() => abrirEditarExp(exp)}>Editar</Btn>
                          <Btn variant="danger" onClick={() => eliminarExpediente(Number(exp.idExpediente))}>Eliminar</Btn>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: C.muted }}>
            {expFiltrados.length} expediente{expFiltrados.length !== 1 ? "s" : ""}
          </div>
        </>
      )}

      {/* ── TAB: HISTORIAL ───────────────────────────────── */}
      {tab === "historial" && (
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: C.bg }}>
                {["Expediente", "Estado anterior", "Estado nuevo", "Fecha", "Usuario", "Motivo"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: C.muted, fontWeight: 500, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lHist ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} style={{ padding: "12px 16px" }}>
                        <div style={{ height: 12, backgroundColor: C.borderLight, borderRadius: 4 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : historiales.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "36px 16px", textAlign: "center", color: C.muted }}>
                    No hay registros en el historial
                  </td>
                </tr>
              ) : (
                historiales.map((h, i) => (
                  <tr
                    key={h.idHistorial}
                    style={{ borderBottom: i < historiales.length - 1 ? `1px solid ${C.borderLight}` : "none" }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#1c2128")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ padding: "12px 16px", color: C.blue, fontFamily: "monospace", fontWeight: 600 }}>
                      {h.idExpediente?.numeroExpediente}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {h.idEstadoAnterior
                        ? <span style={{ color: C.muted, fontSize: 12 }}>{h.idEstadoAnterior.nombreEstado}</span>
                        : <span style={{ color: C.muted, fontSize: 12 }}>—</span>
                      }
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        backgroundColor: "#1a3d22", color: C.green,
                        fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: 500,
                      }}>
                        {h.idEstadoNuevo?.nombreEstado}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>
                      {fmtFecha(h.fechaCambio)}
                    </td>
                    <td style={{ padding: "12px 16px", color: C.text, fontSize: 12 }}>
                      {h.usuario?.nombres} {h.usuario?.paterno}
                    </td>
                    <td style={{ padding: "12px 16px", color: C.muted, maxWidth: 240 }}>
                      <span style={{ fontSize: 12, lineHeight: 1.4 }}>{h.motivo}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TAB: ACTUACIONES ─────────────────────────────── */}
      {tab === "actuaciones" && (
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: C.bg }}>
                {["Expediente", "Tipo", "Folios", "Fecha", "Usuario", "Descripción", "Acciones"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: C.muted, fontWeight: 500, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lAct ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} style={{ padding: "12px 16px" }}>
                        <div style={{ height: 12, backgroundColor: C.borderLight, borderRadius: 4 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : actuaciones.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "36px 16px", textAlign: "center", color: C.muted }}>
                    No hay actuaciones procesales registradas
                  </td>
                </tr>
              ) : (
                actuaciones.map((a, i) => (
                  <tr
                    key={a.idActuacion}
                    style={{ borderBottom: i < actuaciones.length - 1 ? `1px solid ${C.borderLight}` : "none" }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#1c2128")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ padding: "12px 16px", color: C.blue, fontFamily: "monospace", fontWeight: 600 }}>
                      {a.idExpediente?.numeroExpediente}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 500 }}>{a.idTipoActuacion?.nombre}</div>
                      <div style={{ fontSize: 11, color: C.muted, fontFamily: "monospace" }}>
                        {a.idTipoActuacion?.codigo}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12 }}>
                      <span style={{ color: C.purple }}>
                        {a.folioInicio} – {a.folioFin}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: C.muted, fontSize: 12 }}>
                      {fmtFecha(a.fechaActuacion)}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12 }}>
                      {a.usuario?.nombres} {a.usuario?.paterno}
                    </td>
                    <td style={{ padding: "12px 16px", color: C.muted, maxWidth: 220, fontSize: 12 }}>
                      {a.descripcion || "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Btn variant="danger" onClick={() => eliminarActuacion(Number(a.idActuacion))}>
                        Eliminar
                      </Btn>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODAL: EXPEDIENTE ─────────────────────────────── */}
      {modalExp && (
        <Modal onClose={() => { setModalExp(false); setEditando(null); }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: C.text }}>
            {editando ? "Editar expediente" : "Nuevo expediente"}
          </h2>

          <Field
            label="Número de expediente" required
            value={formExp.numeroExpediente}
            onChange={v => setFormExp(p => ({ ...p, numeroExpediente: v }))}
            placeholder="Ej: 001/2025"
          />

          <Field
            label="Año" required type="number"
            value={formExp.ano}
            onChange={v => setFormExp(p => ({ ...p, ano: v }))}
          />

          <SelectField
            label="Sala del tribunal" required
            value={formExp.idSala}
            onChange={v => setFormExp(p => ({ ...p, idSala: v }))}
          >
            <option value="0">— Selecciona una sala —</option>
            {salas.filter(s => s.activa).map(s => (
              <option key={s.idSala} value={s.idSala}>
                {s.nombreSala} — {s.idTribunal?.nombreTribunal}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Tipo de proceso" required
            value={formExp.idTipoProceso}
            onChange={v => setFormExp(p => ({ ...p, idTipoProceso: v }))}
          >
            <option value="0">— Selecciona tipo de proceso —</option>
            {tiposProceso.map(t => (
              <option key={t.idTipoProceso} value={t.idTipoProceso}>
                {t.nombre} ({t.codigo})
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Estado inicial"
            value={formExp.idEstadoExpediente}
            onChange={v => setFormExp(p => ({ ...p, idEstadoExpediente: v }))}
          >
            <option value="0">— Sin estado —</option>
            {estados.map(e => (
              <option key={e.idEstado} value={e.idEstado}>{e.nombreEstado}</option>
            ))}
          </SelectField>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 5 }}>Descripción</label>
            <textarea
              value={formExp.descripcion}
              onChange={e => setFormExp(p => ({ ...p, descripcion: e.target.value }))}
              rows={3}
              style={{
                width: "100%", padding: "8px 10px", backgroundColor: C.bg,
                border: `1px solid ${C.border}`, borderRadius: 6, color: C.text,
                fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: "#3d1a1a", border: `1px solid ${C.red}`,
              borderRadius: 6, padding: "8px 12px", fontSize: 12, color: C.red, marginBottom: 14,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => { setModalExp(false); setEditando(null); }}>Cancelar</Btn>
            <button onClick={guardarExp} style={{
              padding: "8px 16px", backgroundColor: "#238636", border: "none",
              borderRadius: 6, color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 500,
            }}>
              {editando ? "Guardar cambios" : "Crear expediente"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── MODAL: HISTORIAL ─────────────────────────────── */}
      {modalHist && (
        <Modal onClose={() => { setModalHist(false); setError(""); }} width={440}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: C.text }}>
            Registrar cambio de estado
          </h2>

          <SelectField
            label="Expediente" required
            value={formHist.idExpediente}
            onChange={v => setFormHist(p => ({ ...p, idExpediente: v }))}
          >
            <option value="0">— Selecciona un expediente —</option>
            {expedientes.map(e => (
              <option key={e.idExpediente} value={e.idExpediente}>
                {e.numeroExpediente}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Nuevo estado" required
            value={formHist.idEstadoNuevo}
            onChange={v => setFormHist(p => ({ ...p, idEstadoNuevo: v }))}
          >
            <option value="0">— Selecciona un estado —</option>
            {estados.map(e => (
              <option key={e.idEstado} value={e.idEstado}>{e.nombreEstado}</option>
            ))}
          </SelectField>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 5 }}>
              Motivo del cambio <span style={{ color: C.red }}>*</span>
            </label>
            <textarea
              value={formHist.motivo}
              onChange={e => setFormHist(p => ({ ...p, motivo: e.target.value }))}
              rows={3}
              placeholder="Describe el motivo del cambio de estado..."
              style={{
                width: "100%", padding: "8px 10px", backgroundColor: C.bg,
                border: `1px solid ${C.border}`, borderRadius: 6, color: C.text,
                fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: "#3d1a1a", border: `1px solid ${C.red}`,
              borderRadius: 6, padding: "8px 12px", fontSize: 12, color: C.red, marginBottom: 14,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="ghost" onClick={() => { setModalHist(false); setError(""); }}>Cancelar</Btn>
            <button onClick={guardarHist} style={{
              padding: "8px 16px", backgroundColor: "#238636", border: "none",
              borderRadius: 6, color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 500,
            }}>
              Registrar cambio
            </button>
          </div>
        </Modal>
      )}

      {/* ── MODAL: ACTUACIÓN ─────────────────────────────── */}
      {modalAct && (
        <Modal onClose={() => { setModalAct(false); setError(""); }} width={480}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: C.text }}>
            Nueva actuación procesal
          </h2>

          <SelectField
            label="Expediente" required
            value={formAct.idExpediente}
            onChange={v => setFormAct(p => ({ ...p, idExpediente: v }))}
          >
            <option value="0">— Selecciona un expediente —</option>
            {expedientes.map(e => (
              <option key={e.idExpediente} value={e.idExpediente}>
                {e.numeroExpediente}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Tipo de actuación" required
            value={formAct.idTipoActuacion}
            onChange={v => setFormAct(p => ({ ...p, idTipoActuacion: v }))}
          >
            <option value="0">— Selecciona tipo —</option>
            {tiposActuacion.map(t => (
              <option key={t.idTipoActuacion} value={t.idTipoActuacion}>
                {t.nombre} ({t.codigo})
              </option>
            ))}
          </SelectField>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field
              label="Folio inicio" required type="number"
              value={formAct.folioInicio}
              onChange={v => setFormAct(p => ({ ...p, folioInicio: v }))}
            />
            <Field
              label="Folio fin" required type="number"
              value={formAct.folioFin}
              onChange={v => setFormAct(p => ({ ...p, folioFin: v }))}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 5 }}>Descripción</label>
            <textarea
              value={formAct.descripcion}
              onChange={e => setFormAct(p => ({ ...p, descripcion: e.target.value }))}
              rows={3}
              style={{
                width: "100%", padding: "8px 10px", backgroundColor: C.bg,
                border: `1px solid ${C.border}`, borderRadius: 6, color: C.text,
                fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: "#3d1a1a", border: `1px solid ${C.red}`,
              borderRadius: 6, padding: "8px 12px", fontSize: 12, color: C.red, marginBottom: 14,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="ghost" onClick={() => { setModalAct(false); setError(""); }}>Cancelar</Btn>
            <button onClick={guardarAct} style={{
              padding: "8px 16px", backgroundColor: "#238636", border: "none",
              borderRadius: 6, color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 500,
            }}>
              Registrar actuación
            </button>
          </div>
        </Modal>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}