// src/pages/denuncias/components/DenunciaEtapas.tsx
import { useState } from "react";
import {
  Loader2, CheckCircle, AlertCircle, XCircle, MessageSquare,
  ClipboardList, Scale, Gavel, Send, FileCheck,
  Clock, AlertTriangle, FileText, Plus, X, Handshake
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface Denuncia {
  idDenuncia: number;
  numeroDenuncia: string;
  descripcion: string;
  estado: string;
  denunciante?: { nombre: string; primerApellido: string; numeroDocumento: string };
  denunciado?: { nombre: string; primerApellido: string; numeroDocumento: string };
  tipoDenunciado?: string;
  resolucion?: string;
  fechaResolucion?: string;
  tipoResolucion?: string;
  tipoSancion?: string;
  detalleSancion?: string;
  fechaHecho?: string;
  motivoRetiro?: string;
  fechaRetiro?: string;
  actaConciliacion?: string;
  fechaConciliacion?: string;
  fechaApelacion?: string;
  resolucionApelacion?: string;
  fechaRemisionSuperior?: string;
  fechaSolicitudAclaracion?: string;
  aclaracionEnmienda?: string;
  fechaDesistimiento?: string;
  motivoDesistimiento?: string;
  fechaFallecimientoDenunciado?: string;
  medidasPrecautorias?: string;
  fechaMedidasPrecautorias?: string;
  fechaCompulsa?: string;
  resolucionCompulsa?: string;
  fechaNotificacionResolucion?: string;
  expediente?: { idExpediente: number; numeroExpediente: string };
}

const TIPOS_SANCION_OPTIONS = [
  { value: "MULTA",                label: "Multa hasta 20% haber mensual" },
  { value: "SUSPENSION_TEMPORAL",  label: "Suspensión temporal (1 mes - 1 año)" },
  { value: "REMOCION",             label: "Remoción del cargo" },
  { value: "RETIRO",               label: "Retiro de la Universidad" },
  { value: "AMONESTACION",         label: "Amonestación por escrito" },
  { value: "SUSPENSION_ESTUDIANTE",label: "Suspensión temporal (6 meses - 3 años)" },
  { value: "EXPULSION",            label: "Expulsión de la Universidad" },
];

// ─────────────────────────────────────────────────────────────
// 1. ETAPA ADMISIÓN
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// 1. ETAPA ADMISIÓN — con modal para número de expediente y sala
// ─────────────────────────────────────────────────────────────
interface EtapaAdmisionProps {
  denuncia: Denuncia;
  onAvanzar: (nuevoEstado: string) => void;
  onRechazar: () => void;
  onSolicitarSubsanacion: () => void;
  onRetirar: () => void;
  onAdmitir: (datos: { idSala: number }) => void;
  salas: { idSala: number; nombreSala: string }[];
  saving: boolean;
}

export function EtapaAdmision({
  onRechazar, onSolicitarSubsanacion, onAdmitir, salas, saving
}: EtapaAdmisionProps) {
  const [confirmando, setConfirmando] = useState(false);
  const [idSala, setIdSala] = useState(0);

  if (!confirmando) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-6">
        <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Auto de Admisión (Art. 58)
        </h3>
        <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            El Tribunal debe emitir auto de admisión en el término de{" "}
            <span className="font-bold text-blue-600">5 días hábiles</span>.
            Al admitir se creará automáticamente el expediente judicial con número
            correlativo y se vincularán las partes procesales.
          </p>
          <p className="text-xs text-gray-400 mt-1">Art. 58 del Reglamento de Justicia Universitaria</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setConfirmando(true)} disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Admitir Denuncia
          </button>
          <button onClick={onSolicitarSubsanacion} disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Solicitar Subsanación (Art. 56)
          </button>
          <button onClick={onRechazar} disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors flex items-center gap-2">
            <XCircle className="w-4 h-4" /> Rechazar Denuncia (Art. 57)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-6">
      <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400 mb-4 flex items-center gap-2">
        <CheckCircle className="w-5 h-5" />
        Confirmar Auto de Admisión (Art. 58)
      </h3>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 mb-4">
        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
          ⚠ Esta acción creará un expediente judicial. El número se generará automáticamente.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sala del Tribunal <span className="text-red-500">*</span>
          </label>
          <select
            value={idSala}
            onChange={e => setIdSala(Number(e.target.value))}
            disabled={saving}
            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value={0}>— Seleccionar sala —</option>
            {salas.map(s => (
              <option key={s.idSala} value={s.idSala}>{s.nombreSala}</option>
            ))}
          </select>
        </div>

        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300 space-y-1">
          <p className="font-semibold">Se creará automáticamente:</p>
          <p>✓ Número de expediente (EXP-S{idSala > 0 ? salas.find(s => s.idSala === idSala)?.nombreSala.replace(/\D/g,'') : '?'}-{new Date().getFullYear()}-XXX)</p>
          <p>✓ Expediente con estado "Auto de Admisión"</p>
          <p>✓ Historial de estado inicial (Art. 7)</p>
          <p>✓ Parte procesal: Denunciante</p>
          <p>✓ Parte procesal: Denunciado</p>
        </div>
      </div>

      <div className="flex gap-3 justify-end mt-4">
        <button onClick={() => setConfirmando(false)} disabled={saving}
          className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
          Cancelar
        </button>
        <button
          onClick={() => onAdmitir({ idSala })}
          disabled={saving || !idSala}
          className="px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors flex items-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Confirmar Auto de Admisión
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. ETAPA SUBSANACIÓN
// ─────────────────────────────────────────────────────────────
interface EtapaSubsanacionProps {
  denuncia: Denuncia;
  onSubsanar: (datos: { descripcion: string }) => void;
  onRechazar: () => void;
  saving: boolean;
}

export function EtapaSubsanacion({ denuncia, onSubsanar, onRechazar, saving }: EtapaSubsanacionProps) {
  const [nuevaDescripcion, setNuevaDescripcion] = useState(denuncia.descripcion);

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-6">
      <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-400 mb-4 flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        Etapa de Subsanación (Art. 56)
      </h3>
      <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          La denuncia presenta defectos. Tiene{" "}
          <span className="font-bold text-amber-600">3 días hábiles</span> para subsanar.
        </p>
        <p className="text-xs text-gray-400 mt-1">Plazo improrrogable según Art. 56 del Reglamento</p>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descripción corregida</label>
        <textarea value={nuevaDescripcion} onChange={(e) => setNuevaDescripcion(e.target.value)} rows={5}
          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none"
          placeholder="Corrija los defectos señalados..." disabled={saving} />
      </div>
      <div className="flex gap-3 justify-end">
        <button onClick={onRechazar} disabled={saving}
          className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
          Rechazar Denuncia
        </button>
        <button onClick={() => onSubsanar({ descripcion: nuevaDescripcion })} disabled={saving}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Subsanar y Admitir
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. ETAPA RETIRO DE DENUNCIA (Art. 22)
// ─────────────────────────────────────────────────────────────
interface EtapaRetiroProps {
  denuncia: Denuncia;
  onRetirar: (datos: { motivoRetiro: string; fechaRetiro: string }) => void;
  saving: boolean;
}

export function EtapaRetiro({ onRetirar, saving }: EtapaRetiroProps) {
  const [motivo, setMotivo] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [confirmando, setConfirmando] = useState(false);

  if (!confirmando) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-200 dark:border-yellow-800 p-6">
        <h3 className="text-lg font-semibold text-yellow-700 dark:text-yellow-400 mb-4 flex items-center gap-2">
          <XCircle className="w-5 h-5" />
          Retiro de Denuncia (Art. 22)
        </h3>
        <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Antes de la citación al denunciado, el denunciante puede retirar la denuncia.
            La misma se tendrá por <span className="font-bold text-yellow-600">no presentada</span>.
          </p>
          <p className="text-xs text-gray-400 mt-1">Art. 22 del Reglamento</p>
        </div>
        <div className="flex justify-end">
          <button onClick={() => setConfirmando(true)} disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white font-semibold transition-colors flex items-center gap-2">
            <XCircle className="w-4 h-4" /> Retirar Denuncia
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-200 dark:border-yellow-800 p-6">
      <h3 className="text-lg font-semibold text-yellow-700 dark:text-yellow-400 mb-4 flex items-center gap-2">
        <XCircle className="w-5 h-5" />
        Confirmar Retiro de Denuncia (Art. 22)
      </h3>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Fecha de retiro
        </label>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
          disabled={saving} />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Motivo del retiro
        </label>
        <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={4}
          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all outline-none"
          placeholder="Indique el motivo por el cual el denunciante retira la denuncia..."
          disabled={saving} />
      </div>
      <div className="flex gap-3 justify-end">
        <button onClick={() => setConfirmando(false)} disabled={saving}
          className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
          Cancelar
        </button>
        <button onClick={() => onRetirar({ motivoRetiro: motivo, fechaRetiro: fecha })}
          disabled={saving || !motivo.trim()}
          className="px-4 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white font-semibold transition-colors flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
          Confirmar Retiro
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. ETAPA CONCILIACIÓN (Art. 59)
// ─────────────────────────────────────────────────────────────
interface EtapaConciliacionProps {
  denuncia: Denuncia;
  onConciliar: (datos: { actaConciliacion: string; fechaConciliacion: string }) => void;
  saving: boolean;
}

export function EtapaConciliacion({ onConciliar, saving }: EtapaConciliacionProps) {
  const [acta, setActa] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [confirmando, setConfirmando] = useState(false);

  if (!confirmando) {
    return (
      <div className="bg-teal-50 dark:bg-teal-900/20 rounded-2xl border border-teal-200 dark:border-teal-800 p-6">
        <h3 className="text-lg font-semibold text-teal-700 dark:text-teal-400 mb-4 flex items-center gap-2">
          <Handshake className="w-5 h-5" />
          Conciliación (Art. 59)
        </h3>
        <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            La conciliación procede en denuncias recíprocas entre funcionarios, estudiantes y docentes,
            siempre que los hechos <span className="font-bold text-teal-600">no afecten el orden público</span>.
          </p>
          <p className="text-xs text-gray-400 mt-1">Art. 59 del Reglamento</p>
        </div>
        <div className="flex justify-end">
          <button onClick={() => setConfirmando(true)} disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold transition-colors flex items-center gap-2">
            <Handshake className="w-4 h-4" /> Registrar Conciliación
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-teal-50 dark:bg-teal-900/20 rounded-2xl border border-teal-200 dark:border-teal-800 p-6">
      <h3 className="text-lg font-semibold text-teal-700 dark:text-teal-400 mb-4 flex items-center gap-2">
        <Handshake className="w-5 h-5" />
        Registrar Acta de Conciliación (Art. 59)
      </h3>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Fecha de conciliación
        </label>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
          disabled={saving} />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Puntos acordados (Acta de Conciliación)
        </label>
        <textarea value={acta} onChange={(e) => setActa(e.target.value)} rows={6}
          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
          placeholder="Registre los puntos acordados entre las partes..."
          disabled={saving} />
      </div>
      <div className="flex gap-3 justify-end">
        <button onClick={() => setConfirmando(false)} disabled={saving}
          className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
          Cancelar
        </button>
        <button onClick={() => onConciliar({ actaConciliacion: acta, fechaConciliacion: fecha })}
          disabled={saving || !acta.trim()}
          className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold transition-colors flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Confirmar Conciliación
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. ETAPA DECLARACIÓN INFORMATIVA
// ─────────────────────────────────────────────────────────────
interface EtapaDeclaracionInformativaProps {
  denuncia: Denuncia;
  onRegistrarDeclaracion: (datos: { declaracion: string; fechaDeclaracion: string }) => void;
  saving: boolean;
}

export function EtapaDeclaracionInformativa({ onRegistrarDeclaracion, saving }: EtapaDeclaracionInformativaProps) {
  const [declaracion, setDeclaracion] = useState("");
  const [fechaDeclaracion, setFechaDeclaracion] = useState(new Date().toISOString().slice(0, 16));

  return (
    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-6">
      <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-400 mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        Declaración Informativa (Art. 58)
      </h3>
      <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          El denunciado tiene <span className="font-bold text-indigo-600">10 días hábiles</span> para presentar su defensa.
        </p>
        <p className="text-xs text-gray-400 mt-1">Art. 58 inc. a del Reglamento</p>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fecha de la declaración</label>
        <input type="datetime-local" value={fechaDeclaracion} onChange={(e) => setFechaDeclaracion(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
          disabled={saving} />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Declaración del denunciado</label>
        <textarea value={declaracion} onChange={(e) => setDeclaracion(e.target.value)} rows={6}
          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
          placeholder="Registre la declaración del denunciado..." disabled={saving} />
      </div>
      <div className="flex justify-end">
        <button onClick={() => onRegistrarDeclaracion({ declaracion, fechaDeclaracion })}
          disabled={saving || !declaracion.trim()}
          className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold transition-colors flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Registrar y continuar
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. ETAPA PRUEBAS
// ─────────────────────────────────────────────────────────────
interface EtapaPruebasProps {
  denuncia: Denuncia;
  onAbrirPruebas?: () => void;
  onCerrarPruebas?: () => void;
  saving: boolean;
}

export function EtapaPruebas({ denuncia, onAbrirPruebas, onCerrarPruebas, saving }: EtapaPruebasProps) {
  const [pruebas, setPruebas] = useState<{ nombre: string; descripcion: string }[]>([]);
  const [nuevaPrueba, setNuevaPrueba] = useState({ nombre: "", descripcion: "" });

  const agregarPrueba = () => {
    if (nuevaPrueba.nombre.trim()) {
      setPruebas([...pruebas, { ...nuevaPrueba }]);
      setNuevaPrueba({ nombre: "", descripcion: "" });
    }
  };

  const esEtapaPruebas = denuncia.estado === "PRUEBAS";

  return (
    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-200 dark:border-purple-800 p-6">
      <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-400 mb-4 flex items-center gap-2">
        <ClipboardList className="w-5 h-5" />
        Período Probatorio (Art. 60)
      </h3>
      <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Plazo de <span className="font-bold text-purple-600">30 días hábiles</span> para recepcionar pruebas de cargo y descargo.
        </p>
        <p className="text-xs text-gray-400 mt-1">Art. 60 del Reglamento</p>
      </div>

      {esEtapaPruebas && (
        <div className="space-y-4">
          <div className="border border-purple-200 dark:border-purple-800 rounded-xl p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Agregar prueba</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <input type="text" placeholder="Nombre de la prueba" value={nuevaPrueba.nombre}
                onChange={(e) => setNuevaPrueba({ ...nuevaPrueba, nombre: e.target.value })}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-purple-500"
                disabled={saving} />
              <input type="text" placeholder="Descripción / link" value={nuevaPrueba.descripcion}
                onChange={(e) => setNuevaPrueba({ ...nuevaPrueba, descripcion: e.target.value })}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-purple-500"
                disabled={saving} />
            </div>
            <button onClick={agregarPrueba} disabled={saving || !nuevaPrueba.nombre.trim()}
              className="px-3 py-1.5 rounded-lg bg-purple-500 text-white text-sm flex items-center gap-1 hover:bg-purple-600">
              <Plus className="w-3.5 h-3.5" /> Agregar prueba
            </button>
          </div>
          {pruebas.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Pruebas presentadas:</p>
              {pruebas.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                  <div>
                    <p className="text-sm font-medium">{p.nombre}</p>
                    {p.descripcion && <p className="text-xs text-gray-500">{p.descripcion}</p>}
                  </div>
                  <button onClick={() => setPruebas(pruebas.filter((_, idx) => idx !== i))}
                    className="p-1 text-red-500 hover:bg-red-50 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 mt-4">
        {onAbrirPruebas && (
          <button onClick={onAbrirPruebas} disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-semibold transition-colors flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
            Abrir Período Probatorio
          </button>
        )}
        {onCerrarPruebas && (
          <button onClick={onCerrarPruebas} disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Cerrar Pruebas y Concluir
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 7. ETAPA RESOLUCIÓN
// ─────────────────────────────────────────────────────────────
interface EtapaResolucionProps {
  denuncia: Denuncia;
  onEmitirResolucion: (
    resolucion: string,
    fecha: string,
    tipo: string,
    tipoSancion?: string,
    detalleSancion?: string
  ) => void;
  saving: boolean;
}

export function EtapaResolucion({ onEmitirResolucion, saving }: EtapaResolucionProps) {
  const [resolucion, setResolucion] = useState("");
  const [fechaResolucion, setFechaResolucion] = useState(new Date().toISOString().slice(0, 10));
  const [tipoResolucion, setTipoResolucion] = useState("SANCIONATORIA");
  const [tipoSancion, setTipoSancion] = useState("");
  const [detalleSancion, setDetalleSancion] = useState("");

  return (
    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-6">
      <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400 mb-4 flex items-center gap-2">
        <Scale className="w-5 h-5" />
        Resolución Final (Art. 75)
      </h3>
      <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Plazo de <span className="font-bold text-emerald-600">15 días hábiles</span> para dictar resolución final motivada.
        </p>
        <p className="text-xs text-gray-400 mt-1">Art. 75 del Reglamento</p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de resolución</label>
        <select value={tipoResolucion} onChange={(e) => { setTipoResolucion(e.target.value); setTipoSancion(""); }}
          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500"
          disabled={saving}>
          <option value="SANCIONATORIA">Sancionatoria</option>
          <option value="ABSOLUTORIA">Absolutoria</option>
        </select>
      </div>

      {/* Sanción específica — solo si es Sancionatoria */}
      {tipoResolucion === "SANCIONATORIA" && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de sanción (Art. 42)
            </label>
            <select value={tipoSancion} onChange={(e) => setTipoSancion(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500"
              disabled={saving}>
              <option value="">— Seleccione la sanción —</option>
              {TIPOS_SANCION_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Detalle de la sanción
            </label>
            <input type="text" value={detalleSancion} onChange={(e) => setDetalleSancion(e.target.value)}
              placeholder="Ej: Suspensión 3 meses sin goce de haberes, Multa equivalente al 15%..."
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              disabled={saving} />
          </div>
        </>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fecha de resolución</label>
        <input type="date" value={fechaResolucion} onChange={(e) => setFechaResolucion(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500"
          disabled={saving} />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Parte dispositiva / Resolución</label>
        <textarea value={resolucion} onChange={(e) => setResolucion(e.target.value)} rows={6}
          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
          placeholder="Describa la resolución motivada..." disabled={saving} />
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => onEmitirResolucion(resolucion, fechaResolucion, tipoResolucion, tipoSancion || undefined, detalleSancion || undefined)}
          disabled={saving || !resolucion.trim() || (tipoResolucion === "SANCIONATORIA" && !tipoSancion)}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors flex items-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gavel className="w-4 h-4" />}
          Emitir Resolución
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 8. ETAPA APELACIÓN
// ─────────────────────────────────────────────────────────────
interface EtapaApelacionProps {
  denuncia: Denuncia;
  onApelar?: (datos: { fechaApelacion: string }) => void;
  onEjecutar?: () => void;
  onRemitirSuperior?: (datos: { fechaRemisionSuperior: string }) => void;
  onResolverApelacion?: (datos: { resolucionApelacion: string }) => void;
  saving: boolean;
}

export function EtapaApelacion({ denuncia, onApelar, onEjecutar, onRemitirSuperior, onResolverApelacion, saving }: EtapaApelacionProps) {
  const [fechaApelacion, setFechaApelacion] = useState(new Date().toISOString().slice(0, 10));
  const [fechaRemision, setFechaRemision] = useState(new Date().toISOString().slice(0, 10));
  const [resolucionApelacion, setResolucionApelacion] = useState("");
  const esApelada = denuncia.estado === "APELADA";

  return (
    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-200 dark:border-orange-800 p-6">
      <h3 className="text-lg font-semibold text-orange-700 dark:text-orange-400 mb-4 flex items-center gap-2">
        <Send className="w-5 h-5" />
        Recurso de Apelación (Art. 82)
      </h3>

      <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Plazo perentorio de <span className="font-bold text-orange-600">5 días hábiles</span> para interponer apelación.
          Una vez admitida, se remite al Tribunal Superior en <span className="font-bold text-orange-600">3 días hábiles</span>.
        </p>
        <p className="text-xs text-gray-400 mt-1">Arts. 82 y 86 del Reglamento</p>
      </div>

      {/* Estado RESUELTA — decidir si apelar o ejecutar */}
      {!esApelada && onApelar && onEjecutar && (
        <div className="space-y-4">
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha de interposición de apelación
            </label>
            <input type="date" value={fechaApelacion} onChange={(e) => setFechaApelacion(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              disabled={saving} />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={onEjecutar} disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors flex items-center gap-2">
              <FileCheck className="w-4 h-4" /> Ejecutar fallo (sin apelación)
            </button>
            <button onClick={() => onApelar({ fechaApelacion })} disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Interponer Apelación
            </button>
          </div>
        </div>
      )}

      {/* Estado APELADA — registrar remisión y resolución del superior */}
      {esApelada && (
        <div className="space-y-4">
          {/* Remisión al Superior — solo si no se registró aún */}
          {!denuncia.fechaRemisionSuperior && onRemitirSuperior && (
            <div className="border border-orange-200 dark:border-orange-700 rounded-xl p-4">
              <p className="text-sm font-medium text-orange-700 dark:text-orange-400 mb-3">
                Paso 1 — Remitir expediente al Tribunal Superior (Art. 86)
              </p>
              <p className="text-xs text-gray-500 mb-3">Plazo: 3 días hábiles desde la admisión del recurso.</p>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de remisión
                </label>
                <input type="date" value={fechaRemision} onChange={(e) => setFechaRemision(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  disabled={saving} />
              </div>
              <button onClick={() => onRemitirSuperior({ fechaRemisionSuperior: fechaRemision })} disabled={saving}
                className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Registrar Remisión al Superior
              </button>
            </div>
          )}

          {/* Resolución del Superior */}
          {onResolverApelacion && (
            <div className="border border-orange-200 dark:border-orange-700 rounded-xl p-4">
              <p className="text-sm font-medium text-orange-700 dark:text-orange-400 mb-3">
                {denuncia.fechaRemisionSuperior ? "Paso 2 —" : ""} Resolución del Tribunal Superior (Art. 86)
              </p>
              <p className="text-xs text-gray-500 mb-3">
                  Registre aquí el fallo recibido del Tribunal Superior (Art. 86). El Superior tiene 15 días hábiles para resolver desde el decreto de radicatoria.
              </p>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Resolución de segunda instancia
                </label>
                <textarea value={resolucionApelacion} onChange={(e) => setResolucionApelacion(e.target.value)} rows={5}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                  placeholder="Confirma, revoca o anula la resolución de primera instancia..."
                  disabled={saving} />
              </div>
              <button
                onClick={() => onResolverApelacion({ resolucionApelacion })}
                disabled={saving || !resolucionApelacion.trim()}
                className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                Registrar Fallo Recibido y Ejecutar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 10. ACLARACIÓN / COMPLEMENTACIÓN / ENMIENDA (Art. 77)
// ─────────────────────────────────────────────────────────────
interface EtapaAclaracionProps {
  denuncia: Denuncia;
  onRegistrar: (datos: { aclaracionEnmienda: string; fechaSolicitudAclaracion: string }) => void;
  saving: boolean;
}

export function EtapaAclaracion({ denuncia, onRegistrar, saving }: EtapaAclaracionProps) {
  const [texto, setTexto] = useState(denuncia.aclaracionEnmienda || "");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [abierto, setAbierto] = useState(false);

  if (denuncia.aclaracionEnmienda) {
    return (
      <div className="bg-violet-50 dark:bg-violet-900/20 rounded-2xl border border-violet-200 dark:border-violet-800 p-5">
        <h3 className="text-sm font-semibold text-violet-700 dark:text-violet-400 mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Aclaración/Enmienda registrada (Art. 77)
        </h3>
        <p className="text-sm text-violet-700 dark:text-violet-300 leading-relaxed">{denuncia.aclaracionEnmienda}</p>
        {denuncia.fechaSolicitudAclaracion && (
          <p className="text-xs text-violet-500 mt-2">Fecha: {denuncia.fechaSolicitudAclaracion}</p>
        )}
      </div>
    );
  }

  if (!abierto) {
    return (
      <div className="bg-violet-50 dark:bg-violet-900/20 rounded-2xl border border-violet-200 dark:border-violet-800 p-5">
        <h3 className="text-sm font-semibold text-violet-700 dark:text-violet-400 mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Aclaración / Complementación / Enmienda (Art. 77)
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Las partes tienen <span className="font-semibold text-violet-600">2 días hábiles</span> desde la notificación para solicitar aclaración, complementación o enmienda. No puede alterar lo sustancial de la decisión (Art. 77 par. IV).
        </p>
        <button
          onClick={() => setAbierto(true)}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold transition-colors flex items-center gap-2"
        >
          <FileText className="w-4 h-4" /> Registrar aclaración
        </button>
      </div>
    );
  }

  return (
    <div className="bg-violet-50 dark:bg-violet-900/20 rounded-2xl border border-violet-200 dark:border-violet-800 p-5">
      <h3 className="text-sm font-semibold text-violet-700 dark:text-violet-400 mb-3 flex items-center gap-2">
        <FileText className="w-4 h-4" />
        Registrar Aclaración / Enmienda (Art. 77)
      </h3>
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Fecha de solicitud
        </label>
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          disabled={saving}
          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
        />
      </div>
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Texto de la aclaración / complementación / enmienda
        </label>
        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value)}
          rows={5}
          disabled={saving}
          placeholder="Describa la aclaración, complementación o enmienda a la resolución..."
          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
        />
      </div>
      <div className="flex gap-3 justify-end">
        <button
          onClick={() => setAbierto(false)}
          disabled={saving}
          className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm"
        >
          Cancelar
        </button>
        <button
          onClick={() => onRegistrar({ aclaracionEnmienda: texto, fechaSolicitudAclaracion: fecha })}
          disabled={saving || !texto.trim()}
          className="px-4 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-semibold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Registrar
        </button>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// 11. NOTIFICACIÓN PERSONAL DE RESOLUCIÓN (Art. 46)
// ─────────────────────────────────────────────────────────────
interface EtapaNotificacionResolucionProps {
  denuncia: Denuncia;
  onRegistrar: (datos: { fechaNotificacionResolucion: string }) => void;
  saving: boolean;
}

export function EtapaNotificacionResolucion({
  denuncia, onRegistrar, saving
}: EtapaNotificacionResolucionProps) {
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [abierto, setAbierto] = useState(false);

  if (denuncia.fechaNotificacionResolucion) {
    return (
      <div className="bg-sky-50 dark:bg-sky-900/20 rounded-2xl border border-sky-200 dark:border-sky-800 p-5">
        <h3 className="text-sm font-semibold text-sky-700 dark:text-sky-400 mb-1 flex items-center gap-2">
          <Send className="w-4 h-4" />
          Notificación personal registrada (Art. 46)
        </h3>
        <p className="text-xs text-sky-500">
          Notificado el: {denuncia.fechaNotificacionResolucion}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          El plazo de 5 días hábiles para apelar corre desde esta fecha (Art. 82).
        </p>
      </div>
    );
  }

  if (!abierto) {
    return (
      <div className="bg-sky-50 dark:bg-sky-900/20 rounded-2xl border border-sky-200 dark:border-sky-800 p-5">
        <h3 className="text-sm font-semibold text-sky-700 dark:text-sky-400 mb-2 flex items-center gap-2">
          <Send className="w-4 h-4" />
          Notificación personal de resolución (Art. 46)
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Registrá la fecha en que se notificó personalmente la resolución a las partes.
          Desde esta fecha corren los{" "}
          <span className="font-semibold text-sky-600">5 días hábiles</span> para interponer
          recurso de apelación (Art. 82).
        </p>
        <button
          onClick={() => setAbierto(true)}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold transition-colors flex items-center gap-2"
        >
          <Send className="w-4 h-4" /> Registrar notificación
        </button>
      </div>
    );
  }

  return (
    <div className="bg-sky-50 dark:bg-sky-900/20 rounded-2xl border border-sky-200 dark:border-sky-800 p-5">
      <h3 className="text-sm font-semibold text-sky-700 dark:text-sky-400 mb-3 flex items-center gap-2">
        <Send className="w-4 h-4" />
        Registrar notificación personal (Art. 46)
      </h3>
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Fecha de notificación personal
        </label>
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          disabled={saving}
          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
        />
      </div>
      <div className="flex gap-3 justify-end">
        <button
          onClick={() => setAbierto(false)}
          disabled={saving}
          className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm"
        >
          Cancelar
        </button>
        <button
          onClick={() => onRegistrar({ fechaNotificacionResolucion: fecha })}
          disabled={saving || !fecha}
          className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Registrar
        </button>
      </div>
    </div>
  );
}



// ─────────────────────────────────────────────────────────────
// 12. MEDIDAS PRECAUTORIAS (Art. 61)
// ─────────────────────────────────────────────────────────────
interface EtapaMedidasPrecautoriasProps {
  denuncia: Denuncia;
  onRegistrar: (datos: { medidasPrecautorias: string; fechaMedidasPrecautorias: string }) => void;
  saving: boolean;
}

export function EtapaMedidasPrecautorias({
  denuncia, onRegistrar, saving
}: EtapaMedidasPrecautoriasProps) {
  const [texto, setTexto] = useState(denuncia.medidasPrecautorias || "");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [abierto, setAbierto] = useState(false);

  if (denuncia.medidasPrecautorias) {
    return (
      <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-200 dark:border-rose-800 p-5">
        <h3 className="text-sm font-semibold text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Medidas precautorias vigentes (Art. 61)
        </h3>
        <p className="text-sm text-rose-700 dark:text-rose-300 leading-relaxed">
          {denuncia.medidasPrecautorias}
        </p>
        {denuncia.fechaMedidasPrecautorias && (
          <p className="text-xs text-rose-500 mt-2">
            Dispuestas el: {denuncia.fechaMedidasPrecautorias}
          </p>
        )}
        <button
          onClick={() => setAbierto(true)}
          disabled={saving}
          className="mt-3 px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400 text-xs font-medium hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
        >
          Actualizar medidas
        </button>

        {abierto && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Nueva fecha
              </label>
              <input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                disabled={saving}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Medidas actualizadas
              </label>
              <textarea
                value={texto}
                onChange={e => setTexto(e.target.value)}
                rows={4}
                disabled={saving}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setAbierto(false)}
                disabled={saving}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => { onRegistrar({ medidasPrecautorias: texto, fechaMedidasPrecautorias: fecha }); setAbierto(false); }}
                disabled={saving || !texto.trim()}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Actualizar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!abierto) {
    return (
      <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-200 dark:border-rose-800 p-5">
        <h3 className="text-sm font-semibold text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Medidas precautorias (Art. 61)
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          El Tribunal puede disponer medidas precautorias en cualquier etapa del proceso
          para evitar que el denunciado eluda la acción de la justicia o cause perjuicios
          irreparables (Art. 61).
        </p>
        <button
          onClick={() => setAbierto(true)}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold transition-colors flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4" /> Disponer medidas precautorias
        </button>
      </div>
    );
  }

  return (
    <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-200 dark:border-rose-800 p-5">
      <h3 className="text-sm font-semibold text-rose-700 dark:text-rose-400 mb-3 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        Registrar medidas precautorias (Art. 61)
      </h3>
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Fecha de la resolución
        </label>
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          disabled={saving}
          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
        />
      </div>
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Descripción de las medidas dispuestas
        </label>
        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value)}
          rows={5}
          disabled={saving}
          placeholder="Ej: Suspensión preventiva del cargo, prohibición de salida del país, retención de haberes..."
          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
        />
      </div>
      <div className="flex gap-3 justify-end">
        <button
          onClick={() => setAbierto(false)}
          disabled={saving}
          className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm"
        >
          Cancelar
        </button>
        <button
          onClick={() => onRegistrar({ medidasPrecautorias: texto, fechaMedidasPrecautorias: fecha })}
          disabled={saving || !texto.trim()}
          className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Registrar
        </button>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// 13. FALLECIMIENTO DEL DENUNCIADO (Art. 80)
// ─────────────────────────────────────────────────────────────
interface EtapaFallecimientoProps {
  denuncia: Denuncia;
  onRegistrar: (datos: { fechaFallecimientoDenunciado: string }) => void;
  saving: boolean;
}

export function EtapaFallecimiento({
  denuncia, onRegistrar, saving
}: EtapaFallecimientoProps) {
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [confirmando, setConfirmando] = useState(false);

  if (!confirmando) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800/40 rounded-2xl border border-gray-300 dark:border-gray-700 p-5">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
          <XCircle className="w-4 h-4" />
          Fallecimiento del denunciado (Art. 80)
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Si el denunciado fallece durante el proceso, la acción disciplinaria se extingue
          y el expediente se archiva (Art. 80). Esta acción es irreversible.
        </p>
        <button
          onClick={() => setConfirmando(true)}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-gray-500 hover:bg-gray-600 text-white text-sm font-semibold transition-colors flex items-center gap-2"
        >
          <XCircle className="w-4 h-4" /> Registrar fallecimiento
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-800/40 rounded-2xl border-2 border-gray-400 dark:border-gray-600 p-5">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
        <XCircle className="w-4 h-4" />
        Confirmar fallecimiento del denunciado (Art. 80)
      </h3>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 mb-4">
        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
          ⚠ Esta acción archivará el expediente de forma definitiva. No puede revertirse.
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Fecha de fallecimiento
        </label>
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          disabled={saving}
          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-gray-500 outline-none"
        />
      </div>

      <div className="flex gap-3 justify-end">
        <button
          onClick={() => setConfirmando(false)}
          disabled={saving}
          className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm"
        >
          Cancelar
        </button>
        <button
          onClick={() => onRegistrar({ fechaFallecimientoDenunciado: fecha })}
          disabled={saving || !fecha}
          className="px-4 py-2.5 rounded-xl bg-gray-600 hover:bg-gray-700 text-white font-semibold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
          Confirmar y archivar
        </button>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// 14. DESISTIMIENTO (Art. 23)
// ─────────────────────────────────────────────────────────────
interface EtapaDesistimientoProps {
  denuncia: Denuncia;
  onRegistrar: (datos: { fechaDesistimiento: string; motivoDesistimiento: string }) => void;
  saving: boolean;
}

export function EtapaDesistimiento({
  denuncia, onRegistrar, saving
}: EtapaDesistimientoProps) {
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [motivo, setMotivo] = useState("");
  const [confirmando, setConfirmando] = useState(false);

  if (!confirmando) {
    return (
      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-200 dark:border-orange-800 p-5">
        <h3 className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-2 flex items-center gap-2">
          <XCircle className="w-4 h-4" />
          Desistimiento (Art. 23)
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          El denunciante puede desistir de la denuncia{" "}
          <span className="font-semibold text-orange-600">después de la citación</span> al
          denunciado. A diferencia del retiro (Art. 22), el desistimiento impide reiniciar
          la acción por los mismos hechos. El Tribunal puede continuar de oficio si los
          hechos afectan el orden público universitario (Art. 23 par. II).
        </p>
        <button
          onClick={() => setConfirmando(true)}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors flex items-center gap-2"
        >
          <XCircle className="w-4 h-4" /> Registrar desistimiento
        </button>
      </div>
    );
  }

  return (
    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl border-2 border-orange-300 dark:border-orange-700 p-5">
      <h3 className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-3 flex items-center gap-2">
        <XCircle className="w-4 h-4" />
        Confirmar desistimiento (Art. 23)
      </h3>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 mb-4">
        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
          ⚠ Esta acción archivará el proceso. El denunciante no podrá reiniciar la acción
          por los mismos hechos (Art. 23 par. I). Si los hechos afectan el orden público
          universitario, el Tribunal puede continuar de oficio.
        </p>
      </div>

      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Fecha de desistimiento
        </label>
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          disabled={saving}
          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
        />
      </div>

      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Motivo del desistimiento
        </label>
        <textarea
          value={motivo}
          onChange={e => setMotivo(e.target.value)}
          rows={4}
          disabled={saving}
          placeholder="Indique el motivo por el cual el denunciante desiste de la acción..."
          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
        />
      </div>

      <div className="flex gap-3 justify-end">
        <button
          onClick={() => setConfirmando(false)}
          disabled={saving}
          className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm"
        >
          Cancelar
        </button>
        <button
          onClick={() => onRegistrar({ fechaDesistimiento: fecha, motivoDesistimiento: motivo })}
          disabled={saving || !motivo.trim() || !fecha}
          className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
          Confirmar desistimiento
        </button>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// 15. PRESCRIPCIÓN (Art. 8 / Art. 81)
// ─────────────────────────────────────────────────────────────
interface EtapaPrescripcionProps {
  denuncia: Denuncia;
  onRegistrar: (datos: { resolucion: string; fechaResolucion: string }) => void;
  saving: boolean;
}

export function EtapaPrescripcion({
  denuncia, onRegistrar, saving
}: EtapaPrescripcionProps) {
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [fundamentacion, setFundamentacion] = useState("");
  const [confirmando, setConfirmando] = useState(false);

  // Calcular si hay prescripción inminente (referencial, no bloqueante)
  const fechaHecho = denuncia.fechaHecho ? new Date(denuncia.fechaHecho) : null;
  const diasTranscurridos = fechaHecho
    ? Math.floor((Date.now() - fechaHecho.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const mesesTranscurridos = diasTranscurridos ? Math.floor(diasTranscurridos / 30) : null;
  const prescripcionInminente = diasTranscurridos !== null && diasTranscurridos > 600; // ~20 meses

  if (!confirmando) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-300 dark:border-slate-600 p-5">
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Prescripción de la acción (Art. 8 / Art. 81)
        </h3>

        {prescripcionInminente && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 mb-3">
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              Atención: han transcurrido aprox.{" "}
              <span className="font-bold">{mesesTranscurridos} meses</span> desde los hechos.
              El plazo de prescripción es de 2 años (Art. 8).
            </p>
          </div>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          La acción disciplinaria prescribe a los{" "}
          <span className="font-semibold text-slate-600 dark:text-slate-400">2 años</span>{" "}
          desde la comisión del hecho (Art. 8). El Tribunal debe declarar la prescripción
          de oficio o a petición de parte mediante resolución fundada (Art. 81).
        </p>
        <button
          onClick={() => setConfirmando(true)}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-slate-500 hover:bg-slate-600 text-white text-sm font-semibold transition-colors flex items-center gap-2"
        >
          <Clock className="w-4 h-4" /> Declarar prescripción
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border-2 border-slate-400 dark:border-slate-600 p-5">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Declarar prescripción (Art. 8 / Art. 81)
      </h3>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 mb-4">
        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
          ⚠ Esta acción archivará el proceso por prescripción. Requiere resolución
          fundada del Tribunal (Art. 81). Es irreversible.
        </p>
      </div>

      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Fecha de la resolución de prescripción
        </label>
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          disabled={saving}
          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-slate-500 outline-none"
        />
      </div>

      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Fundamentación de la resolución (Art. 81)
        </label>
        <textarea
          value={fundamentacion}
          onChange={e => setFundamentacion(e.target.value)}
          rows={5}
          disabled={saving}
          placeholder="Indique los fundamentos de derecho y de hecho por los cuales se declara la prescripción de la acción disciplinaria..."
          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-slate-500 outline-none"
        />
      </div>

      {fechaHecho && (
        <div className="mb-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-400 space-y-1">
          <p>Fecha de los hechos: <span className="font-semibold">{new Date(fechaHecho).toLocaleDateString("es-BO")}</span></p>
          {diasTranscurridos !== null && (
            <p>Tiempo transcurrido: <span className="font-semibold">{mesesTranscurridos} meses ({diasTranscurridos} días)</span></p>
          )}
          <p>Prescripción legal: <span className="font-semibold">2 años desde el hecho (Art. 8)</span></p>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <button
          onClick={() => setConfirmando(false)}
          disabled={saving}
          className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm"
        >
          Cancelar
        </button>
        <button
          onClick={() => onRegistrar({ resolucion: fundamentacion, fechaResolucion: fecha })}
          disabled={saving || !fundamentacion.trim() || !fecha}
          className="px-4 py-2.5 rounded-xl bg-slate-600 hover:bg-slate-700 text-white font-semibold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
          Declarar prescripción
        </button>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// 16. COMPULSA (Art. 83)
// ─────────────────────────────────────────────────────────────
interface EtapaCompulsaProps {
  denuncia: Denuncia;
  onRegistrar: (datos: { fechaCompulsa: string; resolucionCompulsa: string }) => void;
  saving: boolean;
}

export function EtapaCompulsa({
  denuncia, onRegistrar, saving
}: EtapaCompulsaProps) {
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [resolucion, setResolucion] = useState(denuncia.resolucionCompulsa || "");
  const [abierto, setAbierto] = useState(false);

  if (denuncia.resolucionCompulsa) {
    return (
      <div className="bg-fuchsia-50 dark:bg-fuchsia-900/20 rounded-2xl border border-fuchsia-200 dark:border-fuchsia-800 p-5">
        <h3 className="text-sm font-semibold text-fuchsia-700 dark:text-fuchsia-400 mb-2 flex items-center gap-2">
          <Scale className="w-4 h-4" />
          Compulsa registrada (Art. 83)
        </h3>
        <p className="text-sm text-fuchsia-700 dark:text-fuchsia-300 leading-relaxed">
          {denuncia.resolucionCompulsa}
        </p>
        {denuncia.fechaCompulsa && (
          <p className="text-xs text-fuchsia-500 mt-2">
            Fecha: {denuncia.fechaCompulsa}
          </p>
        )}
      </div>
    );
  }

  if (!abierto) {
    return (
      <div className="bg-fuchsia-50 dark:bg-fuchsia-900/20 rounded-2xl border border-fuchsia-200 dark:border-fuchsia-800 p-5">
        <h3 className="text-sm font-semibold text-fuchsia-700 dark:text-fuchsia-400 mb-2 flex items-center gap-2">
          <Scale className="w-4 h-4" />
          Compulsa (Art. 83)
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Procede cuando el Tribunal de primera instancia{" "}
          <span className="font-semibold text-fuchsia-600">niega el recurso de apelación</span>.
          El agraviado puede recurrir directamente ante el Tribunal Superior dentro de las{" "}
          <span className="font-semibold text-fuchsia-600">24 horas</span> de notificada
          la negativa, para que el Superior decida si la apelación debe ser admitida (Art. 83).
        </p>
        <button
          onClick={() => setAbierto(true)}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-600 text-white text-sm font-semibold transition-colors flex items-center gap-2"
        >
          <Scale className="w-4 h-4" /> Registrar compulsa
        </button>
      </div>
    );
  }

  return (
    <div className="bg-fuchsia-50 dark:bg-fuchsia-900/20 rounded-2xl border border-fuchsia-200 dark:border-fuchsia-800 p-5">
      <h3 className="text-sm font-semibold text-fuchsia-700 dark:text-fuchsia-400 mb-3 flex items-center gap-2">
        <Scale className="w-4 h-4" />
        Registrar compulsa (Art. 83)
      </h3>

      <div className="bg-fuchsia-100 dark:bg-fuchsia-900/30 border border-fuchsia-200 dark:border-fuchsia-800 rounded-xl p-3 mb-4">
        <p className="text-xs text-fuchsia-700 dark:text-fuchsia-400">
          Plazo: <span className="font-bold">24 horas</span> desde la notificación de la
          negativa de apelación para interponer compulsa ante el Tribunal Superior (Art. 83).
        </p>
      </div>

      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Fecha de interposición
        </label>
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          disabled={saving}
          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-fuchsia-500 outline-none"
        />
      </div>

      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Resolución del Superior sobre la compulsa
        </label>
        <textarea
          value={resolucion}
          onChange={e => setResolucion(e.target.value)}
          rows={5}
          disabled={saving}
          placeholder="Registre la resolución del Tribunal Superior: si admite o rechaza la compulsa, y en su caso si ordena que se conceda la apelación..."
          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-fuchsia-500 outline-none"
        />
      </div>

      <div className="flex gap-3 justify-end">
        <button
          onClick={() => setAbierto(false)}
          disabled={saving}
          className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm"
        >
          Cancelar
        </button>
        <button
          onClick={() => onRegistrar({ fechaCompulsa: fecha, resolucionCompulsa: resolucion })}
          disabled={saving || !resolucion.trim() || !fecha}
          className="px-4 py-2.5 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-semibold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Registrar compulsa
        </button>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// 9. TIMELINE / PROGRESO
// ─────────────────────────────────────────────────────────────
interface TimelineDenunciaProps {
  estadoActual: string;
  estados: { value: string; label: string; etapa: number; icon: any }[];
}

export function TimelineDenuncia({ estadoActual, estados }: TimelineDenunciaProps) {
  const estadosOrdenados = [...estados].sort((a, b) => a.etapa - b.etapa);
  const etapaActual = estados.find(e => e.value === estadoActual)?.etapa || 1;

  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 overflow-x-auto">
      <div className="flex items-center justify-between min-w-[800px]">
        {estadosOrdenados.map((estado, idx) => {
          const isCompleted = estado.etapa <= etapaActual;
          const isCurrent = estado.value === estadoActual;
          const Icon = estado.icon;
          return (
            <div key={estado.value} className="flex-1 relative">
              {idx < estadosOrdenados.length - 1 && (
                <div className={`absolute top-5 left-1/2 w-full h-0.5 ${isCompleted ? 'bg-blue-500' : 'bg-gray-200 dark:bg-slate-700'}`} />
              )}
              <div className="relative flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all
                  ${isCompleted ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-500'}
                  ${isCurrent ? 'ring-4 ring-blue-300 dark:ring-blue-800' : ''}`}>
                  {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-xs mt-2 text-center font-medium hidden md:block ${isCompleted ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400'}`}>
                  {estado.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}