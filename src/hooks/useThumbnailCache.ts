import { useEffect, useState } from "react";

const CACHE_PREFIX = "thumb_v1::";
const CACHE_INDEX_KEY = "thumb_v1::__index";
const MAX_ENTRIES = 80;
const TARGET_SIZE = 300;

function readIndex(): string[] {
  try {
    return JSON.parse(localStorage.getItem(CACHE_INDEX_KEY) || "[]");
  } catch {
    return [];
  }
}

function touchIndex(key: string) {
  const idx = readIndex().filter((k) => k !== key);
  idx.push(key);
  while (idx.length > MAX_ENTRIES) {
    const old = idx.shift()!;
    try {
      localStorage.removeItem(CACHE_PREFIX + old);
    } catch {}
  }
  try {
    localStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(idx));
  } catch {}
}

async function buildThumbnail(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = TARGET_SIZE;
        canvas.height = TARGET_SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, TARGET_SIZE, TARGET_SIZE);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Returns a cached 300x300 thumbnail dataURL for the given image URL.
 * Falls back to the original URL while building / on failure.
 * Cache is stored in localStorage keyed by event id + url.
 */
export function useThumbnailCache(eventId: string, url?: string | null): string | undefined {
  const [thumb, setThumb] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!url) {
      setThumb(undefined);
      return;
    }
    const key = `${eventId}::${url}`;
    try {
      const cached = localStorage.getItem(CACHE_PREFIX + key);
      if (cached) {
        setThumb(cached);
        touchIndex(key);
        return;
      }
    } catch {}

    setThumb(url); // show original while building
    let cancelled = false;
    buildThumbnail(url).then((data) => {
      if (cancelled || !data) return;
      try {
        localStorage.setItem(CACHE_PREFIX + key, data);
        touchIndex(key);
      } catch {
        // quota exceeded: best-effort clear oldest then ignore
        try {
          const idx = readIndex();
          for (let i = 0; i < 20 && idx.length; i++) {
            localStorage.removeItem(CACHE_PREFIX + idx.shift()!);
          }
          localStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(idx));
          localStorage.setItem(CACHE_PREFIX + key, data);
        } catch {}
      }
      setThumb(data);
    });
    return () => {
      cancelled = true;
    };
  }, [eventId, url]);

  return thumb;
}
