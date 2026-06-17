import { gql } from "@apollo/client";

// Campos comunes reutilizables
const DENUNCIA_FIELDS = `
  id
  numeroDenuncia
  fechaDenuncia
  fechaHecho
  denunciante { idPersona nombre primerApellido numeroDocumento }
  denunciado  { idPersona nombre primerApellido numeroDocumento }
  tipoDenunciado
  descripcion
  estado
  resolucion
  tipoResolucion
  fechaResolucion
  tipoSancion
  detalleSancion
  fechaRetiro
  motivoRetiro
  fechaConciliacion
  actaConciliacion
  fechaApelacion
  resolucionApelacion
  fechaRemisionSuperior
  # Art. 77
  fechaSolicitudAclaracion
  aclaracionEnmienda
  # Art. 23
  fechaDesistimiento
  motivoDesistimiento
  # Art. 80
  fechaFallecimientoDenunciado
  # Art. 61
  medidasPrecautorias
  fechaMedidasPrecautorias
  # Art. 83
  fechaCompulsa
  resolucionCompulsa
  # Art. 46
  fechaNotificacionResolucion
  # Art. 16 + Art. 90 par. II — Ejecución al Rectorado
  fechaRemisionRectorado
  fechaResolucionRectoral
  numeroResolucionRectoral
  observacionesEjecucion
  # Art. 7 — Gaceta Universitaria
  fechaRegistroGaceta
  numeroGaceta
  expediente {
    idExpediente
    numeroExpediente
    conformaciones {
      idConformacion
      rolEnCaso
      idVocal {
        cargo
        idPersona { nombre primerApellido }
        idSala { nombreSala }
      }
    }
    audiencias {
      idAudiencia
      fechaHoraProgramada
      fechaHoraInicio
      fechaHoraFin
      estadoAudiencia
      motivoSuspension
      linkVideoconferencia
      idTipoAudiencia { idTipoAudiencia nombre duracionEstimada }
      idSalaAud { idSalaAud nombreSala capacidad equipadaVideoconf }
    }
    partes {
      idParte
      activo
      idPersona {
        idPersona nombre primerApellido segundoApellido numeroDocumento
        contactos { tipoContacto valor esPrincipal }
      }
      idRol { idRol nombreRol }
    }
    documentos {
      idDocumento
      titulo
      fechaPresentacion
      numeroFolio
      rutaArchivo
      tamanoKb
      firmadoDigitalmente
      idTipoDoc { idTipoDoc codigo nombre esPublico requiereFirma }
    }
    actuaciones {
      idActuacion
      folioInicio
      folioFin
      esPublica
      fechaActuacion
      descripcion
      idTipoActuacion { idTipoActuacion codigo nombre }
      usuario { idUsuario nombres paterno }
    }
  }
`;

// ============================================================
// QUERIES
// ============================================================

export const GET_DENUNCIAS = gql`
  query GetDenuncias {
    allDenuncias {
      ${DENUNCIA_FIELDS}
    }
  }
`;

export const GET_DENUNCIA_BY_ID = gql`
  query GetDenunciaById($id: Int!) {
    denunciaById(id: $id) {
      ${DENUNCIA_FIELDS}
    }
  }
`;

// ============================================================
// MUTATIONS
// ============================================================

export const CREAR_DENUNCIA = gql`
  mutation CrearDenuncia($input: CrearDenunciaInput!) {
    crearDenuncia(input: $input) {
      ok
      mensaje
      denuncia {
        id
        numeroDenuncia
        fechaDenuncia
        fechaHecho
        denunciante { idPersona nombre primerApellido }
        denunciado  { idPersona nombre primerApellido }
        estado
      }
    }
  }
`;

export const ACTUALIZAR_DENUNCIA = gql`
  mutation ActualizarDenuncia(
    $id: Int!
    $input: ActualizarDenunciaInput!
    $idUsuario: Int
  ) {
    actualizarDenuncia(id: $id, input: $input, idUsuario: $idUsuario) {
      denuncia {
        ${DENUNCIA_FIELDS}
      }
    }
  }
`;

