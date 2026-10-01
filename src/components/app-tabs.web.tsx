import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Palette, Radius } from '@/constants/design';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton icon="⌂">Home</TabButton>
          </TabTrigger>
          <TabTrigger name="try-outfits" href="/try-outfits" asChild>
            <TabButton icon="↻">Try</TabButton>
          </TabTrigger>
          <Pressable
            accessibilityLabel="Add clothes"
            accessibilityRole="button"
            onPress={() => router.push('/add-clothes')}
            style={({ pressed }) => [
              styles.addButton,
              [undefined, styles.pressed][Number(pressed)],
            ]}>
            <View style={styles.addCircle}>
              <AppText style={styles.addIcon}>＋</AppText>
            </View>
            <AppText style={styles.addLabel}>Add</AppText>
          </Pressable>
          <TabTrigger name="closet" href="/closet" asChild>
            <TabButton icon="▣">Closet</TabButton>
          </TabTrigger>
          <TabTrigger
            name="settings"
            href="/settings"
            asChild
          >
            <TabButton icon="⚙">Settings</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({
  children,
  icon,
  isFocused,
  ...props
}: TabTriggerSlotProps & { icon: string }) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.tabButton,
        isFocused && styles.tabButtonFocused,
        [undefined, styles.pressed][Number(pressed)],
      ]}>
      <AppText style={[styles.tabIcon, isFocused && styles.tabTextFocused]}>{icon}</AppText>
      <AppText style={[styles.tabLabel, isFocused && styles.tabTextFocused]}>{children}</AppText>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <View style={styles.innerContainer}>{props.children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(247,245,241,0.92)',
  },
  innerContainer: {
    padding: 5,
    borderRadius: Radius.large,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    width: '100%',
    maxWidth: 430,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    boxShadow: '0 12px 32px rgba(32,40,38,0.12)',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  tabButtonFocused: {
    backgroundColor: Palette.brandSoft,
  },
  tabIcon: {
    color: Palette.muted,
    fontSize: 20,
    lineHeight: 22,
  },
  tabLabel: {
    color: Palette.muted,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
  tabTextFocused: {
    color: Palette.brand,
  },
  addButton: {
    flex: 1,
    minHeight: 54,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 1,
  },
  addCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Palette.brand,
  },
  addIcon: { color: Palette.white, fontSize: 22, lineHeight: 23 },
  addLabel: { color: Palette.brand, fontSize: 10, lineHeight: 12, fontWeight: '700' },
});
