import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard, FileText, Mic, ScrollText, Users,
  FileArchive, TrendingUp, Gavel, FolderOpen, ShieldCheck,
  Plus, Calendar, Clock, ArrowRight, ClipboardList, Zap,
} from "lucide-react";
import { ACCESOS_RAPIDOS_STYLES } from "./shared";

// ── Queries ───────────────────────────────────────────────────────────────────

const GET_DASHBOARD = gql`
  query GetDashboard {
    allExpedientes {
      idExpediente
      numeroExpediente
      fechaIngreso
      idEstadoExpediente { nombreEstado esTerminal }
    }
    allAudiencias {
      idAudiencia
      estadoAudiencia
      fechaHoraProgramada
      idExpediente { idExpediente numeroExpediente }
      idTipoAudiencia { nombre }
      idSalaAud { nombreSala }
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
    allActuaciones {
      idActuacion
      fechaActuacion
      descripcion
      idExpediente { numeroExpediente }
      idTipoActuacion { nombre }
      usuario { nombres paterno }
    }
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

const fmtHora = (fechaStr: string) =>
  new Date(fechaStr).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });

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

const saludoPorHora = () => {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
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
  REALIZADA:  "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
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

// ── Accesos rápidos config ────────────────────────────────────────────────────
// color debe ser una key de ACCESOS_RAPIDOS_STYLES en shared.tsx
const ACCESOS_RAPIDOS = [
  { label: "Expedientes",  icon: FolderOpen,    path: "/expedientes",  color: "blue"    },
  { label: "Audiencias",   icon: Mic,           path: "/audiencias",   color: "indigo"  },
  { label: "Resoluciones", icon: ScrollText,    path: "/resoluciones", color: "amber"   },
  { label: "Actuaciones",  icon: ClipboardList, path: "/actuaciones",  color: "emerald" },
] as const;

// ── Componente principal ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
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

  const audienciasHoy = [...audHoy].sort(
    (a: any, b: any) =>
      new Date(a.fechaHoraProgramada).getTime() - new Date(b.fechaHoraProgramada).getTime()
  );

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

  const ultimasActuaciones = [...actuaciones]
    .sort((a: any, b: any) =>
      new Date(b.fechaActuacion).getTime() - new Date(a.fechaActuacion).getTime()
    )
    .slice(0, 5);

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

      {/* ── ENCABEZADO ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <LayoutDashboard className="w-7 h-7 text-blue-500" />
            {saludoPorHora()}, {usuario?.nombre ?? usuario?.username ?? "Usuario"} 👋
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 capitalize">
            {new Date().toLocaleDateString("es-BO", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate("/expedientes")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all duration-200 hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            Nuevo expediente
          </button>
          <button
            onClick={() => navigate("/audiencias")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 font-medium text-sm transition-all"
          >
            <Calendar className="w-4 h-4" />
            Audiencias
          </button>
        </div>
      </div>

      {/* ── AUDIENCIAS DE HOY ── */}
      {!loading && audienciasHoy.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200 dark:border-blue-800/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
              <p className="text-sm font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                Audiencias de hoy — {audienciasHoy.length} programada{audienciasHoy.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => navigate("/audiencias")}
              className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Ver todas <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {audienciasHoy.map((aud: any) => (
              <div
                key={aud.idAudiencia}
                className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-blue-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate("/audiencias")}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                      {fmtHora(aud.fechaHoraProgramada)}
                    </span>
                  </div>
                  <AudienciaBadge estado={aud.estadoAudiencia} />
                </div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                  {aud.idTipoAudiencia?.nombre ?? "Audiencia"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Exp. {aud.idExpediente?.numeroExpediente ?? "—"}
                  {aud.idSalaAud?.nombreSala ? ` · ${aud.idSalaAud.nombreSala}` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && audienciasHoy.length === 0 && (
        <div className="bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-gray-300 dark:border-slate-700 p-4 flex items-center gap-3 text-gray-400 dark:text-gray-500">
          <Calendar className="w-5 h-5 shrink-0" />
          <p className="text-sm">No hay audiencias programadas para hoy.</p>
        </div>
      )}

      {/* ── ACCESOS RÁPIDOS — corregido con shared.tsx ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ACCESOS_RAPIDOS.map(({ label, icon: Icon, path, color }) => {
          const s = ACCESOS_RAPIDOS_STYLES[color];
          return (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl ${s.bg} border ${s.border} hover:shadow-md transition-all hover:scale-[1.02] group`}
            >
              <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon className={`w-5 h-5 ${s.iconColor}`} />
              </div>
              <span className={`text-xs font-semibold ${s.textColor}`}>{label}</span>
            </button>
          );
        })}
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm space-y-3">
              <Sk h="h-3" w="w-24" /><Sk h="h-7" w="w-16" /><Sk h="h-2.5" w="w-32" />
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

      {/* ── GRÁFICO + RESUMEN ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                { label: "Total audiencias",   value: audiencias.length,   color: "text-blue-600 dark:text-blue-400"       },
                { label: "Total resoluciones", value: resoluciones.length, color: "text-amber-600 dark:text-amber-400"     },
                { label: "Total documentos",   value: documentos.length,   color: "text-purple-600 dark:text-purple-400"   },
                { label: "Total actuaciones",  value: actuaciones.length,  color: "text-sky-600 dark:text-sky-400"         },
                { label: "Total personas",     value: personas.length,     color: "text-rose-600 dark:text-rose-400"       },
              ].map((item, i, arr) => (
                <div key={item.label} className={`flex justify-between items-center py-2.5 text-sm ${i < arr.length - 1 ? "border-b border-gray-100 dark:border-slate-700" : ""}`}>
                  <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
                  <span className={`font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── EXPEDIENTES POR ESTADO ── */}
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
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{pct}%</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TRES COLUMNAS: audiencias + resoluciones + actuaciones ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Últimas audiencias */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <Mic className="w-4 h-4 text-blue-500" />
              Últimas audiencias
            </p>
            <button onClick={() => navigate("/audiencias")} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
              Ver <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <Sk h="h-8" w="w-8" /><div className="flex-1 space-y-2"><Sk h="h-3" w="w-32" /><Sk h="h-2.5" w="w-20" /></div>
                </div>
              ))
            ) : ultimasAudiencias.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">Sin audiencias</div>
            ) : (
              ultimasAudiencias.map((aud: any) => (
                <div key={aud.idAudiencia} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <Mic className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">
                      Exp. {aud.idExpediente?.numeroExpediente ?? "—"}
                    </p>
                    <p className="text-[11px] text-gray-400">{tiempoRelativo(aud.fechaHoraProgramada)}</p>
                  </div>
                  <AudienciaBadge estado={aud.estadoAudiencia} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Últimas resoluciones */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-amber-500" />
              Últimas resoluciones
            </p>
            <button onClick={() => navigate("/resoluciones")} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
              Ver <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <Sk h="h-8" w="w-8" /><div className="flex-1 space-y-2"><Sk h="h-3" w="w-32" /><Sk h="h-2.5" w="w-20" /></div>
                </div>
              ))
            ) : ultimasResoluciones.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">Sin resoluciones</div>
            ) : (
              ultimasResoluciones.map((res: any) => (
                <div key={res.idResolucion} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                    <ScrollText className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">
                      {res.numeroResolucion}
                    </p>
                    <p className="text-[11px] text-gray-400">{tiempoRelativo(res.fechaResolucion)}</p>
                  </div>
                  <ResolucionBadge estado={res.estado} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Últimas actuaciones */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-500" />
              Últimas actuaciones
            </p>
            <button onClick={() => navigate("/actuaciones")} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
              Ver <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <Sk h="h-8" w="w-8" /><div className="flex-1 space-y-2"><Sk h="h-3" w="w-32" /><Sk h="h-2.5" w="w-20" /></div>
                </div>
              ))
            ) : ultimasActuaciones.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">Sin actuaciones</div>
            ) : (
              ultimasActuaciones.map((act: any) => (
                <div key={act.idActuacion} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">
                      {act.idTipoActuacion?.nombre ?? "Actuación"}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">
                      Exp. {act.idExpediente?.numeroExpediente ?? "—"} · {tiempoRelativo(act.fechaActuacion)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── PIE ── */}
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