export const ELIMINAR_DENUNCIA = gql`
  mutation EliminarDenuncia($id: Int!) {
    eliminarDenuncia(id: $id) {
      ok
      mensaje
    }
  }
`;

// ============================================================
// PERSONAS (para buscadores)
// ============================================================

export const GET_PERSONAS = gql`
  query GetPersonas {
    allPersonas {
      idPersona
      nombre
      primerApellido
      segundoApellido
      numeroDocumento
      estamento
      registroUniversitario
      esAbogado
      titularA
      contactos {
        tipoContacto
        valor
        esPrincipal
      }
    }
  }
`;

export const ADMITIR_DENUNCIA = gql`
  mutation AdmitirDenuncia(
    $idDenuncia: Int!
    $idSala: Int!
    $idUsuario: Int!
  ) {
    admitirDenuncia(
      idDenuncia: $idDenuncia
      idSala: $idSala
      idUsuario: $idUsuario
    ) {
      ok
      mensaje
      numeroExpediente
      denuncia {
        id
        estado
        expediente { idExpediente numeroExpediente }
      }
      expediente {
        idExpediente
        numeroExpediente
        idEstadoExpediente { nombreEstado }
      }
    }
  }
`;

export const GET_HISTORIAL_POR_EXPEDIENTE = gql`
  query GetHistorialPorExpediente($idExpediente: Int!) {
    historialPorExpediente(idExpediente: $idExpediente) {
      idHistorial
      fechaCambio
      motivo
      idEstadoAnterior { nombreEstado }
      idEstadoNuevo    { nombreEstado }
      usuario          { idUsuario nombres paterno }
    }
  }
`;

export const GET_PROXIMO_NUMERO_DENUNCIA = gql`
  query GetProximoNumeroDenuncia {
    proximoNumeroDenuncia
  }
`;

export const ENVIAR_CITACION_ADMISION = gql`
  mutation EnviarCitacionAdmision($idDenuncia: Int!, $idUsuario: Int!) {
    enviarCitacionAdmision(idDenuncia: $idDenuncia, idUsuario: $idUsuario) {
      ok
      mensaje
      emailEnviado
    }
  }
`;

export const ENVIAR_CITACION_TERMINO_PROBATORIO = gql`
  mutation EnviarCitacionTerminoProbatorio($idDenuncia: Int!, $idUsuario: Int!) {
    enviarCitacionTerminoProbatorio(idDenuncia: $idDenuncia, idUsuario: $idUsuario) {
      ok
      mensaje
      enviados
      fallidos
      sinEmail
      destinatarios
    }
  }
`;

export const ENVIAR_NOTIFICACION_RESOLUCION = gql`
  mutation EnviarNotificacionResolucion($idDenuncia: Int!, $idUsuario: Int!) {
    enviarNotificacionResolucion(idDenuncia: $idDenuncia, idUsuario: $idUsuario) {
      ok
      mensaje
      enviados
      fallidos
      sinEmail
      destinatarios
    }
  }
`;

export const ENVIAR_NOTIFICACION_RESOLUCION_APELACION = gql`
  mutation EnviarNotificacionResolucionApelacion($idDenuncia: Int!, $idUsuario: Int!) {
    enviarNotificacionResolucionApelacion(idDenuncia: $idDenuncia, idUsuario: $idUsuario) {
      ok
      mensaje
      enviados
      fallidos
      sinEmail
      destinatarios
    }
  }
`;

export const ENVIAR_NOTIFICACION_SUBSANACION = gql`
  mutation EnviarNotificacionSubsanacion($idDenuncia: Int!, $idUsuario: Int!) {
    enviarNotificacionSubsanacion(idDenuncia: $idDenuncia, idUsuario: $idUsuario) {
      ok
      mensaje
      emailEnviado
    }
  }
`;

export const ENVIAR_NOTIFICACION_EJECUCION = gql`
  mutation EnviarNotificacionEjecucion($idDenuncia: Int!, $idUsuario: Int!) {
    enviarNotificacionEjecucion(idDenuncia: $idDenuncia, idUsuario: $idUsuario) {
      ok
      mensaje
      emailEnviado
    }
  }
`;