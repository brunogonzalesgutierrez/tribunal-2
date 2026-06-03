"""
=============================================================
  SCRIPT POBLADOR MASIVO — Sistema de Gestión Judicial
  Bolivia · Datos ultra-realistas y completamente relacionados
  Versión 2.0 — Corregido y ampliado
  Ejecutar: python poblar_db.py
=============================================================
"""

import os
import django
import random
from datetime import date, datetime, timedelta
from django.utils import timezone
from django.contrib.auth.hashers import make_password

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from tribunal.models import (
    Rol, Permiso, RolPermiso,
    Usuario, Tribunal, SalaTribunal, SalaAudiencia,
    Persona, ContactoPersona, VocalTribunal,
    TipoProceso, EstadoExpediente, TipoAudiencia,
    TipoDoc, TipoRecurso, TipoResolucion, TipoActuacion, RolProcesal,
    Expediente, ConformacionSalaExpediente, HistorialEstado,
    ParteProcesal, Audiencia, ActaAudiencia, AsistenciaAudiencia,
    Documento, Resolucion, Recurso, ActuacionProcesal,
    Notificacion, SolicitudActualizacion,
)

print("\n" + "="*65)
print("   POBLADOR MASIVO v2.0 — SISTEMA DE GESTIÓN JUDICIAL BOLIVIA")
print("="*65)

# ─────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────
HOY   = date.today()
AHORA = timezone.now()

def fd(inicio, fin):
    d = (fin - inicio).days
    return inicio + timedelta(days=random.randint(0, max(d, 0)))

def dtc(d, hora=9, minuto=0):
    return timezone.make_aware(datetime(d.year, d.month, d.day, hora, minuto))

def nombre_completo(p):
    return f"{p.nombre} {p.primer_apellido} {p.segundo_apellido or ''}".strip()

def pick(lst):
    return random.choice(lst)

def picks(lst, n):
    return random.sample(lst, min(n, len(lst)))

def num_exp_unico(numero, anio, usados):
    """Garantiza que el número de expediente sea único."""
    base = numero
    sufijo = 0
    while (base if sufijo == 0 else f"{base}-{sufijo}") in usados:
        sufijo += 1
    resultado = base if sufijo == 0 else f"{base}-{sufijo}"
    usados.add(resultado)
    return resultado

numeros_usados = set()

# ─────────────────────────────────────────────────────────────
# LIMPIAR DATOS ANTERIORES (orden inverso de FK)
# ─────────────────────────────────────────────────────────────
print("\n[0] Limpiando datos anteriores...")
SolicitudActualizacion.objects.all().delete()
Notificacion.objects.all().delete()
AsistenciaAudiencia.objects.all().delete()
ActaAudiencia.objects.all().delete()
ActuacionProcesal.objects.all().delete()
Recurso.objects.all().delete()
Resolucion.objects.all().delete()
Documento.objects.all().delete()
HistorialEstado.objects.all().delete()
ConformacionSalaExpediente.objects.all().delete()
ParteProcesal.objects.all().delete()
Audiencia.objects.all().delete()
Expediente.objects.all().delete()
VocalTribunal.objects.all().delete()
ContactoPersona.objects.all().delete()
Persona.objects.all().delete()
Usuario.objects.all().delete()
RolPermiso.objects.all().delete()
SalaAudiencia.objects.all().delete()
SalaTribunal.objects.all().delete()
Tribunal.objects.all().delete()
TipoAudiencia.objects.all().delete()
TipoActuacion.objects.all().delete()
TipoResolucion.objects.all().delete()
TipoRecurso.objects.all().delete()
TipoDoc.objects.all().delete()
RolProcesal.objects.all().delete()
EstadoExpediente.objects.all().delete()
TipoProceso.objects.all().delete()
Permiso.objects.all().delete()
Rol.objects.all().delete()
print("  ✓ Base de datos limpia")

# ─────────────────────────────────────────────────────────────
# 1. ROLES Y PERMISOS
# ─────────────────────────────────────────────────────────────
print("\n[1] Roles y permisos...")

roles_obj = {}
for nombre, desc in [
    ("Administrador",  "Acceso total al sistema"),
    ("Vocal",          "Magistrado o vocal del tribunal"),
    ("Secretario",     "Secretario de sala"),
    ("Auxiliar",       "Auxiliar judicial"),
    ("Consulta",       "Solo lectura"),
]:
    roles_obj[nombre] = Rol.objects.create(nombre=nombre, descripcion=desc, activo=True)

permisos_def = [
    ("EXP_VER","Ver expedientes","EXPEDIENTES"),
    ("EXP_CREAR","Crear expedientes","EXPEDIENTES"),
    ("EXP_EDITAR","Editar expedientes","EXPEDIENTES"),
    ("EXP_ELIMINAR","Eliminar expedientes","EXPEDIENTES"),
    ("AUD_VER","Ver audiencias","AUDIENCIAS"),
    ("AUD_CREAR","Crear audiencias","AUDIENCIAS"),
    ("AUD_EDITAR","Editar audiencias","AUDIENCIAS"),
    ("AUD_ELIMINAR","Eliminar audiencias","AUDIENCIAS"),
    ("RES_VER","Ver resoluciones","RESOLUCIONES"),
    ("RES_CREAR","Crear resoluciones","RESOLUCIONES"),
    ("RES_EDITAR","Editar resoluciones","RESOLUCIONES"),
    ("DOC_VER","Ver documentos","DOCUMENTOS"),
    ("DOC_SUBIR","Subir documentos","DOCUMENTOS"),
    ("PER_VER","Ver personas","PERSONAS"),
    ("PER_CREAR","Crear personas","PERSONAS"),
    ("PER_EDITAR","Editar personas","PERSONAS"),
    ("USR_VER","Ver usuarios","USUARIOS"),
    ("USR_CREAR","Crear usuarios","USUARIOS"),
    ("USR_EDITAR","Editar usuarios","USUARIOS"),
    ("USR_ELIMINAR","Eliminar usuarios","USUARIOS"),
    ("REP_VER","Ver reportes","REPORTES"),
    ("REP_ENVIAR","Enviar reportes","REPORTES"),
    ("REC_VER","Ver recursos","RECURSOS"),
    ("REC_CREAR","Crear recursos","RECURSOS"),
    ("NOT_VER","Ver notificaciones","NOTIFICACIONES"),
    ("NOT_CREAR","Crear notificaciones","NOTIFICACIONES"),
]
permisos_obj = {}
for cod, nom, mod in permisos_def:
    permisos_obj[cod] = Permiso.objects.create(nombre=nom, codigo=cod, modulo=mod)

perms_por_rol = {
    "Administrador": list(permisos_obj.values()),
    "Vocal":         [permisos_obj[c] for c in ["EXP_VER","AUD_VER","RES_VER","RES_CREAR","RES_EDITAR","DOC_VER","PER_VER","REP_VER","REC_VER","NOT_VER"]],
    "Secretario":    [permisos_obj[c] for c in ["EXP_VER","EXP_CREAR","EXP_EDITAR","AUD_VER","AUD_CREAR","AUD_EDITAR","RES_VER","DOC_VER","DOC_SUBIR","PER_VER","PER_CREAR","REP_VER","NOT_VER","NOT_CREAR","REC_VER"]],
    "Auxiliar":      [permisos_obj[c] for c in ["EXP_VER","AUD_VER","DOC_VER","DOC_SUBIR","PER_VER","NOT_VER"]],
    "Consulta":      [permisos_obj[c] for c in ["EXP_VER","AUD_VER","DOC_VER","PER_VER"]],
}
for rol_nombre, lista in perms_por_rol.items():
    for p in lista:
        RolPermiso.objects.create(rol=roles_obj[rol_nombre], permiso=p)

print(f"  ✓ {Rol.objects.count()} roles | {Permiso.objects.count()} permisos")

# ─────────────────────────────────────────────────────────────
# 2. CATÁLOGOS
# ─────────────────────────────────────────────────────────────
print("\n[2] Catálogos...")

tipos_proceso_obj = {}
for cod, nom in [
    ("CIV-ORD","Civil Ordinario"),
    ("CIV-EJE","Civil Ejecutivo"),
    ("CIV-EXP","Civil Expedito"),
    ("PEN-ORD","Penal Ordinario"),
    ("PEN-ABR","Penal Abreviado"),
    ("PEN-EXP","Penal Expedito"),
    ("FAM-ORD","Familiar Ordinario"),
    ("FAM-EJE","Familiar Ejecutivo"),
    ("AGR-ORD","Agroambiental Ordinario"),
    ("AGR-CAU","Agroambiental Cautelar"),
    ("CON-AMP","Constitucional - Amparo"),
    ("CON-HAB","Constitucional - Hábeas Corpus"),
    ("LAB-ORD","Laboral Ordinario"),
    ("LAB-REI","Laboral Reincorporación"),
    ("COM-ORD","Comercial Ordinario"),
]:
    tipos_proceso_obj[cod] = TipoProceso.objects.create(nombre=nom, codigo=cod)

estados_exp_obj = {}
for nom, terminal in [
    ("ADMITIDO",False),
    ("EN TRÁMITE",False),
    ("EN RECURSO",False),
    ("PARA SENTENCIA",False),
    ("SENTENCIADO",True),
    ("ARCHIVADO",True),
    ("SUSPENDIDO",False),
    ("EN EJECUCIÓN",False),
    ("CONCLUIDO",True),
    ("RECHAZADO",True),
]:
    estados_exp_obj[nom] = EstadoExpediente.objects.create(nombre_estado=nom, es_terminal=terminal)

tipos_res_obj = {}
for cod, nom, nivel, desc in [
    ("AUTO","Auto Interlocutorio",1,"Resolución de tramitación"),
    ("SENT","Sentencia",3,"Resolución definitiva de fondo"),
    ("AUTOS","Auto Supremo",4,"Resolución de máxima instancia"),
    ("RES","Resolución",2,"Resolución en general"),
    ("DECR","Decreto",1,"Proveído de mero trámite"),
    ("AIMT","Auto de Vista",2,"Resolución de segunda instancia"),
    ("AIMT2","Auto de Vista Confirmatorio",2,"Confirma la resolución de primera instancia"),
]:
    tipos_res_obj[cod] = TipoResolucion.objects.create(codigo=cod, nombre=nom, nivel_jerarquico=nivel, descripcion=desc)

tipos_recurso_lst = []
for nom, desc in [
    ("Apelación","Recurso de apelación contra resoluciones de primera instancia"),
    ("Casación","Recurso de casación ante el Tribunal Supremo de Justicia"),
    ("Reposición","Recurso de reposición en la misma instancia"),
    ("Compulsa","Recurso de compulsa por retardo de justicia"),
    ("Nulidad","Recurso de nulidad procesal por vicios de forma"),
]:
    tipos_recurso_lst.append(TipoRecurso.objects.create(nombre=nom, descripcion=desc))

tipos_doc_obj = {}
for cod, nom, firma, pub in [
    ("DDA","Demanda",False,True),
    ("RESP","Respuesta a la demanda",False,True),
    ("MEM","Memorial",False,True),
    ("PRUE","Prueba documental",False,True),
    ("NOTA","Nota de apersonamiento",False,True),
    ("CERT","Certificación",True,True),
    ("SENT_D","Sentencia (documento)",True,True),
    ("POD","Poder notarial",False,True),
    ("PER","Pericia técnica",False,False),
    ("EXCEP","Excepción procesal",False,True),
    ("CONV","Convenio o acuerdo",True,True),
    ("OPOS","Oposición",False,True),
    ("CONS","Constancia",True,True),
    ("INF","Informe técnico",False,False),
    ("RECON","Demanda reconvencional",False,True),
    ("AMP","Ampliación de demanda",False,True),
    ("DECL","Declaración jurada",True,False),
    ("TITU","Título de propiedad",True,True),
    ("CONT","Contrato",False,True),
    ("FACT","Factura o recibo",False,True),
]:
    tipos_doc_obj[cod] = TipoDoc.objects.create(codigo=cod, nombre=nom, requiere_firma=firma, es_publico=pub)

tipos_actuacion_lst = []
for cod, nom in [
    ("PROV","Providencia"),
    ("NOTA","Nota de proveído"),
    ("CITA","Cédula de citación"),
    ("NOTI","Cédula de notificación"),
    ("DILIG","Diligencia"),
    ("EMPL","Emplazamiento"),
    ("INF","Informe"),
    ("OFIC","Oficio"),
    ("EXHOR","Exhorto"),
    ("CERT_A","Certificación actuarial"),
    ("COMP","Comparendo"),
    ("TRAB","Trabamiento de embargo"),
    ("SECU","Secuestro"),
    ("DESG","Desglose de documentos"),
    ("INSP","Inspección ocular"),
    ("CONS","Constancia de notificación"),
]:
    tipos_actuacion_lst.append(TipoActuacion.objects.create(codigo=cod, nombre=nom))

roles_procesales_obj = {}
for nom in [
    "Demandante","Demandado","Tercero Interesado",
    "Querellante","Imputado","Víctima",
    "Abogado Defensor","Abogado de la Parte Actora","Abogado del Tercero",
    "Fiscal","Perito","Testigo","Representante Legal","Curador Ad Litem",
    "Codemandante","Codemandado",
]:
    roles_procesales_obj[nom] = RolProcesal.objects.create(nombre_rol=nom)

