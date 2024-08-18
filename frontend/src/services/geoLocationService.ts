import { Loader } from '@googlemaps/js-api-loader'
import { Position } from '@/types'
import { API_KEY } from '@/config';

let googleLoader = <Loader | null>(null);

export async function getCurrentPosition(): Promise<Position> {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          reject(`Fejl ved hentning af position: ${err.message}`);
        }
      );
    } else {
      reject("Geolocation er ikke understøttet af denne browser.");
    }
  });
}


export async function initGoogleLoader(): Promise<Loader> {
  if (!googleLoader) {
    googleLoader = new Loader({
      apiKey: API_KEY,
      version: "weekly",
      libraries: ["places", "maps", "geocoding"]
    });
  }
  return googleLoader;
}

export async function getCoordinatesFromAddress(address: string): Promise<Position | null> {
  console.log('getCoordinatesFromAddress:', address);
  try {

    const loader = await initGoogleLoader();
    const google = await loader!.load();
    const { Geocoder } = await google.maps.importLibrary("geocoding") as google.maps.GeocodingLibrary;

    const geocoder = new Geocoder();
    const result = await geocoder.geocode({ address });
    console.log('Geocoding result:', result);

    if (result.results && result.results.length > 0) {
      const location = result.results[0].geometry.location;
      return {
        lat: location.lat(),
        lng: location.lng()
      };
    } else {
      console.warn('Ingen resultater fundet for adressen:', address);
      return null;
    }
  } catch (error) {
    console.error('Fejl ved geocoding:', error);
    return null;
  }
}

export async function getHarborCoordinates(harborName: string): Promise<Position | null> {
  const searchQuery = `${harborName} havn`;
  
  const result = await getCoordinatesFromAddress(searchQuery);
  
  if (result) {
    console.log(`Koordinater for ${harborName}:`, result);
    return result;
  } else {
    console.log(`Kunne ikke finde koordinater for ${harborName}`);
    return null;
  }
}