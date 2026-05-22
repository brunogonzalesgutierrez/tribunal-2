# ============================================================
# AGREGAR ESTO A TU schema.py
# ============================================================
# Necesitas este import al inicio (ya lo tienes):
# from django.db.models import Count

# ── 1. TYPES para los reportes ────────────────────────────

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


# ── 2. AGREGAR ESTOS CAMPOS A LA CLASE Query ─────────────
# (dentro de class Query(graphene.ObjectType): )

#   reporte_audiencias_por_estado = graphene.List(ReporteEstadoType, anio=graphene.Int())
#   reporte_audiencias_por_mes    = graphene.List(ReporteMesType,    anio=graphene.Int())
#   reporte_expedientes_por_tipo  = graphene.List(ReporteTipoType,   anio=graphene.Int())
#   reporte_expedientes_por_estado= graphene.List(ReporteEstadoType, anio=graphene.Int())
#   reporte_carga_por_sala        = graphene.List(ReporteCargaSalaType, anio=graphene.Int())
#   reporte_actividad_usuarios    = graphene.List(ReporteUsuarioType,   anio=graphene.Int())


# ── 3. RESOLVERS (agregar dentro de class Query) ──────────

    def resolve_reporte_audiencias_por_estado(root, info, anio=None):
        from django.db.models import Count
        qs = Audiencia.objects.all()
        if anio:
            qs = qs.filter(fecha_hora_programada__year=anio)
        return [
            ReporteEstadoType(estado=r['estado_audiencia'], cantidad=r['total'])
            for r in qs.values('estado_audiencia').annotate(total=Count('id_audiencia'))
        ]

    def resolve_reporte_audiencias_por_mes(root, info, anio=None):
        from django.db.models import Count
        from django.db.models.functions import ExtractMonth
        MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
        qs = Audiencia.objects.all()
        if anio:
            qs = qs.filter(fecha_hora_programada__year=anio)
        data = {
            r['mes']: r['total']
            for r in qs.annotate(mes=ExtractMonth('fecha_hora_programada'))
                       .values('mes').annotate(total=Count('id_audiencia'))
        }
        return [
            ReporteMesType(mes=MESES[m-1], cantidad=data.get(m, 0))
            for m in range(1, 13)
        ]

    def resolve_reporte_expedientes_por_tipo(root, info, anio=None):
        from django.db.models import Count
        qs = Expediente.objects.all()
        if anio:
            qs = qs.filter(fecha_ingreso__year=anio)
        return [
            ReporteTipoType(tipo=r['id_tipo_proceso__nombre'], cantidad=r['total'])
            for r in qs.values('id_tipo_proceso__nombre').annotate(total=Count('id_expediente'))
        ]

    def resolve_reporte_expedientes_por_estado(root, info, anio=None):
        from django.db.models import Count
        qs = Expediente.objects.exclude(id_estado_expediente=None)
        if anio:
            qs = qs.filter(fecha_ingreso__year=anio)
        return [
            ReporteEstadoType(estado=r['id_estado_expediente__nombre_estado'], cantidad=r['total'])
            for r in qs.values('id_estado_expediente__nombre_estado').annotate(total=Count('id_expediente'))
        ]

    def resolve_reporte_carga_por_sala(root, info, anio=None):
        from django.db.models import Count
        salas = SalaTribunal.objects.select_related('id_tribunal').filter(activa=True)
        resultado = []
        for sala in salas:
            aud_qs = Audiencia.objects.filter(id_sala_aud__id_tribunal=sala.id_tribunal)
            exp_qs = Expediente.objects.filter(id_sala=sala)
            if anio:
                aud_qs = aud_qs.filter(fecha_hora_programada__year=anio)
                exp_qs = exp_qs.filter(fecha_ingreso__year=anio)
            resultado.append(ReporteCargaSalaType(
                sala=sala.nombre_sala,
                tribunal=sala.id_tribunal.nombre_tribunal,
                audiencias=aud_qs.count(),
                expedientes=exp_qs.count(),
            ))
        return resultado

    def resolve_reporte_actividad_usuarios(root, info, anio=None):
        from django.db.models import Count
        usuarios = Usuario.objects.filter(activo=True).select_related('rol')
        resultado = []
        for u in usuarios:
            act_qs = ActuacionProcesal.objects.filter(usuario=u)
            doc_qs = Documento.objects.none()  # ajusta si hay relación usuario-documento
            if anio:
                act_qs = act_qs.filter(fecha_actuacion__year=anio)
            resultado.append(ReporteUsuarioType(
                usuario=f"{u.paterno} {u.nombres}",
                rol=u.rol.nombre,
                audiencias=0,  # audiencias no tienen usuario directo en tu modelo
                actuaciones=act_qs.count(),
                documentos=doc_qs.count(),
            ))
        return resultado
