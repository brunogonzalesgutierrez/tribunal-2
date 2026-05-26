import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_NOTIFICACIONES,
  GET_EXPEDIENTES_SIMPLE,
  GET_DOCUMENTOS,
  GET_PARTES_PROCESALES,
  CREAR_NOTIFICACION,
  ACTUALIZAR_NOTIFICACION,
  ELIMINAR_NOTIFICACION,
} from "../../graphql/documento";
import { Bell, Plus, Edit, Trash2, Clock, CheckCircle, XCircle } from "lucide-react";
import {
  Notificacion, Expediente, Documento, ParteProcesal,
  fmtFechaHora,
  EstadoNotifBadge, TipoNotifBadge,
  Modal, Field, SelectField, ErrorBox, ModalFooter,
  StatCard, TablaDesktop, ActionBtns, SearchBar,
} from "./shared";
import { useAuth } from "../../context/AuthContext"; // ← Importar hook de autenticación

const TIPO_NOTIF_OPTS = [
  { value: "CEDULA",      label: "Cédula" },
  { value: "ELECTRONICA", label: "Electrónica" },
  { value: "PERSONAL",    label: "Personal" },
  { value: "PUERTA",      label: "Puerta" },
];

const ESTADO_NOTIF_OPTS = [
  { value: "PENDIENTE",    label: "Pendiente" },
  { value: "DILIGENCIADA", label: "Diligenciada" },
  { value: "FALLIDA",      label: "Fallida" },
];

const initForm = {
  idExpediente:      "",
  idDocumento:       "",
  idParte:           "",
  tipoNotificacion:  "",
  estadoNotificacion: "PENDIENTE",
  fechaDiligencia:   "",
};

