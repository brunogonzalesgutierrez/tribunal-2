#!/usr/bin/env python
"""
POBLADA COMPLETA — Sistema de Gestión Judicial UAGRM
Resolución ICU 048-2018
Ejecutar desde tribunal_backend con:
    python poblar.py
"""

import os
import django
from datetime import date

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth.hashers import make_password
from tribunal.models import (
    Rol, SalaTribunal, SalaAudiencia, Tribunal, EstadoExpediente,
    TipoProceso, TipoAudiencia, TipoDoc, TipoResolucion, TipoRecurso,
    TipoActuacion, RolProcesal, Permiso, RolPermiso, Usuario, Persona,
    ContactoPersona, VocalTribunal
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
    nombre_sala="Sala 1", id_tribunal=tribunal, defaults={"activa": True}
)
sala2, _ = SalaTribunal.objects.get_or_create(
    nombre_sala="Sala 2", id_tribunal=tribunal, defaults={"activa": True}
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
        nombre_sala=s["nombre_sala"], id_tribunal=tribunal,
        defaults={"capacidad": s["capacidad"], "equipada_videoconf": s["equipada_videoconf"], "activa": True}
    )
    print(f"✅ Sala de audiencia: {obj.nombre_sala}")


# ══════════════════════════════════════════════════════════════
# 4. ROLES DE USUARIO
# ══════════════════════════════════════════════════════════════
print()
rol_admin, _         = Rol.objects.get_or_create(nombre="Administrador",    defaults={"descripcion": "Acceso total al sistema",        "sala_asignada": None,  "activo": True})
rol_adminsala1, _    = Rol.objects.get_or_create(nombre="AdminSala1",       defaults={"descripcion": "Administrador de Sala 1",        "sala_asignada": sala1, "activo": True})
rol_adminsala2, _    = Rol.objects.get_or_create(nombre="AdminSala2",       defaults={"descripcion": "Administrador de Sala 2",        "sala_asignada": sala2, "activo": True})
rol_secsala1, _      = Rol.objects.get_or_create(nombre="SecretarioSala1",  defaults={"descripcion": "Secretario de Sala 1",           "sala_asignada": sala1, "activo": True})
rol_secsala2, _      = Rol.objects.get_or_create(nombre="SecretarioSala2",  defaults={"descripcion": "Secretario de Sala 2",           "sala_asignada": sala2, "activo": True})
rol_vocalsala1, _    = Rol.objects.get_or_create(nombre="VocalSala1",       defaults={"descripcion": "Vocal de Sala 1",                "sala_asignada": sala1, "activo": True})
rol_vocalsala2, _    = Rol.objects.get_or_create(nombre="VocalSala2",       defaults={"descripcion": "Vocal de Sala 2",                "sala_asignada": sala2, "activo": True})
print("✅ 7 Roles de usuario")


# ══════════════════════════════════════════════════════════════
# 5. ESTADOS DE EXPEDIENTE
# ══════════════════════════════════════════════════════════════
estados_data = [
    {"nombre_estado": "Denuncia Presentada",                  "es_terminal": False, "nivel": 0},
    {"nombre_estado": "Denuncia Defectuosa",                  "es_terminal": False, "nivel": 1},
    {"nombre_estado": "Auto de Admisión",                     "es_terminal": False, "nivel": 2},
    {"nombre_estado": "Etapa Investigativa",                  "es_terminal": False, "nivel": 3},
    {"nombre_estado": "Término Probatorio",                   "es_terminal": False, "nivel": 4},
    {"nombre_estado": "Clausura Probatoria",                  "es_terminal": False, "nivel": 5},
    {"nombre_estado": "Para Resolución Final",                "es_terminal": False, "nivel": 6},
    {"nombre_estado": "Resuelto Primera Instancia",           "es_terminal": False, "nivel": 7},
    {"nombre_estado": "Remitido en Apelación",                "es_terminal": False, "nivel": 8},
    {"nombre_estado": "Fallo de Segunda Instancia Recibido",  "es_terminal": False, "nivel": 9},
    {"nombre_estado": "Ejecutoriado",                         "es_terminal": True,  "nivel": 10},
    {"nombre_estado": "Archivado",                            "es_terminal": True,  "nivel": 10},
    {"nombre_estado": "Rechazado",                            "es_terminal": True,  "nivel": 10},
    {"nombre_estado": "Desistido",                            "es_terminal": True,  "nivel": 10},
    {"nombre_estado": "Prescrito",                            "es_terminal": True,  "nivel": 10},
    {"nombre_estado": "Conciliado",                           "es_terminal": True,  "nivel": 10},
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
    nombre="Proceso Disciplinario Sumario", defaults={"codigo": "PDS"}
)
print(f"\n✅ Tipo de proceso: {tipo_proceso.nombre}")


