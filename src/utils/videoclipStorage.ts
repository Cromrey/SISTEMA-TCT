import { VideoclipShot, ShotPlan, VideoclipGoal, VideoclipCatalog } from '../types/videoclip';

const VIDEOCLIP_SHOTS_KEY = 'tct_videoclip_shots_v1';
const VIDEOCLIP_CATALOG_KEY = 'tct_videoclip_catalog_v1';
const VIDEOCLIP_GOALS_KEY = 'tct_videoclip_goals_v1';

export const INITIAL_LENSES: string[] = [
  'Drone f/2.8',
  '10mm f/2.8',
  '15mm f/2.8',
  '20mm f/2.8',
  '27mm f/2.8',
  '30mm f/2.8',
  '35mm f/2.0',
  '50mm f/1.8',
  '52.5mm f/2.0',
  '75mm f/1.8',
  '85mm f/1.4',
  '127.5mm f/1.4'
];

export const INITIAL_SHOT_PLANS: ShotPlan[] = [
  // PANORÁMICO
  {
    id: 'plan-pgp',
    code: 'PGP',
    name: 'Panorámico Gran Plano',
    category: 'PANORÁMICO',
    description: 'Vista amplia del entorno natural o arquitectónico para contextualizar la locación.',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    recommendedLenses: ['Drone f/2.8', '10mm f/2.8', '15mm f/2.8']
  },
  {
    id: 'plan-pg',
    code: 'PG',
    name: 'Plano General de Paisaje',
    category: 'PANORÁMICO',
    description: 'Toma panorámica con horizonte y cielo despejado.',
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80',
    recommendedLenses: ['Drone f/2.8', '15mm f/2.8', '20mm f/2.8']
  },

  // GENERAL
  {
    id: 'plan-pg-am',
    code: 'PG-AM',
    name: 'General Artista con Músicos',
    category: 'GENERAL',
    description: 'Encuadre amplio donde interactúa el vocalista principal con la banda en vivo.',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
    recommendedLenses: ['20mm f/2.8', '27mm f/2.8', '35mm f/2.0']
  },
  {
    id: 'plan-pg-ab',
    code: 'PG-AB',
    name: 'General Artista con Bailarines',
    category: 'GENERAL',
    description: 'Toma general con coreografía completa y el artista en primer término.',
    imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
    recommendedLenses: ['20mm f/2.8', '27mm f/2.8', '30mm f/2.8']
  },
  {
    id: 'plan-pg-amb',
    code: 'PG-AMB',
    name: 'General Artista, Músicos y Bailarines',
    category: 'GENERAL',
    description: 'Plano majestuoso con todo el elenco escénico en acción.',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
    recommendedLenses: ['15mm f/2.8', '20mm f/2.8', '27mm f/2.8']
  },

  // ENTERO
  {
    id: 'plan-pe-a',
    code: 'PE-A',
    name: 'Entero Artista',
    category: 'ENTERO',
    description: 'Cuerpo completo del cantante de pies a cabeza con vestuario destacado.',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
    recommendedLenses: ['35mm f/2.0', '50mm f/1.8']
  },
  {
    id: 'plan-pe-gamb',
    code: 'PE-GAMB',
    name: 'Entero Grupal AMB',
    category: 'ENTERO',
    description: 'Plano entero de grupo artístico completo en tarima o set.',
    imageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=600&q=80',
    recommendedLenses: ['27mm f/2.8', '35mm f/2.0']
  },
  {
    id: 'plan-pe-bpvm',
    code: 'PE-BPVM',
    name: 'Entero Bailarín en Pareja VM',
    category: 'ENTERO',
    description: 'Cuerpo entero de pareja de baile folclórico o moderno en movimiento.',
    imageUrl: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?auto=format&fit=crop&w=600&q=80',
    recommendedLenses: ['35mm f/2.0', '50mm f/1.8']
  },
  {
    id: 'plan-pe-bv',
    code: 'PE-BV',
    name: 'Entero Bailarín Varón',
    category: 'ENTERO',
    description: 'Zapateo y giros en cuerpo entero del bailarín principal.',
    imageUrl: 'https://images.unsplash.com/photo-1535525153412-5a42439a210d?auto=format&fit=crop&w=600&q=80',
    recommendedLenses: ['35mm f/2.0', '50mm f/1.8']
  },
  {
    id: 'plan-pe-bm',
    code: 'PE-BM',
    name: 'Entero Bailarín Mujer',
    category: 'ENTERO',
    description: 'Despliegue de pollera, vestido y gracia en cuerpo entero.',
    imageUrl: 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=600&q=80',
    recommendedLenses: ['35mm f/2.0', '50mm f/1.8']
  },
  {
    id: 'plan-pe-ma',
    code: 'PE-MA',
    name: 'Entero Músico Arpa',
    category: 'ENTERO',
    description: 'Músico ejecutando el arpa andina o clásica con el instrumento en cuadro.',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    recommendedLenses: ['35mm f/2.0', '50mm f/1.8']
  },
  {
    id: 'plan-pe-mv',
    code: 'PE-MV',
    name: 'Entero Músico Violín',
    category: 'ENTERO',
    description: 'Ejecución del violín con postura completa y arco en movimiento.',
    imageUrl: 'https://images.unsplash.com/photo-1612225330812-01a9c6b355ec?auto=format&fit=crop&w=600&q=80',
    recommendedLenses: ['50mm f/1.8', '75mm f/1.8']
  },
  {
    id: 'plan-pe-my',
    code: 'PE-MY',
    name: 'Entero Músico Yungor',
    category: 'ENTERO',
    description: 'Músico tradicional de viento/percusión en cuerpo entero.',
    imageUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=600&q=80',
    recommendedLenses: ['35mm f/2.0', '50mm f/1.8']
  },
  {
    id: 'plan-pe-mbt',
    code: 'PE-MBT',
    name: 'Entero Músico Batería / Timbal',
    category: 'ENTERO',
    description: 'Baterista / timbalero con baquetas y platillos en cuadro.',
    imageUrl: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?auto=format&fit=crop&w=600&q=80',
    recommendedLenses: ['27mm f/2.8', '35mm f/2.0']
  },
  {
    id: 'plan-pe-mbj',
    code: 'PE-MBJ',
    name: 'Entero Músico Bajo',
    category: 'ENTERO',
    description: 'Bajista con el bajo eléctrico marcando el ritmo en escena.',
    imageUrl: 'https://images.unsplash.com/photo-1520523839898-50712825e617?auto=format&fit=crop&w=600&q=80',
    recommendedLenses: ['35mm f/2.0', '50mm f/1.8']
  },
  {
    id: 'plan-pe-mt',
    code: 'PE-MT',
    name: 'Entero Músico Teclado',
    category: 'ENTERO',
    description: 'Tecladista o sintetizador en acción con luces de fondo.',
    imageUrl: 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?auto=format&fit=crop&w=600&q=80',
    recommendedLenses: ['35mm f/2.0', '50mm f/1.8']
  },

  // AMERICANO (3/4)
  {
    id: 'plan-pa-a',
    code: 'PA-A',
    name: 'Americano Artista (Tres Cuartos)',
    category: 'AMERICANO',
    description: 'Desde las rodillas hasta la cabeza, ideal para gestos con las manos y presencia escénica.',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80',
    recommendedLenses: ['50mm f/1.8', '75mm f/1.8']
  },
  {
    id: 'plan-pa-b',
    code: 'PA-B',
    name: 'Americano Bailarines',
    category: 'AMERICANO',
    description: 'Plano 3/4 de bailarines destacando sincronía y atuendos.',
    imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
    recommendedLenses: ['50mm f/1.8', '75mm f/1.8']
  },

  // MEDIO
  {
    id: 'plan-pm-a',
    code: 'PM-A',
    name: 'Plano Medio Artista (Cintura hacia arriba)',
    category: 'MEDIO',
    description: 'Corte a la cintura, muestra emoción, micrófono y movimiento corporal.',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
    recommendedLenses: ['50mm f/1.8', '85mm f/1.4']
  },
  {
    id: 'plan-pmc-a',
    code: 'PMC-A',
    name: 'Plano Medio Corto Artista (Pecho)',
    category: 'MEDIO',
    description: 'Desde el pecho a la cabeza con bokeh suave de fondo.',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
    recommendedLenses: ['75mm f/1.8', '85mm f/1.4']
  },

  // PRIMER PLANO
  {
    id: 'plan-pp-a',
    code: 'PP-A',
    name: 'Primer Plano Artista (Rostro & Canto)',
    category: 'PRIMER PLANO',
    description: 'Foco total en la expresión facial, mirada y pasión interpretativa.',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    recommendedLenses: ['85mm f/1.4', '127.5mm f/1.4']
  },
  {
    id: 'plan-ppp-a',
    code: 'PPP-A',
    name: 'Primerísimo Primer Plano (Ojos / Labios)',
    category: 'PRIMER PLANO',
    description: 'Detalle íntimo de ojos o labios cantando con desenfoque cinematográfico.',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    recommendedLenses: ['85mm f/1.4', '127.5mm f/1.4']
  },

  // DETALLE
  {
    id: 'plan-pd-i',
    code: 'PD-I',
    name: 'Plano Detalle Instrumento / Cuerdas',
    category: 'DETALLE',
    description: 'Primerísimo plano a las cuerdas de la guitarra, teclas o boquilla.',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    recommendedLenses: ['85mm f/1.4', '127.5mm f/1.4']
  },
  {
    id: 'plan-pd-v',
    code: 'PD-V',
    name: 'Plano Detalle Vestuario / Joyas / Bordados',
    category: 'DETALLE',
    description: 'Bordados andinos en oro, pedrería o accesorios de alta gama.',
    imageUrl: 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=600&q=80',
    recommendedLenses: ['85mm f/1.4', '127.5mm f/1.4']
  }
];

