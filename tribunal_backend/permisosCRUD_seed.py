import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from tribunal.models import Permiso

# ============================================================
# PERMISOS QUE DEBEN ESTAR EN EL SISTEMA
# ============================================================

permisos_requeridos = [
    # ============================================================
    # 1. SEGURIDAD (Usuarios, Roles, Permisos)
    # ============================================================
    ("USUARIOS_VER", "Ver usuarios", "Seguridad"),
    ("USUARIOS_CREAR", "Crear usuarios", "Seguridad"),
    ("USUARIOS_EDITAR", "Editar usuarios", "Seguridad"),
    ("USUARIOS_ELIMINAR", "Eliminar usuarios", "Seguridad"),
    
    ("ROLES_VER", "Ver roles", "Seguridad"),
    ("ROLES_CREAR", "Crear roles", "Seguridad"),
    ("ROLES_EDITAR", "Editar roles", "Seguridad"),
    ("ROLES_ELIMINAR", "Eliminar roles", "Seguridad"),
    
    ("PERMISOS_VER", "Ver permisos", "Seguridad"),
    ("PERMISOS_ASIGNAR", "Asignar permisos", "Seguridad"),
    
    # ============================================================
    # 2. TRIBUNALES Y SALAS
    # ============================================================
    ("TRIBUNALES_VER", "Ver tribunales", "Tribunal"),
    ("TRIBUNALES_CREAR", "Crear tribunales", "Tribunal"),
    ("TRIBUNALES_EDITAR", "Editar tribunales", "Tribunal"),
    ("TRIBUNALES_ELIMINAR", "Eliminar tribunales", "Tribunal"),
    
    ("SALAS_TRIBUNAL_VER", "Ver salas de tribunal", "Tribunal"),
    ("SALAS_TRIBUNAL_CREAR", "Crear salas de tribunal", "Tribunal"),
    ("SALAS_TRIBUNAL_EDITAR", "Editar salas de tribunal", "Tribunal"),
    ("SALAS_TRIBUNAL_ELIMINAR", "Eliminar salas de tribunal", "Tribunal"),
    
    ("SALAS_AUDIENCIA_VER", "Ver salas de audiencia", "Tribunal"),
    ("SALAS_AUDIENCIA_CREAR", "Crear salas de audiencia", "Tribunal"),
    ("SALAS_AUDIENCIA_EDITAR", "Editar salas de audiencia", "Tribunal"),
    ("SALAS_AUDIENCIA_ELIMINAR", "Eliminar salas de audiencia", "Tribunal"),
    
    ("VOCALES_VER", "Ver vocales", "Tribunal"),
    ("VOCALES_CREAR", "Crear vocales", "Tribunal"),
    ("VOCALES_EDITAR", "Editar vocales", "Tribunal"),
    ("VOCALES_ELIMINAR", "Eliminar vocales", "Tribunal"),
    
    ("CONFORMACIONES_VER", "Ver conformaciones", "Tribunal"),
    ("CONFORMACIONES_CREAR", "Crear conformaciones", "Tribunal"),
    ("CONFORMACIONES_EDITAR", "Editar conformaciones", "Tribunal"),
    ("CONFORMACIONES_ELIMINAR", "Eliminar conformaciones", "Tribunal"),
    
    # ============================================================
    # 3. EXPEDIENTES
    # ============================================================
    ("EXPEDIENTES_VER", "Ver expedientes", "Expedientes"),
    ("EXPEDIENTES_CREAR", "Crear expedientes", "Expedientes"),
    ("EXPEDIENTES_EDITAR", "Editar expedientes", "Expedientes"),
    ("EXPEDIENTES_ELIMINAR", "Eliminar expedientes", "Expedientes"),
    
    ("HISTORIAL_ESTADOS_VER", "Ver historial de estados", "Expedientes"),
    ("HISTORIAL_ESTADOS_CREAR", "Crear historial de estados", "Expedientes"),
    
    ("ACTUACIONES_VER", "Ver actuaciones", "Expedientes"),
    ("ACTUACIONES_CREAR", "Crear actuaciones", "Expedientes"),
    ("ACTUACIONES_EDITAR", "Editar actuaciones", "Expedientes"),
    ("ACTUACIONES_ELIMINAR", "Eliminar actuaciones", "Expedientes"),
    
    # ============================================================
    # 4. AUDIENCIAS
    # ============================================================
    ("AUDIENCIAS_VER", "Ver audiencias", "Audiencias"),
    ("AUDIENCIAS_CREAR", "Crear audiencias", "Audiencias"),
    ("AUDIENCIAS_EDITAR", "Editar audiencias", "Audiencias"),
    ("AUDIENCIAS_ELIMINAR", "Eliminar audiencias", "Audiencias"),
    
    ("ASISTENCIAS_VER", "Ver asistencias", "Audiencias"),
    ("ASISTENCIAS_CREAR", "Crear asistencias", "Audiencias"),
    ("ASISTENCIAS_EDITAR", "Editar asistencias", "Audiencias"),
    ("ASISTENCIAS_ELIMINAR", "Eliminar asistencias", "Audiencias"),
    
    ("ACTAS_VER", "Ver actas", "Audiencias"),
    ("ACTAS_CREAR", "Crear actas", "Audiencias"),
    ("ACTAS_EDITAR", "Editar actas", "Audiencias"),
    ("ACTAS_ELIMINAR", "Eliminar actas", "Audiencias"),
    
    # ============================================================
    # 5. RESOLUCIONES
    # ============================================================
    ("RESOLUCIONES_VER", "Ver resoluciones", "Resoluciones"),
    ("RESOLUCIONES_CREAR", "Crear resoluciones", "Resoluciones"),
    ("RESOLUCIONES_EDITAR", "Editar resoluciones", "Resoluciones"),
    ("RESOLUCIONES_ELIMINAR", "Eliminar resoluciones", "Resoluciones"),
    
    ("RECURSOS_VER", "Ver recursos", "Resoluciones"),
    ("RECURSOS_CREAR", "Crear recursos", "Resoluciones"),
    ("RECURSOS_EDITAR", "Editar recursos", "Resoluciones"),
    ("RECURSOS_ELIMINAR", "Eliminar recursos", "Resoluciones"),
    
    # ============================================================
    # 6. DOCUMENTOS
    # ============================================================
    ("DOCUMENTOS_VER", "Ver documentos", "Documentos"),
    ("DOCUMENTOS_SUBIR", "Subir documentos", "Documentos"),
    ("DOCUMENTOS_EDITAR", "Editar documentos", "Documentos"),
    ("DOCUMENTOS_ELIMINAR", "Eliminar documentos", "Documentos"),
    
    ("NOTIFICACIONES_VER", "Ver notificaciones", "Documentos"),
    ("NOTIFICACIONES_EMITIR", "Emitir notificaciones", "Documentos"),
    ("NOTIFICACIONES_ELIMINAR", "Eliminar notificaciones", "Documentos"),
    
    ("SOLICITUDES_VER", "Ver solicitudes", "Documentos"),
    ("SOLICITUDES_CREAR", "Crear solicitudes", "Documentos"),
    ("SOLICITUDES_ELIMINAR", "Eliminar solicitudes", "Documentos"),
    
    # ============================================================
    # 7. PERSONAS Y PARTICIPANTES
    # ============================================================
    ("PERSONAS_VER", "Ver personas", "Personas"),
    ("PERSONAS_CREAR", "Crear personas", "Personas"),
    ("PERSONAS_EDITAR", "Editar personas", "Personas"),
    ("PERSONAS_ELIMINAR", "Eliminar personas", "Personas"),
    
    ("CONTACTOS_VER", "Ver contactos", "Personas"),
    ("CONTACTOS_CREAR", "Crear contactos", "Personas"),
    ("CONTACTOS_EDITAR", "Editar contactos", "Personas"),
    ("CONTACTOS_ELIMINAR", "Eliminar contactos", "Personas"),
    
    ("ROLES_PROCESALES_VER", "Ver roles procesales", "Personas"),
    ("ROLES_PROCESALES_CREAR", "Crear roles procesales", "Personas"),
    ("ROLES_PROCESALES_EDITAR", "Editar roles procesales", "Personas"),
    ("ROLES_PROCESALES_ELIMINAR", "Eliminar roles procesales", "Personas"),
    
    ("PARTES_PROCESALES_VER", "Ver partes procesales", "Personas"),
    ("PARTES_PROCESALES_CREAR", "Crear partes procesales", "Personas"),
    ("PARTES_PROCESALES_EDITAR", "Editar partes procesales", "Personas"),
    ("PARTES_PROCESALES_ELIMINAR", "Eliminar partes procesales", "Personas"),
    
    # ============================================================
    # 8. CATÁLOGOS (Tipos)
    # ============================================================
    ("TIPOS_PROCESO_VER", "Ver tipos de proceso", "Catálogos"),
    ("TIPOS_AUDIENCIA_VER", "Ver tipos de audiencia", "Catálogos"),
    ("TIPOS_RESOLUCION_VER", "Ver tipos de resolución", "Catálogos"),
    ("TIPOS_RECURSO_VER", "Ver tipos de recurso", "Catálogos"),
    ("TIPOS_DOCUMENTO_VER", "Ver tipos de documento", "Catálogos"),
    ("TIPOS_ACTUACION_VER", "Ver tipos de actuación", "Catálogos"),
    ("ESTADOS_EXPEDIENTE_VER", "Ver estados de expediente", "Catálogos"),
    
    # ============================================================
    # 9. REPORTES
    # ============================================================
    ("REPORTES_VER", "Ver reportes", "Reportes"),
    ("REPORTES_EXPORTAR", "Exportar reportes", "Reportes"),
]