# ══════════════════════════════════════════════════════════════
# 7. TIPOS DE AUDIENCIA
# ══════════════════════════════════════════════════════════════
tipos_audiencia_data = [
    {"nombre": "Declaración Informativa",        "duracion_estimada": 60},
    {"nombre": "Audiencia de Prueba Testifical", "duracion_estimada": 90},
    {"nombre": "Audiencia de Conciliación",      "duracion_estimada": 60},
    {"nombre": "Audiencia de Ratificación",      "duracion_estimada": 30},
    {"nombre": "Audiencia Cautelar",             "duracion_estimada": 45},
    {"nombre": "Audiencia de Sentencia",         "duracion_estimada": 60},
]
print()
for t in tipos_audiencia_data:
    obj, _ = TipoAudiencia.objects.get_or_create(
        nombre=t["nombre"], id_tipo_proceso=tipo_proceso,
        defaults={"duracion_estimada": t["duracion_estimada"], "descripcion": t["nombre"]}
    )
    print(f"✅ Tipo de audiencia: {obj.nombre}")


# ══════════════════════════════════════════════════════════════
# 8. TIPOS DE DOCUMENTO — lista unificada (sin duplicados)
# Cubre tanto los tipos del proceso (Art. 34, 44, 47, 58, 77, 82, 83, 90)
# como los códigos que usa _registrar_notificacion_envio() en schema.py
# ══════════════════════════════════════════════════════════════
tipos_doc_data = [
    # código,        nombre,                                                    firma,  público
    # ── Documentos que presentan las partes ──────────────────────────────────
    ("DEN",          "Denuncia Disciplinaria",                                  False,  False),
    ("PRU",          "Prueba Documental",                                       False,  False),
    ("MEM",          "Memorial / Escrito de parte",                             False,  False),
    ("RAF",          "Ratificación de Pruebas (Art. 60 II)",                    False,  False),
    ("RAP",          "Recurso de Apelación (Art. 82)",                          True,   False),
    ("RCP",          "Recurso de Compulsa (Art. 83)",                           True,   False),

    # ── Autos y resoluciones que emite el Tribunal ───────────────────────────
    ("AUT-SUB",      "Auto de Subsanación (Art. 56)",                           True,   False),
    ("AUT-REC",      "Auto de Rechazo de Denuncia (Art. 57)",                   True,   False),
    ("ADA",          "Auto de Admisión (Art. 58)",                              True,   True),
    ("CIP",          "Cédula de Citación para Declaración Informativa (Art. 58b)", True, False),
    ("ACT-CON",      "Acta de Conciliación (Art. 59)",                          True,   False),
    ("AAP",          "Auto de Apertura Término Probatorio (Art. 60)",           True,   False),
    ("AUT-MED",      "Resolución de Medidas Precautorias (Art. 61)",            True,   False),
    ("ACT",          "Acta de Audiencia (Art. 73)",                             True,   False),
    ("AUT-CIE",      "Auto de Cierre del Término Probatorio (Art. 74)",         True,   False),
    ("RSF",          "Resolución Final Sancionatoria (Art. 75)",                True,   True),
    ("RAF-ABS",      "Resolución Final Absolutoria (Art. 75)",                  True,   True),
    ("AUT-ACL",      "Auto de Aclaración/Complementación/Enmienda (Art. 77)",  True,   False),
    ("AUT-FAL",      "Resolución de Archivo por Fallecimiento (Art. 80)",       True,   False),
    ("AUT-PRS",      "Resolución de Prescripción (Art. 81)",                    True,   False),
    ("AUT-DES",      "Resolución de Archivo por Desistimiento (Art. 23)",       True,   False),
    ("AUT-RET",      "Auto de Retiro de Denuncia (Art. 22)",                    True,   False),
    ("TRA-APE",      "Traslado de Apelación a contraparte (Art. 82 III)",       True,   False),

    # ── Citaciones y notificaciones físicas ──────────────────────────────────
    ("CED",          "Cédula de Citación Personal al Denunciado (Art. 44)",     True,   False),
    ("NOT",          "Notificación en Tablero (Art. 47)",                       True,   False),
    ("NOT-RES",      "Notificación Personal de Resolución Definitiva (Art. 45/46)", True, False),
    ("NOT-TABLERO",  "Notificación en Tablero de Secretaría",                   False,  False),

    # ── Segunda instancia ─────────────────────────────────────────────────────
    ("RAD",          "Decreto de Radicatoria — Segunda Instancia (Art. 48 I)",  True,   False),
    ("RSI",          "Resolución de Segunda Instancia (Art. 86/87)",            True,   True),

    # ── Ejecución de fallo ────────────────────────────────────────────────────
    ("OFI-REC",      "Oficio de Remisión al Rectorado (Art. 16 + Art. 90 II)", True,   False),
    ("RES-REC",      "Resolución Rectoral de Ejecución (Art. 90 II)",           False,  True),
    ("GAC",          "Registro en Gaceta Universitaria (Art. 7)",               False,  True),

    # ── Certificados ──────────────────────────────────────────────────────────
    ("CER",          "Certificado de Proceso No Hallado",                       True,   True),

    # ── Notificaciones electrónicas — registro interno del correo enviado ────
    # Usados por _registrar_notificacion_envio() en schema.py
    ("NOT-SUB",      "Notificación Electrónica de Subsanación",                 False,  False),
    ("CIT-ADM",      "Citación Electrónica de Admisión",                        False,  False),
    ("NOT-PROB",     "Notificación Electrónica Apertura Probatoria",            False,  False),
    ("RES-1RA",      "Notificación Electrónica Resolución 1ª Instancia",        False,  False),
    ("RES-2DA",      "Notificación Electrónica Resolución 2ª Instancia",        False,  False),
    ("EJE-FAL",      "Notificación Electrónica Ejecución de Fallo",             False,  False),

    # ── Autos interlocutorios / decretos genéricos ────────────────────────────
    ("AUT",          "Auto Interlocutorio",                                     True,   True),
    ("DEC",          "Decreto",                                                 True,   True),
    ("INF",          "Informe",                                                 False,  False),
]
print()
for codigo, nombre, requiere_firma, es_publico in tipos_doc_data:
    obj, created = TipoDoc.objects.get_or_create(
        codigo=codigo,
        defaults={
            "nombre":         nombre,
            "requiere_firma": requiere_firma,
            "es_publico":     es_publico,
            "descripcion":    nombre,
        }
    )
    if created:
        print(f"✅ TipoDoc: [{codigo}] {nombre}")
    else:
        # Actualizar nombre si ya existía con nombre genérico (ej: "NOT-SUB")
        if obj.nombre == codigo:
            obj.nombre = nombre
            obj.descripcion = nombre
            obj.save()
            print(f"🔄 TipoDoc actualizado: [{codigo}] {nombre}")


