// import { useState, useEffect, useRef } from "react";
// import {
//   watchPositionAsync,
//   Accuracy,
//   LocationObject,
//   reverseGeocodeAsync,
//   requestForegroundPermissionsAsync,
//   PermissionStatus,
// } from "expo-location";
// import {
//   KalmanLatitudeLongitude,
//   haversine as calcularDistanciaKm,
// } from "@/utils/gpsFunctions";
// import { useTrackerStore } from "@/store/rastreador-store";

// type Status = "idle" | "recording" | "paused";

// export default function useTracker() {
//   const [status, setStatus] = useState<Status>("idle");
//   const [elapsed, setElapsed] = useState(0);
//   const [distance, setDistance] = useState(0);
//   const [city, setCity] = useState<string | null>(null);

//   const {
//     setDistanceStore,
//     setElapsedStore,
//     setCityStore,
//     reset: resetStore,
//   } = useTrackerStore();

//   const kalman = useRef(new KalmanLatitudeLongitude({ R: 0.0001 }));
//   const lastLocation = useRef<LocationObject | null>(null);
//   const watcher = useRef<any>(null);

//   const startTime = useRef<number | null>(null);
//   const pausedTime = useRef<number>(0);
//   const pauseTimestamp = useRef<number | null>(null);

//   useEffect(() => {
//     let timer: NodeJS.Timeout | null = null;

//     if (status === "recording") {
//       timer = setInterval(() => {
//         if (startTime.current) {
//           const now = Date.now();
//           const diffInSeconds = Math.floor(
//             (now - startTime.current - pausedTime.current) / 1000
//           );
//           setElapsed(diffInSeconds);
//         }
//       }, 1000);
//     }

//     return () => {
//       if (timer) clearInterval(timer);
//     };
//   }, [status]);

//   useEffect(() => {
//     setElapsedStore(elapsed);
//   }, [elapsed]);

//   useEffect(() => {
//     setDistanceStore(distance);
//   }, [distance]);

//   useEffect(() => {
//     setCityStore(city);
//   }, [city]);

//   async function getCityFromCoords(latitude: number, longitude: number) {
//     try {
//       const results = await reverseGeocodeAsync({ latitude, longitude });
//       if (results.length > 0) {
//         const locationInfo = results[0];
//         const detectedCity =
//           locationInfo.city || locationInfo.subregion || null;
//         setCity(detectedCity);
//         // console.log("Cidade detectada:", detectedCity);
//       }
//     } catch (error) {
//       console.error("Erro ao obter cidade:", error);
//     }
//   }

//   async function startWatcher() {
//     if (!watcher.current) {
//       watcher.current = await watchPositionAsync(
//         {
//           accuracy: Accuracy.High,
//           timeInterval: 1000,
//           distanceInterval: 1,
//         },
//         async (location) => {
//           const { latitude, longitude } = location.coords;
//           // console.log("Nova posição:", latitude, longitude);

//           const filtered = kalman.current.filtrar(latitude, longitude);

//           if (lastLocation.current) {
//             const d = calcularDistanciaKm(
//               lastLocation.current.coords.latitude,
//               lastLocation.current.coords.longitude,
//               filtered.latitude,
//               filtered.longitude
//             );
//             setDistance((prev) => {
//               const newDistance = prev + d;
//               console.log("Distância acumulada:", newDistance.toFixed(3), "km");
//               return newDistance;
//             });
//           }

//           lastLocation.current = {
//             ...location,
//             coords: {
//               ...location.coords,
//               latitude: filtered.latitude,
//               longitude: filtered.longitude,
//             },
//           };

//           if (!city) {
//             await getCityFromCoords(filtered.latitude, filtered.longitude);
//           }
//         }
//       );
//     }
//   }

//   async function startTracking() {
//     console.log("Solicitando permissão de localização...");
//     const { status: permissionStatus } =
//       await requestForegroundPermissionsAsync();
//     console.log("Status da permissão:", permissionStatus);

//     if (permissionStatus !== PermissionStatus.GRANTED) {
//       // console.warn("Permissão de localização não concedida.");
//       return;
//     }

//     console.log("Iniciando tracking...");

//     if (status === "idle") {
//       setElapsed(0);
//       setDistance(0);
//       kalman.current.reset();
//       lastLocation.current = null;
//       pausedTime.current = 0;
//       pauseTimestamp.current = null;
//       startTime.current = Date.now();
//       setCity(null);
//     }

//     setStatus("recording");
//     await startWatcher();
//   }

//   function pauseTracking() {
//     if (status === "recording") {
//       // console.log("Pausando tracking...");
//       setStatus("paused");
//       pauseTimestamp.current = Date.now();

//       if (watcher.current) {
//         watcher.current.remove();
//         watcher.current = null;
//       }
//     }
//   }

//   async function resumeTracking() {
//     if (status === "paused") {
//       // console.log("Retomando tracking...");

