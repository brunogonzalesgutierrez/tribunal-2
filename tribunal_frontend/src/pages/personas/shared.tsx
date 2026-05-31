// ─── shared.tsx ─────────────────────────────────────────
// Componentes, tipos y utilidades compartidas del módulo Personas

import { X, Edit, Trash2, Users, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";

// ════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════

export interface Persona {
  idPersona: number;
  numeroDocumento: string;
  nombre: string;
  primerApellido: string;
  segundoApellido?: string;
  estamento?: string;
  registroUniversitario?: string;
  esAbogado: boolean;
  titularA?: string;
}

export interface Contacto {
  idContacto: number;
  tipoContacto: string;
  valor: string;
  esPrincipal: boolean;
  validado: boolean;
  idPersona: Persona;
}

export interface RolProcesal {
  idRol: number;
  nombreRol: string;
}

export interface Expediente {
  idExpediente: number;
  numeroExpediente: string;
  ano: number;
  idEstadoExpediente?: { nombreEstado: string };
}

export interface ParteProcesal {
  idParte: number;
  fechaInclusion: string;
  fechaExclusion?: string;
  activo: boolean;
  idExpediente: Expediente;
  idPersona: Persona;
  idRol: RolProcesal;
}

// ════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════

export const fmtFecha = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("es-BO", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "—";

export const nombreCompleto = (p: Persona) =>
  `${p.nombre} ${p.primerApellido}${p.segundoApellido ? ` ${p.segundoApellido}` : ""}`;

// ════════════════════════════════════════════════════════
// BADGES
// ════════════════════════════════════════════════════════

export const AbogadoBadge = () => (
  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
    Abogado
  </span>
);

export const RolBadge = ({ rol }: { rol: string }) => (
  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
    {rol}
  </span>
);

export const EstadoBadge = ({ activo }: { activo: boolean }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
    activo
      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
  }`}>
    {activo ? "Activo" : "Inactivo"}
  </span>
);

export const PrincipalBadge = () => (
  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
    Principal
  </span>
);

const TIPO_CONTACTO_STYLES: Record<string, string> = {
  EMAIL:     "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  TELEFONO:  "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  CELULAR:   "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  DOMICILIO: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
};

export const TipoContactoBadge = ({ tipo }: { tipo: string }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
    TIPO_CONTACTO_STYLES[tipo] ?? "bg-gray-100 dark:bg-slate-700 text-gray-600"
  }`}>
    {tipo}
  </span>
);

