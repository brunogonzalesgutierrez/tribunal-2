# limpiar_docs_falsos.py
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from tribunal.models import Documento
from django.conf import settings

eliminados = 0
for d in Documento.objects.all():
    ruta = os.path.join(settings.MEDIA_ROOT, d.ruta_archivo.lstrip('/\\'))
    if not os.path.exists(ruta):
        print(f'Eliminando: {d.id_documento} | {d.titulo}')
        d.delete()
        eliminados += 1

print(f'\nTotal eliminados: {eliminados}')