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
  GET_USUARIOS_PARA_REPORTE,
} from "../../graphql/reportes";
import {
  BarChart2, FileText, Mic, Users, Building2, Mail, X,
  CheckCircle, AlertCircle, Search, UserCheck,
} from "lucide-react";

// ─── TIPOS ────────────────────────────────────────────────
type TabReporte = "audiencias" | "expedientes" | "salas" | "usuarios";

type ModoFecha = "anual" | "mensual" | "rango";

const MESES_OPTS = [
  { value: 1,  label: "Enero"      },
  { value: 2,  label: "Febrero"    },
  { value: 3,  label: "Marzo"      },
  { value: 4,  label: "Abril"      },
  { value: 5,  label: "Mayo"       },
  { value: 6,  label: "Junio"      },
  { value: 7,  label: "Julio"      },
  { value: 8,  label: "Agosto"     },
  { value: 9,  label: "Septiembre" },
  { value: 10, label: "Octubre"    },
  { value: 11, label: "Noviembre"  },
  { value: 12, label: "Diciembre"  },
];

const ROLES_DISPONIBLES = ["Administrador", "Vocal", "Secretario"];

// ─── HELPERS ─────────────────────────────────────────────
const totalArr = (arr: { cantidad: number }[]) =>
  arr.reduce((s, x) => s + x.cantidad, 0);

// ─── COLORES ──────────────────────────────────────────────
const COLORES = ["blue", "red", "amber", "purple", "orange", "emerald", "sky"];

const COLOR_ESTADO_AUD: Record<string, string> = {
  PROGRAMADA: "text-blue-500",
  EN_CURSO:   "text-amber-500",
  REALIZADA:  "text-emerald-500",
  FINALIZADA: "text-purple-500",
  SUSPENDIDA: "text-red-500",
};
const BG_ESTADO_AUD: Record<string, string> = {
  PROGRAMADA: "#3b82f6",
  EN_CURSO:   "#f59e0b",
  REALIZADA:  "#10b981",
  FINALIZADA: "#a855f7",
  SUSPENDIDA: "#ef4444",
};
const CHART_COLORS = ["#3b82f6","#ef4444","#f59e0b","#a855f7","#f97316","#10b981","#8b949e"];
const colorIdx = (i: number) => CHART_COLORS[i % CHART_COLORS.length];

// ─── SKELETON ─────────────────────────────────────────────
const Sk = ({ w = "w-full", h = "h-3" }: { w?: string; h?: string }) => (
  <div className={`${w} ${h} bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse`} />
);

const SkCard = () => (
  <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg space-y-3">
    <Sk h="h-3" w="w-28" />
    <Sk h="h-7" w="w-20" />
    <Sk h="h-2.5" w="w-36" />
  </div>
);

