import React, { useEffect } from 'react'
import { View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

const skeletonColors = {
  backgroundColor: '#e0e0e0',
  foregroundColor: '#f0f0f0',
}

function SkeletonBlock({ style, children }: { style?: any, children?: React.ReactNode }) {
  const opacity = useSharedValue(0.3)

  useEffect(() => {
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

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
}

export function AvatarSkeleton() {
  return (
    <SkeletonBlock
      style={{
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: skeletonColors.backgroundColor,
      }}
    />
  )
}

export function UserInfoSkeleton() {
  return (
    <View className="mt-[29px] items-center">
      <SkeletonBlock
        style={{
          width: 120,
          height: 24,
          borderRadius: 4,
          backgroundColor: skeletonColors.backgroundColor,
          marginBottom: 11,
        }}
      />
      <SkeletonBlock
        style={{
          width: 160,
          height: 16,
          borderRadius: 3,
          backgroundColor: skeletonColors.backgroundColor,
          marginBottom: 20,
        }}
      />
      <SkeletonBlock
        style={{
          width: 80,
          height: 16,
          borderRadius: 3,
          backgroundColor: skeletonColors.backgroundColor,
        }}
      />
    </View>
  )
}

export function StatsSkeleton() {
  return (
    <View className="flex-row justify-between h-[51px] mt-[10px] mx-4">
      <View className="items-center">
        <SkeletonBlock style={{ width: 20, height: 20, borderRadius: 3, backgroundColor: skeletonColors.backgroundColor, marginBottom: 8 }} />
        <SkeletonBlock style={{ width: 60, height: 12, borderRadius: 2, backgroundColor: skeletonColors.backgroundColor, marginBottom: 3 }} />
        <SkeletonBlock style={{ width: 40, height: 8, borderRadius: 2, backgroundColor: skeletonColors.backgroundColor }} />
      </View>
      <View className="items-center">
        <SkeletonBlock style={{ width: 20, height: 20, borderRadius: 3, backgroundColor: skeletonColors.backgroundColor, marginBottom: 8 }} />
        <SkeletonBlock style={{ width: 60, height: 12, borderRadius: 2, backgroundColor: skeletonColors.backgroundColor, marginBottom: 3 }} />
        <SkeletonBlock style={{ width: 50, height: 8, borderRadius: 2, backgroundColor: skeletonColors.backgroundColor }} />
      </View>
      <View className="items-center">
        <SkeletonBlock style={{ width: 40, height: 20, borderRadius: 3, backgroundColor: skeletonColors.backgroundColor, marginBottom: 8 }} />
        <SkeletonBlock style={{ width: 40, height: 12, borderRadius: 2, backgroundColor: skeletonColors.backgroundColor }} />
      </View>
    </View>
  )
}

export function CardDesafioSkeleton({ width = 216 }: { width?: number }) {
  return (
    <View className={`w-[${width}px] px-2`}>
      <SkeletonBlock
        style={{
          width: width - 16,
          height: 182,
          borderRadius: 12,
          backgroundColor: skeletonColors.backgroundColor,
          padding: 12,
        }}
      >
        <View style={{ width: width - 40, height: 100, borderRadius: 8, backgroundColor: skeletonColors.foregroundColor, marginBottom: 13 }} />
        <View style={{ width: width - 60, height: 16, borderRadius: 4, backgroundColor: skeletonColors.foregroundColor, marginBottom: 23 }} />
        <View style={{ width: 60, height: 12, borderRadius: 3, backgroundColor: skeletonColors.foregroundColor, marginBottom: 19 }} />
        <View style={{ width: width - 40, height: 6, borderRadius: 2, backgroundColor: skeletonColors.foregroundColor }} />
      </SkeletonBlock>
    </View>
  )
}

export function SectionTitleSkeleton({ width = 180 }: { width?: number }) {
  return (
    <SkeletonBlock
      style={{
        width,
        height: 24,
        borderRadius: 4,
        backgroundColor: skeletonColors.backgroundColor,
        marginLeft: 20,
        marginBottom: 16,
      }}
    />
  )
}
