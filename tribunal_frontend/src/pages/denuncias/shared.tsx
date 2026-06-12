// src/shared/ui.tsx
// Componentes genéricos de UI para el sistema Tribunal
// Estilo: cards oscuras, accent ámbar, diseño tipo dashboard moderno

import React, { useState, useRef, useEffect, ReactNode } from "react";
import {
  Loader2, ChevronLeft, ChevronRight, Search, X, Plus,
  User, FolderOpen, Check, Eye, Edit, Trash2, RefreshCw,
  AlertTriangle,
} from "lucide-react";

// ════════════════════════════════════════════════════════
// TIPOS GENÉRICOS
// ════════════════════════════════════════════════════════

export type BadgeColor =
  | "gray" | "amber" | "blue" | "indigo" | "purple"
  | "teal" | "green" | "red" | "slate" | "emerald"
  | "orange" | "violet";

// ════════════════════════════════════════════════════════
// TOKENS DE COLOR (Tailwind classes)
// ════════════════════════════════════════════════════════

const BADGE_CLASSES: Record<BadgeColor, string> = {
  gray:    "bg-gray-100    text-gray-700    dark:bg-gray-700/50    dark:text-gray-300",
  amber:   "bg-amber-100   text-amber-800   dark:bg-amber-900/40   dark:text-amber-300",
  blue:    "bg-blue-100    text-blue-800    dark:bg-blue-900/40    dark:text-blue-300",
  indigo:  "bg-indigo-100  text-indigo-800  dark:bg-indigo-900/40  dark:text-indigo-300",
  purple:  "bg-purple-100  text-purple-800  dark:bg-purple-900/40  dark:text-purple-300",
  teal:    "bg-teal-100    text-teal-800    dark:bg-teal-900/40    dark:text-teal-300",
  green:   "bg-green-100   text-green-800   dark:bg-green-900/40   dark:text-green-300",
  red:     "bg-red-100     text-red-800     dark:bg-red-900/40     dark:text-red-300",
  slate:   "bg-slate-100   text-slate-700   dark:bg-slate-700/50   dark:text-slate-300",
  emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  orange:  "bg-orange-100  text-orange-800  dark:bg-orange-900/40  dark:text-orange-300",
  violet:  "bg-violet-100  text-violet-800  dark:bg-violet-900/40  dark:text-violet-300",
};

// ════════════════════════════════════════════════════════
// AVATAR — iniciales con color automático
// ════════════════════════════════════════════════════════

const AVATAR_PALETTES = [
  "bg-amber-100  text-amber-700  dark:bg-amber-900/40  dark:text-amber-300",
  "bg-blue-100   text-blue-700   dark:bg-blue-900/40   dark:text-blue-300",
  "bg-teal-100   text-teal-700   dark:bg-teal-900/40   dark:text-teal-300",
  "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  "bg-rose-100   text-rose-700   dark:bg-rose-900/40   dark:text-rose-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function avatarPalette(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-12 h-12 text-base" : "w-10 h-10 text-sm";
  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center font-medium shrink-0 ${avatarPalette(name)}`}>
      {getInitials(name)}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// PILL / BADGE
// ════════════════════════════════════════════════════════

export function Pill({ color = "gray", children }: { color?: BadgeColor; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${BADGE_CLASSES[color]}`}>
      {children}
    </span>
  );
}

// ════════════════════════════════════════════════════════
// USER CELL — para tabla o card
// ════════════════════════════════════════════════════════

