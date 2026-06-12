# Al inicio, después de los imports
import graphene
from django.db import transaction
from graphql import GraphQLError
from graphene_django import DjangoObjectType
from django.contrib.auth.hashers import make_password
from django.db.models import ProtectedError
from datetime import datetime, timedelta
import pyotp
import random
import hashlib
from django.core.mail import send_mail
from django.conf import settings as django_settings
from .models import *
from django.utils import timezone 

# ============================================================
# TYPES
# ============================================================

class RolType(DjangoObjectType):
    class Meta:
        model = Rol
        fields = '__all__'

class PermisoType(DjangoObjectType):
    class Meta:
        model = Permiso
        fields = '__all__'

class RolPermisoType(DjangoObjectType):
    class Meta:
        model = RolPermiso
        fields = '__all__'

class UsuarioType(DjangoObjectType):
    class Meta:
        model = Usuario
        fields = '__all__'

class TribunalType(DjangoObjectType):
    class Meta:
        model = Tribunal
        fields = '__all__'

class EstadoExpedienteType(DjangoObjectType):
    class Meta:
        model = EstadoExpediente
        fields = '__all__'

class TipoProcesoType(DjangoObjectType):
    class Meta:
        model = TipoProceso
        fields = '__all__'

class TipoAudienciaType(DjangoObjectType):
    class Meta:
        model = TipoAudiencia
        fields = '__all__'

class TipoRecursoType(DjangoObjectType):
    class Meta:
        model = TipoRecurso
        fields = '__all__'

class TipoResolucionType(DjangoObjectType):
    class Meta:
        model = TipoResolucion
        fields = '__all__'

class TipoDocType(DjangoObjectType):
    class Meta:
        model = TipoDoc
        fields = '__all__'

class TipoActuacionType(DjangoObjectType):
    class Meta:
        model = TipoActuacion
        fields = '__all__'

class RolProcesalType(DjangoObjectType):
    class Meta:
        model = RolProcesal
        fields = '__all__'

class SalaTribunalType(DjangoObjectType):
    class Meta:
        model = SalaTribunal
        fields = '__all__'

class SalaAudienciaType(DjangoObjectType):
    class Meta:
        model = SalaAudiencia
        fields = '__all__'

class PersonaType(DjangoObjectType):
    class Meta:
        model = Persona
        fields = '__all__'

class VocalTribunalType(DjangoObjectType):
    class Meta:
        model = VocalTribunal
        fields = '__all__'

class ExpedienteType(DjangoObjectType):
    class Meta:
        model = Expediente
        fields = '__all__'

class ConformacionSalaExpedienteType(DjangoObjectType):
    class Meta:
        model = ConformacionSalaExpediente
        fields = '__all__'

class HistorialEstadoType(DjangoObjectType):
    class Meta:
        model = HistorialEstado
        fields = '__all__'

class ParteProcesalType(DjangoObjectType):
    class Meta:
        model = ParteProcesal
        fields = '__all__'

class DocumentoType(DjangoObjectType):
    class Meta:
        model = Documento
        fields = '__all__'

class AudienciaType(DjangoObjectType):
    class Meta:
        model = Audiencia
        fields = '__all__'

class ActaAudienciaType(DjangoObjectType):
    class Meta:
        model = ActaAudiencia
        fields = '__all__'

class AsistenciaAudienciaType(DjangoObjectType):
    class Meta:
        model = AsistenciaAudiencia
        fields = '__all__'

class ContactoPersonaType(DjangoObjectType):
    class Meta:
        model = ContactoPersona
        fields = '__all__'

class ResolucionType(DjangoObjectType):
    class Meta:
        model = Resolucion
        fields = '__all__'

class RecursoType(DjangoObjectType):
    class Meta:
        model = Recurso
        fields = '__all__'

class ActuacionProcesalType(DjangoObjectType):
    class Meta:
        model = ActuacionProcesal
        fields = '__all__'

class NotificacionType(DjangoObjectType):
    class Meta:
        model = Notificacion
        fields = '__all__'

class SolicitudActualizacionType(DjangoObjectType):
    class Meta:
        model = SolicitudActualizacion
        fields = '__all__'

class DenunciaType(DjangoObjectType):
    class Meta:
        model = Denuncia
        fields = '__all__'

class ResolucionAntiguaType(DjangoObjectType):
    class Meta:
        model = ResolucionAntigua
        fields = '__all__'
















# ============================================================
# INPUT TYPES
# ============================================================

class CrearUsuarioInput(graphene.InputObjectType):
    nombres             = graphene.String(required=True)
    paterno             = graphene.String(required=True)
    materno             = graphene.String()
    documento_identidad = graphene.String(required=True)
    email               = graphene.String(required=True)
    username            = graphene.String(required=True)
    password            = graphene.String(required=True)
    id_rol              = graphene.Int(required=True)
    cargo_oficial       = graphene.String()

class ActualizarUsuarioInput(graphene.InputObjectType):
    nombres       = graphene.String()
    paterno       = graphene.String()
    email         = graphene.String()
    cargo_oficial = graphene.String()
    activo        = graphene.Boolean()
    id_rol        = graphene.Int()
    password = graphene.String()

class CrearPersonaInput(graphene.InputObjectType):
    numero_documento       = graphene.String(required=True)
    nombre                 = graphene.String(required=True)
    primer_apellido        = graphene.String(required=True)
    segundo_apellido       = graphene.String()
    estamento              = graphene.String()
    registro_universitario = graphene.String()
    es_abogado             = graphene.Boolean()
    titular_a              = graphene.String()

class ActualizarPersonaInput(graphene.InputObjectType):
    numero_documento       = graphene.String()
    nombre                 = graphene.String()
    primer_apellido        = graphene.String()
    segundo_apellido       = graphene.String()
    estamento              = graphene.String()
    registro_universitario = graphene.String()
    es_abogado             = graphene.Boolean()
    titular_a              = graphene.String()

class CrearExpedienteInput(graphene.InputObjectType):
    numero_expediente    = graphene.String(required=True)
    ano                  = graphene.Int(required=True)
    id_sala              = graphene.Int(required=True)
    id_tipo_proceso      = graphene.Int(required=True)
    id_estado_expediente = graphene.Int()
    descripcion          = graphene.String()

class ActualizarExpedienteInput(graphene.InputObjectType):
    numero_expediente    = graphene.String()
    ano                  = graphene.Int()
    id_sala              = graphene.Int()
    id_tipo_proceso      = graphene.Int()
    id_estado_expediente = graphene.Int()
    descripcion          = graphene.String()

class CrearAudienciaInput(graphene.InputObjectType):
    id_expediente         = graphene.Int(required=True)
    id_tipo_audiencia     = graphene.Int(required=True)
    fecha_hora_programada = graphene.String(required=True)
    id_sala_aud           = graphene.Int()
    link_videoconferencia = graphene.String()

class ActualizarAudienciaInput(graphene.InputObjectType):
    id_tipo_audiencia     = graphene.Int()
    id_sala_aud           = graphene.Int()
    fecha_hora_programada = graphene.String()
    fecha_hora_inicio     = graphene.String()
    fecha_hora_fin        = graphene.String()
    estado_audiencia      = graphene.String()
    motivo_suspension     = graphene.String()
    link_videoconferencia = graphene.String()

class CrearResolucionInput(graphene.InputObjectType):
    id_expediente     = graphene.Int(required=True)
    id_tipo_res       = graphene.Int(required=True)
    numero_resolucion = graphene.String(required=True)
    fecha_resolucion  = graphene.String(required=True)
    parte_dispositiva = graphene.String(required=True)
    fundamentacion    = graphene.String()

class ActualizarResolucionInput(graphene.InputObjectType):
    id_tipo_res        = graphene.Int()
    numero_resolucion  = graphene.String()
    fecha_resolucion   = graphene.String()
    parte_dispositiva  = graphene.String()
    fundamentacion     = graphene.String()
    estado             = graphene.String()
    es_recurrible      = graphene.Boolean()
    plazo_recurso_dias = graphene.Int()

class ActualizarSalaAudienciaInput(graphene.InputObjectType):
    nombre_sala        = graphene.String()
    capacidad          = graphene.Int()
    equipada_videoconf = graphene.Boolean()
    enlace_virtual     = graphene.String()
    activa             = graphene.Boolean()

class ActualizarVocalInput(graphene.InputObjectType):
    id_sala          = graphene.Int()
    cargo            = graphene.String()
    fecha_conclusion = graphene.String()
    activo           = graphene.Boolean()

class ActualizarActaInput(graphene.InputObjectType):
    contenido     = graphene.String()
    firmada       = graphene.Boolean()
    url_grabacion = graphene.String()

class ActualizarConformacionInput(graphene.InputObjectType):
    id_vocal    = graphene.Int()
    rol_en_caso = graphene.String()

class ActualizarRolInput(graphene.InputObjectType):
    nombre      = graphene.String()
    descripcion = graphene.String()
    activo      = graphene.Boolean()

class ActualizarPermisoInput(graphene.InputObjectType):
    nombre      = graphene.String()
    codigo      = graphene.String()
    modulo      = graphene.String()
    descripcion = graphene.String()

class ActualizarDocumentoInput(graphene.InputObjectType):
    titulo       = graphene.String()
    numero_folio = graphene.Int()
    ruta_archivo = graphene.String()

class ActualizarTipoDocInput(graphene.InputObjectType):
    codigo         = graphene.String()
    nombre         = graphene.String()
    requiere_firma = graphene.Boolean()
    es_publico     = graphene.Boolean()
    descripcion    = graphene.String()

class ActualizarTipoRecursoInput(graphene.InputObjectType):
    nombre      = graphene.String()
    descripcion = graphene.String()

class ActualizarTipoResolucionInput(graphene.InputObjectType):
    codigo           = graphene.String()
    nombre           = graphene.String()
    nivel_jerarquico = graphene.Int()
    descripcion      = graphene.String()

class ActualizarRolProcesalInput(graphene.InputObjectType):
    nombre_rol = graphene.String()

class ActualizarParteProcesalInput(graphene.InputObjectType):
    activo          = graphene.Boolean()
    fecha_exclusion = graphene.String()

class ActualizarActuacionProcesalInput(graphene.InputObjectType):
    descripcion  = graphene.String()
    folio_inicio = graphene.Int()
    folio_fin    = graphene.Int()

class ActualizarRecursoInput(graphene.InputObjectType):
    estado_recurso = graphene.String()
    fundamentos    = graphene.String()

class ActualizarNotificacionInput(graphene.InputObjectType):
    estado_notificacion = graphene.String()
    fecha_diligencia    = graphene.String()

class ActualizarAsistenciaInput(graphene.InputObjectType):
    asistio             = graphene.Boolean()
    motivo_inasistencia = graphene.String()
    hora_ingreso        = graphene.String()

class ActualizarContactoInput(graphene.InputObjectType):
    valor        = graphene.String()
    es_principal = graphene.Boolean()
    validado     = graphene.Boolean()

class ActualizarTipoActuacionInput(graphene.InputObjectType):
    codigo = graphene.String()
    nombre = graphene.String()

# En tu archivo schema.py

class ActualizarSolicitudInput(graphene.InputObjectType):
    estado_solicitud = graphene.String(required=True)
    fecha_confirmacion = graphene.DateTime()
    observacion = graphene.String()

class VerificacionCertificadoType(graphene.ObjectType):
    puede_emitir            = graphene.Boolean()
    tiene_procesos_activos  = graphene.Boolean()
    procesos_activos        = graphene.List(graphene.String)
    email_persona           = graphene.String()
    mensaje                 = graphene.String()

class ReporteEstadoType(graphene.ObjectType):
    estado    = graphene.String()
    cantidad  = graphene.Int()
 
class ReporteMesType(graphene.ObjectType):
    mes      = graphene.String()
    cantidad = graphene.Int()
 
class ReporteTipoType(graphene.ObjectType):
    tipo     = graphene.String()
    cantidad = graphene.Int()
 
class ReporteCargaSalaType(graphene.ObjectType):
    sala        = graphene.String()
    tribunal    = graphene.String()
    audiencias  = graphene.Int()
    expedientes = graphene.Int()
 
class ReporteUsuarioType(graphene.ObjectType):
    usuario     = graphene.String()
    rol         = graphene.String()
    audiencias  = graphene.Int()
    actuaciones = graphene.Int()
    documentos  = graphene.Int()

# ============================================================
# INPUT TYPES - DENUNCIA
# ============================================================

class CrearDenunciaInput(graphene.InputObjectType):
    numero_denuncia = graphene.String(required=True)
    id_denunciante = graphene.Int(required=True)
    id_denunciado = graphene.Int(required=True)
    tipo_denunciado = graphene.String(required=True)  
    descripcion = graphene.String(required=True)
    id_expediente = graphene.Int()  


class ActualizarDenunciaInput(graphene.InputObjectType):
    estado = graphene.String()
    resolucion = graphene.String()
    fecha_resolucion = graphene.String() 
    tipo_denunciado = graphene.String()   
    descripcion = graphene.String()       

class CrearResolucionAntiguaInput(graphene.InputObjectType):
    numero_resolucion = graphene.String(required=True)
    fecha_resolucion = graphene.String(required=True)
    id_persona_afectada = graphene.Int(required=True)
    tipo_sancion = graphene.String(required=True)  # SANCION, ABSOLUCION, ARCHIVO
    descripcion = graphene.String()
    sancion = graphene.String()
    documento_url = graphene.String()

class ActualizarResolucionAntiguaInput(graphene.InputObjectType):
    numero_resolucion = graphene.String()
    fecha_resolucion = graphene.String()
    tipo_sancion = graphene.String()
    descripcion = graphene.String()
    sancion = graphene.String()
    documento_url = graphene.String()



def _aplicar_filtro_fecha(qs, campo_fecha, anio=None, mes=None, fecha_inicio=None, fecha_fin=None):
    """Aplica filtros de fecha a un queryset."""
    from datetime import datetime
    if fecha_inicio and fecha_fin:
        try:
            fi = datetime.strptime(fecha_inicio, '%Y-%m-%d')
            ff = datetime.strptime(fecha_fin,    '%Y-%m-%d')
            qs = qs.filter(**{f"{campo_fecha}__gte": fi.date(), f"{campo_fecha}__lte": ff.date()})
        except ValueError:
            pass
    elif anio and mes:
        qs = qs.filter(**{f"{campo_fecha}__year": anio, f"{campo_fecha}__month": mes})
    elif anio:
        qs = qs.filter(**{f"{campo_fecha}__year": anio})
    elif mes:
        from django.utils import timezone
        anio_actual = timezone.now().year
        qs = qs.filter(**{f"{campo_fecha}__year": anio_actual, f"{campo_fecha}__month": mes})
    return qs













# ============================================================
# QUERIES
# ============================================================

