import { Directory, File, Paths } from 'expo-file-system';

const WARDROBE_DIRECTORY_NAME = 'wardrobe';
const FALLBACK_IMAGE_EXTENSION = '.jpg';

function imageError(message: string, cause?: unknown): Error {
  const error = new Error(message);
  error.cause = cause;
  return error;
}

function getImageExtension(uri: string): string {
  const pathWithoutQuery = uri.split(/[?#]/, 1)[0];
  const match = pathWithoutQuery.match(/\.([a-zA-Z0-9]{1,8})$/);

  return match ? `.${match[1].toLowerCase()}` : FALLBACK_IMAGE_EXTENSION;
}

function getWardrobeDirectory(): Directory {
  return new Directory(Paths.document, WARDROBE_DIRECTORY_NAME);
}

export async function persistWardrobeImage(sourceUri: string, itemId: string): Promise<string> {
  if (!sourceUri.trim()) {
    throw imageError('Please choose a clothing photo.');
  }

  try {
    const wardrobeDirectory = getWardrobeDirectory();
    wardrobeDirectory.create({ idempotent: true, intermediates: true });

    const sourceFile = new File(sourceUri);
    const destinationFile = new File(
      wardrobeDirectory,
      `${itemId}${getImageExtension(sourceUri)}`,
    );

    await sourceFile.copy(destinationFile);
    return destinationFile.uri;
  } catch (error) {
    throw imageError('Could not save the clothing photo. Please choose it again.', error);
  }
}

export async function removeWardrobeImage(imageUri: string): Promise<void> {
  try {
    const wardrobeDirectory = getWardrobeDirectory();
    const managedDirectoryUri = wardrobeDirectory.uri.endsWith('/')
      ? wardrobeDirectory.uri
      : `${wardrobeDirectory.uri}/`;

    if (!imageUri.startsWith(managedDirectoryUri)) {
      return;
    }

    const imageFile = new File(imageUri);
    if (imageFile.exists) {
      imageFile.delete();
    }
  } catch (error) {
    throw imageError('The clothing item was removed, but its photo could not be cleaned up.', error);
  }
}
