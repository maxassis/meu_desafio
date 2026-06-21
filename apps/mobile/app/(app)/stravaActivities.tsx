import type { StravaActivity } from '@/services/api-types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SystemBars } from 'react-native-edge-to-edge'
import { useSafeAreaInsets } from '@/components/uniwind-components'
import { fetchStravaActivities } from '@/services/strava-service'
import { importStravaActivities } from '@/services/tasks-service'
import Left from '../../assets/arrow-left.svg'
import useDesafioStore from '../../store/desafio-store'

function formatDuration(seconds: number) {
  const safeSeconds = seconds ?? 0
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}min`
  }

  return `${minutes}min`
}

const ENVIRONMENT_LABELS: Record<string, string> = {
  livre: 'Livre',
  esteira: 'Esteira',
}

export default function StravaActivities() {
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const { desafioSelecionado } = useDesafioStore()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const {
    data: activities,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['stravaActivities', desafioSelecionado?.inscriptionId],
    queryFn: () => fetchStravaActivities(desafioSelecionado!.inscriptionId),
    enabled: !!desafioSelecionado?.inscriptionId,
  })

  const selectedActivities = useMemo(
    () => activities?.filter(activity => selectedIds.includes(activity.stravaActivityId)) ?? [],
    [activities, selectedIds],
  )

  function toggleActivity(activityId: string) {
    setSelectedIds(current =>
      current.includes(activityId)
        ? current.filter(id => id !== activityId)
        : [...current, activityId],
    )
  }

  const importMutation = useMutation({
    mutationFn: () => {
      if (!desafioSelecionado?.inscriptionId) {
        throw new Error('Desafio selecionado não possui inscriptionId')
      }

      return importStravaActivities(desafioSelecionado.inscriptionId, selectedActivities)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', desafioSelecionado?.inscriptionId] })
      queryClient.invalidateQueries({ queryKey: ['getAllDesafios'] })
      queryClient.invalidateQueries({ queryKey: ['stravaActivities', desafioSelecionado?.inscriptionId] })
      queryClient.invalidateQueries({ queryKey: ['routeData', desafioSelecionado?.id] })
      queryClient.invalidateQueries({ queryKey: ['rankData', desafioSelecionado?.id] })
      Alert.alert(
        'Importação concluída',
        `${selectedActivities.length} atividade(s) importada(s) com sucesso.`,
        [
          {
            text: 'Ok',
            onPress: () => router.replace('/dashboard'),
          },
        ],
      )
    },
    onError: (err) => {
      Alert.alert(
        'Erro na importação',
        err instanceof Error ? err.message : 'Ocorreu um erro ao importar as atividades.',
      )
    },
  })

  function handleImport() {
    if (selectedActivities.length === 0) {
      Alert.alert('Selecione uma atividade', 'Escolha ao menos uma atividade do Strava para importar.')
      return
    }

    importMutation.mutate()
  }

  if (!desafioSelecionado) {
    return (
      <View className="flex-1 bg-white px-5" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <SystemBars style="dark" />
        <View className="pt-[28px]">
          <TouchableOpacity
            onPress={() => router.replace({ pathname: '/desafios', params: { strava: 'true' } })}
            className="h-[43px] w-[43px] rounded-full bg-bondis-text-gray justify-center items-center mb-[10px]"
          >
            <Left />
          </TouchableOpacity>
        </View>
        <View className="flex-1 justify-center items-center">
          <Text className="text-base text-center text-bondis-gray-dark">
            Escolha um desafio antes de importar atividades do Strava.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace({ pathname: '/desafios', params: { strava: 'true' } })}
            className="h-[52px] px-6 bg-bondis-green rounded-full justify-center items-center mt-8"
          >
            <Text className="font-inter-bold text-base">Escolher desafio</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <SystemBars style="dark" />
      <View className="px-5 pt-[28px] flex-1">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-[43px] w-[43px] rounded-full bg-bondis-text-gray justify-center items-center mb-[10px]"
        >
          <Left />
        </TouchableOpacity>

        <Text className="text-2xl font-anton-regular mt-7">
          Importar do Strava
        </Text>
        <Text className="text-base text-bondis-gray-dark mt-4">
          Escolha quais atividades deseja importar para:
        </Text>
        <Text className="text-base font-inter-bold mt-2 mb-7">
          {desafioSelecionado.name}
        </Text>

        {isLoading && (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="small" color="#12FF55" />
            <Text className="text-base text-bondis-gray-dark mt-4">
              Buscando atividades do Strava...
            </Text>
          </View>
        )}

        {isError && (
          <View className="flex-1 justify-center items-center">
            <Text className="text-base text-center text-bondis-alert-red">
              {error instanceof Error ? error.message : 'Erro ao buscar atividades do Strava'}
            </Text>
          </View>
        )}

        {!isLoading && !isError && activities?.length === 0 && (
          <View className="flex-1 justify-center items-center">
            <Text className="text-base text-center text-bondis-gray-dark">
              Nenhuma atividade encontrada no Strava.
            </Text>
          </View>
        )}

        {!isLoading && !isError && activities && activities.length > 0 && (
          <FlatList
            data={activities}
            keyExtractor={item => String(item.stravaActivityId)}
            overScrollMode="never"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 110 }}
            renderItem={({ item }: { item: StravaActivity }) => {
              const isSelected = selectedIds.includes(item.stravaActivityId)

              return (
                <TouchableOpacity
                  onPress={() => toggleActivity(item.stravaActivityId)}
                  className="min-h-[92px] flex-row items-center border-b border-[#D9D9D9] py-4"
                >
                  <View
                    className={`w-6 h-6 rounded-full border mr-4 justify-center items-center ${
                      isSelected ? 'bg-bondis-green border-bondis-green' : 'border-[#D9D9D9]'
                    }`}
                  >
                    {isSelected && <Text className="font-inter-bold text-xs">✓</Text>}
                  </View>

                  <View className="flex-1">
                    <Text className="font-inter-bold text-base">{item.name ?? 'Atividade'}</Text>
                    <Text className="text-sm text-bondis-gray-dark mt-1">
                      {(item.distance ?? 0).toFixed(2)}
                      {' '}
                      km •
                      {formatDuration(item.duration ?? 0)}
                    </Text>
                    <Text className="text-sm text-bondis-gray-dark mt-1">
                      {dayjs(item.date ?? new Date()).format('DD/MM/YYYY')}
                      {' • '}
                      {ENVIRONMENT_LABELS[item.environment] ?? item.environment}
                    </Text>
                  </View>
                </TouchableOpacity>
              )
            }}
          />
        )}
      </View>

      <View className="absolute left-0 right-0 px-5 bg-white" style={{ bottom: insets.bottom + 10 }}>
        <TouchableOpacity
          onPress={handleImport}
          disabled={selectedActivities.length === 0 || importMutation.isPending}
          className={`h-[52px] bg-bondis-green rounded-full justify-center items-center ${
            selectedActivities.length === 0 || importMutation.isPending ? 'opacity-50' : ''
          }`}
        >
          {importMutation.isPending ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text className="font-inter-bold text-base">
              Importar selecionadas (
              {selectedActivities.length}
              )
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}
