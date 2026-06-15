#!/usr/bin/env python
"""
POBLADA COMPLETA — Sistema de Gestión Judicial UAGRM
Resolución ICU 048-2018
Ejecutar desde tribunal_backend con:
    python poblar_desde_cero.py
"""

import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth.hashers import make_password
from tribunal.models import (
    Rol, SalaTribunal, SalaAudiencia, Tribunal, EstadoExpediente,
    TipoProceso, TipoAudiencia, TipoDoc, TipoResolucion, TipoRecurso,
    TipoActuacion, RolProcesal, Permiso, RolPermiso, Usuario
)

print("=" * 60)
print("  POBLADA COMPLETA — UAGRM Justicia Universitaria")
print("=" * 60)


# ══════════════════════════════════════════════════════════════
# 1. TRIBUNAL
# ══════════════════════════════════════════════════════════════
tribunal, _ = Tribunal.objects.get_or_create(
    nombre_tribunal="Tribunal de Justicia Universitaria de Primera Instancia",
    defaults={
        "instancia": "PRIMERA",
        "norma_creacion": "Reglamento Interno U.A.G.R.M. — Res. ICU 048-2018",
    }
)
print(f"\n✅ Tribunal: {tribunal.nombre_tribunal}")


# ══════════════════════════════════════════════════════════════
# 2. SALAS DE TRIBUNAL
# ══════════════════════════════════════════════════════════════
sala1, _ = SalaTribunal.objects.get_or_create(
    nombre_sala="Sala 1",
    id_tribunal=tribunal,
    defaults={"activa": True}
)
sala2, _ = SalaTribunal.objects.get_or_create(
    nombre_sala="Sala 2",
    id_tribunal=tribunal,
    defaults={"activa": True}
)
print("✅ Sala 1 y Sala 2 del Tribunal")


# ══════════════════════════════════════════════════════════════
# 3. SALAS DE AUDIENCIA
# ══════════════════════════════════════════════════════════════
salas_audiencia_data = [
    {"nombre_sala": "Sala de Audiencias A", "capacidad": 20, "equipada_videoconf": True},
    {"nombre_sala": "Sala de Audiencias B", "capacidad": 15, "equipada_videoconf": True},
    {"nombre_sala": "Sala de Audiencias C", "capacidad": 10, "equipada_videoconf": False},
]
print()
for s in salas_audiencia_data:
    obj, _ = SalaAudiencia.objects.get_or_create(
        nombre_sala=s["nombre_sala"],
        id_tribunal=tribunal,
        defaults={
            "capacidad": s["capacidad"],
            "equipada_videoconf": s["equipada_videoconf"],
            "activa": True,
        }
    )
    print(f"✅ Sala de audiencia: {obj.nombre_sala}")


# ══════════════════════════════════════════════════════════════
# 4. ROLES DE USUARIO
# ══════════════════════════════════════════════════════════════
print()
rol_admin, _ = Rol.objects.get_or_create(
    nombre="Administrador",
    defaults={"descripcion": "Acceso total al sistema", "sala_asignada": None, "activo": True}
)
rol_adminsala1, _ = Rol.objects.get_or_create(
    nombre="AdminSala1",
    defaults={"descripcion": "Administrador de Sala 1", "sala_asignada": sala1, "activo": True}
)
rol_adminsala2, _ = Rol.objects.get_or_create(
    nombre="AdminSala2",
    defaults={"descripcion": "Administrador de Sala 2", "sala_asignada": sala2, "activo": True}
)
rol_secretariosala1, _ = Rol.objects.get_or_create(
    nombre="SecretarioSala1",
    defaults={"descripcion": "Secretario de Sala 1", "sala_asignada": sala1, "activo": True}
)
rol_secretariosala2, _ = Rol.objects.get_or_create(
    nombre="SecretarioSala2",
    defaults={"descripcion": "Secretario de Sala 2", "sala_asignada": sala2, "activo": True}
)
rol_vocalsala1, _ = Rol.objects.get_or_create(
    nombre="VocalSala1",
    defaults={"descripcion": "Vocal de Sala 1", "sala_asignada": sala1, "activo": True}
)
rol_vocalsala2, _ = Rol.objects.get_or_create(
    nombre="VocalSala2",
    defaults={"descripcion": "Vocal de Sala 2", "sala_asignada": sala2, "activo": True}
)
print("✅ Roles: Administrador, AdminSala1, AdminSala2, SecretarioSala1, SecretarioSala2, VocalSala1, VocalSala2")


