// src/pages/denuncias/components/DenunciaEtapas.tsx
import { useState } from "react";
import {
  Loader2, CheckCircle, AlertCircle, XCircle, MessageSquare,
  ClipboardList, Scale, Gavel, Send, FileCheck,
  Clock, AlertTriangle, FileText, Plus, X, Handshake
} from "lucide-react";
import {
  generarAutoAdmision,
  generarAutoSubsanacion,
  generarAperturaProbatoria,
  generarCierreProbatorio,
  generarActaConciliacion,
  abrirEImprimirDocumento,
} from "../../utils/documentosTribunal";
import type { DatosDocumentoTribunal } from "../../utils/documentosTribunal";


// ── Tipo para el banner de impresión ─────────────────────────────────────────
export interface DocumentoPendiente {
  titulo: string;
  datos: Omit<DatosDocumentoTribunal, never>;
  color: "blue" | "amber" | "purple" | "teal";
}

export function parseFechaLocal(fechaStr: string): Date {
  const [y, m, d] = fechaStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function calcularDiasHabiles(desde: string, hasta: Date = new Date()): number {
  const inicio = parseFechaLocal(desde);
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date(hasta);
  fin.setHours(0, 0, 0, 0);
  let dias = 0;
  const cursor = new Date(inicio);
  while (cursor < fin) {
    cursor.setDate(cursor.getDate() + 1);
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) dias++;
  }
  return dias;
}

function calcularFechaLimiteHabiles(desde: string, diasHabiles: number): Date {
  const fecha = parseFechaLocal(desde);
  let contados = 0;
  while (contados < diasHabiles) {
    fecha.setDate(fecha.getDate() + 1);
    const dow = fecha.getDay();
    if (dow !== 0 && dow !== 6) contados++;
  }
  return fecha;
}


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
  // Art. 16 + Art. 90 par. II
  fechaRemisionRectorado?: string;
  fechaResolucionRectoral?: string;
  numeroResolucionRectoral?: string;
  observacionesEjecucion?: string;
  // Art. 7
  fechaRegistroGaceta?: string;
  numeroGaceta?: string;
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
  onDocumentoListo?: (doc: DocumentoPendiente) => void;
}

export function EtapaAdmision({
  denuncia, onRechazar, onSolicitarSubsanacion, onAdmitir, salas, saving, onDocumentoListo
}: EtapaAdmisionProps) {
  const [confirmando, setConfirmando] = useState(false);
  const [idSala, setIdSala] = useState(0);

  // ── Cambio 2: handler async que genera el documento antes de admitir ──
  const handleConfirmarAdmision = async () => {
    const nombreDenunciado = denuncia.denunciado
      ? `${denuncia.denunciado.nombre} ${denuncia.denunciado.primerApellido}`.trim()
      : "—";
    const datoDoc = {
      numeroExpediente:   denuncia.expediente?.numeroExpediente ?? `DEN-${denuncia.numeroDenuncia}`,
      numeroDenuncia:     denuncia.numeroDenuncia,
      nombreDestinatario: nombreDenunciado,
      rolDestinatario:    "Denunciado/a" as const,
      descripcionHechos:  denuncia.descripcion,
      tipo:               "AUTO_ADMISION" as const,
    };
    onAdmitir({ idSala });
    onDocumentoListo?.({
      titulo: "Auto de Admisión (Art. 58)",
      datos: datoDoc,
      color: "blue",
    });
  };

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
          onClick={handleConfirmarAdmision}
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
  onDocumentoListo?: (doc: DocumentoPendiente) => void;
}

export function EtapaSubsanacion({ denuncia, onSubsanar, onRechazar, saving, onDocumentoListo }: EtapaSubsanacionProps) {
  const [nuevaDescripcion, setNuevaDescripcion] = useState(denuncia.descripcion);

  // ── Cambio 3: handler async que genera el documento antes de subsanar ──
  const handleSolicitarSubsanacion = () => {
    const nombreDenunciante = denuncia.denunciante
      ? `${denuncia.denunciante.nombre} ${denuncia.denunciante.primerApellido}`.trim()
      : "—";
    onSubsanar({ descripcion: nuevaDescripcion });
    onDocumentoListo?.({
      titulo: "Auto de Subsanación (Art. 56)",
      datos: {
        tipo: "SUBSANACION",
        numeroExpediente:   denuncia.expediente?.numeroExpediente ?? `DEN-${denuncia.numeroDenuncia}`,
        numeroDenuncia:     denuncia.numeroDenuncia,
        nombreDestinatario: nombreDenunciante,
        rolDestinatario:    "Denunciante",
      },
      color: "amber",
    });
  };

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
        <button onClick={handleSolicitarSubsanacion} disabled={saving}
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
  onDocumentoListo?: (doc: DocumentoPendiente) => void;
}

