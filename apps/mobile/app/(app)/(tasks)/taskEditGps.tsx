import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cva } from 'class-variance-authority'
import dayjs from 'dayjs'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { KeyboardAwareScrollView, LinearGradient } from '@/components/uniwind-components'
import { apiClient, getErrorMessage } from '@/services/api-client'
import Left from '../../../assets/Icon-left.svg'
import Outdoor from '../../../assets/Outdoor.svg'
import useDesafioStore from '../../../store/desafio-store'

export default function CreateTaskGps() {
  const [nomeAtividade, setNomeAtividade] = useState('')
  const queryClient = useQueryClient()
  const { taskData, desafioSelecionado } = useDesafioStore()
  const insets = useSafeAreaInsets()

  useEffect(() => {
    if (taskData) {
      setNomeAtividade(taskData.name)
    }
  }, [taskData])

  function converterKmParaString(km: number): string {
    const kmAbsoluto = Math.abs(km)
    const quilometrosInteiros = Math.floor(kmAbsoluto)
    const metros = Math.round((kmAbsoluto - quilometrosInteiros) * 1000)
    return `${quilometrosInteiros}km ${metros}m`
  }

  function formatDate(isoDate: string | Date): string {
    const date = dayjs(isoDate).utc()
    return date.format('DD/MM/YYYY')
  }

  function convertSecondsToTimeString(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0',
    )}:${String(seconds).padStart(2, '0')}`
  }

  const mutation = useMutation({
    mutationFn: async () => {
      try {
        const { data } = await apiClient.patch(`/tasks/update-task/${taskData?.id}`, {
          name: nomeAtividade,
          environment: taskData?.environment,
          distanceKm: taskData ? +taskData.distanceKm : 0,
          date: taskData?.date,
          duration: taskData?.duration ? +taskData.duration : 0,
        })
        return data
      }
      catch (error) {
        throw new Error(getErrorMessage(error, 'Falha ao atualizar tarefa'))
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['desafios'] })
      queryClient.invalidateQueries({ queryKey: ['getAllDesafios'] })
      queryClient.invalidateQueries({ queryKey: ['routeData', desafioSelecionado?.id] })
      queryClient.invalidateQueries({ queryKey: ['rankData', desafioSelecionado?.id] })

      router.back()
    },
    onError: (error) => {
      console.error(error)
    },
  })

  function editRequest() {
    if (nomeAtividade.trim().length === 0) {
      Alert.alert('Erro', 'O nome da atividade é obrigatório.')
      return
    }
    mutation.mutate()
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <KeyboardAwareScrollView
        overScrollMode="never"
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
      >
        <View className="flex-row h-[86px] pt-[28px] pb-[14px] px-5">
          <TouchableOpacity onPress={() => router.back()}>
            <Left />
          </TouchableOpacity>
          <Text className="text-base font-inter-bold mx-auto">
            Editar atividade
          </Text>
        </View>

        <Text className="font-inter-bold text-base mt-7 mx-5">
          Nome da atividade
        </Text>

        <TextInput
          className="bg-bondis-text-gray rounded-[4px] h-[52px] mt-2 pl-4 mx-5"
          value={nomeAtividade}
          onChangeText={setNomeAtividade}
        />

        {nomeAtividade.length === 0 && (
          <Text className="mt-1 text-bondis-alert-red mx-5">
            Campo obrigatório
          </Text>
        )}

        <Text className="font-inter-bold mt-7 text-base mx-5">Ambiente</Text>
        <View className="flex-row mt-4 ml-6">
          <LinearGradient
            colors={['rgba(178, 255, 115, 0.322)', '#12FF55']}
            className="border-0 h-[37px] rounded-full justify-center items-center flex-row gap-x-[8px] border-[#D9D9D9] pr-4 pl-2"
          >
            <Outdoor />
            <Text>Ao ar livre</Text>
          </LinearGradient>
        </View>

        <Text className="font-inter-bold text-base mt-7 mx-5">Data</Text>
        <View className="mx-5 bg-bondis-text-gray h-[52px] mt-2 rounded-[4px]">
          <Text className="text-bondis-gray-dark p-4">
            {taskData && formatDate(taskData.date!)}
          </Text>
        </View>

        <Text className="font-inter-bold text-base mt-7 mx-5">
          Duração da atividade
        </Text>
        <View className="mx-5 bg-bondis-text-gray h-[52px] mt-2 rounded-[4px]">
          <Text className="text-bondis-gray-dark p-4">
            {taskData && convertSecondsToTimeString(taskData.duration)}
          </Text>
        </View>

        <Text className="font-inter-bold text-base mt-7 mx-5">
          Distância percorrida
        </Text>
        <View className="mx-5 bg-bondis-text-gray h-[52px] mt-2 rounded-[4px]">
          <Text className="text-bondis-gray-dark p-4">
            {taskData && taskData.distanceKm !== undefined
              ? converterKmParaString(+taskData.distanceKm)
              : '0km'}
          </Text>
        </View>

        <Text className="font-inter-bold text-base mt-7 mx-5">
          Calorias queimadas
        </Text>
        <View className="mx-5 bg-bondis-text-gray h-[52px] mt-2 rounded-[4px]">
          <Text className="text-bondis-gray-dark p-4">
            {taskData?.calories}
          </Text>
        </View>

        <Text className="font-inter-bold text-base mt-7 mx-5">Local</Text>
        <View className="mx-5 bg-bondis-text-gray h-[52px] mt-2 rounded-[4px]">
          <Text className="text-bondis-gray-dark p-4">{taskData?.local}</Text>
        </View>

        <Pressable
          onPress={editRequest}
          className={botaoDesabilitado({
            intent:
              nomeAtividade.length === 0 || mutation.isPending ? 'disabled' : null,
          })}
          disabled={nomeAtividade.length === 0 || mutation.isPending}
        >
          {mutation.isPending ? (
            <View className="flex-row items-center gap-x-2">
              <Text className="font-inter-bold text-base">Carregando...</Text>
              <ActivityIndicator color="#000000" />
            </View>
          ) : (
            <Text className="font-inter-bold text-base">
              Cadastrar atividade
            </Text>
          )}
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  )
}

const botaoDesabilitado = cva(
  'h-[52px] flex-row bg-bondis-green mt-8 mb-[32px] rounded-full justify-center items-center mx-5',
  {
    variants: {
      intent: {
        disabled: 'opacity-50 pointer-events-none',
      },
    },
  },
)
