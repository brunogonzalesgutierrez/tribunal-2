import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";

const GET_DASHBOARD = gql`
  query {
    allExpedientes {
      idExpediente
      fechaIngreso
      idEstadoExpediente { nombreEstado }
    }
    allAudiencias {
      idAudiencia
      estadoAudiencia
      fechaHoraProgramada
      idExpediente { numeroExpediente }
    }
    allResoluciones {
      idResolucion
      fechaResolucion
      numeroResolucion
      estado
      idExpediente { numeroExpediente }
    }
    allUsuarios { idUsuario activo }
    allPersonas { idPersona }
    allDocumentos { idDocumento }
  }
`;

const esHoy = (fechaStr: string): boolean => {
  const fecha = new Date(fechaStr);
  const hoy = new Date();
  return fecha.getDate() === hoy.getDate() && fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
};

const esteMes = (fechaStr: string): boolean => {
  const fecha = new Date(fechaStr);
  const hoy = new Date();
  return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
};

const tiempoRelativo = (fechaStr: string): string => {
  const diff = Math.floor((Date.now() - new Date(fechaStr).getTime()) / 60000);
  if (diff < 1) return "ahora mismo";
  if (diff < 60) return `hace ${diff} min`;
  const hrs = Math.floor(diff / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const dias = Math.floor(hrs / 24);
  if (dias < 7) return `hace ${dias}d`;
  return new Date(fechaStr).toLocaleDateString("es-BO", { day: "numeric", month: "short" });
};

const expedientesPorDia = (expedientes: any[]) => {
  const hoy = new Date();
  const diasMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() - i);
    diasMap[d.toLocaleDateString("es-BO", { weekday: "short" })] = 0;
  }
  expedientes.forEach((e) => {
    const fecha = new Date(e.fechaIngreso);
    const diff = Math.floor((hoy.getTime() - fecha.getTime()) / 86400000);
    if (diff <= 6) {
      const key = fecha.toLocaleDateString("es-BO", { weekday: "short" });
      diasMap[key] = (diasMap[key] || 0) + 1;
    }
  });
  return Object.entries(diasMap).map(([dia, total]) => ({ dia, total }));
};

const estadoBadge = (estado: string) => {
  switch (estado?.toUpperCase()) {
    case "PROGRAMADA":  return { color: "#58a6ff", bg: "#1c2d3a" };
    case "EN_CURSO":    return { color: "#3fb950", bg: "#1a3d22" };
    case "FINALIZADA":  return { color: "#8b949e", bg: "#21262d" };
    case "SUSPENDIDA":  return { color: "#f85149", bg: "#3d1a1a" };
    default:            return { color: "#8b949e", bg: "#21262d" };
  }
};

const Skeleton = ({ w = "100%", h = 16 }: { w?: string; h?: number }) => (
  <div style={{ width: w, height: h, backgroundColor: "#21262d", borderRadius: 4, animation: "pulse 1.5s ease-in-out infinite" }} />
);

const KpiCard = ({ label, value, sub, accent, loading }: { label: string; value: string | number; sub: string; accent: string; loading: boolean }) => (
  <div style={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: 10, padding: "16px 18px" }}>
    <div style={{ fontSize: 12, color: "#8b949e", marginBottom: 6 }}>{label}</div>
    {loading ? (<><Skeleton h={26} w="60%" /><div style={{ marginTop: 6 }}><Skeleton h={12} w="80%" /></div></>) : (
      <>
        <div style={{ fontSize: 24, fontWeight: 600, color: accent, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color: "#8b949e", marginTop: 5 }}>{sub}</div>
      </>
    )}
  </div>
);

const MiniBarChart = ({ datos }: { datos: { dia: string; total: number }[] }) => {
  const maxVal = Math.max(...datos.map((d) => d.total), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80, padding: "0 4px" }}>
      {datos.map((d, i) => {
        const height = Math.max((d.total / maxVal) * 72, d.total > 0 ? 4 : 2);
        const esUltimo = i === datos.length - 1;
        return (
          <div key={d.dia} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div title={`${d.total} expedientes`} style={{ width: "100%", height, backgroundColor: esUltimo ? "#1f4060" : "#1c2d3a", borderRadius: "3px 3px 0 0", border: esUltimo ? "1px solid #58a6ff" : "none" }} />
            <span style={{ fontSize: 10, color: "#8b949e" }}>{d.dia}</span>
          </div>
        );
      })}
    </div>
  );
};

