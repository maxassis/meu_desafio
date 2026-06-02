import * as Location from 'expo-location'
import React, { useEffect, useRef, useState } from 'react'
import { Alert, Button, StyleSheet, Text, View } from 'react-native'

interface SimpleLocation {
  latitude: number
  longitude: number
}

type TrackingStatus = 'idle' | 'recording' | 'paused' | 'finished'

export default function Gps() {
  const [status, setStatus] = useState<TrackingStatus>('idle')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_locations, setLocations] = useState<SimpleLocation[]>([])
  const [distance, setDistance] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [pauseTime, setPauseTime] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState<number>(0) // time in seconds
  const locationSubscription = useRef<Location.LocationSubscription | null>(null)

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permissão negada para acessar localização')
      }
    })()
  }, [])

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    if (status === 'recording') {
      timer = setInterval(() => {
        if (startTime) {
          setElapsed(Math.floor((Date.now() - startTime) / 1000))
        }
      }, 1000)
    }
    return () => {
      if (timer)
        clearInterval(timer)
    }
  }, [status, startTime])

  const startTracking = async () => {
    setStatus('recording')
    setLocations([])
    setDistance(0)
    const now = Date.now()
    setStartTime(now)
    setElapsed(0)

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Highest,
        timeInterval: 2000,
        distanceInterval: 5,
      },
      (location) => {
        const newPoint: SimpleLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }

        setLocations((prev) => {
          if (prev.length > 0) {
            const last = prev[prev.length - 1]
            const d = getDistanceFromLatLonInKm(
              last.latitude,
              last.longitude,
              newPoint.latitude,
              newPoint.longitude,
            )
            setDistance(total => total + d)
          }
          return [...prev, newPoint]
        })
      },
    )
  }

  const pauseTracking = () => {
    locationSubscription.current?.remove()
    locationSubscription.current = null
    setPauseTime(Date.now())
    setStatus('paused')
  }

  const resumeTracking = async () => {
    setStatus('recording')

    if (pauseTime && startTime) {
      const pausedDuration = Date.now() - pauseTime
      setStartTime(prev => (prev ? prev + pausedDuration : null))
    }

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Highest,
        timeInterval: 2000,
        distanceInterval: 5,
      },
      (location) => {
        const newPoint: SimpleLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }

        setLocations((prev) => {
          if (prev.length > 0) {
            const last = prev[prev.length - 1]
            const d = getDistanceFromLatLonInKm(
              last.latitude,
              last.longitude,
              newPoint.latitude,
              newPoint.longitude,
            )
            setDistance(total => total + d)
          }
          return [...prev, newPoint]
        })
      },
    )
  }

  const stopTracking = () => {
    locationSubscription.current?.remove()
    locationSubscription.current = null
    setStatus('finished')
    console.warn('Rastreamento finalizado')
  }

  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371
    const dLat = deg2rad(lat2 - lat1)
    const dLon = deg2rad(lon2 - lon1)
    const a
      = Math.sin(dLat / 2) * Math.sin(dLat / 2)
        + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2))
        * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const deg2rad = (deg: number) => deg * (Math.PI / 180)

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Distância:
        {distance.toFixed(2)}
        {' '}
        km
      </Text>
      <Text style={styles.label}>
        Tempo:
        {elapsed}
        {' '}
        s
      </Text>

      {status === 'idle' && <Button title="Iniciar" onPress={startTracking} />}
      {status === 'recording' && <Button title="Pausar" onPress={pauseTracking} />}
      {status === 'paused' && <Button title="Continuar" onPress={resumeTracking} />}
      {(status === 'recording' || status === 'paused') && (
        <Button title="Finalizar" onPress={stopTracking} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  label: {
    fontSize: 18,
    marginBottom: 12,
  },
})
