import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface UploadResponse {
    success: boolean;
    data?: {
        url: string;
        filename: string;
        originalName: string;
        size: number;
        mimetype: string;
    };
    message?: string;
    error?: string;
}

interface MultipleUploadResponse {
    success: boolean;
    data?: Array<{
        url: string;
        filename: string;
        originalName: string;
        size: number;
        mimetype: string;
    }>;
    message?: string;
    error?: string;
}

class UploadService {
    private getAuthHeaders() {
        const token = localStorage.getItem('campspot_token');
        return {
            'Authorization': `Bearer ${token}`
        };
    }

    /**
     * Get base URL for API (without /api suffix)
     */
    private getBaseUrl(): string {
        // Remove /api from the end if present
        return API_URL.replace(/\/api$/, '');
    }

    /**
     * Convert relative URL to absolute URL
     */
    private convertToAbsoluteUrl(relativeUrl: string): string {
        if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
            return relativeUrl; // Already absolute
        }
        const baseUrl = this.getBaseUrl();
        // Remove leading slash from relative URL if present
        const cleanUrl = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
        return `${baseUrl}${cleanUrl}`;
    }

    /**
     * Upload a single image file
     */
    async uploadSingle(file: File): Promise<string> {
        try {
            // Validate file
            if (!this.validateFile(file)) {
                throw new Error('Invalid file. Please upload an image file under 5MB.');
            }

            const formData = new FormData();
            formData.append('image', file);

            const response = await axios.post<UploadResponse>(
                `${API_URL}/upload/single`,
                formData,
                {
                    headers: {
                        ...this.getAuthHeaders(),
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (response.data.success && response.data.data) {
                // Convert relative URL to absolute URL
                const absoluteUrl = this.convertToAbsoluteUrl(response.data.data.url);
                console.log('📸 Image uploaded:', {
                    relativeUrl: response.data.data.url,
                    absoluteUrl,
                    baseUrl: this.getBaseUrl()
                });
                return absoluteUrl;
            } else {
                throw new Error(response.data.error || 'Upload failed');
            }
        } catch (error: any) {
            console.error('Error uploading file:', error);
            throw new Error(error.response?.data?.error || error.message || 'Failed to upload image');
        }
    }

    /**
     * Upload multiple image files
     */
    async uploadMultiple(files: File[]): Promise<string[]> {
        try {
            // Validate all files
            for (const file of files) {
                if (!this.validateFile(file)) {
                    throw new Error(`Invalid file: ${file.name}. Please upload image files under 5MB.`);
                }
            }

            const formData = new FormData();
            files.forEach(file => {
                formData.append('images', file);
            });

            const response = await axios.post<MultipleUploadResponse>(
                `${API_URL}/upload/multiple`,
                formData,
                {
                    headers: {
                        ...this.getAuthHeaders(),
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (response.data.success && response.data.data) {
                // Convert all relative URLs to absolute URLs
                return response.data.data.map(file => this.convertToAbsoluteUrl(file.url));
            } else {
                throw new Error(response.data.error || 'Upload failed');
            }
        } catch (error: any) {
            console.error('Error uploading files:', error);
            throw new Error(error.response?.data?.error || error.message || 'Failed to upload images');
        }
    }

    /**
     * Delete an uploaded image
     */
    async deleteImage(filename: string): Promise<void> {
        try {
            const response = await axios.delete(
                `${API_URL}/upload/${filename}`,
                {
                    headers: this.getAuthHeaders()
                }
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Delete failed');
            }
        } catch (error: any) {
            console.error('Error deleting file:', error);
            throw new Error(error.response?.data?.error || error.message || 'Failed to delete image');
        }
    }

    /**
     * Validate file type and size
     */
    validateFile(file: File, maxSizeMB: number = 5): boolean {
        // Check file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            return false;
        }

        // Check file size (convert MB to bytes)
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            return false;
        }

        return true;
    }

    /**
     * Get filename from URL
     */
    getFilenameFromUrl(url: string): string {
        return url.split('/').pop() || '';
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
}

export default new UploadService();
