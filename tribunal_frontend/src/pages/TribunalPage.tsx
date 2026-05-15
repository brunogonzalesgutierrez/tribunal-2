import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_TRIBUNALES,
  GET_SALAS_TRIBUNAL,
  GET_VOCALES,
  GET_PERSONAS,
  GET_CONFORMACIONES,
  GET_EXPEDIENTES_SIMPLE,
  CREAR_TRIBUNAL,
  ACTUALIZAR_TRIBUNAL,
  ELIMINAR_TRIBUNAL,
  CREAR_SALA_TRIBUNAL,
  ACTUALIZAR_SALA_TRIBUNAL,
  ELIMINAR_SALA_TRIBUNAL,
  CREAR_VOCAL,
  ACTUALIZAR_VOCAL,
  ELIMINAR_VOCAL,
  CREAR_CONFORMACION,
  ELIMINAR_CONFORMACION,
} from "../graphql/tribunal";

// ─── TIPOS ───────────────────────────────────────────────

interface Tribunal {
  idTribunal: number;
  nombreTribunal: string;
  instancia: string;
  normaCreacion: string;
}

interface SalaTribunal {
  idSala: number;
  nombreSala: string;
  activa: boolean;
  idTribunal: { idTribunal: number; nombreTribunal: string; instancia: string };
}

interface Persona {
  idPersona: number;
  nombre: string;
  primerApellido: string;
  segundoApellido?: string;
  numeroDocumento: string;
  esAbogado: boolean;
}

interface VocalTribunal {
  idVocal: number;
  cargo: string;
  fechaPosesion: string;
  fechaConclusion?: string;
  activo: boolean;
  idPersona: Persona;
  idSala?: { idSala: number; nombreSala: string; idTribunal: { nombreTribunal: string } };
  usuario?: { idUsuario: number; nombres: string; paterno: string };
}

interface Conformacion {
  idConformacion: number;
  rolEnCaso: string;
  fechaAsignacion: string;
  idExpediente: { idExpediente: number; numeroExpediente: string };
  idVocal: { idVocal: number; cargo: string; idPersona: { nombre: string; primerApellido: string } };
}

interface ExpedienteSimple {
  idExpediente: number;
  numeroExpediente: string;
  ano: number;
  idEstadoExpediente?: { nombreEstado: string };
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
  purple: "#bc8cff",
};

// ─── HELPERS ─────────────────────────────────────────────

const fmtFecha = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-BO", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const nombreCompleto = (p: Persona) =>
  `${p.nombre} ${p.primerApellido}${p.segundoApellido ? " " + p.segundoApellido : ""}`;

// ─── MODAL ───────────────────────────────────────────────
function Modal({
  children, onClose, width = 480,
}: { children: React.ReactNode; onClose: () => void; width?: number }) {
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

const TextArea = ({
  label, value, onChange, required = false, placeholder = "",
}: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; placeholder?: string;
}) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 5 }}>
      {label}{required && <span style={{ color: C.red }}> *</span>}
    </label>
    <textarea
      value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} rows={3}
      style={{
        width: "100%", padding: "8px 10px", backgroundColor: C.bg,
        border: `1px solid ${C.border}`, borderRadius: 6, color: C.text,
        fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box",
      }}
    />
  </div>
);

const ErrorBox = ({ msg }: { msg: string }) =>
  msg ? (
    <div style={{
      backgroundColor: "#3d1a1a", border: `1px solid ${C.red}`,
      borderRadius: 6, padding: "8px 12px", fontSize: 12, color: C.red, marginBottom: 14,
    }}>
      {msg}
    </div>
  ) : null;

const BtnPrimary = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick} style={{
    padding: "8px 16px", backgroundColor: "#238636", border: "none",
    borderRadius: 6, color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 500,
  }}>
    {children}
  </button>
);

const BtnGhost = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick} style={{
    padding: "8px 16px", backgroundColor: "transparent",
    border: `1px solid ${C.border}`, borderRadius: 6,
    color: C.muted, fontSize: 13, cursor: "pointer",
  }}>
    {children}
  </button>
);

