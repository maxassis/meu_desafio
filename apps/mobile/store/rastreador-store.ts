import { createWithEqualityFn as create } from 'zustand/traditional'

interface TrackerState {
  distanceStore: number
  elapsedStore: number
  cityStore: string | null
  setDistanceStore: (distance: number) => void
  setElapsedStore: (elapsed: number) => void
  setCityStore: (city: string | null) => void
  reset: () => void
}

export const useTrackerStore = create<TrackerState>(set => ({
  distanceStore: 0,
  elapsedStore: 0,
  cityStore: null,
  setDistanceStore: distanceStore => set({ distanceStore }),
  setElapsedStore: elapsedStore => set({ elapsedStore }),
  setCityStore: cityStore => set({ cityStore }),
  reset: () => set({ distanceStore: 0, elapsedStore: 0, cityStore: null }),
}))