// ─── STAT CARD ────────────────────────────────────────────
const StatCard = ({ label, value, sub, color, icon }: {
  label: string; value: number | string; sub?: string;
  color: string; icon: React.ReactNode;
}) => {
  const bgMap: Record<string, string> = {
    blue:    "bg-blue-100 dark:bg-blue-900/30",
    emerald: "bg-emerald-100 dark:bg-emerald-900/30",
    amber:   "bg-amber-100 dark:bg-amber-900/30",
    purple:  "bg-purple-100 dark:bg-purple-900/30",
    yellow:  "bg-amber-100 dark:bg-amber-900/30",
  };
  const key = Object.keys(bgMap).find(k => color.includes(k)) ?? "blue";
  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg hover:shadow-xl transition-all duration-300 group flex-1 min-w-[160px]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
          <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${bgMap[key]}`}>
          {icon}
        </div>
      </div>
      {sub && (
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">{sub}</p>
        </div>
      )}
    </div>
  );
};

// ─── CHART CARD ───────────────────────────────────────────
const ChartCard = ({ title, children, className = "" }: {
  title: string; children: React.ReactNode; className?: string;
}) => (
  <div className={`bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg ${className}`}>
    <p className="text-sm font-semibold text-gray-800 dark:text-white mb-4">{title}</p>
    {children}
  </div>
);

// ─── BARRA HORIZONTAL ─────────────────────────────────────
const BarraHorizontal = ({ items }: {
  items: { label: string; cantidad: number; color: string }[];
}) => {
  const max = Math.max(...items.map(i => i.cantidad), 1);
  return (
    <div className="flex flex-col gap-3">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-3">
          <div className="w-28 text-xs text-gray-500 dark:text-gray-400 text-right shrink-0 truncate">{item.label}</div>
          <div className="flex-1 bg-gray-100 dark:bg-slate-700 rounded-full h-5 overflow-hidden">
            <div
              style={{ width: `${(item.cantidad / max) * 100}%`, backgroundColor: item.color }}
              className="h-full rounded-full transition-all duration-500 opacity-80"
            />
          </div>
          <div className="w-7 text-xs font-bold text-gray-700 dark:text-gray-200">{item.cantidad}</div>
        </div>
      ))}
    </div>
  );
};

// ─── DONUT CHART ──────────────────────────────────────────
const DonutChart = ({ items, size = 160 }: {
  items: { label: string; cantidad: number; color: string }[];
  size?: number;
}) => {
  const total = totalArr(items);
  if (total === 0) return <p className="text-xs text-gray-400 dark:text-gray-500">Sin datos</p>;
  const r = 60, cx = size / 2, cy = size / 2;
  let startAngle = -Math.PI / 2;
  const slices = items.map(item => {
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
      {slices.map(s => (
        <path key={s.label} d={s.path} fill={s.color} opacity={0.85} stroke="transparent" strokeWidth={2} />
      ))}
      <circle cx={cx} cy={cy} r={38} className="fill-white dark:fill-slate-800" />
      <text x={cx} y={cy - 5} textAnchor="middle" className="fill-gray-800 dark:fill-white" fontSize={18} fontWeight={700}>{total}</text>
      <text x={cx} y={cy + 13} textAnchor="middle" className="fill-gray-400" fontSize={9}>total</text>
    </svg>
  );
};

// ─── LEYENDA ──────────────────────────────────────────────
const Leyenda = ({ items }: { items: { label: string; cantidad: number; color: string }[] }) => {
  const total = totalArr(items);
  return (
    <div className="flex flex-col gap-2">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-2">
          <div style={{ backgroundColor: item.color }} className="w-2.5 h-2.5 rounded-sm shrink-0" />
          <span className="flex-1 text-xs text-gray-500 dark:text-gray-400 truncate">{item.label}</span>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{item.cantidad}</span>
          <span className="text-xs text-gray-400 w-8 text-right">
            {total > 0 ? Math.round((item.cantidad / total) * 100) : 0}%
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── BAR CHART MES ────────────────────────────────────────
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
            <rect x={x} y={y} width={barW} height={barH} fill="#3b82f6" opacity={0.75} rx={3} />
            <text x={x + barW / 2} y={h + 14} textAnchor="middle" fill="#9ca3af" fontSize={9}>{d.mes}</text>
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" fill="#3b82f6" fontSize={9} fontWeight={600}>{d.cantidad}</text>
          </g>
        );
      })}
    </svg>
  );
};

// ─── ROL BADGE ────────────────────────────────────────────
const RolBadge = ({ rol }: { rol: string }) => {
  const styles: Record<string, string> = {
    Juez:          "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    Vocal:         "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
    Secretaria:    "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    Secretario:    "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    Administrador: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${styles[rol] ?? "bg-gray-100 dark:bg-slate-700 text-gray-600"}`}>
      {rol}
    </span>
  );
};

