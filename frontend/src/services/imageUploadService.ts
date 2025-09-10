import { toast } from 'react-toastify';

export interface UploadedImage {
  id: string;
  file: File;
  url: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  success?: boolean;
  imageId?: string;
  previewUrl?: string;
}

export interface ImageUploadOptions {
  maxSize?: number; // in bytes, default 5MB
  allowedTypes?: string[];
  quality?: number; // 0-1, for compression
  maxWidth?: number;
  maxHeight?: number;
}

class ImageUploadService {
  private static instance: ImageUploadService;
  private uploadedImages: Map<string, UploadedImage> = new Map();

  private readonly DEFAULT_OPTIONS: Required<ImageUploadOptions> = {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    quality: 0.8,
    maxWidth: 1200,
    maxHeight: 800
  };

  public static getInstance(): ImageUploadService {
    if (!ImageUploadService.instance) {
      ImageUploadService.instance = new ImageUploadService();
    }
    return ImageUploadService.instance;
  }

  // Validate uploaded file
  public validateFile(file: File, options?: ImageUploadOptions): { isValid: boolean; error?: string } {
    const finalOptions = { ...this.DEFAULT_OPTIONS, ...options };
    // Check file type
    if (!finalOptions.allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `Invalid file type. Allowed types: ${finalOptions.allowedTypes.join(', ')}`
      };
    }

    // Check file size
    if (file.size > finalOptions.maxSize) {
      const maxSizeMB = finalOptions.maxSize / (1024 * 1024);
      return {
        isValid: false,
        error: `File size too large. Maximum size: ${maxSizeMB}MB`
      };
    }