tipos_aud_lst = []
for nom, tp_cod, dur in [
    ("Audiencia Preliminar","CIV-ORD",60),
    ("Audiencia de Juicio Oral Civil","CIV-ORD",180),
    ("Audiencia Conciliatoria","CIV-ORD",90),
    ("Audiencia de Medidas Cautelares Civil","CIV-ORD",60),
    ("Audiencia de Ejecución","CIV-EJE",45),
    ("Audiencia Cautelar Penal","PEN-ORD",60),
    ("Audiencia de Juicio Oral Penal","PEN-ORD",240),
    ("Audiencia de Aplicación de Medidas Coercitivas","PEN-ORD",90),
    ("Audiencia de Cesación a la Detención","PEN-ORD",60),
    ("Audiencia de Procedimiento Abreviado","PEN-ABR",120),
    ("Audiencia Familiar Preliminar","FAM-ORD",60),
    ("Audiencia de Conciliación Familiar","FAM-ORD",90),
    ("Audiencia de Juicio Familiar","FAM-ORD",150),
    ("Audiencia Agroambiental","AGR-ORD",120),
    ("Audiencia de Acción de Amparo","CON-AMP",60),
    ("Audiencia de Hábeas Corpus","CON-HAB",60),
    ("Audiencia Laboral Preliminar","LAB-ORD",60),
    ("Audiencia de Juicio Laboral","LAB-ORD",120),
    ("Audiencia de Reincorporación","LAB-REI",45),
    ("Audiencia Comercial","COM-ORD",90),
    ("Audiencia de Producción de Prueba","CIV-ORD",120),
    ("Audiencia de Alegatos","CIV-ORD",90),
    ("Audiencia de Inspección Ocular","AGR-ORD",180),
    ("Audiencia de Peritaje","CIV-ORD",90),
    ("Audiencia Extraordinaria","PEN-ORD",60),
]:
    tipos_aud_lst.append(
        TipoAudiencia.objects.create(
            nombre=nom,
            duracion_estimada=dur,
            id_tipo_proceso=tipos_proceso_obj[tp_cod]
        )
    )

print("  ✓ Catálogos completos")

# ─────────────────────────────────────────────────────────────
# 3. TRIBUNALES Y SALAS
# ─────────────────────────────────────────────────────────────
print("\n[3] Tribunales y salas...")

tribunales_data = [
    ("Tribunal Departamental de Justicia de Santa Cruz",   "DEPARTAMENTAL",    "Ley 025 Art. 58 - DS 29894"),
    ("Tribunal Departamental de Justicia de La Paz",       "DEPARTAMENTAL",    "Ley 025 Art. 58 - DS 29894"),
    ("Tribunal Departamental de Justicia de Cochabamba",   "DEPARTAMENTAL",    "Ley 025 Art. 58 - DS 29894"),
    ("Tribunal Departamental de Justicia de Oruro",        "DEPARTAMENTAL",    "Ley 025 Art. 58 - DS 29894"),
    ("Tribunal Agroambiental de Santa Cruz",               "ESPECIALIZADO",    "Ley 025 Art. 185 - Ley 1715"),
    ("Tribunal de Sentencia N° 1 de Santa Cruz",           "PRIMERA_INSTANCIA","CPP Art. 52 - Ley 1970"),
    ("Tribunal de Sentencia N° 2 de Santa Cruz",           "PRIMERA_INSTANCIA","CPP Art. 52 - Ley 1970"),
    ("Tribunal de Sentencia N° 1 de La Paz",               "PRIMERA_INSTANCIA","CPP Art. 52 - Ley 1970"),
    ("Tribunal Departamental de Justicia de Potosí",       "DEPARTAMENTAL",    "Ley 025 Art. 58 - DS 29894"),
    ("Tribunal Departamental de Justicia de Chuquisaca",   "DEPARTAMENTAL",    "Ley 025 Art. 58 - DS 29894"),
]
tribunales = [Tribunal.objects.create(nombre_tribunal=n, instancia=i, norma_creacion=nr) for n, i, nr in tribunales_data]

salas_tribunal = []
config_salas = {
    0: ["Sala Civil Comercial Primera","Sala Civil Comercial Segunda","Sala Penal Primera","Sala Penal Segunda","Sala Familiar Primera","Sala Familiar Segunda","Sala Constitucional"],
    1: ["Sala Civil Primera","Sala Civil Segunda","Sala Penal Primera","Sala Familiar","Sala Laboral"],
    2: ["Sala Civil Primera","Sala Penal Primera","Sala Familiar","Sala Laboral"],
    3: ["Sala Civil Primera","Sala Penal Primera"],
    4: ["Sala Agroambiental Primera","Sala Agroambiental Segunda"],
    5: ["Sala de Juicio Oral I"],
    6: ["Sala de Juicio Oral II"],
    7: ["Sala de Juicio Oral LP-I"],
    8: ["Sala Civil Primera","Sala Penal Primera"],
    9: ["Sala Civil Primera","Sala Familiar"],
}
for idx, nombres in config_salas.items():
    for nom in nombres:
        salas_tribunal.append(SalaTribunal.objects.create(id_tribunal=tribunales[idx], nombre_sala=nom, activa=True))

salas_aud = []
salas_aud_config = [
    (0,"Sala A-101",30,True,"https://meet.jit.si/TDJ-SCZ-A101"),
    (0,"Sala A-102",25,True,"https://meet.jit.si/TDJ-SCZ-A102"),
    (0,"Sala A-103",20,True,"https://meet.jit.si/TDJ-SCZ-A103"),
    (0,"Sala B-201",20,False,None),
    (0,"Sala B-202",15,False,None),
    (0,"Sala B-203",15,False,None),
    (1,"Sala LP-01",30,True,"https://meet.jit.si/TDJ-LPZ-01"),
    (1,"Sala LP-02",25,True,"https://meet.jit.si/TDJ-LPZ-02"),
    (1,"Sala LP-03",20,False,None),
    (2,"Sala CBBA-1",25,True,"https://meet.jit.si/TDJ-CBBA-1"),
    (2,"Sala CBBA-2",20,False,None),
    (3,"Sala ORU-1",20,True,"https://meet.jit.si/TDJ-ORU-1"),
    (4,"Sala Agro-I",20,True,"https://meet.jit.si/TAA-SCZ-1"),
    (4,"Sala Agro-II",20,False,None),
    (5,"Sala Juicio Oral N°1",50,True,"https://meet.jit.si/TSN1-SCZ-1"),
    (5,"Sala Juicio Oral N°2",50,False,None),
    (6,"Sala Juicio Oral N°3",50,True,"https://meet.jit.si/TSN2-SCZ-1"),
    (7,"Sala Juicio Oral LP-1",50,True,"https://meet.jit.si/TSN-LPZ-1"),
    (8,"Sala POT-1",20,True,"https://meet.jit.si/TDJ-POT-1"),
    (9,"Sala CHQ-1",20,True,"https://meet.jit.si/TDJ-CHQ-1"),
]
for trib_idx, nom, cap, vid, enlace in salas_aud_config:
    salas_aud.append(SalaAudiencia.objects.create(
        id_tribunal=tribunales[trib_idx], nombre_sala=nom,
        capacidad=cap, equipada_videoconf=vid, enlace_virtual=enlace, activa=True
    ))

print(f"  ✓ {len(tribunales)} tribunales | {len(salas_tribunal)} salas tribunal | {len(salas_aud)} salas audiencia")

# ─────────────────────────────────────────────────────────────
# 4. PERSONAS
# ─────────────────────────────────────────────────────────────
print("\n[4] Personas...")

personas_magistrados = [
    ("3100001","Roberto","Salazar","Pedraza","MAGISTRATURA","MAG-001",False,None),
    ("3100002","Carmen","Villanueva","Quispe","MAGISTRATURA","MAG-002",False,None),
    ("3100003","Eduardo","Montaño","Flores","MAGISTRATURA","MAG-003",False,None),
    ("3100004","Lucía","Pardo","Herrera","MAGISTRATURA","MAG-004",False,None),
    ("3100005","Marcelo","Gutiérrez","Cabrera","MAGISTRATURA","MAG-005",False,None),
    ("3100006","Patricia","Rojas","Alvarado","MAGISTRATURA","MAG-006",False,None),
    ("3100007","Fernando","Medina","Cruz","MAGISTRATURA","MAG-007",False,None),
    ("3100008","Gloria","Suárez","Mamani","MAGISTRATURA","MAG-008",False,None),
    ("3100009","Arturo","Chávez","Vásquez","MAGISTRATURA","MAG-009",False,None),
    ("3100010","Miriam","Torrico","Apaza","MAGISTRATURA","MAG-010",False,None),
    ("3100011","Gonzalo","Vallejos","Soria","MAGISTRATURA","MAG-011",False,None),
    ("3100012","Ximena","Bustamante","Ramos","MAGISTRATURA","MAG-012",False,None),
    ("3100013","José","Quispe","Villca","MAGISTRATURA","MAG-013",False,None),
    ("3100014","Rosa","Calderón","Aguilar","MAGISTRATURA","MAG-014",False,None),
    ("3100015","Hernán","Barrios","Sandoval","MAGISTRATURA","MAG-015",False,None),
    ("3100016","Silvia","Antezana","Vera","MAGISTRATURA","MAG-016",False,None),
]

personas_abogados = [
    ("2200001","Ana","Rodríguez","Méndez","ABOGACÍA","CAB-101",True,"CAB-101"),
    ("2200002","Carlos","Mamani","Choque","ABOGACÍA","CAB-102",True,"CAB-102"),
    ("2200003","Sofía","Torrico","Aguirre","ABOGACÍA","CAB-103",True,"CAB-103"),
    ("2200004","Diego","Vargas","Espinoza","ABOGACÍA","CAB-104",True,"CAB-104"),
    ("2200005","Patricia","Condori","Mamani","ABOGACÍA","CAB-105",True,"CAB-105"),
    ("2200006","Juan","Ticona","Apaza","ABOGACÍA","CAB-106",True,"CAB-106"),
    ("2200007","Verónica","Sánchez","Quiroga","ABOGACÍA","CAB-107",True,"CAB-107"),
    ("2200008","Ricardo","Flores","Crespo","ABOGACÍA","CAB-108",True,"CAB-108"),
    ("2200009","Natalia","Arce","Soliz","ABOGACÍA","CAB-109",True,"CAB-109"),
    ("2200010","Mauricio","Blanco","Ortega","ABOGACÍA","CAB-110",True,"CAB-110"),
    ("2200011","Sandra","Chávez","Orellana","ABOGACÍA","CAB-111",True,"CAB-111"),
    ("2200012","Hugo","Lima","Ponce","ABOGACÍA","CAB-112",True,"CAB-112"),
    ("2200013","Elena","Morales","Vega","ABOGACÍA","CAB-113",True,"CAB-113"),
    ("2200014","Andrés","Pereira","Ríos","ABOGACÍA","CAB-114",True,"CAB-114"),
    ("2200015","Carla","Montoya","Díaz","ABOGACÍA","CAB-115",True,"CAB-115"),
    ("2200016","Boris","Zárate","Fuentes","ABOGACÍA","CAB-116",True,"CAB-116"),
    ("2200017","Fernanda","Ibáñez","Leal","ABOGACÍA","CAB-117",True,"CAB-117"),
    ("2200018","Álvaro","Solares","Cano","ABOGACÍA","CAB-118",True,"CAB-118"),
    ("2200019","Ingrid","Paz","Terán","ABOGACÍA","CAB-119",True,"CAB-119"),
    ("2200020","Raúl","Espinoza","Hinojosa","ABOGACÍA","CAB-120",True,"CAB-120"),
]

personas_partes = [
    # Civiles
    ("5500001","Miguel","Reyes","Soto","CIVIL",None,False,None),
    ("5500002","Valeria","Castro","Rojas","CIVIL",None,False,None),
    ("5500003","Fernando","López","Morales","CIVIL",None,False,None),
    ("5500004","Gabriela","Ponce","Aliaga","CIVIL",None,False,None),
    ("5500005","Ricardo","Suárez","Vela","CIVIL",None,False,None),
    ("5500006","Natalia","Flores","Crespo","CIVIL",None,False,None),
    ("5500007","Javier","Arce","Soliz","CIVIL",None,False,None),
    ("5500008","Claudia","Mendoza","Tito","CIVIL",None,False,None),
    ("5500009","Hugo","Blanco","Ramos","CIVIL",None,False,None),
    ("5500010","Sandra","Chávez","Orellana","CIVIL",None,False,None),
    ("5500011","Marco","Jiménez","Paz","CIVIL",None,False,None),
    ("5500012","Alejandra","Quispe","Nina","CIVIL",None,False,None),
    ("5500013","Daniel","Mamani","Calle","CIVIL",None,False,None),
    ("5500014","Lorena","Cárdenas","Ibáñez","CIVIL",None,False,None),
    ("5500015","Sergio","Romero","Loza","CIVIL",None,False,None),
    ("5500016","Mónica","Vásquez","Calvo","CIVIL",None,False,None),
    ("5500017","Cristian","Alvarado","Mita","CIVIL",None,False,None),
    ("5500018","Susana","Navia","Terán","CIVIL",None,False,None),
    # Penales
    ("5500019","Pablo","Espada","Corrales","PENAL",None,False,None),
    ("5500020","Miriam","Antezana","Solares","PENAL",None,False,None),
    ("5500021","Iván","Durán","Becerra","PENAL",None,False,None),
    ("5500022","Rosa","Camacho","Peredo","PENAL",None,False,None),
    ("5500023","Alfredo","Salinas","Molina","PENAL",None,False,None),
    ("5500024","Beatriz","Guzmán","Zárate","PENAL",None,False,None),
    ("5500025","Nicolás","Tórrez","Arandia","PENAL",None,False,None),
    ("5500026","Violeta","Callisaya","Mamani","PENAL",None,False,None),
    ("5500027","Ernesto","Yujra","Quispe","PENAL",None,False,None),
    ("5500028","Felipa","Chura","Limachi","PENAL",None,False,None),
    # Familiares
    ("5500029","Omar","Cabrera","Salazar","FAMILIAR",None,False,None),
    ("5500030","Roxana","Delgado","Pinto","FAMILIAR",None,False,None),
    ("5500031","Jhonny","Mercado","Rocha","FAMILIAR",None,False,None),
    ("5500032","Paola","Laime","Condori","FAMILIAR",None,False,None),
    ("5500033","Edwin","Cortez","Mamani","FAMILIAR",None,False,None),
    ("5500034","Carmen","Ticona","Huanca","FAMILIAR",None,False,None),
    # Agrarios
    ("5500035","Dionicio","Choque","Quispe","AGRARIO",None,False,None),
    ("5500036","Agustina","Mamani","Lima","AGRARIO",None,False,None),
    ("5500037","Clemente","Guarachi","Apaza","AGRARIO",None,False,None),
    ("5500038","Domitila","Cruz","Condori","AGRARIO",None,False,None),
    # Laborales
    ("5500039","Willy","Soliz","Pedraza","LABORAL",None,False,None),
    ("5500040","Luciana","Ramos","Tapia","LABORAL",None,False,None),
    ("5500041","Jorge","Peñaranda","Herrera","LABORAL",None,False,None),
    ("5500042","Ana","Subieta","Flores","LABORAL",None,False,None),
    # Comerciales
    ("5500043","Sebastián","Quiroga","Céspedes","COMERCIAL",None,False,None),
    ("5500044","Verónica","Seoane","Aparicio","COMERCIAL",None,False,None),
]

