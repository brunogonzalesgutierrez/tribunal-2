import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import {
  LayoutDashboard, FileText, Mic, ScrollText, Users,
  FileArchive, TrendingUp, Gavel, FolderOpen, ShieldCheck,
} from "lucide-react";

// ── Queries ───────────────────────────────────────────────────────────────────

const GET_DASHBOARD = gql`
  query GetDashboard {
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
    allActuaciones { idActuacion }
  }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

const esHoy = (fechaStr: string) => {
  const f = new Date(fechaStr), h = new Date();
  return (
    f.getDate() === h.getDate() &&
    f.getMonth() === h.getMonth() &&
    f.getFullYear() === h.getFullYear()
  );
};

const esteMes = (fechaStr: string) => {
  const f = new Date(fechaStr), h = new Date();
  return f.getMonth() === h.getMonth() && f.getFullYear() === h.getFullYear();
};

const tiempoRelativo = (fechaStr: string) => {
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

// ── Sub-componentes ───────────────────────────────────────────────────────────

const Sk = ({ w = "w-full", h = "h-3" }: { w?: string; h?: string }) => (
  <div className={`${w} ${h} bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse`} />
);

interface StatCardProps {
  label: string;
  value: number;
  sub: string;
  color: string;
  icon: React.ReactNode;
}

const StatCard = ({ label, value, sub, color, icon }: StatCardProps) => (
  <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>
      <div className="p-2 bg-gray-50 dark:bg-slate-700 rounded-lg">{icon}</div>
    </div>
    <p className={`text-3xl font-black ${color}`}>{value}</p>
    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>
  </div>
);

const AUDIENCIA_BADGE: Record<string, string> = {
  PROGRAMADA: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  EN_CURSO:   "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  FINALIZADA: "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400",
  SUSPENDIDA: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
};

const AudienciaBadge = ({ estado }: { estado: string }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${AUDIENCIA_BADGE[estado?.toUpperCase()] ?? "bg-gray-100 dark:bg-slate-700 text-gray-500"}`}>
    {estado?.toLowerCase().replace("_", " ") ?? "—"}
  </span>
);

const ResolucionBadge = ({ estado }: { estado: string }) => {
  const map: Record<string, string> = {
    VIGENTE:   "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    APELADA:   "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    ANULADA:   "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    EJECUTADA: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${map[estado?.toUpperCase()] ?? "bg-gray-100 dark:bg-slate-700 text-gray-500"}`}>
      {estado?.toLowerCase() ?? "—"}
    </span>
  );
};