export const INITIAL_CATALOG: VideoclipCatalog = {
  artists: [
    'Jorge Mayhua',
    'Noemi',
    'Elim Cristobal',
    'Rosita de Espinar',
    'Corazón Serrano',
    'Agrupación Fragancia'
  ],
  themes: [
    'Mix 1',
    'Tema 1',
    'Mix Cumbias del Recuerdo',
    'Huayno Sentimiento',
    'Balada Romántica'
  ],
  locations: [
    'Hacienda Vargas',
    'Locación Hco',
    'Estudio Central TCT',
    'Mirador La Cruz',
    'Casona Colonial'
  ],
  wardrobes: [
    'Ropa 1',
    'Vest2',
    'Traje de Luces',
    'Casual Urbano',
    'Elegante Dorado'
  ],
  cameraOperators: [
    'Clay Romero',
    'Luz Reyes',
    'Elim Cristobal',
    'Henry Romero',
    'Michael Romero',
    'Pedro Alva'
  ],
  lenses: INITIAL_LENSES,
  shotPlans: INITIAL_SHOT_PLANS
};

// Initial Seed Shots (Matching user screenshot 4)
export const INITIAL_SEEDED_SHOTS: VideoclipShot[] = [
  {
    id: 'shot-008',
    shotNumber: 8,
    timestamp: '2026-08-12T05:20:00.000Z',
    displayDate: '12/8/2026, 05:20',
    artist: 'Jorge Mayhua',
    theme: 'Mix 1',
    location: 'Hacienda Vargas',
    wardrobe: 'Ropa 1',
    cameraOperator: 'Clay Romero',
    lens: '10mm f/2.8',
    shotPlanCode: 'PE-BV',
    shotPlanName: 'Entero Bailarín Varón',
    shotPlanCategory: 'ENTERO',
    notes: 'Registrado por: ELITA',
    recordedBy: 'ELITA',
    status: 'ok'
  },
  {
    id: 'shot-007',
    shotNumber: 7,
    timestamp: '2026-08-12T05:19:00.000Z',
    displayDate: '12/8/2026, 05:19',
    artist: 'Jorge Mayhua',
    theme: 'Mix 1',
    location: 'Hacienda Vargas',
    wardrobe: 'Ropa 1',
    cameraOperator: 'Luz Reyes',
    lens: '15mm f/2.8',
    shotPlanCode: 'PE-MT',
    shotPlanName: 'Entero Músico Teclado',
    shotPlanCategory: 'ENTERO',
    notes: 'Registrado por: ELITA',
    recordedBy: 'ELITA',
    status: 'ok'
  },
  {
    id: 'shot-006',
    shotNumber: 6,
    timestamp: '2026-08-12T05:18:00.000Z',
    displayDate: '12/8/2026, 05:18',
    artist: 'Jorge Mayhua',
    theme: 'Mix 1',
    location: 'Hacienda Vargas',
    wardrobe: 'Ropa 1',
    cameraOperator: 'Elim Cristobal',
    lens: '85mm f/1.4',
    shotPlanCode: 'PG-AB',
    shotPlanName: 'General Artista con Bailarines',
    shotPlanCategory: 'GENERAL',
    notes: 'Registrado por: ELITA',
    recordedBy: 'ELITA',
    status: 'ok'
  },
  {
    id: 'shot-005',
    shotNumber: 5,
    timestamp: '2026-08-11T15:21:00.000Z',
    displayDate: '11/8/2026, 15:21',
    artist: 'Jorge Mayhua',
    theme: 'Mix 1',
    location: 'Hacienda Vargas',
    wardrobe: 'Ropa 1',
    cameraOperator: 'Elim Cristobal',
    lens: '15mm f/2.8',
    shotPlanCode: 'PE-GAMB',
    shotPlanName: 'Entero Grupal AMB',
    shotPlanCategory: 'ENTERO',
    notes: '',
    recordedBy: 'ELITA',
    status: 'ok'
  },
  {
    id: 'shot-004',
    shotNumber: 4,
    timestamp: '2026-08-11T15:21:00.000Z',
    displayDate: '11/8/2026, 15:21',
    artist: 'Jorge Mayhua',
    theme: 'Mix 1',
    location: 'Hacienda Vargas',
    wardrobe: 'Ropa 1',
    cameraOperator: 'Clay Romero',
    lens: '52.5mm f/2.0',
    shotPlanCode: 'PG-AMB',
    shotPlanName: 'General Artista, Músicos y Bailarines',
    shotPlanCategory: 'GENERAL',
    notes: '',
    recordedBy: 'Clay Romero',
    status: 'ok'
  },
  {
    id: 'shot-003',
    shotNumber: 3,
    timestamp: '2026-08-10T02:54:00.000Z',
    displayDate: '10/8/2026, 02:54',
    artist: 'Noemi',
    theme: 'Tema 1',
    location: 'Locación Hco',
    wardrobe: 'Vest2',
    cameraOperator: 'Clay Romero',
    lens: '10mm f/2.8',
    shotPlanCode: 'PGP',
    shotPlanName: 'Panorámico',
    shotPlanCategory: 'PANORÁMICO',
    notes: '[REGISTRO EDITADO • 11/8/2026, 3:22:25 p. m.]',
    recordedBy: 'Clay Romero',
    status: 'ok'
  },
  {
    id: 'shot-001',
    shotNumber: 1,
    timestamp: '2026-08-11T01:56:00.000Z',
    displayDate: '11/8/2026, 01:56',
    artist: 'Jorge Mayhua',
    theme: 'Mix 1',
    location: 'Hacienda Vargas',
    wardrobe: 'Ropa 1',
    cameraOperator: 'Henry Romero',
    lens: '30mm f/2.8',
    shotPlanCode: 'PE-MBJ',
    shotPlanName: 'Entero Músico Bajo',
    shotPlanCategory: 'ENTERO',
    notes: '',
    recordedBy: 'Henry Romero',
    status: 'ok'
  }
];

