import { gql } from "@apollo/client";

// ── Audiencias por estado ────────────────────────────────
export const GET_REPORTE_AUDIENCIAS_ESTADO = gql`
  query ReporteAudienciasEstado($anio: Int) {
    reporteAudienciasPorEstado(anio: $anio) {
      estado
      cantidad
    }
  }
`;

// ── Audiencias por mes ───────────────────────────────────
export const GET_REPORTE_AUDIENCIAS_MES = gql`
  query ReporteAudienciasMes($anio: Int) {
    reporteAudienciasPorMes(anio: $anio) {
      mes
      cantidad
    }
  }
`;

// ── Expedientes por tipo de proceso ──────────────────────
export const GET_REPORTE_EXPEDIENTES_TIPO = gql`
  query ReporteExpedientesTipo($anio: Int) {
    reporteExpedientesPorTipo(anio: $anio) {
      tipo
      cantidad
    }
  }
`;

// ── Expedientes por estado ───────────────────────────────
export const GET_REPORTE_EXPEDIENTES_ESTADO = gql`
  query ReporteExpedientesEstado($anio: Int) {
    reporteExpedientesPorEstado(anio: $anio) {
      estado
      cantidad
    }
  }
`;

// ── Carga por sala ───────────────────────────────────────
export const GET_REPORTE_CARGA_SALA = gql`
  query ReporteCargaSala($anio: Int) {
    reporteCargaPorSala(anio: $anio) {
      sala
      tribunal
      audiencias
      expedientes
    }
  }
`;

// ── Actividad por usuario ────────────────────────────────
export const GET_REPORTE_ACTIVIDAD_USUARIOS = gql`
  query ReporteActividadUsuarios($anio: Int) {
    reporteActividadUsuarios(anio: $anio) {
      usuario
      rol
      audiencias
      actuaciones
      documentos
    }
  }
`;
