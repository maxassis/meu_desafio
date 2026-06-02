import type { RouteResponse } from '@/@types/desafio-get-desafio'
import type { RankData } from '@/@types/users-get-ranking'
import type { UserData } from '@/@types/users-get-user-data'
import { TrueSheet } from '@lodev09/react-native-true-sheet'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import React, { useEffect, useRef } from 'react'
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import * as Progress from 'react-native-progress'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from '@/components/uniwind-components'
import { fetchAllDesafios } from '@/services/desafios-service'
import { fetchRankData } from '@/services/users-service'
import useDesafioStore from '@/store/desafio-store'
import { convertSecondsToTimeString } from '@/utils'
import Winner from '../../assets/winner.svg'
import { UserTime } from './user_time'

interface BottomSheetProps {
  routeData: RouteResponse | undefined
  userProgress: number
  userDistance: number
  userData: UserData | undefined
}

function RankingBottomSheet({
  routeData,
  userProgress,
  userDistance,
  userData,
}: BottomSheetProps) {
  const bottomSheetRef = useRef<TrueSheet>(null)
  const { desafioSelecionado } = useDesafioStore()
  const insets = useSafeAreaInsets()
  const hasPresented = useRef(false)

  useEffect(() => {
    if (!hasPresented.current && bottomSheetRef.current) {
      hasPresented.current = true
      bottomSheetRef.current.present(0)
    }
  }, [])

  const { data: rankData, isLoading } = useQuery<
    RankData[],
    Error
  >({
    queryKey: ['rankData', desafioSelecionado?.id],
    queryFn: () => fetchRankData(`${desafioSelecionado?.id}`),
    staleTime: 1000 * 60 * 5,
  })

  const {
    data: allDesafios,
  } = useQuery({
    queryKey: ['getAllDesafios'],
    queryFn: fetchAllDesafios,
    staleTime: 5 * 60 * 1000,
  })

  const currentDesafio = allDesafios?.find(desafio => desafio.id === desafioSelecionado?.id)

  const handleUserPress = (userId: string) => {
    if (userData?.usersId === userId) {
      router.push('/dashboard')
    }
    else {
      router.push({ pathname: '/profile', params: { userId } })
    }
  }

  return (
    <TrueSheet
      ref={bottomSheetRef}
      detents={[0.16, 0.85]}
      cornerRadius={20}
      backgroundColor="white"
      dismissible={false}
      dimmed={false}
      scrollable
      scrollableOptions={{ scrollingExpandsSheet: false }}
    >
      <ScrollView>
        <SafeAreaView edges={['bottom']}>
          <View className="px-5 pt-6">
            <Text className="text-sm font-inter-regular text-bondis-gray-secondary">
              Desafio
            </Text>
            <Text className="text-2xl font-anton-regular mt-4 mb-4">
              {routeData?.name}
            </Text>

            <Progress.Bar
              progress={userProgress || 0}
              width={null}
              height={8}
              color="#12FF55"
              unfilledColor="#565656"
              borderColor="transparent"
              borderWidth={0}
            />

            <Text
              className="font-inter-bold text-base mt-2"
              style={{ opacity: isLoading ? 0 : 1 }}
            >
              {!isLoading && userDistance ? (
                <>
                  {userDistance > Number(routeData?.distance)
                    ? Number(routeData?.distance).toFixed(3)
                    : userDistance}
                  {' '}
                  de
                  {' '}
                  {`${Number(routeData?.distance).toFixed(3)} km`}
                </>
              ) : (
                '0 de 0.000 km'
              )}
            </Text>

            <View className="flex-row justify-between mt-6">
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/taskList', params: { origin: 'map' } })}
                className={`h-[88px] w-3/12 border-[0.8px] border-[#D9D9D9] rounded justify-center items-center ${(currentDesafio?.progressPercentage ?? 0) >= 100 ? 'opacity-50' : ''}`}
                disabled={(currentDesafio?.progressPercentage ?? 0) >= 100}
              >
                <Text className="font-anton-regular text-2xl">{currentDesafio?.tasksCount}</Text>
                <Text className="text-[10px] font-inter-bold">ATIVIDADE&gt; </Text>
              </TouchableOpacity>
              <View className="h-[88px] w-3/12 border-[0.8px] border-[#D9D9D9] rounded justify-center items-center">
                <Text className="font-anton-regular text-2xl">
                  {convertSecondsToTimeString(currentDesafio?.totalDuration ?? 0)}
                </Text>
                <Text className="text-[10px] font-inter-regular">TREINO</Text>
              </View>
              <View className="h-[88px] w-3/12 border-[0.8px] border-[#D9D9D9] rounded justify-center items-center">
                <Text className="font-anton-regular text-2xl">
                  {currentDesafio?.progressPercentage !== undefined ? Math.trunc(currentDesafio.progressPercentage) : '0'}
                  %
                </Text>
                <Text className="text-[10px] font-inter-regular">COMPLETADO</Text>
              </View>
            </View>

            <View className="w-full h-[92px] bg-bondis-black mt-6 rounded p-4 flex-row items-center ">
              <Image source={require('../../assets/top.png')} />
              <Text className="flex-1 flex-wrap ml-[10px] text-center">
                <Text className="text-bondis-green font-inter-bold">
                  {userData?.username}
                </Text>
                <Text
                  numberOfLines={3}
                  className="text-bondis-text-gray font-inter-regular text-justify"
                >
                  , Mantenha a média de 5km corridos por semana e conclua seu
                  desafio em apenas 10 semanas!
                </Text>
              </Text>
            </View>

            <Text className="mt-6 font-anton-regular text-lg">
              Classificação Geral
            </Text>

            {/* Container principal do pódio com overflow visible */}
            <View
              className="flex-row justify-between items-end"
              style={{
                overflow: 'visible',
                paddingTop: 0,
                marginTop: 24,
              }}
            >
              {/* Terceira Posição */}
              {rankData && rankData.length > 2 && rankData[2]?.userId ? (
                <View
                  className="w-[87px] h-[230px] items-center justify-between"
                  style={{
                    overflow: 'visible',
                  }}
                >
                  <View className="rounded-full justify-center items-center w-[35.76px] h-[35.76px] bg-bondis-text-gray">
                    <Text className="text-sm font-inter-bold">3</Text>
                  </View>

                  <View
                    className="w-full h-[140px] relative justify-end items-center"
                    style={{
                      overflow: 'visible',
                    }}
                  >
                    <LinearGradient
                      colors={['#12FF55', 'white']}
                      className="absolute inset-0 w-full h-full"
                    />

                    <TouchableOpacity
                      onPress={() => handleUserPress(rankData[2].userId)}
                      className="absolute bg-white rounded-full flex items-center justify-center w-[92px] h-[91px]"
                      style={{
                        top: -50,
                        zIndex: 10,
                      }}
                    >
                      <Image
                        className="w-[85px] h-[85px] rounded-full"
                        source={
                          rankData[2].userAvatar
                            ? { uri: rankData[2].userAvatar }
                            : require('../../assets/user2.png')
                        }
                      />
                    </TouchableOpacity>

                    <Text
                      numberOfLines={2}
                      className="font-inter-bold text-sm mb-[10px]"
                      style={{ marginTop: 35 }}
                    >
                      {rankData[2].userName}
                    </Text>
                    <Text className="font-inter-regular text-xs text-[#757575] mb-[10px]">
                      { convertSecondsToTimeString(rankData[2].totalDurationSeconds) }
                    </Text>
                  </View>
                </View>
              ) : (
                <View className="w-[87px] h-[230px]" />
              )}

              {/* Primeira Posição */}
              {rankData && rankData.length > 0 && rankData[0]?.userId ? (
                <View
                  className="w-[87px] h-[287px] items-center justify-between"
                  style={{
                    overflow: 'visible',
                  }}
                >
                  <Winner />

                  <View
                    className="w-full h-[200px] relative items-center justify-end"
                    style={{
                      overflow: 'visible',
                    }}
                  >
                    <LinearGradient
                      colors={['#12FF55', 'white']}
                      className="absolute inset-0 w-full h-full"
                    />

                    <TouchableOpacity
                      onPress={() => handleUserPress(rankData[0].userId)}
                      className="absolute bg-white rounded-full flex items-center justify-center w-[92px] h-[91px]"
                      style={{
                        top: -50,
                        zIndex: 10,
                      }}
                    >
                      <Image
                        className="w-[85px] h-[85px] rounded-full"
                        source={
                          rankData[0].userAvatar
                            ? { uri: rankData[0].userAvatar }
                            : require('../../assets/user2.png')
                        }
                      />
                    </TouchableOpacity>

                    <Text
                      numberOfLines={2}
                      className="font-inter-bold text-sm mb-[10px]"
                      style={{ marginTop: 35 }}
                    >
                      {rankData[0].userName}
                    </Text>
                    <Text className="font-inter-regular text-xs text-[#757575] mb-[10px]">
                      {convertSecondsToTimeString(rankData[0].totalDurationSeconds)}
                    </Text>
                  </View>
                </View>
              ) : (
                <View className="w-[87px] h-[287px]" />
              )}

              {/* Segunda Posição */}
              {rankData && rankData.length > 1 && rankData[1]?.userId ? (
                <View
                  className="w-[87px] h-[260px] items-center justify-between"
                  style={{
                    overflow: 'visible',
                  }}
                >
                  <View className="rounded-full mb-2 justify-center items-center w-[35.76px] h-[35.76px] bg-bondis-text-gray">
                    <Text className="text-sm font-inter-bold">2</Text>
                  </View>

                  <View
                    className="relative w-full h-[170px] justify-end items-center"
                    style={{
                      overflow: 'visible',
                    }}
                  >
                    <LinearGradient
                      colors={['#12FF55', 'white']}
                      className="absolute inset-0 w-full h-full"
                    />

                    <TouchableOpacity
                      onPress={() => handleUserPress(rankData[1].userId)}
                      className="absolute bg-white rounded-full flex items-center justify-center w-[92px] h-[91px]"
                      style={{
                        top: -50,
                        zIndex: 10,
                      }}
                    >
                      <Image
                        className="w-[85px] h-[85px] rounded-full"
                        source={
                          rankData[1].userAvatar
                            ? { uri: rankData[1].userAvatar }
                            : require('../../assets/user2.png')
                        }
                      />
                    </TouchableOpacity>

                    <Text
                      numberOfLines={2}
                      className="font-inter-bold text-sm mb-[10px]"
                      style={{ marginTop: 35 }}
                    >
                      {rankData[1].userName}
                    </Text>
                    <Text className="font-inter-regular text-xs text-[#757575] mb-[10px]">
                      {convertSecondsToTimeString(rankData[1].totalDurationSeconds)}
                    </Text>
                  </View>
                </View>
              ) : (
                <View className="w-[87px] h-[260px]" />
              )}
            </View>

            <View className="mt-12" style={{ marginBottom: insets.bottom }}>
              {rankData
                && rankData
                  .filter(user => user.position >= 4)
                  .map(user => (
                    <TouchableOpacity
                      key={user.userId}
                      onPress={() => handleUserPress(user.userId)}
                    >
                      <UserTime
                        position={user.position}
                        userId={user.userId}
                        userName={user.userName}
                        userAvatar={user.userAvatar}
                        totalDistance={user.totalDistance}
                        totalDuration={user.totalDurationSeconds}
                        avgSpeed={user.avgSpeed}
                        isCurrentUser={userData?.usersId === user.userId}
                      />
                    </TouchableOpacity>
                  ))}
            </View>
          </View>
        </SafeAreaView>
      </ScrollView>
    </TrueSheet>
  )
}

export { RankingBottomSheet }
