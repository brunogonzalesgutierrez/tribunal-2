// src/components/NotificacionesPanel.tsx
// Reemplaza el panel estático del Header por uno con datos reales.
// Uso en el Header:
//   import NotificacionesPanel from "./NotificacionesPanel";
//   <NotificacionesPanel />

import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, Clock, AlertCircle, CheckCircle2, X } from "lucide-react";
import { useNotificaciones, NotifItem } from "../hooks/useNotificaciones";

// ─── Helpers ─────────────────────────────────────────────
function fmtRelativo(fechaStr: string | null): string {
  if (!fechaStr) return "—";
  const diff = Date.now() - new Date(fechaStr).getTime();
  const min  = Math.floor(diff / 60_000);
  const h    = Math.floor(diff / 3_600_000);
  const d    = Math.floor(diff / 86_400_000);
  if (min < 1)  return "ahora";
  if (min < 60) return `hace ${min} min`;
  if (h   < 24) return `hace ${h} h`;
  if (d   < 7)  return `hace ${d} días`;
  return new Date(fechaStr).toLocaleDateString("es-BO", { day: "2-digit", month: "short" });
}

function EstadoBadge({ estado }: { estado: NotifItem["estadoNotificacion"] }) {
  const map = {
    PENDIENTE:    { bg: "bg-amber-100 dark:bg-amber-900/40",  text: "text-amber-700 dark:text-amber-400",  icon: <Clock className="w-3 h-3" />,         label: "Pendiente"    },
    DILIGENCIADA: { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-400", icon: <CheckCircle2 className="w-3 h-3" />, label: "Diligenciada" },
    FALLIDA:      { bg: "bg-red-100 dark:bg-red-900/40",     text: "text-red-700 dark:text-red-400",      icon: <AlertCircle className="w-3 h-3" />,   label: "Fallida"      },
  };
  const s = map[estado] ?? map.PENDIENTE;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${s.bg} ${s.text}`}>
      {s.icon}{s.label}
    </span>
  );
}

function TipoBadge({ tipo }: { tipo: string }) {
  const colores: Record<string, string> = {
    CEDULA:      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    ELECTRONICA: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
    PERSONAL:    "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400",
    PUERTA:      "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${colores[tipo] ?? "bg-gray-100 text-gray-600"}`}>
      {tipo.charAt(0) + tipo.slice(1).toLowerCase()}
    </span>
  );
}

// ─── Item individual ──────────────────────────────────────
function NotifRow({
  notif,
  onMarcar,
}: {
  notif: NotifItem;
  onMarcar: (id: number) => void;
}) {
  const esPendiente = notif.estadoNotificacion === "PENDIENTE";
  const persona = notif.idParte?.idPersona;

  return (
    <div
      className={`relative px-4 py-3 border-b border-gray-100 dark:border-slate-700/60 hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors group ${
        esPendiente ? "bg-amber-50/40 dark:bg-amber-900/10" : ""
      }`}
    >
      {/* Indicador izquierdo si pendiente */}
      {esPendiente && (
        <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-amber-400" />
      )}

      <div className="flex items-start justify-between gap-2">
        {/* Contenido */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Expediente */}
          <div className="flex items-center gap-2 flex-wrap">
            {notif.idExpediente && (
              <span className="text-xs font-bold text-blue-500 font-mono">
                #{notif.idExpediente.numeroExpediente}
              </span>
            )}
            <TipoBadge tipo={notif.tipoNotificacion} />
            <EstadoBadge estado={notif.estadoNotificacion} />
          </div>

          {/* Persona */}
          {persona && (
            <p className="text-sm text-gray-700 dark:text-gray-200 font-medium truncate">
              {persona.nombre} {persona.primerApellido}
              {notif.idParte?.idRol && (
                <span className="text-xs text-gray-400 font-normal ml-1">
                  · {notif.idParte.idRol.nombreRol}
                </span>
              )}
            </p>
          )}

          {/* Documento */}
          {notif.idDocumento && (
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
              📄 {notif.idDocumento.titulo}
            </p>
          )}

          {/* Fecha */}
          <p className="text-[11px] text-gray-400">{fmtRelativo(notif.fechaEmision)}</p>
        </div>

        {/* Botón marcar */}
        {esPendiente && (
          <button
            onClick={() => onMarcar(Number(notif.idNotificacion))}
            title="Marcar como diligenciada"
            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-gray-400 hover:text-emerald-600 transition-all shrink-0"
          >
            <CheckCheck className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Panel principal ──────────────────────────────────────
export default function NotificacionesPanel() {
  const [abierto, setAbierto] = useState(false);
  const [tab, setTab]         = useState<"todas" | "pendientes">("todas");
  const panelRef              = useRef<HTMLDivElement>(null);

  const { recientes, pendientes, totalPendientes, loading, marcarUna, marcarTodas } =
    useNotificaciones(30_000);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const lista = tab === "pendientes" ? pendientes : recientes;

  return (
    <div className="relative" ref={panelRef}>
      {/* ── Botón campana ── */}
      <button
        onClick={() => setAbierto(p => !p)}
        className="relative p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        title="Notificaciones"
      >
        <Bell className="w-5 h-5" />
        {totalPendientes > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse shadow shadow-red-500/40">
            {totalPendientes > 99 ? "99+" : totalPendientes}
          </span>
        )}
      </button>

      {/* ── Panel desplegable ── */}
      {abierto && (
        <div className="absolute right-0 top-full mt-2 w-[360px] max-h-[520px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-black/20 border border-gray-200 dark:border-slate-700 flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">

          {/* Cabecera */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Notificaciones</h3>
              {totalPendientes > 0 && (
                <p className="text-xs text-amber-500">{totalPendientes} pendiente{totalPendientes !== 1 ? "s" : ""}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {totalPendientes > 0 && (
                <button
                  onClick={() => { marcarTodas(); }}
                  className="text-xs text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1 hover:underline"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Marcar todas
                </button>
              )}
              <button
                onClick={() => setAbierto(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 dark:border-slate-700 px-4">
            {(["todas", "pendientes"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors capitalize -mb-px ${
                  tab === t
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {t === "todas" ? "Todas" : `Pendientes`}
                {t === "pendientes" && totalPendientes > 0 && (
                  <span className="ml-1.5 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-full px-1.5 py-0.5 text-[10px]">
                    {totalPendientes}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto">
            {loading && lista.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-2" />
                <span className="text-sm">Cargando...</span>
              </div>
            ) : lista.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Bell className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">
                  {tab === "pendientes" ? "Sin notificaciones pendientes" : "Sin notificaciones"}
                </p>
              </div>
            ) : (
              lista.map(n => (
                <NotifRow
                  key={n.idNotificacion}
                  notif={n}
                  onMarcar={id => marcarUna(id)}
                />
              ))
            )}
          </div>

          {/* Pie */}
          <div className="px-4 py-2.5 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
            <a
              href="/notificaciones"
              className="text-xs text-blue-500 hover:text-blue-700 font-medium hover:underline"
              onClick={() => setAbierto(false)}
            >
              Ver todas en la página →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
