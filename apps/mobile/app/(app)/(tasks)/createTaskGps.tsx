import { TrueSheet } from '@lodev09/react-native-true-sheet'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { router } from 'expo-router'
import { useRef, useState } from 'react'
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button } from '@/components/button'
import { LinearGradient } from '@/components/uniwind-components'
import { createTask } from '@/services/tasks-service'
import { useTrackerStore } from '@/store/rastreador-store'
import { convertSecondsToTimeStringWithSeconds } from '@/utils/timeUtils'
import Outdoor from '../../../assets/Outdoor.svg'
import useDesafioStore from '../../../store/desafio-store'

interface DadosTarefaGps {
  name: string
  distance: number
  environment: 'livre' | 'esteira'
  calories: number
  inscriptionId: number
  date: string | null
  duration: number
  gpsTask: boolean
  local: string | null
}

interface CreateTaskApiResponse {
  message: string
  task: DadosTarefaGps
  challengeCompleted?: boolean
}

export default function CreateTaskGps() {
  const [nomeAtividade, setNomeAtividade] = useState('')
  const queryClient = useQueryClient()
  // const { inscriptionId, desafioId } = useLocalSearchParams();
  const { distanceStore, elapsedStore, cityStore } = useTrackerStore()
  const insets = useSafeAreaInsets()
  const bottomSheetRef = useRef<TrueSheet>(null)
  const isBottomSheetOpen = useRef(false)
  const { desafioSelecionado } = useDesafioStore()

  function converterKmParaString(km: number): string {
    const kmAbsoluto: number = Math.abs(km)

    const quilometrosInteiros: number = Math.floor(kmAbsoluto)
    const metros: number = Math.round(
      (kmAbsoluto - quilometrosInteiros) * 1000,
    )

    const kmFormatado: string = String(quilometrosInteiros)

    const metrosFormatado: string = String(metros)

    return `${kmFormatado}km ${metrosFormatado}m`
  }

  function getFormattedCurrentUtcDate(): string {
    const agoraUtc = dayjs().utc()

    const dataFormatada = agoraUtc.format('YYYY-MM-DDTHH:mm:ss[Z]')

    return dataFormatada
  }

  function getFormattedCurrentDateDDMMYYYY(): string {
    const agora = dayjs()

    const dataFormatada = agora.format('DD/MM/YYYY')

    return dataFormatada
  }

  const { mutate, isPending } = useMutation<
    CreateTaskApiResponse,
    Error,
    DadosTarefaGps
  >({
    mutationFn: async (
      dadosTarefa: DadosTarefaGps,
    ): Promise<CreateTaskApiResponse> => {
      return await createTask(dadosTarefa) as unknown as CreateTaskApiResponse
    },
    onSuccess: (data: CreateTaskApiResponse) => {
      const metaAtingida = data.challengeCompleted

      // limparInputs();
      queryClient.invalidateQueries({ queryKey: ['getAllDesafios'] })
      queryClient.invalidateQueries({ queryKey: ['desafios'] })
      queryClient.invalidateQueries({ queryKey: ['routeData', desafioSelecionado?.id] })
      queryClient.invalidateQueries({ queryKey: ['rankData', desafioSelecionado?.id] })

      if (metaAtingida) {
        router.replace('/dashboard')
      }
      else {
        router.replace('/taskCreatedSuccess')
      }
    },
    onError: (erro) => {
      console.error('Erro ao criar tarefa:', erro)
    },
  })

  function confirmarDescarte() {
    bottomSheetRef.current?.present()
  }

  function criarTarefa() {
    if (isPending)
      return
    const distanceFormated = (d: number): number => {
      const num = d.toFixed(3)
      return +num
    }

    const dadosTarefa: DadosTarefaGps = {
      name: nomeAtividade,
      distance: distanceFormated(+distanceStore),
      environment: 'livre',
      calories: 200,
      inscriptionId: desafioSelecionado?.inscriptionId as number,
      date: getFormattedCurrentUtcDate(),
      duration: +elapsedStore,
      gpsTask: true,
      local: cityStore ?? '',
    }

    mutate(dadosTarefa)
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <ScrollView overScrollMode="never" keyboardShouldPersistTaps="handled">
        <Text className="text-2xl font-anton-regular mt-[38px] mx-5">
          Como foi a sua atividade?
        </Text>

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
          <Text className="text-dark-gray p-4">
            {getFormattedCurrentDateDDMMYYYY()}
          </Text>
        </View>

        <Text className="font-inter-bold text-base mt-7 mx-5">
          Duração da atividade
        </Text>
        <View className="mx-5 bg-bondis-text-gray h-[52px] mt-2 rounded-[4px]">
          <Text className="text-bondis-gray-dark p-4">
            {convertSecondsToTimeStringWithSeconds(+elapsedStore)}
          </Text>
        </View>

        <Text className="font-inter-bold text-base mt-7 mx-5">
          Distância percorrida
        </Text>
        <View className="mx-5 bg-bondis-text-gray h-[52px] mt-2 rounded-[4px]">
          <Text className="text-bondis-gray-dark p-4">
            {converterKmParaString(+distanceStore)}
          </Text>
        </View>

        <Text className="font-inter-bold text-base mt-7 mx-5">
          Calorias queimadas
        </Text>
        <View className="mx-5 bg-bondis-text-gray h-[52px] mt-2 rounded-[4px]">
          <Text className="text-bondis-gray-dark p-4"></Text>
        </View>

        <Text className="font-inter-bold text-base mt-7 mx-5">Local</Text>
        <View className="mx-5 bg-bondis-text-gray h-[52px] mt-2 rounded-[4px]">
          <Text className="text-bondis-gray-dark p-4">{cityStore ?? ''}</Text>
        </View>

        <TouchableOpacity
          className="mt-[48px] mb-[24px]"
          onPress={confirmarDescarte}
        >
          <Text className="text-bondis-alert-red text-base mx-auto font-inter-bold">
            Descartar atividade
          </Text>
        </TouchableOpacity>

        <View className="mx-5 mb-[32px]">
          <Button
            title="Cadastrar atividade"
            onPress={() => criarTarefa()}
            isLoading={isPending}
            disabled={nomeAtividade.length === 0 || isPending}
          />
        </View>
      </ScrollView>

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
              <Text className="text-base mx-auto font-inter-bold">
                Voltar
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </TrueSheet>

    </View>
  )
}
