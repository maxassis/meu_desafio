import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { Modal, Text, TouchableOpacity, View } from 'react-native'
import WheelPicker from 'react-native-wheely'

interface Time {
  hours: number
  minutes: number
  seconds: number
}

interface TimePickerModalRef {
  clearTime: () => void
  changeTime: (hours: number, minutes: number, seconds: number) => void
}

export interface TimePickerModalProps {
  visible: boolean
  onClose: ({ hours, minutes, seconds }: Time) => void
  onlyClose: (status: boolean) => void
}

const TimePickerModal = forwardRef<TimePickerModalRef, TimePickerModalProps>(
  ({ onClose, visible, onlyClose }, ref) => {
    const [selectedHours, setSelectedHours] = useState<number>(0)
    const [selectedMinutes, setSelectedMinutes] = useState<number>(0)
    const [selectedSeconds, setSelectedSeconds] = useState<number>(0)

    const [initialHours, setInitialHours] = useState<number>(0)
    const [initialMinutes, setInitialMinutes] = useState<number>(0)
    const [initialSeconds, setInitialSeconds] = useState<number>(0)

    const hours = [...Array.from({ length: 24 }).keys()].map(String)
    const minutesAndSeconds = [...Array.from({ length: 60 }).keys()].map(String)

    useEffect(() => {
      if (visible) {
        setInitialHours(selectedHours)
        setInitialMinutes(selectedMinutes)
        setInitialSeconds(selectedSeconds)
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible])

    useImperativeHandle(ref, () => ({
      clearTime,
      changeTime,
    }))

    function clearTime() {
      setSelectedHours(0)
      setSelectedMinutes(0)
      setSelectedSeconds(0)
    }

    function changeTime(hours: number, minutes: number, seconds: number) {
      setSelectedHours(hours || 0)
      setSelectedMinutes(minutes || 0)
      setSelectedSeconds(seconds || 0)
    }

    function handleCancel() {
      setSelectedHours(initialHours)
      setSelectedMinutes(initialMinutes)
      setSelectedSeconds(initialSeconds)
      onlyClose(false)
    }

    return (
      <Modal
        transparent={true}
        visible={visible}
      >
        <View className="flex-1 justify-center items-center bg-bondis-overlay">
          <View className="w-[350px] bg-white p-5 rounded-[10px] items-center">
            <Text className="text-lg text-center">Selecione a duração:</Text>
            <View className="flex-row justify-around items-center w-[95%]">
              <View className="flex-row items-center">
                <WheelPicker
                  selectedIndex={selectedHours}
                  options={hours}
                  onChange={index => setSelectedHours(index)}
                  containerStyle={{ width: 55 }}
                />
                <Text className="font-inter-bold ml-[5px]">h</Text>
              </View>
              <View className="flex-row items-center">
                <WheelPicker
                  selectedIndex={selectedMinutes}
                  options={minutesAndSeconds}
                  onChange={index => setSelectedMinutes(index)}
                  containerStyle={{ width: 55 }}
                />
                <Text className="font-inter-bold ml-[5px]">min</Text>
              </View>

              <View className="flex-row items-center">
                <WheelPicker
                  selectedIndex={selectedSeconds}
                  options={minutesAndSeconds}
                  onChange={index => setSelectedSeconds(index)}
                  containerStyle={{ width: 55 }}
                />
                <Text className="font-inter-bold ml-[5px]">s</Text>
              </View>
            </View>
            <View className="mt-5 items-center">
              <Text className="text-lg items-center font-inter-bold">
                Total:
                {' '}
                {selectedHours.toString().padStart(2, '0')}
                :
                {selectedMinutes.toString().padStart(2, '0')}
                :
                {selectedSeconds.toString().padStart(2, '0')}
              </Text>
            </View>
            <View className="flex-row items-center gap-x-4">
              <TouchableOpacity onPress={handleCancel} className="mt-5 justify-center items-center py-[10px] px-5 rounded-[5px] border-[1px] border-[#D9D9D9]">
                <Text>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onClose({ hours: selectedHours, minutes: selectedMinutes, seconds: selectedSeconds })} className="mt-5 py-[10px] px-5 rounded-[5px] bg-bondis-green justify-center items-center">
                <Text>Selecionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    )
  },
)

TimePickerModal.displayName = 'TimePickerModal'

export { TimePickerModal, TimePickerModalRef }
