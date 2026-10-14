// Seed data for TrainApp, extracted from the user's "Rutinas de fuerza y
// flexibilidad" PDF. This is the single source of truth used both to seed
// Firestore and as a local fallback so the app works before seeding.
//
// Design decision agreed with the user:
//   - `exercises` describe the movement itself (no sets/reps).
//   - sets x reps x rest live INSIDE each routine block.

// ---------------------------------------------------------------------------
// Categories & muscle groups (used for filters)
// ---------------------------------------------------------------------------
export const CATEGORIES = {
  strength: 'Fuerza general',
  mobility: 'Movilidad dinámica',
  staticStretch: 'Estiramiento estático',
  activeFlex: 'Fuerza activa específica',
}

// How each exercise is measured when logging a set.
//   reps  -> reps required, weight optional (bodyweight by default)
//   time  -> seconds held (planks, stretches, holds)
//   check -> just mark the set as done (dynamic mobility)
export const TRACKING_TYPES = {
  reps: 'Repeticiones',
  time: 'Tiempo',
  check: 'Hecho',
}

export const MUSCLE_GROUPS = {
  pull: 'Tracción',
  push: 'Empuje',
  legs: 'Piernas',
  shoulders: 'Hombros',
  arms: 'Brazos',
  core: 'Core',
  glutes: 'Glúteos',
  hips: 'Caderas',
  adductors: 'Aductores',
  hamstrings: 'Isquiotibiales',
  fullbody: 'Cuerpo completo',
}

