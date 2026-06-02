import type {
  NativeSyntheticEvent,
  TextInputChangeEventData,
} from 'react-native'
import { cva } from 'class-variance-authority'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getErrorMessage } from '@/services/api-client'
import { authClient } from '@/services/auth-client'
import CheckGreen from '../../../assets/check-green.svg'
import Close from '../../../assets/Close.svg'
import Logo from '../../../assets/logo2.svg'

interface Criteria {
  length: boolean
  uppercase: boolean
  lowercase: boolean
  number: boolean
  specialChar: boolean
}

export default function RecoveryCreatePassword() {
  const router = useRouter()
  const { email, otp } = useLocalSearchParams()
  const [password, setPassword] = useState<string>('')
  const [password2, setPassword2] = useState<string>('')
  const [criteria, setCriteria] = useState<Criteria>({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  })
  const insets = useSafeAreaInsets()

  const validatePassword = (text: string): void => {
    const length = text.length >= 8
    const uppercase = /[A-Z]/.test(text)
    const lowercase = /[a-z]/.test(text)
    const number = /\d/.test(text)
    const specialChar = /[!@#$%^&*(),.?":{}|<>]/.test(text)

    setCriteria({
      length,
      uppercase,
      lowercase,
      number,
      specialChar,
    })

    setPassword(text)
  }

  const handleTextChange = (
    event: NativeSyntheticEvent<TextInputChangeEventData>,
  ): void => {
    validatePassword(event.nativeEvent.text)
  }

  async function reqCreatePassword() {
    if (password !== password2)
      return

    try {
      const { error } = await authClient.emailOtp.resetPassword({
        email: String(email),
        otp: String(otp),
        password,
      })

      if (error) {
        const isInvalidOtp = error.code === 'INVALID_OTP' || error.message?.toLowerCase().includes('otp')
        Alert.alert(
          'Erro',
          isInvalidOtp
            ? 'Código incorreto ou expirado. Volte e solicite um novo.'
            : error.message || 'Erro ao alterar a senha',
        )
        return
      }

      router.push('/recoveryDone')
    }
    catch (err) {
      const message = getErrorMessage(err, 'Erro ao alterar a senha')
      Alert.alert('Erro', message)
    }
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-white" behavior="padding">
      <ScrollView className="flex-1 bg-white" overScrollMode="never">
        <View className="flex-1 bg-white " style={{ paddingTop: insets.top }}>
          <View className="px-5 pt-[28px]">
            <View className="items-end mb-[10px]">
              <TouchableOpacity
                onPress={() => router.replace('/login')}
                className="h-[43px] w-[43px] rounded-full bg-bondis-text-gray justify-center items-center"
              >
                <Close />
              </TouchableOpacity>
            </View>

            <Logo />

            <Text className="font-inter-bold mt-4 text-2xl">Crie uma senha</Text>

            <Text className="font-inter-bold text-base mt-8">Senha</Text>
            <TextInput
              className="bg-bondis-text-gray rounded-[4px] h-[52px] mt-2 pl-4"
              onChange={handleTextChange}
              value={password}
              secureTextEntry
            />
            {password.length > 0 && (
              <Text
                className={PassStrong({
                  intent:
                  criteria.length
                  && criteria.uppercase
                  && criteria.lowercase
                  && criteria.number
                  && criteria.specialChar
                    ? null
                    : 'error',
                })}
              >
                {criteria.length
                  && criteria.uppercase
                  && criteria.lowercase
                  && criteria.number
                  && criteria.specialChar
                  ? 'Senha segura!'
                  : 'Senha fraca!'}
              </Text>
            )}

            <View className="p-4 border-[1px] border-[#D9D9D9] mt-8 rounded-[4px]">
              <Text className="font-inter-bold text-sm mb-[10px]">
                Sua senha deve conter:
              </Text>
              <View className="flex-row items-center mb-2 gap-x-[9px]">
                {criteria.length ? <CheckGreen /> : <Close />}
                <Text
                  className={CriteriaStyles({
                    intent: !criteria.length ? 'error' : null,
                  })}
                >
                  Mínimo de 8 caracteres
                </Text>
              </View>
              <View className="flex-row items-center mb-2 gap-x-[9px]">
                {criteria.uppercase ? <CheckGreen /> : <Close />}
                <Text
                  className={CriteriaStyles({
                    intent: !criteria.uppercase ? 'error' : null,
                  })}
                >
                  1 letra maiúscula
                </Text>
              </View>
              <View className="flex-row items-center mb-2 gap-x-[9px]">
                {criteria.lowercase ? <CheckGreen /> : <Close />}
                <Text
                  className={CriteriaStyles({
                    intent: !criteria.lowercase ? 'error' : null,
                  })}
                >
                  1 letra minúscula
                </Text>
              </View>
              <View className="flex-row items-center mb-2 gap-x-[9px]">
                {criteria.number ? <CheckGreen /> : <Close />}
                <Text
                  className={CriteriaStyles({
                    intent: !criteria.number ? 'error' : null,
                  })}
                >
                  1 numeral
                </Text>
              </View>
              <View className="flex-row items-center gap-x-[9px]">
                {criteria.specialChar ? <CheckGreen /> : <Close />}
                <Text
                  className={CriteriaStyles({
                    intent: !criteria.specialChar ? 'error' : null,
                  })}
                >
                  1 caractere especial (!@#$%ˆ&*()
                </Text>
              </View>
            </View>

            {criteria.length
              && criteria.uppercase
              && criteria.lowercase
              && criteria.number
              && criteria.specialChar ? (
                  <View className="mt-8">
                    <Text className="font-inter-bold text-base">
                      Redigite sua senha
                    </Text>
                    <TextInput
                      className="bg-bondis-text-gray rounded-[4px] h-[52px] mt-2 pl-4"
                      onChangeText={e => setPassword2(e)}
                      value={password2}
                      secureTextEntry
                    />
                    <Text className="text-[#EB4335] font-inter-bold text-sm mt-2">
                      {password2 === password ? null : 'As senhas devem ser iguais'}
                    </Text>
                  </View>
                ) : null}

            <TouchableOpacity
              onPress={reqCreatePassword}
              className={buttonDisabled({
                intent: password === password2 ? null : 'disabled',
              })}
            >
              <Text className="font-inter-bold text-base">Criar nova senha</Text>
            </TouchableOpacity>

            <Text className="text-center mt-8">
              Ao criar sua conta no Meu Desafio você concorda com os
              {' '}
              <Text className="font-inter-bold text-sm underline">
                Termos de serviço
              </Text>
              {' '}
              e
              {' '}
              <Text className="font-inter-bold text-sm underline">
                Politica de Privacidade
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
      <StatusBar backgroundColor="#000" barStyle="light-content" translucent={false} />
    </KeyboardAvoidingView>
  )
}

const CriteriaStyles = cva('text-sm text-[#34A853]', {
  variants: {
    intent: {
      error: 'text-black',
    },
  },
})

const PassStrong = cva('mt-1 text-[#34A853] text-sm font-inter-bold', {
  variants: {
    intent: {
      error: 'text-[#EB4335]',
    },
  },
})

const buttonDisabled = cva('h-[52px] flex-row bg-bondis-green mt-8 rounded-full justify-center items-center', {
  variants: {
    intent: {
      disabled: 'opacity-50',
    },
  },
})
