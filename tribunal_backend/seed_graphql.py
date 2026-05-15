"""
seed_graphql.py — Llena la base de datos del sistema de tribunal via GraphQL.
Uso: python seed_graphql.py
Requiere: pip install requests
"""

import requests
import json
from datetime import datetime, timedelta
import random

URL = "http://localhost:8000/graphql/"

def gql(query, variables=None):
    resp = requests.post(URL, json={"query": query, "variables": variables or {}})
    data = resp.json()
    if "errors" in data:
        print(f"  ⚠️  Error GraphQL: {data['errors'][0]['message']}")
        return None
    return data.get("data")

def to_int(val):
    """Convierte IDs que vienen como string a int."""
    try:
        return int(val)
    except (TypeError, ValueError):
        return val

def ok(label, val):
    print(f"  ✅ {label}: {val}")

# ─────────────────────────────────────────────────────────────
# 1. ROLES DE SISTEMA
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando roles del sistema...")

roles_data = [
    ("Administrador",   "Acceso total al sistema"),
    ("Vocal",           "Vocal de tribunal con acceso a expedientes asignados"),
    ("Secretario",      "Secretario judicial con gestión de documentos y audiencias"),
    ("Auxiliar",        "Auxiliar administrativo con acceso limitado"),
    ("Consultor",       "Solo lectura de expedientes y resoluciones"),
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
        # Ya existe — buscarlo
        r2 = gql("query { allRoles { idRol nombre } }")
        if r2:
            for rol in r2["allRoles"]:
                if rol["nombre"] == nombre:
                    roles_ids[nombre] = to_int(rol["idRol"])
                    ok("Rol (existente)", nombre)
                    break

# ─────────────────────────────────────────────────────────────
# 2. PERMISOS
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando permisos...")

permisos_data = [
    ("Ver expedientes",        "EXP_VER",    "Expedientes",  "Ver listado y detalle de expedientes"),
    ("Crear expedientes",      "EXP_CREAR",  "Expedientes",  "Crear nuevos expedientes"),
    ("Editar expedientes",     "EXP_EDITAR", "Expedientes",  "Modificar datos de expedientes"),
    ("Eliminar expedientes",   "EXP_ELIM",   "Expedientes",  "Eliminar expedientes del sistema"),
    ("Ver audiencias",         "AUD_VER",    "Audiencias",   "Ver audiencias programadas"),
    ("Gestionar audiencias",   "AUD_GEST",   "Audiencias",   "Crear, editar y cancelar audiencias"),
    ("Ver resoluciones",       "RES_VER",    "Resoluciones", "Ver resoluciones emitidas"),
    ("Crear resoluciones",     "RES_CREAR",  "Resoluciones", "Emitir nuevas resoluciones"),
    ("Gestionar usuarios",     "USR_GEST",   "Usuarios",     "CRUD de usuarios del sistema"),
    ("Gestionar roles",        "ROL_GEST",   "Roles",        "Administrar roles y permisos"),
    ("Ver documentos",         "DOC_VER",    "Documentos",   "Ver documentos adjuntos"),
    ("Subir documentos",       "DOC_SUBIR",  "Documentos",   "Subir nuevos documentos"),
    ("Gestionar personas",     "PER_GEST",   "Personas",     "CRUD de personas y partes procesales"),
    ("Ver notificaciones",     "NOT_VER",    "Notificaciones","Ver notificaciones emitidas"),
    ("Emitir notificaciones",  "NOT_EMIT",   "Notificaciones","Crear y emitir notificaciones"),
]

permisos_ids = {}
for nombre, codigo, modulo, desc in permisos_data:
    r = gql("""
    mutation($nombre: String!, $codigo: String!, $modulo: String!, $descripcion: String) {
      crearPermiso(nombre: $nombre, codigo: $codigo, modulo: $modulo, descripcion: $descripcion) {
        permiso { idPermiso nombre }
      }
    }""", {"nombre": nombre, "codigo": codigo, "modulo": modulo, "descripcion": desc})
    if r:
        id_ = to_int(r["crearPermiso"]["permiso"]["idPermiso"])
        permisos_ids[codigo] = id_
        ok("Permiso", codigo)

# Asignar permisos a roles
print("\n📌 Asignando permisos a roles...")

asignaciones = {
    "Administrador": list(permisos_ids.values()),
    "Vocal":         [permisos_ids[c] for c in ["EXP_VER","AUD_VER","RES_VER","RES_CREAR","DOC_VER"]],
    "Secretario":    [permisos_ids[c] for c in ["EXP_VER","EXP_CREAR","EXP_EDITAR","AUD_VER","AUD_GEST","DOC_VER","DOC_SUBIR","NOT_VER","NOT_EMIT","PER_GEST"]],
    "Auxiliar":      [permisos_ids[c] for c in ["EXP_VER","AUD_VER","DOC_VER","NOT_VER"]],
    "Consultor":     [permisos_ids[c] for c in ["EXP_VER","AUD_VER","RES_VER","DOC_VER"]],
}

for rol_nombre, perm_ids in asignaciones.items():
    id_rol = roles_ids.get(rol_nombre)
    if not id_rol:
        continue
    for id_permiso in perm_ids:
        gql("""
        mutation($idRol: Int!, $idPermiso: Int!) {
          asignarPermisoARol(idRol: $idRol, idPermiso: $idPermiso) {
            rolPermiso { idRolPermiso }
          }
        }""", {"idRol": id_rol, "idPermiso": id_permiso})
    ok("Permisos asignados a", rol_nombre)

# ─────────────────────────────────────────────────────────────
# 3. USUARIOS
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando usuarios...")

usuarios_data = [
    ("Carlos",    "Mamani",    "Quispe",   "1234567",  "cmamani@tribunal.bo",    "cmamani",    "Admin2024!",  "Administrador",  "Director de Sistemas"),
    ("Ana María", "Condori",   "Flores",   "2345678",  "acondori@tribunal.bo",   "acondori",   "Vocal2024!",  "Vocal",          "Vocal Titular"),
    ("Roberto",   "Vargas",    "Salinas",  "3456789",  "rvargas@tribunal.bo",    "rvargas",    "Vocal2024!",  "Vocal",          "Vocal Suplente"),
    ("Patricia",  "Choque",    "Limachi",  "4567890",  "pchoque@tribunal.bo",    "pchoque",    "Secr2024!",   "Secretario",     "Secretaria General"),
    ("Gustavo",   "Torrez",    "Mendoza",  "5678901",  "gtorrez@tribunal.bo",    "gtorrez",    "Secr2024!",   "Secretario",     "Secretario de Sala"),
    ("Lucía",     "Quispe",    "Apaza",    "6789012",  "lquispe@tribunal.bo",    "lquispe",    "Aux2024!",    "Auxiliar",       "Auxiliar Administrativo"),
    ("Diego",     "Fernández", "Ramos",    "7890123",  "dfernandez@tribunal.bo", "dfernandez", "Aux2024!",    "Auxiliar",       "Auxiliar de Notificaciones"),
    ("Silvia",    "Morales",   "Cáceres",  "8901234",  "smorales@tribunal.bo",   "smorales",   "Cons2024!",   "Consultor",      "Consultor Externo"),
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
# 4. TRIBUNALES
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando tribunales...")

tribunales_data = [
    ("Tribunal Departamental de Justicia de Santa Cruz", "Departamental", "Ley 025 del Órgano Judicial Art. 60"),
    ("Tribunal Departamental de Justicia de La Paz",     "Departamental", "Ley 025 del Órgano Judicial Art. 60"),
    ("Tribunal Departamental de Justicia de Cochabamba", "Departamental", "Ley 025 del Órgano Judicial Art. 60"),
    ("Tribunal de Sentencia Penal N°1 Santa Cruz",       "Primera Instancia", "Ley 025 Art. 82"),
    ("Tribunal de Sentencia Penal N°2 Santa Cruz",       "Primera Instancia", "Ley 025 Art. 82"),
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
# 5. SALAS TRIBUNAL
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando salas de tribunal...")

salas_data = [
    (1, "Sala Civil Primera"),
    (1, "Sala Civil Segunda"),
    (1, "Sala Penal Primera"),
    (1, "Sala Penal Segunda"),
    (1, "Sala Familiar"),
    (4, "Sala Única"),
    (5, "Sala Única"),
]

salas_ids = []
id_trib_sc = list(tribunales_ids.values())[0]
id_trib_sent1 = list(tribunales_ids.values())[3]
id_trib_sent2 = list(tribunales_ids.values())[4]

salas_real = [
    (id_trib_sc,    "Sala Civil Primera"),
    (id_trib_sc,    "Sala Civil Segunda"),
    (id_trib_sc,    "Sala Penal Primera"),
    (id_trib_sc,    "Sala Penal Segunda"),
    (id_trib_sc,    "Sala Familiar y Niñez"),
    (id_trib_sent1, "Sala Única Penal"),
    (id_trib_sent2, "Sala Única Penal"),
]

for id_trib, nombre in salas_real:
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
# 6. SALAS DE AUDIENCIA
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando salas de audiencia...")

salas_aud_data = [
    (id_trib_sc, "Sala de Audiencias A",  30, True,  "https://meet.tribunal.bo/sala-a"),
    (id_trib_sc, "Sala de Audiencias B",  20, True,  "https://meet.tribunal.bo/sala-b"),
    (id_trib_sc, "Sala de Audiencias C",  15, False, None),
    (id_trib_sc, "Sala de Juicio Oral 1", 50, True,  "https://meet.tribunal.bo/juicio-1"),
    (id_trib_sc, "Sala de Juicio Oral 2", 50, False, None),
    (id_trib_sent1, "Sala Principal",     40, True,  "https://meet.tribunal.bo/sent1"),
    (id_trib_sent2, "Sala Principal",     40, True,  "https://meet.tribunal.bo/sent2"),
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
# 7. TIPOS DE PROCESO
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando tipos de proceso...")

tipos_proceso_data = [
    ("Proceso Civil Ordinario",        "CIV-ORD"),
    ("Proceso Civil Ejecutivo",        "CIV-EJE"),
    ("Proceso Penal Ordinario",        "PEN-ORD"),
    ("Proceso Penal Abreviado",        "PEN-ABR"),
    ("Proceso Familiar Divorcio",      "FAM-DIV"),
    ("Proceso Familiar Alimentos",     "FAM-ALI"),
    ("Proceso Laboral",                "LAB-ORD"),
    ("Proceso Contencioso-Adm.",       "CON-ADM"),
    ("Proceso de Amparo Constitucional","AMP-CON"),
    ("Proceso Coactivo",               "COA-ORD"),
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
# 8. ESTADOS DE EXPEDIENTE
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando estados de expediente...")

estados_data = [
    ("Ingresado",          False),
    ("En Trámite",         False),
    ("Para Resolución",    False),
    ("Suspendido",         False),
    ("Apelado",            False),
    ("Concluido",          True),
    ("Archivado",          True),
    ("Desistido",          True),
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
# 9. PERSONAS
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando personas...")

personas_data = [
    # (numero_doc, nombre, primer_apellido, segundo_apellido, estamento, reg_univ, es_abogado, titular_a)
    ("9100001", "Jorge",    "Antezana",  "Rivas",    "Abogado",   "RU-001-SC", True,  None),
    ("9100002", "María",    "Blanco",    "Pinto",    "Abogado",   "RU-002-SC", True,  None),
    ("9100003", "Luis",     "Camacho",   "Vaca",     "Abogado",   "RU-003-SC", True,  None),
    ("9100004", "Elena",    "Durán",     "Salas",    "Abogado",   "RU-004-SC", True,  None),
    ("9100005", "Fernando", "Egüez",     "Montero",  "Abogado",   "RU-005-SC", True,  None),
    # Partes no abogados
    ("5200001", "Hugo",     "Flores",    "Méndez",   "Particular", None,       False, None),
    ("5200002", "Carmen",   "García",    "López",    "Particular", None,       False, None),
    ("5200003", "Ramón",    "Heredia",   "Cruz",     "Particular", None,       False, None),
    ("5200004", "Beatriz",  "Ibáñez",    "Suárez",   "Particular", None,       False, None),
    ("5200005", "Pablo",    "Jiménez",   "Rojas",    "Empresa",    None,       False, None),
    ("5200006", "Teresa",   "Kuno",      "Quispe",   "Empresa",    None,       False, None),
    ("5200007", "Marco",    "Lora",      "Terán",    "Particular", None,       False, None),
    ("5200008", "Claudia",  "Méndez",    "Arce",     "Particular", None,       False, None),
    ("5200009", "Andrés",   "Núñez",     "Peña",     "Particular", None,       False, None),
    ("5200010", "Rosa",     "Ordóñez",   "Vidal",    "Empresa",    None,       False, None),
    # Vocales como personas
    ("1100001", "Hernán",   "Pedraza",   "Villca",   "Judicial",  None,       True,  None),
    ("1100002", "Miriam",   "Quiroga",   "Balcázar", "Judicial",  None,       True,  None),
    ("1100003", "Alfredo",  "Roca",      "Nogales",  "Judicial",  None,       True,  None),
    ("1100004", "Gladys",   "Salazar",   "Ponce",    "Judicial",  None,       True,  None),
    ("1100005", "Omar",     "Torrico",   "Medina",   "Judicial",  None,       True,  None),
]

personas_ids = []
for num_doc, nombre, p_ap, s_ap, estamento, reg_univ, es_abog, titular in personas_data:
    r = gql("""
    mutation($input: CrearPersonaInput!) {
      crearPersona(input: $input) {
        persona { idPersona nombre primerApellido }
      }
    }""", {"input": {
        "numeroDocumento": num_doc, "nombre": nombre,
        "primerApellido": p_ap, "segundoApellido": s_ap,
        "estamento": estamento, "registroUniversitario": reg_univ,
        "esAbogado": es_abog, "titularA": titular
    }})
    if r:
        id_ = to_int(r["crearPersona"]["persona"]["idPersona"])
        personas_ids.append(id_)
        ok("Persona", f"{nombre} {p_ap}")

# Contactos para personas
print("\n📌 Creando contactos...")
contactos = [
    (personas_ids[0],  "EMAIL",    "jantezana@estudio.bo",  True),
    (personas_ids[0],  "TELEFONO", "76100001",              False),
    (personas_ids[1],  "EMAIL",    "mblanco@estudio.bo",    True),
    (personas_ids[2],  "EMAIL",    "lcamacho@derecho.bo",   True),
    (personas_ids[3],  "EMAIL",    "eduran@abogados.bo",    True),
    (personas_ids[4],  "EMAIL",    "feguez@legal.bo",       True),
    (personas_ids[5],  "EMAIL",    "hflores@gmail.com",     True),
    (personas_ids[5],  "TELEFONO", "76200001",              False),
    (personas_ids[6],  "EMAIL",    "cgarcia@hotmail.com",   True),
    (personas_ids[7],  "TELEFONO", "76200003",              True),
    (personas_ids[8],  "EMAIL",    "bibanez@empresa.bo",    True),
    (personas_ids[9],  "EMAIL",    "pjimenez@corp.bo",      True),
    (personas_ids[10], "EMAIL",    "tkuno@empresa.bo",      True),
    (personas_ids[15], "EMAIL",    "hpedraza@tribunal.bo",  True),
    (personas_ids[16], "EMAIL",    "mquiroga@tribunal.bo",  True),
    (personas_ids[17], "EMAIL",    "aroca@tribunal.bo",     True),
]
for id_persona, tipo, valor, principal in contactos:
    r = gql("""
    mutation($idPersona: Int!, $tipoContacto: String!, $valor: String!, $esPrincipal: Boolean) {
      crearContacto(idPersona: $idPersona, tipoContacto: $tipoContacto, valor: $valor, esPrincipal: $esPrincipal) {
        contacto { idContacto }
      }
    }""", {"idPersona": id_persona, "tipoContacto": tipo, "valor": valor, "esPrincipal": principal})
    if r:
        ok("Contacto", f"{tipo} → persona {id_persona}")

# ─────────────────────────────────────────────────────────────
# 10. VOCALES
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando vocales...")

vocales_personas = personas_ids[15:20]  # Los 5 vocales
vocales_cargos   = ["Vocal Titular", "Vocal Titular", "Vocal Suplente", "Vocal Suplente", "Vocal Titular"]
vocales_salas    = salas_ids[:5]
vocales_ids      = []
id_admin         = usuarios_ids["cmamani"]

for i, (id_persona, cargo) in enumerate(zip(vocales_personas, vocales_cargos)):
    id_sala = vocales_salas[i] if i < len(vocales_salas) else None
    fecha = (datetime(2022, 1, 15) + timedelta(days=i*30)).strftime("%Y-%m-%d")
    r = gql("""
    mutation($idPersona: Int!, $cargo: String!, $fechaPosesion: String!, $idUsuario: Int!, $idSala: Int) {
      crearVocal(idPersona: $idPersona, cargo: $cargo, fechaPosesion: $fechaPosesion, idUsuario: $idUsuario, idSala: $idSala) {
        vocal { idVocal cargo }
      }
    }""", {"idPersona": id_persona, "cargo": cargo, "fechaPosesion": fecha,
           "idUsuario": id_admin, "idSala": id_sala})
    if r:
        id_ = to_int(r["crearVocal"]["vocal"]["idVocal"])
        vocales_ids.append(id_)
        ok("Vocal", f"{cargo} (persona {id_persona})")

# ─────────────────────────────────────────────────────────────
# 11. ROLES PROCESALES
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando roles procesales...")

roles_procesales = ["Demandante", "Demandado", "Tercero Interesado", "Abogado Demandante",
                    "Abogado Demandado", "Perito", "Testigo", "Ministerio Público", "Defensor Público"]
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
# 12. TIPOS DE ACTUACIÓN
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando tipos de actuación...")

tipos_actuacion_data = [
    ("AUTO-ADM",  "Auto de Admisión"),
    ("MEM-DEM",   "Memorial de Demanda"),
    ("MEM-CONT",  "Memorial de Contestación"),
    ("AUTO-APR",  "Auto de Apertura de Término"),
    ("PRO-PER",   "Producción de Prueba Pericial"),
    ("PRO-TEST",  "Producción de Prueba Testifical"),
    ("PRO-DOC",   "Producción de Prueba Documental"),
    ("AUTO-SENT", "Auto para Sentencia"),
    ("SENT",      "Sentencia"),
    ("APEL",      "Apelación"),
    ("AUTO-EJEC", "Auto de Ejecución de Sentencia"),
    ("CERT-EJE",  "Certificación de Ejecutoria"),
    ("NOT-SENT",  "Notificación de Sentencia"),
    ("ARCH",      "Auto de Archivo"),
]

tipos_actuacion_ids = []
for codigo, nombre in tipos_actuacion_data:
    r = gql("""
    mutation($codigo: String!, $nombre: String!) {
      crearTipoActuacion(codigo: $codigo, nombre: $nombre) {
        tipoActuacion { idTipoActuacion codigo nombre }
      }
    }""", {"codigo": codigo, "nombre": nombre})
    if r:
        id_ = to_int(r["crearTipoActuacion"]["tipoActuacion"]["idTipoActuacion"])
        tipos_actuacion_ids.append(id_)
        ok("Tipo Actuación", nombre)

# ─────────────────────────────────────────────────────────────
# 13. TIPOS DE AUDIENCIA
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando tipos de audiencia...")

tipos_audiencia_data = [
    ("Audiencia Preliminar",              60,  tipos_proceso_ids[0], "Audiencia inicial para saneamiento del proceso"),
    ("Audiencia de Juicio Oral Civil",    180, tipos_proceso_ids[0], "Audiencia principal de debate civil"),
    ("Audiencia de Medidas Cautelares",   45,  tipos_proceso_ids[0], "Audiencia para medidas cautelares"),
    ("Audiencia Preparatoria Penal",      90,  tipos_proceso_ids[2], "Fase preparatoria del juicio penal"),
    ("Audiencia de Juicio Oral Penal",    240, tipos_proceso_ids[2], "Juicio oral penal"),
    ("Audiencia de Cesura",               60,  tipos_proceso_ids[2], "Determinación de sanción penal"),
    ("Audiencia de Conciliación Familiar",60,  tipos_proceso_ids[4], "Intento de conciliación en materia familiar"),
    ("Audiencia de Divorcio",             90,  tipos_proceso_ids[4], "Audiencia de divorcio"),
    ("Audiencia Laboral",                 90,  tipos_proceso_ids[6], "Audiencia en materia laboral"),
]

tipos_audiencia_ids = []
for nombre, dur, id_tipo_proc, desc in tipos_audiencia_data:
    r = gql("""
    mutation($nombre: String!, $duracionEstimada: Int!, $idTipoProceso: Int!, $descripcion: String) {
      crearTipoAudiencia(nombre: $nombre, duracionEstimada: $duracionEstimada, idTipoProceso: $idTipoProceso, descripcion: $descripcion) {
        tipoAudiencia { idTipoAudiencia nombre }
      }
    }""", {"nombre": nombre, "duracionEstimada": dur, "idTipoProceso": id_tipo_proc, "descripcion": desc})
    if r:
        id_ = to_int(r["crearTipoAudiencia"]["tipoAudiencia"]["idTipoAudiencia"])
        tipos_audiencia_ids.append(id_)
        ok("Tipo Audiencia", nombre)

# ─────────────────────────────────────────────────────────────
# 14. TIPOS DE DOCUMENTO
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando tipos de documento...")

tipos_doc_data = [
    ("DEM",   "Demanda",                    False, True,  "Escrito de demanda inicial"),
    ("CONT",  "Contestación",               False, True,  "Escrito de contestación"),
    ("MEM",   "Memorial",                   False, True,  "Memorial procesal genérico"),
    ("SENT",  "Sentencia",                  True,  True,  "Resolución final del proceso"),
    ("AUTO",  "Auto Interlocutorio",        True,  True,  "Resolución interlocutoria"),
    ("PERI",  "Informe Pericial",           False, True,  "Informe de perito"),
    ("CERT",  "Certificación",             True,  True,  "Certificación judicial"),
    ("PODER", "Poder Notarial",             False, True,  "Poder notarial de representación"),
    ("ACTA",  "Acta de Audiencia",          True,  True,  "Acta de audiencia judicial"),
    ("EXH",   "Exhibición de Documentos",   False, True,  "Documentos exhibidos en proceso"),
    ("NOT",   "Cédula de Notificación",     True,  True,  "Documento de notificación oficial"),
    ("APEL",  "Apelación",                  False, True,  "Recurso de apelación"),
]

tipos_doc_ids = {}
for codigo, nombre, firma, publico, desc in tipos_doc_data:
    r = gql("""
    mutation($codigo: String!, $nombre: String!, $requiereFirma: Boolean, $esPublico: Boolean, $descripcion: String) {
      crearTipoDoc(codigo: $codigo, nombre: $nombre, requiereFirma: $requiereFirma, esPublico: $esPublico, descripcion: $descripcion) {
        tipoDoc { idTipoDoc codigo nombre }
      }
    }""", {"codigo": codigo, "nombre": nombre, "requiereFirma": firma,
           "esPublico": publico, "descripcion": desc})
    if r:
        id_ = to_int(r["crearTipoDoc"]["tipoDoc"]["idTipoDoc"])
        tipos_doc_ids[codigo] = id_
        ok("Tipo Doc", nombre)

# ─────────────────────────────────────────────────────────────
# 15. TIPOS DE RESOLUCIÓN
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando tipos de resolución...")

tipos_res_data = [
    ("SENT-DEF",  "Sentencia Definitiva",        1, "Resolución final que resuelve el fondo"),
    ("AUTO-INT",  "Auto Interlocutorio",          2, "Resolución que resuelve incidentes"),
    ("AUTO-SUP",  "Auto Supremo",                 1, "Resolución del Tribunal Supremo"),
    ("SENT-APEL", "Sentencia de Apelación",       1, "Resolución en segunda instancia"),
    ("AUTO-EJEC", "Auto de Ejecutoria",           3, "Declara ejecutoriada la resolución"),
    ("DECR",      "Decreto",                      4, "Disposición de mero trámite"),
]

tipos_res_ids = []
for codigo, nombre, nivel, desc in tipos_res_data:
    r = gql("""
    mutation($codigo: String!, $nombre: String!, $nivelJerarquico: Int, $descripcion: String) {
      crearTipoResolucion(codigo: $codigo, nombre: $nombre, nivelJerarquico: $nivelJerarquico, descripcion: $descripcion) {
        tipoResolucion { idTipoRes codigo nombre }
      }
    }""", {"codigo": codigo, "nombre": nombre, "nivelJerarquico": nivel, "descripcion": desc})
    if r:
        id_ = to_int(r["crearTipoResolucion"]["tipoResolucion"]["idTipoRes"])
        tipos_res_ids.append(id_)
        ok("Tipo Resolución", nombre)

# ─────────────────────────────────────────────────────────────
# 16. TIPOS DE RECURSO
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando tipos de recurso...")

tipos_recurso_data = [
    ("Apelación",         "Recurso ordinario ante tribunal superior"),
    ("Casación",          "Recurso extraordinario ante el Tribunal Supremo"),
    ("Reposición",        "Recurso ante el mismo juez"),
    ("Compulsa",          "Recurso cuando se niega la apelación"),
    ("Nulidad",           "Recurso por vicios de procedimiento"),
]

tipos_recurso_ids = []
for nombre, desc in tipos_recurso_data:
    r = gql("""
    mutation($nombre: String!, $descripcion: String) {
      crearTipoRecurso(nombre: $nombre, descripcion: $descripcion) {
        tipoRecurso { idTipoRecurso nombre }
      }
    }""", {"nombre": nombre, "descripcion": desc})
    if r:
        id_ = to_int(r["crearTipoRecurso"]["tipoRecurso"]["idTipoRecurso"])
        tipos_recurso_ids.append(id_)
        ok("Tipo Recurso", nombre)

# ─────────────────────────────────────────────────────────────
# 17. EXPEDIENTES (15 expedientes con lógica)
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando expedientes...")

# (numero, año, sala_idx, tipo_proceso_idx, estado_nombre, descripcion)
expedientes_data = [
    ("001/2023", 2023, 0, 0, "Concluido",     "Cobro de deuda por incumplimiento de contrato comercial"),
    ("002/2023", 2023, 1, 1, "Archivado",     "Proceso ejecutivo por letra de cambio protestada"),
    ("003/2023", 2023, 2, 2, "Concluido",     "Proceso penal por delito de estafa agravada"),
    ("004/2023", 2023, 4, 4, "Archivado",     "Divorcio vincular por mutuo acuerdo"),
    ("005/2023", 2023, 0, 5, "En Trámite",    "Alimentos para hijos menores de edad"),
    ("006/2024", 2024, 1, 0, "En Trámite",    "Nulidad de contrato de compraventa de inmueble"),
    ("007/2024", 2024, 2, 2, "Para Resolución","Robo agravado con violencia"),
    ("008/2024", 2024, 3, 3, "En Trámite",    "Proceso penal abreviado por daño a bien ajeno"),
    ("009/2024", 2024, 4, 4, "En Trámite",    "Guarda y custodia de menores"),
    ("010/2024", 2024, 0, 6, "Suspendido",    "Reintegro de beneficios sociales"),
    ("011/2024", 2024, 1, 0, "Ingresado",     "Resolución de contrato de arrendamiento"),
    ("012/2024", 2024, 2, 2, "Ingresado",     "Lesiones graves y gravísimas"),
    ("013/2025", 2025, 0, 1, "En Trámite",    "Proceso ejecutivo hipotecario"),
    ("014/2025", 2025, 3, 2, "En Trámite",    "Homicidio culposo en accidente de tránsito"),
    ("015/2025", 2025, 4, 5, "Ingresado",     "Alimentos entre cónyuges post divorcio"),
]

expedientes_ids = []
id_usuario_sec = usuarios_ids["pchoque"]

for num, ano, sala_idx, tp_idx, estado_nombre, desc in expedientes_data:
    id_sala   = salas_ids[sala_idx] if sala_idx < len(salas_ids) else salas_ids[0]
    id_tp     = tipos_proceso_ids[tp_idx]
    id_estado = estados_nombres.get(estado_nombre, estados_ids[0])
    r = gql("""
    mutation($input: CrearExpedienteInput!) {
      crearExpediente(input: $input) {
        expediente { idExpediente numeroExpediente }
      }
    }""", {"input": {
        "numeroExpediente": num, "ano": ano,
        "idSala": id_sala, "idTipoProceso": id_tp,
        "idEstadoExpediente": id_estado, "descripcion": desc
    }})
    if r:
        id_ = to_int(r["crearExpediente"]["expediente"]["idExpediente"])
        expedientes_ids.append(id_)
        ok("Expediente", f"{num} — {desc[:45]}")

# ─────────────────────────────────────────────────────────────
# 18. CONFORMACIONES SALA-EXPEDIENTE
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando conformaciones (vocales por expediente)...")

conformaciones = [
    (0, 0, "Vocal Relator"),
    (0, 1, "Vocal Dirimente"),
    (1, 1, "Vocal Relator"),
    (2, 2, "Vocal Relator"),
    (2, 0, "Vocal Dirimente"),
    (3, 3, "Vocal Relator"),
    (4, 4, "Vocal Relator"),
    (5, 0, "Vocal Relator"),
    (6, 2, "Vocal Relator"),
    (7, 3, "Vocal Relator"),
]
conf_ids = []
for exp_idx, vocal_idx, rol_caso in conformaciones:
    if exp_idx < len(expedientes_ids) and vocal_idx < len(vocales_ids):
        r = gql("""
        mutation($idExpediente: Int!, $idVocal: Int!, $rolEnCaso: String!) {
          crearConformacion(idExpediente: $idExpediente, idVocal: $idVocal, rolEnCaso: $rolEnCaso) {
            conformacion { idConformacion rolEnCaso }
          }
        }""", {"idExpediente": expedientes_ids[exp_idx],
               "idVocal": vocales_ids[vocal_idx], "rolEnCaso": rol_caso})
        if r:
            id_ = to_int(r["crearConformacion"]["conformacion"]["idConformacion"])
            conf_ids.append(id_)
            ok("Conformación", f"Exp {exp_idx+1} — Vocal {vocal_idx+1} ({rol_caso})")

# ─────────────────────────────────────────────────────────────
# 19. PARTES PROCESALES
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando partes procesales...")

# exp_idx, persona_idx, rol_procesal
partes_data = [
    (0, 5,  "Demandante"),
    (0, 6,  "Demandado"),
    (0, 0,  "Abogado Demandante"),
    (0, 1,  "Abogado Demandado"),
    (1, 7,  "Demandante"),
    (1, 8,  "Demandado"),
    (1, 2,  "Abogado Demandante"),
    (2, 9,  "Demandante"),
    (2, 10, "Demandado"),
    (2, 3,  "Abogado Demandante"),
    (3, 11, "Demandante"),
    (3, 12, "Demandado"),
    (4, 5,  "Demandante"),
    (4, 6,  "Demandado"),
    (5, 7,  "Demandante"),
    (5, 8,  "Demandado"),
    (5, 4,  "Abogado Demandante"),
    (6, 9,  "Demandante"),
    (6, 10, "Demandado"),
    (7, 11, "Demandante"),
    (7, 12, "Demandado"),
    (8, 13, "Demandante"),
    (8, 14, "Demandado"),
    (9, 5,  "Demandante"),
    (9, 6,  "Demandado"),
]

partes_ids = []
for exp_idx, per_idx, rol_nombre in partes_data:
    if exp_idx >= len(expedientes_ids) or per_idx >= len(personas_ids):
        continue
    id_rol = roles_procesales_ids.get(rol_nombre)
    if not id_rol:
        continue
    r = gql("""
    mutation($idExpediente: Int!, $idPersona: Int!, $idRol: Int!) {
      crearParteProcesal(idExpediente: $idExpediente, idPersona: $idPersona, idRol: $idRol) {
        parte { idParte activo }
      }
    }""", {"idExpediente": expedientes_ids[exp_idx],
           "idPersona": personas_ids[per_idx],
           "idRol": id_rol})
    if r:
        id_ = to_int(r["crearParteProcesal"]["parte"]["idParte"])
        partes_ids.append(id_)
        ok("Parte", f"Exp {exp_idx+1} — {rol_nombre} (persona {per_idx+1})")

# ─────────────────────────────────────────────────────────────
# 20. DOCUMENTOS
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando documentos...")

documentos_data = [
    (0, "DEM",   "Demanda por cobro de deuda comercial",         1,  "/docs/exp001/demanda.pdf",     245),
    (0, "PODER", "Poder notarial del demandante",                2,  "/docs/exp001/poder.pdf",       180),
    (0, "CONT",  "Contestación a la demanda",                   3,  "/docs/exp001/contestacion.pdf",310),
    (0, "SENT",  "Sentencia definitiva Exp. 001/2023",          45, "/docs/exp001/sentencia.pdf",   420),
    (1, "DEM",   "Demanda ejecutiva por letra de cambio",        1,  "/docs/exp002/demanda.pdf",     198),
    (1, "SENT",  "Sentencia ejecutiva Exp. 002/2023",           12, "/docs/exp002/sentencia.pdf",   380),
    (2, "MEM",   "Memorial de apertura de investigación",        1,  "/docs/exp003/memorial.pdf",    156),
    (2, "SENT",  "Sentencia condenatoria Exp. 003/2023",        88, "/docs/exp003/sentencia.pdf",   512),
    (5, "DEM",   "Demanda de nulidad de contrato inmueble",      1,  "/docs/exp006/demanda.pdf",     289),
    (5, "MEM",   "Memorial de ofrecimiento de prueba",           8,  "/docs/exp006/prueba.pdf",      167),
    (6, "MEM",   "Memorial de acusación formal",                 1,  "/docs/exp007/acusacion.pdf",   445),
    (6, "PERI",  "Informe pericial médico forense",              15, "/docs/exp007/pericia.pdf",     892),
    (7, "MEM",   "Memorial de aceptación de proceso abreviado",  1,  "/docs/exp008/abreviado.pdf",   134),
    (12, "DEM",  "Demanda ejecutiva hipotecaria",                1,  "/docs/exp013/hipoteca.pdf",    567),
    (13, "MEM",  "Acusación formal homicidio culposo",           1,  "/docs/exp014/acusacion.pdf",   398),
]

documentos_ids = []
for exp_idx, tipo_cod, titulo, folio, ruta, tamano in documentos_data:
    if exp_idx >= len(expedientes_ids):
        continue
    id_tipo = tipos_doc_ids.get(tipo_cod)
    if not id_tipo:
        continue
    r = gql("""
    mutation($idExpediente: Int!, $idTipoDoc: Int!, $titulo: String!, $numeroFolio: Int, $rutaArchivo: String, $tamanoKb: Int) {
      crearDocumento(idExpediente: $idExpediente, idTipoDoc: $idTipoDoc, titulo: $titulo, numeroFolio: $numeroFolio, rutaArchivo: $rutaArchivo, tamanoKb: $tamanoKb) {
        documento { idDocumento titulo }
      }
    }""", {"idExpediente": expedientes_ids[exp_idx], "idTipoDoc": id_tipo,
           "titulo": titulo, "numeroFolio": folio,
           "rutaArchivo": ruta, "tamanoKb": tamano})
    if r:
        id_ = to_int(r["crearDocumento"]["documento"]["idDocumento"])
        documentos_ids.append(id_)
        ok("Documento", titulo[:50])

# ─────────────────────────────────────────────────────────────
# 21. AUDIENCIAS
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando audiencias...")

audiencias_data = [
    # exp_idx, tipo_aud_idx, sala_aud_idx, fecha_str, estado
    (0,  0, 0, "2023-03-15T09:00:00", "REALIZADA"),
    (0,  1, 0, "2023-06-20T10:00:00", "REALIZADA"),
    (1,  0, 1, "2023-04-10T09:00:00", "REALIZADA"),
    (2,  3, 3, "2023-05-08T08:30:00", "REALIZADA"),
    (2,  4, 3, "2023-08-14T08:30:00", "REALIZADA"),
    (3,  6, 2, "2023-07-05T10:00:00", "REALIZADA"),
    (3,  7, 2, "2023-09-12T10:00:00", "REALIZADA"),
    (4,  6, 2, "2024-01-18T11:00:00", "REALIZADA"),
    (5,  0, 0, "2024-02-22T09:30:00", "REALIZADA"),
    (6,  3, 3, "2024-03-11T08:00:00", "REALIZADA"),
    (6,  4, 3, "2024-07-05T08:00:00", "PROGRAMADA"),
    (7,  3, 4, "2024-04-09T09:00:00", "REALIZADA"),
    (8,  6, 2, "2024-05-16T10:30:00", "REALIZADA"),
    (9,  8, 1, "2024-06-20T11:00:00", "REALIZADA"),
    (12, 0, 0, "2025-01-14T09:00:00", "REALIZADA"),
    (12, 1, 0, "2025-03-05T09:00:00", "PROGRAMADA"),
    (13, 3, 3, "2025-02-10T08:00:00", "REALIZADA"),
    (13, 4, 3, "2025-05-20T08:00:00", "PROGRAMADA"),
]

audiencias_ids = []
for exp_idx, ta_idx, sa_idx, fecha, estado in audiencias_data:
    if exp_idx >= len(expedientes_ids):
        continue
    id_tipo_aud = tipos_audiencia_ids[ta_idx] if ta_idx < len(tipos_audiencia_ids) else tipos_audiencia_ids[0]
    id_sala_aud = salas_aud_ids[sa_idx] if sa_idx < len(salas_aud_ids) else salas_aud_ids[0]
    r = gql("""
    mutation($input: CrearAudienciaInput!) {
      crearAudiencia(input: $input) {
        audiencia { idAudiencia fechaHoraProgramada estadoAudiencia }
      }
    }""", {"input": {
        "idExpediente": expedientes_ids[exp_idx],
        "idTipoAudiencia": id_tipo_aud,
        "fechaHoraProgramada": fecha,
        "idSalaAud": id_sala_aud
    }})
    if r:
        id_ = to_int(r["crearAudiencia"]["audiencia"]["idAudiencia"])
        audiencias_ids.append(id_)
        # Actualizar estado si es REALIZADA o SUSPENDIDA
        if estado != "PROGRAMADA":
            gql("""
            mutation($id: Int!, $input: ActualizarAudienciaInput!) {
              actualizarAudiencia(id: $id, input: $input) { audiencia { idAudiencia } }
            }""", {"id": id_, "input": {"estadoAudiencia": estado}})
        ok("Audiencia", f"Exp {exp_idx+1} — {fecha[:10]} ({estado})")

# ─────────────────────────────────────────────────────────────
# 22. ACTAS DE AUDIENCIA
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando actas de audiencia...")

id_sec = usuarios_ids["gtorrez"]
actas_data = [
    (0,  "En la ciudad de Santa Cruz, siendo las 09:05 horas del 15 de marzo de 2023, se constituyó el tribunal. Presentes las partes, se procedió a la audiencia preliminar. Se admitió la demanda y se ordenó citación al demandado. Se fijó audiencia de juicio para el 20 de junio de 2023.", True),
    (1,  "Audiencia de juicio oral civil. Ambas partes ratificaron sus posiciones. Se escucharon testigos y se revisó documentación. El tribunal deliberó y emitió sentencia declarando probada la demanda.", True),
    (2,  "Audiencia ejecutiva. El demandante presentó la letra de cambio protestada. El demandado no compareció. Se declaró en rebeldía al demandado.", True),
    (3,  "Audiencia preparatoria penal. El fiscal presentó cargos por estafa agravada. La defensa solicitó plazo para preparar su defensa. Se fijó fecha para juicio oral.", True),
    (4,  "Juicio oral penal por estafa agravada. Desfilaron 4 testigos de cargo y 2 de descargo. El fiscal amplió acusación. La defensa planteó excepción de prescripción.", True),
    (5,  "Audiencia de conciliación familiar. Las partes expresaron su voluntad de divorciarse de mutuo acuerdo. Se acordaron términos sobre bienes gananciales.", True),
    (6,  "Audiencia de divorcio. Se homologó el convenio regulador. Se declaró disuelto el vínculo matrimonial.", True),
]

actas_ids = []
for i, (aud_idx, contenido, firmada) in enumerate(actas_data):
    if aud_idx >= len(audiencias_ids):
        continue
    r = gql("""
    mutation($idAudiencia: Int!, $idUsuario: Int!, $contenido: String!, $firmada: Boolean) {
      crearActa(idAudiencia: $idAudiencia, idUsuario: $idUsuario, contenido: $contenido, firmada: $firmada) {
        acta { idActa firmada }
      }
    }""", {"idAudiencia": audiencias_ids[aud_idx], "idUsuario": id_sec,
           "contenido": contenido, "firmada": firmada})
    if r:
        id_ = to_int(r["crearActa"]["acta"]["idActa"])
        actas_ids.append(id_)
        ok("Acta", f"Audiencia {aud_idx+1} ({'firmada' if firmada else 'borrador'})")

# ─────────────────────────────────────────────────────────────
# 23. ASISTENCIAS A AUDIENCIAS
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando asistencias...")

asistencias_data = [
    # aud_idx, per_idx, rol, asistio
    (0, 5,  "Demandante",  True),
    (0, 0,  "Abogado",     True),
    (0, 6,  "Demandado",   True),
    (0, 1,  "Abogado",     True),
    (1, 5,  "Demandante",  True),
    (1, 0,  "Abogado",     True),
    (1, 6,  "Demandado",   False),
    (2, 7,  "Demandante",  True),
    (2, 2,  "Abogado",     True),
    (3, 9,  "Imputado",    True),
    (3, 3,  "Defensor",    True),
    (4, 9,  "Imputado",    True),
    (4, 3,  "Defensor",    True),
    (5, 11, "Parte",       True),
    (5, 12, "Parte",       True),
    (6, 11, "Parte",       True),
    (6, 12, "Parte",       True),
]

for aud_idx, per_idx, rol, asistio in asistencias_data:
    if aud_idx >= len(audiencias_ids) or per_idx >= len(personas_ids):
        continue
    r = gql("""
    mutation($idAudiencia: Int!, $idPersona: Int!, $rolEnAudiencia: String!, $asistio: Boolean) {
      registrarAsistencia(idAudiencia: $idAudiencia, idPersona: $idPersona, rolEnAudiencia: $rolEnAudiencia, asistio: $asistio) {
        asistencia { idAsistencia asistio }
      }
    }""", {"idAudiencia": audiencias_ids[aud_idx], "idPersona": personas_ids[per_idx],
           "rolEnAudiencia": rol, "asistio": asistio})
    if r:
        ok("Asistencia", f"Aud {aud_idx+1} — {rol} ({'✓' if asistio else '✗'})")

# ─────────────────────────────────────────────────────────────
# 24. RESOLUCIONES
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando resoluciones...")

resoluciones_data = [
    # exp_idx, tipo_res_idx, numero, fecha, parte_dispositiva, fundamentacion, estado, recurrible
    (0, 0, "SENT-001/2023", "2023-07-15",
     "Se declara PROBADA la demanda. Se condena al demandado al pago de Bs. 85,000 más intereses legales.",
     "Habiéndose demostrado el incumplimiento contractual mediante los documentos presentados y la declaración testifical, corresponde hacer lugar a la demanda.",
     "EJECUTORIADA", False),
    (1, 0, "SENT-002/2023", "2023-06-28",
     "Se declara PROBADA la demanda ejecutiva. Prosígase con la ejecución forzosa.",
     "La letra de cambio presentada reúne todos los requisitos formales. El demandado no ha demostrado el pago.",
     "EJECUTORIADA", False),
    (2, 0, "SENT-003/2023", "2023-10-05",
     "Se declara al imputado AUTOR del delito de Estafa Agravada, imponiéndosele la pena de 5 años de reclusión.",
     "Las pruebas de cargo son concluyentes. Los testimonios y documentos acreditan el engaño y el perjuicio económico causado.",
     "APELADA", True),
    (3, 0, "SENT-004/2023", "2023-11-20",
     "Se declara disuelto el vínculo matrimonial. Se aprueba el convenio regulador presentado por las partes.",
     "Las partes han expresado libremente su voluntad de disolver el matrimonio. El convenio no lesiona derechos de terceros.",
     "EJECUTORIADA", False),
    (6, 1, "AUTO-007/2024", "2024-04-15",
     "Se rechaza la excepción de prescripción planteada por la defensa. Continúese con el proceso.",
     "El plazo de prescripción no ha vencido conforme al cómputo establecido en el Código Penal.",
     "VIGENTE", True),
    (12, 1, "AUTO-013/2025", "2025-02-14",
     "Se admite la demanda ejecutiva hipotecaria. Cítese al demandado bajo apercibimiento de ley.",
     "La escritura pública hipotecaria presentada tiene plena fuerza ejecutiva conforme al Código de Procedimiento Civil.",
     "VIGENTE", False),
]

resoluciones_ids = []
for exp_idx, tr_idx, numero, fecha, parte_disp, fund, estado, recurrible in resoluciones_data:
    if exp_idx >= len(expedientes_ids):
        continue
    id_tipo_res = tipos_res_ids[tr_idx] if tr_idx < len(tipos_res_ids) else tipos_res_ids[0]
    r = gql("""
    mutation($input: CrearResolucionInput!) {
      crearResolucion(input: $input) {
        resolucion { idResolucion numeroResolucion estado }
      }
    }""", {"input": {
        "idExpediente": expedientes_ids[exp_idx],
        "idTipoRes": id_tipo_res,
        "numeroResolucion": numero,
        "fechaResolucion": fecha,
        "parteDispositiva": parte_disp,
        "fundamentacion": fund
    }})
    if r:
        id_ = to_int(r["crearResolucion"]["resolucion"]["idResolucion"])
        resoluciones_ids.append(id_)
        # Actualizar estado y recurribilidad
        gql("""
        mutation($id: Int!, $input: ActualizarResolucionInput!) {
          actualizarResolucion(id: $id, input: $input) { resolucion { idResolucion } }
        }""", {"id": id_, "input": {"estado": estado, "esRecurrible": recurrible,
                                    "plazoRecursoDias": 10 if recurrible else 0}})
        ok("Resolución", f"{numero} ({estado})")

# ─────────────────────────────────────────────────────────────
# 25. RECURSOS
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando recursos...")

if len(resoluciones_ids) >= 3 and len(partes_ids) >= 10:
    recursos_data = [
        (resoluciones_ids[2], tipos_recurso_ids[0], partes_ids[9],
         "La sentencia infringe el principio de proporcionalidad de la pena. Los hechos probados no justifican 5 años de reclusión. Se solicita reducción de pena conforme al Art. 38 del Código Penal."),
        (resoluciones_ids[4], tipos_recurso_ids[2], partes_ids[19] if len(partes_ids) > 19 else partes_ids[-1],
         "El auto interlocutorio que rechaza la prescripción incurre en error de derecho. El plazo debe computarse desde la consumación del hecho."),
    ]
    for id_res, id_tipo_rec, id_parte, fund in recursos_data:
        r = gql("""
        mutation($idResolucionImpugnada: Int!, $idTipoRecurso: Int!, $idRecurrente: Int!, $fundamentos: String) {
          crearRecurso(idResolucionImpugnada: $idResolucionImpugnada, idTipoRecurso: $idTipoRecurso, idRecurrente: $idRecurrente, fundamentos: $fundamentos) {
            recurso { idRecurso estadoRecurso }
          }
        }""", {"idResolucionImpugnada": id_res, "idTipoRecurso": id_tipo_rec,
               "idRecurrente": id_parte, "fundamentos": fund})
        if r:
            ok("Recurso", f"Contra resolución {id_res}")

# ─────────────────────────────────────────────────────────────
# 26. ACTUACIONES PROCESALES
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando actuaciones procesales...")

id_vocal_user = usuarios_ids["acondori"]
id_sec_user   = usuarios_ids["pchoque"]

actuaciones_data = [
    # exp_idx, tipo_act_idx, usuario, folio_i, folio_f, descripcion
    (0, 0, id_sec_user,   1,  3,  "Se admite la demanda por cobro de deuda. Se ordena citación al demandado."),
    (0, 2, id_sec_user,   4,  8,  "Memorial de contestación a la demanda. El demandado niega la deuda alegada."),
    (0, 3, id_vocal_user, 9,  9,  "Auto de apertura de término probatorio por 30 días hábiles."),
    (0, 7, id_vocal_user, 10, 10, "Auto para sentencia. Queda el proceso listo para resolución final."),
    (0, 8, id_vocal_user, 11, 18, "Se dicta sentencia definitiva declarando probada la demanda."),
    (1, 0, id_sec_user,   1,  2,  "Se admite demanda ejecutiva por letra de cambio."),
    (1, 8, id_vocal_user, 3,  9,  "Sentencia ejecutiva. Se ordena pago o ejecución forzosa."),
    (2, 0, id_sec_user,   1,  4,  "Auto de admisión de la investigación por estafa agravada."),
    (2, 3, id_vocal_user, 5,  5,  "Apertura de término de investigación complementaria."),
    (2, 8, id_vocal_user, 6,  22, "Sentencia condenatoria. Se condena al imputado a 5 años de reclusión."),
    (5, 0, id_sec_user,   1,  5,  "Admisión de demanda de nulidad de contrato. Se cita a los demandados."),
    (5, 1, id_sec_user,   6,  10, "Memorial de contestación de los demandados."),
    (6, 0, id_sec_user,   1,  8,  "Admisión de acusación formal por robo agravado."),
    (6, 3, id_vocal_user, 9,  9,  "Auto de apertura de término de ofrecimiento de prueba."),
    (12, 0, id_sec_user,  1,  4,  "Admisión de demanda ejecutiva hipotecaria. Mandamiento de intimación."),
    (13, 0, id_sec_user,  1,  6,  "Admisión de acusación por homicidio culposo en accidente de tránsito."),
]

actuaciones_ids = []
for exp_idx, ta_idx, id_usr, fi, ff, desc in actuaciones_data:
    if exp_idx >= len(expedientes_ids) or ta_idx >= len(tipos_actuacion_ids):
        continue
    r = gql("""
    mutation($idExpediente: Int!, $idTipoActuacion: Int!, $idUsuario: Int!, $folioInicio: Int!, $folioFin: Int!, $descripcion: String) {
      crearActuacionProcesal(idExpediente: $idExpediente, idTipoActuacion: $idTipoActuacion, idUsuario: $idUsuario, folioInicio: $folioInicio, folioFin: $folioFin, descripcion: $descripcion) {
        actuacion { idActuacion folioInicio }
      }
    }""", {"idExpediente": expedientes_ids[exp_idx], "idTipoActuacion": tipos_actuacion_ids[ta_idx],
           "idUsuario": id_usr, "folioInicio": fi, "folioFin": ff, "descripcion": desc})
    if r:
        id_ = to_int(r["crearActuacionProcesal"]["actuacion"]["idActuacion"])
        actuaciones_ids.append(id_)
        ok("Actuación", desc[:55])

# ─────────────────────────────────────────────────────────────
# 27. HISTORIALES DE ESTADO
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando historiales de estado...")

historiales_data = [
    # exp_idx, estado_nuevo_nombre, motivo
    (0, "En Trámite",       "Demanda admitida. Proceso iniciado formalmente."),
    (0, "Para Resolución",  "Concluido el período probatorio. Proceso listo para sentencia."),
    (0, "Concluido",        "Sentencia definitiva ejecutoriada. Proceso concluido."),
    (1, "En Trámite",       "Proceso ejecutivo admitido."),
    (1, "Archivado",        "Sentencia ejecutoriada. Proceso archivado."),
    (2, "En Trámite",       "Investigación admitida y en curso."),
    (2, "Para Resolución",  "Juicio oral concluido. Listo para sentencia."),
    (2, "Concluido",        "Sentencia condenatoria emitida."),
    (3, "En Trámite",       "Proceso de divorcio iniciado."),
    (3, "Archivado",        "Divorcio declarado y convenio aprobado."),
    (5, "En Trámite",       "Demanda de nulidad de contrato admitida."),
    (6, "En Trámite",       "Acusación admitida. Juicio oral en proceso."),
    (6, "Para Resolución",  "Audiencia de juicio oral concluida. En deliberación."),
]

for exp_idx, estado_nombre, motivo in historiales_data:
    if exp_idx >= len(expedientes_ids):
        continue
    id_estado = estados_nombres.get(estado_nombre)
    if not id_estado:
        continue
    r = gql("""
    mutation($idExpediente: Int!, $idEstadoNuevo: Int!, $idUsuario: Int!, $motivo: String!) {
      crearHistorialEstado(idExpediente: $idExpediente, idEstadoNuevo: $idEstadoNuevo, idUsuario: $idUsuario, motivo: $motivo) {
        historial { idHistorial fechaCambio }
      }
    }""", {"idExpediente": expedientes_ids[exp_idx], "idEstadoNuevo": id_estado,
           "idUsuario": id_sec_user, "motivo": motivo})
    if r:
        ok("Historial", f"Exp {exp_idx+1} → {estado_nombre}")

# ─────────────────────────────────────────────────────────────
# 28. NOTIFICACIONES
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando notificaciones...")

if documentos_ids and partes_ids:
    notif_data = [
        (0, documentos_ids[3],  partes_ids[0], id_sec_user, "CEDULA",    "DILIGENCIADA"),
        (0, documentos_ids[3],  partes_ids[1], id_sec_user, "CEDULA",    "DILIGENCIADA"),
        (1, documentos_ids[5],  partes_ids[4], id_sec_user, "CEDULA",    "DILIGENCIADA"),
        (2, documentos_ids[7],  partes_ids[8], id_sec_user, "CEDULA",    "DILIGENCIADA"),
        (5, documentos_ids[8],  partes_ids[14] if len(partes_ids) > 14 else partes_ids[-1], id_sec_user, "CORREO", "PENDIENTE"),
        (6, documentos_ids[11] if len(documentos_ids) > 11 else documentos_ids[-1],
              partes_ids[17] if len(partes_ids) > 17 else partes_ids[-1], id_sec_user, "CEDULA", "PENDIENTE"),
    ]
    for exp_idx, id_doc, id_parte, id_usr, tipo, estado in notif_data:
        if exp_idx >= len(expedientes_ids):
            continue
        r = gql("""
        mutation($idExpediente: Int!, $idDocumento: Int!, $idParte: Int!, $idUsuario: Int!, $tipoNotificacion: String!) {
          crearNotificacion(idExpediente: $idExpediente, idDocumento: $idDocumento, idParte: $idParte, idUsuario: $idUsuario, tipoNotificacion: $tipoNotificacion) {
            notificacion { idNotificacion estadoNotificacion }
          }
        }""", {"idExpediente": expedientes_ids[exp_idx], "idDocumento": id_doc,
               "idParte": id_parte, "idUsuario": id_usr, "tipoNotificacion": tipo})
        if r:
            id_not = r["crearNotificacion"]["notificacion"]["idNotificacion"]
            if estado != "PENDIENTE":
                gql("""
                mutation($id: Int!, $input: ActualizarNotificacionInput!) {
                  actualizarNotificacion(id: $id, input: $input) { notificacion { idNotificacion } }
                }""", {"id": id_not, "input": {"estadoNotificacion": estado}})
            ok("Notificación", f"Exp {exp_idx+1} — {tipo} ({estado})")

# ─────────────────────────────────────────────────────────────
# 29. SOLICITUDES DE ACTUALIZACIÓN
# ─────────────────────────────────────────────────────────────
print("\n📌 Creando solicitudes de actualización...")

solicitudes_data = [
    (usuarios_ids["lquispe"],    "IANUS-2024-001", "SC-SAL-01", "Solicitud de sincronización con sistema IANUS"),
    (usuarios_ids["dfernandez"], "IANUS-2024-002", "SC-SAL-02", "Actualización de datos de expediente 007/2024"),
    (usuarios_ids["gtorrez"],    "IANUS-2025-001", "SC-SAL-03", "Corrección de número de expediente en IANUS"),
]

for id_usr, codigo_ianus, codigo_sala, obs in solicitudes_data:
    r = gql("""
    mutation($idUsuario: Int!, $codigoIanus: String!, $codigoSala: String!, $observacion: String) {
      crearSolicitud(idUsuario: $idUsuario, codigoIanus: $codigoIanus, codigoSala: $codigoSala, observacion: $observacion) {
        solicitud { idSolicitud estadoSolicitud }
      }
    }""", {"idUsuario": id_usr, "codigoIanus": codigo_ianus,
           "codigoSala": codigo_sala, "observacion": obs})
    if r:
        ok("Solicitud", codigo_ianus)

# ─────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("🎉 SEED COMPLETADO EXITOSAMENTE")
print("="*60)
print(f"  Roles:            {len(roles_ids)}")
print(f"  Permisos:         {len(permisos_ids)}")
print(f"  Usuarios:         {len(usuarios_ids)}")
print(f"  Tribunales:       {len(tribunales_ids)}")
print(f"  Salas Tribunal:   {len(salas_ids)}")
print(f"  Salas Audiencia:  {len(salas_aud_ids)}")
print(f"  Tipos Proceso:    {len(tipos_proceso_ids)}")
print(f"  Estados:          {len(estados_ids)}")
print(f"  Personas:         {len(personas_ids)}")
print(f"  Vocales:          {len(vocales_ids)}")
print(f"  Expedientes:      {len(expedientes_ids)}")
print(f"  Partes:           {len(partes_ids)}")
print(f"  Documentos:       {len(documentos_ids)}")
print(f"  Audiencias:       {len(audiencias_ids)}")
print(f"  Resoluciones:     {len(resoluciones_ids)}")
print(f"  Actuaciones:      {len(actuaciones_ids)}")
print(f"  Notificaciones:   6")
print(f"  Solicitudes:      3")
print("="*60)