export default function DashboardPage() {
  const { data, loading } = useQuery(GET_DASHBOARD, { fetchPolicy: "cache-and-network" });

  const expedientes  = data?.allExpedientes  ?? [];
  const audiencias   = data?.allAudiencias   ?? [];
  const resoluciones = data?.allResoluciones ?? [];
  const usuarios     = data?.allUsuarios     ?? [];
  const personas     = data?.allPersonas     ?? [];
  const documentos   = data?.allDocumentos   ?? [];

  const expHoy          = expedientes.filter((e: any) => esHoy(e.fechaIngreso));
  const expMes          = expedientes.filter((e: any) => esteMes(e.fechaIngreso));
  const audProgramadas  = audiencias.filter((a: any) => a.estadoAudiencia === "PROGRAMADA");
  const audHoy          = audiencias.filter((a: any) => esHoy(a.fechaHoraProgramada));
  const resMes          = resoluciones.filter((r: any) => esteMes(r.fechaResolucion));
  const chartDatos      = expedientesPorDia(expedientes);
  const totalSemana     = chartDatos.reduce((a, d) => a + d.total, 0);

  const ultimasAudiencias = [...audiencias]
    .sort((a: any, b: any) => new Date(b.fechaHoraProgramada).getTime() - new Date(a.fechaHoraProgramada).getTime())
    .slice(0, 5);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0d1117", color: "#e6edf3", padding: "28px 32px", fontFamily: "inherit" }}>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#e6edf3", marginBottom: 4 }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: "#8b949e" }}>
          {new Date().toLocaleDateString("es-BO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 28 }}>
        <KpiCard label="Expedientes hoy"        value={expHoy.length}        sub={`${expMes.length} este mes`}                           accent="#3fb950" loading={loading} />
        <KpiCard label="Audiencias programadas" value={audProgramadas.length} sub={`${audHoy.length} para hoy`}                          accent="#58a6ff" loading={loading} />
        <KpiCard label="Resoluciones este mes"  value={resMes.length}         sub={`${resoluciones.length} en total`}                    accent="#d29922" loading={loading} />
        <KpiCard label="Usuarios activos"       value={usuarios.filter((u: any) => u.activo).length} sub={`${personas.length} personas`} accent="#bc8cff" loading={loading} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>

        <div style={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: 10, padding: "18px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#e6edf3", marginBottom: 16 }}>Expedientes — últimos 7 días</div>
          {loading ? (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
              {[...Array(7)].map((_, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                  <Skeleton h={30 + i * 6} /><Skeleton h={10} />
                </div>
              ))}
            </div>
          ) : <MiniBarChart datos={chartDatos} />}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #21262d", display: "flex", justifyContent: "space-between", fontSize: 12, color: "#8b949e" }}>
            <span>Total semana</span>
            <span style={{ color: "#58a6ff", fontWeight: 500 }}>{totalSemana} expedientes</span>
          </div>
        </div>

        <div style={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: 10, padding: "18px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#e6edf3", marginBottom: 14 }}>Resumen del sistema</div>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{[...Array(5)].map((_, i) => <Skeleton key={i} h={14} />)}</div>
          ) : (
            <div>
              {[
                { label: "Total expedientes",  value: expedientes.length,  color: "#3fb950" },
                { label: "Total audiencias",   value: audiencias.length,   color: "#58a6ff" },
                { label: "Total resoluciones", value: resoluciones.length, color: "#d29922" },
                { label: "Total documentos",   value: documentos.length,   color: "#bc8cff" },
                { label: "Total personas",     value: personas.length,     color: "#79c0ff" },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #21262d", fontSize: 13 }}>
                  <span style={{ color: "#8b949e" }}>{item.label}</span>
                  <span style={{ fontWeight: 600, color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: 10, padding: "18px 20px" }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#e6edf3", marginBottom: 16 }}>Últimas audiencias</div>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Skeleton h={36} w="36px" />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}><Skeleton h={13} w="40%" /><Skeleton h={11} w="60%" /></div>
                <Skeleton h={14} w="70px" />
              </div>
            ))}
          </div>
        ) : ultimasAudiencias.length === 0 ? (
          <p style={{ fontSize: 13, color: "#8b949e", textAlign: "center", padding: "20px 0" }}>No hay audiencias registradas</p>
        ) : (
          <div>
            {ultimasAudiencias.map((aud: any, i: number) => {
              const badge = estadoBadge(aud.estadoAudiencia);
              return (
                <div key={aud.idAudiencia} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < ultimasAudiencias.length - 1 ? "1px solid #21262d" : "none" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: badge.bg, border: `1px solid ${badge.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🎙️</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#e6edf3", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      Expediente {aud.idExpediente?.numeroExpediente ?? "—"}
                    </div>
                    <div style={{ fontSize: 11, color: "#8b949e" }}>{tiempoRelativo(aud.fechaHoraProgramada)}</div>
                  </div>
                  <span style={{ fontSize: 11, backgroundColor: badge.bg, color: badge.color, padding: "3px 8px", borderRadius: 4, flexShrink: 0 }}>
                    {aud.estadoAudiencia?.toLowerCase().replace("_", " ") ?? "—"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
}