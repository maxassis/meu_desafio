import type { AllDesafios } from '@/services/api-types'
import { TrueSheet } from '@lodev09/react-native-true-sheet'
import { useQuery } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useRef } from 'react'
import {
  BackHandler,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SystemBars } from 'react-native-edge-to-edge'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from '@/components/uniwind-components'
import Left from '../../assets/arrow-left.svg'
import { fetchAllDesafios } from '../../services/desafios-service'
import useDesafioStore from '../../store/desafio-store'

export default function DesafioSelect() {
  const setDesafioSelecionado = useDesafioStore(state => state.setDesafioSelecionado)
  const { gps, strava } = useLocalSearchParams()
  const insets = useSafeAreaInsets()
  const bottomSheetRef = useRef<TrueSheet>(null)
  const isBottomSheetOpen = useRef(false)

  const {
    data: desafios,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['getAllDesafios'],
    queryFn: fetchAllDesafios,
    staleTime: 5 * 60 * 1000,
  })

  // console.log(desafios)

  const desafiosFiltrados
    = desafios?.filter(
      item => item.completed === false && item.isRegistered === true,
    ) || []

  // 🔙 Corrige o problema de "voltar nativo" não funcionar
  useEffect(() => {
    const backAction = () => {
      if (gps === 'true') {
        bottomSheetRef.current?.present()
      }
      else if (strava === 'true') {
        router.replace('/dashboard')
      }
      else {
        router.back()
      }
      return true
    }

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    )

    return () => backHandler.remove()
  }, [gps, strava])

  const handleDesafioPress = (item: AllDesafios) => {
    setDesafioSelecionado(item)

    if (gps === 'true') {
      router.push({
        pathname: '/createTaskGps',
        params: {
          inscriptionId: item.inscriptionId,
          desafioId: item.id,
        },
      })
    }
    else if (strava === 'true') {
      router.push('/stravaActivities')
    }
    else {
      router.push('/createTask')
    }
  }

  return (
    <View
      className="bg-white flex-1"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <SystemBars style="dark" />
      <View className="pt-[28px] px-5 flex-1">
        {!gps && !strava && (
          <TouchableOpacity
            onPress={() => router.push('/dashboard')}
            className="h-[43px] w-[43px] rounded-full bg-bondis-text-gray justify-center items-center mb-[10px]"
          >
            <Left />
          </TouchableOpacity>
        )}

        {gps === 'true' && (
          <TouchableOpacity
            onPress={() => bottomSheetRef.current?.present()}
            className="h-[43px] w-[43px] rounded-full bg-bondis-text-gray justify-center items-center mb-[10px]"
          >
            <Left />
          </TouchableOpacity>
        )}

        {strava === 'true' && (
          <TouchableOpacity
            onPress={() => router.replace('/dashboard')}
            className="h-[43px] w-[43px] rounded-full bg-bondis-text-gray justify-center items-center mb-[10px]"
          >
            <Left />
          </TouchableOpacity>
        )}

        <Text
          className={`text-2xl font-anton-regular mt-7 ${
            gps === 'true' ? '' : 'mb-7'
          }`}
        >
          Escolha um desafio
        </Text>

        {gps === 'true' && (
          <>
            <Text className="text-base text-bondis-gray-dark mt-4">
              Você possui
              {' '}
              <Text className="font-inter-bold">{desafiosFiltrados.length}</Text>
              {' '}
              desafios ativos!
            </Text>
            <Text className="text-base text-bondis-gray-dark mb-7">
              Escolha em qual deles deseja cadastrar sua atividade.
            </Text>
          </>
        )}

        {isLoading && (
          <Text className="text-center text-gray-500 mt-10">
            Carregando desafios...
          </Text>
        )}

        {error && (
          <Text className="text-center text-red-500 mt-10">
            Erro ao carregar desafios.
          </Text>
        )}

        {!isLoading && desafiosFiltrados.length === 0 && (
          <Text className="text-center text-gray-500 mt-10">
            Nenhum desafio disponível no momento.
          </Text>
        )}

        {desafiosFiltrados.map(item => (
          <TouchableOpacity
            key={item.id}
            onPress={() => handleDesafioPress(item)}
            className="h-[94px] flex-row items-center px-3 py-[15px] border-b border-[#D9D9D9]"
          >
            <Image
              source={{ uri: item.photo }}
              contentFit="cover"
              style={{ width: 80, height: 80, borderRadius: 6 }}
            />
            <View className="ml-5">
              <Text className="font-inter-bold text-base">{item.name}</Text>
              <Text className="font-inter-bold mt-[6.44px]">
                {(item.progressPercentage || 0).toFixed(2)}
                km
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      <TrueSheet
        ref={bottomSheetRef}
        detents={[0.33]}
        cornerRadius={20}
        backgroundColor="white"
        onDidPresent={() => { isBottomSheetOpen.current = true }}
        onDidDismiss={() => { isBottomSheetOpen.current = false }}
      >
        <View className="flex-1 z-50">
          <Text className="font-inter-bold text-base mx-5 mb-4 text-center mt-[26px]">
            Deseja descartar esta atividade?
          </Text>
          <Text className="text-center">
            Todo o progresso será perdido e não poderá ser recuperado.
          </Text>

          <TouchableOpacity
            className="mt-4"
            onPress={() => {
              if (isBottomSheetOpen.current) {
                bottomSheetRef.current?.dismiss()
              }
              router.dismissAll()
              router.replace('/dashboard')
            }}
          >
            <View className="h-[51px] justify-center items-center border-b-[0.2px] border-b-gray-400 mx-5">
              <Text className="text-bondis-alert-red text-base font-inter-bold ">
                Descartar atividade
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            if (isBottomSheetOpen.current) {
              bottomSheetRef.current?.dismiss()
            }
          }}
          >
            <View className="h-[51px] justify-center items-center">
              <Text className="text-base mx-auto font-inter-bold">Voltar</Text>
            </View>
          </TouchableOpacity>
        </View>
      </TrueSheet>
    </View>
  )
}