export const INITIAL_GOALS: VideoclipGoal[] = [
  {
    id: 'goal-1',
    title: 'Cobertura Coreográfica Completa Mix 1',
    artist: 'Jorge Mayhua',
    theme: 'Mix 1',
    targetPlanCodes: ['PG-AMB', 'PG-AB', 'PE-A', 'PE-BV', 'PE-BM', 'PP-A', 'PD-I'],
    notes: 'Asegurar primeros planos emotivos y zapateo en plano entero.',
    createdAt: '2026-08-10T10:00:00.000Z'
  }
];

// --- Local Storage Accessors ---
export const getStoredVideoclipCatalog = (): VideoclipCatalog => {
  try {
    const raw = localStorage.getItem(VIDEOCLIP_CATALOG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...INITIAL_CATALOG,
        ...parsed,
        shotPlans: (parsed.shotPlans && parsed.shotPlans.length > 0) ? parsed.shotPlans : INITIAL_SHOT_PLANS
      };
    }
  } catch (e) {
    console.error('Error loading videoclip catalog', e);
  }
  return INITIAL_CATALOG;
};

export const saveVideoclipCatalog = (catalog: VideoclipCatalog): void => {
  try {
    localStorage.setItem(VIDEOCLIP_CATALOG_KEY, JSON.stringify(catalog));
    window.dispatchEvent(new CustomEvent('tct_videoclip_catalog_updated', { detail: catalog }));
  } catch (e) {
    console.error('Error saving videoclip catalog', e);
  }
};