const MiniBarChart = ({ datos }: { datos: { dia: string; total: number }[] }) => {
  const maxVal = Math.max(...datos.map((d) => d.total), 1);
  return (
    <div className="flex items-end gap-1.5 h-20 px-1">
      {datos.map((d, i) => {
        const pct = Math.max((d.total / maxVal) * 100, d.total > 0 ? 6 : 2);
        const esUltimo = i === datos.length - 1;
        return (
          <div key={d.dia} className="flex-1 flex flex-col items-center gap-1">
            <div
              title={`${d.total} expedientes`}
              style={{ height: `${pct}%` }}
              className={`w-full rounded-t transition-all ${
                esUltimo
                  ? "bg-blue-500/30 border border-blue-500 dark:bg-blue-500/20"
                  : "bg-emerald-500/20 dark:bg-emerald-500/10"
              }`}
            />
            <span className="text-[10px] text-gray-400 dark:text-gray-500">{d.dia}</span>
          </div>
        );
      })}
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data, loading } = useQuery(GET_DASHBOARD, { fetchPolicy: "cache-and-network" });

  const expedientes  = data?.allExpedientes  ?? [];
  const audiencias   = data?.allAudiencias   ?? [];
  const resoluciones = data?.allResoluciones ?? [];
  const usuarios     = data?.allUsuarios     ?? [];
  const personas     = data?.allPersonas     ?? [];
  const documentos   = data?.allDocumentos   ?? [];
  const actuaciones  = data?.allActuaciones  ?? [];

  const expHoy          = expedientes.filter((e: any) => esHoy(e.fechaIngreso));
  const expMes          = expedientes.filter((e: any) => esteMes(e.fechaIngreso));
  const audProgramadas  = audiencias.filter((a: any) => a.estadoAudiencia === "PROGRAMADA");
  const audHoy          = audiencias.filter((a: any) => esHoy(a.fechaHoraProgramada));
  const resMes          = resoluciones.filter((r: any) => esteMes(r.fechaResolucion));
  const usuariosActivos = usuarios.filter((u: any) => u.activo).length;
  const chartDatos      = expedientesPorDia(expedientes);
  const totalSemana     = chartDatos.reduce((a, d) => a + d.total, 0);

  const ultimasAudiencias = [...audiencias]
    .sort((a: any, b: any) =>
      new Date(b.fechaHoraProgramada).getTime() - new Date(a.fechaHoraProgramada).getTime()
    )
    .slice(0, 5);

  const ultimasResoluciones = [...resoluciones]
    .sort((a: any, b: any) =>
      new Date(b.fechaResolucion).getTime() - new Date(a.fechaResolucion).getTime()
    )
    .slice(0, 5);

  // Expedientes por estado para el resumen
  const estadosMap: Record<string, number> = {};
  expedientes.forEach((e: any) => {
    const nombre = e.idEstadoExpediente?.nombreEstado ?? "Sin estado";
    estadosMap[nombre] = (estadosMap[nombre] || 0) + 1;
  });
  const estadosExpediente = Object.entries(estadosMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <LayoutDashboard className="w-7 h-7 text-blue-500" />
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 capitalize">
          {new Date().toLocaleDateString("es-BO", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm space-y-3">
              <Sk h="h-3" w="w-24" />
              <Sk h="h-7" w="w-16" />
              <Sk h="h-2.5" w="w-32" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              label="Expedientes hoy"
              value={expHoy.length}
              sub={`${expMes.length} este mes · ${expedientes.length} total`}
              color="text-emerald-600 dark:text-emerald-400"
              icon={<FolderOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
            />
            <StatCard
              label="Audiencias programadas"
              value={audProgramadas.length}
              sub={`${audHoy.length} para hoy · ${audiencias.length} total`}
              color="text-blue-600 dark:text-blue-400"
              icon={<Mic className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            />
            <StatCard
              label="Resoluciones este mes"
              value={resMes.length}
              sub={`${resoluciones.length} en total`}
              color="text-amber-600 dark:text-amber-400"
              icon={<ScrollText className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
            />
            <StatCard
              label="Usuarios activos"
              value={usuariosActivos}
              sub={`${personas.length} personas · ${documentos.length} docs`}
              color="text-purple-600 dark:text-purple-400"
              icon={<Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
            />
          </>
        )}
      </div>

      {/* Gráfico + Resumen del sistema */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Bar Chart */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            Expedientes — últimos 7 días
          </p>
          {loading ? (
            <div className="flex items-end gap-1.5 h-20 px-1">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex-1 flex flex-col gap-1 items-center">
                  <div style={{ height: `${30 + i * 8}%` }} className="w-full bg-gray-200 dark:bg-slate-700 rounded-t animate-pulse" />
                  <Sk h="h-2" w="w-4" />
                </div>
              ))}
            </div>
          ) : (
            <MiniBarChart datos={chartDatos} />
          )}
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700 flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Total semana</span>
            <span className="text-blue-500 dark:text-blue-400 font-semibold">{totalSemana} expedientes</span>
          </div>
        </div>

        {/* Resumen del sistema */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <FileArchive className="w-4 h-4 text-purple-500" />
            Resumen del sistema
          </p>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-700">
                  <Sk h="h-3" w="w-32" /><Sk h="h-3" w="w-8" />
                </div>
              ))}
            </div>
          ) : (
            <div>
              {[
                { label: "Total expedientes",  value: expedientes.length,  color: "text-emerald-600 dark:text-emerald-400" },
                { label: "Total audiencias",   value: audiencias.length,   color: "text-blue-600 dark:text-blue-400"    },
                { label: "Total resoluciones", value: resoluciones.length, color: "text-amber-600 dark:text-amber-400"  },
                { label: "Total documentos",   value: documentos.length,   color: "text-purple-600 dark:text-purple-400"},
                { label: "Total actuaciones",  value: actuaciones.length,  color: "text-sky-600 dark:text-sky-400"      },
                { label: "Total personas",     value: personas.length,     color: "text-rose-600 dark:text-rose-400"    },
              ].map((item, i, arr) => (
                <div
                  key={item.label}
                  className={`flex justify-between items-center py-2.5 text-sm ${i < arr.length - 1 ? "border-b border-gray-100 dark:border-slate-700" : ""}`}
                >
                  <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
                  <span className={`font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expedientes por estado */}
      {!loading && estadosExpediente.length > 0 && (
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Gavel className="w-4 h-4 text-amber-500" />
            Expedientes por estado
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {estadosExpediente.map(([estado, cantidad]) => {
              const pct = Math.round((cantidad / expedientes.length) * 100);
              return (
                <div key={estado} className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                  <p className="text-2xl font-black text-gray-800 dark:text-white">{cantidad}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{estado}</p>
                  <div className="mt-2 h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{pct}%</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Últimas audiencias + Últimas resoluciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Últimas audiencias */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
            <p className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <Mic className="w-4 h-4 text-blue-500" />
              Últimas audiencias
            </p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <Sk h="h-9" w="w-9" />
                  <div className="flex-1 space-y-2"><Sk h="h-3" w="w-40" /><Sk h="h-2.5" w="w-24" /></div>
                  <Sk h="h-5" w="w-20" />
                </div>
              ))
            ) : ultimasAudiencias.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                No hay audiencias registradas
              </div>
            ) : (
              ultimasAudiencias.map((aud: any) => (
                <div key={aud.idAudiencia} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
                    <Mic className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                      Expediente {aud.idExpediente?.numeroExpediente ?? "—"}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{tiempoRelativo(aud.fechaHoraProgramada)}</p>
                  </div>
                  <AudienciaBadge estado={aud.estadoAudiencia} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Últimas resoluciones */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
            <p className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-amber-500" />
              Últimas resoluciones
            </p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <Sk h="h-9" w="w-9" />
                  <div className="flex-1 space-y-2"><Sk h="h-3" w="w-40" /><Sk h="h-2.5" w="w-24" /></div>
                  <Sk h="h-5" w="w-20" />
                </div>
              ))
            ) : ultimasResoluciones.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                No hay resoluciones registradas
              </div>
            ) : (
              ultimasResoluciones.map((res: any) => (
                <div key={res.idResolucion} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0">
                    <ScrollText className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                      {res.numeroResolucion} — Exp. {res.idExpediente?.numeroExpediente ?? "—"}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{tiempoRelativo(res.fechaResolucion)}</p>
                  </div>
                  <ResolucionBadge estado={res.estado} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pie de página informativo */}
      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-600 pt-2 pb-4 border-t border-gray-100 dark:border-slate-800">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          Tribunal Digital — Sistema de Gestión Judicial
        </span>
        <span>Datos en tiempo real · cache-and-network</span>
      </div>

    </div>
  );
}