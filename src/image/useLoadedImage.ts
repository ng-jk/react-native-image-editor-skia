import { useEffect, useRef, useState } from 'react';
import { Skia } from '@shopify/react-native-skia';
import type { SkImage } from '@shopify/react-native-skia';

import type { ImageSource } from '../types';
import { safeDispose } from './disposeRegistry';

export interface LoadedImage {
  image: SkImage | null;
  width: number;
  height: number;
  loading: boolean;
  error: Error | null;
}

function stripDataUri(base64: string): string {
  const comma = base64.indexOf(',');
  if (base64.startsWith('data:') && comma !== -1) {
    return base64.slice(comma + 1);
  }
  return base64;
}

/**
 * Decode an {@link ImageSource} into an `SkImage`, managing native memory.
 *
 * Memory rules enforced here:
 *  - The encoded `SkData` is disposed immediately after `MakeImageFromEncoded`;
 *    the decoded `SkImage` owns its pixels, so retaining the encoded bytes would
 *    roughly double memory usage.
 *  - When `source` changes (or the component unmounts) the previous `SkImage` is
 *    disposed before the next one is created.
 *  - The input base64 string is consumed inside the effect and never copied into
 *    state, so a large payload is not retained by this hook.
 */
export function useLoadedImage(source: ImageSource): LoadedImage {
  const [state, setState] = useState<LoadedImage>({
    image: null,
    width: 0,
    height: 0,
    loading: true,
    error: null,
  });

  // Serialize the source so the effect re-runs only on a real change, without
  // holding the (possibly huge) base64 string in a memoized ref.
  const sourceKey =
    'base64' in source ? `b64:${source.base64.length}:${source.base64.slice(-64)}` : `uri:${source.uri}`;

  const currentImage = useRef<SkImage | null>(null);

  useEffect(() => {
    let cancelled = false;

    const commit = (image: SkImage) => {
      if (cancelled) {
        // A newer load superseded us — drop this result.
        safeDispose(image);
        return;
      }
      // Dispose the previous image before swapping in the new one.
      if (currentImage.current && currentImage.current !== image) {
        safeDispose(currentImage.current);
      }
      currentImage.current = image;
      setState({
        image,
        width: image.width(),
        height: image.height(),
        loading: false,
        error: null,
      });
    };

    const fail = (error: Error) => {
      if (cancelled) {
        return;
      }
      setState((prev) => ({ ...prev, loading: false, error }));
    };

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      if ('base64' in source) {
        const data = Skia.Data.fromBase64(stripDataUri(source.base64));
        const image = Skia.Image.MakeImageFromEncoded(data);
        safeDispose(data); // decoded pixels are owned by `image` now
        if (!image) {
          throw new Error('Failed to decode image from base64.');
        }
        commit(image);
      } else {
        // fromURI is async (may fetch a remote/local file).
        Skia.Data.fromURI(source.uri)
          .then((data) => {
            if (cancelled) {
              safeDispose(data);
              return;
            }
            const image = Skia.Image.MakeImageFromEncoded(data);
            safeDispose(data);
            if (!image) {
              throw new Error(`Failed to decode image from URI: ${source.uri}`);
            }
            commit(image);
          })
          .catch((e: unknown) =>
            fail(e instanceof Error ? e : new Error(String(e)))
          );
      }
    } catch (e) {
      fail(e instanceof Error ? e : new Error(String(e)));
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceKey]);

  // Final safety net: dispose the last image when the hook unmounts.
  useEffect(() => {
    return () => {
      safeDispose(currentImage.current);
      currentImage.current = null;
    };
  }, []);

  return state;
}
