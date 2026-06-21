import type { Camera } from 'react-native-maps'
import type { Coordinate } from '@/utils/gpsFunctions'
import AntDesign from '@expo/vector-icons/AntDesign'
import Octicons from '@expo/vector-icons/Octicons'
import { useQuery } from '@tanstack/react-query'
import { cva } from 'class-variance-authority'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import { router } from 'expo-router'
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SystemBars } from 'react-native-edge-to-edge'
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
} from 'react-native-maps'
import { RankingBottomSheet } from '@/components'
// import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Image as ExpoImage } from '@/components/uniwind-components'

import { fetchRouteData } from '@/services/desafios-service'
import { fetchUserData } from '@/services/users-service'
import useDesafioStore from '@/store/desafio-store'
import {
  calculateUserDistance,
  decodePolyline,
  findPointAtDistance,
  haversine,
} from '@/utils/gpsFunctions'
import Left from '../../assets/arrow-left.svg'
import { mapStyle } from '../../styles/mapStyles'
import 'dayjs/locale/pt-br'

interface UserParticipation {
  avatar: string
  location: Coordinate
  name: string
  userId: string
  distance: number
  percentage: string
  totalTasks: number
  totalCalories: number
  totalDistanceKm: number
  lastTaskDate: string
}

type MapType = 'standard' | 'satellite' | 'hybrid'

// Constants
const MAP_EDGE_PADDING = { top: 50, right: 50, bottom: 50, left: 50 }
const ANIMATION_DURATION = 1000
const MARKERS_READY_DELAY = 1000
const MAP_LOADING_HIDE_DELAY = 700
const MAX_TILT = 60
const TILT_STEP = 15

// Styles
const userPin = cva(
  'h-[35px] w-[35px] rounded-full bg-black justify-center items-center',
  {
    variants: { intent: { user: 'bg-bondis-green h-[39px] w-[39px]' } },
  },
)

const photoUser = cva('h-[30px] w-[30px] rounded-full', {
  variants: { intent: { user: 'h-[34px] w-[34px]' } },
})

// Utility Functions
function formatPercentage(progress: number): string {
  return progress.toLocaleString('en-US', {
    minimumIntegerDigits: 2,
    maximumFractionDigits: 1,
  })
}

// Custom Hooks
function useDayjs() {
  useEffect(() => {
    dayjs.extend(relativeTime)
    dayjs.locale('pt-br')
    dayjs.extend(utc)
  }, [])
}

function useMapData(desafioId: string) {
  const routeQuery = useQuery({
    queryKey: ['routeData', desafioId],
    queryFn: () => fetchRouteData(desafioId),
    enabled: !!desafioId,
    staleTime: 30 * 60 * 1000,
  })

  const userQuery = useQuery({
    queryKey: ['userData'],
    queryFn: fetchUserData,
    staleTime: 45 * 60 * 1000,
  })

  return { routeQuery, userQuery }
}

