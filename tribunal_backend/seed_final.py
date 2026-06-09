"""
seed_graphql.py — Llena la base de datos del sistema de tribunal via GraphQL.
Uso: python seed_graphql.py
Requiere: pip install requests
"""

import requests
import json

URL = "http://localhost:8000/graphql/"

def gql(query, variables=None):
    resp = requests.post(URL, json={"query": query, "variables": variables or {}})
    data = resp.json()
    if "errors" in data:
        print(f"  ⚠️  Error GraphQL: {data['errors'][0]['message']}")
        return None
    return data.get("data")

def to_int(val):
    try:
        return int(val)
    except (TypeError, ValueError):
        return val

def ok(label, val):
    print(f"  ✅ {label}: {val}")

# ─────────────────────────────────────────────────────────────
# 1. ROLES DE SISTEMA (sin Consultor)
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando roles del sistema...")

roles_data = [
    ("Administrador", "Acceso total al sistema"),
    ("Vocal", "Vocal de tribunal con acceso a expedientes asignados"),
    ("Secretario", "Secretario judicial con gestión de documentos y audiencias"),
    ("Auxiliar", "Auxiliar administrativo con acceso limitado"),
]

roles_ids = {}
for nombre, desc in roles_data:
    r = gql("""
    mutation($nombre: String!, $descripcion: String) {
      crearRol(nombre: $nombre, descripcion: $descripcion) {
        rol { idRol nombre }
      }
    }""", {"nombre": nombre, "descripcion": desc})
    if r:
        id_ = to_int(r["crearRol"]["rol"]["idRol"])
        roles_ids[nombre] = id_
        ok("Rol", nombre)
    else:
        r2 = gql("query { allRoles { idRol nombre } }")
        if r2:
            for rol in r2["allRoles"]:
                if rol["nombre"] == nombre:
                    roles_ids[nombre] = to_int(rol["idRol"])
                    ok("Rol (existente)", nombre)
                    break

# ─────────────────────────────────────────────────────────────
# 2. PERMISOS (todos los 31 - lista completa)
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando permisos...")

permisos_data = [
    # ============================================================
    # SEGURIDAD (3)
    # ============================================================
    ("USUARIOS_VER", "Ver usuarios", "Seguridad"),
    ("ROLES_VER", "Ver roles", "Seguridad"),
    ("PERMISOS_VER", "Ver permisos", "Seguridad"),
    
    # ============================================================
    # TRIBUNAL (5)
    # ============================================================
    ("TRIBUNALES_VER", "Ver tribunales", "Tribunal"),
    ("SALAS_TRIBUNAL_VER", "Ver salas de tribunal", "Tribunal"),
    ("SALAS_AUDIENCIA_VER", "Ver salas de audiencia", "Tribunal"),
    ("VOCALES_VER", "Ver vocales", "Tribunal"),
    ("CONFORMACIONES_VER", "Ver conformaciones", "Tribunal"),
    
    # ============================================================
    # EXPEDIENTES (3)
    # ============================================================
    ("EXPEDIENTES_VER", "Ver expedientes", "Expedientes"),
    ("HISTORIAL_ESTADOS_VER", "Ver historial de estados", "Expedientes"),
    ("ACTUACIONES_VER", "Ver actuaciones", "Expedientes"),
    
    # ============================================================
    # AUDIENCIAS (3)
    # ============================================================
    ("AUDIENCIAS_VER", "Ver audiencias", "Audiencias"),
    ("ASISTENCIAS_VER", "Ver asistencias", "Audiencias"),
    ("ACTAS_VER", "Ver actas", "Audiencias"),
    
    # ============================================================
    # RESOLUCIONES (2)
    # ============================================================
    ("RESOLUCIONES_VER", "Ver resoluciones", "Resoluciones"),
    ("RECURSOS_VER", "Ver recursos", "Resoluciones"),
    
    # ============================================================
    # DOCUMENTOS (3)
    # ============================================================
    ("DOCUMENTOS_VER", "Ver documentos", "Documentos"),
    ("NOTIFICACIONES_VER", "Ver notificaciones", "Documentos"),
    ("SOLICITUDES_VER", "Ver solicitudes", "Documentos"),
    
    # ============================================================
    # PERSONAS (4)
    # ============================================================
    ("PERSONAS_VER", "Ver personas", "Personas"),
    ("CONTACTOS_VER", "Ver contactos", "Personas"),
    ("ROLES_PROCESALES_VER", "Ver roles procesales", "Personas"),
    ("PARTES_PROCESALES_VER", "Ver partes procesales", "Personas"),
    
    # ============================================================
    # CATÁLOGOS - Tipos (7)
    # ============================================================
    ("TIPOS_PROCESO_VER", "Ver tipos de proceso", "Catálogos"),
    ("TIPOS_AUDIENCIA_VER", "Ver tipos de audiencia", "Catálogos"),
    ("TIPOS_RESOLUCION_VER", "Ver tipos de resolución", "Catálogos"),
    ("TIPOS_RECURSO_VER", "Ver tipos de recurso", "Catálogos"),
    ("TIPOS_DOCUMENTO_VER", "Ver tipos de documento", "Catálogos"),
    ("TIPOS_ACTUACION_VER", "Ver tipos de actuación", "Catálogos"),
    ("ESTADOS_EXPEDIENTE_VER", "Ver estados de expediente", "Catálogos"),
    
    # ============================================================
    # REPORTES (1)
    # ============================================================
    ("REPORTES_VER", "Ver reportes", "Reportes"),
]