// ─── TABLA GENÉRICA ──────────────────────────────────────
function Tabla({
  headers, children, loading, emptyMsg, colCount,
}: {
  headers: string[]; children: React.ReactNode;
  loading?: boolean; emptyMsg?: string; colCount: number;
}) {
  return (
    <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: C.bg }}>
            {headers.map(h => (
              <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: C.muted, fontWeight: 500, fontSize: 12 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            [...Array(3)].map((_, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                {[...Array(colCount)].map((_, j) => (
                  <td key={j} style={{ padding: "12px 16px" }}>
                    <div style={{ height: 12, backgroundColor: C.borderLight, borderRadius: 4 }} />
                  </td>
                ))}
              </tr>
            ))
          ) : children}
        </tbody>
      </table>
    </div>
  );
}

const Tr = ({ children, last }: { children: React.ReactNode; last?: boolean }) => (
  <tr
    style={{ borderBottom: last ? "none" : `1px solid ${C.borderLight}` }}
    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#1c2128")}
    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
  >
    {children}
  </tr>
);

const Td = ({ children, muted = false, mono = false }: {
  children: React.ReactNode; muted?: boolean; mono?: boolean;
}) => (
  <td style={{
    padding: "12px 16px",
    color: muted ? C.muted : C.text,
    fontFamily: mono ? "monospace" : "inherit",
    fontSize: mono ? 12 : 13,
  }}>
    {children}
  </td>
);

const AccionesTd = ({ children }: { children: React.ReactNode }) => (
  <td style={{ padding: "10px 16px" }}>
    <div style={{ display: "flex", gap: 6 }}>{children}</div>
  </td>
);

const BtnTabla = ({
  onClick, variant = "blue", children,
}: { onClick: () => void; variant?: "blue" | "red" | "ghost"; children: React.ReactNode }) => {
  const s: Record<string, React.CSSProperties> = {
    blue:  { backgroundColor: "#1c2d3a", color: C.blue, border: `1px solid #1f4060` },
    red:   { backgroundColor: "transparent", color: C.red, border: `1px solid ${C.red}` },
    ghost: { backgroundColor: "transparent", color: C.muted, border: `1px solid ${C.border}` },
  };
  return (
    <button onClick={onClick} style={{
      ...s[variant], borderRadius: 5, padding: "4px 10px",
      fontSize: 12, cursor: "pointer",
    }}>
      {children}
    </button>
  );
};

const Badge = ({ activo }: { activo: boolean }) => (
  <span style={{
    fontSize: 11, padding: "2px 8px", borderRadius: 4,
    backgroundColor: activo ? "#1a3d22" : "#3d1a1a",
    color: activo ? C.green : C.red, fontWeight: 500,
  }}>
    {activo ? "Activo" : "Inactivo"}
  </span>
);

// ─── TIPOS DE TAB ────────────────────────────────────────
type Tab = "tribunales" | "salas" | "vocales" | "conformaciones";

// ─── ESTADOS INICIALES ───────────────────────────────────
const initTribunal    = { nombreTribunal: "", instancia: "", normaCreacion: "" };
const initSala        = { idTribunal: "0", nombreSala: "", activa: "true" };
const initVocal       = { idPersona: "0", idSala: "0", cargo: "", fechaPosesion: "", idUsuario: "1" };
const initConformacion = { idExpediente: "0", idVocal: "0", rolEnCaso: "" };