// Main Component
export default function Map2() {
  // State
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([])
  const [mapReady, setMapReady] = useState(false)
  const [markersReady, setMarkersReady] = useState(false)
  const [userProgress, setUserProgress] = useState<number>(0)
  const [userDistance, setUserDistance] = useState<number>(0)
  const [mapLoadingVisible, setMapLoadingVisible] = useState(true)
  const [usersParticipants, setUsersParticipants] = useState<
    UserParticipation[]
  >([])
  const [mapType, setMapType] = useState<MapType>('standard')
  const [tilt, setTilt] = useState<number>(0)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_selectedUser, setSelectedUser] = useState<UserParticipation | null>(
    null,
  )

  // Refs & Store
  const mapRef = useRef<MapView>(null)
  const flatListRef = useRef<FlatList>(null)
  const mapLoadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { desafioSelecionado } = useDesafioStore()
  // const insets = useSafeAreaInsets();

  // Custom Hooks
  useDayjs()
  const { routeQuery, userQuery } = useMapData(desafioSelecionado?.id ?? '')
  const { data: routeData, isLoading, isSuccess } = routeQuery
  const { data: userConfig } = userQuery

  const coordinates = useMemo(() => {
    if (!routeData?.location)
      return []
    return decodePolyline(routeData.location)
  }, [routeData?.location])

  // Process route data and participants
  const processRouteData = useCallback(() => {
    if (!isSuccess || !routeData || !mapReady || !coordinates.length)
      return

    setRouteCoordinates(coordinates)

    const totalDistance = +routeData.distance

    const updatedParticipants = routeData.inscriptions.map((dta) => {
      const userLocation = findPointAtDistance(coordinates, Number(dta.progress))
      const userDistance = calculateUserDistance(coordinates, Number(dta.progress))
      const progressPercentage = formatPercentage(
        (userDistance / totalDistance) * 100,
      )

      if (dta.user.id === userConfig?.usersId) {
        setUserProgress(Number(progressPercentage) / 100)
        setUserDistance(Number(dta.progress))
      }

      return {
        userId: dta.user.id,
        name: dta.user.name,
        avatar: dta.user.avatar || '',
        location: userLocation || coordinates[0],
        distance: userDistance,
        percentage: progressPercentage,
        totalTasks: dta.totalTasks,
        totalCalories: dta.totalCalories,
        totalDistanceKm: dta.totalDistanceKm,
        lastTaskDate: dta.lastTaskDate,
      }
    })

    setUsersParticipants(updatedParticipants)

    // Fit map to coordinates
    mapRef.current?.fitToCoordinates(coordinates, {
      edgePadding: MAP_EDGE_PADDING,
      animated: false,
    })

    if (mapLoadingTimeoutRef.current)
      clearTimeout(mapLoadingTimeoutRef.current)

    mapLoadingTimeoutRef.current = setTimeout(() => {
      setMapLoadingVisible(false)
    }, MAP_LOADING_HIDE_DELAY)

    // Set markers ready after delay
    setTimeout(() => setMarkersReady(true), MARKERS_READY_DELAY)
  }, [isSuccess, routeData, mapReady, userConfig?.usersId, coordinates])

  useEffect(() => {
    setMapLoadingVisible(true)
    setMarkersReady(false)
  }, [routeData?.id])

  useEffect(() => {
    return () => {
      if (mapLoadingTimeoutRef.current)
        clearTimeout(mapLoadingTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    processRouteData()
  }, [processRouteData])

  // Calculate user path
  const getUserPath = useMemo(() => {
    if (!routeCoordinates.length || userDistance === 0)
      return []

    const path: Coordinate[] = []
    let traveled = 0

    for (let i = 0; i < routeCoordinates.length - 1; i++) {
      const start = routeCoordinates[i]
      const end = routeCoordinates[i + 1]
      const segmentDistance = haversine(
        start.latitude,
        start.longitude,
        end.latitude,
        end.longitude,
      )

      if (traveled + segmentDistance >= userDistance) {
        const ratio = (userDistance - traveled) / segmentDistance
        path.push(start, {
          latitude: start.latitude + (end.latitude - start.latitude) * ratio,
          longitude:
            start.longitude + (end.longitude - start.longitude) * ratio,
        })
        break
      }
      else {
        path.push(start)
        traveled += segmentDistance
      }
    }

    return path
  }, [routeCoordinates, userDistance])

  const handleMarkerPress = useCallback(
    (user: UserParticipation) => {
      setSelectedUser(user)
      const userIndex = usersParticipants.findIndex(
        p => p.userId === user.userId,
      )
      if (userIndex !== -1 && flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: userIndex,
          animated: true,
          viewPosition: 0.5, // Center the item
        })
      }
    },
    [usersParticipants],
  )

  // User markers
  const userMarkers = useMemo(() => {
    if (!routeData)
      return null

    return usersParticipants.map((user, index) => {
      const isCurrentUser = user.userId === userConfig?.usersId
      const coordinate
        = user.distance > +routeData.distance
          ? routeCoordinates[routeCoordinates.length - 1]
          : user.location

      return (
        <Marker
          key={user.userId}
          coordinate={coordinate}
          anchor={{ x: 0.5, y: 0.75 }}
          style={{
            zIndex: isCurrentUser ? 50 : index,
            elevation: isCurrentUser ? 50 : index,
          }}
          tracksViewChanges={!markersReady}
          title={`${user.name} - ${user.distance} Km`}
          onPress={() => handleMarkerPress(user)}
        >
          <View className={userPin({ intent: isCurrentUser ? 'user' : null })}>
            {user.avatar ? (
              <Image
                source={{ uri: user.avatar }}
                className={photoUser({ intent: isCurrentUser ? 'user' : null })}
              />
            ) : (
              <Image
                source={require('../../assets/user2.png')}
                className="h-[32px] w-[32px] rounded-full"
              />
            )}
          </View>
        </Marker>
      )
    })
  }, [
    usersParticipants,
    userConfig,
    routeData,
    routeCoordinates,
    markersReady,
    handleMarkerPress,
  ])

  // Map Controls
  const toggleMapType = useCallback(() => {
    setMapType((prev) => {
      switch (prev) {
        case 'standard':
          return 'satellite'
        case 'satellite':
          return 'hybrid'
        default:
          return 'standard'
      }
    })
  }, [])

  const animateCamera = useCallback((cameraParams: Partial<Camera>) => {
    mapRef.current?.animateCamera(cameraParams, {
      duration: ANIMATION_DURATION,
    })
  }, [])

  const adjustTilt = useCallback(
    (delta: number) => {
      const newTilt = Math.max(0, Math.min(tilt + delta, MAX_TILT))
      setTilt(newTilt)
      animateCamera({ pitch: newTilt })
    },
    [tilt, animateCamera],
  )

  const resetCamera = useCallback(() => {
    setTilt(0)
    animateCamera({ pitch: 0, heading: 0 })
    mapRef.current?.fitToCoordinates(routeCoordinates, {
      edgePadding: MAP_EDGE_PADDING,
      animated: true,
    })
  }, [animateCamera, routeCoordinates])

  const focusOnUser = useCallback(
    (user: UserParticipation) => {
      setSelectedUser(user)
      animateCamera({ center: user.location, pitch: 60, zoom: 16 })
    },
    [animateCamera],
  )

  const navigateBack = useCallback(() => {
    router.push('/dashboard')
  }, [])

  const formatKm = useCallback((value: number) => {
    const rounded = value.toFixed(3)
    return rounded.replace(/\.?0+$/, '')
  }, [])

  // Render user card
  const renderUserCard = useCallback(
    ({ item }: { item: UserParticipation }) => {
      // const isSelected = selectedUser?.userId === item.userId;
      return (
        <TouchableOpacity
          onPress={() => focusOnUser(item)}
          className="p-4 w-[311px] rounded-2xl bg-white"
          activeOpacity={0.7}
        >
          <View className="flex-row items-start justify-between">
            <Pressable
              onPress={() => {
                if (item.userId === userConfig?.usersId) {
                  router.push('/dashboard')
                }
                else {
                  router.push({
                    pathname: '/profile',
                    params: { userId: item.userId },
                  })
                }
              }}
              className="flex-row items-start"
              pointerEvents="box-only"
            >
              {item.avatar ? (
                <ExpoImage
                  source={{ uri: item.avatar }}
                  style={{ width: 43, height: 43, borderRadius: 100 }}
                />
              ) : (
                <Image
                  source={require('../../assets/user2.png')}
                  className="h-[43px] w-[43px] rounded-full"
                />
              )}
              <Text className="text-base font-inter-bold ml-2">
                {item.name}
              </Text>
            </Pressable>
            <Text className="text-[#707271] text-[12px]">
              {dayjs(item.lastTaskDate).utc().local().fromNow()}
            </Text>
          </View>

          <View className="flex-row w-1/3 h-[37px] items-center justify-between mt-3">
            <View className="w-full border-l-2 border-[#D1D5DA] pl-2">
              <Text className="font-inter-bold">
                {formatKm(item.totalDistanceKm)}
              </Text>
              <Text className="text-[10px] text-bondis-gray-secondary">km</Text>
            </View>
            <View className="w-full border-l-2 border-[#D1D5DA] pl-2">
              <Text className="font-inter-bold">{item.totalTasks}</Text>
              <Text className="text-[10px] text-bondis-gray-secondary">
                ATIVIDADES
              </Text>
            </View>
            <View className="w-full border-l-2 border-[#D1D5DA] pl-2">
              <Text className="font-inter-bold">{item.totalCalories}</Text>
              <Text className="text-[10px] text-bondis-gray-secondary">
                CAL. TOTAIS
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )
    },
    [focusOnUser, userConfig, formatKm],
  )

  return (
    <View className="flex-1 bg-white justify-center items-center relative">
      <MapView
        ref={mapRef}
        onMapReady={() => setMapReady(true)}
        style={{ flex: 1, width: '100%' }}
        provider={PROVIDER_GOOGLE}
        customMapStyle={mapType === 'standard' ? mapStyle : []}
        showsCompass={false}
        toolbarEnabled={false}
        zoomControlEnabled={false}
        mapType={mapType}
      >
        {/* Route Polylines */}
        {routeCoordinates.length > 0 && mapReady && (
          <>
            <Polyline
              key={`route-polyline-${routeCoordinates.length}`}
              coordinates={routeCoordinates}
              strokeWidth={4}
              strokeColor={
                Platform.OS === 'ios' ? 'rgba(0, 0, 0, 1)' : '#000000'
              }
              fillColor={Platform.OS === 'ios' ? 'rgba(0, 0, 0, 1)' : undefined}
              strokeColors={
                Platform.OS === 'ios' ? ['rgba(0, 0, 0, 1)'] : undefined
              }
              zIndex={1}
            />
            <Polyline
              key={`user-path-${getUserPath.length}`}
              coordinates={getUserPath}
              strokeWidth={2}
              strokeColor={
                Platform.OS === 'ios' ? 'rgba(18, 255, 85, 1)' : '#12FF55'
              }
              fillColor={
                Platform.OS === 'ios' ? 'rgba(18, 255, 85, 1)' : undefined
              }
              strokeColors={
                Platform.OS === 'ios' ? ['rgba(18, 255, 85, 1)'] : undefined
              }
              zIndex={2}
            />
          </>
        )}

        {/* User Markers */}
        {userMarkers}

        {/* Finish Marker */}
        {routeCoordinates.length > 0 && (
          <Marker
            key="final"
            coordinate={routeCoordinates[routeCoordinates.length - 1]}
            anchor={{ x: 0.5, y: 0.85 }}
            style={{ zIndex: 40, elevation: 40 }}
            title="Final"
            tracksViewChanges={!markersReady}
          >
            <Image
              source={require('../../assets/final-pin.png')}
              className="h-[40px] w-[40px] rounded-full"
            />
          </Marker>
        )}
      </MapView>

      {/* Control Buttons */}
      <TouchableOpacity
        onPress={navigateBack}
        className="absolute top-[40px] left-[13px] h-[43px] w-[43px] rounded-full bg-bondis-text-gray justify-center items-center"
      >
        <Left />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={toggleMapType}
        className="absolute top-[40px] right-[13px] h-[43px] w-[43px] rounded-full bg-bondis-text-gray justify-center items-center px-3"
      >
        <Octicons name="stack" size={16} color="black" />
      </TouchableOpacity>

      {/* Camera Controls */}
      <View className="absolute right-[13px] top-[100px] bg-bondis-text-gray rounded-full overflow-hidden">
        <TouchableOpacity
          onPress={() => adjustTilt(TILT_STEP)}
          className="h-[40px] w-[40px] justify-center items-center border-b border-gray-400"
        >
          <AntDesign name="arrow-up" size={16} color="black" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => adjustTilt(-TILT_STEP)}
          className="h-[40px] w-[40px] justify-center items-center border-b border-gray-400"
        >
          <AntDesign name="arrow-down" size={16} color="black" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={resetCamera}
          className="h-[40px] w-[40px] justify-center items-center"
        >
          <AntDesign name="reload" size={16} color="black" />
        </TouchableOpacity>
      </View>

      {/* Users List */}
      <View className="absolute w-full bottom-[22.5%] items-center">
        <FlatList
          ref={flatListRef}
          data={usersParticipants}
          keyExtractor={item => item.userId}
          renderItem={renderUserCard}
          horizontal
          showsHorizontalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
      </View>

      {/* Bottom Sheet */}
      <RankingBottomSheet
        routeData={routeData}
        userProgress={userProgress}
        userDistance={userDistance}
        userData={userConfig}
      />

      <SystemBars style="dark" />

      {(isLoading || mapLoadingVisible) && (
        <Modal visible transparent animationType="none" statusBarTranslucent>
          <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#12FF55" />
          </View>
        </Modal>
      )}
    </View>
  )
}