// ---------------------------------------------------------------------------
// Exercises (unique movements)
// id is a stable slug so logs can reference it forever.
// `tracking` is materialized below (see deriveTracking).
// ---------------------------------------------------------------------------
const EXERCISES_RAW = [
  // --- Fuerza general -------------------------------------------------------
  {
    id: 'dominadas-pronas',
    name: 'Dominadas pronas',
    category: 'strength',
    muscleGroups: ['pull', 'arms'],
    equipment: ['Barra de dominadas'],
    description:
      'Colgado de la barra con agarre prono (palmas al frente), tira hasta pasar la barbilla por encima de la barra y baja con control hasta extender los brazos.',
    cues: ['Evita balancearte', 'Baja de forma controlada', 'Escápulas abajo y atrás'],
  },
  {
    id: 'dominadas-supinas',
    name: 'Dominadas supinas',
    category: 'strength',
    muscleGroups: ['pull', 'arms'],
    equipment: ['Barra de dominadas'],
    description:
      'Igual que la dominada prona pero con agarre supino (palmas hacia ti). Involucra más el bíceps.',
    cues: ['Codos pegados al cuerpo', 'Control en la bajada'],
  },
  {
    id: 'flexiones-pies-elevados',
    name: 'Flexiones con pies elevados',
    category: 'strength',
    muscleGroups: ['push', 'arms', 'core'],
    equipment: ['Peso corporal', 'Superficie elevada'],
    description:
      'Flexiones con los pies apoyados sobre una superficie elevada para cargar más la parte alta del pecho y los hombros.',
    cues: ['Cuerpo recto como una tabla', 'Codos a ~45°', 'Baja hasta casi tocar el suelo'],
  },
  {
    id: 'flexiones-pica',
    name: 'Flexiones tipo pica',
    category: 'strength',
    muscleGroups: ['push', 'shoulders'],
    equipment: ['Peso corporal'],
    description:
      'En posición de "V" invertida (cadera arriba), flexiona los codos llevando la cabeza hacia el suelo. Enfatiza los hombros.',
    cues: ['Cadera alta', 'Mirada hacia los pies', 'Codos hacia adelante'],
  },
  {
    id: 'flexiones-agarre-estrecho',
    name: 'Flexiones con agarre estrecho',
    category: 'strength',
    muscleGroups: ['push', 'arms'],
    equipment: ['Peso corporal'],
    description:
      'Flexiones con las manos juntas bajo el pecho para enfatizar el tríceps.',
    cues: ['Codos pegados al cuerpo', 'Cuerpo firme'],
  },
  {
    id: 'sentadilla-bulgara',
    name: 'Sentadilla búlgara',
    category: 'strength',
    muscleGroups: ['legs', 'glutes'],
    equipment: ['Mancuernas', 'Superficie elevada'],
    description:
      'Con un pie atrás apoyado en una superficie elevada, baja flexionando la pierna delantera hasta que el muslo quede paralelo al suelo.',
    cues: ['Torso erguido', 'Rodilla alineada con el pie', 'Peso en el talón delantero'],
  },
  {
    id: 'remo-unilateral-mancuerna',
    name: 'Remo unilateral con mancuerna',
    category: 'strength',
    muscleGroups: ['pull', 'arms'],
    equipment: ['Mancuerna', 'Banco'],
    description:
      'Con una rodilla y mano apoyadas, tira de la mancuerna hacia la cadera llevando el codo atrás, apretando la espalda.',
    cues: ['Espalda neutra', 'Tira con el codo, no con la mano', 'Aprieta la escápula'],
  },
  {
    id: 'peso-muerto-rumano-mancuernas',
    name: 'Peso muerto rumano con mancuernas',
    category: 'strength',
    muscleGroups: ['hamstrings', 'glutes', 'pull'],
    equipment: ['Mancuernas'],
    description:
      'Con piernas casi rectas, baja las mancuernas pegadas a las piernas llevando la cadera atrás, sintiendo estiramiento en los isquiotibiales.',
    cues: ['Espalda recta', 'Cadera hacia atrás', 'Rodillas ligeramente flexionadas'],
  },
  {
    id: 'peso-muerto-rumano-una-pierna',
    name: 'Peso muerto rumano a una pierna',
    category: 'strength',
    muscleGroups: ['hamstrings', 'glutes', 'core'],
    equipment: ['Mancuernas'],
    description:
      'Sobre una pierna, inclina el torso al frente mientras la pierna libre se eleva atrás, manteniendo la cadera nivelada.',
    cues: ['Cadera nivelada', 'Movimiento lento', 'Core activo para el equilibrio'],
  },
  {
    id: 'curl-biceps',
    name: 'Curl de bíceps',
    category: 'strength',
    muscleGroups: ['arms'],
    equipment: ['Mancuernas'],
    description: 'Flexiona los codos subiendo las mancuernas hacia los hombros sin balancear el torso.',
    cues: ['Codos fijos', 'Sin impulso', 'Baja controlado'],
  },
  {
    id: 'extension-triceps-sobre-cabeza',
    name: 'Extensión de tríceps sobre la cabeza',
    category: 'strength',
    muscleGroups: ['arms'],
    equipment: ['Mancuerna'],
    description:
      'Con la mancuerna sobre la cabeza, extiende los codos hacia arriba manteniéndolos apuntando al frente.',
    cues: ['Codos quietos y arriba', 'Rango completo'],
  },
  {
    id: 'curl-martillo',
    name: 'Curl martillo',
    category: 'strength',
    muscleGroups: ['arms'],
    equipment: ['Mancuernas'],
    description:
      'Curl con agarre neutro (palmas enfrentadas), trabajando bíceps y antebrazo.',
    cues: ['Agarre neutro', 'Codos fijos', 'Sin balanceo'],
  },
  {
    id: 'elevaciones-laterales',
    name: 'Elevaciones laterales',
    category: 'strength',
    muscleGroups: ['shoulders'],
    equipment: ['Mancuernas'],
    description:
      'Eleva las mancuernas a los lados hasta la altura de los hombros, con una ligera flexión de codo.',
    cues: ['Sube con el codo', 'Sin impulso', 'Hombros abajo'],
  },
  {
    id: 'aperturas-posteriores',
    name: 'Aperturas posteriores',
    category: 'strength',
    muscleGroups: ['shoulders', 'pull'],
    equipment: ['Mancuernas'],
    description:
      'Inclinado al frente, abre los brazos a los lados apretando la parte posterior de los hombros y la espalda alta.',
    cues: ['Torso inclinado estable', 'Aprieta escápulas', 'Sin impulso'],
  },
  {
    id: 'zancadas-atras',
    name: 'Zancadas hacia atrás',
    category: 'strength',
    muscleGroups: ['legs', 'glutes'],
    equipment: ['Mancuernas'],
    description:
      'Da un paso atrás y baja hasta que ambas rodillas formen ~90°, luego vuelve. Alterna piernas.',
    cues: ['Torso erguido', 'Rodilla delantera estable', 'Paso controlado'],
  },
  {
    id: 'puente-gluteo-una-pierna',
    name: 'Puente de glúteo a una pierna',
    category: 'strength',
    muscleGroups: ['glutes', 'core'],
    equipment: ['Peso corporal'],
    description:
      'Tumbado boca arriba, extiende una pierna y empuja con el talón apoyado para elevar la cadera apretando el glúteo.',
    cues: ['Aprieta el glúteo arriba', 'Cadera nivelada', 'Sin arquear la zona lumbar'],
  },
  {
    id: 'reverse-crunch',
    name: 'Encogimientos inversos (reverse crunch)',
    category: 'strength',
    muscleGroups: ['core'],
    equipment: ['Peso corporal'],
    description:
      'Tumbado, lleva las rodillas hacia el pecho elevando la cadera del suelo con control.',
    cues: ['Movimiento desde el abdomen', 'Sin impulso', 'Baja lento'],
  },
  {
    id: 'plancha',
    name: 'Plancha',
    category: 'strength',
    muscleGroups: ['core'],
    equipment: ['Peso corporal'],
    description:
      'Apoyado en antebrazos y puntas de pies, mantén el cuerpo recto y firme activando el abdomen.',
    cues: ['Cuerpo recto', 'Glúteos y abdomen apretados', 'No hundir la cadera'],
  },
  {
    id: 'elevaciones-piernas-tumbado',
    name: 'Elevaciones de piernas tumbado',
    category: 'strength',
    muscleGroups: ['core'],
    equipment: ['Peso corporal'],
    description:
      'Tumbado boca arriba, eleva las piernas rectas hasta la vertical y baja sin tocar el suelo.',
    cues: ['Zona lumbar pegada al suelo', 'Piernas controladas', 'Sin impulso'],
  },

  // --- Movilidad dinámica ---------------------------------------------------
  {
    id: 'circulos-cadera',
    name: 'Círculos de cadera',
    category: 'mobility',
    muscleGroups: ['hips'],
    equipment: ['Peso corporal'],
    description: 'Círculos amplios y controlados con la cadera para movilizar la articulación.',
    cues: ['Amplios y controlados', 'Sin forzar'],
  },
  {
    id: 'balanceos-frontales',
    name: 'Balanceos frontales (adelante/atrás)',
    category: 'mobility',
    muscleGroups: ['hips', 'hamstrings'],
    equipment: ['Peso corporal', 'Apoyo'],
    description: 'Balancea la pierna adelante y atrás aumentando la altura de forma gradual.',
    cues: ['Tronco estable', 'Aumenta la altura gradualmente'],
  },
  {
    id: 'balanceos-laterales',
    name: 'Balanceos laterales',
    category: 'mobility',
    muscleGroups: ['hips', 'adductors'],
    equipment: ['Peso corporal', 'Apoyo'],
    description: 'Balancea la pierna de lado a lado frente al cuerpo sin girar el tronco.',
    cues: ['Evita girar el tronco', 'Apóyate si hace falta'],
  },
  {
    id: 'zancada-dinamica-apertura-cadera',
    name: 'Zancada dinámica con apertura de cadera',
    category: 'mobility',
    muscleGroups: ['hips', 'legs'],
    equipment: ['Peso corporal'],
    description: 'Zancada avanzando con apertura de cadera en un rango cómodo y movimiento suave.',
    cues: ['Rango cómodo', 'Movimiento suave'],
  },

  // --- Estiramientos estáticos ---------------------------------------------
  {
    id: 'mariposa',
    name: 'Mariposa',
    category: 'staticStretch',
    muscleGroups: ['adductors', 'hips'],
    equipment: ['Peso corporal'],
    description: 'Sentado con las plantas de los pies juntas, deja caer las rodillas hacia el suelo.',
    cues: ['Espalda recta', 'Tensión moderada, nunca dolor'],
    focus: 'Aductores e ingle',
  },
  {
    id: 'rana',
    name: 'Rana',
    category: 'staticStretch',
    muscleGroups: ['adductors', 'hips'],
    equipment: ['Peso corporal'],
    description: 'En cuadrupedia, abre las rodillas a los lados y deja caer la cadera atrás.',
    cues: ['Progresa poco a poco', 'No rebotes'],
    focus: 'Aductores y apertura lateral',
  },
  {
    id: 'flexor-cadera-media-rodilla',
    name: 'Flexor de cadera en media rodilla',
    category: 'staticStretch',
    muscleGroups: ['hips'],
    equipment: ['Peso corporal'],
    description: 'En media rodilla, empuja la cadera al frente manteniendo el torso erguido.',
    cues: ['Glúteo activo', 'Torso vertical'],
    focus: 'Parte frontal de la cadera',
  },
  {
    id: 'isquiotibiales-talon-apoyado',
    name: 'Isquiotibiales con talón apoyado',
    category: 'staticStretch',
    muscleGroups: ['hamstrings'],
    equipment: ['Peso corporal'],
    description: 'Con el talón apoyado y la pierna recta, inclina el torso desde la cadera.',
    cues: ['Inclínate desde la cadera', 'Espalda recta'],
    focus: 'Parte posterior del muslo',
  },
  {
    id: 'apertura-sentada-v',
    name: 'Apertura sentada en V',
    category: 'staticStretch',
    muscleGroups: ['adductors', 'hamstrings'],
    equipment: ['Peso corporal'],
    description: 'Sentado con las piernas abiertas en V, inclínate al frente desde la cadera.',
    cues: ['Inclínate desde la cadera', 'Sin redondear la espalda'],
    focus: 'Aductores',
  },
  {
    id: 'rotacion-cadera-90-90',
    name: 'Rotación de cadera 90/90',
    category: 'staticStretch',
    muscleGroups: ['hips'],
    equipment: ['Peso corporal'],
    description: 'Sentado con ambas piernas a 90°, rota de un lado al otro trabajando rotación interna y externa.',
    cues: ['Movimiento controlado', 'Tensión moderada'],
    focus: 'Rotación interna y externa',
  },

  // --- Fuerza activa específica --------------------------------------------
  {
    id: 'elevaciones-frontales-pierna',
    name: 'Elevaciones frontales de pierna',
    category: 'activeFlex',
    muscleGroups: ['hips', 'legs'],
    equipment: ['Peso corporal'],
    description: 'Eleva la pierna recta al frente lo más alto posible sin impulso y baja despacio.',
    cues: ['Sin impulso', 'Baja despacio'],
  },
  {
    id: 'elevaciones-laterales-pierna',
    name: 'Elevaciones laterales de pierna',
    category: 'activeFlex',
    muscleGroups: ['hips', 'adductors'],
    equipment: ['Peso corporal'],
    description: 'Eleva la pierna hacia el lado manteniendo la pelvis estable, sin inclinarte.',
    cues: ['Pelvis estable', 'No te inclines para subir más'],
  },
  {
    id: 'chamber-hold',
    name: 'Mantener rodilla en posición de cámara (chamber)',
    category: 'activeFlex',
    muscleGroups: ['hips', 'core', 'legs'],
    equipment: ['Peso corporal'],
    description: 'Eleva la rodilla a la posición de recámara de la patada y mantén el equilibrio.',
    cues: ['Mantén equilibrio y respiración', 'Rodilla alta'],
  },
]