# ══════════════════════════════════════════════════════════════
# 5. ESTADOS DE EXPEDIENTE
# ══════════════════════════════════════════════════════════════
# Basados en el flujo real del Reglamento ICU 048-2018
estados_data = [
    {"nombre_estado": "Denuncia Presentada",       "es_terminal": False, "nivel": 1},
    {"nombre_estado": "Denuncia Defectuosa",        "es_terminal": False, "nivel": 1},
    {"nombre_estado": "Auto de Admisión",           "es_terminal": False, "nivel": 2},
    {"nombre_estado": "Etapa Investigativa",        "es_terminal": False, "nivel": 3},
    {"nombre_estado": "Término Probatorio",         "es_terminal": False, "nivel": 4},
    {"nombre_estado": "Clausura Probatoria",        "es_terminal": False, "nivel": 5},
    {"nombre_estado": "Para Resolución Final",      "es_terminal": False, "nivel": 6},
    {"nombre_estado": "Resuelto Primera Instancia", "es_terminal": False, "nivel": 7},
    {"nombre_estado": "En Apelación",               "es_terminal": False, "nivel": 8},
    {"nombre_estado": "Resuelto Segunda Instancia", "es_terminal": False, "nivel": 9},
    {"nombre_estado": "Ejecutoriado",               "es_terminal": True,  "nivel": 10},
    {"nombre_estado": "Archivado",                  "es_terminal": True,  "nivel": 10},
    {"nombre_estado": "Rechazado",                  "es_terminal": True,  "nivel": 10},
    {"nombre_estado": "Desistido",                  "es_terminal": True,  "nivel": 10},
]
print()
for e in estados_data:
    obj, _ = EstadoExpediente.objects.get_or_create(
        nombre_estado=e["nombre_estado"],
        defaults={"es_terminal": e["es_terminal"], "nivel": e["nivel"]}
    )
    print(f"✅ Estado: {obj.nombre_estado}")


# ══════════════════════════════════════════════════════════════
# 6. TIPO DE PROCESO
# ══════════════════════════════════════════════════════════════
tipo_proceso, _ = TipoProceso.objects.get_or_create(
    nombre="Proceso Disciplinario Sumario",
    defaults={"codigo": "PDS"}
)
print(f"\n✅ Tipo de proceso: {tipo_proceso.nombre}")


# ══════════════════════════════════════════════════════════════
# 7. TIPOS DE AUDIENCIA
# ══════════════════════════════════════════════════════════════
# Art. 58, 60, 70 — audiencias del proceso disciplinario
tipos_audiencia_data = [
    {"nombre": "Declaración Informativa",        "duracion_estimada": 60},
    {"nombre": "Audiencia de Prueba Testifical", "duracion_estimada": 90},
    {"nombre": "Audiencia de Conciliación",      "duracion_estimada": 60},
    {"nombre": "Audiencia de Ratificación",      "duracion_estimada": 30},
    {"nombre": "Audiencia de Apelación",         "duracion_estimada": 60},
    {"nombre": "Audiencia Cautelar",             "duracion_estimada": 45},
    {"nombre": "Audiencia de Alegatos",          "duracion_estimada": 90},
    {"nombre": "Audiencia de Sentencia",         "duracion_estimada": 60},
]
print()
for t in tipos_audiencia_data:
    obj, _ = TipoAudiencia.objects.get_or_create(
        nombre=t["nombre"],
        id_tipo_proceso=tipo_proceso,
        defaults={"duracion_estimada": t["duracion_estimada"], "descripcion": t["nombre"]}
    )
    print(f"✅ Tipo de audiencia: {obj.nombre}")