export const ValidadoBadge = ({ validado, onClick, disabled = false }: { validado: boolean; onClick: () => void; disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
      validado
        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50"
        : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
  >
    {validado ? "Validado" : "Sin validar"}
  </button>
);

// ════════════════════════════════════════════════════════
// MODAL
// ════════════════════════════════════════════════════════

export function Modal({
  children, onClose, title, icon,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            {icon}
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// CAMPOS DE FORMULARIO
// ════════════════════════════════════════════════════════

export const Field = ({
  label, value, onChange, type = "text", placeholder = "", required = false, disabled = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; disabled?: boolean;
}) => (
  <div className="mb-4">
    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
    />
  </div>
);

export const SelectField = ({
  label, value, onChange, children, required = false, disabled = false,
}: {
  label: string; value: string | number; onChange: (v: string) => void;
  children: React.ReactNode; required?: boolean; disabled?: boolean;
}) => (
  <div className="mb-4">
    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      value={value} onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </select>
  </div>
);

export const CheckboxField = ({
  label, value, onChange, disabled = false,
}: {
  label: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) => (
  <div className="mb-4">
    <label className={`flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 ${!disabled ? "cursor-pointer" : ""}`}>
      <input
        type="checkbox" checked={value}
        onChange={e => onChange(e.target.checked)}
        disabled={disabled}
        className="rounded disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {label}
    </label>
  </div>
);

export const ErrorBox = ({ msg }: { msg: string }) =>
  msg ? (
    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 mb-4 text-sm text-red-600 dark:text-red-400">
      <AlertCircle className="w-4 h-4 shrink-0" />
      {msg}
    </div>
  ) : null;

export const ModalFooter = ({
  onCancel, onSave, saveLabel, saving = false,
}: {
  onCancel: () => void; onSave: () => void; saveLabel: string; saving?: boolean;
}) => (
  <div className="flex gap-3 justify-end pt-4">
    <button
      onClick={onCancel}
      disabled={saving}
      className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Cancelar
    </button>
    <button
      onClick={onSave}
      disabled={saving}
      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {saving ? "Guardando..." : saveLabel}
    </button>
  </div>
);

// ════════════════════════════════════════════════════════
// STAT CARD
// ════════════════════════════════════════════════════════

export function StatCard({
  label, value, icon, color, sub,
}: {
  label: string; value: number | string;
  icon: React.ReactNode; color: string; sub?: string;
}) {
  const bgMap: Record<string, string> = {
    blue:    "bg-blue-100 dark:bg-blue-900/30",
    emerald: "bg-emerald-100 dark:bg-emerald-900/30",
    amber:   "bg-amber-100 dark:bg-amber-900/30",
    purple:  "bg-purple-100 dark:bg-purple-900/30",
    red:     "bg-red-100 dark:bg-red-900/30",
  };
  const key = Object.keys(bgMap).find(k => color.includes(k)) ?? "blue";

  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-lg hover:shadow-xl transition-all duration-300 group">
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
}

// ════════════════════════════════════════════════════════
// TABLA DESKTOP
// ════════════════════════════════════════════════════════

export function TablaDesktop({
  headers, children, loading, emptyMsg, emptyIcon,
}: {
  headers: string[]; children: React.ReactNode;
  loading: boolean; emptyMsg: string; emptyIcon?: React.ReactNode;
}) {
  return (
    <div className="hidden lg:block bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700">
            <tr>
              {headers.map(h => (
                <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i}>
                  {[...Array(headers.length)].map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse w-24" />
                    </td>
                  ))}
                </tr>
              ))
            ) : !children || (Array.isArray(children) && children.length === 0) ? (
              <tr>
                <td colSpan={headers.length} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    {emptyIcon ?? <Users className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
                    <p>{emptyMsg}</p>
                  </div>
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
// ACTION BUTTONS
// ════════════════════════════════════════════════════════

export const ActionBtns = ({ onEdit, onDelete, disabled = false }: { onEdit: () => void; onDelete: () => void; disabled?: boolean }) => (
  <div className="flex items-center justify-end gap-1">
    <button
      onClick={onEdit}
      disabled={disabled}
      className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      title="Editar"
    >
      <Edit className="w-4 h-4" />
    </button>
    <button
      onClick={onDelete}
      disabled={disabled}
      className="p-2 rounded-lg text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      title="Eliminar"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
);

// ════════════════════════════════════════════════════════
// SEARCH BAR
// ════════════════════════════════════════════════════════

export const SearchBar = ({
  value, onChange, placeholder,
}: {
  value: string; onChange: (v: string) => void; placeholder: string;
}) => (
  <input
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    className="pl-4 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none w-72"
  />
);

// ════════════════════════════════════════════════════════
// PAGINACIÓN
// ════════════════════════════════════════════════════════

export function Paginacion({
  currentPage, totalPages, startIndex, total, itemsPerPage, onPrev, onNext,
}: {
  currentPage: number; totalPages: number; startIndex: number;
  total: number; itemsPerPage: number; onPrev: () => void; onNext: () => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Mostrando {startIndex + 1}–{Math.min(startIndex + itemsPerPage, total)} de {total}
      </p>
      <div className="flex gap-1">
        <button
          onClick={onPrev} disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
          Página {currentPage} de {totalPages}
        </span>
        <button
          onClick={onNext} disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}