import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter } from 'expo-router';
import { Home, Hotel, Search, User2Icon } from 'lucide-react-native';
import React from 'react';
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

// Responsive scaling
const moderateScale = (size: number, factor = 0.5) => {
  const scale = (size: number) => (width / 375) * size;
  return size + (scale(size) - size) * factor;
};

interface TabItemProps {
  icon: React.ReactElement;
  label: string;
  isActive: boolean;
  onPress: () => void;
}

const TabItem = ({ icon, label, isActive, onPress }: TabItemProps) => (
  <TouchableOpacity
    style={styles.tabItem}
    onPress={onPress}
    activeOpacity={0.7}
  >
    {React.cloneElement(icon, {
      color: isActive ? '#FFF' : '#888',
      size: moderateScale(24),
    } as any)}
  </TouchableOpacity>
);

export default function CustomTabBar() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { name: 'home', label: 'Home', icon: <Home color="#FFF" />, path: '/(tabs)/home' },
    { name: 'search', label: 'Explore', icon: <Search color="#FFF" />, path: '/(tabs)/search' },
    { name: 'bookings', label: 'History', icon: <Hotel color="#FFF" />, path: '/(tabs)/bookings' },
    { name: 'profile', label: 'Wallet', icon: <User2Icon color="#FFF" />, path: '/(tabs)/profile' },
  ];

  const handleTabPress = (tabPath: string, tabName: string) => {
    // Check if we're already on this tab by comparing the tab name with pathname
    const isCurrentTab = pathname === `/${tabName}` || pathname.endsWith(`/${tabName}`);
    
    // Only navigate if not already on this tab
    if (!isCurrentTab) {
      router.push(tabPath as any);
    }
  };

  return (
    <View style={styles.container}>
          <LinearGradient
       colors={['#232528', '#1e2e3d', '#163b55']}
       start={{ x: 0, y: 0.5 }}
       end={{ x: 1, y: 0.5 }}
       style={styles.tabBar}
     >
        {tabs.map((tab) => (
          <TabItem
            key={tab.name}
            icon={tab.icon}
            label={tab.label}
            isActive={pathname === `/${tab.name}` || pathname.endsWith(`/${tab.name}`)}
            onPress={() => handleTabPress(tab.path, tab.name)}
          />
        ))}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? moderateScale(30) : moderateScale(20),
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  tabBar: {
    flexDirection: 'row',
    width: width - moderateScale(40),
    maxWidth: 500,
    height: moderateScale(65),
    borderRadius: moderateScale(20),
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: moderateScale(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    overflow: 'hidden',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(8),
    flex: 1,
  },
  tabLabel: {
    color: '#FFF',
    fontSize: moderateScale(9),
    marginTop: moderateScale(3),
    fontWeight: '600',
  },
});