# ══════════════════════════════════════════════════════════════
# 8. TIPOS DE DOCUMENTO
# ══════════════════════════════════════════════════════════════
# Basados en documentos reales del proceso disciplinario (Art. 34, 44, 47, 58, 77, 82, 83, 90)
tipos_doc_data = [
    {"codigo": "DEN", "nombre": "Denuncia Disciplinaria",         "requiere_firma": True,  "es_publico": False},
    {"codigo": "ADA", "nombre": "Auto de Admisión",               "requiere_firma": True,  "es_publico": True},
    {"codigo": "CED", "nombre": "Cédula Citatoria",               "requiere_firma": False, "es_publico": True},
    {"codigo": "CIP", "nombre": "Citación Personal",              "requiere_firma": False, "es_publico": True},
    {"codigo": "MEM", "nombre": "Memorial",                       "requiere_firma": True,  "es_publico": True},
    {"codigo": "AAP", "nombre": "Auto de Apertura Probatoria",    "requiere_firma": True,  "es_publico": True},
    {"codigo": "PRU", "nombre": "Prueba Documental",              "requiere_firma": False, "es_publico": False},
    {"codigo": "ACT", "nombre": "Acta de Audiencia",              "requiere_firma": True,  "es_publico": True},
    {"codigo": "INF", "nombre": "Informe",                        "requiere_firma": False, "es_publico": False},
    {"codigo": "RSF", "nombre": "Resolución Sancionatoria",       "requiere_firma": True,  "es_publico": True},
    {"codigo": "RAF", "nombre": "Resolución Absolutoria",         "requiere_firma": True,  "es_publico": True},
    {"codigo": "AUT", "nombre": "Auto Interlocutorio",            "requiere_firma": True,  "es_publico": True},
    {"codigo": "DEC", "nombre": "Decreto",                        "requiere_firma": True,  "es_publico": True},
    {"codigo": "ACL", "nombre": "Aclaración y Complementación",   "requiere_firma": True,  "es_publico": True},
    {"codigo": "RAP", "nombre": "Recurso de Apelación",           "requiere_firma": True,  "es_publico": True},
    {"codigo": "RCP", "nombre": "Recurso de Compulsa",            "requiere_firma": True,  "es_publico": True},
    {"codigo": "RAD", "nombre": "Resolución Administrativa",      "requiere_firma": True,  "es_publico": True},
    {"codigo": "CER", "nombre": "Certificado",                    "requiere_firma": True,  "es_publico": True},
    {"codigo": "NOT", "nombre": "Notificación",                   "requiere_firma": False, "es_publico": True},
]
print()
for d in tipos_doc_data:
    obj, _ = TipoDoc.objects.get_or_create(
        codigo=d["codigo"],
        defaults={
            "nombre": d["nombre"],
            "requiere_firma": d["requiere_firma"],
            "es_publico": d["es_publico"],
        }
    )
    print(f"✅ Tipo de doc: {obj.nombre}")


# ══════════════════════════════════════════════════════════════
# 9. TIPOS DE RESOLUCIÓN
# ══════════════════════════════════════════════════════════════
# Art. 13, 75, 85, 86 — tipos de resolución del proceso disciplinario
tipos_resolucion_data = [
    {"codigo": "RSF", "nombre": "Resolución Sancionatoria",        "nivel_jerarquico": 1},
    {"codigo": "RAF", "nombre": "Resolución Absolutoria",          "nivel_jerarquico": 1},
    {"codigo": "AUT", "nombre": "Auto Interlocutorio",             "nivel_jerarquico": 2},
    {"codigo": "DEC", "nombre": "Decreto",                         "nivel_jerarquico": 3},
    {"codigo": "PRO", "nombre": "Providencia",                     "nivel_jerarquico": 4},
    {"codigo": "RCA", "nombre": "Resolución de Segunda Instancia", "nivel_jerarquico": 1},
    {"codigo": "RAD", "nombre": "Resolución Administrativa",       "nivel_jerarquico": 1},
]
print()
for r in tipos_resolucion_data:
    obj, _ = TipoResolucion.objects.get_or_create(
        codigo=r["codigo"],
        defaults={"nombre": r["nombre"], "nivel_jerarquico": r["nivel_jerarquico"]}
    )
    print(f"✅ Tipo de resolución: {obj.nombre}")


