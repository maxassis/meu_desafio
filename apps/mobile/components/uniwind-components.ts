import { Image as ExpoImage } from 'expo-image'
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient'
import { KeyboardAwareScrollView as RNKeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import {
  SafeAreaView as RNSafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'

export const Image = withUniwind(ExpoImage)
export const LinearGradient = withUniwind(ExpoLinearGradient)
export const KeyboardAwareScrollView = withUniwind(RNKeyboardAwareScrollView)
export const SafeAreaView = withUniwind(RNSafeAreaView)
export { useSafeAreaInsets }
