# ============================================================
# AGREGAR AL FINAL DE schema.py  (antes del schema = graphene.Schema)
# ============================================================
# Dependencias necesarias:
#   pip install reportlab
# En settings.py configura:
#   EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
#   EMAIL_HOST = 'smtp.gmail.com'
#   EMAIL_PORT = 587
#   EMAIL_USE_TLS = True
#   EMAIL_HOST_USER = 'tu_email@gmail.com'
#   EMAIL_HOST_PASSWORD = 'tu_app_password'
#   DEFAULT_FROM_EMAIL = 'Tribunal Sistema <tu_email@gmail.com>'
# ============================================================

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

def generar_pdf_reporte(anio: int, destinatario_rol: str) -> bytes:
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
    story.append(Paragraph("Sistema de Gestión Judicial", titulo_style))
    story.append(Paragraph(f"Reporte Anual {anio} · {destinatario_rol}", subtitulo_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=AZUL, spaceAfter=14))

    from datetime import date
    story.append(Paragraph(
        f"Generado el {date.today().strftime('%d/%m/%Y')}  |  Año fiscal: {anio}",
        ParagraphStyle("meta", parent=normal, fontSize=8,
                       textColor=colors.HexColor("#9ca3af"), spaceAfter=20),
    ))

    # ══════════════════════════════════════════════════════
    # SECCIÓN 1 — AUDIENCIAS (todos los roles)
    # ══════════════════════════════════════════════════════
    story.append(Paragraph("1. Audiencias por Estado", seccion_style))

    aud_qs = Audiencia.objects.filter(fecha_hora_programada__year=anio)
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
            Expediente.objects.filter(fecha_ingreso__year=anio)
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
            Expediente.objects.filter(fecha_ingreso__year=anio)
            .exclude(id_estado_expediente=None)
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
            aud_c = Audiencia.objects.filter(
                id_sala_aud__id_tribunal=sala.id_tribunal,
                fecha_hora_programada__year=anio,
            ).count()
            exp_c = Expediente.objects.filter(
                id_sala=sala, fecha_ingreso__year=anio
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
            act_c = ActuacionProcesal.objects.filter(
                usuario=u, fecha_actuacion__year=anio
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

def _enviar_reporte_a_usuario(usuario, anio: int, pdf_bytes: bytes, rol_nombre: str):
    """Envía el email con el PDF adjunto a un único usuario."""
    nombre_completo = f"{usuario.paterno} {usuario.nombres}"
    asunto = f"Reporte Anual {anio} — Sistema Judicial"
    cuerpo = f"""Estimado/a {nombre_completo},

Se adjunta el reporte estadístico correspondiente al año {anio} del Sistema de Gestión Judicial.

Resumen del reporte:
  • Rol: {rol_nombre}
  • Cargo: {usuario.cargo_oficial or 'No especificado'}
  • Período: Enero — Diciembre {anio}

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

class EnviarReportesPorEmail(graphene.Mutation):
    """
    Genera un PDF de reporte y lo envía por email a todos los usuarios
    de los roles indicados (Administrador, Vocal, Secretario).

    Uso desde GraphQL:
        mutation {
          enviarReportesPorEmail(anio: 2024, roles: ["Administrador", "Secretario"]) {
            ok
            mensaje
            enviados
            fallidos
            destinatarios
          }
        }
    """
    class Arguments:
        anio  = graphene.Int(required=True,
                             description="Año del reporte (ej: 2024)")
        roles = graphene.List(
            graphene.String,
            description='Lista de roles a notificar: "Administrador", "Vocal", "Secretario"'
        )

    Output = EnvioReporteResultType

    def mutate(self, info, anio, roles=None):
        ROLES_VALIDOS = {"Administrador", "Vocal", "Secretario"}

        # Si no se especifican roles, enviar a todos los válidos
        roles_objetivo = [r for r in (roles or list(ROLES_VALIDOS)) if r in ROLES_VALIDOS]

        if not roles_objetivo:
            return EnvioReporteResultType(
                ok=False,
                mensaje="No se especificaron roles válidos. Use: Administrador, Vocal, Secretario.",
                enviados=0, fallidos=0, destinatarios=[],
            )

        enviados      = 0
        fallidos      = 0
        destinatarios = []
        errores       = []

        for rol_nombre in roles_objetivo:
            try:
                # Generar PDF específico para este rol
                pdf_bytes = generar_pdf_reporte(anio, rol_nombre)
            except Exception as e:
                errores.append(f"Error generando PDF para {rol_nombre}: {str(e)}")
                continue

            # Obtener usuarios activos de este rol
            usuarios = Usuario.objects.filter(
                rol__nombre=rol_nombre,
                activo=True,
            ).select_related("rol")

            for usuario in usuarios:
                if not usuario.email:
                    continue
                try:
                    _enviar_reporte_a_usuario(usuario, anio, pdf_bytes, rol_nombre)
                    enviados += 1
                    destinatarios.append(f"{usuario.paterno} {usuario.nombres} <{usuario.email}>")
                except Exception as e:
                    fallidos += 1
                    errores.append(f"Error enviando a {usuario.email}: {str(e)}")

        if enviados == 0 and fallidos == 0:
            return EnvioReporteResultType(
                ok=False,
                mensaje="No se encontraron usuarios activos con los roles indicados.",
                enviados=0, fallidos=0, destinatarios=[],
            )

        mensaje = f"Reporte {anio} enviado. Exitosos: {enviados}, Fallidos: {fallidos}."
        if errores:
            mensaje += f" Errores: {'; '.join(errores[:3])}"  # máximo 3 errores en el mensaje

        return EnvioReporteResultType(
            ok=fallidos == 0,
            mensaje=mensaje,
            enviados=enviados,
            fallidos=fallidos,
            destinatarios=destinatarios,
        )


# ────────────────────────────────────────────────────────────
# QUÉ AGREGAR EN class Mutation(graphene.ObjectType):
# ────────────────────────────────────────────────────────────
#
#   # Reportes por email
#   enviar_reportes_por_email = EnviarReportesPorEmail.Field()
#
# ────────────────────────────────────────────────────────────