# ══════════════════════════════════════════════════════════════
# 10. TIPOS DE RECURSO
# ══════════════════════════════════════════════════════════════
# Art. 82, 83 — recursos del proceso disciplinario
tipos_recurso_data = [
    {"nombre": "Recurso de Apelación",   "descripcion": "Art. 82 — Impugna resoluciones de primera instancia. Plazo: 5 días hábiles."},
    {"nombre": "Recurso de Compulsa",    "descripcion": "Art. 83 — Procede por negativa indebida del recurso de apelación."},
    {"nombre": "Recurso de Aclaración",  "descripcion": "Art. 77 — Solicita aclaración, complementación o enmienda. Plazo: 2 días hábiles."},
    {"nombre": "Recurso de Nulidad",     "descripcion": "Solicita nulidad de actuaciones procesales."},
    {"nombre": "Recurso de Reposición",  "descripcion": "Solicita reposición de autos o decretos."},
]
print()
for r in tipos_recurso_data:
    obj, _ = TipoRecurso.objects.get_or_create(
        nombre=r["nombre"],
        defaults={"descripcion": r["descripcion"]}
    )
    print(f"✅ Tipo de recurso: {obj.nombre}")


# ══════════════════════════════════════════════════════════════
# 11. TIPOS DE ACTUACIÓN PROCESAL
# ══════════════════════════════════════════════════════════════
# Basados en el flujo real del Reglamento ICU 048-2018
tipos_actuacion_data = [
    # Etapa inicial
    {"codigo": "PRE", "nombre": "Presentación de Denuncia"},
    {"codigo": "SUB", "nombre": "Subsanación de Defectos"},
    {"codigo": "ADA", "nombre": "Auto de Admisión de Denuncia"},       # Art. 58
    {"codigo": "REC", "nombre": "Rechazo de Denuncia"},                # Art. 57
    # Etapa investigativa
    {"codigo": "CIP", "nombre": "Citación Personal al Denunciado"},    # Art. 44
    {"codigo": "DIN", "nombre": "Declaración Informativa"},            # Art. 58 inc. a
    {"codigo": "AAP", "nombre": "Auto de Apertura de Término Probatorio"}, # Art. 60
    {"codigo": "OFP", "nombre": "Ofrecimiento de Prueba"},
    {"codigo": "RAP", "nombre": "Ratificación de Pruebas"},            # Art. 60 par. II
    {"codigo": "PRP", "nombre": "Producción de Prueba"},
    {"codigo": "PRT", "nombre": "Prueba Testifical"},                  # Art. 67
    {"codigo": "MED", "nombre": "Medida Precautoria"},                 # Art. 61
    {"codigo": "INF", "nombre": "Solicitud de Informe"},               # Art. 21
    # Conclusión investigativa
    {"codigo": "CTP", "nombre": "Clausura del Término Probatorio"},    # Art. 74
    # Resolución
    {"codigo": "DRF", "nombre": "Dictado de Resolución Final"},        # Art. 75
    {"codigo": "NRF", "nombre": "Notificación de Resolución Final"},   # Art. 45, 46
    {"codigo": "ACE", "nombre": "Aclaración, Complementación o Enmienda"}, # Art. 77
    # Impugnación
    {"codigo": "IAP", "nombre": "Interposición de Apelación"},         # Art. 82
    {"codigo": "TRA", "nombre": "Traslado a la Otra Parte"},           # Art. 82 par. III
    {"codigo": "CON", "nombre": "Contestación al Recurso"},
    {"codigo": "REM", "nombre": "Remisión al Tribunal Superior"},      # Art. 86
    {"codigo": "SOR", "nombre": "Sorteo y Radicatoria"},               # Art. 86
    {"codigo": "RSI", "nombre": "Resolución de Segunda Instancia"},    # Art. 86 par. III
    # Ejecución
    {"codigo": "EFA", "nombre": "Ejecución de Fallo"},                 # Art. 90
    {"codigo": "RES", "nombre": "Resolución Administrativa del Rector"},# Art. 90 par. II
    {"codigo": "ARC", "nombre": "Archivo de Expediente"},
]
print()
for a in tipos_actuacion_data:
    obj, _ = TipoActuacion.objects.get_or_create(
        codigo=a["codigo"],
        defaults={"nombre": a["nombre"]}
    )
    print(f"✅ Tipo de actuación: {obj.nombre}")


