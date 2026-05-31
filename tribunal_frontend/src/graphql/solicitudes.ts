import { gql } from "@apollo/client";

// ─── SOLICITUD ACTUALIZACIÓN ──────────────────────────────

export const GET_SOLICITUDES = gql`
  query {
    allSolicitudes {
      idSolicitud
      codigoIanus
      codigoSala
      estadoSolicitud
      fechaSolicitud
      fechaConfirmacion
      observacion
      usuario {
        idUsuario
        nombres
        paterno
        email
      }
    }
  }
`;

export const CREAR_SOLICITUD = gql`
  mutation CrearSolicitud(
    $idUsuario: Int!
    $codigoIanus: String!
    $codigoSala: String!
    $observacion: String
  ) {
    crearSolicitud(
      idUsuario: $idUsuario
      codigoIanus: $codigoIanus
      codigoSala: $codigoSala
      observacion: $observacion
    ) {
      solicitud {
        idSolicitud
        codigoIanus
        codigoSala
        estadoSolicitud
        fechaSolicitud
        observacion
        usuario { idUsuario nombres paterno }
      }
    }
  }
`;

export const ELIMINAR_SOLICITUD = gql`
  mutation EliminarSolicitud($id: Int!) {
    eliminarSolicitud(id: $id) {
      ok
      mensaje
    }
  }
`;

// ─── CATÁLOGO DE APOYO ────────────────────────────────────

export const GET_USUARIOS_SIMPLE = gql`
  query {
    allUsuarios {
      idUsuario
      nombres
      paterno
      email
      activo
    }
  }
`;
export const ACTUALIZAR_SOLICITUD = gql`
  mutation ActualizarSolicitud(
    $id: Int!, 
    $estadoSolicitud: String!, 
    $fechaConfirmacion: DateTime, 
    $observacion: String
  ) {
    actualizarSolicitud(
      id: $id, 
      estadoSolicitud: $estadoSolicitud, 
      fechaConfirmacion: $fechaConfirmacion, 
      observacion: $observacion
    ) {
      ok
      mensaje
      solicitud {
        idSolicitud
        estadoSolicitud
        fechaConfirmacion
        observacion
      }
    }
  }
`;