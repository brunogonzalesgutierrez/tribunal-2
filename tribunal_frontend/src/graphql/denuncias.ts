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
  expediente { idExpediente numeroExpediente }
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
  mutation ActualizarDenuncia($id: Int!, $input: ActualizarDenunciaInput!) {
    actualizarDenuncia(id: $id, input: $input) {
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
    }
  }
`;

export const ADMITIR_DENUNCIA = gql`
  mutation AdmitirDenuncia(
    $idDenuncia: Int!
    $idSala: Int!
    $idUsuario: Int!
    $numeroExpediente: String!
  ) {
    admitirDenuncia(
      idDenuncia: $idDenuncia
      idSala: $idSala
      idUsuario: $idUsuario
      numeroExpediente: $numeroExpediente
    ) {
      ok
      mensaje
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

