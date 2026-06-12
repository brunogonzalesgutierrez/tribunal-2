import { gql } from "@apollo/client";

// ============================================================
// QUERIES
// ============================================================


export const GET_DENUNCIAS = gql`
  query GetDenuncias {
    allDenuncias {
      id
      numeroDenuncia
      fechaDenuncia
      denunciante {
        idPersona
        nombre
        primerApellido
        numeroDocumento
      }
      denunciado {
        idPersona
        nombre
        primerApellido
        numeroDocumento
      }
      tipoDenunciado
      descripcion
      estado
      resolucion
      fechaResolucion
      expediente {
        idExpediente
        numeroExpediente
      }
    }
  }
`;

export const GET_DENUNCIA_BY_ID = gql`
  query GetDenunciaById($id: Int!) {
    denunciaById(id: $id) {
      id
      numeroDenuncia
      fechaDenuncia
      denunciante {
        idPersona
        nombre
        primerApellido
        numeroDocumento
      }
      denunciado {
        idPersona
        nombre
        primerApellido
        numeroDocumento
      }
      tipoDenunciado
      descripcion
      estado
      resolucion
      fechaResolucion
      expediente {
        idExpediente
        numeroExpediente
      }
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
        denunciante {
          idPersona
          nombre
          primerApellido
        }
        denunciado {
          idPersona
          nombre
          primerApellido
        }
        estado
      }
    }
  }
`;

export const ACTUALIZAR_DENUNCIA = gql`
  mutation ActualizarDenuncia($id: Int!, $input: ActualizarDenunciaInput!) {
    actualizarDenuncia(id: $id, input: $input) {
      denuncia {
        id
        estado
        resolucion
        fechaResolucion
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