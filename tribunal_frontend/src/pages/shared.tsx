// ─── src/pages/dashboard/shared.tsx ─────────────────────────────────────────
// Tipos, helpers y estilos compartidos del módulo Dashboard

// ════════════════════════════════════════════════════════
// ESTILOS ACCESOS RÁPIDOS
// Clases completas hardcodeadas para que Tailwind las incluya en el bundle.
// NUNCA uses interpolación dinámica como `bg-${color}-50`.
// ════════════════════════════════════════════════════════

export const ACCESOS_RAPIDOS_STYLES: Record<string, {
  bg: string;
  border: string;
  iconBg: string;
  iconColor: string;
  textColor: string;
}> = {
  blue: {
    bg:        "bg-blue-50 dark:bg-blue-900/10",
    border:    "border-blue-100 dark:border-blue-900/30",
    iconBg:    "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    textColor: "text-blue-700 dark:text-blue-400",
  },
  indigo: {
    bg:        "bg-indigo-50 dark:bg-indigo-900/10",
    border:    "border-indigo-100 dark:border-indigo-900/30",
    iconBg:    "bg-indigo-100 dark:bg-indigo-900/30",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    textColor: "text-indigo-700 dark:text-indigo-400",
  },
  amber: {
    bg:        "bg-amber-50 dark:bg-amber-900/10",
    border:    "border-amber-100 dark:border-amber-900/30",
    iconBg:    "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    textColor: "text-amber-700 dark:text-amber-400",
  },
  emerald: {
    bg:        "bg-emerald-50 dark:bg-emerald-900/10",
    border:    "border-emerald-100 dark:border-emerald-900/30",
    iconBg:    "bg-emerald-100 dark:bg-emerald-900/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    textColor: "text-emerald-700 dark:text-emerald-400",
  },
  purple: {
    bg:        "bg-purple-50 dark:bg-purple-900/10",
    border:    "border-purple-100 dark:border-purple-900/30",
    iconBg:    "bg-purple-100 dark:bg-purple-900/30",
    iconColor: "text-purple-600 dark:text-purple-400",
    textColor: "text-purple-700 dark:text-purple-400",
  },
  rose: {
    bg:        "bg-rose-50 dark:bg-rose-900/10",
    border:    "border-rose-100 dark:border-rose-900/30",
    iconBg:    "bg-rose-100 dark:bg-rose-900/30",
    iconColor: "text-rose-600 dark:text-rose-400",
    textColor: "text-rose-700 dark:text-rose-400",
  },
};