export const getStoredVideoclipShots = (): VideoclipShot[] => {
  try {
    const raw = localStorage.getItem(VIDEOCLIP_SHOTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading videoclip shots', e);
  }
  return INITIAL_SEEDED_SHOTS;
};

export const saveVideoclipShots = (shots: VideoclipShot[]): void => {
  try {
    localStorage.setItem(VIDEOCLIP_SHOTS_KEY, JSON.stringify(shots));
    window.dispatchEvent(new CustomEvent('tct_videoclip_shots_updated', { detail: shots }));
  } catch (e) {
    console.error('Error saving videoclip shots', e);
  }
};

export const getStoredVideoclipGoals = (): VideoclipGoal[] => {
  try {
    const raw = localStorage.getItem(VIDEOCLIP_GOALS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading videoclip goals', e);
  }
  return INITIAL_GOALS;
};

export const saveVideoclipGoals = (goals: VideoclipGoal[]): void => {
  try {
    localStorage.setItem(VIDEOCLIP_GOALS_KEY, JSON.stringify(goals));
    window.dispatchEvent(new CustomEvent('tct_videoclip_goals_updated', { detail: goals }));
  } catch (e) {
    console.error('Error saving videoclip goals', e);
  }
};

export const getNextShotNumber = (shots: VideoclipShot[]): number => {
  if (!shots || shots.length === 0) return 1;
  const maxNum = Math.max(...shots.map(s => s.shotNumber || 0), 0);
  return maxNum + 1;
};

export const formatShotNumber = (num: number): string => {
  return `#${String(num).padStart(3, '0')}`;
};
