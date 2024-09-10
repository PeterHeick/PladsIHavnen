import { Harbor, LocationMarker } from '@/types'
import { openDB, DBSchema } from 'idb'

interface MarkerDB extends DBSchema {
  markers: {
    key: string,
    value: LocationMarker
  },
  harbors: {
    key: string,
    value: Harbor
  }
}

const dbPromise = openDB<MarkerDB>('marker-store', 2, {
  upgrade(db, oldVersion, newVersion, transaction) {
    if (oldVersion < 1) {
      db.createObjectStore('markers', { keyPath: 'uuid' })
      db.createObjectStore('harbors', { keyPath: 'name' })
    }
    // If you need to add new object stores or indexes in future versions,
    // you can add more conditions here
  },
})

export async function getMarkers(): Promise<LocationMarker[]> {
  return (await dbPromise).getAll('markers')
}

export async function addMarker(marker: LocationMarker): Promise<LocationMarker> {
  const db = await dbPromise
  await db.put('markers', marker)
  return marker
}

export async function syncMarkers(markers: LocationMarker[]): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction('markers', 'readwrite')
  console.log('syncMarkers:', markers)
  await Promise.all([
    ...markers.map(m => tx.store.put(m)),
    tx.done
  ])
}

export async function getHarbor(name: string): Promise<Harbor | undefined> {
  console.log('indexedDBService.getHarbor:', name);
  const db = await dbPromise
  return db.get('harbors', name)
}

export async function addHarbor(harbor: Harbor): Promise<Harbor> {
  console.log('indexedDBService.addHarbor:', harbor);
  const db = await dbPromise
  await db.put('harbors', harbor)
  return harbor
}

export async function syncHarbor(harbors: Harbor[]): Promise<void> {
  console.log('indexedDBService.syncHarbor:', harbors);
  const db = await dbPromise
  const tx = db.transaction('harbors', 'readwrite')
  console.log('syncHarbor:', harbors)
  await Promise.all([
    ...harbors.map(h => tx.store.put(h)),
    tx.done
  ])
}

const indexedDBService = {
  getMarkers,
  addMarker,
  syncMarkers,
  getHarbor,
  addHarbor,
  syncHarbor,
}

export default indexedDBService