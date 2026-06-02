import type { AuthSigninRequest } from '@/services/api-types'
import { useMutation } from '@tanstack/react-query'
import * as Linking from 'expo-linking'
import { Link, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Controller, useForm } from 'react-hook-form'
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { useAuth } from '@/contexts/auth-context'
import Apple from '../../assets/apple.svg'
import Close from '../../assets/Close.svg'
import Facebook from '../../assets/facebook.svg'
import Google from '../../assets/google.svg'
import Logo from '../../assets/logo2.svg'
import { Button } from '../../components/button'
import { authClient } from '../../services/auth-client'

type LoginError = Error & {
  status?: number
}

export default function Login() {
  const router = useRouter()
  const { setAuthenticated } = useAuth()
  const insets = useSafeAreaInsets()
  const googleRedirectUrl = Linking.createURL('login')

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AuthSigninRequest>()

  const mutation = useMutation({
    mutationFn: async (formData: AuthSigninRequest) => {
      const { error } = await authClient.signIn.email({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        const authError = new Error(error.message || 'Erro ao fazer login') as LoginError
        authError.status = error.status
        throw authError
      }
    },
    onSuccess: () => {
      setAuthenticated(true)
      router.replace('/(app)/dashboard')
    },
    onError: (error: LoginError) => {
      if (error.status === 401) {
        Toast.show({
          type: 'error',
          text1: 'Senha ou e-mail incorretos',
          text2: 'Por favor, verifique os dados digitados',
          visibilityTime: 4000,
        })
      }
      else {
        Toast.show({
          type: 'error',
          text1: 'Erro inesperado',
          text2: 'Tente novamente',
          visibilityTime: 4000,
        })
      }
    },
  })

  const googleMutation = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.signIn.social({
        provider: 'google',
        callbackURL: googleRedirectUrl,
      })

      if (error) {
        throw new Error(error.message || 'Erro ao entrar com Google')
      }

      const { data, error: sessionError } = await authClient.getSession()

      if (sessionError || !data?.session) {
        throw new Error('Sessão do Google não confirmada')
      }

      return true
    },
    onSuccess: () => {
      setAuthenticated(true)
      router.replace('/(app)/dashboard')
    },
    onError: (error: LoginError) => {
      Toast.show({
        type: 'error',
        text1: 'Erro ao entrar com Google',
        text2: error.message || 'Tente novamente',
        visibilityTime: 4000,
      })
    },
  })

  const onSubmit = (formData: AuthSigninRequest) => {
    mutation.mutate(formData)
  }

  const handleGoogleSignIn = () => {
    googleMutation.mutate()
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <ScrollView>
        <View className="pt-[28px] px-5 bg-white flex-1">
          <View className="items-end mb-[10px]">
            <View className="h-[43px] w-[43px] rounded-full bg-bondis-text-gray justify-center items-center">
              <TouchableOpacity onPress={() => router.push('/intro')}>
                <Close />
              </TouchableOpacity>
            </View>
          </View>

          <Logo />
          <Text className="font-inter-bold mt-4 text-2xl">Login</Text>
          <Text className="text-bondis-gray-dark mt-4 text-base">
            Informe seu e-mail e senha de acesso:
          </Text>

          <Text className="font-inter-bold text-base mt-8">E-mail</Text>
          <Controller
            control={control}
            name="email"
            rules={{
              required: 'Email obrigatório',
              pattern: {
                value: /^[\w.%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Email inválido',
              },
            }}
            render={({ field: { value, onChange } }) => (
              <TextInput
                placeholder="E-mail"
                value={value}
                autoCapitalize="none"
                onChangeText={onChange}
                className="bg-bondis-text-gray rounded-[4px] h-[52px] mt-2 pl-4"
              />
            )}
          />
          {errors.email && (
            <Text className="mt-1 text-bondis-alert-red">
              {String(errors?.email?.message)}
            </Text>
          )}

          <Text className="mt-8 font-inter-bold text-base">Senha</Text>
          <Controller
            control={control}
            name="password"
            rules={{ required: 'Digite sua senha' }}
            render={({ field: { value, onChange } }) => (
              <TextInput
                placeholder="Senha"
                secureTextEntry
                autoCapitalize="none"
                onChangeText={onChange}
                value={value}
                className="bg-bondis-text-gray rounded-[4px] h-[52px] mt-2 pl-4"
              />
            )}
          />
          <Text className="mt-1 text-bondis-alert-red">
            {errors?.password?.message ? String(errors.password.message) : ''}
          </Text>

          <Text className="mt-8 font-inter-regular text-center">
            Esqueceu a senha?
            {' '}
            <Link href="/recovery">
              <Text className="font-inter-bold underline">Recuperar</Text>
            </Link>
          </Text>

          <Button
            title="Entrar"
            onPress={handleSubmit(onSubmit)}
            isLoading={mutation.isPending}
          />

          <Text className="text-center mt-8 text-base text-bondis-gray-dark">
            Ou entre em sua conta:
          </Text>

          <View className="flex-row mt-4 justify-center gap-x-7">
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Entrar com Google"
              disabled={googleMutation.isPending}
              onPress={handleGoogleSignIn}
            >
              <Google />
            </TouchableOpacity>
            <Facebook />
            <Apple />
          </View>
        </View>
        <StatusBar style="dark" />
      </ScrollView>
    </View>
  )
}
