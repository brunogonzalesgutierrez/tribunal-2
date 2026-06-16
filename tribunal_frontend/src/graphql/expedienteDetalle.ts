import { gql } from "@apollo/client";

export const GET_DETALLE_EXPEDIENTE = gql`
  query DetalleExpediente($id: Int!) {

    # ── Expediente principal ──────────────────────────────
    expedienteById(id: $id) {
      idExpediente
      numeroExpediente
      ano
      fechaIngreso
      fechaConclusion
      descripcion
      idSala {
        idSala
        nombreSala
        activa
        idTribunal { idTribunal nombreTribunal instancia }
      }
      idTipoProceso { idTipoProceso nombre codigo }
      idEstadoExpediente { idEstado nombreEstado esTerminal nivel }
      denuncias {        # ← plural, es reverse FK
        id
        numeroDenuncia
      }
    }

    # ── Solo los datos de ESTE expediente ─────────────────
    partesPorExpediente(idExpediente: $id) {
      idParte
      activo
      fechaExclusion
      idPersona {
        idPersona
        nombre
        primerApellido
        segundoApellido
        numeroDocumento
        esAbogado
        estamento
        contactos {         
          idContacto
          tipoContacto
          valor
          esPrincipal
        }
      }
            idRol { idRol nombreRol }
    }

    conformacionesPorExpediente(idExpediente: $id) {
      idConformacion
      rolEnCaso
      idVocal {
        idVocal
        cargo
        activo
        idPersona { nombre primerApellido }
        idSala { nombreSala }
      }
    }

    audienciasPorExpediente(idExpediente: $id) {
      idAudiencia
      fechaHoraProgramada
      fechaHoraInicio
      fechaHoraFin
      estadoAudiencia
      motivoSuspension
      linkVideoconferencia
      idTipoAudiencia { idTipoAudiencia nombre duracionEstimada }
      idSalaAud { idSalaAud nombreSala equipadaVideoconf }
    }

    resolucionesPorExpediente(idExpediente: $id) {
      idResolucion
      numeroResolucion
      fechaResolucion
      parteDispositiva
      fundamentacion
      estado
      esRecurrible
      plazoRecursoDias
      idTipoRes { idTipoRes codigo nombre nivelJerarquico }
    }

    recursosPorExpediente(idExpediente: $id) {
      idRecurso
      fechaInterposicion
      estadoRecurso
      fundamentos
      idResolucionImpugnada {
        idResolucion
        numeroResolucion
      }
      idTipoRecurso { idTipoRecurso nombre }
      idRecurrente {
        idParte
        idPersona { nombre primerApellido }
        idRol { nombreRol }
      }
    }

    documentosPorExpediente(idExpediente: $id) {
      idDocumento
      titulo
      fechaPresentacion
      numeroFolio
      rutaArchivo
      tamanoKb
      esElectronico
      firmadoDigitalmente
      idTipoDoc { idTipoDoc codigo nombre requiereFirma esPublico }
    }

    actuacionesPorExpediente(idExpediente: $id) {
      idActuacion
      folioInicio
      folioFin
      esPublica
      fechaActuacion
      descripcion
      idTipoActuacion { idTipoActuacion codigo nombre }
      usuario { idUsuario nombres paterno }
    }

    historialPorExpediente(idExpediente: $id) {
      idHistorial
      fechaCambio
      motivo
      idEstadoAnterior { idEstado nombreEstado nivel }
      idEstadoNuevo { idEstado nombreEstado nivel }
      usuario { idUsuario nombres paterno }
    }
  }
`;



// ─── ESTADOS EXPEDIENTE ──────────────────────────────────

export const GET_ESTADOS_TODOS = gql`
  query {
    allEstadosExpediente {
      idEstado
      nombreEstado
      esTerminal
      nivel
    }
  }
`;

export const CAMBIAR_ESTADO = gql`
  mutation CambiarEstado(
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
        idEstadoNuevo { idEstado nombreEstado nivel }
      }
    }
  }
`;

// ─── PARTES PROCESALES ───────────────────────────────────

export const CREAR_PARTE = gql`
  mutation CrearParteProcesal($idExpediente: Int!, $idPersona: Int!, $idRol: Int!) {
    crearParteProcesal(idExpediente: $idExpediente, idPersona: $idPersona, idRol: $idRol) {
      parte {
        idParte
        activo
        idPersona { nombre primerApellido }
        idRol { nombreRol }
      }
    }
  }
`;

export const ELIMINAR_PARTE = gql`
  mutation EliminarParteProcesal($id: Int!) {
    eliminarParteProcesal(id: $id) {
      ok
      mensaje
    }
  }
`;

// ─── RESOLUCIONES ────────────────────────────────────────

export const CREAR_RESOLUCION = gql`
  mutation CrearResolucion($input: CrearResolucionInput!) {
    crearResolucion(input: $input) {
      resolucion {
        idResolucion
        numeroResolucion
        fechaResolucion
        estado
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

// ─── ACTUACIONES ─────────────────────────────────────────

export const CREAR_ACTUACION = gql`
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
        descripcion
        folioInicio
        folioFin
        idTipoActuacion { nombre }
      }
    }
  }
`;

export const ELIMINAR_ACTUACION = gql`
  mutation EliminarActuacionProcesal($id: Int!) {
    eliminarActuacionProcesal(id: $id) {
      ok
      mensaje
    }
  }
`;

// ─── CATÁLOGOS ───────────────────────────────────────────

export const GET_TIPOS_RES = gql`
  query {
    allTiposResolucion {
      idTipoRes
      codigo
      nombre
      nivelJerarquico
    }
  }
`;

export const GET_TIPOS_ACT = gql`
  query {
    allTiposActuacion {
      idTipoActuacion
      codigo
      nombre
    }
  }
`;

export const GET_PERSONAS_DETALLE = gql`
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

export const GET_ROLES_PROC = gql`
  query {
    allRolesProcesal {
      idRol
      nombreRol
    }
  }
`;