# ============================================================
# EJECUTAR SEEDER
# ============================================================

print("=" * 60)
print("🚀 INICIANDO SEEDER DE PERMISOS")
print("=" * 60)

# Obtener permisos existentes
permisos_existentes = set(Permiso.objects.values_list('codigo', flat=True))
print(f"\n📋 Permisos existentes en BD: {len(permisos_existentes)}")

# Filtrar solo los que faltan
permisos_faltantes = []
for codigo, nombre, modulo in permisos_requeridos:
    if codigo not in permisos_existentes:
        permisos_faltantes.append((codigo, nombre, modulo))

print(f"🆕 Permisos que faltan por crear: {len(permisos_faltantes)}")

if len(permisos_faltantes) == 0:
    print("\n✅ ¡Todos los permisos ya existen en la base de datos!")
else:
    print("\n📝 Creando permisos faltantes...")
    print("-" * 40)
    
    creados = 0
    for codigo, nombre, modulo in permisos_faltantes:
        try:
            Permiso.objects.create(
                codigo=codigo,
                nombre=nombre,
                modulo=modulo,
                descripcion=nombre
            )
            print(f"   ✅ CREADO: {codigo} - {nombre}")
            creados += 1
        except Exception as e:
            print(f"   ❌ ERROR con {codigo}: {e}")
    
    print("-" * 40)
    print(f"\n📊 RESUMEN FINAL:")
    print(f"   ✅ Permisos creados: {creados}")
    print(f"   📋 Total permisos en BD: {Permiso.objects.count()}")
    print(f"   🎯 Total permisos requeridos: {len(permisos_requeridos)}")

print("\n" + "=" * 60)
print("🏁 SEEDER COMPLETADO")
print("=" * 60)