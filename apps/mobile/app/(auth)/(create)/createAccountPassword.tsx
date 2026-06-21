import { useMutation } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import {
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SystemBars } from 'react-native-edge-to-edge'
import { KeyboardAwareScrollView, useSafeAreaInsets } from '@/components/uniwind-components'
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

export default function CreatePassword() {
  const { name, email } = useLocalSearchParams()
  const router = useRouter()
  const [password, setPassword] = useState<string>('')
  const [password2, setPassword2] = useState<string>('')
  const insets = useSafeAreaInsets()
  const [criteria, setCriteria] = useState<Criteria>({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  })

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

  const createUser = async (newPassword: string) => {
    const { error } = await authClient.signUp.email({
      name: String(name),
      email: String(email),
      password: newPassword,
    })

    if (error) {
      const authError = new Error(error.message || 'Erro ao criar usuário') as Error & { status?: number }
      authError.status = error.status
      throw authError
    }
  }

  const { mutate, isPending } = useMutation({
    mutationFn: () => createUser(password),
    onSuccess: () => {
      router.push({
        pathname: '/createAccountCode',
        params: { email },
      })
    },
    onError: (error: Error & { status?: number }) => {
      if (error.status === 422) {
        Alert.alert('E-mail já cadastrado', 'Toque em "entrar" para acessar a conta.', [{ text: 'Ok', style: 'cancel' }])
      }
      else {
        Alert.alert('Erro', error.message, [{ text: 'Ok', style: 'cancel' }])
      }
    },
  })

  const handleTextChange = (text: string) => {
    validatePassword(text)
  }

  const handleSubmit = () => {
    if (password !== password2) {
      Alert.alert('As senhas não coincidem', '', [
        { text: 'Ok', style: 'cancel' },
      ])
      return
    }
    mutate()
  }

  const allCriteriaMet = criteria.length && criteria.uppercase && criteria.lowercase && criteria.number && criteria.specialChar
  const isButtonDisabled = password !== password2 || isPending || !allCriteriaMet

  return (
    <View className="flex-1 bg-white">
      <KeyboardAwareScrollView
        className="flex-1"
        overScrollMode="never"
        contentContainerStyle={{ paddingBottom: 42 }}
      >
        <View style={{ paddingTop: insets.top }}>
          <View className="px-5 pt-[38px]">
            <View className="items-end mb-[10px]">
              <TouchableOpacity
                onPress={() => router.push('/intro')}
                className="h-[43px] w-[43px] rounded-full bg-bondis-text-gray justify-center items-center"
              >
                <Close />
              </TouchableOpacity>
            </View>

            <Logo />

            <Text className="font-inter-bold mt-4 text-2xl">
              Crie uma senha
            </Text>

            <Text className="font-inter-bold text-base mt-8">Senha</Text>
            <TextInput
              className="bg-bondis-text-gray rounded-[4px] h-[52px] mt-2 pl-4"
              onChangeText={handleTextChange}
              value={password}
              secureTextEntry
            />
            {password.length > 0 && (
              <Text
                className={`mt-1 text-sm font-inter-bold ${allCriteriaMet ? 'text-[#34A853]' : 'text-[#EB4335]'}`}
              >
                {allCriteriaMet ? 'Senha segura!' : 'Senha fraca!'}
              </Text>
            )}

            <View className="p-4 border-[1px] border-[#D9D9D9] mt-8 rounded-[4px]">
              <Text className="font-inter-bold text-sm mb-[10px]">
                Sua senha deve conter:
              </Text>
              {/* Critérios da senha */}
              <View className="flex-row items-center mb-2 gap-x-[9px]">
                {criteria.length ? <CheckGreen /> : <Close />}
                <Text className={`text-sm ${criteria.length ? 'text-[#34A853]' : 'text-black'}`}>
                  Mínimo de 8 caracteres
                </Text>
              </View>
              <View className="flex-row items-center mb-2 gap-x-[9px]">
                {criteria.uppercase ? <CheckGreen /> : <Close />}
                <Text className={`text-sm ${criteria.uppercase ? 'text-[#34A853]' : 'text-black'}`}>
                  1 letra maiúscula
                </Text>
              </View>
              <View className="flex-row items-center mb-2 gap-x-[9px]">
                {criteria.lowercase ? <CheckGreen /> : <Close />}
                <Text className={`text-sm ${criteria.lowercase ? 'text-[#34A853]' : 'text-black'}`}>
                  1 letra minúscula
                </Text>
              </View>
              <View className="flex-row items-center mb-2 gap-x-[9px]">
                {criteria.number ? <CheckGreen /> : <Close />}
                <Text className={`text-sm ${criteria.number ? 'text-[#34A853]' : 'text-black'}`}>
                  1 numeral
                </Text>
              </View>
              <View className="flex-row items-center gap-x-[9px]">
                {criteria.specialChar ? <CheckGreen /> : <Close />}
                <Text className={`text-sm ${criteria.specialChar ? 'text-[#34A853]' : 'text-black'}`}>
                  1 caractere especial (!@#$%ˆ&*()
                </Text>
              </View>
            </View>

            {allCriteriaMet
              ? (
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
                )
              : null}

            {/* Botão para criar a conta */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isButtonDisabled}
              className={`h-[52px] flex-row bg-bondis-green mt-8 rounded-full justify-center items-center ${isButtonDisabled ? 'opacity-50' : ''}`}
            >
              <Text className="font-inter-bold text-base">
                {isPending ? 'Criando conta...' : 'Criar conta'}
              </Text>
            </TouchableOpacity>

            <Text className="text-center mt-8 mb-[42px]">
              Ao criar sua conta no Meu Desafio você concorda com os
              {' '}
              <Text className="font-inter-bold text-sm underline">
                Termos de serviço
              </Text>
              {' '}
              e
              {' '}
              <Text className="font-inter-bold text-sm underline">
                Política de Privacidade
              </Text>
            </Text>
          </View>
        </View>
      </KeyboardAwareScrollView>
      <SystemBars style="dark" />
    </View>
  )
}
