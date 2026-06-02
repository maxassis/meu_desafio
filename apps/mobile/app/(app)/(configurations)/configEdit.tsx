import type { UsersEditUserdataRequest } from '@/services/api-types'
import { TrueSheet } from '@lodev09/react-native-true-sheet'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cva } from 'class-variance-authority'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import LottieView from 'lottie-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SystemBars } from 'react-native-edge-to-edge'
import { MaskedTextInput } from 'react-native-mask-text'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from '@/components/uniwind-components'
import { deleteAvatar, editUserData, fetchUserData, uploadAvatar } from '@/services/users-service'
import Left from '../../../assets/arrow-left.svg'
import Cam from '../../../assets/camera.svg'
import User from '../../../assets/user.svg'

interface uploadAvatarResponse {
  avatar_url: string
  avatar_filename: string
}

const MAX_FILE_SIZE = 2 * 1024 * 1024

async function getFileSize(uri: string) {
  try {
    const response = await fetch(uri)
    const blob = await response.blob()
    return blob.size
  }
  catch (error) {
    console.error('Erro ao obter o tamanho do arquivo:', error)
    return 0
  }
}

export default function ProfileEdit() {
  const [bioValue, setBioValue] = useState('')
  const [nameValue, setNameValue] = useState('')
  const [unMaskedValue, setUnmaskedValue] = useState('')
  const queryClient = useQueryClient()
  const insets = useSafeAreaInsets()
  const bottomSheetRef = useRef<TrueSheet>(null)
  const [bottomSheetContent, setBottomSheetContent] = useState<
    'gender' | 'sports' | null
  >(null)
  const lottieRef = useRef<any>(null)
  const [isBottomSheetRefOpen, setIsBottomSheetRefOpen] = useState(false)
  const [isBottomSheetAvatarRefOpen, setIsBottomSheetAvatarRefOpen] = useState(false)
  const [isBottomSheetSuccessRefOpen, setIsBottomSheetSuccessRefOpen] = useState(false)

  const bottomSheetAvatarRef = useRef<TrueSheet>(null)
  const bottomSheetSuccessRef = useRef<TrueSheet>(null)

  const [genderValue, setGenderValue] = useState('')
  const [genderItems] = useState([
    { label: 'Homem', value: 'homem' },
    { label: 'Mulher', value: 'mulher' },
    { label: 'Não binario', value: 'nao_binario' },
    { label: 'Prefiro não responder', value: 'prefiro_nao_responder' },
  ])

  const [sportsValue, setSportsValue] = useState('')
  const [sportsItems] = useState([
    { label: 'Corrida', value: 'corrida' },
    { label: 'Bicicleta', value: 'bicicleta' },
  ])

  const [loadingUpload, setLoadingUpload] = useState(false)

  const { data: userConfig } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchUserData,
    staleTime: 45 * 60 * 1000,
  })

  useEffect(() => {
    if (userConfig) {
      setGenderValue(userConfig.gender ?? '')
      setSportsValue(userConfig.sport ?? '')
      setNameValue(userConfig.full_name ?? '')
      setBioValue(userConfig.bio ?? '')
      setUnmaskedValue(userConfig.birthDate ?? '')
    }
  }, [userConfig])

  const uploadAvatarMutation = useMutation({
    mutationFn: async (formData: FormData): Promise<uploadAvatarResponse> => {
      setLoadingUpload(true)
      try {
        return await uploadAvatar(formData) as uploadAvatarResponse
      }
      catch (error) {
        Alert.alert('Erro ao fazer upload do avatar')
        throw error
      }
      finally {
        if (isBottomSheetAvatarRefOpen)
          bottomSheetAvatarRef.current?.dismiss()
        setLoadingUpload(false)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userData'] })
    },
    onError: (error) => {
      console.error('Upload error', error)
      Alert.alert('Erro', 'Falha ao enviar imagem, tente novamente')
    },
  })

  const deleteAvatarMutation = useMutation({
    mutationFn: async () => {
      setLoadingUpload(true)
      try {
        return await deleteAvatar()
      }
      catch (error) {
        Alert.alert('Erro ao deletar avatar')
        throw error
      }
      finally {
        bottomSheetAvatarRef.current?.dismiss()
        setLoadingUpload(false)
      }
    },
    onSuccess: () => {
      // Invalidate the userConfig query to fetch fresh data
      queryClient.invalidateQueries({ queryKey: ['userData'] })
    },
    onError: () => {
      // console.error("Delete avatar error", error);
      Alert.alert('Erro', 'Falha ao remover imagem, tente novamente')
    },
  })

  const pickImage = async () => {
    const { assets, canceled } = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 4],
      quality: 0.3,
      base64: true,
      allowsMultipleSelection: false,
    })

    if (!canceled && assets) {
      const fileSize = assets[0].uri ? await getFileSize(assets[0].uri) : 0

      if (fileSize > MAX_FILE_SIZE) {
        Alert.alert(
          'Erro',
          'O arquivo é muito grande. O tamanho máximo permitido é 2 MB.',
        )
        return
      }

      const filename = assets[0].uri.split('/').pop()
      const extend = filename!.split('.').pop()

      const formData = new FormData()
      formData.append('file', {
        name: filename,
        uri: assets[0].uri,
        type: `image/${extend}`,
      } as any)

      try {
        uploadAvatarMutation.mutate(formData)
      }
      catch (error) {
        console.error('Upload error', error)
        Alert.alert('Erro', 'Falha ao enviar imagem, tente novamente')
      }
    }
  }

  const profileUpdateMutation = useMutation({
    mutationFn: async () => {
      const payload: UsersEditUserdataRequest = {
        full_name: nameValue || null,
        bio: bioValue || null,
        gender: genderValue as UsersEditUserdataRequest['gender'] || null,
        sport: sportsValue as UsersEditUserdataRequest['sport'] || null,
        birthDate: unMaskedValue || null,
      }

      return editUserData(payload)
    },
    onSuccess: () => {
      console.warn('[edit-user-data] alteracoes salvas com sucesso')
      if (isBottomSheetAvatarRefOpen)
        bottomSheetAvatarRef.current?.dismiss()
      if (isBottomSheetRefOpen)
        bottomSheetRef.current?.dismiss()
      if (!isBottomSheetSuccessRefOpen)
        bottomSheetSuccessRef.current?.present()
      queryClient.invalidateQueries({ queryKey: ['userData'] })
    },
    onError: (error) => {
      console.error('[edit-user-data] erro ao salvar alteracoes', error)
      Alert.alert('Erro', 'Não foi possível salvar as alterações.')
    },
  })

  const handleGoBack = useCallback(() => {
    if (isBottomSheetRefOpen) {
      bottomSheetRef.current?.dismiss()
      return true // Evento tratado
    }
    if (isBottomSheetAvatarRefOpen) {
      bottomSheetAvatarRef.current?.dismiss()
      return true // Evento tratado
    }
    if (isBottomSheetSuccessRefOpen) {
      bottomSheetSuccessRef.current?.dismiss()
      return true // Evento tratado
    }
    router.replace('configInit')
    return false // Permitir navegação padrão se nenhum bottom sheet estiver aberto
  }, [isBottomSheetRefOpen, isBottomSheetAvatarRefOpen, isBottomSheetSuccessRefOpen])

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleGoBack,
    )

    return () => backHandler.remove()
  }, [handleGoBack])

  return (
    <View
      className="flex-1 bg-white"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <FlatList
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        bounces={false}
        renderItem={() => null}
        data={[]}
        ListHeaderComponent={(
          <View className="px-5 pb-8 pt-[28px] flex-1">
            <View className="h-[43px] w-[43px] rounded-full bg-bondis-text-gray justify-center items-center">
              <Left onPress={handleGoBack} />
            </View>
            <Text className="font-inter-bold text-2xl mt-7">
              Mantenha seu perfil atualizado
            </Text>

            <TouchableOpacity
              onPress={() => {
                if (isBottomSheetRefOpen)
                  bottomSheetRef.current?.dismiss()
                if (isBottomSheetSuccessRefOpen)
                  bottomSheetSuccessRef.current?.dismiss()
                if (!isBottomSheetAvatarRefOpen)
                  bottomSheetAvatarRef.current?.present()
              }}
              className="h-[94px] w-[94px] mt-8 relative"
              disabled={loadingUpload}
            >
              {userConfig?.avatar_url ? (
                <Image
                  source={{ uri: userConfig.avatar_url }}
                  className="w-[94px] h-[94px] rounded-full"
                  contentFit="cover"
                />
              ) : (
                <User />
              )}

              <View className="absolute bottom-[-10px] right-[-8px] bg-bondis-text-gray h-[36px] w-[36px] rounded-full justify-center items-center">
                <Cam />
              </View>
            </TouchableOpacity>

            <Text className="font-inter-bold text-base mt-[23px]">Nome</Text>
            <TextInput
              placeholder="Nome completo"
              value={nameValue}
              autoCapitalize="none"
              onChangeText={setNameValue}
              className="bg-bondis-text-gray rounded-[4px] h-[52px] mt-2 pl-4"
            />

            <Text className="font-inter-bold text-base mt-[23px]">Bio</Text>
            <TextInput
              placeholder="Escreva um pouco sobre você..."
              numberOfLines={3}
              value={bioValue}
              autoCapitalize="none"
              onChangeText={setBioValue}
              className="bg-bondis-text-gray rounded-[4px] h-[144px] mt-2 p-4"
              style={{ textAlignVertical: 'top' }}
            />

            <Text className="font-inter-bold text-base mt-[23px]">
              Data de Nascimento
            </Text>
            <MaskedTextInput
              placeholder="__/__/____"
              mask="99/99/9999"
              onChangeText={(text, rawText) => {
                setUnmaskedValue(rawText)
              }}
              value={unMaskedValue}
              className="bg-bondis-text-gray rounded-[4px] h-[52px] mt-2 pl-4"
              keyboardType="numeric"
            />

            <Text className="font-inter-bold text-base mt-[23px]">
              Como você se identifica?
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (isBottomSheetAvatarRefOpen)
                  bottomSheetAvatarRef.current?.dismiss()
                if (isBottomSheetSuccessRefOpen)
                  bottomSheetSuccessRef.current?.dismiss()
                setBottomSheetContent('gender')
                if (!isBottomSheetRefOpen)
                  bottomSheetRef.current?.present()
              }}
            >
              <View className="bg-bondis-text-gray rounded-[4px] h-[52px] mt-2 pl-4 justify-center">
                <Text>
                  {genderValue
                    ? genderItems.find(item => item.value === genderValue)
                      ?.label
                    : 'Selecione'}
                </Text>
              </View>
            </TouchableOpacity>

            <Text className="font-inter-bold text-base mt-[23px]">
              Esportes
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (isBottomSheetAvatarRefOpen)
                  bottomSheetAvatarRef.current?.dismiss()
                if (isBottomSheetSuccessRefOpen)
                  bottomSheetSuccessRef.current?.dismiss()
                setBottomSheetContent('sports')
                if (!isBottomSheetRefOpen)
                  bottomSheetRef.current?.present()
              }}
            >
              <View className="bg-bondis-text-gray rounded-[4px] h-[52px] mt-2 pl-4 justify-center">
                <Text>
                  {sportsValue
                    ? sportsItems.find(item => item.value === sportsValue)
                      ?.label
                    : 'Selecione'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => profileUpdateMutation.mutate()}
              disabled={profileUpdateMutation.isPending}
              className="h-[52px] mt-8 rounded-full justify-center items-center bg-bondis-green"
            >
              <Text className="font-inter-bold text-base">
                {profileUpdateMutation.isPending
                  ? 'Salvando...'
                  : 'Salvar alterações'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <TrueSheet
        ref={bottomSheetAvatarRef}
        detents={[0.20]}
        cornerRadius={20}
        backgroundColor="white"
        onDidPresent={() => setIsBottomSheetAvatarRefOpen(true)}
        onDidDismiss={() => setIsBottomSheetAvatarRefOpen(false)}
      >
        <View className="flex-1 z-50 pt-6">
          <View className="mx-5">
            {!loadingUpload ? (
              <>
                <TouchableOpacity
                  className="h-[51px] justify-center items-center border-b-[0.2px] border-b-gray-400"
                  onPress={pickImage}
                >
                  <Text className="text-center text-base ">
                    Escolher uma foto na galeria
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="h-[51px] justify-center items-center"
                  onPress={() => deleteAvatarMutation.mutate()}
                  disabled={!userConfig?.avatar_url}
                >
                  <Text
                    className={disabledDeleteBtn({
                      intent: !userConfig?.avatar_url ? 'disabled' : null,
                    })}
                  >
                    Remover foto
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View
                className="h-[102px] flex-row justify-center items-center"
              >
                <Text className="font-inter-bold text-base mr-3">
                  Carregando...
                </Text>
                <ActivityIndicator size="large" color="#12FF55" />
              </View>
            )}
          </View>
        </View>
      </TrueSheet>

      <TrueSheet
        ref={bottomSheetRef}
        detents={bottomSheetContent === 'gender' || bottomSheetContent === 'sports' ? [0.30] : [0.01]}
        cornerRadius={20}
        backgroundColor="white"
        onDidPresent={() => setIsBottomSheetRefOpen(true)}
        onDidDismiss={() => setIsBottomSheetRefOpen(false)}
      >
        <View className="flex-1 z-50 pt-6">
          {bottomSheetContent === 'gender' && (
            <View className="mx-5">
              {genderItems.map((item, index) => (
                <TouchableOpacity
                  key={item.value}
                  onPress={() => {
                    setGenderValue(item.value)
                    if (isBottomSheetRefOpen)
                      bottomSheetRef.current?.dismiss()
                  }}
                  className={`h-[51px] justify-center items-center ${
                    index === genderItems.length - 1
                      ? ''
                      : 'border-b-[0.2px] border-b-gray-400'
                  }`}
                >
                  <Text className="text-base">{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {bottomSheetContent === 'sports' && (
            <View className="mx-5">
              {sportsItems.map((item, index) => (
                <TouchableOpacity
                  key={item.value}
                  onPress={() => {
                    setSportsValue(item.value)
                    if (isBottomSheetRefOpen)
                      bottomSheetRef.current?.dismiss()
                  }}
                  className={`h-[51px] justify-center items-center ${
                    index === sportsItems.length - 1
                      ? ''
                      : 'border-b-[0.2px] border-b-gray-400'
                  }`}
                >
                  <Text className="text-base">{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </TrueSheet>

      <TrueSheet
        ref={bottomSheetSuccessRef}
        detents={[0.35]}
        cornerRadius={20}
        backgroundColor="white"
        onDidPresent={() => {
          setIsBottomSheetSuccessRefOpen(true)
          lottieRef.current?.reset()
          lottieRef.current?.play()
        }}
        onDidDismiss={() => setIsBottomSheetSuccessRefOpen(false)}
      >
        <View className="z-50 px-5 pb-6 pt-8">
          <View className="items-center">
            <LottieView
              ref={lottieRef}
              source={require('../../../assets/lottie/check-lottie.json')}
              loop={false}
              style={{
                width: 80,
                height: 80,
                alignSelf: 'center',
              }}
            />
            <Text className="font-anton-regular text-lg mt-3 text-center">
              Perfil atualizado com sucesso!
            </Text>

            <TouchableOpacity
              className="w-full items-center justify-center h-[52px] rounded-[31px] text-black border mt-5 border-[#D9D9D9]"
              onPress={() => {
                if (isBottomSheetSuccessRefOpen)
                  bottomSheetSuccessRef.current?.dismiss()
              }}
            >
              <Text>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TrueSheet>

      <SystemBars style="dark" />
    </View>
  )
}

const disabledDeleteBtn = cva('text-center text-base pt-4 text-[#EB4335]', {
  variants: {
    intent: {
      disabled: 'opacity-50',
    },
  },
})
