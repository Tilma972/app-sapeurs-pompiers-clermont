/**
 * Composant upload d'image avec drag-drop et preview
 * Upload vers Supabase Storage buckets
 */

'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  bucketName: 'partner-logos' | 'offer-images';
  currentImageUrl?: string | null;
  onUploadComplete: (url: string) => void;
  onRemove?: () => void;
  maxSizeMB?: number;
  aspectRatio?: string; // ex: "aspect-square", "aspect-video"
}

export function ImageUpload({
  bucketName,
  currentImageUrl,
  onUploadComplete,
  onRemove,
  maxSizeMB = bucketName === 'partner-logos' ? 2 : 5,
  aspectRatio = 'aspect-video',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateFile = (file: File): boolean => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (bucketName === 'partner-logos') {
      allowedTypes.push('image/svg+xml');
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error(`Type de fichier non autorisé. Utilisez : ${allowedTypes.join(', ')}`);
      return false;
    }

    // Check file size
    if (file.size > maxSizeBytes) {
      toast.error(`Fichier trop volumineux (max ${maxSizeMB}MB)`);
      return false;
    }

    return true;
  };

  const uploadToStorage = async (file: File): Promise<string | null> => {
    try {
      const supabase = createClient();

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Erreur lors de l\'upload');
        return null;
      }

      // Get public URL
      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Upload exception:', error);
      toast.error('Erreur lors de l\'upload');
      return null;
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!validateFile(file)) {
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    const url = await uploadToStorage(file);
    setUploading(false);

    if (url) {
      onUploadComplete(url);
      toast.success('Image uploadée avec succès !');
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onRemove?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={bucketName === 'partner-logos' ? 'image/*' : 'image/jpeg,image/png,image/webp'}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={uploading}
      />

      {previewUrl ? (
        <Card className="relative overflow-hidden">
          <div className={`relative ${aspectRatio} w-full`}>
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              className="object-cover"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </Card>
      ) : (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            ${aspectRatio} w-full
            border-2 border-dashed rounded-lg
            flex flex-col items-center justify-center
            cursor-pointer transition-colors
            ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
          ) : (
            <>
              {dragActive ? (
                <Upload className="h-10 w-10 text-primary mb-2" />
              ) : (
                <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
              )}
              <p className="text-sm text-muted-foreground text-center px-4">
                {dragActive ? (
                  'Déposez l\'image ici'
                ) : (
                  <>
                    Glissez-déposez une image ou{' '}
                    <span className="text-primary font-medium">cliquez pour parcourir</span>
                  </>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Max {maxSizeMB}MB • JPEG, PNG, WebP{bucketName === 'partner-logos' && ', SVG'}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
