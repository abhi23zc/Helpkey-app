import { Image } from 'expo-image';
import { Bed, Check, Maximize, Users, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Dimensions, FlatList, Modal, NativeScrollEvent, NativeSyntheticEvent, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Room } from '@/types/hotel';

interface RoomCardProps {
    room: Room;
    onSelect?: (room: Room) => void;
    isSelected?: boolean;
}

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;

const RoomCard = ({ room, onSelect, isSelected }: RoomCardProps) => {
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Convert .avif to .jpg for React Native compatibility
    const rawDisplayImage = (room.images && room.images.length > 0) ? room.images[0] : (room.image || 'https://images.unsplash.com/photo-1631049307204-dac81bd4118a?w=800');
    const displayImage = rawDisplayImage.replace(/\.avif$/, '.jpg');
    const rawImages = (room.images && room.images.length > 0) ? room.images : [rawDisplayImage];
    const allImages = rawImages.map(img => img.replace(/\.avif$/, '.jpg'));

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const slideSize = event.nativeEvent.layoutMeasurement.width;
        const index = event.nativeEvent.contentOffset.x / slideSize;
        const roundIndex = Math.round(index);
        setCurrentImageIndex(roundIndex);
    };

    return (
        <>
            <TouchableOpacity
                style={[styles.container, isSelected && styles.containerSelected]}
                onPress={() => onSelect && onSelect(room)}
                activeOpacity={0.9}
            >
                <View style={styles.innerContainer}>
                    {/* Image Section - Left Side */}
                    <TouchableOpacity
                        style={styles.imageContainer}
                        onPress={() => setIsViewerOpen(true)}
                        activeOpacity={0.8}
                    >
                        <Image
                            source={{ uri: displayImage }}
                            style={styles.image}
                            contentFit="cover"
                            transition={200}
                        />
                        {room.images && room.images.length > 1 && (
                            <View style={styles.photosBadge}>
                                <Text style={styles.photosBadgeText}>{room.images.length}</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Content Section - Right Side */}
                    <View style={styles.content}>
                        <View style={styles.headerRow}>
                            <Text style={styles.roomType} numberOfLines={1}>{room.roomType || room.type}</Text>
                            {isSelected && (
                                <View style={styles.selectedBadge}>
                                    <Check size={10} color="#fff" strokeWidth={4} />
                                </View>
                            )}
                        </View>

                        <View style={styles.detailsRow}>
                            <Text style={styles.roomId}>Room {room.roomNumber || room.id.substring(0, 4)}</Text>
                            <Text style={styles.dotSeparator}>•</Text>
                            <Text style={styles.statusText} numberOfLines={1}>{room.status}</Text>
                        </View>

                        {/* Stats Row - Compact */}
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Maximize size={12} color="#666" />
                                <Text style={styles.statText}>{room.size || '-'}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Bed size={12} color="#666" />
                                <Text style={styles.statText}>{room.beds || '1'}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Users size={12} color="#666" />
                                <Text style={styles.statText}>{room.capacity || 2}</Text>
                            </View>
                        </View>

                        {/* Price and Action */}
                        <View style={styles.footerRow}>
                            <View>
                                <Text style={styles.price}>₹{room.price}</Text>
                                <Text style={styles.perNight}>per night</Text>
                            </View>

                            {/* Optional: Show hourly rate if available and relevant */}
                            {room.hourlyRates && room.hourlyRates.length > 0 && (
                                <View style={styles.hourlyTag}>
                                    <Text style={styles.hourlyTagText}>Hourly Avail.</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </TouchableOpacity>

            {/* Image Viewer Modal */}
            <Modal
                visible={isViewerOpen}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsViewerOpen(false)}
            >
                <View style={styles.modalContainer}>
                    <StatusBar barStyle="light-content" backgroundColor="black" />
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setIsViewerOpen(false)}
                        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    >
                        <X color="#fff" size={28} />
                    </TouchableOpacity>

                    <FlatList
                        data={allImages}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(_, index) => index.toString()}
                        onScroll={handleScroll}
                        renderItem={({ item }) => (
                            <View style={styles.fullScreenImageWrapper}>
                                <Image
                                    source={{ uri: item }}
                                    style={styles.fullScreenImage}
                                    contentFit="contain"
                                />
                            </View>
                        )}
                    />

                    <View style={styles.pagination}>
                        <Text style={styles.paginationText}>
                            {currentImageIndex + 1} / {allImages.length}
                        </Text>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f0f0f0',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    containerSelected: {
        borderColor: '#00BFA6',
        borderWidth: 1.5,
        backgroundColor: '#F0FDF4',
    },
    innerContainer: {
        flexDirection: 'row',
        height: 110,
    },
    imageContainer: {
        width: 110,
        height: '100%',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    photosBadge: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    photosBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 10,
        justifyContent: 'space-between',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    roomType: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1A1A1A',
        flex: 1,
        marginRight: 8,
    },
    selectedBadge: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#00BFA6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    roomId: {
        fontSize: 11,
        color: '#666',
    },
    dotSeparator: {
        fontSize: 11,
        color: '#999',
        marginHorizontal: 4,
    },
    statusText: {
        fontSize: 11,
        color: '#00BFA6',
        fontWeight: '500',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 4,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 11,
        color: '#666',
        fontWeight: '500',
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    price: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
        lineHeight: 20,
    },
    perNight: {
        fontSize: 10,
        color: '#999',
    },
    hourlyTag: {
        backgroundColor: '#E8F8F5',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    hourlyTagText: {
        fontSize: 9,
        color: '#00BFA6',
        fontWeight: '600',
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 8,
    },
    fullScreenImageWrapper: {
        width: width,
        height: height,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenImage: {
        width: '100%',
        height: '100%',
    },
    pagination: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    paginationText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    }
});

export default RoomCard;
