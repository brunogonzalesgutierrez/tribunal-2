import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_REPORTE_AUDIENCIAS_ESTADO,
  GET_REPORTE_AUDIENCIAS_MES,
  GET_REPORTE_EXPEDIENTES_TIPO,
  GET_REPORTE_EXPEDIENTES_ESTADO,
  GET_REPORTE_CARGA_SALA,
  GET_REPORTE_ACTIVIDAD_USUARIOS,
  ENVIAR_REPORTES_EMAIL,
} from "../graphql/reportes";

// ─── PALETA ───────────────────────────────────────────────
const C = {
  bg: "#0d1117", card: "#161b22", border: "#30363d",
  borderLight: "#21262d", text: "#e6edf3", muted: "#8b949e",
  blue: "#58a6ff", green: "#3fb950", red: "#f85149",
  yellow: "#d29922", orange: "#db6d28", purple: "#bc8cff",
};

// ─── COLORES ──────────────────────────────────────────────
const colorEstadoAud = (estado: string) => {
  const m: Record<string, string> = {
    PROGRAMADA: C.blue, EN_CURSO: C.yellow,
    REALIZADA: C.green, FINALIZADA: C.purple, SUSPENDIDA: C.red,
  };
  return m[estado] ?? C.muted;
};
const colorTipo = (i: number) => {
  const colores = [C.blue, C.red, C.yellow, C.purple, C.orange, C.green, C.muted];
  return colores[i % colores.length];
};
const colorEstadoExp = (_: string, i: number) => colorTipo(i);

// ─── TIPOS ────────────────────────────────────────────────
type TabReporte = "audiencias" | "expedientes" | "salas" | "usuarios";

const ROLES_DISPONIBLES = ["Administrador", "Vocal", "Secretario"];

// ─── HELPERS ─────────────────────────────────────────────
const totalArr = (arr: { cantidad: number }[]) =>
  arr.reduce((s, x) => s + x.cantidad, 0);

// ─── COMPONENTES ─────────────────────────────────────────

const KpiCard = ({ label, value, sub, color = C.blue }: {
  label: string; value: number | string; sub?: string; color?: string;
}) => (
  <div style={{
    backgroundColor: C.card, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: "18px 22px", flex: 1, minWidth: 140,
  }}>
    <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{sub}</div>}
  </div>
);

const BarraHorizontal = ({ items }: {
  items: { label: string; cantidad: number; color: string }[];
}) => {
  const max = Math.max(...items.map(i => i.cantidad), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((item) => (
        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 110, fontSize: 12, color: C.muted, textAlign: "right", flexShrink: 0 }}>
            {item.label}
          </div>
          <div style={{ flex: 1, backgroundColor: C.borderLight, borderRadius: 4, height: 20, overflow: "hidden" }}>
            <div style={{
              width: `${(item.cantidad / max) * 100}%`,
              backgroundColor: item.color, height: "100%",
              borderRadius: 4, transition: "width 0.6s ease", opacity: 0.85,
            }} />
          </div>
          <div style={{ width: 30, fontSize: 12, color: C.text, fontWeight: 600 }}>{item.cantidad}</div>
        </div>
      ))}
    </div>
  );
};

const DonutChart = ({ items, size = 160 }: {
  items: { label: string; cantidad: number; color: string }[];
  size?: number;
}) => {
  const total = totalArr(items);
  if (total === 0) return <div style={{ color: C.muted, fontSize: 12 }}>Sin datos</div>;
  const r = 60, cx = size / 2, cy = size / 2;
  let startAngle = -Math.PI / 2;
  const slices = items.map((item) => {
    const angle = (item.cantidad / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle),   y2 = cy + r * Math.sin(endAngle);
    const large = angle > Math.PI ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    const slice = { ...item, path };
    startAngle = endAngle;
    return slice;
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s) => (
        <path key={s.label} d={s.path} fill={s.color} opacity={0.85} stroke={C.bg} strokeWidth={2} />
      ))}
      <circle cx={cx} cy={cy} r={38} fill={C.card} />
      <text x={cx} y={cy - 6} textAnchor="middle" fill={C.text} fontSize={18} fontWeight={700}>{total}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill={C.muted} fontSize={9}>total</text>
    </svg>
  );
};