permisos_ids = {}
for codigo, nombre, modulo in permisos_data:
    r = gql("""
    mutation($nombre: String!, $codigo: String!, $modulo: String!) {
      crearPermiso(nombre: $nombre, codigo: $codigo, modulo: $modulo) {
        permiso { idPermiso nombre }
      }
    }""", {"nombre": nombre, "codigo": codigo, "modulo": modulo})
    if r:
        id_ = to_int(r["crearPermiso"]["permiso"]["idPermiso"])
        permisos_ids[codigo] = id_
        ok("Permiso", codigo)
    else:
        r2 = gql("query { allPermisos { idPermiso codigo } }")
        if r2:
            for perm in r2["allPermisos"]:
                if perm["codigo"] == codigo:
                    permisos_ids[codigo] = to_int(perm["idPermiso"])
                    ok("Permiso (existente)", codigo)
                    break

# Asignar permisos a roles
print("\n📌 Asignando permisos a roles...")

asignaciones = {
    "Administrador": list(permisos_ids.values()),
    "Vocal": [
        permisos_ids["EXPEDIENTES_VER"],
        permisos_ids["AUDIENCIAS_VER"],
        permisos_ids["RESOLUCIONES_VER"],
        permisos_ids["DOCUMENTOS_VER"],
        permisos_ids["ACTAS_VER"],
        permisos_ids["HISTORIAL_ESTADOS_VER"],
        permisos_ids["ACTUACIONES_VER"],
        permisos_ids["VOCALES_VER"],
        permisos_ids["CONFORMACIONES_VER"],
    ],
    "Secretario": [
        permisos_ids["EXPEDIENTES_VER"],
        permisos_ids["AUDIENCIAS_VER"],
        permisos_ids["RESOLUCIONES_VER"],
        permisos_ids["DOCUMENTOS_VER"],
        permisos_ids["PERSONAS_VER"],
        permisos_ids["CONTACTOS_VER"],
        permisos_ids["PARTES_PROCESALES_VER"],
        permisos_ids["ACTAS_VER"],
        permisos_ids["HISTORIAL_ESTADOS_VER"],
        permisos_ids["ACTUACIONES_VER"],
        permisos_ids["NOTIFICACIONES_VER"],
        permisos_ids["SOLICITUDES_VER"],
        permisos_ids["TIPOS_PROCESO_VER"],
        permisos_ids["TIPOS_AUDIENCIA_VER"],
        permisos_ids["TIPOS_RESOLUCION_VER"],
        permisos_ids["TIPOS_DOCUMENTO_VER"],
        permisos_ids["ESTADOS_EXPEDIENTE_VER"],
    ],
    "Auxiliar": [
        permisos_ids["EXPEDIENTES_VER"],
        permisos_ids["AUDIENCIAS_VER"],
        permisos_ids["DOCUMENTOS_VER"],
        permisos_ids["PERSONAS_VER"],
        permisos_ids["NOTIFICACIONES_VER"],
    ],
}