// Exercises measured by time held (seconds) rather than reps.
const TIME_BASED_IDS = new Set([
  'plancha',
  'chamber-hold',
  'mariposa',
  'rana',
  'flexor-cadera-media-rodilla',
  'isquiotibiales-talon-apoyado',
  'apertura-sentada-v',
  'rotacion-cadera-90-90',
])

// Derive a sensible default tracking type per exercise.
function deriveTracking(ex) {
  if (TIME_BASED_IDS.has(ex.id)) return 'time'
  if (ex.category === 'mobility') return 'check'
  return 'reps'
}

export const EXERCISES = EXERCISES_RAW.map((ex) => ({
  ...ex,
  tracking: ex.tracking ?? deriveTracking(ex),
}))

// ---------------------------------------------------------------------------
// Routine template (from the PDF). sets/reps/rest live here.
// repsText keeps the original human-readable range (e.g. "5-8", "30-60 s").
// perSide: true means the reps are per leg/arm.
// ---------------------------------------------------------------------------
export const ROUTINE_TEMPLATE = {
  id: 'pdf-fuerza-flexibilidad',
  name: 'Fuerza y flexibilidad (patadas altas)',
  description:
    'Plan en casa de fuerza general y movilidad para patadas circulares y laterales altas. Lunes, miércoles y viernes fuerza; martes y jueves flexibilidad.',
  isTemplate: true,
  days: [
    {
      weekday: 'monday',
      sessionType: 'strength',
      label: 'Fuerza A + estática',
      content: 'Rutina A y estiramientos estáticos.',
      blocks: [
        { exerciseId: 'dominadas-pronas', sets: 4, repsText: '5-8', perSide: false, restText: '2-3 min', restSeconds: 120 },
        { exerciseId: 'flexiones-pies-elevados', sets: 4, repsText: '8-15', perSide: false, restText: '2-3 min', restSeconds: 120 },
        { exerciseId: 'sentadilla-bulgara', sets: 3, repsText: '10-15', perSide: true, restText: '2-3 min', restSeconds: 120 },
        { exerciseId: 'remo-unilateral-mancuerna', sets: 3, repsText: '12-25', perSide: true, restText: '90-150 s', restSeconds: 90 },
        { exerciseId: 'peso-muerto-rumano-mancuernas', sets: 3, repsText: '12-20', perSide: false, restText: '2-3 min', restSeconds: 120 },
        { exerciseId: 'elevaciones-laterales', sets: 3, repsText: '15-25', perSide: false, restText: '60-120 s', restSeconds: 60 },
        { exerciseId: 'reverse-crunch', sets: 3, repsText: '12-20', perSide: false, restText: '45-90 s', restSeconds: 45 },
      ],
    },
    {
      weekday: 'tuesday',
      sessionType: 'flexibility',
      label: 'Flexibilidad',
      content: 'Estiramientos estáticos + fuerza activa.',
      blocks: [
        { exerciseId: 'mariposa', sets: 2, repsText: '30-45 s', perSide: false, restText: '—', restSeconds: 0 },
        { exerciseId: 'rana', sets: 2, repsText: '30-45 s', perSide: false, restText: '—', restSeconds: 0 },
        { exerciseId: 'flexor-cadera-media-rodilla', sets: 2, repsText: '30-45 s', perSide: true, restText: '—', restSeconds: 0 },
        { exerciseId: 'isquiotibiales-talon-apoyado', sets: 2, repsText: '30-45 s', perSide: true, restText: '—', restSeconds: 0 },
        { exerciseId: 'apertura-sentada-v', sets: 2, repsText: '30-45 s', perSide: false, restText: '—', restSeconds: 0 },
        { exerciseId: 'rotacion-cadera-90-90', sets: 2, repsText: '30 s', perSide: true, restText: '—', restSeconds: 0 },
        { exerciseId: 'elevaciones-frontales-pierna', sets: 2, repsText: '8-12', perSide: true, restText: '—', restSeconds: 0 },
        { exerciseId: 'elevaciones-laterales-pierna', sets: 2, repsText: '8-12', perSide: true, restText: '—', restSeconds: 0 },
        { exerciseId: 'chamber-hold', sets: 3, repsText: '10-20 s', perSide: true, restText: '—', restSeconds: 0 },
      ],
    },
    {
      weekday: 'wednesday',
      sessionType: 'strength',
      label: 'Fuerza B + activa',
      content: 'Rutina B y ejercicios de fuerza activa; sin estática.',
      blocks: [
        { exerciseId: 'dominadas-supinas', sets: 3, repsText: '5-8', perSide: false, restText: '2-3 min', restSeconds: 120 },
        { exerciseId: 'flexiones-pica', sets: 4, repsText: '6-12', perSide: false, restText: '2-3 min', restSeconds: 120 },
        { exerciseId: 'peso-muerto-rumano-una-pierna', sets: 3, repsText: '10-15', perSide: true, restText: '2-3 min', restSeconds: 120 },
        { exerciseId: 'curl-biceps', sets: 3, repsText: '12-25', perSide: false, restText: '60-120 s', restSeconds: 60 },
        { exerciseId: 'extension-triceps-sobre-cabeza', sets: 3, repsText: '12-25', perSide: false, restText: '60-120 s', restSeconds: 60 },
        { exerciseId: 'aperturas-posteriores', sets: 3, repsText: '15-25', perSide: false, restText: '60-120 s', restSeconds: 60 },
        { exerciseId: 'puente-gluteo-una-pierna', sets: 3, repsText: '12-20', perSide: true, restText: '60-120 s', restSeconds: 60 },
        { exerciseId: 'plancha', sets: 3, repsText: '30-60 s', perSide: false, restText: '45-90 s', restSeconds: 45 },
        { exerciseId: 'elevaciones-frontales-pierna', sets: 2, repsText: '8-12', perSide: true, restText: '—', restSeconds: 0 },
        { exerciseId: 'elevaciones-laterales-pierna', sets: 2, repsText: '8-12', perSide: true, restText: '—', restSeconds: 0 },
        { exerciseId: 'chamber-hold', sets: 3, repsText: '10-20 s', perSide: true, restText: '—', restSeconds: 0 },
      ],
    },
    {
      weekday: 'thursday',
      sessionType: 'flexibility',
      label: 'Flexibilidad',
      content: 'Estiramientos estáticos + fuerza activa.',
      blocks: [
        { exerciseId: 'mariposa', sets: 2, repsText: '30-45 s', perSide: false, restText: '—', restSeconds: 0 },
        { exerciseId: 'rana', sets: 2, repsText: '30-45 s', perSide: false, restText: '—', restSeconds: 0 },
        { exerciseId: 'flexor-cadera-media-rodilla', sets: 2, repsText: '30-45 s', perSide: true, restText: '—', restSeconds: 0 },
        { exerciseId: 'isquiotibiales-talon-apoyado', sets: 2, repsText: '30-45 s', perSide: true, restText: '—', restSeconds: 0 },
        { exerciseId: 'apertura-sentada-v', sets: 2, repsText: '30-45 s', perSide: false, restText: '—', restSeconds: 0 },
        { exerciseId: 'rotacion-cadera-90-90', sets: 2, repsText: '30 s', perSide: true, restText: '—', restSeconds: 0 },
        { exerciseId: 'elevaciones-frontales-pierna', sets: 2, repsText: '8-12', perSide: true, restText: '—', restSeconds: 0 },
        { exerciseId: 'elevaciones-laterales-pierna', sets: 2, repsText: '8-12', perSide: true, restText: '—', restSeconds: 0 },
        { exerciseId: 'chamber-hold', sets: 3, repsText: '10-20 s', perSide: true, restText: '—', restSeconds: 0 },
      ],
    },
    {
      weekday: 'friday',
      sessionType: 'strength',
      label: 'Fuerza C + estática',
      content: 'Rutina C y estiramientos estáticos.',
      blocks: [
        { exerciseId: 'dominadas-pronas', sets: 3, repsText: '5-8', perSide: false, restText: '2-3 min', restSeconds: 120 },
        { exerciseId: 'flexiones-agarre-estrecho', sets: 3, repsText: '8-15', perSide: false, restText: '2-3 min', restSeconds: 120 },
        { exerciseId: 'zancadas-atras', sets: 3, repsText: '10-15', perSide: true, restText: '2-3 min', restSeconds: 120 },
        { exerciseId: 'remo-unilateral-mancuerna', sets: 3, repsText: '12-25', perSide: true, restText: '90-150 s', restSeconds: 90 },
        { exerciseId: 'elevaciones-laterales', sets: 3, repsText: '15-25', perSide: false, restText: '60-120 s', restSeconds: 60 },
        { exerciseId: 'curl-martillo', sets: 3, repsText: '12-25', perSide: false, restText: '60-120 s', restSeconds: 60 },
        { exerciseId: 'elevaciones-piernas-tumbado', sets: 3, repsText: '10-20', perSide: false, restText: '45-90 s', restSeconds: 45 },
      ],
    },
    {
      weekday: 'saturday',
      sessionType: 'mobility',
      label: 'Movilidad ligera opcional',
      content: 'Movilidad dinámica o fuerza activa suave; estática opcional y suave.',
      blocks: [
        { exerciseId: 'circulos-cadera', sets: 1, repsText: '8', perSide: true, restText: '—', restSeconds: 0 },
        { exerciseId: 'balanceos-frontales', sets: 1, repsText: '12-15', perSide: true, restText: '—', restSeconds: 0 },
        { exerciseId: 'balanceos-laterales', sets: 1, repsText: '12-15', perSide: true, restText: '—', restSeconds: 0 },
        { exerciseId: 'zancada-dinamica-apertura-cadera', sets: 1, repsText: '6', perSide: true, restText: '—', restSeconds: 0 },
      ],
    },
    {
      weekday: 'sunday',
      sessionType: 'rest',
      label: 'Descanso',
      content: 'Descanso completo o movilidad muy suave.',
      blocks: [],
    },
  ],
}

