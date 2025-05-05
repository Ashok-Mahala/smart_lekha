# FileUpload Service Documentation

The FileUpload service provides a robust and error-handled way to manage file uploads in the Seatflow SB2 Admin application.

## Installation

The service is already integrated into the application and does not require additional installation.

## Service Methods

### uploadFile

Upload a single file with optional metadata.

```js
const result = await fileUploadService.uploadFile(file, metadata, options);
```

#### Parameters

- `file` (File): The file to upload
- `metadata` (Object, optional): Additional metadata for the file
  - `entityId` (String, optional): ID of the related entity
  - `entityType` (String, optional): Type of the related entity
  - `purpose` (String, optional): Purpose of the file
  - `description` (String, optional): Description of the file
- `options` (Object, optional):
  - `showToast` (Boolean): Whether to show success toast (default: true)
  - `onError` (Function): Custom error handling function
  - `onSuccess` (Function): Success callback function

#### Returns

Promise that resolves to the uploaded file information:

```js
{
  id: "file-id",
  originalName: "image.jpg",
  filename: "1623847562-image.jpg",
  path: "/uploads/1623847562-image.jpg",
  url: "https://example.com/uploads/1623847562-image.jpg",
  mimetype: "image/jpeg",
  size: 123456,
  entityId: "entity-id",
  entityType: "student",
  purpose: "profile",
  description: "Profile photo",
  createdAt: "2021-06-16T12:34:56.789Z",
  updatedAt: "2021-06-16T12:34:56.789Z"
}
```

### uploadMultipleFiles

Upload multiple files with optional shared metadata.

```js
const results = await fileUploadService.uploadMultipleFiles(files, metadata, options);
```

#### Parameters

- `files` (Array\<File\>): Array of files to upload
- `metadata` (Object, optional): Same as `uploadFile` metadata
- `options` (Object, optional): Same as `uploadFile` options

#### Returns

Promise that resolves to an array of uploaded file information objects.

### deleteFile

Delete a file by ID or URL.

```js
const result = await fileUploadService.deleteFile(fileIdOrUrl, options);
```

#### Parameters

- `fileIdOrUrl` (String): The file ID or URL to delete
- `options` (Object, optional): Same as `uploadFile` options

#### Returns

Promise that resolves to the deletion result:

```js
{
  success: true,
  message: "File deleted successfully"
}
```

### validateFile

Validate a file based on type and size.

```js
const isValid = fileUploadService.validateFile(file, options);
```

#### Parameters

- `file` (File): The file to validate
- `options` (Object, optional):
  - `maxSize` (Number): Maximum file size in bytes (default: 5MB)
  - `allowedTypes` (String|Array): Allowed MIME types
  - `showToast` (Boolean): Whether to show error toast (default: true)

#### Returns

Boolean indicating whether the file is valid.

## Usage Examples

### Upload a Profile Image

```js
import fileUploadService from '@/services/fileUpload';

const handleProfileImageUpload = async (event) => {
  const file = event.target.files[0];
  
  if (!fileUploadService.validateFile(file, {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png']
  })) {
    return;
  }
  
  try {
    const result = await fileUploadService.uploadFile(file, {
      entityId: studentId,
      entityType: 'student',
      purpose: 'profile'
    });
    
    // Use the returned URL
    setProfileImageUrl(result.url);
  } catch (error) {
    console.error('Failed to upload profile image', error);
  }
};
```

### Upload Multiple Documents

```js
import fileUploadService from '@/services/fileUpload';

const handleDocumentsUpload = async (event) => {
  const files = Array.from(event.target.files);
  
  // Validate each file
  const allValid = files.every(file => 
    fileUploadService.validateFile(file, {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['application/pdf', 'image/*']
    })
  );
  
  if (!allValid) {
    return;
  }
  
  try {
    const results = await fileUploadService.uploadMultipleFiles(files, {
      entityId: studentId,
      entityType: 'student',
      purpose: 'documents'
    });
    
    setUploadedDocuments(prev => [...prev, ...results]);
  } catch (error) {
    console.error('Failed to upload documents', error);
  }
};
```

### Delete a File

```js
import fileUploadService from '@/services/fileUpload';

const handleDeleteFile = async (fileId) => {
  try {
    await fileUploadService.deleteFile(fileId);
    
    // Update UI state after successful deletion
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  } catch (error) {
    console.error('Failed to delete file', error);
  }
};
```

## Error Handling

The service includes robust error handling through the `withErrorHandling` utility. By default, it will:

1. Show error toasts for failed operations
2. Console log the error details
3. Reject the promise with the error

You can customize error handling by providing an `onError` callback in the options:

```js
fileUploadService.uploadFile(file, metadata, {
  onError: (error) => {
    // Custom error handling
    if (error.code === 'FILE_TOO_LARGE') {
      // Handle specific error
    }
    return false; // Prevent default error handling
  }
});
``` 