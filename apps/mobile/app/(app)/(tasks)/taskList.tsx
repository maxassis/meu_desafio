import type { TaskItemProps } from '@/components'
import { TrueSheet } from '@lodev09/react-native-true-sheet'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'

import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SystemBars } from 'react-native-edge-to-edge'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TaskItem, TaskItemSkeleton } from '@/components'
import Left from '../../../assets/Icon-left.svg'
import Plus from '../../../assets/plus.svg'
import { deleteTask, fetchTasks } from '../../../services/tasks-service'
import useDesafioStore from '../../../store/desafio-store'

export default function TaskList() {
  const { desafioSelecionado, setTaskData }
    = useDesafioStore()

  const [task, setTask] = useState<TaskItemProps>()
  const bottomSheetRef = useRef<TrueSheet>(null)
  const bottomSheetEditRef = useRef<TrueSheet>(null)
  const queryClient = useQueryClient()
  const insets = useSafeAreaInsets()

  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  const [sheetContent, setSheetContent] = useState<'edit' | 'confirmDelete'>(
    'edit',
  )

  const { data, isLoading, error } = useQuery<TaskItemProps[]>({
    queryKey: ['tasks', desafioSelecionado?.inscriptionId],
    queryFn: () => fetchTasks(desafioSelecionado?.inscriptionId as number),
    enabled: !!desafioSelecionado?.inscriptionId,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', desafioSelecionado?.inscriptionId] })
      queryClient.invalidateQueries({ queryKey: ['routeData', desafioSelecionado?.id] })
      queryClient.invalidateQueries({ queryKey: ['getAllDesafios'] })
      queryClient.invalidateQueries({ queryKey: ['rankData', desafioSelecionado?.id] })
      closeAllSheets()
    },
    onError: () => {
      Alert.alert('Erro ao excluir tarefa', '', [
        { text: 'Ok', style: 'cancel' },
      ])
    },
  })

  const closeAllSheets = () => {
    if (isBottomSheetOpen) {
      bottomSheetRef.current?.dismiss()
    }
    if (isEditSheetOpen) {
      bottomSheetEditRef.current?.dismiss()
    }
  }

  useEffect(() => {
    const backAction = () => {
      if (isEditSheetOpen) {
        if (sheetContent === 'confirmDelete') {
          setSheetContent('edit')
        }
        else {
          bottomSheetEditRef.current?.dismiss()
        }
        return true
      }

      if (isBottomSheetOpen) {
        bottomSheetRef.current?.dismiss()
        return true
      }

      return false
    }

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    )

    return () => backHandler.remove()
  }, [isBottomSheetOpen, isEditSheetOpen, sheetContent])

  const handleEdit = (taskData: TaskItemProps) => {
    setTask(taskData)
    bottomSheetEditRef.current?.present()
  }

  // const renderTasks = () => {
  //   if (isLoading) {
  //     return [...Array(3)].map((_, index) => <TaskItemSkeleton key={index} />);
  //   }

  //   if (error) {
  //     return (
  //       <View className="flex-1 justify-center items-center py-10">
  //         <Text>Erro ao carregar tarefas</Text>
  //       </View>
  //     );
  //   }

  //   if (data?.length === 0) {
  //     return (
  //       <View className="flex-1 justify-center items-center py-10">
  //         <Text>Nenhuma atividade criada</Text>
  //       </View>
  //     );
  //   }

  //   return data?.map((task) => (
  //     <TaskItem key={task.id} task={task} openModalEdit={handleEdit} />
  //   ));
  // };

  return (
    <View
      className="flex-1 bg-[#F1F1F1]"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <FlatList
        data={data}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TaskItem key={item.id} task={item} openModalEdit={handleEdit} />
        )}
        ListHeaderComponent={(
          <View className="bg-white mb-7">
            <View className="flex-row mt-[29.5] px-5">
              <TouchableOpacity
                className="w-[30px] h-[30px]"
                onPress={() => router.replace('/dashboard')}
              >
                <Left />
              </TouchableOpacity>
              <Text className="text-base font-inter-bold mx-auto">
                Atividades recentes
              </Text>
            </View>

            <View className="h-[60px] mt-4 pt-2 px-5 mb-7">
              <Text className="text-sm text-bondis-gray-secondary">
                Desafio
              </Text>
              <Text className="text-base font-inter-bold mt-2">
                {desafioSelecionado?.name}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          isLoading ? (
            <View>
              {[...Array.from({ length: 3 })].map((_, index) => (
                <TaskItemSkeleton key={index} />
              ))}
            </View>
          ) : error ? (
            <View className="flex-1 justify-center items-center py-10">
              <Text>Erro ao carregar tarefas</Text>
            </View>
          ) : (
            <View className="flex-1 justify-center items-center py-10">
              <Text>Nenhuma atividade criada</Text>
            </View>
          )
        }
        overScrollMode="never"
      />

      {/* Botão flutuante */}
      <TouchableOpacity
        onPress={() => bottomSheetRef.current?.present()}
        className="rounded-full bg-bondis-green absolute w-16 h-16 justify-center items-center right-4"
        style={{ bottom: insets.bottom + 10 }}
      >
        <Plus />
      </TouchableOpacity>

      {/* Bottom Sheet - Adicionar */}
      <TrueSheet
        ref={bottomSheetRef}
        detents={[0.30]}
        cornerRadius={20}
        backgroundColor="white"
        onDidPresent={() => setIsBottomSheetOpen(true)}
        onDidDismiss={() => setIsBottomSheetOpen(false)}
      >
        <View className="flex-1">
          <Text className="font-inter-bold mt-[10px] text-base mx-5 mb-4">
            Adicione uma atividade
          </Text>
          <View className="mx-5">
            <TouchableOpacity
              onPress={() => {
                if (task) {
                  setTaskData(task)
                }
                if (isBottomSheetOpen) {
                  bottomSheetRef.current?.dismiss()
                }
                router.push('/rastreador')
              }}
              className="h-[51px] justify-center items-center border-b-[0.2px] border-b-gray-400"
            >
              <Text className="text-base">Iniciar agora</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (task) {
                  setTaskData(task)
                }
                if (isBottomSheetOpen) {
                  bottomSheetRef.current?.dismiss()
                }
                router.push('/createTask')
              }}
              className="h-[51px] justify-center items-center border-b-[0.2px] border-b-gray-400"
            >
              <Text className="text-base">Cadastrar manualmente</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TrueSheet>

      {/* Bottom Sheet - Editar/Excluir */}
      <TrueSheet
        ref={bottomSheetEditRef}
        detents={[0.30]}
        cornerRadius={20}
        backgroundColor="white"
        onDidPresent={() => setIsEditSheetOpen(true)}
        onDidDismiss={() => {
          setIsEditSheetOpen(false)
          setSheetContent('edit')
        }}
      >
        <View className="flex-1 pt-6">
          {sheetContent === 'edit' ? (
            <View className="mx-5">
              <TouchableOpacity
                onPress={() => {
                  if (task) {
                    setTaskData(task)
                    if (isEditSheetOpen) {
                      bottomSheetEditRef.current?.dismiss()
                    }
                    router.push(task.gpsTask ? '/taskEditGps' : '/taskEdit')
                  }
                }}
                className="h-[51px] justify-center items-center border-b-[0.2px] border-b-gray-400"
              >
                <Text className="text-base">Editar atividade</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setSheetContent('confirmDelete')
                }}
                className="h-[51px] justify-center items-center"
              >
                <Text className="text-bondis-alert-red text-base">
                  Excluir atividade
                </Text>
              </TouchableOpacity>
            </View>
          ) : deleteMutation.isPending ? (
            <View className="flex-1 flex-row justify-center items-center gap-2">
              <Text className="text-base">Excluindo atividade...</Text>
              <ActivityIndicator size="small" color="#12FF55" />
            </View>
          ) : (
            <View className="mx-5">
              <Text className="font-inter-bold mt-[10px] text-base text-center">
                Tem certeza que deseja excluir esta atividade?
              </Text>
              <Text className="text-center text-base mt-2">
                Esta ação não podera ser desfeita
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (task) {
                    deleteMutation.mutate(task.id)
                  }
                }}
                className="h-[51px] mt-6 justify-center items-center border-b-[0.2px] border-b-gray-400"
              >
                <Text className="text-bondis-alert-red text-base">
                  Excluir atividade
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setSheetContent('edit')
                }}
                className="h-[51px] justify-center items-center"
              >
                <Text className="text-black text-base">Voltar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TrueSheet>

      <SystemBars style="dark" />
    </View>
  )
}
