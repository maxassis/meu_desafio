import { useRouter } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import { Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SystemBars } from 'react-native-edge-to-edge'
import { useSafeAreaInsets } from '@/components/uniwind-components'
import Close from '../../../assets/Close.svg'
import Logo from '../../../assets/logo2.svg'
import { Button } from '../../../components/button'

export default function Recovery() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<{ email: string }>()

  const onSubmit = ({ email }: { email: string }) => {
    router.push({
      pathname: '/recoveryCode',
      params: { email: email.toLowerCase().trim() },
    })
  }

  return (
    <View
      className="flex-1 bg-white"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className=" px-5 pt-[28px]">
        <View className="items-end mb-[10px]">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-[43px] w-[43px] rounded-full bg-bondis-text-gray justify-center items-center"
          >
            <Close />
          </TouchableOpacity>
        </View>

        <View className="h-[368px] pt-8">
          <Logo />

          <Text className="font-inter-bold text-2xl mt-4">
            Recupere seu acesso
          </Text>
          <Text className="text-bondis-gray-dark mt-4">
            Informe um e-mail válido para redefinir sua senha:
          </Text>

          <Text className="font-inter-bold text-base mt-8">E-mail</Text>
          <Controller
            control={control}
            name="email"
            rules={{
              required: 'E-mail obrigatório',
              pattern: {
                value: /^[\w.%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Email inválido',
              },
            }}
            render={({ field: { value, onChange } }) => (
              <TextInput
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

          <Button
            title="Recuperar senha"
            onPress={handleSubmit(onSubmit)}
          />
        </View>
      </View>
      <SystemBars style="dark" />
    </View>
  )
}
