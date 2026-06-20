// src/pages/denuncias/DenunciaAudiencias.tsx
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  CREAR_AUDIENCIA,
  ACTUALIZAR_AUDIENCIA,
  ENVIAR_CITACIONES_AUDIENCIA,
  GET_ASISTENCIAS_AUDIENCIA,
  REGISTRAR_ASISTENCIA_BATCH,
} from "../../graphql/audiencias";
import {
  X, Calendar, Send, ClipboardList, CheckCircle, AlertCircle,
  Loader2, Save, Edit2, Users, Search, Plus,
} from "lucide-react";

// ─── Estilos compartidos ──────────────────────────────────────────────────
const inputCls =
  "w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all";
const labelCls =
  "block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1";

// ─── Helpers ──────────────────────────────────────────────────────────────
const fmtFechaHora = (iso?: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-BO", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

// ─── Buscador modal genérico (igual al de ExpedienteDetallePage) ──────────
interface OpcionModal {
  id: number;
  titulo: string;
  subtitulo?: string;
  extra?: string;
}

function BuscadorModal({
  titulo, placeholder, opciones, loading, onSelect, onClose,
}: {
  titulo: string; placeholder: string; opciones: OpcionModal[];
  loading: boolean; onSelect: (id: number, label: string) => void; onClose: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const filtradas = opciones.filter(o =>
    `${o.titulo} ${o.subtitulo ?? ""} ${o.extra ?? ""}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-500" />{titulo}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" placeholder={placeholder} value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              autoFocus
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : filtradas.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>No se encontraron resultados</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filtradas.map(o => (
                <button
                  key={o.id}
                  onClick={() => {
                    const label = o.extra ? `${o.titulo} — ${o.extra}` : o.titulo;
                    onSelect(o.id, label);
                    onClose();
                  }}
                  className="w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{o.titulo}</p>
                      {o.subtitulo && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{o.subtitulo}</p>}
                      {o.extra && <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">{o.extra}</p>}
                    </div>
                    <Plus className="w-5 h-5 text-blue-500 shrink-0 ml-3" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-slate-700 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// FORM AUDIENCIA DENUNCIA
// Recibe tiposAud y salasAud como props (ya cargados en DenunciaDetailPage)
// ══════════════════════════════════════════════════════════════════════════
const INIT_AUD = {
  idTipoAudiencia: 0, tipoLabel: "",
  idSalaAud: 0, salaLabel: "",
  fechaHoraProgramada: "",
  linkVideoconferencia: "",
  estadoAudiencia: "PROGRAMADA",
  motivoSuspension: "",
  fechaHoraInicio: "",
  fechaHoraFin: "",
};

export function FormAudienciaDenuncia({
  idExpediente, editando, tiposAud, salasAud, conformaciones, estadoDenuncia, onSaved, onCancel,
}: {
  idExpediente: number;
  editando: any | null;
  tiposAud: any[];
  salasAud: any[];
  conformaciones: any[];
  estadoDenuncia: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [crear]            = useMutation(CREAR_AUDIENCIA);
  const [actualizar]       = useMutation(ACTUALIZAR_AUDIENCIA);
  const [enviarCitaciones] = useMutation(ENVIAR_CITACIONES_AUDIENCIA);

  const [form, setForm] = useState(
    editando ? {
      idTipoAudiencia:    editando.idTipoAudiencia?.idTipoAudiencia ?? 0,
      tipoLabel:          editando.idTipoAudiencia?.nombre ?? "",
      idSalaAud:          editando.idSalaAud?.idSalaAud ?? 0,
      salaLabel:          editando.idSalaAud?.nombreSala ?? "",
      fechaHoraProgramada: editando.fechaHoraProgramada?.slice(0, 16) ?? "",
      linkVideoconferencia: editando.linkVideoconferencia ?? "",
      estadoAudiencia:    editando.estadoAudiencia ?? "PROGRAMADA",
      motivoSuspension:   editando.motivoSuspension ?? "",
      fechaHoraInicio:    editando.fechaHoraInicio?.slice(0, 16) ?? "",
      fechaHoraFin:       editando.fechaHoraFin?.slice(0, 16) ?? "",
    } : { ...INIT_AUD }
  );

  const [err, setErr]       = useState("");
  const [saving, setSaving] = useState(false);
  const [modal, setModal]   = useState<"tipo" | "sala" | null>(null);

  const opcionesTipo: OpcionModal[] = tiposAud.map((t: any) => ({
    id: t.idTipoAudiencia,
    titulo: t.nombre,
    extra: `${t.duracionEstimada} min`,
  }));
  const opcionesSala: OpcionModal[] = salasAud.map((s: any) => ({
    id: s.idSalaAud,
    titulo: s.nombreSala,
    subtitulo: `Cap. ${s.capacidad}`,
    extra: s.equipadaVideoconf ? "📹 Videoconferencia" : undefined,
  }));

  const set = (k: string) => (e: React.ChangeEvent<any>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const guardar = async () => {
    // Validar campos obligatorios
    if (!form.idTipoAudiencia || !form.fechaHoraProgramada) {
      setErr("Tipo y fecha son obligatorios."); return;
    }

    // Validar que la fecha no sea en el pasado
    const fechaSeleccionada = new Date(form.fechaHoraProgramada);
    const ahora = new Date();
    if (fechaSeleccionada < ahora) {
      setErr("La fecha y hora no puede ser en el pasado."); return;
    }

    // Advertencia de plazo: Declaración Informativa debería programarse
    // dentro de los 10 días hábiles desde hoy (Art. 58 inc. a)
    const tipoSeleccionado = tiposAud.find(t => t.idTipoAudiencia === form.idTipoAudiencia);
    if (
      tipoSeleccionado?.nombre?.toLowerCase().includes("declaraci") ||
      tipoSeleccionado?.nombre?.toLowerCase().includes("informativa")
    ) {
      // calcular 10 días hábiles desde hoy
      let diasHabiles = 0;
      const cursor = new Date();
      while (diasHabiles < 10) {
        cursor.setDate(cursor.getDate() + 1);
        const dow = cursor.getDay();
        if (dow !== 0 && dow !== 6) diasHabiles++;
      }
      if (fechaSeleccionada > cursor) {
        setErr(
          `⚠ La Declaración Informativa debería programarse dentro de los 10 días hábiles ` +
          `(Art. 58 inc. a). La fecha seleccionada supera ese plazo. ` +
          `Si igual querés continuar, hacé click en Guardar nuevamente.`
        );
        // Solo advertencia, no bloqueamos — segundo click pasa igual
        // Para eso usamos un flag
        if (!err.includes("hacé click")) return;
      }
    }

    setSaving(true); setErr("");
    try {
      let idAudienciaCreada: number | null = null;

      if (editando) {
        await actualizar({
          variables: {
            id: Number(editando.idAudiencia),
            input: {
              idTipoAudiencia:      Number(form.idTipoAudiencia) || undefined,
              idSalaAud:            Number(form.idSalaAud) || undefined,
              fechaHoraProgramada:  form.fechaHoraProgramada,
              estadoAudiencia:      form.estadoAudiencia || undefined,
              motivoSuspension:     form.motivoSuspension || undefined,
              linkVideoconferencia: form.linkVideoconferencia || undefined,
              fechaHoraInicio:      form.fechaHoraInicio || undefined,
              fechaHoraFin:         form.fechaHoraFin || undefined,
            },
          },
        });
      } else {
        const { data } = await crear({
          variables: {
            input: {
              idExpediente:         Number(idExpediente),
              idTipoAudiencia:      Number(form.idTipoAudiencia),
              fechaHoraProgramada:  form.fechaHoraProgramada,
              idSalaAud:            Number(form.idSalaAud) || undefined,
              linkVideoconferencia: form.linkVideoconferencia || undefined,
            },
          },
        });
        idAudienciaCreada = data?.crearAudiencia?.audiencia?.idAudiencia ?? null;

        // Enviar citaciones automáticamente al crear (solo si hay partes)
        if (idAudienciaCreada) {
          try {
            await enviarCitaciones({
              variables: { idAudiencia: Number(idAudienciaCreada) },
            });
          } catch {
            // No bloqueamos si falla el email — la audiencia ya fue guardada
          }
        }
      }
      onSaved();
    } catch (e: any) {
      setErr(e.message ?? "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  // Si no hay vocales asignados, bloquear el form
  if (!editando && conformaciones.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-amber-200 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-900/10 p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shrink-0 mt-0.5">
            <AlertCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
              No hay vocales asignados a este proceso
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1 leading-relaxed">
              Según el Reglamento (Art. 27), el Tribunal debe estar conformado antes de programar 
              audiencias. Asigná al menos un vocal en el tab <strong>Vocales</strong> antes de 
              continuar.
            </p>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 text-sm font-medium hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Contenedor del formulario */}
      <div className="rounded-2xl border-2 border-blue-200 dark:border-blue-800/60 bg-blue-50/60 dark:bg-blue-900/10 p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <p className="text-sm font-bold text-gray-800 dark:text-white">
              {editando ? "Editar audiencia" : "Programar audiencia"}
            </p>
          </div>
          <button
            onClick={onCancel} disabled={saving}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Campos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Tipo de audiencia */}
          <div>
            <label className={labelCls}>Tipo de audiencia <span className="text-red-500">*</span></label>
            {form.tipoLabel ? (
              <div className="flex items-center gap-2 p-2.5 rounded-xl border bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
                <span className="flex-1 text-sm text-gray-800 dark:text-white truncate">{form.tipoLabel}</span>
                <button type="button" onClick={() => setForm(p => ({ ...p, idTipoAudiencia: 0, tipoLabel: "" }))}
                  className="p-1 rounded-lg text-gray-500 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setModal("tipo")}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 transition-all">
                <Search className="w-4 h-4" /> Buscar tipo de audiencia
              </button>
            )}
          </div>

          {/* Fecha y hora */}
          <div>
            <label className={labelCls}>Fecha y hora <span className="text-red-500">*</span></label>
            <input type="datetime-local" value={form.fechaHoraProgramada}
              onChange={set("fechaHoraProgramada")} className={inputCls} disabled={saving} />
          </div>

          {/* Sala */}
          <div>
            <label className={labelCls}>Sala</label>
            {form.salaLabel ? (
              <div className="flex items-center gap-2 p-2.5 rounded-xl border bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
                <span className="flex-1 text-sm text-gray-800 dark:text-white truncate">{form.salaLabel}</span>
                <button type="button" onClick={() => setForm(p => ({ ...p, idSalaAud: 0, salaLabel: "" }))}
                  className="p-1 rounded-lg text-gray-500 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setModal("sala")}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 transition-all">
                <Search className="w-4 h-4" /> Buscar sala
              </button>
            )}
          </div>

          {/* Link videoconferencia */}
          <div>
            <label className={labelCls}>Link videoconf.</label>
            <input type="url" placeholder="https://meet.google.com/..."
              value={form.linkVideoconferencia} onChange={set("linkVideoconferencia")}
              className={inputCls} disabled={saving} />
          </div>

          {/* Estado (solo al editar) */}
          {editando && (
            <div>
              <label className={labelCls}>Estado</label>
              <select value={form.estadoAudiencia} onChange={set("estadoAudiencia")}
                className={inputCls} disabled={saving}>
                <option value="PROGRAMADA">Programada</option>
                <option value="EN_CURSO">En curso</option>
                <option value="REALIZADA">Realizada</option>
                <option value="SUSPENDIDA">Suspendida</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>
          )}

          {editando && (form.estadoAudiencia === "EN_CURSO" || form.estadoAudiencia === "REALIZADA") && (
            <div>
              <label className={labelCls}>Hora de inicio</label>
              <input type="datetime-local" value={form.fechaHoraInicio}
                onChange={set("fechaHoraInicio")} className={inputCls} disabled={saving} />
            </div>
          )}

          {editando && form.estadoAudiencia === "REALIZADA" && (
            <div>
              <label className={labelCls}>Hora de fin</label>
              <input type="datetime-local" value={form.fechaHoraFin}
                onChange={set("fechaHoraFin")} className={inputCls} disabled={saving} />
            </div>
          )}

          {editando && form.estadoAudiencia === "SUSPENDIDA" && (
            <div className="sm:col-span-2">
              <label className={labelCls}>Motivo suspensión</label>
              <textarea rows={2} value={form.motivoSuspension}
                onChange={set("motivoSuspension")}
                className={`${inputCls} resize-none`} disabled={saving} />
            </div>
          )}
        </div>

        {/* Error */}
        {err && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />{err}
          </div>
        )}

        {/* Botones */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button onClick={onCancel} disabled={saving}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-40">
            <X className="w-4 h-4" /> Cancelar
          </button>
          <button onClick={guardar} disabled={saving}
            className="px-4 py-2 rounded-xl bg-blue-500 hover:opacity-90 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>

      {/* Modales buscador */}
      {modal === "tipo" && (
        <BuscadorModal
          titulo="Seleccionar tipo de audiencia"
          placeholder="Buscar por nombre..."
          opciones={opcionesTipo}
          loading={false}
          onSelect={(id, label) => setForm(p => ({ ...p, idTipoAudiencia: id, tipoLabel: label }))}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "sala" && (
        <BuscadorModal
          titulo="Seleccionar sala"
          placeholder="Buscar por nombre o capacidad..."
          opciones={opcionesSala}
          loading={false}
          onSelect={(id, label) => {
            const sala = salasAud.find((s: any) => s.idSalaAud === id);
            setForm(p => ({
              ...p,
              idSalaAud: id,
              salaLabel: label,
              linkVideoconferencia: sala?.enlaceVirtual || p.linkVideoconferencia,
            }));
          }}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MODAL CITACIONES DENUNCIA
// ══════════════════════════════════════════════════════════════════════════
export function ModalCitacionesDenuncia({
  audiencia, partes, onClose,
}: {
  audiencia: any;
  partes: any[];
  onClose: () => void;
}) {
  const [enviarCitaciones] = useMutation(ENVIAR_CITACIONES_AUDIENCIA);
  const [enviando, setEnviando]   = useState(false);
  const [resultado, setResultado] = useState<any | null>(null);

  const partesConEmail  = partes.filter((p: any) =>
    p.idPersona?.contactos?.some((c: any) => c.tipoContacto?.toLowerCase() === "email")
  );
  const partesSinEmail = partes.filter((p: any) =>
    !p.idPersona?.contactos?.some((c: any) => c.tipoContacto?.toLowerCase() === "email")
  );

  const confirmar = async () => {
    setEnviando(true);
    try {
      const { data } = await enviarCitaciones({
        variables: { idAudiencia: Number(audiencia.idAudiencia) },
      });
      setResultado(data?.enviarCitacionesAudiencia);
    } catch (e: any) {
      setResultado({ ok: false, mensaje: e.message ?? "Error al enviar." });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={!enviando ? onClose : undefined}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <Send className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-white">Enviar Citaciones</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {audiencia.idTipoAudiencia?.nombre} · {fmtFechaHora(audiencia.fechaHoraProgramada)}
              </p>
            </div>
          </div>
          {!enviando && (
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {!resultado ? (
            <>
              {partesConEmail.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                    Recibirán citación ({partesConEmail.length})
                  </p>
                  <div className="space-y-2">
                    {partesConEmail.map((p: any) => {
                      const email = p.idPersona?.contactos?.find(
                        (c: any) => c.tipoContacto?.toLowerCase() === "email"
                      )?.valor;
                      return (
                        <div key={p.idParte}
                          className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50">
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                              {p.idPersona?.nombre} {p.idPersona?.primerApellido}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {p.idRol?.nombreRol} · {email}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {partesSinEmail.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                    Sin email registrado ({partesSinEmail.length})
                  </p>
                  <div className="space-y-2">
                    {partesSinEmail.map((p: any) => (
                      <div key={p.idParte}
                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700">
                        <AlertCircle className="w-4 h-4 text-gray-400 shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {p.idPersona?.nombre} {p.idPersona?.primerApellido}
                          </p>
                          <p className="text-xs text-gray-400">{p.idRol?.nombreRol} · Sin email</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {partesConEmail.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <AlertCircle className="w-10 h-10 text-amber-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                    Ninguna parte tiene email registrado
                  </p>
                  <p className="text-xs text-gray-400">
                    Registrá los contactos de las partes antes de enviar citaciones.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              {resultado.ok
                ? <CheckCircle className="w-12 h-12 text-emerald-500" />
                : <AlertCircle className="w-12 h-12 text-amber-400" />
              }
              <p className="text-sm font-semibold text-gray-800 dark:text-white">{resultado.mensaje}</p>
              {resultado.destinatarios?.length > 0 && (
                <div className="w-full text-left space-y-1">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Enviados a:</p>
                  {resultado.destinatarios.map((d: string) => (
                    <p key={d} className="text-xs text-gray-600 dark:text-gray-300">✓ {d}</p>
                  ))}
                </div>
              )}
              {resultado.sinEmail?.length > 0 && (
                <div className="w-full text-left space-y-1">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sin email (no enviados):</p>
                  {resultado.sinEmail.map((d: string) => (
                    <p key={d} className="text-xs text-gray-400">✗ {d}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex gap-2">
          {!resultado ? (
            <>
              <button onClick={onClose} disabled={enviando}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm font-medium transition-colors disabled:opacity-40">
                Cancelar
              </button>
              <button onClick={confirmar} disabled={enviando || partesConEmail.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors">
                {enviando
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                  : <><Send className="w-4 h-4" /> Enviar {partesConEmail.length} citación{partesConEmail.length !== 1 ? "es" : ""}</>
                }
              </button>
            </>
          ) : (
            <button onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors">
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MODAL ASISTENCIA DENUNCIA
// ══════════════════════════════════════════════════════════════════════════
type EstadoAsistencia = "PRESENTE" | "AUSENTE" | "JUSTIFICADO" | null;
interface RegistroLocal {
  idPersona: number;
  nombre: string;
  rolEnAudiencia: string;
  estado: EstadoAsistencia;
  motivoInasistencia: string;
}




// ══════════════════════════════════════════════════════════════════════════
// ASISTENCIA INLINE — se muestra dentro de la tarjeta de audiencia
// ══════════════════════════════════════════════════════════════════════════
type EstadoAsist = "PRESENTE" | "AUSENTE" | "JUSTIFICADO" | null;

export function AsistenciaInlineAudiencia({
  audiencia,
  partes,
}: {
  audiencia: any;
  partes: any[];
}) {
  const { data, loading, refetch } = useQuery(GET_ASISTENCIAS_AUDIENCIA, {
    variables: { idAudiencia: Number(audiencia.idAudiencia) },
    fetchPolicy: "cache-and-network",
  });
  const [registrarBatch] = useMutation(REGISTRAR_ASISTENCIA_BATCH);

  const asistenciasGuardadas: any[] = data?.asistenciasPorAudiencia ?? [];
  const hayDatos = asistenciasGuardadas.length > 0;

  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [registros, setRegistros] = useState<
    { idPersona: number; nombre: string; rol: string; estado: EstadoAsist; motivo: string }[]
  >([]);
  
  useEffect(() => {
    if (!loading) {
      setRegistros(
        partes.map((p: any) => {
          const g = asistenciasGuardadas.find(
            (a: any) => a.idPersona?.idPersona === p.idPersona?.idPersona
          );
          let estado: EstadoAsist = null;
          if (g) {
            if (g.asistio) estado = "PRESENTE";
            else if (g.motivoInasistencia?.toLowerCase().includes("justif")) estado = "JUSTIFICADO";
            else estado = "AUSENTE";
          }
          return {
            idPersona: Number(p.idPersona?.idPersona),
            nombre: `${p.idPersona?.nombre} ${p.idPersona?.primerApellido}`,
            rol: p.idRol?.nombreRol ?? "Parte procesal",
            estado,
            motivo: g?.motivoInasistencia ?? "",
          };
        })
      );
    }
  }, [loading, data]);

  const setEstado = (idPersona: number, estado: EstadoAsist) =>
    setRegistros(prev => prev.map(r => r.idPersona === idPersona ? { ...r, estado } : r));
  const setMotivo = (idPersona: number, motivo: string) =>
    setRegistros(prev => prev.map(r => r.idPersona === idPersona ? { ...r, motivo } : r));

  const guardar = async () => {
    if (registros.some(r => r.estado === null)) return;
    setGuardando(true);
    try {
      await registrarBatch({
        variables: {
          idAudiencia: Number(audiencia.idAudiencia),
          registros: registros.map(r => ({
            idPersona: r.idPersona,
            rolEnAudiencia: r.rol,
            estado: r.estado,
            motivoInasistencia: r.motivo || null,
          })),
        },
      });
      await refetch();
      setEditando(false);
    } catch (e) {
      console.error(e);
    } finally {
      setGuardando(false);
    }
  };

  if (loading) return null;
  if (partes.length === 0) return null;

  const colores: Record<string, string> = {
    PRESENTE:    "bg-emerald-500",
    AUSENTE:     "bg-red-500",
    JUSTIFICADO: "bg-amber-500",
  };

  return (
    <div className="border-t border-gray-200 dark:border-slate-700 pt-3 mt-1">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" /> Asistencia
          {hayDatos && !editando && (
            <span className="ml-1 flex gap-1">
              {registros.map(r => r.estado && (
                <span key={r.idPersona} className={`w-2 h-2 rounded-full inline-block ${colores[r.estado]}`} title={`${r.nombre}: ${r.estado}`} />
              ))}
            </span>
          )}
        </p>
        {!editando && (
          <button
            onClick={() => setEditando(true)}
            className="text-xs text-indigo-500 hover:text-indigo-700 font-medium flex items-center gap-1"
          >
            <Edit2 className="w-3 h-3" />
            {hayDatos ? "Editar" : "Registrar"}
          </button>
        )}
      </div>

      {!editando && hayDatos && (
        <div className="flex flex-wrap gap-2">
          {registros.map(r => (
            <div key={r.idPersona} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full shrink-0 ${r.estado ? colores[r.estado] : "bg-gray-300"}`} />
              <span className="text-xs text-gray-600 dark:text-gray-300">{r.nombre}</span>
              {r.estado && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full text-white ${colores[r.estado]}`}>
                  {r.estado === "PRESENTE" ? "Presente" : r.estado === "AUSENTE" ? "Ausente" : "Justificado"}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {editando && (
        <div className="space-y-2">
          {registros.map(r => (
            <div key={r.idPersona} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 flex-1 truncate">{r.nombre}</span>
                <div className="flex gap-1">
                  {(["PRESENTE", "AUSENTE", "JUSTIFICADO"] as EstadoAsist[]).map(est => (
                    <button
                      key={est}
                      onClick={() => setEstado(r.idPersona, est)}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                        r.estado === est
                          ? `${colores[est!]} text-white`
                          : "bg-gray-100 dark:bg-slate-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600"
                      }`}
                    >
                      {est === "PRESENTE" ? "Presente" : est === "AUSENTE" ? "Ausente" : "Justif."}
                    </button>
                  ))}
                </div>
              </div>
              {(r.estado === "AUSENTE" || r.estado === "JUSTIFICADO") && (
                <input
                  type="text"
                  placeholder="Motivo (opcional)..."
                  value={r.motivo}
                  onChange={e => setMotivo(r.idPersona, e.target.value)}
                  className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-xs text-gray-700 dark:text-gray-300 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              )}
            </div>
          ))}
          <div className="flex gap-2 justify-end pt-1">
            <button
              onClick={() => setEditando(false)}
              disabled={guardando}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 text-xs font-medium hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={guardando || registros.some(r => r.estado === null)}
              className="px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center gap-1"
            >
              {guardando ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


export function ModalAsistenciaDenuncia({
  audiencia, partes, onClose,
}: {
  audiencia: any;
  partes: any[];
  onClose: () => void;
}) {
  const { data: dataExistente, loading: loadingExistente } = useQuery(GET_ASISTENCIAS_AUDIENCIA, {
    variables: { idAudiencia: Number(audiencia.idAudiencia) },
    fetchPolicy: "network-only",
  });
  const [registrarBatch] = useMutation(REGISTRAR_ASISTENCIA_BATCH);

  const [guardando, setGuardando]     = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [yaGuardado, setYaGuardado]   = useState(false);
  const [mensajeOk, setMensajeOk]     = useState("");
  const [registros, setRegistros]     = useState<RegistroLocal[]>([]);

  useEffect(() => {
    if (!loadingExistente) {
      const asistenciasGuardadas: any[] = dataExistente?.asistenciasPorAudiencia ?? [];
      const hayDatos = asistenciasGuardadas.length > 0;
      setYaGuardado(hayDatos);
      setModoEdicion(!hayDatos);

      const iniciales: RegistroLocal[] = partes.map((p: any) => {
        const guardado = asistenciasGuardadas.find(
          (a: any) => a.idPersona?.idPersona === p.idPersona?.idPersona
        );
        let estado: EstadoAsistencia = null;
        if (guardado) {
          if (guardado.asistio) estado = "PRESENTE";
          else if (guardado.motivoInasistencia?.toLowerCase().includes("justif")) estado = "JUSTIFICADO";
          else estado = "AUSENTE";
        }
        return {
          idPersona: Number(p.idPersona?.idPersona),
          nombre: `${p.idPersona?.nombre} ${p.idPersona?.primerApellido}`,
          rolEnAudiencia: p.idRol?.nombreRol ?? "Parte procesal",
          estado,
          motivoInasistencia: guardado?.motivoInasistencia ?? "",
        };
      });
      setRegistros(iniciales);
    }
  }, [loadingExistente, dataExistente]);

  const setEstado = (idPersona: number, estado: EstadoAsistencia) =>
    setRegistros(prev => prev.map(r => r.idPersona === idPersona ? { ...r, estado } : r));
  const setMotivo = (idPersona: number, motivo: string) =>
    setRegistros(prev => prev.map(r => r.idPersona === idPersona ? { ...r, motivoInasistencia: motivo } : r));

  const todosMarcados = registros.every(r => r.estado !== null);

  const guardar = async () => {
    if (!todosMarcados) return;
    setGuardando(true);
    try {
      const { data } = await registrarBatch({
        variables: {
          idAudiencia: Number(audiencia.idAudiencia),
          registros: registros.map(r => ({
            idPersona: Number(r.idPersona),
            rolEnAudiencia: r.rolEnAudiencia,
            estado: r.estado,
            motivoInasistencia: r.motivoInasistencia || null,
          })),
        },
      });
      if (data?.registrarAsistenciaBatch?.ok) {
        setYaGuardado(true);
        setModoEdicion(false);
        setMensajeOk(data.registrarAsistenciaBatch.mensaje);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setGuardando(false);
    }
  };

  const estadoConfig = {
    PRESENTE:    { label: "Presente",    bgActivo: "bg-emerald-500 ring-2 ring-emerald-300 dark:ring-emerald-700 text-white", bgInactivo: "bg-gray-100 dark:bg-slate-700 text-gray-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/30" },
    AUSENTE:     { label: "Ausente",     bgActivo: "bg-red-500 ring-2 ring-red-300 dark:ring-red-700 text-white",             bgInactivo: "bg-gray-100 dark:bg-slate-700 text-gray-500 hover:bg-red-100 dark:hover:bg-red-900/30" },
    JUSTIFICADO: { label: "Justificado", bgActivo: "bg-amber-500 ring-2 ring-amber-300 dark:ring-amber-700 text-white",       bgInactivo: "bg-gray-100 dark:bg-slate-700 text-gray-500 hover:bg-amber-100 dark:hover:bg-amber-900/30" },
  };

  const presentes    = registros.filter(r => r.estado === "PRESENTE").length;
  const ausentes     = registros.filter(r => r.estado === "AUSENTE").length;
  const justificados = registros.filter(r => r.estado === "JUSTIFICADO").length;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={!guardando ? onClose : undefined}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-lg flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-white">
                {yaGuardado && !modoEdicion ? "Ver asistencia" : "Tomar asistencia"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {audiencia.idTipoAudiencia?.nombre} · {new Date(audiencia.fechaHoraProgramada).toLocaleDateString("es-BO")}
              </p>
            </div>
          </div>
          {!guardando && (
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Resumen asistencia */}
        {registros.some(r => r.estado !== null) && (
          <div className="flex-shrink-0 px-6 py-3 border-b border-gray-200 dark:border-slate-700 flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{presentes} presentes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{ausentes} ausentes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{justificados} justificados</span>
            </div>
          </div>
        )}

        {/* Lista partes */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {loadingExistente ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            </div>
          ) : registros.length === 0 ? (
            <div className="text-center py-10 text-gray-400 dark:text-gray-500">
              <Users className="w-10 h-10 mx-auto mb-2" />
              <p className="text-sm">No hay partes procesales activas</p>
            </div>
          ) : (
            registros.map(r => (
              <div key={r.idPersona}
                className="p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {r.nombre.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{r.nombre}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{r.rolEnAudiencia}</p>
                  </div>
                </div>

                {modoEdicion ? (
                  <div className="flex gap-2">
                    {(["PRESENTE", "AUSENTE", "JUSTIFICADO"] as EstadoAsistencia[]).map(est => {
                      const cfg = estadoConfig[est!];
                      const activo = r.estado === est;
                      return (
                        <button key={est} onClick={() => setEstado(r.idPersona, est)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${activo ? cfg.bgActivo : cfg.bgInactivo}`}>
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {r.estado && (
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                        r.estado === "PRESENTE" ? "bg-emerald-500" :
                        r.estado === "AUSENTE"  ? "bg-red-500" : "bg-amber-500"
                      }`}>
                        {estadoConfig[r.estado].label}
                      </span>
                    )}
                    {r.motivoInasistencia && r.estado !== "PRESENTE" && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{r.motivoInasistencia}</span>
                    )}
                  </div>
                )}

                {modoEdicion && (r.estado === "AUSENTE" || r.estado === "JUSTIFICADO") && (
                  <input type="text"
                    placeholder={r.estado === "JUSTIFICADO" ? "Motivo de justificación (opcional)..." : "Motivo de inasistencia (opcional)..."}
                    value={r.motivoInasistencia}
                    onChange={e => setMotivo(r.idPersona, e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-gray-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  />
                )}
              </div>
            ))
          )}

          {mensajeOk && !modoEdicion && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" />{mensajeOk}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex gap-2">
          {modoEdicion ? (
            <>
              <button
                onClick={yaGuardado ? () => setModoEdicion(false) : onClose}
                disabled={guardando}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm font-medium transition-colors disabled:opacity-40">
                Cancelar
              </button>
              <button onClick={guardar} disabled={guardando || !todosMarcados}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors">
                {guardando
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                  : <><Save className="w-4 h-4" /> Guardar asistencia</>
                }
              </button>
            </>
          ) : (
            <>
              <button onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm font-medium transition-colors">
                Cerrar
              </button>
              <button onClick={() => setModoEdicion(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors">
                <Edit2 className="w-4 h-4" /> Editar asistencia
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
