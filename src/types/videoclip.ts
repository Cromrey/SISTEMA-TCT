export type ShotCategory = 
  | 'PANORÁMICO'
  | 'GENERAL'
  | 'ENTERO'
  | 'AMERICANO'
  | 'MEDIO'
  | 'PRIMER PLANO'
  | 'DETALLE';

export interface ShotPlan {
  id: string;
  code: string; // e.g. "PG-AM"
  name: string; // e.g. "General Artista con Músicos"
  category: ShotCategory;
  description?: string;
  imageUrl?: string;
  recommendedLenses?: string[];
}

export interface VideoclipShot {
  id: string;
  shotNumber: number; // 1, 2, 3... formatted as #001
  timestamp: string; // ISO date string
  displayDate: string; // "12/8/2026, 05:20"
  artist: string;
  theme: string;
  location: string;
  wardrobe: string;
  cameraOperator: string;
  lens: string;
  shotPlanCode: string;
  shotPlanName: string;
  shotPlanCategory: ShotCategory;
  notes?: string;
  recordedBy: string; // Name of active user who recorded the shot
  status?: 'ok' | 'repeat' | 'favorite' | 'alternate';
  rating?: number; // 1 to 5 stars
  durationSeconds?: number;
}

export interface VideoclipGoal {
  id: string;
  title: string;
  artist?: string;
  theme?: string;
  targetPlanCodes: string[]; // List of shot codes required for this goal
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface VideoclipCatalog {
  artists: string[];
  themes: string[];
  locations: string[];
  wardrobes: string[];
  cameraOperators: string[];
  lenses: string[];
  shotPlans: ShotPlan[];
  lensToPlanRules?: { [lens: string]: string[] };
}

export interface VideoclipFilterState {
  search: string;
  artist: string;
  theme: string;
  location: string;
  cameraOperator: string;
  lens: string;
  shotCategory: string;
  planCode: string;
  date: string;
}
