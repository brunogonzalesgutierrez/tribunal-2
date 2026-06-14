# ============================================================
# REEMPLAZO de la clase EnviarCitacionesAudiencia
# Formato: "NOTIFICACION y/o CITACION" - Tribunal de Justicia
# Universitaria de Primera Instancia - U.A.G.R.M.
# ============================================================
#
# PASOS PARA INTEGRAR:
#
# 1) Copia los archivos "escudo_uagrm.png" y "escudo_tribunal.png"
#    dentro de tu proyecto Django, por ejemplo en:
#       <BASE_DIR>/static/img/escudo_uagrm.png
#       <BASE_DIR>/static/img/escudo_tribunal.png
#
#    (BASE_DIR es la carpeta raíz de tu proyecto, la misma que
#     usas en settings.py)
#
# 2) Agrega estos imports junto a los demás imports de schema.py
#    (al inicio del archivo, una sola vez):
#
#       import os
#       from email.mime.image import MIMEImage
#
# 3) Ajusta SECRETARIO_NOMBRE y SECRETARIO_CARGO con los datos
#    de quien certifica/firma la notificación.
#
# 4) Reemplaza toda la clase EnviarCitacionesAudiencia (y el
#    bloque de constantes de abajo) por el contenido de este
#    archivo en tu schema.py.
#
# ============================================================


# ── Constantes de configuración (poner cerca del inicio de schema.py) ──────

MESES_ES = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]

# Datos de quien certifica la notificación (firma del documento)
SECRETARIO_NOMBRE = "Fátima Aguirre Avalos"
SECRETARIO_CARGO  = "Sria. al Tribunal de 1ra Instancia"

# Rutas de los escudos institucionales
LOGO_UAGRM_PATH    = os.path.join(django_settings.BASE_DIR, "static", "img", "escudo_uagrm.png")
LOGO_TRIBUNAL_PATH = os.path.join(django_settings.BASE_DIR, "static", "img", "escudo_tribunal.png")


# ── Mutación ─────────────────────────────────────────────────────────────

class EnviarCitacionesAudiencia(graphene.Mutation):
    """
    Envía un correo de NOTIFICACIÓN y/o CITACIÓN con el formato oficial
    del Tribunal de Justicia Universitaria (U.A.G.R.M.) a cada parte
    procesal activa del expediente al que pertenece la audiencia.
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
        tribunal     = expediente.id_sala.id_tribunal.nombre_tribunal if expediente.id_sala else "Tribunal de Justicia Universitaria"
        link         = audiencia.link_videoconferencia or ""

        # Fecha/hora de la audiencia citada
        from django.utils.timezone import localtime
        fecha_local = localtime(audiencia.fecha_hora_programada)
        fecha_str = f"{fecha_local.day} de {MESES_ES[fecha_local.month - 1]} de {fecha_local.year}"
        hora_str  = fecha_local.strftime("%H:%M")

        # Fecha/hora de la notificación (ahora) -> formato del documento físico
        ahora_local = localtime(timezone.now())
        hora_notif  = ahora_local.strftime("%H:%M")
        dia_notif   = ahora_local.day
        mes_notif   = MESES_ES[ahora_local.month - 1]
        anio_notif  = ahora_local.year

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

        # 3. Cargar los escudos institucionales una sola vez
        logo_uagrm_bytes = None
        logo_tribunal_bytes = None
        try:
            with open(LOGO_UAGRM_PATH, "rb") as f:
                logo_uagrm_bytes = f.read()
            with open(LOGO_TRIBUNAL_PATH, "rb") as f:
                logo_tribunal_bytes = f.read()
        except (FileNotFoundError, OSError):
            # Si no se encuentran los archivos, el correo se envía sin escudos
            pass

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

            # Buscar email principal; si no hay, cualquier EMAIL
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

            # ── Item "Con lo siguiente" ─────────────────────────────────
            item_audiencia = (
                f"{tipo_aud} correspondiente al Expediente N° "
                f"{expediente.numero_expediente}/{expediente.ano}, "
                f"programada para el {fecha_str} a las {hora_str} hrs., "
                f"en la {sala_nombre} del {tribunal}."
            )

            item_link_html  = ""
            item_link_texto = ""
            if link:
                item_link_html = (
                    f'<p style="margin:6px 0 0;font-weight:bold;">2.- Enlace de '
                    f'videoconferencia: <a href="{link}" style="color:#1d4ed8;">{link}</a></p>'
                )
                item_link_texto = f"\n2.- Enlace de videoconferencia: {link}"

            # ── Asunto ───────────────────────────────────────────────────
            asunto = (
                f"NOTIFICACIÓN Y/O CITACIÓN — Exp. {expediente.numero_expediente}/"
                f"{expediente.ano} — {tipo_aud}"
            )

            # ── Versión texto plano ─────────────────────────────────────
            cuerpo = f"""TRIBUNAL DE JUSTICIA UNIVERSITARIA DE PRIMERA INSTANCIA
