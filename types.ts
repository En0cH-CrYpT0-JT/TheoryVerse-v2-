
export enum SimulationState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  ACTIVE = 'ACTIVE'
}

export type SourceType = 'TEXT' | 'IMAGE' | 'CAMERA' | 'URL' | 'FILE';

export interface SimulationParams {
  concept: string;
  variance: number;
  mode: 'SINGLE' | 'COMPARE' | 'COLLISION' | 'MERGE';
  sourceType: SourceType;
  mediaData?: string; // base64 or URL
  fileName?: string;
}

export interface HologramData {
  imageTexture: string;
  depthTexture: string;
}

export enum RenderMode {
  NORMAL = 'NORMAL',
  ENTER = 'ENTER',
  DIAGNOSTIC = 'DIAGNOSTIC'
}
