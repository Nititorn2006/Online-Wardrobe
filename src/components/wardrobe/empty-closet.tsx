import { Pressable, StyleSheet, Text, View } from 'react-native';

export type EmptyClosetProps = {
  title?: string;
  body?: string;
  buttonLabel?: string;
  onButtonPress?: () => void;
};

const COLORS = {
  surface: '#FFFFFF',

  ink: '#222522',
  muted: '#7A817E',

  border: '#EAE5DC',

  brand: '#4338B8',
  brandDark: '#30288A',
  brandSoft: '#ECEAFF',

  coral: '#EF6A67',
  white: '#FFFFFF',
} as const;

export function EmptyCloset({
  title = 'Your closet is waiting',
  body = 'Add a few favorite pieces and start building outfits that feel like you.',
  buttonLabel = 'Add clothing',
  onButtonPress,
}: EmptyClosetProps) {
  return (
    <View style={styles.container}>
      <View
        importantForAccessibility="no-hide-descendants"
        style={styles.illustration}
      >
        <View style={styles.rail} />

        <View
          style={[
            styles.hangerArm,
            styles.hangerArmLeft,
          ]}
        />

        <View
          style={[
            styles.hangerArm,
            styles.hangerArmRight,
          ]}
        />

        <View style={styles.hangerBar} />

        <View style={styles.sparkleLarge}>
          <Text style={styles.sparkleText}>
            +
          </Text>
        </View>

        <View style={styles.sparkleSmall} />
      </View>

      <View style={styles.copy}>
        <Text style={styles.title}>
          {title}
        </Text>

        <Text style={styles.body}>
          {body}
        </Text>
      </View>

      {onButtonPress ? (
        <Pressable
          accessibilityLabel={buttonLabel}
          accessibilityRole="button"
          onPress={onButtonPress}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>
            {buttonLabel}
          </Text>

          <Text
            importantForAccessibility="no"
            style={styles.buttonArrow}
          >
            +
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    alignSelf: 'stretch',

    backgroundColor: COLORS.surface,

    borderColor: COLORS.border,
    borderRadius: 28,
    borderCurve: 'continuous',
    borderWidth: 1,

    gap: 22,

    paddingHorizontal: 28,
    paddingVertical: 36,
  },

  illustration: {
    alignItems: 'center',

    backgroundColor: COLORS.brandSoft,

    borderRadius: 48,

    height: 96,

    justifyContent: 'center',

    position: 'relative',

    width: 96,
  },

  rail: {
    backgroundColor: COLORS.brand,

    borderRadius: 2,

    height: 3,

    left: 27,

    position: 'absolute',

    top: 31,

    width: 42,
  },

  hangerArm: {
    backgroundColor: COLORS.brand,

    borderRadius: 2,

    height: 3,

    position: 'absolute',

    top: 50,

    width: 29,
  },

  hangerArmLeft: {
    left: 23,

    transform: [
      {
        rotate: '-31deg',
      },
    ],
  },

  hangerArmRight: {
    right: 23,

    transform: [
      {
        rotate: '31deg',
      },
    ],
  },

  hangerBar: {
    backgroundColor: COLORS.brand,

    borderRadius: 2,

    bottom: 30,

    height: 3,

    left: 25,

    position: 'absolute',

    width: 46,
  },

  sparkleLarge: {
    alignItems: 'center',

    backgroundColor: COLORS.coral,

    borderColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 3,

    height: 24,

    justifyContent: 'center',

    position: 'absolute',

    right: 3,
    top: 5,

    width: 24,
  },

  sparkleText: {
    color: COLORS.white,

    fontSize: 16,
    fontWeight: '800',
    lineHeight: 17,
  },

  sparkleSmall: {
    backgroundColor: COLORS.coral,

    borderRadius: 3,

    bottom: 10,

    height: 6,

    left: 8,

    position: 'absolute',

    transform: [
      {
        rotate: '45deg',
      },
    ],

    width: 6,
  },

  copy: {
    alignItems: 'center',

    gap: 9,

    maxWidth: 300,
  },

  title: {
    color: COLORS.ink,

    fontSize: 25,
    fontWeight: '700',

    letterSpacing: -0.5,

    lineHeight: 31,

    textAlign: 'center',
  },

  body: {
    color: COLORS.muted,

    fontSize: 14,
    fontWeight: '500',

    lineHeight: 21,

    textAlign: 'center',
  },

  button: {
    alignItems: 'center',

    backgroundColor: COLORS.brand,

    borderRadius: 24,
    borderCurve: 'continuous',

    flexDirection: 'row',

    gap: 10,

    justifyContent: 'center',

    minHeight: 48,

    paddingHorizontal: 22,
    paddingVertical: 12,
  },

  buttonPressed: {
    backgroundColor: COLORS.brandDark,

    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  buttonText: {
    color: COLORS.white,

    fontSize: 15,
    fontWeight: '700',

    lineHeight: 20,
  },

  buttonArrow: {
    color: COLORS.white,

    fontSize: 20,
    fontWeight: '500',

    lineHeight: 20,
  },
});