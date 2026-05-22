import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_AUDIENCIAS,
  GET_TIPOS_AUDIENCIA,
  GET_SALAS_AUDIENCIA,
  GET_EXPEDIENTES_SIMPLE,
} from "../../graphql/audiencias";
import {
  CREAR_AUDIENCIA,
  ACTUALIZAR_AUDIENCIA,
  ELIMINAR_AUDIENCIA,
} from "../../graphql/audiencias";
import {
  Scale, Plus, Search, Edit, Trash2,
  Calendar, DoorOpen, Video, MoreVertical,
  CheckCircle, Circle, AlertCircle,
} from "lucide-react";
import {
  Audiencia, Expediente, TipoAudiencia, SalaAudiencia,
  fmt, EstadoBadge, Modal, Field, SelectField, TextareaField,
  ErrorBox, ModalFooter, StatCard, TablaDesktop, ActionBtns, Paginacion,
} from "./shared";

// ─── CARD MÓVIL ──────────────────────────────────────────
function AudienciaCard({
  a, onEdit, onDelete,
}: {
  a: Audiencia; onEdit: () => void; onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-blue-500 dark:text-blue-400 font-bold">
            #{a.idExpediente.numeroExpediente}
          </span>
          <span className="text-xs text-gray-400 ml-2">{a.idExpediente.ano}</span>
          <p className="text-sm text-gray-700 dark:text-gray-200 font-medium mt-0.5">
            {a.idTipoAudiencia.nombre}
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <MoreVertical className="w-5 h-5 text-gray-500" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg z-10 py-1">
              <button
                onClick={onEdit}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" /> Editar
              </button>
              <button
                onClick={onDelete}
                className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Eliminar
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Calendar className="w-3.5 h-3.5" />
          {fmt(a.fechaHoraProgramada)}
        </div>
        {a.idSalaAud && (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <DoorOpen className="w-3.5 h-3.5" />
            {a.idSalaAud.nombreSala}
          </div>
        )}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
        <EstadoBadge estado={a.estadoAudiencia} />
        {a.linkVideoconferencia && (
          <a
            href={a.linkVideoconferencia}
            target="_blank"
            rel="noreferrer"
            className="text-blue-500 text-xs flex items-center gap-1"
          >
            <Video className="w-3.5 h-3.5" /> Enlace
          </a>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════
export default function AudienciasListPage() {
  const { data, loading, refetch } = useQuery(GET_AUDIENCIAS);
  const { data: dExp }  = useQuery(GET_EXPEDIENTES_SIMPLE);
  const { data: dTipo } = useQuery(GET_TIPOS_AUDIENCIA);
  const { data: dSala } = useQuery(GET_SALAS_AUDIENCIA);

  const [crearAudiencia]      = useMutation(CREAR_AUDIENCIA);
  const [actualizarAudiencia] = useMutation(ACTUALIZAR_AUDIENCIA);
  const [eliminarAudiencia]   = useMutation(ELIMINAR_AUDIENCIA);

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<Audiencia | null>(null);
  const [err, setErr]       = useState("");
  const [busqueda, setBusq] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const initForm = {
    idExpediente: 0, idTipoAudiencia: 0, idSalaAud: 0,
    fechaHoraProgramada: "", linkVideoconferencia: "",
    estadoAudiencia: "PROGRAMADA", motivoSuspension: "",
  };
  const [form, setForm] = useState(initForm);
  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const audiencias: Audiencia[]       = data?.allAudiencias ?? [];
  const expedientes: Expediente[]     = dExp?.allExpedientes ?? [];
  const tipos: TipoAudiencia[]        = dTipo?.allTiposAudiencia ?? [];
  const salas: SalaAudiencia[]        = dSala?.allSalasAudiencia ?? [];

  const filtradas = audiencias.filter(a =>
    `${a.idExpediente.numeroExpediente} ${a.estadoAudiencia} ${a.idTipoAudiencia.nombre}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalPages = Math.ceil(filtradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated  = filtradas.slice(startIndex, startIndex + itemsPerPage);

  const programadas = audiencias.filter(a => a.estadoAudiencia === "PROGRAMADA").length;
  const enCurso     = audiencias.filter(a => a.estadoAudiencia === "EN_CURSO").length;
  const finalizadas = audiencias.filter(a => a.estadoAudiencia === "FINALIZADA").length;
  const suspendidas = audiencias.filter(a => a.estadoAudiencia === "SUSPENDIDA").length;

  const abrirCrear = () => { setEdit(null); setForm(initForm); setErr(""); setModal(true); };
  const abrirEditar = (a: Audiencia) => {
    setEdit(a);
    setForm({
      idExpediente: a.idExpediente.idExpediente,
      idTipoAudiencia: a.idTipoAudiencia.idTipoAudiencia,
      idSalaAud: a.idSalaAud?.idSalaAud ?? 0,
      fechaHoraProgramada: a.fechaHoraProgramada?.slice(0, 16) ?? "",
      linkVideoconferencia: a.linkVideoconferencia ?? "",
      estadoAudiencia: a.estadoAudiencia,
      motivoSuspension: a.motivoSuspension ?? "",
    });
    setErr(""); setModal(true);
  };

  const guardar = async () => {
    if (!form.idExpediente || !form.idTipoAudiencia || !form.fechaHoraProgramada) {
      setErr("Expediente, tipo de audiencia y fecha son obligatorios."); return;
    }
    try {
      if (editando) {
        await actualizarAudiencia({
          variables: {
            id: Number(editando.idAudiencia),
            input: {
              idTipoAudiencia: Number(form.idTipoAudiencia) || undefined,
              idSalaAud: Number(form.idSalaAud) || undefined,
              fechaHoraProgramada: form.fechaHoraProgramada,
              estadoAudiencia: form.estadoAudiencia || undefined,
              motivoSuspension: form.motivoSuspension || undefined,
              linkVideoconferencia: form.linkVideoconferencia || undefined,
            },
          },
        });
      } else {
        await crearAudiencia({
          variables: {
            input: {
              idExpediente: Number(form.idExpediente),
              idTipoAudiencia: Number(form.idTipoAudiencia),
              fechaHoraProgramada: form.fechaHoraProgramada,
              idSalaAud: Number(form.idSalaAud) || undefined,
              linkVideoconferencia: form.linkVideoconferencia || undefined,
            },
          },
        });
      }
      await refetch(); setModal(false);
    } catch (e: any) { setErr(e.message ?? "Error al guardar."); }
  };

  const eliminar = async (a: Audiencia) => {
    if (!window.confirm(`¿Eliminar la audiencia del expediente #${a.idExpediente.numeroExpediente}?`)) return;
    const { data } = await eliminarAudiencia({ variables: { id: Number(a.idAudiencia) } });
    if (!data?.eliminarAudiencia?.ok) {
      alert(data?.eliminarAudiencia?.mensaje ?? "No se pudo eliminar."); return;
    }
    refetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Scale className="w-7 h-7 text-blue-500" />
            Audiencias
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestión de audiencias judiciales • {audiencias.length} registros
          </p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> Nueva audiencia
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Programadas" value={programadas} color="text-blue-600 dark:text-blue-400"
          icon={<Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />} sub="Próximas a realizarse" />
        <StatCard label="En curso" value={enCurso} color="text-emerald-600 dark:text-emerald-400"
          icon={<CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />} sub="Activas ahora mismo" />
        <StatCard label="Finalizadas" value={finalizadas} color="text-gray-600 dark:text-gray-400"
          icon={<Circle className="w-6 h-6 text-gray-500 dark:text-gray-400" />} sub="Completadas" />
        <StatCard label="Suspendidas" value={suspendidas} color="text-amber-600 dark:text-amber-400"
          icon={<AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />} sub="Requieren reprogramación" />
      </div>

      {/* Buscador */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          placeholder="Buscar por expediente, tipo o estado..."
          value={busqueda}
          onChange={e => { setBusq(e.target.value); setCurrentPage(1); }}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
        />
      </div>

      {/* Tabla Desktop */}
      <TablaDesktop
        headers={["Expediente", "Tipo", "Fecha programada", "Sala", "Estado", "Link", "Acciones"]}
        loading={loading}
        emptyMsg="No hay audiencias registradas"
        emptyIcon={<Scale className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
      >
        {paginated.map(a => (
          <tr key={a.idAudiencia} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td className="px-6 py-4">
              <span className="font-bold text-blue-500 dark:text-blue-400">#{a.idExpediente.numeroExpediente}</span>
              <span className="text-xs text-gray-400 ml-2">{a.idExpediente.ano}</span>
            </td>
            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">{a.idTipoAudiencia.nombre}</td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">{fmt(a.fechaHoraProgramada)}</td>
            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
              {a.idSalaAud ? (
                <span className="flex items-center gap-1.5">
                  {a.idSalaAud.nombreSala}
                  {a.idSalaAud.equipadaVideoconf && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                      <Video className="w-3 h-3 inline" />
                    </span>
                  )}
                </span>
              ) : <span className="text-gray-400">—</span>}
            </td>
            <td className="px-6 py-4"><EstadoBadge estado={a.estadoAudiencia} /></td>
            <td className="px-6 py-4">
              {a.linkVideoconferencia ? (
                <a href={a.linkVideoconferencia} target="_blank" rel="noreferrer"
                  className="text-blue-500 text-xs flex items-center gap-1 hover:underline">
                  <Video className="w-3.5 h-3.5" /> Enlace
                </a>
              ) : <span className="text-gray-400 text-sm">—</span>}
            </td>
            <td className="px-6 py-4">
              <ActionBtns onEdit={() => abrirEditar(a)} onDelete={() => eliminar(a)} />
            </td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Cards Móvil */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4 animate-pulse h-36" />
          ))
        ) : paginated.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Scale className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p>No se encontraron audiencias</p>
          </div>
        ) : paginated.map(a => (
          <AudienciaCard key={a.idAudiencia} a={a} onEdit={() => abrirEditar(a)} onDelete={() => eliminar(a)} />
        ))}
      </div>

      {/* Paginación */}
      <Paginacion
        currentPage={currentPage} totalPages={totalPages}
        startIndex={startIndex} total={filtradas.length} itemsPerPage={itemsPerPage}
        onPrev={() => setCurrentPage(p => Math.max(1, p - 1))}
        onNext={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
      />

      {/* Modal */}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title={editando ? "Editar audiencia" : "Nueva audiencia"}
          icon={<Scale className="w-5 h-5 text-blue-500" />}
        >
          {!editando && (
            <SelectField label="Expediente" value={form.idExpediente} onChange={f("idExpediente")} required>
              <option value={0}>— Seleccionar expediente —</option>
              {expedientes.map(e => (
                <option key={e.idExpediente} value={e.idExpediente}>#{e.numeroExpediente} ({e.ano})</option>
              ))}
            </SelectField>
          )}
          <SelectField label="Tipo de audiencia" value={form.idTipoAudiencia} onChange={f("idTipoAudiencia")} required>
            <option value={0}>— Seleccionar tipo —</option>
            {tipos.map(t => (
              <option key={t.idTipoAudiencia} value={t.idTipoAudiencia}>
                {t.nombre} ({t.duracionEstimada} min)
              </option>
            ))}
          </SelectField>
          <Field label="Fecha y hora programada" value={form.fechaHoraProgramada} onChange={f("fechaHoraProgramada")} type="datetime-local" required />
          <SelectField label="Sala de audiencia" value={form.idSalaAud} onChange={f("idSalaAud")}>
            <option value={0}>— Sin sala asignada —</option>
            {salas.filter(s => s.activa).map(s => (
              <option key={s.idSalaAud} value={s.idSalaAud}>{s.nombreSala} (cap. {s.capacidad})</option>
            ))}
          </SelectField>
          <Field label="Link videoconferencia" value={form.linkVideoconferencia} onChange={f("linkVideoconferencia")} placeholder="https://..." />
          {editando && (
            <>
              <SelectField label="Estado" value={form.estadoAudiencia} onChange={f("estadoAudiencia")}>
                <option value="PROGRAMADA">Programada</option>
                <option value="EN_CURSO">En curso</option>
                <option value="FINALIZADA">Finalizada</option>
                <option value="SUSPENDIDA">Suspendida</option>
              </SelectField>
              {form.estadoAudiencia === "SUSPENDIDA" && (
                <TextareaField label="Motivo de suspensión" value={form.motivoSuspension} onChange={f("motivoSuspension")} />
              )}
            </>
          )}
          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)} onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Crear audiencia"}
          />
        </Modal>
      )}
    </div>
  );
}