for rol_nombre, perm_ids in asignaciones.items():
    id_rol = roles_ids.get(rol_nombre)
    if not id_rol:
        continue
    for id_permiso in perm_ids:
        if id_permiso:
            gql("""
            mutation($idRol: Int!, $idPermiso: Int!) {
              asignarPermisoARol(idRol: $idRol, idPermiso: $idPermiso) {
                rolPermiso { idRolPermiso }
              }
            }""", {"idRol": id_rol, "idPermiso": id_permiso})
    ok("Permisos asignados a", rol_nombre)

# ─────────────────────────────────────────────────────────────
# 3. USUARIOS (solo 1 Administrador para iniciar sesión)
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando usuarios...")

usuarios_data = [
    ("Admin", "Sistema", "", "9999999", "admin@tribunal.bo", "admin", "admin123", "Administrador", "Administrador del Sistema"),
]

usuarios_ids = {}
for nombres, paterno, materno, ci, email, username, pwd, rol, cargo in usuarios_data:
    r = gql("""
    mutation($input: CrearUsuarioInput!) {
      crearUsuario(input: $input) {
        usuario { idUsuario nombres paterno }
      }
    }""", {"input": {
        "nombres": nombres, "paterno": paterno, "materno": materno,
        "documentoIdentidad": ci, "email": email, "username": username,
        "password": pwd, "idRol": roles_ids[rol], "cargoOficial": cargo
    }})
    if r:
        id_ = to_int(r["crearUsuario"]["usuario"]["idUsuario"])
        usuarios_ids[username] = id_
        ok("Usuario", f"{nombres} {paterno} ({rol})")

# ─────────────────────────────────────────────────────────────
# 4. TRIBUNALES (1 tribunal por defecto)
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando tribunales...")

tribunales_data = [
    ("Tribunal Departamental de Justicia de Santa Cruz", "Departamental", "Ley 025 del Órgano Judicial"),
]

tribunales_ids = {}
for nombre, instancia, norma in tribunales_data:
    r = gql("""
    mutation($nombreTribunal: String!, $instancia: String!, $normaCreacion: String!) {
      crearTribunal(nombreTribunal: $nombreTribunal, instancia: $instancia, normaCreacion: $normaCreacion) {
        tribunal { idTribunal nombreTribunal }
      }
    }""", {"nombreTribunal": nombre, "instancia": instancia, "normaCreacion": norma})
    if r:
        id_ = to_int(r["crearTribunal"]["tribunal"]["idTribunal"])
        tribunales_ids[nombre] = id_
        ok("Tribunal", nombre[:50])

# ─────────────────────────────────────────────────────────────
# 5. SALAS TRIBUNAL (2 salas)
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando salas de tribunal...")

id_tribunal = list(tribunales_ids.values())[0]

salas_tribunal_data = [
    (id_tribunal, "Sala Civil y Comercial"),
    (id_tribunal, "Sala Penal"),
]

salas_ids = []
for id_trib, nombre in salas_tribunal_data:
    r = gql("""
    mutation($idTribunal: Int!, $nombreSala: String!, $activa: Boolean) {
      crearSalaTribunal(idTribunal: $idTribunal, nombreSala: $nombreSala, activa: $activa) {
        sala { idSala nombreSala }
      }
    }""", {"idTribunal": id_trib, "nombreSala": nombre, "activa": True})
    if r:
        id_ = to_int(r["crearSalaTribunal"]["sala"]["idSala"])
        salas_ids.append(id_)
        ok("Sala Tribunal", nombre)

# ─────────────────────────────────────────────────────────────
# 6. SALAS DE AUDIENCIA (2 salas)
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando salas de audiencia...")

salas_aud_data = [
    (id_tribunal, "Sala de Audiencias N°1", 30, True, None),
    (id_tribunal, "Sala de Audiencias N°2", 20, True, None),
]

