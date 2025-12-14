import { Minus, Plus, User } from 'lucide-react-native';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface GuestSelectorProps {
  visible: boolean;
  guests: number;
  onClose: () => void;
  onConfirm: (guests: number) => void;
}

export default function GuestSelector({ visible, guests, onClose, onConfirm }: GuestSelectorProps) {
  const [selectedGuests, setSelectedGuests] = React.useState(guests);

  const handleConfirm = () => {
    onConfirm(selectedGuests);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Guests</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.row}>
              <View style={styles.iconContainer}>
                <User size={24} color="#00BFA6" />
              </View>
              <View style={styles.info}>
                <Text style={styles.label}>Guests</Text>
                <Text style={styles.sublabel}>Number of guests</Text>
              </View>
              <View style={styles.controls}>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => setSelectedGuests(Math.max(1, selectedGuests - 1))}
                  disabled={selectedGuests <= 1}
                >
                  <Minus size={20} color={selectedGuests <= 1 ? '#ccc' : '#00BFA6'} />
                </TouchableOpacity>
                <Text style={styles.count}>{selectedGuests}</Text>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => setSelectedGuests(Math.min(10, selectedGuests + 1))}
                  disabled={selectedGuests >= 10}
                >
                  <Plus size={20} color={selectedGuests >= 10 ? '#ccc' : '#00BFA6'} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  content: {
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F8F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  sublabel: {
    fontSize: 13,
    color: '#666',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  count: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    minWidth: 30,
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: '#00BFA6',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
