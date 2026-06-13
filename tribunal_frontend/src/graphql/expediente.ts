import { gql } from "@apollo/client";

// ─── CATÁLOGOS NECESARIOS ────────────────────────────────

export const GET_SALAS_TRIBUNAL = gql`
  query {
    allSalasTribunal {
      idSala
      nombreSala
      activa
      idTribunal { idTribunal nombreTribunal }
    }
  }
`;

export const GET_TIPOS_PROCESO = gql`
  query {
    allTiposProceso {
      idTipoProceso
      nombre
      codigo
    }
  }
`;

export const GET_ESTADOS_EXPEDIENTE = gql`
  query {
    allEstadosExpediente {
      idEstado
      nombreEstado
      esTerminal
    }
  }
`;

// ─── EXPEDIENTE ──────────────────────────────────────────

export const GET_EXPEDIENTES = gql`
  query {
    allExpedientes {
      idExpediente
      numeroExpediente
      ano
      fechaIngreso
      fechaConclusion
      descripcion
      idSala { 
        idSala 
        nombreSala 
        idTribunal { 
          idTribunal 
          nombreTribunal 
        } 
      }
      idTipoProceso { 
        idTipoProceso 
        nombre 
        codigo 
      }
      idEstadoExpediente { 
        idEstado 
        nombreEstado 
        esTerminal 
      }
    }
  }
`;

export const GET_EXPEDIENTE_BY_ID = gql`
  query ExpedienteById($id: Int!) {
    expedienteById(id: $id) {
      idExpediente
      numeroExpediente
      ano
      fechaIngreso
      fechaConclusion
      descripcion
      idSala { idSala nombreSala idTribunal { nombreTribunal } }
      idTipoProceso { idTipoProceso nombre codigo }
      idEstadoExpediente { idEstado nombreEstado esTerminal }
    }
  }
`;

export const CREAR_EXPEDIENTE = gql`
  mutation CrearExpediente($input: CrearExpedienteInput!) {
    crearExpediente(input: $input) {
      expediente {
        idExpediente
        numeroExpediente
        ano
        fechaIngreso
        idSala { idSala nombreSala }
        idTipoProceso { idTipoProceso nombre }
        idEstadoExpediente { idEstado nombreEstado }
      }
    }
  }
`;

export const ACTUALIZAR_EXPEDIENTE = gql`
  mutation ActualizarExpediente($id: Int!, $input: ActualizarExpedienteInput!) {
    actualizarExpediente(id: $id, input: $input) {
      expediente {
        idExpediente
        numeroExpediente
        ano
        descripcion
        idSala { idSala nombreSala }
        idTipoProceso { idTipoProceso nombre }
        idEstadoExpediente { idEstado nombreEstado esTerminal }
      }
    }
  }
`;

export const ELIMINAR_EXPEDIENTE = gql`
  mutation EliminarExpediente($id: Int!) {
    eliminarExpediente(id: $id) {
      ok
      mensaje
    }
  }
`;

// ─── HISTORIAL DE ESTADO ─────────────────────────────────

export const GET_HISTORIALES = gql`
  query {
    allHistoriales {
      idHistorial
      fechaCambio
      motivo
      idExpediente { idExpediente numeroExpediente }
      idEstadoAnterior { idEstado nombreEstado }
      idEstadoNuevo { idEstado nombreEstado }
      usuario { idUsuario nombres paterno }
    }
  }
`;

export const CREAR_HISTORIAL_ESTADO = gql`
  mutation CrearHistorialEstado(
    $idExpediente: Int!
    $idEstadoNuevo: Int!
    $idUsuario: Int!
    $motivo: String!
  ) {
    crearHistorialEstado(
      idExpediente: $idExpediente
      idEstadoNuevo: $idEstadoNuevo
      idUsuario: $idUsuario
      motivo: $motivo
    ) {
      historial {
        idHistorial
        fechaCambio
        motivo
        idEstadoAnterior { nombreEstado }
        idEstadoNuevo { nombreEstado }
      }
    }
  }
`;

export const ELIMINAR_HISTORIAL_ESTADO = gql`
  mutation EliminarHistorialEstado($id: Int!) {
    eliminarHistorialEstado(id: $id) {
      ok
      mensaje
    }
  }
`;

// ─── TIPO PROCESO ────────────────────────────────────────

export const CREAR_TIPO_PROCESO = gql`
  mutation CrearTipoProceso($nombre: String!, $codigo: String!) {
    crearTipoProceso(nombre: $nombre, codigo: $codigo) {
      tipoProceso { idTipoProceso nombre codigo }
    }
  }
`;

