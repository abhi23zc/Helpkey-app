import { Minus, Plus, User } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface GuestSelectorProps {
  visible: boolean;
  guests: number;
  onClose: () => void;
  onGuestsChange: (count: number) => void;
  rooms: number;
  onRoomsChange: (count: number) => void;
}

export default function GuestSelector({
  visible,
  guests,
  onClose,
  onGuestsChange,
  rooms,
  onRoomsChange
}: GuestSelectorProps) {
  const [selectedGuests, setSelectedGuests] = React.useState(guests);

  useEffect(() => {
    if (visible) {
      setSelectedGuests(guests);
    }
  }, [visible, guests]);

  const handleConfirm = () => {
    onGuestsChange(selectedGuests);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
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
                <User size={24} color="#00D9FF" />
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
                  <Minus size={20} color={selectedGuests <= 1 ? 'rgba(255,255,255,0.2)' : '#00D9FF'} />
                </TouchableOpacity>
                <Text style={styles.count}>{selectedGuests}</Text>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => setSelectedGuests(Math.min(10, selectedGuests + 1))}
                  disabled={selectedGuests >= 10}
                >
                  <Plus size={20} color={selectedGuests >= 10 ? 'rgba(255,255,255,0.2)' : '#00D9FF'} />
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1a1f3a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  closeButton: {
    fontSize: 24,
    color: '#FFF',
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
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
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
    color: '#FFF',
    marginBottom: 4,
  },
  sublabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  count: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    minWidth: 30,
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: '#00D9FF',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#0a0e27',
    fontSize: 16,
    fontWeight: '700',
  },
});