const BarChartMes = ({ data }: { data: { mes: string; cantidad: number }[] }) => {
  const max = Math.max(...data.map(d => d.cantidad), 1);
  const h = 120, barW = 22, gap = 8;
  const totalW = data.length * (barW + gap);
  return (
    <svg width="100%" viewBox={`0 0 ${totalW} ${h + 30}`} style={{ overflow: "visible" }}>
      {data.map((d, i) => {
        const barH = (d.cantidad / max) * h;
        const x = i * (barW + gap), y = h - barH;
        return (
          <g key={d.mes}>
            <rect x={x} y={y} width={barW} height={barH} fill={C.blue} opacity={0.75} rx={3} />
            <text x={x + barW / 2} y={h + 14} textAnchor="middle" fill={C.muted} fontSize={9}>{d.mes}</text>
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" fill={C.blue} fontSize={9} fontWeight={600}>{d.cantidad}</text>
          </g>
        );
      })}
    </svg>
  );
};

const Leyenda = ({ items }: { items: { label: string; cantidad: number; color: string }[] }) => {
  const total = totalArr(items);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item) => (
        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: item.color, flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 12, color: C.muted }}>{item.label}</div>
          <div style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{item.cantidad}</div>
          <div style={{ fontSize: 11, color: C.muted, width: 36, textAlign: "right" }}>
            {total > 0 ? Math.round((item.cantidad / total) * 100) : 0}%
          </div>
        </div>
      ))}
    </div>
  );
};

const ChartCard = ({ title, children, style = {} }: {
  title: string; children: React.ReactNode; style?: React.CSSProperties;
}) => (
  <div style={{
    backgroundColor: C.card, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: "20px 22px", ...style,
  }}>
    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 16 }}>{title}</div>
    {children}
  </div>
);

const RolBadge = ({ rol }: { rol: string }) => {
  const colors: Record<string, [string, string]> = {
    Juez:          [C.blue,   "#1c2d3a"],
    Vocal:         [C.purple, "#2a1f3d"],
    Secretaria:    [C.green,  "#1a3d22"],
    Secretario:    [C.green,  "#1a3d22"],
    Administrador: [C.yellow, "#3d2e00"],
  };
  const [fg, bg] = colors[rol] ?? [C.muted, C.borderLight];
  return (
    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, color: fg, backgroundColor: bg, fontWeight: 500 }}>
      {rol}
    </span>
  );
};

const Skeleton = () => (
  <div style={{ height: 12, backgroundColor: C.borderLight, borderRadius: 4, marginBottom: 8 }} />
);

// ─── MODAL ENVÍO EMAIL ────────────────────────────────────

type ResultadoEnvio = {
  ok: boolean;
  mensaje: string;
  enviados: number;
  fallidos: number;
  destinatarios: string[];
};

