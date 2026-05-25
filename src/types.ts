export interface FaceShapeAnalysis {
  faceShape: string;
  confidence: number;
  analysis: {
    description: string;
    features: string[];
    ratioExplanation: string;
  };
  hairstyles: RecommendedHairstyle[];
  colors: RecommendedColor[];
  stylistAdvice: string;
}

export interface RecommendedHairstyle {
  id: string;
  name: string;
  tag: string;
  suitabilityScore: number;
  description: string;
  whyItFits: string;
  stylingTips: string;
  tryonPresetId: string; // bob, french_waves, cloud_perm, japanese_layered, classic_undercut, curtain_bangs
}

export interface RecommendedColor {
  name: string;
  hex: string;
  description: string;
  whyItFits: string;
}

export interface TryonControlState {
  scale: number;
  rotate: number;
  offsetX: number;
  offsetY: number;
  flipX: boolean;
  color: string;
  opacity: number;
  intensity: number; // 0.1 to 1 for coloring blend
}

export type HairstylePresetId = 'bob' | 'french_waves' | 'cloud_perm' | 'japanese_layered' | 'classic_undercut' | 'curtain_bangs' | 'pixie_cut' | 'wolf_cut' | 'airy_bangs_long';

export interface HairstylePreset {
  id: HairstylePresetId;
  name: string;
  category: string;
  svgPath: string; // custom design paths for overlays
  defaultScale: number;
  defaultYOffset: number; // to align with forehead/scalp
}
