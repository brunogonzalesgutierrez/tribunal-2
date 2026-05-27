// Definición de permisos del sistema
export const PERMISOS = {
  // Expedientes
  EXP_VER: "EXP_VER",
  EXP_CREAR: "EXP_CREAR",
  EXP_EDITAR: "EXP_EDITAR",
  EXP_ELIM: "EXP_ELIM",
  
  // Audiencias
  AUD_VER: "AUD_VER",
  AUD_GEST: "AUD_GEST",
  
  // Resoluciones
  RES_VER: "RES_VER",
  RES_CREAR: "RES_CREAR",
  
  // Usuarios y Seguridad
  USR_GEST: "USR_GEST",
  ROL_GEST: "ROL_GEST",
  
  // Documentos
  DOC_VER: "DOC_VER",
  DOC_SUBIR: "DOC_SUBIR",
  
  // Personas
  PER_GEST: "PER_GEST",
  
  // Notificaciones
  NOT_VER: "NOT_VER",
  NOT_EMIT: "NOT_EMIT",
};

// Relación de rutas con permisos requeridos
export const RUTAS_PERMISOS: Record<string, string[]> = {
  // Expedientes
  '/expedientes': [PERMISOS.EXP_VER],
  '/historial': [PERMISOS.EXP_VER],
  '/actuaciones': [PERMISOS.EXP_VER],
  
  // Audiencias
  '/audiencias': [PERMISOS.AUD_VER],
  '/tipos-audiencia': [PERMISOS.AUD_GEST],
  '/salas-audiencia': [PERMISOS.AUD_GEST],
  '/asistencias': [PERMISOS.AUD_VER],
  '/actas': [PERMISOS.AUD_GEST],
  
  // Resoluciones
  '/resoluciones': [PERMISOS.RES_VER],
  '/tipos-resolucion': [PERMISOS.RES_CREAR],
  '/tipos-recurso': [PERMISOS.RES_CREAR],
  '/recursos': [PERMISOS.RES_VER],
  
  // Seguridad
  '/usuarios': [PERMISOS.USR_GEST],
  '/roles': [PERMISOS.ROL_GEST],
  '/permisos': [PERMISOS.ROL_GEST],
  
  // Documentos
  '/documentos': [PERMISOS.DOC_VER],
  '/tipos-doc': [PERMISOS.DOC_SUBIR],
  '/notificaciones': [PERMISOS.NOT_VER],
  '/solicitudes': [PERMISOS.DOC_VER],
  
  // Personas
  '/personas': [PERMISOS.PER_GEST],
  '/contactos': [PERMISOS.PER_GEST],
  '/roles-procesales': [PERMISOS.PER_GEST],
  '/partes': [PERMISOS.PER_GEST],
  
  // Tribunal
  '/tribunales': [PERMISOS.EXP_VER],
  '/salas-tribunal': [PERMISOS.EXP_VER],
  '/vocales': [PERMISOS.EXP_VER],
  '/conformaciones': [PERMISOS.EXP_VER],
  
  // Reportes
  '/reportes': [PERMISOS.EXP_VER],
  
  // Dashboard y Perfil (todos pueden ver)
  '/dashboard': [],
  '/perfil': [],
};

// Relación de nombres de menú con permisos
export const MENU_PERMISOS: Record<string, string[]> = {
  'Dashboard': [],
  'Expedientes': [PERMISOS.EXP_VER],
  'Audiencias': [PERMISOS.AUD_VER],
  'Resoluciones': [PERMISOS.RES_VER],
  'Documentos': [PERMISOS.DOC_VER],
  'Solicitudes': [PERMISOS.DOC_VER],
  'Notificaciones': [PERMISOS.NOT_VER],
  'Participantes': [PERMISOS.PER_GEST],
  'Personas': [PERMISOS.PER_GEST],
  'Usuarios': [PERMISOS.USR_GEST],
  'Roles': [PERMISOS.ROL_GEST],
  'Permisos': [PERMISOS.ROL_GEST],
  'Tribunal': [PERMISOS.EXP_VER],
  'Reportes': [PERMISOS.EXP_VER],
  'Seguridad': [PERMISOS.USR_GEST, PERMISOS.ROL_GEST],
};