// ─── TABLA GENÉRICA ───────────────────────────────────────
const Tabla = ({ headers, children }: { headers: string[]; children: React.ReactNode }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700">
        <tr>
          {headers.map(h => (
            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-slate-700">{children}</tbody>
    </table>
  </div>
);

// ─── MODAL ENVÍO EMAIL ────────────────────────────────────
type ResultadoEnvio = {
  ok: boolean; mensaje: string;
  enviados: number; fallidos: number; destinatarios: string[];
};



type ModoEnvio = "roles" | "individual";

const MESES_LABELS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

const ModalEnvioEmail = ({ anio, mes, fechaInicio, fechaFin, modoFecha, onClose }: { anio: number; mes?: number; fechaInicio?: string; fechaFin?: string; modoFecha: ModoFecha; onClose: () => void }) => {
  const [modo, setModo]               = useState<ModoEnvio>("roles");
  const [roles, setRoles]             = useState<string[]>(["Administrador", "Vocal", "Secretario"]);
  const [usuariosSelec, setUsuariosSelec] = useState<number[]>([]);
  const [busqueda, setBusqueda]       = useState("");
  const [resultado, setResultado]     = useState<ResultadoEnvio | null>(null);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const { data: dataUsuarios, loading: loadingUsuarios } = useQuery(GET_USUARIOS_PARA_REPORTE);
  const [enviarReporte, { loading }] = useMutation(ENVIAR_REPORTES_EMAIL, {
    onCompleted: d => setResultado(d.enviarReportesPorEmail),
    onError: err => setResultado({ ok: false, mensaje: `Error: ${err.message}`, enviados: 0, fallidos: 0, destinatarios: [] }),
  });

  const todosUsuarios: any[] = (dataUsuarios?.allUsuarios ?? []).filter((u: any) => u.activo);

  const usuariosFiltrados = todosUsuarios.filter((u: any) => {
    const texto = `${u.paterno} ${u.nombres} ${u.email} ${u.rol?.nombre ?? ""}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  const toggleRol = (rol: string) =>
    setRoles(prev => prev.includes(rol) ? prev.filter(r => r !== rol) : [...prev, rol]);

  const toggleUsuario = (id: number) => {
    const numId = Number(id);
    setUsuariosSelec(prev => 
      prev.some(i => Number(i) === numId) 
        ? prev.filter(i => Number(i) !== numId) 
        : [...prev, numId]
    );
  };
  const seleccionarTodos = () =>
    setUsuariosSelec(usuariosFiltrados.map((u: any) => Number(u.idUsuario)));

  const deseleccionarTodos = () => setUsuariosSelec([]);

  const seleccionarPorRol = (rol: string) => {
    const ids = usuariosFiltrados
      .filter((u: any) => u.rol?.nombre === rol)
      .map((u: any) => Number(u.idUsuario));
    setUsuariosSelec(prev => {
      const sinRol = prev.filter(id =>
        !usuariosFiltrados.find((u: any) => u.idUsuario === id && u.rol?.nombre === rol)
      );
      return [...new Set([...sinRol, ...ids])];
    });
  };

  const handleEnviar = () => {
    setResultado(null);
    const filtro = modoFecha === "mensual"
      ? { anio, mes }
      : modoFecha === "rango" && fechaInicio && fechaFin
        ? { anio, fechaInicio, fechaFin }
        : { anio };

    if (modo === "roles") {
      if (!roles.length) return;
      enviarReporte({ variables: { ...filtro, roles } });
    } else {
      if (!usuariosSelec.length) return;
      const vars = { ...filtro, usuarioIds: usuariosSelec.map(id => parseInt(String(id), 10)) };
      console.log("ENVIANDO:", JSON.stringify(vars));
      enviarReporte({ variables: vars });
    }
  };

  const canEnviar = modo === "roles" ? roles.length > 0 : usuariosSelec.length > 0;

  const INFO_ROL: Record<string, string> = {
    Administrador: "Reporte completo: audiencias, expedientes, carga por sala y actividad de usuarios",
    Vocal:         "Reporte de audiencias del período",
    Secretario:    "Reporte de audiencias y expedientes",
  };

  const ROL_COLOR: Record<string, string> = {
    Administrador: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    Vocal:         "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
    Secretario:    "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-500" />
              Enviar Reporte por Email
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {modoFecha === "mensual" && mes
                ? `PDF de ${["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"][mes-1]} ${anio}`
                : modoFecha === "rango" && fechaInicio && fechaFin
                  ? `PDF del ${fechaInicio} al ${fechaFin}`
                  : `PDF del año ${anio}`
              } · {canEnviar
                ? modo === "roles"
                  ? `${roles.length} rol(es) seleccionado(s)`
                  : `${usuariosSelec.length} usuario(s) seleccionado(s)`
                : "Sin selección"
              }
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {!resultado ? (
            <>
              {/* Selector de modo */}
              <div className="flex gap-2 p-1 bg-gray-100 dark:bg-slate-700 rounded-xl">
                {([
                  { key: "roles", label: "Por rol", icon: Users },
                  { key: "individual", label: "Seleccionar usuarios", icon: UserCheck },
                ] as { key: ModoEnvio; label: string; icon: any }[]).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setModo(key)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                      modo === key
                        ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>

              {/* ── MODO: ROLES ── */}
              {modo === "roles" && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Seleccioná los roles destinatarios:
                  </p>
                  {ROLES_DISPONIBLES.map(rol => {
                    const sel = roles.includes(rol);
                    return (
                      <div
                        key={rol}
                        onClick={() => toggleRol(rol)}
                        className={`flex items-start gap-3 p-3.5 rounded-xl cursor-pointer border transition-all ${
                          sel
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 border-2 transition-colors ${
                          sel ? "bg-blue-500 border-blue-500" : "border-gray-400 dark:border-gray-500"
                        }`}>
                          {sel && <span className="text-white text-[10px] font-bold">✓</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-800 dark:text-white">{rol}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${ROL_COLOR[rol]}`}>{rol}</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{INFO_ROL[rol]}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── MODO: INDIVIDUAL ── */}
              {modo === "individual" && (
                <div className="space-y-3">
                  {/* Buscador */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre, email o rol..."
                      value={busqueda}
                      onChange={e => setBusqueda(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      autoFocus
                    />
                  </div>

                  {/* Acciones rápidas */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={seleccionarTodos}
                      className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 font-medium transition-colors"
                    >
                      Seleccionar todos ({usuariosFiltrados.length})
                    </button>
                    <button
                      onClick={deseleccionarTodos}
                      className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 font-medium transition-colors"
                    >
                      Limpiar
                    </button>
                    <div className="h-4 w-px bg-gray-200 dark:bg-slate-600" />
                    {ROLES_DISPONIBLES.map(rol => (
                      <button
                        key={rol}
                        onClick={() => seleccionarPorRol(rol)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${ROL_COLOR[rol]}`}
                      >
                        + {rol}
                      </button>
                    ))}
                  </div>

                  {/* Lista de usuarios */}
                  {loadingUsuarios ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                    </div>
                  ) : usuariosFiltrados.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                      <Search className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                      <p className="text-sm">Sin resultados</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                      {usuariosFiltrados.map((u: any) => {
                        const sel = usuariosSelec.some(i => Number(i) === Number(u.idUsuario));
                        const rolNombre = u.rol?.nombre ?? "—";
                        return (
                          <div
                            key={u.idUsuario}
                            onClick={() => toggleUsuario(u.idUsuario)}
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${
                              sel
                                ? "border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                                : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                            }`}
                          >
                            {/* Checkbox */}
                            <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-colors ${
                              sel ? "bg-blue-500 border-blue-500" : "border-gray-400 dark:border-gray-500"
                            }`}>
                              {sel && <span className="text-white text-[10px] font-bold">✓</span>}
                            </div>
                            {/* Avatar inicial */}
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shrink-0">
                              <span className="text-white text-xs font-bold">
                                {(u.paterno?.[0] ?? "").toUpperCase()}
                              </span>
                            </div>
                            {/* Datos */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                                {u.paterno} {u.nombres}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{u.email}</p>
                            </div>
                            {/* Rol badge */}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${ROL_COLOR[rolNombre] ?? "bg-gray-100 text-gray-600"}`}>
                              {rolNombre}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Contador seleccionados */}
                  {usuariosSelec.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50">
                      <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />
                      <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                        {usuariosSelec.length} usuario{usuariosSelec.length !== 1 ? "s" : ""} seleccionado{usuariosSelec.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Botón enviar */}
              <button
                onClick={handleEnviar}
                disabled={loading || !canEnviar}
                className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  !canEnviar
                    ? "bg-gray-100 dark:bg-slate-700 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md"
                } ${loading ? "opacity-70" : ""}`}
              >
                <Mail className="w-4 h-4" />
                {loading
                  ? "Generando PDF y enviando..."
                  : modo === "roles"
                    ? `Enviar a ${roles.length} rol(es)`
                    : `Enviar a ${usuariosSelec.length} usuario(s)`
                }
              </button>
            </>
          ) : (
            /* ── RESULTADO ── */
            <div className="space-y-4">
              <div className={`flex items-start gap-3 p-4 rounded-xl border ${
                resultado.ok
                  ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                  : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              }`}>
                {resultado.ok
                  ? <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  : <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
                <div>
                  <p className={`text-sm font-semibold ${resultado.ok ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
                    {resultado.ok ? "Reporte enviado correctamente" : "Envío con errores"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{resultado.mensaje}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Enviados", val: resultado.enviados, color: "text-emerald-600 dark:text-emerald-400" },
                  { label: "Fallidos", val: resultado.fallidos, color: "text-red-600 dark:text-red-400" },
                ].map(({ label, val, color }) => (
                  <div key={label} className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                    <p className={`text-2xl font-bold ${color}`}>{val}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
                  </div>
                ))}
              </div>

              {resultado.destinatarios.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Destinatarios:</p>
                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1">
                    {resultado.destinatarios.map((d, i) => (
                      <p key={i} className="text-xs text-gray-500 dark:text-gray-400">✉️ {d}</p>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────
export default function ReportesPage() {
  const [tab, setTab]           = useState<TabReporte>("audiencias");
  const [modoFecha, setModoFecha] = useState<ModoFecha>("anual");
  const [anio, setAnio]         = useState(new Date().getFullYear());
  const [mes, setMes]           = useState<number>(new Date().getMonth() + 1);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin]       = useState("");
  const [modalEmail, setModal]  = useState(false);

  // Armar variables según el modo seleccionado
  const filtroVars = (() => {
    if (modoFecha === "anual")   return { anio };
    if (modoFecha === "mensual") return { anio, mes };
    if (modoFecha === "rango" && fechaInicio && fechaFin)
      return { fechaInicio, fechaFin };
    return { anio };
  })();

  const vars = { variables: filtroVars };


  const { data: dAudEst,   loading: lAudEst,   error: eAudEst  } = useQuery(GET_REPORTE_AUDIENCIAS_ESTADO,  vars);
  const { data: dAudMes,   loading: lAudMes,   error: eAudMes  } = useQuery(GET_REPORTE_AUDIENCIAS_MES,     vars);
  const { data: dExpTipo,  loading: lExpTipo,  error: eExpTipo } = useQuery(GET_REPORTE_EXPEDIENTES_TIPO,   vars);
  const { data: dExpEst,   loading: lExpEst,   error: eExpEst  } = useQuery(GET_REPORTE_EXPEDIENTES_ESTADO, vars);
  const { data: dSalas,    loading: lSalas,    error: eSalas   } = useQuery(GET_REPORTE_CARGA_SALA,         vars);
  const { data: dUsuarios, loading: lUsuarios, error: eUsuarios} = useQuery(GET_REPORTE_ACTIVIDAD_USUARIOS, vars);

// DEBUG TEMPORAL
  console.log("vars:", filtroVars);
  console.log("errores:", { eAudEst, eAudMes, eExpTipo, eExpEst, eSalas, eUsuarios });
  console.log("datos:", { dAudEst, dAudMes, dExpTipo, dExpEst, dSalas, dUsuarios });
  const audPorEstado = (dAudEst?.reporteAudienciasPorEstado ?? []).map((r: any) => ({
    ...r, color: BG_ESTADO_AUD[r.estado] ?? "#8b949e",
  }));
  const audPorMes    = dAudMes?.reporteAudienciasPorMes ?? [];
  const expPorTipo   = (dExpTipo?.reporteExpedientesPorTipo ?? []).map((r: any, i: number) => ({ ...r, color: colorIdx(i) }));
  const expPorEstado = (dExpEst?.reporteExpedientesPorEstado ?? []).map((r: any, i: number) => ({ ...r, color: colorIdx(i) }));
  const cargaSalas   = dSalas?.reporteCargaPorSala ?? [];
  const actUsuarios  = dUsuarios?.reporteActividadUsuarios ?? [];

  const totalAudiencias  = totalArr(audPorEstado);
  const totalExpedientes = totalArr(expPorTipo);

  const TABS: { key: TabReporte; label: string; icon: React.ReactNode }[] = [
    { key: "audiencias",  label: "Audiencias",    icon: <Mic className="w-4 h-4" /> },
    { key: "expedientes", label: "Expedientes",   icon: <FileText className="w-4 h-4" /> },
    { key: "salas",       label: "Carga por sala",icon: <Building2 className="w-4 h-4" /> },
    { key: "usuarios",    label: "Actividad",     icon: <Users className="w-4 h-4" /> },
  ];

  {(eAudEst || eSalas || eUsuarios) && (
    <div className="p-4 bg-red-100 text-red-800 rounded-xl text-sm">
      Error: {eAudEst?.message || eSalas?.message || eUsuarios?.message}
    </div>
  )}

  return (
    <div className="space-y-6 animate-fade-in">

      {modalEmail && <ModalEnvioEmail anio={anio} mes={mes} fechaInicio={fechaInicio} fechaFin={fechaFin} modoFecha={modoFecha} onClose={() => setModal(false)} />}

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <BarChart2 className="w-7 h-7 text-blue-500" />
            Reportes
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Estadísticas y métricas del sistema judicial
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">

          {/* Selector de modo */}
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-slate-700 rounded-xl">
            {(["anual", "mensual", "rango"] as ModoFecha[]).map(m => (
              <button
                key={m}
                onClick={() => setModoFecha(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                  modoFecha === m
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {m === "anual" ? "Anual" : m === "mensual" ? "Mensual" : "Rango"}
              </button>
            ))}
          </div>

          {/* Controles según modo */}
          {modoFecha === "anual" && (
            <select
              value={anio}
              onChange={e => setAnio(Number(e.target.value))}
              className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {[2022, 2023, 2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          )}

          {modoFecha === "mensual" && (
            <div className="flex items-center gap-2">
              <select
                value={anio}
                onChange={e => setAnio(Number(e.target.value))}
                className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                {[2022, 2023, 2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <select
                value={mes}
                onChange={e => setMes(Number(e.target.value))}
                className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                {MESES_OPTS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          )}

          {modoFecha === "rango" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
                className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <span className="text-xs text-gray-400">→</span>
              <input
                type="date"
                value={fechaFin}
                onChange={e => setFechaFin(e.target.value)}
                className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          )}

          <button
            onClick={() => setModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]"
          >
            <Mail className="w-4 h-4" />
            Enviar reporte
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {(lAudEst || lExpTipo || lSalas || lUsuarios) ? (
          [...Array(4)].map((_, i) => <SkCard key={i} />)
        ) : (
          <>
            <StatCard label="Total audiencias"  value={totalAudiencias}  sub={`año ${anio}`}
              color="text-blue-600 dark:text-blue-400"
              icon={<Mic className="w-6 h-6 text-blue-600 dark:text-blue-400" />} />
            <StatCard label="Total expedientes" value={totalExpedientes} sub={`año ${anio}`}
              color="text-emerald-600 dark:text-emerald-400"
              icon={<FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />} />
            <StatCard label="Salas activas"     value={cargaSalas.length} sub="en todos los tribunales"
              color="text-purple-600 dark:text-purple-400"
              icon={<Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />} />
            <StatCard label="Usuarios activos"  value={actUsuarios.length} sub="con actividad registrada"
              color="text-amber-600 dark:text-amber-400"
              icon={<Users className="w-6 h-6 text-amber-600 dark:text-amber-400" />} />
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-lg overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-slate-700">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all border-b-2 -mb-px ${
                tab === t.key
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">

          {/* ── TAB: AUDIENCIAS ── */}
          {tab === "audiencias" && (
            <>
              {lAudEst ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <Sk key={i} />)}</div>
              ) : (
                <div className="flex flex-wrap gap-4">
                  <ChartCard title="Distribución por estado" className="flex-none">
                    <div className="flex gap-6 items-center">
                      <DonutChart items={audPorEstado.map((a: any) => ({ label: a.estado, cantidad: a.cantidad, color: a.color }))} />
                      <Leyenda    items={audPorEstado.map((a: any) => ({ label: a.estado, cantidad: a.cantidad, color: a.color }))} />
                    </div>
                  </ChartCard>
                  <ChartCard title="Audiencias por estado" className="flex-1 min-w-[280px]">
                    <BarraHorizontal items={audPorEstado.map((a: any) => ({ label: a.estado, cantidad: a.cantidad, color: a.color }))} />
                  </ChartCard>
                </div>
              )}
              {lAudMes ? (
                <div className="space-y-3">{[...Array(2)].map((_, i) => <Sk key={i} />)}</div>
              ) : (
                <ChartCard title={`Audiencias por mes — ${anio}`}>
                  <BarChartMes data={audPorMes} />
                </ChartCard>
              )}
              {!lAudEst && audPorEstado.length > 0 && (
                <ChartCard title="Resumen por estado">
                  <Tabla headers={["Estado", "Cantidad", "Porcentaje", "Indicador"]}>
                    {audPorEstado.map((a: any) => {
                      const pct = totalAudiencias > 0 ? Math.round((a.cantidad / totalAudiencias) * 100) : 0;
                      return (
                        <tr key={a.estado} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-2">
                              <span style={{ backgroundColor: a.color }} className="w-2 h-2 rounded-sm inline-block shrink-0" />
                              <span className="text-xs text-gray-700 dark:text-gray-200">{a.estado}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-sm" style={{ color: a.color }}>{a.cantidad}</td>
                          <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{pct}%</td>
                          <td className="px-4 py-3">
                            <div className="w-20 bg-gray-100 dark:bg-slate-700 rounded-full h-1.5">
                              <div style={{ width: `${pct}%`, backgroundColor: a.color }} className="h-full rounded-full" />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </Tabla>
                </ChartCard>
              )}
            </>
          )}

          {/* ── TAB: EXPEDIENTES ── */}
          {tab === "expedientes" && (
            <>
              {(lExpTipo || lExpEst) ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <Sk key={i} />)}</div>
              ) : (
                <div className="flex flex-wrap gap-4">
                  <ChartCard title="Por tipo de proceso" className="flex-none">
                    <div className="flex gap-6 items-center">
                      <DonutChart items={expPorTipo.map((e: any) => ({ label: e.tipo,   cantidad: e.cantidad, color: e.color }))} />
                      <Leyenda    items={expPorTipo.map((e: any) => ({ label: e.tipo,   cantidad: e.cantidad, color: e.color }))} />
                    </div>
                  </ChartCard>
                  <ChartCard title="Por estado del expediente" className="flex-none">
                    <div className="flex gap-6 items-center">
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
            </>
          )}

          {/* ── TAB: SALAS ── */}
          {tab === "salas" && (
            <>
              {lSalas ? (
                <div className="space-y-3">{[...Array(4)].map((_, i) => <Sk key={i} />)}</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <ChartCard title="Audiencias por sala">
                      <BarraHorizontal items={cargaSalas.map((s: any) => ({ label: s.sala, cantidad: s.audiencias, color: "#3b82f6" }))} />
                    </ChartCard>
                    <ChartCard title="Expedientes por sala">
                      <BarraHorizontal items={cargaSalas.map((s: any) => ({ label: s.sala, cantidad: s.expedientes, color: "#10b981" }))} />
                    </ChartCard>
                  </div>
                  <ChartCard title="Detalle de carga por sala">
                    <Tabla headers={["Sala", "Tribunal", "Audiencias", "Expedientes", "Carga total"]}>
                      {cargaSalas.map((s: any) => {
                        const total = s.audiencias + s.expedientes;
                        const maxTotal = Math.max(...cargaSalas.map((x: any) => x.audiencias + x.expedientes), 1);
                        return (
                          <tr key={s.sala} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                            <td className="px-4 py-3 font-semibold text-sm text-gray-800 dark:text-white">{s.sala}</td>
                            <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{s.tribunal}</td>
                            <td className="px-4 py-3 font-bold text-blue-600 dark:text-blue-400">{s.audiencias}</td>
                            <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">{s.expedientes}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-gray-700 dark:text-gray-200 w-6">{total}</span>
                                <div className="flex-1 bg-gray-100 dark:bg-slate-700 rounded-full h-1.5">
                                  <div
                                    style={{ width: `${(total / maxTotal) * 100}%`, background: "linear-gradient(90deg,#3b82f6,#a855f7)" }}
                                    className="h-full rounded-full"
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </Tabla>
                  </ChartCard>
                </>
              )}
            </>
          )}

          {/* ── TAB: USUARIOS ── */}
          {tab === "usuarios" && (
            <>
              {lUsuarios ? (
                <div className="space-y-3">{[...Array(4)].map((_, i) => <Sk key={i} />)}</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <StatCard
                      label="Total actuaciones" sub=""
                      value={actUsuarios.reduce((s: number, u: any) => s + u.actuaciones, 0)}
                      color="text-emerald-600 dark:text-emerald-400"
                      icon={<FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
                    />
                    <StatCard
                      label="Total documentos" sub=""
                      value={actUsuarios.reduce((s: number, u: any) => s + u.documentos, 0)}
                      color="text-purple-600 dark:text-purple-400"
                      icon={<FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
                    />
                  </div>
                  <ChartCard title="Actuaciones procesales por usuario">
                    <BarraHorizontal
                      items={actUsuarios.map((u: any) => ({
                        label: u.usuario.split(" ")[0],
                        cantidad: u.actuaciones,
                        color: "#10b981",
                      }))}
                    />
                  </ChartCard>
                  <ChartCard title="Detalle de actividad">
                    <Tabla headers={["Usuario", "Rol", "Actuaciones", "Documentos", "Total actividad"]}>
                      {[...actUsuarios]
                        .sort((a: any, b: any) => (b.actuaciones + b.documentos) - (a.actuaciones + a.documentos))
                        .map((u: any) => {
                          const totalAct = u.actuaciones + u.documentos;
                          const maxAct = Math.max(...actUsuarios.map((x: any) => x.actuaciones + x.documentos), 1);
                          return (
                            <tr key={u.usuario} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                              <td className="px-4 py-3 font-medium text-sm text-gray-800 dark:text-white">{u.usuario}</td>
                              <td className="px-4 py-3"><RolBadge rol={u.rol} /></td>
                              <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">{u.actuaciones}</td>
                              <td className="px-4 py-3 font-bold text-purple-600 dark:text-purple-400">{u.documentos}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-gray-700 dark:text-gray-200 w-7">{totalAct}</span>
                                  <div className="flex-1 bg-gray-100 dark:bg-slate-700 rounded-full h-1.5">
                                    <div
                                      style={{ width: `${(totalAct / maxAct) * 100}%`, background: "linear-gradient(90deg,#10b981,#3b82f6)" }}
                                      className="h-full rounded-full"
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </Tabla>
                  </ChartCard>
                </>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}