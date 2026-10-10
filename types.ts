
export interface Position {
  lat: number;
  lng: number;
}

export interface Satellite {
  id: string;
  pos: Position;
  color?: string; // For visual distinction
}

export interface Dish {
  id: string;
  pos: Position;
  targetSatelliteId: string; // ID of the locked satellite
}

export interface SimulationState {
  satellites: Satellite[];
  dishes: Dish[];
  activeDishId: string | null;
  isDragging: boolean;
}

export interface TrackingData {
  azimuth: number; // Degrees
  distance: number; // km
  elevation?: number; // Simulated elevation
}