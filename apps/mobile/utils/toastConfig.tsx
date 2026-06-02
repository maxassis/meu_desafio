import Feather from '@expo/vector-icons/Feather'
import React from 'react'
import { Text, View } from 'react-native'
import { BaseToast } from 'react-native-toast-message'
import Error from '../assets/error-toast.svg'
import Ok from '../assets/ok-toast.svg'

export const toastConfig: any = {
  success: ({ text1, text2, ...rest }: { text1: string, text2?: string }) => (
    <BaseToast
      {...rest}
      style={{
        borderLeftWidth: 0,
        backgroundColor: '#1A1A1A',
        paddingHorizontal: 16,
        height: 91,
        width: '90%',
        marginTop: 20,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
      }}
      text2Style={{
        fontSize: 14,
        color: '#FFFFFF',
      }}
      renderLeadingIcon={() => (
        <Ok style={{ marginRight: 5, marginVertical: 'auto' }} />
      )}
      text1={text1}
      text2={text2}
    />
  ),

  error: ({ text1, text2, ...rest }: { text1: string, text2?: string }) => (
    <BaseToast
      {...rest}
      style={{
        borderLeftWidth: 0,
        backgroundColor: '#1A1A1A',
        paddingHorizontal: 16,
        height: 91,
        width: '90%',
        marginTop: 20,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
      }}
      text2Style={{
        fontSize: 14,
        color: '#FFFFFF',
      }}
      renderLeadingIcon={() => (
        <Error style={{ marginRight: 5, marginVertical: 'auto' }} />
      )}
      text1={text1}
      text2={text2}
    />
  ),

  info: ({ text1, text2, ...rest }: { text1: string, text2?: string }) => (
    <BaseToast
      {...rest}
      style={{ borderLeftColor: '#1E90FF', backgroundColor: '#F0F8FF' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: 'bold',
        color: '#00008B',
      }}
      text2Style={{
        fontSize: 14,
        color: '#00008B',
      }}
      renderLeadingIcon={() => (
        <Feather
          name="info"
          size={24}
          color="#00008B"
          style={{ marginRight: 10 }}
        />
      )}
      text1={text1}
      text2={text2}
    />
  ),

  custom: ({ text1, text2 }: { text1: string, text2?: string }) => (
    <View
      style={{
        height: 60,
        width: '90%',
        backgroundColor: '#333',
        padding: 10,
        borderRadius: 5,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <Feather name="star" size={24} color="gold" style={{ marginRight: 10 }} />
      <View>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>{text1}</Text>
        <Text style={{ color: 'white' }}>{text2}</Text>
      </View>
    </View>
  ),
}
