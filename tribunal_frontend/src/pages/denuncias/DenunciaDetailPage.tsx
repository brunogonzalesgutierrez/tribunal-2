// src/pages/denuncias/DenunciaDetailPage.tsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_DENUNCIA_BY_ID, ACTUALIZAR_DENUNCIA, ADMITIR_DENUNCIA,
  GET_HISTORIAL_POR_EXPEDIENTE,
  ENVIAR_CITACION_ADMISION,
  ENVIAR_CITACION_TERMINO_PROBATORIO,
  ENVIAR_NOTIFICACION_RESOLUCION,
  ENVIAR_NOTIFICACION_RESOLUCION_APELACION,
  ENVIAR_NOTIFICACION_SUBSANACION,
  ENVIAR_NOTIFICACION_EJECUCION,
} from "../../graphql/denuncias";
import { GET_SALAS_TRIBUNAL } from "../../graphql/tribunal";
import { GET_TIPOS_AUDIENCIA, GET_SALAS_AUDIENCIA, ELIMINAR_AUDIENCIA } from "../../graphql/audiencias";
import { gql } from "@apollo/client";

const GET_VOCALES_DISPONIBLES = gql`
  query {
    allVocales {
      idVocal
      cargo
      activo
      idPersona { nombre primerApellido }
      idSala { nombreSala }
    }
  }
`;

const CREAR_CONFORMACION_DEN = gql`
  mutation CrearConformacion($idExpediente: Int!, $idVocal: Int!, $rolEnCaso: String!) {
    crearConformacion(idExpediente: $idExpediente, idVocal: $idVocal, rolEnCaso: $rolEnCaso) {
      conformacion {
        idConformacion
        rolEnCaso
        idVocal {
          idVocal
          cargo
          idPersona { nombre primerApellido }
          idSala { nombreSala }
        }
      }
    }
  }
`;

const ELIMINAR_CONFORMACION_DEN = gql`
  mutation EliminarConformacion($id: Int!) {
    eliminarConformacion(id: $id) {
      ok
      mensaje
    }
  }
`;


const REGISTRAR_RATIFICACION_PRUEBAS = gql`
  mutation RegistrarRatificacionPruebas($idDenuncia: Int!, $idUsuario: Int!) {
    registrarRatificacionPruebas(idDenuncia: $idDenuncia, idUsuario: $idUsuario) {
      ok
      mensaje
    }
  }
`;

const REGISTRAR_TRASLADO_APELACION = gql`
  mutation RegistrarTrasladoApelacion($idDenuncia: Int!, $idUsuario: Int!) {
    registrarTrasladoApelacion(idDenuncia: $idDenuncia, idUsuario: $idUsuario) {
      ok
      mensaje
    }
  }
`;

import { useCrudNotifications } from "../../hooks/useCrudNotifications";
import {
  EtapaAdmision,
  EtapaDeclaracionInformativa,
  EtapaPruebas,
  EtapaResolucion,
  EtapaApelacion,
  EtapaRetiro,
  EtapaConciliacion,
  EtapaAclaracion,
  EtapaNotificacionResolucion,
  EtapaMedidasPrecautorias,
  EtapaFallecimiento,
  EtapaDesistimiento,
  EtapaPrescripcion,
  EtapaCompulsa,
  EtapaRatificacionPruebas,
  EtapaTrasladoApelacion,
  EtapaEjecucionRectorado,
  TimelineDenuncia
} from "./DenunciaEtapas";
import {
  FormAudienciaDenuncia,
  ModalCitacionesDenuncia,
  ModalAsistenciaDenuncia,
} from "./DenunciaAudiencias";


import {
  FormDocumentoDenuncia,
  TarjetaDocumentoDenuncia,
} from "./DenunciaDocumentos";

import { ELIMINAR_DOCUMENTO } from "../../graphql/documento";