class Query(graphene.ObjectType):
    all_usuarios           = graphene.List(UsuarioType)
    all_roles              = graphene.List(RolType)
    all_permisos           = graphene.List(PermisoType)
    all_tribunales         = graphene.List(TribunalType)
    all_salas_tribunal     = graphene.List(SalaTribunalType)
    all_salas_audiencia    = graphene.List(SalaAudienciaType)
    all_tipos_proceso      = graphene.List(TipoProcesoType)
    all_estados_expediente = graphene.List(EstadoExpedienteType)
    all_personas           = graphene.List(PersonaType)
    all_contactos          = graphene.List(ContactoPersonaType)
    all_tipos_audiencia    = graphene.List(TipoAudienciaType)
    all_expedientes        = graphene.List(ExpedienteType)
    all_conformaciones     = graphene.List(ConformacionSalaExpedienteType)
    all_historiales        = graphene.List(HistorialEstadoType)
    all_actas              = graphene.List(ActaAudienciaType)
    all_recursos           = graphene.List(RecursoType)
    all_documentos         = graphene.List(DocumentoType)
    all_roles_procesal     = graphene.List(RolProcesalType)
    all_audiencias         = graphene.List(AudienciaType)
    all_tipos_recurso      = graphene.List(TipoRecursoType)
    all_resoluciones       = graphene.List(ResolucionType)
    all_solicitudes        = graphene.List(SolicitudActualizacionType)
    all_actuaciones        = graphene.List(ActuacionProcesalType)
    all_tipos_actuacion    = graphene.List(TipoActuacionType)
    all_asistencias        = graphene.List(AsistenciaAudienciaType)
    asistencias_por_audiencia = graphene.List(AsistenciaAudienciaType, id_audiencia=graphene.Int(required=True))
    all_vocales            = graphene.List(VocalTribunalType)
    all_partes_procesales  = graphene.List(ParteProcesalType)
    all_tipos_resolucion   = graphene.List(TipoResolucionType)
    all_notificaciones     = graphene.List(NotificacionType)
    all_tipos_doc          = graphene.List(TipoDocType)
    reporte_audiencias_por_estado = graphene.List(ReporteEstadoType,   anio=graphene.Int(), mes=graphene.Int(), fecha_inicio=graphene.String(), fecha_fin=graphene.String())
    reporte_audiencias_por_mes    = graphene.List(ReporteMesType,      anio=graphene.Int(), mes=graphene.Int(), fecha_inicio=graphene.String(), fecha_fin=graphene.String())
    reporte_expedientes_por_tipo  = graphene.List(ReporteTipoType,     anio=graphene.Int(), mes=graphene.Int(), fecha_inicio=graphene.String(), fecha_fin=graphene.String())
    reporte_expedientes_por_estado= graphene.List(ReporteEstadoType,   anio=graphene.Int(), mes=graphene.Int(), fecha_inicio=graphene.String(), fecha_fin=graphene.String())
    reporte_carga_por_sala        = graphene.List(ReporteCargaSalaType, anio=graphene.Int(), mes=graphene.Int(), fecha_inicio=graphene.String(), fecha_fin=graphene.String())
    reporte_actividad_usuarios    = graphene.List(ReporteUsuarioType,   anio=graphene.Int(), mes=graphene.Int(), fecha_inicio=graphene.String(), fecha_fin=graphene.String())

    usuario_by_id    = graphene.Field(UsuarioType,    id=graphene.Int(required=True))
    tribunal_by_id   = graphene.Field(TribunalType,   id=graphene.Int(required=True))
    expediente_by_id = graphene.Field(ExpedienteType, id=graphene.Int(required=True))
    persona_by_id    = graphene.Field(PersonaType,    id=graphene.Int(required=True))

    verificar_certificado_persona = graphene.Field(
        'tribunal.schema.VerificacionCertificadoType',
        id_persona=graphene.Int(required=True)
    )


    partes_por_expediente         = graphene.List(ParteProcesalType,                id_expediente=graphene.Int(required=True))
    audiencias_por_expediente     = graphene.List(AudienciaType,                    id_expediente=graphene.Int(required=True))
    resoluciones_por_expediente   = graphene.List(ResolucionType,                   id_expediente=graphene.Int(required=True))
    documentos_por_expediente     = graphene.List(DocumentoType,                    id_expediente=graphene.Int(required=True))
    actuaciones_por_expediente    = graphene.List(ActuacionProcesalType,            id_expediente=graphene.Int(required=True))
    historial_por_expediente      = graphene.List(HistorialEstadoType,              id_expediente=graphene.Int(required=True))
    conformaciones_por_expediente = graphene.List(ConformacionSalaExpedienteType,   id_expediente=graphene.Int(required=True))
    recursos_por_expediente       = graphene.List(RecursoType,                      id_expediente=graphene.Int(required=True))






    resolucion_by_id = graphene.Field(ResolucionType, id=graphene.Int(required=True))
    audiencia_by_id  = graphene.Field(AudienciaType,  id=graphene.Int(required=True))
    documento_by_id  = graphene.Field(DocumentoType,  id=graphene.Int(required=True))

    all_denuncias = graphene.List(DenunciaType)
    denuncia_by_id = graphene.Field(DenunciaType, id=graphene.Int(required=True))
    all_resoluciones_antiguas = graphene.List(ResolucionAntiguaType)
    resolucion_antigua_by_id = graphene.Field(ResolucionAntiguaType, id=graphene.Int(required=True))
    


    def resolve_all_usuarios(root, info):           return Usuario.objects.all()
    def resolve_all_roles(root, info):              return Rol.objects.all()
    def resolve_all_permisos(root, info):           return Permiso.objects.all()
    def resolve_all_tribunales(root, info):         return Tribunal.objects.all()
    def resolve_all_salas_tribunal(root, info):     return SalaTribunal.objects.all()
    def resolve_all_salas_audiencia(root, info):    return SalaAudiencia.objects.all()
    def resolve_all_tipos_proceso(root, info):      return TipoProceso.objects.all()
    def resolve_all_estados_expediente(root, info): return EstadoExpediente.objects.all()
    def resolve_all_personas(root, info):           return Persona.objects.all()
    def resolve_all_contactos(root, info):          return ContactoPersona.objects.all()
    def resolve_all_tipos_audiencia(root, info):    return TipoAudiencia.objects.all()
    def resolve_all_expedientes(root, info):        return Expediente.objects.all()
    def resolve_all_conformaciones(root, info):     return ConformacionSalaExpediente.objects.all()
    def resolve_all_historiales(root, info):        return HistorialEstado.objects.all()
    def resolve_all_actas(root, info):              return ActaAudiencia.objects.all()
    def resolve_all_recursos(root, info):           return Recurso.objects.all()
    def resolve_all_documentos(root, info):         return Documento.objects.all()
    def resolve_all_roles_procesal(root, info):     return RolProcesal.objects.all()
    def resolve_all_audiencias(root, info):         return Audiencia.objects.all()
    def resolve_all_tipos_recurso(root, info):      return TipoRecurso.objects.all()
    def resolve_all_resoluciones(root, info):       return Resolucion.objects.all()
    def resolve_all_solicitudes(root, info):        return SolicitudActualizacion.objects.all()
    def resolve_all_actuaciones(root, info):        return ActuacionProcesal.objects.all()
    def resolve_all_tipos_actuacion(root, info):    return TipoActuacion.objects.all()
    def resolve_all_asistencias(root, info):        return AsistenciaAudiencia.objects.all()


    def resolve_asistencias_por_audiencia(root, info, id_audiencia):
        return AsistenciaAudiencia.objects.filter(
            id_audiencia__id_audiencia=id_audiencia
        ).select_related("id_persona", "id_audiencia")

    def resolve_all_vocales(root, info):            return VocalTribunal.objects.all()
    def resolve_all_partes_procesales(root, info):  return ParteProcesal.objects.all()
    def resolve_all_tipos_resolucion(root, info):   return TipoResolucion.objects.all()
    def resolve_all_notificaciones(root, info):     return Notificacion.objects.all()
    def resolve_all_tipos_doc(root, info):          return TipoDoc.objects.all()

    def resolve_usuario_by_id(root, info, id):
        try: return Usuario.objects.get(id_usuario=id)
        except Usuario.DoesNotExist: return None

    def resolve_tribunal_by_id(root, info, id):
        try: return Tribunal.objects.get(id_tribunal=id)
        except Tribunal.DoesNotExist: return None

    def resolve_expediente_by_id(root, info, id):
        try: return Expediente.objects.get(id_expediente=id)
        except Expediente.DoesNotExist: return None

    def resolve_expediente_by_id(root, info, id):
        try: return Expediente.objects.get(id_expediente=id)
        except Expediente.DoesNotExist: return None

    # ← PEGA AQUÍ los resolvers:
    def resolve_partes_por_expediente(root, info, id_expediente):
        return ParteProcesal.objects.filter(id_expediente__id_expediente=id_expediente)

    def resolve_audiencias_por_expediente(root, info, id_expediente):
        return Audiencia.objects.filter(id_expediente__id_expediente=id_expediente)

    def resolve_resoluciones_por_expediente(root, info, id_expediente):
        return Resolucion.objects.filter(id_expediente__id_expediente=id_expediente)

    def resolve_documentos_por_expediente(root, info, id_expediente):
        return Documento.objects.filter(id_expediente__id_expediente=id_expediente)

    def resolve_actuaciones_por_expediente(root, info, id_expediente):
        return ActuacionProcesal.objects.filter(id_expediente__id_expediente=id_expediente)

    def resolve_historial_por_expediente(root, info, id_expediente):
        return HistorialEstado.objects.filter(id_expediente__id_expediente=id_expediente)

    def resolve_conformaciones_por_expediente(root, info, id_expediente):
        return ConformacionSalaExpediente.objects.filter(id_expediente__id_expediente=id_expediente)

    def resolve_recursos_por_expediente(root, info, id_expediente):
        return Recurso.objects.filter(
            id_resolucion_impugnada__id_expediente__id_expediente=id_expediente
        )


    def resolve_persona_by_id(root, info, id):
        try: return Persona.objects.get(id_persona=id)
        except Persona.DoesNotExist: return None

    def resolve_verificar_certificado_persona(root, info, id_persona):
        try:
            persona = Persona.objects.get(id_persona=id_persona)
        except Persona.DoesNotExist:
            return VerificacionCertificadoType(
                puede_emitir=False,
                tiene_procesos_activos=False,
                procesos_activos=[],
                email_persona=None,
                mensaje="Persona no encontrada."
            )

        # Buscar partes procesales activas con expediente NO terminal
        partes_activas = ParteProcesal.objects.filter(
            id_persona=persona,
            activo=True,
        ).exclude(
            id_expediente__id_estado_expediente__es_terminal=True
        ).select_related(
            'id_expediente',
            'id_expediente__id_estado_expediente',
            'id_rol'
        )

        procesos_activos = [
            f"{p.id_expediente.numero_expediente} — {p.id_rol.nombre_rol} — {p.id_expediente.id_estado_expediente.nombre_estado if p.id_expediente.id_estado_expediente else 'Sin estado'}"
            for p in partes_activas
        ]

        # Buscar email
        contacto_email = ContactoPersona.objects.filter(
            id_persona=persona,
            tipo_contacto__iexact="EMAIL"
        ).order_by('-es_principal').first()

        return VerificacionCertificadoType(
            puede_emitir=len(procesos_activos) == 0,
            tiene_procesos_activos=len(procesos_activos) > 0,
            procesos_activos=procesos_activos,
            email_persona=contacto_email.valor if contacto_email else None,
            mensaje="La persona tiene procesos activos, no se puede emitir el certificado." if procesos_activos else "La persona no tiene procesos activos. Puede emitirse el certificado."
        )

    def resolve_resolucion_by_id(root, info, id):
        try: return Resolucion.objects.get(id_resolucion=id)
        except Resolucion.DoesNotExist: return None

    def resolve_audiencia_by_id(root, info, id):
        try: return Audiencia.objects.get(id_audiencia=id)
        except Audiencia.DoesNotExist: return None

    def resolve_documento_by_id(root, info, id):
        try: return Documento.objects.get(id_documento=id)
        except Documento.DoesNotExist: return None

    




    def resolve_reporte_audiencias_por_estado(root, info, anio=None, mes=None, fecha_inicio=None, fecha_fin=None):
        from django.db.models import Count
        qs = _aplicar_filtro_fecha(Audiencia.objects.all(), 'fecha_hora_programada', anio, mes, fecha_inicio, fecha_fin)
        return [
            ReporteEstadoType(estado=r['estado_audiencia'], cantidad=r['total'])
            for r in qs.values('estado_audiencia').annotate(total=Count('id_audiencia'))
        ]

    def resolve_reporte_audiencias_por_mes(root, info, anio=None, mes=None, fecha_inicio=None, fecha_fin=None):
        from django.db.models import Count
        from django.db.models.functions import ExtractMonth
        MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
        qs = _aplicar_filtro_fecha(Audiencia.objects.all(), 'fecha_hora_programada', anio, mes, fecha_inicio, fecha_fin)
        data = {
            r['mes']: r['total']
            for r in qs.annotate(mes=ExtractMonth('fecha_hora_programada'))
                    .values('mes').annotate(total=Count('id_audiencia'))
        }
        return [
            ReporteMesType(mes=MESES[m-1], cantidad=data.get(m, 0))
            for m in range(1, 13)
        ]

    def resolve_reporte_expedientes_por_tipo(root, info, anio=None, mes=None, fecha_inicio=None, fecha_fin=None):
        from django.db.models import Count
        qs = _aplicar_filtro_fecha(Expediente.objects.all(), 'fecha_ingreso', anio, mes, fecha_inicio, fecha_fin)
        return [
            ReporteTipoType(tipo=r['id_tipo_proceso__nombre'], cantidad=r['total'])
            for r in qs.values('id_tipo_proceso__nombre').annotate(total=Count('id_expediente'))
        ]

    def resolve_reporte_expedientes_por_estado(root, info, anio=None, mes=None, fecha_inicio=None, fecha_fin=None):
        from django.db.models import Count
        qs = _aplicar_filtro_fecha(Expediente.objects.exclude(id_estado_expediente=None), 'fecha_ingreso', anio, mes, fecha_inicio, fecha_fin)
        return [
            ReporteEstadoType(estado=r['id_estado_expediente__nombre_estado'], cantidad=r['total'])
            for r in qs.values('id_estado_expediente__nombre_estado').annotate(total=Count('id_expediente'))
        ]

    def resolve_reporte_carga_por_sala(root, info, anio=None, mes=None, fecha_inicio=None, fecha_fin=None):
        salas = SalaTribunal.objects.select_related('id_tribunal').filter(activa=True)
        resultado = []
        for sala in salas:
            aud_qs = _aplicar_filtro_fecha(
                Audiencia.objects.filter(id_sala_aud__id_tribunal=sala.id_tribunal),
                'fecha_hora_programada', anio, mes, fecha_inicio, fecha_fin
            )
            exp_qs = _aplicar_filtro_fecha(
                Expediente.objects.filter(id_sala=sala),
                'fecha_ingreso', anio, mes, fecha_inicio, fecha_fin
            )
            resultado.append(ReporteCargaSalaType(
                sala=sala.nombre_sala,
                tribunal=sala.id_tribunal.nombre_tribunal,
                audiencias=aud_qs.count(),
                expedientes=exp_qs.count(),
            ))
        return resultado

    def resolve_reporte_actividad_usuarios(root, info, anio=None, mes=None, fecha_inicio=None, fecha_fin=None):
        usuarios = Usuario.objects.filter(activo=True).select_related('rol')
        resultado = []
        for u in usuarios:
            act_qs = _aplicar_filtro_fecha(
                ActuacionProcesal.objects.filter(usuario=u),
                'fecha_actuacion', anio, mes, fecha_inicio, fecha_fin
            )
            resultado.append(ReporteUsuarioType(
                usuario=f"{u.paterno} {u.nombres}",
                rol=u.rol.nombre,
                audiencias=0,
                actuaciones=act_qs.count(),
                documentos=0,
            ))
        return resultado

    def resolve_all_denuncias(root, info):
        return Denuncia.objects.all()
    
    def resolve_denuncia_by_id(root, info, id):
        try:
            return Denuncia.objects.get(id=id)
        except Denuncia.DoesNotExist:
            return None
    
    def resolve_all_resoluciones_antiguas(root, info):
        return ResolucionAntigua.objects.all()
    
    def resolve_resolucion_antigua_by_id(root, info, id):
        try:
            return ResolucionAntigua.objects.get(id_resolucion_antigua=id)
        except ResolucionAntigua.DoesNotExist:
            return None


# ============================================================
# MUTATIONS
# ============================================================

# --- USUARIO ---
class CrearUsuario(graphene.Mutation):
    class Arguments:
        input = CrearUsuarioInput(required=True)
    usuario = graphene.Field(UsuarioType)
    def mutate(root, info, input):
        rol = Rol.objects.get(id_rol=input.id_rol)
        obj = Usuario.objects.create(
            nombres=input.nombres,
            paterno=input.paterno,
            materno=input.materno,                  # ✅ acceso directo
            documento_identidad=input.documento_identidad,
            email=input.email,
            username=input.username,
            password=make_password(input.password),
            rol=rol,
            cargo_oficial=input.cargo_oficial       # ✅ acceso directo
        )
        return CrearUsuario(usuario=obj)
# nuevo actulizar usuario
class ActualizarUsuario(graphene.Mutation):
    class Arguments:
        id    = graphene.Int(required=True)
        input = ActualizarUsuarioInput(required=True)
    
    usuario = graphene.Field(UsuarioType)
    
    def mutate(root, info, id, input):
        try:
            obj = Usuario.objects.get(id_usuario=id)
            
            if input.nombres:               obj.nombres = input.nombres
            if input.paterno:               obj.paterno = input.paterno
            if input.email:                 obj.email = input.email
            if input.cargo_oficial is not None: obj.cargo_oficial = input.cargo_oficial
            if input.activo is not None:    obj.activo = input.activo
            if input.id_rol:                obj.rol = Rol.objects.get(id_rol=input.id_rol)
            
            # ← AGREGA ESTA PARTE PARA ACTUALIZAR CONTRASEÑA
            if input.password:
                from django.contrib.auth.hashers import make_password
                obj.password = make_password(input.password)
            
            obj.save()
            return ActualizarUsuario(usuario=obj)
        except Usuario.DoesNotExist:
            return ActualizarUsuario(usuario=None)

