import React, { useState, useRef, DragEvent } from 'react';
import { Upload, X, Image as ImageIcon, Loader } from 'lucide-react';
import { toast } from 'react-toastify';
import uploadService from '../../services/uploadService';

interface ImageUploadProps {
    mode: 'single' | 'multiple';
    currentImages?: string[];
    onImagesChange: (images: string[]) => void;
    maxFiles?: number;
    maxSizeMB?: number;
    label?: string;
    required?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
    mode,
    currentImages = [],
    onImagesChange,
    maxFiles = 10,
    maxSizeMB = 5,
    label = 'Images',
    required = false
}) => {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = Array.from(e.dataTransfer.files);
        await handleFiles(files);
    };

    const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            await handleFiles(files);
        }
    };

    const handleFiles = async (files: File[]) => {
        // Validate file count
        if (mode === 'single' && files.length > 1) {
            toast.error('Please select only one image');
            return;
        }

        if (mode === 'multiple' && currentImages.length + files.length > maxFiles) {
            toast.error(`Maximum ${maxFiles} images allowed`);
            return;
        }

        // Validate each file
        for (const file of files) {
            if (!uploadService.validateFile(file, maxSizeMB)) {
                toast.error(`${file.name} is invalid. Please upload images under ${maxSizeMB}MB.`);
                return;
            }
        }

        // Upload files
        setUploading(true);
        try {
            if (mode === 'single') {
                const url = await uploadService.uploadSingle(files[0]);
                onImagesChange([url]);
                toast.success('Image uploaded successfully');
            } else {
                const urls = await uploadService.uploadMultiple(files);
                onImagesChange([...currentImages, ...urls]);
                toast.success(`${urls.length} image(s) uploaded successfully`);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload image');
        } finally {
            setUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemoveImage = async (imageUrl: string) => {
        try {
            const filename = uploadService.getFilenameFromUrl(imageUrl);
            if (filename) {
                await uploadService.deleteImage(filename);
            }
            const updatedImages = currentImages.filter(img => img !== imageUrl);
            onImagesChange(updatedImages);
            toast.success('Image removed');
        } catch (error: any) {
            console.error('Error removing image:', error);
            // Still remove from UI even if delete fails
            const updatedImages = currentImages.filter(img => img !== imageUrl);
            onImagesChange(updatedImages);
        }
    };

    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            {/* Upload Area */}
            {(mode === 'single' && currentImages.length === 0) || mode === 'multiple' ? (
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={handleBrowseClick}
                    className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${dragActive
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        multiple={mode === 'multiple'}
                        onChange={handleFileInput}
                        disabled={uploading}
                        className="hidden"
                    />

                    {uploading ? (
                        <div className="flex flex-col items-center space-y-2">
                            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
                            <p className="text-sm text-gray-600">Uploading...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center space-y-2">
                            <Upload className="w-8 h-8 text-gray-400" />
                            <div className="text-sm text-gray-600">
                                <span className="font-medium text-blue-600">Click to browse</span> or drag and drop
                            </div>
                            <p className="text-xs text-gray-500">
                                JPG, PNG, GIF, WEBP (max {maxSizeMB}MB)
                            </p>
                            {mode === 'multiple' && (
                                <p className="text-xs text-gray-500">
                                    Up to {maxFiles} images
                                </p>
                            )}
                        </div>
                    )}
                </div>
            ) : null}

            {/* Image Previews */}
            {currentImages.length > 0 && (
                <div className={mode === 'single' ? 'space-y-2' : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'}>
                    {currentImages.map((imageUrl, index) => (
                        <div
                            key={index}
                            className="relative group rounded-lg overflow-hidden border border-gray-200 bg-white"
                        >
                            <div className={mode === 'single' ? 'aspect-video' : 'aspect-square'}>
                                <img
                                    src={imageUrl}
                                    alt={`Upload ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        // Fallback for broken images
                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                                    }}
                                />
                            </div>

                            {/* Remove Button */}
                            <button
                                type="button"
                                onClick={() => handleRemoveImage(imageUrl)}
                                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                title="Remove image"
                            >
                                <X size={16} />
                            </button>

                            {/* Image indicator for single mode */}
                            {mode === 'single' && (
                                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                    Main Image
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Image Count for Multiple Mode */}
            {mode === 'multiple' && currentImages.length > 0 && (
                <p className="text-xs text-gray-500">
                    {currentImages.length} of {maxFiles} images uploaded
                </p>
            )}
        </div>
    );
};

export default ImageUpload;