// ─── PÁGINA PRINCIPAL ────────────────────────────────────
export default function TribunalPage() {
  const [tab, setTab] = useState<Tab>("tribunales");
  const [error, setError] = useState("");

  // modales
  const [modalTribunal,    setModalTribunal]    = useState(false);
  const [modalSala,        setModalSala]        = useState(false);
  const [modalVocal,       setModalVocal]       = useState(false);
  const [modalConformacion,setModalConformacion]= useState(false);

  // editando
  const [editTribunal, setEditTribunal] = useState<Tribunal | null>(null);
  const [editSala,     setEditSala]     = useState<SalaTribunal | null>(null);
  const [editVocal,    setEditVocal]    = useState<VocalTribunal | null>(null);

  // forms
  const [formTribunal,    setFormTribunal]    = useState(initTribunal);
  const [formSala,        setFormSala]        = useState(initSala);
  const [formVocal,       setFormVocal]       = useState(initVocal);
  const [formConformacion,setFormConformacion]= useState(initConformacion);

  // ── queries ──
  const { data: dTrib, loading: lTrib, refetch: rTrib } = useQuery(GET_TRIBUNALES);
  const { data: dSala, loading: lSala, refetch: rSala } = useQuery(GET_SALAS_TRIBUNAL);
  const { data: dVoc,  loading: lVoc,  refetch: rVoc  } = useQuery(GET_VOCALES);
  const { data: dPers }  = useQuery(GET_PERSONAS);
  const { data: dConf, loading: lConf, refetch: rConf } = useQuery(GET_CONFORMACIONES);
  const { data: dExp  }  = useQuery(GET_EXPEDIENTES_SIMPLE);

  // ── mutations ──
  const [crearTribunal]    = useMutation(CREAR_TRIBUNAL);
  const [actualizarTrib]   = useMutation(ACTUALIZAR_TRIBUNAL);
  const [eliminarTrib]     = useMutation(ELIMINAR_TRIBUNAL);
  const [crearSala]        = useMutation(CREAR_SALA_TRIBUNAL);
  const [actualizarSala]   = useMutation(ACTUALIZAR_SALA_TRIBUNAL);
  const [eliminarSala]     = useMutation(ELIMINAR_SALA_TRIBUNAL);
  const [crearVocal]       = useMutation(CREAR_VOCAL);
  const [actualizarVocal]  = useMutation(ACTUALIZAR_VOCAL);
  const [eliminarVocal]    = useMutation(ELIMINAR_VOCAL);
  const [crearConf]        = useMutation(CREAR_CONFORMACION);
  const [eliminarConf]     = useMutation(ELIMINAR_CONFORMACION);

  const tribunales:    Tribunal[]        = dTrib?.allTribunales    ?? [];
  const salas:         SalaTribunal[]    = dSala?.allSalasTribunal  ?? [];
  const vocales:       VocalTribunal[]   = dVoc?.allVocales         ?? [];
  const personas:      Persona[]         = dPers?.allPersonas        ?? [];
  const conformaciones:Conformacion[]    = dConf?.allConformaciones  ?? [];
  const expedientes:   ExpedienteSimple[]= dExp?.allExpedientes      ?? [];

  const cerrar = () => {
    setModalTribunal(false); setModalSala(false);
    setModalVocal(false); setModalConformacion(false);
    setEditTribunal(null); setEditSala(null); setEditVocal(null);
    setError("");
  };

  // ── TRIBUNAL ──────────────────────────────────────────
  const abrirCrearTrib = () => {
    setEditTribunal(null); setFormTribunal(initTribunal); setError(""); setModalTribunal(true);
  };
  const abrirEditarTrib = (t: Tribunal) => {
    setEditTribunal(t);
    setFormTribunal({ nombreTribunal: t.nombreTribunal, instancia: t.instancia, normaCreacion: t.normaCreacion });
    setError(""); setModalTribunal(true);
  };
  const guardarTribunal = async () => {
    if (!formTribunal.nombreTribunal || !formTribunal.instancia || !formTribunal.normaCreacion) {
      setError("Todos los campos son obligatorios."); return;
    }
    try {
      if (editTribunal) {
        await actualizarTrib({ variables: { id: Number(editTribunal.idTribunal), ...formTribunal } });
      } else {
        await crearTribunal({ variables: formTribunal });
      }
      await rTrib(); cerrar();
    } catch (e: any) { setError(e.message ?? "Error al guardar."); }
  };
  const eliminarTribunal = async (id: number) => {
    if (!window.confirm("¿Eliminar este tribunal? Se eliminarán todas sus salas.")) return;
    const { data } = await eliminarTrib({ variables: { id: Number(id) } });
    if (!data?.eliminarTribunal?.ok) {
      alert(data?.eliminarTribunal?.mensaje ?? "No se pudo eliminar");
      return;
    }
    rTrib();
  };
  // ── SALA ──────────────────────────────────────────────
  const abrirCrearSala = () => {
    setEditSala(null); setFormSala(initSala); setError(""); setModalSala(true);
  };
  const abrirEditarSala = (s: SalaTribunal) => {
    setEditSala(s);
    setFormSala({ idTribunal: String(s.idTribunal.idTribunal), nombreSala: s.nombreSala, activa: String(s.activa) });
    setError(""); setModalSala(true);
  };
  const guardarSala = async () => {
    if (formSala.idTribunal === "0" || !formSala.nombreSala) {
      setError("Tribunal y nombre de sala son obligatorios."); return;
    }
    try {
      if (editSala) {
        await actualizarSala({
          variables: {
            id: Number(editSala.idSala),
            nombreSala: formSala.nombreSala,
            activa: formSala.activa === "true",
          },
        });
      } else {
        await crearSala({
          variables: {
            idTribunal: Number(formSala.idTribunal),
            nombreSala: formSala.nombreSala,
            activa: formSala.activa === "true",
          },
        });
      }
      await rSala(); cerrar();
    } catch (e: any) { setError(e.message ?? "Error al guardar."); }
  };
  const eliminarSalaTrib = async (id: number) => {
    if (!window.confirm("¿Eliminar esta sala?")) return;
    const { data } = await eliminarSala({ variables: { id: Number(id) } });
    if (!data?.eliminarSalaTribunal?.ok) {
      alert(data?.eliminarSalaTribunal?.mensaje ?? "No se pudo eliminar");
      return;
    }
    rSala();
  };
  // ── VOCAL ─────────────────────────────────────────────
  const abrirCrearVocal = () => {
    setEditVocal(null); setFormVocal(initVocal); setError(""); setModalVocal(true);
  };
  const abrirEditarVocal = (v: VocalTribunal) => {
    setEditVocal(v);
    setFormVocal({
      idPersona: String(v.idPersona.idPersona),
      idSala: v.idSala ? String(v.idSala.idSala) : "0",
      cargo: v.cargo,
      fechaPosesion: v.fechaPosesion?.slice(0, 10) ?? "",
      idUsuario: v.usuario ? String(v.usuario.idUsuario) : "1",
    });
    setError(""); setModalVocal(true);
  };
  const guardarVocal = async () => {
    if (formVocal.idPersona === "0" || !formVocal.cargo || !formVocal.fechaPosesion) {
      setError("Persona, cargo y fecha de posesión son obligatorios."); return;
    }
    try {
      if (editVocal) {
        await actualizarVocal({
          variables: {
            id: Number(editVocal.idVocal),
            input: {
              idSala: formVocal.idSala !== "0" ? Number(formVocal.idSala) : null,
              cargo: formVocal.cargo,
            },
          },
        });
      } else {
        await crearVocal({
          variables: {
            idPersona: Number(formVocal.idPersona),
            cargo: formVocal.cargo,
            fechaPosesion: formVocal.fechaPosesion,
            idUsuario: Number(formVocal.idUsuario),
            idSala: formVocal.idSala !== "0" ? Number(formVocal.idSala) : undefined,
          },
        });
      }
      await rVoc(); cerrar();
    } catch (e: any) { setError(e.message ?? "Error al guardar."); }
  };
  const desactivarVocal = async (v: VocalTribunal) => {
    await actualizarVocal({
      variables: { id: Number(v.idVocal), input: { activo: !v.activo } },
    });
    rVoc();
  };
  const eliminarVocalFn = async (id: number) => {
    if (!window.confirm("¿Eliminar este vocal?")) return;
    const { data } = await eliminarVocal({ variables: { id: Number(id) } });
    if (!data?.eliminarVocal?.ok) {
      alert(data?.eliminarVocal?.mensaje ?? "No se pudo eliminar");
      return;
    }
    rVoc();
  };

  // ── CONFORMACIÓN ──────────────────────────────────────
  const abrirCrearConf = () => {
    setFormConformacion(initConformacion); setError(""); setModalConformacion(true);
  };
  const guardarConformacion = async () => {
    if (
      formConformacion.idExpediente === "0" ||
      formConformacion.idVocal === "0" ||
      !formConformacion.rolEnCaso
    ) {
      setError("Todos los campos son obligatorios."); return;
    }
    try {
      await crearConf({
        variables: {
          idExpediente: Number(formConformacion.idExpediente),
          idVocal: Number(formConformacion.idVocal),
          rolEnCaso: formConformacion.rolEnCaso,
        },
      });
      await rConf(); cerrar();
    } catch (e: any) { setError(e.message ?? "Error al guardar."); }
  };
  const eliminarConformacion = async (id: number) => {
    if (!window.confirm("¿Remover esta conformación?")) return;
    const { data } = await eliminarConf({ variables: { id: Number(id) } });
    if (!data?.eliminarConformacion?.ok) {
      alert(data?.eliminarConformacion?.mensaje ?? "No se pudo eliminar");
      return;
    }
    rConf();
  };

  // ─── TABS CONFIG ──────────────────────────────────────
  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "tribunales",    label: "Tribunales",    count: tribunales.length },
    { key: "salas",         label: "Salas",         count: salas.length },
    { key: "vocales",       label: "Vocales",        count: vocales.length },
    { key: "conformaciones",label: "Conformaciones", count: conformaciones.length },
  ];

  const btnNuevo: Record<Tab, { label: string; action: () => void }> = {
    tribunales:    { label: "+ Nuevo tribunal",     action: abrirCrearTrib },
    salas:         { label: "+ Nueva sala",          action: abrirCrearSala },
    vocales:       { label: "+ Nuevo vocal",         action: abrirCrearVocal },
    conformaciones:{ label: "+ Nueva conformación",  action: abrirCrearConf },
  };

  // ─── RENDER ───────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg, color: C.text, padding: "28px 32px" }}>

      {/* Encabezado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Tribunal</h1>
          <p style={{ fontSize: 13, color: C.muted }}>Gestión de tribunales, salas, vocales y conformaciones</p>
        </div>
        <button onClick={btnNuevo[tab].action} style={{
          backgroundColor: "#238636", color: "#fff", border: "none",
          borderRadius: 6, padding: "8px 16px", fontSize: 13,
          cursor: "pointer", fontWeight: 500,
        }}>
          {btnNuevo[tab].label}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "8px 18px", fontSize: 13, cursor: "pointer",
              backgroundColor: "transparent", border: "none",
              borderBottom: tab === t.key ? `2px solid ${C.blue}` : "2px solid transparent",
              color: tab === t.key ? C.blue : C.muted,
              fontWeight: tab === t.key ? 600 : 400,
              marginBottom: -1, display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {t.label}
            <span style={{
              backgroundColor: tab === t.key ? "#1c2d3a" : C.borderLight,
              color: tab === t.key ? C.blue : C.muted,
              fontSize: 10, padding: "1px 6px", borderRadius: 10, fontWeight: 600,
            }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── TAB: TRIBUNALES ──────────────────────────────── */}
      {tab === "tribunales" && (
        <Tabla
          headers={["Nombre del tribunal", "Instancia", "Norma de creación", "Salas", "Acciones"]}
          loading={lTrib} colCount={5}
          emptyMsg="No hay tribunales registrados"
        >
          {tribunales.length === 0 ? (
            <tr><td colSpan={5} style={{ padding: "36px 16px", textAlign: "center", color: C.muted }}>
              No hay tribunales registrados
            </td></tr>
          ) : tribunales.map((t, i) => {
            const nSalas = salas.filter(s => s.idTribunal.idTribunal === t.idTribunal).length;
            return (
              <Tr key={t.idTribunal} last={i === tribunales.length - 1}>
                <Td>
                  <div style={{ fontWeight: 600 }}>{t.nombreTribunal}</div>
                </Td>
                <Td>
                  <span style={{
                    backgroundColor: "#1c2d3a", color: C.blue,
                    fontSize: 11, padding: "2px 8px", borderRadius: 4,
                  }}>
                    {t.instancia}
                  </span>
                </Td>
                <Td muted>{t.normaCreacion}</Td>
                <Td>
                  <span style={{ color: C.purple, fontWeight: 600 }}>{nSalas}</span>
                  <span style={{ color: C.muted, fontSize: 12 }}> sala{nSalas !== 1 ? "s" : ""}</span>
                </Td>
                <AccionesTd>
                  <BtnTabla variant="blue" onClick={() => abrirEditarTrib(t)}>Editar</BtnTabla>
                
                  <BtnTabla variant="red" onClick={() => eliminarTribunal(Number(t.idTribunal))}>Eliminar</BtnTabla>
                  
                </AccionesTd>
              </Tr>
            );
          })}
        </Tabla>
      )}

      {/* ── TAB: SALAS ───────────────────────────────────── */}
      {tab === "salas" && (
        <Tabla
          headers={["Nombre de sala", "Tribunal", "Instancia", "Estado", "Acciones"]}
          loading={lSala} colCount={5}
        >
          {salas.length === 0 ? (
            <tr><td colSpan={5} style={{ padding: "36px 16px", textAlign: "center", color: C.muted }}>
              No hay salas registradas
            </td></tr>
          ) : salas.map((s, i) => (
            <Tr key={s.idSala} last={i === salas.length - 1}>
              <Td><span style={{ fontWeight: 600 }}>{s.nombreSala}</span></Td>
              <Td>
                <div style={{ fontWeight: 500 }}>{s.idTribunal.nombreTribunal}</div>
              </Td>
              <Td>
                <span style={{
                  backgroundColor: "#1c2d3a", color: C.blue,
                  fontSize: 11, padding: "2px 8px", borderRadius: 4,
                }}>
                  {s.idTribunal.instancia}
                </span>
              </Td>
              <Td><Badge activo={s.activa} /></Td>
              <AccionesTd>
                <BtnTabla variant="blue" onClick={() => abrirEditarSala(s)}>Editar</BtnTabla>
                <BtnTabla variant="red"  onClick={() => eliminarSalaTrib(Number(s.idSala))}>Eliminar</BtnTabla>
              </AccionesTd>
            </Tr>
          ))}
        </Tabla>
      )}

      {/* ── TAB: VOCALES ─────────────────────────────────── */}
      {tab === "vocales" && (
        <Tabla
          headers={["Vocal", "Documento", "Cargo", "Sala asignada", "Posesión", "Estado", "Acciones"]}
          loading={lVoc} colCount={7}
        >
          {vocales.length === 0 ? (
            <tr><td colSpan={7} style={{ padding: "36px 16px", textAlign: "center", color: C.muted }}>
              No hay vocales registrados
            </td></tr>
          ) : vocales.map((v, i) => (
            <Tr key={v.idVocal} last={i === vocales.length - 1}>
              <Td>
                <div style={{ fontWeight: 600 }}>{nombreCompleto(v.idPersona)}</div>
                {v.idPersona.esAbogado && (
                  <div style={{ fontSize: 11, color: C.yellow }}>Abogado</div>
                )}
              </Td>
              <Td mono muted>{v.idPersona.numeroDocumento}</Td>
              <Td>
                <span style={{
                  backgroundColor: "#1c2d3a", color: C.blue,
                  fontSize: 11, padding: "2px 8px", borderRadius: 4,
                }}>
                  {v.cargo}
                </span>
              </Td>
              <Td>
                {v.idSala ? (
                  <div>
                    <div style={{ fontWeight: 500 }}>{v.idSala.nombreSala}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{v.idSala.idTribunal.nombreTribunal}</div>
                  </div>
                ) : (
                  <span style={{ color: C.muted, fontSize: 12 }}>Sin asignar</span>
                )}
              </Td>
              <Td muted>{fmtFecha(v.fechaPosesion)}</Td>
              <Td><Badge activo={v.activo} /></Td>
              <AccionesTd>
                <BtnTabla variant="blue" onClick={() => abrirEditarVocal(v)}>Editar</BtnTabla>
                <BtnTabla
                  variant={v.activo ? "red" : "ghost"}
                  onClick={() => desactivarVocal(v)}
                >
                  {v.activo ? "Desactivar" : "Activar"}
                </BtnTabla>
                <BtnTabla variant="red" onClick={() => eliminarVocalFn(Number(v.idVocal))}>Eliminar</BtnTabla>
              </AccionesTd>
            </Tr>
          ))}
        </Tabla>
      )}

      {/* ── TAB: CONFORMACIONES ──────────────────────────── */}
      {tab === "conformaciones" && (
        <Tabla
          headers={["Expediente", "Vocal", "Cargo del vocal", "Rol en caso", "Fecha asignación", "Acciones"]}
          loading={lConf} colCount={6}
        >
          {conformaciones.length === 0 ? (
            <tr><td colSpan={6} style={{ padding: "36px 16px", textAlign: "center", color: C.muted }}>
              No hay conformaciones registradas
            </td></tr>
          ) : conformaciones.map((c, i) => (
            <Tr key={c.idConformacion} last={i === conformaciones.length - 1}>
              <Td mono>
                <span style={{ color: C.blue, fontWeight: 600 }}>{c.idExpediente.numeroExpediente}</span>
              </Td>
              <Td>
                <div style={{ fontWeight: 600 }}>
                  {c.idVocal.idPersona.nombre} {c.idVocal.idPersona.primerApellido}
                </div>
              </Td>
              <Td>
                <span style={{
                  backgroundColor: "#1c2d3a", color: C.blue,
                  fontSize: 11, padding: "2px 8px", borderRadius: 4,
                }}>
                  {c.idVocal.cargo}
                </span>
              </Td>
              <Td>
                <span style={{
                  backgroundColor: "#2d1f3a", color: C.purple,
                  fontSize: 11, padding: "2px 8px", borderRadius: 4,
                }}>
                  {c.rolEnCaso}
                </span>
              </Td>
              <Td muted>{fmtFecha(c.fechaAsignacion)}</Td>
              <AccionesTd>
                <BtnTabla variant="red" onClick={() => eliminarConformacion(Number(c.idConformacion))}>
                  Remover
                </BtnTabla>
              </AccionesTd>
            </Tr>
          ))}
        </Tabla>
      )}

      {/* ── MODAL: TRIBUNAL ──────────────────────────────── */}
      {modalTribunal && (
        <Modal onClose={cerrar}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: C.text }}>
            {editTribunal ? "Editar tribunal" : "Nuevo tribunal"}
          </h2>
          <Field
            label="Nombre del tribunal" required
            value={formTribunal.nombreTribunal}
            onChange={v => setFormTribunal(p => ({ ...p, nombreTribunal: v }))}
            placeholder="Ej: Tribunal Disciplinario Universitario"
          />
          <Field
            label="Instancia" required
            value={formTribunal.instancia}
            onChange={v => setFormTribunal(p => ({ ...p, instancia: v }))}
            placeholder="Ej: Primera instancia"
          />
          <TextArea
            label="Norma de creación" required
            value={formTribunal.normaCreacion}
            onChange={v => setFormTribunal(p => ({ ...p, normaCreacion: v }))}
            placeholder="Ej: Resolución HCU N° 001/2020"
          />
          <ErrorBox msg={error} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <BtnGhost onClick={cerrar}>Cancelar</BtnGhost>
            <BtnPrimary onClick={guardarTribunal}>
              {editTribunal ? "Guardar cambios" : "Crear tribunal"}
            </BtnPrimary>
          </div>
        </Modal>
      )}

      {/* ── MODAL: SALA ──────────────────────────────────── */}
      {modalSala && (
        <Modal onClose={cerrar} width={440}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: C.text }}>
            {editSala ? "Editar sala" : "Nueva sala"}
          </h2>
          {!editSala && (
            <SelectField
              label="Tribunal" required
              value={formSala.idTribunal}
              onChange={v => setFormSala(p => ({ ...p, idTribunal: v }))}
            >
              <option value="0">— Selecciona un tribunal —</option>
              {tribunales.map(t => (
                <option key={t.idTribunal} value={t.idTribunal}>{t.nombreTribunal}</option>
              ))}
            </SelectField>
          )}
          <Field
            label="Nombre de sala" required
            value={formSala.nombreSala}
            onChange={v => setFormSala(p => ({ ...p, nombreSala: v }))}
            placeholder="Ej: Sala A"
          />
          <SelectField
            label="Estado"
            value={formSala.activa}
            onChange={v => setFormSala(p => ({ ...p, activa: v }))}
          >
            <option value="true">Activa</option>
            <option value="false">Inactiva</option>
          </SelectField>
          <ErrorBox msg={error} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <BtnGhost onClick={cerrar}>Cancelar</BtnGhost>
            <BtnPrimary onClick={guardarSala}>
              {editSala ? "Guardar cambios" : "Crear sala"}
            </BtnPrimary>
          </div>
        </Modal>
      )}

      {/* ── MODAL: VOCAL ─────────────────────────────────── */}
      {modalVocal && (
        <Modal onClose={cerrar} width={500}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: C.text }}>
            {editVocal ? "Editar vocal" : "Nuevo vocal"}
          </h2>
          {!editVocal && (
            <SelectField
              label="Persona" required
              value={formVocal.idPersona}
              onChange={v => setFormVocal(p => ({ ...p, idPersona: v }))}
            >
              <option value="0">— Selecciona una persona —</option>
              {personas.map(p => (
                <option key={p.idPersona} value={p.idPersona}>
                  {nombreCompleto(p)} — {p.numeroDocumento}
                </option>
              ))}
            </SelectField>
          )}
          <Field
            label="Cargo" required
            value={formVocal.cargo}
            onChange={v => setFormVocal(p => ({ ...p, cargo: v }))}
            placeholder="Ej: Vocal Titular"
          />
          <SelectField
            label="Sala asignada"
            value={formVocal.idSala}
            onChange={v => setFormVocal(p => ({ ...p, idSala: v }))}
          >
            <option value="0">— Sin asignar —</option>
            {salas.filter(s => s.activa).map(s => (
              <option key={s.idSala} value={s.idSala}>
                {s.nombreSala} — {s.idTribunal.nombreTribunal}
              </option>
            ))}
          </SelectField>
          {!editVocal && (
            <Field
              label="Fecha de posesión" required type="date"
              value={formVocal.fechaPosesion}
              onChange={v => setFormVocal(p => ({ ...p, fechaPosesion: v }))}
            />
          )}
          <ErrorBox msg={error} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <BtnGhost onClick={cerrar}>Cancelar</BtnGhost>
            <BtnPrimary onClick={guardarVocal}>
              {editVocal ? "Guardar cambios" : "Registrar vocal"}
            </BtnPrimary>
          </div>
        </Modal>
      )}

      {/* ── MODAL: CONFORMACIÓN ──────────────────────────── */}
      {modalConformacion && (
        <Modal onClose={cerrar} width={460}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: C.text }}>
            Nueva conformación
          </h2>
          <SelectField
            label="Expediente" required
            value={formConformacion.idExpediente}
            onChange={v => setFormConformacion(p => ({ ...p, idExpediente: v }))}
          >
            <option value="0">— Selecciona un expediente —</option>
            {expedientes.map(e => (
              <option key={e.idExpediente} value={e.idExpediente}>
                {e.numeroExpediente} ({e.ano})
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Vocal" required
            value={formConformacion.idVocal}
            onChange={v => setFormConformacion(p => ({ ...p, idVocal: v }))}
          >
            <option value="0">— Selecciona un vocal —</option>
            {vocales.filter(v => v.activo).map(v => (
              <option key={v.idVocal} value={v.idVocal}>
                {nombreCompleto(v.idPersona)} — {v.cargo}
              </option>
            ))}
          </SelectField>
          <Field
            label="Rol en el caso" required
            value={formConformacion.rolEnCaso}
            onChange={v => setFormConformacion(p => ({ ...p, rolEnCaso: v }))}
            placeholder="Ej: Presidente, Vocal Relator, Vocal..."
          />
          <ErrorBox msg={error} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <BtnGhost onClick={cerrar}>Cancelar</BtnGhost>
            <BtnPrimary onClick={guardarConformacion}>Asignar conformación</BtnPrimary>
          </div>
        </Modal>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