    return { isValid: true };
  }

  // Compress and resize image
  private async compressImage(file: File, options: Required<ImageUploadOptions>): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate new dimensions
          let { width, height } = img;
          
          if (width > options.maxWidth || height > options.maxHeight) {
            const ratio = Math.min(options.maxWidth / width, options.maxHeight / height);
            width *= ratio;
            height *= ratio;
          }

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw and compress image
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            file.type,
            options.quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Upload single image
  public async uploadImage(file: File, customOptions?: ImageUploadOptions): Promise<UploadedImage | null> {
    const options = { ...this.DEFAULT_OPTIONS, ...customOptions };
    
    try {
      // Validate file
      const validation = this.validateFile(file, options);
      if (!validation.isValid) {
        toast.error(validation.error || 'Invalid file');
        return null;
      }

      // Compress image
      const compressedFile = await this.compressImage(file, options);
      
      // Create image URL (in real app, this would upload to server/cloud storage)
      const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const imageUrl = URL.createObjectURL(compressedFile);
      
      const uploadedImage: UploadedImage = {
        id: imageId,
        file: compressedFile,
        url: imageUrl,
        name: file.name,
        size: compressedFile.size,
        type: compressedFile.type,
        uploadedAt: new Date().toISOString(),
        success: true,
        imageId: imageId,
        previewUrl: imageUrl
      };

      // Store in memory (in real app, would store reference in database)
      this.uploadedImages.set(imageId, uploadedImage);
      
      // Store in localStorage for persistence
      this.saveToStorage(imageId, uploadedImage);

      toast.success(`Image "${file.name}" uploaded successfully!`);
      return uploadedImage;

    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image. Please try again.');
      return null;
    }
  }

  // Upload multiple images
  public async uploadMultipleImages(files: FileList, customOptions?: ImageUploadOptions): Promise<UploadedImage[]> {
    const uploadPromises = Array.from(files).map(file => this.uploadImage(file, customOptions));
    const results = await Promise.all(uploadPromises);
    return results.filter((result): result is UploadedImage => result !== null);
  }

  // Get image by ID
  public getImage(imageId: string): UploadedImage | null {
    // Try to get from memory first
    if (this.uploadedImages.has(imageId)) {
      return this.uploadedImages.get(imageId) || null;
    }

    // Try to load from storage
    return this.loadFromStorage(imageId);
  }

  // Delete image
  public deleteImage(imageId: string): boolean {
    try {
      const image = this.getImage(imageId);
      if (image) {
        // Revoke object URL to free memory
        URL.revokeObjectURL(image.url);
        
        // Remove from memory
        this.uploadedImages.delete(imageId);
        
        // Remove from storage
        this.removeFromStorage(imageId);
        
        toast.success('Image deleted successfully!');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image.');
      return false;
    }
  }

  // Get all uploaded images
  public getAllImages(): UploadedImage[] {
    this.loadAllFromStorage();
    return Array.from(this.uploadedImages.values());
  }

  // Generate image preview URL
  public generatePreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  // Validate image dimensions
  public async validateImageDimensions(file: File, minWidth?: number, minHeight?: number): Promise<{ width: number; height: number; isValid: boolean }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const isValid = (!minWidth || img.width >= minWidth) && (!minHeight || img.height >= minHeight);
        resolve({
          width: img.width,
          height: img.height,
          isValid
        });
      };
      img.src = URL.createObjectURL(file);
    });
  }

  // Create placeholder image data URL
  public createPlaceholderImage(width: number = 400, height: number = 300, text: string = 'No Image'): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = width;
    canvas.height = height;
    
    if (ctx) {
      // Background
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, width, height);
      
      // Border
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, width - 2, height - 2);
      
      // Text
      ctx.fillStyle = '#6b7280';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, width / 2, height / 2);
    }
    
    return canvas.toDataURL('image/png');
  }

  // Storage methods (localStorage for demo, would be replaced with proper backend)
  private saveToStorage(imageId: string, image: UploadedImage): void {
    try {
      // Convert file to base64 for storage (not ideal for production)
      const reader = new FileReader();
      reader.onload = () => {
        const imageData = {
          id: image.id,
          url: image.url,
          name: image.name,
          size: image.size,
          type: image.type,
          uploadedAt: image.uploadedAt,
          base64: reader.result as string
        };
        localStorage.setItem(`uploaded_image_${imageId}`, JSON.stringify(imageData));
      };
      reader.readAsDataURL(image.file);
    } catch (error) {
      console.error('Failed to save image to storage:', error);
    }
  }

  private loadFromStorage(imageId: string): UploadedImage | null {
    try {
      const stored = localStorage.getItem(`uploaded_image_${imageId}`);
      if (stored) {
        const imageData = JSON.parse(stored);
        
        // Convert base64 back to File (simplified approach)
        const byteCharacters = atob(imageData.base64.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const file = new File([byteArray], imageData.name, { type: imageData.type });
        
        const uploadedImage: UploadedImage = {
          id: imageData.id,
          file,
          url: imageData.url,
          name: imageData.name,
          size: imageData.size,
          type: imageData.type,
          uploadedAt: imageData.uploadedAt
        };
        
        this.uploadedImages.set(imageId, uploadedImage);
        return uploadedImage;
      }
    } catch (error) {
      console.error('Failed to load image from storage:', error);
    }
    return null;
  }

  private removeFromStorage(imageId: string): void {
    localStorage.removeItem(`uploaded_image_${imageId}`);
  }

  private loadAllFromStorage(): void {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('uploaded_image_'));
    keys.forEach(key => {
      const imageId = key.replace('uploaded_image_', '');
      if (!this.uploadedImages.has(imageId)) {
        this.loadFromStorage(imageId);
      }
    });
  }

  // Cleanup method to revoke all object URLs (call on app unmount)
  public cleanup(): void {
    this.uploadedImages.forEach(image => {
      URL.revokeObjectURL(image.url);
    });
    this.uploadedImages.clear();
  }

  // Get formatted file size
  public formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Check if file is image
  public isImageFile(file: File): boolean {
    return this.DEFAULT_OPTIONS.allowedTypes.includes(file.type);
  }
}

export default ImageUploadService;
