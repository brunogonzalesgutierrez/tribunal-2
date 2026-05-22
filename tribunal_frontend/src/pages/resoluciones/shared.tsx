// ─── src/pages/resoluciones/shared.tsx ───────────────────────────────────────
// Paleta, tipos, helpers y componentes reutilizables del módulo Resoluciones

import React from "react";

// ─── PALETA ──────────────────────────────────────────────────────────────────
export const C = {
  bg:          "#0d1117",
  card:        "#161b22",
  border:      "#30363d",
  borderLight: "#21262d",
  text:        "#e6edf3",
  muted:       "#8b949e",
  blue:        "#58a6ff",
  green:       "#3fb950",
  red:         "#f85149",
  yellow:      "#d29922",
  purple:      "#bc8cff",
  orange:      "#e3b341",
} as const;

// ─── ESTADO BADGES ───────────────────────────────────────────────────────────
export const ESTADO_RES_COLORS: Record<string, { bg: string; color: string }> = {
  ACTIVA:  { bg: "#1a3d22", color: C.green },
  APELADA: { bg: "#1c2d3a", color: C.blue },
  ANULADA: { bg: "#3d1a1a", color: C.red },
  FIRME:   { bg: "#2a1f3d", color: C.purple },
};

export const ESTADO_REC_COLORS: Record<string, { bg: string; color: string }> = {
  PENDIENTE: { bg: "#3d2a1a", color: C.orange },
  ADMITIDO:  { bg: "#1c2d3a", color: C.blue },
  RECHAZADO: { bg: "#3d1a1a", color: C.red },
  RESUELTO:  { bg: "#1a3d22", color: C.green },
};

// ─── TIPOS ────────────────────────────────────────────────────────────────────
export interface Expediente {
  idExpediente: number;
  numeroExpediente: string;
  ano: number;
}

export interface TipoResolucion {
  idTipoRes: number;
  codigo: string;
  nombre: string;
  nivelJerarquico: number;
  descripcion?: string;
}

export interface TipoRecurso {
  idTipoRecurso: number;
  nombre: string;
  descripcion: string;
}

export interface Resolucion {
  idResolucion: number;
  numeroResolucion: string;
  fechaResolucion: string;
  fechaNotificacion?: string;
  parteDispositiva: string;
  fundamentacion: string;
  estado: string;
  esRecurrible: boolean;
  plazoRecursoDias: number;
  idExpediente: { idExpediente: number; numeroExpediente: string; ano: number };
  idTipoRes: { idTipoRes: number; codigo: string; nombre: string; nivelJerarquico: number };
  idDocumento?: { idDocumento: number; titulo: string };
}

export interface Recurso {
  idRecurso: number;
  fechaInterposicion: string;
  estadoRecurso: string;
  fundamentos: string;
  idResolucionImpugnada: {
    idResolucion: number;
    numeroResolucion: string;
    idExpediente: { numeroExpediente: string };
  };
  idTipoRecurso: { idTipoRecurso: number; nombre: string };
  idRecurrente: {
    idParte: number;
    idPersona: { nombre: string; primerApellido: string };
    idRol: { nombreRol: string };
  };
  idExpedienteAlzada?: { idExpediente: number; numeroExpediente: string };
  idResolucionRespuesta?: { idResolucion: number; numeroResolucion: string };
}

export interface ParteProcesal {
  idParte: number;
  idPersona: { nombre: string; primerApellido: string };
  idExpediente: { idExpediente: number; numeroExpediente: string };
  idRol: { nombreRol: string };
  activo: boolean;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
export const fmt = (d?: string) =>
  d ? new Date(d).toLocaleDateString("es-BO") : "—";

export const nivelLabel = (n: number) =>
  ["", "★ Primera", "★★ Segunda", "★★★ Tercera"][n] ?? `Nivel ${n}`;

export const nivelStars = (n: number) => "★".repeat(Math.min(n, 5));

// ─── COMPONENTES BASE ─────────────────────────────────────────────────────────

export const EstadoBadge = ({
  estado,
  mapa,
}: {
  estado: string;
  mapa: Record<string, { bg: string; color: string }>;
}) => {
  const style = mapa[estado] ?? { bg: "#21262d", color: C.muted };
  return (
    <span
      style={{
        fontSize: 11,
        padding: "2px 9px",
        borderRadius: 4,
        backgroundColor: style.bg,
        color: style.color,
        fontWeight: 600,
      }}
    >
      {estado}
    </span>
  );
};

export function Modal({
  children,
  onClose,
  width = 560,
}: {
  children: React.ReactNode;
  onClose: () => void;
  width?: number;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: 28,
          width,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export const Field = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 5 }}>
      {label}
    </label>
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "8px 10px",
        backgroundColor: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: 6,
        color: C.text,
        fontSize: 13,
        outline: "none",
        boxSizing: "border-box",
      }}
    />
  </div>
);

