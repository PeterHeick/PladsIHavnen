import boatIcon from '@/assets/icons/boat.png'
import anchorIcon from '@/assets/icons/anchor.png'
import toiletIcon from '@/assets/icons/toilet.png'
import waterIcon from '@/assets/icons/water.png'
import electricityIcon from '@/assets/icons/electricity.png'
import dieselIcon from '@/assets/icons/diesel.png'
import pumpIcon from '@/assets/icons/pump.png'

export interface MarkerType {
  name: string,
  icon: string
}
export const markerTypes: MarkerType[] = [
  { name: 'Båd', icon: boatIcon },
  { name: 'Havn', icon: anchorIcon },
  { name: 'Toilet', icon: toiletIcon },
  { name: 'Vand', icon: waterIcon },
  { name: 'El', icon: electricityIcon },
  { name: 'Diesel', icon: dieselIcon },
  { name: 'Pumpe', icon: pumpIcon },
]

export const greenMarkerType: MarkerType = {
  name: 'Grøn Markør',
  icon: '',
};

export type FacilityName = Exclude<
  (typeof markerTypes)[number]['name'],
  'Båd' | 'Havn'
>;

export interface Position {
  lng: number;
  lat: number;
}

export interface LocationMarker {
  uuid: string
  position: Position;
  name: string
}

export interface MarkerState {
  markers: { [key: string]: LocationMarker };  // Ændret fra LocationMarker[] til et objekt
  visibleMarkerIds: string[];
  error: string | null;
}

export interface Harbor {
  uuid: string;
  name: string;
  position: Position;
  facilities: Record<string, any>; // JSONB feltet, afhængigt af strukturen, kan du erstatte 'Record<string, any>' med et mere specifikt interface.
}

export interface HarborState {
  harborName: string;
  harbor: Harbor | undefined;
  selectedHarbor: Harbor | undefined;
}

export interface RootState {
  globalError: string | null;
  userPosition: Position | null;
}

export interface State extends RootState {
  markers: MarkerState;
  harbors: HarborState;
}