//       if (pauseTimestamp.current) {
//         pausedTime.current += Date.now() - pauseTimestamp.current;
//         pauseTimestamp.current = null;
//       }

//       setStatus("recording");
//       await startWatcher();
//     }
//   }

//   function stopTracking() {
//     // console.log("Parando tracking...");
//     setStatus("idle");

//     if (watcher.current) {
//       watcher.current.remove();
//       watcher.current = null;
//     }

//     startTime.current = null;
//     pausedTime.current = 0;
//     pauseTimestamp.current = null;
//     lastLocation.current = null;
//     kalman.current.reset();
//   }

//   return {
//     status,
//     elapsed,
//     distance,
//     city,
//     startTracking,
//     pauseTracking,
//     resumeTracking,
//     stopTracking,
//   };
// }

import type {
  LocationObject,
} from 'expo-location'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  Accuracy,
  hasStartedLocationUpdatesAsync,
  reverseGeocodeAsync,
  startLocationUpdatesAsync,
  stopLocationUpdatesAsync,
  watchPositionAsync,
} from 'expo-location'
import * as TaskManager from 'expo-task-manager'
import { useEffect, useRef, useState } from 'react'
import { useTrackerStore } from '@/store/rastreador-store'
import {
  haversine as calcularDistanciaKm,
  KalmanLatitudeLongitude,
} from '@/utils/gpsFunctions'

type Status = 'idle' | 'recording' | 'paused'

const LOCATION_TASK_NAME = 'background-location-task'
const kalman = new KalmanLatitudeLongitude({ R: 0.0001 })

// Chave para o log de depuração
const DEBUG_LOG_KEY = 'background_location_debug_log'

// Define task para rodar em segundo plano
// console.log("TaskManager: Definindo a tarefa de localização em background.");

// Define task para rodar em segundo plano
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  // console.log("--- TAREFA DE BACKGROUND EXECUTADA ---");
  if (error) {
    // console.error("Erro no background tracking:", error);
    return
  }
  if (data) {
    const { locations } = data as any
    // console.log("Recebido em segundo plano:", locations.length, "pontos");

    try {
      // 1. Obter dados salvos
      const savedData = await AsyncStorage.getItem(LOCATION_TASK_NAME)
      let totalDistance = 0
      let lastLocation: LocationObject | null = null

      if (savedData) {
        const parsed = JSON.parse(savedData)
        totalDistance = parsed.totalDistance || 0
        lastLocation = parsed.lastLocation || null
      }

      // Obter log de depuração existente
      const existingLog = await AsyncStorage.getItem(DEBUG_LOG_KEY)
      const debugLog = existingLog ? JSON.parse(existingLog) : []

      // 2. Processar cada nova localização
      for (const location of locations) {
        const { latitude, longitude } = location.coords
        const filtered = kalman.filtrar(latitude, longitude)
        let distanceIncrement = 0

        if (lastLocation) {
          distanceIncrement = calcularDistanciaKm(
            lastLocation.coords.latitude,
            lastLocation.coords.longitude,
            filtered.latitude,
            filtered.longitude,
          )
          totalDistance += distanceIncrement
        }

        const newLastLocation: LocationObject = {
          ...location,
          coords: {
            ...location.coords,
            latitude: filtered.latitude,
            longitude: filtered.longitude,
          },
        }

        // Adicionar ao log de depuração
        debugLog.push({
          time: new Date().toISOString(),
          original: { lat: latitude, lon: longitude },
          filtered: { lat: filtered.latitude, lon: filtered.longitude },
          increment: distanceIncrement,
          total: totalDistance,
        })

        lastLocation = newLastLocation
      }

      // 3. Salvar o estado atualizado
      const dataToStore = JSON.stringify({ totalDistance, lastLocation })
      await AsyncStorage.setItem(LOCATION_TASK_NAME, dataToStore)

      // Salvar o log de depuração
      await AsyncStorage.setItem(DEBUG_LOG_KEY, JSON.stringify(debugLog))

      // console.log(`Background: Distância atualizada: ${totalDistance.toFixed(3)} km`);
    }
    catch {
      // console.error("Falha ao processar localização em background", e);
    }
  }
})