UNIVERSIDAD AUTÓNOMA "GABRIEL RENÉ MORENO"

NOTIFICACIÓN y/o CITACIÓN

Expediente Nro. {expediente.numero_expediente}/{expediente.ano}

En la ciudad de Santa Cruz a horas {hora_notif} del día {dia_notif} del mes de {mes_notif} del año {anio_notif}.

Notifiqué y/o Cité a:
{nombre_completo} — en calidad de {rol}.

Lugar:
Notificación electrónica enviada al correo {email_destino}.

Con lo siguiente:
1.- {item_audiencia}{item_link_texto}

Quien informado de su tenor se dio por: NOTIFICADO(A)

Recibiendo copia de ley y dándose por notificado(a) mediante la presente comunicación electrónica.

Certifico. -

Abg. {SECRETARIO_NOMBRE}
{SECRETARIO_CARGO}
Tribunal de Justicia Universitaria
U.A.G.R.M.

Este mensaje fue generado automáticamente por el Sistema de Gestión Judicial. Por favor no responda a este correo electrónico.
"""

            # ── Versión HTML (formato del documento oficial) ────────────
            html_cuerpo = f"""
            <!DOCTYPE html>
            <html lang="es">
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
              <tr><td align="center">
              <table width="650" cellpadding="0" cellspacing="0"
                     style="background:#ffffff;border:1px solid #d1d5db;border-radius:4px;">
                <tr><td style="padding:32px 40px;">

                  <!-- Encabezado con escudos -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="90" style="vertical-align:middle;">
                        {f'<img src="cid:logo_uagrm" width="80" height="80" style="display:block;" alt="UAGRM"/>' if logo_uagrm_bytes else ''}
                      </td>
                      <td style="text-align:center;vertical-align:middle;padding:0 8px;">
                        <p style="margin:0;font-size:13px;font-weight:bold;color:#111827;line-height:1.45;">
                          UNIVERSIDAD AUTÓNOMA "GABRIEL RENÉ MORENO"<br/>
                          TRIBUNAL DE JUSTICIA UNIVERSITARIA<br/>
                          DE PRIMERA INSTANCIA
                        </p>
                      </td>
                      <td width="90" style="vertical-align:middle;text-align:right;">
                        {f'<img src="cid:logo_tribunal" width="75" height="80" style="display:block;margin-left:auto;" alt="Tribunal de Justicia Universitaria"/>' if logo_tribunal_bytes else ''}
                      </td>
                    </tr>
                  </table>

                  <!-- Título -->
                  <p style="margin:26px 0 0;text-align:center;font-size:15px;font-weight:bold;
                            color:#111827;letter-spacing:0.5px;">
                    NOTIFICACIÓN y/o CITACIÓN
                  </p>

                  <!-- Cuerpo -->
                  <div style="margin-top:24px;font-size:13.5px;color:#1f2937;line-height:1.9;">

                    <p style="margin:0 0 14px;">
                      Expediente Nro. <strong>{expediente.numero_expediente}/{expediente.ano}</strong>
                    </p>

                    <p style="margin:0 0 14px;">
                      En la ciudad de Santa Cruz a horas <strong>{hora_notif}</strong> del día
                      <strong>{dia_notif}</strong> del mes de <strong>{mes_notif}</strong> del año
                      <strong>{anio_notif}</strong>.
                    </p>

                    <p style="margin:0 0 4px;"><strong>Notifiqué y/o Cité a:</strong></p>
                    <p style="margin:0 0 14px;">{nombre_completo} — en calidad de <strong>{rol}</strong>.</p>

                    <p style="margin:0 0 4px;"><strong>Lugar:</strong></p>
                    <p style="margin:0 0 14px;">
                      Notificación electrónica enviada al correo <strong>{email_destino}</strong>.
                    </p>

                    <p style="margin:0 0 4px;">Con lo siguiente:</p>
                    <p style="margin:0;font-weight:bold;">1.- {item_audiencia}</p>
                    {item_link_html}

                    <p style="margin:18px 0 4px;font-weight:bold;">
                      Quien informado de su tenor se dio por: NOTIFICADO(A)
                    </p>

                    <p style="margin:0 0 14px;">
                      Recibiendo copia de ley y dándose por notificado(a) mediante la presente
                      comunicación electrónica.
                    </p>

                    <p style="margin:0 0 26px;">Certifico. -</p>

                    <p style="margin:0;font-size:13px;color:#1f2937;line-height:1.6;">
                      <strong>Abg. {SECRETARIO_NOMBRE}</strong><br/>
                      {SECRETARIO_CARGO}<br/>
                      Tribunal de Justicia Universitaria<br/>
                      U.A.G.R.M.
                    </p>
                  </div>

                  <!-- Pie -->
                  <p style="margin:28px 0 0;padding-top:16px;border-top:1px solid #e5e7eb;
                            font-size:11px;color:#9ca3af;">
                    Este mensaje fue generado automáticamente por el Sistema de Gestión Judicial.
                    Por favor no responda a este correo electrónico.
                  </p>

                </td></tr>
              </table>
              </td></tr>
            </table>
            </body>
            </html>
            """

            # 5. Enviar
            try:
                msg = EmailMultiAlternatives(
                    subject=asunto,
                    body=cuerpo,
                    from_email=django_settings.DEFAULT_FROM_EMAIL,
                    to=[email_destino],
                )
                msg.attach_alternative(html_cuerpo, "text/html")

                if logo_uagrm_bytes or logo_tribunal_bytes:
                    msg.mixed_subtype = "related"
                    if logo_uagrm_bytes:
                        img1 = MIMEImage(logo_uagrm_bytes)
                        img1.add_header("Content-ID", "<logo_uagrm>")
                        img1.add_header("Content-Disposition", "inline", filename="escudo_uagrm.png")
                        msg.attach(img1)
                    if logo_tribunal_bytes:
                        img2 = MIMEImage(logo_tribunal_bytes)
                        img2.add_header("Content-ID", "<logo_tribunal>")
                        img2.add_header("Content-Disposition", "inline", filename="escudo_tribunal.png")
                        msg.attach(img2)

                msg.send(fail_silently=False)
                enviados += 1
                destinatarios.append(f"{nombre_completo} <{email_destino}>")
            except Exception:
                fallidos += 1

        # 6. Resultado
        if enviados == 0 and fallidos == 0 and sin_email:
            return ResultadoCitacionType(
                ok=False,
                mensaje="Ninguna parte tiene email registrado en el sistema.",
                enviados=0, fallidos=0,
                sin_email=sin_email, destinatarios=[],
            )

        mensaje = f"Notificaciones/Citaciones enviadas: {enviados}."
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