export default function NotificacionesPage() {
  const { usuario } = useAuth(); // ← Obtener usuario actual
  
  const { data, loading, refetch } = useQuery(GET_NOTIFICACIONES);
  const { data: dataExp }          = useQuery(GET_EXPEDIENTES_SIMPLE);
  const { data: dataDoc }          = useQuery(GET_DOCUMENTOS);
  const { data: dataParte }        = useQuery(GET_PARTES_PROCESALES);
  const [crearNotificacion]      = useMutation(CREAR_NOTIFICACION);
  const [actualizarNotificacion] = useMutation(ACTUALIZAR_NOTIFICACION);
  const [eliminarNotificacion]   = useMutation(ELIMINAR_NOTIFICACION);

  const [modal, setModal]   = useState(false);
  const [editando, setEdit] = useState<Notificacion | null>(null);
  const [form, setForm]     = useState(initForm);
  const [busqueda, setBusq] = useState("");
  const [err, setErr]       = useState("");

  const notificaciones: Notificacion[] = data?.allNotificaciones ?? [];
  const expedientes: Expediente[]      = dataExp?.allExpedientes ?? [];
  const documentos: Documento[]        = dataDoc?.allDocumentos ?? [];
  const partes: ParteProcesal[]        = dataParte?.allPartesProcesales ?? [];

  // Filtros dependientes del expediente seleccionado
  const partesDelExp = form.idExpediente
    ? partes.filter(p => String(p.idExpediente?.idExpediente) === form.idExpediente)
    : partes;

  const docsDelExp = form.idExpediente
    ? documentos.filter(d => String(d.idExpediente?.idExpediente) === form.idExpediente)
    : documentos;

  const filtrados = notificaciones.filter(n =>
    `${n.idExpediente?.numeroExpediente ?? ""} ${n.tipoNotificacion} ${n.estadoNotificacion} ${n.idParte?.idPersona?.nombre ?? ""} ${n.idParte?.idPersona?.primerApellido ?? ""}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  // Stats
  const pendientes    = notificaciones.filter(n => n.estadoNotificacion === "PENDIENTE").length;
  const diligenciadas = notificaciones.filter(n => n.estadoNotificacion === "DILIGENCIADA").length;
  const fallidas      = notificaciones.filter(n => n.estadoNotificacion === "FALLIDA").length;

  const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const abrirCrear = () => { setEdit(null); setForm(initForm); setErr(""); setModal(true); };
  const abrirEditar = (n: Notificacion) => {
    setEdit(n);
    setForm({
      idExpediente:      String(n.idExpediente?.idExpediente ?? ""),
      idDocumento:       String(n.idDocumento?.idDocumento ?? ""),
      idParte:           String(n.idParte?.idParte ?? ""),
      tipoNotificacion:  n.tipoNotificacion,
      estadoNotificacion: n.estadoNotificacion,
      fechaDiligencia:   n.fechaDiligencia ? n.fechaDiligencia.substring(0, 16) : "",
    });
    setErr(""); setModal(true);
  };

  const guardar = async () => {
    if (!editando && (!form.idExpediente || !form.idDocumento || !form.idParte || !form.tipoNotificacion)) {
      setErr("Todos los campos marcados son obligatorios."); 
      return;
    }
    try {
      if (editando) {
        await actualizarNotificacion({
          variables: {
            id: Number(editando.idNotificacion),
            input: {
              estadoNotificacion: form.estadoNotificacion,
              fechaDiligencia:    form.fechaDiligencia || undefined,
            },
          },
        });
      } else {
        // ✅ Usar el ID del usuario actual automáticamente
        if (!usuario?.idUsuario) {
          setErr("No se ha encontrado el usuario actual."); 
          return;
        }
        
        await crearNotificacion({
          variables: {
            idExpediente:     Number(form.idExpediente),
            idDocumento:      Number(form.idDocumento),
            idParte:          Number(form.idParte),
            idUsuario:        Number(usuario.idUsuario), // ← Usuario actual
            tipoNotificacion: form.tipoNotificacion,
          },
        });
      }
      await refetch(); 
      setModal(false);
    } catch (e: any) { 
      setErr(e.message ?? "Error."); 
    }
  };

  const eliminar = async (n: Notificacion) => {
    if (!window.confirm("¿Eliminar esta notificación?")) return;
    const { data } = await eliminarNotificacion({ variables: { id: Number(n.idNotificacion) } });
    if (!data?.eliminarNotificacion?.ok) {
      alert(data?.eliminarNotificacion?.mensaje ?? "No se pudo eliminar."); 
      return;
    }
    refetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Bell className="w-7 h-7 text-amber-500" />
            Notificaciones
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Notificaciones judiciales • {notificaciones.length} registros
          </p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-sm shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> Nueva notificación
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Pendientes" value={pendientes} color="text-amber-600 dark:text-amber-400"
          icon={<Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />} sub="Esperando diligencia" />
        <StatCard label="Diligenciadas" value={diligenciadas} color="text-emerald-600 dark:text-emerald-400"
          icon={<CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
          sub={`${Math.round((diligenciadas / (notificaciones.length || 1)) * 100)}% completadas`} />
        <StatCard label="Fallidas" value={fallidas} color="text-red-600 dark:text-red-400"
          icon={<XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />} sub="Requieren atención" />
      </div>

      {/* Barra de búsqueda */}
      <div className="flex justify-between items-center">
        <SearchBar value={busqueda} onChange={setBusq} placeholder="Buscar por expediente, tipo, estado..." />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla Desktop */}
      <TablaDesktop
        headers={["Expediente", "Documento", "Parte", "Tipo", "Estado", "Emitida", "Diligenciada", "Acciones"]}
        loading={loading}
        emptyMsg="No hay notificaciones registradas"
        emptyIcon={<Bell className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
      >
        {filtrados.map(n => (
          <tr key={n.idNotificacion} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td className="px-6 py-4">
              <span className="text-blue-500 font-bold font-mono text-sm">
                #{n.idExpediente?.numeroExpediente ?? "—"}
              </span>
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-[150px] truncate">
              {n.idDocumento?.titulo ?? "—"}
            </td>
            <td className="px-6 py-4">
              <span className="text-sm text-gray-700 dark:text-gray-200">
                {n.idParte?.idPersona
                  ? `${n.idParte.idPersona.nombre} ${n.idParte.idPersona.primerApellido}`
                  : "—"}
              </span>
              {n.idParte?.idRol && (
                <div className="text-xs text-gray-400 mt-0.5">{n.idParte.idRol.nombreRol}</div>
              )}
            </td>
            <td className="px-6 py-4">
              <TipoNotifBadge tipo={n.tipoNotificacion} />
            </td>
            <td className="px-6 py-4">
              <EstadoNotifBadge estado={n.estadoNotificacion} />
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">
              {fmtFechaHora(n.fechaEmision)}
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">
              {fmtFechaHora(n.fechaDiligencia)}
            </td>
            <td className="px-6 py-4">
              <ActionBtns onEdit={() => abrirEditar(n)} onDelete={() => eliminar(n)} />
            </td>
          </tr>
        ))}
      </TablaDesktop>

      {/* Cards Móvil */}
      <div className="lg:hidden space-y-3">
        {filtrados.map(n => (
          <div key={n.idNotificacion} className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-blue-500 font-mono font-bold text-sm">
                  #{n.idExpediente?.numeroExpediente ?? "—"}
                </span>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                  {n.idParte?.idPersona
                    ? `${n.idParte.idPersona.nombre} ${n.idParte.idPersona.primerApellido}`
                    : "—"}
                </p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => abrirEditar(n)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => eliminar(n)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex gap-2">
                <TipoNotifBadge tipo={n.tipoNotificacion} />
                <EstadoNotifBadge estado={n.estadoNotificacion} />
              </div>
              <span className="text-xs text-gray-400">{fmtFechaHora(n.fechaEmision)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <Modal
          onClose={() => setModal(false)}
          title={editando ? "Editar notificación" : "Nueva notificación"}
          icon={<Bell className="w-5 h-5 text-amber-500" />}
        >
          {!editando ? (
            <>
              <SelectField
                label="Expediente" value={form.idExpediente} required
                onChange={v => setForm(p => ({ ...p, idExpediente: v, idDocumento: "", idParte: "" }))}
              >
                <option value="">— Seleccionar expediente —</option>
                {expedientes.map((e: Expediente) => (
                  <option key={e.idExpediente} value={e.idExpediente}>
                    {e.numeroExpediente} ({e.ano})
                  </option>
                ))}
              </SelectField>
              <SelectField label="Documento" value={form.idDocumento} onChange={f("idDocumento")} required>
                <option value="">— Seleccionar documento —</option>
                {docsDelExp.map((d: Documento) => (
                  <option key={d.idDocumento} value={d.idDocumento}>{d.titulo}</option>
                ))}
              </SelectField>
              <SelectField label="Parte procesal" value={form.idParte} onChange={f("idParte")} required>
                <option value="">— Seleccionar parte —</option>
                {partesDelExp.map((p: ParteProcesal) => (
                  <option key={p.idParte} value={p.idParte}>
                    {p.idPersona.nombre} {p.idPersona.primerApellido} ({p.idRol.nombreRol})
                  </option>
                ))}
              </SelectField>
              {/* ✅ Campo ID Usuario eliminado - se toma automáticamente */}
              <SelectField label="Tipo de notificación" value={form.tipoNotificacion} onChange={f("tipoNotificacion")} required>
                <option value="">— Seleccionar tipo —</option>
                {TIPO_NOTIF_OPTS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </SelectField>
            </>
          ) : (
            <>
              <SelectField label="Estado" value={form.estadoNotificacion} onChange={f("estadoNotificacion")} required>
                {ESTADO_NOTIF_OPTS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </SelectField>
              <Field
                label="Fecha de diligencia" value={form.fechaDiligencia}
                onChange={f("fechaDiligencia")} type="datetime-local"
              />
            </>
          )}
          <ErrorBox msg={err} />
          <ModalFooter
            onCancel={() => setModal(false)} onSave={guardar}
            saveLabel={editando ? "Guardar cambios" : "Crear notificación"}
          />
        </Modal>
      )}
    </div>
  );
}