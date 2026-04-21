/**
 * uploadMedia.ts
 *
 * Uploads files to Firebase Storage via the SDK (no CORS issue on upload itself).
 * Returns the Firebase download URL after upload completes.
 *
 * NOTE: The returned `downloadUrl` is used ONLY for persisting to the backend.
 * For rendering in the chat UI, the caller should keep the `localUrl` (blob URL)
 * until the image/video/audio element successfully loads from the remote URL.
 */

import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import app from '@/firebase/firebase';
import type { Attachment } from '@/types/chat.types';

const storage = getStorage(app);

export interface UploadResult {
  /** Firebase Storage public download URL */
  url: string;
  name: string;
  size: number;
  type: string;
}

/**
 * Upload a single file to Firebase Storage.
 * @param file        The File to upload
 * @param storagePath Storage path prefix, e.g. "chat-media/{conversationId}"
 * @param onProgress  Optional 0–100 progress callback
 */
export function uploadFile(
  file: File,
  storagePath: string,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop() ?? 'bin';
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const storageRef = ref(storage, `${storagePath}/${uniqueName}`);

    const metadata = {
      contentType: file.type,
      // These custom metadata fields don't affect CORS — CORS is configured at bucket level
      customMetadata: { originalName: file.name },
    };

    const task = uploadBytesResumable(storageRef, file, metadata);

    task.on(
      'state_changed',
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        onProgress?.(pct);
      },
      (error) => {
        console.error('[uploadMedia] Upload error:', error.code, error.message);
        reject(error);
      },
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve({ url, name: file.name, size: file.size, type: file.type });
        } catch (err) {
          console.error('[uploadMedia] getDownloadURL error:', err);
          reject(err);
        }
      }
    );
  });
}

/**
 * Upload multiple files in parallel.
 * Returns Attachment[] with real Firebase CDN URLs.
 */
export async function uploadAttachments(
  files: File[],
  conversationId: string,
  onProgress?: (fileIndex: number, percent: number) => void
): Promise<Attachment[]> {
  const results = await Promise.all(
    files.map((file, idx) =>
      uploadFile(
        file,
        `chat-media/${conversationId}`,
        (pct) => onProgress?.(idx, pct)
      )
    )
  );

  return results.map((r) => ({
    url: r.url,
    name: r.name,
    size: r.size,
    type: r.type,
  }));
}
