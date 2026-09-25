import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import {
  Tabs,
  TabList,
  TabSlot,
  TabTrigger,
} from 'expo-router/ui';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Palette } from '@/constants/design';

export default function AppTabs() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const isHome = pathname === '/';
  const isCloset = pathname.startsWith('/closet');
  const isSettings = pathname.startsWith('/settings');

  return (
    <Tabs style={styles.tabs}>
      <TabSlot style={styles.tabSlot} />

      <View
        style={[
          styles.tabBarContainer,
          {
            bottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <View style={styles.tabBar}>
          {/* HOME */}
          <TabTrigger
            name="home"
            style={[
              styles.tabButton,
              isHome && styles.tabButtonSelected,
            ]}
          >
            <Ionicons
              name={isHome ? 'home' : 'home-outline'}
              size={27}
              color={
                isHome
                  ? Palette.brand
                  : Palette.ink
              }
            />

            <AppText
              numberOfLines={1}
              style={[
                styles.tabLabel,
                isHome && styles.tabLabelSelected,
              ]}
            >
              Home
            </AppText>
          </TabTrigger>

          {/* ADD */}
          <Pressable
            accessibilityLabel="Add clothes"
            accessibilityRole="button"
            onPress={() => router.push('/add-clothes')}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.addCircle}>
              <Ionicons
                name="add"
                size={30}
                color={Palette.white}
              />
            </View>

            <AppText
              numberOfLines={1}
              style={styles.addLabel}
            >
              Add
            </AppText>
          </Pressable>

          {/* MY CLOTHES */}
          <TabTrigger
            name="closet"
            style={[
              styles.tabButton,
              isCloset && styles.tabButtonSelected,
            ]}
          >
            <Ionicons
              name={
                isCloset
                  ? 'shirt'
                  : 'shirt-outline'
              }
              size={27}
              color={
                isCloset
                  ? Palette.brand
                  : Palette.ink
              }
            />

            <AppText
              numberOfLines={1}
              style={[
                styles.tabLabel,
                isCloset &&
                  styles.tabLabelSelected,
              ]}
            >
              My Clothes
            </AppText>
          </TabTrigger>

          {/* SETTINGS */}
          <TabTrigger
            name="settings"
            style={[
              styles.tabButton,
              isSettings && styles.tabButtonSelected,
            ]}
          >
            <Ionicons
              name={
                isSettings
                  ? 'settings'
                  : 'settings-outline'
              }
              size={27}
              color={
                isSettings
                  ? Palette.brand
                  : Palette.ink
              }
            />

            <AppText
              numberOfLines={1}
              style={[
                styles.tabLabel,
                isSettings &&
                  styles.tabLabelSelected,
              ]}
            >
              Settings
            </AppText>
          </TabTrigger>
        </View>
      </View>

      <TabList style={styles.hiddenTabList}>
        <TabTrigger
          name="home"
          href="/"
        />

        <TabTrigger
          name="closet"
          href="/closet"
        />

        <TabTrigger
          name="settings"
          href="/settings"
        />
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flex: 1,
  },

  tabSlot: {
    flex: 1,
  },

  hiddenTabList: {
    display: 'none',
  },

  tabBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 14,
  },

  tabBar: {
    width: '100%',
    maxWidth: 430,
    height: 78,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 7,
    paddingVertical: 7,

    borderRadius: 39,

    backgroundColor: Palette.surface,

    borderWidth: 1,
    borderColor: Palette.border,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.12,
    shadowRadius: 14,

    elevation: 10,
  },

  tabButton: {
    flex: 1,
    height: '100%',

    borderRadius: 30,

    alignItems: 'center',
    justifyContent: 'center',

    gap: 2,
  },

  tabButtonSelected: {
    backgroundColor: Palette.brandSoft,
  },

  tabLabel: {
    color: Palette.ink,
    fontSize: 11,
    fontWeight: '600',
  },

  tabLabelSelected: {
    color: Palette.brand,
    fontWeight: '700',
  },

  addButton: {
    flex: 1,
    height: '100%',

    alignItems: 'center',
    justifyContent: 'center',

    gap: 2,
  },

  addCircle: {
    width: 43,
    height: 43,

    borderRadius: 22,

    backgroundColor: Palette.brand,

    alignItems: 'center',
    justifyContent: 'center',
  },

  addLabel: {
    color: Palette.brand,
    fontSize: 11,
    fontWeight: '700',
  },

  pressed: {
    opacity: 0.7,
    transform: [
      {
        scale: 0.96,
      },
    ],
  },
});