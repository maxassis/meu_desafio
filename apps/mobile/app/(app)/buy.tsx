import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import Carousel from 'react-native-reanimated-carousel'
import { AcceptDesafioButton } from '@/components'
import { Image, LinearGradient, SafeAreaView, useSafeAreaInsets } from '@/components/uniwind-components'
import { fetchPurchaseData } from '@/services/desafios-service'
import Left from '../../assets/arrow-left.svg'
import Track from '../../assets/track.svg'

export default function Buy() {
  const router = useRouter()
  const { desafioId } = useLocalSearchParams()

  const [show, setShow] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const screenWidth = Dimensions.get('window').width
  const insets = useSafeAreaInsets()

  const {
    data: purchaseData,
    isLoading: purchaseDataLoading,
    isError: isDesafiosError,
  } = useQuery({
    queryKey: ['purchaseData', desafioId],
    queryFn: () => fetchPurchaseData(desafioId as string),
    staleTime: 5 * 60 * 1000,
  })

  const trackPhoto = purchaseData?.images?.[0]
  const backgroundPhoto = purchaseData?.images?.[1]
  const carouselPhotos = purchaseData?.images?.slice(2) ?? []

  if (purchaseDataLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#00B37E" />
      </SafeAreaView>
    )
  }

  if (isDesafiosError) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center px-5">
        <Text className="text-center text-red-500">
          Ocorreu um erro ao carregar os dados. Tente novamente.
        </Text>
      </SafeAreaView>
    )
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView overScrollMode="never">
        {/* BACKGROUND */}
        <ImageBackground
          className="px-5"
          source={{ uri: backgroundPhoto }}
          style={{ position: 'relative' }}
        >
          <LinearGradient
            colors={['transparent', 'white']}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 250,
              zIndex: 0,
            }}
          />

          <View style={{ zIndex: 1, marginTop: insets.top }}>
            <View className="mt-[28px]">
              <TouchableOpacity
                onPress={() => router.push('/dashboard')}
                className="h-[43px] w-[43px] rounded-full bg-bondis-text-gray justify-center items-center"
              >
                <Left />
              </TouchableOpacity>
            </View>

            {/* CAROUSEL */}
            <View className="w-full h-[374px] mt-4 bg-white rounded-t-3xl px-4 pt-3 justify-center items-center">
              <View className="w-full h-full rounded-2xl overflow-hidden">
                <Carousel
                  width={screenWidth - 60}
                  height={340}
                  data={carouselPhotos}
                  scrollAnimationDuration={500}
                  loop={false}
                  onSnapToItem={index => setCurrentIndex(index)}
                  renderItem={({ item }) => (
                    <Image
                      source={{ uri: item }}
                      contentFit="cover"
                      style={{ width: '100%', height: '100%' }}
                    />
                  )}
                />
              </View>
            </View>
          </View>
        </ImageBackground>

        {/* PAGINATION */}
        <Text className="text-center text-bondis-gray-secondary text-xs mt-8 mb-16px">
          Arraste para o lado para ver mais imagens
        </Text>

        <View className="flex-row justify-center mt-4">
          {carouselPhotos.map((_, index) => (
            <View
              key={index}
              className={`h-2 w-2 mx-[2px] rounded-full ${
                index === currentIndex ? 'bg-bondis-green' : 'bg-[#C4C4C4]'
              }`}
            />
          ))}
        </View>

        {/* TITLE & SHORT DESCRIPTION */}
        <Text className="text-center mt-[51px] text-2xl font-inter-bold">
          {purchaseData?.name}
        </Text>

        <Text className="text-base text-bondis-gray-dark text-center mt-4 mx-5">
          {purchaseData?.shortDescription}
        </Text>

        {/* TAGS */}
        <View className="flex-row flex-wrap gap-3 mx-5 mt-4">
          <View className="h-[37px] ml-5 rounded-full flex-row justify-center items-center gap-x-2 bg-bondis-text-gray px-4">
            <Track />
            <Text>{purchaseData && `${Math.trunc(+purchaseData.distance)}km`}</Text>
          </View>

          <View className="h-[37px] ml-5 rounded-full flex-row justify-center items-center gap-x-2 bg-bondis-text-gray px-4">
            <Track />
            <Text>520 Desafios finalizados</Text>
          </View>

          <View className="h-[37px] ml-5 rounded-full flex-row justify-center items-center gap-x-2 bg-bondis-text-gray px-4">
            <Track />
            <Text>Ideal para corrida e caminhada</Text>
          </View>
        </View>

        {/* BUTTON SHOW DETAILS */}
        {!show && (
          <TouchableOpacity
            onPress={() => setShow(true)}
            className="h-[52px] bg-bondis-green mt-[45px] mb-8 rounded-full justify-center mx-5"
            style={{ marginBottom: insets.bottom + 20 }}
          >
            <Text className="text-center font-inter-bold text-base">
              Quero escolher meu kit
            </Text>
          </TouchableOpacity>
        )}

        {/* DETAILS */}
        {show && (
          <View style={{ paddingBottom: insets.bottom }}>
            {/* DESCRIPTION */}
            <Text className="mx-5 mt-8 text-base font-inter-bold">
              Descrição:
            </Text>
            <Text className="mx-5 mt-4 text-base text-left">
              {purchaseData?.description}
            </Text>

            {/* TRACK PHOTO */}
            <View className="mx-5 mt-8 p-4 border-[1px] border-[#D9D9D9] rounded-md">
              <Text className="text-base font-inter-bold mb-[10px]">
                Percurso
              </Text>
              <Image
                source={{ uri: trackPhoto }}
                contentFit="cover"
                style={{ width: '100%', height: 115 }}
              />
            </View>

            {/* HOW PARTICIPATE */}
            <View className="mx-5 mt-8 p-4 border-[1px] border-[#D9D9D9] rounded-md">
              <Text className="text-base font-inter-bold mb-[10px]">
                Como participar?
              </Text>
              <Text className="text-base text-bondis-gray-dark text-left">
                {purchaseData?.howParticipate}
              </Text>

              <Text className="text-base text-bondis-gray-dark mt-8">
                Preço: R$
                {' '}
                {purchaseData?.price}
              </Text>
            </View>

            {/* BENEFITS */}
            <View className="mx-5 mt-8 p-4 border-[1px] border-[#D9D9D9] rounded-md">
              <Text className="text-base font-inter-bold mb-[10px]">
                Benefícios
              </Text>
              {purchaseData?.benefits.map((benefit, index) => (
                <Text
                  key={index}
                  className={`text-base text-bondis-gray-dark text-left ${
                    index !== 0 ? 'mt-6' : ''
                  }`}
                >
                  {benefit}
                </Text>
              ))}
            </View>

            {/* RULES */}
            <View className="mx-5 mt-8 p-4 border-[1px] border-[#D9D9D9] rounded-md">
              <Text className="text-base font-inter-bold mb-[10px]">Regras</Text>
              {purchaseData?.rules.map((rule, index) => (
                <Text
                  key={index}
                  className={`text-base text-bondis-gray-dark text-left ${
                    index !== 0 ? 'mt-6' : ''
                  }`}
                >
                  {`${index + 1}. ${rule}`}
                </Text>
              ))}
            </View>

            {/* Botao comprar desafio */}
            <AcceptDesafioButton desafioId={desafioId as string} />
          </View>
        )}
      </ScrollView>
    </View>
  )
}
