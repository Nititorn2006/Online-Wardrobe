function imageError(message: string): Error {
  return new Error(message);
}

export async function persistWardrobeImage(sourceUri: string): Promise<string> {
  if (!sourceUri.startsWith('data:image/')) {
    throw imageError('Could not save this photo on the web. Please choose it again.');
  }

  return sourceUri;
}

export async function removeWardrobeImage(_imageUri: string): Promise<void> {
  // Web images are stored inline with the wardrobe record, so no separate file needs removal.
}