import {
  AlertCircle, CheckCircle, ChevronLeft, Clock, Calendar,
  FileText, Send, Scale, FolderOpen, Plus, Loader2, AlertTriangle,
  Gavel, FileCheck, ClipboardList, MessageSquare,
  GitBranch, History, XCircle, User, Lock, UserCheck, Building2, Trash2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

// ─── HELPERS ─────────────────────────────────────────────
const ESTADOS = [
  { value: "REGISTRADA",             label: "Registrada",             etapa: 1,  color: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",          icon: FileText },
  { value: "SUBSANACION",            label: "Subsanación",            etapa: 2,  color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",    icon: AlertTriangle },
  { value: "ADMITIDA",               label: "Admitida",               etapa: 3,  color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",        icon: CheckCircle },
  { value: "DECLARACION_INFORMATIVA",label: "Declaración Informativa",etapa: 4,  color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",icon: MessageSquare },
  { value: "PRUEBAS",                label: "Período Probatorio",     etapa: 5,  color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",icon: ClipboardList },
  { value: "CONCLUSION",             label: "Clausura Probatoria",    etapa: 6,  color: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",        icon: Clock },
  { value: "RESUELTA",               label: "Resuelta",               etapa: 7,  color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: Gavel },
  { value: "APELADA",                label: "Remitida en Apelación",  etapa: 8,  color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",icon: Send },
];

const ESTADOS_TERMINALES: Record<string, { color: string; icon: any; label: string }> = {
  ARCHIVADA:   { label: "Archivada",   color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",             icon: XCircle },
  RETIRADA:    { label: "Retirada",    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: XCircle },
  CONCILIADA:  { label: "Conciliada",  color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",         icon: CheckCircle },
  EJECUTADA:   { label: "Ejecutada",   color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",     icon: FileCheck },
  FALLECIDO:   { label: "Archivado — Fallecimiento", color: "bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400", icon: XCircle },
  DESISTIDA:   { label: "Desistida",  color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: XCircle },
  PRESCRITA:   { label: "Prescrita",  color: "bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400",     icon: Clock },
};

const TIPOS_DENUNCIADO = [
  { value: "ESTUDIANTE",    label: "Estudiante",    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "DOCENTE",       label: "Docente",       color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  { value: "ADMINISTRATIVO",label: "Administrativo",color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { value: "AUTORIDAD",     label: "Autoridad",     color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
];

const TIPOS_SANCION_LABEL: Record<string, string> = {
  MULTA:               "Multa hasta 20% haber mensual",
  SUSPENSION_TEMPORAL: "Suspensión temporal (1 mes - 1 año)",
  REMOCION:            "Remoción del cargo",
  RETIRO:              "Retiro de la Universidad",
  AMONESTACION:        "Amonestación por escrito",
  SUSPENSION_ESTUDIANTE:"Suspensión temporal (6 meses - 3 años)",
  EXPULSION:           "Expulsión de la Universidad",
};

const fmtFecha = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" });
};

// ─── TABS ──────────────────────────────────────────────
const TABS = [
  { id: "general",    label: "General",    icon: FileText,   requiereExpediente: false },
  { id: "etapas",     label: "Etapas",     icon: GitBranch,  requiereExpediente: false },
  { id: "vocales",    label: "Vocales",     icon: User,       requiereExpediente: true  },
  { id: "audiencias", label: "Audiencias", icon: Calendar,   requiereExpediente: true  },
  { id: "documentos", label: "Documentos", icon: FolderOpen, requiereExpediente: true  },
  { id: "historial",  label: "Historial",  icon: History,    requiereExpediente: true  },
] as const;

type TabId = typeof TABS[number]["id"];

const ESTADOS_CON_EXPEDIENTE = [
  "ADMITIDA", "DECLARACION_INFORMATIVA", "PRUEBAS",
  "CONCLUSION", "RESUELTA", "APELADA", "EJECUTADA",
  "ARCHIVADA", "RETIRADA", "CONCILIADA",
];

// ─── COMPONENTE PRINCIPAL ────────────────────────────────
export default function DenunciaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tabActiva, setTabActiva] = useState<TabId>("general");
  const [saving, setSaving] = useState(false);

  const [showFormAud, setShowFormAud]   = useState(false);
  const [editandoAud, setEditandoAud]   = useState<any | null>(null);
  const [citacionAud, setCitacionAud]   = useState<any | null>(null);
  const [asistenciaAud, setAsistenciaAud] = useState<any | null>(null);
  const [eliminandoAudId, setEliminandoAudId] = useState<number | null>(null);
  

  const [showFormDoc, setShowFormDoc]       = useState(false);
  const [eliminandoDocId, setEliminandoDocId] = useState<number | null>(null);
  const [eliminarDocumento] = useMutation(ELIMINAR_DOCUMENTO);

  const [crearConformacion]   = useMutation(CREAR_CONFORMACION_DEN);
  const [eliminarConformacion] = useMutation(ELIMINAR_CONFORMACION_DEN);
  const { data: dataVocales }  = useQuery(GET_VOCALES_DISPONIBLES);
  const [showFormVocal, setShowFormVocal]       = useState(false);
  const [formVocal, setFormVocal]               = useState({ idVocal: 0, vocalLabel: "", rolEnCaso: "" });
  const [savingVocal, setSavingVocal]           = useState(false);
  const [errVocal, setErrVocal]                 = useState("");
  const [modalVocal, setModalVocal]             = useState(false);
  const [eliminandoVocalId, setEliminandoVocalId] = useState<number | null>(null);



  const { usuario } = useAuth();

  // ── Query principal: SIEMPRE primero, así `denuncia` existe para todo lo de abajo ──
  const { data, loading, refetch } = useQuery(GET_DENUNCIA_BY_ID, {
    variables: { id: Number(id) },
  });
  const denuncia = data?.denunciaById;

  const [actualizarDenuncia] = useMutation(ACTUALIZAR_DENUNCIA);
  const [admitirDenuncia]    = useMutation(ADMITIR_DENUNCIA);

  const [registrarRatificacion] = useMutation(REGISTRAR_RATIFICACION_PRUEBAS);
  const [registrarTrasladoApelacion] = useMutation(REGISTRAR_TRASLADO_APELACION);

  const [enviarCitacionAdmision]                 = useMutation(ENVIAR_CITACION_ADMISION);
  const [enviarCitacionTerminoProbatorio]        = useMutation(ENVIAR_CITACION_TERMINO_PROBATORIO);
  const [enviarNotificacionResolucion]           = useMutation(ENVIAR_NOTIFICACION_RESOLUCION);
  const [enviarNotificacionResolucionApelacion]  = useMutation(ENVIAR_NOTIFICACION_RESOLUCION_APELACION);
  const [enviarNotificacionSubsanacion]          = useMutation(ENVIAR_NOTIFICACION_SUBSANACION);
  const [enviarNotificacionEjecucion]            = useMutation(ENVIAR_NOTIFICACION_EJECUCION);

  const { data: dataSalas }    = useQuery(GET_SALAS_TRIBUNAL);
  const { data: dataTiposAud } = useQuery(GET_TIPOS_AUDIENCIA);
  const { data: dataSalasAud } = useQuery(GET_SALAS_AUDIENCIA);
  const [eliminarAudiencia]    = useMutation(ELIMINAR_AUDIENCIA);

  const { data: dataHistorial, loading: loadingHistorial } = useQuery(
    GET_HISTORIAL_POR_EXPEDIENTE,
    {
      variables: { idExpediente: Number(denuncia?.expediente?.idExpediente ?? 0) },
      skip: !denuncia?.expediente?.idExpediente,
    }
  );

  const historial = dataHistorial?.historialPorExpediente ?? [];
  const salas     = (dataSalas?.allSalasTribunal ?? []).filter((s: any) => s.activa);
  const audiencias = denuncia?.expediente?.audiencias ?? [];
  const partes      = denuncia?.expediente?.partes ?? [];
  const tiposAud    = dataTiposAud?.allTiposAudiencia ?? [];
  const salasAud    = (dataSalasAud?.allSalasAudiencia ?? []).filter((s: any) => s.activa);


  const documentos = denuncia?.expediente?.documentos ?? [];
  const conformaciones = denuncia?.expediente?.conformaciones ?? [];

  const { toast } = useCrudNotifications("Denuncia");

  const getEstadoInfo = (estado: string) => {
    if (ESTADOS_TERMINALES[estado]) {
      return { value: estado, etapa: 0, ...ESTADOS_TERMINALES[estado] };
    }
    return ESTADOS.find(e => e.value === estado) || ESTADOS[0];
  };

  const avanzarEtapa = async (nuevoEstado: string, datosAdicionales?: any) => {
    if (saving) return;
    setSaving(true);
    try {
      const input: any = { estado: nuevoEstado };
      if (datosAdicionales) {
        if (datosAdicionales.resolucion)            input.resolucion = datosAdicionales.resolucion;
        if (datosAdicionales.fechaResolucion)       input.fechaResolucion = datosAdicionales.fechaResolucion;
        if (datosAdicionales.tipoResolucion)        input.tipoResolucion = datosAdicionales.tipoResolucion;
        if (datosAdicionales.tipoSancion)           input.tipoSancion = datosAdicionales.tipoSancion;
        if (datosAdicionales.detalleSancion)        input.detalleSancion = datosAdicionales.detalleSancion;
        if (datosAdicionales.descripcion)           input.descripcion = datosAdicionales.descripcion;
        if (datosAdicionales.motivoRetiro)          input.motivoRetiro = datosAdicionales.motivoRetiro;
        if (datosAdicionales.fechaRetiro)           input.fechaRetiro = datosAdicionales.fechaRetiro;
        if (datosAdicionales.actaConciliacion)      input.actaConciliacion = datosAdicionales.actaConciliacion;
        if (datosAdicionales.fechaConciliacion)     input.fechaConciliacion = datosAdicionales.fechaConciliacion;
        if (datosAdicionales.fechaApelacion)        input.fechaApelacion = datosAdicionales.fechaApelacion;
        if (datosAdicionales.idRecurrenteParte) input.idRecurrenteParte = datosAdicionales.idRecurrenteParte;
        if (datosAdicionales.resolucionApelacion)   input.resolucionApelacion = datosAdicionales.resolucionApelacion;
        if (datosAdicionales.fechaRemisionSuperior) input.fechaRemisionSuperior = datosAdicionales.fechaRemisionSuperior;
        if (datosAdicionales.aclaracionEnmienda)         input.aclaracionEnmienda = datosAdicionales.aclaracionEnmienda;
        if (datosAdicionales.fechaSolicitudAclaracion)   input.fechaSolicitudAclaracion = datosAdicionales.fechaSolicitudAclaracion;
        if (datosAdicionales.fechaNotificacionResolucion) input.fechaNotificacionResolucion = datosAdicionales.fechaNotificacionResolucion;
        if (datosAdicionales.medidasPrecautorias)        input.medidasPrecautorias = datosAdicionales.medidasPrecautorias;
        if (datosAdicionales.fechaMedidasPrecautorias)   input.fechaMedidasPrecautorias = datosAdicionales.fechaMedidasPrecautorias;
        if (datosAdicionales.fechaFallecimientoDenunciado) input.fechaFallecimientoDenunciado = datosAdicionales.fechaFallecimientoDenunciado;
        if (datosAdicionales.fechaDesistimiento)         input.fechaDesistimiento = datosAdicionales.fechaDesistimiento;
        if (datosAdicionales.motivoDesistimiento)        input.motivoDesistimiento = datosAdicionales.motivoDesistimiento;
        if (datosAdicionales.fechaCompulsa)              input.fechaCompulsa = datosAdicionales.fechaCompulsa;
        if (datosAdicionales.resolucionCompulsa)         input.resolucionCompulsa = datosAdicionales.resolucionCompulsa;
      }

      await actualizarDenuncia({
        variables: {
          id: Number(id),
          input,
          idUsuario: usuario?.idUsuario ? Number(usuario.idUsuario) : null,
        },
      });

      await refetch();
      toast.success(`Denuncia movida a ${getEstadoInfo(nuevoEstado).label}`);
    } catch (error: any) {
      toast.error(error.message || "Error al avanzar etapa");
    } finally {
      setSaving(false);
    }
  };

  const handleAdmitir = async (datos: { idSala: number }) => {
    if (!datos.idSala) {
      toast.error("Seleccioná una sala.");
      return;
    }
    if (!usuario?.idUsuario) {
      toast.error("No se pudo identificar al usuario.");
      return;
    }
    setSaving(true);
    try {
      const { data: res } = await admitirDenuncia({
        variables: {
          idDenuncia: Number(id),
          idSala:     Number(datos.idSala),
          idUsuario:  Number(usuario.idUsuario),
        },
      });

      if (res?.admitirDenuncia?.ok) {
        toast.success(`${res.admitirDenuncia.mensaje} — N° ${res.admitirDenuncia.numeroExpediente}`);
        await refetch();

        try {
          const { data: citacion } = await enviarCitacionAdmision({
            variables: { idDenuncia: Number(id), idUsuario: Number(usuario?.idUsuario) },
          });
          if (citacion?.enviarCitacionAdmision?.ok) {
            toast.success(`Citación enviada al denunciado: ${citacion.enviarCitacionAdmision.emailEnviado}`);
          } else {
            toast.error(`Denuncia admitida pero no se pudo enviar la citación: ${citacion?.enviarCitacionAdmision?.mensaje}`);
          }
        } catch {
          toast.error("Denuncia admitida pero hubo un error al enviar la citación por email.");
        }
      } else {
        toast.error(res?.admitirDenuncia?.mensaje ?? "Error al admitir la denuncia.");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Error inesperado.");
    } finally {
      setSaving(false);
    }
  };

  const handleSolicitarSubsanacion = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await actualizarDenuncia({
        variables: {
          id: Number(id),
          input: { estado: "SUBSANACION" },
          idUsuario: usuario?.idUsuario ? Number(usuario.idUsuario) : null,
        },
      });
      await refetch();
      toast.success("Denuncia enviada a subsanación (Art. 56)");

      try {
        const { data: notif } = await enviarNotificacionSubsanacion({
          variables: { idDenuncia: Number(id), idUsuario: Number(usuario?.idUsuario) },
        });
        if (notif?.enviarNotificacionSubsanacion?.ok) {
          toast.success("Notificación de subsanación enviada al denunciante");
        } else {
          toast.error(`Estado actualizado pero no se pudo notificar: ${notif?.enviarNotificacionSubsanacion?.mensaje}`);
        }
      } catch {
        toast.error("Estado actualizado pero hubo un error al enviar la notificación.");
      }
    } catch (error: any) {
      toast.error(error.message || "Error al solicitar subsanación");
    } finally {
      setSaving(false);
    }
  };

  const handleAbrirPruebas = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await actualizarDenuncia({
        variables: {
          id: Number(id),
          input: { estado: "PRUEBAS" },
          idUsuario: usuario?.idUsuario ? Number(usuario.idUsuario) : null,
        },
      });
      await refetch();
      toast.success("Período probatorio abierto (Art. 60)");

      try {
        const { data: citacion } = await enviarCitacionTerminoProbatorio({
          variables: { idDenuncia: Number(id), idUsuario: Number(usuario?.idUsuario) },
        });
        if (citacion?.enviarCitacionTerminoProbatorio?.ok) {
          toast.success(`Notificaciones enviadas a ${citacion.enviarCitacionTerminoProbatorio.enviados} parte(s)`);
        } else {
          toast.error(`Pruebas abiertas pero no se pudo notificar: ${citacion?.enviarCitacionTerminoProbatorio?.mensaje}`);
        }
      } catch {
        toast.error("Período probatorio abierto pero hubo un error al enviar las notificaciones.");
      }
    } catch (error: any) {
      toast.error(error.message || "Error al abrir el período probatorio");
    } finally {
      setSaving(false);
    }
  };

  const handleEmitirResolucion = async (
    resolucion: string,
    fecha: string,
    tipo: string,
    tipoSancion?: string,
    detalleSancion?: string
  ) => {
    if (saving) return;
    setSaving(true);
    try {
      await actualizarDenuncia({
        variables: {
          id: Number(id),
          input: {
            estado: "RESUELTA",
            resolucion,
            fechaResolucion: fecha,
            tipoResolucion: tipo,
            ...(tipoSancion    && { tipoSancion }),
            ...(detalleSancion && { detalleSancion }),
          },
          idUsuario: usuario?.idUsuario ? Number(usuario.idUsuario) : null,
        },
      });
      await refetch();
      toast.success("Resolución definitiva emitida (Art. 75)");

      try {
        const { data: notif } = await enviarNotificacionResolucion({
          variables: { idDenuncia: Number(id), idUsuario: Number(usuario?.idUsuario) },
        });
        if (notif?.enviarNotificacionResolucion?.ok) {
          toast.success(`Resolución notificada a ${notif.enviarNotificacionResolucion.enviados} parte(s)`);
        } else {
          toast.error(`Resolución emitida pero no se pudo notificar: ${notif?.enviarNotificacionResolucion?.mensaje}`);
        }
      } catch {
        toast.error("Resolución emitida pero hubo un error al enviar las notificaciones.");
      }
    } catch (error: any) {
      toast.error(error.message || "Error al emitir la resolución");
    } finally {
      setSaving(false);
    }
  };

  const handleResolverApelacion = async (datos: { resolucionApelacion: string }) => {
    if (saving) return;
    setSaving(true);
    try {
      await actualizarDenuncia({
        variables: {
          id: Number(id),
          input: { estado: "EJECUTADA", resolucionApelacion: datos.resolucionApelacion },
          idUsuario: usuario?.idUsuario ? Number(usuario.idUsuario) : null,
        },
      });
      await refetch();
      toast.success("Resolución de segunda instancia registrada (Art. 86)");

      try {
        const { data: notif } = await enviarNotificacionResolucionApelacion({
          variables: { idDenuncia: Number(id), idUsuario: Number(usuario?.idUsuario) },
        });
        if (notif?.enviarNotificacionResolucionApelacion?.ok) {
          toast.success(`Resolución de 2da instancia notificada a ${notif.enviarNotificacionResolucionApelacion.enviados} parte(s)`);
        } else {
          toast.error(`Resolución registrada pero no se pudo notificar: ${notif?.enviarNotificacionResolucionApelacion?.mensaje}`);
        }
      } catch {
        toast.error("Resolución registrada pero hubo un error al enviar las notificaciones.");
      }
    } catch (error: any) {
      toast.error(error.message || "Error al registrar la resolución de apelación");
    } finally {
      setSaving(false);
    }
  };

  const handleRatificacionPruebas = async () => {
    setSaving(true);
    try {
      const { data } = await registrarRatificacion({
        variables: { idDenuncia: Number(denuncia.idDenuncia), idUsuario: Number(usuario?.idUsuario) }
      });
      if (data.registrarRatificacionPruebas.ok) {
        toast.success("Ratificación de pruebas registrada en el expediente.");
      } else {
        toast.error(data.registrarRatificacionPruebas.mensaje);
      }
    } catch {
      toast.error("Error al registrar la ratificación.");
    } finally {
      setSaving(false);
    }
  };

  const handleEnviarNotificacionEjecucion = async () => {
    setSaving(true);
    try {
      const { data } = await enviarNotificacionEjecucion({
        variables: { idDenuncia: Number(denuncia.idDenuncia), idUsuario: Number(usuario?.idUsuario) }
      });
      if (data.enviarNotificacionEjecucion.ok) {
        toast.success(`Notificación de ejecución enviada: ${data.enviarNotificacionEjecucion.emailEnviado}`);
      } else {
        toast.error(data.enviarNotificacionEjecucion.mensaje);
      }
    } catch {
      toast.error("Error al enviar la notificación de ejecución.");
    } finally {
      setSaving(false);
    }
  };

  const handleTrasladoApelacion = async () => {
    setSaving(true);
    try {
      const { data } = await registrarTrasladoApelacion({
        variables: { idDenuncia: Number(denuncia.idDenuncia), idUsuario: Number(usuario?.idUsuario) }
      });
      if (data.registrarTrasladoApelacion.ok) {
        toast.success("Traslado de apelación registrado en el expediente.");
      } else {
        toast.error(data.registrarTrasladoApelacion.mensaje);
      }
    } catch {
      toast.error("Error al registrar el traslado.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!denuncia) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto text-gray-400" />
        <p className="mt-2 text-gray-500">Denuncia no encontrada</p>
        <button onClick={() => navigate("/denuncias")} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg">
          Volver
        </button>
      </div>
    );
  }

  const estadoActual = getEstadoInfo(denuncia.estado);
  const EstadoIcon = estadoActual.icon;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ENCABEZADO */}
      <div className="flex items-center gap-4 mb-2">
        <button
          onClick={() => navigate("/denuncias")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Denuncias
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-500" />
            Denuncia <span className="font-mono text-blue-600 dark:text-blue-400">{denuncia.numeroDenuncia}</span>
          </h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${estadoActual.color}`}>
              <EstadoIcon className="w-3.5 h-3.5" />
              {estadoActual.label}
            </span>
            <span className="text-xs text-gray-500">Creada: {fmtFecha(denuncia.fechaDenuncia)}</span>
            {denuncia.fechaHecho && (
              <span className="text-xs text-gray-500">Fecha del hecho: {fmtFecha(denuncia.fechaHecho)}</span>
            )}
          </div>
        </div>
      </div>

      {!["RETIRADA", "CONCILIADA", "ARCHIVADA", "FALLECIDO", "DESISTIDA", "PRESCRITA"].includes(denuncia.estado) && (
        <TimelineDenuncia estadoActual={denuncia.estado} estados={ESTADOS} />
      )}

      <div className="flex gap-6 items-start">

        <nav className="w-44 shrink-0 bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const activa = tabActiva === tab.id;
            const bloqueado = tab.requiereExpediente && !denuncia.expediente;
            return (
              <button
                key={tab.id}
                onClick={() => { if (!bloqueado) setTabActiva(tab.id); }}
                title={bloqueado ? "Disponible una vez que la denuncia sea admitida" : tab.label}
                className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition-all border-l-2 ${
                  bloqueado
                    ? "border-transparent text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-50"
                    : activa
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{tab.label}</span>
                {bloqueado && <Lock className="w-3 h-3 shrink-0" />}
              </button>
            );
          })}
        </nav>

        <div className="flex-1 min-w-0 bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">

          {/* ── TAB GENERAL ── */}
          {tabActiva === "general" && (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-slate-800/60 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
                  Datos de la Denuncia
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Denunciante</p>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-800 dark:text-white">
                        {denuncia.denunciante?.nombre} {denuncia.denunciante?.primerApellido}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">CI: {denuncia.denunciante?.numeroDocumento}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Denunciado</p>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-800 dark:text-white">
                        {denuncia.denunciado?.nombre} {denuncia.denunciado?.primerApellido}
                      </span>
                    </div>
                    <span className={`inline-flex mt-1 text-xs px-2 py-0.5 rounded-full ${TIPOS_DENUNCIADO.find(t => t.value === denuncia.tipoDenunciado)?.color}`}>
                      {TIPOS_DENUNCIADO.find(t => t.value === denuncia.tipoDenunciado)?.label}
                    </span>
                  </div>
                  {denuncia.expediente && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Expediente relacionado</p>
                      <div className="flex items-center gap-2 mt-1">
                        <FolderOpen className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-mono text-blue-600 dark:text-blue-400">
                          {denuncia.expediente.numeroExpediente}
                        </span>
                      </div>
                      <button
                        onClick={() => navigate(`/expedientes/${denuncia.expediente.idExpediente}`)}
                        className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        Ver expediente completo
                      </button>
                      {denuncia.expediente.conformaciones?.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Vocales asignados</p>
                          {denuncia.expediente.conformaciones.map((c: any) => (
                            <div key={c.idConformacion} className="flex items-center gap-3 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40">
                              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                                <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-800 dark:text-white">
                                  {c.idVocal?.idPersona?.nombre} {c.idVocal?.idPersona?.primerApellido}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {c.rolEnCaso} · {c.idVocal?.cargo}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Descripción de los hechos</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{denuncia.descripcion}</p>
                </div>
              </div>

              {denuncia.resolucion && (
                <div className="bg-gray-50 dark:bg-slate-800/60 rounded-2xl p-5">
                  <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-purple-500" />
                    Resolución Final
                  </h3>
                  {denuncia.tipoResolucion && (
                    <span className={`inline-flex mb-3 text-xs px-2.5 py-1 rounded-full font-medium ${
                      denuncia.tipoResolucion === "SANCIONATORIA"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    }`}>
                      {denuncia.tipoResolucion === "SANCIONATORIA" ? "Sancionatoria" : "Absolutoria"}
                    </span>
                  )}
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{denuncia.resolucion}</p>
                  {denuncia.tipoSancion && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                      <p className="text-xs font-semibold text-red-700 dark:text-red-400">Sanción impuesta</p>
                      <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                        {TIPOS_SANCION_LABEL[denuncia.tipoSancion] || denuncia.tipoSancion}
                      </p>
                      {denuncia.detalleSancion && (
                        <p className="text-xs text-red-500 mt-1">{denuncia.detalleSancion}</p>
                      )}
                    </div>
                  )}
                  {denuncia.fechaResolucion && (
                    <p className="text-xs text-gray-400 mt-2">Fecha: {fmtFecha(denuncia.fechaResolucion)}</p>
                  )}
                </div>
              )}

              {denuncia.estado === "RETIRADA" && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-5 border border-yellow-200 dark:border-yellow-800">
                  <h3 className="text-xs font-bold text-yellow-700 dark:text-yellow-400 uppercase tracking-widest mb-3">
                    Denuncia Retirada (Art. 22)
                  </h3>
                  {denuncia.motivoRetiro && (
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">{denuncia.motivoRetiro}</p>
                  )}
                  {denuncia.fechaRetiro && (
                    <p className="text-xs text-yellow-500 mt-2">Fecha: {fmtFecha(denuncia.fechaRetiro)}</p>
                  )}
                </div>
              )}

              {denuncia.estado === "CONCILIADA" && (
                <div className="bg-teal-50 dark:bg-teal-900/20 rounded-2xl p-5 border border-teal-200 dark:border-teal-800">
                  <h3 className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-widest mb-3">
                    Acta de Conciliación (Art. 59)
                  </h3>
                  {denuncia.actaConciliacion && (
                    <p className="text-sm text-teal-700 dark:text-teal-300 leading-relaxed">{denuncia.actaConciliacion}</p>
                  )}
                  {denuncia.fechaConciliacion && (
                    <p className="text-xs text-teal-500 mt-2">Fecha: {fmtFecha(denuncia.fechaConciliacion)}</p>
                  )}
                </div>
              )}

              {(denuncia.fechaRemisionRectorado || denuncia.fechaResolucionRectoral || denuncia.fechaRegistroGaceta) && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-5 border border-green-200 dark:border-green-800">
                  <h3 className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FileCheck className="w-4 h-4" />
                    Ejecución de Fallo — Rectorado y Gaceta (Art. 16 + Art. 90 + Art. 7)
                  </h3>
                  <div className="space-y-3 text-sm">
                    {denuncia.fechaRemisionRectorado && (
                      <div className="flex justify-between items-start border-b border-green-100 dark:border-green-800/40 pb-2">
                        <span className="text-gray-500 dark:text-gray-400">Remisión al Rectorado (Art. 16)</span>
                        <span className="font-medium text-gray-800 dark:text-white">{fmtFecha(denuncia.fechaRemisionRectorado)}</span>
                      </div>
                    )}
                    {denuncia.numeroResolucionRectoral && (
                      <div className="flex justify-between items-start border-b border-green-100 dark:border-green-800/40 pb-2">
                        <span className="text-gray-500 dark:text-gray-400">N° Resolución rectoral</span>
                        <span className="font-mono text-sm font-medium text-gray-800 dark:text-white">{denuncia.numeroResolucionRectoral}</span>
                      </div>
                    )}
                    {denuncia.fechaResolucionRectoral && (
                      <div className="flex justify-between items-start border-b border-green-100 dark:border-green-800/40 pb-2">
                        <span className="text-gray-500 dark:text-gray-400">Resolución rectoral (Art. 90 par. II)</span>
                        <span className="font-medium text-gray-800 dark:text-white">{fmtFecha(denuncia.fechaResolucionRectoral)}</span>
                      </div>
                    )}
                    {denuncia.fechaRegistroGaceta && (
                      <div className="flex justify-between items-start border-b border-green-100 dark:border-green-800/40 pb-2">
                        <span className="text-gray-500 dark:text-gray-400">Registro en Gaceta (Art. 7)</span>
                        <span className="font-medium text-gray-800 dark:text-white">{fmtFecha(denuncia.fechaRegistroGaceta)}</span>
                      </div>
                    )}
                    {denuncia.numeroGaceta && (
                      <div className="flex justify-between items-start">
                        <span className="text-gray-500 dark:text-gray-400">N° Gaceta Universitaria</span>
                        <span className="font-mono text-sm font-medium text-gray-800 dark:text-white">{denuncia.numeroGaceta}</span>
                      </div>
                    )}
                    {denuncia.observacionesEjecucion && (
                      <div className="pt-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Observaciones</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{denuncia.observacionesEjecucion}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(denuncia.estado === "APELADA" || denuncia.resolucionApelacion) && (
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-5 border border-orange-200 dark:border-orange-800">
                  <h3 className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase tracking-widest mb-3">
                    Recurso de Apelación (Art. 82)
                  </h3>
                  {denuncia.fechaApelacion && (
                    <p className="text-xs text-orange-500 mb-2">Interpuesta: {fmtFecha(denuncia.fechaApelacion)}</p>
                  )}
                  {denuncia.fechaRemisionSuperior && (
                    <p className="text-xs text-orange-500 mb-2">
                      Remitida al Superior: {fmtFecha(denuncia.fechaRemisionSuperior)}
                    </p>
                  )}
                  {denuncia.resolucionApelacion && (
                    <p className="text-sm text-orange-700 dark:text-orange-300 leading-relaxed">
                      {denuncia.resolucionApelacion}
                    </p>
                  )}
                </div>
              )}



              {denuncia.resolucionCompulsa && (
                <div className="bg-fuchsia-50 dark:bg-fuchsia-900/20 rounded-2xl p-5 border border-fuchsia-200 dark:border-fuchsia-800">
                  <h3 className="text-xs font-bold text-fuchsia-700 dark:text-fuchsia-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    Compulsa (Art. 83)
                  </h3>
                  <p className="text-sm text-fuchsia-700 dark:text-fuchsia-300 leading-relaxed">
                    {denuncia.resolucionCompulsa}
                  </p>
                  {denuncia.fechaCompulsa && (
                    <p className="text-xs text-fuchsia-500 mt-2">
                      Fecha: {fmtFecha(denuncia.fechaCompulsa)}
                    </p>
                  )}
                </div>
              )}

              {denuncia.medidasPrecautorias && (
                <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl p-5 border border-rose-200 dark:border-rose-800">
                  <h3 className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Medidas precautorias vigentes (Art. 61)
                  </h3>
                  <p className="text-sm text-rose-700 dark:text-rose-300 leading-relaxed">
                    {denuncia.medidasPrecautorias}
                  </p>
                  {denuncia.fechaMedidasPrecautorias && (
                    <p className="text-xs text-rose-500 mt-2">
                      Dispuestas el: {fmtFecha(denuncia.fechaMedidasPrecautorias)}
                    </p>
                  )}
                </div>
              )}


              {denuncia.fechaFallecimientoDenunciado && (
                <div className="bg-gray-100 dark:bg-gray-800/40 rounded-2xl p-5 border border-gray-300 dark:border-gray-700">
                  <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Fallecimiento del denunciado (Art. 80)
                  </h3>
                  <p className="text-xs text-gray-500">
                    Fecha: {fmtFecha(denuncia.fechaFallecimientoDenunciado)}
                  </p>
                </div>
              )}


              {denuncia.fechaDesistimiento && (
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-5 border border-orange-200 dark:border-orange-800">
                  <h3 className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Desistimiento (Art. 23)
                  </h3>
                  {denuncia.motivoDesistimiento && (
                    <p className="text-sm text-orange-700 dark:text-orange-300 leading-relaxed">
                      {denuncia.motivoDesistimiento}
                    </p>
                  )}
                  <p className="text-xs text-orange-500 mt-2">
                    Fecha: {fmtFecha(denuncia.fechaDesistimiento)}
                  </p>
                </div>
              )}


              {denuncia.estado === "PRESCRITA" && (
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-300 dark:border-slate-600">
                  <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Prescripción declarada (Art. 8 / Art. 81)
                  </h3>
                  {denuncia.resolucion && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {denuncia.resolucion}
                    </p>
                  )}
                  {denuncia.fechaResolucion && (
                    <p className="text-xs text-slate-500 mt-2">
                      Fecha: {fmtFecha(denuncia.fechaResolucion)}
                    </p>
                  )}
                </div>
              )}


            </div>
          )}

          {/* ── TAB ETAPAS ── */}
          {tabActiva === "etapas" && (
            <div className="space-y-4">

              {/* Indicador de etapa actual */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  ["EJECUTADA","ARCHIVADA","RETIRADA","CONCILIADA","FALLECIDO","DESISTIDA","PRESCRITA"].includes(denuncia.estado)
                    ? "bg-gray-400"
                    : "bg-blue-500 animate-pulse"
                }`} />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Estado actual: <span className="font-semibold text-gray-800 dark:text-white">{getEstadoInfo(denuncia.estado).label}</span>
                </p>
              </div>

              {/* ── REGISTRADA: Admisión + Retiro ── */}
              {denuncia.estado === "REGISTRADA" && (
                <>
                  <EtapaAdmision
                    denuncia={denuncia}
                    onAvanzar={(nuevoEstado) => avanzarEtapa(nuevoEstado)}
                    onRechazar={() => avanzarEtapa("ARCHIVADA")}
                    onSolicitarSubsanacion={handleSolicitarSubsanacion}
                    onRetirar={() => {}}
                    onAdmitir={handleAdmitir}
                    salas={salas}
                    saving={saving}
                  />
                  <EtapaRetiro
                    denuncia={denuncia}
                    onRetirar={(datos) => avanzarEtapa("RETIRADA", datos)}
                    saving={saving}
                  />

                  <EtapaPrescripcion
                    denuncia={denuncia}
                    onRegistrar={(datos) => avanzarEtapa("PRESCRITA", datos)}
                    saving={saving}
                  />
                </>
              )}

              {/* ── SUBSANACION: Admisión (vuelve a intentar) + Retiro ── */}
              {denuncia.estado === "SUBSANACION" && (
                <>
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Denuncia en subsanación (Art. 56)</p>
                      <p className="text-xs mt-1 text-amber-600 dark:text-amber-500">
                        El denunciante tiene 3 días hábiles para subsanar los defectos. Una vez subsanada, podés proceder a admitirla.
                      </p>
                    </div>
                  </div>
                  <EtapaAdmision
                    denuncia={denuncia}
                    onAvanzar={(nuevoEstado) => avanzarEtapa(nuevoEstado)}
                    onRechazar={() => avanzarEtapa("ARCHIVADA")}
                    onSolicitarSubsanacion={handleSolicitarSubsanacion}
                    onRetirar={() => {}}
                    onAdmitir={handleAdmitir}
                    salas={salas}
                    saving={saving}
                  />
                  <EtapaRetiro
                    denuncia={denuncia}
                    onRetirar={(datos) => avanzarEtapa("RETIRADA", datos)}
                    saving={saving}
                  />
                  <EtapaPrescripcion
                    denuncia={denuncia}
                    onRegistrar={(datos) => avanzarEtapa("PRESCRITA", datos)}
                    saving={saving}
                  />
                </>
              )}

              {/* ── ADMITIDA: Declaración informativa + Conciliación ── */}
              {denuncia.estado === "ADMITIDA" && (
                <>
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-400 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Denuncia admitida — Expediente {denuncia.expediente?.numeroExpediente}</p>
                      <p className="text-xs mt-1 text-blue-600 dark:text-blue-500">
                        El denunciado fue citado y tiene 10 días hábiles para asumir su defensa (Art. 58 inc. a). Registrá la declaración informativa cuando se presente o venza el plazo.
                      </p>
                    </div>
                  </div>
                  {/* Alerta de audiencia de declaración informativa */}
                  {(() => {
                    const tieneAudDeclaracion = audiencias.some(
                      (a: any) =>
                        a.idTipoAudiencia?.nombre?.toLowerCase().includes("declaraci") ||
                        a.idTipoAudiencia?.nombre?.toLowerCase().includes("informativa")
                    );
                    const audRealizada = audiencias.some(
                      (a: any) =>
                        (a.idTipoAudiencia?.nombre?.toLowerCase().includes("declaraci") ||
                         a.idTipoAudiencia?.nombre?.toLowerCase().includes("informativa")) &&
                        (a.estadoAudiencia === "REALIZADA" || a.estadoAudiencia === "FINALIZADA")
                    );
                    if (audRealizada) return null;
                    return (
                      <div className={`flex items-start gap-3 p-4 rounded-xl border ${
                        tieneAudDeclaracion
                          ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                          : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                      }`}>
                        <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${tieneAudDeclaracion ? "text-amber-500" : "text-red-500"}`} />
                        <div className="flex-1">
                          <p className={`text-sm font-bold ${tieneAudDeclaracion ? "text-amber-700 dark:text-amber-400" : "text-red-700 dark:text-red-400"}`}>
                            {tieneAudDeclaracion
                              ? "Audiencia programada — pendiente de realización (Art. 58 inc. b)"
                              : "⚠ Audiencia de Declaración Informativa no programada (Art. 58 inc. b)"
                            }
                          </p>
                          <p className={`text-xs mt-1 ${tieneAudDeclaracion ? "text-amber-600 dark:text-amber-500" : "text-red-600 dark:text-red-400"}`}>
                            {tieneAudDeclaracion
                              ? "El Tribunal señaló fecha y hora para la declaración informativa. Realizala y marcala como REALIZADA antes de registrar la declaración. El proceso puede avanzar igualmente si el denunciado no se presenta (Art. 58 inc. a)."
                              : "El Tribunal debe señalar fecha y hora para la recepción de la declaración informativa del denunciado (Art. 58 inc. b). Programá la audiencia en el tab Audiencias antes de registrar la declaración. Si el denunciado no se presenta, el proceso continúa igual (Art. 58 inc. a)."
                            }
                          </p>
                          {!tieneAudDeclaracion && (
                            <button
                              onClick={() => setTabActiva("audiencias")}
                              className="mt-2 text-xs font-semibold text-red-700 dark:text-red-400 underline hover:no-underline"
                            >
                              → Ir al tab Audiencias para programarla
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                  <EtapaDeclaracionInformativa
                    denuncia={denuncia}
                    onRegistrarDeclaracion={(datos) => avanzarEtapa("DECLARACION_INFORMATIVA", datos)}
                    saving={saving}
                  />
                  <EtapaConciliacion
                    denuncia={denuncia}
                    onConciliar={(datos) => avanzarEtapa("CONCILIADA", datos)}
                    saving={saving}
                  />
                  <EtapaMedidasPrecautorias
                    denuncia={denuncia}
                    onRegistrar={(datos) => avanzarEtapa(denuncia.estado, datos)}
                    saving={saving}
                  />
                  <EtapaFallecimiento
                    denuncia={denuncia}
                    onRegistrar={(datos) => avanzarEtapa("FALLECIDO", datos)}
                    saving={saving}
                  />
                  <EtapaDesistimiento
                    denuncia={denuncia}
                    onRegistrar={(datos) => avanzarEtapa("DESISTIDA", datos)}
                    saving={saving}
                  />

                  <EtapaPrescripcion
                    denuncia={denuncia}
                    onRegistrar={(datos) => avanzarEtapa("PRESCRITA", datos)}
                    saving={saving}
                  />
                </>
              )}

              {/* ── DECLARACION_INFORMATIVA: Abrir pruebas + Conciliación ── */}
              {denuncia.estado === "DECLARACION_INFORMATIVA" && (
                <>
                  <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-sm text-indigo-700 dark:text-indigo-400 flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Declaración informativa registrada (Art. 58)</p>
                      <p className="text-xs mt-1 text-indigo-600 dark:text-indigo-500">
                        Podés abrir el período probatorio de 30 días hábiles (Art. 60), o registrar una conciliación si las partes llegaron a un acuerdo (Art. 59).
                      </p>
                    </div>
                  </div>
                  <EtapaPruebas
                    denuncia={denuncia}
                    onAbrirPruebas={handleAbrirPruebas}
                    saving={saving}
                  />
                  <EtapaConciliacion
                    denuncia={denuncia}
                    onConciliar={(datos) => avanzarEtapa("CONCILIADA", datos)}
                    saving={saving}
                  />
                  <EtapaMedidasPrecautorias
                    denuncia={denuncia}
                    onRegistrar={(datos) => avanzarEtapa(denuncia.estado, datos)}
                    saving={saving}
                  />
                  <EtapaFallecimiento
                    denuncia={denuncia}
                    onRegistrar={(datos) => avanzarEtapa("FALLECIDO", datos)}
                    saving={saving}
                  />
                  <EtapaDesistimiento
                    denuncia={denuncia}
                    onRegistrar={(datos) => avanzarEtapa("DESISTIDA", datos)}
                    saving={saving}
                  />
                  <EtapaPrescripcion
                    denuncia={denuncia}
                    onRegistrar={(datos) => avanzarEtapa("PRESCRITA", datos)}
                    saving={saving}
                  />
                </>
              )}

              {/* ── PRUEBAS: Solo cerrar pruebas ── */}
              {denuncia.estado === "PRUEBAS" && (
                <>
                  <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-sm text-purple-700 dark:text-purple-400 flex items-start gap-2">
                    <ClipboardList className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Período probatorio abierto (Art. 60)</p>
                      <p className="text-xs mt-1 text-purple-600 dark:text-purple-500">
                        Plazo de 30 días hábiles para recepcionar pruebas de cargo y descargo. Las partes tienen 5 días hábiles desde la notificación para ratificar sus pruebas. Usá el tab Documentos para adjuntar las pruebas presentadas.
                      </p>
                    </div>
                  </div>
                  {/* Alerta de audiencias testificales durante pruebas */}
                  {(() => {
                    const audPruebas = audiencias.filter(
                      (a: any) =>
                        a.idTipoAudiencia?.nombre?.toLowerCase().includes("testif") ||
                        a.idTipoAudiencia?.nombre?.toLowerCase().includes("prueba") ||
                        a.idTipoAudiencia?.nombre?.toLowerCase().includes("probat")
                    );
                    if (audPruebas.length === 0) {
                      return (
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                          <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                              Audiencias testificales (Art. 70) — no programadas
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                              Si hay prueba testifical, la declaración de cada testigo se recibe en audiencia (Art. 70).
                              Podés programar audiencias de testigos en el tab Audiencias. Si no hay testigos, podés cerrar el período probatorio directamente.
                            </p>
                            <button
                              onClick={() => setTabActiva("audiencias")}
                              className="mt-2 text-xs font-semibold text-blue-700 dark:text-blue-400 underline hover:no-underline"
                            >
                              → Ir al tab Audiencias
                            </button>
                          </div>
                        </div>
                      );
                    }
                    const pendientes = audPruebas.filter(
                      (a: any) => a.estadoAudiencia === "PROGRAMADA" || a.estadoAudiencia === "EN_CURSO"
                    );
                    if (pendientes.length > 0) {
                      return (
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                              Hay {pendientes.length} audiencia{pendientes.length !== 1 ? "s" : ""} testifical{pendientes.length !== 1 ? "es" : ""} pendiente{pendientes.length !== 1 ? "s" : ""} (Art. 70)
                            </p>
                            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                              Realizalas antes de cerrar el período probatorio. El acta de cada audiencia queda en el expediente (Art. 73).
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <p className="text-xs text-green-700 dark:text-green-400">
                          Todas las audiencias testificales realizadas. Podés cerrar el período probatorio.
                        </p>
                      </div>
                    );
                  })()}
                  <EtapaPruebas
                    denuncia={denuncia}
                    onCerrarPruebas={() => avanzarEtapa("CONCLUSION")}
                    saving={saving}
                  />
                  <EtapaRatificacionPruebas
                    denuncia={denuncia}
                    onRegistrar={handleRatificacionPruebas}
                    saving={saving}
                  />
                </>
              )}

              {/* ── CONCLUSION: Solo emitir resolución ── */}
              {denuncia.estado === "CONCLUSION" && (
                <>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-400 flex items-start gap-2">
                    <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Clausura probatoria (Art. 74)</p>
                      <p className="text-xs mt-1 text-slate-500 dark:text-slate-500">
                        El período probatorio fue cerrado. El Tribunal tiene 15 días hábiles para dictar la resolución final motivada (Art. 75).
                      </p>
                    </div>
                  </div>
                  <EtapaResolucion
                    denuncia={denuncia}
                    onEmitirResolucion={handleEmitirResolucion}
                    saving={saving}
                  />
                </>
              )}

              {/* ── RESUELTA: Apelar o ejecutar ── */}
              {denuncia.estado === "RESUELTA" && (
                <>
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-700 dark:text-emerald-400 flex items-start gap-2">
                    <Gavel className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Resolución definitiva emitida (Art. 75)</p>
                      <p className="text-xs mt-1 text-emerald-600 dark:text-emerald-500">
                        Las partes tienen 5 días hábiles para interponer recurso de apelación (Art. 82). Si no hay apelación, ejecutá el fallo directamente.
                      </p>
                    </div>
                  </div>
                  <EtapaAclaracion
                    denuncia={denuncia}
                    onRegistrar={(datos) => avanzarEtapa("RESUELTA", datos)}
                    saving={saving}
                  />
                  <EtapaNotificacionResolucion
                    denuncia={denuncia}
                    onRegistrar={(datos) => avanzarEtapa("RESUELTA", datos)}
                    saving={saving}
                  />
                  <EtapaMedidasPrecautorias
                    denuncia={denuncia}
                    onRegistrar={(datos) => avanzarEtapa(denuncia.estado, datos)}
                    saving={saving}
                  />
                  <EtapaFallecimiento
                    denuncia={denuncia}
                    onRegistrar={(datos) => avanzarEtapa("FALLECIDO", datos)}
                    saving={saving}
                  />
                  <EtapaDesistimiento
                    denuncia={denuncia}
                    onRegistrar={(datos) => avanzarEtapa("DESISTIDA", datos)}
                    saving={saving}
                  />
                  <EtapaPrescripcion
                    denuncia={denuncia}
                    onRegistrar={(datos) => avanzarEtapa("PRESCRITA", datos)}
                    saving={saving}
                  />
                  <EtapaApelacion
                    denuncia={denuncia}
                    onApelar={(datos) => {
                      const rolBuscado = datos.idRecurrente === "DENUNCIANTE" ? "Denunciante" : "Denunciado";
                      const parteRecurrente = partes.find(
                        (p: any) => p.idRol?.nombreRol === rolBuscado && p.activo
                      );
                      avanzarEtapa("APELADA", {
                        fechaApelacion: datos.fechaApelacion,
                        idRecurrenteParte: parteRecurrente?.idParte
                          ? Number(parteRecurrente.idParte)
                          : undefined,
                      });
                    }}
                    onEjecutar={() => avanzarEtapa("EJECUTADA")}
                    saving={saving}
                  />
                </>
              )}

              {/* ── APELADA: Remitir al superior y registrar resolución ── */}
              {denuncia.estado === "APELADA" && (
                <>
                  <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-sm text-orange-700 dark:text-orange-400 flex items-start gap-2">
                    <Send className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Recurso de apelación interpuesto (Art. 82)</p>
                      <p className="text-xs mt-1 text-orange-600 dark:text-orange-500">
                        Debés remitir el expediente al Tribunal Superior en 3 días hábiles (Art. 86). Una vez recibida la resolución del Superior, registrala aquí para ejecutar el fallo.
                      </p>
                    </div>
                  </div>
  
                  <EtapaTrasladoApelacion
                    denuncia={denuncia}
                    onRegistrar={handleTrasladoApelacion}
                    saving={saving}
                  />
                  <EtapaApelacion
                    denuncia={denuncia}
                    onRemitirSuperior={(datos) => avanzarEtapa("APELADA", datos)}
                    onResolverApelacion={handleResolverApelacion}
                    saving={saving}
                  />
                  <EtapaCompulsa
                    denuncia={denuncia}
                    onRegistrar={(datos) => avanzarEtapa("APELADA", datos)}
                    saving={saving}
                  />
                  <EtapaPrescripcion
                    denuncia={denuncia}
                    onRegistrar={(datos) => avanzarEtapa("PRESCRITA", datos)}
                    saving={saving}
                  />
              
                </>
              )}

              {/* ── ESTADOS TERMINALES ── */}
              {denuncia.estado === "EJECUTADA" && (
                <>
                  <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-400 flex items-start gap-2">
                    <FileCheck className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Fallo ejecutoriado (Art. 90)</p>
                      <p className="text-xs mt-1 text-green-600 dark:text-green-500">
                        El proceso disciplinario concluyó. Registrá la remisión al Rectorado,
                        la resolución rectoral y el registro en Gaceta Universitaria.
                      </p>
                    </div>
                  </div>
                  <EtapaEjecucionRectorado
                    denuncia={denuncia}
                    onRegistrarRemision={(datos) => avanzarEtapa("EJECUTADA", datos)}
                    onRegistrarResolucionRectoral={(datos) => avanzarEtapa("EJECUTADA", datos)}
                    onRegistrarGaceta={(datos) => avanzarEtapa("EJECUTADA", datos)}
                    onEnviarNotificacion={handleEnviarNotificacionEjecucion}
                    saving={saving}
                  />
                </>
              )}

              {denuncia.estado === "ARCHIVADA" && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 p-6 text-center">
                  <XCircle className="w-12 h-12 mx-auto text-red-500 mb-3" />
                  <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">Denuncia Archivada</h3>
                  <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                    Esta denuncia fue rechazada o archivada (Art. 57). No continuará su tramitación.
                  </p>
                </div>
              )}

              {denuncia.estado === "RETIRADA" && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-200 dark:border-yellow-800 p-6 text-center">
                  <XCircle className="w-12 h-12 mx-auto text-yellow-500 mb-3" />
                  <h3 className="text-lg font-semibold text-yellow-700 dark:text-yellow-400">Denuncia Retirada (Art. 22)</h3>
                  <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">
                    El denunciante retiró la denuncia antes de la citación. Se tiene por no presentada.
                  </p>
                  {denuncia.motivoRetiro && (
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-3 font-medium">{denuncia.motivoRetiro}</p>
                  )}
                  {denuncia.fechaRetiro && (
                    <p className="text-xs text-yellow-500 mt-1">Fecha: {fmtFecha(denuncia.fechaRetiro)}</p>
                  )}
                </div>
              )}

              {denuncia.estado === "CONCILIADA" && (
                <div className="bg-teal-50 dark:bg-teal-900/20 rounded-2xl border border-teal-200 dark:border-teal-800 p-6 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto text-teal-500 mb-3" />
                  <h3 className="text-lg font-semibold text-teal-700 dark:text-teal-400">Proceso Conciliado (Art. 59)</h3>
                  <p className="text-sm text-teal-600 dark:text-teal-300 mt-1">
                    Las partes llegaron a un acuerdo. Se elaboró acta de conciliación y se archivaron los obrados.
                  </p>
                  {denuncia.actaConciliacion && (
                    <p className="text-sm text-teal-700 dark:text-teal-300 mt-3 italic">"{denuncia.actaConciliacion.slice(0, 120)}{denuncia.actaConciliacion.length > 120 ? "..." : ""}"</p>
                  )}
                  {denuncia.fechaConciliacion && (
                    <p className="text-xs text-teal-500 mt-1">Fecha: {fmtFecha(denuncia.fechaConciliacion)}</p>
                  )}
                </div>
              )}
              {denuncia.estado === "FALLECIDO" && (
                <div className="bg-gray-100 dark:bg-gray-800/40 rounded-2xl border border-gray-300 dark:border-gray-700 p-6 text-center">
                  <XCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                    Proceso archivado — Fallecimiento (Art. 80)
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    La acción disciplinaria se extinguió por fallecimiento del denunciado.
                    El expediente fue archivado de conformidad con el Art. 80 del Reglamento.
                  </p>
                  {denuncia.fechaFallecimientoDenunciado && (
                    <p className="text-xs text-gray-400 mt-3">
                      Fecha de fallecimiento: {fmtFecha(denuncia.fechaFallecimientoDenunciado)}
                    </p>
                  )}
                </div>
              )}


              {denuncia.estado === "DESISTIDA" && (
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-200 dark:border-orange-800 p-6 text-center">
                  <XCircle className="w-12 h-12 mx-auto text-orange-400 mb-3" />
                  <h3 className="text-lg font-semibold text-orange-700 dark:text-orange-400">
                    Proceso archivado — Desistimiento (Art. 23)
                  </h3>
                  <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">
                    El denunciante desistió de la acción. El proceso fue archivado y no puede
                    reiniciarse por los mismos hechos (Art. 23 par. I).
                  </p>
                  {denuncia.motivoDesistimiento && (
                    <p className="text-sm text-orange-700 dark:text-orange-300 mt-3 font-medium">
                      {denuncia.motivoDesistimiento}
                    </p>
                  )}
                  {denuncia.fechaDesistimiento && (
                    <p className="text-xs text-orange-400 mt-1">
                      Fecha: {fmtFecha(denuncia.fechaDesistimiento)}
                    </p>
                  )}
                </div>
              )}


              {denuncia.estado === "PRESCRITA" && (
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-300 dark:border-slate-600 p-6 text-center">
                  <Clock className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                  <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400">
                    Acción prescrita (Art. 8 / Art. 81)
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    La acción disciplinaria fue declarada prescrita por resolución fundada
                    del Tribunal (Art. 81). El plazo de 2 años desde los hechos fue superado
                    sin resolución definitiva (Art. 8).
                  </p>
                  {denuncia.resolucion && (
                    <p className="text-xs text-slate-400 mt-3 italic">
                      "{denuncia.resolucion.slice(0, 120)}{denuncia.resolucion.length > 120 ? "..." : ""}"
                    </p>
                  )}
                  {denuncia.fechaResolucion && (
                    <p className="text-xs text-slate-400 mt-2">
                      Fecha: {fmtFecha(denuncia.fechaResolucion)}
                    </p>
                  )}
                </div>
              )}

            </div>
          )}

          {/* ── TAB AUDIENCIAS ── */}
          {tabActiva === "audiencias" && (
            <div className="space-y-4">
              {!denuncia.expediente && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm">Las audiencias estarán disponibles una vez que la denuncia sea admitida.</p>
                </div>
              )}

              {denuncia.expediente && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                        {audiencias.length} audiencia{audiencias.length !== 1 ? "s" : ""}
                      </p>
                      {denuncia.estado === "ADMITIDA" && (
                        <p className="text-xs text-red-500 dark:text-red-400 mt-0.5 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Programar audiencia de declaración informativa (Art. 58 inc. b)
                        </p>
                      )}
                      {denuncia.estado === "PRUEBAS" && (
                        <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Período probatorio activo — audiencias testificales (Art. 70)
                        </p>
                      )}
                    </div>
                    {!showFormAud && (
                      <button
                        onClick={() => { setEditandoAud(null); setShowFormAud(true); }}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition-all shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" /> Programar audiencia
                      </button>
                    )}
                  </div>

                  {showFormAud && (
                    <FormAudienciaDenuncia
                      idExpediente={denuncia.expediente.idExpediente}
                      editando={editandoAud}
                      tiposAud={tiposAud}
                      salasAud={salasAud}
                      onSaved={() => { setShowFormAud(false); setEditandoAud(null); refetch(); }}
                      onCancel={() => { setShowFormAud(false); setEditandoAud(null); }}
                    />
                  )}

                  {audiencias.length === 0 && !showFormAud && (
                    <div className="flex flex-col items-center gap-4 py-10 text-gray-400 dark:text-gray-600">
                      <Calendar className="w-10 h-10" />
                      <p className="text-sm">Sin audiencias programadas</p>
                      <button
                        onClick={() => { setEditandoAud(null); setShowFormAud(true); }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold"
                      >
                        <Plus className="w-4 h-4" /> Programar primera audiencia
                      </button>
                    </div>
                  )}

                  <div className="space-y-3">
                    {audiencias.map((a: any) => (
                      <div key={a.idAudiencia}
                        className="p-4 rounded-xl border bg-gray-50 dark:bg-slate-800/60 border-gray-200 dark:border-slate-700 space-y-3">

                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                {a.idTipoAudiencia?.nombre}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(a.fechaHoraProgramada).toLocaleString("es-BO", {
                                  day: "2-digit", month: "short", year: "numeric",
                                  hour: "2-digit", minute: "2-digit"
                                })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                              a.estadoAudiencia === "PROGRAMADA" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                              a.estadoAudiencia === "REALIZADA"  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                              a.estadoAudiencia === "SUSPENDIDA" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                              a.estadoAudiencia === "EN_CURSO"   ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" :
                              "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300"
                            }`}>
                              {a.estadoAudiencia}
                            </span>

                            <button
                              onClick={() => setCitacionAud(a)}
                              title="Enviar citaciones por email"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setAsistenciaAud(a)}
                              title="Tomar asistencia"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                            >
                              <ClipboardList className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => { setEditandoAud(a); setShowFormAud(true); }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={async () => {
                                if (!confirm("¿Eliminar esta audiencia?")) return;
                                setEliminandoAudId(a.idAudiencia);
                                try {
                                  await eliminarAudiencia({ variables: { id: Number(a.idAudiencia) } });
                                  await refetch();
                                } finally {
                                  setEliminandoAudId(null);
                                }
                              }}
                              disabled={eliminandoAudId === a.idAudiencia}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
                            >
                              {eliminandoAudId === a.idAudiencia
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <XCircle className="w-3.5 h-3.5" />
                              }
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-gray-400 dark:text-gray-500">Sala</p>
                            <p className="text-gray-700 dark:text-gray-300 font-medium">{a.idSalaAud?.nombreSala ?? "—"}</p>
                          </div>
                          {a.linkVideoconferencia && (
                            <div>
                              <p className="text-gray-400 dark:text-gray-500">Enlace</p>
                              <a href={a.linkVideoconferencia} target="_blank" rel="noreferrer"
                                className="text-blue-500 hover:underline font-medium">
                                Videoconferencia
                              </a>
                            </div>
                          )}
                          {a.motivoSuspension && (
                            <div className="col-span-2">
                              <p className="text-gray-400 dark:text-gray-500">Motivo suspensión</p>
                              <p className="text-amber-600 dark:text-amber-400 font-medium">{a.motivoSuspension}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {citacionAud && (
                    <ModalCitacionesDenuncia
                      audiencia={citacionAud}
                      partes={partes.filter((p: any) => p.activo)}
                      onClose={() => setCitacionAud(null)}
                    />
                  )}
                  {asistenciaAud && (
                    <ModalAsistenciaDenuncia
                      audiencia={asistenciaAud}
                      partes={partes.filter((p: any) => p.activo)}
                      onClose={() => setAsistenciaAud(null)}
                    />
                  )}
                </>
              )}
            </div>
          )}

          {/* ── TAB VOCALES ── */}
          {tabActiva === "vocales" && (
            <div className="space-y-4">
              {!denuncia.expediente ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Lock className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm">Los vocales estarán disponibles una vez que la denuncia sea admitida.</p>
                </div>
              ) : (
                <>
                  {/* Header con botón agregar */}
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                      {conformaciones.length} vocal{conformaciones.length !== 1 ? "es" : ""} asignado{conformaciones.length !== 1 ? "s" : ""}
                    </p>
                    {!showFormVocal && (
                      <button
                        onClick={() => { setShowFormVocal(true); setFormVocal({ idVocal: 0, vocalLabel: "", rolEnCaso: "" }); setErrVocal(""); }}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold transition-all shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" /> Asignar vocal
                      </button>
                    )}
                  </div>

                  {/* Formulario inline de asignación */}
                  {showFormVocal && (() => {
                    const vocalesDisponibles = (dataVocales?.allVocales ?? []).filter(
                      (v: any) => v.activo && !conformaciones.some((c: any) => Number(c.idVocal?.idVocal ?? c.idVocal) === Number(v.idVocal))
                    );
                    const opcionesVocal = vocalesDisponibles.map((v: any) => ({
                      id: v.idVocal,
                      titulo: `${v.idPersona?.nombre} ${v.idPersona?.primerApellido}`,
                      subtitulo: v.cargo,
                      extra: v.idSala?.nombreSala,
                    }));

                    const guardarVocal = async () => {
                      if (!formVocal.idVocal || !formVocal.rolEnCaso.trim()) {
                        setErrVocal("Vocal y rol son obligatorios."); return;
                      }
                      setSavingVocal(true); setErrVocal("");
                      try {
                        await crearConformacion({
                          variables: {
                            idExpediente: Number(denuncia.expediente.idExpediente),
                            idVocal: Number(formVocal.idVocal),
                            rolEnCaso: formVocal.rolEnCaso.trim(),
                          },
                        });
                        setShowFormVocal(false);
                        setFormVocal({ idVocal: 0, vocalLabel: "", rolEnCaso: "" });
                        await refetch();
                        toast.success("Vocal asignado correctamente");
                      } catch (e: any) {
                        setErrVocal(e.message ?? "Error al asignar vocal.");
                      } finally {
                        setSavingVocal(false);
                      }
                    };

                    return (
                      <>
                        <div className="rounded-2xl border-2 border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/60 dark:bg-indigo-900/10 p-5 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
                                <UserCheck className="w-4 h-4 text-white" />
                              </div>
                              <p className="text-sm font-bold text-gray-800 dark:text-white">Asignar vocal</p>
                            </div>
                            <button
                              onClick={() => setShowFormVocal(false)}
                              disabled={savingVocal}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-3">
                            {/* Selector de vocal */}
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                Vocal <span className="text-red-500">*</span>
                              </label>
                              {formVocal.vocalLabel ? (
                                <div className="flex items-center gap-2 p-2.5 rounded-xl border bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800">
                                  <span className="flex-1 text-sm text-gray-800 dark:text-white truncate">{formVocal.vocalLabel}</span>
                                  <button
                                    type="button"
                                    onClick={() => setFormVocal(p => ({ ...p, idVocal: 0, vocalLabel: "" }))}
                                    className="p-1 rounded-lg text-gray-500 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setModalVocal(true)}
                                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-all"
                                >
                                  <Plus className="w-4 h-4" /> Buscar vocal activo
                                </button>
                              )}
                            </div>

                            {/* Rol en el caso */}
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                Rol en el caso <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                placeholder="Ej: Vocal Relator, Presidente de Sala..."
                                value={formVocal.rolEnCaso}
                                onChange={e => setFormVocal(p => ({ ...p, rolEnCaso: e.target.value }))}
                                disabled={savingVocal}
                                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                              />
                            </div>
                          </div>

                          {errVocal && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm">
                              <AlertCircle className="w-4 h-4 shrink-0" />{errVocal}
                            </div>
                          )}

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              onClick={() => setShowFormVocal(false)}
                              disabled={savingVocal}
                              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm font-medium transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={guardarVocal}
                              disabled={savingVocal || !formVocal.idVocal || !formVocal.rolEnCaso.trim()}
                              className="px-4 py-2 rounded-xl bg-indigo-500 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                            >
                              {savingVocal ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                              {savingVocal ? "Guardando..." : "Asignar"}
                            </button>
                          </div>
                        </div>

                        {/* Modal buscador de vocales */}
                        {modalVocal && (
                          <div
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                            onClick={() => setModalVocal(false)}
                          >
                            <div
                              className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
                              onClick={e => e.stopPropagation()}
                            >
                              <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                                <h3 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                  <UserCheck className="w-5 h-5 text-indigo-500" /> Seleccionar vocal activo
                                </h3>
                                <button onClick={() => setModalVocal(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                                  <XCircle className="w-5 h-5" />
                                </button>
                              </div>
                              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {opcionesVocal.length === 0 ? (
                                  <div className="text-center py-10 text-gray-400">
                                    <UserCheck className="w-10 h-10 mx-auto mb-2" />
                                    <p className="text-sm">No hay vocales activos disponibles para asignar</p>
                                  </div>
                                ) : (
                                  opcionesVocal.map((v: any) => (
                                    <button
                                      key={v.id}
                                      onClick={() => {
                                        const label = v.extra ? `${v.titulo} — ${v.extra}` : v.titulo;
                                        setFormVocal(p => ({ ...p, idVocal: v.id, vocalLabel: label }));
                                        setModalVocal(false);
                                      }}
                                      className="w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all border border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                                    >
                                      <div className="flex justify-between items-center">
                                        <div>
                                          <p className="font-semibold text-gray-800 dark:text-white">{v.titulo}</p>
                                          {v.subtitulo && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{v.subtitulo}</p>}
                                          {v.extra && <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5">{v.extra}</p>}
                                        </div>
                                        <Plus className="w-5 h-5 text-indigo-500 shrink-0 ml-3" />
                                      </div>
                                    </button>
                                  ))
                                )}
                              </div>
                              <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700">
                                <button onClick={() => setModalVocal(false)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium">
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* Lista de vocales asignados */}
                  {conformaciones.length === 0 && !showFormVocal && (
                    <div className="flex flex-col items-center gap-4 py-10 text-gray-400 dark:text-gray-600">
                      <Building2 className="w-10 h-10" />
                      <p className="text-sm">Sin vocales asignados a este proceso</p>
                      <button
                        onClick={() => { setShowFormVocal(true); setFormVocal({ idVocal: 0, vocalLabel: "", rolEnCaso: "" }); setErrVocal(""); }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold"
                      >
                        <Plus className="w-4 h-4" /> Asignar primer vocal
                      </button>
                    </div>
                  )}

                  <div className="space-y-3">
                    {conformaciones.map((c: any) => (
                      <div
                        key={c.idConformacion}
                        className="flex items-center justify-between gap-3 p-4 rounded-xl border bg-gray-50 dark:bg-slate-800/60 border-gray-200 dark:border-slate-700"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                            <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 dark:text-white">
                              {c.idVocal?.idPersona?.nombre} {c.idVocal?.idPersona?.primerApellido}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {c.idVocal?.cargo}
                              {c.idVocal?.idSala?.nombreSala && ` · ${c.idVocal.idSala.nombreSala}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                            {c.rolEnCaso}
                          </span>
                          <button
                            disabled={eliminandoVocalId === c.idConformacion}
                            onClick={async () => {
                              if (!confirm(`¿Quitar al vocal ${c.idVocal?.idPersona?.nombre} de este proceso?`)) return;
                              setEliminandoVocalId(c.idConformacion);
                              try {
                                await eliminarConformacion({ variables: { id: Number(c.idConformacion) } });
                                await refetch();
                                toast.success("Vocal quitado del proceso");
                              } catch (e: any) {
                                toast.error(e.message ?? "Error al quitar el vocal");
                              } finally {
                                setEliminandoVocalId(null);
                              }
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
                          >
                            {eliminandoVocalId === c.idConformacion
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />
                            }
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── TAB HISTORIAL ── */}
          {tabActiva === "historial" && (
            <div className="space-y-3">
              {!denuncia.expediente && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <History className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm">El historial estará disponible una vez que la denuncia sea admitida y se genere un expediente.</p>
                </div>
              )}

              {denuncia.expediente && loadingHistorial && (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              )}

              {denuncia.expediente && !loadingHistorial && historial.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <History className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm">No hay cambios de estado registrados aún.</p>
                </div>
              )}

              {historial.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <FolderOpen className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Historial del expediente{" "}
                      <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
                        {denuncia.expediente.numeroExpediente}
                      </span>
                    </span>
                  </div>

                  <div className="relative">
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-slate-700" />

                    <div className="space-y-4">
                      {[...historial]
                        .sort((a: any, b: any) =>
                          new Date(b.fechaCambio).getTime() - new Date(a.fechaCambio).getTime()
                        )
                        .map((entrada: any, i: number) => (
                          <div key={entrada.idHistorial} className="relative flex gap-4 pl-2">
                            <div className={`relative z-10 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                              i === 0
                                ? "bg-blue-500 shadow-md shadow-blue-200 dark:shadow-blue-900"
                                : "bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-600"
                            }`}>
                              {i === 0
                                ? <CheckCircle className="w-3.5 h-3.5 text-white" />
                                : <Clock className="w-3 h-3 text-gray-400" />
                              }
                            </div>

                            <div className={`flex-1 rounded-xl p-4 border ${
                              i === 0
                                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                                : "bg-gray-50 dark:bg-slate-800/60 border-gray-200 dark:border-slate-700"
                            }`}>
                              <div className="flex items-center gap-2 flex-wrap">
                                {entrada.idEstadoAnterior ? (
                                  <>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-400">
                                      {entrada.idEstadoAnterior.nombreEstado}
                                    </span>
                                    <span className="text-gray-400 dark:text-gray-500 text-xs">→</span>
                                  </>
                                ) : null}
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  i === 0
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                                    : "bg-gray-300 dark:bg-slate-600 text-gray-700 dark:text-gray-300"
                                }`}>
                                  {entrada.idEstadoNuevo?.nombreEstado ?? "—"}
                                </span>
                              </div>

                              {entrada.motivo && (
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">
                                  {entrada.motivo}
                                </p>
                              )}

                              <div className="flex items-center gap-3 mt-2 flex-wrap">
                                <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                                  {new Date(entrada.fechaCambio).toLocaleString("es-BO", {
                                    day: "2-digit", month: "short", year: "numeric",
                                    hour: "2-digit", minute: "2-digit",
                                  })}
                                </span>
                                {entrada.usuario && (
                                  <>
                                    <span className="text-gray-300 dark:text-gray-600">·</span>
                                    <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      {entrada.usuario.nombres} {entrada.usuario.paterno}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}



          {/* ── TAB DOCUMENTOS ── */}
          {tabActiva === "documentos" && (
            <div className="space-y-4">
              {!denuncia.expediente && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm">Los documentos estarán disponibles una vez que la denuncia sea admitida.</p>
                </div>
              )}

              {denuncia.expediente && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                      {documentos.length} documento{documentos.length !== 1 ? "s" : ""}
                    </p>
                    {!showFormDoc && (
                      <button
                        onClick={() => setShowFormDoc(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-all shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" /> Registrar documento
                      </button>
                    )}
                  </div>

                  {showFormDoc && (
                    <>
                   
                      <FormDocumentoDenuncia
                        idExpediente={denuncia.expediente.idExpediente}
                        onSaved={() => { setShowFormDoc(false); refetch(); }}
                        onCancel={() => setShowFormDoc(false)}
                      />
                    </>
                  )}
                 
                  {documentos.length === 0 && !showFormDoc && (
                    <div className="flex flex-col items-center gap-4 py-10 text-gray-400 dark:text-gray-600">
                      <FolderOpen className="w-10 h-10" />
                      <p className="text-sm">Sin documentos registrados</p>
                      <button
                        onClick={() => setShowFormDoc(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold"
                      >
                        <Plus className="w-4 h-4" /> Registrar primer documento
                      </button>
                    </div>
                  )}

                  <div className="space-y-3">
                    {documentos.map((doc: any) => (
                      <TarjetaDocumentoDenuncia
                        key={doc.idDocumento}
                        doc={doc}
                        idExpediente={denuncia.expediente.idExpediente}
                        eliminandoId={eliminandoDocId}
                        onEliminar={async () => {
                          if (!confirm(`¿Eliminar el documento "${doc.titulo}"?`)) return;
                          setEliminandoDocId(doc.idDocumento);
                          try {
                            await eliminarDocumento({ variables: { id: Number(doc.idDocumento) } });
                            await refetch();
                          } finally {
                            setEliminandoDocId(null);
                          }
                        }}
                        onArchivoSubido={() => refetch()}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="w-80 shrink-0 space-y-5">
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Plazos Procesales
            </h3>
            <div className="space-y-2 text-sm">
              {[
                ["Admisión (Art. 58)",     "5 días"],
                ["Subsanación (Art. 56)",  "3 días"],
                ["Defensa (Art. 58a)",     "10 días"],
                ["Pruebas (Art. 60)",      "30 días"],
                ["Resolución (Art. 75)",   "15 días"],
                ["Apelación (Art. 82)",    "5 días"],
                ["Remisión Superior (Art. 86)", "3 días"],
                ["Ejecución (Art. 90)",    "5 días"],
              ].map(([label, dias], i) => (
                <div key={i} className={`flex justify-between py-1 ${i > 0 ? "border-t border-gray-100 dark:border-slate-700" : ""}`}>
                  <span className="text-gray-600 dark:text-gray-400">{label}</span>
                  <span className="font-mono">{dias}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-gray-200 dark:border-slate-700 p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Scale className="w-4 h-4 text-purple-500" />
              Referencias Legales
            </h3>
            <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
              <p>Art. 22 - Retiro de denuncia</p>
              <p>Art. 55 - Requisitos de la denuncia</p>
              <p>Art. 56 - Denuncia defectuosa</p>
              <p>Art. 57 - Rechazo de denuncia</p>
              <p>Art. 58 - Auto de admisión</p>
              <p>Art. 59 - Conciliación</p>
              <p>Art. 60 - Período probatorio</p>
              <p>Art. 75 - Resolución final</p>
              <p>Art. 82 - Recurso de apelación</p>
              <p>Art. 86 - Remisión al Superior</p>
              <p>Art. 90 - Ejecución de fallos</p>
              <p>Art. 8  - Prescripción (2 años)</p>
              <p>Art. 23 - Desistimiento</p>
              <p>Art. 46 - Notificación personal</p>
              <p>Art. 61 - Medidas precautorias</p>
              <p>Art. 77 - Aclaración/enmienda</p>
              <p>Art. 80 - Fallecimiento</p>
              <p>Art. 81 - Resolución de prescripción</p>
              <p>Art. 83 - Compulsa</p>
              <p>Art. 7  - Registro en Gaceta</p>
              <p>Art. 16 - Remisión a autoridad</p>
              <p>Art. 90 - Resolución rectoral</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}