personas_empresas = [
    ("NIT-1001-1","Constructora","Andina","S.R.L.","EMPRESA",None,False,None),
    ("NIT-1002-2","Importadora","del Sur","S.A.","EMPRESA",None,False,None),
    ("NIT-1003-3","Agropecuaria","Los Llanos","Ltda.","EMPRESA",None,False,None),
    ("NIT-1004-4","Transportes","Bolivariano","S.R.L.","EMPRESA",None,False,None),
    ("NIT-1005-5","Minera","Cerro Rico","S.A.","EMPRESA",None,False,None),
    ("NIT-1006-6","Banco","Nacional","S.A.","EMPRESA",None,False,None),
    ("NIT-1007-7","Distribuidora","Central","S.R.L.","EMPRESA",None,False,None),
    ("NIT-1008-8","Inmobiliaria","Santa Cruz","S.A.","EMPRESA",None,False,None),
    ("NIT-1009-9","Telecomunicaciones","Andes","S.A.","EMPRESA",None,False,None),
    ("NIT-1010-0","Cooperativa","Minera","Boliviana Ltda.","EMPRESA",None,False,None),
]

personas_secretarios = [
    ("4400001","Verónica","Soto","Cárdenas","SECRETARIADO",None,False,None),
    ("4400002","Mario","Quispe","Flores","SECRETARIADO",None,False,None),
    ("4400003","Diana","Romero","Paz","SECRETARIADO",None,False,None),
    ("4400004","Álvaro","Medrano","Tapia","SECRETARIADO",None,False,None),
    ("4400005","Cecilia","Vargas","Cano","SECRETARIADO",None,False,None),
    ("4400006","Luis","Choque","Mamani","SECRETARIADO",None,False,None),
    ("4400007","Rebeca","Pérez","Alcócer","SECRETARIADO",None,False,None),
    ("4400008","Freddy","Solíz","Torrez","SECRETARIADO",None,False,None),
]

todas_personas_data = (personas_magistrados + personas_abogados + personas_partes +
                       personas_empresas + personas_secretarios)

personas = []
for ci, nom, ap1, ap2, est, reg, es_abog, tit in todas_personas_data:
    p = Persona.objects.create(
        numero_documento=ci, nombre=nom, primer_apellido=ap1,
        segundo_apellido=ap2, estamento=est,
        registro_universitario=reg, es_abogado=es_abog, titular_a=tit
    )
    personas.append(p)

p_magistrados  = personas[0:16]
p_abogados     = personas[16:36]
p_partes       = personas[36:80]
p_empresas     = personas[80:90]
p_secretarios  = personas[90:98]

# Contactos
emails_mag  = [f"magistrado{i+1}@tjd.bo" for i in range(16)]
emails_abg  = [
    "ana.rodriguez@estudiolegalbv.bo","carlos.mamani@mamanilaw.bo",
    "sofia.torrico@torricoyasoc.bo","diego.vargas@vargasabogados.bo",
    "patricia.condori@condorilaw.bo","juan.ticona@ticonaasoc.bo",
    "veronica.sanchez@sanchezjuridico.bo","ricardo.flores@floreslaw.bo",
    "natalia.arce@arcelegal.bo","mauricio.blanco@blancoasoc.bo",
    "sandra.chavez@chavezlaw.bo","hugo.lima@limadefensores.bo",
    "elena.morales@moralesestudio.bo","andres.pereira@pereibalaw.bo",
    "carla.montoya@montoyalegal.bo","boris.zarate@zaratelaw.bo",
    "fernanda.ibanez@ibanezasoc.bo","alvaro.solares@solaresdefensa.bo",
    "ingrid.paz@pazabogados.bo","raul.espinoza@espinozalaw.bo",
]
emails_partes = [f"parte{i+1}@correo.bo" for i in range(44)]
emails_emp    = [f"legal@empresa{i+1}.bo" for i in range(10)]
emails_sec    = [f"secretario{i+1}@tjd.bo" for i in range(8)]

todos_emails = emails_mag + emails_abg + emails_partes + emails_emp + emails_sec

for i, persona in enumerate(personas):
    email = todos_emails[i] if i < len(todos_emails) else f"persona{i}@correo.bo"
    ContactoPersona.objects.create(
        id_persona=persona, tipo_contacto="EMAIL", valor=email,
        es_principal=True, validado=(i < 50)
    )
    cel = f"7{random.randint(1000000,9999999)}"
    ContactoPersona.objects.create(
        id_persona=persona, tipo_contacto="CELULAR", valor=cel,
        es_principal=False, validado=False
    )
    if random.random() > 0.55:
        ContactoPersona.objects.create(
            id_persona=persona, tipo_contacto="TELEFONO",
            valor=f"3{random.randint(3000000,3999999)}", es_principal=False, validado=False
        )

print(f"  ✓ {len(personas)} personas | {ContactoPersona.objects.count()} contactos")

# ─────────────────────────────────────────────────────────────
# 5. USUARIOS DEL SISTEMA
# ─────────────────────────────────────────────────────────────
print("\n[5] Usuarios del sistema...")

usuarios = []

admin = Usuario.objects.create(
    nombres="Sistema", paterno="Administrador", documento_identidad="0000001",
    email="admin@tribunal.bo", username="admin",
    password=make_password("Admin123!"), rol=roles_obj["Administrador"],
    cargo_oficial="Administrador del Sistema", activo=True
)
usuarios.append(admin)

usuarios_def = [
    ("rsalazar",   "Roberto",  "Salazar",    "3100001","rsalazar@tjd.bo",   "Vocal1234!", "Vocal",      "Vocal del Tribunal",  p_magistrados[0]),
    ("cvillanueva","Carmen",   "Villanueva", "3100002","cvillanueva@tjd.bo","Vocal1234!", "Vocal",      "Vocal del Tribunal",  p_magistrados[1]),
    ("emontano",   "Eduardo",  "Montaño",    "3100003","emontano@tjd.bo",   "Vocal1234!", "Vocal",      "Vocal del Tribunal",  p_magistrados[2]),
    ("lpardo",     "Lucía",    "Pardo",      "3100004","lpardo@tjd.bo",     "Vocal1234!", "Vocal",      "Vocal del Tribunal",  p_magistrados[3]),
    ("mgutierrez", "Marcelo",  "Gutiérrez",  "3100005","mgutierrez@tjd.bo", "Vocal1234!", "Vocal",      "Vocal del Tribunal",  p_magistrados[4]),
    ("projas",     "Patricia", "Rojas",      "3100006","projas@tjd.bo",     "Vocal1234!", "Vocal",      "Vocal del Tribunal",  p_magistrados[5]),
    ("fmedina",    "Fernando", "Medina",     "3100007","fmedina@tjd.bo",    "Vocal1234!", "Vocal",      "Vocal del Tribunal",  p_magistrados[6]),
    ("gsuarez",    "Gloria",   "Suárez",     "3100008","gsuarez@tjd.bo",    "Vocal1234!", "Vocal",      "Vocal del Tribunal",  p_magistrados[7]),
    ("achavez",    "Arturo",   "Chávez",     "3100009","achavez@tjd.bo",    "Vocal1234!", "Vocal",      "Vocal del Tribunal",  p_magistrados[8]),
    ("mtorrico",   "Miriam",   "Torrico",    "3100010","mtorrico@tjd.bo",   "Vocal1234!", "Vocal",      "Vocal del Tribunal",  p_magistrados[9]),
    ("gvallejos",  "Gonzalo",  "Vallejos",   "3100011","gvallejos@tjd.bo",  "Vocal1234!", "Vocal",      "Vocal del Tribunal",  p_magistrados[10]),
    ("xbustamante","Ximena",   "Bustamante", "3100012","xbustamante@tjd.bo","Vocal1234!", "Vocal",      "Vocal del Tribunal",  p_magistrados[11]),
    ("vsoto",      "Verónica", "Soto",       "4400001","vsoto@tjd.bo",      "Secr1234!",  "Secretario", "Secretaria de Sala",  p_secretarios[0]),
    ("mquispe",    "Mario",    "Quispe",     "4400002","mquispe@tjd.bo",    "Secr1234!",  "Secretario", "Secretario de Sala",  p_secretarios[1]),
    ("dromero",    "Diana",    "Romero",     "4400003","dromero@tjd.bo",    "Secr1234!",  "Secretario", "Secretaria de Sala",  p_secretarios[2]),
    ("amedrano",   "Álvaro",   "Medrano",    "4400004","amedrano@tjd.bo",   "Secr1234!",  "Secretario", "Secretario de Sala",  p_secretarios[3]),
    ("rperez",     "Rebeca",   "Pérez",      "4400007","rperez@tjd.bo",     "Secr1234!",  "Secretario", "Secretaria de Sala",  p_secretarios[6]),
    ("fsoliz",     "Freddy",   "Solíz",      "4400008","fsoliz@tjd.bo",     "Secr1234!",  "Secretario", "Secretario de Sala",  p_secretarios[7]),
    ("aux01",      "Cecilia",  "Vargas",     "4400005","cvargas@tjd.bo",    "Aux12345!",  "Auxiliar",   "Auxiliar Judicial",   p_secretarios[4]),
    ("aux02",      "Luis",     "Choque",     "4400006","lchoque@tjd.bo",    "Aux12345!",  "Auxiliar",   "Auxiliar Judicial",   p_secretarios[5]),
    ("consulta01", "Visitante","Sistema",    "9900001","consulta@tjd.bo",   "Cons1234!",  "Consulta",   "Usuario de Consulta",  p_magistrados[15]),
]

vocales_usuarios   = []
secretarios_us     = []
auxiliares_us      = []

for uname, nombres, paterno, ci, email, pwd, rol_nom, cargo, persona in usuarios_def:
    u = Usuario.objects.create(
        nombres=nombres, paterno=paterno, documento_identidad=ci,
        email=email, username=uname, password=make_password(pwd),
        rol=roles_obj[rol_nom], cargo_oficial=cargo, activo=True
    )
    usuarios.append(u)
    if rol_nom == "Vocal":        vocales_usuarios.append((u, persona))
    elif rol_nom == "Secretario": secretarios_us.append(u)
    elif rol_nom == "Auxiliar":   auxiliares_us.append(u)

print(f"  ✓ {len(usuarios)} usuarios")

# ─────────────────────────────────────────────────────────────
# 6. VOCALES DEL TRIBUNAL
# ─────────────────────────────────────────────────────────────
print("\n[6] Vocales del tribunal...")

vocales = []
vocales_config = [
    (0,  0,  "Vocal Titular",  date(2020,1,15),  None,             True),
    (1,  0,  "Vocal Titular",  date(2019,3,10),  None,             True),
    (2,  1,  "Vocal Titular",  date(2021,6,1),   None,             True),
    (3,  2,  "Vocal Titular",  date(2018,8,20),  None,             True),
    (4,  3,  "Vocal Titular",  date(2022,2,5),   None,             True),
    (5,  4,  "Vocal Titular",  date(2020,11,1),  None,             True),
    (6,  7,  "Vocal Titular",  date(2021,4,15),  None,             True),
    (7,  8,  "Vocal Titular",  date(2019,9,20),  None,             True),
    (8,  9,  "Vocal Titular",  date(2023,1,10),  None,             True),
    (9,  10, "Vocal Titular",  date(2022,5,5),   None,             True),
    (10, 11, "Vocal Titular",  date(2021,8,1),   None,             True),
    (11, 12, "Vocal Titular",  date(2023,3,15),  None,             True),
    # Ex-vocales
    (0,  5,  "Vocal Interino", date(2017,1,1),   date(2019,12,31), False),
    (2,  6,  "Vocal Interino", date(2018,6,1),   date(2021,5,31),  False),
    (3,  13, "Vocal Interino", date(2017,3,1),   date(2018,8,15),  False),
]

