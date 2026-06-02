import { Image as ExpoImage } from 'expo-image'
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient'
// import { ImageBackground as RNImageBackground } from 'react-native'
import { KeyboardAwareScrollView as RNKeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { withUniwind } from 'uniwind'

export const Image = withUniwind(ExpoImage)
// export const ImageBackground = withUniwind(RNImageBackground)
export const LinearGradient = withUniwind(ExpoLinearGradient)
export const KeyboardAwareScrollView = withUniwind(RNKeyboardAwareScrollView)
