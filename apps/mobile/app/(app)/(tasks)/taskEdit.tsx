import type { DateData } from 'react-native-calendars'
import type {
  KilometerMeterPickerModalRef,
} from '../../../components/Tasks/distance_picker'
import type { TimePickerModalRef } from '@/components'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cva } from 'class-variance-authority'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Calendar, LocaleConfig } from 'react-native-calendars'
import { TimePickerModal } from '@/components'
import { KeyboardAwareScrollView, LinearGradient, useSafeAreaInsets } from '@/components/uniwind-components'
import { checkTaskCompletion, updateTask as updateTaskRequest } from '@/services/tasks-service'
import Down from '../../../assets/down.svg'
import Left from '../../../assets/Icon-left.svg'
import Indoor from '../../../assets/Indoor.svg'
import Outdoor from '../../../assets/Outdoor.svg'
import KilometerMeterPicker from '../../../components/Tasks/distance_picker'
import useDesafioStore from '../../../store/desafio-store'
import { ptBR } from '../../../utils/localeCalendar'

dayjs.extend(utc)
LocaleConfig.locales['pt-br'] = ptBR
LocaleConfig.defaultLocale = 'pt-br'

interface Distance {
  kilometers: number
  meters: number
}

export default function TaskEdit() {
  const [modalVisible, setModalVisible] = useState(false)
  const [ambience, setAmbience] = useState<'livre' | 'esteira'>('livre')
  const [distance, setDistance] = useState<{
    kilometers: number
    meters: number
  }>({ kilometers: 0, meters: 0 })
  const [activityName, setActivityName] = useState('')
  const [calories, setCalories] = useState('')
  const [local, setLocal] = useState('')
  const { taskData, desafioSelecionado } = useDesafioStore()
  const [day, setDay] = useState<DateData>({} as DateData)
  const [initialDate, setInitialDate] = useState<any>()
  const [calendar, setCalendarVisible] = useState(false)
  const [isModalTimeVisible, setModalTimeVisible] = useState(false)
  const [selectedTime, setSelectedTime] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const timePickerRef = useRef<TimePickerModalRef>(null)
  const childRef = useRef<KilometerMeterPickerModalRef>(null)
  const queryClient = useQueryClient()
  const insets = useSafeAreaInsets()

  // Mutations
  const checkCompletionMutation = useMutation({
    mutationFn: async () => {
      return checkTaskCompletion({
        inscriptionId: taskData!.inscriptionId,
        taskId: taskData!.id,
        distance: +`${distance.kilometers}.${distance.meters}`,
      })
    },
    onSuccess: (data) => {
      if (data.willCompleteChallenge) {
        Alert.alert(
          'Atenção',
          'Ao editar esta tarefa, você concluirá o desafio. Uma vez concluído, não será mais possível adicionar nem alterar mais tarefas.',
          [
            {
              text: 'Cancelar',
              style: 'cancel',
            },
            {
              text: 'Concluir',
              onPress: () => {
                updateTask()
              },
            },
          ],
          { cancelable: true },
        )
      }
      else {
        updateTask()
      }
    },
    onError: (error) => {
      console.error('Erro ao verificar conclusão:', error)
      Alert.alert('Erro', 'Não foi possível verificar a conclusão do desafio.')
    },
  })

  const updateTaskMutation = useMutation({
    mutationFn: async () => {
      const agora = dayjs() // Hora atual do sistema
      return updateTaskRequest(taskData!.id, {
        name: activityName,
        distanceKm: +`${distance.kilometers}.${distance.meters}`,
        environment: ambience,
        date: initialDate
          ? String(taskData!.date)
          : dayjs(`${day.dateString} ${agora.format('HH:mm:ss')}`).toISOString(),
        duration: convertTimeToSeconds(selectedTime),
        local,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getAllDesafios'] })
      queryClient.invalidateQueries({ queryKey: ['routeData', desafioSelecionado?.id] })
      queryClient.invalidateQueries({ queryKey: ['rankData', desafioSelecionado?.id] })

      router.push('/taskList')
    },
    onError: (error) => {
      console.error('Erro ao atualizar tarefa:', error)
      Alert.alert('Erro', 'Não foi possível atualizar a tarefa.')
    },
  })

  function closeModalDistance({ kilometers, meters }: Distance) {
    setDistance({ kilometers, meters })
    setModalVisible(false)
  }

  function closeModalTime(time: {
    hours: number
    minutes: number
    seconds: number
  }) {
    setSelectedTime(time)
    setModalTimeVisible(false)
  }

  const ChangeDistancePicker = () => {
    if (childRef.current && taskData?.distanceKm) {
      childRef.current.changeDistance(
        +taskData.distanceKm.split('.')[0],
        +taskData.distanceKm.split('.')[1]
          ? +taskData.distanceKm.split('.')[1]
          : 0,
      )
    }
  }

  const ChangeTimePicker = () => {
    if (timePickerRef.current && taskData?.duration) {
      const timeFormated = convertSecondsToTimeString(taskData.duration)
      const [h, m, s] = timeFormated.split(':').map(Number)
      setSelectedTime({ hours: h, minutes: m, seconds: s })
      timePickerRef.current.changeTime(h, m, s)
    }
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

  function convertTimeToSeconds(time: {
    hours: number
    minutes: number
    seconds: number
  }): number {
    return time.hours * 3600 + time.minutes * 60 + time.seconds
  }

  useEffect(() => {
    if (!taskData)
      return
    setActivityName(taskData.name)
    setDistance({
      kilometers: +taskData.distanceKm.split('.')[0],
      meters: +taskData.distanceKm.split('.')[1] || 0,
    })
    setCalories(taskData.calories?.toString() ?? '')
    setLocal(taskData.local ?? '')
    setAmbience(taskData.environment === 'esteira' ? 'esteira' : 'livre')
    ChangeDistancePicker()
    setInitialDate(formatDate(`${taskData.date}`))
    initialDate
    && setDay({
      dateString: initialDate,
      day: +initialDate!.split('-')[2],
      month: +initialDate!.split('-')[1],
      year: +initialDate!.split('-')[0],
      timestamp: 0,
    })
    ChangeTimePicker()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskData])

  const isDurationValid
    = selectedTime.hours > 0
      || selectedTime.minutes > 0
      || selectedTime.seconds > 0

  const isFormValid
    = activityName !== ''
      && (distance.kilometers > 0 || distance.meters > 0)
      && isDurationValid

  function formatDate(isoDate: string): string {
    const date = dayjs(isoDate).utc()
    return date.format('YYYY-MM-DD')
  }

  function updateTask() {
    if (!taskData)
      return

    updateTaskMutation.mutate()
  }

  if (!taskData) {
    router.back()
    return null
  }

  return (
    <View
      className="flex-1 bg-white px-5 pb-4"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <KeyboardAwareScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        enableOnAndroid={true}
        keyboardOpeningTime={400}
      >
        <View className="flex-row h-[86px] pb-[14px] pt-[28px]">
          <TouchableOpacity onPress={() => router.back()}>
            <Left />
          </TouchableOpacity>
          <Text className="text-base font-inter-bold mx-auto">
            Editar atividade
          </Text>
        </View>
        <Text className="font-inter-bold text-base mt-7">Nome</Text>
        <TextInput
          className="bg-bondis-text-gray rounded-[4px] h-[52px] mt-2 pl-4"
          value={activityName}
          onChangeText={setActivityName}
        />
        {activityName.length === 0 && (
          <Text className="mt-1 text-bondis-alert-red">Campo obrigatório</Text>
        )}
        <Text className="font-inter-bold mt-7 text-base">Ambiente</Text>
        <View className="flex-row mt-4 gap-x-4 ml-[-8px]">
          <TouchableOpacity onPress={() => setAmbience('livre')}>
            <LinearGradient
              colors={[
                ambience === 'livre' ? 'rgba(178, 255, 115, 0.322)' : '#fff',
                ambience === 'livre' ? '#12FF55' : '#fff',
              ]}
              className={ambienceType({
                intent: ambience === 'livre' ? 'livre' : null,
              })}
            >
              <Outdoor />
              <Text>Ao ar livre</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setAmbience('esteira')}>
            <LinearGradient
              colors={[
                ambience === 'esteira' ? 'rgba(178, 255, 115, 0.322)' : '#fff',
                ambience === 'esteira' ? '#12FF55' : '#fff',
              ]}
              className={ambienceType({
                intent: ambience === 'esteira' ? 'esteira' : null,
              })}
            >
              <Indoor />
              <Text>Esteira</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <Text className="font-inter-bold text-base mt-7">Data</Text>
        <TouchableOpacity
          onPress={() => setCalendarVisible(true)}
          className="bg-bondis-text-gray rounded-[4px] h-[52px] flex-row mt-2 items-center justify-between pr-[22px] pl-4"
        >
          <Text>
            {initialDate
              ? dayjs(initialDate).format('DD/MM/YYYY')
              : dayjs(day.dateString).format('DD/MM/YYYY')}
          </Text>
          <Down />
        </TouchableOpacity>
        <Modal
          transparent={true}
          visible={calendar}
          onRequestClose={() => setCalendarVisible(false)}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={() => setCalendarVisible(false)}
          >
            <View className="flex-1 justify-center items-center bg-black/50">
              <Pressable>
                <View className="bg-white p-6 rounded-lg shadow-lg w-80">
                  <Calendar
                    maxDate={new Date().toISOString().split('T')[0]}
                    current=""
                    className="rounded-lg"
                    theme={{
                      todayTextColor: '#EB4335',
                      selectedDayTextColor: 'black',
                      selectedDayBackgroundColor: '#12FF55',
                      arrowColor: '#12FF55',
                      textMonthFontWeight: 'bold',
                    }}
                    onDayPress={(day: DateData) => {
                      setInitialDate('')
                      setDay(day)
                      setCalendarVisible(false)
                    }}
                    markedDates={{
                      [initialDate || day.dateString]: {
                        selected: true,
                      },
                    }}
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
          onPress={() => setModalTimeVisible(true)}
          className="bg-bondis-text-gray rounded-[4px] h-[52px] flex-row mt-2 items-center justify-between pr-[22px] pl-4"
        >
          <Text>
            {convertSecondsToTimeString(convertTimeToSeconds(selectedTime))}
          </Text>
          <Down />
        </TouchableOpacity>
        {!isDurationValid && (
          <Text className="mt-1 text-bondis-alert-red">Campo obrigatório</Text>
        )}
        <TimePickerModal
          ref={timePickerRef}
          visible={isModalTimeVisible}
          onClose={closeModalTime}
          onlyClose={setModalTimeVisible}
        />
        <Text className="font-inter-bold text-base mt-7">
          Distancia percorrida
        </Text>
        <KilometerMeterPicker
          ref={childRef}
          visible={modalVisible}
          onClose={({ kilometers, meters }: Distance) =>
            closeModalDistance({ kilometers, meters })}
          onlyClose={setModalVisible}
        />
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          className="bg-bondis-text-gray rounded-[4px] h-[52px] mt-2 flex-row justify-between items-center pl-4 pr-[22px]"
        >
          <Text>
            {distance.kilometers}
            km
            {distance.meters}
            m
          </Text>
          <Down />
        </TouchableOpacity>
        {distance.kilometers === 0 && distance.meters === 0 && (
          <Text className="mt-1 text-bondis-alert-red">Campo obrigatório</Text>
        )}
        <Text className="font-inter-bold text-base mt-7">
          Calorias queimadas
        </Text>
        <TextInput
          value={calories}
          onChangeText={setCalories}
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
          onPress={() => checkCompletionMutation.mutate()}
          disabled={
            !isFormValid
            || checkCompletionMutation.isPending
            || updateTaskMutation.isPending
          }
          className={buttonDisabled({
            intent:
              !isFormValid
              || checkCompletionMutation.isPending
              || updateTaskMutation.isPending
                ? 'disabled'
                : null,
          })}
        >
          {checkCompletionMutation.isPending || updateTaskMutation.isPending ? (
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
      </KeyboardAwareScrollView>
      <StatusBar
        backgroundColor="#000"
        barStyle="light-content"
        translucent={false}
      />
    </View>
  )
}

const ambienceType = cva(
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

const buttonDisabled = cva(
  'h-[52px] flex-row bg-bondis-green mt-8 mb-[32px] rounded-full justify-center items-center',
  {
    variants: {
      intent: {
        disabled: 'opacity-50',
      },
    },
  },
)