for uv_idx, sala_idx, cargo, f_pos, f_conc, activo in vocales_config:
    u, persona = vocales_usuarios[uv_idx]
    sala = salas_tribunal[sala_idx] if sala_idx < len(salas_tribunal) else salas_tribunal[0]
    v = VocalTribunal.objects.create(
        id_persona=persona, id_sala=sala, cargo=cargo,
        fecha_posesion=f_pos, fecha_conclusion=f_conc, activo=activo, usuario=u
    )
    vocales.append(v)

vocales_activos = [v for v in vocales if v.activo]
print(f"  ✓ {len(vocales)} vocales ({len(vocales_activos)} activos)")

# ─────────────────────────────────────────────────────────────
# 7. EXPEDIENTES (70 expedientes, 2021-2025)
#    NOTA: números únicos garantizados con sufijos por año
# ─────────────────────────────────────────────────────────────
print("\n[7] Expedientes...")

# (numero, anio, sala_trib_idx, tp_cod, estado, descripcion)
expedientes_def = [
    # ── CIVIL ORDINARIO ──
    ("0001/2021",2021,0,"CIV-ORD","ARCHIVADO","Proceso ordinario de nulidad de contrato de compraventa sobre lote de terreno en el Plan 3000"),
    ("0045/2021",2021,0,"CIV-ORD","SENTENCIADO","Demanda de reconocimiento de unión libre y división de bienes gananciales adquiridos entre 2015-2021"),
    ("0123/2021",2021,1,"CIV-ORD","EN EJECUCIÓN","Usucapión decenal de bien inmueble urbano en la urbanización Los Lotes, Santa Cruz"),
    ("0201/2021",2021,1,"CIV-ORD","SENTENCIADO","Proceso ordinario por daños y perjuicios derivados de incumplimiento de contrato de obra"),
    ("0001/2022",2022,0,"CIV-ORD","SENTENCIADO","Proceso ordinario de nulidad de contrato de compraventa por vicios del consentimiento"),
    ("0045/2022",2022,0,"CIV-ORD","ARCHIVADO","Demanda de mejor derecho propietario sobre inmueble en el Barrio Equipetrol Norte"),
    ("0123/2022",2022,1,"CIV-ORD","SENTENCIADO","Usucapión quinquenal de bien inmueble urbano en la ciudad de Santa Cruz de la Sierra"),
    ("0201/2022",2022,1,"CIV-ORD","EN EJECUCIÓN","Proceso ordinario por daños y perjuicios derivados de incumplimiento contractual de construcción"),
    ("0067/2023",2023,0,"CIV-ORD","EN TRÁMITE","Demanda ordinaria de petición de herencia entre coherederos de la sucesión Vargas Condori"),
    ("0089/2023",2023,0,"CIV-ORD","PARA SENTENCIA","Proceso de nulidad de hipoteca por simulación absoluta y falta de causa"),
    ("0145/2023",2023,1,"CIV-ORD","EN TRÁMITE","Usucapión quinquenal sobre bien inmueble rústico en la localidad de Portachuelo"),
    ("0178/2023",2023,1,"CIV-ORD","ADMITIDO","Demanda ordinaria por incumplimiento de contrato de construcción de vivienda social"),
    ("0034/2024",2024,0,"CIV-ORD","EN TRÁMITE","Proceso ordinario de mejor derecho propietario sobre lote de terreno en urbanización nueva"),
    ("0056/2024",2024,1,"CIV-ORD","ADMITIDO","Demanda ordinaria de resolución de contrato de arrendamiento por falta de pago"),
    ("0078/2024",2024,0,"CIV-ORD","EN TRÁMITE","Proceso de división y partición de bien inmueble en condominio adquirido en copropiedad"),
    ("0091/2024",2024,1,"CIV-ORD","ADMITIDO","Demanda de nulidad de escritura pública por falsedad ideológica del notario"),
    ("0015/2025",2025,0,"CIV-ORD","ADMITIDO","Demanda de rescisión de contrato por lesión enorme en compraventa de vehículo automotor"),
    # ── CIVIL EJECUTIVO ──
    ("0099/2021",2021,2,"CIV-EJE","SENTENCIADO","Proceso ejecutivo por pagaré impago de Bs. 220.000 a favor de Banco Nacional S.A."),
    ("0099/2022",2022,2,"CIV-EJE","SENTENCIADO","Proceso ejecutivo por pagaré impago de Bs. 150.000"),
    ("0156/2023",2023,2,"CIV-EJE","EN EJECUCIÓN","Proceso ejecutivo por letra de cambio protestada por Bs. 80.000"),
    ("0210/2024",2024,2,"CIV-EJE","EN TRÁMITE","Proceso ejecutivo por cheque rechazado de Bs. 45.000 librado a Distribuidora Central S.R.L."),
    ("0033/2025",2025,2,"CIV-EJE","ADMITIDO","Proceso ejecutivo por pagaré impago de Bs. 95.000 — Inmobiliaria Santa Cruz S.A."),
    # ── PENAL ORDINARIO ──
    ("0033/2021",2021,3,"PEN-ORD","SENTENCIADO","Delito de estafa agravada en perjuicio de más de 40 inversionistas mediante esquema piramidal"),
    ("0077/2021",2021,3,"PEN-ORD","SENTENCIADO","Apropiación indebida de fondos de empresa constructora por su gerente general"),
    ("0033/2022",2022,3,"PEN-ORD","SENTENCIADO","Delito de estafa agravada en perjuicio de inversionistas mediante esquema piramidal"),
    ("0077/2022",2022,3,"PEN-ORD","SENTENCIADO","Apropiación indebida de fondos de empresa constructora por gerente"),
    ("0112/2022",2022,4,"PEN-ORD","EN TRÁMITE","Tráfico de sustancias controladas — interceptación en ruta bioceánica — 120 kg de cocaína"),
    ("0055/2023",2023,3,"PEN-ORD","PARA SENTENCIA","Delito de lesiones graves y gravísimas con arma blanca en riña callejera"),
    ("0088/2023",2023,3,"PEN-ORD","EN TRÁMITE","Caso de trata y tráfico de personas — red de explotación laboral en el norte del departamento"),
    ("0133/2023",2023,4,"PEN-ORD","EN RECURSO","Delito de violación agravada — sentencia de primera instancia dictada en 2023"),
    ("0167/2024",2024,3,"PEN-ORD","EN TRÁMITE","Feminicidio en grado de tentativa — imputado con detención preventiva vigente"),
    ("0189/2024",2024,4,"PEN-ORD","ADMITIDO","Delito de corrupción de funcionarios públicos — caso licitación irregular de Bs. 8 millones"),
    ("0210/2023",2023,3,"PEN-ORD","SENTENCIADO","Homicidio culposo por accidente de tránsito en la avenida Banzer — dos víctimas fatales"),
    ("0230/2023",2023,4,"PEN-ORD","EN TRÁMITE","Delito de extorsión agravada a empresario mediante amenazas reiteradas"),
    ("0025/2024",2024,3,"PEN-ORD","PARA SENTENCIA","Delito de robo agravado en domicilio — banda organizada de cuatro imputados"),
    ("0050/2025",2025,4,"PEN-ORD","ADMITIDO","Delito de estelionato — venta de vehículo con reporte de robo a múltiples compradores"),
    # ── PENAL ABREVIADO ──
    ("0044/2022",2022,3,"PEN-ABR","SENTENCIADO","Procedimiento abreviado — robo en grado de tentativa en supermercado de la zona norte"),
    ("0091/2023",2023,3,"PEN-ABR","SENTENCIADO","Procedimiento abreviado — conducción peligrosa de vehículo con resultado de daños materiales"),
    ("0120/2024",2024,4,"PEN-ABR","EN TRÁMITE","Procedimiento abreviado — hurto agravado en entidad bancaria por empleado interno"),
    ("0040/2025",2025,3,"PEN-ABR","ADMITIDO","Procedimiento abreviado — daño calificado a bien público en manifestación"),
    # ── FAMILIAR ──
    ("0022/2021",2021,5,"FAM-ORD","SENTENCIADO","Divorcio controvertido con debate sobre guarda de tres hijos menores de edad"),
    ("0022/2022",2022,5,"FAM-ORD","SENTENCIADO","Divorcio controvertido con debate sobre guarda de hijos menores"),
    ("0066/2022",2022,5,"FAM-ORD","EN EJECUCIÓN","División y partición de bienes gananciales post-divorcio — inmuebles y vehículos"),
    ("0100/2023",2023,5,"FAM-ORD","EN TRÁMITE","Proceso de asistencia familiar y guarda compartida — hija de 8 años"),
    ("0144/2023",2023,5,"FAM-ORD","PARA SENTENCIA","Interdicción judicial por incapacidad mental sobreviniente — adulto mayor de 72 años"),
    ("0188/2024",2024,5,"FAM-ORD","EN TRÁMITE","Adopción plena de menor de edad por familia de acogida por más de tres años"),
    ("0210/2024",2024,5,"FAM-ORD","ADMITIDO","Demanda de asistencia familiar incrementada por cambio de circunstancias económicas"),
    ("0030/2025",2025,5,"FAM-ORD","ADMITIDO","Proceso de impugnación de paternidad por prueba de ADN"),
    # ── AGROAMBIENTAL ──
    ("0011/2022",2022,6,"AGR-ORD","SENTENCIADO","Conflicto de límites entre comunidades campesinas en la provincia Ichilo"),
    ("0044/2023",2023,6,"AGR-ORD","EN TRÁMITE","Desalojo de tierras fiscales ocupadas ilegalmente en la zona de Yapacaní"),
    ("0077/2024",2024,6,"AGR-ORD","ADMITIDO","Demanda agroambiental por contaminación de cuenca hídrica del río Piraí"),
    ("0088/2024",2024,6,"AGR-ORD","EN TRÁMITE","Proceso de saneamiento de tierras comunitarias de origen — TCO Lomerío"),
    ("0020/2025",2025,6,"AGR-ORD","ADMITIDO","Demanda de reversión de tierras improductivas a favor del Estado boliviano"),
    # ── CONSTITUCIONAL ──
    ("0015/2023",2023,7,"CON-AMP","SENTENCIADO","Acción de amparo por vulneración del derecho al trabajo — reincorporación laboral"),
    ("0030/2024",2024,7,"CON-AMP","EN TRÁMITE","Acción de amparo por vulneración del derecho a la educación superior — UAGRM"),
    ("0008/2024",2024,8,"CON-HAB","SENTENCIADO","Acción de hábeas corpus por detención preventiva ilegal superior a 36 meses"),
    ("0045/2024",2024,7,"CON-AMP","PARA SENTENCIA","Acción de amparo contra resolución administrativa del Ministerio de Salud"),
    ("0018/2025",2025,7,"CON-AMP","ADMITIDO","Acción de amparo por vulneración del derecho a la propiedad privada — demolición ilegal"),
    # ── LABORAL ──
    ("0055/2022",2022,9,"LAB-ORD","SENTENCIADO","Demanda laboral por despido injustificado y pago de beneficios sociales — 8 años de antigüedad"),
    ("0087/2023",2023,9,"LAB-ORD","EN TRÁMITE","Demanda laboral por reincorporación y pago de salarios devengados de 14 meses"),
    ("0110/2023",2023,9,"LAB-REI","EN TRÁMITE","Acción de reincorporación por despido ilegal de trabajadora embarazada — fuero de maternidad"),
    ("0075/2024",2024,9,"LAB-ORD","PARA SENTENCIA","Demanda laboral por pago de horas extras no remuneradas durante cinco años"),
    ("0095/2024",2024,9,"LAB-REI","EN TRÁMITE","Reincorporación por inamovilidad de dirigente sindical despedido sin desafuero"),
    ("0022/2025",2025,9,"LAB-ORD","ADMITIDO","Demanda laboral por acoso laboral y pago de daños y perjuicios"),
    # ── COMERCIAL ──
    ("0033/2023",2023,10,"COM-ORD","PARA SENTENCIA","Proceso comercial por incumplimiento de contrato de franquicia — pérdidas por Bs. 1.200.000"),
    ("0066/2024",2024,10,"COM-ORD","EN TRÁMITE","Demanda comercial por competencia desleal y daño a imagen empresarial"),
    ("0088/2025",2025,10,"COM-ORD","ADMITIDO","Proceso comercial por incumplimiento de contrato de distribución exclusiva"),
]

expedientes = []
sala_trib_map = list(salas_tribunal)

for numero, anio, sala_idx, tp_cod, estado_nom, desc in expedientes_def:
    num_final = num_exp_unico(numero, anio, numeros_usados)
    sala_t = sala_trib_map[sala_idx] if sala_idx < len(sala_trib_map) else sala_trib_map[0]
    f_ing  = fd(date(anio, 1, 1), date(anio, 12, 31))
    exp = Expediente.objects.create(
        numero_expediente=num_final, ano=anio,
        id_sala=sala_t,
        id_tipo_proceso=tipos_proceso_obj[tp_cod],
        id_estado_expediente=estados_exp_obj[estado_nom],
        descripcion=desc, fecha_ingreso=f_ing
    )
    expedientes.append(exp)

print(f"  ✓ {len(expedientes)} expedientes")

# ─────────────────────────────────────────────────────────────
# 8. CONFORMACIONES DE SALA
# ─────────────────────────────────────────────────────────────
print("\n[8] Conformaciones de sala...")

conformaciones = []
roles_caso = ["Vocal Relator","Vocal Dirimente","Presidente de Sala","Vocal Ponente"]