# ══════════════════════════════════════════════════════════════
# 9. TIPOS DE RESOLUCIÓN
# ══════════════════════════════════════════════════════════════
tipos_resolucion_data = [
    # Los códigos que usa _sincronizar_resolucion_expediente() en schema.py
    ("RDF",  "Resolución Definitiva Primera Instancia",    1),
    ("RDS",  "Resolución Segunda Instancia",               1),
    ("RCN",  "Acta de Conciliación",                       1),
    ("RPR",  "Resolución de Prescripción",                 1),
    ("RAR",  "Resolución de Archivo",                      1),
    ("RAF",  "Resolución de Archivo por Fallecimiento",    1),
    ("RDE",  "Resolución de Archivo por Desistimiento",    1),
    # Tipos generales
    ("RSF",  "Resolución Sancionatoria",                   1),
    ("AUT",  "Auto Interlocutorio",                        2),
    ("DEC",  "Decreto",                                    3),
    ("PRO",  "Providencia",                                4),
    ("RAD",  "Resolución Administrativa",                  1),
]
print()
for codigo, nombre, nivel in tipos_resolucion_data:
    obj, created = TipoResolucion.objects.get_or_create(
        codigo=codigo,
        defaults={"nombre": nombre, "nivel_jerarquico": nivel}
    )
    if created:
        print(f"✅ TipoResolucion: [{codigo}] {nombre}")


