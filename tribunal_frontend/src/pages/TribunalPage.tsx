import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_TRIBUNALES, GET_SALAS_TRIBUNAL, GET_VOCALES, GET_PERSONAS,
  GET_CONFORMACIONES, GET_EXPEDIENTES_SIMPLE,
  CREAR_TRIBUNAL, ACTUALIZAR_TRIBUNAL, ELIMINAR_TRIBUNAL,
  CREAR_SALA_TRIBUNAL, ACTUALIZAR_SALA_TRIBUNAL, ELIMINAR_SALA_TRIBUNAL,
  CREAR_VOCAL, ACTUALIZAR_VOCAL, ELIMINAR_VOCAL,
  CREAR_CONFORMACION, ELIMINAR_CONFORMACION,
} from "../graphql/tribunal";
import {
  Building2, DoorOpen, Users, Link2, Plus, Edit, Trash2, X, AlertCircle,
  ToggleLeft, ToggleRight,
} from "lucide-react";
import {
  Modal, Field, SelectField, ErrorBox, ModalFooter,
  fmtFecha, nombreCompleto,
} from "./personas/shared";

// ─── TIPOS ───────────────────────────────────────────────

interface Tribunal {
  idTribunal: number;
  nombreTribunal: string;
  instancia: string;
  normaCreacion: string;
}
interface SalaTribunal {
  idSala: number;
  nombreSala: string;
  activa: boolean;
  idTribunal: { idTribunal: number; nombreTribunal: string; instancia: string };
}
interface Persona {
  idPersona: number;
  nombre: string;
  primerApellido: string;
  segundoApellido?: string;
  numeroDocumento: string;
  esAbogado: boolean;
}
interface VocalTribunal {
  idVocal: number;
  cargo: string;
  fechaPosesion: string;
  fechaConclusion?: string;
  activo: boolean;
  idPersona: Persona;
  idSala?: { idSala: number; nombreSala: string; idTribunal: { nombreTribunal: string } };
  usuario?: { idUsuario: number; nombres: string; paterno: string };
}
interface Conformacion {
  idConformacion: number;
  rolEnCaso: string;
  fechaAsignacion: string;
  idExpediente: { idExpediente: number; numeroExpediente: string };
  idVocal: { idVocal: number; cargo: string; idPersona: { nombre: string; primerApellido: string } };
}
interface ExpedienteSimple {
  idExpediente: number;
  numeroExpediente: string;
  ano: number;
  idEstadoExpediente?: { nombreEstado: string };
}

type Tab = "tribunales" | "salas" | "vocales" | "conformaciones";

// ─── HELPERS ─────────────────────────────────────────────

const ncompleto = (p: Persona) =>
  `${p.nombre} ${p.primerApellido}${p.segundoApellido ? " " + p.segundoApellido : ""}`;

// ─── COMPONENTES UI ──────────────────────────────────────

const TextArea = ({ label, value, onChange, required = false, placeholder = "" }: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; placeholder?: string;
}) => (
  <div className="mb-4">
    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-vertical"
    />
  </div>
);

const InstanciaBadge = ({ instancia }: { instancia: string }) => (
  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
    {instancia}
  </span>
);

const CargoBadge = ({ cargo }: { cargo: string }) => (
  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
    {cargo}
  </span>
);

const RolBadge = ({ rol }: { rol: string }) => (
  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
    {rol}
  </span>
);