const ModalEnvioEmail = ({
  anio,
  onClose,
}: {
  anio: number;
  onClose: () => void;
}) => {
  const [rolesSeleccionados, setRolesSeleccionados] = useState<string[]>(["Administrador", "Vocal", "Secretario"]);
  const [resultado, setResultado] = useState<ResultadoEnvio | null>(null);

  const [enviarReporte, { loading }] = useMutation(ENVIAR_REPORTES_EMAIL, {
    onCompleted: (data) => setResultado(data.enviarReportesPorEmail),
    onError: (err) => setResultado({
      ok: false,
      mensaje: `Error: ${err.message}`,
      enviados: 0, fallidos: 0, destinatarios: [],
    }),
  });

  const toggleRol = (rol: string) => {
    setRolesSeleccionados(prev =>
      prev.includes(rol) ? prev.filter(r => r !== rol) : [...prev, rol]
    );
  };

  const handleEnviar = () => {
    if (rolesSeleccionados.length === 0) return;
    setResultado(null);
    enviarReporte({ variables: { anio, roles: rolesSeleccionados } });
  };

  return (
    // Overlay
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000,
      }}
    >
      {/* Panel */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: C.card, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: 28, width: 480, maxWidth: "95vw",
        }}
      >
        {/* Encabezado */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>Enviar Reporte por Email</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              Se generará un PDF del año {anio} y se enviará a los usuarios seleccionados
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", color: C.muted,
              fontSize: 20, cursor: "pointer", padding: "0 4px",
            }}
          >✕</button>
        </div>

        {/* Selección de roles */}
        {!resultado && (
          <>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>
              Selecciona los roles que recibirán el reporte:
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {ROLES_DISPONIBLES.map(rol => {
                const seleccionado = rolesSeleccionados.includes(rol);
                const info: Record<string, string> = {
                  Administrador: "Reporte completo: audiencias, expedientes, carga por sala y actividad de usuarios",
                  Vocal:         "Reporte de audiencias del período",
                  Secretario:    "Reporte de audiencias y expedientes",
                };
                return (
                  <div
                    key={rol}
                    onClick={() => toggleRol(rol)}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 12,
                      padding: "12px 14px", borderRadius: 8, cursor: "pointer",
                      border: `1px solid ${seleccionado ? C.blue : C.border}`,
                      backgroundColor: seleccionado ? "rgba(88,166,255,0.08)" : "transparent",
                      transition: "all 0.15s",
                    }}
                  >
                    {/* Checkbox visual */}
                    <div style={{
                      width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                      border: `2px solid ${seleccionado ? C.blue : C.muted}`,
                      backgroundColor: seleccionado ? C.blue : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginTop: 1,
                    }}>
                      {seleccionado && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{rol}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{info[rol]}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Botón enviar */}
            <button
              onClick={handleEnviar}
              disabled={loading || rolesSeleccionados.length === 0}
              style={{
                width: "100%", padding: "10px 0", borderRadius: 8,
                backgroundColor: rolesSeleccionados.length === 0 ? C.borderLight : C.blue,
                color: rolesSeleccionados.length === 0 ? C.muted : "#fff",
                border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading
                ? "⏳ Generando PDF y enviando..."
                : `📨 Enviar reporte ${anio} a ${rolesSeleccionados.length} rol(es)`}
            </button>
          </>
        )}

        {/* Resultado */}
        {resultado && (
          <div>
            <div style={{
              padding: "14px 16px", borderRadius: 8, marginBottom: 16,
              backgroundColor: resultado.ok
                ? "rgba(63,185,80,0.12)"
                : "rgba(248,81,73,0.12)",
              border: `1px solid ${resultado.ok ? C.green : C.red}`,
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: resultado.ok ? C.green : C.red, marginBottom: 4 }}>
                {resultado.ok ? "✅ Reporte enviado correctamente" : "⚠️ Envío con errores"}
              </div>
              <div style={{ fontSize: 12, color: C.muted }}>{resultado.mensaje}</div>
            </div>

            {/* Estadísticas */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Enviados",  val: resultado.enviados,  color: C.green },
                { label: "Fallidos",  val: resultado.fallidos,  color: C.red   },
              ].map(({ label, val, color }) => (
                <div key={label} style={{
                  flex: 1, textAlign: "center", padding: "10px 0",
                  backgroundColor: C.borderLight, borderRadius: 8,
                }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color }}>{val}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Lista de destinatarios */}
            {resultado.destinatarios.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Destinatarios:</div>
                <div style={{
                  backgroundColor: C.borderLight, borderRadius: 8,
                  padding: "10px 12px", maxHeight: 160, overflowY: "auto",
                }}>
                  {resultado.destinatarios.map((d, i) => (
                    <div key={i} style={{ fontSize: 11, color: C.muted, padding: "2px 0" }}>
                      ✉️ {d}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              style={{
                marginTop: 16, width: "100%", padding: "9px 0", borderRadius: 8,
                backgroundColor: "transparent", border: `1px solid ${C.border}`,
                color: C.muted, fontSize: 13, cursor: "pointer",
              }}
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


// ─── COMPONENTE PRINCIPAL ─────────────────────────────────
export default function ReportesPage() {
  const [tab, setTab]           = useState<TabReporte>("audiencias");
  const [anio, setAnio]         = useState(2025);
  const [modalEmail, setModalEmail] = useState(false);

  const vars = { variables: { anio } };

  const { data: dAudEst,   loading: lAudEst  } = useQuery(GET_REPORTE_AUDIENCIAS_ESTADO,  vars);
  const { data: dAudMes,   loading: lAudMes  } = useQuery(GET_REPORTE_AUDIENCIAS_MES,     vars);
  const { data: dExpTipo,  loading: lExpTipo } = useQuery(GET_REPORTE_EXPEDIENTES_TIPO,   vars);
  const { data: dExpEst,   loading: lExpEst  } = useQuery(GET_REPORTE_EXPEDIENTES_ESTADO, vars);
  const { data: dSalas,    loading: lSalas   } = useQuery(GET_REPORTE_CARGA_SALA,         vars);
  const { data: dUsuarios, loading: lUsuarios} = useQuery(GET_REPORTE_ACTIVIDAD_USUARIOS, vars);

  const audPorEstado = (dAudEst?.reporteAudienciasPorEstado ?? []).map((r: any) => ({
    ...r, color: colorEstadoAud(r.estado),
  }));
  const audPorMes    = dAudMes?.reporteAudienciasPorMes ?? [];
  const expPorTipo   = (dExpTipo?.reporteExpedientesPorTipo ?? []).map((r: any, i: number) => ({
    ...r, color: colorTipo(i),
  }));
  const expPorEstado = (dExpEst?.reporteExpedientesPorEstado ?? []).map((r: any, i: number) => ({
    ...r, color: colorEstadoExp(r.estado, i),
  }));
  const cargaSalas  = dSalas?.reporteCargaPorSala ?? [];
  const actUsuarios = dUsuarios?.reporteActividadUsuarios ?? [];

  const totalAudiencias  = totalArr(audPorEstado);
  const totalExpedientes = totalArr(expPorTipo);
  const totalSalas       = cargaSalas.length;
  const totalUsuarios    = actUsuarios.length;

  const tabs: { key: TabReporte; label: string }[] = [
    { key: "audiencias",  label: "Audiencias por estado" },
    { key: "expedientes", label: "Expedientes" },
    { key: "salas",       label: "Carga por sala" },
    { key: "usuarios",    label: "Actividad por usuario" },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg, color: C.text, padding: "28px 32px" }}>

      {/* Modal email */}
      {modalEmail && (
        <ModalEnvioEmail anio={anio} onClose={() => setModalEmail(false)} />
      )}

      {/* Encabezado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Reportes</h1>
          <p style={{ fontSize: 13, color: C.muted }}>Estadísticas y métricas del sistema judicial</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label style={{ fontSize: 12, color: C.muted }}>Año:</label>
          <select
            value={anio}
            onChange={e => setAnio(Number(e.target.value))}
            style={{
              padding: "6px 10px", backgroundColor: C.card,
              border: `1px solid ${C.border}`, borderRadius: 6,
              color: C.text, fontSize: 13, outline: "none", cursor: "pointer",
            }}
          >
            {[2023, 2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          {/* Botón enviar reporte */}
          <button
            onClick={() => setModalEmail(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 7,
              backgroundColor: C.blue, border: "none",
              color: "#fff", fontSize: 13, fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 15 }}>📨</span>
            Enviar reporte
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <KpiCard label="Total audiencias"  value={totalAudiencias}  sub={`año ${anio}`} color={C.blue} />
        <KpiCard label="Total expedientes" value={totalExpedientes} sub={`año ${anio}`} color={C.green} />
        <KpiCard label="Salas activas"     value={totalSalas}       sub="en todos los tribunales" color={C.purple} />
        <KpiCard label="Usuarios activos"  value={totalUsuarios}    sub="con actividad registrada" color={C.yellow} />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
        {tabs.map(t => {
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "8px 18px", fontSize: 13, cursor: "pointer",
              backgroundColor: "transparent", border: "none",
              borderBottom: active ? `2px solid ${C.blue}` : "2px solid transparent",
              color: active ? C.blue : C.muted, fontWeight: active ? 600 : 400, marginBottom: -1,
            }}>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB: AUDIENCIAS ── */}
      {tab === "audiencias" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {lAudEst ? <Skeleton /> : (
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <ChartCard title="Distribución por estado" style={{ flex: "0 0 auto" }}>
                <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                  <DonutChart items={audPorEstado.map((a: any) => ({ label: a.estado, cantidad: a.cantidad, color: a.color }))} />
                  <Leyenda    items={audPorEstado.map((a: any) => ({ label: a.estado, cantidad: a.cantidad, color: a.color }))} />
                </div>
              </ChartCard>
              <ChartCard title="Audiencias por estado" style={{ flex: 1, minWidth: 280 }}>
                <BarraHorizontal items={audPorEstado.map((a: any) => ({ label: a.estado, cantidad: a.cantidad, color: a.color }))} />
              </ChartCard>
            </div>
          )}
          {lAudMes ? <Skeleton /> : (
            <ChartCard title={`Audiencias por mes — ${anio}`}>
              <BarChartMes data={audPorMes} />
            </ChartCard>
          )}
          {!lAudEst && audPorEstado.length > 0 && (
            <ChartCard title="Resumen por estado">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {["Estado", "Cantidad", "Porcentaje", "Indicador"].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: C.muted, fontWeight: 500, fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {audPorEstado.map((a: any, i: number) => {
                    const pct = totalAudiencias > 0 ? Math.round((a.cantidad / totalAudiencias) * 100) : 0;
                    return (
                      <tr key={a.estado}
                        style={{ borderBottom: i < audPorEstado.length - 1 ? `1px solid ${C.borderLight}` : "none" }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#1c2128")}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: a.color, display: "inline-block" }} />
                            <span style={{ fontSize: 12, color: C.text }}>{a.estado}</span>
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: a.color }}>{a.cantidad}</td>
                        <td style={{ padding: "10px 12px", color: C.muted }}>{pct}%</td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ width: 80, backgroundColor: C.borderLight, borderRadius: 4, height: 6 }}>
                            <div style={{ width: `${pct}%`, backgroundColor: a.color, height: "100%", borderRadius: 4 }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ChartCard>
          )}
        </div>
      )}

      {/* ── TAB: EXPEDIENTES ── */}
      {tab === "expedientes" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {(lExpTipo || lExpEst) ? <Skeleton /> : (
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <ChartCard title="Por tipo de proceso" style={{ flex: "0 0 auto" }}>
                <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                  <DonutChart items={expPorTipo.map((e: any) => ({ label: e.tipo, cantidad: e.cantidad, color: e.color }))} />
                  <Leyenda    items={expPorTipo.map((e: any) => ({ label: e.tipo, cantidad: e.cantidad, color: e.color }))} />
                </div>
              </ChartCard>
              <ChartCard title="Por estado del expediente" style={{ flex: "0 0 auto" }}>
                <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                  <DonutChart items={expPorEstado.map((e: any) => ({ label: e.estado, cantidad: e.cantidad, color: e.color }))} />
                  <Leyenda    items={expPorEstado.map((e: any) => ({ label: e.estado, cantidad: e.cantidad, color: e.color }))} />
                </div>
              </ChartCard>
            </div>
          )}
          {!lExpTipo && (
            <ChartCard title="Comparativa por tipo de proceso">
              <BarraHorizontal items={expPorTipo.map((e: any) => ({ label: e.tipo, cantidad: e.cantidad, color: e.color }))} />
            </ChartCard>
          )}
        </div>
      )}

      {/* ── TAB: SALAS ── */}
      {tab === "salas" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {lSalas ? <Skeleton /> : (
            <>
              <ChartCard title="Audiencias por sala">
                <BarraHorizontal items={cargaSalas.map((s: any) => ({ label: s.sala, cantidad: s.audiencias, color: C.blue }))} />
              </ChartCard>
              <ChartCard title="Expedientes por sala">
                <BarraHorizontal items={cargaSalas.map((s: any) => ({ label: s.sala, cantidad: s.expedientes, color: C.green }))} />
              </ChartCard>
              <ChartCard title="Detalle de carga por sala">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: C.bg }}>
                      {["Sala", "Tribunal", "Audiencias", "Expedientes", "Carga total"].map(h => (
                        <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: C.muted, fontWeight: 500, fontSize: 12 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cargaSalas.map((s: any, i: number) => {
                      const total = s.audiencias + s.expedientes;
                      const maxTotal = Math.max(...cargaSalas.map((x: any) => x.audiencias + x.expedientes), 1);
                      return (
                        <tr key={s.sala}
                          style={{ borderBottom: i < cargaSalas.length - 1 ? `1px solid ${C.borderLight}` : "none" }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#1c2128")}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <td style={{ padding: "12px 12px", fontWeight: 600, color: C.text }}>{s.sala}</td>
                          <td style={{ padding: "12px 12px", color: C.muted, fontSize: 12 }}>{s.tribunal}</td>
                          <td style={{ padding: "12px 12px", color: C.blue, fontWeight: 600 }}>{s.audiencias}</td>
                          <td style={{ padding: "12px 12px", color: C.green, fontWeight: 600 }}>{s.expedientes}</td>
                          <td style={{ padding: "12px 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontWeight: 700, color: C.text, width: 24 }}>{total}</span>
                              <div style={{ flex: 1, backgroundColor: C.borderLight, borderRadius: 4, height: 6 }}>
                                <div style={{
                                  width: `${(total / maxTotal) * 100}%`,
                                  background: `linear-gradient(90deg, ${C.blue}, ${C.purple})`,
                                  height: "100%", borderRadius: 4,
                                }} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </ChartCard>
            </>
          )}
        </div>
      )}

      {/* ── TAB: USUARIOS ── */}
      {tab === "usuarios" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {lUsuarios ? <Skeleton /> : (
            <>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <KpiCard label="Total actuaciones" value={actUsuarios.reduce((s: number, u: any) => s + u.actuaciones, 0)} color={C.green} />
                <KpiCard label="Total documentos"  value={actUsuarios.reduce((s: number, u: any) => s + u.documentos, 0)}  color={C.purple} />
              </div>
              <ChartCard title="Actuaciones procesales por usuario">
                <BarraHorizontal
                  items={actUsuarios.map((u: any) => ({
                    label: u.usuario.split(" ")[0],
                    cantidad: u.actuaciones,
                    color: C.green,
                  }))}
                />
              </ChartCard>
              <ChartCard title="Detalle de actividad">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: C.bg }}>
                      {["Usuario", "Rol", "Actuaciones", "Documentos", "Total actividad"].map(h => (
                        <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: C.muted, fontWeight: 500, fontSize: 12 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {actUsuarios
                      .slice()
                      .sort((a: any, b: any) => (b.actuaciones + b.documentos) - (a.actuaciones + a.documentos))
                      .map((u: any, i: number) => {
                        const totalAct = u.actuaciones + u.documentos;
                        const maxAct = Math.max(...actUsuarios.map((x: any) => x.actuaciones + x.documentos), 1);
                        return (
                          <tr key={u.usuario}
                            style={{ borderBottom: i < actUsuarios.length - 1 ? `1px solid ${C.borderLight}` : "none" }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#1c2128")}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                          >
                            <td style={{ padding: "12px 12px", fontWeight: 500, color: C.text }}>{u.usuario}</td>
                            <td style={{ padding: "12px 12px" }}><RolBadge rol={u.rol} /></td>
                            <td style={{ padding: "12px 12px", color: C.green, fontWeight: 600 }}>{u.actuaciones}</td>
                            <td style={{ padding: "12px 12px", color: C.purple, fontWeight: 600 }}>{u.documentos}</td>
                            <td style={{ padding: "12px 12px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontWeight: 700, color: C.text, width: 28 }}>{totalAct}</span>
                                <div style={{ flex: 1, backgroundColor: C.borderLight, borderRadius: 4, height: 6 }}>
                                  <div style={{
                                    width: `${(totalAct / maxAct) * 100}%`,
                                    background: `linear-gradient(90deg, ${C.green}, ${C.blue})`,
                                    height: "100%", borderRadius: 4,
                                  }} />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </ChartCard>
            </>
          )}
        </div>
      )}
    </div>
  );
}