# ══════════════════════════════════════════════════════════════
# 10. TIPOS DE RECURSO
# ══════════════════════════════════════════════════════════════
tipos_recurso_data = [
    ("Apelación",            "Art. 82 — Impugna resoluciones de primera instancia. Plazo: 5 días hábiles."),
    ("Compulsa",             "Art. 83 — Procede por negativa indebida del recurso de apelación."),
    ("Aclaración/Enmienda",  "Art. 77 — Solicita aclaración, complementación o enmienda. Plazo: 2 días hábiles."),
    ("Nulidad",              "Solicita nulidad de actuaciones procesales."),
    ("Reposición",           "Solicita reposición de autos o decretos."),
]
print()
for nombre, descripcion in tipos_recurso_data:
    obj, created = TipoRecurso.objects.get_or_create(
        nombre=nombre, defaults={"descripcion": descripcion}
    )
    if created:
        print(f"✅ TipoRecurso: {nombre}")


# ══════════════════════════════════════════════════════════════
# 11. TIPOS DE ACTUACIÓN PROCESAL — lista unificada
# Cubre tanto los de la poblada original como los que usa
# _registrar_actuacion_automatica() en schema.py
# ══════════════════════════════════════════════════════════════
tipos_actuacion_data = [
    # código, nombre
    # ── Usados por _registrar_actuacion_automatica() en schema.py ────────────
    ("SUB",  "Subsanación requerida (Art. 56)"),
    ("ADA",  "Auto de Admisión (Art. 58)"),
    ("REC",  "Rechazo / Archivo (Art. 57)"),
    ("RDE",  "Retiro de denuncia (Art. 22)"),
    ("DIN",  "Declaración informativa recibida (Art. 58a)"),
    ("AAP",  "Auto de Apertura del Término Probatorio (Art. 60)"),
    ("CTP",  "Clausura del Término Probatorio (Art. 74)"),
    ("DRF",  "Dictado de Resolución Final (Art. 75)"),
    ("IAP",  "Interposición de Recurso de Apelación (Art. 82)"),
    ("EFA",  "Ejecución de fallo (Art. 90)"),
    ("CNA",  "Conciliación entre partes (Art. 59)"),
    ("PRS",  "Prescripción declarada (Art. 8/81)"),
    ("ARC",  "Archivo del proceso"),
    # ── Usados por mutations específicas ─────────────────────────────────────
    ("RAP",  "Ratificación de pruebas (Art. 60 II)"),
    ("TAP",  "Traslado del recurso de apelación a contraparte (Art. 82 III)"),
    # ── Actuaciones adicionales del flujo ────────────────────────────────────
    ("PRE",  "Presentación de Denuncia"),
    ("DDO",  "Designación de Defensor de Oficio (Art. 58b)"),
    ("CIP",  "Citación Personal al Denunciado (Art. 44)"),
    ("OFP",  "Ofrecimiento de Prueba"),
    ("PRP",  "Producción de Prueba"),
    ("PRT",  "Prueba Testifical (Art. 67)"),
    ("MED",  "Medidas Precautorias adoptadas (Art. 61)"),
    ("CMP",  "Compulsa disciplinaria (Art. 83)"),
    ("ACL",  "Aclaración/Complementación/Enmienda (Art. 77)"),
    ("RAD",  "Radicatoria en Segunda Instancia (Art. 48)"),
    ("REM",  "Remisión al Tribunal Superior (Art. 86)"),
    ("OFI",  "Oficio de remisión al Rectorado (Art. 16 + Art. 90 II)"),
    ("NRF",  "Notificación de Resolución Final (Art. 45/46)"),
    ("TRA",  "Traslado a la contraparte"),
    ("CON",  "Contestación al recurso"),
    ("RES",  "Resolución Administrativa del Rector (Art. 90 II)"),
    ("INF",  "Solicitud de Informe (Art. 21)"),
]
print()
for codigo, nombre in tipos_actuacion_data:
    obj, created = TipoActuacion.objects.get_or_create(
        codigo=codigo, defaults={"nombre": nombre}
    )
    if created:
        print(f"✅ TipoActuacion: [{codigo}] {nombre}")
    else:
        # Actualizar nombre si era genérico
        if obj.nombre != nombre and len(obj.nombre) < 10:
            obj.nombre = nombre
            obj.save()
            print(f"🔄 TipoActuacion actualizado: [{codigo}] {nombre}")