const EstadoBadge = ({ activo }: { activo: boolean }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
    activo
      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
  }`}>
    {activo ? "Activo" : "Inactivo"}
  </span>
);

const Sk = () => (
  <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse w-24" />
);

// ─── TABLA ───────────────────────────────────────────────

function TablaDesktop({ headers, children, loading, emptyMsg }: {
  headers: string[]; children: React.ReactNode;
  loading?: boolean; emptyMsg?: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-lg overflow-hidden">
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
              [...Array(3)].map((_, i) => (
                <tr key={i}>
                  {[...Array(headers.length)].map((_, j) => (
                    <td key={j} className="px-6 py-4"><Sk /></td>
                  ))}
                </tr>
              ))
            ) : !children || (Array.isArray(children) && (children as any[]).filter(Boolean).length === 0) ? (
              <tr>
                <td colSpan={headers.length} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                  {emptyMsg ?? "Sin registros"}
                </td>
              </tr>
            ) : children}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const ActionBtns = ({
  onEdit, onDelete, extraLabel, extraVariant, onExtra,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  extraLabel?: string;
  extraVariant?: "emerald" | "red";
  onExtra?: () => void;
}) => (
  <div className="flex items-center justify-end gap-1">
    {onEdit && (
      <button onClick={onEdit} className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors" title="Editar">
        <Edit className="w-4 h-4" />
      </button>
    )}
    {onExtra && extraLabel && (
      <button
        onClick={onExtra}
        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          extraVariant === "emerald"
            ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            : "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
        }`}
      >
        {extraLabel}
      </button>
    )}
    {onDelete && (
      <button onClick={onDelete} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Eliminar">
        <Trash2 className="w-4 h-4" />
      </button>
    )}
  </div>
);

// ─── ESTADOS INICIALES ───────────────────────────────────

const initTribunal     = { nombreTribunal: "", instancia: "", normaCreacion: "" };
const initSala         = { idTribunal: "0", nombreSala: "", activa: "true" };
const initVocal        = { idPersona: "0", idSala: "0", cargo: "", fechaPosesion: "", idUsuario: "1" };
const initConformacion = { idExpediente: "0", idVocal: "0", rolEnCaso: "" };

// ─── PÁGINA PRINCIPAL ────────────────────────────────────

