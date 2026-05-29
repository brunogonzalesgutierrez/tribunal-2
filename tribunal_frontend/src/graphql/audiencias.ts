import { gql } from "@apollo/client";

// ─── SALA AUDIENCIA ──────────────────────────────────────

export const GET_SALAS_AUDIENCIA = gql`
  query {
    allSalasAudiencia {
      idSalaAud
      nombreSala
      capacidad
      equipadaVideoconf
      enlaceVirtual
      activa
      idTribunal { idTribunal nombreTribunal }
    }
  }
`;

export const CREAR_SALA_AUDIENCIA = gql`
  mutation CrearSalaAudiencia(
    $idTribunal: Int!
    $nombreSala: String!
    $capacidad: Int!
    $equipadaVideoconf: Boolean
    $enlaceVirtual: String
    $activa: Boolean
  ) {
    crearSalaAudiencia(
      idTribunal: $idTribunal
      nombreSala: $nombreSala
      capacidad: $capacidad
      equipadaVideoconf: $equipadaVideoconf
      enlaceVirtual: $enlaceVirtual
      activa: $activa
    ) {
      sala {
        idSalaAud
        nombreSala
        capacidad
        equipadaVideoconf
        enlaceVirtual
        activa
        idTribunal { idTribunal nombreTribunal }
      }
    }
  }
`;

export const ACTUALIZAR_SALA_AUDIENCIA = gql`
  mutation ActualizarSalaAudiencia($id: Int!, $input: ActualizarSalaAudienciaInput!) {
    actualizarSalaAudiencia(id: $id, input: $input) {
      sala {
        idSalaAud
        nombreSala
        capacidad
        equipadaVideoconf
        enlaceVirtual
        activa
        idTribunal { nombreTribunal }
      }
    }
  }
`;

export const ELIMINAR_SALA_AUDIENCIA = gql`
  mutation EliminarSalaAudiencia($id: Int!) {
    eliminarSalaAudiencia(id: $id) {
      ok
      mensaje
    }
  }
`;

// ─── TIPO AUDIENCIA ──────────────────────────────────────

export const GET_TIPOS_AUDIENCIA = gql`
  query {
    allTiposAudiencia {
      idTipoAudiencia
      nombre
      duracionEstimada
      descripcion
      idTipoProceso { idTipoProceso nombre codigo }
    }
  }
`;

export const CREAR_TIPO_AUDIENCIA = gql`
  mutation CrearTipoAudiencia(
    $nombre: String!
    $duracionEstimada: Int!
    $idTipoProceso: Int!
    $descripcion: String
  ) {
    crearTipoAudiencia(
      nombre: $nombre
      duracionEstimada: $duracionEstimada
      idTipoProceso: $idTipoProceso
      descripcion: $descripcion
    ) {
      tipoAudiencia {
        idTipoAudiencia
        nombre
        duracionEstimada
        descripcion
        idTipoProceso { nombre }
      }
    }
  }
`;

export const ELIMINAR_TIPO_AUDIENCIA = gql`
  mutation EliminarTipoAudiencia($id: Int!) {
    eliminarTipoAudiencia(id: $id) {
      ok
      mensaje
    }
  }
`;

// ─── AUDIENCIA ───────────────────────────────────────────

export const GET_AUDIENCIAS = gql`
  query {
    allAudiencias {
      idAudiencia
      fechaHoraProgramada
      fechaHoraInicio
      fechaHoraFin
      estadoAudiencia
      motivoSuspension
      linkVideoconferencia
      idExpediente { idExpediente numeroExpediente ano }
      idTipoAudiencia { idTipoAudiencia nombre duracionEstimada }
      idSalaAud { idSalaAud nombreSala capacidad equipadaVideoconf }
    }
  }
`;

export const CREAR_AUDIENCIA = gql`
  mutation CrearAudiencia($input: CrearAudienciaInput!) {
    crearAudiencia(input: $input) {
      audiencia {
        idAudiencia
        fechaHoraProgramada
        estadoAudiencia
        linkVideoconferencia
        idExpediente { idExpediente numeroExpediente }
        idTipoAudiencia { idTipoAudiencia nombre }
        idSalaAud { idSalaAud nombreSala }
      }
    }
  }
`;

