// Seed data for Vortx, extracted from the user's "Rutinas de fuerza y
// flexibilidad" PDF. This is the single source of truth used both to seed
// Firestore and as a local fallback so the app works before seeding.
//
// Design decision agreed with the user:
//   - `exercises` describe the movement itself (no sets/reps).
//   - sets x reps x rest live INSIDE each routine block.
//
// i18n Phase 2: base-catalog CONTENT fields (name, description, cues,
// equipment, focus on exercises; name, description, label, content on the
// routine) are authored as { es, en, pt } objects. Use localized()/
// localizedList() from src/lib/i18nContent.js to display them. User-created
// content stays a plain string.

// ---------------------------------------------------------------------------
// Categories & muscle groups (used for filters). Labels here are legacy
// Spanish fallbacks; the UI renders them via i18n keys (categories.*,
// tracking.*, muscles.*) keyed by the stable keys below.
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
// name/description/cues/equipment/focus are { es, en, pt }.
// ---------------------------------------------------------------------------
const EXERCISES_RAW = [
  // --- Fuerza general -------------------------------------------------------
  {
    id: 'dominadas-pronas',
    name: { es: 'Dominadas pronas', en: 'Pull-ups (pronated grip)', pt: 'Barras fixas (pegada pronada)' },
    category: 'strength',
    muscleGroups: ['pull', 'arms'],
    equipment: { es: ['Barra de dominadas'], en: ['Pull-up bar'], pt: ['Barra fixa'] },
    description: {
      es: 'Colgado de la barra con agarre prono (palmas al frente) a la anchura de los hombros, tira del cuerpo hasta pasar la barbilla sobre la barra y baja con control hasta extender los brazos.',
      en: 'Hanging from the bar with a pronated grip (palms forward) at shoulder width, pull your body up until your chin clears the bar and lower under control until your arms are fully extended.',
      pt: 'Pendurado na barra com pegada pronada (palmas para a frente) na largura dos ombros, puxe o corpo até o queixo passar a barra e desça com controle até estender os braços.',
    },
    cues: {
      es: ['Evita balancearte', 'Baja de forma controlada', 'Escápulas abajo y atrás'],
      en: ['Avoid swinging', 'Lower under control', 'Shoulder blades down and back'],
      pt: ['Evite balançar', 'Desça com controle', 'Escápulas para baixo e para trás'],
    },
  },
  {
    id: 'dominadas-supinas',
    name: { es: 'Dominadas supinas', en: 'Chin-ups (supinated grip)', pt: 'Barras fixas (pegada supinada)' },
    category: 'strength',
    muscleGroups: ['pull', 'arms'],
    equipment: { es: ['Barra de dominadas'], en: ['Pull-up bar'], pt: ['Barra fixa'] },
    description: {
      es: 'Colgado de la barra con agarre supino (palmas hacia ti) a la anchura de los hombros, tira del cuerpo hasta pasar la barbilla sobre la barra y baja con control. El agarre supino implica más el bíceps.',
      en: 'Hanging from the bar with a supinated grip (palms toward you) at shoulder width, pull your body up until your chin clears the bar and lower under control. The supinated grip works the biceps more.',
      pt: 'Pendurado na barra com pegada supinada (palmas para você) na largura dos ombros, puxe o corpo até o queixo passar a barra e desça com controle. A pegada supinada trabalha mais o bíceps.',
    },
    cues: {
      es: ['Codos pegados al cuerpo', 'Control en la bajada'],
      en: ['Elbows close to the body', 'Control on the way down'],
      pt: ['Cotovelos junto ao corpo', 'Controle na descida'],
    },
  },
  {
    id: 'flexiones-pies-elevados',
    name: { es: 'Flexiones con pies elevados', en: 'Feet-elevated push-ups', pt: 'Flexões com pés elevados' },
    category: 'strength',
    muscleGroups: ['push', 'arms', 'core'],
    equipment: {
      es: ['Peso corporal', 'Superficie elevada'],
      en: ['Bodyweight', 'Elevated surface'],
      pt: ['Peso corporal', 'Superfície elevada'],
    },
    description: {
      es: 'Flexión de brazos con las manos a la altura del pecho, algo más abiertas que los hombros, y los pies apoyados sobre una superficie elevada. Al tener los pies en alto se carga más la parte alta del pecho y los hombros.',
      en: 'Push-up with your hands at chest height, slightly wider than your shoulders, and your feet resting on an elevated surface. Raising the feet shifts load onto the upper chest and shoulders.',
      pt: 'Flexão com as mãos na altura do peito, um pouco mais abertas que os ombros, e os pés apoiados numa superfície elevada. Com os pés elevados, a parte superior do peito e os ombros trabalham mais.',
    },
    cues: {
      es: ['Cuerpo recto como una tabla', 'Codos a ~45°', 'Baja hasta casi tocar el suelo'],
      en: ['Body straight like a plank', 'Elbows at ~45°', 'Lower until you almost touch the floor'],
      pt: ['Corpo reto como uma prancha', 'Cotovelos a ~45°', 'Desça até quase tocar o chão'],
    },
  },
  {
    id: 'flexiones-pica',
    name: { es: 'Flexiones tipo pica', en: 'Pike push-ups', pt: 'Flexões em pique' },
    category: 'strength',
    muscleGroups: ['push', 'shoulders'],
    equipment: { es: ['Peso corporal'], en: ['Bodyweight'], pt: ['Peso corporal'] },
    description: {
      es: 'Flexión en posición de "V" invertida, con la cadera alta y las manos a la anchura de los hombros. Baja flexionando los codos hasta acercar la cabeza al suelo y empuja hacia arriba. Enfatiza los hombros.',
      en: 'Push-up in an inverted "V" position, hips high and hands at shoulder width. Bend your elbows to bring your head toward the floor, then push back up. Emphasizes the shoulders.',
      pt: 'Flexão em posição de "V" invertido, com o quadril alto e as mãos na largura dos ombros. Desça dobrando os cotovelos até aproximar a cabeça do chão e empurre para cima. Enfatiza os ombros.',
    },
    cues: {
      es: ['Cadera alta', 'Mirada hacia los pies', 'Codos hacia adelante'],
      en: ['Hips high', 'Look toward your feet', 'Elbows forward'],
      pt: ['Quadril alto', 'Olhar para os pés', 'Cotovelos para a frente'],
    },
  },
  {
    id: 'flexiones-agarre-estrecho',
    name: { es: 'Flexiones con agarre estrecho', en: 'Close-grip push-ups', pt: 'Flexões com pegada fechada' },
    category: 'strength',
    muscleGroups: ['push', 'arms'],
    equipment: { es: ['Peso corporal'], en: ['Bodyweight'], pt: ['Peso corporal'] },
    description: {
      es: 'Flexión de brazos con las manos juntas bajo el pecho, manteniendo los codos pegados al cuerpo al bajar. El agarre estrecho enfatiza el tríceps.',
      en: 'Push-up with your hands together under your chest, keeping your elbows close to your body as you lower. The narrow grip emphasizes the triceps.',
      pt: 'Flexão com as mãos juntas sob o peito, mantendo os cotovelos junto ao corpo ao descer. A pegada fechada enfatiza o tríceps.',
    },
    cues: {
      es: ['Codos pegados al cuerpo', 'Cuerpo firme'],
      en: ['Elbows close to the body', 'Firm body'],
      pt: ['Cotovelos junto ao corpo', 'Corpo firme'],
    },
  },
  {
    id: 'sentadilla-bulgara',
    name: { es: 'Sentadilla búlgara', en: 'Bulgarian split squat', pt: 'Agachamento búlgaro' },
    category: 'strength',
    muscleGroups: ['legs', 'glutes'],
    equipment: {
      es: ['Mancuernas', 'Superficie elevada'],
      en: ['Dumbbells', 'Elevated surface'],
      pt: ['Halteres', 'Superfície elevada'],
    },
    description: {
      es: 'De pie con el empeine del pie trasero apoyado en una superficie elevada y una mancuerna en cada mano, baja flexionando la pierna delantera hasta que el muslo quede paralelo al suelo y sube empujando con el talón.',
      en: 'Standing with the top of your rear foot on an elevated surface and a dumbbell in each hand, lower by bending the front leg until the thigh is parallel to the floor, then drive up through the heel.',
      pt: 'Em pé com o peito do pé de trás apoiado numa superfície elevada e um haltere em cada mão, desça dobrando a perna da frente até a coxa ficar paralela ao chão e suba empurrando pelo calcanhar.',
    },
    cues: {
      es: ['Torso erguido', 'Rodilla alineada con el pie', 'Peso en el talón delantero'],
      en: ['Torso upright', 'Knee aligned with the foot', 'Weight on the front heel'],
      pt: ['Tronco ereto', 'Joelho alinhado com o pé', 'Peso no calcanhar da frente'],
    },
  },
  {
    id: 'remo-unilateral-mancuerna',
    name: { es: 'Remo unilateral con mancuerna', en: 'Single-arm dumbbell row', pt: 'Remada unilateral com haltere' },
    category: 'strength',
    muscleGroups: ['pull', 'arms'],
    equipment: { es: ['Mancuerna', 'Banco'], en: ['Dumbbell', 'Bench'], pt: ['Haltere', 'Banco'] },
    description: {
      es: 'Con una rodilla y la misma mano apoyadas en un banco y una mancuerna en la otra mano, tira de ella hacia la cadera llevando el codo atrás y apretando la espalda. Baja con control.',
      en: 'With one knee and the same-side hand on a bench and a dumbbell in the other hand, pull it toward your hip by driving the elbow back and squeezing your back. Lower under control.',
      pt: 'Com um joelho e a mão do mesmo lado apoiados num banco e um haltere na outra mão, puxe-o em direção ao quadril levando o cotovelo para trás e apertando as costas. Desça com controle.',
    },
    cues: {
      es: ['Espalda neutra', 'Tira con el codo, no con la mano', 'Aprieta la escápula'],
      en: ['Neutral back', 'Pull with the elbow, not the hand', 'Squeeze the shoulder blade'],
      pt: ['Costas neutras', 'Puxe com o cotovelo, não com a mão', 'Aperte a escápula'],
    },
  },
  {
    id: 'peso-muerto-rumano-mancuernas',
    name: {
      es: 'Peso muerto rumano con mancuernas',
      en: 'Romanian deadlift with dumbbells',
      pt: 'Levantamento terra romeno com halteres',
    },
    category: 'strength',
    muscleGroups: ['hamstrings', 'glutes', 'pull'],
    equipment: { es: ['Mancuernas'], en: ['Dumbbells'], pt: ['Halteres'] },
    description: {
      es: 'De pie con una mancuerna en cada mano y las piernas casi rectas, baja las mancuernas pegadas a las piernas llevando la cadera hacia atrás hasta notar tensión en los isquiotibiales, y vuelve a subir.',
      en: 'Standing with a dumbbell in each hand and legs almost straight, lower the dumbbells close to your legs while pushing your hips back until you feel tension in the hamstrings, then stand back up.',
      pt: 'Em pé com um haltere em cada mão e as pernas quase retas, desça os halteres junto às pernas levando o quadril para trás até sentir tensão nos isquiotibiais, e volte a subir.',
    },
    cues: {
      es: ['Espalda recta', 'Cadera hacia atrás', 'Rodillas ligeramente flexionadas'],
      en: ['Straight back', 'Hips back', 'Knees slightly bent'],
      pt: ['Costas retas', 'Quadril para trás', 'Joelhos levemente flexionados'],
    },
  },
  {
    id: 'peso-muerto-rumano-una-pierna',
    name: {
      es: 'Peso muerto rumano a una pierna',
      en: 'Single-leg Romanian deadlift',
      pt: 'Levantamento terra romeno unilateral',
    },
    category: 'strength',
    muscleGroups: ['hamstrings', 'glutes', 'core'],
    equipment: { es: ['Mancuernas'], en: ['Dumbbells'], pt: ['Halteres'] },
    description: {
      es: 'De pie sobre una pierna con una mancuerna en la mano, inclina el torso al frente mientras la pierna libre se eleva hacia atrás, manteniendo la cadera nivelada, y vuelve a la posición inicial.',
      en: 'Standing on one leg with a dumbbell in hand, hinge your torso forward while the free leg rises behind you, keeping your hips level, then return to the starting position.',
      pt: 'Em pé sobre uma perna com um haltere na mão, incline o tronco para a frente enquanto a perna livre sobe para trás, mantendo o quadril nivelado, e volte à posição inicial.',
    },
    cues: {
      es: ['Cadera nivelada', 'Movimiento lento', 'Core activo para el equilibrio'],
      en: ['Hips level', 'Slow movement', 'Active core for balance'],
      pt: ['Quadril nivelado', 'Movimento lento', 'Core ativo para o equilíbrio'],
    },
  },
  {
    id: 'curl-biceps',
    name: { es: 'Curl de bíceps', en: 'Biceps curl', pt: 'Rosca de bíceps' },
    category: 'strength',
    muscleGroups: ['arms'],
    equipment: { es: ['Mancuernas'], en: ['Dumbbells'], pt: ['Halteres'] },
    description: {
      es: 'De pie con una mancuerna en cada mano y las palmas al frente, flexiona los codos subiendo las mancuernas hacia los hombros y baja con control, sin balancear el torso.',
      en: 'Standing with a dumbbell in each hand and palms forward, bend your elbows to raise the dumbbells toward your shoulders and lower under control, without swinging your torso.',
      pt: 'Em pé com um haltere em cada mão e as palmas para a frente, flexione os cotovelos subindo os halteres em direção aos ombros e desça com controle, sem balançar o tronco.',
    },
    cues: {
      es: ['Codos fijos', 'Sin impulso', 'Baja controlado'],
      en: ['Fixed elbows', 'No momentum', 'Lower under control'],
      pt: ['Cotovelos fixos', 'Sem impulso', 'Desça controlado'],
    },
  },
  {
    id: 'extension-triceps-sobre-cabeza',
    name: {
      es: 'Extensión de tríceps sobre la cabeza',
      en: 'Overhead triceps extension',
      pt: 'Extensão de tríceps acima da cabeça',
    },
    category: 'strength',
    muscleGroups: ['arms'],
    equipment: { es: ['Mancuerna'], en: ['Dumbbell'], pt: ['Haltere'] },
    description: {
      es: 'Sujeta una mancuerna con ambas manos por encima de la cabeza. Baja el peso por detrás de la nuca flexionando los codos y extiéndelos para subir, manteniendo los codos apuntando al frente.',
      en: 'Hold a dumbbell with both hands overhead. Lower the weight behind your head by bending your elbows and extend them to raise it, keeping your elbows pointing forward.',
      pt: 'Segure um haltere com as duas mãos acima da cabeça. Baixe o peso atrás da nuca dobrando os cotovelos e estenda-os para subir, mantendo os cotovelos apontando para a frente.',
    },
    cues: {
      es: ['Codos quietos y arriba', 'Rango completo'],
      en: ['Elbows still and high', 'Full range'],
      pt: ['Cotovelos parados e para cima', 'Amplitude completa'],
    },
  },
  {
    id: 'curl-martillo',
    name: { es: 'Curl martillo', en: 'Hammer curl', pt: 'Rosca martelo' },
    category: 'strength',
    muscleGroups: ['arms'],
    equipment: { es: ['Mancuernas'], en: ['Dumbbells'], pt: ['Halteres'] },
    description: {
      es: 'De pie con una mancuerna en cada mano y las palmas enfrentadas (agarre neutro), flexiona los codos subiendo las mancuernas hacia los hombros y baja con control. Trabaja bíceps y antebrazo.',
      en: 'Standing with a dumbbell in each hand and palms facing each other (neutral grip), bend your elbows to raise the dumbbells toward your shoulders and lower under control. Works biceps and forearm.',
      pt: 'Em pé com um haltere em cada mão e as palmas voltadas uma para a outra (pegada neutra), flexione os cotovelos subindo os halteres em direção aos ombros e desça com controle. Trabalha bíceps e antebraço.',
    },
    cues: {
      es: ['Agarre neutro', 'Codos fijos', 'Sin balanceo'],
      en: ['Neutral grip', 'Fixed elbows', 'No swinging'],
      pt: ['Pegada neutra', 'Cotovelos fixos', 'Sem balanço'],
    },
  },
  {
    id: 'elevaciones-laterales',
    name: { es: 'Elevaciones laterales', en: 'Lateral raises', pt: 'Elevações laterais' },
    category: 'strength',
    muscleGroups: ['shoulders'],
    equipment: { es: ['Mancuernas'], en: ['Dumbbells'], pt: ['Halteres'] },
    description: {
      es: 'De pie con una mancuerna en cada mano a los costados, eleva los brazos hacia los lados hasta la altura de los hombros con una ligera flexión de codo, y baja con control.',
      en: 'Standing with a dumbbell in each hand at your sides, raise your arms out to the sides up to shoulder height with a slight elbow bend, then lower under control.',
      pt: 'Em pé com um haltere em cada mão ao lado do corpo, eleve os braços para os lados até a altura dos ombros com uma leve flexão de cotovelo, e desça com controle.',
    },
    cues: {
      es: ['Sube con el codo', 'Sin impulso', 'Hombros abajo'],
      en: ['Lead with the elbow', 'No momentum', 'Shoulders down'],
      pt: ['Suba com o cotovelo', 'Sem impulso', 'Ombros para baixo'],
    },
  },
  {
    id: 'aperturas-posteriores',
    name: { es: 'Aperturas posteriores', en: 'Rear delt flyes', pt: 'Crucifixo invertido' },
    category: 'strength',
    muscleGroups: ['shoulders', 'pull'],
    equipment: { es: ['Mancuernas'], en: ['Dumbbells'], pt: ['Halteres'] },
    description: {
      es: 'Con el torso inclinado al frente y una mancuerna en cada mano colgando, abre los brazos hacia los lados hasta la altura de los hombros apretando la parte posterior de los hombros y la espalda alta.',
      en: 'With your torso hinged forward and a dumbbell hanging in each hand, open your arms out to the sides up to shoulder height, squeezing the rear shoulders and upper back.',
      pt: 'Com o tronco inclinado para a frente e um haltere pendurado em cada mão, abra os braços para os lados até a altura dos ombros apertando a parte posterior dos ombros e a parte alta das costas.',
    },
    cues: {
      es: ['Torso inclinado estable', 'Aprieta escápulas', 'Sin impulso'],
      en: ['Stable hinged torso', 'Squeeze shoulder blades', 'No momentum'],
      pt: ['Tronco inclinado estável', 'Aperte as escápulas', 'Sem impulso'],
    },
  },
  {
    id: 'zancadas-atras',
    name: { es: 'Zancadas hacia atrás', en: 'Reverse lunges', pt: 'Afundos para trás' },
    category: 'strength',
    muscleGroups: ['legs', 'glutes'],
    equipment: { es: ['Mancuernas'], en: ['Dumbbells'], pt: ['Halteres'] },
    description: {
      es: 'De pie con una mancuerna en cada mano, da un paso atrás y baja hasta que ambas rodillas formen unos 90°, luego empuja para volver. Alterna piernas.',
      en: 'Standing with a dumbbell in each hand, step back and lower until both knees form about 90°, then drive back up. Alternate legs.',
      pt: 'Em pé com um haltere em cada mão, dê um passo para trás e desça até que ambos os joelhos formem cerca de 90°, depois empurre para voltar. Alterne as pernas.',
    },
    cues: {
      es: ['Torso erguido', 'Rodilla delantera estable', 'Paso controlado'],
      en: ['Torso upright', 'Stable front knee', 'Controlled step'],
      pt: ['Tronco ereto', 'Joelho da frente estável', 'Passo controlado'],
    },
  },
  {
    id: 'puente-gluteo-una-pierna',
    name: { es: 'Puente de glúteo a una pierna', en: 'Single-leg glute bridge', pt: 'Ponte de glúteo unilateral' },
    category: 'strength',
    muscleGroups: ['glutes', 'core'],
    equipment: { es: ['Peso corporal'], en: ['Bodyweight'], pt: ['Peso corporal'] },
    description: {
      es: 'Tumbado boca arriba con una rodilla flexionada y la otra pierna estirada, empuja con el talón apoyado para elevar la cadera apretando el glúteo, y baja con control.',
      en: 'Lying on your back with one knee bent and the other leg extended, push through the planted heel to raise your hips while squeezing the glute, then lower under control.',
      pt: 'Deitado de costas com um joelho flexionado e a outra perna estendida, empurre pelo calcanhar apoiado para elevar o quadril apertando o glúteo, e desça com controle.',
    },
    cues: {
      es: ['Aprieta el glúteo arriba', 'Cadera nivelada', 'Sin arquear la zona lumbar'],
      en: ['Squeeze the glute at the top', 'Hips level', 'Do not arch the lower back'],
      pt: ['Aperte o glúteo no topo', 'Quadril nivelado', 'Sem arquear a lombar'],
    },
  },
  {
    id: 'reverse-crunch',
    name: {
      es: 'Encogimientos inversos (reverse crunch)',
      en: 'Reverse crunch',
      pt: 'Abdominal invertido (reverse crunch)',
    },
    category: 'strength',
    muscleGroups: ['core'],
    equipment: { es: ['Peso corporal'], en: ['Bodyweight'], pt: ['Peso corporal'] },
    description: {
      es: 'Tumbado boca arriba con las rodillas flexionadas, lleva las rodillas hacia el pecho elevando la cadera del suelo con el abdomen, y baja despacio.',
      en: 'Lying on your back with knees bent, bring your knees toward your chest by lifting your hips off the floor with your abs, then lower slowly.',
      pt: 'Deitado de costas com os joelhos flexionados, leve os joelhos em direção ao peito elevando o quadril do chão com o abdômen, e desça devagar.',
    },
    cues: {
      es: ['Movimiento desde el abdomen', 'Sin impulso', 'Baja lento'],
      en: ['Move from the abs', 'No momentum', 'Lower slowly'],
      pt: ['Movimento a partir do abdômen', 'Sem impulso', 'Desça devagar'],
    },
  },
  {
    id: 'plancha',
    name: { es: 'Plancha', en: 'Plank', pt: 'Prancha' },
    category: 'strength',
    muscleGroups: ['core'],
    equipment: { es: ['Peso corporal'], en: ['Bodyweight'], pt: ['Peso corporal'] },
    description: {
      es: 'Apoyado en los antebrazos y las puntas de los pies, mantén el cuerpo recto y firme de la cabeza a los talones, activando abdomen y glúteos durante el tiempo indicado.',
      en: 'Supported on your forearms and toes, keep your body straight and firm from head to heels, bracing your abs and glutes for the prescribed time.',
      pt: 'Apoiado nos antebraços e nas pontas dos pés, mantenha o corpo reto e firme da cabeça aos calcanhares, ativando abdômen e glúteos durante o tempo indicado.',
    },
    cues: {
      es: ['Cuerpo recto', 'Glúteos y abdomen apretados', 'No hundir la cadera'],
      en: ['Straight body', 'Glutes and abs squeezed', 'Do not let the hips sag'],
      pt: ['Corpo reto', 'Glúteos e abdômen contraídos', 'Não deixe o quadril cair'],
    },
  },
  {
    id: 'elevaciones-piernas-tumbado',
    name: { es: 'Elevaciones de piernas tumbado', en: 'Lying leg raises', pt: 'Elevação de pernas deitado' },
    category: 'strength',
    muscleGroups: ['core'],
    equipment: { es: ['Peso corporal'], en: ['Bodyweight'], pt: ['Peso corporal'] },
    description: {
      es: 'Tumbado boca arriba con las piernas estiradas, elévalas juntas hasta la vertical y bájalas despacio sin que lleguen a tocar el suelo.',
      en: 'Lying on your back with legs straight, raise them together to vertical and lower them slowly without letting them touch the floor.',
      pt: 'Deitado de costas com as pernas estendidas, eleve-as juntas até a vertical e baixe-as devagar sem deixar tocar o chão.',
    },
    cues: {
      es: ['Zona lumbar pegada al suelo', 'Piernas controladas', 'Sin impulso'],
      en: ['Lower back pressed to the floor', 'Controlled legs', 'No momentum'],
      pt: ['Lombar colada ao chão', 'Pernas controladas', 'Sem impulso'],
    },
  },

  // --- Movilidad dinámica ---------------------------------------------------
  {
    id: 'circulos-cadera',
    name: { es: 'Círculos de cadera', en: 'Hip circles', pt: 'Círculos de quadril' },
    category: 'mobility',
    muscleGroups: ['hips'],
    equipment: { es: ['Peso corporal'], en: ['Bodyweight'], pt: ['Peso corporal'] },
    description: {
      es: 'De pie con las manos en la cintura, describe círculos amplios y controlados con la cadera, moviéndola en todo su rango sin forzar. Cambia de sentido a la mitad.',
      en: 'Standing with hands on your waist, trace wide, controlled circles with your hips, moving through the full range without forcing. Switch direction halfway.',
      pt: 'Em pé com as mãos na cintura, faça círculos amplos e controlados com o quadril, movendo-o em toda a amplitude sem forçar. Troque de sentido na metade.',
    },
    cues: {
      es: ['Amplios y controlados', 'Sin forzar'],
      en: ['Wide and controlled', 'Without forcing'],
      pt: ['Amplos e controlados', 'Sem forçar'],
    },
  },
  {
    id: 'balanceos-frontales',
    name: {
      es: 'Balanceos frontales (adelante/atrás)',
      en: 'Front leg swings (forward/back)',
      pt: 'Balanços frontais (frente/trás)',
    },
    category: 'mobility',
    muscleGroups: ['hips', 'hamstrings'],
    equipment: { es: ['Peso corporal', 'Apoyo'], en: ['Bodyweight', 'Support'], pt: ['Peso corporal', 'Apoio'] },
    description: {
      es: 'De pie, apoyado con una mano, balancea una pierna estirada hacia adelante y hacia atrás de forma controlada, aumentando la altura de forma gradual.',
      en: 'Standing with one hand on support, swing one straight leg forward and back in a controlled way, gradually increasing the height.',
      pt: 'Em pé, apoiado com uma mão, balance uma perna estendida para a frente e para trás de forma controlada, aumentando a altura gradualmente.',
    },
    cues: {
      es: ['Tronco estable', 'Aumenta la altura gradualmente'],
      en: ['Stable torso', 'Increase height gradually'],
      pt: ['Tronco estável', 'Aumente a altura gradualmente'],
    },
  },
  {
    id: 'balanceos-laterales',
    name: { es: 'Balanceos laterales', en: 'Side leg swings', pt: 'Balanços laterais' },
    category: 'mobility',
    muscleGroups: ['hips', 'adductors'],
    equipment: { es: ['Peso corporal', 'Apoyo'], en: ['Bodyweight', 'Support'], pt: ['Peso corporal', 'Apoio'] },
    description: {
      es: 'De pie, apoyado de frente a una pared, balancea una pierna estirada de lado a lado por delante del cuerpo sin girar el tronco.',
      en: 'Standing facing a wall for support, swing one straight leg side to side in front of your body without rotating your torso.',
      pt: 'Em pé, apoiado de frente para uma parede, balance uma perna estendida de um lado para o outro à frente do corpo sem girar o tronco.',
    },
    cues: {
      es: ['Evita girar el tronco', 'Apóyate si hace falta'],
      en: ['Avoid rotating the torso', 'Use support if needed'],
      pt: ['Evite girar o tronco', 'Apoie-se se precisar'],
    },
  },
  {
    id: 'zancada-dinamica-apertura-cadera',
    name: {
      es: 'Zancada dinámica con apertura de cadera',
      en: 'Dynamic lunge with hip opener',
      pt: 'Afundo dinâmico com abertura de quadril',
    },
    category: 'mobility',
    muscleGroups: ['hips', 'legs'],
    equipment: { es: ['Peso corporal'], en: ['Bodyweight'], pt: ['Peso corporal'] },
    description: {
      es: 'Da un paso largo al frente a una zancada profunda y abre la cadera llevando el codo del mismo lado hacia el suelo; vuelve y alterna. Movimiento suave en un rango cómodo.',
      en: 'Take a long step into a deep lunge and open the hip by bringing the same-side elbow toward the floor; return and alternate. Smooth movement within a comfortable range.',
      pt: 'Dê um passo longo para a frente em um afundo profundo e abra o quadril levando o cotovelo do mesmo lado em direção ao chão; volte e alterne. Movimento suave em uma amplitude confortável.',
    },
    cues: {
      es: ['Rango cómodo', 'Movimiento suave'],
      en: ['Comfortable range', 'Smooth movement'],
      pt: ['Amplitude confortável', 'Movimento suave'],
    },
  },

  // --- Estiramientos estáticos ---------------------------------------------
  {
    id: 'mariposa',
    name: { es: 'Mariposa', en: 'Butterfly stretch', pt: 'Alongamento borboleta' },
    category: 'staticStretch',
    muscleGroups: ['adductors', 'hips'],
    equipment: { es: ['Peso corporal'], en: ['Bodyweight'], pt: ['Peso corporal'] },
    description: {
      es: 'Sentado con las plantas de los pies juntas y las rodillas abiertas, deja caer las rodillas hacia el suelo y mantén la posición notando el estiramiento en la ingle.',
      en: 'Seated with the soles of your feet together and knees open, let your knees drop toward the floor and hold the position, feeling the stretch in the groin.',
      pt: 'Sentado com as plantas dos pés juntas e os joelhos abertos, deixe os joelhos caírem em direção ao chão e mantenha a posição sentindo o alongamento na virilha.',
    },
    cues: {
      es: ['Espalda recta', 'Tensión moderada, nunca dolor'],
      en: ['Straight back', 'Moderate tension, never pain'],
      pt: ['Costas retas', 'Tensão moderada, nunca dor'],
    },
    focus: { es: 'Aductores e ingle', en: 'Adductors and groin', pt: 'Adutores e virilha' },
  },
  {
    id: 'rana',
    name: { es: 'Rana', en: 'Frog stretch', pt: 'Alongamento do sapo' },
    category: 'staticStretch',
    muscleGroups: ['adductors', 'hips'],
    equipment: { es: ['Peso corporal'], en: ['Bodyweight'], pt: ['Peso corporal'] },
    description: {
      es: 'En cuadrupedia con las rodillas bien abiertas a los lados, lleva la cadera hacia atrás y mantén la posición notando el estiramiento en la cara interna de los muslos.',
      en: 'On all fours with your knees spread wide to the sides, push your hips back and hold the position, feeling the stretch on the inner thighs.',
      pt: 'Em quatro apoios com os joelhos bem abertos para os lados, leve o quadril para trás e mantenha a posição sentindo o alongamento na parte interna das coxas.',
    },
    cues: {
      es: ['Progresa poco a poco', 'No rebotes'],
      en: ['Progress gradually', 'Do not bounce'],
      pt: ['Progrida aos poucos', 'Não quique'],
    },
    focus: { es: 'Aductores y apertura lateral', en: 'Adductors and lateral opening', pt: 'Adutores e abertura lateral' },
  },
  {
    id: 'flexor-cadera-media-rodilla',
    name: {
      es: 'Flexor de cadera en media rodilla',
      en: 'Half-kneeling hip flexor stretch',
      pt: 'Alongamento do flexor do quadril em meio ajoelhado',
    },
    category: 'staticStretch',
    muscleGroups: ['hips'],
    equipment: { es: ['Peso corporal'], en: ['Bodyweight'], pt: ['Peso corporal'] },
    description: {
      es: 'Apoyado en una rodilla con la otra pierna flexionada al frente, empuja la cadera hacia adelante con el torso erguido y mantén la posición notando el estiramiento en la parte frontal de la cadera.',
      en: 'Kneeling on one knee with the other leg bent in front, push your hips forward with an upright torso and hold the position, feeling the stretch at the front of the hip.',
      pt: 'Apoiado em um joelho com a outra perna flexionada à frente, empurre o quadril para a frente com o tronco ereto e mantenha a posição sentindo o alongamento na parte frontal do quadril.',
    },
    cues: {
      es: ['Glúteo activo', 'Torso vertical'],
      en: ['Active glute', 'Vertical torso'],
      pt: ['Glúteo ativo', 'Tronco vertical'],
    },
    focus: { es: 'Parte frontal de la cadera', en: 'Front of the hip', pt: 'Parte frontal do quadril' },
  },
  {
    id: 'isquiotibiales-talon-apoyado',
    name: {
      es: 'Isquiotibiales con talón apoyado',
      en: 'Hamstring stretch with heel down',
      pt: 'Alongamento de isquiotibiais com calcanhar apoiado',
    },
    category: 'staticStretch',
    muscleGroups: ['hamstrings'],
    equipment: { es: ['Peso corporal'], en: ['Bodyweight'], pt: ['Peso corporal'] },
    description: {
      es: 'Con una pierna estirada al frente y el talón apoyado en el suelo, inclina el torso desde la cadera hacia esa pierna y mantén la posición notando el estiramiento detrás del muslo.',
      en: 'With one leg extended in front and the heel on the floor, hinge your torso from the hips toward that leg and hold the position, feeling the stretch behind the thigh.',
      pt: 'Com uma perna estendida à frente e o calcanhar apoiado no chão, incline o tronco a partir do quadril em direção a essa perna e mantenha a posição sentindo o alongamento atrás da coxa.',
    },
    cues: {
      es: ['Inclínate desde la cadera', 'Espalda recta'],
      en: ['Hinge from the hips', 'Straight back'],
      pt: ['Incline a partir do quadril', 'Costas retas'],
    },
    focus: { es: 'Parte posterior del muslo', en: 'Back of the thigh', pt: 'Parte posterior da coxa' },
  },
  {
    id: 'apertura-sentada-v',
    name: { es: 'Apertura sentada en V', en: 'Seated straddle (V-stretch)', pt: 'Abertura sentada em V' },
    category: 'staticStretch',
    muscleGroups: ['adductors', 'hamstrings'],
    equipment: { es: ['Peso corporal'], en: ['Bodyweight'], pt: ['Peso corporal'] },
    description: {
      es: 'Sentado en el suelo con las piernas abiertas en V, inclina el torso al frente desde la cadera y mantén la posición notando el estiramiento en la cara interna de los muslos.',
      en: 'Seated on the floor with legs open in a V, hinge your torso forward from the hips and hold the position, feeling the stretch on the inner thighs.',
      pt: 'Sentado no chão com as pernas abertas em V, incline o tronco para a frente a partir do quadril e mantenha a posição sentindo o alongamento na parte interna das coxas.',
    },
    cues: {
      es: ['Inclínate desde la cadera', 'Sin redondear la espalda'],
      en: ['Hinge from the hips', 'Do not round your back'],
      pt: ['Incline a partir do quadril', 'Sem arredondar as costas'],
    },
    focus: { es: 'Aductores', en: 'Adductors', pt: 'Adutores' },
  },
  {
    id: 'rotacion-cadera-90-90',
    name: { es: 'Rotación de cadera 90/90', en: '90/90 hip rotation', pt: 'Rotação de quadril 90/90' },
    category: 'staticStretch',
    muscleGroups: ['hips'],
    equipment: { es: ['Peso corporal'], en: ['Bodyweight'], pt: ['Peso corporal'] },
    description: {
      es: 'Sentado en el suelo con una pierna flexionada al frente y la otra al lado, ambas en ángulo de 90°, rota la cadera de un lado al otro para trabajar la rotación interna y externa.',
      en: 'Seated on the floor with one leg bent in front and the other to the side, both at 90°, rotate your hips from side to side to work internal and external rotation.',
      pt: 'Sentado no chão com uma perna flexionada à frente e a outra ao lado, ambas em ângulo de 90°, gire o quadril de um lado para o outro para trabalhar a rotação interna e externa.',
    },
    cues: {
      es: ['Movimiento controlado', 'Tensión moderada'],
      en: ['Controlled movement', 'Moderate tension'],
      pt: ['Movimento controlado', 'Tensão moderada'],
    },
    focus: { es: 'Rotación interna y externa', en: 'Internal and external rotation', pt: 'Rotação interna e externa' },
  },

  // --- Fuerza activa específica --------------------------------------------
  {
    id: 'elevaciones-frontales-pierna',
    name: { es: 'Elevaciones frontales de pierna', en: 'Front leg raises', pt: 'Elevações frontais de perna' },
    category: 'activeFlex',
    muscleGroups: ['hips', 'legs'],
    equipment: { es: ['Peso corporal'], en: ['Bodyweight'], pt: ['Peso corporal'] },
    description: {
      es: 'De pie, eleva una pierna recta hacia el frente lo más alto posible sin impulso y bájala despacio con control. Apóyate en una pared si lo necesitas.',
      en: 'Standing, raise one straight leg to the front as high as possible without momentum and lower it slowly under control. Use a wall for support if needed.',
      pt: 'Em pé, eleve uma perna reta para a frente o mais alto possível sem impulso e baixe-a devagar com controle. Apoie-se numa parede se precisar.',
    },
    cues: {
      es: ['Sin impulso', 'Baja despacio'],
      en: ['No momentum', 'Lower slowly'],
      pt: ['Sem impulso', 'Desça devagar'],
    },
  },
  {
    id: 'elevaciones-laterales-pierna',
    name: { es: 'Elevaciones laterales de pierna', en: 'Side leg raises', pt: 'Elevações laterais de perna' },
    category: 'activeFlex',
    muscleGroups: ['hips', 'adductors'],
    equipment: { es: ['Peso corporal'], en: ['Bodyweight'], pt: ['Peso corporal'] },
    description: {
      es: 'De pie, eleva una pierna recta hacia el lado lo más alto posible manteniendo la pelvis estable y sin inclinar el torso. Baja con control. Apóyate en una pared si lo necesitas.',
      en: 'Standing, raise one straight leg to the side as high as possible while keeping your pelvis stable and without tilting your torso. Lower under control. Use a wall for support if needed.',
      pt: 'Em pé, eleve uma perna reta para o lado o mais alto possível mantendo a pelve estável e sem inclinar o tronco. Desça com controle. Apoie-se numa parede se precisar.',
    },
    cues: {
      es: ['Pelvis estable', 'No te inclines para subir más'],
      en: ['Stable pelvis', 'Do not lean to go higher'],
      pt: ['Pelve estável', 'Não se incline para subir mais'],
    },
  },
  {
    id: 'chamber-hold',
    name: {
      es: 'Mantener rodilla en posición de cámara (chamber)',
      en: 'Knee chamber hold',
      pt: 'Sustentação do joelho em câmara (chamber)',
    },
    category: 'activeFlex',
    muscleGroups: ['hips', 'core', 'legs'],
    equipment: { es: ['Peso corporal'], en: ['Bodyweight'], pt: ['Peso corporal'] },
    description: {
      es: 'De pie sobre una pierna, eleva la otra rodilla a la altura de la cintura (posición de recámara, previa a la patada) y mantén esa posición en equilibrio durante el tiempo indicado.',
      en: 'Standing on one leg, raise the other knee to waist height (the chamber position before a kick) and hold that balance for the prescribed time.',
      pt: 'Em pé sobre uma perna, eleve o outro joelho até a altura da cintura (posição de câmara, antes do chute) e mantenha o equilíbrio durante o tempo indicado.',
    },
    cues: {
      es: ['Mantén equilibrio y respiración', 'Rodilla alta'],
      en: ['Keep balance and breathing', 'Knee high'],
      pt: ['Mantenha o equilíbrio e a respiração', 'Joelho alto'],
    },
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
// name/description and each day's label/content are { es, en, pt }.
// ---------------------------------------------------------------------------
export const ROUTINE_TEMPLATE = {
  id: 'default',
  name: {
    es: 'Fuerza y flexibilidad (patadas altas)',
    en: 'Strength and flexibility (high kicks)',
    pt: 'Força e flexibilidade (chutes altos)',
  },
  description: {
    es: 'Plan en casa de fuerza general y movilidad para patadas circulares y laterales altas. Lunes, miércoles y viernes fuerza; martes y jueves flexibilidad.',
    en: 'At-home plan of general strength and mobility for high roundhouse and side kicks. Strength on Monday, Wednesday and Friday; flexibility on Tuesday and Thursday.',
    pt: 'Plano em casa de força geral e mobilidade para chutes circulares e laterais altos. Segunda, quarta e sexta força; terça e quinta flexibilidade.',
  },
  isTemplate: true,
  days: [
    {
      weekday: 'monday',
      sessionType: 'strength',
      label: { es: 'Fuerza A + estática', en: 'Strength A + static', pt: 'Força A + estático' },
      content: {
        es: 'Rutina A y estiramientos estáticos.',
        en: 'Routine A and static stretches.',
        pt: 'Rotina A e alongamentos estáticos.',
      },
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
      label: { es: 'Flexibilidad', en: 'Flexibility', pt: 'Flexibilidade' },
      content: {
        es: 'Estiramientos estáticos + fuerza activa.',
        en: 'Static stretches + active strength.',
        pt: 'Alongamentos estáticos + força ativa.',
      },
      blocks: [
        { exerciseId: 'mariposa', sets: 2, repsText: '30-45 s', perSide: false, restText: '10 s', restSeconds: 10 },
        { exerciseId: 'rana', sets: 2, repsText: '30-45 s', perSide: false, restText: '10 s', restSeconds: 10 },
        { exerciseId: 'flexor-cadera-media-rodilla', sets: 2, repsText: '30-45 s', perSide: true, restText: '10 s', restSeconds: 10 },
        { exerciseId: 'isquiotibiales-talon-apoyado', sets: 2, repsText: '30-45 s', perSide: true, restText: '10 s', restSeconds: 10 },
        { exerciseId: 'apertura-sentada-v', sets: 2, repsText: '30-45 s', perSide: false, restText: '10 s', restSeconds: 10 },
        { exerciseId: 'rotacion-cadera-90-90', sets: 2, repsText: '30 s', perSide: true, restText: '10 s', restSeconds: 10 },
        { exerciseId: 'elevaciones-frontales-pierna', sets: 2, repsText: '8-12', perSide: true, restText: '10 s', restSeconds: 10 },
        { exerciseId: 'elevaciones-laterales-pierna', sets: 2, repsText: '8-12', perSide: true, restText: '10 s', restSeconds: 10 },
        { exerciseId: 'chamber-hold', sets: 3, repsText: '10-20 s', perSide: true, restText: '10 s', restSeconds: 10 },
      ],
    },
    {
      weekday: 'wednesday',
      sessionType: 'strength',
      label: { es: 'Fuerza B + activa', en: 'Strength B + active', pt: 'Força B + ativa' },
      content: {
        es: 'Rutina B y ejercicios de fuerza activa; sin estática.',
        en: 'Routine B and active-strength exercises; no static.',
        pt: 'Rotina B e exercícios de força ativa; sem estático.',
      },
      blocks: [
        { exerciseId: 'dominadas-supinas', sets: 3, repsText: '5-8', perSide: false, restText: '2-3 min', restSeconds: 120 },
        { exerciseId: 'flexiones-pica', sets: 4, repsText: '6-12', perSide: false, restText: '2-3 min', restSeconds: 120 },
        { exerciseId: 'peso-muerto-rumano-una-pierna', sets: 3, repsText: '10-15', perSide: true, restText: '2-3 min', restSeconds: 120 },
        { exerciseId: 'curl-biceps', sets: 3, repsText: '12-25', perSide: false, restText: '60-120 s', restSeconds: 60 },
        { exerciseId: 'extension-triceps-sobre-cabeza', sets: 3, repsText: '12-25', perSide: false, restText: '60-120 s', restSeconds: 60 },
        { exerciseId: 'aperturas-posteriores', sets: 3, repsText: '15-25', perSide: false, restText: '60-120 s', restSeconds: 60 },
        { exerciseId: 'puente-gluteo-una-pierna', sets: 3, repsText: '12-20', perSide: true, restText: '60-120 s', restSeconds: 60 },
        { exerciseId: 'plancha', sets: 3, repsText: '30-60 s', perSide: false, restText: '45-90 s', restSeconds: 45 },
        { exerciseId: 'elevaciones-frontales-pierna', sets: 2, repsText: '8-12', perSide: true, restText: '10 s', restSeconds: 10 },
        { exerciseId: 'elevaciones-laterales-pierna', sets: 2, repsText: '8-12', perSide: true, restText: '10 s', restSeconds: 10 },
        { exerciseId: 'chamber-hold', sets: 3, repsText: '10-20 s', perSide: true, restText: '10 s', restSeconds: 10 },
      ],
    },
    {
      weekday: 'thursday',
      sessionType: 'flexibility',
      label: { es: 'Flexibilidad', en: 'Flexibility', pt: 'Flexibilidade' },
      content: {
        es: 'Estiramientos estáticos + fuerza activa.',
        en: 'Static stretches + active strength.',
        pt: 'Alongamentos estáticos + força ativa.',
      },
      blocks: [
        { exerciseId: 'mariposa', sets: 2, repsText: '30-45 s', perSide: false, restText: '10 s', restSeconds: 10 },
        { exerciseId: 'rana', sets: 2, repsText: '30-45 s', perSide: false, restText: '10 s', restSeconds: 10 },
        { exerciseId: 'flexor-cadera-media-rodilla', sets: 2, repsText: '30-45 s', perSide: true, restText: '10 s', restSeconds: 10 },
        { exerciseId: 'isquiotibiales-talon-apoyado', sets: 2, repsText: '30-45 s', perSide: true, restText: '10 s', restSeconds: 10 },
        { exerciseId: 'apertura-sentada-v', sets: 2, repsText: '30-45 s', perSide: false, restText: '10 s', restSeconds: 10 },
        { exerciseId: 'rotacion-cadera-90-90', sets: 2, repsText: '30 s', perSide: true, restText: '10 s', restSeconds: 10 },
        { exerciseId: 'elevaciones-frontales-pierna', sets: 2, repsText: '8-12', perSide: true, restText: '10 s', restSeconds: 10 },
        { exerciseId: 'elevaciones-laterales-pierna', sets: 2, repsText: '8-12', perSide: true, restText: '10 s', restSeconds: 10 },
        { exerciseId: 'chamber-hold', sets: 3, repsText: '10-20 s', perSide: true, restText: '10 s', restSeconds: 10 },
      ],
    },
    {
      weekday: 'friday',
      sessionType: 'strength',
      label: { es: 'Fuerza C + estática', en: 'Strength C + static', pt: 'Força C + estático' },
      content: {
        es: 'Rutina C y estiramientos estáticos.',
        en: 'Routine C and static stretches.',
        pt: 'Rotina C e alongamentos estáticos.',
      },
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
      label: { es: 'Movilidad ligera opcional', en: 'Optional light mobility', pt: 'Mobilidade leve opcional' },
      content: {
        es: 'Movilidad dinámica o fuerza activa suave; estática opcional y suave.',
        en: 'Dynamic mobility or light active strength; optional gentle static.',
        pt: 'Mobilidade dinâmica ou força ativa leve; estático opcional e suave.',
      },
      blocks: [
        { exerciseId: 'circulos-cadera', sets: 1, repsText: '8', perSide: true, restText: '10 s', restSeconds: 10 },
        { exerciseId: 'balanceos-frontales', sets: 1, repsText: '12-15', perSide: true, restText: '10 s', restSeconds: 10 },
        { exerciseId: 'balanceos-laterales', sets: 1, repsText: '12-15', perSide: true, restText: '10 s', restSeconds: 10 },
        { exerciseId: 'zancada-dinamica-apertura-cadera', sets: 1, repsText: '6', perSide: true, restText: '10 s', restSeconds: 10 },
      ],
    },
    {
      weekday: 'sunday',
      sessionType: 'rest',
      label: { es: 'Descanso', en: 'Rest', pt: 'Descanso' },
      content: {
        es: 'Descanso completo o movilidad muy suave.',
        en: 'Full rest or very light mobility.',
        pt: 'Descanso completo ou mobilidade muito leve.',
      },
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
