# ============================================================
# tribunal/views.py
# Agregar este endpoint a tu Django para subir archivos PDF
# ============================================================
# En urls.py agrega:
#   from tribunal.views import subir_documento
#   path('api/subir-documento/', subir_documento),
# ============================================================

import os
import hashlib
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
from .models import Documento, Expediente, TipoDoc


@csrf_exempt
@require_POST
def subir_documento(request):
    """
    POST /api/subir-documento/
    Form-data:
      - archivo     : File (PDF)
      - titulo      : str
      - idExpediente: int
      - idTipoDoc   : int
      - numeroFolio : int (opcional)
    Returns:
      { ok: bool, idDocumento: int, rutaArchivo: str, tamanoKb: int, mensaje: str }
    """
    try:
        archivo = request.FILES.get("archivo")
        titulo       = request.POST.get("titulo", "").strip()
        id_expediente = request.POST.get("idExpediente")
        id_tipo_doc   = request.POST.get("idTipoDoc")
        numero_folio  = request.POST.get("numeroFolio")

        # ── Validaciones básicas ──────────────────────────────
        if not archivo:
            return JsonResponse({"ok": False, "mensaje": "No se recibió ningún archivo."}, status=400)
        if not titulo:
            return JsonResponse({"ok": False, "mensaje": "El título es obligatorio."}, status=400)
        if not id_expediente or not id_tipo_doc:
            return JsonResponse({"ok": False, "mensaje": "Expediente y tipo de documento son obligatorios."}, status=400)

        # ── Validar tipo de archivo ───────────────────────────
        if not archivo.name.lower().endswith(".pdf"):
            return JsonResponse({"ok": False, "mensaje": "Solo se permiten archivos PDF."}, status=400)

        # ── Límite de tamaño: 10 MB ───────────────────────────
        MAX_SIZE = 10 * 1024 * 1024  # 10 MB
        if archivo.size > MAX_SIZE:
            return JsonResponse({"ok": False, "mensaje": "El archivo supera el límite de 10 MB."}, status=400)

        # ── Buscar modelos relacionados ───────────────────────
        try:
            expediente = Expediente.objects.get(id_expediente=int(id_expediente))
        except Expediente.DoesNotExist:
            return JsonResponse({"ok": False, "mensaje": "Expediente no encontrado."}, status=404)

        try:
            tipo_doc = TipoDoc.objects.get(id_tipo_doc=int(id_tipo_doc))
        except TipoDoc.DoesNotExist:
            return JsonResponse({"ok": False, "mensaje": "Tipo de documento no encontrado."}, status=404)

        # ── Calcular hash SHA-256 para integridad ─────────────
        contenido = archivo.read()
        hash_sha256 = hashlib.sha256(contenido).hexdigest()
        archivo.seek(0)  # Rebobinar para poder guardarlo

        # ── Generar nombre único para el archivo ──────────────
        import uuid
        nombre_limpio = titulo.replace(" ", "_").lower()[:40]
        extension = ".pdf"
        nombre_archivo = f"{nombre_limpio}_{uuid.uuid4().hex[:8]}{extension}"
        ruta_relativa = f"documentos/{expediente.numero_expediente}/{nombre_archivo}"

        # ── Guardar el archivo en disco ───────────────────────
        ruta_guardada = default_storage.save(
            ruta_relativa,
            ContentFile(contenido)
        )

        tamano_kb = archivo.size // 1024

        # ── Crear el registro en la base de datos ─────────────
        doc = Documento.objects.create(
            id_expediente=expediente,
            id_tipo_doc=tipo_doc,
            titulo=titulo,
            ruta_archivo=ruta_guardada,
            tamano_kb=tamano_kb,
            numero_folio=int(numero_folio) if numero_folio else None,
            hash_integridad=hash_sha256,
            es_electronico=True,
            firmado_digitalmente=False,
        )

        return JsonResponse({
            "ok": True,
            "idDocumento": doc.id_documento,
            "rutaArchivo": ruta_guardada,
            "tamanoKb": tamano_kb,
            "hashIntegridad": hash_sha256,
            "mensaje": f"Archivo '{titulo}' subido correctamente.",
        })

    except Exception as e:
        return JsonResponse({"ok": False, "mensaje": f"Error interno: {str(e)}"}, status=500)


@csrf_exempt
def descargar_documento(request, id_documento):
    """
    GET /api/documento/<id>/descargar/
    Devuelve el PDF como respuesta para descarga o visualización.
    """
    from django.http import FileResponse, Http404
    try:
        doc = Documento.objects.get(id_documento=id_documento)
        if not doc.ruta_archivo:
            raise Http404("Este documento no tiene archivo adjunto.")

        ruta_completa = os.path.join(settings.MEDIA_ROOT, doc.ruta_archivo)
        if not os.path.exists(ruta_completa):
            raise Http404("El archivo no existe en el servidor.")

        response = FileResponse(
            open(ruta_completa, "rb"),
            content_type="application/pdf",
        )
        response["Content-Disposition"] = f'inline; filename="{os.path.basename(doc.ruta_archivo)}"'
        return response

    except Documento.DoesNotExist:
        raise Http404("Documento no encontrado.")