export function EtapaConciliacion({ denuncia, onConciliar, saving, onDocumentoListo }: EtapaConciliacionProps) {
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

  // ── Cambio 5: handler async que genera el documento antes de conciliar ──
  const handleConfirmarConciliacion = () => {
    const nombreDenunciante = denuncia.denunciante
      ? `${denuncia.denunciante.nombre} ${denuncia.denunciante.primerApellido}`.trim()
      : "—";
    onConciliar({ actaConciliacion: acta, fechaConciliacion: fecha });
    onDocumentoListo?.({
      titulo: "Acta de Conciliación (Art. 59)",
      datos: {
        tipo: "CONCILIACION",
        numeroExpediente:   denuncia.expediente?.numeroExpediente ?? `DEN-${denuncia.numeroDenuncia}`,
        numeroDenuncia:     denuncia.numeroDenuncia,
        nombreDestinatario: nombreDenunciante,
        textoConciliacion:  acta,
        fechaDocumento:     fecha,
      },
      color: "teal",
    });
  };
  
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
        <button onClick={handleConfirmarConciliacion}
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
  disabled?: boolean;
}

export function EtapaDeclaracionInformativa({ onRegistrarDeclaracion, saving, disabled }: EtapaDeclaracionInformativaProps) {
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
          disabled={saving || !declaracion.trim() || !!disabled}
          title={disabled ? "Primero programá la audiencia de declaración informativa en el tab Audiencias (Art. 58 inc. b)" : undefined}
          className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold transition-colors flex items-center gap-2 disabled:opacity-50">
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
  onDocumentoListo?: (doc: DocumentoPendiente) => void;
}

