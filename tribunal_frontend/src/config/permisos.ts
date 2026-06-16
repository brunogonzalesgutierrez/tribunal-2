// src/config/permisos.ts

export const PERMISOS = {
  // ============================================================
  // SEGURIDAD
  // ============================================================
  USUARIOS_VER: "USUARIOS_VER",
  ROLES_VER: "ROLES_VER",
  PERMISOS_VER: "PERMISOS_VER",
  
  // ============================================================
  // TRIBUNAL
  // ============================================================
  TRIBUNALES_VER: "TRIBUNALES_VER",
  SALAS_TRIBUNAL_VER: "SALAS_TRIBUNAL_VER",
  SALAS_AUDIENCIA_VER: "SALAS_AUDIENCIA_VER",
  VOCALES_VER: "VOCALES_VER",
  CONFORMACIONES_VER: "CONFORMACIONES_VER",
  
  // ============================================================
  // EXPEDIENTES
  // ============================================================
  EXPEDIENTES_VER: "EXPEDIENTES_VER",
  HISTORIAL_ESTADOS_VER: "HISTORIAL_ESTADOS_VER",
  ACTUACIONES_VER: "ACTUACIONES_VER",
  ESTADOS_EXPEDIENTE_VER: "ESTADOS_EXPEDIENTE_VER",
  
  // ============================================================
  // AUDIENCIAS
  // ============================================================
  AUDIENCIAS_VER: "AUDIENCIAS_VER",
  ASISTENCIAS_VER: "ASISTENCIAS_VER",
  ACTAS_VER: "ACTAS_VER",
  
  // ============================================================
  // RESOLUCIONES
  // ============================================================
  RESOLUCIONES_VER: "RESOLUCIONES_VER",
  RECURSOS_VER: "RECURSOS_VER",
  
  // ============================================================
  // DOCUMENTOS
  // ============================================================
  DOCUMENTOS_VER: "DOCUMENTOS_VER",
  NOTIFICACIONES_VER: "NOTIFICACIONES_VER",
  SOLICITUDES_VER: "SOLICITUDES_VER",
  
  // ============================================================
  // PERSONAS
  // ============================================================
  PERSONAS_VER: "PERSONAS_VER",
  CONTACTOS_VER: "CONTACTOS_VER",
  ROLES_PROCESALES_VER: "ROLES_PROCESALES_VER",
  PARTES_PROCESALES_VER: "PARTES_PROCESALES_VER",
  
  // ============================================================
  // CATÁLOGOS
  // ============================================================
  TIPOS_PROCESO_VER: "TIPOS_PROCESO_VER",
  TIPOS_AUDIENCIA_VER: "TIPOS_AUDIENCIA_VER",
  TIPOS_RESOLUCION_VER: "TIPOS_RESOLUCION_VER",
  TIPOS_RECURSO_VER: "TIPOS_RECURSO_VER",
  TIPOS_DOCUMENTO_VER: "TIPOS_DOCUMENTO_VER",
  TIPOS_ACTUACION_VER: "TIPOS_ACTUACION_VER",

  
  // ============================================================
  // REPORTES
  // ============================================================
  REPORTES_VER: "REPORTES_VER",
  // ============================================================
  // DENUNCIAS
  // ============================================================
  DENUNCIAS_VER: "DENUNCIAS_VER",
  DENUNCIAS_GESTIONAR: "DENUNCIAS_GESTIONAR",
};

// Permisos por ruta
export const RUTAS_PERMISOS: Record<string, string[]> = {
  '/dashboard': [],
  '/perfil': [],
  
  // Seguridad
  '/usuarios': [PERMISOS.USUARIOS_VER],
  '/roles': [PERMISOS.ROLES_VER],
  '/permisos': [PERMISOS.PERMISOS_VER],
  
  // Tribunal
  '/tribunales': [PERMISOS.TRIBUNALES_VER],
  '/salas-tribunal': [PERMISOS.SALAS_TRIBUNAL_VER],
  '/vocales': [PERMISOS.VOCALES_VER],
  '/conformaciones': [PERMISOS.CONFORMACIONES_VER],
  '/salas-audiencia': [PERMISOS.SALAS_AUDIENCIA_VER],
  
  // Expedientes
  '/expedientes': [PERMISOS.EXPEDIENTES_VER],
  '/historial': [PERMISOS.HISTORIAL_ESTADOS_VER],
  '/actuaciones': [PERMISOS.ACTUACIONES_VER],
  
  // Audiencias
  '/audiencias': [PERMISOS.AUDIENCIAS_VER],
  '/asistencias': [PERMISOS.ASISTENCIAS_VER],
  '/actas': [PERMISOS.ACTAS_VER],
  
  // Resoluciones
  '/resoluciones': [PERMISOS.RESOLUCIONES_VER],
  '/recursos': [PERMISOS.RECURSOS_VER],
  
  // Documentos
  '/documentos': [PERMISOS.DOCUMENTOS_VER],
  '/notificaciones': [PERMISOS.NOTIFICACIONES_VER],
  '/solicitudes': [PERMISOS.SOLICITUDES_VER],
  
  // Personas
  '/personas': [PERMISOS.PERSONAS_VER],
  '/contactos': [PERMISOS.CONTACTOS_VER],

  '/partes': [PERMISOS.PARTES_PROCESALES_VER],
  
  // Catálogos
  '/tipos-proceso': [PERMISOS.TIPOS_PROCESO_VER],
  '/tipos-audiencia': [PERMISOS.TIPOS_AUDIENCIA_VER],
  '/tipos-resolucion': [PERMISOS.TIPOS_RESOLUCION_VER],
  '/tipos-recurso': [PERMISOS.TIPOS_RECURSO_VER],
  '/tipos-doc': [PERMISOS.TIPOS_DOCUMENTO_VER],
  '/tipos-actuacion': [PERMISOS.TIPOS_ACTUACION_VER],
  '/estados-expediente': [PERMISOS.ESTADOS_EXPEDIENTE_VER],
  '/roles-procesales': [PERMISOS.ROLES_PROCESALES_VER],
  
  
  // Reportes
  '/reportes': [PERMISOS.REPORTES_VER],
  // Denuncias
  '/denuncias': [PERMISOS.DENUNCIAS_VER],
  '/denuncias/etapas': [PERMISOS.DENUNCIAS_VER],
};

// Helper
export function getPermisosRuta(pathname: string): string[] {
  if (RUTAS_PERMISOS[pathname]) {
    return RUTAS_PERMISOS[pathname];
  }
  for (const [ruta, permisos] of Object.entries(RUTAS_PERMISOS)) {
    if (pathname.startsWith(ruta) && ruta !== '/') {
      return permisos;
    }
  }
  return [];
}