# ══════════════════════════════════════════════════════════════
# 12. ROLES PROCESALES
# ══════════════════════════════════════════════════════════════
roles_procesales_data = [
    "Denunciante",
    "Denunciado",
    "Abogado Defensor",
    "Abogado Defensor de Oficio",
    "Testigo",
    "Perito",
    "Autoridad Universitaria",
    "Docente",
    "Estudiante",
    "Administrativo",
    "Tercero Interesado",
    "Representante Legal",
]
print()
for rp in roles_procesales_data:
    obj, created = RolProcesal.objects.get_or_create(nombre_rol=rp)
    if created:
        print(f"✅ RolProcesal: {obj.nombre_rol}")


# ══════════════════════════════════════════════════════════════
# 13. PERMISOS
# ══════════════════════════════════════════════════════════════
permisos_data = [
    ("USUARIOS_VER",           "Ver usuarios",              "Seguridad"),
    ("ROLES_VER",              "Ver roles",                 "Seguridad"),
    ("PERMISOS_VER",           "Ver permisos",              "Seguridad"),
    ("TRIBUNALES_VER",         "Ver tribunal",              "Tribunal"),
    ("SALAS_TRIBUNAL_VER",     "Ver salas de tribunal",     "Tribunal"),
    ("SALAS_AUDIENCIA_VER",    "Ver salas de audiencia",    "Tribunal"),
    ("VOCALES_VER",            "Ver vocales",               "Tribunal"),
    ("CONFORMACIONES_VER",     "Ver conformaciones",        "Tribunal"),
    ("EXPEDIENTES_VER",        "Ver expedientes",           "Expedientes"),
    ("HISTORIAL_ESTADOS_VER",  "Ver historial de estados",  "Expedientes"),
    ("ACTUACIONES_VER",        "Ver actuaciones",           "Expedientes"),
    ("ESTADOS_EXPEDIENTE_VER", "Ver estados de expediente", "Expedientes"),
    ("AUDIENCIAS_VER",         "Ver audiencias",            "Audiencias"),
    ("ASISTENCIAS_VER",        "Ver asistencias",           "Audiencias"),
    ("ACTAS_VER",              "Ver actas",                 "Audiencias"),
    ("RESOLUCIONES_VER",       "Ver resoluciones",          "Resoluciones"),
    ("RECURSOS_VER",           "Ver recursos",              "Resoluciones"),
    ("TIPOS_RESOLUCION_VER",   "Ver tipos de resolución",   "Resoluciones"),
    ("TIPOS_RECURSO_VER",      "Ver tipos de recurso",      "Resoluciones"),
    ("DOCUMENTOS_VER",         "Ver documentos",            "Documentos"),
    ("TIPOS_DOCUMENTO_VER",    "Ver tipos de documento",    "Documentos"),
    ("NOTIFICACIONES_VER",     "Ver notificaciones",        "Documentos"),
    ("SOLICITUDES_VER",        "Ver solicitudes",           "Documentos"),
    ("PERSONAS_VER",           "Ver personas",              "Personas"),
    ("CONTACTOS_VER",          "Ver contactos",             "Personas"),
    ("ROLES_PROCESALES_VER",   "Ver roles procesales",      "Personas"),
    ("PARTES_PROCESALES_VER",  "Ver partes procesales",     "Personas"),
    ("TIPOS_PROCESO_VER",      "Ver tipos de proceso",      "Catalogos"),
    ("TIPOS_AUDIENCIA_VER",    "Ver tipos de audiencia",    "Catalogos"),
    ("TIPOS_ACTUACION_VER",    "Ver tipos de actuación",    "Catalogos"),
    ("REPORTES_VER",           "Ver reportes",              "Reportes"),
    ("DENUNCIAS_VER",          "Ver denuncias",             "Denuncias"),
    ("DENUNCIAS_GESTIONAR",    "Gestionar denuncias",       "Denuncias"),
]
print()
permisos_map = {}
for codigo, nombre, modulo in permisos_data:
    obj, created = Permiso.objects.get_or_create(
        codigo=codigo, defaults={"nombre": nombre, "modulo": modulo}
    )
    permisos_map[codigo] = obj
    if created:
        print(f"✅ Permiso: {codigo}")


