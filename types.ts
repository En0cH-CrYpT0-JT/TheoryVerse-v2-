
export enum SimulationState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  ACTIVE = 'ACTIVE'
}

export interface SimulationParams {
  concept: string;
  variance: number;
  mode: 'SINGLE' | 'COMPARE' | 'COLLISION' | 'MERGE';
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
