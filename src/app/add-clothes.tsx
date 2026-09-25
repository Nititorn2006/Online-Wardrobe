import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  AppText,
  AppTextInput,
} from '@/components/app-text';
import { useWardrobe } from '@/features/wardrobe/wardrobe-provider';
import {
  CATEGORIES,
  type ClothingCategory,
} from '@/features/wardrobe/types';

const palette = {
  background: '#F7F5F1',
  surface: '#FFFFFF',
  ink: '#222522',
  muted: '#7A817E',
  line: '#E4DFD5',

  teal: '#4338B8',
  tealSoft: '#ECEAFF',

  coral: '#EF6A67',
} as const;

const COLOR_OPTIONS = [
  { name: 'Black', hex: '#292A2A', darkCheck: false },
  { name: 'White', hex: '#FAFAF7', darkCheck: true },
  { name: 'Gray', hex: '#A5AAA6', darkCheck: false },

  { name: 'Cream', hex: '#F3E9D2', darkCheck: true },
  { name: 'Beige', hex: '#D8C5A8', darkCheck: true },
  { name: 'Khaki', hex: '#C3B091', darkCheck: true },

  { name: 'Brown', hex: '#8E634C', darkCheck: false },
  { name: 'Navy', hex: '#33445F', darkCheck: false },
  { name: 'Blue', hex: '#5E8DBB', darkCheck: false },

  { name: 'Light Blue', hex: '#A8CBE5', darkCheck: true },
  { name: 'Green', hex: '#6E9076', darkCheck: false },
  { name: 'Olive', hex: '#80865A', darkCheck: false },

  { name: 'Teal', hex: '#4F8C88', darkCheck: false },
  { name: 'Red', hex: '#D65A54', darkCheck: false },
  { name: 'Maroon', hex: '#7A3E45', darkCheck: false },

  { name: 'Orange', hex: '#E88A4D', darkCheck: false },
  { name: 'Yellow', hex: '#E6C75A', darkCheck: true },
  { name: 'Pink', hex: '#E7A1AD', darkCheck: true },

  { name: 'Purple', hex: '#8C72A8', darkCheck: false },
  { name: 'Lavender', hex: '#B7A5CC', darkCheck: true },
  { name: 'Gold', hex: '#C9A348', darkCheck: true },
] as const;

const IMAGE_OPTIONS: ImagePicker.ImagePickerOptions = {
  allowsEditing: true,
  aspect: [4, 5],
  base64: Platform.OS === 'web',
  mediaTypes: ['images'],
  quality: 0.75,
};

type PhotoSource = 'camera' | 'library';

function CloseIcon() {
  return (
    <View
      style={styles.closeIcon}
      importantForAccessibility="no-hide-descendants"
    >
      <View
        style={[
          styles.closeIconBar,
          styles.closeIconBarForward,
        ]}
      />

      <View
        style={[
          styles.closeIconBar,
          styles.closeIconBarBackward,
        ]}
      />
    </View>
  );
}

function CameraIcon({
  light = false,
}: {
  light?: boolean;
}) {
  return (
    <View
      style={[
        styles.cameraIcon,
        light && styles.cameraIconLight,
      ]}
      importantForAccessibility="no-hide-descendants"
    >
      <View
        style={[
          styles.cameraTop,
          light && styles.cameraTopLight,
        ]}
      />

      <View
        style={[
          styles.cameraLens,
          light && styles.cameraLensLight,
        ]}
      />
    </View>
  );
}

function GalleryIcon() {
  return (
    <View
      style={styles.galleryIcon}
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.gallerySun} />
      <View style={styles.galleryMountainLeft} />
      <View style={styles.galleryMountainRight} />
    </View>
  );
}

