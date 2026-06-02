import { cva } from 'class-variance-authority'
import { Image, Text, View } from 'react-native'
import { convertSecondsToTimeString } from '@/utils'
import Arrow from '../../assets/arrow.svg'

interface UserTimeProps {
  position: number
  userId: string
  userName: string
  userAvatar: string
  totalDistance: number
  totalDuration: number
  avgSpeed: number
  isCurrentUser?: boolean
}

function UserTime(data: UserTimeProps) {
  return (
    <View className={userTimeVariants({ isCurrentUser: data.isCurrentUser })}>
      <Image
        source={data.userAvatar ? { uri: data.userAvatar } : require('../../assets/user2.png')}
        className="w-[32px] h-[32px] rounded-full"
        style={{ marginRight: 10 }}
      />
      <Text className="text-xs font-inter-regular flex-1">{data.userName}</Text>
      <Text className="text-xs font-inter-regular mx-2">
        {convertSecondsToTimeString(data.totalDuration)}
      </Text>
      <Text className="text-xs font-inter-regular mx-2">
        {data.totalDistance.toFixed(2)}
        km
      </Text>
      <View className="bg-black h-[22px] px-2 py-1 rounded-xl justify-center items-center">
        <Text className="text-white font-inter-bold text-xs">
          {data.position}
          º
        </Text>
      </View>
      <Arrow />
    </View>
  )
}

const userTimeVariants = cva(
  'w-full h-[50px] flex-row items-center justify-between border-b border-[#EEEEEE] px-2',
  {
    variants: {
      isCurrentUser: {
        true: 'bg-bondis-green rounded-md',
      },
    },
  },
)

export { UserTime }
