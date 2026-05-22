import { gql } from "@apollo/client";

export const GET_TRIBUNALES = gql`
  query GetTribunales {
    allTribunales {
      idTribunal
      nombreTribunal
      instancia
      normaCreacion
      salasTribunal {
        idSala
        nombreSala
        activa
      }
      salasAudiencia {
        idSalaAud
        nombreSala
        capacidad
        equipadaVideoconf
        enlaceVirtual
        activa
      }
    }
  }
`;

// ── TRIBUNAL ───────────────────────────────────────────────
export const CREATE_TRIBUNAL = gql`
  mutation CreateTribunal(
    $nombre_tribunal: String!
    $instancia: String!
    $norma_creacion: String!
  ) {
    crearTribunal(
      nombreTribunal: $nombre_tribunal
      instancia: $instancia
      normaCreacion: $norma_creacion
    ) {
      tribunal {
        idTribunal
        nombreTribunal
        instancia
        normaCreacion
        salasTribunal {
          idSala
          nombreSala
          activa
        }
        salasAudiencia {
          idSalaAud
          nombreSala
          capacidad
          equipadaVideoconf
          enlaceVirtual
          activa
        }
      }
    }
  }
`;

export const UPDATE_TRIBUNAL = gql`
  mutation UpdateTribunal(
    $id: Int!
    $nombre_tribunal: String
    $instancia: String
    $norma_creacion: String
  ) {
    actualizarTribunal(
      id: $id
      nombreTribunal: $nombre_tribunal
      instancia: $instancia
      normaCreacion: $norma_creacion
    ) {
      tribunal {
        idTribunal
        nombreTribunal
        instancia
        normaCreacion
        salasTribunal {
          idSala
          nombreSala
          activa
        }
        salasAudiencia {
          idSalaAud
          nombreSala
          capacidad
          equipadaVideoconf
          enlaceVirtual
          activa
        }
      }
    }
  }
`;

export const DELETE_TRIBUNAL = gql`
  mutation DeleteTribunal($id: Int!) {
    eliminarTribunal(id: $id) {
      ok
      mensaje
    }
  }
`;

// ── SALA TRIBUNAL ──────────────────────────────────────────
export const CREATE_SALA_TRIBUNAL = gql`
  mutation CreateSalaTribunal(
    $id_tribunal: Int!
    $nombre_sala: String!
    $activa: Boolean!
  ) {
    crearSalaTribunal(
      idTribunal: $id_tribunal
      nombreSala: $nombre_sala
      activa: $activa
    ) {
      sala {
        idSala
        nombreSala
        activa
      }
    }
  }
`;

export const UPDATE_SALA_TRIBUNAL = gql`
  mutation UpdateSalaTribunal(
    $id: Int!
    $nombre_sala: String
    $activa: Boolean
  ) {
    actualizarSalaTribunal(
      id: $id
      nombreSala: $nombre_sala
      activa: $activa
    ) {
      sala {
        idSala
        nombreSala
        activa
      }
    }
  }
`;

export const DELETE_SALA_TRIBUNAL = gql`
  mutation DeleteSalaTribunal($id: Int!) {
    eliminarSalaTribunal(id: $id) {
      ok
      mensaje
    }
  }
`;

// ── SALA AUDIENCIA ─────────────────────────────────────────
export const CREATE_SALA_AUDIENCIA = gql`
  mutation CreateSalaAudiencia(
    $id_tribunal: Int!
    $nombre_sala: String!
    $capacidad: Int!
    $equipada_videoconf: Boolean
    $enlace_virtual: String
    $activa: Boolean
  ) {
    crearSalaAudiencia(
      idTribunal: $id_tribunal
      nombreSala: $nombre_sala
      capacidad: $capacidad
      equipadaVideoconf: $equipada_videoconf
      enlaceVirtual: $enlace_virtual
      activa: $activa
    ) {
      sala {
        idSalaAud
        nombreSala
        capacidad
        equipadaVideoconf
        enlaceVirtual
        activa
      }
    }
  }
`;

export const UPDATE_SALA_AUDIENCIA = gql`
  mutation UpdateSalaAudiencia($id: Int!, $input: ActualizarSalaAudienciaInput!) {
    actualizarSalaAudiencia(id: $id, input: $input) {
      sala {
        idSalaAud
        nombreSala
        capacidad
        equipadaVideoconf
        enlaceVirtual
        activa
      }
    }
  }
`;

export const DELETE_SALA_AUDIENCIA = gql`
  mutation DeleteSalaAudiencia($id: Int!) {
    eliminarSalaAudiencia(id: $id) {
      ok
      mensaje
    }
  }
`;