function formatHexInput(value: string) {
  const cleaned = value
    .replace(/#/g, '')
    .replace(/[^0-9a-fA-F]/g, '')
    .slice(0, 6)
    .toUpperCase();

  return cleaned ? `#${cleaned}` : '';
}

export default function AddClothesScreen() {
  const insets = useSafeAreaInsets();
  const { addItem } = useWardrobe();

  const [name, setName] = useState('');

  const [category, setCategory] =
    useState<ClothingCategory>(
      CATEGORIES[0].value,
    );

  const [color, setColor] = useState<string>(
    COLOR_OPTIONS[0].name,
  );

  const [customColor, setCustomColor] =
    useState('');

  const [sourceUri, setSourceUri] =
    useState<string | null>(null);

  const [isPicking, setIsPicking] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const isOtherColor = color === 'Other';

  const isCustomColorValid =
    /^#[0-9A-Fa-f]{6}$/.test(customColor);

  const canSave =
    Boolean(name.trim() && sourceUri) &&
    (!isOtherColor || isCustomColorValid) &&
    !isPicking &&
    !isSaving;

  const hasDraft =
    Boolean(
      name.trim() ||
        sourceUri ||
        customColor.trim(),
    ) ||
    category !== CATEGORIES[0].value ||
    color !== COLOR_OPTIONS[0].name;

  const closeScreen = () => {
    if (!hasDraft) {
      router.back();
      return;
    }

    Alert.alert(
      'Discard this item?',
      'Your photo and details haven’t been saved yet.',
      [
        {
          text: 'Keep editing',
          style: 'cancel',
        },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ],
    );
  };

  const saveRequirement =
    !sourceUri && !name.trim()
      ? 'Add a photo and name to save'
      : !sourceUri
        ? 'Add a photo to save'
        : !name.trim()
          ? 'Add a name to save'
          : isOtherColor && !isCustomColorValid
            ? 'Enter a valid HEX color, e.g. #7C5CFC'
            : null;

  const showPermissionAlert = (
    source: PhotoSource,
  ) => {
    const permissionName =
      source === 'camera'
        ? 'camera'
        : 'photo library';

    Alert.alert(
      'Permission needed',
      `MatchClothes needs access to your ${permissionName} so you can add this piece. You can allow access in your device settings.`,
      [{ text: 'OK' }],
    );
  };

  const selectPhoto = async (
    source: PhotoSource,
  ) => {
    if (isPicking) return;

    setIsPicking(true);

    try {
      if (Platform.OS !== 'web') {
        if (source === 'camera') {
          const permission =
            await ImagePicker.requestCameraPermissionsAsync();

          if (!permission.granted) {
            showPermissionAlert(source);
            return;
          }
        } else {
          const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync();

          if (!permission.granted) {
            showPermissionAlert(source);
            return;
          }
        }
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              ...IMAGE_OPTIONS,
              cameraType:
                ImagePicker.CameraType.back,
            })
          : await ImagePicker.launchImageLibraryAsync(
              IMAGE_OPTIONS,
            );

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];

      if (!asset) {
        throw new Error(
          'The image picker returned no photo.',
        );
      }

      let imageUri = asset.uri;

      if (
        Platform.OS === 'web' &&
        !asset.uri.startsWith('data:')
      ) {
        if (!asset.base64) {
          throw new Error(
            'The browser did not return image data.',
          );
        }

        imageUri =
          `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`;
      }

      setSourceUri(imageUri);
    } catch (error) {
      Alert.alert(
        'Couldn’t add that photo',
        getErrorMessage(
          error,
          'Something went wrong while opening your photo. Please try again.',
        ),
        [{ text: 'OK' }],
      );
    } finally {
      setIsPicking(false);
    }
  };

  const saveItem = async () => {
    if (isSaving) return;

    const trimmedName = name.trim();

    if (!sourceUri) {
      Alert.alert(
        'Add a photo',
        'Choose or take a photo before saving this item.',
      );
      return;
    }

    if (!trimmedName) {
      Alert.alert(
        'Add a name',
        'Give this piece a short name before saving it.',
      );
      return;
    }

    if (
      isOtherColor &&
      !isCustomColorValid
    ) {
      Alert.alert(
        'Add a valid color',
        'Enter a HEX color using the format #RRGGBB, for example #7C5CFC.',
      );
      return;
    }

    const selectedColor =
      COLOR_OPTIONS.find(
        (option) => option.name === color,
      );

    const finalColor = isOtherColor
      ? customColor.toUpperCase()
      : selectedColor?.hex ??
        COLOR_OPTIONS[0].hex;

    setIsSaving(true);

    try {
      await addItem({
        name: trimmedName,
        category,
        color: finalColor,
        sourceUri,
      });

      router.back();
    } catch (error) {
      Alert.alert(
        'Couldn’t save this item',
        getErrorMessage(
          error,
          'Your changes weren’t saved. Please try again.',
        ),
        [{ text: 'OK' }],
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          paddingTop: Math.max(
            insets.top,
            16,
          ),
        },
      ]}
      edges={['bottom']}
    >
      <KeyboardAvoidingView
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Close add clothes"
            accessibilityRole="button"
            disabled={isSaving}
            hitSlop={12}
            onPress={closeScreen}
            style={({ pressed }) => [
              styles.closeButton,
              pressed &&
                styles.buttonPressed,
            ]}
          >
            <CloseIcon />
          </Pressable>

          <View
            style={[
              styles.headerTitleWrap,
              styles.noPointerEvents,
            ]}
          >
            <AppText style={styles.headerEyebrow}>
              MY CLOTHES
            </AppText>

            <AppText style={styles.headerTitle}>
              Add a piece
            </AppText>
          </View>

          <View
            style={styles.headerSpacer}
          />
        </View>

        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          <View
            style={styles.contentColumn}
          >
            <View
              style={styles.photoFrame}
            >
              {sourceUri ? (
                <>
                  <Image
                    accessibilityLabel={`Photo of ${
                      name.trim() ||
                      'new clothing item'
                    }`}
                    resizeMode="cover"
                    source={{
                      uri: sourceUri,
                    }}
                    style={styles.photo}
                  />

                  <View
                    style={[
                      styles.photoTint,
                      styles.noPointerEvents,
                    ]}
                  />

                  <Pressable
                    accessibilityLabel="Remove selected photo"
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() =>
                      setSourceUri(null)
                    }
                    style={({
                      pressed,
                    }) => [
                      styles.removePhotoButton,
                      pressed &&
                        styles.buttonPressed,
                    ]}
                  >
                    <CloseIcon />

                    <AppText
                      style={
                        styles.removePhotoText
                      }
                    >
                      Remove
                    </AppText>
                  </Pressable>
                </>
              ) : (
                <View
                  style={
                    styles.photoPlaceholder
                  }
                >
                  <View
                    style={
                      styles.cameraIconCircle
                    }
                  >
                    <CameraIcon />
                  </View>

                  <AppText
                    style={styles.photoTitle}
                  >
                    Show us the piece
                  </AppText>

                  <AppText
                    style={styles.photoHint}
                  >
                    A clear photo on a plain
                    background works best.
                  </AppText>
                </View>
              )}

              {isPicking && (
                <View
                  style={
                    styles.loadingOverlay
                  }
                >
                  <ActivityIndicator
                    color={palette.teal}
                    size="large"
                  />

                  <AppText
                    style={
                      styles.loadingText
                    }
                  >
                    Opening photos…
                  </AppText>
                </View>
              )}
            </View>

            <View
              style={styles.photoActions}
            >
              <Pressable
                accessibilityLabel="Take clothing photo"
                accessibilityRole="button"
                disabled={isPicking}
                onPress={() =>
                  void selectPhoto('camera')
                }
                style={({
                  pressed,
                }) => [
                  styles.photoActionButton,
                  styles.photoActionPrimary,
                  pressed &&
                    styles.buttonPressed,
                ]}
              >
                <CameraIcon light />

                <AppText
                  style={
                    styles.photoActionPrimaryText
                  }
                >
                  Take photo
                </AppText>
              </Pressable>

              <Pressable
                accessibilityLabel="Choose clothing photo from library"
                accessibilityRole="button"
                disabled={isPicking}
                onPress={() =>
                  void selectPhoto('library')
                }
                style={({
                  pressed,
                }) => [
                  styles.photoActionButton,
                  styles.photoActionSecondary,
                  pressed &&
                    styles.buttonPressed,
                ]}
              >
                <GalleryIcon />

                <AppText
                  style={
                    styles.photoActionSecondaryText
                  }
                >
                  Photo library
                </AppText>
              </Pressable>
            </View>

            <View
              style={styles.formSection}
            >
              <AppText
                style={
                  styles.sectionKicker
                }
              >
                THE DETAILS
              </AppText>

              <AppText
                style={
                  styles.sectionTitle
                }
              >
                Make it easy to find later
              </AppText>

              <View
                style={styles.fieldGroup}
              >
                <AppText
                  style={styles.fieldLabel}
                >
                  Name
                </AppText>

                <AppTextInput
                  accessibilityLabel="Clothing name"
                  autoCapitalize="sentences"
                  enterKeyHint="done"
                  maxLength={60}
                  onChangeText={setName}
                  placeholder="e.g. Linen weekend shirt"
                  placeholderTextColor="#9AA4A1"
                  returnKeyType="done"
                  selectionColor={
                    palette.teal
                  }
                  style={styles.nameInput}
                  value={name}
                />
              </View>

              <View
                style={styles.fieldGroup}
              >
                <AppText
                  style={styles.fieldLabel}
                >
                  Category
                </AppText>

                <View
                  style={styles.chipRow}
                >
                  {CATEGORIES.map(
                    (option) => {
                      const isSelected =
                        option.value ===
                        category;

                      return (
                        <Pressable
                          accessibilityLabel={`${option.label} category`}
                          accessibilityRole="button"
                          accessibilityState={{
                            selected:
                              isSelected,
                          }}
                          key={
                            option.value
                          }
                          onPress={() =>
                            setCategory(
                              option.value,
                            )
                          }
                          style={({
                            pressed,
                          }) => [
                            styles.categoryChip,
                            isSelected &&
                              styles.categoryChipSelected,
                            pressed &&
                              styles.buttonPressed,
                          ]}
                        >
                          <AppText
                            style={[
                              styles.categoryChipText,
                              isSelected &&
                                styles.categoryChipTextSelected,
                            ]}
                          >
                            {option.label}
                          </AppText>
                        </Pressable>
                      );
                    },
                  )}
                </View>
              </View>

              <View
                style={styles.fieldGroup}
              >
                <AppText
                  style={styles.fieldLabel}
                >
                  Main color
                </AppText>

                <View
                  style={styles.colorGrid}
                >
                  {COLOR_OPTIONS.map(
                    (option) => {
                      const isSelected =
                        option.name ===
                        color;

                      return (
                        <Pressable
                          accessibilityLabel={`${option.name} color`}
                          accessibilityRole="button"
                          accessibilityState={{
                            selected:
                              isSelected,
                          }}
                          key={
                            option.name
                          }
                          onPress={() =>
                            setColor(
                              option.name,
                            )
                          }
                          style={({
                            pressed,
                          }) => [
                            styles.colorChip,
                            isSelected &&
                              styles.colorChipSelected,
                            pressed &&
                              styles.buttonPressed,
                          ]}
                        >
                          <View
                            style={[
                              styles.colorSwatch,
                              {
                                backgroundColor:
                                  option.hex,
                              },
                              option.name ===
                                'White' &&
                                styles.whiteSwatch,
                            ]}
                          >
                            {isSelected && (
                              <AppText
                                style={[
                                  styles.colorCheck,
                                  option.darkCheck &&
                                    styles.colorCheckDark,
                                ]}
                              >
                                ✓
                              </AppText>
                            )}
                          </View>

                          <AppText
                            numberOfLines={1}
                            style={
                              styles.colorChipText
                            }
                          >
                            {option.name}
                          </AppText>
                        </Pressable>
                      );
                    },
                  )}

                  <Pressable
                    accessibilityLabel="Other color"
                    accessibilityRole="button"
                    accessibilityState={{
                      selected: isOtherColor,
                    }}
                    onPress={() =>
                      setColor('Other')
                    }
                    style={({ pressed }) => [
                      styles.otherColorChip,
                      isOtherColor &&
                        styles.colorChipSelected,
                      pressed &&
                        styles.buttonPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.otherColorSwatch,
                        isCustomColorValid && {
                          backgroundColor:
                            customColor,
                          borderStyle: 'solid',
                        },
                      ]}
                    >
                      {!isCustomColorValid && (
                        <AppText
                          style={
                            styles.otherColorPlus
                          }
                        >
                          +
                        </AppText>
                      )}
                    </View>

                    <AppText
                      style={
                        styles.colorChipText
                      }
                    >
                      Other
                    </AppText>
                  </Pressable>
                </View>

                {isOtherColor && (
                  <View
                    style={
                      styles.customColorSection
                    }
                  >
                    <AppText
                      style={
                        styles.customColorLabel
                      }
                    >
                      Custom HEX
                    </AppText>

                    <View
                      style={
                        styles.customColorRow
                      }
                    >
                      <AppTextInput
                        accessibilityLabel="Custom color HEX value"
                        autoCapitalize="characters"
                        autoCorrect={false}
                        maxLength={7}
                        onChangeText={(value) =>
                          setCustomColor(
                            formatHexInput(
                              value,
                            ),
                          )
                        }
                        placeholder="#7C5CFC"
                        placeholderTextColor="#9AA4A1"
                        selectionColor={
                          palette.teal
                        }
                        style={[
                          styles.customColorInput,
                          customColor.length >
                            0 &&
                            !isCustomColorValid &&
                            styles.customColorInputInvalid,
                        ]}
                        value={customColor}
                      />

                      <View
                        accessibilityLabel={
                          isCustomColorValid
                            ? `Preview color ${customColor}`
                            : 'Color preview'
                        }
                        style={[
                          styles.customColorPreview,
                          {
                            backgroundColor:
                              isCustomColorValid
                                ? customColor
                                : '#E7E3DB',
                          },
                        ]}
                      />
                    </View>

                    {customColor.length >
                      0 &&
                      !isCustomColorValid && (
                        <AppText
                          style={
                            styles.customColorError
                          }
                        >
                          Use 6 HEX digits,
                          for example #FF8800
                        </AppText>
                      )}
                  </View>
                )}
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <View
            style={styles.footerInner}
          >
            <Pressable
              accessibilityHint="Adds this piece to My Clothes"
              accessibilityLabel="Save clothing item"
              accessibilityRole="button"
              accessibilityState={{
                disabled: !canSave,
              }}
              disabled={!canSave}
              onPress={() =>
                void saveItem()
              }
              style={({ pressed }) => [
                styles.saveButton,
                !canSave &&
                  styles.saveButtonDisabled,
                pressed &&
                  canSave &&
                  styles.saveButtonPressed,
              ]}
            >
              {isSaving ? (
                <ActivityIndicator
                  color={palette.surface}
                />
              ) : (
                <>
                  <AppText
                    style={
                      styles.saveButtonText
                    }
                  >
                    Save to My Clothes
                  </AppText>

                  <AppText
                    style={
                      styles.saveArrow
                    }
                  >
                    →
                  </AppText>
                </>
              )}
            </Pressable>

            {saveRequirement && (
              <AppText
                accessibilityLiveRegion="polite"
                style={styles.footerHint}
              >
                {saveRequirement}
              </AppText>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  return error instanceof Error &&
    error.message
    ? error.message
    : fallback;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },

  keyboardView: {
    flex: 1,
  },

  header: {
    height: 66,
    paddingHorizontal: 20,
    borderBottomColor: palette.line,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderColor: palette.line,
    borderWidth: 1,
    backgroundColor:
      palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeIcon: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeIconBar: {
    position: 'absolute',
    width: 16,
    height: 1.5,
    borderRadius: 2,
    backgroundColor: palette.ink,
  },

  closeIconBarForward: {
    transform: [
      {
        rotate: '45deg',
      },
    ],
  },

  closeIconBarBackward: {
    transform: [
      {
        rotate: '-45deg',
      },
    ],
  },

  headerTitleWrap: {
    position: 'absolute',
    left: 72,
    right: 72,
    alignItems: 'center',
  },

  noPointerEvents: {
    pointerEvents: 'none',
  },

  headerEyebrow: {
    color: palette.coral,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    lineHeight: 13,
  },

  headerTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.35,
    lineHeight: 23,
  },

  headerSpacer: {
    width: 42,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 34,
  },

  contentColumn: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },

  photoFrame: {
    width: '100%',
    maxWidth: 440,
    aspectRatio: 4 / 5,
    alignSelf: 'center',
    borderRadius: 28,
    borderColor: '#D8D2C7',
    borderWidth: 1,
    backgroundColor: '#EEEAE2',
    overflow: 'hidden',
  },

  photo: {
    width: '100%',
    height: '100%',
  },

  photoTint: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 86,
    backgroundColor:
      'rgba(24, 52, 50, 0.12)',
  },

  removePhotoButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    minHeight: 38,
    paddingHorizontal: 13,
    borderRadius: 19,
    backgroundColor:
      'rgba(255, 255, 255, 0.94)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  removePhotoText: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '700',
  },

  photoPlaceholder: {
    flex: 1,
    paddingHorizontal: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cameraIconCircle: {
    width: 82,
    height: 82,
    marginBottom: 21,
    borderRadius: 41,
    backgroundColor:
      palette.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cameraIcon: {
    width: 26,
    height: 19,
    borderRadius: 5,
    borderColor: palette.teal,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cameraTop: {
    position: 'absolute',
    top: -5,
    width: 10,
    height: 5,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor:
      palette.teal,
  },

  cameraLens: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderColor: palette.teal,
    borderWidth: 2,
  },

  cameraIconLight: {
    borderColor: palette.surface,
  },

  cameraTopLight: {
    backgroundColor:
      palette.surface,
  },

  cameraLensLight: {
    borderColor: palette.surface,
  },

  photoTitle: {
    color: palette.ink,
    fontSize: 23,
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
  },

  photoHint: {
    maxWidth: 265,
    marginTop: 8,
    color: palette.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },

  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor:
      'rgba(247, 245, 241, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    color: palette.ink,
    fontSize: 14,
    fontWeight: '600',
  },

  photoActions: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },

  photoActionButton: {
    flex: 1,
    minHeight: 50,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  photoActionPrimary: {
    borderColor: palette.teal,
    backgroundColor: palette.teal,
  },

  photoActionSecondary: {
    borderColor: '#CFC9BE',
    backgroundColor:
      palette.surface,
  },

  photoActionPrimaryText: {
    color: palette.surface,
    fontSize: 14,
    fontWeight: '700',
  },

  photoActionSecondaryText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '700',
  },

  galleryIcon: {
    width: 23,
    height: 19,
    borderRadius: 4,
    borderColor: palette.teal,
    borderWidth: 1.8,
    overflow: 'hidden',
  },

  gallerySun: {
    position: 'absolute',
    top: 3,
    right: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor:
      palette.coral,
  },

  galleryMountainLeft: {
    position: 'absolute',
    left: 1,
    bottom: -5,
    width: 16,
    height: 16,
    borderRadius: 2,
    borderColor: palette.teal,
    borderWidth: 1.8,
    transform: [
      {
        rotate: '45deg',
      },
    ],
  },

  galleryMountainRight: {
    position: 'absolute',
    right: -5,
    bottom: -4,
    width: 12,
    height: 12,
    borderRadius: 2,
    borderColor: palette.teal,
    borderWidth: 1.8,
    transform: [
      {
        rotate: '45deg',
      },
    ],
  },

  formSection: {
    marginTop: 42,
  },

  sectionKicker: {
    color: palette.coral,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.7,
  },

  sectionTitle: {
    marginTop: 5,
    marginBottom: 25,
    color: palette.ink,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.55,
    lineHeight: 31,
  },

  fieldGroup: {
    marginBottom: 27,
  },

  fieldLabel: {
    marginBottom: 10,
    color: palette.ink,
    fontSize: 14,
    fontWeight: '700',
  },

  nameInput: {
    minHeight: 56,
    paddingHorizontal: 17,
    paddingVertical: 14,
    borderRadius: 16,
    borderColor: '#CFC9BE',
    borderWidth: 1,
    backgroundColor:
      palette.surface,
    color: palette.ink,
    fontSize: 16,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },

  categoryChip: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 21,
    borderColor: '#D4CEC3',
    borderWidth: 1,
    backgroundColor:
      palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  categoryChipSelected: {
    borderColor: palette.teal,
    backgroundColor: palette.teal,
  },

  categoryChipText: {
    color: '#5D6C69',
    fontSize: 14,
    fontWeight: '600',
  },

  categoryChipTextSelected: {
    color: palette.surface,
  },

  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },

  colorChip: {
    minWidth: 98,
    minHeight: 47,
    paddingHorizontal: 11,
    borderRadius: 15,
    borderColor: '#D4CEC3',
    borderWidth: 1,
    backgroundColor:
      palette.surface,
    flexGrow: 1,
    flexBasis: '28%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  colorChipSelected: {
    borderColor: palette.teal,
    borderWidth: 2,
    backgroundColor:
      palette.tealSoft,
    paddingHorizontal: 10,
  },

  colorSwatch: {
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  whiteSwatch: {
    borderColor: '#D2D1CC',
    borderWidth: 1,
  },

  colorCheck: {
    color: palette.surface,
    fontSize: 13,
    fontWeight: '900',
  },

  colorCheckDark: {
    color: palette.ink,
  },

  colorChipText: {
    flexShrink: 1,
    color: palette.ink,
    fontSize: 13,
    fontWeight: '600',
  },

  otherColorChip: {
    width: '100%',
    minHeight: 50,
    paddingHorizontal: 11,
    borderRadius: 15,
    borderColor: '#D4CEC3',
    borderWidth: 1,
    backgroundColor:
      palette.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  otherColorSwatch: {
    width: 25,
    height: 25,
    borderRadius: 13,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#AAA59B',
    backgroundColor: '#F3F0E9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  otherColorPlus: {
    color: palette.muted,
    fontSize: 18,
    lineHeight: 19,
    fontWeight: '500',
  },

  customColorSection: {
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor:
      '#EEEAE2',
    borderWidth: 1,
    borderColor: '#D8D2C7',
  },

  customColorLabel: {
    marginBottom: 8,
    color: palette.ink,
    fontSize: 13,
    fontWeight: '700',
  },

  customColorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  customColorInput: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CFC9BE',
    backgroundColor:
      palette.surface,
    color: palette.ink,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.8,
  },

  customColorInputInvalid: {
    borderColor: palette.coral,
  },

  customColorPreview: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#CFC9BE',
  },

  customColorError: {
    marginTop: 7,
    color: palette.coral,
    fontSize: 12,
    lineHeight: 17,
  },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 13,
    paddingBottom: 8,
    borderTopColor: palette.line,
    borderTopWidth:
      StyleSheet.hairlineWidth,
    backgroundColor:
      palette.background,
  },

  footerInner: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    alignItems: 'center',
  },

  saveButton: {
    width: '100%',
    minHeight: 56,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor:
      palette.coral,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveButtonDisabled: {
    backgroundColor: '#D6D2C9',
  },

  saveButtonPressed: {
    transform: [
      {
        scale: 0.985,
      },
    ],
    opacity: 0.9,
  },

  saveButtonText: {
    color: palette.surface,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.1,
  },

  saveArrow: {
    position: 'absolute',
    right: 21,
    color: palette.surface,
    fontSize: 22,
    fontWeight: '500',
  },

  footerHint: {
    marginTop: 6,
    color: palette.muted,
    fontSize: 11,
    lineHeight: 14,
  },

  buttonPressed: {
    opacity: 0.68,
  },
});