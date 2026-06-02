import type { DateData } from 'react-native-calendars'
import type {
  KilometerMeterPickerModalRef,
} from '../../../components/Tasks/distance_picker'
import type { TimePickerModalRef } from '@/components'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cva } from 'class-variance-authority'
import dayjs from 'dayjs'
import { router } from 'expo-router'
import { useRef, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Calendar, LocaleConfig } from 'react-native-calendars'
import { SystemBars } from 'react-native-edge-to-edge'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TimePickerModal } from '@/components'
import { KeyboardAwareScrollView, LinearGradient } from '@/components/uniwind-components'
import { createTask } from '@/services/tasks-service'
import Left from '../../../assets/arrow-left.svg'
import Down from '../../../assets/down.svg'
import Indoor from '../../../assets/Indoor.svg'
import Outdoor from '../../../assets/Outdoor.svg'
import KilometerMeterPicker from '../../../components/Tasks/distance_picker'
import useDesafioStore from '../../../store/desafio-store'
import { ptBR } from '../../../utils/localeCalendar'

LocaleConfig.locales['pt-br'] = ptBR
LocaleConfig.defaultLocale = 'pt-br'

interface Distancia {
  kilometers: number
  meters: number
}

interface DadosTarefa {
  name: string
  distance: number
  environment: 'livre' | 'esteira'
  calories: number
  inscriptionId: number
  date: string | null
  duration: number
  local: string | null
}