class EliminarUsuario(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
    ok      = graphene.Boolean()
    mensaje = graphene.String()
    def mutate(root, info, id):
        try:
            Usuario.objects.get(id_usuario=id).delete()
            return EliminarUsuario(ok=True, mensaje=None)
        except Usuario.DoesNotExist:
            return EliminarUsuario(ok=False, mensaje="Usuario no encontrado")
        except ProtectedError:
            return EliminarUsuario(ok=False, mensaje="No se puede eliminar: el usuario tiene registros relacionados")
        except Exception as e:
            return EliminarUsuario(ok=False, mensaje=str(e))


# --- ROL ---
class CrearRol(graphene.Mutation):
    class Arguments:
        nombre      = graphene.String(required=True)
        descripcion = graphene.String()
    rol = graphene.Field(RolType)
    def mutate(root, info, nombre, descripcion=None):
        return CrearRol(rol=Rol.objects.create(nombre=nombre, descripcion=descripcion))

class ActualizarRol(graphene.Mutation):
    class Arguments:
        id    = graphene.Int(required=True)
        input = ActualizarRolInput(required=True)
    rol = graphene.Field(RolType)
    def mutate(root, info, id, input):
        try:
            obj = Rol.objects.get(id_rol=id)
            if input.nombre is not None:      obj.nombre = input.nombre
            if input.descripcion is not None: obj.descripcion = input.descripcion
            if input.activo is not None:      obj.activo = input.activo
            obj.save()
            return ActualizarRol(rol=obj)
        except Rol.DoesNotExist:
            return ActualizarRol(rol=None)

class EliminarRol(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
    ok      = graphene.Boolean()
    mensaje = graphene.String()
    def mutate(root, info, id):
        try:
            with transaction.atomic():
                Rol.objects.get(id_rol=id).delete()
            return EliminarRol(ok=True, mensaje=None)
        except Rol.DoesNotExist:
            return EliminarRol(ok=False, mensaje="Rol no encontrado")
        except ProtectedError:
            return EliminarRol(ok=False, mensaje="No se puede eliminar: el rol tiene usuarios asignados")
        except Exception as e:
            return EliminarRol(ok=False, mensaje=str(e))


# --- PERMISO ---
class CrearPermiso(graphene.Mutation):
    class Arguments:
        nombre      = graphene.String(required=True)
        codigo      = graphene.String(required=True)
        modulo      = graphene.String(required=True)
        descripcion = graphene.String()
    permiso = graphene.Field(PermisoType)
    def mutate(root, info, nombre, codigo, modulo, descripcion=None):
        return CrearPermiso(permiso=Permiso.objects.create(
            nombre=nombre, codigo=codigo, modulo=modulo, descripcion=descripcion))

class ActualizarPermiso(graphene.Mutation):
    class Arguments:
        id    = graphene.Int(required=True)
        input = ActualizarPermisoInput(required=True)
    permiso = graphene.Field(PermisoType)
    def mutate(root, info, id, input):
        try:
            obj = Permiso.objects.get(id_permiso=id)
            if input.nombre is not None:      obj.nombre = input.nombre
            if input.codigo is not None:      obj.codigo = input.codigo
            if input.modulo is not None:      obj.modulo = input.modulo
            if input.descripcion is not None: obj.descripcion = input.descripcion
            obj.save()
            return ActualizarPermiso(permiso=obj)
        except Permiso.DoesNotExist:
            return ActualizarPermiso(permiso=None)

class EliminarPermiso(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
    ok      = graphene.Boolean()
    mensaje = graphene.String()
    def mutate(root, info, id):
        try:
            with transaction.atomic():
                Permiso.objects.get(id_permiso=id).delete()
            return EliminarPermiso(ok=True, mensaje=None)
        except Permiso.DoesNotExist:
            return EliminarPermiso(ok=False, mensaje="Permiso no encontrado")
        except ProtectedError:
            return EliminarPermiso(ok=False, mensaje="No se puede eliminar: el permiso está asignado a roles")
        except Exception as e:
            return EliminarPermiso(ok=False, mensaje=str(e))

class AsignarPermisoARol(graphene.Mutation):
    class Arguments:
        id_rol     = graphene.Int(required=True)
        id_permiso = graphene.Int(required=True)
    rol_permiso = graphene.Field(RolPermisoType)
    def mutate(root, info, id_rol, id_permiso):
        rol     = Rol.objects.get(id_rol=id_rol)
        permiso = Permiso.objects.get(id_permiso=id_permiso)
        obj, _  = RolPermiso.objects.get_or_create(rol=rol, permiso=permiso)
        return AsignarPermisoARol(rol_permiso=obj)

class RemoverPermisoDeRol(graphene.Mutation):
    class Arguments:
        id_rol     = graphene.Int(required=True)
        id_permiso = graphene.Int(required=True)
    ok = graphene.Boolean()
    def mutate(root, info, id_rol, id_permiso):
        RolPermiso.objects.filter(rol_id=id_rol, permiso_id=id_permiso).delete()
        return RemoverPermisoDeRol(ok=True)


# --- TRIBUNAL ---
class CrearTribunal(graphene.Mutation):
    class Arguments:
        nombre_tribunal = graphene.String(required=True)
        instancia       = graphene.String(required=True)
        norma_creacion  = graphene.String(required=True)
    tribunal = graphene.Field(TribunalType)
    def mutate(root, info, nombre_tribunal, instancia, norma_creacion):
        return CrearTribunal(tribunal=Tribunal.objects.create(
            nombre_tribunal=nombre_tribunal,
            instancia=instancia,
            norma_creacion=norma_creacion))

class ActualizarTribunal(graphene.Mutation):
    class Arguments:
        id              = graphene.Int(required=True)
        nombre_tribunal = graphene.String()
        instancia       = graphene.String()
        norma_creacion  = graphene.String()
    tribunal = graphene.Field(TribunalType)
    def mutate(root, info, id, nombre_tribunal=None, instancia=None, norma_creacion=None):
        try:
            obj = Tribunal.objects.get(id_tribunal=id)
            if nombre_tribunal: obj.nombre_tribunal = nombre_tribunal
            if instancia:       obj.instancia = instancia
            if norma_creacion:  obj.norma_creacion = norma_creacion
            obj.save()
            return ActualizarTribunal(tribunal=obj)
        except Tribunal.DoesNotExist:
            return ActualizarTribunal(tribunal=None)

class EliminarTribunal(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
    ok      = graphene.Boolean()
    mensaje = graphene.String()
    def mutate(root, info, id):
        try:
            with transaction.atomic():
                Tribunal.objects.get(id_tribunal=id).delete()
            return EliminarTribunal(ok=True, mensaje=None)
        except Tribunal.DoesNotExist:
            return EliminarTribunal(ok=False, mensaje="Tribunal no encontrado")
        except ProtectedError:
            return EliminarTribunal(ok=False, mensaje="No se puede eliminar: el tribunal tiene salas o datos relacionados")
        except Exception as e:
            return EliminarTribunal(ok=False, mensaje=str(e))


# --- PERSONA ---
class CrearPersona(graphene.Mutation):
    class Arguments:
        input = CrearPersonaInput(required=True)
    persona = graphene.Field(PersonaType)
    def mutate(root, info, input):
        return CrearPersona(persona=Persona.objects.create(
            numero_documento=input.numero_documento,
            nombre=input.nombre,
            primer_apellido=input.primer_apellido,
            segundo_apellido=input.segundo_apellido,
            estamento=input.estamento,
            registro_universitario=input.registro_universitario,
            es_abogado=input.es_abogado or False,
            titular_a=input.titular_a))

class ActualizarPersona(graphene.Mutation):
    class Arguments:
        id    = graphene.Int(required=True)
        input = ActualizarPersonaInput(required=True)
    persona = graphene.Field(PersonaType)
    def mutate(root, info, id, input):
        try:
            obj = Persona.objects.get(id_persona=id)
            for field in ['numero_documento', 'nombre', 'primer_apellido',
                          'segundo_apellido', 'estamento', 'registro_universitario',
                          'es_abogado', 'titular_a']:
                val = input.get(field)
                if val is not None:
                    setattr(obj, field, val)
            obj.save()
            return ActualizarPersona(persona=obj)
        except Persona.DoesNotExist:
            return ActualizarPersona(persona=None)

class EliminarPersona(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
    ok      = graphene.Boolean()
    mensaje = graphene.String()
    def mutate(root, info, id):
        try:
            with transaction.atomic():
                Persona.objects.get(id_persona=id).delete()
            return EliminarPersona(ok=True, mensaje=None)
        except Persona.DoesNotExist:
            return EliminarPersona(ok=False, mensaje="Persona no encontrada")
        except ProtectedError:
            return EliminarPersona(ok=False, mensaje="No se puede eliminar: la persona tiene partes procesales, vocales u otros registros relacionados")
        except Exception as e:
            return EliminarPersona(ok=False, mensaje=str(e))


# --- TIPO PROCESO ---
class CrearTipoProceso(graphene.Mutation):
    class Arguments:
        nombre = graphene.String(required=True)
        codigo = graphene.String(required=True)
    tipo_proceso = graphene.Field(TipoProcesoType)
    def mutate(root, info, nombre, codigo):
        return CrearTipoProceso(tipo_proceso=TipoProceso.objects.create(
            nombre=nombre, codigo=codigo))

class ActualizarTipoProceso(graphene.Mutation):
    class Arguments:
        id     = graphene.Int(required=True)
        nombre = graphene.String()
        codigo = graphene.String()
    tipo_proceso = graphene.Field(TipoProcesoType)
    def mutate(root, info, id, nombre=None, codigo=None):
        try:
            obj = TipoProceso.objects.get(id_tipo_proceso=id)
            if nombre: obj.nombre = nombre
            if codigo: obj.codigo = codigo
            obj.save()
            return ActualizarTipoProceso(tipo_proceso=obj)
        except TipoProceso.DoesNotExist:
            return ActualizarTipoProceso(tipo_proceso=None)

class EliminarTipoProceso(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
    ok      = graphene.Boolean()
    mensaje = graphene.String()
    def mutate(root, info, id):
        try:
            with transaction.atomic():
                TipoProceso.objects.get(id_tipo_proceso=id).delete()
            return EliminarTipoProceso(ok=True, mensaje=None)
        except TipoProceso.DoesNotExist:
            return EliminarTipoProceso(ok=False, mensaje="Tipo de proceso no encontrado")
        except ProtectedError:
            return EliminarTipoProceso(ok=False, mensaje="No se puede eliminar: el tipo de proceso tiene expedientes o audiencias relacionadas")
        except Exception as e:
            return EliminarTipoProceso(ok=False, mensaje=str(e))


# --- SALA TRIBUNAL ---
class CrearSalaTribunal(graphene.Mutation):
    class Arguments:
        id_tribunal = graphene.Int(required=True)
        nombre_sala = graphene.String(required=True)
        activa      = graphene.Boolean()
    sala = graphene.Field(SalaTribunalType)
    def mutate(root, info, id_tribunal, nombre_sala, activa=True):
        tribunal = Tribunal.objects.get(id_tribunal=id_tribunal)
        return CrearSalaTribunal(sala=SalaTribunal.objects.create(
            id_tribunal=tribunal, nombre_sala=nombre_sala, activa=activa))

class ActualizarSalaTribunal(graphene.Mutation):
    class Arguments:
        id          = graphene.Int(required=True)
        nombre_sala = graphene.String()
        activa      = graphene.Boolean()
    sala = graphene.Field(SalaTribunalType)
    def mutate(root, info, id, nombre_sala=None, activa=None):
        try:
            obj = SalaTribunal.objects.get(id_sala=id)
            if nombre_sala:        obj.nombre_sala = nombre_sala
            if activa is not None: obj.activa = activa
            obj.save()
            return ActualizarSalaTribunal(sala=obj)
        except SalaTribunal.DoesNotExist:
            return ActualizarSalaTribunal(sala=None)

class EliminarSalaTribunal(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
    ok      = graphene.Boolean()
    mensaje = graphene.String()
    def mutate(root, info, id):
        try:
            with transaction.atomic():
                SalaTribunal.objects.get(id_sala=id).delete()
            return EliminarSalaTribunal(ok=True, mensaje=None)
        except SalaTribunal.DoesNotExist:
            return EliminarSalaTribunal(ok=False, mensaje="Sala no encontrada")
        except ProtectedError:
            return EliminarSalaTribunal(ok=False, mensaje="No se puede eliminar: la sala tiene expedientes asociados")
        except Exception as e:
            return EliminarSalaTribunal(ok=False, mensaje=str(e))


# --- SALA AUDIENCIA ---
class CrearSalaAudiencia(graphene.Mutation):
    class Arguments:
        id_tribunal        = graphene.Int(required=True)
        nombre_sala        = graphene.String(required=True)
        capacidad          = graphene.Int(required=True)
        equipada_videoconf = graphene.Boolean()
        enlace_virtual     = graphene.String()
        activa             = graphene.Boolean()
    sala = graphene.Field(SalaAudienciaType)
    def mutate(root, info, id_tribunal, nombre_sala, capacidad,
               equipada_videoconf=False, enlace_virtual=None, activa=True):
        tribunal = Tribunal.objects.get(id_tribunal=id_tribunal)
        return CrearSalaAudiencia(sala=SalaAudiencia.objects.create(
            id_tribunal=tribunal, nombre_sala=nombre_sala, capacidad=capacidad,
            equipada_videoconf=equipada_videoconf,
            enlace_virtual=enlace_virtual, activa=activa))

class ActualizarSalaAudiencia(graphene.Mutation):
    class Arguments:
        id    = graphene.Int(required=True)
        input = ActualizarSalaAudienciaInput(required=True)
    sala = graphene.Field(SalaAudienciaType)
    def mutate(root, info, id, input):
        try:
            obj = SalaAudiencia.objects.get(id_sala_aud=id)
            if input.nombre_sala is not None:        obj.nombre_sala = input.nombre_sala
            if input.capacidad is not None:          obj.capacidad = input.capacidad
            if input.equipada_videoconf is not None: obj.equipada_videoconf = input.equipada_videoconf
            if input.enlace_virtual is not None:     obj.enlace_virtual = input.enlace_virtual
            if input.activa is not None:             obj.activa = input.activa
            obj.save()
            return ActualizarSalaAudiencia(sala=obj)
        except SalaAudiencia.DoesNotExist:
            return ActualizarSalaAudiencia(sala=None)

class EliminarSalaAudiencia(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
    ok      = graphene.Boolean()
    mensaje = graphene.String()
    def mutate(root, info, id):
        try:
            with transaction.atomic():
                SalaAudiencia.objects.get(id_sala_aud=id).delete()
            return EliminarSalaAudiencia(ok=True, mensaje=None)
        except SalaAudiencia.DoesNotExist:
            return EliminarSalaAudiencia(ok=False, mensaje="Sala de audiencia no encontrada")
        except ProtectedError:
            return EliminarSalaAudiencia(ok=False, mensaje="No se puede eliminar: la sala tiene audiencias asociadas")
        except Exception as e:
            return EliminarSalaAudiencia(ok=False, mensaje=str(e))


# --- ESTADO EXPEDIENTE ---
class CrearEstadoExpediente(graphene.Mutation):
    class Arguments:
        nombre_estado = graphene.String(required=True)
        es_terminal   = graphene.Boolean()
    estado = graphene.Field(EstadoExpedienteType)
    def mutate(root, info, nombre_estado, es_terminal=False):
        return CrearEstadoExpediente(estado=EstadoExpediente.objects.create(
            nombre_estado=nombre_estado, es_terminal=es_terminal))

class ActualizarEstadoExpediente(graphene.Mutation):
    class Arguments:
        id            = graphene.Int(required=True)
        nombre_estado = graphene.String()
        es_terminal   = graphene.Boolean()
    estado = graphene.Field(EstadoExpedienteType)
    def mutate(root, info, id, nombre_estado=None, es_terminal=None):
        try:
            obj = EstadoExpediente.objects.get(id_estado=id)
            if nombre_estado:           obj.nombre_estado = nombre_estado
            if es_terminal is not None: obj.es_terminal = es_terminal
            obj.save()
            return ActualizarEstadoExpediente(estado=obj)
        except EstadoExpediente.DoesNotExist:
            return ActualizarEstadoExpediente(estado=None)

class EliminarEstadoExpediente(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
    ok      = graphene.Boolean()
    mensaje = graphene.String()
    def mutate(root, info, id):
        try:
            with transaction.atomic():
                EstadoExpediente.objects.get(id_estado=id).delete()  # ✅
            return EliminarEstadoExpediente(ok=True, mensaje=None)
        except EstadoExpediente.DoesNotExist:
            return EliminarEstadoExpediente(ok=False, mensaje="Estado no encontrado")
        except ProtectedError:
            return EliminarEstadoExpediente(ok=False, mensaje="No se puede eliminar: el estado está siendo usado en expedientes")
        except Exception as e:
            return EliminarEstadoExpediente(ok=False, mensaje=str(e))


# --- EXPEDIENTE ---
class CrearExpediente(graphene.Mutation):
    class Arguments:
        input = CrearExpedienteInput(required=True)
    expediente = graphene.Field(ExpedienteType)
    def mutate(root, info, input):
        sala         = SalaTribunal.objects.get(id_sala=input.id_sala)
        tipo_proceso = TipoProceso.objects.get(id_tipo_proceso=input.id_tipo_proceso)
        estado = EstadoExpediente.objects.get(id_estado=input.id_estado_expediente) \
                 if input.get('id_estado_expediente') else None
        return CrearExpediente(expediente=Expediente.objects.create(
            numero_expediente=input.numero_expediente,
            ano=input.ano,
            id_sala=sala,
            id_tipo_proceso=tipo_proceso,
            id_estado_expediente=EstadoExpediente.objects.get(id_estado=input.id_estado_expediente) if input.id_estado_expediente else None,
            descripcion=input.descripcion))

class ActualizarExpediente(graphene.Mutation):
    class Arguments:
        id    = graphene.Int(required=True)
        input = ActualizarExpedienteInput(required=True)
    expediente = graphene.Field(ExpedienteType)
    def mutate(root, info, id, input):
        try:
            obj = Expediente.objects.get(id_expediente=id)
            if input.numero_expediente is not None:
                obj.numero_expediente = input.numero_expediente
            if input.ano is not None:
                obj.ano = input.ano
            if input.id_sala is not None:
                obj.id_sala = SalaTribunal.objects.get(id_sala=input.id_sala)
            if input.id_tipo_proceso is not None:
                obj.id_tipo_proceso = TipoProceso.objects.get(id_tipo_proceso=input.id_tipo_proceso)
            if input.id_estado_expediente is not None:
                obj.id_estado_expediente = EstadoExpediente.objects.get(id_estado=input.id_estado_expediente)
            if input.descripcion is not None:
                obj.descripcion = input.descripcion
            obj.save()
            return ActualizarExpediente(expediente=obj)
        except Expediente.DoesNotExist:
            return ActualizarExpediente(expediente=None)

class EliminarExpediente(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
    ok      = graphene.Boolean()
    mensaje = graphene.String()
    def mutate(root, info, id):
        try:
            with transaction.atomic():
                Expediente.objects.get(id_expediente=id).delete()
            return EliminarExpediente(ok=True, mensaje=None)
        except Expediente.DoesNotExist:
            return EliminarExpediente(ok=False, mensaje="Expediente no encontrado")
        except ProtectedError:
            return EliminarExpediente(ok=False, mensaje="No se puede eliminar: el expediente tiene audiencias, resoluciones u otros registros relacionados")
        except Exception as e:
            return EliminarExpediente(ok=False, mensaje=str(e))


# --- TIPO AUDIENCIA ---
class CrearTipoAudiencia(graphene.Mutation):
    class Arguments:
        nombre            = graphene.String(required=True)
        duracion_estimada = graphene.Int(required=True)
        id_tipo_proceso   = graphene.Int(required=True)
        descripcion       = graphene.String()
    tipo_audiencia = graphene.Field(TipoAudienciaType)
    def mutate(root, info, nombre, duracion_estimada, id_tipo_proceso, descripcion=None):
        tipo_proceso = TipoProceso.objects.get(id_tipo_proceso=id_tipo_proceso)
        return CrearTipoAudiencia(tipo_audiencia=TipoAudiencia.objects.create(
            nombre=nombre, duracion_estimada=duracion_estimada,
            id_tipo_proceso=tipo_proceso, descripcion=descripcion))

class EliminarTipoAudiencia(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
    ok      = graphene.Boolean()
    mensaje = graphene.String()
    def mutate(root, info, id):
        try:
            with transaction.atomic():
                TipoAudiencia.objects.get(id_tipo_audiencia=id).delete()
            return EliminarTipoAudiencia(ok=True, mensaje=None)
        except TipoAudiencia.DoesNotExist:
            return EliminarTipoAudiencia(ok=False, mensaje="Tipo de audiencia no encontrado")
        except ProtectedError:
            return EliminarTipoAudiencia(ok=False, mensaje="No se puede eliminar: el tipo de audiencia tiene audiencias asociadas")
        except Exception as e:
            return EliminarTipoAudiencia(ok=False, mensaje=str(e))


# --- AUDIENCIA ---
class CrearAudiencia(graphene.Mutation):
    class Arguments:
        input = CrearAudienciaInput(required=True)
    
    audiencia = graphene.Field(AudienciaType)
    
    def mutate(root, info, input):
     
        
        expediente = Expediente.objects.get(id_expediente=input.id_expediente)
        tipo = TipoAudiencia.objects.get(id_tipo_audiencia=input.id_tipo_audiencia)
        sala = SalaAudiencia.objects.get(id_sala_aud=input.id_sala_aud) \
               if input.get('id_sala_aud') else None
        
        # ✅ CORREGIDO: Usar strptime (igual que en VocalTribunal)
        # El frontend envía: "2024-01-15T14:30:00"
        fecha_hora = datetime.strptime(input.fecha_hora_programada, '%Y-%m-%dT%H:%M')
        
        audiencia = Audiencia.objects.create(
            id_expediente=expediente,
            id_tipo_audiencia=tipo,
            id_sala_aud=sala,
            fecha_hora_programada=fecha_hora,
            link_videoconferencia=input.get('link_videoconferencia', '')
        )
        
        return CrearAudiencia(audiencia=audiencia)


class ActualizarAudiencia(graphene.Mutation):
    class Arguments:
        id    = graphene.Int(required=True)
        input = ActualizarAudienciaInput(required=True)
    
    audiencia = graphene.Field(AudienciaType)
    
    def mutate(root, info, id, input):
    
        
        try:
            obj = Audiencia.objects.get(id_audiencia=id)
            
            if input.id_tipo_audiencia is not None:
                obj.id_tipo_audiencia = TipoAudiencia.objects.get(
                    id_tipo_audiencia=input.id_tipo_audiencia
                )
            
            if input.id_sala_aud is not None:
                obj.id_sala_aud = SalaAudiencia.objects.get(
                    id_sala_aud=input.id_sala_aud
                ) if input.id_sala_aud else None
            
            # ✅ CORREGIDO: Formato SIN segundos (solo hasta minutos)
            if input.fecha_hora_programada is not None:
                obj.fecha_hora_programada = datetime.strptime(
                    input.fecha_hora_programada, '%Y-%m-%dT%H:%M'
                )
            
            if input.fecha_hora_inicio is not None:
                obj.fecha_hora_inicio = datetime.strptime(
                    input.fecha_hora_inicio, '%Y-%m-%dT%H:%M'
                )
            
            if input.fecha_hora_fin is not None:
                obj.fecha_hora_fin = datetime.strptime(
                    input.fecha_hora_fin, '%Y-%m-%dT%H:%M'
                )
            
            if input.estado_audiencia is not None:
                obj.estado_audiencia = input.estado_audiencia
            
            if input.motivo_suspension is not None:
                obj.motivo_suspension = input.motivo_suspension
            
            if input.link_videoconferencia is not None:
                obj.link_videoconferencia = input.link_videoconferencia
            
            obj.save()
            return ActualizarAudiencia(audiencia=obj)
            
        except Audiencia.DoesNotExist:
            return ActualizarAudiencia(audiencia=None)
class EliminarAudiencia(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
    ok      = graphene.Boolean()
    mensaje = graphene.String()
    def mutate(root, info, id):
        try:
            with transaction.atomic():
                Audiencia.objects.get(id_audiencia=id).delete()
            return EliminarAudiencia(ok=True, mensaje=None)
        except Audiencia.DoesNotExist:
            return EliminarAudiencia(ok=False, mensaje="Audiencia no encontrada")
        except ProtectedError:
            return EliminarAudiencia(ok=False, mensaje="No se puede eliminar: la audiencia tiene actas o asistencias relacionadas")
        except Exception as e:
            return EliminarAudiencia(ok=False, mensaje=str(e))


# --- RESOLUCION ---
class CrearResolucion(graphene.Mutation):
    class Arguments:
        input = CrearResolucionInput(required=True)
    resolucion = graphene.Field(ResolucionType)
    def mutate(root, info, input):
        expediente = Expediente.objects.get(id_expediente=input.id_expediente)
        tipo_res   = TipoResolucion.objects.get(id_tipo_res=input.id_tipo_res)
        return CrearResolucion(resolucion=Resolucion.objects.create(
            id_expediente=expediente,
            id_tipo_res=tipo_res,
            numero_resolucion=input.numero_resolucion,
   
            fecha_resolucion=datetime.strptime(input.fecha_resolucion, '%Y-%m-%d').date(),
            parte_dispositiva=input.parte_dispositiva,
            fundamentacion=input.get('fundamentacion') or ''))

class ActualizarResolucion(graphene.Mutation):
    class Arguments:
        id    = graphene.Int(required=True)
        input = ActualizarResolucionInput(required=True)
    resolucion = graphene.Field(ResolucionType)
    def mutate(root, info, id, input):
        try:
            obj = Resolucion.objects.get(id_resolucion=id)
            if input.id_tipo_res is not None:
                obj.id_tipo_res = TipoResolucion.objects.get(id_tipo_res=input.id_tipo_res)
            if input.numero_resolucion is not None:  obj.numero_resolucion = input.numero_resolucion
            if input.fecha_resolucion is not None:
                obj.fecha_resolucion = datetime.strptime(input.fecha_resolucion, '%Y-%m-%d').date()
            if input.parte_dispositiva is not None:  obj.parte_dispositiva = input.parte_dispositiva
            if input.fundamentacion is not None:     obj.fundamentacion = input.fundamentacion
            if input.estado is not None:             obj.estado = input.estado
            if input.es_recurrible is not None:      obj.es_recurrible = input.es_recurrible
            if input.plazo_recurso_dias is not None: obj.plazo_recurso_dias = input.plazo_recurso_dias
            obj.save()
            return ActualizarResolucion(resolucion=obj)
        except Resolucion.DoesNotExist:
            return ActualizarResolucion(resolucion=None)

class EliminarResolucion(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
    ok      = graphene.Boolean()
    mensaje = graphene.String()
    def mutate(root, info, id):
        try:
            with transaction.atomic():
                Resolucion.objects.get(id_resolucion=id).delete()
            return EliminarResolucion(ok=True, mensaje=None)
        except Resolucion.DoesNotExist:
            return EliminarResolucion(ok=False, mensaje="Resolución no encontrada")
        except ProtectedError:
            return EliminarResolucion(ok=False, mensaje="No se puede eliminar: la resolución tiene recursos u otros registros relacionados")
        except Exception as e:
            return EliminarResolucion(ok=False, mensaje=str(e))


# --- DOCUMENTO ---
class CrearDocumento(graphene.Mutation):
    class Arguments:
        id_expediente = graphene.Int(required=True)
        id_tipo_doc   = graphene.Int(required=True)
        titulo        = graphene.String(required=True)
        numero_folio  = graphene.Int()
        ruta_archivo  = graphene.String()
        tamano_kb     = graphene.Int()
    documento = graphene.Field(DocumentoType)
    def mutate(root, info, id_expediente, id_tipo_doc, titulo,
               numero_folio=None, ruta_archivo='', tamano_kb=0):
        expediente = Expediente.objects.get(id_expediente=id_expediente)
        tipo_doc   = TipoDoc.objects.get(id_tipo_doc=id_tipo_doc)
        return CrearDocumento(documento=Documento.objects.create(
            id_expediente=expediente, id_tipo_doc=tipo_doc, titulo=titulo,
            numero_folio=numero_folio, ruta_archivo=ruta_archivo,
            tamano_kb=tamano_kb, hash_integridad='',
            es_electronico=True, firmado_digitalmente=False))

class ActualizarDocumento(graphene.Mutation):
    class Arguments:
        id    = graphene.Int(required=True)
        input = ActualizarDocumentoInput(required=True)
    documento = graphene.Field(DocumentoType)
    def mutate(root, info, id, input):
        try:
            obj = Documento.objects.get(id_documento=id)
            if input.titulo is not None:       obj.titulo = input.titulo
            if input.numero_folio is not None: obj.numero_folio = input.numero_folio
            if input.ruta_archivo is not None: obj.ruta_archivo = input.ruta_archivo
            obj.save()
            return ActualizarDocumento(documento=obj)
        except Documento.DoesNotExist:
            return ActualizarDocumento(documento=None)

class EliminarDocumento(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
    ok      = graphene.Boolean()
    mensaje = graphene.String()
    def mutate(root, info, id):
        try:
            with transaction.atomic():
                Documento.objects.get(id_documento=id).delete()
            return EliminarDocumento(ok=True, mensaje=None)
        except Documento.DoesNotExist:
            return EliminarDocumento(ok=False, mensaje="Documento no encontrado")
        except ProtectedError:
            return EliminarDocumento(ok=False, mensaje="No se puede eliminar: el documento tiene notificaciones o resoluciones relacionadas")
        except Exception as e:
            return EliminarDocumento(ok=False, mensaje=str(e))


# --- TIPO DOC ---
class CrearTipoDoc(graphene.Mutation):
    class Arguments:
        codigo         = graphene.String(required=True)
        nombre         = graphene.String(required=True)
        requiere_firma = graphene.Boolean()
        es_publico     = graphene.Boolean()
        descripcion    = graphene.String()
    tipo_doc = graphene.Field(TipoDocType)
    def mutate(root, info, codigo, nombre, requiere_firma=False, es_publico=True, descripcion=None):
        return CrearTipoDoc(tipo_doc=TipoDoc.objects.create(
            codigo=codigo, nombre=nombre, requiere_firma=requiere_firma,
            es_publico=es_publico, descripcion=descripcion))

class ActualizarTipoDoc(graphene.Mutation):
    class Arguments:
        id    = graphene.Int(required=True)
        input = ActualizarTipoDocInput(required=True)
    tipo_doc = graphene.Field(TipoDocType)
    def mutate(root, info, id, input):
        try:
            obj = TipoDoc.objects.get(id_tipo_doc=id)
            if input.codigo is not None:         obj.codigo = input.codigo
            if input.nombre is not None:         obj.nombre = input.nombre
            if input.requiere_firma is not None: obj.requiere_firma = input.requiere_firma
            if input.es_publico is not None:     obj.es_publico = input.es_publico
            if input.descripcion is not None:    obj.descripcion = input.descripcion
            obj.save()
            return ActualizarTipoDoc(tipo_doc=obj)
        except TipoDoc.DoesNotExist:
            return ActualizarTipoDoc(tipo_doc=None)

class EliminarTipoDoc(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
    ok      = graphene.Boolean()
    mensaje = graphene.String()
    def mutate(root, info, id):
        try:
            with transaction.atomic():
                TipoDoc.objects.get(id_tipo_doc=id).delete()
            return EliminarTipoDoc(ok=True, mensaje=None)
        except TipoDoc.DoesNotExist:
            return EliminarTipoDoc(ok=False, mensaje="Tipo de documento no encontrado")
        except ProtectedError:
            return EliminarTipoDoc(ok=False, mensaje="No se puede eliminar: el tipo de documento tiene documentos asociados")
        except Exception as e:
            return EliminarTipoDoc(ok=False, mensaje=str(e))


# --- TIPO RECURSO ---
class CrearTipoRecurso(graphene.Mutation):
    class Arguments:
        nombre      = graphene.String(required=True)
        descripcion = graphene.String()
    tipo_recurso = graphene.Field(TipoRecursoType)
    def mutate(root, info, nombre, descripcion=''):
        return CrearTipoRecurso(tipo_recurso=TipoRecurso.objects.create(
            nombre=nombre, descripcion=descripcion))

class ActualizarTipoRecurso(graphene.Mutation):
    class Arguments:
        id    = graphene.Int(required=True)
        input = ActualizarTipoRecursoInput(required=True)
    tipo_recurso = graphene.Field(TipoRecursoType)
    def mutate(root, info, id, input):
        try:
            obj = TipoRecurso.objects.get(id_tipo_recurso=id)
            if input.nombre is not None:      obj.nombre = input.nombre
            if input.descripcion is not None: obj.descripcion = input.descripcion
            obj.save()
            return ActualizarTipoRecurso(tipo_recurso=obj)
        except TipoRecurso.DoesNotExist:
            return ActualizarTipoRecurso(tipo_recurso=None)

class EliminarTipoRecurso(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
    ok      = graphene.Boolean()
    mensaje = graphene.String()
    def mutate(root, info, id):
        try:
            with transaction.atomic():
                TipoRecurso.objects.get(id_tipo_recurso=id).delete()
            return EliminarTipoRecurso(ok=True, mensaje=None)
        except TipoRecurso.DoesNotExist:
            return EliminarTipoRecurso(ok=False, mensaje="Tipo de recurso no encontrado")
        except ProtectedError:
            return EliminarTipoRecurso(ok=False, mensaje="No se puede eliminar: el tipo de recurso tiene recursos asociados")
        except Exception as e:
            return EliminarTipoRecurso(ok=False, mensaje=str(e))


# --- TIPO RESOLUCION ---
class CrearTipoResolucion(graphene.Mutation):
    class Arguments:
        codigo           = graphene.String(required=True)
        nombre           = graphene.String(required=True)
        nivel_jerarquico = graphene.Int()
        descripcion      = graphene.String()
    tipo_resolucion = graphene.Field(TipoResolucionType)
    def mutate(root, info, codigo, nombre, nivel_jerarquico=1, descripcion=None):
        return CrearTipoResolucion(tipo_resolucion=TipoResolucion.objects.create(
            codigo=codigo, nombre=nombre,
            nivel_jerarquico=nivel_jerarquico, descripcion=descripcion))

class ActualizarTipoResolucion(graphene.Mutation):
    class Arguments:
        id    = graphene.Int(required=True)
        input = ActualizarTipoResolucionInput(required=True)
    tipo_resolucion = graphene.Field(TipoResolucionType)
    def mutate(root, info, id, input):
        try:
            obj = TipoResolucion.objects.get(id_tipo_res=id)
            if input.codigo is not None:           obj.codigo = input.codigo
            if input.nombre is not None:           obj.nombre = input.nombre
            if input.nivel_jerarquico is not None: obj.nivel_jerarquico = input.nivel_jerarquico
            if input.descripcion is not None:      obj.descripcion = input.descripcion
            obj.save()
            return ActualizarTipoResolucion(tipo_resolucion=obj)
        except TipoResolucion.DoesNotExist:
            return ActualizarTipoResolucion(tipo_resolucion=None)

class EliminarTipoResolucion(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
    ok      = graphene.Boolean()
    mensaje = graphene.String()
    def mutate(root, info, id):
        try:
            with transaction.atomic():
                TipoResolucion.objects.get(id_tipo_res=id).delete()
            return EliminarTipoResolucion(ok=True, mensaje=None)
        except TipoResolucion.DoesNotExist:
            return EliminarTipoResolucion(ok=False, mensaje="Tipo de resolución no encontrado")
        except ProtectedError:
            return EliminarTipoResolucion(ok=False, mensaje="No se puede eliminar: el tipo de resolución tiene resoluciones asociadas")
        except Exception as e:
            return EliminarTipoResolucion(ok=False, mensaje=str(e))


# --- ROL PROCESAL ---
class CrearRolProcesal(graphene.Mutation):
    class Arguments:
        nombre_rol = graphene.String(required=True)
    rol_procesal = graphene.Field(RolProcesalType)
    def mutate(root, info, nombre_rol):
        return CrearRolProcesal(rol_procesal=RolProcesal.objects.create(nombre_rol=nombre_rol))

class ActualizarRolProcesal(graphene.Mutation):
    class Arguments:
        id    = graphene.Int(required=True)
        input = ActualizarRolProcesalInput(required=True)
    rol_procesal = graphene.Field(RolProcesalType)
    def mutate(root, info, id, input):
        try:
            obj = RolProcesal.objects.get(id_rol=id)
            if input.nombre_rol is not None: obj.nombre_rol = input.nombre_rol
            obj.save()
            return ActualizarRolProcesal(rol_procesal=obj)
        except RolProcesal.DoesNotExist:
            return ActualizarRolProcesal(rol_procesal=None)

class EliminarRolProcesal(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
    ok      = graphene.Boolean()
    mensaje = graphene.String()
    def mutate(root, info, id):
        try:
            with transaction.atomic():
                RolProcesal.objects.get(id_rol=id).delete()
            return EliminarRolProcesal(ok=True, mensaje=None)
        except RolProcesal.DoesNotExist:
            return EliminarRolProcesal(ok=False, mensaje="Rol procesal no encontrado")
        except ProtectedError:
            return EliminarRolProcesal(ok=False, mensaje="No se puede eliminar: el rol procesal tiene partes procesales asociadas")
        except Exception as e:
            return EliminarRolProcesal(ok=False, mensaje=str(e))


# --- PARTE PROCESAL ---
class CrearParteProcesal(graphene.Mutation):
    class Arguments:
        id_expediente = graphene.Int(required=True)
        id_persona    = graphene.Int(required=True)
        id_rol        = graphene.Int(required=True)
    parte = graphene.Field(ParteProcesalType)
    def mutate(root, info, id_expediente, id_persona, id_rol):
        return CrearParteProcesal(parte=ParteProcesal.objects.create(
            id_expediente=Expediente.objects.get(id_expediente=id_expediente),
            id_persona=Persona.objects.get(id_persona=id_persona),
            id_rol=RolProcesal.objects.get(id_rol=id_rol),
            activo=True))

class ActualizarParteProcesal(graphene.Mutation):
    class Arguments:
        id    = graphene.Int(required=True)
        input = ActualizarParteProcesalInput(required=True)
    parte = graphene.Field(ParteProcesalType)
    def mutate(root, info, id, input):
        try:
            obj = ParteProcesal.objects.get(id_parte=id)
            if input.activo is not None:          obj.activo = input.activo
            if input.fecha_exclusion is not None:
                obj.fecha_exclusion = datetime.strptime(input.fecha_exclusion, '%Y-%m-%d').date()
            obj.save()
            return ActualizarParteProcesal(parte=obj)
        except ParteProcesal.DoesNotExist:
            return ActualizarParteProcesal(parte=None)

class EliminarParteProcesal(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
    ok      = graphene.Boolean()
    mensaje = graphene.String()
    def mutate(root, info, id):
        try:
            with transaction.atomic():
                ParteProcesal.objects.get(id_parte=id).delete()
            return EliminarParteProcesal(ok=True, mensaje=None)
        except ParteProcesal.DoesNotExist:
            return EliminarParteProcesal(ok=False, mensaje="Parte procesal no encontrada")
        except ProtectedError:
            return EliminarParteProcesal(ok=False, mensaje="No se puede eliminar: la parte procesal tiene recursos u otros registros relacionados")
        except Exception as e:
            return EliminarParteProcesal(ok=False, mensaje=str(e))


# --- TIPO ACTUACION ---
class CrearTipoActuacion(graphene.Mutation):
    class Arguments:
        codigo = graphene.String(required=True)
        nombre = graphene.String(required=True)
    tipo_actuacion = graphene.Field(TipoActuacionType)
    def mutate(root, info, codigo, nombre):
        return CrearTipoActuacion(tipo_actuacion=TipoActuacion.objects.create(
            codigo=codigo, nombre=nombre))

class ActualizarTipoActuacion(graphene.Mutation):
    class Arguments:
        id    = graphene.Int(required=True)
        input = ActualizarTipoActuacionInput(required=True)
    tipo_actuacion = graphene.Field(TipoActuacionType)
    def mutate(root, info, id, input):
        try:
            obj = TipoActuacion.objects.get(id_tipo_actuacion=id)
            if input.codigo is not None: obj.codigo = input.codigo
            if input.nombre is not None: obj.nombre = input.nombre
            obj.save()
            return ActualizarTipoActuacion(tipo_actuacion=obj)
        except TipoActuacion.DoesNotExist:
            return ActualizarTipoActuacion(tipo_actuacion=None)

class EliminarTipoActuacion(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
    ok      = graphene.Boolean()
    mensaje = graphene.String()
    def mutate(root, info, id):
        try:
            with transaction.atomic():
                TipoActuacion.objects.get(id_tipo_actuacion=id).delete()
            return EliminarTipoActuacion(ok=True, mensaje=None)
        except TipoActuacion.DoesNotExist:
            return EliminarTipoActuacion(ok=False, mensaje="Tipo de actuación no encontrado")
        except ProtectedError:
            return EliminarTipoActuacion(ok=False, mensaje="No se puede eliminar: el tipo de actuación tiene actuaciones procesales asociadas")
        except Exception as e:
            return EliminarTipoActuacion(ok=False, mensaje=str(e))


# --- ACTUACION PROCESAL ---
class CrearActuacionProcesal(graphene.Mutation):
    class Arguments:
        id_expediente     = graphene.Int(required=True)
        id_tipo_actuacion = graphene.Int(required=True)
        id_usuario        = graphene.Int(required=True)
        folio_inicio      = graphene.Int(required=True)
        folio_fin         = graphene.Int(required=True)
        descripcion       = graphene.String()
    actuacion = graphene.Field(ActuacionProcesalType)
    def mutate(root, info, id_expediente, id_tipo_actuacion, id_usuario,
               folio_inicio, folio_fin, descripcion=''):
        return CrearActuacionProcesal(actuacion=ActuacionProcesal.objects.create(
            id_expediente=Expediente.objects.get(id_expediente=id_expediente),
            id_tipo_actuacion=TipoActuacion.objects.get(id_tipo_actuacion=id_tipo_actuacion),
            usuario=Usuario.objects.get(id_usuario=id_usuario),
            folio_inicio=folio_inicio, folio_fin=folio_fin,
            es_publica=True, descripcion=descripcion))

class ActualizarActuacionProcesal(graphene.Mutation):
    class Arguments:
        id    = graphene.Int(required=True)
        input = ActualizarActuacionProcesalInput(required=True)
    actuacion = graphene.Field(ActuacionProcesalType)
    def mutate(root, info, id, input):
        try:
            obj = ActuacionProcesal.objects.get(id_actuacion=id)
            if input.descripcion is not None:  obj.descripcion = input.descripcion
            if input.folio_inicio is not None: obj.folio_inicio = input.folio_inicio
            if input.folio_fin is not None:    obj.folio_fin = input.folio_fin
            obj.save()
            return ActualizarActuacionProcesal(actuacion=obj)
        except ActuacionProcesal.DoesNotExist:
            return ActualizarActuacionProcesal(actuacion=None)

class EliminarActuacionProcesal(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
    ok      = graphene.Boolean()
    mensaje = graphene.String()
    def mutate(root, info, id):
        try:
            with transaction.atomic():
                ActuacionProcesal.objects.get(id_actuacion=id).delete()
            return EliminarActuacionProcesal(ok=True, mensaje=None)
        except ActuacionProcesal.DoesNotExist:
            return EliminarActuacionProcesal(ok=False, mensaje="Actuación procesal no encontrada")
        except ProtectedError:
            return EliminarActuacionProcesal(ok=False, mensaje="No se puede eliminar: la actuación tiene registros relacionados")
        except Exception as e:
            return EliminarActuacionProcesal(ok=False, mensaje=str(e))


# --- RECURSO ---
class CrearRecurso(graphene.Mutation):
    class Arguments:
        id_resolucion_impugnada = graphene.Int(required=True)
        id_tipo_recurso         = graphene.Int(required=True)
        id_recurrente           = graphene.Int(required=True)
        fundamentos             = graphene.String()
    recurso = graphene.Field(RecursoType)
    def mutate(root, info, id_resolucion_impugnada, id_tipo_recurso, id_recurrente, fundamentos=''):
        return CrearRecurso(recurso=Recurso.objects.create(
            id_resolucion_impugnada=Resolucion.objects.get(id_resolucion=id_resolucion_impugnada),
            id_tipo_recurso=TipoRecurso.objects.get(id_tipo_recurso=id_tipo_recurso),
            id_recurrente=ParteProcesal.objects.get(id_parte=id_recurrente),
            estado_recurso='PENDIENTE', fundamentos=fundamentos))

from .models import *  # ← Esto importa Recurso, Expediente, EstadoExpediente, etc.
import graphene
from datetime import date
from django.utils import timezone


class ActualizarRecurso(graphene.Mutation):
    class Arguments:
        id    = graphene.Int(required=True)
        input = ActualizarRecursoInput(required=True)
    
    recurso = graphene.Field(RecursoType)
    
    def mutate(root, info, id, input):
        try:
            obj = Recurso.objects.get(id_recurso=id)
            
            # Guardar estado anterior para detectar cambio
            estado_anterior = obj.estado_recurso
            
            # Actualizar campos
            if input.estado_recurso is not None:
                obj.estado_recurso = input.estado_recurso
            if input.fundamentos is not None:
                obj.fundamentos = input.fundamentos
            
            # ✅ AUTOMÁTICO: Cuando cambia a ADMITIDO, crear expediente alzada
            if (estado_anterior != "ADMITIDO" and 
                obj.estado_recurso == "ADMITIDO" and 
                not obj.id_expediente_alzada):
                
                # Obtener el expediente original desde la resolución
                exp_original = obj.id_resolucion_impugnada.id_expediente
                
                # Generar número para expediente de alzada
                ano_actual = date.today().year
                nuevo_numero = f"ALZ-{exp_original.id_expediente}-{ano_actual}"
                
                # Obtener o crear estado inicial
                estado_inicial, _ = EstadoExpediente.objects.get_or_create(
                    nombre_estado="EN TRÁMITE",
                    defaults={'es_terminal': False}
                )
                
                # ✅ CREAR EXPEDIENTE ALZADA (sin imports adicionales)
                nuevo_expediente = Expediente.objects.create(
                    numero_expediente=nuevo_numero,
                    ano=ano_actual,
                    id_sala=exp_original.id_sala,
                    id_tipo_proceso=exp_original.id_tipo_proceso,
                    id_estado_expediente=estado_inicial,
                    descripcion=f"Expediente de alzada - Recurso #{obj.id_recurso}"
                )
                
                # Vincular el recurso con el nuevo expediente
                obj.id_expediente_alzada = nuevo_expediente
            
            obj.save()
            return ActualizarRecurso(recurso=obj)
            
        except Recurso.DoesNotExist:
            return ActualizarRecurso(recurso=None)

class EliminarRecurso(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
    ok      = graphene.Boolean()
    mensaje = graphene.String()
    def mutate(root, info, id):
        try:
            with transaction.atomic():
                Recurso.objects.get(id_recurso=id).delete()
            return EliminarRecurso(ok=True, mensaje=None)
        except Recurso.DoesNotExist:
            return EliminarRecurso(ok=False, mensaje="Recurso no encontrado")
        except ProtectedError:
            return EliminarRecurso(ok=False, mensaje="No se puede eliminar: el recurso tiene registros relacionados")
        except Exception as e:
            return EliminarRecurso(ok=False, mensaje=str(e))


# --- NOTIFICACION ---
class CrearNotificacion(graphene.Mutation):
    class Arguments:
        id_expediente     = graphene.Int(required=True)
        id_documento      = graphene.Int(required=True)
        id_parte          = graphene.Int(required=True)
        id_usuario        = graphene.Int(required=True)
        tipo_notificacion = graphene.String(required=True)
    notificacion = graphene.Field(NotificacionType)
    def mutate(root, info, id_expediente, id_documento, id_parte, id_usuario, tipo_notificacion):
        return CrearNotificacion(notificacion=Notificacion.objects.create(
            id_expediente=Expediente.objects.get(id_expediente=id_expediente),
            id_documento=Documento.objects.get(id_documento=id_documento),
            id_parte=ParteProcesal.objects.get(id_parte=id_parte),
            usuario=Usuario.objects.get(id_usuario=id_usuario),
            tipo_notificacion=tipo_notificacion,
            estado_notificacion='PENDIENTE'))

class ActualizarNotificacion(graphene.Mutation):
    class Arguments:
        id    = graphene.Int(required=True)
        input = ActualizarNotificacionInput(required=True)
    notificacion = graphene.Field(NotificacionType)
    def mutate(root, info, id, input):
        try:
            obj = Notificacion.objects.get(id_notificacion=id)
            if input.estado_notificacion is not None:
                obj.estado_notificacion = input.estado_notificacion
            if input.fecha_diligencia is not None:
                obj.fecha_diligencia = datetime.strptime(input.fecha_diligencia[:16], '%Y-%m-%dT%H:%M')
            obj.save()
            return ActualizarNotificacion(notificacion=obj)
        except Notificacion.DoesNotExist:
            return ActualizarNotificacion(notificacion=None)

class EliminarNotificacion(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
    ok      = graphene.Boolean()
    mensaje = graphene.String()
    def mutate(root, info, id):
        try:
            with transaction.atomic():
                Notificacion.objects.get(id_notificacion=id).delete()
            return EliminarNotificacion(ok=True, mensaje=None)
        except Notificacion.DoesNotExist:
            return EliminarNotificacion(ok=False, mensaje="Notificación no encontrada")
        except ProtectedError:
            return EliminarNotificacion(ok=False, mensaje="No se puede eliminar: la notificación tiene registros relacionados")
        except Exception as e:
            return EliminarNotificacion(ok=False, mensaje=str(e))


# --- ASISTENCIA ---
class RegistrarAsistencia(graphene.Mutation):
    class Arguments:
        id_audiencia     = graphene.Int(required=True)
        id_persona       = graphene.Int(required=True)
        rol_en_audiencia = graphene.String(required=True)
        asistio          = graphene.Boolean()
        hora_ingreso     = graphene.DateTime()  # ← Campo opcional
    
    asistencia = graphene.Field(AsistenciaAudienciaType)
    
    def mutate(self, info, id_audiencia, id_persona, rol_en_audiencia, asistio=True, hora_ingreso=None):
        # ✅ Esta lógica funciona
        if asistio and hora_ingreso is None:
            hora_ingreso = timezone.now()
        
        return RegistrarAsistencia(asistencia=AsistenciaAudiencia.objects.create(
            id_audiencia=Audiencia.objects.get(id_audiencia=id_audiencia),
            id_persona=Persona.objects.get(id_persona=id_persona),
            rol_en_audiencia=rol_en_audiencia,
            asistio=asistio,
            hora_ingreso=hora_ingreso
        ))
class ActualizarAsistencia(graphene.Mutation):
    class Arguments:
        id    = graphene.Int(required=True)
        input = ActualizarAsistenciaInput(required=True)
    
    asistencia = graphene.Field(AsistenciaAudienciaType)
    
    def mutate(root, info, id, input):
        try:
            obj = AsistenciaAudiencia.objects.get(id_asistencia=id)
            
            if input.asistio is not None:
                obj.asistio = input.asistio
            
            if input.motivo_inasistencia is not None:
                obj.motivo_inasistencia = input.motivo_inasistencia
            
            if input.hora_ingreso is not None:
                # ✅ CORREGIDO: Usar strptime en lugar de fromisoformat
                hora_str = input.hora_ingreso
                if hora_str:
                    # El frontend envía un ISO string, extraemos solo la hora
                    if 'T' in hora_str:
                        # Formato "2026-05-29T14:30:00.000Z" o "2026-05-29T14:30"
                        # Extraemos solo HH:MM
                        partes = hora_str.split('T')
                        if len(partes) > 1:
                            hora_part = partes[1].split(':')
                            if len(hora_part) >= 2:
                                horas = int(hora_part[0])
                                minutos = int(hora_part[1])
                                # Usamos la fecha actual + la hora ingresada
                           
                                ahora = datetime.now()
                                obj.hora_ingreso = ahora.replace(hour=horas, minute=minutos, second=0, microsecond=0)
                else:
                    obj.hora_ingreso = None
            elif input.asistio is False:
                obj.hora_ingreso = None
            
            obj.save()
            return ActualizarAsistencia(asistencia=obj)
            
        except AsistenciaAudiencia.DoesNotExist:
            return ActualizarAsistencia(asistencia=None)

class EliminarAsistencia(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
    ok      = graphene.Boolean()
    mensaje = graphene.String()
    def mutate(root, info, id):
        try:
            with transaction.atomic():
                AsistenciaAudiencia.objects.get(id_asistencia=id).delete()
            return EliminarAsistencia(ok=True, mensaje=None)
        except AsistenciaAudiencia.DoesNotExist:
            return EliminarAsistencia(ok=False, mensaje="Asistencia no encontrada")
        except ProtectedError:
            return EliminarAsistencia(ok=False, mensaje="No se puede eliminar: la asistencia tiene registros relacionados")
        except Exception as e:
            return EliminarAsistencia(ok=False, mensaje=str(e))


# --- VOCAL TRIBUNAL ---
class CrearVocalTribunal(graphene.Mutation):
    class Arguments:
        id_persona     = graphene.Int(required=True)
        id_sala        = graphene.Int()
        cargo          = graphene.String(required=True)
        fecha_posesion = graphene.String(required=True)
        id_usuario     = graphene.Int(required=True)
    vocal = graphene.Field(VocalTribunalType)
    
    def mutate(root, info, id_persona, cargo, fecha_posesion, id_usuario, id_sala=None):

        
        sala = SalaTribunal.objects.get(id_sala=id_sala) if id_sala else None
        
        # ✅ CORREGIDO: Usar strptime en lugar de fromisoformat
        fecha = datetime.strptime(fecha_posesion, '%Y-%m-%d').date()
        
        return CrearVocalTribunal(vocal=VocalTribunal.objects.create(
            id_persona=Persona.objects.get(id_persona=id_persona),
            id_sala=sala,
            cargo=cargo,
            fecha_posesion=fecha,
            activo=True,
            usuario=Usuario.objects.get(id_usuario=id_usuario)
        ))
class ActualizarVocal(graphene.Mutation):
    class Arguments:
        id    = graphene.Int(required=True)
        input = ActualizarVocalInput(required=True)
    vocal = graphene.Field(VocalTribunalType)
    
    def mutate(root, info, id, input):
      
        
        try:
            obj = VocalTribunal.objects.get(id_vocal=id)
            if input.id_sala is not None:
                obj.id_sala = SalaTribunal.objects.get(id_sala=input.id_sala) \
                              if input.id_sala else None
            if input.cargo is not None:
                obj.cargo = input.cargo
            if input.fecha_conclusion is not None:
                # ✅ CORREGIDO
                obj.fecha_conclusion = datetime.strptime(input.fecha_conclusion, '%Y-%m-%d').date()
            if input.activo is not None:
                obj.activo = input.activo
            obj.save()
            return ActualizarVocal(vocal=obj)
        except VocalTribunal.DoesNotExist:
            return ActualizarVocal(vocal=None)
class EliminarVocal(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
    ok      = graphene.Boolean()
    mensaje = graphene.String()
    def mutate(root, info, id):
        try:
            with transaction.atomic():
                VocalTribunal.objects.get(id_vocal=id).delete()
            return EliminarVocal(ok=True, mensaje=None)
        except VocalTribunal.DoesNotExist:
            return EliminarVocal(ok=False, mensaje="Vocal no encontrado")
        except ProtectedError:
            return EliminarVocal(ok=False, mensaje="No se puede eliminar: el vocal tiene conformaciones asociadas")
        except Exception as e:
            return EliminarVocal(ok=False, mensaje=str(e))


# --- CONTACTO ---
class CrearContacto(graphene.Mutation):
    class Arguments:
        id_persona    = graphene.Int(required=True)
        tipo_contacto = graphene.String(required=True)
        valor         = graphene.String(required=True)
        es_principal  = graphene.Boolean()
    contacto = graphene.Field(ContactoPersonaType)
    def mutate(root, info, id_persona, tipo_contacto, valor, es_principal=False):
        return CrearContacto(contacto=ContactoPersona.objects.create(
            id_persona=Persona.objects.get(id_persona=id_persona),
            tipo_contacto=tipo_contacto, valor=valor,
            es_principal=es_principal, validado=False))

class ActualizarContacto(graphene.Mutation):
    class Arguments:
        id    = graphene.Int(required=True)
        input = ActualizarContactoInput(required=True)
    contacto = graphene.Field(ContactoPersonaType)
    def mutate(root, info, id, input):
        try:
            obj = ContactoPersona.objects.get(id_contacto=id)
            if input.valor is not None:        obj.valor = input.valor
            if input.es_principal is not None: obj.es_principal = input.es_principal
            if input.validado is not None:     obj.validado = input.validado
            obj.save()
            return ActualizarContacto(contacto=obj)
        except ContactoPersona.DoesNotExist:
            return ActualizarContacto(contacto=None)

class EliminarContacto(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
    ok      = graphene.Boolean()
    mensaje = graphene.String()
    def mutate(root, info, id):
        try:
            with transaction.atomic():
                ContactoPersona.objects.get(id_contacto=id).delete()  # ✅
            return EliminarContacto(ok=True, mensaje=None)
        except ContactoPersona.DoesNotExist:
            return EliminarContacto(ok=False, mensaje="Contacto no encontrado")
        except ProtectedError:
            return EliminarContacto(ok=False, mensaje="No se puede eliminar: el contacto tiene registros relacionados")
        except Exception as e:
            return EliminarContacto(ok=False, mensaje=str(e))


# --- CONFORMACION ---
class CrearConformacion(graphene.Mutation):
    class Arguments:
        id_expediente = graphene.Int(required=True)
        id_vocal      = graphene.Int(required=True)
        rol_en_caso   = graphene.String(required=True)
    conformacion = graphene.Field(ConformacionSalaExpedienteType)
    def mutate(root, info, id_expediente, id_vocal, rol_en_caso):
        return CrearConformacion(conformacion=ConformacionSalaExpediente.objects.create(
            id_expediente=Expediente.objects.get(id_expediente=id_expediente),
            id_vocal=VocalTribunal.objects.get(id_vocal=id_vocal),
            rol_en_caso=rol_en_caso))

class ActualizarConformacion(graphene.Mutation):
    class Arguments:
        id    = graphene.Int(required=True)
        input = ActualizarConformacionInput(required=True)
    conformacion = graphene.Field(ConformacionSalaExpedienteType)
    def mutate(root, info, id, input):
        try:
            obj = ConformacionSalaExpediente.objects.get(id_conformacion=id)
            if input.id_vocal is not None:
                obj.id_vocal = VocalTribunal.objects.get(id_vocal=input.id_vocal)
            if input.rol_en_caso is not None: obj.rol_en_caso = input.rol_en_caso
            obj.save()
            return ActualizarConformacion(conformacion=obj)
        except ConformacionSalaExpediente.DoesNotExist:
            return ActualizarConformacion(conformacion=None)

class EliminarConformacion(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
    ok      = graphene.Boolean()
    mensaje = graphene.String()
    def mutate(root, info, id):
        try:
            with transaction.atomic():
                ConformacionSalaExpediente.objects.get(id_conformacion=id).delete()
            return EliminarConformacion(ok=True, mensaje=None)
        except ConformacionSalaExpediente.DoesNotExist:
            return EliminarConformacion(ok=False, mensaje="Conformación no encontrada")
        except ProtectedError:
            return EliminarConformacion(ok=False, mensaje="No se puede eliminar: la conformación tiene registros relacionados")
        except Exception as e:
            return EliminarConformacion(ok=False, mensaje=str(e))


# --- HISTORIAL ESTADO ---
class CrearHistorialEstado(graphene.Mutation):
    class Arguments:
        id_expediente   = graphene.Int(required=True)
        id_estado_nuevo = graphene.Int(required=True)
        id_usuario      = graphene.Int(required=True)
        motivo          = graphene.String(required=True)
    historial = graphene.Field(HistorialEstadoType)
    def mutate(root, info, id_expediente, id_estado_nuevo, id_usuario, motivo):
        expediente      = Expediente.objects.get(id_expediente=id_expediente)
        estado_anterior = expediente.id_estado_expediente
        estado_nuevo    = EstadoExpediente.objects.get(id_estado=id_estado_nuevo)
        usuario         = Usuario.objects.get(id_usuario=id_usuario)
        historial = HistorialEstado.objects.create(
            id_expediente=expediente,
            id_estado_anterior=estado_anterior,
            id_estado_nuevo=estado_nuevo,
            usuario=usuario, motivo=motivo)
        expediente.id_estado_expediente = estado_nuevo
        expediente.save()
        return CrearHistorialEstado(historial=historial)

class EliminarHistorialEstado(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
    ok      = graphene.Boolean()
    mensaje = graphene.String()
    def mutate(root, info, id):
        try:
            with transaction.atomic():
                HistorialEstado.objects.get(id_historial=id).delete()
            return EliminarHistorialEstado(ok=True, mensaje=None)
        except HistorialEstado.DoesNotExist:
            return EliminarHistorialEstado(ok=False, mensaje="Historial no encontrado")
        except ProtectedError:
            return EliminarHistorialEstado(ok=False, mensaje="No se puede eliminar: el historial tiene registros relacionados")
        except Exception as e:
            return EliminarHistorialEstado(ok=False, mensaje=str(e))


# --- ACTA ---
class CrearActa(graphene.Mutation):
    class Arguments:
        id_audiencia   = graphene.Int(required=True)
        id_usuario     = graphene.Int(required=True)
        contenido      = graphene.String(required=True)
        firmada        = graphene.Boolean()
        url_grabacion  = graphene.String()  # ← AGREGAR este campo
    
    acta = graphene.Field(ActaAudienciaType)
    
    def mutate(root, info, id_audiencia, id_usuario, contenido, firmada=False, url_grabacion=None):
        return CrearActa(acta=ActaAudiencia.objects.create(
            id_audiencia=Audiencia.objects.get(id_audiencia=id_audiencia),
            usuario=Usuario.objects.get(id_usuario=id_usuario),
            contenido=contenido,
            firmada=firmada,
            url_grabacion=url_grabacion  # ← AGREGAR este campo
        ))

class ActualizarActa(graphene.Mutation):
    class Arguments:
        id    = graphene.Int(required=True)
        input = ActualizarActaInput(required=True)
    acta = graphene.Field(ActaAudienciaType)
    def mutate(root, info, id, input):
        try:
            obj = ActaAudiencia.objects.get(id_acta=id)
            if input.contenido is not None:     obj.contenido = input.contenido
            if input.firmada is not None:       obj.firmada = input.firmada
            if input.url_grabacion is not None: obj.url_grabacion = input.url_grabacion
            obj.save()
            return ActualizarActa(acta=obj)
        except ActaAudiencia.DoesNotExist:
            return ActualizarActa(acta=None)

class EliminarActa(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
    ok      = graphene.Boolean()
    mensaje = graphene.String()
    def mutate(root, info, id):
        try:
            with transaction.atomic():
                ActaAudiencia.objects.get(id_acta=id).delete()
            return EliminarActa(ok=True, mensaje=None)
        except ActaAudiencia.DoesNotExist:
            return EliminarActa(ok=False, mensaje="Acta no encontrada")
        except ProtectedError:
            return EliminarActa(ok=False, mensaje="No se puede eliminar: el acta tiene registros relacionados")
        except Exception as e:
            return EliminarActa(ok=False, mensaje=str(e))


# --- SOLICITUD ---
class CrearSolicitud(graphene.Mutation):
    class Arguments:
        id_usuario   = graphene.Int(required=True)
        codigo_ianus = graphene.String(required=True)
        codigo_sala  = graphene.String(required=True)
        observacion  = graphene.String()
    solicitud = graphene.Field(SolicitudActualizacionType)
    def mutate(root, info, id_usuario, codigo_ianus, codigo_sala, observacion=None):
        return CrearSolicitud(solicitud=SolicitudActualizacion.objects.create(
            usuario=Usuario.objects.get(id_usuario=id_usuario),
            codigo_ianus=codigo_ianus, codigo_sala=codigo_sala,
            estado_solicitud='PENDIENTE', observacion=observacion))
# En tu archivo de mutations (schema.py)
class ActualizarSolicitud(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
        estado_solicitud = graphene.String(required=True)  # ← parámetro directo
        fecha_confirmacion = graphene.DateTime()           # ← parámetro directo
        observacion = graphene.String()                    # ← parámetro directo
    
    ok = graphene.Boolean()
    mensaje = graphene.String()
    solicitud = graphene.Field(lambda: SolicitudActualizacionType)
    
    def mutate(self, info, id, estado_solicitud, fecha_confirmacion=None, observacion=None):
        print(f"=== ACTUALIZANDO: id={id}, estado={estado_solicitud}, fecha={fecha_confirmacion}")
        
        try:
            solicitud = SolicitudActualizacion.objects.get(id_solicitud=id)
            
            # Cambiar estado
            solicitud.estado_solicitud = estado_solicitud
            
            # Si se aprueba o rechaza, poner fecha actual
            if estado_solicitud in ['APROBADA', 'RECHAZADA']:
                from django.utils import timezone
                solicitud.fecha_confirmacion = timezone.now()
                print(f"Fecha automática: {solicitud.fecha_confirmacion}")
            elif fecha_confirmacion:
                solicitud.fecha_confirmacion = fecha_confirmacion
            
            # Actualizar observación
            if observacion is not None:
                solicitud.observacion = observacion
            
            solicitud.save()
            print("✅ Solicitud actualizada correctamente")
            
            return ActualizarSolicitud(ok=True, mensaje="Solicitud actualizada", solicitud=solicitud)
            
        except SolicitudActualizacion.DoesNotExist:
            print(f"❌ Solicitud {id} no encontrada")
            return ActualizarSolicitud(ok=False, mensaje="Solicitud no encontrada", solicitud=None)
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
            return ActualizarSolicitud(ok=False, mensaje=str(e), solicitud=None)
class EliminarSolicitud(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
    ok      = graphene.Boolean()
    mensaje = graphene.String()
    def mutate(root, info, id):
        try:
            with transaction.atomic():
                SolicitudActualizacion.objects.get(id_solicitud=id).delete()
            return EliminarSolicitud(ok=True, mensaje=None)
        except SolicitudActualizacion.DoesNotExist:
            return EliminarSolicitud(ok=False, mensaje="Solicitud no encontrada")
        except ProtectedError:
            return EliminarSolicitud(ok=False, mensaje="No se puede eliminar: la solicitud tiene registros relacionados")
        except Exception as e:
            return EliminarSolicitud(ok=False, mensaje=str(e))


# ============================================================
# OTP - Google Authenticator
# ============================================================

import graphene
import pyotp
import jwt

from django.db.models import Q
from django.contrib.auth.hashers import check_password
from django.conf import settings

class ValidateUser(graphene.Mutation):
    class Arguments:
        email = graphene.String(required=True)
        password = graphene.String(required=True)
    
    success = graphene.Boolean()
    message = graphene.String()
    email_real = graphene.String()
    id_usuario = graphene.Int()
    nombres = graphene.String()
    paterno = graphene.String()
    rol = graphene.String()
    username = graphene.String()
    permisos = graphene.List(graphene.String)
    token = graphene.String()

    def mutate(self, info, email, password):
        from django.db.models import Q
        from django.contrib.auth.hashers import check_password
        import jwt

        from django.conf import settings
        
        print("🔵 1. Intentando login para:", email)
        
        try:
            usuario = Usuario.objects.get(
                Q(email=email) | Q(username=email),
                activo=True
            )
            print("🟢 2. Usuario encontrado:", usuario.email)
        except Usuario.DoesNotExist:
            print("🔴 3. Usuario NO encontrado")
            return ValidateUser(
                success=False,
                message="Usuario o email no registrado.",
                email_real=None,
                id_usuario=None,
                nombres=None,
                paterno=None,
                rol=None,
                username=None,
                permisos=[],
                token=None
            )
        
        print("🔵 4. Verificando contraseña...")
        if not check_password(password, usuario.password):
            print("🔴 5. Contraseña INCORRECTA")
            return ValidateUser(
                success=False,
                message="Contraseña incorrecta.",
                email_real=None,
                id_usuario=None,
                nombres=None,
                paterno=None,
                rol=None,
                username=None,
                permisos=[],
                token=None
            )
        
        # ✅ Obtener permisos del rol del usuario
        permisos_codigos = list(
            usuario.rol.permisos_asignados.values_list('permiso__codigo', flat=True)
        )
        
        # ✅ Generar token JWT
        token = jwt.encode(
            {
                'id_usuario': usuario.id_usuario,
                'email': usuario.email,
                'username': usuario.username,
                'rol': usuario.rol.nombre,
                'exp': datetime.utcnow() + timedelta(hours=24)
            },
            settings.SECRET_KEY,
            algorithm='HS256'
        )
        
        print("🟢 6. Login EXITOSO!")
        print(f"   - ID: {usuario.id_usuario}")
        print(f"   - Nombre: {usuario.nombres} {usuario.paterno}")
        print(f"   - Rol: {usuario.rol.nombre}")
        print(f"   - Permisos: {len(permisos_codigos)}")
        
        return ValidateUser(
            success=True,
            message="Usuario validado correctamente.",
            email_real=usuario.email,
            id_usuario=usuario.id_usuario,
            nombres=usuario.nombres,
            paterno=usuario.paterno,
            rol=usuario.rol.nombre,
            username=usuario.username,
            permisos=permisos_codigos,
            token=token
        )
class VerifyOtp(graphene.Mutation):
    class Arguments:
        email = graphene.String(required=True)
        code  = graphene.String(required=True)
    
    success = graphene.Boolean()
    message = graphene.String()
    token   = graphene.String()
    id_usuario = graphene.Int()
    email_real = graphene.String()
    nombres = graphene.String()
    paterno = graphene.String()
    rol = graphene.String()
    username = graphene.String()
    permisos = graphene.List(graphene.String)

    def mutate(self, info, email, code):
        from django.db.models import Q
        from django.utils import timezone
        import jwt
        from django.conf import settings
        
        try:
            usuario = Usuario.objects.get(
                Q(email=email) | Q(username=email),
                activo=True
            )
        except Usuario.DoesNotExist:
            return VerifyOtp(
                success=False, 
                message="Usuario no encontrado",
                token=None,
                id_usuario=None,
                email_real=None,
                nombres=None,
                paterno=None,
                rol=None,
                username=None,
                permisos=[]
            )
        
        if not usuario.otp_secret:
            return VerifyOtp(
                success=False, 
                message="No hay código OTP configurado",
                token=None,
                id_usuario=None,
                email_real=None,
                nombres=None,
                paterno=None,
                rol=None,
                username=None,
                permisos=[]
            )
        
        totp = pyotp.TOTP(usuario.otp_secret)
        
        if totp.verify(code):
            # Actualizar último acceso
            usuario.ultimo_acceso = timezone.now()
            usuario.save()
            
            # ✅ Obtener permisos del rol del usuario
            permisos_codigos = list(
                usuario.rol.permisos_asignados.values_list('permiso__codigo', flat=True)
            )
            
            # ✅ Generar token JWT
            token = jwt.encode(
                {
                    'id_usuario': usuario.id_usuario,
                    'email': usuario.email,
                    'username': usuario.username,
                    'rol': usuario.rol.nombre,
                    'exp': timezone.now() + timezone.timedelta(hours=24)
                },
                settings.SECRET_KEY,
                algorithm='HS256'
            )
            
            return VerifyOtp(
                success=True,
                message="Código verificado correctamente",
                token=token,
                id_usuario=usuario.id_usuario,
                email_real=usuario.email,
                nombres=usuario.nombres,
                paterno=usuario.paterno,
                rol=usuario.rol.nombre,
                username=usuario.username,
                permisos=permisos_codigos
            )
        
        return VerifyOtp(
            success=False,
            message="Código incorrecto",
            token=None,
            id_usuario=None,
            email_real=None,
            nombres=None,
            paterno=None,
            rol=None,
            username=None,
            permisos=[]
        )


class ObtenerQrResult(graphene.ObjectType):
    success   = graphene.Boolean()
    message   = graphene.String()
    qr_base64 = graphene.String()
    es_nuevo  = graphene.Boolean()

class ObtenerQr(graphene.Mutation):
    class Arguments:
        email = graphene.String(required=True)
    Output = ObtenerQrResult

    def mutate(self, info, email):
        from django.db.models import Q
        
        try:
            usuario = Usuario.objects.get(
                Q(email=email) | Q(username=email),
                activo=True
            )
        except Usuario.DoesNotExist:
            return ObtenerQrResult(
                success=False,
                message="Usuario no encontrado",
                qr_base64=None,
                es_nuevo=False
            )
        
        es_nuevo = not bool(usuario.otp_secret)
        
        if es_nuevo:
            usuario.otp_secret = pyotp.random_base32()
            usuario.save()
        
        totp = pyotp.TOTP(usuario.otp_secret)
        uri = totp.provisioning_uri(name=usuario.email, issuer_name="Tribunal App")
        
        # Generar QR
        import qrcode
        import io
        import base64
        
        img = qrcode.make(uri)
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        qr_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
        
        return ObtenerQrResult(
            success=True,
            message="QR generado correctamente",
            qr_base64=qr_b64,
            es_nuevo=es_nuevo
        )
    
class RegenerarQrResult(graphene.ObjectType):
    success = graphene.Boolean()
    message = graphene.String()

class RegenerarQr(graphene.Mutation):
    class Arguments:
        email = graphene.String(required=True)
    Output = RegenerarQrResult

    def mutate(self, info, email):
        from django.db.models import Q
        
        try:
            usuario = Usuario.objects.get(
                Q(email=email) | Q(username=email),
                activo=True
            )
        except Usuario.DoesNotExist:
            return RegenerarQrResult(
                success=False,
                message="Usuario no encontrado"
            )
        
        usuario.otp_secret = pyotp.random_base32()
        usuario.save()
        
        return RegenerarQrResult(
            success=True,
            message="QR regenerado correctamente"
        )


import io
from django.core.mail import EmailMessage
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)


# ────────────────────────────────────────────────────────────
# GENERADOR DE PDF
# ────────────────────────────────────────────────────────────

def generar_pdf_reporte(anio: int, destinatario_rol: str, mes: int = None, fecha_inicio: str = None, fecha_fin: str = None) -> bytes:
    """
    Genera el PDF del reporte anual y lo devuelve como bytes.
    destinatario_rol: 'Administrador' | 'Vocal' | 'Secretario'
    """
    from django.db.models import Count
    from django.db.models.functions import ExtractMonth

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()
    AZUL   = colors.HexColor("#1a56db")
    GRIS   = colors.HexColor("#f3f4f6")
    OSCURO = colors.HexColor("#111827")

    titulo_style = ParagraphStyle(
        "titulo", parent=styles["Title"],
        fontSize=18, textColor=AZUL, spaceAfter=4,
    )
    subtitulo_style = ParagraphStyle(
        "subtitulo", parent=styles["Normal"],
        fontSize=10, textColor=colors.HexColor("#6b7280"), spaceAfter=16,
    )
    seccion_style = ParagraphStyle(
        "seccion", parent=styles["Heading2"],
        fontSize=12, textColor=AZUL, spaceBefore=18, spaceAfter=8,
        borderPad=4,
    )
    normal = styles["Normal"]

    # ── Estilo de tabla compartido ──────────────────────────
    def tabla_style(col_headers=True):
        base = [
            ("BACKGROUND", (0, 0), (-1, 0 if col_headers else -1), AZUL if col_headers else GRIS),
            ("TEXTCOLOR",  (0, 0), (-1, 0), colors.white if col_headers else OSCURO),
            ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE",   (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, GRIS]),
            ("GRID",       (0, 0), (-1, -1), 0.4, colors.HexColor("#d1d5db")),
            ("TOPPADDING",    (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING",   (0, 0), (-1, -1), 8),
            ("ALIGN",      (1, 1), (-1, -1), "CENTER"),
        ]
        return TableStyle(base)

    story = []

    # ── Encabezado ──────────────────────────────────────────
    MESES_NOMBRES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
    if fecha_inicio and fecha_fin:
        periodo_label = f"Período: {fecha_inicio} al {fecha_fin}"
    elif mes:
        periodo_label = f"{MESES_NOMBRES[mes-1]} {anio}"
    else:
        periodo_label = f"Año {anio}"

    story.append(Paragraph("Sistema de Gestión Judicial", titulo_style))
    story.append(Paragraph(f"Reporte {periodo_label} · {destinatario_rol}", subtitulo_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=AZUL, spaceAfter=14))

    from datetime import date
    story.append(Paragraph(
        f"Generado el {date.today().strftime('%d/%m/%Y')}  |  {periodo_label}",
        ParagraphStyle("meta", parent=normal, fontSize=8,
                       textColor=colors.HexColor("#9ca3af"), spaceAfter=20),
    ))

    # ══════════════════════════════════════════════════════
    # SECCIÓN 1 — AUDIENCIAS (todos los roles)
    # ══════════════════════════════════════════════════════
    story.append(Paragraph("1. Audiencias por Estado", seccion_style))

    aud_qs = _aplicar_filtro_fecha(Audiencia.objects.all(), 'fecha_hora_programada', anio, mes, fecha_inicio, fecha_fin)
    aud_estado = list(
        aud_qs.values("estado_audiencia").annotate(total=Count("id_audiencia"))
    )
    total_aud = sum(r["total"] for r in aud_estado)

    if aud_estado:
        data = [["Estado", "Cantidad", "% del total"]]
        for r in aud_estado:
            pct = f"{round(r['total'] / total_aud * 100, 1)}%" if total_aud else "0%"
            data.append([r["estado_audiencia"], str(r["total"]), pct])
        data.append(["TOTAL", str(total_aud), "100%"])

        t = Table(data, colWidths=[3.2 * inch, 1.4 * inch, 1.4 * inch])
        s = tabla_style()
        s.add("BACKGROUND", (0, len(data) - 1), (-1, len(data) - 1), colors.HexColor("#e0e7ff"))
        s.add("FONTNAME",   (0, len(data) - 1), (-1, len(data) - 1), "Helvetica-Bold")
        t.setStyle(s)
        story.append(t)
    else:
        story.append(Paragraph("Sin audiencias registradas para este año.", normal))

    story.append(Spacer(1, 10))

    # Audiencias por mes
    story.append(Paragraph("Distribución mensual de audiencias", 
                            ParagraphStyle("subsec", parent=normal, fontSize=10,
                                           fontName="Helvetica-Bold", spaceAfter=6, spaceBefore=10)))
    MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
    mes_data_raw = {
        r["mes"]: r["total"]
        for r in aud_qs.annotate(mes=ExtractMonth("fecha_hora_programada"))
                       .values("mes").annotate(total=Count("id_audiencia"))
    }
    mes_data = [["Mes", "Audiencias"]] + [
        [MESES[m - 1], str(mes_data_raw.get(m, 0))] for m in range(1, 13)
    ]
    t2 = Table(mes_data, colWidths=[2.5 * inch, 1.5 * inch])
    t2.setStyle(tabla_style())
    story.append(t2)

    # ══════════════════════════════════════════════════════
    # SECCIÓN 2 — EXPEDIENTES (Administrador + Secretario)
    # ══════════════════════════════════════════════════════
    if destinatario_rol in ("Administrador", "Secretario"):
        story.append(Paragraph("2. Expedientes por Tipo de Proceso", seccion_style))

        exp_tipo = list(
            _aplicar_filtro_fecha(Expediente.objects.all(), 'fecha_ingreso', anio, mes, fecha_inicio, fecha_fin)
            .values("id_tipo_proceso__nombre").annotate(total=Count("id_expediente"))
        )
        total_exp = sum(r["total"] for r in exp_tipo)

        if exp_tipo:
            data = [["Tipo de Proceso", "Expedientes", "%"]]
            for r in exp_tipo:
                pct = f"{round(r['total'] / total_exp * 100, 1)}%" if total_exp else "0%"
                data.append([r["id_tipo_proceso__nombre"] or "Sin tipo", str(r["total"]), pct])
            data.append(["TOTAL", str(total_exp), "100%"])

            t3 = Table(data, colWidths=[3.8 * inch, 1.2 * inch, 1.0 * inch])
            s3 = tabla_style()
            s3.add("BACKGROUND", (0, len(data) - 1), (-1, len(data) - 1), colors.HexColor("#e0e7ff"))
            s3.add("FONTNAME",   (0, len(data) - 1), (-1, len(data) - 1), "Helvetica-Bold")
            t3.setStyle(s3)
            story.append(t3)
        else:
            story.append(Paragraph("Sin expedientes registrados para este año.", normal))

        story.append(Spacer(1, 10))
        story.append(Paragraph("Expedientes por Estado", 
                                ParagraphStyle("subsec2", parent=normal, fontSize=10,
                                               fontName="Helvetica-Bold", spaceAfter=6, spaceBefore=10)))
        exp_estado = list(
            _aplicar_filtro_fecha(Expediente.objects.exclude(id_estado_expediente=None), 'fecha_ingreso', anio, mes, fecha_inicio, fecha_fin)
            .values("id_estado_expediente__nombre_estado").annotate(total=Count("id_expediente"))
        )
        if exp_estado:
            data2 = [["Estado", "Cantidad"]]
            for r in exp_estado:
                data2.append([r["id_estado_expediente__nombre_estado"], str(r["total"])])
            t4 = Table(data2, colWidths=[3.2 * inch, 1.4 * inch])
            t4.setStyle(tabla_style())
            story.append(t4)

    # ══════════════════════════════════════════════════════
    # SECCIÓN 3 — CARGA POR SALA (Administrador)
    # ══════════════════════════════════════════════════════
    if destinatario_rol == "Administrador":
        story.append(Paragraph("3. Carga por Sala", seccion_style))

        salas = SalaTribunal.objects.select_related("id_tribunal").filter(activa=True)
        data = [["Sala", "Tribunal", "Audiencias", "Expedientes"]]
        for sala in salas:
            aud_c = _aplicar_filtro_fecha(
                Audiencia.objects.filter(id_sala_aud__id_tribunal=sala.id_tribunal),
                'fecha_hora_programada', anio, mes, fecha_inicio, fecha_fin
            ).count()
            exp_c = _aplicar_filtro_fecha(
                Expediente.objects.filter(id_sala=sala),
                'fecha_ingreso', anio, mes, fecha_inicio, fecha_fin
            ).count()
            data.append([sala.nombre_sala, sala.id_tribunal.nombre_tribunal[:30], str(aud_c), str(exp_c)])

        if len(data) > 1:
            t5 = Table(data, colWidths=[2.0 * inch, 2.0 * inch, 1.1 * inch, 1.1 * inch])
            t5.setStyle(tabla_style())
            story.append(t5)

    # ══════════════════════════════════════════════════════
    # SECCIÓN 4 — ACTIVIDAD USUARIOS (Administrador)
    # ══════════════════════════════════════════════════════
    if destinatario_rol == "Administrador":
        story.append(Paragraph("4. Actividad por Usuario", seccion_style))

        usuarios = Usuario.objects.filter(activo=True).select_related("rol")
        data = [["Usuario", "Cargo", "Rol", "Actuaciones"]]
        for u in usuarios:
            act_c = _aplicar_filtro_fecha(
                ActuacionProcesal.objects.filter(usuario=u),
                'fecha_actuacion', anio, mes, fecha_inicio, fecha_fin
            ).count()
            data.append([
                f"{u.paterno} {u.nombres}",
                u.cargo_oficial or "—",
                u.rol.nombre if u.rol else "—",
                str(act_c),
            ])

        if len(data) > 1:
            t6 = Table(data, colWidths=[2.0 * inch, 1.8 * inch, 1.2 * inch, 1.0 * inch])
            t6.setStyle(tabla_style())
            story.append(t6)

    # ══════════════════════════════════════════════════════
    # PIE
    # ══════════════════════════════════════════════════════
    story.append(Spacer(1, 24))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#d1d5db")))
    story.append(Paragraph(
        "Este reporte fue generado automáticamente por el Sistema de Gestión Judicial. "
        "No requiere firma para su validez informativa.",
        ParagraphStyle("pie", parent=normal, fontSize=7,
                       textColor=colors.HexColor("#9ca3af"), spaceBefore=6),
    ))

    doc.build(story)
    return buffer.getvalue()


# ────────────────────────────────────────────────────────────
# LÓGICA DE ENVÍO
# ────────────────────────────────────────────────────────────

def _enviar_reporte_a_usuario(usuario, anio: int, pdf_bytes: bytes, rol_nombre: str, periodo_label: str = None):
    """Envía el email con el PDF adjunto a un único usuario."""
    nombre_completo = f"{usuario.paterno} {usuario.nombres}"
    periodo = periodo_label or f"Año {anio}"
    asunto = f"Reporte {periodo} — Sistema Judicial"
    cuerpo = f"""Estimado/a {nombre_completo},

Se adjunta el reporte estadístico correspondiente al período {periodo} del Sistema de Gestión Judicial.

Resumen del reporte:
  • Rol: {rol_nombre}
  • Cargo: {usuario.cargo_oficial or 'No especificado'}
  • Período: {periodo}

El documento PDF adjunto contiene las estadísticas de audiencias{', expedientes' if rol_nombre in ('Administrador','Secretario') else ''}{' y actividad de usuarios' if rol_nombre == 'Administrador' else ''} del período indicado.

Este mensaje fue generado automáticamente. Por favor no responda a este correo.

Atentamente,
Sistema de Gestión Judicial
"""
    email = EmailMessage(
        subject=asunto,
        body=cuerpo,
        from_email=django_settings.DEFAULT_FROM_EMAIL,
        to=[usuario.email],
    )
    email.attach(
        filename=f"reporte_judicial_{anio}_{rol_nombre.lower()}.pdf",
        content=pdf_bytes,
        mimetype="application/pdf",
    )
    email.send(fail_silently=False)


# ────────────────────────────────────────────────────────────
# TYPE DE RESULTADO
# ────────────────────────────────────────────────────────────

class EnvioReporteResultType(graphene.ObjectType):
    ok             = graphene.Boolean()
    mensaje        = graphene.String()
    enviados       = graphene.Int()
    fallidos       = graphene.Int()
    destinatarios  = graphene.List(graphene.String)


# ────────────────────────────────────────────────────────────
# MUTATION
# ────────────────────────────────────────────────────────────

class EnviarCertificadoNoHallado(graphene.Mutation):
    class Arguments:
        id_persona = graphene.Int(required=True)

    ok            = graphene.Boolean()
    mensaje       = graphene.String()
    email_enviado = graphene.String()

    def mutate(self, info, id_persona):
        import io
        import base64
        from django.core.mail import EmailMessage

        try:
            persona = Persona.objects.get(id_persona=id_persona)
        except Persona.DoesNotExist:
            return EnviarCertificadoNoHallado(ok=False, mensaje="Persona no encontrada.", email_enviado=None)

        # Verificar que no tenga procesos activos
        partes_activas = ParteProcesal.objects.filter(
            id_persona=persona,
            activo=True,
        ).exclude(
            id_expediente__id_estado_expediente__es_terminal=True
        )

        if partes_activas.exists():
            return EnviarCertificadoNoHallado(
                ok=False,
                mensaje="La persona tiene procesos activos. No se puede emitir el certificado.",
                email_enviado=None
            )

        # Buscar email
        contacto = ContactoPersona.objects.filter(
            id_persona=persona,
            tipo_contacto__iexact="EMAIL"
        ).order_by('-es_principal').first()

        if not contacto:
            return EnviarCertificadoNoHallado(
                ok=False,
                mensaje="La persona no tiene email registrado en el sistema.",
                email_enviado=None
            )

        email_destino   = contacto.valor.strip()
        nombre_completo = f"{persona.nombre} {persona.primer_apellido}"
        if persona.segundo_apellido:
            nombre_completo += f" {persona.segundo_apellido}"

        from datetime import date
        fecha_hoy   = date.today()
        fecha_larga = fecha_hoy.strftime("%d de %B de %Y")
        fecha_corta = fecha_hoy.strftime("%d/%m/%Y")
        hora_str    = timezone.now().strftime("%H:%M")

        tribunal_nombre = "Tribunal Departamental de Justicia de Santa Cruz"
        instancia       = "DEPARTAMENTAL"

        reg = persona.registro_universitario or "—"
        ci  = persona.numero_documento or "No registrado"

        codigo = f"CERT-PNH-{reg.replace(' ','').upper()}-{fecha_hoy.year}-{id_persona:06d}"

        items_busqueda = [
            "Expedientes civiles activos y archivados",
            "Procesos penales en todas sus etapas",
            "Causas de familia y menores",
            "Procesos laborales y administrativos",
            "Recursos e impugnaciones pendientes",
            "Expedientes concluidos y archivados",
        ]
        items_html = "".join(f"<li style='margin:4px 0;'>• {i}</li>" for i in items_busqueda)

        asunto = f"Certificado de Proceso No Hallado — {nombre_completo}"

        html_body = f"""<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
  <tr><td align="center">
  <table width="620" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.10);">

    <tr><td style="background:#0f3778;padding:28px 40px;">
      <p style="margin:0;color:#fff;font-size:10px;letter-spacing:2px;text-transform:uppercase;">Estado Plurinacional de Bolivia</p>
      <h1 style="margin:6px 0 0;color:#fff;font-size:19px;font-weight:700;">{tribunal_nombre}</h1>
      <p style="margin:4px 0 0;color:#b3c6e8;font-size:12px;">Sistema de Gestión Judicial</p>
    </td></tr>

    <tr><td style="background:#1a4fa0;padding:10px 40px;">
      <p style="margin:0;color:#fff;font-size:13px;font-weight:700;letter-spacing:1px;">📋 CERTIFICADO DE PROCESO NO HALLADO</p>
    </td></tr>

    <tr><td style="padding:30px 40px 16px;">
      <p style="margin:0;color:#374151;font-size:15px;">Estimado/a <strong>{nombre_completo}</strong>,</p>
      <p style="margin:12px 0 0;color:#6b7280;font-size:14px;line-height:1.7;">
        El <strong>{tribunal_nombre}</strong> certifica que, tras realizar una búsqueda exhaustiva en sus registros, <strong>no se encontró ningún proceso judicial activo</strong> a su nombre.
      </p>
    </td></tr>

    <tr><td style="padding:0 40px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <tr style="background:#f9fafb;">
          <td style="padding:10px 16px;font-size:11px;color:#6b7280;font-weight:700;text-transform:uppercase;width:40%;border-bottom:1px solid #e5e7eb;">Nombre completo</td>
          <td style="padding:10px 16px;font-size:14px;color:#111827;font-weight:700;border-bottom:1px solid #e5e7eb;">{nombre_completo}</td>
        </tr>
        <tr>
          <td style="padding:10px 16px;font-size:11px;color:#6b7280;font-weight:700;text-transform:uppercase;border-bottom:1px solid #e5e7eb;background:#f9fafb;">N° Registro</td>
          <td style="padding:10px 16px;font-size:14px;color:#111827;border-bottom:1px solid #e5e7eb;">{reg}</td>
        </tr>
        <tr style="background:#f9fafb;">
          <td style="padding:10px 16px;font-size:11px;color:#6b7280;font-weight:700;text-transform:uppercase;border-bottom:1px solid #e5e7eb;">C.I.</td>
          <td style="padding:10px 16px;font-size:14px;color:#111827;border-bottom:1px solid #e5e7eb;">{ci}</td>
        </tr>
        <tr>
          <td style="padding:10px 16px;font-size:11px;color:#6b7280;font-weight:700;text-transform:uppercase;">Fecha de emisión</td>
          <td style="padding:10px 16px;font-size:14px;color:#111827;">{fecha_larga} — {hora_str} hrs.</td>
        </tr>
      </table>
    </td></tr>

    <tr><td style="padding:0 40px 20px;">
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;">
        <p style="margin:0;font-size:13px;color:#166534;font-weight:700;">✅ PROCESO NO HALLADO</p>
        <p style="margin:8px 0 0;font-size:13px;color:#166534;line-height:1.6;">
          La búsqueda incluyó: <ul style="margin:6px 0 0;padding-left:16px;color:#15803d;">{items_html}</ul>
        </p>
      </div>
    </td></tr>

    <tr><td style="padding:0 40px 20px;">
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 20px;">
        <p style="margin:0;font-size:12px;color:#92400e;line-height:1.6;">
          ⚠ <strong>Vigencia:</strong> Este certificado tiene validez de <strong>30 días</strong> a partir de su emisión. No ampara procesos en otras jurisdicciones. Código: <code style="font-size:11px;">{codigo}</code>
        </p>
      </div>
    </td></tr>

    <tr><td style="background:#0f3778;padding:18px 40px;text-align:center;">
      <p style="margin:0;color:#b3c6e8;font-size:12px;">{tribunal_nombre} · Sistema de Gestión Judicial · {fecha_corta}</p>
    </td></tr>

  </table>
  </td></tr>
</table>
</body></html>"""

        texto_plano = f"""CERTIFICADO DE PROCESO NO HALLADO
{tribunal_nombre}

Persona: {nombre_completo}
N° Registro: {reg}
C.I.: {ci}
Fecha: {fecha_larga}
Código: {codigo}

Resultado: NO SE ENCONTRÓ ningún proceso judicial activo a nombre de la persona indicada.
Vigencia: 30 días desde la fecha de emisión.

Sistema de Gestión Judicial — generado automáticamente."""

        try:
            from django.core.mail import EmailMultiAlternatives
            msg = EmailMultiAlternatives(
                subject=asunto,
                body=texto_plano,
                from_email=django_settings.DEFAULT_FROM_EMAIL,
                to=[email_destino],
            )
            msg.attach_alternative(html_body, "text/html")
            msg.send(fail_silently=False)

            return EnviarCertificadoNoHallado(
                ok=True,
                mensaje=f"Certificado enviado correctamente a {email_destino}.",
                email_enviado=email_destino
            )
        except Exception as e:
            return EnviarCertificadoNoHallado(
                ok=False,
                mensaje=f"Error al enviar el email: {str(e)}",
                email_enviado=None
            )




class EnviarReportesPorEmail(graphene.Mutation):
    class Arguments:
        anio         = graphene.Int(required=True)
        roles        = graphene.List(graphene.String)
        usuario_ids  = graphene.List(graphene.Int,
                       description="IDs específicos de usuarios. Si se provee, ignora 'roles'.")
        mes          = graphene.Int(description="Filtrar reporte por mes (1-12). Opcional.")
        fecha_inicio = graphene.String()
        fecha_fin    = graphene.String()
    Output = EnvioReporteResultType

    def mutate(self, info, anio, roles=None, usuario_ids=None, mes=None, fecha_inicio=None, fecha_fin=None):
        ROLES_VALIDOS = {"Administrador", "Vocal", "Secretario"}
        MESES_NOMBRES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
        if fecha_inicio and fecha_fin:
            periodo_label = f"{fecha_inicio} al {fecha_fin}"
        elif mes:
            periodo_label = f"{MESES_NOMBRES[mes-1]} {anio}"
        else:
            periodo_label = f"Año {anio}"

        enviados      = 0
        fallidos      = 0
        destinatarios = []
        errores       = []

        # ── Modo usuarios individuales ──────────────────────
        if usuario_ids:
            usuarios_qs = Usuario.objects.filter(
                id_usuario__in=usuario_ids, activo=True
            ).select_related("rol")

            # Agrupar por rol para generar un PDF por rol
            from collections import defaultdict
            por_rol = defaultdict(list)
            for u in usuarios_qs:
                rol_nombre = u.rol.nombre if u.rol else "Administrador"
                if rol_nombre not in ROLES_VALIDOS:
                    rol_nombre = "Administrador"
                por_rol[rol_nombre].append(u)

            for rol_nombre, usuarios in por_rol.items():
                try:
                    pdf_bytes = generar_pdf_reporte(anio, rol_nombre, mes=mes, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)
                except Exception as e:
                    errores.append(f"Error PDF {rol_nombre}: {str(e)}")
                    continue
                for usuario in usuarios:
                    if not usuario.email:
                        continue
                    try:
                        _enviar_reporte_a_usuario(usuario, anio, pdf_bytes, rol_nombre, periodo_label=periodo_label)
                        
                        enviados += 1
                        destinatarios.append(
                            f"{usuario.paterno} {usuario.nombres} <{usuario.email}>"
                        )
                    except Exception as e:
                        fallidos += 1
                        errores.append(f"Error enviando a {usuario.email}: {str(e)}")

        # ── Modo roles ───────────────────────────────────────
        else:
            roles_objetivo = [
                r for r in (roles or list(ROLES_VALIDOS)) if r in ROLES_VALIDOS
            ]
            if not roles_objetivo:
                return EnvioReporteResultType(
                    ok=False,
                    mensaje="No se especificaron roles válidos.",
                    enviados=0, fallidos=0, destinatarios=[],
                )

            for rol_nombre in roles_objetivo:
                try:
                    pdf_bytes = generar_pdf_reporte(anio, rol_nombre, mes=mes, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)
                except Exception as e:
                    errores.append(f"Error PDF {rol_nombre}: {str(e)}")
                    continue

                usuarios = Usuario.objects.filter(
                    rol__nombre=rol_nombre, activo=True
                ).select_related("rol")

                for usuario in usuarios:
                    if not usuario.email:
                        continue
                    try:
                        _enviar_reporte_a_usuario(usuario, anio, pdf_bytes, rol_nombre, periodo_label=periodo_label)
                        enviados += 1
                        destinatarios.append(
                            f"{usuario.paterno} {usuario.nombres} <{usuario.email}>"
                        )
                    except Exception as e:
                        fallidos += 1
                        errores.append(f"Error enviando a {usuario.email}: {str(e)}")

        if enviados == 0 and fallidos == 0:
            return EnvioReporteResultType(
                ok=False,
                mensaje="No se encontraron usuarios activos.",
                enviados=0, fallidos=0, destinatarios=[],
            )

        mensaje = f"Reporte {anio} enviado. Exitosos: {enviados}, Fallidos: {fallidos}."
        if errores:
            mensaje += f" Errores: {'; '.join(errores[:3])}"

        return EnvioReporteResultType(
            ok=fallidos == 0,
            mensaje=mensaje,
            enviados=enviados,
            fallidos=fallidos,
            destinatarios=destinatarios,
        )






   




class ResultadoCitacionType(graphene.ObjectType):
    ok            = graphene.Boolean()
    mensaje       = graphene.String()
    enviados      = graphene.Int()
    fallidos      = graphene.Int()
    sin_email     = graphene.List(graphene.String)
    destinatarios = graphene.List(graphene.String)


class EnviarCitacionesAudiencia(graphene.Mutation):
    """
    Envía un correo de citación personalizado a cada parte procesal
    del expediente al que pertenece la audiencia.

    Uso desde GraphQL:
        mutation {
          enviarCitacionesAudiencia(idAudiencia: 5) {
            ok
            mensaje
            enviados
            fallidos
            sinEmail
            destinatarios
          }
        }
    """
    class Arguments:
        id_audiencia = graphene.Int(required=True)

    Output = ResultadoCitacionType

    def mutate(self, info, id_audiencia):
        # 1. Obtener la audiencia
        try:
            audiencia = Audiencia.objects.select_related(
                "id_expediente",
                "id_tipo_audiencia",
                "id_sala_aud",
                "id_expediente__id_sala__id_tribunal",
            ).get(id_audiencia=id_audiencia)
        except Audiencia.DoesNotExist:
            return ResultadoCitacionType(
                ok=False,
                mensaje="Audiencia no encontrada.",
                enviados=0, fallidos=0, sin_email=[], destinatarios=[],
            )

        expediente   = audiencia.id_expediente
        tipo_aud     = audiencia.id_tipo_audiencia.nombre if audiencia.id_tipo_audiencia else "Audiencia"
        sala_nombre  = audiencia.id_sala_aud.nombre_sala if audiencia.id_sala_aud else "Por confirmar"
        tribunal     = expediente.id_sala.id_tribunal.nombre_tribunal if expediente.id_sala else "Tribunal"
        link         = audiencia.link_videoconferencia or ""

        # Formatear fecha
        from django.utils.timezone import localtime
        fecha_local  = localtime(audiencia.fecha_hora_programada)
        import locale
        try:
            locale.setlocale(locale.LC_TIME, 'es_BO.UTF-8')
        except:
            try:
                locale.setlocale(locale.LC_TIME, 'es_ES.UTF-8')
            except:
                pass
        fecha_str = fecha_local.strftime("%d de %B de %Y")
        hora_str  = fecha_local.strftime("%H:%M")

        # 2. Obtener partes activas del expediente
        partes = ParteProcesal.objects.filter(
            id_expediente=expediente,
            activo=True,
        ).select_related("id_persona", "id_rol")

        if not partes.exists():
            return ResultadoCitacionType(
                ok=False,
                mensaje="El expediente no tiene partes procesales activas.",
                enviados=0, fallidos=0, sin_email=[], destinatarios=[],
            )

        enviados      = 0
        fallidos      = 0
        sin_email     = []
        destinatarios = []

        for parte in partes:
            persona = parte.id_persona
            rol     = parte.id_rol.nombre_rol if parte.id_rol else "Parte procesal"

            nombre_completo = f"{persona.nombre} {persona.primer_apellido}"
            if persona.segundo_apellido:
                nombre_completo += f" {persona.segundo_apellido}"

            # 3. Buscar email principal; si no hay, cualquier EMAIL
            contacto = (
                ContactoPersona.objects.filter(
                    id_persona=persona,
                    tipo_contacto__iexact="EMAIL",
                    es_principal=True,
                ).first()
                or
                ContactoPersona.objects.filter(
                    id_persona=persona,
                    tipo_contacto__iexact="EMAIL",
                ).first()
            )

            if not contacto:
                sin_email.append(f"{nombre_completo} ({rol})")
                continue

            email_destino = contacto.valor.strip()

            # 4. Construir el cuerpo del correo
            link_seccion = ""
            if link:
                link_seccion = f"\n  Enlace de videoconferencia: {link}\n"

            cuerpo = f"""Estimado/a {nombre_completo},

Por medio del presente, el {tribunal} le cita formalmente a comparecer a la siguiente audiencia:

  Expediente N°  : {expediente.numero_expediente} ({expediente.ano})
  Tipo de audiencia: {tipo_aud}
  Fecha          : {fecha_str}
  Hora           : {hora_str} hrs.
  Sala           : {sala_nombre}{link_seccion}

Su participación en calidad de: {rol}

Se le recuerda que la inasistencia sin justificación puede tener consecuencias procesales conforme a la normativa vigente.

Este mensaje fue generado automáticamente por el Sistema de Gestión Judicial.
Por favor no responda a este correo electrónico.

Atentamente,
{tribunal}
Sistema de Gestión Judicial
"""

            asunto = (
                f"CITACIÓN — {tipo_aud} · Exp. {expediente.numero_expediente} · "
                f"{fecha_str} {hora_str} hrs."
            )

            # 5. Enviar
            try:
                html_cuerpo = f"""
                <!DOCTYPE html>
                <html lang="es">
                <head><meta charset="UTF-8"></head>
                <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
                    <tr><td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

                        <!-- Franja superior -->
                        <tr>
                        <td style="background:#1a37db;padding:28px 40px;">
                            <p style="margin:0;color:#ffffff;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Estado Plurinacional de Bolivia</p>
                            <h1 style="margin:6px 0 0;color:#ffffff;font-size:20px;font-weight:700;">{tribunal}</h1>
                            <p style="margin:4px 0 0;color:#bfcfff;font-size:12px;">Sistema de Gestión Judicial</p>
                        </td>
                        </tr>

                        <!-- Etiqueta CITACIÓN JUDICIAL -->
                        <tr>
                        <td style="background:#1e40af;padding:10px 40px;">
                            <p style="margin:0;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:1px;">⚖ CITACIÓN JUDICIAL</p>
                        </td>
                        </tr>

                        <!-- Saludo -->
                        <tr>
                        <td style="padding:32px 40px 16px;">
                            <p style="margin:0;color:#374151;font-size:15px;">Estimado/a <strong>{nombre_completo}</strong>,</p>
                            <p style="margin:12px 0 0;color:#6b7280;font-size:14px;line-height:1.6;">
                            Por medio del presente, el <strong>{tribunal}</strong> le cita formalmente
                            a comparecer a la siguiente audiencia judicial:
                            </p>
                        </td>
                        </tr>

                        <!-- Tabla de datos -->
                        <tr>
                        <td style="padding:0 40px 24px;">
                            <table width="100%" cellpadding="0" cellspacing="0"
                                style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                            <tr style="background:#f9fafb;">
                                <td style="padding:10px 16px;font-size:11px;color:#6b7280;font-weight:700;
                                        letter-spacing:1px;text-transform:uppercase;width:40%;
                                        border-bottom:1px solid #e5e7eb;">
                                Expediente N°
                                </td>
                                <td style="padding:10px 16px;font-size:14px;color:#111827;font-weight:700;
                                        border-bottom:1px solid #e5e7eb;">
                                {expediente.numero_expediente} &nbsp;·&nbsp; {expediente.ano}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:10px 16px;font-size:11px;color:#6b7280;font-weight:700;
                                        letter-spacing:1px;text-transform:uppercase;
                                        border-bottom:1px solid #e5e7eb;background:#f9fafb;">
                                Tipo de audiencia
                                </td>
                                <td style="padding:10px 16px;font-size:14px;color:#111827;
                                        border-bottom:1px solid #e5e7eb;">
                                {tipo_aud}
                                </td>
                            </tr>
                            <tr style="background:#f9fafb;">
                                <td style="padding:10px 16px;font-size:11px;color:#6b7280;font-weight:700;
                                        letter-spacing:1px;text-transform:uppercase;
                                        border-bottom:1px solid #e5e7eb;">
                                Fecha
                                </td>
                                <td style="padding:10px 16px;font-size:14px;color:#111827;font-weight:600;
                                        border-bottom:1px solid #e5e7eb;">
                                {fecha_str}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:10px 16px;font-size:11px;color:#6b7280;font-weight:700;
                                        letter-spacing:1px;text-transform:uppercase;
                                        border-bottom:1px solid #e5e7eb;background:#f9fafb;">
                                Hora
                                </td>
                                <td style="padding:10px 16px;font-size:14px;color:#111827;font-weight:600;
                                        border-bottom:1px solid #e5e7eb;">
                                {hora_str} hrs.
                                </td>
                            </tr>
                            <tr style="background:#f9fafb;">
                                <td style="padding:10px 16px;font-size:11px;color:#6b7280;font-weight:700;
                                        letter-spacing:1px;text-transform:uppercase;">
                                Sala
                                </td>
                                <td style="padding:10px 16px;font-size:14px;color:#111827;">
                                {sala_nombre}
                                </td>
                            </tr>
                            </table>
                        </td>
                        </tr>

                        <!-- Rol -->
                        <tr>
                        <td style="padding:0 40px 24px;">
                            <table width="100%" cellpadding="0" cellspacing="0"
                                style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;">
                            <tr>
                                <td style="padding:14px 20px;">
                                <p style="margin:0;font-size:12px;color:#1d4ed8;font-weight:700;
                                            text-transform:uppercase;letter-spacing:1px;">
                                    Su participación en calidad de:
                                </p>
                                <p style="margin:4px 0 0;font-size:16px;color:#1e3a8a;font-weight:700;">
                                    {rol}
                                </p>
                                </td>
                            </tr>
                            </table>
                        </td>
                        </tr>

                        {'<!-- Link videoconferencia --><tr><td style="padding:0 40px 24px;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;"><tr><td style="padding:14px 20px;"><p style="margin:0;font-size:12px;color:#15803d;font-weight:700;text-transform:uppercase;letter-spacing:1px;">🎥 Enlace de videoconferencia</p><a href="' + link + '" style="display:inline-block;margin-top:6px;color:#16a34a;font-size:14px;word-break:break-all;">' + link + '</a></td></tr></table></td></tr>' if link else ''}

                        <!-- Advertencia -->
                        <tr>
                        <td style="padding:0 40px 32px;">
                            <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;
                                    border-top:1px solid #e5e7eb;padding-top:20px;">
                            ⚠ Se le recuerda que la inasistencia sin justificación puede tener
                            consecuencias procesales conforme a la normativa vigente.
                            </p>
                            <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">
                            Este mensaje fue generado automáticamente por el Sistema de Gestión Judicial.
                            Por favor no responda a este correo electrónico.
                            </p>
                        </td>
                        </tr>

                        <!-- Pie -->
                        <tr>
                        <td style="background:#1a37db;padding:20px 40px;text-align:center;">
                            <p style="margin:0;color:#bfcfff;font-size:12px;">
                            {tribunal} &nbsp;·&nbsp; Sistema de Gestión Judicial
                            </p>
                        </td>
                        </tr>

                    </table>
                    </td></tr>
                </table>
                </body>
                </html>
                """

                from django.core.mail import EmailMultiAlternatives
                msg = EmailMultiAlternatives(
                    subject=asunto,
                    body=cuerpo,        # versión texto plano (fallback)
                    from_email=django_settings.DEFAULT_FROM_EMAIL,
                    to=[email_destino],
                )
                msg.attach_alternative(html_cuerpo, "text/html")
                msg.send(fail_silently=False)
                enviados += 1
                destinatarios.append(f"{nombre_completo} <{email_destino}>")
            except Exception as e:
                fallidos += 1

        # 6. Resultado
        if enviados == 0 and fallidos == 0 and sin_email:
            return ResultadoCitacionType(
                ok=False,
                mensaje="Ninguna parte tiene email registrado en el sistema.",
                enviados=0, fallidos=0,
                sin_email=sin_email, destinatarios=[],
            )

        mensaje = f"Citaciones enviadas: {enviados}."
        if fallidos:
            mensaje += f" Fallidos: {fallidos}."
        if sin_email:
            mensaje += f" Sin email: {len(sin_email)} parte(s)."

        return ResultadoCitacionType(
            ok=fallidos == 0,
            mensaje=mensaje,
            enviados=enviados,
            fallidos=fallidos,
            sin_email=sin_email,
            destinatarios=destinatarios,
        )




class RegistroAsistenciaInput(graphene.InputObjectType):
    id_persona          = graphene.Int(required=True)
    rol_en_audiencia    = graphene.String(required=True)
    estado              = graphene.String(required=True)   # PRESENTE | AUSENTE | JUSTIFICADO
    motivo_inasistencia = graphene.String()
 
 
class ResultadoBatchAsistenciaType(graphene.ObjectType):
    ok       = graphene.Boolean()
    mensaje  = graphene.String()
    registros = graphene.Int()
 
 
class RegistrarAsistenciaBatch(graphene.Mutation):
    """
    Guarda la asistencia de TODAS las partes de una audiencia de una sola vez.
    Borra los registros anteriores de esa audiencia y crea los nuevos.
    """
    class Arguments:
        id_audiencia = graphene.Int(required=True)
        registros    = graphene.List(RegistroAsistenciaInput, required=True)
 
    Output = ResultadoBatchAsistenciaType
 
    def mutate(self, info, id_audiencia, registros):
        try:
            audiencia = Audiencia.objects.get(id_audiencia=id_audiencia)
        except Audiencia.DoesNotExist:
            return ResultadoBatchAsistenciaType(
                ok=False, mensaje="Audiencia no encontrada.", registros=0
            )
 
        # Borrar asistencias anteriores de esta audiencia
        AsistenciaAudiencia.objects.filter(id_audiencia=audiencia).delete()
 
        # Crear las nuevas
        creados = 0
        for r in registros:
            try:
                persona = Persona.objects.get(id_persona=r.id_persona)
            except Persona.DoesNotExist:
                continue
 
            # Traducir estado al modelo
            asistio             = r.estado == "PRESENTE"
            motivo_inasistencia = None
 
            if r.estado == "JUSTIFICADO":
                motivo_inasistencia = r.motivo_inasistencia or "Justificado"
            elif r.estado == "AUSENTE":
                motivo_inasistencia = r.motivo_inasistencia or None
 
            from django.utils import timezone
            AsistenciaAudiencia.objects.create(
                id_audiencia        = audiencia,
                id_persona          = persona,
                rol_en_audiencia    = r.rol_en_audiencia,
                asistio             = asistio,
                hora_ingreso        = timezone.now() if asistio else None,
                motivo_inasistencia = motivo_inasistencia,
            )
            creados += 1
 
        return ResultadoBatchAsistenciaType(
            ok=True,
            mensaje=f"Asistencia registrada para {creados} persona(s).",
            registros=creados,
        )

class CrearDenuncia(graphene.Mutation):
    class Arguments:
        input = CrearDenunciaInput(required=True)
    
    denuncia = graphene.Field(DenunciaType)
    
    def mutate(root, info, input):
        denuncia = Denuncia(
            numero_denuncia=input.numero_denuncia,
            denunciante_id=input.id_denunciante,
            denunciado_id=input.id_denunciado,
            tipo_denunciado=input.tipo_denunciado,
            descripcion=input.descripcion,
            expediente_id=input.get('id_expediente', None)
        )
        denuncia.save()
        return CrearDenuncia(denuncia=denuncia)


class ActualizarDenuncia(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
        input = ActualizarDenunciaInput(required=True)
    
    denuncia = graphene.Field(DenunciaType)
    
    def mutate(root, info, id, input):
        try:
            denuncia = Denuncia.objects.get(id=id)
        except Denuncia.DoesNotExist:
            raise Exception("Denuncia no encontrada")
        
        if input.get('estado'):
            denuncia.estado = input.estado
        if input.get('resolucion'):
            denuncia.resolucion = input.resolucion
        if input.get('fecha_resolucion'):
            denuncia.fecha_resolucion = input.fecha_resolucion
        if input.get('tipo_denunciado'):      # ← agregar
            denuncia.tipo_denunciado = input.tipo_denunciado
        if input.get('descripcion'):          # ← agregar
            denuncia.descripcion = input.descripcion
        
        denuncia.save()
        return ActualizarDenuncia(denuncia=denuncia)

class EliminarDenuncia(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
    
    ok = graphene.Boolean()
    mensaje = graphene.String()
    
    def mutate(root, info, id):
        try:
            denuncia = Denuncia.objects.get(id=id)
            denuncia.delete()
            return EliminarDenuncia(ok=True, mensaje="Denuncia eliminada")
        except Denuncia.DoesNotExist:
            return EliminarDenuncia(ok=False, mensaje="Denuncia no encontrada")


class CrearResolucionAntigua(graphene.Mutation):
    class Arguments:
        input = CrearResolucionAntiguaInput(required=True)
    
    resolucion_antigua = graphene.Field(ResolucionAntiguaType)
    
    def mutate(root, info, input):
        resolucion = ResolucionAntigua(
            numero_resolucion=input.numero_resolucion,
            fecha_resolucion=input.fecha_resolucion,
            persona_denunciante_id=input.get('id_persona_denunciante', None),
            persona_denunciada_id=input.id_persona_denunciada,
            tipo_sancion=input.tipo_sancion,
            descripcion=input.get('descripcion', None),
            sancion=input.get('sancion', None),
            documento_url=input.get('documento_url', None)
        )
        resolucion.save()
        return CrearResolucionAntigua(resolucion_antigua=resolucion)


class ActualizarResolucionAntigua(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
        input = ActualizarResolucionAntiguaInput(required=True)
    
    resolucion_antigua = graphene.Field(ResolucionAntiguaType)
    
    def mutate(root, info, id, input):
        try:
            resolucion = ResolucionAntigua.objects.get(id_resolucion_antigua=id)
        except ResolucionAntigua.DoesNotExist:
            raise Exception("Resolución no encontrada")
        
        if input.get('numero_resolucion'):
            resolucion.numero_resolucion = input.numero_resolucion
        if input.get('fecha_resolucion'):
            resolucion.fecha_resolucion = input.fecha_resolucion
        if input.get('id_persona_denunciante') is not None:
            resolucion.persona_denunciante_id = input.id_persona_denunciante
        if input.get('id_persona_denunciada'):
            resolucion.persona_denunciada_id = input.id_persona_denunciada
        if input.get('tipo_sancion'):
            resolucion.tipo_sancion = input.tipo_sancion
        if input.get('descripcion'):
            resolucion.descripcion = input.descripcion
        if input.get('sancion'):
            resolucion.sancion = input.sancion
        if input.get('documento_url'):
            resolucion.documento_url = input.documento_url
        
        resolucion.save()
        return ActualizarResolucionAntigua(resolucion_antigua=resolucion)


class EliminarResolucionAntigua(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
    
    ok = graphene.Boolean()
    mensaje = graphene.String()
    
    def mutate(root, info, id):
        try:
            resolucion = ResolucionAntigua.objects.get(id_resolucion_antigua=id)
            resolucion.delete()
            return EliminarResolucionAntigua(ok=True, mensaje="Resolución eliminada")
        except ResolucionAntigua.DoesNotExist:
            return EliminarResolucionAntigua(ok=False, mensaje="Resolución no encontrada")


# ============================================================
# MUTATION PRINCIPAL
# ============================================================

class Mutation(graphene.ObjectType):
    # Usuario
    crear_usuario      = CrearUsuario.Field()
    actualizar_usuario = ActualizarUsuario.Field()
    eliminar_usuario   = EliminarUsuario.Field()
    # Rol
    crear_rol      = CrearRol.Field()
    actualizar_rol = ActualizarRol.Field()
    eliminar_rol   = EliminarRol.Field()
    # Permiso
    crear_permiso          = CrearPermiso.Field()
    actualizar_permiso     = ActualizarPermiso.Field()
    eliminar_permiso       = EliminarPermiso.Field()
    asignar_permiso_a_rol  = AsignarPermisoARol.Field()
    remover_permiso_de_rol = RemoverPermisoDeRol.Field()
    # Tribunal
    crear_tribunal      = CrearTribunal.Field()
    actualizar_tribunal = ActualizarTribunal.Field()
    eliminar_tribunal   = EliminarTribunal.Field()
    # Persona
    crear_persona      = CrearPersona.Field()
    actualizar_persona = ActualizarPersona.Field()
    eliminar_persona   = EliminarPersona.Field()
    # Tipo Proceso
    crear_tipo_proceso      = CrearTipoProceso.Field()
    actualizar_tipo_proceso = ActualizarTipoProceso.Field()
    eliminar_tipo_proceso   = EliminarTipoProceso.Field()
    # Sala Tribunal
    crear_sala_tribunal      = CrearSalaTribunal.Field()
    actualizar_sala_tribunal = ActualizarSalaTribunal.Field()
    eliminar_sala_tribunal   = EliminarSalaTribunal.Field()
    # Sala Audiencia
    crear_sala_audiencia      = CrearSalaAudiencia.Field()
    actualizar_sala_audiencia = ActualizarSalaAudiencia.Field()
    eliminar_sala_audiencia   = EliminarSalaAudiencia.Field()
    # Estado Expediente
    crear_estado_expediente      = CrearEstadoExpediente.Field()
    actualizar_estado_expediente = ActualizarEstadoExpediente.Field()
    eliminar_estado_expediente   = EliminarEstadoExpediente.Field()
    # Expediente
    crear_expediente      = CrearExpediente.Field()
    actualizar_expediente = ActualizarExpediente.Field()
    eliminar_expediente   = EliminarExpediente.Field()
    # Tipo Audiencia
    crear_tipo_audiencia    = CrearTipoAudiencia.Field()
    eliminar_tipo_audiencia = EliminarTipoAudiencia.Field()
    # Audiencia
    crear_audiencia      = CrearAudiencia.Field()
    actualizar_audiencia = ActualizarAudiencia.Field()
    eliminar_audiencia   = EliminarAudiencia.Field()
    # Resolucion
    crear_resolucion      = CrearResolucion.Field()
    actualizar_resolucion = ActualizarResolucion.Field()
    eliminar_resolucion   = EliminarResolucion.Field()
    # Documento
    crear_documento      = CrearDocumento.Field()
    actualizar_documento = ActualizarDocumento.Field()
    eliminar_documento   = EliminarDocumento.Field()
    # Tipo Doc
    crear_tipo_doc      = CrearTipoDoc.Field()
    actualizar_tipo_doc = ActualizarTipoDoc.Field()
    eliminar_tipo_doc   = EliminarTipoDoc.Field()
    # Tipo Recurso
    crear_tipo_recurso      = CrearTipoRecurso.Field()
    actualizar_tipo_recurso = ActualizarTipoRecurso.Field()
    eliminar_tipo_recurso   = EliminarTipoRecurso.Field()
    # Tipo Resolucion
    crear_tipo_resolucion      = CrearTipoResolucion.Field()
    actualizar_tipo_resolucion = ActualizarTipoResolucion.Field()
    eliminar_tipo_resolucion   = EliminarTipoResolucion.Field()
    # Rol Procesal
    crear_rol_procesal      = CrearRolProcesal.Field()
    actualizar_rol_procesal = ActualizarRolProcesal.Field()
    eliminar_rol_procesal   = EliminarRolProcesal.Field()
    # Parte Procesal
    crear_parte_procesal      = CrearParteProcesal.Field()
    actualizar_parte_procesal = ActualizarParteProcesal.Field()
    eliminar_parte_procesal   = EliminarParteProcesal.Field()
    # Tipo Actuacion
    crear_tipo_actuacion      = CrearTipoActuacion.Field()
    actualizar_tipo_actuacion = ActualizarTipoActuacion.Field()
    eliminar_tipo_actuacion   = EliminarTipoActuacion.Field()
    # Actuacion Procesal
    crear_actuacion_procesal      = CrearActuacionProcesal.Field()
    actualizar_actuacion_procesal = ActualizarActuacionProcesal.Field()
    eliminar_actuacion_procesal   = EliminarActuacionProcesal.Field()
    # Recurso
    crear_recurso      = CrearRecurso.Field()
    actualizar_recurso = ActualizarRecurso.Field()
    eliminar_recurso   = EliminarRecurso.Field()
    # Notificacion
    crear_notificacion      = CrearNotificacion.Field()
    actualizar_notificacion = ActualizarNotificacion.Field()
    eliminar_notificacion   = EliminarNotificacion.Field()
    # Asistencia
    registrar_asistencia  = RegistrarAsistencia.Field()
    actualizar_asistencia = ActualizarAsistencia.Field()
    eliminar_asistencia   = EliminarAsistencia.Field()
    # Vocal
    crear_vocal      = CrearVocalTribunal.Field()
    actualizar_vocal = ActualizarVocal.Field()
    eliminar_vocal   = EliminarVocal.Field()
    # Contacto
    crear_contacto      = CrearContacto.Field()
    actualizar_contacto = ActualizarContacto.Field()
    eliminar_contacto   = EliminarContacto.Field()
    # Conformacion
    crear_conformacion      = CrearConformacion.Field()
    actualizar_conformacion = ActualizarConformacion.Field()
    eliminar_conformacion   = EliminarConformacion.Field()
    # Historial
    crear_historial_estado    = CrearHistorialEstado.Field()
    eliminar_historial_estado = EliminarHistorialEstado.Field()
    # Acta
    crear_acta      = CrearActa.Field()
    actualizar_acta = ActualizarActa.Field()
    eliminar_acta   = EliminarActa.Field()
    # Solicitud
    crear_solicitud    = CrearSolicitud.Field()
    eliminar_solicitud = EliminarSolicitud.Field()
    actualizar_solicitud = ActualizarSolicitud.Field()
    # Login OTP
    validate_user = ValidateUser.Field()
    verify_otp    = VerifyOtp.Field()
    obtener_qr    = ObtenerQr.Field()
    regenerar_qr  = RegenerarQr.Field()
    enviar_reportes_por_email = EnviarReportesPorEmail.Field()
    enviar_citaciones_audiencia = EnviarCitacionesAudiencia.Field()
    enviar_certificado_no_hallado = EnviarCertificadoNoHallado.Field()
    registrar_asistencia  = RegistrarAsistencia.Field()
    registrar_asistencia_batch = RegistrarAsistenciaBatch.Field()

    # DENUNCIAS
    crear_denuncia = CrearDenuncia.Field()
    actualizar_denuncia = ActualizarDenuncia.Field()
    eliminar_denuncia = EliminarDenuncia.Field()
    
    # RESOLUCIONES ANTIGUAS
    crear_resolucion_antigua = CrearResolucionAntigua.Field()
    actualizar_resolucion_antigua = ActualizarResolucionAntigua.Field()
    eliminar_resolucion_antigua = EliminarResolucionAntigua.Field()


schema = graphene.Schema(query=Query, mutation=Mutation)