# ══════════════════════════════════════════════════════════════
# 14. ASIGNAR PERMISOS A ROLES
# ══════════════════════════════════════════════════════════════
permisos_adminsala = [
    "TRIBUNALES_VER","SALAS_TRIBUNAL_VER","SALAS_AUDIENCIA_VER","VOCALES_VER","CONFORMACIONES_VER",
    "EXPEDIENTES_VER","HISTORIAL_ESTADOS_VER","ACTUACIONES_VER","ESTADOS_EXPEDIENTE_VER",
    "AUDIENCIAS_VER","ASISTENCIAS_VER","ACTAS_VER",
    "RESOLUCIONES_VER","RECURSOS_VER","TIPOS_RESOLUCION_VER","TIPOS_RECURSO_VER",
    "DOCUMENTOS_VER","TIPOS_DOCUMENTO_VER","NOTIFICACIONES_VER","SOLICITUDES_VER",
    "PERSONAS_VER","CONTACTOS_VER","ROLES_PROCESALES_VER","PARTES_PROCESALES_VER",
    "TIPOS_PROCESO_VER","TIPOS_AUDIENCIA_VER","TIPOS_ACTUACION_VER",
    "REPORTES_VER","DENUNCIAS_VER","DENUNCIAS_GESTIONAR",
]
permisos_secretario = [
    "EXPEDIENTES_VER","HISTORIAL_ESTADOS_VER","ACTUACIONES_VER","ESTADOS_EXPEDIENTE_VER",
    "AUDIENCIAS_VER","ASISTENCIAS_VER","ACTAS_VER",
    "DOCUMENTOS_VER","NOTIFICACIONES_VER","SOLICITUDES_VER","TIPOS_DOCUMENTO_VER",
    "PERSONAS_VER","CONTACTOS_VER","ROLES_PROCESALES_VER","PARTES_PROCESALES_VER",
    "TIPOS_PROCESO_VER","TIPOS_AUDIENCIA_VER","TIPOS_ACTUACION_VER",
    "SALAS_AUDIENCIA_VER","DENUNCIAS_VER","DENUNCIAS_GESTIONAR",
]
permisos_vocal = [
    "EXPEDIENTES_VER","HISTORIAL_ESTADOS_VER","ESTADOS_EXPEDIENTE_VER",
    "AUDIENCIAS_VER","ACTAS_VER",
    "RESOLUCIONES_VER","RECURSOS_VER","TIPOS_RESOLUCION_VER","TIPOS_RECURSO_VER",
    "DOCUMENTOS_VER",
    "PERSONAS_VER","PARTES_PROCESALES_VER","ROLES_PROCESALES_VER",
    "DENUNCIAS_VER",
]

