import { gql } from "@apollo/client";

// ─── PERSONA ─────────────────────────────────────────────

export const GET_PERSONAS = gql`
  query {
    allPersonas {
      idPersona
      numeroDocumento
      nombre
      primerApellido
      segundoApellido
      estamento
      registroUniversitario
      esAbogado
      titularA
    }
  }
`;

export const CREAR_PERSONA = gql`
  mutation CrearPersona($input: CrearPersonaInput!) {
    crearPersona(input: $input) {
      persona {
        idPersona
        numeroDocumento
        nombre
        primerApellido
        segundoApellido
        estamento
        registroUniversitario
        esAbogado
        titularA
      }
    }
  }
`;

export const ACTUALIZAR_PERSONA = gql`
  mutation ActualizarPersona($id: Int!, $input: ActualizarPersonaInput!) {
    actualizarPersona(id: $id, input: $input) {
      persona {
        idPersona
        numeroDocumento
        nombre
        primerApellido
        segundoApellido
        estamento
        registroUniversitario
        esAbogado
        titularA
      }
    }
  }
`;

export const ELIMINAR_PERSONA = gql`
  mutation EliminarPersona($id: Int!) {
    eliminarPersona(id: $id) {
      ok
      mensaje
    }
  }
`;

// ─── CONTACTO PERSONA ─────────────────────────────────────

export const GET_CONTACTOS = gql`
  query {
    allContactos {
      idContacto
      tipoContacto
      valor
      esPrincipal
      validado
      idPersona {
        idPersona
        nombre
        primerApellido
        numeroDocumento
      }
    }
  }
`;

export const CREAR_CONTACTO = gql`
  mutation CrearContacto(
    $idPersona: Int!
    $tipoContacto: String!
    $valor: String!
    $esPrincipal: Boolean
  ) {
    crearContacto(
      idPersona: $idPersona
      tipoContacto: $tipoContacto
      valor: $valor
      esPrincipal: $esPrincipal
    ) {
      contacto {
        idContacto
        tipoContacto
        valor
        esPrincipal
        validado
        idPersona { idPersona nombre primerApellido }
      }
    }
  }
`;

export const ACTUALIZAR_CONTACTO = gql`
  mutation ActualizarContacto($id: Int!, $input: ActualizarContactoInput!) {
    actualizarContacto(id: $id, input: $input) {
      contacto {
        idContacto
        tipoContacto
        valor
        esPrincipal
        validado
      }
    }
  }
`;

export const ELIMINAR_CONTACTO = gql`
  mutation EliminarContacto($id: Int!) {
    eliminarContacto(id: $id) {
      ok
      mensaje
    }
  }
`;

// ─── ROL PROCESAL ─────────────────────────────────────────

export const GET_ROLES_PROCESAL = gql`
  query {
    allRolesProcesal {
      idRol
      nombreRol
    }
  }
`;

export const CREAR_ROL_PROCESAL = gql`
  mutation CrearRolProcesal($nombreRol: String!) {
    crearRolProcesal(nombreRol: $nombreRol) {
      rolProcesal {
        idRol
        nombreRol
      }
    }
  }
`;

export const ACTUALIZAR_ROL_PROCESAL = gql`
  mutation ActualizarRolProcesal($id: Int!, $input: ActualizarRolProcesalInput!) {
    actualizarRolProcesal(id: $id, input: $input) {
      rolProcesal {
        idRol
        nombreRol
      }
    }
  }
`;

export const ELIMINAR_ROL_PROCESAL = gql`
  mutation EliminarRolProcesal($id: Int!) {
    eliminarRolProcesal(id: $id) {
      ok
      mensaje
    }
  }
`;

// ─── PARTE PROCESAL ───────────────────────────────────────

export const GET_PARTES_PROCESALES = gql`
  query {
    allPartesProcesales {
      idParte
      fechaInclusion
      fechaExclusion
      activo
      idExpediente {
        idExpediente
        numeroExpediente
        ano
      }
      idPersona {
        idPersona
        nombre
        primerApellido
        segundoApellido
        numeroDocumento
        esAbogado
      }
      idRol {
        idRol
        nombreRol
      }
    }
  }
`;

export const CREAR_PARTE_PROCESAL = gql`
  mutation CrearParteProcesal(
    $idExpediente: Int!
    $idPersona: Int!
    $idRol: Int!
  ) {
    crearParteProcesal(
      idExpediente: $idExpediente
      idPersona: $idPersona
      idRol: $idRol
    ) {
      parte {
        idParte
        activo
        fechaInclusion
        idExpediente { idExpediente numeroExpediente }
        idPersona { idPersona nombre primerApellido }
        idRol { idRol nombreRol }
      }
    }
  }
`;

export const ACTUALIZAR_PARTE_PROCESAL = gql`
  mutation ActualizarParteProcesal($id: Int!, $input: ActualizarParteProcesalInput!) {
    actualizarParteProcesal(id: $id, input: $input) {
      parte {
        idParte
        activo
        fechaExclusion
      }
    }
  }
`;

export const ELIMINAR_PARTE_PROCESAL = gql`
  mutation EliminarParteProcesal($id: Int!) {
    eliminarParteProcesal(id: $id) {
      ok
      mensaje
    }
  }
`;

// ─── CATÁLOGOS DE APOYO ───────────────────────────────────

export const VERIFICAR_CERTIFICADO = gql`
  query VerificarCertificado($idPersona: Int!) {
    verificarCertificadoPersona(idPersona: $idPersona) {
      puedeEmitir
      tieneProcesosActivos
      procesosActivos
      emailPersona
      mensaje
    }
  }
`;

export const ENVIAR_CERTIFICADO_NO_HALLADO = gql`
  mutation EnviarCertificadoNoHallado($idPersona: Int!) {
    enviarCertificadoNoHallado(idPersona: $idPersona) {
      ok
      mensaje
      emailEnviado
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