# ══════════════════════════════════════════════════════════════
# 12. ROLES PROCESALES
# ══════════════════════════════════════════════════════════════
# Terminología correcta según el Reglamento ICU 048-2018
roles_procesales_data = [
    "Denunciante",
    "Denunciado",
    "Abogado Defensor",
    "Abogado Defensor de Oficio",   # Art. 58 inc. b
    "Testigo",
    "Perito",
    "Autoridad Universitaria",      # Art. 38
    "Docente",                      # Art. 39
    "Estudiante",                   # Art. 41
    "Administrativo",               # Art. 40
    "Tercero Interesado",
    "Representante Legal",
]
print()
for rp in roles_procesales_data:
    obj, _ = RolProcesal.objects.get_or_create(nombre_rol=rp)
    print(f"✅ Rol procesal: {obj.nombre_rol}")


# ══════════════════════════════════════════════════════════════
# 13. PERMISOS — códigos exactos del frontend (permisos.ts)
# ══════════════════════════════════════════════════════════════
permisos_data = [
    # Seguridad
    {"codigo": "USUARIOS_VER",          "nombre": "Ver usuarios",              "modulo": "Seguridad"},
    {"codigo": "ROLES_VER",             "nombre": "Ver roles",                 "modulo": "Seguridad"},
    {"codigo": "PERMISOS_VER",          "nombre": "Ver permisos",              "modulo": "Seguridad"},
    # Tribunal
    {"codigo": "TRIBUNALES_VER",        "nombre": "Ver tribunal",              "modulo": "Tribunal"},
    {"codigo": "SALAS_TRIBUNAL_VER",    "nombre": "Ver salas de tribunal",     "modulo": "Tribunal"},
    {"codigo": "SALAS_AUDIENCIA_VER",   "nombre": "Ver salas de audiencia",    "modulo": "Tribunal"},
    {"codigo": "VOCALES_VER",           "nombre": "Ver vocales",               "modulo": "Tribunal"},
    {"codigo": "CONFORMACIONES_VER",    "nombre": "Ver conformaciones",        "modulo": "Tribunal"},
    # Expedientes
    {"codigo": "EXPEDIENTES_VER",       "nombre": "Ver expedientes",           "modulo": "Expedientes"},
    {"codigo": "HISTORIAL_ESTADOS_VER", "nombre": "Ver historial de estados",  "modulo": "Expedientes"},
    {"codigo": "ACTUACIONES_VER",       "nombre": "Ver actuaciones",           "modulo": "Expedientes"},
    {"codigo": "ESTADOS_EXPEDIENTE_VER","nombre": "Ver estados de expediente", "modulo": "Expedientes"},
    # Audiencias
    {"codigo": "AUDIENCIAS_VER",        "nombre": "Ver audiencias",            "modulo": "Audiencias"},
    {"codigo": "ASISTENCIAS_VER",       "nombre": "Ver asistencias",           "modulo": "Audiencias"},
    {"codigo": "ACTAS_VER",             "nombre": "Ver actas",                 "modulo": "Audiencias"},
    # Resoluciones
    {"codigo": "RESOLUCIONES_VER",      "nombre": "Ver resoluciones",          "modulo": "Resoluciones"},
    {"codigo": "RECURSOS_VER",          "nombre": "Ver recursos",              "modulo": "Resoluciones"},
    {"codigo": "TIPOS_RESOLUCION_VER",  "nombre": "Ver tipos de resolución",   "modulo": "Resoluciones"},
    {"codigo": "TIPOS_RECURSO_VER",     "nombre": "Ver tipos de recurso",      "modulo": "Resoluciones"},
    # Documentos
    {"codigo": "DOCUMENTOS_VER",        "nombre": "Ver documentos",            "modulo": "Documentos"},
    {"codigo": "TIPOS_DOCUMENTO_VER",   "nombre": "Ver tipos de documento",    "modulo": "Documentos"},
    {"codigo": "NOTIFICACIONES_VER",    "nombre": "Ver notificaciones",        "modulo": "Documentos"},
    {"codigo": "SOLICITUDES_VER",       "nombre": "Ver solicitudes",           "modulo": "Documentos"},
    # Personas
    {"codigo": "PERSONAS_VER",          "nombre": "Ver personas",              "modulo": "Personas"},
    {"codigo": "CONTACTOS_VER",         "nombre": "Ver contactos",             "modulo": "Personas"},
    {"codigo": "ROLES_PROCESALES_VER",  "nombre": "Ver roles procesales",      "modulo": "Personas"},
    {"codigo": "PARTES_PROCESALES_VER", "nombre": "Ver partes procesales",     "modulo": "Personas"},
    # Catálogos
    {"codigo": "TIPOS_PROCESO_VER",     "nombre": "Ver tipos de proceso",      "modulo": "Catalogos"},
    {"codigo": "TIPOS_AUDIENCIA_VER",   "nombre": "Ver tipos de audiencia",    "modulo": "Catalogos"},
    {"codigo": "TIPOS_ACTUACION_VER",   "nombre": "Ver tipos de actuación",    "modulo": "Catalogos"},
    # Reportes
    {"codigo": "REPORTES_VER",          "nombre": "Ver reportes",              "modulo": "Reportes"},
]

