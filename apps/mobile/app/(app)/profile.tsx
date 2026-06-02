import Feather from '@expo/vector-icons/Feather'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Link, router, useLocalSearchParams } from 'expo-router'
import React, { useState } from 'react'
import {
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SystemBars } from 'react-native-edge-to-edge'
import * as Progress from 'react-native-progress'
// import TaskItem from "@/components/taskItem";
// import TaskItemSkeleton from "@/components";
import Carousel from 'react-native-reanimated-carousel'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TaskItem, TaskItemSkeleton } from '@/components'
import {
  AvatarSkeleton,
  SectionTitleSkeleton,
  StatsSkeleton,
  UserInfoSkeleton,
} from '@/components/Skeletons/skeletons'
import { Image } from '@/components/uniwind-components'
import { fetchAllDesafios } from '@/services/desafios-service'
import { getProfile } from '@/services/users-service'
import useDesafioStore from '@/store/desafio-store'
import Rigth from '../../assets/gray-right.svg'
import PinIcon from '../../assets/map-pin-black.svg'
import 'dayjs/locale/pt-br'

export default function Profile() {
  const width = Dimensions.get('window').width
  const insets = useSafeAreaInsets()
  const [currentIndex, setCurrentIndex] = useState(0)
  const { setDesafioSelecionado } = useDesafioStore()
  const { userId } = useLocalSearchParams<{ userId: string }>()

  const { data } = useQuery({
    queryKey: ['desafios', userId],
    queryFn: () => getProfile(userId),
    staleTime: 5 * 60 * 1000,
  })

  const {
    data: allDesafios,
  } = useQuery({
    queryKey: ['getAllDesafios'],
    queryFn: fetchAllDesafios,
    staleTime: 5 * 60 * 1000,
  })

  function handleChallengePress(id: string) {
    const desafio = allDesafios?.find(d => d.id === id)

    if (desafio) {
      if (desafio.isRegistered) {
        setDesafioSelecionado(desafio)
        router.push({ pathname: '/map' })
      }
      else {
        router.push({ pathname: '/buy', params: { desafioId: id } })
      }
    }
  }

  function formatarDataComDayjs(dataString: string) {
    dayjs.locale('pt-br')
    const data = dayjs(dataString)
    return data.format('DD [de] MMM. YYYY')
  }

  return (
    <ScrollView
      className="flex-1 bg-white"
      overScrollMode="never"
      showsVerticalScrollIndicator={false}
    >
      <View
        className="mb-[10px] pb-4 bg-bondis-black"
        style={{ paddingTop: insets.top }}
      >
        <View className="flex-row h-[92px] justify-between mx-4 mt-4 ">
          <Link href="../" asChild>
            <TouchableOpacity className="w-12 h-12 justify-center items-center">
              <Feather name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
          </Link>

          {data ? (
            data?.avatarUrl ? (
              <Image
                source={{ uri: data?.avatarUrl }}
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
            )
          ) : (
            <AvatarSkeleton />
          )}

          <View className="w-12 h-12" />
        </View>

        {data ? (
          <>
            <Text className="text-bondis-green text-lg font-anton-regular text-center mt-[29px]">
              {data?.name}
            </Text>
            <Text className="text-center text-bondis-text-gray font-inter-regular text-sm mt-2 mx-4">
              {data?.bio}
            </Text>
          </>
        ) : (
          <UserInfoSkeleton />
        )}

        {data ? (
          <View className="flex-row justify-between h-[51px] mt-[10px] mx-4">
            <View>
              <Text className="text-white text-lg text-center font-anton-regular">
                {data?.activeInscriptions}
              </Text>
              <Text className="text-[#828282] font-inter-regular">
                {data?.activeInscriptions === 1
                  ? 'Desafio ativo'
                  : 'Desafios ativos'}
              </Text>
            </View>
            <View>
              <Text className="text-white text-lg text-center font-anton-regular">
                {data?.completedChallengesCount}
              </Text>
              <Text className="text-[#828282] font-inter-regular">
                Desafios finalizados
              </Text>
            </View>
            <View>
              <Text className="text-white text-lg text-center font-anton-regular">
                {`${data?.totalDistance.toFixed(2)} Km`}
              </Text>
              <Text className="text-[#828282] font-inter-regular">
                Percorridos
              </Text>
            </View>
          </View>
        ) : (
          <StatsSkeleton />
        )}
      </View>

      {/* Título dos desafios ativos */}
      {data ? (
        <Text className="font-anton-regular text-xl ml-4 mb-2 mt-8">
          Desafios ativos (
          {data?.activeChallenges?.length || 0}
          )
        </Text>
      ) : (
        <View className="ml-4 mb-2 mt-8">
          <SectionTitleSkeleton width={200} />
        </View>
      )}

      {/* Carousel dos desafios ativos */}
      {data ? (
        data.activeChallenges
        && data.activeChallenges.length > 0 && (
          <View style={{ height: 380 }}>
            <Carousel
              loop={false}
              width={width}
              height={410}
              autoPlay={false}
              data={data.activeChallenges}
              scrollAnimationDuration={1000}
              onSnapToItem={index => setCurrentIndex(index)}
              mode="parallax"
              modeConfig={{
                parallaxScrollingScale: 0.95,
                parallaxScrollingOffset: 30,
              }}
              renderItem={({ item }) => (
                <View
                  style={{
                    width: width - 20,
                    // height: 410,
                    paddingHorizontal: 1,
                  }}
                >
                  <View className="rounded-lg">
                    <View className="w-full rounded-xl border border-bondis-text-gray overflow-hidden">
                      <Image
                        source={{ uri: item.photo }}
                        style={{
                          width: '100%',
                          height: 155,
                        }}
                        contentFit="cover"
                      />

                      <View className="p-4">
                        <View className="flex-row justify-between">
                          <Text className="font-bold">{item.name}</Text>
                          <View className="flex-row items-center bg-bondis-text-gray rounded-xl px-2">
                            <PinIcon className="w-6 h-6" />
                            <Text className="text-xs ml-1">
                              {item.totalDistance.toFixed(2)}
                              Km
                            </Text>
                          </View>
                        </View>

                        <Text className="text-xs mt-1 mb-4">
                          Iniciado em
                          {' '}
                          {formatarDataComDayjs(item.createdAt)}
                        </Text>

                        <Progress.Bar
                          progress={item.completionPercentage / 100}
                          width={null}
                          height={4}
                          color="#12FF55"
                          unfilledColor="#999"
                          borderColor="transparent"
                          borderWidth={0}
                        />

                        <View className="flex-row justify-between mt-[6px]">
                          <Text className="text-xs font-bold">
                            {item.completionPercentage}
                            %
                          </Text>
                          <Text className="text-xs">
                            {item.distanceCovered}
                            {' '}
                            de
                            {' '}
                            {item.totalDistance.toFixed(2)}
                            km
                          </Text>
                        </View>

                        <View className="border-b-[0.6px] border-b-[#D9D9D9] mt-4"></View>

                        <View className="mt-5 flex-row items-center mx-auto ">
                          <Image
                            source={require('../../assets/frame.png')}
                            style={{
                              width: 66,
                              height: 24,
                              marginRight: 8,
                            }}
                            contentFit="cover"
                          />

                          <Text className="text-xs text-[#595959]">
                            + 200 atletas participantes
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => handleChallengePress(item.id)}
                          className="h-[30px] bg-bondis-green mt-5 rounded-full items-center justify-center"
                        >
                          <Text className="font-inter-bold text-xs text-black">
                            Ver desafio
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            />
          </View>
        )
      ) : (
        // Skeleton para carousel de desafios ativos
        <View
          style={{
            height: 380,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: width - 40,
              height: 380,
              borderRadius: 12,
              backgroundColor: '#e0e0e0',
            }}
          />
        </View>
      )}

      {/* Indicador de posição */}
      {data && data.activeChallenges && data.activeChallenges.length > 1 && (
        <View className="flex-row justify-center items-center mt-2 mb-4">
          {data.activeChallenges.map((_, index) => (
            <View
              key={index}
              className={`mx-1 rounded-full ${
                index === currentIndex
                  ? 'w-[10px] h-[10px] bg-bondis-green'
                  : 'w-[6px] h-[6px] bg-gray-300'
              }`}
            />
          ))}
        </View>
      )}

      {/* Desafios concluídos */}
      {data ? (
        <Text className="font-anton-regular text-xl mt-4 ml-4 mb-2">
          Desafios concluídos (
          {data?.completedChallenges?.length || 0}
          )
        </Text>
      ) : (
        <View className="ml-4 mb-2 mt-4">
          <SectionTitleSkeleton width={230} />
        </View>
      )}

      <View className="mt-[10px] rounded-lg mx-4 pl-2 pr-4 mb-4">
        {data ? (
          data?.completedChallenges.map((challenge, index) => (
            <View
              className="flex-row py-[10px] mx-auto border-b-[0.6px] border-b-[#D9D9D9]"
              key={index}
            >
              <Image
                source={{ uri: challenge.photo }}
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 4,
                  marginRight: 8,
                }}
                contentFit="cover"
              />

              <View className="flex-1 flex-row h-[76px] justify-between items-center">
                <View className="justify-between h-full">
                  <Text className="font-bold  text-base">{challenge.name}</Text>

                  <Text className="text-[#595959]">
                    Concluído em
                    {' '}
                    {formatarDataComDayjs(
                      data?.completedChallenges[index].completedAt,
                    )}
                  </Text>

                  <View className="flex-row self-start min-w-fit items-center bg-bondis-text-gray mt-2 rounded-xl px-2 justify-self-start ">
                    <PinIcon className="w-6 h-6" />
                    <Text className="text-xs ml-1">
                      {data?.completedChallenges[index].totalDistance.toFixed(
                        2,
                      )}
                      KM
                    </Text>
                  </View>
                </View>

                <Rigth />
              </View>
            </View>
          ))
        ) : (
          // Skeleton para desafios concluídos
          <>
            <View className="flex-row py-[10px] mx-auto border-b-[1px] border-b-[#D9D9D9]">
              <View
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 4,
                  backgroundColor: '#e0e0e0',
                  marginRight: 8,
                }}
              />
              <View className="flex-1 justify-center">
                <View
                  style={{
                    width: '80%',
                    height: 16,
                    borderRadius: 4,
                    backgroundColor: '#e0e0e0',
                    marginBottom: 8,
                  }}
                />
                <View
                  style={{
                    width: '60%',
                    height: 12,
                    borderRadius: 3,
                    backgroundColor: '#e0e0e0',
                    marginBottom: 12,
                  }}
                />
                <View
                  style={{
                    width: 80,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: '#e0e0e0',
                  }}
                />
              </View>
            </View>
            <View className="flex-row py-[10px] mx-auto border-b-[1px] border-b-[#D9D9D9]">
              <View
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 4,
                  backgroundColor: '#e0e0e0',
                  marginRight: 8,
                }}
              />
              <View className="flex-1 justify-center">
                <View
                  style={{
                    width: '80%',
                    height: 16,
                    borderRadius: 4,
                    backgroundColor: '#e0e0e0',
                    marginBottom: 8,
                  }}
                />
                <View
                  style={{
                    width: '60%',
                    height: 12,
                    borderRadius: 3,
                    backgroundColor: '#e0e0e0',
                    marginBottom: 12,
                  }}
                />
                <View
                  style={{
                    width: 80,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: '#e0e0e0',
                  }}
                />
              </View>
            </View>
          </>
        )}
      </View>

      {/* Últimas atividades */}
      {data ? (
        <Text className="font-anton-regular text-xl ml-4 mt-4 mb-2">
          Últimas atividades (
          {data?.recentTasks.length}
          )
        </Text>
      ) : (
        <View className="ml-4 mb-2 mt-4">
          <SectionTitleSkeleton width={200} />
        </View>
      )}

      <View style={{ marginBottom: insets.bottom }}>
        {data ? (
          data?.recentTasks.map((activity, index) => (
            <View key={index}>
              <TaskItem
                task={{ ...activity, duration: +activity.duration }}
                openModalEdit={() => null}
                edit={false}
              />
              <View className="border-b-[0.6px] border-b-[#D9D9D9] mx-4"></View>
            </View>
          ))
        ) : (
          // Skeleton para últimas atividades
          <>
            <TaskItemSkeleton />
            <TaskItemSkeleton />
            <TaskItemSkeleton />
          </>
        )}
      </View>
      <SystemBars style="light" />
    </ScrollView>
  )
}