salas_aud_ids = []
for id_trib, nombre, cap, video, link in salas_aud_data:
    r = gql("""
    mutation($idTribunal: Int!, $nombreSala: String!, $capacidad: Int!, $equipadaVideoconf: Boolean, $enlaceVirtual: String, $activa: Boolean) {
      crearSalaAudiencia(idTribunal: $idTribunal, nombreSala: $nombreSala, capacidad: $capacidad, equipadaVideoconf: $equipadaVideoconf, enlaceVirtual: $enlaceVirtual, activa: $activa) {
        sala { idSalaAud nombreSala }
      }
    }""", {"idTribunal": id_trib, "nombreSala": nombre, "capacidad": cap,
           "equipadaVideoconf": video, "enlaceVirtual": link, "activa": True})
    if r:
        id_ = to_int(r["crearSalaAudiencia"]["sala"]["idSalaAud"])
        salas_aud_ids.append(id_)
        ok("Sala Audiencia", nombre)

# ─────────────────────────────────────────────────────────────
# 7. TIPOS DE PROCESO (3 básicos)
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando tipos de proceso...")

tipos_proceso_data = [
    ("Proceso Civil Ordinario", "CIV-ORD"),
    ("Proceso Penal Ordinario", "PEN-ORD"),
    ("Proceso Familiar", "FAM"),
]

tipos_proceso_ids = []
for nombre, codigo in tipos_proceso_data:
    r = gql("""
    mutation($nombre: String!, $codigo: String!) {
      crearTipoProceso(nombre: $nombre, codigo: $codigo) {
        tipoProceso { idTipoProceso nombre }
      }
    }""", {"nombre": nombre, "codigo": codigo})
    if r:
        id_ = to_int(r["crearTipoProceso"]["tipoProceso"]["idTipoProceso"])
        tipos_proceso_ids.append(id_)
        ok("Tipo Proceso", nombre)

# ─────────────────────────────────────────────────────────────
# 8. ESTADOS DE EXPEDIENTE (5 esenciales)
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando estados de expediente...")

estados_data = [
    ("Ingresado", False),
    ("En Trámite", False),
    ("Para Resolución", False),
    ("Concluido", True),
    ("Archivado", True),
]

estados_ids = []
estados_nombres = {}
for nombre, terminal in estados_data:
    r = gql("""
    mutation($nombreEstado: String!, $esTerminal: Boolean) {
      crearEstadoExpediente(nombreEstado: $nombreEstado, esTerminal: $esTerminal) {
        estado { idEstado nombreEstado }
      }
    }""", {"nombreEstado": nombre, "esTerminal": terminal})
    if r:
        id_ = to_int(r["crearEstadoExpediente"]["estado"]["idEstado"])
        estados_ids.append(id_)
        estados_nombres[nombre] = id_
        ok("Estado", nombre)

# ─────────────────────────────────────────────────────────────
# 9. TIPOS DE AUDIENCIA (3 básicos)
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando tipos de audiencia...")

tipos_audiencia_data = [
    ("Audiencia Preliminar", 60, tipos_proceso_ids[0]),
    ("Audiencia de Juicio Oral", 180, tipos_proceso_ids[0]),
    ("Audiencia de Conciliación", 60, tipos_proceso_ids[2]),
]

tipos_audiencia_ids = []
for nombre, dur, id_tipo_proc in tipos_audiencia_data:
    r = gql("""
    mutation($nombre: String!, $duracionEstimada: Int!, $idTipoProceso: Int!) {
      crearTipoAudiencia(nombre: $nombre, duracionEstimada: $duracionEstimada, idTipoProceso: $idTipoProceso) {
        tipoAudiencia { idTipoAudiencia nombre }
      }
    }""", {"nombre": nombre, "duracionEstimada": dur, "idTipoProceso": id_tipo_proc})
    if r:
        id_ = to_int(r["crearTipoAudiencia"]["tipoAudiencia"]["idTipoAudiencia"])
        tipos_audiencia_ids.append(id_)
        ok("Tipo Audiencia", nombre)

# ─────────────────────────────────────────────────────────────
# 10. TIPOS DE DOCUMENTO (5 básicos)
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando tipos de documento...")