print()
permisos_map = {}
for p in permisos_data:
    obj, _ = Permiso.objects.get_or_create(
        codigo=p["codigo"],
        defaults={"nombre": p["nombre"], "modulo": p["modulo"]}
    )
    permisos_map[p["codigo"]] = obj
    print(f"✅ Permiso: {obj.codigo}")


# ══════════════════════════════════════════════════════════════
# 14. ASIGNAR PERMISOS A ROLES
# ══════════════════════════════════════════════════════════════

# ── Administrador → TODOS ────────────────────────────────────
print("\n🔐 Asignando permisos al rol Administrador...")
RolPermiso.objects.filter(rol=rol_admin).delete()
for permiso in permisos_map.values():
    RolPermiso.objects.get_or_create(rol=rol_admin, permiso=permiso)
print(f"   ✅ {len(permisos_map)} permisos asignados")

# ── AdminSala1 y AdminSala2 → todo excepto seguridad ─────────
permisos_adminsala = [
    "TRIBUNALES_VER", "SALAS_TRIBUNAL_VER", "SALAS_AUDIENCIA_VER",
    "VOCALES_VER", "CONFORMACIONES_VER",
    "EXPEDIENTES_VER", "HISTORIAL_ESTADOS_VER", "ACTUACIONES_VER", "ESTADOS_EXPEDIENTE_VER",
    "AUDIENCIAS_VER", "ASISTENCIAS_VER", "ACTAS_VER",
    "RESOLUCIONES_VER", "RECURSOS_VER", "TIPOS_RESOLUCION_VER", "TIPOS_RECURSO_VER",
    "DOCUMENTOS_VER", "TIPOS_DOCUMENTO_VER", "NOTIFICACIONES_VER", "SOLICITUDES_VER",
    "PERSONAS_VER", "CONTACTOS_VER", "ROLES_PROCESALES_VER", "PARTES_PROCESALES_VER",
    "TIPOS_PROCESO_VER", "TIPOS_AUDIENCIA_VER", "TIPOS_ACTUACION_VER",
    "REPORTES_VER",
]
for nombre_rol, rol_obj in [("AdminSala1", rol_adminsala1), ("AdminSala2", rol_adminsala2)]:
    print(f"\n🔐 Asignando permisos a {nombre_rol}...")
    RolPermiso.objects.filter(rol=rol_obj).delete()
    for codigo in permisos_adminsala:
        if codigo in permisos_map:
            RolPermiso.objects.get_or_create(rol=rol_obj, permiso=permisos_map[codigo])
    print(f"   ✅ {len(permisos_adminsala)} permisos asignados")

