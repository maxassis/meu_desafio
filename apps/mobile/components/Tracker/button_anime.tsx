import type {
  ViewStyle,
} from 'react-native'
import React, { useRef, useState } from 'react'
import {
  TouchableOpacity,
  View,
} from 'react-native'
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

interface HoldProgressButtonProps {
  duration?: number
  onComplete: () => void
  onShortPress: () => void
  ringWidth?: number
  spacing?: number
  style?: ViewStyle
}

const HoldProgressButton: React.FC<React.PropsWithChildren<HoldProgressButtonProps>> = ({
  duration = 2000,
  onComplete,
  onShortPress,
  ringWidth = 6,
  spacing = 8,
  style,
  children,
}) => {
  const buttonSize = 90
  const totalSize = buttonSize + ringWidth * 2 + spacing * 2
  const ringRadius = (buttonSize + spacing * 2) / 2
  const circumference = 2 * Math.PI * ringRadius

  const progress = useSharedValue(0)
  const completed = useRef(false)
  const timeoutRef = useRef<any>(null)
  const [isPressed, setIsPressed] = useState(false)

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }))

  const handlePressIn = () => {
    setIsPressed(true)

    completed.current = false

    progress.value = withTiming(
      1,
      { duration, easing: Easing.linear },
      (finished) => {
        if (finished) {
          completed.current = true
          runOnJS(onComplete)()
        }
      },
    )

    timeoutRef.current = setTimeout(() => {
      if (!completed.current) {
        runOnJS(onShortPress)()
      }
    }, duration + 500)
  }

  const handlePressOut = () => {
    if (timeoutRef.current)
      clearTimeout(timeoutRef.current)

    if (!completed.current) {
      cancelAnimation(progress)
      progress.value = withTiming(0, { duration: 150 }, () => {
        runOnJS(onShortPress)()
      })
    }

    setIsPressed(false)
  }

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View style={[{ width: totalSize, height: totalSize }, style]}>
        {/* Renderiza o anel de progresso somente quando está pressionado */}
        {isPressed && (
          <Svg width={totalSize} height={totalSize}>
            <AnimatedCircle
              cx={totalSize / 2}
              cy={totalSize / 2}
              r={ringRadius}
              stroke="black"
              strokeWidth={ringWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeLinecap="round"
              animatedProps={animatedProps}
            />
          </Svg>
        )}

        <View
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: [
              { translateX: -buttonSize / 2 },
              { translateY: -buttonSize / 2 },
            ],
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            backgroundColor: 'black',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {children}
        </View>
      </View>
    </TouchableOpacity>
  )
}

export { HoldProgressButton }
