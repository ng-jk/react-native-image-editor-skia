import { ClipOp, ImageFormat, Skia } from '@shopify/react-native-skia';
import type { SkImage } from '@shopify/react-native-skia';

import type { Annotation, ExportOptions, Rect, SceneTransform } from '../types';
import { clampSizeToMax } from '../utils/math';
import { drawScene } from './drawScene';
import { safeDispose } from '../image/disposeRegistry';

const RAD_TO_DEG = 180 / Math.PI;

export interface ExportParams {
  image: SkImage;
  annotations: Annotation[];
  scene: SceneTransform;
  imageWidth: number;
  imageHeight: number;
  options?: ExportOptions;
}

/**
 * Render the scene OFF-SCREEN at full resolution and return base64.
 *
 * Output = the (optionally cropped) image + annotations, scaled by `scene.scale`
 * and rotated by `scene.rotation`, on a surface sized to the rotated content's
 * bounding box (transparent corners for PNG). Because annotations live in image
 * space, no per-annotation rescaling is needed — the exact preview geometry is
 * drawn at native resolution.
 *
 * All Skia objects created here (surface + snapshot) are disposed before return.
 */
export async function exportImage(params: ExportParams): Promise<string> {
  const { image, annotations, scene, imageWidth, imageHeight, options } = params;
  const format = options?.format ?? 'png';
  const quality = options?.quality ?? 100;
  const dataUri = options?.dataUri ?? true;

  const src: Rect = scene.cropRect ?? {
    x: 0,
    y: 0,
    width: imageWidth,
    height: imageHeight,
  };

  const contentW = src.width * scene.scale;
  const contentH = src.height * scene.scale;
  const absCos = Math.abs(Math.cos(scene.rotation));
  const absSin = Math.abs(Math.sin(scene.rotation));
  const rotatedW = contentW * absCos + contentH * absSin;
  const rotatedH = contentW * absSin + contentH * absCos;

  const clamped = clampSizeToMax(
    Math.max(1, Math.ceil(rotatedW)),
    Math.max(1, Math.ceil(rotatedH)),
    options?.maxExportSize
  );
  // Reduce the drawing scale by the same factor the clamp shrank the surface.
  const clampFactor = clamped.width / Math.max(1, Math.ceil(rotatedW));
  const drawScale = scene.scale * clampFactor;

  const surface = Skia.Surface.MakeOffscreen(clamped.width, clamped.height);
  if (!surface) {
    throw new Error(
      'Skia.Surface.MakeOffscreen returned null — offscreen export unavailable on this device/version.'
    );
  }

  let snapshot: SkImage | null = null;
  try {
    const canvas = surface.getCanvas();
    const srcCenter = {
      x: src.x + src.width / 2,
      y: src.y + src.height / 2,
    };
    canvas.save();
    canvas.translate(clamped.width / 2, clamped.height / 2);
    if (scene.rotation) {
      canvas.rotate(scene.rotation * RAD_TO_DEG, 0, 0);
    }
    canvas.scale(drawScale, drawScale);
    canvas.translate(-srcCenter.x, -srcCenter.y);
    // Clip to the crop region so only the selected area is drawn.
    canvas.clipRect(
      Skia.XYWHRect(src.x, src.y, src.width, src.height),
      ClipOp.Intersect,
      true
    );
    drawScene(canvas, image, annotations);
    canvas.restore();

    surface.flush();
    snapshot = surface.makeImageSnapshot();
    const skFormat = format === 'jpeg' ? ImageFormat.JPEG : ImageFormat.PNG;
    const base64 = snapshot.encodeToBase64(skFormat, quality);

    // File output: write the raw base64 via the caller-supplied writer.
    if (options?.output === 'file') {
      if (!options.filePath || !options.writeFile) {
        throw new Error(
          "exportImage: output:'file' requires both `filePath` and `writeFile`."
        );
      }
      await options.writeFile(options.filePath, base64);
      return options.filePath;
    }

    return dataUri ? `data:image/${format};base64,${base64}` : base64;
  } finally {
    safeDispose(snapshot);
    safeDispose(surface);
  }
}