# ── Secretario → perfil operativo (Art. 34) ──────────────────
# Gestiona expedientes, actuaciones, citaciones, notificaciones,
# actas, documentos, personas, plazos
permisos_secretario = [
    "EXPEDIENTES_VER", "HISTORIAL_ESTADOS_VER", "ACTUACIONES_VER", "ESTADOS_EXPEDIENTE_VER",
    "AUDIENCIAS_VER", "ASISTENCIAS_VER", "ACTAS_VER",
    "DOCUMENTOS_VER", "NOTIFICACIONES_VER", "SOLICITUDES_VER", "TIPOS_DOCUMENTO_VER",
    "PERSONAS_VER", "CONTACTOS_VER", "ROLES_PROCESALES_VER", "PARTES_PROCESALES_VER",
    "TIPOS_PROCESO_VER", "TIPOS_AUDIENCIA_VER", "TIPOS_ACTUACION_VER",
    "SALAS_AUDIENCIA_VER",
]
for nombre_rol, rol_obj in [("SecretarioSala1", rol_secretariosala1), ("SecretarioSala2", rol_secretariosala2)]:
    print(f"\n🔐 Asignando permisos a {nombre_rol}...")
    RolPermiso.objects.filter(rol=rol_obj).delete()
    for codigo in permisos_secretario:
        if codigo in permisos_map:
            RolPermiso.objects.get_or_create(rol=rol_obj, permiso=permisos_map[codigo])
    print(f"   ✅ {len(permisos_secretario)} permisos asignados")

# ── Vocal → perfil resolutivo (Art. 27, 75, 82, 86) ──────────
# Resuelve expedientes, dicta resoluciones, conoce audiencias,
# revisa recursos. No gestiona usuarios ni catálogos operativos.
permisos_vocal = [
    "EXPEDIENTES_VER", "HISTORIAL_ESTADOS_VER", "ESTADOS_EXPEDIENTE_VER",
    "AUDIENCIAS_VER", "ACTAS_VER",
    "RESOLUCIONES_VER", "RECURSOS_VER", "TIPOS_RESOLUCION_VER", "TIPOS_RECURSO_VER",
    "DOCUMENTOS_VER",
    "PERSONAS_VER", "PARTES_PROCESALES_VER", "ROLES_PROCESALES_VER",
]
for nombre_rol, rol_obj in [("VocalSala1", rol_vocalsala1), ("VocalSala2", rol_vocalsala2)]:
    print(f"\n🔐 Asignando permisos a {nombre_rol}...")
    RolPermiso.objects.filter(rol=rol_obj).delete()
    for codigo in permisos_vocal:
        if codigo in permisos_map:
            RolPermiso.objects.get_or_create(rol=rol_obj, permiso=permisos_map[codigo])
    print(f"   ✅ {len(permisos_vocal)} permisos asignados")


