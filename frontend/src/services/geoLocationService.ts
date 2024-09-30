import { Loader } from '@googlemaps/js-api-loader'
import { Position } from '@/types'
import { API_KEY } from '@/config';

let googleLoader = <Loader | null>(null);

export async function getCurrentPosition(): Promise<Position> {
  console.log('getCurrentPosition');
  return new Promise((resolve, reject) => {
    console.log('getCurrentPosition: Promise');
    if (navigator.geolocation) {
      console.log('getCurrentPosition: navigator.geolocation');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.error('Fejl ved hentning af position:', err.message);
          reject(`Fejl ved hentning af position: ${err.message}`);
        }
      );
    } else {
      console.error('Geolocation er ikke understøttet af denne browser.');
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

    await initGoogleLoader();
    // const google = await loader.load();
    // const { Geocoder } = await google.maps.importLibrary("geocoding") as google.maps.GeocodingLibrary;
    if (googleLoader === null) {
      throw new Error('Google Loader not initialized');
    }
    const { Geocoder } = await googleLoader.importLibrary("geocoding") as google.maps.GeocodingLibrary;

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