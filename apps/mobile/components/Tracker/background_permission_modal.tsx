import React from 'react'
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface BackgroundPermissionModalProps {
  visible: boolean
  onAccept: () => void
  onDecline: () => void
  warningMessage?: string
}

const BackgroundPermissionModal: React.FC<BackgroundPermissionModalProps> = ({
  visible,
  onAccept,
  onDecline,
  warningMessage,
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onDecline}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Permitir localização o tempo todo</Text>
          <Text style={styles.modalText}>
            Para rastrear sua atividade com a tela desligada, selecione &quot;Permitir o tempo todo&quot;. Se o sistema não mostrar o pedido de permissão, você será direcionado para as configurações do app.
          </Text>

          <View style={styles.permissionItem}>
            <View style={[styles.stepCircle, { backgroundColor: '#74FE52' }]}>
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.permissionTitle}>Solicitar permissão</Text>
              <Text style={styles.permissionDescription}>
                Toque em &quot;Continuar&quot; para abrir o pedido de permissão de localização.
              </Text>
            </View>
          </View>

          <View style={styles.permissionItem}>
            <View style={[styles.stepCircle, { backgroundColor: '#74FE52' }]}>
              <Text style={styles.stepNumber}>2</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.permissionTitle}>Selecionar &quot;Permitir o tempo todo&quot;</Text>
              <Text style={styles.permissionDescription}>
                Na tela que abrir, selecione &quot;Permitir o tempo todo&quot;. A opção &quot;Durante o uso&quot; não permite rastrear com a tela desligada.
              </Text>
            </View>
          </View>

          <View style={styles.permissionItem}>
            <View style={[styles.stepCircle, { backgroundColor: '#74FE52' }]}>
              <Text style={styles.stepNumber}>3</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.permissionTitle}>Voltar ao app</Text>
              <Text style={styles.permissionDescription}>
                Retorne ao aplicativo e o rastreamento será iniciado automaticamente.
              </Text>
            </View>
          </View>

          {warningMessage && (
            <Text style={styles.warningText}>{warningMessage}</Text>
          )}

          <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
            <Text style={styles.acceptButtonText}>Continuar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDecline}>
            <Text style={styles.declineButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

export { BackgroundPermissionModal }

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
  warningText: {
    color: '#B00020',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
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