# ══════════════════════════════════════════════════════════════
# 15. USUARIOS
# ══════════════════════════════════════════════════════════════
print()
usuarios_data = [
    {
        "username": "admin",
        "nombres": "Administrador", "paterno": "Sistema", "materno": "",
        "ci": "00000000", "email": "admin@tribunal.bo",
        "password": "Admin123!", "rol": rol_admin,
        "cargo": "Administrador del Sistema",
    },
    {
        "username": "adminsala1",
        "nombres": "Admin", "paterno": "Sala1", "materno": "",
        "ci": "11111111", "email": "adminsala1@tribunal.bo",
        "password": "Admin123!", "rol": rol_adminsala1,
        "cargo": "Administrador Sala 1",
    },
    {
        "username": "adminsala2",
        "nombres": "Admin", "paterno": "Sala2", "materno": "",
        "ci": "22222222", "email": "adminsala2@tribunal.bo",
        "password": "Admin123!", "rol": rol_adminsala2,
        "cargo": "Administrador Sala 2",
    },
    {
        "username": "secretariosala1",
        "nombres": "Secretario", "paterno": "Sala1", "materno": "",
        "ci": "33333333", "email": "secretariosala1@tribunal.bo",
        "password": "Admin123!", "rol": rol_secretariosala1,
        "cargo": "Secretario Sala 1",
    },
    {
        "username": "secretariosala2",
        "nombres": "Secretario", "paterno": "Sala2", "materno": "",
        "ci": "44444444", "email": "secretariosala2@tribunal.bo",
        "password": "Admin123!", "rol": rol_secretariosala2,
        "cargo": "Secretario Sala 2",
    },
    {
        "username": "vocalsala1",
        "nombres": "Vocal", "paterno": "Sala1", "materno": "",
        "ci": "55555555", "email": "vocalsala1@tribunal.bo",
        "password": "Admin123!", "rol": rol_vocalsala1,
        "cargo": "Vocal Sala 1",
    },
    {
        "username": "vocalsala2",
        "nombres": "Vocal", "paterno": "Sala2", "materno": "",
        "ci": "66666666", "email": "vocalsala2@tribunal.bo",
        "password": "Admin123!", "rol": rol_vocalsala2,
        "cargo": "Vocal Sala 2",
    },
]

for u in usuarios_data:
    if not Usuario.objects.filter(username=u["username"]).exists():
        Usuario.objects.create(
            nombres=u["nombres"],
            paterno=u["paterno"],
            materno=u["materno"],
            documento_identidad=u["ci"],
            email=u["email"],
            username=u["username"],
            password=make_password(u["password"]),
            rol=u["rol"],
            cargo_oficial=u["cargo"],
            activo=True,
        )
        print(f"✅ Usuario creado: {u['username']} / {u['password']}")
    else:
        print(f"⚠️  Usuario ya existe: {u['username']}")


# ══════════════════════════════════════════════════════════════
# RESUMEN FINAL
# ══════════════════════════════════════════════════════════════
print()
print("=" * 60)
print("  ✅ Poblada completa finalizada")
print("=" * 60)
print()
print("  Resumen:")
print(f"  - 1 Tribunal + 2 Salas de Tribunal + 3 Salas de Audiencia")
print(f"  - 7 Roles de usuario")
print(f"  - {len(estados_data)} Estados de expediente (flujo real ICU 048-2018)")
print(f"  - 1 Tipo de proceso (Proceso Disciplinario Sumario)")
print(f"  - {len(tipos_audiencia_data)} Tipos de audiencia")
print(f"  - {len(tipos_doc_data)} Tipos de documento")
print(f"  - {len(tipos_resolucion_data)} Tipos de resolución")
print(f"  - {len(tipos_recurso_data)} Tipos de recurso")
print(f"  - {len(tipos_actuacion_data)} Tipos de actuación procesal")
print(f"  - {len(roles_procesales_data)} Roles procesales")
print(f"  - {len(permisos_data)} Permisos")
print(f"  - {len(usuarios_data)} Usuarios de prueba")
print()
print("  Credenciales (todos con contraseña Admin123!):")
print("  ┌─────────────────────┬────────────────────────┐")
print("  │ Usuario             │ Rol                    │")
print("  ├─────────────────────┼────────────────────────┤")
print("  │ admin               │ Administrador          │")
print("  │ adminsala1          │ AdminSala1             │")
print("  │ adminsala2          │ AdminSala2             │")
print("  │ secretariosala1     │ SecretarioSala1        │")
print("  │ secretariosala2     │ SecretarioSala2        │")
print("  │ vocalsala1          │ VocalSala1             │")
print("  │ vocalsala2          │ VocalSala2             │")
print("  └─────────────────────┴────────────────────────┘")
print()
print("  ⚠️  Cierra sesión y vuelve a entrar para ver los cambios.")
print()