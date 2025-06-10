import api from './api';
import { withErrorHandling } from '@/lib/errorHandler';
import { toast } from 'sonner';

/**
 * Service for handling file uploads with robust error handling
 */
const fileUploadService = {
  /**
   * Upload a single file with optional metadata
   * 
   * @param {File} file - The file to upload
   * @param {Object} metadata - Optional metadata for the file
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} - The uploaded file information
   */
  uploadFile: async (file, metadata = {}, options = {}) => {
      const formData = new FormData();
      formData.append('file', file);
      
      // Add any metadata as additional fields
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });
      
      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (options.showToast !== false) {
        toast.success('File uploaded successfully');
      }
      return response.data;
  },
  
  /**
   * Upload multiple files with optional shared metadata
   * 
   * @param {Array<File>} files - Array of files to upload
   * @param {Object} metadata - Optional metadata for all files
   * @param {Object} options - Upload options
   * @returns {Promise<Array<Object>>} - Array of uploaded file information
   */
  uploadMultipleFiles: async (files, metadata = {}, options = {}) => {
      const formData = new FormData();
      
      // Add each file to form data
      files.forEach((file, index) => {
        formData.append(`files`, file);
      });
      
      // Add any metadata as additional fields
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });
      
      const response = await api.post('/files/upload-multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (options.showToast !== false) {
        toast.success(`${files.length} files uploaded successfully`);
      }
      
      return response.data;
  },
  
  /**
   * Delete a file by ID or URL
   * 
   * @param {string} fileIdOrUrl - The file ID or URL to delete
   * @param {Object} options - Delete options
   * @returns {Promise<Object>} - The deletion result
   */
  deleteFile: async (fileIdOrUrl, options = {}) => {
      // Determine if we're dealing with a full URL or just an ID
      const isUrl = fileIdOrUrl.startsWith('http');
      const endpoint = isUrl 
        ? '/files/delete-by-url'
        : '/files/delete';
      
      const response = await api.post(endpoint, { 
        [isUrl ? 'url' : 'id']: fileIdOrUrl 
      });
      
      if (options.showToast !== false) {
        toast.success('File deleted successfully');
      }
      return response.data;
  },
  
  /**
   * Validate a file based on type and size
   * 
   * @param {File} file - The file to validate
   * @param {Object} options - Validation options
   * @returns {boolean} - Whether the file is valid
   */
  validateFile: (file, options = {}) => {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = null,
      showToast = true
    } = options;
    
    // Validate file size
    if (file.size > maxSize) {
      if (showToast) {
        toast.error(`File too large (max ${Math.round(maxSize / (1024 * 1024))}MB)`);
      }
      return false;
    }
    
    // Validate file type if allowedTypes is provided
    if (allowedTypes) {
      // Convert to array if it's a string
      const types = typeof allowedTypes === 'string' 
        ? [allowedTypes] 
        : allowedTypes;
        
      // Check if file type is allowed
      const isValidType = types.some(type => {
        // Handle wildcards like 'image/*'
        if (type.endsWith('/*')) {
          const category = type.split('/')[0];
          return file.type.startsWith(`${category}/`);
        }
        
        return file.type === type;
      });
      
      if (!isValidType) {
        if (showToast) {
          toast.error(`Invalid file type. Allowed: ${types.join(', ')}`);
        }
        return false;
      }
    }
    
    return true;
  }
};

export default fileUploadService; 