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
      idEstadoExpediente { idEstado nombreEstado esTerminal }
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
      idEstadoAnterior { idEstado nombreEstado }
      idEstadoNuevo { idEstado nombreEstado }
      usuario { idUsuario nombres paterno }
    }
  }
`;