export default function useTracker() {
  const [status, setStatus] = useState<Status>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [distance, setDistance] = useState(0)
  const [city, setCity] = useState<string | null>(null)

  const {
    setDistanceStore,
    setElapsedStore,
    setCityStore,
    reset: resetStore,
  } = useTrackerStore()

  const kalman = useRef(new KalmanLatitudeLongitude({ R: 0.0001 }))
  const lastLocation = useRef<LocationObject | null>(null)
  const watcher = useRef<any>(null)

  const startTime = useRef<number | null>(null)
  const pausedTime = useRef<number>(0)
  const pauseTimestamp = useRef<number | null>(null)

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    if (status === 'recording') {
      timer = setInterval(() => {
        if (startTime.current) {
          const now = Date.now()
          const diffInSeconds = Math.floor(
            (now - startTime.current - pausedTime.current) / 1000,
          )
          setElapsed(diffInSeconds)
        }
      }, 1000)
    }

    return () => {
      if (timer)
        clearInterval(timer)
    }
  }, [status])

  useEffect(() => {
    setElapsedStore(elapsed)
  }, [elapsed, setElapsedStore])

  useEffect(() => {
    setDistanceStore(distance)
  }, [distance, setDistanceStore])

  useEffect(() => {
    setCityStore(city)
  }, [city, setCityStore])

  async function getCityFromCoords(latitude: number, longitude: number) {
    try {
      const results = await reverseGeocodeAsync({ latitude, longitude })
      if (results.length > 0) {
        const locationInfo = results[0]
        const detectedCity
          = locationInfo.city || locationInfo.subregion || null
        setCity(detectedCity)
      }
    }
    catch {
      // console.error("Erro ao obter cidade:", error);
    }
  }

  async function startWatcher() {
    if (!watcher.current) {
      watcher.current = await watchPositionAsync(
        {
          accuracy: Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        async (location) => {
          const { latitude, longitude } = location.coords
          const filtered = kalman.current.filtrar(latitude, longitude)

          if (lastLocation.current) {
            const d = calcularDistanciaKm(
              lastLocation.current.coords.latitude,
              lastLocation.current.coords.longitude,
              filtered.latitude,
              filtered.longitude,
            )
            setDistance(prev => prev + d)
          }

          lastLocation.current = {
            ...location,
            coords: {
              ...location.coords,
              latitude: filtered.latitude,
              longitude: filtered.longitude,
            },
          }

          if (!city) {
            await getCityFromCoords(filtered.latitude, filtered.longitude)
          }
        },
      )
    }
  }

  async function startBackgroundTracking() {
    // console.log("4. Tentando iniciar o rastreamento em background...");
    try {
      const hasStarted = await hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME)
      // console.log("-> A tarefa de background já foi iniciada antes?", hasStarted);
      if (!hasStarted) {
        await startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Accuracy.High,
          timeInterval: 5000, // 5 segundos para teste
          distanceInterval: 1,
          showsBackgroundLocationIndicator: true, // iOS
          foregroundService: {
            notificationTitle: 'Rastreamento ativo',
            notificationBody: 'Seu trajeto está sendo monitorado.',
          },
        })
        // console.log("5. Comando startLocationUpdatesAsync enviado com sucesso.");
      }
      else {
        // console.log("5. Tarefa de background já estava em execução.");
      }
    }
    catch {
      // console.error("!!! ERRO ao iniciar o rastreamento em background:", err);
    }
  }

  async function stopBackgroundTracking() {
    // console.log("Parando tarefa de background...");
    try {
      const hasStarted = await hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME)
      if (hasStarted) {
        await stopLocationUpdatesAsync(LOCATION_TASK_NAME)
      }
    }
    catch {
      // Task may not have been started (user denied permissions)
    }
  }

  async function startTracking() {
    if (status === 'idle') {
      // console.log("Limpando dados de tracking anteriores...");

      // Limpa o estado global do Zustand
      resetStore()

      // Limpa os dados de persistência do background task
      await AsyncStorage.removeItem(DEBUG_LOG_KEY)
      await AsyncStorage.removeItem(LOCATION_TASK_NAME)

      // Reseta o estado local do hook
      setElapsed(0)
      setDistance(0)

      // Reseta os refs de controle
      kalman.current.reset()
      lastLocation.current = null
      pausedTime.current = 0
      pauseTimestamp.current = null
      startTime.current = Date.now()
    }

    setStatus('recording')

    // inicia foreground tracking
    await startWatcher()

    // tenta iniciar também background tracking
    await startBackgroundTracking()
  }

  function pauseTracking() {
    if (status === 'recording') {
      setStatus('paused')
      pauseTimestamp.current = Date.now()

      if (watcher.current) {
        watcher.current.remove()
        watcher.current = null
      }

      stopBackgroundTracking()
    }
  }

  async function resumeTracking() {
    if (status === 'paused') {
      if (pauseTimestamp.current) {
        pausedTime.current += Date.now() - pauseTimestamp.current
        pauseTimestamp.current = null
      }

      setStatus('recording')
      await startWatcher()
      await startBackgroundTracking()
    }
  }

  function stopTracking() {
    setStatus('idle')

    if (watcher.current) {
      watcher.current.remove()
      watcher.current = null
    }

    stopBackgroundTracking()

    startTime.current = null
    pausedTime.current = 0
    pauseTimestamp.current = null
    lastLocation.current = null
    kalman.current.reset()
  }

  return {
    status,
    elapsed,
    distance,
    city,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking,
  }
}
