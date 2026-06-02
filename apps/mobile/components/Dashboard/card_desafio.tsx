import { useRouter } from 'expo-router'
import { Text, TouchableOpacity, View } from 'react-native'
import { Image } from '@/components/uniwind-components'
import useDesafioStore from '@/store/desafio-store'

interface desafioProps {
  name: string
  distance: string
  progress: string
  isRegistered?: boolean
  completed?: boolean
  desafioId: string
  photo: string
  inscriptionId: number
}

function CardDesafio({
  name: desafioName,
  distance,
  progress,
  isRegistered,
  completed,
  desafioId,
  photo,
  inscriptionId,
}: desafioProps) {
  const router = useRouter()
  const { setDesafioSelecionado } = useDesafioStore()

  const handleCardPress = () => {
    if (isRegistered || completed) {
      const desafio = {
        id: desafioId,
        name: desafioName,
        distance,
        progressPercentage: +progress,
        isRegistered,
        completed,
        photo,
        inscriptionId: inscriptionId ?? 0, // Ensure inscriptionId is always a number
      }
      setDesafioSelecionado(desafio as any)
      router.push({ pathname: '/map' })
    }
    else {
      router.push({ pathname: '/buy', params: { desafioId } })
    }
  }

  const formattedProgress = () => {
    const progressNumber = Number.parseFloat(progress)
    if (progressNumber === 100) {
      return '100%'
    }
    else {
      return `${Math.trunc(progressNumber)}%`
    }
  }

  return (
    <TouchableOpacity
      onPress={handleCardPress}
      // activeOpacity={completed ? 1 : 0.9}
      className="items-center mb-4 overflow-hidden h-full mx-[15px] bg-gray-200 rounded-2xl"
    >
      <Image
        className="w-full h-full rounded-2xl"
        source={{ uri: photo }}
        contentFit="cover"
      />
      <View className="w-11/12 h-[49px] items-center flex-row p-4 rounded-xl bg-white absolute bottom-[12px]">
        <View className="">
          <Text className="font-inter-bold text-xs">{desafioName}</Text>
          <View className="flex-row items-center">
            <Text className="font-inter-bold text-xs">
              {Math.trunc(Number.parseFloat(distance))}
              km
            </Text>
            <Text className="ml-8 text-[#757575] text-xs font-inter-regular">
              {formattedProgress()}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

export { CardDesafio }
