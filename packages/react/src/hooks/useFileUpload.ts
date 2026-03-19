// ============================================================================
// AegisChat React SDK - useFileUpload Hook
// ============================================================================

import { useState } from 'react';
import type { FileAttachment, UploadProgress } from '../types';

export interface UseFileUploadOptions {
  channelId: string;
}

export interface UseFileUploadReturn {
  uploadProgress: UploadProgress[];
  upload: (file: File) => Promise<FileAttachment | null>;
}

export function useFileUpload(_options: UseFileUploadOptions): UseFileUploadReturn {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  const upload = async (_file: File): Promise<FileAttachment | null> => null;

  return { uploadProgress, upload };
}

export default useFileUpload;