export const ACTUALIZAR_TIPO_PROCESO = gql`
  mutation ActualizarTipoProceso($id: Int!, $nombre: String, $codigo: String) {
    actualizarTipoProceso(id: $id, nombre: $nombre, codigo: $codigo) {
      tipoProceso { idTipoProceso nombre codigo }
    }
  }
`;

export const ELIMINAR_TIPO_PROCESO = gql`
  mutation EliminarTipoProceso($id: Int!) {
    eliminarTipoProceso(id: $id) {
      ok
      mensaje
    }
  }
`;

// ─── ESTADO EXPEDIENTE ───────────────────────────────────

export const CREAR_ESTADO_EXPEDIENTE = gql`
  mutation CrearEstadoExpediente($nombreEstado: String!, $esTerminal: Boolean) {
    crearEstadoExpediente(nombreEstado: $nombreEstado, esTerminal: $esTerminal) {
      estado { idEstado nombreEstado esTerminal }
    }
  }
`;

export const ACTUALIZAR_ESTADO_EXPEDIENTE = gql`
  mutation ActualizarEstadoExpediente($id: Int!, $nombreEstado: String, $esTerminal: Boolean) {
    actualizarEstadoExpediente(id: $id, nombreEstado: $nombreEstado, esTerminal: $esTerminal) {
      estado { idEstado nombreEstado esTerminal }
    }
  }
`;

export const ELIMINAR_ESTADO_EXPEDIENTE = gql`
  mutation EliminarEstadoExpediente($id: Int!) {
    eliminarEstadoExpediente(id: $id) {
      ok
      mensaje
    }
  }
`;

// ─── ACTUACIÓN PROCESAL ──────────────────────────────────

export const GET_ACTUACIONES = gql`
  query {
    allActuaciones {
      idActuacion
      folioInicio
      folioFin
      esPublica
      fechaActuacion
      descripcion
      idExpediente { idExpediente numeroExpediente }
      idTipoActuacion { idTipoActuacion codigo nombre }
      usuario { idUsuario nombres paterno }
    }
  }
`;

export const GET_TIPOS_ACTUACION = gql`
  query {
    allTiposActuacion {
      idTipoActuacion
      codigo
      nombre
    }
  }
`;

export const CREAR_ACTUACION_PROCESAL = gql`
  mutation CrearActuacionProcesal(
    $idExpediente: Int!
    $idTipoActuacion: Int!
    $idUsuario: Int!
    $folioInicio: Int!
    $folioFin: Int!
    $descripcion: String
  ) {
    crearActuacionProcesal(
      idExpediente: $idExpediente
      idTipoActuacion: $idTipoActuacion
      idUsuario: $idUsuario
      folioInicio: $folioInicio
      folioFin: $folioFin
      descripcion: $descripcion
    ) {
      actuacion {
        idActuacion
        folioInicio
        folioFin
        fechaActuacion
        descripcion
        idTipoActuacion { nombre }
        usuario { nombres paterno }
      }
    }
  }
`;

export const ACTUALIZAR_ACTUACION_PROCESAL = gql`
  mutation ActualizarActuacionProcesal($id: Int!, $input: ActualizarActuacionProcesalInput!) {
    actualizarActuacionProcesal(id: $id, input: $input) {
      actuacion {
        idActuacion
        descripcion
        folioInicio
        folioFin
      }
    }
  }
`;

export const ELIMINAR_ACTUACION_PROCESAL = gql`
  mutation EliminarActuacionProcesal($id: Int!) {
    eliminarActuacionProcesal(id: $id) {
      ok
      mensaje
    }
  }
`;

export const CREAR_TIPO_ACTUACION = gql`
  mutation CrearTipoActuacion($codigo: String!, $nombre: String!) {
    crearTipoActuacion(codigo: $codigo, nombre: $nombre) {
      tipoActuacion { idTipoActuacion codigo nombre }
    }
  }
`;

export const ELIMINAR_TIPO_ACTUACION = gql`
  mutation EliminarTipoActuacion($id: Int!) {
    eliminarTipoActuacion(id: $id) {
      ok
      mensaje
    }
  }
`;

export const GET_PARTES_PROCESALES_LISTA = gql`
  query {
    allPartesProcesales {
      idParte
      activo
      idExpediente { idExpediente }
      idPersona {
        idPersona
        nombre
        primerApellido
        segundoApellido
      }
      idRol { nombreRol }
    }
  }
`;