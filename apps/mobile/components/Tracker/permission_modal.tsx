import React from 'react'
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface PermissionStep {
  title: string
  description: string
}

interface PermissionModalProps {
  visible: boolean
  onAccept: () => void
  onDecline: () => void
  title?: string
  message?: string
  steps?: PermissionStep[]
  acceptLabel?: string
  declineLabel?: string
}

const PermissionModal: React.FC<PermissionModalProps> = ({
  visible,
  onAccept,
  onDecline,
  title = 'Ative a localização do seu dispositivo',
  message = 'Os serviços de localização estão desativados. Ligue o GPS do dispositivo para que possamos iniciar o rastreamento da sua atividade.',
  steps,
  acceptLabel = 'Continuar',
  declineLabel = 'Agora não',
}) => {
  const defaultSteps: PermissionStep[] = [
    {
      title: 'Abra as configurações',
      description: 'Ative os serviços de localização do seu celular.',
    },
    {
      title: 'Volte ao app',
      description: 'Assim que o GPS estiver ligado, continuamos a configuração.',
    },
  ]

  const modalSteps = steps ?? defaultSteps

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onDecline}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalText}>
            {message}
          </Text>

          {modalSteps.map((step, index) => (
            <View key={`${step.title}-${index}`} style={styles.permissionItem}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepNumber}>{index + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.permissionTitle}>{step.title}</Text>
                <Text style={styles.permissionDescription}>
                  {step.description}
                </Text>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
            <Text style={styles.acceptButtonText}>{acceptLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDecline}>
            <Text style={styles.declineButtonText}>{declineLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

export { PermissionModal }

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 25,
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    backgroundColor: '#74FE52',
  },
  stepNumber: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
  },
  permissionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#666',
    flexShrink: 1,
  },
  instructionsContainer: {
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    width: '100%',
  },
  instructionsText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'left',
    marginBottom: 10,
  },
  instructionsStep: {
    fontSize: 14,
    color: '#333',
    textAlign: 'left',
    marginBottom: 5,
  },
  acceptButton: {
    backgroundColor: '#74FE52',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 30,
    elevation: 2,
    width: '100%',
    marginBottom: 10,
  },
  acceptButtonText: {
    color: 'black',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  declineButtonText: {
    color: '#999',
    fontSize: 14,
  },
})