export default function TaskCreate() {
  const [modalVisible, setModalVisible] = useState(false)
  const [ambiente, setAmbiente] = useState<'livre' | 'esteira'>('livre')
  const [distancia, setDistancia] = useState<{
    kilometers: number
    meters: number
  }>({ kilometers: 0, meters: 0 })
  const [nomeAtividade, setNomeAtividade] = useState('')
  const [calorias, setCalorias] = useState('')
  const [local, setLocal] = useState('')
  const [dia, setDia] = useState<DateData>({
    year: 0,
    month: 0,
    day: 0,
    timestamp: 0,
    dateString: dayjs().format('YYYY-MM-DD'),
  })
  const [calendario, setCalendarioVisible] = useState(false)
  const [isModalTempoVisible, setModalTempoVisible] = useState(false)
  const [tempoSelecionado, setTempoSelecionado] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const { desafioSelecionado } = useDesafioStore()
  const childRef = useRef<KilometerMeterPickerModalRef>(null)
  const timePickerRef = useRef<TimePickerModalRef>(null)
  const queryClient = useQueryClient()
  const insets = useSafeAreaInsets()

  const criarTarefaMutation = useMutation({
    mutationFn: async (dadosTarefa: DadosTarefa) => {
      return await createTask(dadosTarefa)
    },
    onSuccess: (data) => {
      limparInputs()
      queryClient.invalidateQueries({ queryKey: ['getAllDesafios'] })
      queryClient.invalidateQueries({ queryKey: ['desafios'] })
      queryClient.invalidateQueries({ queryKey: ['routeData', desafioSelecionado?.id] })
      queryClient.invalidateQueries({ queryKey: ['rankData', desafioSelecionado?.id] })

      const metaAtingida = data.challengeCompleted

      if (metaAtingida) {
        router.replace({
          pathname: '/dashboard',
        })
      }
      else {
        router.replace({
          pathname: '/taskCreatedSuccess',
        })
      }
    },
    onError: (erro) => {
      console.error('Erro ao criar tarefa:', erro)
    },
  })

  function fecharModalDistancia({ kilometers, meters }: Distancia) {
    setDistancia({ kilometers, meters })
    setModalVisible(false)
  }

  function fecharModalTempo(tempo: {
    hours: number
    minutes: number
    seconds: number
  }) {
    setTempoSelecionado(tempo)
    setModalTempoVisible(false)
  }

  const limparDistancia = () => {
    if (childRef.current) {
      childRef.current.clearDistance()
    }
  }

  function criarTarefa() {
    if (!desafioSelecionado?.inscriptionId) {
      return
    }

    const distanciaSelecionada = +`${distancia.kilometers}.${distancia.meters}`

    // Pega a hora atual (para usar tanto no caso do dia atual quanto de um dia específico)
    const agora = dayjs()

    // Se não tiver `dia`, usamos a data e hora atuais
    // Se tiver `dia`, combinamos a data dele com a hora atual
    const dataFinal = !dia
      ? agora
      : dayjs(`${dia.dateString} ${agora.format('HH:mm:ss')}`) // adiciona a hora atual à data

    const dadosTarefa: DadosTarefa = {
      name: nomeAtividade,
      distance: distanciaSelecionada,
      environment: ambiente,
      calories: +calorias,
      inscriptionId: desafioSelecionado.inscriptionId,
      date: dataFinal.toISOString(), // Formato final: "2025-05-23T14:01:07.606Z"
      duration: converterTempoParaSegundos(tempoSelecionado),
      local,
    }

    criarTarefaMutation.mutate(dadosTarefa)
  }

  function limparInputs() {
    setNomeAtividade('')
    setDistancia({ kilometers: 0, meters: 0 })
    setAmbiente('livre')
    setCalorias('')
    setLocal('')
    limparDistancia()
  }

  function converterTempoParaSegundos(tempo: {
    hours: number
    minutes: number
    seconds: number
  }): number {
    const { hours, minutes, seconds } = tempo
    return hours * 3600 + minutes * 60 + seconds
  }

  const formularioValido
    = nomeAtividade !== ''
      && (distancia.kilometers > 0 || distancia.meters > 0)
      && (tempoSelecionado.hours > 0
        || tempoSelecionado.minutes > 0
        || tempoSelecionado.seconds > 0)

  return (
    <View className="flex-1 bg-white px-5 pb-4" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <KeyboardAwareScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        enableOnAndroid={true}
      >
        <View className="mb-[10px] pt-[28px]">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-[43px] w-[43px] rounded-full bg-bondis-text-gray justify-center items-center"
          >
            <Left />
          </TouchableOpacity>
        </View>

        <Text className="text-2xl font-inter-bold mt-7">
          Como foi a sua atividade?
        </Text>

        <Text className="font-inter-bold text-base mt-7">
          Nome da atividade
        </Text>

        <TextInput
          className="bg-bondis-text-gray rounded-[4px] h-[52px] mt-2 pl-4"
          value={nomeAtividade}
          onChangeText={setNomeAtividade}
        />

        {nomeAtividade.length === 0 && (
          <Text className="mt-1 text-bondis-alert-red">Campo obrigatório</Text>
        )}

        <Text className="font-inter-bold mt-7 text-base">Ambiente</Text>
        <View className="flex-row mt-4 gap-x-4 ml-[-8px]">
          <TouchableOpacity onPress={() => setAmbiente('livre')}>
            <LinearGradient
              colors={[
                ambiente === 'livre' ? 'rgba(178, 255, 115, 0.322)' : '#fff',
                ambiente === 'livre' ? '#12FF55' : '#fff',
              ]}
              className={tipoAmbiente({
                intent: ambiente === 'livre' ? 'livre' : null,
              })}
            >
              <Outdoor />
              <Text>Ao ar livre</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setAmbiente('esteira')}>
            <LinearGradient
              colors={[
                ambiente === 'esteira' ? 'rgba(178, 255, 115, 0.322)' : '#fff',
                ambiente === 'esteira' ? '#12FF55' : '#fff',
              ]}
              className={tipoAmbiente({
                intent: ambiente === 'esteira' ? 'esteira' : null,
              })}
            >
              <Indoor />
              <Text>Esteira</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Text className="font-inter-bold text-base mt-7">Data</Text>
        <TouchableOpacity
          onPress={() => setCalendarioVisible(true)}
          className="bg-bondis-text-gray rounded-[4px] h-[52px] flex-row mt-2 items-center justify-between pr-[22px] pl-4"
        >
          <Text>{dayjs(dia.dateString).format('DD/MM/YYYY')}</Text>
          <Down />
        </TouchableOpacity>
        <Modal
          transparent={true}
          visible={calendario}
          onRequestClose={() => setCalendarioVisible(false)}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={() => setCalendarioVisible(false)}
          >
            <View className="flex-1 justify-center items-center bg-black/50">
              <Pressable>
                <View className="bg-white p-6 rounded-lg shadow-lg w-80">
                  <Calendar
                    maxDate={new Date().toISOString().split('T')[0]}
                    className="rounded-lg"
                    theme={{
                      todayTextColor: '#EB4335',
                      selectedDayTextColor: 'black',
                      selectedDayBackgroundColor: '#12FF55',
                      arrowColor: '#12FF55',
                      textMonthFontWeight: 'bold',
                    }}
                    onDayPress={(dia: DateData) => {
                      setDia(dia)
                      setCalendarioVisible(false)
                    }}
                    markedDates={{ [dia.dateString]: { selected: true } }}
                  />
                </View>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        <Text className="font-inter-bold text-base mt-7">
          Duração da atividade
        </Text>
        <TouchableOpacity
          onPress={() => setModalTempoVisible(true)}
          className="bg-bondis-text-gray rounded-[4px] h-[52px] flex-row mt-2 items-center justify-between pr-[22px] pl-4"
        >
          <Text>
            {`${tempoSelecionado.hours.toString().padStart(2, '0')
            }:${
              tempoSelecionado.minutes.toString().padStart(2, '0')
            }:${
              tempoSelecionado.seconds.toString().padStart(2, '0')}`}
            {' '}
          </Text>
          <Down />
        </TouchableOpacity>
        <TimePickerModal
          ref={timePickerRef}
          visible={isModalTempoVisible}
          onClose={fecharModalTempo}
          onlyClose={setModalTempoVisible}
        />
        {tempoSelecionado.hours === 0
          && tempoSelecionado.minutes === 0
          && tempoSelecionado.seconds === 0 && (
          <Text className="mt-1 text-bondis-alert-red">
            Campo obrigatório
          </Text>
        )}

        <Text className="font-inter-bold text-base mt-7">
          Distância percorrida
        </Text>

        <KilometerMeterPicker
          ref={childRef}
          visible={modalVisible}
          onClose={({ kilometers, meters }: Distancia) =>
            fecharModalDistancia({ kilometers, meters })}
          onlyClose={setModalVisible}
        />
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          className="bg-bondis-text-gray rounded-[4px] h-[52px] mt-2 flex-row justify-between items-center pl-4 pr-[22px]"
        >
          <Text>
            {distancia.kilometers}
            km
            {distancia.meters}
            m
          </Text>
          <Down />
        </TouchableOpacity>
        {distancia.kilometers === 0 && distancia.meters === 0 && (
          <Text className="mt-1 text-bondis-alert-red">Campo obrigatório</Text>
        )}

        <Text className="font-inter-bold text-base mt-7">
          Calorias queimadas
        </Text>
        <TextInput
          value={calorias}
          onChangeText={setCalorias}
          keyboardType="numeric"
          className="bg-bondis-text-gray rounded-[4px] h-[52px] mt-2 items-end justify-center pr-[22px] pl-4"
        />

        <Text className="font-inter-bold text-base mt-7">Local</Text>
        <TextInput
          value={local}
          onChangeText={setLocal}
          className="bg-bondis-text-gray rounded-[4px] h-[52px] mt-2 items-end justify-center pr-[22px] pl-4"
        />

        <TouchableOpacity
          onPress={() => criarTarefa()}
          className={botaoDesabilitado({
            intent:
              !formularioValido
              || criarTarefaMutation.isPending
                ? 'disabled'
                : null,
          })}
          disabled={
            !formularioValido
            || criarTarefaMutation.isPending
          }
        >
          {criarTarefaMutation.isPending ? (
            <View className="flex-row items-center gap-x-2">
              <Text className="font-inter-bold text-base">Carregando...</Text>
              <ActivityIndicator color="#000000" />
            </View>
          ) : (
            <Text className="font-inter-bold text-base">
              Cadastrar atividade
            </Text>
          )}
        </TouchableOpacity>

        {criarTarefaMutation.isError && (
          <Text className="text-bondis-alert-red font-inter-medium text-center mb-4">
            Erro ao cadastrar atividade. Tente novamente.
          </Text>
        )}
      </KeyboardAwareScrollView>

      <SystemBars style="dark" />
    </View>
  )
}

const tipoAmbiente = cva(
  'h-[37px] rounded-full justify-center items-center flex-row gap-x-[8px] border-[1px] border-[#D9D9D9] pr-4 pl-2',
  {
    variants: {
      intent: {
        livre: 'border-0',
        esteira: 'border-0',
      },
    },
  },
)

const botaoDesabilitado = cva(
  'h-[52px] flex-row bg-bondis-green mt-8 mb-[32px] rounded-full justify-center items-center',
  {
    variants: {
      intent: {
        disabled: 'opacity-50',
      },
    },
  },
)
