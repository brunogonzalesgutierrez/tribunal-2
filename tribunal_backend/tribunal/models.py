from django.db import models

# ============================================================
# TABLAS CATÁLOGO
# ============================================================


# ============================================================
# MÓDULO DE USUARIOS, ROLES Y PERMISOS (UN ROL POR USUARIO)
# ============================================================

class Permiso(models.Model):
    """Acciones específicas que se pueden realizar en el sistema"""
    id_permiso = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100, unique=True)  # "Ver expedientes"
    codigo = models.CharField(max_length=50, unique=True)   # "expediente.view"
    modulo = models.CharField(max_length=50)                # "expedientes", "usuarios", "reportes"
    descripcion = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'permiso'

    def __str__(self):
        return self.nombre


class Rol(models.Model):
    """Roles del sistema (Administrador, Juez, Secretario, etc.)"""
    id_rol = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(null=True, blank=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    sala_asignada = models.ForeignKey(
        'SalaTribunal', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        db_column='id_sala',
        related_name='roles_asignados'
    )
    class Meta:
        db_table = 'rol'

    def __str__(self):
        return self.nombre

class RolPermiso(models.Model):
    """Asigna permisos a roles (muchos a muchos)"""
    id_rol_permiso = models.AutoField(primary_key=True)
    rol = models.ForeignKey(Rol, on_delete=models.CASCADE, db_column='id_rol', related_name='permisos_asignados')
    permiso = models.ForeignKey(Permiso, on_delete=models.CASCADE, db_column='id_permiso', related_name='roles_asignados')
    fecha_asignacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'rol_permiso'
        unique_together = ['rol', 'permiso']  # Evita duplicados

    def __str__(self):
        return f"{self.rol.nombre} → {self.permiso.nombre}"


class Usuario(models.Model):
    """Usuarios del sistema (cada uno con UN rol)"""
    id_usuario = models.AutoField(primary_key=True)
    
    # Datos personales
    nombres = models.CharField(max_length=100)
    paterno = models.CharField(max_length=100)
    materno = models.CharField(max_length=100, blank=True, null=True)
    documento_identidad = models.CharField(max_length=20, unique=True)
    email = models.EmailField(unique=True)
    
    # Datos laborales
    cargo_oficial = models.CharField(max_length=100, blank=True, null=True)
    
    # Autenticación
    username = models.CharField(max_length=50, unique=True)
    password = models.CharField(max_length=255)  # Guardar hash
    activo = models.BooleanField(default=True)
    
    # Relación con rol ✅ (Un usuario tiene UN rol)
    rol = models.ForeignKey(Rol, on_delete=models.PROTECT, db_column='id_rol', related_name='usuarios')
    
    # Auditoría
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    ultimo_acceso = models.DateTimeField(null=True, blank=True)
    otp_secret = models.CharField(max_length=32, null=True, blank=True)

    class Meta:
        db_table = 'usuario'

    def __str__(self):
        return f"{self.nombres} {self.paterno} ({self.rol.nombre})"
    
    def tiene_permiso(self, permiso_codigo):
        """Verifica si el usuario tiene un permiso específico (por su rol)"""
        return self.rol.permisos_asignados.filter(permiso__codigo=permiso_codigo).exists()
    
class Tribunal(models.Model):
    id_tribunal = models.AutoField(primary_key=True)
    nombre_tribunal = models.CharField(max_length=200)
    instancia = models.CharField(max_length=100)
    norma_creacion = models.TextField()

    class Meta:
        db_table = 'tribunal'

    def __str__(self):
        return self.nombre_tribunal


class EstadoExpediente(models.Model):
    id_estado = models.AutoField(primary_key=True)
    nombre_estado = models.CharField(max_length=100)
    es_terminal = models.BooleanField(default=False)
    nivel = models.IntegerField(default=0, help_text="Nivel jerárquico del estado (0=inicial, 1,2,3...)")

    class Meta:
        db_table = 'estado_expediente'
        ordering = ['nivel']  

    def __str__(self):
        return self.nombre_estado

class TipoProceso(models.Model):
    id_tipo_proceso = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    codigo = models.CharField(max_length=50)

    class Meta:
        db_table = 'tipo_proceso'

    def __str__(self):
        return self.nombre


class TipoAudiencia(models.Model):
    id_tipo_audiencia = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    duracion_estimada = models.IntegerField()
    id_tipo_proceso = models.ForeignKey(TipoProceso, on_delete=models.CASCADE, db_column='id_tipo_proceso', related_name='tipos_audiencia')
    descripcion = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'tipo_audiencia'

    def __str__(self):
        return self.nombre


class TipoRecurso(models.Model):
    id_tipo_recurso = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField()

    class Meta:
        db_table = 'tipo_recurso'

    def __str__(self):
        return self.nombre


class TipoResolucion(models.Model):
    id_tipo_res = models.AutoField(primary_key=True)
    codigo = models.CharField(max_length=50)
    nombre = models.CharField(max_length=100)
    nivel_jerarquico = models.IntegerField()
    descripcion = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'tipo_resolucion'

    def __str__(self):
        return self.nombre


class TipoDoc(models.Model):
    id_tipo_doc = models.AutoField(primary_key=True)
    codigo = models.CharField(max_length=50)
    nombre = models.CharField(max_length=100)
    requiere_firma = models.BooleanField(default=False)
    es_publico = models.BooleanField(default=True)
    descripcion = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'tipo_doc'

    def __str__(self):
        return self.nombre


class TipoActuacion(models.Model):
    id_tipo_actuacion = models.AutoField(primary_key=True)
    codigo = models.CharField(max_length=50)
    nombre = models.CharField(max_length=100)

    class Meta:
        db_table = 'tipo_actuacion'

    def __str__(self):
        return self.nombre


class RolProcesal(models.Model):
    id_rol = models.AutoField(primary_key=True)
    nombre_rol = models.CharField(max_length=100)

    class Meta:
        db_table = 'rol_procesal'

    def __str__(self):
        return self.nombre_rol


# ============================================================
# TABLAS PRINCIPALES
# ============================================================

class SalaTribunal(models.Model):
    id_sala = models.AutoField(primary_key=True)
    id_tribunal = models.ForeignKey(Tribunal, on_delete=models.CASCADE, db_column='id_tribunal', related_name='salas_tribunal')
    nombre_sala = models.CharField(max_length=100)
    activa = models.BooleanField(default=True)

    class Meta:
        db_table = 'sala_tribunal'

    def __str__(self):
        return self.nombre_sala


class SalaAudiencia(models.Model):
    id_sala_aud = models.AutoField(primary_key=True)
    id_tribunal = models.ForeignKey(Tribunal, on_delete=models.CASCADE, db_column='id_tribunal', related_name='salas_audiencia')
    nombre_sala = models.CharField(max_length=100)
    capacidad = models.IntegerField()
    equipada_videoconf = models.BooleanField(default=False)
    enlace_virtual = models.URLField(null=True, blank=True)
    activa = models.BooleanField(default=True)

    class Meta:
        db_table = 'sala_audiencia'

    def __str__(self):
        return self.nombre_sala


class Persona(models.Model):
    id_persona = models.AutoField(primary_key=True)
    numero_documento = models.CharField(max_length=50, unique=True)
    nombre = models.CharField(max_length=100)
    primer_apellido = models.CharField(max_length=100)
    segundo_apellido = models.CharField(max_length=100, null=True, blank=True)
    estamento = models.CharField(max_length=100, null=True, blank=True)
    registro_universitario = models.CharField(max_length=100, null=True, blank=True)
    es_abogado = models.BooleanField(default=False)
    titular_a = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        db_table = 'persona'

    def __str__(self):
        return f"{self.nombre} {self.primer_apellido}"


class VocalTribunal(models.Model):
    id_vocal = models.AutoField(primary_key=True)
    id_persona = models.ForeignKey(Persona, on_delete=models.CASCADE, db_column='id_persona', related_name='vocales')
    id_sala = models.ForeignKey(SalaTribunal, on_delete=models.SET_NULL, null=True, blank=True, db_column='id_sala', related_name='vocales')
    cargo = models.CharField(max_length=100)
    fecha_posesion = models.DateField()
    fecha_conclusion = models.DateField(null=True, blank=True)
    activo = models.BooleanField(default=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.PROTECT, db_column='id_usuario', related_name='vocales_registrados',null=True, blank=True)

    class Meta:
        db_table = 'vocal_tribunal'

    def __str__(self):
        return f"{self.id_persona} - {self.cargo}"

class Expediente(models.Model):
    id_expediente = models.AutoField(primary_key=True)
    numero_expediente = models.CharField(max_length=50, unique=True)
    ano = models.IntegerField()
    id_sala = models.ForeignKey(SalaTribunal, on_delete=models.CASCADE, db_column='id_sala', related_name='expedientes')
    id_tipo_proceso = models.ForeignKey(TipoProceso, on_delete=models.CASCADE, db_column='id_tipo_proceso', related_name='expedientes')
    id_estado_expediente = models.ForeignKey(EstadoExpediente, on_delete=models.SET_NULL, null=True, db_column='id_estado_expediente', related_name='expedientes')
    fecha_ingreso = models.DateField(auto_now_add=True)
    fecha_conclusion = models.DateField(null=True, blank=True)
    descripcion = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'expediente'

    def __str__(self):
        return self.numero_expediente


class ConformacionSalaExpediente(models.Model):
    id_conformacion = models.AutoField(primary_key=True)
    id_expediente = models.ForeignKey(Expediente, on_delete=models.CASCADE, db_column='id_expediente', related_name='conformaciones')
    id_vocal = models.ForeignKey(VocalTribunal, on_delete=models.SET_NULL, null=True, blank=True, db_column='id_vocal', related_name='conformaciones')
    rol_en_caso = models.CharField(max_length=100)
    fecha_asignacion = models.DateField(auto_now_add=True)

    class Meta:
        db_table = 'conformacion_sala_expediente'

    def __str__(self):
        return f"Conformación {self.id_conformacion}"


class HistorialEstado(models.Model):
    id_historial = models.AutoField(primary_key=True)
    id_expediente = models.ForeignKey(Expediente, on_delete=models.CASCADE, db_column='id_expediente', related_name='historial_estados')
    id_estado_anterior = models.ForeignKey(EstadoExpediente, on_delete=models.SET_NULL, null=True, blank=True, db_column='id_estado_anterior', related_name='historial_como_anterior')
    id_estado_nuevo = models.ForeignKey(EstadoExpediente, on_delete=models.SET_NULL, null=True, db_column='id_estado_nuevo', related_name='historial_como_nuevo')
    fecha_cambio = models.DateTimeField(auto_now_add=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.PROTECT, db_column='id_usuario', related_name='historial_estados')  # ← Cambiado
    motivo = models.TextField()

    class Meta:
        db_table = 'historial_estado'
    def __str__(self):
        return f"Historial {self.id_historial} - Expediente {self.id_expediente}"


class ParteProcesal(models.Model):
    id_parte = models.AutoField(primary_key=True)
    id_expediente = models.ForeignKey(Expediente, on_delete=models.CASCADE, db_column='id_expediente', related_name='partes')
    id_persona = models.ForeignKey(Persona, on_delete=models.CASCADE, db_column='id_persona', related_name='partes_procesales')
    id_rol = models.ForeignKey(RolProcesal, on_delete=models.CASCADE, db_column='id_rol', related_name='partes')
    fecha_inclusion = models.DateField(auto_now_add=True)
    fecha_exclusion = models.DateField(null=True, blank=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'parte_procesal'

    def __str__(self):
        return f"Parte {self.id_parte}"


class Documento(models.Model):
    id_documento = models.AutoField(primary_key=True)
    id_expediente = models.ForeignKey(Expediente, on_delete=models.CASCADE, db_column='id_expediente', related_name='documentos')
    id_tipo_doc = models.ForeignKey(TipoDoc, on_delete=models.CASCADE, db_column='id_tipo_doc', related_name='documentos')
    id_persona = models.ForeignKey(Persona, on_delete=models.SET_NULL, null=True, blank=True, db_column='id_persona', related_name='documentos')
    titulo = models.CharField(max_length=200)
    fecha_presentacion = models.DateTimeField(auto_now_add=True)
    numero_folio = models.IntegerField(null=True, blank=True)
    hash_integridad = models.CharField(max_length=256)
    ruta_archivo = models.CharField(max_length=500)
    tamano_kb = models.IntegerField()
    es_electronico = models.BooleanField(default=True)
    firmado_digitalmente = models.BooleanField(default=False)

    class Meta:
        db_table = 'documento'

    def __str__(self):
        return self.titulo


class Audiencia(models.Model):
    ESTADO_AUDIENCIA = [
        ('PROGRAMADA', 'Programada'),
        ('EN_CURSO', 'En Curso'),
        ('REALIZADA', 'Realizada'),     # ← agregar esto
        ('FINALIZADA', 'Finalizada'),
        ('SUSPENDIDA', 'Suspendida'),
    ]

    id_audiencia = models.AutoField(primary_key=True)
    id_expediente = models.ForeignKey(Expediente, on_delete=models.CASCADE, db_column='id_expediente', related_name='audiencias')
    id_tipo_audiencia = models.ForeignKey(TipoAudiencia, on_delete=models.CASCADE, db_column='id_tipo_audiencia', related_name='audiencias')
    id_sala_aud = models.ForeignKey(SalaAudiencia, on_delete=models.SET_NULL, null=True, blank=True, db_column='id_sala_aud', related_name='audiencias')
    fecha_hora_programada = models.DateTimeField()
    fecha_hora_inicio = models.DateTimeField(null=True, blank=True)
    fecha_hora_fin = models.DateTimeField(null=True, blank=True)
    estado_audiencia = models.CharField(max_length=50, choices=ESTADO_AUDIENCIA, default='PROGRAMADA')
    motivo_suspension = models.TextField(null=True, blank=True)
    link_videoconferencia = models.URLField(null=True, blank=True)

    class Meta:
        db_table = 'audiencia'

    def __str__(self):
        return f"Audiencia {self.id_audiencia} - {self.fecha_hora_programada}"


class ActaAudiencia(models.Model):
    id_acta = models.AutoField(primary_key=True)
    id_audiencia = models.OneToOneField(Audiencia, on_delete=models.CASCADE, db_column='id_audiencia', related_name='acta')
    usuario = models.ForeignKey(Usuario, on_delete=models.PROTECT, db_column='id_usuario', related_name='actas')  # ← Cambiado
    contenido = models.TextField()
    fecha_acta = models.DateTimeField(auto_now_add=True)
    firmada = models.BooleanField(default=False)
    url_grabacion = models.URLField(null=True, blank=True)

    class Meta:
        db_table = 'acta_audiencia'
    def __str__(self):
        return f"Acta {self.id_acta}"


class AsistenciaAudiencia(models.Model):
    id_asistencia = models.AutoField(primary_key=True)
    id_audiencia = models.ForeignKey(Audiencia, on_delete=models.CASCADE, db_column='id_audiencia', related_name='asistencias')
    id_persona = models.ForeignKey(Persona, on_delete=models.CASCADE, db_column='id_persona', related_name='asistencias')
    rol_en_audiencia = models.CharField(max_length=100)
    asistio = models.BooleanField(default=False)
    hora_ingreso = models.DateTimeField(null=True, blank=True)
    motivo_inasistencia = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'asistencia_audiencia'

    def __str__(self):
        return f"Asistencia {self.id_asistencia}"


class ContactoPersona(models.Model):
    id_contacto = models.AutoField(primary_key=True)
    id_persona = models.ForeignKey(Persona, on_delete=models.CASCADE, db_column='id_persona', related_name='contactos')
    tipo_contacto = models.CharField(max_length=50)
    valor = models.CharField(max_length=200)
    es_principal = models.BooleanField(default=False)
    validado = models.BooleanField(default=False)

    class Meta:
        db_table = 'contacto_persona'

    def __str__(self):
        return f"{self.tipo_contacto}: {self.valor}"


class Resolucion(models.Model):
    id_resolucion = models.AutoField(primary_key=True)
    id_expediente = models.ForeignKey(Expediente, on_delete=models.CASCADE, db_column='id_expediente', related_name='resoluciones')
    id_tipo_res = models.ForeignKey(TipoResolucion, on_delete=models.CASCADE, db_column='id_tipo_res', related_name='resoluciones')
    id_documento = models.OneToOneField(Documento, on_delete=models.SET_NULL, null=True, blank=True, db_column='id_documento', related_name='resolucion')
    numero_resolucion = models.CharField(max_length=100)
    fecha_resolucion = models.DateField()  # ← AGREGAR ESTO
    fecha_notificacion = models.DateField(null=True, blank=True)
    parte_dispositiva = models.TextField()
    fundamentacion = models.TextField()
    estado = models.CharField(max_length=50, default='ACTIVA')
    es_recurrible = models.BooleanField(default=False)
    plazo_recurso_dias = models.IntegerField(default=0)

    class Meta:
        db_table = 'resolucion'

    def __str__(self):
        return self.numero_resolucion


class Recurso(models.Model):
    id_recurso = models.AutoField(primary_key=True)
    id_resolucion_impugnada = models.ForeignKey(Resolucion, on_delete=models.SET_NULL, null=True, blank=True, db_column='id_resolucion_impugnada', related_name='recursos_impugnados')
    id_tipo_recurso = models.ForeignKey(TipoRecurso, on_delete=models.CASCADE, db_column='id_tipo_recurso', related_name='recursos')
    id_recurrente = models.ForeignKey(ParteProcesal, on_delete=models.CASCADE, db_column='id_recurrente', related_name='recursos_interpuestos')
    fecha_interposicion = models.DateField(auto_now_add=True)
    estado_recurso = models.CharField(max_length=50, default='PENDIENTE')
    id_expediente_alzada = models.ForeignKey(Expediente, on_delete=models.SET_NULL, null=True, blank=True, db_column='id_expediente_alzada', related_name='recursos_en_alzada')
    id_resolucion_respuesta = models.ForeignKey(Resolucion, on_delete=models.SET_NULL, null=True, blank=True, db_column='id_resolucion_respuesta', related_name='recursos_respondidos')
    fundamentos = models.TextField()

    class Meta:
        db_table = 'recurso'

    def __str__(self):
        return f"Recurso {self.id_recurso}"


class ActuacionProcesal(models.Model):
    id_actuacion = models.AutoField(primary_key=True)
    id_expediente = models.ForeignKey(Expediente, on_delete=models.CASCADE, db_column='id_expediente', related_name='actuaciones')
    id_tipo_actuacion = models.ForeignKey(TipoActuacion, on_delete=models.CASCADE, db_column='id_tipo_actuacion', related_name='actuaciones')
    usuario = models.ForeignKey(Usuario, on_delete=models.PROTECT, db_column='id_usuario', related_name='actuaciones')  # ← Cambiado
    folio_inicio = models.IntegerField()
    folio_fin = models.IntegerField()
    es_publica = models.BooleanField(default=True)
    fecha_actuacion = models.DateTimeField(auto_now_add=True)
    descripcion = models.TextField()

    class Meta:
        db_table = 'actuacion_procesal'
    def __str__(self):
        return f"Actuación {self.id_actuacion}"


class Notificacion(models.Model):
    id_notificacion = models.AutoField(primary_key=True)
    id_expediente = models.ForeignKey(Expediente, on_delete=models.CASCADE, db_column='id_expediente', related_name='notificaciones')
    id_documento = models.ForeignKey(Documento, on_delete=models.CASCADE, db_column='id_documento', related_name='notificaciones')
    id_parte = models.ForeignKey(ParteProcesal, on_delete=models.CASCADE, db_column='id_parte', related_name='notificaciones')
    tipo_notificacion = models.CharField(max_length=50)
    fecha_emision = models.DateTimeField(auto_now_add=True)
    fecha_diligencia = models.DateTimeField(null=True, blank=True)
    estado_notificacion = models.CharField(max_length=50, default='PENDIENTE')
    usuario = models.ForeignKey(Usuario, on_delete=models.PROTECT, db_column='id_usuario', related_name='notificaciones')  # ← Cambiado

    class Meta:
        db_table = 'notificacion'

    def __str__(self):
        return f"Notificación {self.id_notificacion}"


class SolicitudActualizacion(models.Model):
    id_solicitud = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.PROTECT, db_column='id_usuario', related_name='solicitudes')  # ← Cambiado
    codigo_ianus = models.CharField(max_length=100)
    codigo_sala = models.CharField(max_length=100)
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    estado_solicitud = models.CharField(max_length=50, default='PENDIENTE')
    fecha_confirmacion = models.DateTimeField(null=True, blank=True)
    observacion = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'solicitud_actualizacion'
    def __str__(self):
        return f"Solicitud {self.id_solicitud}"
    
class Denuncia(models.Model):
    ESTADOS = [
        ('REGISTRADA', 'Registrada'),
        ('SUBSANACION', 'Subsanación'),
        ('ADMITIDA', 'Admitida'),
        ('DECLARACION_INFORMATIVA', 'Declaración Informativa'),
        ('PRUEBAS', 'Período Probatorio'),
        ('CONCLUSION', 'Conclusión'),
        ('RESUELTA', 'Resuelta'),
        ('APELADA', 'Apelada'),
        ('EJECUTADA', 'Ejecutada'),
        ('ARCHIVADA', 'Archivada'),
    ]
    
    TIPOS_DENUNCIADO = [
        ('ESTUDIANTE', 'Estudiante'),
        ('DOCENTE', 'Docente'),
        ('ADMINISTRATIVO', 'Administrativo'),
    ]

    numero_denuncia = models.CharField(max_length=50, unique=True)
    fecha_denuncia = models.DateField(auto_now_add=True)
    denunciante = models.ForeignKey('Persona', on_delete=models.PROTECT, related_name='denuncias_hechas')
    denunciado = models.ForeignKey('Persona', on_delete=models.PROTECT, related_name='denuncias_recibidas')
    tipo_denunciado = models.CharField(max_length=20, choices=TIPOS_DENUNCIADO)
    descripcion = models.TextField()
    estado = models.CharField(max_length=30, choices=ESTADOS, default='REGISTRADA')
    resolucion = models.TextField(blank=True, null=True, help_text="Resolución del caso")
    fecha_resolucion = models.DateField(blank=True, null=True)
    expediente = models.ForeignKey('Expediente', on_delete=models.SET_NULL, null=True, blank=True, related_name='denuncias')
    
    class Meta:
        db_table = 'denuncia'
    
    def __str__(self):
        return f"Denuncia {self.numero_denuncia} - {self.denunciado}"


class ResolucionAntigua(models.Model):
    """Resoluciones de casos antiguos (solo para registro histórico)"""
    
    TIPOS_SANCION = [
        ('SANCION', 'Sanción'),
        ('ABSOLUCION', 'Absolución'),
        ('ARCHIVO', 'Archivo'),
    ]
    
    id_resolucion_antigua = models.AutoField(primary_key=True)
    numero_resolucion = models.CharField(max_length=50, unique=True)
    fecha_resolucion = models.DateField()
    persona_denunciante = models.ForeignKey(
        'Persona', 
        on_delete=models.PROTECT, 
        related_name='resoluciones_antiguas_denunciante',
        null=True, 
        blank=True
    )
    persona_denunciada = models.ForeignKey(
        'Persona', 
        on_delete=models.PROTECT, 
        related_name='resoluciones_antiguas_denunciada'
    )
    tipo_sancion = models.CharField(max_length=20, choices=TIPOS_SANCION)
    descripcion = models.TextField(blank=True, null=True)
    sancion = models.CharField(max_length=200, blank=True, null=True, help_text="Ej: Suspensión 3 meses, Multa, etc.")
    documento_url = models.URLField(blank=True, null=True)
    
    class Meta:
        db_table = 'resolucion_antigua'
    
    def __str__(self):
        return f"Res. {self.numero_resolucion} - {self.persona_denunciada}"













