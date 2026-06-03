import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from tribunal.models import Documento
from django.conf import settings

for d in Documento.objects.all():
    ruta = os.path.join(settings.MEDIA_ROOT, d.ruta_archivo.lstrip('/\\'))
    existe = os.path.exists(ruta)
    print(f'{d.id_documento} | {d.titulo[:30]} | {d.ruta_archivo[:50]} | {"OK" if existe else "NO EXISTE"}')