import { Harbor, LocationMarker } from '@/types'
import { openDB, DBSchema } from 'idb'
import markerService from './markerService'

interface MarkerDB extends DBSchema {
  markers: {
    key: string,
    value: LocationMarker
  },
  deletedMarkers: {
    key: string,
    value: LocationMarker
  },
  harbors: {
    key: string,
    value: Harbor
  }
}

const dbPromise = openDB<MarkerDB>('marker-store', 2, {
  upgrade(db) {
    db.createObjectStore('markers', { keyPath: 'uuid' })
    db.createObjectStore('deletedMarkers', { keyPath: 'uuid' })
    db.createObjectStore('harbors', { keyPath: 'name' }) 
  },
})

export async function getMarkers(): Promise<LocationMarker[]> {
  return (await dbPromise).getAll('markers')
}

export async function addMarker(marker: LocationMarker): Promise<LocationMarker> {
  const db = await dbPromise
  await db.add('markers', marker)
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

export async function deleteMarker(uuid: string): Promise<void> {
  const db = await dbPromise
  await db.delete('markers', uuid)
}

export async function markForDeletion(uuid: string): Promise<void> {
  const db = await dbPromise
  const marker = await db.get('markers', uuid)
  if (marker) {
    await db.put('deletedMarkers', marker)
    await db.delete('markers', uuid)
  }
}

export async function syncDeletedMarkers(): Promise<void> {
  const db = await dbPromise
  const deletedMarkers = await db.getAll('deletedMarkers')
  for (const marker of deletedMarkers) {
    try {
      if (marker.uuid) {
        await markerService.deleteMarker(marker.uuid)
        await db.delete('deletedMarkers', marker.uuid)
      }
    } catch (error) {
      console.error('Error syncing deleted marker:', error)
    }
  }
}

export async function getHarbor(name: string): Promise<Harbor | undefined> {
  console.log('indexedDBService.getHarbor:', name);
  const db = await dbPromise
  return db.get('harbors', name)
}

export async function addHarbor(harbors: Harbor): Promise<Harbor> {
  console.log('indexedDBService.addHarbor:', harbors);
  const db = await dbPromise
  await db.add('harbors', harbors)
  return harbors
}

export async function syncharbor(harbors: Harbor[]): Promise<void> {
  console.log('indexedDBService.syncharbor:', harbors);
  const db = await dbPromise
  const tx = db.transaction('harbors', 'readwrite')
  console.log('syncharbor:', harbors)
  await Promise.all([
    ...harbors.map(h => tx.store.put(h)),
    tx.done
  ])
}

const indexedDBService = {
  getMarkers,
  addMarker,
  syncMarkers,
  deleteMarker,
  markForDeletion,
  syncDeletedMarkers,
  getHarbor,
  addHarbor,
  syncharbor,
}

export default indexedDBService