for exp in expedientes:
    n_vocales = random.choices([1, 2, 3], weights=[3, 5, 2])[0]
    elegidos  = picks(vocales_activos, n_vocales)
    for i, vocal in enumerate(elegidos):
        c = ConformacionSalaExpediente.objects.create(
            id_expediente=exp, id_vocal=vocal,
            rol_en_caso=roles_caso[i] if i < len(roles_caso) else "Vocal"
        )
        conformaciones.append(c)

print(f"  ✓ {len(conformaciones)} conformaciones")

# ─────────────────────────────────────────────────────────────
# 9. PARTES PROCESALES
# ─────────────────────────────────────────────────────────────
print("\n[9] Partes procesales...")

partes_todas = []

def agregar_partes(exp, combos):
    for persona, rol_nombre in combos:
        p = ParteProcesal.objects.create(
            id_expediente=exp,
            id_persona=persona,
            id_rol=roles_procesales_obj[rol_nombre],
            activo=True
        )
        partes_todas.append(p)

p_civ  = p_partes[0:18]    # índices 0-17
p_pen  = p_partes[18:28]   # índices 18-27
p_fam  = p_partes[28:34]   # índices 28-33
p_agr  = p_partes[34:38]   # índices 34-37
p_lab  = p_partes[38:42]   # índices 38-41
p_com  = p_partes[42:44]   # índices 42-43

# Reordenar expedientes por tipo para facilitar asignación
exp_civ_ord = [e for e in expedientes if e.id_tipo_proceso.codigo == "CIV-ORD"]
exp_civ_eje = [e for e in expedientes if e.id_tipo_proceso.codigo == "CIV-EJE"]
exp_pen_ord = [e for e in expedientes if e.id_tipo_proceso.codigo == "PEN-ORD"]
exp_pen_abr = [e for e in expedientes if e.id_tipo_proceso.codigo == "PEN-ABR"]
exp_fam     = [e for e in expedientes if e.id_tipo_proceso.codigo in ("FAM-ORD","FAM-EJE")]
exp_agr     = [e for e in expedientes if e.id_tipo_proceso.codigo in ("AGR-ORD","AGR-CAU")]
exp_con     = [e for e in expedientes if e.id_tipo_proceso.codigo in ("CON-AMP","CON-HAB")]
exp_lab     = [e for e in expedientes if e.id_tipo_proceso.codigo in ("LAB-ORD","LAB-REI")]
exp_com     = [e for e in expedientes if e.id_tipo_proceso.codigo == "COM-ORD"]

for exp in exp_civ_ord:
    dem = pick(p_civ[:10])
    dem_list = [x for x in p_civ if x != dem]
    ddo = pick(p_empresas) if random.random() > 0.5 else pick(dem_list)
    combos = [
        (dem,                  "Demandante"),
        (ddo,                  "Demandado"),
        (pick(p_abogados[:10]),"Abogado de la Parte Actora"),
        (pick(p_abogados[10:]),"Abogado Defensor"),
    ]
    if random.random() > 0.7:
        tercero = pick([x for x in p_civ if x not in [dem, ddo]])
        combos.append((tercero, "Tercero Interesado"))
    agregar_partes(exp, combos)

for exp in exp_civ_eje:
    agregar_partes(exp, [
        (pick(p_empresas),          "Demandante"),
        (pick(p_civ),               "Demandado"),
        (pick(p_abogados[:8]),      "Abogado de la Parte Actora"),
        (pick(p_abogados[10:]),     "Abogado Defensor"),
    ])

for exp in exp_pen_ord:
    querellante = pick(p_pen[:5])
    imputado    = pick(p_pen[5:])
    combos = [
        (querellante,             "Querellante"),
        (imputado,                "Imputado"),
        (pick(p_abogados[:8]),    "Abogado de la Parte Actora"),
        (pick(p_abogados[8:16]),  "Abogado Defensor"),
    ]
    if random.random() > 0.4:
        victima = pick([x for x in p_pen[:5] if x != querellante])
        combos.append((victima, "Víctima"))
    agregar_partes(exp, combos)

for exp in exp_pen_abr:
    agregar_partes(exp, [
        (pick(p_pen),             "Imputado"),
        (pick(p_abogados[8:]),    "Abogado Defensor"),
    ])

for exp in exp_fam:
    c1 = pick(p_fam)
    c2 = pick([x for x in p_fam if x != c1])
    agregar_partes(exp, [
        (c1,                      "Demandante"),
        (c2,                      "Demandado"),
        (pick(p_abogados[:8]),    "Abogado de la Parte Actora"),
        (pick(p_abogados[8:]),    "Abogado Defensor"),
    ])

for exp in exp_agr:
    agregar_partes(exp, [
        (pick(p_agr),             "Demandante"),
        (pick(p_agr),             "Demandado"),
        (pick(p_abogados[:8]),    "Abogado de la Parte Actora"),
        (pick(p_abogados[8:]),    "Abogado Defensor"),
    ])

for exp in exp_con:
    agregar_partes(exp, [
        (pick(p_civ[:10]),        "Demandante"),
        (pick(p_abogados[:10]),   "Abogado de la Parte Actora"),
    ])

for exp in exp_lab:
    agregar_partes(exp, [
        (pick(p_lab),             "Demandante"),
        (pick(p_empresas),        "Demandado"),
        (pick(p_abogados[:10]),   "Abogado de la Parte Actora"),
        (pick(p_abogados[10:]),   "Abogado Defensor"),
    ])

for exp in exp_com:
    e1 = pick(p_empresas)
    e2 = pick([x for x in p_empresas if x != e1])
    agregar_partes(exp, [
        (e1,                      "Demandante"),
        (e2,                      "Demandado"),
        (pick(p_abogados[:8]),    "Abogado de la Parte Actora"),
        (pick(p_abogados[8:]),    "Abogado Defensor"),
    ])

print(f"  ✓ {len(partes_todas)} partes procesales")

# ─────────────────────────────────────────────────────────────
# 10. HISTORIAL DE ESTADOS
# ─────────────────────────────────────────────────────────────
print("\n[10] Historial de estados...")

historiales = []

def registrar_cambio_estado(exp, est_ant_nom, est_nvo_nom, usuario, motivo):
    est_ant = estados_exp_obj.get(est_ant_nom)
    est_nvo = estados_exp_obj.get(est_nvo_nom)
    if not est_nvo:
        return
    h = HistorialEstado.objects.create(
        id_expediente=exp,
        id_estado_anterior=est_ant,
        id_estado_nuevo=est_nvo,
        usuario=usuario,
        motivo=motivo,
    )
    historiales.append(h)

for exp in expedientes:
    estado_actual = exp.id_estado_expediente.nombre_estado
    us = pick(secretarios_us) if secretarios_us else usuarios[1]

    if estado_actual == "ADMITIDO":
        registrar_cambio_estado(exp, None, "ADMITIDO", us,
            "Cumplidos los requisitos formales de admisibilidad. Se admite la demanda.")

    elif estado_actual == "EN TRÁMITE":
        registrar_cambio_estado(exp, None, "ADMITIDO", us,
            "Se admite la demanda, cumplidos los requisitos formales.")
        registrar_cambio_estado(exp, "ADMITIDO", "EN TRÁMITE", us,
            "Citada y emplazada la parte demandada. Proceso en trámite ordinario.")

    elif estado_actual == "PARA SENTENCIA":
        registrar_cambio_estado(exp, None, "ADMITIDO", us, "Se admite la demanda.")
        registrar_cambio_estado(exp, "ADMITIDO", "EN TRÁMITE", us, "Proceso en trámite.")
        registrar_cambio_estado(exp, "EN TRÁMITE", "PARA SENTENCIA", us,
            "Concluida la etapa probatoria y de alegatos finales. Autos para sentencia.")

    elif estado_actual == "SENTENCIADO":
        registrar_cambio_estado(exp, None, "ADMITIDO", us, "Demanda admitida formalmente.")
        registrar_cambio_estado(exp, "ADMITIDO", "EN TRÁMITE", us, "Proceso en trámite regular.")
        registrar_cambio_estado(exp, "EN TRÁMITE", "PARA SENTENCIA", us,
            "Concluida la fase probatoria y de alegatos.")
        registrar_cambio_estado(exp, "PARA SENTENCIA", "SENTENCIADO", us,
            "Sentencia definitiva dictada, notificada a las partes y ejecutoriada.")

    elif estado_actual == "EN RECURSO":
        registrar_cambio_estado(exp, None, "ADMITIDO", us, "Demanda admitida.")
        registrar_cambio_estado(exp, "ADMITIDO", "EN TRÁMITE", us, "En trámite.")
        registrar_cambio_estado(exp, "EN TRÁMITE", "PARA SENTENCIA", us, "Para sentencia.")
        registrar_cambio_estado(exp, "PARA SENTENCIA", "SENTENCIADO", us,
            "Sentencia de primera instancia dictada.")
        registrar_cambio_estado(exp, "SENTENCIADO", "EN RECURSO", us,
            "Recurso de apelación interpuesto por la parte demandada dentro del plazo legal de diez días.")

    elif estado_actual == "EN EJECUCIÓN":
        registrar_cambio_estado(exp, None, "ADMITIDO", us, "Demanda admitida.")
        registrar_cambio_estado(exp, "ADMITIDO", "EN TRÁMITE", us, "En trámite.")
        registrar_cambio_estado(exp, "EN TRÁMITE", "PARA SENTENCIA", us, "Para sentencia.")
        registrar_cambio_estado(exp, "PARA SENTENCIA", "SENTENCIADO", us, "Sentencia dictada.")
        registrar_cambio_estado(exp, "SENTENCIADO", "EN EJECUCIÓN", us,
            "Sentencia ejecutoriada. Se dispone el inicio de la ejecución forzosa de la resolución.")

    elif estado_actual == "ARCHIVADO":
        registrar_cambio_estado(exp, None, "ADMITIDO", us, "Demanda admitida.")
        registrar_cambio_estado(exp, "ADMITIDO", "EN TRÁMITE", us, "En trámite.")
        registrar_cambio_estado(exp, "EN TRÁMITE", "ARCHIVADO", us,
            "Se declara el abandono del proceso por inactividad procesal superior a seis meses calendario.")

print(f"  ✓ {len(historiales)} registros de historial")

# ─────────────────────────────────────────────────────────────
# 11. DOCUMENTOS
# ─────────────────────────────────────────────────────────────
print("\n[11] Documentos...")

documentos = []

def crear_documento(exp, tipo_cod, titulo, folio=None, firmado=False):
    d = Documento.objects.create(
        id_expediente=exp,
        id_tipo_doc=tipos_doc_obj[tipo_cod],
        titulo=titulo,
        numero_folio=folio or random.randint(1, 250),
        ruta_archivo=f"/expedientes/{exp.ano}/{exp.numero_expediente.replace('/','_').replace('-','_')}/{titulo[:25].replace(' ','_')}.pdf",
        tamano_kb=random.randint(50, 5000),
        hash_integridad=f"sha256-{exp.id_expediente:04d}-{random.randint(100000,999999)}",
        es_electronico=True,
        firmado_digitalmente=firmado,
    )
    documentos.append(d)
    return d

for exp in expedientes:
    estado = exp.id_estado_expediente.nombre_estado
    num    = exp.numero_expediente

    # Demanda (siempre)
    crear_documento(exp, "DDA", f"Demanda — {num}", folio=1)

    # Contrato (base de muchos procesos)
    if exp.id_tipo_proceso.codigo in ("CIV-ORD","CIV-EJE","COM-ORD"):
        if random.random() > 0.3:
            crear_documento(exp, "CONT", f"Contrato base — {num}", folio=random.randint(2,8))

    # Facturas / recibos para ejecutivos y laborales
    if exp.id_tipo_proceso.codigo in ("CIV-EJE","LAB-ORD"):
        for k in range(random.randint(1, 3)):
            crear_documento(exp, "FACT", f"Comprobante de pago N°{k+1} — {num}", folio=random.randint(9,20))

    # Respuesta a la demanda
    if estado not in ("ADMITIDO",) and random.random() > 0.15:
        crear_documento(exp, "RESP", f"Respuesta a la Demanda — {num}", folio=random.randint(5, 25))

    # Demanda reconvencional
    if estado not in ("ADMITIDO",) and random.random() > 0.7:
        crear_documento(exp, "RECON", f"Demanda Reconvencional — {num}", folio=random.randint(26, 40))

    # Notas de apersonamiento
    for _ in range(random.randint(1, 4)):
        crear_documento(exp, "NOTA", f"Nota de Apersonamiento — {num}")

    # Poder notarial
    if random.random() > 0.35:
        crear_documento(exp, "POD", f"Poder Notarial — {num}")

    # Pruebas documentales
    n_pruebas = random.randint(2, 7)
    for j in range(n_pruebas):
        crear_documento(exp, "PRUE", f"Prueba Documental N°{j+1} — {num}", folio=random.randint(30, 120))

    # Título de propiedad (inmobiliarios)
    if exp.id_tipo_proceso.codigo in ("CIV-ORD","AGR-ORD") and random.random() > 0.4:
        crear_documento(exp, "TITU", f"Título de Propiedad — {num}", firmado=True)

    # Declaración jurada
    if random.random() > 0.6:
        crear_documento(exp, "DECL", f"Declaración Jurada — {num}", firmado=True)

    # Memoriales
    if estado not in ("ADMITIDO",):
        for _ in range(random.randint(2, 6)):
            crear_documento(exp, "MEM", f"Memorial — {num}")

    # Excepción procesal
    if random.random() > 0.55:
        crear_documento(exp, "EXCEP", f"Excepción Procesal — {num}")

    # Oposición
    if random.random() > 0.65:
        crear_documento(exp, "OPOS", f"Oposición — {num}")

    # Pericia e informe (procesos avanzados)
    if estado in ("PARA SENTENCIA","SENTENCIADO","EN EJECUCIÓN","EN RECURSO"):
        if random.random() > 0.45:
            crear_documento(exp, "PER", f"Pericia Técnica — {num}", firmado=True)
        if random.random() > 0.35:
            crear_documento(exp, "INF", f"Informe Técnico — {num}")
        if random.random() > 0.5:
            crear_documento(exp, "CERT", f"Certificación — {num}", firmado=True)

    # Ampliación de demanda
    if estado in ("EN TRÁMITE","PARA SENTENCIA") and random.random() > 0.75:
        crear_documento(exp, "AMP", f"Ampliación de Demanda — {num}")

    # Sentencia (procesos avanzados)
    if estado in ("SENTENCIADO","EN EJECUCIÓN","EN RECURSO"):
        crear_documento(exp, "SENT_D", f"Sentencia — {num}", firmado=True)

    # Convenio/Acuerdo (familiar y laboral)
    if exp.id_tipo_proceso.codigo in ("FAM-ORD","LAB-ORD","LAB-REI") and random.random() > 0.4:
        crear_documento(exp, "CONV", f"Convenio o Acuerdo — {num}", firmado=True)

    # Constancia
    if random.random() > 0.6:
        crear_documento(exp, "CONS", f"Constancia Actuarial — {num}", firmado=True)

