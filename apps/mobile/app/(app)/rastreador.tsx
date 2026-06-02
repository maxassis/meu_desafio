import { useQuery } from '@tanstack/react-query'
import Constants from 'expo-constants'
import * as IntentLauncher from 'expo-intent-launcher'
import * as Location from 'expo-location'
import { router } from 'expo-router'
import LottieView from 'lottie-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  AppState,
  ImageBackground,
  Linking,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SystemBars } from 'react-native-edge-to-edge'
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { BackgroundPermissionModal } from '@/components/Tracker/background_permission_modal'
import { HoldProgressButton } from '@/components/Tracker/button_anime'
import { PermissionModal } from '@/components/Tracker/permission_modal'
import fundoCinza from '../../assets/fundo-cinza.png'
import fundoPreto from '../../assets/fundo-preto.png'
import fundoVerde from '../../assets/fundo-verde.png'
import Pause from '../../assets/Pause.svg'
import Play from '../../assets/play.svg'
import useTracker from '../../hooks/useTracker'
import { fetchAllDesafios } from '../../services/desafios-service'
import useDesafioStore from '../../store/desafio-store'

export default function Rastreador() {
  const {
    status,
    elapsed,
    distance,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking,
  } = useTracker()
  const lottieRef = useRef<any>(null)
  const insets = useSafeAreaInsets()

  const [modalVisible, setModalVisible] = useState(false)
  const [foregroundPermissionModalVisible, setForegroundPermissionModalVisible] = useState(false)
  const [bgPermissionModalVisible, setBgPermissionModalVisible] = useState(false)
  const [bgPermissionWarning, setBgPermissionWarning] = useState<string | undefined>()
  const [servicesEnabled, setServicesEnabled] = useState<boolean | null>(null)
  const [permissionsGranted, setPermissionsGranted] = useState(false)
  const [showCountdown, setShowCountdown] = useState(false)
  const [countdownNumber, setCountdownNumber] = useState(3)
  const [showTooltip, setShowTooltip] = useState(false)
  const [lastKm, setLastKm] = useState(0)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
  const [splits, setSplits] = useState<number[]>([])

  const setDesafioSelecionado = useDesafioStore(
    state => state.setDesafioSelecionado,
  )

  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)
  const permissionsChecked = useRef(false)
  const foregroundModalOpenRef = useRef(false)
  const bgModalOpenRef = useRef(false)
  const permissionsGrantedRef = useRef(false)

  const isPaused = status === 'paused'

  const {
    data: desafios,
  } = useQuery({
    queryKey: ['getAllDesafios'],
    queryFn: fetchAllDesafios,
    staleTime: 5 * 60 * 1000,
  })

  const handleDecline = () => {
    setModalVisible(false)
    setForegroundPermissionModalVisible(false)
    setBgPermissionModalVisible(false)
    setBgPermissionWarning(undefined)
    router.replace('/(app)/dashboard')
  }

  const openAppSettings = async () => {
    const appPackage = Constants.expoConfig?.android?.package ?? Constants.applicationId

    if (appPackage && Platform.OS === 'android') {
      try {
        await IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
          { data: `package:${appPackage}` },
        )
        return
      }
      catch {
        await Linking.openSettings()
        return
      }
    }

    await Linking.openSettings()
  }

  const startCountdownAfterPermissions = () => {
    setPermissionsGranted(true)
    permissionsGrantedRef.current = true
    setShowCountdown(true)
  }

  const showForegroundPermissionModal = () => {
    setModalVisible(false)
    setBgPermissionModalVisible(false)
    setBgPermissionWarning(undefined)
    setForegroundPermissionModalVisible(true)
    foregroundModalOpenRef.current = true
    setPermissionsGranted(false)
    permissionsGrantedRef.current = false
    setShowCountdown(false)
  }

  const handleForegroundPermissionAccept = async () => {
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync()

      if (status !== Location.PermissionStatus.GRANTED) {
        if (!canAskAgain)
          await openAppSettings()

        return
      }

      setForegroundPermissionModalVisible(false)
      foregroundModalOpenRef.current = false

      const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync()
      if (backgroundStatus !== Location.PermissionStatus.GRANTED) {
        setBgPermissionModalVisible(true)
        setBgPermissionWarning(undefined)
        bgModalOpenRef.current = true
        return
      }

      startCountdownAfterPermissions()
    }
    catch {
      await openAppSettings()
    }
  }

  const handleForegroundPermissionDecline = () => {
    setForegroundPermissionModalVisible(false)
    foregroundModalOpenRef.current = false
    setPermissionsGranted(false)
    permissionsGrantedRef.current = false
    setShowCountdown(false)
    router.replace('/(app)/dashboard')
  }

  const handleBgPermissionAccept = async () => {
    try {
      const { status, canAskAgain } = await Location.requestBackgroundPermissionsAsync()

      if (status === Location.PermissionStatus.GRANTED) {
        setBgPermissionModalVisible(false)
        bgModalOpenRef.current = false
        setBgPermissionWarning(undefined)
        startCountdownAfterPermissions()
        return
      }

      if (!canAskAgain) {
        await openAppSettings()
        return
      }

      setBgPermissionWarning('Selecione "Permitir o tempo todo" para rastrear sua atividade com a tela bloqueada.')
    }
    catch {
      await Linking.openSettings()
    }
  }

  const handleBgPermissionDecline = () => {
    setBgPermissionModalVisible(false)
    bgModalOpenRef.current = false
    setBgPermissionWarning(undefined)
    setPermissionsGranted(false)
    permissionsGrantedRef.current = false
    setShowCountdown(false)
    router.replace('/(app)/dashboard')
  }

  const handleAccept = async () => {
    if (servicesEnabled === false) {
      if (Platform.OS === 'android') {
        try {
          await IntentLauncher.startActivityAsync(
            IntentLauncher.ActivityAction.LOCATION_SOURCE_SETTINGS,
          )
        }
        catch {
          await Linking.openSettings()
          Alert.alert(
            'Ative a localização',
            'Não foi possível abrir a tela de localização. Ative o GPS nas configurações do app.',
          )
        }
      }
      else {
        await Linking.openSettings()
      }
    }
  }

  const handlePause = () => {
    pauseTracking()
    lottieRef.current?.pause()
  }

  const handleResume = () => {
    resumeTracking()
    lottieRef.current?.play()
  }

  function pressStop() {
    // console.log('Botão pressionado!')
    setShowTooltip(true)
    setTimeout(() => setShowTooltip(false), 2000)
  }

  function longPressStop() {
    stopTracking()
    const incomplete = desafios?.filter(desafio => !desafio.completed && desafio.isRegistered) ?? []

    if (incomplete.length === 1 && incomplete[0].isRegistered) {
      const desafio = incomplete[0]
      setDesafioSelecionado(desafio)

      router.push('/createTaskGps')
    }
    else {
      router.push({ pathname: '/desafios', params: { gps: 'true' } })
    }
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, '0')
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${h}:${m}:${s}`
  }

  const calculatePace = (time: number, dist: number) => {
    if (dist <= 0)
      return '0\'00"'
    const minPerKm = time / 60 / dist
    const min = Math.floor(minPerKm)
    const sec = Math.floor((minPerKm - min) * 60)
    return `${Math.min(min, 99)}'${sec.toString().padStart(2, '0')}"`
  }

  const animatedNumberStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  const decrementCount = useCallback(() => {
    if (countdownNumber > 1) {
      setCountdownNumber(prev => prev - 1)
    }
    else {
      setShowCountdown(false)
      startTracking()
    }
  }, [countdownNumber, startTracking])

  useEffect(() => {
    let isMounted = true

    const checkLocationServices = async () => {
      const enabled = await Location.hasServicesEnabledAsync()
      if (!isMounted)
        return

      setServicesEnabled(enabled)
      setModalVisible(!enabled)

      if (enabled && !permissionsChecked.current) {
        permissionsChecked.current = true
        const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync()
        if (foregroundStatus !== Location.PermissionStatus.GRANTED) {
          showForegroundPermissionModal()
          return
        }

        const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync()
        if (backgroundStatus !== Location.PermissionStatus.GRANTED) {
          setBgPermissionModalVisible(true)
          setBgPermissionWarning(undefined)
          bgModalOpenRef.current = true
          return
        }

        startCountdownAfterPermissions()
      }
    }

    const recheckForegroundPermission = async () => {
      if (foregroundModalOpenRef.current && !permissionsGrantedRef.current) {
        const { status } = await Location.getForegroundPermissionsAsync()
        if (status !== Location.PermissionStatus.GRANTED)
          return

        setForegroundPermissionModalVisible(false)
        foregroundModalOpenRef.current = false

        const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync()
        if (backgroundStatus !== Location.PermissionStatus.GRANTED) {
          setBgPermissionModalVisible(true)
          setBgPermissionWarning(undefined)
          bgModalOpenRef.current = true
          return
        }

        startCountdownAfterPermissions()
      }
    }

    const recheckBgPermission = async () => {
      if (bgModalOpenRef.current && !permissionsGrantedRef.current) {
        const { status } = await Location.getBackgroundPermissionsAsync()
        if (status === Location.PermissionStatus.GRANTED) {
          setBgPermissionModalVisible(false)
          bgModalOpenRef.current = false
          setBgPermissionWarning(undefined)
          startCountdownAfterPermissions()
        }
      }
    }

    checkLocationServices()

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkLocationServices()
        recheckForegroundPermission()
        recheckBgPermission()
      }
    })

    return () => {
      isMounted = false
      subscription.remove()
    }
  }, [])

  useEffect(() => {
    if (showCountdown && permissionsGranted) {
      scale.value = 1
      opacity.value = 1

      scale.value = withSequence(
        withTiming(1.5, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      )

      opacity.value = withSequence(
        withTiming(1, { duration: 500 }),
        withDelay(
          500,
          withTiming(0, { duration: 500 }, (finished) => {
            if (finished)
              runOnJS(decrementCount)()
          }),
        ),
      )
    }
  }, [countdownNumber, showCountdown, permissionsGranted, decrementCount, opacity, scale])

  useEffect(() => {
    if (!showCountdown) {
      // Detect split when user passes a new integer km
      const currentKm = Math.floor(distance)
      if (currentKm > lastKm) {
        setSplits(prev => [...prev, elapsed])
        setLastKm(currentKm)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distance, elapsed, showCountdown])

  useEffect(() => {
    return () => {
      if (!showCountdown)
        stopTracking()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCountdown])

  const backgroundImage = isPaused ? fundoCinza : fundoVerde

  const paceAtual = calculatePace(elapsed, distance) // pace em tempo real
  const paceMedio = calculatePace(elapsed, distance) // pace médio igual ao atual neste caso

  if (modalVisible) {
    return (
      <PermissionModal
        visible={modalVisible}
        declineLabel="Voltar"
        onAccept={handleAccept}
        onDecline={handleDecline}
      />
    )
  }

  if (foregroundPermissionModalVisible) {
    return (
      <PermissionModal
        visible={foregroundPermissionModalVisible}
        title="Permissão de localização necessária"
        message="Autorize o acesso à localização para iniciar o rastreamento da sua atividade."
        steps={[
          {
            title: 'Permitir localização',
            description: 'Toque em "Continuar" para abrir a solicitação de permissão do sistema.',
          },
          {
            title: 'Autorizar no app',
            description: 'Permita o acesso à localização. Se o sistema não mostrar o pedido, você será direcionado para as configurações do app.',
          },
        ]}
        acceptLabel="Continuar"
        declineLabel="Voltar"
        onAccept={handleForegroundPermissionAccept}
        onDecline={handleForegroundPermissionDecline}
      />
    )
  }

  if (bgPermissionModalVisible) {
    return (
      <BackgroundPermissionModal
        visible={bgPermissionModalVisible}
        warningMessage={bgPermissionWarning}
        onAccept={handleBgPermissionAccept}
        onDecline={handleBgPermissionDecline}
      />
    )
  }

  if (!permissionsGranted) {
    return <SafeAreaView className="flex-1 bg-black" />
  }

  return showCountdown ? (
    <SafeAreaView className="flex-1 bg-black">
      <SystemBars style="light" />
      <ImageBackground source={fundoPreto} className="flex-1">
        <View className="flex-1 justify-center items-center">
          <Animated.Text
            style={[animatedNumberStyle, { color: '#74FE52' }]}
            className="font-anton-regular text-9xl leading-[300px]"
          >
            {countdownNumber}
          </Animated.Text>
        </View>
      </ImageBackground>
    </SafeAreaView>
  ) : (
    <SafeAreaView className="flex-1 text-white">
      <View className="bg-bondis-green flex-1">
        <ImageBackground
          source={backgroundImage}
          className="flex-1 px-5"
          style={{ paddingTop: insets.top + 60 }}
        >
          <LottieView
            ref={lottieRef}
            source={require('../../assets/lottie/run3.json')}
            autoPlay
            loop
            style={{
              width: 80,
              height: 80,
              alignSelf: 'center',
              marginBottom: 25,
            }}
          />

          <Text className="font-anton-regular text-[92px] text-center leading-[112px] pb-0">
            {formatTime(elapsed)}
          </Text>
          <Text className="text-center font-inter-regular text-xs text-[#00000099] relative top-[-10px]">
            Activity Time
          </Text>

          <Text className="text-[64px] text-center font-anton-regular leading-[78px] mt-[28px]">
            {distance.toFixed(2)}
          </Text>
          <Text className="text-center font-inter-regular text-xs text-[#00000099]">
            Distance (Km)
          </Text>

          <View className="flex-row justify-between mt-[28px] mx-3">
            <View className="justify-center items-center">
              <Text className="text-[36px] font-anton-regular">
                {isPaused ? paceMedio : paceAtual}
              </Text>
              <Text className="text-xs text-[#00000099]">
                {isPaused ? 'Average Pace' : 'Pace (min/km)'}
              </Text>
            </View>
            <View className="justify-center items-center">
              <Text className="text-[36px] font-anton-regular">100</Text>
              <Text className="text-xs text-[#00000099]">BPM</Text>
            </View>
            <View className="justify-center items-center">
              <Text className="text-[36px] font-anton-regular">001</Text>
              <Text className="text-xs text-[#00000099]">kcal</Text>
            </View>
          </View>

          {isPaused
            ? (
                <View className="mt-[143px] flex-row justify-between h-[90px] relative px-14">

                  <HoldProgressButton
                    onComplete={longPressStop}
                    onShortPress={pressStop}
                    duration={2000}
                    style={{
                      position: 'relative',
                      width: 90,
                      height: 90,
                      marginLeft: 'auto',
                      marginRight: 'auto',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <View className="w-4 h-4 bg-white" />
                  </HoldProgressButton>

                  <TouchableOpacity
                    onPress={handleResume}
                    className="rounded-full h-[90px] w-[90px] bg-[#74FE52] flex items-center justify-center"
                  >
                    <Play />
                  </TouchableOpacity>

                  {showTooltip && (
                    <View className="top-[-75px] right-[35px] bg-black w-[300px] flex items-center justify-center p-4 absolute rounded-md">
                      <Text className="text-white font-inter-regular text-xs">
                        Mantenha o botão
                        {' '}
                        <Text className="font-inter-bold">pressionado</Text>
                        {' '}
                        para finalizar a atividade.
                      </Text>
                    </View>
                  )}
                </View>
              )
            : (
                <TouchableOpacity
                  onPress={handlePause}
                  className="rounded-full h-[90px] w-[90px] bg-black mx-auto mt-[143px]"
                >
                  <Pause />
                </TouchableOpacity>
              )}

          {/* <HoldProgressButton
            onComplete={() => Alert.alert("Ação completa!")}
            duration={2000}
          /> */ }
        </ImageBackground>
      </View>

      <SystemBars style="dark" />

    </SafeAreaView>
  )
}