export function EtapaPruebas({ denuncia, onAbrirPruebas, onCerrarPruebas, saving, onDocumentoListo }: EtapaPruebasProps) {
  const [pruebas, setPruebas] = useState<{ nombre: string; descripcion: string }[]>([]);
  const [nuevaPrueba, setNuevaPrueba] = useState({ nombre: "", descripcion: "" });

  const agregarPrueba = () => {
    if (nuevaPrueba.nombre.trim()) {
      setPruebas([...pruebas, { ...nuevaPrueba }]);
      setNuevaPrueba({ nombre: "", descripcion: "" });
    }
  };

  // ── Cambio 4: handlers async para apertura y cierre probatorio ──
  const handleAbrirPruebas = () => {
    if (!onAbrirPruebas) return;
    const nombreDenunciante = denuncia.denunciante
      ? `${denuncia.denunciante.nombre} ${denuncia.denunciante.primerApellido}`.trim()
      : "—";
    const nombreDenunciado = denuncia.denunciado
      ? `${denuncia.denunciado.nombre} ${denuncia.denunciado.primerApellido}`.trim()
      : "—";
    onAbrirPruebas();
    // Notificar 2 documentos: uno por parte
    onDocumentoListo?.({
      titulo: "Auto de Apertura Probatoria — Denunciante (Art. 60)",
      datos: {
        tipo: "APERTURA_PROBATORIA",
        numeroExpediente:   denuncia.expediente?.numeroExpediente ?? `DEN-${denuncia.numeroDenuncia}`,
        numeroDenuncia:     denuncia.numeroDenuncia,
        nombreDestinatario: nombreDenunciante,
        rolDestinatario:    "Denunciante",
      },
      color: "purple",
    });
    // El segundo doc se mostrará cuando el usuario cierre el primero — lo encolamos via setTimeout
    setTimeout(() => {
      onDocumentoListo?.({
        titulo: "Auto de Apertura Probatoria — Denunciado/a (Art. 60)",
        datos: {
          tipo: "APERTURA_PROBATORIA",
          numeroExpediente:   denuncia.expediente?.numeroExpediente ?? `DEN-${denuncia.numeroDenuncia}`,
          numeroDenuncia:     denuncia.numeroDenuncia,
          nombreDestinatario: nombreDenunciado,
          rolDestinatario:    "Denunciado/a",
        },
        color: "purple",
      });
    }, 100);
  };

  const handleCerrarPruebas = () => {
    if (!onCerrarPruebas) return;
    onCerrarPruebas();
    onDocumentoListo?.({
      titulo: "Auto de Clausura Probatoria (Art. 74)",
      datos: {
        tipo: "CIERRE_PROBATORIO",
        numeroExpediente:   denuncia.expediente?.numeroExpediente ?? `DEN-${denuncia.numeroDenuncia}`,
        numeroDenuncia:     denuncia.numeroDenuncia,
        nombreDestinatario: "Ambas partes procesales",
      },
      color: "purple",
    });
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
          <button onClick={handleAbrirPruebas} disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-semibold transition-colors flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
            Abrir Período Probatorio
          </button>
        )}
        {onCerrarPruebas && (
          <button onClick={handleCerrarPruebas} disabled={saving}
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
// 8. ETAPA APELACIÓN  — con control de plazo (Art. 82 par. IV)
// ─────────────────────────────────────────────────────────────
interface EtapaApelacionProps {
  denuncia: Denuncia;
  onApelar?: (datos: { fechaApelacion: string; idRecurrente: string }) => void;
  onEjecutar?: () => void;
  onRemitirSuperior?: (datos: { fechaRemisionSuperior: string }) => void;
  onResolverApelacion?: (datos: { resolucionApelacion: string }) => void;
  saving: boolean;
}

export function EtapaApelacion({
  denuncia,
  onApelar,
  onEjecutar,
  onRemitirSuperior,
  onResolverApelacion,
  saving,
}: EtapaApelacionProps) {
  const [fechaApelacion, setFechaApelacion] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [recurrente, setRecurrente] = useState<"DENUNCIANTE" | "DENUNCIADO" | "">("");
  const [fechaRemision, setFechaRemision] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [resolucionApelacion, setResolucionApelacion] = useState("");
  const esApelada = denuncia.estado === "APELADA";

  const fechaNotif = denuncia.fechaNotificacionResolucion;

  const diasHabilesTranscurridos = fechaNotif
    ? calcularDiasHabiles(fechaNotif)
    : null;

  const fechaLimite = fechaNotif
    ? calcularFechaLimiteHabiles(fechaNotif, 5)
    : null;

  const plazoVencido   = diasHabilesTranscurridos !== null && diasHabilesTranscurridos > 5;
  const plazoInminente = diasHabilesTranscurridos !== null && diasHabilesTranscurridos >= 4 && !plazoVencido;

  const fmtFecha = (d: Date) =>
    d.toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-200 dark:border-orange-800 p-6">
      <h3 className="text-lg font-semibold text-orange-700 dark:text-orange-400 mb-4 flex items-center gap-2">
        <Send className="w-5 h-5" />
        Recurso de Apelación (Art. 82)
      </h3>

      <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Plazo perentorio de{" "}
          <span className="font-bold text-orange-600">5 días hábiles</span> para
          interponer apelación desde la notificación personal de la resolución (Art. 82
          par. II). Una vez admitida, se remite al Tribunal Superior en{" "}
          <span className="font-bold text-orange-600">3 días hábiles</span>.
        </p>
        <p className="text-xs text-gray-400 mt-1">Arts. 82 y 86 del Reglamento</p>
      </div>

      {!esApelada && fechaNotif && (
        <>
          {plazoVencido && (
            <div className="mb-4 flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-700 dark:text-red-400">
                  Plazo de apelación vencido (Art. 82 par. IV)
                </p>
                <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                  Han transcurrido <strong>{diasHabilesTranscurridos} días hábiles</strong> desde
                  la notificación del {parseFechaLocal(fechaNotif).toLocaleDateString("es-BO")}. El plazo
                  perentorio de 5 días hábiles ya expiró (venció el{" "}
                  <strong>{fechaLimite ? fmtFecha(fechaLimite) : "—"}</strong>). Si se intenta
                  interponer apelación, el sistema la rechazará y el Tribunal debe declarar
                  la ejecutoria de la resolución.
                </p>
              </div>
            </div>
          )}

          {plazoInminente && (
            <div className="mb-4 flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                  Plazo por vencer — quedan{" "}
                  {5 - (diasHabilesTranscurridos ?? 0)} día
                  {5 - (diasHabilesTranscurridos ?? 0) !== 1 ? "s" : ""} hábil
                  {5 - (diasHabilesTranscurridos ?? 0) !== 1 ? "es" : ""}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">
                  Notificado el{" "}
                    {new Date(fechaNotif).toLocaleDateString("es-BO")}. Vence el{" "}
                  <strong>{fechaLimite ? fmtFecha(fechaLimite) : "—"}</strong>.
                </p>
              </div>
            </div>
          )}

          {!plazoVencido && !plazoInminente && (
            <div className="mb-4 flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <Clock className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                  Plazo vigente — {diasHabilesTranscurridos} de 5 días hábiles transcurridos
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  Notificado el{" "}
                    {new Date(fechaNotif).toLocaleDateString("es-BO")}. Vence el{" "}
                  <strong>{fechaLimite ? fmtFecha(fechaLimite) : "—"}</strong>.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {!esApelada && !fechaNotif && (
        <div className="mb-4 flex items-start gap-3 p-3 rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800">
          <AlertCircle className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
          <p className="text-xs text-sky-700 dark:text-sky-400">
            No se registró la fecha de notificación personal (Art. 46). Para controlar el
            plazo de apelación, registrala primero en la sección "Notificación personal de
            resolución" de arriba.
          </p>
        </div>
      )}

      {!esApelada && onApelar && onEjecutar && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha de interposición de apelación
            </label>
            <input
              type="date"
              value={fechaApelacion}
              onChange={(e) => setFechaApelacion(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              disabled={saving}
            />
            {fechaNotif && fechaApelacion && (() => {
              const diasSel = calcularDiasHabiles(fechaNotif, new Date(fechaApelacion + "T23:59:59"));
              if (diasSel > 5) {
                return (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    Con esta fecha habrán transcurrido <strong>{diasSel} días hábiles</strong> — el sistema rechazará la apelación (Art. 82 par. IV).
                  </p>
                );
              }
              if (diasSel === 5) {
                return (
                  <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Último día hábil del plazo perentorio.
                  </p>
                );
              }
              return null;
            })()}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Parte que interpone el recurso <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              {(["DENUNCIANTE", "DENUNCIADO"] as const).map((opcion) => (
                <button
                  key={opcion}
                  type="button"
                  onClick={() => setRecurrente(opcion)}
                  disabled={saving}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                    recurrente === opcion
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400"
                      : "border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:border-orange-300 dark:hover:border-orange-700"
                  }`}
                >
                  {opcion === "DENUNCIANTE" ? "Denunciante" : "Denunciado"}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Art. 82 — cualquiera de las partes puede apelar dentro del plazo
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onEjecutar}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors flex items-center gap-2"
            >
              <FileCheck className="w-4 h-4" /> Ejecutar fallo (sin apelación)
            </button>
            <button
              onClick={() => {
                if (!recurrente) return;
                onApelar({ fechaApelacion, idRecurrente: recurrente });
              }}
              disabled={saving || !recurrente}
              title={plazoVencido ? "El plazo ya venció — el sistema rechazará esta apelación (Art. 82 par. IV)" : undefined}
              className={`px-4 py-2.5 rounded-xl text-white font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 ${
                plazoVencido
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-orange-500 hover:bg-orange-600"
              }`}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {plazoVencido ? "Intentar apelación (fuera de plazo)" : "Interponer Apelación"}
            </button>
          </div>

          {plazoVencido && (
            <p className="text-xs text-red-600 dark:text-red-400 text-right">
              ⚠ Si el plazo ya venció, usá "Ejecutar fallo" directamente (Art. 82 par. IV).
            </p>
          )}
        </div>
      )}

      {esApelada && (
        <div className="space-y-4">
          {!denuncia.fechaRemisionSuperior && onRemitirSuperior && (
            <div className="border border-orange-200 dark:border-orange-700 rounded-xl p-4">
              <p className="text-sm font-medium text-orange-700 dark:text-orange-400 mb-3">
                Paso 1 — Remitir expediente al Tribunal Superior (Art. 86)
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Plazo: 3 días hábiles desde la admisión del recurso.
              </p>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de remisión
                </label>
                <input
                  type="date"
                  value={fechaRemision}
                  onChange={(e) => setFechaRemision(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  disabled={saving}
                />
              </div>
              <button
                onClick={() => onRemitirSuperior({ fechaRemisionSuperior: fechaRemision })}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Registrar Remisión al Superior
              </button>
            </div>
          )}

          {onResolverApelacion && (
            <div className="border border-orange-200 dark:border-orange-700 rounded-xl p-4">
              <p className="text-sm font-medium text-orange-700 dark:text-orange-400 mb-3">
                {denuncia.fechaRemisionSuperior ? "Paso 2 —" : ""} Resolución del Tribunal
                Superior (Art. 86)
              </p>
              <p className="text-xs text-gray-500 mb-3">
                El Superior tiene 15 días hábiles para resolver desde el decreto de
                radicatoria. Registrá aquí el fallo recibido (Art. 86).
              </p>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Resolución de segunda instancia
                </label>
                <textarea
                  value={resolucionApelacion}
                  onChange={(e) => setResolucionApelacion(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                  placeholder="Confirma, revoca o anula la resolución de primera instancia..."
                  disabled={saving}
                />
              </div>
              <button
                onClick={() => onResolverApelacion({ resolucionApelacion })}
                disabled={saving || !resolucionApelacion.trim()}
                className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileCheck className="w-4 h-4" />
                )}
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

  const fechaHecho = denuncia.fechaHecho ? parseFechaLocal(denuncia.fechaHecho) : null;
  const diasTranscurridos = fechaHecho
    ? Math.floor((Date.now() - fechaHecho.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const mesesTranscurridos = diasTranscurridos ? Math.floor(diasTranscurridos / 30) : null;
  const prescripcionInminente = diasTranscurridos !== null && diasTranscurridos > 600;

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
// 17. RATIFICACIÓN DE PRUEBAS (Art. 60 par. II)
// ─────────────────────────────────────────────────────────────
interface EtapaRatificacionPruebasProps {
  denuncia: Denuncia;
  onRegistrar: () => void;
  saving: boolean;
}

export function EtapaRatificacionPruebas({
  denuncia, onRegistrar, saving
}: EtapaRatificacionPruebasProps) {
  const [confirmando, setConfirmando] = useState(false);

  if (!confirmando) {
    return (
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-200 dark:border-purple-800 p-5">
        <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-400 mb-2 flex items-center gap-2">
          <ClipboardList className="w-4 h-4" />
          Ratificación de Pruebas (Art. 60 par. II)
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Las partes tienen <span className="font-semibold text-purple-600">5 días hábiles</span>{" "}
          desde la notificación del Auto de Apertura para ratificar las pruebas presentadas.
          Registrá esta actuación cuando ambas partes hayan ratificado o vencido el plazo.
        </p>
        <button
          onClick={() => setConfirmando(true)}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold transition-colors flex items-center gap-2"
        >
          <ClipboardList className="w-4 h-4" /> Registrar ratificación
        </button>
      </div>
    );
  }

  return (
    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl border-2 border-purple-300 dark:border-purple-700 p-5">
      <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-400 mb-3 flex items-center gap-2">
        <ClipboardList className="w-4 h-4" />
        Confirmar ratificación de pruebas (Art. 60 par. II)
      </h3>
      <div className="bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-xl p-3 mb-4">
        <p className="text-xs text-purple-700 dark:text-purple-400">
          Se registrará una actuación procesal en el expediente{" "}
          <span className="font-semibold">{denuncia.expediente?.numeroExpediente}</span>{" "}
          con la ratificación de pruebas de cargo y descargo.
        </p>
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
          onClick={() => { onRegistrar(); setConfirmando(false); }}
          disabled={saving}
          className="px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-semibold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Confirmar
        </button>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// 18. TRASLADO DE APELACIÓN A LA CONTRAPARTE (Art. 82 par. III)
// ─────────────────────────────────────────────────────────────
interface EtapaTrasladoApelacionProps {
  denuncia: Denuncia;
  onRegistrar: () => void;
  saving: boolean;
}

export function EtapaTrasladoApelacion({
  denuncia, onRegistrar, saving
}: EtapaTrasladoApelacionProps) {
  const [confirmando, setConfirmando] = useState(false);

  if (!confirmando) {
    return (
      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-200 dark:border-orange-800 p-5">
        <h3 className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-2 flex items-center gap-2">
          <Send className="w-4 h-4" />
          Traslado de Apelación a la Contraparte (Art. 82 par. III)
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Una vez interpuesta la apelación, debe correrse traslado a la contraparte.
          Ésta tiene <span className="font-semibold text-orange-600">5 días hábiles</span>{" "}
          para contestar. Recién después se remite el expediente al Tribunal Superior
          en <span className="font-semibold text-orange-600">3 días hábiles</span> (Art. 82 par. III).
        </p>
        <button
          onClick={() => setConfirmando(true)}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors flex items-center gap-2"
        >
          <Send className="w-4 h-4" /> Registrar traslado
        </button>
      </div>
    );
  }

  return (
    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl border-2 border-orange-300 dark:border-orange-700 p-5">
      <h3 className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-3 flex items-center gap-2">
        <Send className="w-4 h-4" />
        Confirmar traslado de apelación (Art. 82 par. III)
      </h3>
      <div className="bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-xl p-3 mb-4">
        <p className="text-xs text-orange-700 dark:text-orange-400">
          Se registrará en el expediente{" "}
          <span className="font-semibold">{denuncia.expediente?.numeroExpediente}</span>{" "}
          que se corrió traslado del recurso de apelación a la contraparte.
          El plazo de 5 días hábiles para contestar empieza desde hoy.
        </p>
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
          onClick={() => { onRegistrar(); setConfirmando(false); }}
          disabled={saving}
          className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Confirmar traslado
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 19. EJECUCIÓN AL RECTORADO (Art. 16 + Art. 90)
// ─────────────────────────────────────────────────────────────
function getDestinatarioEjecucion(tipoDenunciado?: string): {
  label: string;
  descripcion: string;
  articulo: string;
  plazo: string;
} {
  switch (tipoDenunciado) {
    case "AUTORIDAD":
      return {
        label: "Ilustre Consejo Universitario (I.C.U.)",
        descripcion:
          "Cuando el sancionado es una autoridad electa del cogobierno (Rector, Vicerrector, Decanos, etc.), la resolución es ejecutada por resolución del I.C.U. o del Consejo Facultativo según corresponda.",
        articulo: "Art. 90 par. III-IV",
        plazo: "5 días hábiles",
      };
    case "DOCENTE":
    case "ADMINISTRATIVO":
    case "ESTUDIANTE":
    default:
      return {
        label: "Rectorado",
        descripcion:
          "El Rector emite resolución administrativa para hacer efectiva la sanción.",
        articulo: "Art. 90 par. II",
        plazo: "5 días hábiles",
      };
  }
}

interface EtapaEjecucionRectoradoProps {
  denuncia: Denuncia;
  onRegistrarRemision: (datos: {
    fechaRemisionRectorado: string;
    observacionesEjecucion?: string;
  }) => void;
  onRegistrarResolucionRectoral: (datos: {
    fechaResolucionRectoral: string;
    numeroResolucionRectoral: string;
    observacionesEjecucion?: string;
  }) => void;
  onRegistrarGaceta: (datos: {
    fechaRegistroGaceta: string;
    numeroGaceta: string;
  }) => void;
  onEnviarNotificacion: () => void;
  saving: boolean;
}

export function EtapaEjecucionRectorado({
  denuncia,
  onRegistrarRemision,
  onRegistrarResolucionRectoral,
  onRegistrarGaceta,
  onEnviarNotificacion,
  saving,
}: EtapaEjecucionRectoradoProps) {
  const destinatario = getDestinatarioEjecucion(denuncia.tipoDenunciado);

  const [fechaRemision, setFechaRemision] = useState(
    denuncia.fechaRemisionRectorado ?? new Date().toISOString().slice(0, 10)
  );
  const [obsRemision, setObsRemision] = useState(
    denuncia.observacionesEjecucion ?? ""
  );
  const [fechaRectoral, setFechaRectoral] = useState(
    denuncia.fechaResolucionRectoral ?? new Date().toISOString().slice(0, 10)
  );
  const [numRectoral, setNumRectoral] = useState(
    denuncia.numeroResolucionRectoral ?? ""
  );
  const [obsRectoral, setObsRectoral] = useState(
    denuncia.observacionesEjecucion ?? ""
  );
  const [fechaGaceta, setFechaGaceta] = useState(
    denuncia.fechaRegistroGaceta ?? new Date().toISOString().slice(0, 10)
  );
  const [numGaceta, setNumGaceta] = useState(denuncia.numeroGaceta ?? "");

  const paso1Completo = !!denuncia.fechaRemisionRectorado;
  const paso2Completo = !!denuncia.fechaResolucionRectoral;
  const paso3Completo = !!denuncia.fechaRegistroGaceta;

  const esSancionatoria =
    !denuncia.tipoResolucion || denuncia.tipoResolucion === "SANCIONATORIA";

  return (
    <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800 p-6 space-y-5">
      <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
        <FileCheck className="w-5 h-5" />
        Ejecución de Fallo (Art. 16 + Art. 90)
      </h3>

      <div
        className={`rounded-xl border p-4 ${
          denuncia.tipoDenunciado === "AUTORIDAD"
            ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
            : "bg-white dark:bg-slate-800/50 border-green-200 dark:border-green-800"
        }`}
      >
        <p
          className={`text-xs font-bold uppercase tracking-wider mb-1 ${
            denuncia.tipoDenunciado === "AUTORIDAD"
              ? "text-purple-600 dark:text-purple-400"
              : "text-green-600 dark:text-green-400"
          }`}
        >
          Destinatario de ejecución — {destinatario.articulo}
        </p>
        <p
          className={`text-sm font-semibold ${
            denuncia.tipoDenunciado === "AUTORIDAD"
              ? "text-purple-800 dark:text-purple-300"
              : "text-green-800 dark:text-green-200"
          }`}
        >
          {destinatario.label}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
          {destinatario.descripcion}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4">
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          El fallo ejecutoriado debe ser remitido en{" "}
          <span className="font-bold text-green-600">3 días hábiles</span> (Art.
          16). {destinatario.label} debe emitir resolución en{" "}
          <span className="font-bold text-green-600">
            {destinatario.plazo}
          </span>{" "}
          ({destinatario.articulo}).
          {esSancionatoria && (
            <>
              {" "}
              La resolución sancionatoria se registra en la{" "}
              <span className="font-bold text-green-600">
                Gaceta Universitaria en 5 días hábiles
              </span>{" "}
              (Art. 7).
            </>
          )}
        </p>
      </div>

      {/* Paso 1 */}
      <div
        className={`rounded-xl border p-4 ${
          paso1Completo
            ? "border-green-300 dark:border-green-700 bg-green-50/60 dark:bg-green-900/10"
            : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/40"
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              paso1Completo
                ? "bg-green-500 text-white"
                : "bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-300"
            }`}
          >
            {paso1Completo ? <CheckCircle className="w-4 h-4" /> : "1"}
          </div>
          <p className="text-sm font-semibold text-gray-800 dark:text-white">
            Remisión del expediente a {destinatario.label} (Art. 16)
          </p>
        </div>

        {paso1Completo ? (
          <div className="text-xs text-green-700 dark:text-green-400 space-y-1 pl-8">
            <p>✓ Remitido el: <span className="font-semibold">{denuncia.fechaRemisionRectorado}</span></p>
            {denuncia.observacionesEjecucion && <p>Obs: {denuncia.observacionesEjecucion}</p>}
          </div>
        ) : (
          <div className="pl-8 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Fecha de remisión <span className="text-red-500">*</span>
              </label>
              <input type="date" value={fechaRemision} onChange={(e) => setFechaRemision(e.target.value)}
                disabled={saving}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Observaciones (opcional)</label>
              <textarea value={obsRemision} onChange={(e) => setObsRemision(e.target.value)} rows={2} disabled={saving}
                placeholder={`Ej: Expediente remitido a ${destinatario.label} con oficio N° ...`}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={() => onRegistrarRemision({ fechaRemisionRectorado: fechaRemision, observacionesEjecucion: obsRemision || undefined })}
                disabled={saving || !fechaRemision}
                className="px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Registrar remisión
              </button>
              <button onClick={onEnviarNotificacion} disabled={saving}
                title={`Enviar email a ${destinatario.label} y a las partes`}
                className="px-4 py-2 rounded-xl border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 text-sm font-medium hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors flex items-center gap-2">
                <Send className="w-4 h-4" /> Enviar notificación por email
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Paso 2 */}
      <div
        className={`rounded-xl border p-4 ${
          paso2Completo
            ? "border-green-300 dark:border-green-700 bg-green-50/60 dark:bg-green-900/10"
            : !paso1Completo
            ? "border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/20 opacity-60"
            : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/40"
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              paso2Completo ? "bg-green-500 text-white" : "bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-300"
            }`}
          >
            {paso2Completo ? <CheckCircle className="w-4 h-4" /> : "2"}
          </div>
          <p className="text-sm font-semibold text-gray-800 dark:text-white">
            Resolución de {destinatario.label} ({destinatario.articulo})
          </p>
        </div>

        {paso2Completo ? (
          <div className="text-xs text-green-700 dark:text-green-400 space-y-1 pl-8">
            <p>✓ N° resolución: <span className="font-semibold">{denuncia.numeroResolucionRectoral}</span></p>
            <p>✓ Fecha: <span className="font-semibold">{denuncia.fechaResolucionRectoral}</span></p>
          </div>
        ) : paso1Completo ? (
          <div className="pl-8 space-y-3">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {destinatario.label} tiene <strong>{destinatario.plazo}</strong> desde la recepción del expediente para emitir resolución ({destinatario.articulo}).
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">N° Resolución <span className="text-red-500">*</span></label>
                <input type="text" value={numRectoral} onChange={(e) => setNumRectoral(e.target.value)} disabled={saving}
                  placeholder={denuncia.tipoDenunciado === "AUTORIDAD" ? "Ej: R-ICU-0045/2025" : "Ej: R-RECT-0123/2025"}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fecha de emisión <span className="text-red-500">*</span></label>
                <input type="date" value={fechaRectoral} onChange={(e) => setFechaRectoral(e.target.value)} disabled={saving}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Observaciones (opcional)</label>
              <textarea value={obsRectoral} onChange={(e) => setObsRectoral(e.target.value)} rows={2} disabled={saving}
                placeholder="Ej: Sanción ejecutada, denunciado notificado..."
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
            </div>
            <button onClick={() => onRegistrarResolucionRectoral({ fechaResolucionRectoral: fechaRectoral, numeroResolucionRectoral: numRectoral, observacionesEjecucion: obsRectoral || undefined })}
              disabled={saving || !numRectoral.trim() || !fechaRectoral}
              className="px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Registrar resolución
            </button>
          </div>
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500 pl-8">Disponible una vez registrada la remisión.</p>
        )}
      </div>

      {/* Paso 3: Gaceta */}
      {esSancionatoria && (
        <div
          className={`rounded-xl border p-4 ${
            paso3Completo
              ? "border-green-300 dark:border-green-700 bg-green-50/60 dark:bg-green-900/10"
              : !paso2Completo
              ? "border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/20 opacity-60"
              : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/40"
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                paso3Completo ? "bg-green-500 text-white" : "bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-300"
              }`}
            >
              {paso3Completo ? <CheckCircle className="w-4 h-4" /> : "3"}
            </div>
            <p className="text-sm font-semibold text-gray-800 dark:text-white">
              Registro en Gaceta Universitaria (Art. 7)
            </p>
          </div>

          {paso3Completo ? (
            <div className="text-xs text-green-700 dark:text-green-400 space-y-1 pl-8">
              <p>✓ N° Gaceta: <span className="font-semibold">{denuncia.numeroGaceta}</span></p>
              <p>✓ Fecha: <span className="font-semibold">{denuncia.fechaRegistroGaceta}</span></p>
            </div>
          ) : paso2Completo ? (
            <div className="pl-8 space-y-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  Las resoluciones sancionatorias definitivas deben registrarse en la{" "}
                  <strong>Gaceta Universitaria en 5 días hábiles</strong> desde su emisión (Art. 7).
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">N° de Gaceta <span className="text-red-500">*</span></label>
                  <input type="text" value={numGaceta} onChange={(e) => setNumGaceta(e.target.value)} disabled={saving}
                    placeholder="Ej: GU-2025-045"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fecha de registro <span className="text-red-500">*</span></label>
                  <input type="date" value={fechaGaceta} onChange={(e) => setFechaGaceta(e.target.value)} disabled={saving}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
              </div>
              <button onClick={() => onRegistrarGaceta({ fechaRegistroGaceta: fechaGaceta, numeroGaceta: numGaceta })}
                disabled={saving || !numGaceta.trim() || !fechaGaceta}
                className="px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Registrar en Gaceta
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500 pl-8">Disponible una vez registrada la resolución.</p>
          )}
        </div>
      )}

      {!esSancionatoria && paso2Completo && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-xs text-blue-700 dark:text-blue-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Resolución absolutoria — no requiere registro en Gaceta Universitaria (Art. 7 aplica solo a resoluciones sancionatorias).
          </p>
        </div>
      )}

      {paso1Completo && paso2Completo && (!esSancionatoria || paso3Completo) && (
        <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-xl p-4 text-center">
          <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
          <p className="text-sm font-bold text-green-700 dark:text-green-400">Proceso completamente ejecutado</p>
          <p className="text-xs text-green-600 dark:text-green-300 mt-1">
            Expediente remitido, resolución emitida por {destinatario.label}
            {esSancionatoria && " y resolución registrada en Gaceta Universitaria"}.
          </p>
        </div>
      )}
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