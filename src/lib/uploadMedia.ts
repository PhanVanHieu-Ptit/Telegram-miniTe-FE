/**
 * uploadMedia.ts
 *
 * Two upload paths:
 *  1. uploadAttachments — Firebase Storage SDK (legacy, used for voice notes / drawings)
 *  2. uploadAttachmentsViaBackend — multipart POST to backend → Cloudinary
 *
 * The returned attachment objects are used directly as message.attachments.
 */

import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import app from '@/firebase/firebase';
import type { Attachment } from '@/types/chat.types';
import apiClient from '@/api/axios';

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
 * Upload multiple files via Firebase Storage (legacy path).
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

export interface CloudinaryAttachment {
  url: string;
  public_id: string;
  type: 'image' | 'video' | 'audio' | 'file';
  format: string;
  size: number;
  name: string;
}

/**
 * Upload files via the backend → Cloudinary pipeline.
 *
 * Sends a single multipart/form-data request containing:
 *   - conversationId field
 *   - one or more "files" file parts
 *
 * Returns Attachment[] using the Cloudinary CDN URLs.
 */
export async function uploadAttachmentsViaBackend(
  files: File[],
  conversationId: string,
  onProgress?: (fileIndex: number, percent: number) => void
): Promise<Attachment[]> {
  const formData = new FormData();
  formData.append('conversationId', conversationId);
  files.forEach((file) => formData.append('files', file, file.name));

  // Signal upload started
  files.forEach((_, idx) => onProgress?.(idx, 10));

  const response = await apiClient.post<CloudinaryAttachment[]>(
    '/messages/upload-attachments',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120_000, // 2 min for large files
      onUploadProgress: (evt) => {
        if (evt.total) {
          const pct = Math.round((evt.loaded / evt.total) * 90) + 10;
          files.forEach((_, idx) => onProgress?.(idx, Math.min(pct, 99)));
        }
      },
    }
  );

  files.forEach((_, idx) => onProgress?.(idx, 100));

  return response.data.map((r) => ({
    url: r.url,
    name: r.name,
    size: r.size,
    type: r.type,
  }));
}
