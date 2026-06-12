import { gql } from "@apollo/client";

// ─── TIPO RESOLUCIÓN ─────────────────────────────────────

export const GET_TIPOS_RESOLUCION = gql`
  query {
    allTiposResolucion {
      idTipoRes
      codigo
      nombre
      nivelJerarquico
      descripcion
    }
  }
`;

export const CREAR_TIPO_RESOLUCION = gql`
  mutation CrearTipoResolucion(
    $codigo: String!
    $nombre: String!
    $nivelJerarquico: Int
    $descripcion: String
  ) {
    crearTipoResolucion(
      codigo: $codigo
      nombre: $nombre
      nivelJerarquico: $nivelJerarquico
      descripcion: $descripcion
    ) {
      tipoResolucion {
        idTipoRes
        codigo
        nombre
        nivelJerarquico
        descripcion
      }
    }
  }
`;

export const ACTUALIZAR_TIPO_RESOLUCION = gql`
  mutation ActualizarTipoResolucion($id: Int!, $input: ActualizarTipoResolucionInput!) {
    actualizarTipoResolucion(id: $id, input: $input) {
      tipoResolucion {
        idTipoRes
        codigo
        nombre
        nivelJerarquico
        descripcion
      }
    }
  }
`;

export const ELIMINAR_TIPO_RESOLUCION = gql`
  mutation EliminarTipoResolucion($id: Int!) {
    eliminarTipoResolucion(id: $id) {
      ok
      mensaje
    }
  }
`;

// ─── RESOLUCIÓN ───────────────────────────────────────────

export const GET_RESOLUCIONES = gql`
  query {
    allResoluciones {
      idResolucion
      numeroResolucion
      fechaResolucion
      fechaNotificacion
      parteDispositiva
      fundamentacion
      estado
      esRecurrible
      plazoRecursoDias
      idExpediente { idExpediente numeroExpediente ano }
      idTipoRes { idTipoRes codigo nombre nivelJerarquico }
      idDocumento { idDocumento titulo }
    }
  }
`;

export const CREAR_RESOLUCION = gql`
  mutation CrearResolucion($input: CrearResolucionInput!) {
    crearResolucion(input: $input) {
      resolucion {
        idResolucion
        numeroResolucion
        fechaResolucion
        estado
        esRecurrible
        idExpediente { idExpediente numeroExpediente }
        idTipoRes { idTipoRes nombre codigo }
      }
    }
  }
`;

export const ACTUALIZAR_RESOLUCION = gql`
  mutation ActualizarResolucion($id: Int!, $input: ActualizarResolucionInput!) {
    actualizarResolucion(id: $id, input: $input) {
      resolucion {
        idResolucion
        numeroResolucion
        fechaResolucion
        parteDispositiva
        fundamentacion
        estado
        esRecurrible
        plazoRecursoDias
        idTipoRes { nombre }
      }
    }
  }
`;

export const ELIMINAR_RESOLUCION = gql`
  mutation EliminarResolucion($id: Int!) {
    eliminarResolucion(id: $id) {
      ok
      mensaje
    }
  }
`;

// ─── TIPO RECURSO ─────────────────────────────────────────

export const GET_TIPOS_RECURSO = gql`
  query {
    allTiposRecurso {
      idTipoRecurso
      nombre
      descripcion
    }
  }
`;

export const CREAR_TIPO_RECURSO = gql`
  mutation CrearTipoRecurso($nombre: String!, $descripcion: String) {
    crearTipoRecurso(nombre: $nombre, descripcion: $descripcion) {
      tipoRecurso {
        idTipoRecurso
        nombre
        descripcion
      }
    }
  }
`;

export const ACTUALIZAR_TIPO_RECURSO = gql`
  mutation ActualizarTipoRecurso($id: Int!, $input: ActualizarTipoRecursoInput!) {
    actualizarTipoRecurso(id: $id, input: $input) {
      tipoRecurso {
        idTipoRecurso
        nombre
        descripcion
      }
    }
  }
`;

export const ELIMINAR_TIPO_RECURSO = gql`
  mutation EliminarTipoRecurso($id: Int!) {
    eliminarTipoRecurso(id: $id) {
      ok
      mensaje
    }
  }
`;

// ─── RECURSO ──────────────────────────────────────────────

export const GET_RECURSOS = gql`
  query {
    allRecursos {
      idRecurso
      fechaInterposicion
      estadoRecurso
      fundamentos
      idResolucionImpugnada {
        idResolucion
        numeroResolucion
        idExpediente { numeroExpediente }
      }
      idTipoRecurso { idTipoRecurso nombre }
      idRecurrente {
        idParte
        idPersona { nombre primerApellido }
        idRol { nombreRol }
      }
      idExpedienteAlzada { idExpediente numeroExpediente }
      idResolucionRespuesta { idResolucion numeroResolucion }
    }
  }
`;

export const CREAR_RECURSO = gql`
  mutation CrearRecurso(
    $idResolucionImpugnada: Int!
    $idTipoRecurso: Int!
    $idRecurrente: Int!
    $fundamentos: String
  ) {
    crearRecurso(
      idResolucionImpugnada: $idResolucionImpugnada
      idTipoRecurso: $idTipoRecurso
      idRecurrente: $idRecurrente
      fundamentos: $fundamentos
    ) {
      recurso {
        idRecurso
        estadoRecurso
        fechaInterposicion
        fundamentos
        idResolucionImpugnada { numeroResolucion }
        idTipoRecurso { nombre }
        idRecurrente { idPersona { nombre primerApellido } }
      }
    }
  }
`;

export const ACTUALIZAR_RECURSO = gql`
  mutation ActualizarRecurso($id: Int!, $input: ActualizarRecursoInput!) {
    actualizarRecurso(id: $id, input: $input) {
      recurso {
        idRecurso
        estadoRecurso
        fundamentos
      }
    }
  }
`;

export const ELIMINAR_RECURSO = gql`
  mutation EliminarRecurso($id: Int!) {
    eliminarRecurso(id: $id) {
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

export const GET_PARTES_PROCESALES_SIMPLE = gql`
  query {
    allPartesProcesales {
      idParte
      activo
      idPersona { idPersona nombre primerApellido }
      idExpediente { idExpediente numeroExpediente }
      idRol { nombreRol }
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