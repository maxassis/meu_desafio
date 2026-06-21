import Feather from '@expo/vector-icons/Feather'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as Linking from 'expo-linking'
import { useFocusEffect, useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useCallback } from 'react'
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native'
import { SystemBars } from 'react-native-edge-to-edge'
import Toast from 'react-native-toast-message'
import { useSafeAreaInsets } from '@/components/uniwind-components'

import { authClient } from '@/services/auth-client'
import {
  disconnectStrava,
  fetchStravaStatus,
} from '@/services/strava-service'

export default function Connections() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['strava-status'],
    queryFn: fetchStravaStatus,
  })

  useFocusEffect(
    useCallback(() => {
      refetch()
    }, [refetch]),
  )

  const connectMutation = useMutation({
    mutationFn: async () => {
      const callbackURL = Linking.createURL('connections')
      const { data, error } = await authClient.oauth2.link({
        providerId: 'strava',
        callbackURL,
      })

      if (error) {
        throw new Error(error.message || 'Erro ao conectar Strava')
      }

      if (!data?.url) {
        throw new Error('URL de autorização do Strava não encontrada')
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, callbackURL)

      if (result.type !== 'success') {
        throw new Error('Autorização do Strava cancelada')
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['strava-status'] })
      await refetch()
      Toast.show({
        type: 'success',
        text1: 'Strava conectado',
        text2: 'Sua conta Strava foi vinculada com sucesso.',
      })
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Erro ao conectar Strava',
        text2: error instanceof Error ? error.message : 'Tente novamente.',
      })
    },
  })

  const disconnectMutation = useMutation({
    mutationFn: disconnectStrava,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['strava-status'] })
      Toast.show({
        type: 'success',
        text1: 'Strava desconectado',
        text2: 'Sua conta Strava foi desvinculada.',
      })
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Erro ao desconectar Strava',
        text2: error instanceof Error ? error.message : 'Tente novamente.',
      })
    },
  })

  function handleDisconnect() {
    Alert.alert('Desconectar Strava?', 'Você poderá conectar novamente quando quiser.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Desconectar',
        style: 'destructive',
        onPress: () => disconnectMutation.mutate(),
      },
    ])
  }

  const isPending = connectMutation.isPending || disconnectMutation.isPending

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="px-5 pb-4 pt-[28px] flex-1">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-[43px] w-[43px] rounded-full bg-bondis-text-gray justify-center items-center"
        >
          <Feather name="arrow-left" size={24} color="black" />
        </TouchableOpacity>

        <Text className="font-anton-regular text-3xl mt-8">Conexões</Text>
        <Text className="font-inter-regular text-base text-bondis-gray-dark mt-3">
          Conecte serviços externos para importar dados das suas atividades.
        </Text>

        <View className="mt-8 rounded-2xl border border-bondis-text-gray p-5">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-inter-bold text-lg">Strava</Text>
              <Text className="font-inter-regular text-sm text-bondis-gray-dark mt-1">
                {data?.connected ? 'Conta conectada' : 'Conta não conectada'}
              </Text>
            </View>

            <View className="rounded-full px-3 py-1" style={{ backgroundColor: data?.connected ? '#12FF55' : '#F2F2F2' }}>
              <Text className="font-inter-bold text-xs">
                {data?.connected ? 'Ativo' : 'Inativo'}
              </Text>
            </View>
          </View>

          {isLoading ? (
            <ActivityIndicator className="mt-6" color="#000" />
          ) : (
            <>
              {data?.athleteId && (
                <Text className="font-inter-regular text-sm text-bondis-gray-dark mt-5">
                  Athlete ID:
                  {' '}
                  {data.athleteId}
                </Text>
              )}

              <TouchableOpacity
                disabled={isPending}
                onPress={() => data?.connected ? handleDisconnect() : connectMutation.mutate()}
                className="h-[51px] rounded-full justify-center items-center mt-6"
                style={{ backgroundColor: data?.connected ? '#FFFFFF' : '#FC4C02', borderColor: '#FC4C02', borderWidth: 1 }}
              >
                {isPending ? (
                  <ActivityIndicator color={data?.connected ? '#FC4C02' : '#FFFFFF'} />
                ) : (
                  <Text className="font-inter-bold text-base" style={{ color: data?.connected ? '#FC4C02' : '#FFFFFF' }}>
                    {data?.connected ? 'Desconectar Strava' : 'Conectar Strava'}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
      <SystemBars style="dark" />
    </View>
  )
}
