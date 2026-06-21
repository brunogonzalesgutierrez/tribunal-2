// src/pages/denuncias/ModalAccionAudiencia.tsx
// Modal propio para reemplazar confirm() y prompt() nativos del navegador
// Maneja 3 acciones: INICIAR, SUSPENDER, FINALIZAR

import { useState } from "react";
import { Clock, CheckCircle, AlertTriangle, X, Loader2 } from "lucide-react";

export type AccionAudiencia = "INICIAR" | "SUSPENDER" | "FINALIZAR";

interface Props {
  accion: AccionAudiencia;
  nombreAudiencia: string;
  onConfirmar: (motivo?: string) => Promise<void>;
  onCancelar: () => void;
}

const CONFIG: Record<AccionAudiencia, {
  icono: React.ReactNode;
  titulo: string;
  descripcion: string;
  colorBg: string;
  colorBorder: string;
  colorIconBg: string;
  colorIconText: string;
  colorBtn: string;
  labelBtn: string;
  pideMotivoSuspension?: boolean;
}> = {
  INICIAR: {
    icono: <Clock className="w-5 h-5" />,
    titulo: "Iniciar audiencia",
    descripcion: "Se registrará la hora exacta de inicio. Esta acción cambiará el estado a «En curso».",
    colorBg:      "bg-indigo-50 dark:bg-indigo-900/20",
    colorBorder:  "border-indigo-200 dark:border-indigo-800",
    colorIconBg:  "bg-indigo-100 dark:bg-indigo-900/50",
    colorIconText:"text-indigo-600 dark:text-indigo-400",
    colorBtn:     "bg-indigo-500 hover:bg-indigo-600",
    labelBtn:     "Iniciar ahora",
  },
  SUSPENDER: {
    icono: <AlertTriangle className="w-5 h-5" />,
    titulo: "Suspender audiencia",
    descripcion: "Indicá el motivo. La audiencia quedará en estado «Suspendida» y podrá reprogramarse.",
    colorBg:      "bg-amber-50 dark:bg-amber-900/20",
    colorBorder:  "border-amber-200 dark:border-amber-800",
    colorIconBg:  "bg-amber-100 dark:bg-amber-900/50",
    colorIconText:"text-amber-600 dark:text-amber-400",
    colorBtn:     "bg-amber-500 hover:bg-amber-600",
    labelBtn:     "Confirmar suspensión",
    pideMotivoSuspension: true,
  },
  FINALIZAR: {
    icono: <CheckCircle className="w-5 h-5" />,
    titulo: "Finalizar audiencia",
    descripcion: "Se registrará la hora exacta de cierre. El estado pasará a «Realizada».",
    colorBg:      "bg-emerald-50 dark:bg-emerald-900/20",
    colorBorder:  "border-emerald-200 dark:border-emerald-800",
    colorIconBg:  "bg-emerald-100 dark:bg-emerald-900/50",
    colorIconText:"text-emerald-600 dark:text-emerald-400",
    colorBtn:     "bg-emerald-500 hover:bg-emerald-600",
    labelBtn:     "Finalizar ahora",
  },
};

export function ModalAccionAudiencia({ accion, nombreAudiencia, onConfirmar, onCancelar }: Props) {
  const cfg = CONFIG[accion];
  const [motivo, setMotivo]   = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState("");

  const handleConfirmar = async () => {
    if (cfg.pideMotivoSuspension && !motivo.trim()) {
      setErr("El motivo de suspensión es obligatorio.");
      return;
    }
    setLoading(true);
    setErr("");
    try {
      await onConfirmar(motivo.trim() || undefined);
    } catch (e: any) {
      setErr(e.message ?? "Error al procesar la acción.");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={!loading ? onCancelar : undefined}
    >
      <div
        className={`w-full max-w-md rounded-2xl border-2 shadow-2xl ${cfg.colorBg} ${cfg.colorBorder} overflow-hidden`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.colorIconBg}`}>
              <span className={cfg.colorIconText}>{cfg.icono}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-white leading-tight">
                {cfg.titulo}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                {nombreAudiencia}
              </p>
            </div>
          </div>
          {!loading && (
            <button
              onClick={onCancelar}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/60 dark:hover:bg-slate-700 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 pb-2 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {cfg.descripcion}
          </p>

          {cfg.pideMotivoSuspension && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Motivo de suspensión <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Ej: El denunciado no se presentó. Se reprogramará para la próxima semana..."
                value={motivo}
                onChange={e => { setMotivo(e.target.value); setErr(""); }}
                disabled={loading}
                autoFocus
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all resize-none placeholder:text-gray-400"
              />
            </div>
          )}

          {err && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{err}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 py-5">
          <button
            onClick={onCancelar}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-white/60 dark:hover:bg-slate-700 transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={loading || (cfg.pideMotivoSuspension && !motivo.trim())}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${cfg.colorBtn}`}
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</>
              : <><span className={cfg.colorIconText.replace("text-", "text-white ")}>{cfg.icono}</span>{cfg.labelBtn}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