// Dynamic warm-up (shown as reference in the library / flexibility days)
export const DYNAMIC_WARMUP = [
  'circulos-cadera',
  'balanceos-frontales',
  'balanceos-laterales',
  'zancada-dinamica-apertura-cadera',
]

export const WEEKDAYS = [
  { key: 'monday', label: 'Lunes', short: 'Lun' },
  { key: 'tuesday', label: 'Martes', short: 'Mar' },
  { key: 'wednesday', label: 'Miércoles', short: 'Mié' },
  { key: 'thursday', label: 'Jueves', short: 'Jue' },
  { key: 'friday', label: 'Viernes', short: 'Vie' },
  { key: 'saturday', label: 'Sábado', short: 'Sáb' },
  { key: 'sunday', label: 'Domingo', short: 'Dom' },
]

// Cyberpunk palette. `color` is a solid bar/dot bg; `text`+`soft` make a
// neon chip (glow border + tinted fill) that reads on the dark theme.
export const SESSION_TYPE_META = {
  strength: { label: 'Fuerza', color: 'bg-brand-500', text: 'text-brand-300', soft: 'bg-brand-500/10 border-brand-400/40', hex: '#00f0ff' },
  flexibility: { label: 'Flexibilidad', color: 'bg-neon-pink', text: 'text-neon-pink', soft: 'bg-neon-pink/10 border-neon-pink/40', hex: '#ff2bd6' },
  mobility: { label: 'Movilidad', color: 'bg-neon-amber', text: 'text-neon-amber', soft: 'bg-neon-amber/10 border-neon-amber/40', hex: '#ffb020' },
  rest: { label: 'Descanso', color: 'bg-ink-600', text: 'text-slate-400', soft: 'bg-ink-700/60 border-slate-500/30', hex: '#2a3761' },
}
