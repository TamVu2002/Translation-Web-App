'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileAudio, FileVideo, Loader2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface UploadDropzoneProps {
  projectId: string;
  userId: string;
  onUploadComplete: (mediaFileId: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

// Cloudflare R2 supports up to 5GB, we limit to 500MB for practicality
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ACCEPTED_TYPES = {
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/m4a': ['.m4a'],
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
  'video/quicktime': ['.mov'],
};

export function UploadDropzone({ 
  projectId, 
  userId, 
  onUploadComplete, 
  onError,
  disabled = false 
}: UploadDropzoneProps) {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const uploadFile = async (file: File) => {
    setUploadStatus('uploading');
    setUploadProgress(0);
    setErrorMessage(null);

    try {
      // 1. Get signed upload URL from server
      const signedUrlResponse = await fetch('/api/upload/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          filename: file.name,
          contentType: file.type,
          fileSize: file.size,
        }),
      });

      if (!signedUrlResponse.ok) {
        const error = await signedUrlResponse.json();
        throw new Error(error.error || 'Failed to get upload URL');
      }

      const { signedUrl, storagePath, mediaFileId } = await signedUrlResponse.json();

      // 2. Upload file directly with XHR
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

        xhr.open('PUT', signedUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      // 3. Confirm upload and create database record
      setUploadStatus('processing');
      
      const confirmResponse = await fetch('/api/upload/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          mediaFileId,
          storagePath,
          filename: file.name,
          mimeType: file.type,
          fileSize: file.size,
        }),
      });

      if (!confirmResponse.ok) {
        const error = await confirmResponse.json();
        throw new Error(error.error || 'Failed to confirm upload');
      }

      setUploadStatus('complete');
      onUploadComplete(mediaFileId);
    } catch (err) {
      console.error('Upload error:', err);
      const message = err instanceof Error ? err.message : 'Upload failed';
      setErrorMessage(message);
      setUploadStatus('error');
      onError(message);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: unknown[]) => {
    if (rejectedFiles.length > 0) {
      setErrorMessage('File không hợp lệ hoặc quá lớn. Tối đa 500MB, chỉ hỗ trợ MP3/MP4/WAV/WebM.');
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      uploadFile(file);
    }
  }, [projectId, userId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: 1,
    disabled: disabled || uploadStatus === 'uploading' || uploadStatus === 'processing',
  });

  const resetUpload = () => {
    setUploadStatus('idle');
    setUploadProgress(0);
    setSelectedFile(null);
    setErrorMessage(null);
  };

  const isVideo = selectedFile?.type.startsWith('video/');
  const FileIcon = isVideo ? FileVideo : FileAudio;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        {uploadStatus === 'idle' && (
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-xl p-8 md:p-12 text-center cursor-pointer transition-all duration-300',
              isDragActive 
                ? 'border-primary bg-primary/10 scale-[1.02]' 
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <input {...getInputProps()} />
            <div className={cn(
              'w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all duration-300',
              isDragActive 
                ? 'bg-primary/20 scale-110' 
                : 'bg-muted'
            )}>
              <Upload className={cn(
                'h-8 w-8 transition-colors duration-300',
                isDragActive ? 'text-primary' : 'text-muted-foreground'
              )} />
            </div>
            <p className="text-lg font-semibold mb-2">
              {isDragActive ? '✨ Thả file của bạn vào đây' : 'Kéo & thả file media của bạn'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              hoặc nhấn để chọn file
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-xs text-muted-foreground">
              <span>🎵 MP3, WAV, M4A</span>
              <span className="text-muted-foreground/50">•</span>
              <span>🎬 MP4, WebM, MOV</span>
              <span className="text-muted-foreground/50">•</span>
              <span>Tối đa 500MB</span>
            </div>
          </div>
        )}

        {(uploadStatus === 'uploading' || uploadStatus === 'processing') && selectedFile && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-4">
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                isVideo ? 'bg-gradient-to-br from-primary/20 to-chart-2/20' : 'bg-gradient-to-br from-chart-4/20 to-chart-5/20'
              )}>
                <FileIcon className={cn(
                  'h-6 w-6',
                  isVideo ? 'text-primary' : 'text-chart-4'
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              {uploadStatus === 'uploading' && (
                <span className="text-sm font-semibold text-primary">{uploadProgress}%</span>
              )}
            </div>
            
            <Progress value={uploadStatus === 'processing' ? 100 : uploadProgress} className="h-2" />
            
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>{uploadStatus === 'uploading' ? 'Đang tải lên...' : 'Đang xử lý...'}</span>
            </div>
          </div>
        )}

        {uploadStatus === 'complete' && selectedFile && (
          <div className="space-y-4 animate-scale-in">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{selectedFile.name}</p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  ✓ Tải lên thành công!
                </p>
              </div>
            </div>
            <Button variant="outline" className="w-full hover-lift" onClick={resetUpload}>
              Tải lên file khác
            </Button>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="space-y-4 animate-shake">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <X className="h-6 w-6 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">Tải lên thất bại</p>
                <p className="text-sm text-destructive">
                  {errorMessage || 'Đã xảy ra lỗi'}
                </p>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={resetUpload}>
              Thử lại
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
