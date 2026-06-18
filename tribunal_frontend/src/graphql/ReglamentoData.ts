// Reglamento de Justicia Universitaria — Resolución I.C.U. Nº 048-2018
// Artículos relevantes para el proceso disciplinario

export interface Articulo {
  numero: number;
  titulo: string;
  texto: string;
}

export interface PlazoProcesal {
  etapa: string;
  articulo: number;
  dias: string;
  descripcion: string;
}

export const PLAZOS_PROCESALES: PlazoProcesal[] = [
  {
    etapa: "Auto de admisión",
    articulo: 58,
    dias: "5 días hábiles",
    descripcion: "Plazo para emitir auto de admisión e inicio de investigación desde la presentación de la denuncia.",
  },
  {
    etapa: "Subsanación de denuncia",
    articulo: 56,
    dias: "3 días hábiles",
    descripcion: "Plazo máximo otorgado al denunciante para subsanar los defectos de la denuncia, bajo apercibimiento de tenerla por no presentada.",
  },
  {
    etapa: "Defensa del denunciado",
    articulo: 58,
    dias: "10 días hábiles",
    descripcion: "Plazo improrrogable para que el denunciado asuma su defensa sobre los hechos o actos denunciados.",
  },
  {
    etapa: "Período probatorio",
    articulo: 60,
    dias: "30 días hábiles",
    descripcion: "Término probatorio para recepcionar pruebas de cargo y descargo. Las partes podrán ratificar sus pruebas dentro de los 5 días hábiles desde la notificación del auto de apertura.",
  },
  {
    etapa: "Resolución final",
    articulo: 75,
    dias: "15 días hábiles",
    descripcion: "Plazo para que el Tribunal dicte resolución final motivada a partir de la providencia de cierre del término probatorio.",
  },
  {
    etapa: "Notificación resolución definitiva",
    articulo: 46,
    dias: "5 días hábiles",
    descripcion: "Plazo para practicar y diligenciar las notificaciones con la resolución definitiva de primera instancia, desde el día siguiente hábil a su emisión.",
  },
  {
    etapa: "Recurso de apelación",
    articulo: 82,
    dias: "5 días hábiles",
    descripcion: "Plazo perentorio para interponer recurso de apelación, computables desde la notificación a las partes. En caso de aclaración o enmienda, el plazo corre desde la notificación del auto que la resuelva.",
  },
  {
    etapa: "Traslado apelación",
    articulo: 82,
    dias: "5 días hábiles",
    descripcion: "Plazo para que la otra parte conteste el recurso de apelación. Transcurrido el plazo, con o sin contestación, se concederá el recurso.",
  },
  {
    etapa: "Remisión al Tribunal Superior",
    articulo: 86,
    dias: "3 días hábiles",
    descripcion: "Plazo para que el Tribunal remita el expediente al Tribunal Superior y de Apelaciones, de recibido el recurso de apelación.",
  },
  {
    etapa: "Ejecución del fallo (Rectorado)",
    articulo: 90,
    dias: "5 días hábiles",
    descripcion: "Plazo para que el Rector emita la resolución administrativa de ejecución del fallo, desde que recibe la resolución ejecutoriada.",
  },
  {
    etapa: "Registro en Gaceta Universitaria",
    articulo: 7,
    dias: "5 días",
    descripcion: "Las resoluciones definitivas sancionatorias ejecutoriadas deben ser registradas en la Gaceta Universitaria dentro de 5 días.",
  },
  {
    etapa: "Ejecución por el Tribunal",
    articulo: 16,
    dias: "3 días hábiles",
    descripcion: "Plazo para que el Tribunal remita el expediente ante la autoridad responsable para su respectiva ejecución, una vez ejecutoriados el Auto y Resolución Definitiva.",
  },
  {
    etapa: "Prescripción de la acción",
    articulo: 8,
    dias: "2 años",
    descripcion: "La acción disciplinaria prescribe a los dos años desde que se cometió la falta. El plazo se interrumpe con la citación al denunciado con el auto de admisión.",
  },
];