print(f"  ✓ {len(documentos)} documentos")

# ─────────────────────────────────────────────────────────────
# 12. AUDIENCIAS
# ─────────────────────────────────────────────────────────────
print("\n[12] Audiencias...")

tp_a_tipos_aud = {
    "CIV-ORD": [ta for ta in tipos_aud_lst if any(x in ta.nombre for x in ["Civil","Conciliat","Preliminar","Prueba","Alegatos","Peritaje"])],
    "CIV-EJE": [ta for ta in tipos_aud_lst if any(x in ta.nombre for x in ["Ejecución","Preliminar"])],
    "CIV-EXP": [ta for ta in tipos_aud_lst if "Preliminar" in ta.nombre],
    "PEN-ORD": [ta for ta in tipos_aud_lst if any(x in ta.nombre for x in ["Penal","Cautelar","Cesación","Medidas","Extraordinaria"])],
    "PEN-ABR": [ta for ta in tipos_aud_lst if "Abreviado" in ta.nombre],
    "PEN-EXP": [ta for ta in tipos_aud_lst if "Penal" in ta.nombre],
    "FAM-ORD": [ta for ta in tipos_aud_lst if "Familiar" in ta.nombre],
    "FAM-EJE": [ta for ta in tipos_aud_lst if "Familiar" in ta.nombre],
    "AGR-ORD": [ta for ta in tipos_aud_lst if any(x in ta.nombre for x in ["Agro","Inspección"])],
    "AGR-CAU": [ta for ta in tipos_aud_lst if "Agro" in ta.nombre],
    "CON-AMP": [ta for ta in tipos_aud_lst if "Amparo" in ta.nombre],
    "CON-HAB": [ta for ta in tipos_aud_lst if "Hábeas" in ta.nombre],
    "LAB-ORD": [ta for ta in tipos_aud_lst if "Laboral" in ta.nombre],
    "LAB-REI": [ta for ta in tipos_aud_lst if any(x in ta.nombre for x in ["Reincorporación","Laboral"])],
    "COM-ORD": [ta for ta in tipos_aud_lst if any(x in ta.nombre for x in ["Comercial","Preliminar"])],
}

audiencias = []
motivos_suspension = [
    "Inasistencia de la parte demandada sin justificación ni aviso previo",
    "El abogado defensor solicitó diferimiento por enfermedad debidamente acreditada con certificado médico",
    "Falla técnica grave en el sistema de videoconferencia — se reprogramará a la brevedad",
    "El testigo convocado no se presentó pese a haber sido notificado en forma legal",
    "Solicitud de diferimiento acordada por ambas partes ante necesidad de producir prueba pericial adicional",
    "El Vocal Relator se encontraba presidiendo audiencia de juicio oral con prioridad procesal",
    "Paro de transporte público impidió el traslado de los comparecientes a las instalaciones del Tribunal",
    "El perito designado solicitó plazo adicional para concluir el informe técnico",
    "Fuerza mayor — corte de energía eléctrica en el edificio del Tribunal",
    "La parte demandada acreditó viaje al exterior con carácter de urgencia",
]

for exp in expedientes:
    tp_cod     = exp.id_tipo_proceso.codigo
    tipos_disp = tp_a_tipos_aud.get(tp_cod, tipos_aud_lst[:2])
    if not tipos_disp:
        tipos_disp = tipos_aud_lst[:2]

    estado    = exp.id_estado_expediente.nombre_estado
    f_ingreso = exp.fecha_ingreso

    trib_id   = exp.id_sala.id_tribunal_id
    salas_disp = [sa for sa in salas_aud if sa.id_tribunal_id == trib_id]
    if not salas_disp:
        salas_disp = salas_aud[:2]

    n_map = {
        "ADMITIDO":    1,
        "EN TRÁMITE":  random.randint(2, 5),
        "PARA SENTENCIA": random.randint(4, 7),
        "SENTENCIADO": random.randint(4, 8),
        "EN EJECUCIÓN": random.randint(5, 9),
        "EN RECURSO":  random.randint(4, 7),
        "ARCHIVADO":   random.randint(1, 3),
        "SUSPENDIDO":  1,
    }
    n_aud = n_map.get(estado, 2)

    for j in range(n_aud):
        tipo_aud    = pick(tipos_disp)
        dias_offset = j * random.randint(15, 50)
        f_prog      = f_ingreso + timedelta(days=dias_offset + random.randint(5, 20))

        es_ultima = (j == n_aud - 1)
        if es_ultima and estado in ("ADMITIDO", "EN TRÁMITE", "PARA SENTENCIA"):
            f_prog = HOY + timedelta(days=random.randint(3, 90))

        hora_inicio = random.choice([8, 9, 10, 11, 14, 15, 16])
        minuto      = random.choice([0, 30])
        dt_prog     = dtc(f_prog, hora_inicio, minuto)

        if f_prog > HOY:
            est_aud = "PROGRAMADA"
        else:
            est_aud = random.choices(
                ["REALIZADA","SUSPENDIDA","DIFERIDA"],
                weights=[72, 18, 10]
            )[0]

        sala_aud = pick(salas_disp)

        aud = Audiencia.objects.create(
            id_expediente         = exp,
            id_tipo_audiencia     = tipo_aud,
            id_sala_aud           = sala_aud,
            fecha_hora_programada = dt_prog,
            estado_audiencia      = est_aud,
            fecha_hora_inicio     = dt_prog if est_aud == "REALIZADA" else None,
            fecha_hora_fin        = dt_prog + timedelta(minutes=tipo_aud.duracion_estimada)
                                    if est_aud == "REALIZADA" else None,
            motivo_suspension     = pick(motivos_suspension) if est_aud == "SUSPENDIDA" else None,
            link_videoconferencia = sala_aud.enlace_virtual if sala_aud.equipada_videoconf else "",
        )
        audiencias.append(aud)

print(f"  ✓ {len(audiencias)} audiencias")

# ─────────────────────────────────────────────────────────────
# 13. ACTAS DE AUDIENCIA + ASISTENCIAS
# ─────────────────────────────────────────────────────────────
print("\n[13] Actas y asistencias...")

actas       = []
asistencias = []

contenidos_acta = [
    "En la ciudad de {ciudad}, siendo las {hora} horas del día {fecha}, se llevó a cabo la {tipo} en el expediente N° {exp}. Presentes las partes y sus representantes legales, debidamente identificadas. El Vocal Relator declaró instalada la audiencia y procedió conforme al orden del día. Se escucharon los alegatos de ambas partes. El actuario extendió el presente acta para constancia.",
    "Siendo las {hora} horas del {fecha}, ante este Tribunal se realizó la audiencia programada en el Exp. {exp}. Identificadas las partes y verificada la asistencia, el Vocal procedió a dar lectura del estado procesal de la causa. Las partes expusieron sus posiciones en forma oral. Se señala nueva audiencia en la fecha a convenir.",
    "A horas {hora} del {fecha}, con la presencia de las partes y sus abogados en el Exp. {exp}, el actuario certificó la notificación de todos los sujetos procesales. Se recibieron en forma oral las pruebas ofrecidas por ambas partes. Concluida la fase probatoria, se pasó al debate de alegatos finales con tiempo igualitario para cada parte.",
    "En instalaciones del Tribunal, a horas {hora} del {fecha}, se instaló la {tipo} — Exp. {exp}. El Vocal Relator verificó la concurrencia de los sujetos procesales. Se cumplieron los puntos del orden del día: I) Verificación de asistencia. II) Producción de prueba. III) Alegatos de conclusión. IV) Disposiciones finales. El Vocal reservó resolución para la fecha.",
    "A hrs. {hora} del {fecha}, en el Exp. {exp}, el Tribunal instaló la {tipo}. Presentes los abogados de ambas partes quienes acreditaron sus personerías. El Vocal relató los antecedentes del proceso. La parte actora formuló sus pretensiones y la demandada opuso sus excepciones. Se instruyó completar la producción probatoria en audiencia posterior.",
]

audiencias_realizadas = [a for a in audiencias if a.estado_audiencia == "REALIZADA"]

for aud in audiencias_realizadas:
    secretario = pick(secretarios_us) if secretarios_us else usuarios[1]
    exp         = aud.id_expediente

    trib_nombre = ""
    try:
        trib_nombre = exp.id_sala.id_tribunal.nombre_tribunal
    except Exception:
        pass
    ciudad = "Santa Cruz de la Sierra" if "Santa Cruz" in trib_nombre else \
             "La Paz" if "La Paz" in trib_nombre else \
             "Cochabamba" if "Cochabamba" in trib_nombre else \
             "Oruro" if "Oruro" in trib_nombre else "Santa Cruz de la Sierra"

    hora_str  = aud.fecha_hora_inicio.strftime("%H:%M") if aud.fecha_hora_inicio else "09:00"
    fecha_str = aud.fecha_hora_programada.strftime("%d de %B de %Y") if aud.fecha_hora_programada else ""
    tipo_str  = aud.id_tipo_audiencia.nombre if aud.id_tipo_audiencia else "audiencia"

    contenido = pick(contenidos_acta).format(
        ciudad=ciudad, hora=hora_str, fecha=fecha_str,
        tipo=tipo_str, exp=exp.numero_expediente
    )

    acta = ActaAudiencia.objects.create(
        id_audiencia  = aud,
        usuario       = secretario,
        contenido     = contenido,
        firmada       = random.random() > 0.25,
        url_grabacion = f"https://storage.tjd.bo/grabaciones/{exp.ano}/{exp.numero_expediente.replace('/','_')}_aud{aud.id_audiencia}.mp4"
                        if random.random() > 0.35 else None,
    )
    actas.append(acta)

    partes_exp = ParteProcesal.objects.filter(id_expediente=exp, activo=True).select_related("id_persona","id_rol")
    for parte in partes_exp:
        asistio = random.choices([True, False], weights=[87, 13])[0]
        AsistenciaAudiencia.objects.create(
            id_audiencia      = aud,
            id_persona        = parte.id_persona,
            rol_en_audiencia  = parte.id_rol.nombre_rol,
            asistio           = asistio,
            hora_ingreso      = aud.fecha_hora_inicio + timedelta(minutes=random.randint(0, 25))
                                if asistio and aud.fecha_hora_inicio else None,
            motivo_inasistencia = pick([
                "No se presentó ni justificó su ausencia dentro del plazo legal",
                "Certificado médico presentado con posterioridad a la audiencia",
                "Notificación fallida — domicilio procesal no encontrado",
                "Viaje al exterior debidamente acreditado",
                None
            ]) if not asistio else None,
        )
        asistencias.append(True)

print(f"  ✓ {len(actas)} actas | {len(asistencias)} asistencias")

# ─────────────────────────────────────────────────────────────
# 14. RESOLUCIONES
# ─────────────────────────────────────────────────────────────
print("\n[14] Resoluciones...")

resoluciones = []

partes_disp_map = {}
for parte in ParteProcesal.objects.select_related("id_expediente","id_persona","id_rol"):
    eid = parte.id_expediente_id
    if eid not in partes_disp_map:
        partes_disp_map[eid] = []
    partes_disp_map[eid].append(parte)

autos_interlocutorios = [
    "SE ADMITE la demanda. Cítese y emplácese a la parte demandada para que en el plazo de treinta días hábiles responda la demanda, bajo apercibimiento de declararse su rebeldía.",
    "Se admite el incidente planteado. Corra en traslado a la parte contraria por el plazo de tres días hábiles para que formule las observaciones que estime convenientes.",
    "Se dispone la producción de prueba pericial. Desígnase perito de oficio. Fíjase el punto de pericia: avalúo del bien inmueble objeto de litis.",
    "Vistas las pruebas aportadas por ambas partes, se declara CERRADO el período probatorio. Autos para alegatos finales en audiencia a señalarse.",
    "Se concede el plazo de diez días a ambas partes para presentar sus alegatos de conclusión en forma escrita.",
    "Se dispone medida cautelar de anotación preventiva de litis sobre el bien inmueble objeto del proceso.",
    "SE RECHAZA por improcedente la excepción de incompetencia planteada por la parte demandada. Continúe el trámite.",
    "Se ordena la citación por edictos de la parte demandada cuyo paradero resulta desconocido, conforme al Art. 124 CPC.",
    "Habiéndose vencido el plazo de emplazamiento sin respuesta de la parte demandada, SE DECLARA SU REBELDÍA. Continúe el trámite.",
    "Se aprueba el informe pericial presentado en autos. Las partes podrán objetarlo en el plazo de cinco días.",
]