export function UserCell({ nombre }: { nombre: string }) {
  return (
    <div className="flex items-center gap-2">
      <Avatar name={nombre} size="sm" />
      <span className="text-sm text-gray-800 dark:text-slate-200 font-medium">{nombre}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// PAGE HEADER
// ════════════════════════════════════════════════════════

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// STAT CARD
// ════════════════════════════════════════════════════════

export function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: "amber" | "green" | "blue" | "red";
}) {
  const accentClass =
    accent === "amber" ? "text-amber-600 dark:text-amber-400" :
    accent === "green" ? "text-emerald-600 dark:text-emerald-400" :
    accent === "blue"  ? "text-blue-600 dark:text-blue-400" :
    accent === "red"   ? "text-red-600 dark:text-red-400" :
    "text-gray-900 dark:text-white";

  return (
    <div className="bg-white dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${accentClass}`}>{value}</p>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// SEARCH BAR
// ════════════════════════════════════════════════════════

export function SearchBar({
  value,
  onChange,
  placeholder = "Buscar...",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 w-full max-w-xs">
      <Search className="w-4 h-4 text-gray-400 shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent text-sm text-gray-800 dark:text-slate-200 placeholder:text-gray-400 outline-none flex-1 min-w-0"
      />
      {value && (
        <button onClick={() => onChange("")} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// FILTER TABS — con contadores, estilo pill activo ámbar
// ════════════════════════════════════════════════════════

export interface FilterTab {
  id: string;
  label: string;
  count?: number;
}

export function FilterTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: FilterTab[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            active === tab.id
              ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-slate-600"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
              active === tab.id
                ? "bg-amber-500 text-white"
                : "bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-300"
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// TOOLBAR — tabs + search en una fila
// ════════════════════════════════════════════════════════

export function Toolbar({
  tabs,
  activeTab,
  onTabChange,
  search,
  onSearchChange,
  searchPlaceholder,
  actions,
}: {
  tabs?: FilterTab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  search?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-3 flex-wrap">
        {tabs && activeTab !== undefined && onTabChange && (
          <FilterTabs tabs={tabs} active={activeTab} onChange={onTabChange} />
        )}
        {onSearchChange && search !== undefined && (
          <SearchBar value={search} onChange={onSearchChange} placeholder={searchPlaceholder} />
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// CARD GRID — reemplaza a <Tabla>
// ════════════════════════════════════════════════════════

export function CardGrid({
  children,
  loading,
  emptyMsg = "No hay registros",
  isEmpty,
}: {
  children: ReactNode;
  loading?: boolean;
  emptyMsg?: string;
  isEmpty?: boolean;
}) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
      </div>
    );
  }
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
        <FolderOpen className="w-10 h-10 mb-3 opacity-40" />
        <p className="text-sm">{emptyMsg}</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {children}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// RECORD CARD — card individual estilo "manage workers"
// ════════════════════════════════════════════════════════

export interface RecordCardProps {
  avatarSeed: string;
  title: string;
  subtitle?: string;
  badges?: ReactNode;
  rows?: { icon: ReactNode; text: string }[];
  date?: string;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
  children?: ReactNode;
}

export function RecordCard({
  avatarSeed,
  title,
  subtitle,
  badges,
  rows,
  date,
  onView,
  onEdit,
  onDelete,
  disabled,
  children,
}: RecordCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col gap-3 hover:border-amber-300 dark:hover:border-amber-700 transition-colors group">
      {/* Top row: avatar + actions */}
      <div className="flex items-start justify-between gap-2">
        <Avatar name={avatarSeed} size="md" />
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onView && (
            <button
              onClick={onView}
              disabled={disabled}
              className="w-7 h-7 rounded-lg border border-gray-200 dark:border-slate-600 bg-transparent flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              title="Ver detalle"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              disabled={disabled}
              className="w-7 h-7 rounded-lg border border-gray-200 dark:border-slate-600 bg-transparent flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              title="Editar"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              disabled={disabled}
              className="w-7 h-7 rounded-lg border border-gray-200 dark:border-slate-600 bg-transparent flex items-center justify-center text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Título + subtítulo */}
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-white font-mono leading-snug">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{subtitle}</p>}
      </div>

      {/* Badges */}
      {badges && <div className="flex flex-wrap gap-1.5">{badges}</div>}

      {/* Rows de info */}
      {rows && rows.length > 0 && (
        <div className="border-t border-gray-100 dark:border-slate-700 pt-2 space-y-1.5">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="text-gray-400 dark:text-gray-500 shrink-0">{row.icon}</span>
              <span className="truncate">{row.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Slot libre */}
      {children}

      {/* Footer con fecha y link */}
      {(date || onView) && (
        <div className="flex items-center justify-between mt-auto pt-1">
          {date && (
            <span className="text-xs text-gray-400 dark:text-gray-500">{date}</span>
          )}
          {onView && (
            <button
              onClick={onView}
              className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 font-medium flex items-center gap-1 transition-colors ml-auto"
            >
              Ver <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// ACTION BTNS — para usar dentro de tabla si se necesita
// ════════════════════════════════════════════════════════

export function ActionBtns({
  onView,
  onEdit,
  onStatus,
  onDelete,
  disabled,
}: {
  onView?: () => void;
  onEdit?: () => void;
  onStatus?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {onView && (
        <button onClick={onView} disabled={disabled}
          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
          <Eye className="w-4 h-4" />
        </button>
      )}
      {onEdit && (
        <button onClick={onEdit} disabled={disabled}
          className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
          <Edit className="w-4 h-4" />
        </button>
      )}
      {onStatus && (
        <button onClick={onStatus} disabled={disabled}
          className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} disabled={disabled}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// TABLA — se mantiene para módulos que la necesiten
// ════════════════════════════════════════════════════════

export function Tabla({
  headers,
  children,
  loading,
  emptyMsg = "No se encontraron registros",
}: {
  headers: string[];
  children: ReactNode;
  loading?: boolean;
  emptyMsg?: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {loading ? (
              <tr>
                <td colSpan={headers.length} className="px-4 py-10 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// PAGINACION
// ════════════════════════════════════════════════════════

export function Paginacion({
  currentPage,
  totalPages,
  startIndex,
  total,
  itemsPerPage,
  onPrev,
  onNext,
}: {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  total: number;
  itemsPerPage: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;
  const end = Math.min(startIndex + itemsPerPage, total);
  return (
    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
      <span>Mostrando {startIndex + 1}–{end} de {total} registros</span>
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-3 py-1 rounded-lg bg-amber-500 text-white text-xs font-semibold">
          {currentPage}
        </span>
        <span className="px-2 text-xs">de {totalPages}</span>
        <button
          onClick={onNext}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// MODAL
// ════════════════════════════════════════════════════════

export function Modal({
  title,
  onClose,
  children,
  size = "md",
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const maxW = size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-2xl" : "max-w-lg";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className={`w-full ${maxW} bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto max-h-[75vh]">{children}</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// MODAL FOOTER
// ════════════════════════════════════════════════════════

export function ModalFooter({
  onCancel,
  onSave,
  saveLabel = "Guardar",
  cancelLabel = "Cancelar",
  saving,
  saveVariant = "amber",
}: {
  onCancel: () => void;
  onSave: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  saving?: boolean;
  saveVariant?: "amber" | "blue" | "green" | "red";
}) {
  const variantClass =
    saveVariant === "blue"  ? "bg-blue-500 hover:bg-blue-600" :
    saveVariant === "green" ? "bg-emerald-500 hover:bg-emerald-600" :
    saveVariant === "red"   ? "bg-red-500 hover:bg-red-600" :
    "bg-amber-500 hover:bg-amber-600";

  return (
    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800 mt-2">
      <button
        onClick={onCancel}
        disabled={saving}
        className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
      >
        {cancelLabel}
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className={`px-5 py-2 rounded-xl text-white text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 ${variantClass}`}
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {saveLabel}
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// BTN PRIMARY — botón de acción principal ámbar
// ════════════════════════════════════════════════════════

export function BtnPrimary({
  onClick,
  disabled,
  icon,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
    >
      {icon}
      {children}
    </button>
  );
}

// ════════════════════════════════════════════════════════
// CAMPOS DE FORMULARIO
// ════════════════════════════════════════════════════════

const inputBase =
  "w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-gray-800 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all disabled:opacity-50";

export function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
        {label}{required && <span className="text-amber-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={inputBase}
      />
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
        {label}{required && <span className="text-amber-500 ml-0.5">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={inputBase + " resize-none"}
      />
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  required,
  disabled,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
        {label}{required && <span className="text-amber-500 ml-0.5">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={inputBase + " cursor-pointer"}
      >
        {children}
      </select>
    </div>
  );
}

export function CheckboxField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <div
        onClick={() => !disabled && onChange(!value)}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
          value
            ? "bg-amber-500 border-amber-500"
            : "border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        {value && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </div>
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    </label>
  );
}

// ════════════════════════════════════════════════════════
// PERSONA SELECTOR — campo con chip seleccionado
// ════════════════════════════════════════════════════════

export function PersonaSelector({
  label,
  value,
  onClear,
  onSearch,
  onNew,
  required,
  disabled,
}: {
  label: string;
  value: string;
  onClear: () => void;
  onSearch: () => void;
  onNew?: () => void;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
        {label}{required && <span className="text-amber-500 ml-0.5">*</span>}
      </label>
      {value ? (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <User className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-sm text-amber-800 dark:text-amber-300 flex-1 truncate">{value}</span>
          <button onClick={onClear} disabled={disabled} className="text-amber-500 hover:text-amber-700 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={onSearch}
            disabled={disabled}
            className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-slate-600 text-sm text-gray-400 dark:text-gray-500 hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            <Search className="w-4 h-4" /> Buscar {label.toLowerCase()}
          </button>
          {onNew && (
            <button
              onClick={onNew}
              disabled={disabled}
              className="px-3 py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-slate-600 text-gray-400 hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              title="Crear nuevo"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// EXPEDIENTE SELECTOR
// ════════════════════════════════════════════════════════

export function SimpleSelector({
  label,
  value,
  onClear,
  onSearch,
  icon,
  disabled,
}: {
  label: string;
  value: string;
  onClear: () => void;
  onSearch: () => void;
  icon?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{label}</label>
      {value ? (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          {icon ?? <FolderOpen className="w-4 h-4 text-blue-500 shrink-0" />}
          <span className="text-sm text-blue-800 dark:text-blue-300 flex-1 font-mono truncate">{value}</span>
          <button onClick={onClear} disabled={disabled} className="text-blue-400 hover:text-blue-600 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={onSearch}
          disabled={disabled}
          className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-slate-600 text-sm text-gray-400 dark:text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
        >
          <Search className="w-4 h-4" /> Vincular expediente
        </button>
      )}
    </div>
  );
}

export function ExpedienteSelector({
  value,
  onClear,
  onSearch,
  disabled,
}: {
  value: string;
  onClear: () => void;
  onSearch: () => void;
  disabled?: boolean;
}) {
  return (
    <SimpleSelector
      label="Expediente relacionado (opcional)"
      value={value}
      onClear={onClear}
      onSearch={onSearch}
      disabled={disabled}
      icon={<FolderOpen className="w-4 h-4 text-blue-500 shrink-0" />}
    />
  );
}

// ════════════════════════════════════════════════════════
// BUSCADOR MODAL — genérico para personas, expedientes, etc.
// ════════════════════════════════════════════════════════

export interface BuscadorItem {
  id: number;
  title: string;
  subtitle?: string;
  avatarSeed?: string;
}

export function BuscadorModal({
  title,
  items,
  loading,
  searchPlaceholder = "Buscar...",
  onSelect,
  onClose,
}: {
  title: string;
  items: BuscadorItem[];
  loading?: boolean;
  searchPlaceholder?: string;
  onSelect: (id: number, nombre: string) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = items.filter((it) =>
    it.title.toLowerCase().includes(q.toLowerCase()) ||
    (it.subtitle?.toLowerCase().includes(q.toLowerCase()) ?? false)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={searchPlaceholder}
              className="bg-transparent text-sm text-gray-800 dark:text-slate-200 outline-none flex-1"
            />
          </div>
        </div>

        {/* Lista */}
        <div className="overflow-y-auto max-h-72 px-2 pb-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">Sin resultados</p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => { onSelect(item.id, item.title); onClose(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors text-left group"
              >
                {item.avatarSeed ? (
                  <Avatar name={item.avatarSeed} size="sm" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                    <FolderOpen className="w-4 h-4 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </p>
                  {item.subtitle && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{item.subtitle}</p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-amber-500 transition-colors shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// EMPTY STATE
// ════════════════════════════════════════════════════════

export function EmptyState({
  icon,
  message,
  action,
}: {
  icon?: ReactNode;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      {icon && <div className="text-gray-300 dark:text-gray-600">{icon}</div>}
      <p className="text-sm text-gray-400 dark:text-gray-500">{message}</p>
      {action}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// LOADING SPINNER
// ════════════════════════════════════════════════════════

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const s = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-10 h-10" : "w-6 h-6";
  return (
    <div className="flex justify-center items-center py-8">
      <Loader2 className={`${s} animate-spin text-amber-500`} />
    </div>
  );
}

// ════════════════════════════════════════════════════════
// ALERT / WARNING BANNER
// ════════════════════════════════════════════════════════

export function AlertBanner({
  type = "warning",
  message,
  onDismiss,
}: {
  type?: "warning" | "error" | "info" | "success";
  message: string;
  onDismiss?: () => void;
}) {
  const colors = {
    warning: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300",
    error:   "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300",
    info:    "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300",
    success: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300",
  };
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${colors[type]}`}>
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="opacity-60 hover:opacity-100 transition-opacity">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}