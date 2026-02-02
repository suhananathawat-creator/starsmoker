export interface HandGestureState {
  x: number; // Normalized 0-1 (screen space)
  y: number; // Normalized 0-1 (screen space)
  isPinching: boolean;
  isDetected: boolean;
}

export interface ImageItem {
  id: string;
  url: string;
}

export type GestureMode = 'IDLE' | 'ROTATE' | 'ZOOM';