sentencias_probadas = [
    "FALLO declarando PROBADA la demanda en todas sus partes. En consecuencia, {accion}. Con costas y costos a la parte demandada vencida.",
    "RESUELVO declarar PROBADA la pretensión principal deducida en la demanda. En mérito a ello, {accion}. Con costas.",
    "POR TANTO: En uso de la jurisdicción y competencia que la ley me otorga, FALLO declarando PROBADA la demanda. {accion}. Costas a la parte vencida.",
]

sentencias_improbadas = [
    "FALLO declarando IMPROBADA la demanda por insuficiencia probatoria. Sin costas por ser excusable el error de derecho invocado.",
    "RESUELVO declarar IMPROBADA en todos sus extremos la demanda, al no haberse acreditado los hechos constitutivos invocados. Sin costas.",
    "POR TANTO: FALLO declarando IMPROBADA la demanda. La parte actora no produjo prueba suficiente para acreditar sus pretensiones. Sin costas.",
]

acciones_civiles = [
    "se ordena el cumplimiento del contrato de compraventa en el plazo de diez días hábiles bajo apercibimiento de ejecución forzosa",
    "se dispone la nulidad del contrato de compraventa de fecha 15 de marzo y la restitución de lo pagado con intereses legales",
    "se reconoce el derecho propietario del demandante sobre el bien inmueble identificado, con instrucción de registro en Derechos Reales",
    "se ordena el pago de Bs. 85.000 más intereses legales al tipo bancario desde la fecha de incumplimiento",
    "se declara la usucapión del bien inmueble a favor del demandante, debiendo el Tribunal oficiar a Derechos Reales para su registro",
    "se dispone la resolución del contrato de arrendamiento y la desocupación del inmueble en el plazo de quince días",
    "se ordena el pago de daños y perjuicios por Bs. 120.000 debidamente acreditados mediante pericia",
]

acciones_penales = [
    "se condena al imputado a la pena de tres años de reclusión, con suspensión condicional por dos años previo pago de la multa fijada",
    "se condena al imputado a la pena privativa de libertad de cinco años de reclusión efectiva sin derecho a indulto por reincidencia",
    "se condena al imputado a la pena de ocho años de presidio sin derecho a indulto, más reparación del daño civil causado",
    "se impone al imputado la pena de dos años de reclusión acogiendo la atenuante especial del Art. 40 CP",
    "se condena al imputado a cuatro años de reclusión efectiva, inhabilitación especial por igual tiempo y reparación del daño",
]

acciones_familiares = [
    "se declara disuelto el vínculo matrimonial. Se fija la guarda de los hijos menores a favor de la madre con régimen de visitas al padre",
    "se aprueba el convenio regulador suscrito entre las partes. Se fija asistencia familiar de Bs. 1.500 mensuales",
    "se declara la interdicción judicial del causante. Se designa curador al familiar propuesto, quien deberá rendir cuentas anuales",
]

acciones_laborales = [
    "se ordena la reincorporación del trabajador a su fuente de trabajo en el plazo de cinco días con pago de salarios devengados",
    "se ordena el pago de beneficios sociales por Bs. 45.000 incluyendo desahucio, indemnización y vacaciones no gozadas",
    "se ordena el pago de horas extras por Bs. 28.500 conforme a la liquidación pericial aprobada en autos",
]

def crear_resolucion(exp, tipo_cod, numero, fecha, dispositiva, fundamentacion, es_rec=False, plazo=10):
    r = Resolucion.objects.create(
        id_expediente     = exp,
        id_tipo_res       = tipos_res_obj[tipo_cod],
        numero_resolucion = numero,
        fecha_resolucion  = fecha,
        parte_dispositiva = dispositiva,
        fundamentacion    = fundamentacion,
        estado            = "VIGENTE",
        es_recurrible     = es_rec,
        plazo_recurso_dias= plazo if es_rec else 0,
    )
    resoluciones.append(r)
    return r

resolucion_por_exp = {}

for exp in expedientes:
    estado   = exp.id_estado_expediente.nombre_estado
    anio     = exp.ano
    tp_cod   = exp.id_tipo_proceso.codigo
    f_base   = exp.fecha_ingreso
    es_penal = tp_cod.startswith("PEN")
    es_fam   = tp_cod.startswith("FAM")
    es_lab   = tp_cod.startswith("LAB")
    num_safe = exp.numero_expediente.replace('/','_').replace('-','_')

    resolucion_por_exp[exp.id_expediente] = []

    # Auto de admisión (siempre)
    r_adm = crear_resolucion(
        exp, "AUTO",
        f"AUTO-ADM-{num_safe}-{anio}",
        f_base + timedelta(days=random.randint(1, 5)),
        pick(autos_interlocutorios[:2]),
        "Vistos los antecedentes del proceso y verificados los requisitos formales de admisibilidad "
        "previstos en la norma procesal aplicable, el Vocal de turno RESUELVE admitir la demanda en "
        "la forma y por los fundamentos indicados en la parte resolutiva.",
        es_rec=False
    )
    resolucion_por_exp[exp.id_expediente].append(r_adm)

    # Decretos de trámite (2-5 según estado)
    if estado not in ("ADMITIDO",):
        for k in range(random.randint(2, 5)):
            r_dec = crear_resolucion(
                exp, "DECR",
                f"DECR-{num_safe}-{anio}-{k+1:02d}",
                f_base + timedelta(days=random.randint(10, 70) + k * 25),
                pick(autos_interlocutorios[2:]),
                "De conformidad al estado procesal de la causa y en cumplimiento de lo dispuesto "
                "anteriormente, se provee el presente decreto de trámite conforme a las disposiciones "
                "del Código de Procedimiento Civil.",
                es_rec=False
            )
            resolucion_por_exp[exp.id_expediente].append(r_dec)

    # Resoluciones interlocutorias adicionales (procesos intermedios)
    if estado in ("PARA SENTENCIA","SENTENCIADO","EN EJECUCIÓN","EN RECURSO","EN TRÁMITE"):
        n_int = random.randint(1, 3)
        for k in range(n_int):
            r_int = crear_resolucion(
                exp, "AUTO",
                f"AI-{num_safe}-{anio}-{k+1:02d}",
                f_base + timedelta(days=random.randint(40, 100) + k * 20),
                pick(autos_interlocutorios[4:]),
                "Analizado el estado procesal de la causa, valoradas las pruebas producidas y "
                "escuchados los alegatos de las partes en la audiencia respectiva, SE RESUELVE "
                "en la forma indicada en la parte dispositiva del presente auto interlocutorio.",
                es_rec=True, plazo=5
            )
            resolucion_por_exp[exp.id_expediente].append(r_int)

    # Sentencia definitiva
    if estado in ("SENTENCIADO","EN EJECUCIÓN","EN RECURSO"):
        if random.random() > 0.28:
            if es_penal:
                accion = pick(acciones_penales)
            elif es_fam:
                accion = pick(acciones_familiares)
            elif es_lab:
                accion = pick(acciones_laborales)
            else:
                accion = pick(acciones_civiles)
            dispositiva = pick(sentencias_probadas).format(accion=accion)
        else:
            dispositiva = pick(sentencias_improbadas)

        r_sent = crear_resolucion(
            exp, "SENT",
            f"SENT-{num_safe}-{anio}",
            f_base + timedelta(days=random.randint(120, 350)),
            dispositiva,
            "VISTOS los antecedentes del proceso, analizada íntegramente la prueba producida "
            "por ambas partes, ponderados los alegatos y aplicando los principios de la sana "
            "crítica racional: I) Los hechos constitutivos alegados por la parte actora han sido "
            "acreditados mediante prueba documental, testifical y/o pericial producida en autos. "
            "II) La parte demandada no logró desvirtuar los extremos invocados mediante prueba "
            "en contrario. III) En aplicación de los artículos pertinentes del Código Civil, "
            "Código de Procedimiento Civil y demás normas aplicables, SE FALLA en la forma "
            "indicada en la parte resolutiva.",
            es_rec=True, plazo=10
        )
        resolucion_por_exp[exp.id_expediente].append(r_sent)

    # Auto de Vista (expedientes en recurso)
    if estado == "EN RECURSO":
        r_aiv = crear_resolucion(
            exp, "AIMT",
            f"AIMT-{num_safe}-{anio}",
            f_base + timedelta(days=random.randint(350, 480)),
            random.choice([
                "SE REVOCA PARCIALMENTE la sentencia apelada. Se modifica el quantum de la condena en los términos señalados. Con costas.",
                "SE CONFIRMA en todas sus partes la sentencia de primera instancia. Con costas en segunda instancia.",
                "SE ANULA la sentencia de primera instancia por vicio procesal de incongruencia ultra petita. Vuelvan obrados al inferior para nueva sentencia.",
                "SE MODIFICA la sentencia impugnada únicamente en cuanto al monto de la reparación del daño civil, reduciéndolo a Bs. 45.000.",
            ]),
            "Revisados íntegramente los fundamentos del recurso de apelación interpuesto y los "
            "de la sentencia impugnada, el Tribunal Ad Quem concluye que: La valoración probatoria "
            "realizada por el inferior merece las correcciones señaladas en la parte resolutiva, "
            "habiéndose verificado los vicios denunciados por el recurrente en cuanto a la "
            "fundamentación de la resolución de primera instancia.",
            es_rec=True, plazo=15
        )
        resolucion_por_exp[exp.id_expediente].append(r_aiv)

print(f"  ✓ {len(resoluciones)} resoluciones")

# ─────────────────────────────────────────────────────────────
# 15. RECURSOS
# ─────────────────────────────────────────────────────────────
print("\n[15] Recursos...")

recursos = []

for exp in expedientes:
    estado = exp.id_estado_expediente.nombre_estado

    if estado not in ("EN RECURSO","SENTENCIADO","EN EJECUCIÓN"):
        continue

    res_recurribles = [r for r in resolucion_por_exp.get(exp.id_expediente, []) if r.es_recurrible]
    if not res_recurribles:
        continue

    partes_exp = partes_disp_map.get(exp.id_expediente, [])
    if not partes_exp:
        continue

    n_rec = 2 if estado == "EN RECURSO" else 1

    for k in range(n_rec):
        res_imp    = pick(res_recurribles)
        recurrente = pick(partes_exp)
        tipo_rec   = tipos_recurso_lst[0] if k == 0 else pick(tipos_recurso_lst[:3])

        estado_rec = random.choices(
            ["PENDIENTE","ADMITIDO","RESUELTO","RECHAZADO"],
            weights=[25, 35, 30, 10]
        )[0]

        rec = Recurso.objects.create(
            id_resolucion_impugnada = res_imp,
            id_tipo_recurso         = tipo_rec,
            id_recurrente           = recurrente,
            estado_recurso          = estado_rec,
            fundamentos             = (
                f"El recurrente alega en sustento del presente {tipo_rec.nombre}: "
                "I) Errónea valoración de la prueba documental, específicamente el contrato "
                "obrante en autos cuya fecha y contenido fueron mal interpretados por el inferior. "
                "II) Violación flagrante al principio del debido proceso y a la garantía de "
                "motivación suficiente de las resoluciones judiciales. III) Inaplicación de los "
                "Arts. 145, 197 y 213 del CPC y normas concordantes. IV) El inferior incurrió "
                "en error de derecho al valorar la prueba testifical sin aplicar la sana crítica. "
                "POR TANTO, solicita respetuosamente se revoque o anule la resolución impugnada "
                "y se dicte nueva resolución conforme a derecho y justicia."
            ),
        )
        recursos.append(rec)

        if estado_rec == "ADMITIDO" and not rec.id_expediente_alzada:
            est_alzada = estados_exp_obj.get("EN TRÁMITE")
            if est_alzada:
                num_alzada = f"ALZ-{exp.numero_expediente.replace('/','_')}-{rec.id_recurso}"
                num_alzada = num_exp_unico(num_alzada, HOY.year, numeros_usados)
                exp_alzada = Expediente.objects.create(
                    numero_expediente=num_alzada,
                    ano=HOY.year,
                    id_sala=exp.id_sala,
                    id_tipo_proceso=exp.id_tipo_proceso,
                    id_estado_expediente=est_alzada,
                    descripcion=f"Expediente de alzada — {tipo_rec.nombre} sobre {res_imp.numero_resolucion}",
                    fecha_ingreso=HOY,
                )
                rec.id_expediente_alzada = exp_alzada
                rec.save()

print(f"  ✓ {len(recursos)} recursos ({sum(1 for r in recursos if r.id_expediente_alzada)} con expediente de alzada)")

# ─────────────────────────────────────────────────────────────
# 16. ACTUACIONES PROCESALES
# ─────────────────────────────────────────────────────────────
print("\n[16] Actuaciones procesales...")

actuaciones = []

