import React from 'react'
import { View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

function SkeletonBlock({ style }: { style?: any }) {
  const opacity = useSharedValue(0.3)

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    )
  }, [opacity])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  return <Animated.View style={[style, animatedStyle]} />
}

function TaskItemSkeleton() {
  return (
    <View className="px-5 mb-4">
      <SkeletonBlock
        style={{
          width: '100%',
          height: 100,
          borderRadius: 8,
          backgroundColor: '#e0e0e0',
        }}
      />
    </View>
  )
}

export { TaskItemSkeleton }
