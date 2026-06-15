// src/pages/denuncias/components/DenunciaEtapas.tsx
import { useState } from "react";
import {
  Loader2, CheckCircle, AlertCircle, XCircle, MessageSquare,
  ClipboardList, Scale, Gavel, Send, FileCheck, Calendar, User,
  Clock, AlertTriangle, FileText, Plus, X, Search, Eye
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
  tipoResolucion?: string;   // ← AGREGAR
  expediente?: { idExpediente: number; numeroExpediente: string };
}

// ─────────────────────────────────────────────────────────────
// 1. ETAPA ADMISIÓN
// ─────────────────────────────────────────────────────────────
interface EtapaAdmisionProps {
  denuncia: Denuncia;
  onAvanzar: (nuevoEstado: string) => void;
  onRechazar: () => void;
  onSolicitarSubsanacion: () => void;
  saving: boolean;
}

export function EtapaAdmision({ onAvanzar, onRechazar, onSolicitarSubsanacion, saving }: EtapaAdmisionProps) {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-6">
      <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400 mb-4 flex items-center gap-2">
        <CheckCircle className="w-5 h-5" />
        Auto de Admisión (Art. 58)
      </h3>
      <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          El Tribunal debe emitir auto de admisión en el término de <span className="font-bold text-blue-600">5 días hábiles</span>.
        </p>
        <p className="text-xs text-gray-400 mt-1">Art. 58 del Reglamento de Justicia Universitaria</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button onClick={() => onAvanzar("ADMITIDA")} disabled={saving}
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
          La denuncia presenta defectos. Tiene <span className="font-bold text-amber-600">3 días hábiles</span> para subsanar.
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
// 3. ETAPA DECLARACIÓN INFORMATIVA
// ─────────────────────────────────────────────────────────────
interface EtapaDeclaracionInformativaProps {
  denuncia: Denuncia;
  onRegistrarDeclaracion: (datos: { declaracion: string; fechaDeclaracion: string }) => void;
  saving: boolean;
}

export function EtapaDeclaracionInformativa({ denuncia, onRegistrarDeclaracion, saving }: EtapaDeclaracionInformativaProps) {
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
        <button onClick={() => onRegistrarDeclaracion({ declaracion, fechaDeclaracion })} disabled={saving || !declaracion.trim()}
          className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold transition-colors flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Registrar y continuar
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. ETAPA PRUEBAS
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

  const eliminarPrueba = (index: number) => {
    setPruebas(pruebas.filter((_, i) => i !== index));
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
                  <button onClick={() => eliminarPrueba(i)} className="p-1 text-red-500 hover:bg-red-50 rounded-lg">
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
// 5. ETAPA RESOLUCIÓN
// ─────────────────────────────────────────────────────────────
interface EtapaResolucionProps {
  denuncia: Denuncia;
  onEmitirResolucion: (resolucion: string, fecha: string, tipo: string) => void;
  saving: boolean;
}

export function EtapaResolucion({ onEmitirResolucion, saving }: EtapaResolucionProps) {
  const [resolucion, setResolucion] = useState("");
  const [fechaResolucion, setFechaResolucion] = useState(new Date().toISOString().slice(0, 10));
  const [tipoResolucion, setTipoResolucion] = useState("SANCIONATORIA");

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
        <select value={tipoResolucion} onChange={(e) => setTipoResolucion(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500"
          disabled={saving}>
          <option value="SANCIONATORIA">Sancionatoria</option>
          <option value="ABSOLUTORIA">Absolutoria</option>
        </select>
      </div>

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
          placeholder="Describa la resolución..." disabled={saving} />
      </div>

      <div className="flex justify-end">
        <button onClick={() => onEmitirResolucion(resolucion, fechaResolucion, tipoResolucion)} disabled={saving || !resolucion.trim()}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gavel className="w-4 h-4" />}
          Emitir Resolución
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. ETAPA APELACIÓN
// ─────────────────────────────────────────────────────────────
interface EtapaApelacionProps {
  denuncia: Denuncia;
  onApelar?: () => void;
  onEjecutar?: () => void;
  onResolverApelacion?: (resolucion: string) => void;
  saving: boolean;
}

export function EtapaApelacion({ denuncia, onApelar, onEjecutar, onResolverApelacion, saving }: EtapaApelacionProps) {
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
        </p>
        <p className="text-xs text-gray-400 mt-1">Art. 82 del Reglamento</p>
      </div>

      {!esApelada && onApelar && onEjecutar && (
        <div className="flex gap-3 justify-end">
          <button onClick={onEjecutar} disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors flex items-center gap-2">
            <FileCheck className="w-4 h-4" /> Ejecutar fallo
          </button>
          <button onClick={onApelar} disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Interponer Apelación
          </button>
        </div>
      )}

      {esApelada && onResolverApelacion && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Resolución de Segunda Instancia</label>
            <textarea value={resolucionApelacion} onChange={(e) => setResolucionApelacion(e.target.value)} rows={5}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
              placeholder="Describa la resolución de segunda instancia..." disabled={saving} />
          </div>
          <div className="flex justify-end">
            <button onClick={() => onResolverApelacion(resolucionApelacion)} disabled={saving || !resolucionApelacion.trim()}
              className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gavel className="w-4 h-4" />}
              Resolver Apelación
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 7. TIMELINE / PROGRESO
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
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all
                  ${isCompleted ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-500'}
                  ${isCurrent ? 'ring-4 ring-blue-300 dark:ring-blue-800' : ''}
                `}>
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