descrip_por_tipo = {
    "PROV": "Se provee conforme a lo solicitado por la parte peticionante en el memorial de fs. {folio}, disponiendo {accion} en la causa.",
    "NOTA": "Nota de proveído del decreto de fecha {fecha} por el cual se dispone {accion} en el presente proceso.",
    "CITA": "Cédula de citación librada a {persona} en su domicilio procesal señalado en el memorial de apersonamiento.",
    "NOTI": "Cédula de notificación diligenciada con la resolución dictada en fecha {fecha} — {accion}.",
    "DILIG": "Diligencia actuarial por la cual se certifica el estado procesal actual del expediente para todos los efectos legales.",
    "EMPL": "Emplazamiento formal a la parte demandada {persona} para que dentro del plazo de treinta días hábiles responda la demanda.",
    "INF":  "Informe actuarial sobre los antecedentes procesales del presente expediente, elaborado a solicitud del Vocal Relator.",
    "OFIC": "Oficio N° {folio}/{fecha} dirigido a {destino} solicitando la remisión de información relevante para la resolución del proceso.",
    "EXHOR": "Exhorto librado al Juzgado competente de la ciudad de {ciudad} para la práctica de diligencia de notificación.",
    "CERT_A": "Certificación actuarial del estado procesal de la causa, extendida para todos los efectos legales que hubiere lugar.",
    "COMP": "Comparendo de {persona} ante el Tribunal para declaración informativa en calidad de testigo de la parte actora.",
    "TRAB": "Trabamiento de embargo sobre bienes del deudor {persona} en ejecución de sentencia ejecutoriada.",
    "SECU": "Secuestro de bienes muebles identificados en el inventario adjunto, ordenado como medida cautelar.",
    "DESG": "Desglose de documentos originales a solicitud de la parte {persona} — fs. {folio} a {folio_fin}.",
    "INSP": "Inspección ocular practicada en el inmueble objeto del litigio, ubicado en la ciudad de {ciudad}.",
    "CONS": "Constancia de notificación válidamente diligenciada con la resolución de fecha {fecha} a la parte {persona}.",
}

ciudades_bo = ["Cochabamba","La Paz","Oruro","Potosí","Sucre","Trinidad","Cobija","Tarija","Montero"]
destinos    = [
    "Registro de Derechos Reales","SEGIP — Servicio General de Identificación Personal",
    "Servicio de Impuestos Nacionales (SIN)","Banco Unión S.A.","Policía Boliviana — DIPROVE",
    "Notaría de Fe Pública N° 15","Aduana Nacional de Bolivia","Registro de Comercio SEPREC",
    "Dirección del Trabajo","Servicio Nacional de Caminos",
]
acciones_actu = [
    "continuar el trámite regular del proceso",
    "admitir la prueba ofrecida",
    "correr en traslado a la parte contraria",
    "señalar audiencia para la producción de prueba",
    "notificar la resolución a todas las partes",
    "aperturar el término de prueba",
    "designar perito de oficio",
    "practicar la inspección ocular ordenada",
]

# Todos los expedientes, incluidos los de alzada creados en recursos
todos_exp_incluyendo_alzadas = list(Expediente.objects.all())

for exp in todos_exp_incluyendo_alzadas:
    estado   = exp.id_estado_expediente.nombre_estado
    f_base   = exp.fecha_ingreso
    us       = pick(secretarios_us) if secretarios_us else usuarios[1]

    n_act = {
        "ADMITIDO":    random.randint(2, 3),
        "EN TRÁMITE":  random.randint(5, 10),
        "PARA SENTENCIA": random.randint(7, 12),
        "SENTENCIADO": random.randint(9, 14),
        "EN EJECUCIÓN": random.randint(7, 12),
        "EN RECURSO":  random.randint(6, 10),
        "ARCHIVADO":   random.randint(2, 5),
    }.get(estado, 3)

    folio = 1
    for k in range(n_act):
        tipo_act = pick(tipos_actuacion_lst)
        dias_off = k * random.randint(4, 18)
        f_act    = f_base + timedelta(days=dias_off + random.randint(1, 6))
        if f_act > HOY:
            f_act = HOY - timedelta(days=1)

        partes_exp  = partes_disp_map.get(exp.id_expediente, [])
        persona_str = nombre_completo(pick(partes_exp).id_persona) if partes_exp else "las partes"
        folio_fin   = folio + random.randint(1, 5)

        desc = descrip_por_tipo.get(tipo_act.codigo,
            "Actuación procesal registrada en el expediente por el actuario de turno.").format(
            folio=folio,
            folio_fin=folio_fin,
            fecha=f_act.strftime("%d/%m/%Y"),
            accion=pick(acciones_actu),
            persona=persona_str,
            destino=pick(destinos),
            ciudad=pick(ciudades_bo),
        )

        act = ActuacionProcesal.objects.create(
            id_expediente     = exp,
            id_tipo_actuacion = tipo_act,
            usuario           = us,
            folio_inicio      = folio,
            folio_fin         = folio_fin,
            descripcion       = desc,
            es_publica        = True,
            fecha_actuacion   = dtc(f_act, random.randint(8, 17), random.choice([0, 30])),
        )
        actuaciones.append(act)
        folio = folio_fin + 1

print(f"  ✓ {len(actuaciones)} actuaciones procesales")

# ─────────────────────────────────────────────────────────────
# 17. NOTIFICACIONES
# ─────────────────────────────────────────────────────────────
print("\n[17] Notificaciones...")

notificaciones  = []
tipos_notif     = ["CEDULA","EMAIL","PERSONAL","ESTRADOS","EDICTOS"]
estados_notif   = ["PENDIENTE","DILIGENCIADA","FALLIDA"]

for exp in expedientes:
    res_exp    = resolucion_por_exp.get(exp.id_expediente, [])
    partes_exp = partes_disp_map.get(exp.id_expediente, [])
    docs_exp   = Documento.objects.filter(id_expediente=exp)

    if not res_exp or not partes_exp or not docs_exp.exists():
        continue

    # Notificar las 3 últimas resoluciones a cada parte activa
    for res in res_exp[-3:]:
        doc = docs_exp.first()
        for parte in partes_exp[:4]:  # máx 4 partes
            tipo_n = pick(tipos_notif)
            est_n  = random.choices(estados_notif, weights=[20, 68, 12])[0]
            us     = pick(secretarios_us) if secretarios_us else usuarios[1]

            notif = Notificacion.objects.create(
                id_expediente       = exp,
                id_documento        = doc,
                id_parte            = parte,
                usuario             = us,
                tipo_notificacion   = tipo_n,
                estado_notificacion = est_n,
                fecha_diligencia    = timezone.now() - timedelta(days=random.randint(1, 120))
                                      if est_n == "DILIGENCIADA" else None,
            )
            notificaciones.append(notif)

print(f"  ✓ {len(notificaciones)} notificaciones")

# ─────────────────────────────────────────────────────────────
# 18. SOLICITUDES DE ACTUALIZACIÓN (IANUS)
# ─────────────────────────────────────────────────────────────
print("\n[18] Solicitudes de actualización IANUS...")

solicitudes = []
aux_us = auxiliares_us if auxiliares_us else [usuarios[-1]]

solicitudes_def = [
    ("IANUS-2021-001","SCZ-SALA-01","APROBADA","Carga inicial de expedientes gestión 2021 — 245 registros sincronizados"),
    ("IANUS-2021-002","SCZ-SALA-02","APROBADA","Sincronización datos penales 2021 — Sala Penal Primera y Segunda"),
    ("IANUS-2022-001","SCZ-SALA-01","APROBADA","Sincronización con IANUS para expedientes 2022 — período enero-junio"),
    ("IANUS-2022-002","SCZ-SALA-02","APROBADA","Actualización de estados de expedientes penales gestión 2022"),
    ("IANUS-2022-003","LPZ-SALA-01","RECHAZADA","Código de sala no corresponde al tribunal registrado en IANUS — corregir"),
    ("IANUS-2023-001","SCZ-SALA-01","APROBADA","Actualización masiva datos período enero-junio 2023 — 312 expedientes"),
    ("IANUS-2023-002","SCZ-SALA-03","APROBADA","Sincronización datos audiencias 2023 — Salas de audiencia B"),
    ("IANUS-2023-003","CBBA-SALA-1","APROBADA","Actualización estados expedientes Cochabamba 2023"),
    ("IANUS-2023-004","LPZ-SALA-02","RECHAZADA","Formato de número de expediente incorrecto — usar NNNN/AAAA"),
    ("IANUS-2024-001","SCZ-SALA-01","APROBADA","Actualización masiva datos período enero-junio 2024 — 280 expedientes"),
    ("IANUS-2024-002","SCZ-SALA-03","PENDIENTE","Solicitud de sincronización datos audiencias segundo semestre 2024"),
    ("IANUS-2024-003","CBBA-SALA-1","PENDIENTE","Actualización estados expedientes Cochabamba gestión 2024"),
    ("IANUS-2024-004","POT-SALA-01","PENDIENTE","Primera sincronización Tribunal de Potosí con IANUS"),
    ("IANUS-2025-001","SCZ-SALA-01","PENDIENTE","Sincronización inicio de gestión 2025 — datos al 31/01/2025"),
    ("IANUS-2025-002","LPZ-SALA-02","PENDIENTE","Actualización conformaciones de sala primer trimestre 2025"),
    ("IANUS-2025-003","SCZ-SALA-02","PENDIENTE","Carga de nuevos expedientes admitidos enero-febrero 2025"),
]

for cod_ianus, cod_sala, estado, obs in solicitudes_def:
    us  = pick(aux_us)
    sol = SolicitudActualizacion.objects.create(
        usuario          = us,
        codigo_ianus     = cod_ianus,
        codigo_sala      = cod_sala,
        estado_solicitud = estado,
        observacion      = obs,
        fecha_confirmacion = timezone.now() - timedelta(days=random.randint(1, 90))
                             if estado in ("APROBADA","RECHAZADA") else None,
    )
    solicitudes.append(sol)

print(f"  ✓ {len(solicitudes)} solicitudes IANUS")

# ─────────────────────────────────────────────────────────────
# RESUMEN FINAL
# ─────────────────────────────────────────────────────────────
total_exp = Expediente.objects.count()

print("\n" + "="*65)
print("   RESUMEN FINAL DE DATOS POBLADOS  —  v2.0")
print("="*65)
print(f"  Roles sistema           : {Rol.objects.count()}")
print(f"  Permisos                : {Permiso.objects.count()}")
print(f"  Asignaciones rol-permiso: {RolPermiso.objects.count()}")
print(f"  Tribunales              : {Tribunal.objects.count()}")
print(f"  Salas de tribunal       : {SalaTribunal.objects.count()}")
print(f"  Salas de audiencia      : {SalaAudiencia.objects.count()}")
print(f"  Personas                : {Persona.objects.count()}")
print(f"  Contactos               : {ContactoPersona.objects.count()}")
print(f"  Usuarios del sistema    : {Usuario.objects.count()}")
print(f"  Vocales                 : {VocalTribunal.objects.count()}")
print(f"  Tipos de proceso        : {TipoProceso.objects.count()}")
print(f"  Estados de expediente   : {EstadoExpediente.objects.count()}")
print(f"  Tipos de audiencia      : {TipoAudiencia.objects.count()}")
print(f"  Tipos de resolución     : {TipoResolucion.objects.count()}")
print(f"  Tipos de recurso        : {TipoRecurso.objects.count()}")
print(f"  Tipos de documento      : {TipoDoc.objects.count()}")
print(f"  Tipos de actuación      : {TipoActuacion.objects.count()}")
print(f"  Roles procesales        : {RolProcesal.objects.count()}")
print(f"  ── ── ── ── ── ── ── ──")
print(f"  Expedientes (total)     : {total_exp}")
print(f"  Conformaciones de sala  : {ConformacionSalaExpediente.objects.count()}")
print(f"  Partes procesales       : {ParteProcesal.objects.count()}")
print(f"  Historial de estados    : {HistorialEstado.objects.count()}")
print(f"  Audiencias              : {Audiencia.objects.count()}")
print(f"  Actas de audiencia      : {ActaAudiencia.objects.count()}")
print(f"  Asistencias             : {AsistenciaAudiencia.objects.count()}")
print(f"  Documentos              : {Documento.objects.count()}")
print(f"  Resoluciones            : {Resolucion.objects.count()}")
print(f"  Recursos                : {Recurso.objects.count()}")
print(f"  Actuaciones procesales  : {ActuacionProcesal.objects.count()}")
print(f"  Notificaciones          : {Notificacion.objects.count()}")
print(f"  Solicitudes IANUS       : {SolicitudActualizacion.objects.count()}")
print("="*65)
print("\n  CREDENCIALES DEL SISTEMA:")
print("  ─────────────────────────────────────────────────────")
print("  admin        → Admin123!      (Administrador)")
print("  rsalazar     → Vocal1234!     (Vocal — TDJ Santa Cruz)")
print("  cvillanueva  → Vocal1234!     (Vocal — TDJ Santa Cruz)")
print("  emontano     → Vocal1234!     (Vocal — TDJ La Paz)")
print("  lpardo       → Vocal1234!     (Vocal — TDJ La Paz)")
print("  mgutierrez   → Vocal1234!     (Vocal — TDJ Cochabamba)")
print("  achavez      → Vocal1234!     (Vocal — TDJ Oruro)")
print("  vsoto        → Secr1234!      (Secretario de Sala)")
print("  mquispe      → Secr1234!      (Secretario de Sala)")
print("  dromero      → Secr1234!      (Secretario de Sala)")
print("  amedrano     → Secr1234!      (Secretario de Sala)")
print("  rperez       → Secr1234!      (Secretario de Sala)")
print("  fsoliz       → Secr1234!      (Secretario de Sala)")
print("  aux01        → Aux12345!      (Auxiliar Judicial)")
print("  aux02        → Aux12345!      (Auxiliar Judicial)")
print("  consulta01   → Cons1234!      (Solo Lectura)")
print("="*65 + "\n")