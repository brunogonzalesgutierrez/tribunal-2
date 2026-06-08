import { gql } from "@apollo/client";

export const GET_REPORTE_AUDIENCIAS_ESTADO = gql`
  query ReporteAudienciasEstado($anio: Int, $mes: Int, $fechaInicio: String, $fechaFin: String) {
    reporteAudienciasPorEstado(anio: $anio, mes: $mes, fechaInicio: $fechaInicio, fechaFin: $fechaFin) {
      estado
      cantidad
    }
  }
`;

export const GET_REPORTE_AUDIENCIAS_MES = gql`
  query ReporteAudienciasMes($anio: Int, $mes: Int, $fechaInicio: String, $fechaFin: String) {
    reporteAudienciasPorMes(anio: $anio, mes: $mes, fechaInicio: $fechaInicio, fechaFin: $fechaFin) {
      mes
      cantidad
    }
  }
`;

export const GET_REPORTE_EXPEDIENTES_TIPO = gql`
  query ReporteExpedientesTipo($anio: Int, $mes: Int, $fechaInicio: String, $fechaFin: String) {
    reporteExpedientesPorTipo(anio: $anio, mes: $mes, fechaInicio: $fechaInicio, fechaFin: $fechaFin) {
      tipo
      cantidad
    }
  }
`;

export const GET_REPORTE_EXPEDIENTES_ESTADO = gql`
  query ReporteExpedientesEstado($anio: Int, $mes: Int, $fechaInicio: String, $fechaFin: String) {
    reporteExpedientesPorEstado(anio: $anio, mes: $mes, fechaInicio: $fechaInicio, fechaFin: $fechaFin) {
      estado
      cantidad
    }
  }
`;

export const GET_REPORTE_CARGA_SALA = gql`
  query ReporteCargaSala($anio: Int, $mes: Int, $fechaInicio: String, $fechaFin: String) {
    reporteCargaPorSala(anio: $anio, mes: $mes, fechaInicio: $fechaInicio, fechaFin: $fechaFin) {
      sala
      tribunal
      audiencias
      expedientes
    }
  }
`;

export const GET_REPORTE_ACTIVIDAD_USUARIOS = gql`
  query ReporteActividadUsuarios($anio: Int, $mes: Int, $fechaInicio: String, $fechaFin: String) {
    reporteActividadUsuarios(anio: $anio, mes: $mes, fechaInicio: $fechaInicio, fechaFin: $fechaFin) {
      usuario
      rol
      audiencias
      actuaciones
      documentos
    }
  }
`;

export const ENVIAR_REPORTES_EMAIL = gql`
  mutation EnviarReportesEmail(
    $anio: Int!
    $roles: [String]
    $usuarioIds: [Int]
    $mes: Int
    $fechaInicio: String
    $fechaFin: String
  ) {
    enviarReportesPorEmail(
      anio: $anio
      roles: $roles
      usuarioIds: $usuarioIds
      mes: $mes
      fechaInicio: $fechaInicio
      fechaFin: $fechaFin
    ) {
      ok
      mensaje
      enviados
      fallidos
      destinatarios
    }
  }
`;

export const GET_USUARIOS_PARA_REPORTE = gql`
  query UsuariosParaReporte {
    allUsuarios {
      idUsuario
      nombres
      paterno
      email
      cargoOficial
      activo
      rol {
        nombre
      }
    }
  }
`;