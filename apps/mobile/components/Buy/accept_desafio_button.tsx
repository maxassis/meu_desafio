import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Alert, Text, TouchableOpacity } from 'react-native'
import { registerUserInDesafio } from '@/services/desafios-service'

function AcceptDesafioButton({
  desafioId,
}: {
  desafioId: string
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showBtn, setShowBtn] = useState(false)

  const mutation = useMutation({
    mutationFn: () => registerUserInDesafio(desafioId),
    onSuccess: async () => {
      setShowBtn(true)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['getAllDesafios'] }),
        queryClient.invalidateQueries({ queryKey: ['userData'] }),
        queryClient.invalidateQueries({ queryKey: ['purchaseData', desafioId] }),
      ])
      await queryClient.refetchQueries({ queryKey: ['getAllDesafios'], type: 'all' })
      router.replace('/dashboard')
    },
    onError: (error: any) => {
      console.error('Erro ao aceitar desafio:', error)
      Alert.alert('Erro', error?.message ?? 'Erro ao aceitar o desafio. Tente novamente.')
    },
  })

  return (
    <TouchableOpacity
      onPress={() => mutation.mutate()}
      className={`h-[52px] bg-bondis-green mt-[45px] mb-4 rounded-full justify-center mx-5 ${showBtn ? 'hidden' : ''}`}
      disabled={mutation.isPending || showBtn}
    >
      {mutation.isPending ? (
        <ActivityIndicator color="black" />
      ) : (
        <Text className="text-center font-inter-bold text-base text-black">
          Aceito o desafio 💪
        </Text>
      )}
    </TouchableOpacity>
  )
}

export { AcceptDesafioButton }
