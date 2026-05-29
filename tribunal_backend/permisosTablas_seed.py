import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from tribunal.models import Permiso

# ============================================================
# PERMISOS VER (solo los que necesitas para el Sidebar y rutas)
# ============================================================

permisos_ver = [
    # ============================================================
    # SEGURIDAD
    # ============================================================
    ("USUARIOS_VER", "Ver usuarios", "Seguridad"),
    ("ROLES_VER", "Ver roles", "Seguridad"),
    ("PERMISOS_VER", "Ver permisos", "Seguridad"),
    
    # ============================================================
    # TRIBUNAL
    # ============================================================
    ("TRIBUNALES_VER", "Ver tribunales", "Tribunal"),
    ("SALAS_TRIBUNAL_VER", "Ver salas de tribunal", "Tribunal"),
    ("SALAS_AUDIENCIA_VER", "Ver salas de audiencia", "Tribunal"),
    ("VOCALES_VER", "Ver vocales", "Tribunal"),
    ("CONFORMACIONES_VER", "Ver conformaciones", "Tribunal"),
    
    # ============================================================
    # EXPEDIENTES
    # ============================================================
    ("EXPEDIENTES_VER", "Ver expedientes", "Expedientes"),
    ("HISTORIAL_ESTADOS_VER", "Ver historial de estados", "Expedientes"),
    ("ACTUACIONES_VER", "Ver actuaciones", "Expedientes"),
    
    # ============================================================
    # AUDIENCIAS
    # ============================================================
    ("AUDIENCIAS_VER", "Ver audiencias", "Audiencias"),
    ("ASISTENCIAS_VER", "Ver asistencias", "Audiencias"),
    ("ACTAS_VER", "Ver actas", "Audiencias"),
    
    # ============================================================
    # RESOLUCIONES
    # ============================================================
    ("RESOLUCIONES_VER", "Ver resoluciones", "Resoluciones"),
    ("RECURSOS_VER", "Ver recursos", "Resoluciones"),
    
    # ============================================================
    # DOCUMENTOS
    # ============================================================
    ("DOCUMENTOS_VER", "Ver documentos", "Documentos"),
    ("NOTIFICACIONES_VER", "Ver notificaciones", "Documentos"),
    ("SOLICITUDES_VER", "Ver solicitudes", "Documentos"),
    
    # ============================================================
    # PERSONAS
    # ============================================================
    ("PERSONAS_VER", "Ver personas", "Personas"),
    ("CONTACTOS_VER", "Ver contactos", "Personas"),
    ("ROLES_PROCESALES_VER", "Ver roles procesales", "Personas"),
    ("PARTES_PROCESALES_VER", "Ver partes procesales", "Personas"),
    
    # ============================================================
    # CATÁLOGOS (Tipos)
    # ============================================================
    ("TIPOS_PROCESO_VER", "Ver tipos de proceso", "Catálogos"),
    ("TIPOS_AUDIENCIA_VER", "Ver tipos de audiencia", "Catálogos"),
    ("TIPOS_RESOLUCION_VER", "Ver tipos de resolución", "Catálogos"),
    ("TIPOS_RECURSO_VER", "Ver tipos de recurso", "Catálogos"),
    ("TIPOS_DOCUMENTO_VER", "Ver tipos de documento", "Catálogos"),
    ("TIPOS_ACTUACION_VER", "Ver tipos de actuación", "Catálogos"),
    ("ESTADOS_EXPEDIENTE_VER", "Ver estados de expediente", "Catálogos"),
    
    # ============================================================
    # REPORTES
    # ============================================================
    ("REPORTES_VER", "Ver reportes", "Reportes"),
]

# ============================================================
# EJECUTAR SEEDER
# ============================================================

print("=" * 60)
print("🚀 INICIANDO SEEDER DE PERMISOS VER")
print("=" * 60)

# Obtener permisos existentes
permisos_existentes = set(Permiso.objects.values_list('codigo', flat=True))
print(f"\n📋 Permisos existentes en BD: {len(permisos_existentes)}")

# Filtrar solo los que faltan
permisos_faltantes = []
for codigo, nombre, modulo in permisos_ver:
    if codigo not in permisos_existentes:
        permisos_faltantes.append((codigo, nombre, modulo))
    else:
        print(f"⏭️ YA EXISTE: {codigo}")

print(f"\n🆕 Permisos que faltan por crear: {len(permisos_faltantes)}")

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
    print(f"   🎯 Total permisos requeridos: {len(permisos_ver)}")

print("\n" + "=" * 60)
print("🏁 SEEDER COMPLETADO")
print("=" * 60)