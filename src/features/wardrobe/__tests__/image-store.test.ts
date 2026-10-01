import { beforeEach, describe, expect, jest, test } from '@jest/globals';

import {
  persistWardrobeImage,
  removeWardrobeImage,
} from '../image-store.native';
import {
  persistWardrobeImage as persistWebImage,
  removeWardrobeImage as removeWebImage,
} from '../image-store.web';

jest.mock('expo-file-system', () => {
  const state = {
    directoryUri: 'file:///documents/wardrobe',
    createCalls: [] as unknown[],
    copiedDestinations: [] as string[],
    deletedUris: [] as string[],
    createError: null as Error | null,
    copyError: null as Error | null,
    deleteError: null as Error | null,
    fileExists: true,
  };

  class Directory {
    uri: string;

    constructor() {
      this.uri = state.directoryUri;
    }

    create(options: unknown) {
      state.createCalls.push(options);
      if (state.createError) throw state.createError;
    }
  }

  class File {
    uri: string;

    constructor(source: string | Directory, name?: string) {
      this.uri =
        typeof source === 'string'
          ? source
          : `${source.uri.endsWith('/') ? source.uri : `${source.uri}/`}${name}`;
    }

    get exists() {
      return state.fileExists;
    }

    async copy(destination: File) {
      if (state.copyError) throw state.copyError;
      state.copiedDestinations.push(destination.uri);
    }

    delete() {
      if (state.deleteError) throw state.deleteError;
      state.deletedUris.push(this.uri);
    }
  }

  return {
    Directory,
    File,
    Paths: { document: 'file:///documents' },
    __mockState: state,
  };
});

type FileSystemMockState = {
  directoryUri: string;
  createCalls: unknown[];
  copiedDestinations: string[];
  deletedUris: string[];
  createError: Error | null;
  copyError: Error | null;
  deleteError: Error | null;
  fileExists: boolean;
};

const fileSystemState = (
  jest.requireMock('expo-file-system') as { __mockState: FileSystemMockState }
).__mockState;

describe('native wardrobe image store', () => {
  beforeEach(() => {
    fileSystemState.directoryUri = 'file:///documents/wardrobe';
    fileSystemState.createCalls.length = 0;
    fileSystemState.copiedDestinations.length = 0;
    fileSystemState.deletedUris.length = 0;
    fileSystemState.createError = null;
    fileSystemState.copyError = null;
    fileSystemState.deleteError = null;
    fileSystemState.fileExists = true;
  });

  test('copies a source image into the managed directory with a normalized extension', async () => {
    await expect(
      persistWardrobeImage('file:///camera/LOOK.PNG?version=1', 'item-1'),
    ).resolves.toBe('file:///documents/wardrobe/item-1.png');

    expect(fileSystemState.createCalls).toEqual([
      { idempotent: true, intermediates: true },
    ]);
    expect(fileSystemState.copiedDestinations).toEqual([
      'file:///documents/wardrobe/item-1.png',
    ]);
  });

  test('uses a jpg extension when the source URI has no usable extension', async () => {
    await expect(
      persistWardrobeImage('content://camera/photo', 'item-2'),
    ).resolves.toBe('file:///documents/wardrobe/item-2.jpg');
  });

  test('rejects an empty source URI before touching the file system', async () => {
    await expect(persistWardrobeImage('   ', 'item-3')).rejects.toThrow(
      'Please choose a clothing photo.',
    );
    expect(fileSystemState.createCalls).toEqual([]);
  });

  test('wraps native copy failures and preserves their cause', async () => {
    const cause = new Error('copy failed');
    fileSystemState.copyError = cause;

    await expect(
      persistWardrobeImage('file:///camera/look.jpeg#preview', 'item-4'),
    ).rejects.toMatchObject({
      message: 'Could not save the clothing photo. Please choose it again.',
      cause,
    });
  });

  test('wraps directory creation failures', async () => {
    const cause = new Error('directory failed');
    fileSystemState.createError = cause;

    await expect(
      persistWardrobeImage('file:///camera/look.jpg', 'item-5'),
    ).rejects.toMatchObject({
      message: 'Could not save the clothing photo. Please choose it again.',
      cause,
    });
  });

  test('ignores images outside the managed wardrobe directory', async () => {
    await expect(
      removeWardrobeImage('file:///camera/look.jpg'),
    ).resolves.toBeUndefined();
    expect(fileSystemState.deletedUris).toEqual([]);
  });

  test('deletes an existing managed image', async () => {
    await removeWardrobeImage('file:///documents/wardrobe/item-1.jpg');

    expect(fileSystemState.deletedUris).toEqual([
      'file:///documents/wardrobe/item-1.jpg',
    ]);
  });

  test('does not delete a missing managed image and accepts a trailing directory slash', async () => {
    fileSystemState.directoryUri = 'file:///documents/wardrobe/';
    fileSystemState.fileExists = false;

    await expect(
      removeWardrobeImage('file:///documents/wardrobe/missing.jpg'),
    ).resolves.toBeUndefined();
    expect(fileSystemState.deletedUris).toEqual([]);
  });

  test('wraps cleanup failures and preserves their cause', async () => {
    const cause = new Error('delete failed');
    fileSystemState.deleteError = cause;

    await expect(
      removeWardrobeImage('file:///documents/wardrobe/item-1.jpg'),
    ).rejects.toMatchObject({
      message: 'The clothing item was removed, but its photo could not be cleaned up.',
      cause,
    });
  });

  test('exposes the native implementation through the fallback module contract', () => {
    const fallback = jest.requireActual('../image-store.ts') as typeof import('../image-store.native');

    expect(fallback.persistWardrobeImage).toBe(persistWardrobeImage);
    expect(fallback.removeWardrobeImage).toBe(removeWardrobeImage);
  });
});

describe('web wardrobe image store', () => {
  test('keeps inline image data unchanged', async () => {
    const source = 'data:image/png;base64,aGVsbG8=';

    await expect(persistWebImage(source)).resolves.toBe(source);
  });

  test('rejects non-inline web images', async () => {
    await expect(persistWebImage('blob:https://example.com/photo')).rejects.toThrow(
      'Could not save this photo on the web. Please choose it again.',
    );
  });

  test('does not need separate cleanup for inline web images', async () => {
    await expect(removeWebImage('data:image/png;base64,aA==')).resolves.toBeUndefined();
  });
});
