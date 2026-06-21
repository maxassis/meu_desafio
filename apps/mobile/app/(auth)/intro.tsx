import {
  Inter_400Regular,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter'
import { Link, useRouter } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import React, { useCallback } from 'react'
import {
  ImageBackground,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SystemBars } from 'react-native-edge-to-edge'
import { useSafeAreaInsets } from '@/components/uniwind-components'
import Logo from '../../assets/Logo3.svg'

SplashScreen.preventAutoHideAsync()

export default function Intro() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  // eslint-disable-next-line prefer-const
  let [fontsLoaded] = useFonts({
    Inter_700Bold,
    Inter_400Regular,
  })

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  if (!fontsLoaded) {
    return null
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }} onLayout={onLayoutRootView}>
      <ImageBackground
        className="flex-1 justify-end"
        source={require('../../assets/Background.png')}
        resizeMode="cover"
      >
        <View
          className="h-[305px] mb-[79px] px-[21px] items-center"
          style={{ paddingBottom: insets.bottom }}
        >
          <Logo />

          <Text className="mt-[30px] text-base text-center">
            Olá, seja bem-vindo 👋
            {'\n'}
            Pronto para encarar um desafio
            {'\n'}
            {' '}
            épico na corrida?
          </Text>

          <TouchableOpacity
            onPress={() => router.push('/createAccount')}
            className="rounded-full bg-bondis-green h-[51px] w-full justify-center items-center mt-[31px]"
          >
            <Text className="text-base font-inter-bold">Cadastre-se</Text>
          </TouchableOpacity>

          <View className="flex-row items-center justify-center mt-4">
            <Text className="text-base">Ja é cadastrado? </Text>
            <Link href="/login" asChild>
              <Text className="font-inter-bold underline text-base">
                Entrar
              </Text>
            </Link>
          </View>
        </View>
      </ImageBackground>
      <SystemBars style="dark" />
    </View>
  )
}
