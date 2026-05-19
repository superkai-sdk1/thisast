'use client';

import { useRef, useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ImageUploaderProps {
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  maxFiles?: number;
  className?: string;
}

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const WEBP_QUALITY = 0.85;

async function compressToWebP(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height, 1);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Canvas toBlob failed'));
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }));
        },
        'image/webp',
        WEBP_QUALITY,
      );
    };

    img.onerror = reject;
    img.src = url;
  });
}

export function ImageUploader({ onUpload, accept = 'image/*', maxFiles = 10, className }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setLoading(true);
    try {
      const uploads = Array.from(files).slice(0, maxFiles).map(async (file) => {
        const compressed = await compressToWebP(file);
        await onUpload(compressed);
      });
      await Promise.all(uploads);
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
      className={cn(
        'border-2 border-dashed rounded-[14px] p-6 flex flex-col items-center gap-2',
        'cursor-pointer transition-colors select-none',
        dragOver
          ? 'border-[var(--ios-blue)] bg-[var(--ios-blue)]/5'
          : 'border-[var(--separator)] hover:border-[var(--ios-blue)]/50',
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={maxFiles > 1}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {loading ? (
        <Loader2 className="w-6 h-6 text-[var(--ios-blue)] animate-spin" />
      ) : (
        <Upload className="w-6 h-6 text-[var(--label-tertiary)]" />
      )}

      <p className="text-sm text-[var(--label-secondary)] text-center">
        {loading ? 'Загрузка...' : 'Нажмите или перетащите фото'}
      </p>
      <p className="text-xs text-[var(--label-tertiary)]">
        JPEG, PNG, HEIC — сжимается до WebP
      </p>
    </div>
  );
}
