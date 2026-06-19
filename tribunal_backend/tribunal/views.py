# ============================================================
# tribunal/views.py
# ============================================================
# En urls.py:
#   from tribunal.views import subir_documento, descargar_documento, obtener_logo
#   path('api/subir-documento/',          subir_documento),
#   path('api/documento/<int:id_documento>/descargar/', descargar_documento),
#   path('api/logo/<str:nombre>/',         obtener_logo),
# ============================================================

import os
import hashlib
from django.http import JsonResponse, FileResponse, Http404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
from .models import Documento, Expediente, TipoDoc, Persona


# ── Valores permitidos para tipo_presentacion (Art. 65) ──────────────────────
TIPOS_PRESENTACION_VALIDOS = {
    "ORIGINAL",
    "COPIA_LEGALIZADA",
    "COPIA_SIMPLE",
    "DIGITAL",
}


@csrf_exempt
@require_POST
def subir_documento(request):
    """
    POST /api/subir-documento/
    Form-data:
      - archivo          : File (PDF, opcional si es solo registro)
      - titulo           : str
      - idExpediente     : int
      - idTipoDoc        : int
      - numeroFolio      : int  (obligatorio — Art. 9)
      - tipoPresentacion : str  (ORIGINAL | COPIA_LEGALIZADA | COPIA_SIMPLE | DIGITAL — Art. 65)
      - idPersona        : int  (opcional — quién presenta el documento)
    Returns:
      { ok, idDocumento, rutaArchivo, tamanoKb, mensaje }
    """
    try:
        archivo           = request.FILES.get("archivo")
        titulo            = request.POST.get("titulo", "").strip()
        id_expediente     = request.POST.get("idExpediente")
        id_tipo_doc       = request.POST.get("idTipoDoc")
        numero_folio      = request.POST.get("numeroFolio")
        tipo_presentacion = request.POST.get("tipoPresentacion", "").strip().upper() or None
        id_persona        = request.POST.get("idPersona")

        # ── Validaciones obligatorias ─────────────────────────
        if not titulo:
            return JsonResponse({"ok": False, "mensaje": "El título es obligatorio."}, status=400)
        if not id_expediente or not id_tipo_doc:
            return JsonResponse({"ok": False, "mensaje": "Expediente y tipo de documento son obligatorios."}, status=400)
        if not numero_folio:
            return JsonResponse({"ok": False, "mensaje": "El número de folio es obligatorio (Art. 9 — foliado correlativo)."}, status=400)

        # ── Validar tipo_presentacion si viene ────────────────
        if tipo_presentacion and tipo_presentacion not in TIPOS_PRESENTACION_VALIDOS:
            return JsonResponse({
                "ok": False,
                "mensaje": f"Tipo de presentación inválido: '{tipo_presentacion}'. Use: ORIGINAL, COPIA_LEGALIZADA, COPIA_SIMPLE o DIGITAL."
            }, status=400)

        # ── Buscar modelos relacionados ───────────────────────
        try:
            expediente = Expediente.objects.get(id_expediente=int(id_expediente))
        except Expediente.DoesNotExist:
            return JsonResponse({"ok": False, "mensaje": "Expediente no encontrado."}, status=404)

        try:
            tipo_doc = TipoDoc.objects.get(id_tipo_doc=int(id_tipo_doc))
        except TipoDoc.DoesNotExist:
            return JsonResponse({"ok": False, "mensaje": "Tipo de documento no encontrado."}, status=404)

        persona = None
        if id_persona:
            try:
                persona = Persona.objects.get(id_persona=int(id_persona))
            except Persona.DoesNotExist:
                pass  # No es obligatorio; se registra sin persona

        # ── Procesar archivo si viene ─────────────────────────
        ruta_guardada = ""
        hash_sha256   = ""
        tamano_kb     = 0

        if archivo:
            if not archivo.name.lower().endswith(".pdf"):
                return JsonResponse({"ok": False, "mensaje": "Solo se permiten archivos PDF."}, status=400)

            MAX_SIZE = 10 * 1024 * 1024  # 10 MB
            if archivo.size > MAX_SIZE:
                return JsonResponse({"ok": False, "mensaje": "El archivo supera el límite de 10 MB."}, status=400)

            contenido   = archivo.read()
            hash_sha256 = hashlib.sha256(contenido).hexdigest()
            tamano_kb   = archivo.size // 1024

            import uuid
            nombre_limpio  = titulo.replace(" ", "_").lower()[:40]
            nombre_archivo = f"{nombre_limpio}_{uuid.uuid4().hex[:8]}.pdf"
            ruta_relativa  = f"documentos/{expediente.numero_expediente}/{nombre_archivo}"
            ruta_guardada  = default_storage.save(ruta_relativa, ContentFile(contenido))

        # ── Crear el registro en la BD ────────────────────────
        doc = Documento.objects.create(
            id_expediente     = expediente,
            id_tipo_doc       = tipo_doc,
            id_persona        = persona,
            titulo            = titulo,
            ruta_archivo      = ruta_guardada,
            tamano_kb         = tamano_kb,
            numero_folio      = int(numero_folio),
            hash_integridad   = hash_sha256,
            tipo_presentacion = tipo_presentacion,
            es_electronico    = False,
            firmado_digitalmente = False,
        )

        return JsonResponse({
            "ok":            True,
            "idDocumento":   doc.id_documento,
            "rutaArchivo":   ruta_guardada,
            "tamanoKb":      tamano_kb,
            "hashIntegridad": hash_sha256,
            "mensaje":       f"Documento '{titulo}' registrado correctamente.",
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({"ok": False, "mensaje": f"Error interno: {str(e)}"}, status=500)


@csrf_exempt
def descargar_documento(request, id_documento):
    """GET /api/documento/<id>/descargar/"""
    try:
        doc = Documento.objects.get(id_documento=id_documento)
        if not doc.ruta_archivo:
            raise Http404("Este documento no tiene archivo adjunto.")
        ruta_completa = os.path.join(settings.MEDIA_ROOT, doc.ruta_archivo)
        if not os.path.exists(ruta_completa):
            raise Http404("El archivo no existe en el servidor.")
        response = FileResponse(open(ruta_completa, "rb"), content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="{os.path.basename(doc.ruta_archivo)}"'
        return response
    except Documento.DoesNotExist:
        raise Http404("Documento no encontrado.")


@require_GET
def obtener_logo(request, nombre):
    """
    GET /api/logo/<nombre>/
    Devuelve el logo como base64 JSON para que el frontend lo incruste en PDFs.
    <nombre> puede ser: uagrm | tribunal
    """
    import base64

    LOGOS = {
        "uagrm":    "escudo_uagrm.png",
        "tribunal": "escudo_tribunal.png",
    }

    if nombre not in LOGOS:
        return JsonResponse({"ok": False, "mensaje": "Logo no encontrado."}, status=404)

    ruta = os.path.join(settings.BASE_DIR, "static", "img", LOGOS[nombre])
    if not os.path.exists(ruta):
        return JsonResponse({"ok": False, "mensaje": f"Archivo {LOGOS[nombre]} no encontrado en static/img/."}, status=404)

    with open(ruta, "rb") as f:
        datos = base64.b64encode(f.read()).decode("utf-8")

    return JsonResponse({
        "ok":      True,
        "nombre":  nombre,
        "base64":  datos,
        "dataUrl": f"data:image/png;base64,{datos}",
    })
