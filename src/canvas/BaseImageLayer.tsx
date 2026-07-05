import { Image } from '@shopify/react-native-skia';
import type { SkImage } from '@shopify/react-native-skia';

import type { Size } from '../context/EditorContext';

/**
 * Draws the base image in IMAGE space (x=0,y=0, native width/height). The parent
 * scene `<Group>` maps it onto the screen, so this same layer renders identically
 * off-screen at full resolution during export.
 */
export function BaseImageLayer({
  image,
  size,
}: {
  image: SkImage;
  size: Size;
}) {
  return (
    <Image
      image={image}
      x={0}
      y={0}
      width={size.width}
      height={size.height}
      fit="fill"
    />
  );
}