tipos_doc_data = [
    ("DEM", "Demanda", False, True),
    ("CONT", "Contestación", False, True),
    ("MEM", "Memorial", False, True),
    ("SENT", "Sentencia", True, True),
    ("AUTO", "Auto Interlocutorio", True, True),
]

tipos_doc_ids = {}
for codigo, nombre, firma, publico in tipos_doc_data:
    r = gql("""
    mutation($codigo: String!, $nombre: String!, $requiereFirma: Boolean, $esPublico: Boolean) {
      crearTipoDoc(codigo: $codigo, nombre: $nombre, requiereFirma: $requiereFirma, esPublico: $esPublico) {
        tipoDoc { idTipoDoc codigo nombre }
      }
    }""", {"codigo": codigo, "nombre": nombre, "requiereFirma": firma, "esPublico": publico})
    if r:
        id_ = to_int(r["crearTipoDoc"]["tipoDoc"]["idTipoDoc"])
        tipos_doc_ids[codigo] = id_
        ok("Tipo Doc", nombre)

# ─────────────────────────────────────────────────────────────
# 11. TIPOS DE RESOLUCIÓN (3 básicos)
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando tipos de resolución...")

tipos_res_data = [
    ("SENT-DEF", "Sentencia Definitiva", 1),
    ("AUTO-INT", "Auto Interlocutorio", 2),
    ("DECR", "Decreto", 4),
]

tipos_res_ids = []
for codigo, nombre, nivel in tipos_res_data:
    r = gql("""
    mutation($codigo: String!, $nombre: String!, $nivelJerarquico: Int) {
      crearTipoResolucion(codigo: $codigo, nombre: $nombre, nivelJerarquico: $nivelJerarquico) {
        tipoResolucion { idTipoRes codigo nombre }
      }
    }""", {"codigo": codigo, "nombre": nombre, "nivelJerarquico": nivel})
    if r:
        id_ = to_int(r["crearTipoResolucion"]["tipoResolucion"]["idTipoRes"])
        tipos_res_ids.append(id_)
        ok("Tipo Resolución", nombre)

# ─────────────────────────────────────────────────────────────
# 12. ROLES PROCESALES (5 básicos)
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando roles procesales...")

roles_procesales = ["Demandante", "Demandado", "Abogado Demandante", "Abogado Demandado", "Tercero Interesado"]
roles_procesales_ids = {}
for nombre in roles_procesales:
    r = gql("""
    mutation($nombreRol: String!) {
      crearRolProcesal(nombreRol: $nombreRol) {
        rolProcesal { idRol nombreRol }
      }
    }""", {"nombreRol": nombre})
    if r:
        id_ = to_int(r["crearRolProcesal"]["rolProcesal"]["idRol"])
        roles_procesales_ids[nombre] = id_
        ok("Rol Procesal", nombre)

# ─────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("🎉 SEED MÍNIMO COMPLETADO EXITOSAMENTE")
print("="*60)
print(f"  Roles:            {len(roles_ids)}")
print(f"  Permisos:         {len(permisos_ids)}")
print(f"  Usuarios:         {len(usuarios_ids)}")
print(f"  Tribunales:       {len(tribunales_ids)}")
print(f"  Salas Tribunal:   {len(salas_ids)}")
print(f"  Salas Audiencia:  {len(salas_aud_ids)}")
print(f"  Tipos Proceso:    {len(tipos_proceso_ids)}")
print(f"  Estados:          {len(estados_ids)}")
print(f"  Tipos Audiencia:  {len(tipos_audiencia_ids)}")
print(f"  Tipos Documento:  {len(tipos_doc_ids)}")
print(f"  Tipos Resolución: {len(tipos_res_ids)}")
print(f"  Roles Procesales: {len(roles_procesales_ids)}")
print("="*60)
print("\n✅ El sistema está listo para usar. Ahora puedes crear:")
print("   - Personas")
print("   - Expedientes")
print("   - Audiencias")
print("   - Resoluciones")
print("   - Todo lo demás desde la interfaz")
print("\n🔐 Credenciales de acceso:")
print("   Usuario: admin")
print("   Contraseña: admin123")