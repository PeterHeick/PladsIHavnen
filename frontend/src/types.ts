export interface Position {
  lng: number;
  lat: number;
}

export interface LocationMarker {
  uuid?: string
  position: Position;
  type: string
  name: string
}

export interface Harbor {
  id: number;
  name: string;
  position: Position;
  facilities: Record<string, any>; // JSONB feltet, afhængigt af strukturen, kan du erstatte 'Record<string, any>' med et mere specifikt interface.
  capacity: number;
  available_spots: number;
}

export interface RootState {
  harborName: string;
  harbor: Harbor | undefined;
  selectedHarbor: Harbor | undefined;
  userPosition: Position | null;
  markers: LocationMarker[];
  error: string | null;
}