import { useRouter } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import {
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Apple from '../../../assets/apple.svg'
import Arrow from '../../../assets/arrow-right.svg'
import Close from '../../../assets/Close.svg'
import Facebook from '../../../assets/facebook.svg'
import Google from '../../../assets/google.svg'
import Logo from '../../../assets/logo2.svg'
import { Button } from '../../../components/button'

interface FormData {
  name: string
  email: string
}

export default function CreateAccount() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>()

  const onSubmit = ({ name, email }: { name: string, email: string }) => {
    router.push({
      pathname: '/createAccountPassword',
      params: { name: name.trim(), email: email.toLowerCase().trim() },
    })
  }

  return (
    <View
      className=" bg-white flex-1"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="pt-[38px] px-5">
        <View className="items-end mb-[10px]">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-[43px] w-[43px] rounded-full bg-bondis-text-gray justify-center items-center"
          >
            <Close />
          </TouchableOpacity>
        </View>

        <Logo />

        <Text className="font-inter-bold mt-4 text-2xl">Crie sua conta</Text>
        <Text className="text-[#565656] mt-4 text-base">
          Leva menos de 2 minutinhos 😃
        </Text>

        <Text className="font-inter-bold text-base mt-8">
          Como você se chama?
        </Text>
        <Controller
          control={control}
          name="name"
          rules={{
            required: 'Nome obrigatório',
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

        <Text className="mt-8 font-inter-bold text-base">E-mail</Text>
        <Controller
          control={control}
          name="email"
          rules={{
            required: 'Email obrigatório',
            pattern: {
              value: /^[\w.%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Email inválido',
            },
          }}
          render={({ field: { value, onChange } }) => (
            <TextInput
              className="bg-bondis-text-gray rounded-[4px] h-[52px] mt-2 pl-4"
              value={value}
              autoCapitalize="none"
              onChangeText={onChange}
            />
          )}
        />
        {errors.email && (
          <Text className="mt-1 text-bondis-alert-red">
            {String(errors?.email?.message)}
          </Text>
        )}

        <Button
          title="Proximo"
          onPress={handleSubmit(onSubmit)}
          icon={<Arrow />}
        />

        <Text className="text-center mt-8 text-base text-bondis-gray-dark">
          Ou entre em sua conta:
        </Text>

        <View className="flex-row mt-4 justify-center gap-x-7">
          <Google />
          <Facebook />
          <Apple />
        </View>
      </View>
      <StatusBar
        backgroundColor="#000"
        barStyle="light-content"
        translucent={false}
      />
    </View>
  )
}
