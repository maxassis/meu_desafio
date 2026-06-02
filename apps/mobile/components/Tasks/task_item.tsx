import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import { Text, TouchableOpacity, View } from 'react-native'
import Calendar from '../../assets/calendar.svg'
import Livre from '../../assets/livre.svg'
import Pin from '../../assets/map-pin.svg'
import RSS from '../../assets/rss.svg'
import Gear from '../../assets/settings-black.svg'
import { convertSecondsToTimeString } from '../../utils/timeUtils'

dayjs.extend(duration)
dayjs.extend(relativeTime)
dayjs.extend(utc)

export interface TaskItemProps {
  id: number
  name: string
  environment: string
  date: string | Date
  duration: number
  calories: number | null
  local: string | null
  distanceKm: string
  inscriptionId: number
  usersId: string
  gpsTask: boolean
}

export interface TaskListProps {
  task: TaskItemProps
  openModalEdit: (taskData: TaskItemProps) => void
  edit?: boolean
}

function tempoDecorrido(data: string | Date) {
  if (!data)
    return 'Data indisponível'
  const nowUTC = dayjs().utc()
  const dateUTC = dayjs(data).utc()

  return dateUTC.from(nowUTC)
}

function TaskItem({
  task,
  openModalEdit,
  edit = true,
}: TaskListProps) {
  return (
    <View className={`h-[165px] p-5 bg-white ${edit ? 'mb-4' : 'mb-0'}`}>
      <View className="flex-row w-full h-[42px]">
        <View className="h-[42px] flex-row">
          <Livre />
          <View className="ml-4 ">
            <Text className="text-base font-inter-bold">{task.name}</Text>
            <View className="flex-row">
              <View className="flex-row items-center justify-center">
                <View className="flex-row items-center gap-1">
                  <Calendar />
                  <Text className="text-bondis-gray-dark text-xs">
                    {tempoDecorrido(task.date)}
                  </Text>
                </View>

                {/* {task.gpsTask && (
                  <View className="ml-4 flex-row items-center">
                  <Pin />
                  <Text className="text-bondis-gray-dark text-xs ml-1">{task.local}</Text>
                </View>
                )} */}
              </View>
              <View className="flex-row gap-x-1 items-center justify-center ml-4">
                {task.local && <Pin />}
                <Text className="text-bondis-gray-dark text-xs ml-4">
                  {task.local ? task.local : ''}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => openModalEdit(task)}
          className="ml-auto w-[40px] h-[32px] items-end"
        >
          {edit && <Gear />}
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center gap-x-1 mt-3 none">
        {task.gpsTask && <RSS />}
        <Text className="text-xs text-bondis-gray-dark">
          {task.gpsTask ? 'Registrado em tempo real' : 'Cadastrado manualmente'}
        </Text>
      </View>

      <View className="flex-row mt-3">
        <View className="w-[98px] h-[44px] border-l-2 border-[#D1D5DA] pl-2">
          <Text className="text-[18px] font-inter-bold">{task.distanceKm}</Text>
          <Text className="text-bondis-gray-dark text-[10px]">KM</Text>
        </View>
        <View className="w-[100px] h-[44px] border-l-2 border-[#D1D5DA] pl-2">
          <Text className="text-[18px] font-inter-bold">
            {convertSecondsToTimeString(task.duration)}
          </Text>
          <Text className="text-bondis-gray-dark text-[10px]">DURAÇÃO</Text>
        </View>
        <View className="w-[98px] h-[44px] border-l-2 border-[#D1D5DA] pl-2">
          <Text className="text-[18px] font-inter-bold">{task.calories}</Text>
          <Text className="text-bondis-gray-dark text-[10px]">CAL</Text>
        </View>
      </View>
    </View>
  )
}

export { TaskItem }
