#!/usr/bin/env python
"""
Poblada COMPLETA — Sistema de Gestión Judicial
Ejecutar desde la carpeta tribunal_backend con:
    python poblar_completo.py
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
print("  POBLADA COMPLETA — Tribunal de Justicia")
print("=" * 60)


# ══════════════════════════════════════════════════════════════
# 1. TRIBUNAL
# ══════════════════════════════════════════════════════════════
tribunal, _ = Tribunal.objects.get_or_create(
    nombre_tribunal="Tribunal de Justicia Universitaria de Primera Instancia",
    defaults={
        "instancia": "PRIMERA",
        "norma_creacion": "Reglamento Interno U.A.G.R.M.",
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
print("✅ Sala 1 y Sala 2 del Tribunal creadas/encontradas")


# ══════════════════════════════════════════════════════════════
# 3. SALAS DE AUDIENCIA
# ══════════════════════════════════════════════════════════════
salas_audiencia = [
    {"nombre_sala": "Sala de Audiencias A", "capacidad": 20, "equipada_videoconf": True},
    {"nombre_sala": "Sala de Audiencias B", "capacidad": 15, "equipada_videoconf": True},
    {"nombre_sala": "Sala de Audiencias C", "capacidad": 10, "equipada_videoconf": False},
]
for s in salas_audiencia:
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
rol_admin, _ = Rol.objects.get_or_create(
    nombre="Administrador",
    defaults={"descripcion": "Acceso total al sistema", "sala_asignada": None, "activo": True}
)
rol_sala1, _ = Rol.objects.get_or_create(
    nombre="AdminSala1",
    defaults={"descripcion": "Administrador de Sala 1", "sala_asignada": sala1, "activo": True}
)
rol_sala2, _ = Rol.objects.get_or_create(
    nombre="AdminSala2",
    defaults={"descripcion": "Administrador de Sala 2", "sala_asignada": sala2, "activo": True}
)
print("\n✅ Roles: Administrador, AdminSala1, AdminSala2")


# ══════════════════════════════════════════════════════════════
# 5. ESTADOS DE EXPEDIENTE
# ══════════════════════════════════════════════════════════════
estados = [
    {"nombre_estado": "Admitido",       "es_terminal": False, "nivel": 1},
    {"nombre_estado": "En Trámite",     "es_terminal": False, "nivel": 2},
    {"nombre_estado": "Para Sentencia", "es_terminal": False, "nivel": 3},
    {"nombre_estado": "Sentenciado",    "es_terminal": False, "nivel": 4},
    {"nombre_estado": "Archivado",      "es_terminal": True,  "nivel": 5},
    {"nombre_estado": "En Ejecución",   "es_terminal": False, "nivel": 5},
    {"nombre_estado": "Rechazado",      "es_terminal": True,  "nivel": 5},
    {"nombre_estado": "Falta Apelado",  "es_terminal": False, "nivel": 4},
]
print()
for e in estados:
    obj, _ = EstadoExpediente.objects.get_or_create(
        nombre_estado=e["nombre_estado"],
        defaults={"es_terminal": e["es_terminal"], "nivel": e["nivel"]}
    )
    print(f"✅ Estado: {obj.nombre_estado}")


# ══════════════════════════════════════════════════════════════
# 6. TIPO DE PROCESO
# ══════════════════════════════════════════════════════════════
tipo_proceso, _ = TipoProceso.objects.get_or_create(
    nombre="Proceso Sumario",
    defaults={"codigo": "PS"}
)
print(f"\n✅ Tipo de proceso: {tipo_proceso.nombre}")


# ══════════════════════════════════════════════════════════════
# 7. TIPOS DE AUDIENCIA
# ══════════════════════════════════════════════════════════════
tipos_audiencia = [
    {"nombre": "Audiencia Preliminar",         "duracion_estimada": 60},
    {"nombre": "Audiencia de Juicio Oral",     "duracion_estimada": 120},
    {"nombre": "Audiencia de Conciliación",    "duracion_estimada": 90},
    {"nombre": "Audiencia de Prueba",          "duracion_estimada": 90},
    {"nombre": "Audiencia de Sentencia",       "duracion_estimada": 60},
    {"nombre": "Audiencia de Apelación",       "duracion_estimada": 60},
    {"nombre": "Audiencia Cautelar",           "duracion_estimada": 45},
    {"nombre": "Audiencia de Ratificación",    "duracion_estimada": 30},
]
print()
for t in tipos_audiencia:
    obj, _ = TipoAudiencia.objects.get_or_create(
        nombre=t["nombre"],
        id_tipo_proceso=tipo_proceso,
        defaults={"duracion_estimada": t["duracion_estimada"], "descripcion": t["nombre"]}
    )
    print(f"✅ Tipo de audiencia: {obj.nombre}")


# ══════════════════════════════════════════════════════════════
# 8. TIPOS DE DOCUMENTO
# ══════════════════════════════════════════════════════════════
tipos_doc = [
    {"codigo": "DEN",  "nombre": "Denuncia",                  "requiere_firma": True,  "es_publico": False},
    {"codigo": "MEM",  "nombre": "Memorial",                  "requiere_firma": True,  "es_publico": True},
    {"codigo": "RES",  "nombre": "Resolución",                "requiere_firma": True,  "es_publico": True},
    {"codigo": "ACT",  "nombre": "Acta de Audiencia",         "requiere_firma": True,  "es_publico": True},
    {"codigo": "NOT",  "nombre": "Notificación",              "requiere_firma": False, "es_publico": True},
    {"codigo": "CIT",  "nombre": "Citación",                  "requiere_firma": False, "es_publico": True},
    {"codigo": "PRU",  "nombre": "Prueba Documental",         "requiere_firma": False, "es_publico": False},
    {"codigo": "SEN",  "nombre": "Sentencia",                 "requiere_firma": True,  "es_publico": True},
    {"codigo": "AUT",  "nombre": "Auto",                      "requiere_firma": True,  "es_publico": True},
    {"codigo": "DEC",  "nombre": "Decreto",                   "requiere_firma": True,  "es_publico": True},
    {"codigo": "INF",  "nombre": "Informe",                   "requiere_firma": False, "es_publico": False},
    {"codigo": "CER",  "nombre": "Certificado",               "requiere_firma": True,  "es_publico": True},
    {"codigo": "EXH",  "nombre": "Exhorto",                   "requiere_firma": True,  "es_publico": True},
    {"codigo": "CON",  "nombre": "Contrato / Convenio",       "requiere_firma": True,  "es_publico": False},
    {"codigo": "APE",  "nombre": "Recurso de Apelación",      "requiere_firma": True,  "es_publico": True},
]
print()
for d in tipos_doc:
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
tipos_resolucion = [
    {"codigo": "SEN", "nombre": "Sentencia",          "nivel_jerarquico": 1},
    {"codigo": "AUT", "nombre": "Auto",               "nivel_jerarquico": 2},
    {"codigo": "DEC", "nombre": "Decreto",            "nivel_jerarquico": 3},
    {"codigo": "RES", "nombre": "Resolución",         "nivel_jerarquico": 2},
    {"codigo": "PRO", "nombre": "Providencia",        "nivel_jerarquico": 4},
    {"codigo": "VIS", "nombre": "Vista de Causa",     "nivel_jerarquico": 3},
]
print()
for r in tipos_resolucion:
    obj, _ = TipoResolucion.objects.get_or_create(
        codigo=r["codigo"],
        defaults={
            "nombre": r["nombre"],
            "nivel_jerarquico": r["nivel_jerarquico"],
        }
    )
    print(f"✅ Tipo de resolución: {obj.nombre}")


# ══════════════════════════════════════════════════════════════
# 10. TIPOS DE RECURSO
# ══════════════════════════════════════════════════════════════
tipos_recurso = [
    {"nombre": "Recurso de Apelación",      "descripcion": "Impugna resoluciones de primera instancia"},
    {"nombre": "Recurso de Casación",       "descripcion": "Impugna sentencias definitivas"},
    {"nombre": "Recurso de Nulidad",        "descripcion": "Solicita nulidad de actuaciones"},
    {"nombre": "Recurso de Reposición",     "descripcion": "Solicita reposición de autos o decretos"},
    {"nombre": "Recurso de Compulsa",       "descripcion": "Eleva el recurso denegado al superior"},
    {"nombre": "Recurso de Aclaración",     "descripcion": "Solicita aclaración de resoluciones"},
]
print()
for r in tipos_recurso:
    obj, _ = TipoRecurso.objects.get_or_create(
        nombre=r["nombre"],
        defaults={"descripcion": r["descripcion"]}
    )
    print(f"✅ Tipo de recurso: {obj.nombre}")


# ══════════════════════════════════════════════════════════════
# 11. TIPOS DE ACTUACIÓN PROCESAL
# ══════════════════════════════════════════════════════════════
tipos_actuacion = [
    {"codigo": "PRE",  "nombre": "Presentación de memorial"},
    {"codigo": "NOT",  "nombre": "Notificación a partes"},
    {"codigo": "CIT",  "nombre": "Citación a audiencia"},
    {"codigo": "ADM",  "nombre": "Admisión de demanda"},
    {"codigo": "CON",  "nombre": "Contestación a la demanda"},
    {"codigo": "PRU",  "nombre": "Ofrecimiento de prueba"},
    {"codigo": "PRO",  "nombre": "Producción de prueba"},
    {"codigo": "ALE",  "nombre": "Alegatos"},
    {"codigo": "SEN",  "nombre": "Dictado de sentencia"},
    {"codigo": "APE",  "nombre": "Interposición de apelación"},
    {"codigo": "EJE",  "nombre": "Ejecución de sentencia"},
    {"codigo": "ARC",  "nombre": "Archivo de expediente"},
    {"codigo": "INC",  "nombre": "Incidente procesal"},
    {"codigo": "MED",  "nombre": "Medida cautelar"},
    {"codigo": "PER",  "nombre": "Pericia"},
    {"codigo": "INS",  "nombre": "Inspección judicial"},
]
print()
for a in tipos_actuacion:
    obj, _ = TipoActuacion.objects.get_or_create(
        codigo=a["codigo"],
        defaults={"nombre": a["nombre"]}
    )
    print(f"✅ Tipo de actuación: {obj.nombre}")


# ══════════════════════════════════════════════════════════════
# 12. ROLES PROCESALES
# ══════════════════════════════════════════════════════════════
roles_procesales = [
    "Demandante",
    "Demandado",
    "Abogado Demandante",
    "Abogado Demandado",
    "Testigo",
    "Perito",
    "Tercero Interesado",
    "Representante Legal",
    "Garante",
    "Fiscal",
]
print()
for rp in roles_procesales:
    obj, _ = RolProcesal.objects.get_or_create(nombre_rol=rp)
    print(f"✅ Rol procesal: {obj.nombre_rol}")


# ══════════════════════════════════════════════════════════════
# 13. PERMISOS
# ══════════════════════════════════════════════════════════════
permisos_data = [
    # USUARIOS
    {"codigo": "VER_USUARIOS",        "nombre": "Ver usuarios",           "modulo": "Usuarios"},
    {"codigo": "CREAR_USUARIOS",      "nombre": "Crear usuarios",         "modulo": "Usuarios"},
    {"codigo": "EDITAR_USUARIOS",     "nombre": "Editar usuarios",        "modulo": "Usuarios"},
    {"codigo": "ELIMINAR_USUARIOS",   "nombre": "Eliminar usuarios",      "modulo": "Usuarios"},
    # ROLES Y PERMISOS
    {"codigo": "VER_ROLES",           "nombre": "Ver roles",              "modulo": "Roles"},
    {"codigo": "GESTIONAR_ROLES",     "nombre": "Gestionar roles",        "modulo": "Roles"},
    {"codigo": "VER_PERMISOS",        "nombre": "Ver permisos",           "modulo": "Permisos"},
    {"codigo": "GESTIONAR_PERMISOS",  "nombre": "Gestionar permisos",     "modulo": "Permisos"},
    # PERSONAS
    {"codigo": "VER_PERSONAS",        "nombre": "Ver personas",           "modulo": "Personas"},
    {"codigo": "CREAR_PERSONAS",      "nombre": "Crear personas",         "modulo": "Personas"},
    {"codigo": "EDITAR_PERSONAS",     "nombre": "Editar personas",        "modulo": "Personas"},
    {"codigo": "ELIMINAR_PERSONAS",   "nombre": "Eliminar personas",      "modulo": "Personas"},
    # EXPEDIENTES
    {"codigo": "VER_EXPEDIENTES",     "nombre": "Ver expedientes",        "modulo": "Expedientes"},
    {"codigo": "CREAR_EXPEDIENTES",   "nombre": "Crear expedientes",      "modulo": "Expedientes"},
    {"codigo": "EDITAR_EXPEDIENTES",  "nombre": "Editar expedientes",     "modulo": "Expedientes"},
    {"codigo": "ELIMINAR_EXPEDIENTES","nombre": "Eliminar expedientes",   "modulo": "Expedientes"},
    # AUDIENCIAS
    {"codigo": "VER_AUDIENCIAS",      "nombre": "Ver audiencias",         "modulo": "Audiencias"},
    {"codigo": "CREAR_AUDIENCIAS",    "nombre": "Crear audiencias",       "modulo": "Audiencias"},
    {"codigo": "EDITAR_AUDIENCIAS",   "nombre": "Editar audiencias",      "modulo": "Audiencias"},
    {"codigo": "ELIMINAR_AUDIENCIAS", "nombre": "Eliminar audiencias",    "modulo": "Audiencias"},
    {"codigo": "ENVIAR_CITACIONES",   "nombre": "Enviar citaciones",      "modulo": "Audiencias"},
    # RESOLUCIONES
    {"codigo": "VER_RESOLUCIONES",    "nombre": "Ver resoluciones",       "modulo": "Resoluciones"},
    {"codigo": "CREAR_RESOLUCIONES",  "nombre": "Crear resoluciones",     "modulo": "Resoluciones"},
    {"codigo": "EDITAR_RESOLUCIONES", "nombre": "Editar resoluciones",    "modulo": "Resoluciones"},
    {"codigo": "ELIMINAR_RESOLUCIONES","nombre":"Eliminar resoluciones",  "modulo": "Resoluciones"},
    # DOCUMENTOS
    {"codigo": "VER_DOCUMENTOS",      "nombre": "Ver documentos",         "modulo": "Documentos"},
    {"codigo": "CREAR_DOCUMENTOS",    "nombre": "Crear documentos",       "modulo": "Documentos"},
    {"codigo": "EDITAR_DOCUMENTOS",   "nombre": "Editar documentos",      "modulo": "Documentos"},
    {"codigo": "ELIMINAR_DOCUMENTOS", "nombre": "Eliminar documentos",    "modulo": "Documentos"},
    # PARTES PROCESALES
    {"codigo": "VER_PARTES",          "nombre": "Ver partes procesales",  "modulo": "Partes"},
    {"codigo": "CREAR_PARTES",        "nombre": "Crear partes procesales","modulo": "Partes"},
    {"codigo": "EDITAR_PARTES",       "nombre": "Editar partes procesales","modulo": "Partes"},
    {"codigo": "ELIMINAR_PARTES",     "nombre": "Eliminar partes procesales","modulo": "Partes"},
    # ACTUACIONES
    {"codigo": "VER_ACTUACIONES",     "nombre": "Ver actuaciones",        "modulo": "Actuaciones"},
    {"codigo": "CREAR_ACTUACIONES",   "nombre": "Crear actuaciones",      "modulo": "Actuaciones"},
    {"codigo": "EDITAR_ACTUACIONES",  "nombre": "Editar actuaciones",     "modulo": "Actuaciones"},
    {"codigo": "ELIMINAR_ACTUACIONES","nombre": "Eliminar actuaciones",   "modulo": "Actuaciones"},
    # TRIBUNALES Y SALAS
    {"codigo": "VER_TRIBUNAL",        "nombre": "Ver tribunal",           "modulo": "Tribunal"},
    {"codigo": "GESTIONAR_TRIBUNAL",  "nombre": "Gestionar tribunal",     "modulo": "Tribunal"},
    {"codigo": "VER_SALAS",           "nombre": "Ver salas",              "modulo": "Tribunal"},
    {"codigo": "GESTIONAR_SALAS",     "nombre": "Gestionar salas",        "modulo": "Tribunal"},
    {"codigo": "VER_VOCALES",         "nombre": "Ver vocales",            "modulo": "Tribunal"},
    {"codigo": "GESTIONAR_VOCALES",   "nombre": "Gestionar vocales",      "modulo": "Tribunal"},
    # DENUNCIAS
    {"codigo": "VER_DENUNCIAS",       "nombre": "Ver denuncias",          "modulo": "Denuncias"},
    {"codigo": "CREAR_DENUNCIAS",     "nombre": "Crear denuncias",        "modulo": "Denuncias"},
    {"codigo": "EDITAR_DENUNCIAS",    "nombre": "Editar denuncias",       "modulo": "Denuncias"},
    {"codigo": "ELIMINAR_DENUNCIAS",  "nombre": "Eliminar denuncias",     "modulo": "Denuncias"},
    # RESOLUCIONES ANTIGUAS
    {"codigo": "VER_RES_ANTIGUAS",    "nombre": "Ver resoluciones antiguas",    "modulo": "Resoluciones"},
    {"codigo": "CREAR_RES_ANTIGUAS",  "nombre": "Crear resoluciones antiguas",  "modulo": "Resoluciones"},
    {"codigo": "EDITAR_RES_ANTIGUAS", "nombre": "Editar resoluciones antiguas", "modulo": "Resoluciones"},
    # REPORTES
    {"codigo": "VER_REPORTES",        "nombre": "Ver reportes",           "modulo": "Reportes"},
    {"codigo": "ENVIAR_REPORTES",     "nombre": "Enviar reportes",        "modulo": "Reportes"},
    # NOTIFICACIONES
    {"codigo": "VER_NOTIFICACIONES",  "nombre": "Ver notificaciones",     "modulo": "Notificaciones"},
    {"codigo": "GESTIONAR_NOTIFICACIONES","nombre":"Gestionar notificaciones","modulo": "Notificaciones"},
    # SOLICITUDES
    {"codigo": "VER_SOLICITUDES",     "nombre": "Ver solicitudes",        "modulo": "Solicitudes"},
    {"codigo": "GESTIONAR_SOLICITUDES","nombre":"Gestionar solicitudes",  "modulo": "Solicitudes"},
    # CERTIFICADOS
    {"codigo": "EMITIR_CERTIFICADOS", "nombre": "Emitir certificados",    "modulo": "Certificados"},
    # CATALOGO
    {"codigo": "VER_CATALOGOS",       "nombre": "Ver catálogos",          "modulo": "Catalogos"},
    {"codigo": "GESTIONAR_CATALOGOS", "nombre": "Gestionar catálogos",    "modulo": "Catalogos"},
    # DASHBOARD
    {"codigo": "VER_DASHBOARD",       "nombre": "Ver dashboard",          "modulo": "Dashboard"},
]

print()
permisos_creados = {}
for p in permisos_data:
    obj, _ = Permiso.objects.get_or_create(
        codigo=p["codigo"],
        defaults={"nombre": p["nombre"], "modulo": p["modulo"]}
    )
    permisos_creados[p["codigo"]] = obj
    print(f"✅ Permiso: {obj.codigo}")


# ══════════════════════════════════════════════════════════════
# 14. ASIGNAR PERMISOS A ROLES
# ══════════════════════════════════════════════════════════════

# Administrador → TODOS los permisos
print("\n🔐 Asignando permisos al rol Administrador...")
for permiso in permisos_creados.values():
    RolPermiso.objects.get_or_create(rol=rol_admin, permiso=permiso)
print(f"   ✅ {len(permisos_creados)} permisos asignados")

# AdminSala1 y AdminSala2 → permisos operativos (sin gestión de sistema)
permisos_sala = [
    "VER_DASHBOARD",
    "VER_PERSONAS", "CREAR_PERSONAS", "EDITAR_PERSONAS",
    "VER_EXPEDIENTES", "CREAR_EXPEDIENTES", "EDITAR_EXPEDIENTES",
    "VER_AUDIENCIAS", "CREAR_AUDIENCIAS", "EDITAR_AUDIENCIAS", "ENVIAR_CITACIONES",
    "VER_RESOLUCIONES", "CREAR_RESOLUCIONES", "EDITAR_RESOLUCIONES",
    "VER_DOCUMENTOS", "CREAR_DOCUMENTOS", "EDITAR_DOCUMENTOS",
    "VER_PARTES", "CREAR_PARTES", "EDITAR_PARTES",
    "VER_ACTUACIONES", "CREAR_ACTUACIONES", "EDITAR_ACTUACIONES",
    "VER_DENUNCIAS", "CREAR_DENUNCIAS", "EDITAR_DENUNCIAS",
    "VER_RES_ANTIGUAS", "CREAR_RES_ANTIGUAS", "EDITAR_RES_ANTIGUAS",
    "VER_NOTIFICACIONES", "GESTIONAR_NOTIFICACIONES",
    "VER_SOLICITUDES", "GESTIONAR_SOLICITUDES",
    "EMITIR_CERTIFICADOS",
    "VER_CATALOGOS",
    "VER_TRIBUNAL", "VER_SALAS", "VER_VOCALES",
    "VER_REPORTES",
]

print("\n🔐 Asignando permisos a AdminSala1...")
for codigo in permisos_sala:
    if codigo in permisos_creados:
        RolPermiso.objects.get_or_create(rol=rol_sala1, permiso=permisos_creados[codigo])
print(f"   ✅ {len(permisos_sala)} permisos asignados")

print("\n🔐 Asignando permisos a AdminSala2...")
for codigo in permisos_sala:
    if codigo in permisos_creados:
        RolPermiso.objects.get_or_create(rol=rol_sala2, permiso=permisos_creados[codigo])
print(f"   ✅ {len(permisos_sala)} permisos asignados")


# ══════════════════════════════════════════════════════════════
# 15. USUARIO ADMINISTRADOR
# ══════════════════════════════════════════════════════════════
print()
if not Usuario.objects.filter(username="admin").exists():
    Usuario.objects.create(
        nombres="Administrador",
        paterno="Sistema",
        materno="",
        documento_identidad="00000000",
        email="admin@tribunal.bo",
        username="admin",
        password=make_password("Admin123!"),
        rol=rol_admin,
        cargo_oficial="Administrador del Sistema",
        activo=True,
    )
    print("✅ Usuario: admin / Admin123! (CREADO)")
else:
    print("⚠️  Usuario 'admin' ya existe, no se modificó")


print()
print("=" * 60)
print("  ✅ Poblada completa finalizada sin errores")
print("=" * 60)
print()
print("  Resumen:")
print(f"  - 1 Tribunal")
print(f"  - 2 Salas de Tribunal")
print(f"  - 3 Salas de Audiencia")
print(f"  - 3 Roles de usuario")
print(f"  - 8 Estados de expediente")
print(f"  - 1 Tipo de proceso")
print(f"  - 8 Tipos de audiencia")
print(f"  - 15 Tipos de documento")
print(f"  - 6 Tipos de resolución")
print(f"  - 6 Tipos de recurso")
print(f"  - 16 Tipos de actuación")
print(f"  - 10 Roles procesales")
print(f"  - {len(permisos_data)} Permisos")
print(f"  - 1 Usuario administrador (admin / Admin123!)")
print()