asignaciones = [
    (rol_admin,      list(permisos_map.keys()),  "Administrador"),
    (rol_adminsala1, permisos_adminsala,          "AdminSala1"),
    (rol_adminsala2, permisos_adminsala,          "AdminSala2"),
    (rol_secsala1,   permisos_secretario,         "SecretarioSala1"),
    (rol_secsala2,   permisos_secretario,         "SecretarioSala2"),
    (rol_vocalsala1, permisos_vocal,              "VocalSala1"),
    (rol_vocalsala2, permisos_vocal,              "VocalSala2"),
]
print()
for rol_obj, lista_codigos, nombre_rol in asignaciones:
    RolPermiso.objects.filter(rol=rol_obj).delete()
    count = 0
    for codigo in lista_codigos:
        if codigo in permisos_map:
            RolPermiso.objects.get_or_create(rol=rol_obj, permiso=permisos_map[codigo])
            count += 1
    print(f"✅ {nombre_rol}: {count} permisos asignados")


# ══════════════════════════════════════════════════════════════
# 15. USUARIOS
# ══════════════════════════════════════════════════════════════
usuarios_data = [
    ("admin",           "Administrador", "Sistema",    "",  "00000000", "admin@tribunal.bo",           rol_admin,      "Administrador del Sistema"),
    ("adminsala1",      "Admin",         "Sala1",      "",  "11111111", "adminsala1@tribunal.bo",      rol_adminsala1, "Administrador Sala 1"),
    ("adminsala2",      "Admin",         "Sala2",      "",  "22222222", "adminsala2@tribunal.bo",      rol_adminsala2, "Administrador Sala 2"),
    ("secretariosala1", "Secretario",    "Sala1",      "",  "33333333", "secretariosala1@tribunal.bo", rol_secsala1,   "Secretario Sala 1"),
    ("secretariosala2", "Secretario",    "Sala2",      "",  "44444444", "secretariosala2@tribunal.bo", rol_secsala2,   "Secretario Sala 2"),
    ("vocalsala1",      "Vocal",         "Sala1",      "",  "55555555", "vocalsala1@tribunal.bo",      rol_vocalsala1, "Vocal Sala 1"),
    ("vocalsala2",      "Vocal",         "Sala2",      "",  "66666666", "vocalsala2@tribunal.bo",      rol_vocalsala2, "Vocal Sala 2"),
]
print()
for username, nombres, paterno, materno, ci, email, rol, cargo in usuarios_data:
    if not Usuario.objects.filter(username=username).exists():
        Usuario.objects.create(
            nombres=nombres, paterno=paterno, materno=materno,
            documento_identidad=ci, email=email, username=username,
            password=make_password("Admin123!"),
            rol=rol, cargo_oficial=cargo, activo=True,
        )
        print(f"✅ Usuario creado: {username} / Admin123!")
    else:
        print(f"⚠️  Ya existe: {username}")


