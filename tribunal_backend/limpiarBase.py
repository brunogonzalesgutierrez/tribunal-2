from django.core.management.base import BaseCommand
from django.apps import apps

class Command(BaseCommand):
    help = 'Resetea las tablas de la app tribunal'

    def handle(self, *args, **options):
        self.stdout.write("🧹 Limpiando base de datos...")
        
        app_config = apps.get_app_config('tribunal')
        
        for model in app_config.get_models():
            try:
                count = model.objects.all().delete()
                self.stdout.write(f"  ✅ Limpiado: {model.__name__} ({count[0]} registros)")
            except Exception as e:
                self.stdout.write(f"  ⚠️ Error en {model.__name__}: {e}")
        
        self.stdout.write("✅ Base de datos limpiada exitosamente")