export default function TribunalPage() {
  const [tab, setTab]   = useState<Tab>("tribunales");
  const [error, setErr] = useState("");

  const [modalTribunal,     setModalTribunal]     = useState(false);
  const [modalSala,         setModalSala]         = useState(false);
  const [modalVocal,        setModalVocal]        = useState(false);
  const [modalConformacion, setModalConformacion] = useState(false);

  const [editTribunal, setEditTribunal] = useState<Tribunal | null>(null);
  const [editSala,     setEditSala]     = useState<SalaTribunal | null>(null);
  const [editVocal,    setEditVocal]    = useState<VocalTribunal | null>(null);

  const [formTribunal,     setFormTribunal]     = useState(initTribunal);
  const [formSala,         setFormSala]         = useState(initSala);
  const [formVocal,        setFormVocal]        = useState(initVocal);
  const [formConformacion, setFormConformacion] = useState(initConformacion);

  const { data: dTrib, loading: lTrib, refetch: rTrib } = useQuery(GET_TRIBUNALES);
  const { data: dSala, loading: lSala, refetch: rSala } = useQuery(GET_SALAS_TRIBUNAL);
  const { data: dVoc,  loading: lVoc,  refetch: rVoc  } = useQuery(GET_VOCALES);
  const { data: dPers }                                  = useQuery(GET_PERSONAS);
  const { data: dConf, loading: lConf, refetch: rConf } = useQuery(GET_CONFORMACIONES);
  const { data: dExp  }                                  = useQuery(GET_EXPEDIENTES_SIMPLE);

  const [crearTribunal]  = useMutation(CREAR_TRIBUNAL);
  const [actualizarTrib] = useMutation(ACTUALIZAR_TRIBUNAL);
  const [eliminarTrib]   = useMutation(ELIMINAR_TRIBUNAL);
  const [crearSala]      = useMutation(CREAR_SALA_TRIBUNAL);
  const [actualizarSala] = useMutation(ACTUALIZAR_SALA_TRIBUNAL);
  const [eliminarSala]   = useMutation(ELIMINAR_SALA_TRIBUNAL);
  const [crearVocal]     = useMutation(CREAR_VOCAL);
  const [actualizarVocal]= useMutation(ACTUALIZAR_VOCAL);
  const [eliminarVocal]  = useMutation(ELIMINAR_VOCAL);
  const [crearConf]      = useMutation(CREAR_CONFORMACION);
  const [eliminarConf]   = useMutation(ELIMINAR_CONFORMACION);

  const tribunales:     Tribunal[]         = dTrib?.allTribunales    ?? [];
  const salas:          SalaTribunal[]     = dSala?.allSalasTribunal  ?? [];
  const vocales:        VocalTribunal[]    = dVoc?.allVocales          ?? [];
  const personas:       Persona[]          = dPers?.allPersonas         ?? [];
  const conformaciones: Conformacion[]     = dConf?.allConformaciones   ?? [];
  const expedientes:    ExpedienteSimple[] = dExp?.allExpedientes        ?? [];

  const cerrar = () => {
    setModalTribunal(false); setModalSala(false);
    setModalVocal(false); setModalConformacion(false);
    setEditTribunal(null); setEditSala(null); setEditVocal(null);
    setErr("");
  };

  // ── TRIBUNAL ──────────────────────────────────────────
  const abrirCrearTrib = () => { setEditTribunal(null); setFormTribunal(initTribunal); setErr(""); setModalTribunal(true); };
  const abrirEditarTrib = (t: Tribunal) => {
    setEditTribunal(t);
    setFormTribunal({ nombreTribunal: t.nombreTribunal, instancia: t.instancia, normaCreacion: t.normaCreacion });
    setErr(""); setModalTribunal(true);
  };
  const guardarTribunal = async () => {
    if (!formTribunal.nombreTribunal || !formTribunal.instancia || !formTribunal.normaCreacion) {
      setErr("Todos los campos son obligatorios."); return;
    }
    try {
      if (editTribunal) await actualizarTrib({ variables: { id: Number(editTribunal.idTribunal), ...formTribunal } });
      else await crearTribunal({ variables: formTribunal });
      await rTrib(); cerrar();
    } catch (e: any) { setErr(e.message ?? "Error al guardar."); }
  };
  const eliminarTribunal = async (id: number) => {
    if (!window.confirm("¿Eliminar este tribunal? Se eliminarán todas sus salas.")) return;
    const { data } = await eliminarTrib({ variables: { id } });
    if (!data?.eliminarTribunal?.ok) { alert(data?.eliminarTribunal?.mensaje ?? "No se pudo eliminar"); return; }
    rTrib();
  };

  // ── SALA ──────────────────────────────────────────────
  const abrirCrearSala = () => { setEditSala(null); setFormSala(initSala); setErr(""); setModalSala(true); };
  const abrirEditarSala = (s: SalaTribunal) => {
    setEditSala(s);
    setFormSala({ idTribunal: String(s.idTribunal.idTribunal), nombreSala: s.nombreSala, activa: String(s.activa) });
    setErr(""); setModalSala(true);
  };
  const guardarSala = async () => {
    if (formSala.idTribunal === "0" || !formSala.nombreSala) { setErr("Tribunal y nombre son obligatorios."); return; }
    try {
      if (editSala) await actualizarSala({ variables: { id: Number(editSala.idSala), nombreSala: formSala.nombreSala, activa: formSala.activa === "true" } });
      else await crearSala({ variables: { idTribunal: Number(formSala.idTribunal), nombreSala: formSala.nombreSala, activa: formSala.activa === "true" } });
      await rSala(); cerrar();
    } catch (e: any) { setErr(e.message ?? "Error al guardar."); }
  };
  const eliminarSalaTrib = async (id: number) => {
    if (!window.confirm("¿Eliminar esta sala?")) return;
    const { data } = await eliminarSala({ variables: { id } });
    if (!data?.eliminarSalaTribunal?.ok) { alert(data?.eliminarSalaTribunal?.mensaje ?? "No se pudo eliminar"); return; }
    rSala();
  };

  // ── VOCAL ─────────────────────────────────────────────
  const abrirCrearVocal = () => { setEditVocal(null); setFormVocal(initVocal); setErr(""); setModalVocal(true); };
  const abrirEditarVocal = (v: VocalTribunal) => {
    setEditVocal(v);
    setFormVocal({ idPersona: String(v.idPersona.idPersona), idSala: v.idSala ? String(v.idSala.idSala) : "0", cargo: v.cargo, fechaPosesion: v.fechaPosesion?.slice(0, 10) ?? "", idUsuario: v.usuario ? String(v.usuario.idUsuario) : "1" });
    setErr(""); setModalVocal(true);
  };
  const guardarVocal = async () => {
    if (formVocal.idPersona === "0" || !formVocal.cargo || !formVocal.fechaPosesion) {
      setErr("Persona, cargo y fecha de posesión son obligatorios."); return;
    }
    try {
      if (editVocal) await actualizarVocal({ variables: { id: Number(editVocal.idVocal), input: { idSala: formVocal.idSala !== "0" ? Number(formVocal.idSala) : null, cargo: formVocal.cargo } } });
      else await crearVocal({ variables: { idPersona: Number(formVocal.idPersona), cargo: formVocal.cargo, fechaPosesion: formVocal.fechaPosesion, idUsuario: Number(formVocal.idUsuario), idSala: formVocal.idSala !== "0" ? Number(formVocal.idSala) : undefined } });
      await rVoc(); cerrar();
    } catch (e: any) { setErr(e.message ?? "Error al guardar."); }
  };
  const desactivarVocal = async (v: VocalTribunal) => {
    await actualizarVocal({ variables: { id: Number(v.idVocal), input: { activo: !v.activo } } });
    rVoc();
  };
  const eliminarVocalFn = async (id: number) => {
    if (!window.confirm("¿Eliminar este vocal?")) return;
    const { data } = await eliminarVocal({ variables: { id } });
    if (!data?.eliminarVocal?.ok) { alert(data?.eliminarVocal?.mensaje ?? "No se pudo eliminar"); return; }
    rVoc();
  };

  // ── CONFORMACIÓN ──────────────────────────────────────
  const abrirCrearConf = () => { setFormConformacion(initConformacion); setErr(""); setModalConformacion(true); };
  const guardarConformacion = async () => {
    if (formConformacion.idExpediente === "0" || formConformacion.idVocal === "0" || !formConformacion.rolEnCaso) {
      setErr("Todos los campos son obligatorios."); return;
    }
    try {
      await crearConf({ variables: { idExpediente: Number(formConformacion.idExpediente), idVocal: Number(formConformacion.idVocal), rolEnCaso: formConformacion.rolEnCaso } });
      await rConf(); cerrar();
    } catch (e: any) { setErr(e.message ?? "Error al guardar."); }
  };
  const eliminarConformacion = async (id: number) => {
    if (!window.confirm("¿Remover esta conformación?")) return;
    const { data } = await eliminarConf({ variables: { id } });
    if (!data?.eliminarConformacion?.ok) { alert(data?.eliminarConformacion?.mensaje ?? "No se pudo eliminar"); return; }
    rConf();
  };

  // ── TABS ──────────────────────────────────────────────
  const TABS: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "tribunales",     label: "Tribunales",     icon: <Building2 className="w-4 h-4" />, count: tribunales.length },
    { key: "salas",          label: "Salas",          icon: <DoorOpen className="w-4 h-4" />, count: salas.length },
    { key: "vocales",        label: "Vocales",        icon: <Users className="w-4 h-4" />,    count: vocales.length },
    { key: "conformaciones", label: "Conformaciones", icon: <Link2 className="w-4 h-4" />,    count: conformaciones.length },
  ];

  const BTN_NUEVO: Record<Tab, { label: string; action: () => void }> = {
    tribunales:     { label: "Nuevo tribunal",     action: abrirCrearTrib },
    salas:          { label: "Nueva sala",          action: abrirCrearSala },
    vocales:        { label: "Nuevo vocal",         action: abrirCrearVocal },
    conformaciones: { label: "Nueva conformación",  action: abrirCrearConf },
  };

  const TAB_ICON: Record<Tab, React.ReactNode> = {
    tribunales:     <Building2 className="w-7 h-7 text-blue-500" />,
    salas:          <DoorOpen  className="w-7 h-7 text-blue-500" />,
    vocales:        <Users     className="w-7 h-7 text-blue-500" />,
    conformaciones: <Link2     className="w-7 h-7 text-blue-500" />,
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            {TAB_ICON[tab]}
            Tribunal
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestión de tribunales, salas, vocales y conformaciones
          </p>
        </div>
        <button
          onClick={BTN_NUEVO[tab].action}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          {BTN_NUEVO[tab].label}
        </button>
      </div>

      {/* Tabs + Contenido */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-lg overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-slate-700 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all border-b-2 -mb-px shrink-0 ${
                tab === t.key
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                tab === t.key
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400"
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        <div className="p-5">

          {/* ── TRIBUNALES ── */}
          {tab === "tribunales" && (
            <TablaDesktop
              headers={["Nombre del tribunal", "Instancia", "Norma de creación", "Salas", "Acciones"]}
              loading={lTrib}
              emptyMsg="No hay tribunales registrados"
            >
              {tribunales.map(t => {
                const nSalas = salas.filter(s => s.idTribunal.idTribunal === t.idTribunal).length;
                return (
                  <tr key={t.idTribunal} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-800 dark:text-white text-sm">{t.nombreTribunal}</td>
                    <td className="px-6 py-4"><InstanciaBadge instancia={t.instancia} /></td>
                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">{t.normaCreacion}</td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-purple-600 dark:text-purple-400">{nSalas}</span>
                      <span className="text-xs text-gray-400 ml-1">sala{nSalas !== 1 ? "s" : ""}</span>
                    </td>
                    <td className="px-6 py-4">
                      <ActionBtns onEdit={() => abrirEditarTrib(t)} onDelete={() => eliminarTribunal(Number(t.idTribunal))} />
                    </td>
                  </tr>
                );
              })}
            </TablaDesktop>
          )}

          {/* ── SALAS ── */}
          {tab === "salas" && (
            <TablaDesktop
              headers={["Nombre de sala", "Tribunal", "Instancia", "Estado", "Acciones"]}
              loading={lSala}
              emptyMsg="No hay salas registradas"
            >
              {salas.map(s => (
                <tr key={s.idSala} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-800 dark:text-white text-sm">{s.nombreSala}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">{s.idTribunal.nombreTribunal}</td>
                  <td className="px-6 py-4"><InstanciaBadge instancia={s.idTribunal.instancia} /></td>
                  <td className="px-6 py-4"><EstadoBadge activo={s.activa} /></td>
                  <td className="px-6 py-4">
                    <ActionBtns onEdit={() => abrirEditarSala(s)} onDelete={() => eliminarSalaTrib(Number(s.idSala))} />
                  </td>
                </tr>
              ))}
            </TablaDesktop>
          )}

          {/* ── VOCALES ── */}
          {tab === "vocales" && (
            <TablaDesktop
              headers={["Vocal", "Documento", "Cargo", "Sala asignada", "Posesión", "Estado", "Acciones"]}
              loading={lVoc}
              emptyMsg="No hay vocales registrados"
            >
              {vocales.map(v => (
                <tr key={v.idVocal} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-sm text-gray-800 dark:text-white">{ncompleto(v.idPersona)}</p>
                    {v.idPersona.esAbogado && (
                      <p className="text-xs text-amber-500 dark:text-amber-400">Abogado</p>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400">{v.idPersona.numeroDocumento}</td>
                  <td className="px-6 py-4"><CargoBadge cargo={v.cargo} /></td>
                  <td className="px-6 py-4">
                    {v.idSala ? (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{v.idSala.nombreSala}</p>
                        <p className="text-xs text-gray-400">{v.idSala.idTribunal.nombreTribunal}</p>
                      </div>
                    ) : <span className="text-xs text-gray-400">Sin asignar</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{fmtFecha(v.fechaPosesion)}</td>
                  <td className="px-6 py-4"><EstadoBadge activo={v.activo} /></td>
                  <td className="px-6 py-4">
                    <ActionBtns
                      onEdit={() => abrirEditarVocal(v)}
                      onDelete={() => eliminarVocalFn(Number(v.idVocal))}
                      extraLabel={v.activo ? "Desactivar" : "Activar"}
                      extraVariant={v.activo ? "red" : "emerald"}
                      onExtra={() => desactivarVocal(v)}
                    />
                  </td>
                </tr>
              ))}
            </TablaDesktop>
          )}

          {/* ── CONFORMACIONES ── */}
          {tab === "conformaciones" && (
            <TablaDesktop
              headers={["Expediente", "Vocal", "Cargo del vocal", "Rol en caso", "Fecha asignación", "Acciones"]}
              loading={lConf}
              emptyMsg="No hay conformaciones registradas"
            >
              {conformaciones.map(c => (
                <tr key={c.idConformacion} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                    {c.idExpediente.numeroExpediente}
                  </td>
                  <td className="px-6 py-4 font-semibold text-sm text-gray-800 dark:text-white">
                    {c.idVocal.idPersona.nombre} {c.idVocal.idPersona.primerApellido}
                  </td>
                  <td className="px-6 py-4"><CargoBadge cargo={c.idVocal.cargo} /></td>
                  <td className="px-6 py-4"><RolBadge rol={c.rolEnCaso} /></td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{fmtFecha(c.fechaAsignacion)}</td>
                  <td className="px-6 py-4">
                    <ActionBtns onDelete={() => eliminarConformacion(Number(c.idConformacion))} />
                  </td>
                </tr>
              ))}
            </TablaDesktop>
          )}

        </div>
      </div>

      {/* ── MODAL: TRIBUNAL ── */}
      {modalTribunal && (
        <Modal onClose={cerrar} title={editTribunal ? "Editar tribunal" : "Nuevo tribunal"} icon={<Building2 className="w-5 h-5 text-emerald-500" />}>
          <Field label="Nombre del tribunal" required value={formTribunal.nombreTribunal}
            onChange={v => setFormTribunal(p => ({ ...p, nombreTribunal: v }))}
            placeholder="Ej: Tribunal Disciplinario Universitario" />
          <Field label="Instancia" required value={formTribunal.instancia}
            onChange={v => setFormTribunal(p => ({ ...p, instancia: v }))}
            placeholder="Ej: Primera instancia" />
          <TextArea label="Norma de creación" required value={formTribunal.normaCreacion}
            onChange={v => setFormTribunal(p => ({ ...p, normaCreacion: v }))}
            placeholder="Ej: Resolución HCU N° 001/2020" />
          <ErrorBox msg={error} />
          <ModalFooter onCancel={cerrar} onSave={guardarTribunal}
            saveLabel={editTribunal ? "Guardar cambios" : "Crear tribunal"} />
        </Modal>
      )}

      {/* ── MODAL: SALA ── */}
      {modalSala && (
        <Modal onClose={cerrar} title={editSala ? "Editar sala" : "Nueva sala"} icon={<DoorOpen className="w-5 h-5 text-emerald-500" />}>
          {!editSala && (
            <SelectField label="Tribunal" required value={formSala.idTribunal} onChange={v => setFormSala(p => ({ ...p, idTribunal: v }))}>
              <option value="0">— Selecciona un tribunal —</option>
              {tribunales.map(t => <option key={t.idTribunal} value={t.idTribunal}>{t.nombreTribunal}</option>)}
            </SelectField>
          )}
          <Field label="Nombre de sala" required value={formSala.nombreSala}
            onChange={v => setFormSala(p => ({ ...p, nombreSala: v }))} placeholder="Ej: Sala A" />
          <SelectField label="Estado" value={formSala.activa} onChange={v => setFormSala(p => ({ ...p, activa: v }))}>
            <option value="true">Activa</option>
            <option value="false">Inactiva</option>
          </SelectField>
          <ErrorBox msg={error} />
          <ModalFooter onCancel={cerrar} onSave={guardarSala} saveLabel={editSala ? "Guardar cambios" : "Crear sala"} />
        </Modal>
      )}

      {/* ── MODAL: VOCAL ── */}
      {modalVocal && (
        <Modal onClose={cerrar} title={editVocal ? "Editar vocal" : "Nuevo vocal"} icon={<Users className="w-5 h-5 text-emerald-500" />}>
          {!editVocal && (
            <SelectField label="Persona" required value={formVocal.idPersona} onChange={v => setFormVocal(p => ({ ...p, idPersona: v }))}>
              <option value="0">— Selecciona una persona —</option>
              {personas.map(p => <option key={p.idPersona} value={p.idPersona}>{ncompleto(p)} — {p.numeroDocumento}</option>)}
            </SelectField>
          )}
          <Field label="Cargo" required value={formVocal.cargo}
            onChange={v => setFormVocal(p => ({ ...p, cargo: v }))} placeholder="Ej: Vocal Titular" />
          <SelectField label="Sala asignada" value={formVocal.idSala} onChange={v => setFormVocal(p => ({ ...p, idSala: v }))}>
            <option value="0">— Sin asignar —</option>
            {salas.filter(s => s.activa).map(s => <option key={s.idSala} value={s.idSala}>{s.nombreSala} — {s.idTribunal.nombreTribunal}</option>)}
          </SelectField>
          {!editVocal && (
            <Field label="Fecha de posesión" required type="date" value={formVocal.fechaPosesion}
              onChange={v => setFormVocal(p => ({ ...p, fechaPosesion: v }))} />
          )}
          <ErrorBox msg={error} />
          <ModalFooter onCancel={cerrar} onSave={guardarVocal} saveLabel={editVocal ? "Guardar cambios" : "Registrar vocal"} />
        </Modal>
      )}

      {/* ── MODAL: CONFORMACIÓN ── */}
      {modalConformacion && (
        <Modal onClose={cerrar} title="Nueva conformación" icon={<Link2 className="w-5 h-5 text-emerald-500" />}>
          <SelectField label="Expediente" required value={formConformacion.idExpediente} onChange={v => setFormConformacion(p => ({ ...p, idExpediente: v }))}>
            <option value="0">— Selecciona un expediente —</option>
            {expedientes.map(e => <option key={e.idExpediente} value={e.idExpediente}>{e.numeroExpediente} ({e.ano})</option>)}
          </SelectField>
          <SelectField label="Vocal" required value={formConformacion.idVocal} onChange={v => setFormConformacion(p => ({ ...p, idVocal: v }))}>
            <option value="0">— Selecciona un vocal —</option>
            {vocales.filter(v => v.activo).map(v => <option key={v.idVocal} value={v.idVocal}>{ncompleto(v.idPersona)} — {v.cargo}</option>)}
          </SelectField>
          <Field label="Rol en el caso" required value={formConformacion.rolEnCaso}
            onChange={v => setFormConformacion(p => ({ ...p, rolEnCaso: v }))}
            placeholder="Ej: Presidente, Vocal Relator, Vocal..." />
          <ErrorBox msg={error} />
          <ModalFooter onCancel={cerrar} onSave={guardarConformacion} saveLabel="Asignar conformación" />
        </Modal>
      )}

    </div>
  );
}