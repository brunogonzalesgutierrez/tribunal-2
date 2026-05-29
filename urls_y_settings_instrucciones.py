# ============================================================
# PASO 1 — Agregar en config/urls.py
# ============================================================

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from graphene_django.views import GraphQLView
from tribunal.views import subir_documento, descargar_documento  # ← importar

urlpatterns = [
    path('admin/', admin.site.urls),
    path('graphql/', GraphQLView.as_view(graphiql=True)),

    # ← Agregar estas dos rutas nuevas
    path('api/subir-documento/', subir_documento),
    path('api/documento/<int:id_documento>/descargar/', descargar_documento),
]

# Servir archivos media en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


# ============================================================
# PASO 2 — Agregar en config/settings.py (al final)
# ============================================================

import os

MEDIA_URL  = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Los archivos de documentos se guardarán en:
# media/documentos/<numero_expediente>/<nombre_archivo>.pdf


# ============================================================
# PASO 3 — Crear la carpeta media (en la raíz del proyecto)
# ============================================================
# mkdir media
# (Django la crea automáticamente al subir el primer archivo,
#  pero es buena práctica crearla manualmente)


# ============================================================
# PASO 4 — Agregar media/ al .gitignore
# ============================================================
# media/
