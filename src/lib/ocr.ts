import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

/**
 * Prompts the user to pick a recent screenshot from the gallery.
 * Tip: On Android, screenshots typically live in an album named "Screenshots".
 */
export async function pickScreenshotFromGallery(): Promise<{ base64?: string, uri?: string } | null> {
  // Request permissions
  const libPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!libPerm.granted) return null;

  // Try to open the Screenshots album first
  try {
    const album = await MediaLibrary.getAlbumAsync('Screenshots');
    if (album) {
      const assets = await MediaLibrary.getAssetsAsync({ album: album.id, sortBy: [[MediaLibrary.SortBy.creationTime, false]], first: 50, mediaType: 'photo' });
      // Fallback to generic picker if no assets
      if (assets.assets.length > 0) {
        // Manually open picker restricted to images (Expo ImagePicker cannot filter by album yet)
        // So show recent images and let user choose – we will still allow any image.
      }
    }
  } catch {}

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    base64: true,
    quality: 0.8
  });
  if (result.canceled) return null;
  const asset = result.assets?.[0];
  return { base64: asset?.base64, uri: asset?.uri };
}

/**
 * Local OCR stub (TODO): integrate ML Kit or Tesseract when ejecting to bare RN.
 * For Expo managed, rely on Make.com/remote OCR for now.
 */
export async function localOcrExtract(_uri: string): Promise<string | null> {
  // TODO: Implement native OCR integration (ML Kit / Tesseract) once we move to bare/react-native.
  return null;
}