export const ARTICULOS_REGLAMENTO: Articulo[] = [
  {
    numero: 7,
    titulo: "Registro de las Resoluciones",
    texto:
      "El Tribunal de Justicia Universitaria en ambas instancias, formarán un archivo físico y digital de todas las resoluciones definitivas, sancionatorias debidamente ejecutoriadas y además registradas en la Gaceta Universitaria en 5 días.",
  },
  {
    numero: 8,
    titulo: "Prescripción",
    texto:
      "La acción o denuncia por responsabilidad disciplinaria, prescribe a los dos años, computables a partir del día en que se cometió la falta. Este plazo se interrumpe con la citación al denunciado, con el auto de admisión de la denuncia disciplinaria. La prescripción no se opera de oficio, sino a solicitud expresa de la parte interesada, con excepción de aquellas infracciones que atenten contra los derechos humanos.",
  },
  {
    numero: 12,
    titulo: "De los Plazos",
    texto:
      "Los plazos se computan solo en días hábiles administrativos, y comienzan a correr a partir del día siguiente hábil al de la respectiva citación o notificación con el acto procesal, concluyendo en el último día hábil, salvo disposición expresa. El Tribunal de Justicia Universitaria de oficio, o a pedido de parte por motivos fundados, podrá habilitar días u horas extraordinarias.",
  },
  {
    numero: 16,
    titulo: "Ejecución de la Sanción",
    texto:
      "Ejecutoriados el Auto y Resolución Definitiva, el Tribunal remitirá el expediente ante la autoridad responsable, para su respectiva ejecución en el plazo de 3 días hábiles.",
  },
  {
    numero: 22,
    titulo: "Retiro de Denuncia",
    texto:
      "Antes de la citación con la denuncia al denunciado, ésta podrá ser retirada por la parte denunciante y se la tendrá por no presentada.",
  },
  {
    numero: 23,
    titulo: "Desistimiento",
    texto:
      "I. En primera instancia, por las características propias de los procesos disciplinarios, el desistimiento del denunciante, se lo admitirá solo con referencia a su acción, consiguientemente se continuará con el proceso disciplinario hasta su conclusión. En segunda instancia, hasta antes de emitirse la resolución definitiva, se admitirá el desistimiento al recurso de apelación, no siendo necesario correr traslado, disponiendo la ejecutoria de la resolución de primera instancia, salvo que exista doble recurso.\n\nII. No se admitirá el desistimiento cuando se trate de hechos que afecten al patrimonio y a la imagen de la Universidad Autónoma 'Gabriel René Moreno'.",
  },
  {
    numero: 46,
    titulo: "Plazo para la Notificación con la Resolución Definitiva de Primera Instancia",
    texto:
      "Las notificaciones con la resolución definitiva de primera instancia, se practicarán y diligenciarán dentro del plazo máximo de cinco días hábiles, computables desde el día siguiente hábil de la fecha de emisión de la Resolución definitiva.",
  },
  {
    numero: 55,
    titulo: "De la Denuncia — Requisitos",
    texto:
      "I. La denuncia será formulada por escrito y deberá reunir los siguientes requisitos mínimos de forma y contenido:\n\n1. Identificación por sus generales de ley de los denunciantes y denunciados.\n2. Domicilio Laboral del denunciado(s), dentro de la Universidad Autónoma Gabriel Rene Moreno.\n3. Los hechos que se le atribuyen como faltas, expuestos con claridad y precisión, adecuando su conducta a alguno(s) de los numerales contenidos en los Art. 36 al 41.\n4. Adjuntar las pruebas documentales y todos los medios probatorios de los que intentaren valerse las partes, que sustenten la denuncia en originales o copias legalizadas y/o señalar el lugar donde se encuentren.",
  },
  {
    numero: 56,
    titulo: "Denuncia Defectuosa",
    texto:
      "Si la denuncia no se ajustare a los requisitos mínimos señalados en el Art. 55 del presente reglamento, se dispondrá la subsanación de los defectos en el plazo máximo de tres días hábiles, bajo apercibimiento de tenerla por no presentada.\n\nCon esta resolución se notificará al denunciante en su domicilio señalado en la denuncia.",
  },
  {
    numero: 57,
    titulo: "Rechazo de Denuncia",
    texto:
      "El Tribunal de Justicia Universitaria en su Sala respectiva, podrá rechazar la denuncia por falta de legitimidad activa o pasiva, falta de tipicidad de la transgresión disciplinaria prevista en las causales del proceso disciplinario, establecidas en este Reglamento, por incoherencia y falta de sustentación de los hechos denunciados.",
  },
  {
    numero: 58,
    titulo: "Auto de Admisión de la Denuncia",
    texto:
      "Si la denuncia cumple con los requisitos mínimos, el Tribunal de Justicia Universitaria emitirá auto de admisión e inicio de investigación en el término de cinco días hábiles de presentada la denuncia y dispondrá:\n\na) La citación personal al denunciado, para que en el plazo improrrogable de diez días hábiles, asuma su defensa sobre los hechos o actos denunciados, advirtiéndole que el proceso continuará con o sin la contestación.\n\nb) El tribunal señalará fecha y hora para la recepción de la declaración informativa, en caso de que el denunciado se presente sin abogado defensor, el tribunal designará uno de oficio de la Carrera de Derecho, con apoyo del Consultorio Jurídico de la Facultad de Ciencias Jurídicas, Políticas, Sociales y Relaciones Internacionales.\n\nc) Estableciéndose que las posteriores actuaciones procesales se notificarán en tablero de citaciones y notificaciones del Tribunal de Justicia Universitaria que corresponda.",
  },
  {
    numero: 59,
    titulo: "De la Conciliación",
    texto:
      "I. La conciliación será admitida dentro del proceso disciplinario, cuando se trate de denuncias recíprocas entre funcionarios, estudiantes y docentes de la Universidad, siempre y cuando los hechos no afecten el orden público.\n\nII. Si las partes llegasen a un acuerdo, el tribunal elaborará un acta, con los puntos acordados y se concluirá el trámite con el archivo de obrados.",
  },
  {
    numero: 60,
    titulo: "Del Período Probatorio",
    texto:
      "I. Recibida la declaración informativa, el Tribunal dictará Auto de apertura de término probatorio, de treinta días hábiles, a efecto de recepcionar las pruebas de cargo y descargo.\n\nII. Las partes podrán ratificar sus pruebas, dentro de los cinco días hábiles, computables desde la notificación con el auto de apertura del término probatorio.\n\nIII. El Tribunal de Justicia Universitaria, dispondrá se practiquen otras diligencias que acrediten o desvirtúen la existencia de los hechos o actos denunciados.",
  },
  {
    numero: 61,
    titulo: "De las Medidas Precautorias",
    texto:
      "El Tribunal de Justicia Universitaria, mediante resolución motivada, de oficio o a solicitud de parte, adoptará las medidas precautorias que considere necesarias, como ser la obtención de determinada documentación, que tenga relación directa con los hechos o actos denunciados y las que considere pertinente.",
  },
  {
    numero: 70,
    titulo: "De la Declaración Testifical",
    texto:
      "I. La prueba testifical se recibirá en audiencia, interrogándose a cada testigo en forma separada, previo juramento o promesa de decir la verdad.\n\na) Se interrogará al testigo sobre su nombre, estado civil, domicilio, nacionalidad, profesión, oficio u ocupación habitual y si existe en relación a él alguna causal de tacha.\nb) Se pedirá al testigo que haga una exposición de los hechos que personalmente le conste en relación al objeto de la denuncia.\nc) Terminada la declaración, las partes podrán interrogarlo libremente por intermedio de sus abogados y bajo la dirección del Tribunal.\n\nII. Cada pregunta no debe estar referida a más de un hecho y será clara y concreta.\n\nIII. El testigo no podrá leer notas o apuntes durante su declaración.",
  },
  {
    numero: 73,
    titulo: "Del Acta",
    texto:
      "Se levantará acta circunstanciada, labrada por el o la secretaria del Tribunal de Justicia Universitaria, donde conste todo lo ocurrido en la audiencia y será firmada por el testigo, las partes y el Tribunal.",
  },
  {
    numero: 74,
    titulo: "Cierre del Término Probatorio",
    texto:
      "Concluido el plazo de la etapa investigativa el Tribunal de Justicia Universitaria, dispondrá en forma expresa la clausura del periodo probatorio.",
  },
  {
    numero: 75,
    titulo: "Resolución Final",
    texto:
      "A partir de la providencia de cierre del término probatorio, el Tribunal dictará resolución final motivada, en el término de quince días hábiles, las mismas que podrán ser:\n\na) Sancionatoria: Si se acredita la existencia de los hechos o actos denunciados, se declarará probada la denuncia, debiendo fundamentarse de manera congruente, cuáles fueron las atenuantes o agravantes para la imposición de la sanción.\n\nb) Absolutoria: Si el Tribunal Disciplinario evidencia la no existencia de dichos actos o hechos denunciados, o los mismos no fueren considerados como faltas disciplinarias, declarará improbada la denuncia.",
  },
  {
    numero: 77,
    titulo: "Complementación y Enmienda",
    texto:
      "I. Los miembros del Tribunal de Justicia Universitaria, tienen la facultad de corregir o enmendar de oficio los errores materiales advertidos en las resoluciones.\n\nII. Los errores materiales, numéricos, gramaticales o mecanográficos, podrán ser corregidos aun en ejecución de fallos.\n\nIII. Las partes podrán solicitar aclaración, sobre un concepto oscuro, o corrección de cualquier error material o subsanación, en la que hubiere incurrido en la resolución final, en el plazo improrrogable de 2 días hábiles, computables a partir de su notificación con la resolución final.\n\nIV. La aclaración, enmienda, o complementación, no podrá alterar lo sustancial de la decisión principal.",
  },
  {
    numero: 80,
    titulo: "Fallecimiento del Denunciado",
    texto:
      "Si en el transcurso del proceso disciplinario se evidencia el fallecimiento del denunciado, a través de resolución motivada, se dispondrá la conclusión del proceso y archivo de obrados, salvo los casos en los que sean varios los denunciados en el mismo proceso, el proceso disciplinario continuará contra los demás denunciados.",
  },
  {
    numero: 81,
    titulo: "De la Prescripción y la Cosa Juzgada",
    texto:
      "I. La prescripción y la cosa juzgada, como medios de defensa, serán admisibles siempre y cuando sean propuestas a tiempo de contestar la denuncia.\n\nII. La presentación extemporánea de cualquiera de estos medios de defensa, dará lugar al rechazo, sin necesidad de trámite previo.",
  },
  {
    numero: 82,
    titulo: "Apelación",
    texto:
      "I. Las resoluciones definitivas emitidas por el Tribunal de Justicia Universitaria de Primera instancia, admiten recurso de apelación, que deberá ser presentado ante la misma autoridad que dictó la resolución de primer grado.\n\nII. El recurso de apelación se interpondrá en el plazo perentorio de cinco días hábiles, computables a partir de la notificación a las partes.\n\nIII. Con el recurso de apelación, se correrá traslado a la otra parte, quien deberá contestar en el plazo de 5 días hábiles. Transcurrido el plazo, con o sin contestación, se concederá el recurso de apelación, y el expediente será remitido al Tribunal Superior en el plazo de 3 días hábiles.\n\nIV. Si el recurso de apelación es presentado en forma extemporánea, el Tribunal de Justicia Universitaria en primera instancia, rechazará el recurso y declarará la ejecutoria de la resolución.",
  },
  {
    numero: 83,
    titulo: "De la Compulsa Disciplinaria",
    texto:
      "I. El recurso de compulsa procede por negativa indebida del recurso de apelación.\n\nII. El recurso se presentará directamente ante el Tribunal Superior de Justicia Universitaria, por escrito y debidamente fundamentado en el plazo de 3 días, computables a partir de la notificación con el Auto de negativa al recurso de apelación.",
  },
  {
    numero: 86,
    titulo: "Concesión y Remisión del Recurso de Apelación",
    texto:
      "I. Admitido el recurso de apelación, el Tribunal de Justicia Universitaria, remitirá el mismo en efecto suspensivo, disponiendo la remisión del expediente ante el Tribunal Superior y de Apelaciones y/o ante el Ilustre Consejo Universitario, con nota de atención. La remisión de antecedentes se realizará en el término máximo de tres días hábiles, de recibido el recurso de apelación.\n\nII. La sala que conozca el recurso de apelación, dictará decreto de radicatoria, disponiendo su notificación a las partes.\n\nIII. La resolución del tribunal de segunda instancia, será emitida en el plazo de quince días hábiles, computable desde el decreto de radicatoria y podrá:\na) Confirmar total o parcialmente la resolución impugnada.\nb) Revocar la resolución impugnada.\nc) Anular obrados hasta el vicio más antiguo.",
  },
  {
    numero: 87,
    titulo: "Carácter Definitivo de las Resoluciones de Segundo Grado",
    texto:
      "Las resoluciones emitidas por el tribunal de segundo grado en materia disciplinaria, son definitivas, contiene la autoridad de cosa juzgada, por lo tanto son de cumplimiento obligatorio e inmediato.",
  },
  {
    numero: 90,
    titulo: "Ejecución de Fallos",
    texto:
      "I. Las resoluciones emitidas por el Tribunal de Justicia Universitaria pasada en autoridad de cosa juzgada, se ejecutarán a instancia de parte interesada, sin alterar ni modificar su contenido por el tribunal de primera instancia que hubiere conocido el proceso.\n\nII. Cuando los sancionados por faltas y contravenciones disciplinarias, sean docentes, administrativos y/o estudiantes, la ejecución del fallo se hará efectivo mediante resolución administrativa, emitida por el Rector en el plazo de 5 días hábiles de recibida la resolución.\n\nIII. Cuando se trate de juzgamiento al Rector y Vice-rector, la resolución lo ejecutará el Ilustre Consejo Universitario mediante resolución expresa.\n\nIV. Cuando se trate de Decanos, Vicedecanos y Directores de Carrera, la resolución será ejecutada por resolución del Consejo Facultativo, previa notificación a la Máxima Autoridad Ejecutiva.",
  },
];
