import { TrueSheet } from '@lodev09/react-native-true-sheet'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useRef } from 'react'
import {
  Alert,
  BackHandler,
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SystemBars } from 'react-native-edge-to-edge'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CardDesafio } from '@/components'
import {
  AvatarSkeleton,
  CardDesafioSkeleton,
  SectionTitleSkeleton,
  StatsSkeleton,
  UserInfoSkeleton,
} from '@/components/Skeletons/skeletons'
import { Image } from '@/components/uniwind-components'
import { fetchAllDesafios } from '@/services/desafios-service'
import { fetchStravaStatus } from '@/services/strava-service'
import { fetchUserData } from '@/services/users-service'
import Logo from '../../assets/logo-white.svg'
import Plus from '../../assets/plus.svg'
import Settings from '../../assets/settings.svg'

export default function Profile() {
  const router = useRouter()
  const bottomSheetRef = useRef<TrueSheet>(null)
  const insets = useSafeAreaInsets()

  const isBottomSheetOpen = useRef(false)

  const {
    data: userData,
    isLoading: isUserLoading,
    isError: isUserError,
    isSuccess: isUserSuccess,
  } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchUserData,
    staleTime: 45 * 60 * 1000,
  })

  const {
    data: allDesafios,
    isLoading: isDesafiosLoading,
    isError: isDesafiosError,
  } = useQuery({
    queryKey: ['getAllDesafios'],
    queryFn: fetchAllDesafios,
    staleTime: 5 * 60 * 1000,
  })

  const {
    data: stravaStatus,
  } = useQuery({
    queryKey: ['strava-status'],
    queryFn: fetchStravaStatus,
    staleTime: 5 * 60 * 1000,
  })

  const desafiosEmCurso
    = allDesafios?.filter(
      desafio => desafio.isRegistered && !desafio.completed,
    ) || []
  const desafiosDisponiveis
    = allDesafios?.filter(desafio => !desafio.isRegistered) || []
  const desafiosConcluidos
    = allDesafios?.filter(desafio => desafio.completed) || []

  const totalDistance = useMemo(() => {
    if (!allDesafios)
      return 0

    return allDesafios.reduce((total, desafio) => {
      if (desafio.isRegistered && (desafio.completed || !desafio.completed)) {
        return total + (Number(desafio.totalDistanceCompleted) || 0)
      }
      return total
    }, 0)
  }, [allDesafios])

  // Formata a distância para exibição (arredonda para o km mais próximo)
  const formattedDistance = `${totalDistance.toFixed(2)} km`

  const handleOpenBottomSheet = () => {
    if (!isBottomSheetOpen.current) {
      bottomSheetRef.current?.present()
    }
  }

  const handleCloseBottomSheet = () => {
    if (isBottomSheetOpen.current) {
      bottomSheetRef.current?.dismiss()
    }
  }

  // Handle Android back button press
  useEffect(() => {
    const backAction = () => {
      if (isBottomSheetOpen.current) {
        handleCloseBottomSheet()
        return true // Prevent default back behavior
      }
      return false // Let default back behavior happen
    }

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    )

    return () => backHandler.remove()
  }, [])

  // Check if there are any active challenges to show the "+" button
  const hasActiveDesafios = desafiosEmCurso.length > 0

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 bg-white" overScrollMode="never" showsVerticalScrollIndicator={false}>
        <View
          className="mb-[10px] pb-4 bg-bondis-black"
          style={{ paddingTop: insets.top }}
        >
          <View className="flex-row h-[92px] justify-between mx-4 mt-4 ">
            <Logo />
            {isUserLoading ? (
              <AvatarSkeleton />
            ) : isUserSuccess && userData?.avatar_url ? (
              <Image
                source={{ uri: userData.avatar_url }}
                style={{
                  width: 72,
                  height: 72,
                  marginTop: 'auto',
                  borderRadius: 999,
                }}
                contentFit="cover"
              />
            ) : (
              <Image
                source={require('../../assets/user2.png')}
                style={{
                  width: 72,
                  height: 72,
                  marginTop: 'auto',
                  borderRadius: 999,
                }}
                contentFit="cover"
              />
            )}
            <TouchableOpacity onPress={() => router.push('/configInit')}>
              <Settings />
            </TouchableOpacity>
          </View>

          {isUserLoading && <UserInfoSkeleton />}
          {isUserError && (
            <Text className="text-center text-red-500 mt-5">
              Erro ao carregar usuário
            </Text>
          )}
          {isUserSuccess && (
            <>
              <Text className="text-bondis-green text-lg font-anton-regular text-center mt-[29px]">
                {userData.username}
              </Text>
              <Text className="text-center text-bondis-text-gray font-inter-regular text-sm mt-2">
                {userData.bio}
              </Text>
            </>
          )}

          {isUserLoading ? (
            <StatsSkeleton />
          ) : (
            <View className="flex-row justify-between h-[51px] mt-[10px] mx-4">
              <View>
                <Text className="text-white text-lg text-center font-anton-regular">
                  {desafiosEmCurso.length}
                </Text>
                <Text className="text-[#828282] font-inter-regular">
                  {desafiosEmCurso.length === 1
                    ? 'Desafio ativo'
                    : 'Desafios ativos'}
                </Text>
              </View>
              <View>
                <Text className="text-white text-lg text-center font-anton-regular">
                  {desafiosConcluidos.length}
                </Text>
                <Text className="text-[#828282] font-inter-regular">
                  Desafios finalizados
                </Text>
              </View>
              <View>
                <Text className="text-white text-lg text-center font-anton-regular">
                  {formattedDistance}
                </Text>
                <Text className="text-[#828282] font-inter-regular">
                  Percorridos
                </Text>
              </View>
            </View>
          )}
        </View>

        <View
          className="h-full pb-8"
          style={{ paddingBottom: insets.bottom + 10 }}
        >
          {/* Desafios em Curso */}
          {desafiosEmCurso.length > 0 && (
            <>
              <View className="mb-4 pl-5 mt-4">
                <Text className="font-anton-regular text-xl">
                  Desafios ativos
                </Text>
              </View>

              {isDesafiosLoading ? (
                <View className="h-[182px] w-full">
                  <FlatList
                    data={[1, 2, 3]} // Mock data for skeletons
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={item => item.toString()}
                    contentContainerStyle={{ gap: 0, paddingHorizontal: 0 }}
                    overScrollMode="never"
                    renderItem={() => <CardDesafioSkeleton width={216} />}
                  />
                </View>
              ) : isDesafiosError ? (
                <Text className="text-center text-red-500">
                  Erro ao carregar desafios
                </Text>
              ) : (
                <View className="h-[182px] w-full">
                  <FlatList
                    data={desafiosEmCurso}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ gap: 0, paddingHorizontal: 0 }}
                    overScrollMode="never"
                    renderItem={({ item }) => (
                      <View className="w-[216px] f-full">
                        <CardDesafio
                          desafioId={item.id}
                          name={item.name}
                          distance={item.distance}
                          progress={`${item.progressPercentage}`}
                          isRegistered={item.isRegistered}
                          completed={item.completed}
                          photo={item.photo}
                          inscriptionId={item.inscriptionId}
                        />
                      </View>
                    )}
                  />
                </View>
              )}
            </>
          )}

          {!isDesafiosLoading
            && !isDesafiosError
            && desafiosDisponiveis.length > 0 && (
            <>
              <View className="mb-4 pl-5 mt-8">
                <Text className="font-anton-regular text-xl my-auto">
                  Desafios Disponíveis
                </Text>
              </View>

              <View className="h-[293px] w-full">
                <FlatList
                  data={desafiosDisponiveis}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={item => item.id.toString()}
                  contentContainerStyle={{ gap: 0, paddingHorizontal: 0 }}
                  overScrollMode="never"
                  renderItem={({ item }) => (
                    <View className="w-[253px]">
                      <CardDesafio
                        desafioId={item.id}
                        name={item.name}
                        distance={item.distance}
                        progress={`${item.progressPercentage}`}
                        isRegistered={item.isRegistered}
                        completed={item.completed}
                        photo={item.photo}
                        inscriptionId={item.inscriptionId}
                      />
                    </View>
                  )}
                />
              </View>
            </>
          )}

          {/* Loading skeletons for Desafios Disponíveis */}
          {isDesafiosLoading && desafiosEmCurso.length === 0 && (
            <>
              <SectionTitleSkeleton width={200} />

              <View className="h-[293px] w-full">
                <FlatList
                  data={[1, 2, 3]} // Mock data for skeletons
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={item => item.toString()}
                  contentContainerStyle={{ gap: 0, paddingHorizontal: 0 }}
                  overScrollMode="never"
                  renderItem={() => <CardDesafioSkeleton width={253} />}
                />
              </View>
            </>
          )}

          {isDesafiosError && (
            <Text className="text-center text-red-500">
              Erro ao carregar desafios
            </Text>
          )}

          {desafiosConcluidos.length > 0 && (
            <>
              <View className="mb-4 pl-5 mt-8">
                <Text className="font-anton-regular text-xl my-auto">
                  Desafios Concluídos
                </Text>
              </View>

              {isDesafiosLoading ? (
                <View className="h-[182px] w-full">
                  <FlatList
                    data={[1, 2, 3]} // Mock data for skeletons
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={item => item.toString()}
                    contentContainerStyle={{ gap: 0, paddingHorizontal: 0 }}
                    overScrollMode="never"
                    renderItem={() => <CardDesafioSkeleton width={216} />}
                  />
                </View>
              ) : isDesafiosError ? (
                <Text className="text-center text-red-500">
                  Erro ao carregar desafios
                </Text>
              ) : (
                <View className="h-[182px] w-full">
                  <FlatList
                    data={desafiosConcluidos}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ gap: 0, paddingHorizontal: 0 }}
                    overScrollMode="never"
                    renderItem={({ item }) => (
                      <View className="w-[216px] f-full">
                        <CardDesafio
                          desafioId={item.id}
                          name={item.name}
                          distance={item.distance}
                          progress={`${item.progressPercentage}`}
                          isRegistered={item.isRegistered}
                          completed={item.completed}
                          photo={item.photo}
                          inscriptionId={item.inscriptionId}
                        />
                      </View>
                    )}
                  />
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Only render the + button if there are active challenges */}
      {hasActiveDesafios && (
        <TouchableOpacity
          onPress={handleOpenBottomSheet}
          className="rounded-full bg-bondis-green absolute w-16 h-16 justify-center items-center right-5"
          style={{ bottom: insets.bottom + 10 }}
        >
          <Plus />
        </TouchableOpacity>
      )}

      <TrueSheet
        ref={bottomSheetRef}
        detents={[0.28]}
        backgroundColor="white"
        onDidPresent={() => { isBottomSheetOpen.current = true }}
        onDidDismiss={() => { isBottomSheetOpen.current = false }}
      >
        <View className="flex-1 z-50">
          <Text className="font-inter-bold mt-[10px] text-base mx-5 mb-4">
            Adicione uma nova atividade
          </Text>
          <View className="mx-5">
            <TouchableOpacity
              onPress={() => {
                router.push('/rastreador')
              }}
              className="h-[51px] justify-center items-center border-b-[0.2px] border-b-gray-400"
            >
              <Text className="text-base">Iniciar agora</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                router.push('/desafios')
              }}
              className="h-[51px] justify-center items-center border-b-[0.2px] border-b-gray-400"
            >
              <Text className="text-base">Cadastrar manualmente</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (!stravaStatus?.connected) {
                  Alert.alert(
                    'Strava não conectado',
                    'Conecte sua conta Strava para importar atividades.',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Conectar Strava',
                        onPress: () => router.push('/connections'),
                      },
                    ],
                  )
                  return
                }
                router.push({
                  pathname: '/desafios',
                  params: { strava: 'true' },
                })
              }}
              className="h-[51px] justify-center items-center"
            >
              <Text className="text-base">Importar do Strava</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TrueSheet>

      <SystemBars style="light" />
    </View>
  )
}