export const ACTUALIZAR_AUDIENCIA = gql`
  mutation ActualizarAudiencia($id: Int!, $input: ActualizarAudienciaInput!) {
    actualizarAudiencia(id: $id, input: $input) {
      audiencia {
        idAudiencia
        fechaHoraProgramada
        fechaHoraInicio
        fechaHoraFin
        estadoAudiencia
        motivoSuspension
        linkVideoconferencia
        idTipoAudiencia { nombre }
        idSalaAud { nombreSala }
      }
    }
  }
`;

export const ELIMINAR_AUDIENCIA = gql`
  mutation EliminarAudiencia($id: Int!) {
    eliminarAudiencia(id: $id) {
      ok
      mensaje
    }
  }
`;

// ─── ASISTENCIA AUDIENCIA ────────────────────────────────

export const GET_ASISTENCIAS = gql`
  query {
    allAsistencias {
      idAsistencia
      rolEnAudiencia
      asistio
      horaIngreso
      motivoInasistencia
      idAudiencia { idAudiencia fechaHoraProgramada idExpediente { numeroExpediente } }
      idPersona { idPersona nombre primerApellido numeroDocumento }
    }
  }
`;

export const REGISTRAR_ASISTENCIA = gql`
  mutation RegistrarAsistencia(
    $idAudiencia: Int!
    $idPersona: Int!
    $rolEnAudiencia: String!
    $asistio: Boolean
    $horaIngreso: DateTime
  ) {
    registrarAsistencia(
      idAudiencia: $idAudiencia
      idPersona: $idPersona
      rolEnAudiencia: $rolEnAudiencia
      asistio: $asistio
      horaIngreso: $horaIngreso
    ) {
      asistencia {
        idAsistencia
        rolEnAudiencia
        asistio
        horaIngreso
        idAudiencia { idAudiencia }
        idPersona { nombre primerApellido }
      }
    }
  }
`;

export const ACTUALIZAR_ASISTENCIA = gql`
  mutation ActualizarAsistencia($id: Int!, $input: ActualizarAsistenciaInput!) {
    actualizarAsistencia(id: $id, input: $input) {
      asistencia {
        idAsistencia
        asistio
        motivoInasistencia
        horaIngreso
      }
    }
  }
`;

export const ELIMINAR_ASISTENCIA = gql`
  mutation EliminarAsistencia($id: Int!) {
    eliminarAsistencia(id: $id) {
      ok
      mensaje
    }
  }
`;

// ─── ACTA AUDIENCIA ──────────────────────────────────────

export const GET_ACTAS = gql`
  query {
    allActas {
      idActa
      contenido
      fechaActa
      firmada
      urlGrabacion
      idAudiencia {
        idAudiencia
        fechaHoraProgramada
        idExpediente { numeroExpediente }
      }
      usuario { idUsuario nombres paterno }
    }
  }
`;

export const CREAR_ACTA = gql`
  mutation CrearActa(
    $idAudiencia: Int!
    $idUsuario: Int!
    $contenido: String!
    $firmada: Boolean
    $urlGrabacion: String
  ) {
    crearActa(
      idAudiencia: $idAudiencia
      idUsuario: $idUsuario
      contenido: $contenido
      firmada: $firmada
      urlGrabacion: $urlGrabacion
    ) {
      acta {
        idActa
        contenido
        fechaActa
        firmada
        urlGrabacion
        idAudiencia { idAudiencia idExpediente { numeroExpediente } }
        usuario { nombres paterno }
      }
    }
  }
`;

export const ACTUALIZAR_ACTA = gql`
  mutation ActualizarActa($id: Int!, $input: ActualizarActaInput!) {
    actualizarActa(id: $id, input: $input) {
      acta {
        idActa
        contenido
        firmada
        urlGrabacion
      }
    }
  }
`;

export const ELIMINAR_ACTA = gql`
  mutation EliminarActa($id: Int!) {
    eliminarActa(id: $id) {
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

export const GET_TRIBUNALES_SIMPLE = gql`
  query {
    allTribunales {
      idTribunal
      nombreTribunal
    }
  }
`;

export const GET_TIPOS_PROCESO_SIMPLE = gql`
  query {
    allTiposProceso {
      idTipoProceso
      nombre
      codigo
    }
  }
`;

export const GET_PERSONAS_SIMPLE = gql`
  query {
    allPersonas {
      idPersona
      nombre
      primerApellido
      numeroDocumento
    }
  }
`;

export const GET_USUARIOS_SIMPLE = gql`
  query {
    allUsuarios {
      idUsuario
      nombres
      paterno
      activo
    }
  }
`;