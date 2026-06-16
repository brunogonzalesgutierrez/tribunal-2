import { gql } from "@apollo/client";

// ─── TIPO DOC ────────────────────────────────────────────

export const GET_TIPOS_DOC = gql`
  query {
    allTiposDoc {
      idTipoDoc
      codigo
      nombre
      requiereFirma
      esPublico
      descripcion
    }
  }
`;

export const CREAR_TIPO_DOC = gql`
  mutation CrearTipoDoc(
    $codigo: String!
    $nombre: String!
    $requiereFirma: Boolean
    $esPublico: Boolean
    $descripcion: String
  ) {
    crearTipoDoc(
      codigo: $codigo
      nombre: $nombre
      requiereFirma: $requiereFirma
      esPublico: $esPublico
      descripcion: $descripcion
    ) {
      tipoDoc {
        idTipoDoc
        codigo
        nombre
        requiereFirma
        esPublico
        descripcion
      }
    }
  }
`;

export const ACTUALIZAR_TIPO_DOC = gql`
  mutation ActualizarTipoDoc($id: Int!, $input: ActualizarTipoDocInput!) {
    actualizarTipoDoc(id: $id, input: $input) {
      tipoDoc {
        idTipoDoc
        codigo
        nombre
        requiereFirma
        esPublico
        descripcion
      }
    }
  }
`;

export const ELIMINAR_TIPO_DOC = gql`
  mutation EliminarTipoDoc($id: Int!) {
    eliminarTipoDoc(id: $id) {
      ok
      mensaje
    }
  }
`;

// ─── DOCUMENTO ───────────────────────────────────────────

export const GET_DOCUMENTOS = gql`
  query {
    allDocumentos {
      idDocumento
      titulo
      fechaPresentacion
      numeroFolio
      hashIntegridad
      rutaArchivo
      tamanoKb
      esElectronico
      firmadoDigitalmente
      idExpediente {
        idExpediente
        numeroExpediente
        ano
      }
      idTipoDoc {
        idTipoDoc
        codigo
        nombre
        requiereFirma
        esPublico
      }
      idPersona {
        idPersona
        nombre
        primerApellido
      }
    }
  }
`;

export const GET_DOCUMENTO_BY_ID = gql`
  query DocumentoById($id: Int!) {
    documentoById(id: $id) {
      idDocumento
      titulo
      fechaPresentacion
      numeroFolio
      rutaArchivo
      tamanoKb
      esElectronico
      firmadoDigitalmente
      idExpediente { idExpediente numeroExpediente }
      idTipoDoc { idTipoDoc codigo nombre requiereFirma esPublico }
      idPersona { idPersona nombre primerApellido }
    }
  }
`;

export const CREAR_DOCUMENTO = gql`
  mutation CrearDocumento(
    $idExpediente: Int!
    $idTipoDoc: Int!
    $titulo: String!
    $numeroFolio: Int
    $rutaArchivo: String
    $tamanoKb: Int
  ) {
    crearDocumento(
      idExpediente: $idExpediente
      idTipoDoc: $idTipoDoc
      titulo: $titulo
      numeroFolio: $numeroFolio
      rutaArchivo: $rutaArchivo
      tamanoKb: $tamanoKb
    ) {
      documento {
        idDocumento
        titulo
        fechaPresentacion
        numeroFolio
        rutaArchivo
        tamanoKb
        esElectronico
        firmadoDigitalmente
        idExpediente { idExpediente numeroExpediente }
        idTipoDoc { idTipoDoc nombre codigo }
      }
    }
  }
`;

export const ACTUALIZAR_DOCUMENTO = gql`
  mutation ActualizarDocumento($id: Int!, $input: ActualizarDocumentoInput!) {
    actualizarDocumento(id: $id, input: $input) {
      documento {
        idDocumento
        titulo
        numeroFolio
        rutaArchivo
        idExpediente { idExpediente numeroExpediente }
        idTipoDoc { idTipoDoc nombre }
      }
    }
  }
`;

export const ELIMINAR_DOCUMENTO = gql`
  mutation EliminarDocumento($id: Int!) {
    eliminarDocumento(id: $id) {
      ok
      mensaje
    }
  }
`;

// ─── NOTIFICACIÓN ─────────────────────────────────────────

export const GET_NOTIFICACIONES = gql`
  query {
    allNotificaciones {
      idNotificacion
      tipoNotificacion
      fechaEmision
      fechaDiligencia
      estadoNotificacion
      idExpediente {
        idExpediente
        numeroExpediente
      }
      idDocumento {
        idDocumento
        titulo
      }
      idParte {
        idParte
        idPersona {
          nombre
          primerApellido
        }
        idRol {
          nombreRol
        }
      }
      usuario {
        idUsuario
        nombres
        paterno
      }
    }
  }
`;

export const CREAR_NOTIFICACION = gql`
  mutation CrearNotificacion(
    $idExpediente: Int!
    $idDocumento: Int!
    $idParte: Int!
    $idUsuario: Int!
    $tipoNotificacion: String!
  ) {
    crearNotificacion(
      idExpediente: $idExpediente
      idDocumento: $idDocumento
      idParte: $idParte
      idUsuario: $idUsuario
      tipoNotificacion: $tipoNotificacion
    ) {
      notificacion {
        idNotificacion
        tipoNotificacion
        estadoNotificacion
        fechaEmision
        idExpediente { idExpediente numeroExpediente }
        idDocumento { idDocumento titulo }
        idParte { idParte idPersona { nombre primerApellido } }
        usuario { idUsuario nombres paterno }
      }
    }
  }
`;

export const ACTUALIZAR_NOTIFICACION = gql`
  mutation ActualizarNotificacion($id: Int!, $input: ActualizarNotificacionInput!) {
    actualizarNotificacion(id: $id, input: $input) {
      notificacion {
        idNotificacion
        estadoNotificacion
        fechaDiligencia
      }
    }
  }
`;

export const ELIMINAR_NOTIFICACION = gql`
  mutation EliminarNotificacion($id: Int!) {
    eliminarNotificacion(id: $id) {
      ok
      mensaje
    }
  }
`;

// ─── CATÁLOGOS DE APOYO ──────────────────────────────────

export const GET_EXPEDIENTES_SIMPLE = gql`
  query {
    allExpedientes {
      idExpediente
      numeroExpediente
      ano
      idEstadoExpediente { nombreEstado }
    }
  }
`;

export const GET_PARTES_PROCESALES = gql`
  query {
    allPartesProcesales {
      idParte
      activo
      idPersona {
        idPersona
        nombre
        primerApellido
      }
      idExpediente {
        idExpediente
        numeroExpediente
      }
      idRol {
        nombreRol
      }
    }
  }
`;


export const CREAR_NOTIFICACION_TABLON = gql`
  mutation CrearNotificacionTablon(
    $idExpediente: Int!
    $idParte: Int!
    $idUsuario: Int!
    $descripcion: String!
  ) {
    crearNotificacionTablon(
      idExpediente: $idExpediente
      idParte: $idParte
      idUsuario: $idUsuario
      descripcion: $descripcion
    ) {
      ok
      mensaje
      notificacion {
        idNotificacion
        tipoNotificacion
        estadoNotificacion
        fechaEmision
        idExpediente { idExpediente numeroExpediente }
        idDocumento { idDocumento titulo }
        idParte { idParte idPersona { nombre primerApellido } }
      }
    }
  }
`;


