import { gql } from "@apollo/client";

// ─── TRIBUNAL ────────────────────────────────────────────

export const GET_TRIBUNALES = gql`
  query {
    allTribunales {
      idTribunal
      nombreTribunal
      instancia
      normaCreacion
    }
  }
`;

export const CREAR_TRIBUNAL = gql`
  mutation CrearTribunal(
    $nombreTribunal: String!
    $instancia: String!
    $normaCreacion: String!
  ) {
    crearTribunal(
      nombreTribunal: $nombreTribunal
      instancia: $instancia
      normaCreacion: $normaCreacion
    ) {
      tribunal { idTribunal nombreTribunal instancia normaCreacion }
    }
  }
`;

export const ACTUALIZAR_TRIBUNAL = gql`
  mutation ActualizarTribunal(
    $id: Int!
    $nombreTribunal: String
    $instancia: String
    $normaCreacion: String
  ) {
    actualizarTribunal(
      id: $id
      nombreTribunal: $nombreTribunal
      instancia: $instancia
      normaCreacion: $normaCreacion
    ) {
      tribunal { idTribunal nombreTribunal instancia normaCreacion }
    }
  }
`;

export const ELIMINAR_TRIBUNAL = gql`
  mutation EliminarTribunal($id: Int!) {
    eliminarTribunal(id: $id) {
      ok
      mensaje
    }
  }
`;

// ─── SALA TRIBUNAL ───────────────────────────────────────

export const GET_SALAS_TRIBUNAL = gql`
  query {
    allSalasTribunal {
      idSala
      nombreSala
      activa
      idTribunal { idTribunal nombreTribunal instancia }
    }
  }
`;

export const CREAR_SALA_TRIBUNAL = gql`
  mutation CrearSalaTribunal(
    $idTribunal: Int!
    $nombreSala: String!
    $activa: Boolean
  ) {
    crearSalaTribunal(
      idTribunal: $idTribunal
      nombreSala: $nombreSala
      activa: $activa
    ) {
      sala { idSala nombreSala activa idTribunal { nombreTribunal } }
    }
  }
`;

export const ACTUALIZAR_SALA_TRIBUNAL = gql`
  mutation ActualizarSalaTribunal(
    $id: Int!
    $nombreSala: String
    $activa: Boolean
  ) {
    actualizarSalaTribunal(id: $id, nombreSala: $nombreSala, activa: $activa) {
      sala { idSala nombreSala activa idTribunal { nombreTribunal } }
    }
  }
`;

export const ELIMINAR_SALA_TRIBUNAL = gql`
  mutation EliminarSalaTribunal($id: Int!) {
    eliminarSalaTribunal(id: $id) {
      ok
      mensaje
    }
  }
`;

// ─── VOCAL TRIBUNAL ──────────────────────────────────────

export const GET_VOCALES = gql`
  query {
    allVocales {
      idVocal
      cargo
      fechaPosesion
      fechaConclusion
      activo
      idPersona {
        idPersona
        nombre
        primerApellido
        segundoApellido
        numeroDocumento
        esAbogado
      }
      idSala { idSala nombreSala idTribunal { nombreTribunal } }
      usuario { idUsuario nombres paterno }
    }
  }
`;

export const GET_PERSONAS = gql`
  query {
    allPersonas {
      idPersona
      nombre
      primerApellido
      segundoApellido
      numeroDocumento
      esAbogado
    }
  }
`;

export const CREAR_VOCAL = gql`
  mutation CrearVocalTribunal(
    $idPersona: Int!
    $cargo: String!
    $fechaPosesion: String!
    $idUsuario: Int!
    $idSala: Int
  ) {
    crearVocal(
      idPersona: $idPersona
      cargo: $cargo
      fechaPosesion: $fechaPosesion
      idUsuario: $idUsuario
      idSala: $idSala
    ) {
      vocal {
        idVocal cargo fechaPosesion activo
        idPersona { nombre primerApellido }
        idSala { nombreSala }
      }
    }
  }
`;

export const ACTUALIZAR_VOCAL = gql`
  mutation ActualizarVocal($id: Int!, $input: ActualizarVocalInput!) {
    actualizarVocal(id: $id, input: $input) {
      vocal {
        idVocal cargo fechaPosesion fechaConclusion activo
        idSala { idSala nombreSala }
      }
    }
  }
`;

export const ELIMINAR_VOCAL = gql`
  mutation EliminarVocal($id: Int!) {
    eliminarVocal(id: $id) {
      ok
      mensaje
    }
  }
`;

// ─── CONFORMACIÓN SALA-EXPEDIENTE ────────────────────────

export const GET_CONFORMACIONES = gql`
  query {
    allConformaciones {
      idConformacion
      rolEnCaso
      fechaAsignacion
      idExpediente { idExpediente numeroExpediente }
      idVocal {
        idVocal cargo
        idPersona { nombre primerApellido }
      }
    }
  }
`;

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

export const CREAR_CONFORMACION = gql`
  mutation CrearConformacion(
    $idExpediente: Int!
    $idVocal: Int!
    $rolEnCaso: String!
  ) {
    crearConformacion(
      idExpediente: $idExpediente
      idVocal: $idVocal
      rolEnCaso: $rolEnCaso
    ) {
      conformacion {
        idConformacion rolEnCaso fechaAsignacion
        idExpediente { numeroExpediente }
        idVocal { cargo idPersona { nombre primerApellido } }
      }
    }
  }
`;

export const ACTUALIZAR_CONFORMACION = gql`
  mutation ActualizarConformacion($id: Int!, $input: ActualizarConformacionInput!) {
    actualizarConformacion(id: $id, input: $input) {
      conformacion {
        idConformacion rolEnCaso
        idVocal { cargo idPersona { nombre primerApellido } }
      }
    }
  }
`;

export const ELIMINAR_CONFORMACION = gql`
  mutation EliminarConformacion($id: Int!) {
    eliminarConformacion(id: $id) {
      ok
      mensaje
    }
  }
`;