# ══════════════════════════════════════════════════════════════
# 16. PERSONAS DE PRUEBA
# ══════════════════════════════════════════════════════════════
print()
william, _ = Persona.objects.get_or_create(
    numero_documento="70000001",
    defaults={"nombre": "William", "primer_apellido": "Torrico",
              "segundo_apellido": "Jimenez", "registro_universitario": "RU001"}
)
eduardo, _ = Persona.objects.get_or_create(
    numero_documento="70000002",
    defaults={"nombre": "Eduardo", "primer_apellido": "Garcia",
              "segundo_apellido": "Hernandez", "registro_universitario": "RU002"}
)
camila, _ = Persona.objects.get_or_create(
    numero_documento="70000003",
    defaults={"nombre": "Camila", "primer_apellido": "Justiniano",
              "segundo_apellido": "Apaza", "registro_universitario": "RU003"}
)
print("✅ Personas: William Torrico, Eduardo Garcia, Camila Justiniano")


# ══════════════════════════════════════════════════════════════
# 17. CONTACTOS
# ══════════════════════════════════════════════════════════════
ContactoPersona.objects.get_or_create(
    id_persona=william, tipo_contacto="EMAIL", valor="danielgonzalesgutierrez12@gmail.com",
    defaults={"es_principal": True, "validado": True}
)
ContactoPersona.objects.get_or_create(
    id_persona=eduardo, tipo_contacto="EMAIL", valor="brunogonzalesgutierrez@gmail.com",
    defaults={"es_principal": True, "validado": True}
)
ContactoPersona.objects.get_or_create(
    id_persona=camila, tipo_contacto="EMAIL", valor="kenny404xd@gmail.com",
    defaults={"es_principal": True, "validado": True}
)
print("✅ Contactos creados")


# ══════════════════════════════════════════════════════════════
# 18. VOCAL
# ══════════════════════════════════════════════════════════════
usuario_admin = Usuario.objects.filter(username="admin").first()
VocalTribunal.objects.get_or_create(
    id_persona=camila,
    defaults={
        "id_sala": sala1,
        "cargo": "Vocal Titular",
        "fecha_posesion": date(2026, 1, 1),
        "activo": True,
        "usuario": usuario_admin,
    }
)
print("✅ Vocal: Camila Justiniano Apaza — Sala 1")


# ══════════════════════════════════════════════════════════════
# RESUMEN FINAL
# ══════════════════════════════════════════════════════════════
print()
print("=" * 60)
print("  ✅ Poblada completa finalizada")
print("=" * 60)
print(f"  - 1 Tribunal · 2 Salas · 3 Salas de audiencia")
print(f"  - 7 Roles de usuario")
print(f"  - {len(estados_data)} Estados de expediente")
print(f"  - 1 Tipo de proceso (PDS)")
print(f"  - {len(tipos_audiencia_data)} Tipos de audiencia")
print(f"  - {len(tipos_doc_data)} Tipos de documento (sin duplicados)")
print(f"  - {len(tipos_resolucion_data)} Tipos de resolución")
print(f"  - {len(tipos_recurso_data)} Tipos de recurso")
print(f"  - {len(tipos_actuacion_data)} Tipos de actuación procesal")
print(f"  - {len(roles_procesales_data)} Roles procesales")
print(f"  - {len(permisos_data)} Permisos")
print(f"  - {len(usuarios_data)} Usuarios de prueba")
print()
print("  Credenciales (todos: Admin123!):")
print("  admin / adminsala1 / adminsala2")
print("  secretariosala1 / secretariosala2")
print("  vocalsala1 / vocalsala2")
print()
print("  ⚠️  Cerrá sesión y volvé a entrar para ver los cambios.")
print()