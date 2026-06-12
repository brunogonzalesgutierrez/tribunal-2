import { gql } from "@apollo/client";

// ============================================================
// RESOLUCIONES ANTIGUAS
// ============================================================

export const GET_RESOLUCIONES_ANTIGUAS = gql`
  query GetResolucionesAntiguas {
    allResolucionesAntiguas {
      idResolucionAntigua
      numeroResolucion
      fechaResolucion
      personaDenunciante {
        idPersona
        nombre
        primerApellido
        numeroDocumento
      }
      personaDenunciada {
        idPersona
        nombre
        primerApellido
        numeroDocumento
      }
      tipoSancion
      descripcion
      sancion
      documentoUrl
    }
  }
`;

export const GET_RESOLUCION_ANTIGUA_BY_ID = gql`
  query GetResolucionAntiguaById($id: Int!) {
    resolucionAntiguaById(id: $id) {
      idResolucionAntigua
      numeroResolucion
      fechaResolucion
      personaDenunciante {
        idPersona
        nombre
        primerApellido
        numeroDocumento
      }
      personaDenunciada {
        idPersona
        nombre
        primerApellido
        numeroDocumento
      }
      tipoSancion
      descripcion
      sancion
      documentoUrl
    }
  }
`;

export const CREAR_RESOLUCION_ANTIGUA = gql`
  mutation CrearResolucionAntigua($input: CrearResolucionAntiguaInput!) {
    crearResolucionAntigua(input: $input) {
      resolucionAntigua {
        idResolucionAntigua
        numeroResolucion
        personaDenunciante {
          idPersona
          nombre
          primerApellido
        }
        personaDenunciada {
          idPersona
          nombre
          primerApellido
        }
        tipoSancion
      }
    }
  }
`;

export const ACTUALIZAR_RESOLUCION_ANTIGUA = gql`
  mutation ActualizarResolucionAntigua($id: Int!, $input: ActualizarResolucionAntiguaInput!) {
    actualizarResolucionAntigua(id: $id, input: $input) {
      resolucionAntigua {
        idResolucionAntigua
        numeroResolucion
        personaDenunciante {
          idPersona
          nombre
          primerApellido
        }
        personaDenunciada {
          idPersona
          nombre
          primerApellido
        }
        tipoSancion
      }
    }
  }
`;

export const ELIMINAR_RESOLUCION_ANTIGUA = gql`
  mutation EliminarResolucionAntigua($id: Int!) {
    eliminarResolucionAntigua(id: $id) {
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