export const SelectField = ({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 5 }}>
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "8px 10px",
        backgroundColor: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: 6,
        color: C.text,
        fontSize: 13,
        outline: "none",
        boxSizing: "border-box",
      }}
    >
      {children}
    </select>
  </div>
);

export const TextareaField = ({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 5 }}>
      {label}
    </label>
    <textarea
      value={value}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "8px 10px",
        backgroundColor: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: 6,
        color: C.text,
        fontSize: 13,
        outline: "none",
        boxSizing: "border-box",
        resize: "vertical",
      }}
    />
  </div>
);

export const Tabla = ({
  headers,
  children,
  loading,
  emptyMsg,
}: {
  headers: string[];
  children: React.ReactNode;
  loading: boolean;
  emptyMsg: string;
}) => (
  <div
    style={{
      backgroundColor: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      overflow: "hidden",
    }}
  >
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: C.bg }}>
          {headers.map((h) => (
            <th
              key={h}
              style={{
                padding: "10px 16px",
                textAlign: "left",
                color: C.muted,
                fontWeight: 500,
                fontSize: 12,
              }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {loading ? (
          [...Array(3)].map((_, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
              {[...Array(headers.length)].map((_, j) => (
                <td key={j} style={{ padding: "12px 16px" }}>
                  <div
                    style={{
                      height: 12,
                      backgroundColor: C.borderLight,
                      borderRadius: 4,
                      animation: "pulse 1.5s infinite",
                    }}
                  />
                </td>
              ))}
            </tr>
          ))
        ) : !(children as any[])?.length ? (
          <tr>
            <td
              colSpan={headers.length}
              style={{ padding: "32px 16px", textAlign: "center", color: C.muted }}
            >
              {emptyMsg}
            </td>
          </tr>
        ) : (
          children
        )}
      </tbody>
    </table>
  </div>
);

export const ActionBtn = ({
  onClick,
  color,
  label,
}: {
  onClick: () => void;
  color: string;
  label: string;
}) => (
  <button
    onClick={onClick}
    style={{
      backgroundColor: "transparent",
      color,
      border: `1px solid ${color}`,
      borderRadius: 5,
      padding: "4px 10px",
      fontSize: 12,
      cursor: "pointer",
    }}
  >
    {label}
  </button>
);

export const ErrorBox = ({ msg }: { msg: string }) =>
  msg ? (
    <div
      style={{
        backgroundColor: "#3d1a1a",
        border: `1px solid ${C.red}`,
        borderRadius: 6,
        padding: "8px 12px",
        fontSize: 12,
        color: C.red,
        marginBottom: 14,
      }}
    >
      {msg}
    </div>
  ) : null;

export const ModalFooter = ({
  onCancel,
  onSave,
  saveLabel,
}: {
  onCancel: () => void;
  onSave: () => void;
  saveLabel: string;
}) => (
  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
    <button
      onClick={onCancel}
      style={{
        padding: "8px 16px",
        backgroundColor: "transparent",
        border: `1px solid ${C.border}`,
        borderRadius: 6,
        color: C.muted,
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      Cancelar
    </button>
    <button
      onClick={onSave}
      style={{
        padding: "8px 16px",
        backgroundColor: "#238636",
        border: "none",
        borderRadius: 6,
        color: "#fff",
        fontSize: 13,
        cursor: "pointer",
        fontWeight: 500,
      }}
    >
      {saveLabel}
    </button>
  </div>
);

// ─── LAYOUT DE PÁGINA ─────────────────────────────────────────────────────────
export function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: C.bg,
        color: C.text,
        padding: "28px 32px",
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>{title}</h1>
        <p style={{ fontSize: 13, color: C.muted }}>{subtitle}</p>
      </div>
      {children}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
