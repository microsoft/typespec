# File Handling

HTTP APIs frequently need to handle file uploads and downloads. TypeSpec provides specific constructs to model file operations clearly and consistently, making it easy to represent binary data transfers in your API contract.

## The `File` Type in TypeSpec

The TypeSpec HTTP library includes a dedicated `File` type designed for handling files in HTTP operations. This type encapsulates common file properties like content, filename, and content type:

```typespec
import "@typespec/http";
using TypeSpec.Http;

@route("/files")
interface Files {
  @post
  uploadFile(@bodyRoot file: File): {
    id: string;
    size: int64;
  };

  @get
  @route("/{id}")
  downloadFile(@path id: string): File;
}
```

The `File` type represents a file with a binary payload and metadata. When used in request or response bodies, it automatically handles the appropriate HTTP semantics.

## File Type Definition

The `File` type in the HTTP library is defined as a model with these key properties:

```typespec
model File<ContentType, Contents> {
  contentType?: ContentType;
  filename?: string;
  contents: Contents;
}
```

Where:

- `contentType`: The media type of the file content
- `filename`: The name of the file (available in responses)
- `contents`: The actual file content (as `bytes` or `string`)

## File Uploads

File uploads are a common requirement for many APIs. TypeSpec provides multiple ways to model file uploads, depending on your requirements.

### Single File Upload with Binary Body

For simple file uploads where the entire request body is the file content:

```typespec
@route("/documents")
interface Documents {
  @post
  uploadDocument(@header contentType: "application/pdf", @bodyRoot document: bytes): {
    id: string;
    name: string;
    size: int64;
  };
}
```

This approach is straightforward but doesn't include file metadata in the request.

### Single File Upload with `File` Type

For more complete file handling, use the `File` type:

```typespec
@route("/images")
interface Images {
  @post
  uploadImage(@bodyRoot image: File<"image/jpeg" | "image/png", bytes>): {
    id: string;
    url: string;
    width: int32;
    height: int32;
    size: int64;
  };
}
```

This example:

- Uses the `File` type to represent an image file
- Restricts content types to JPEG or PNG formats
- Reads the file contents as binary data
- Returns metadata about the processed image

### Multiple File Upload with Multipart Forms

For uploading multiple files or combining files with other data, use multipart forms:

```typespec
@route("/albums")
interface Albums {
  @post
  createAlbum(
    @header contentType: "multipart/form-data",
    @multipartBody body: {
      title: HttpPart<string>;
      description?: HttpPart<string>;
      photos: HttpPart<File<"image/jpeg" | "image/png", bytes>>[];
      coverPhoto?: HttpPart<File<"image/jpeg" | "image/png", bytes>>;
    },
  ): {
    id: string;
    title: string;
    photoCount: int32;
  };
}
```

This example allows uploading:

- Basic album information (title and description)
- Multiple photos as an array of files
- An optional cover photo

The `HttpPart<T>` wrapper indicates that each element is a part in a multipart request.

## File Downloads

TypeSpec makes it equally straightforward to model file downloads in your API.

### Binary Response with Content Type

For simple file downloads without additional metadata:

```typespec
@route("/reports/{id}")
@get
op downloadReport(@path id: string): {
  @header contentType: "application/pdf";
  @bodyRoot content: bytes;
};
```

This approach works well when the content type is fixed and no additional file metadata is needed.

### Using the `File` Type for Downloads

For more complete file handling with metadata:

```typespec
@route("/files/{id}")
@get
op downloadFile(@path id: string): File;
```

This concise example uses the generic `File` type, which includes content type, filename, and contents.

You can also be more specific about the expected file types:

```typespec
@route("/images/{id}")
@get
op downloadImage(@path id: string, @query format?: "jpg" | "png" = "jpg"): File<
  "image/jpeg" | "image/png",
  bytes
>;
```

This example:

- Allows downloading an image in either JPEG or PNG format
- Lets the client specify the desired format via a query parameter
- Returns the file with the appropriate content type

## Custom File Types

You can create custom file types by extending the base `File` type:

```typespec
model ImageFile extends File<"image/jpeg" | "image/png", bytes> {
  width: int32;
  height: int32;
  takenAt?: utcDateTime;
}

@route("/photos")
interface Photos {
  @post
  uploadPhoto(@bodyRoot photo: ImageFile): {
    id: string;
    url: string;
  };

  @get
  @route("/{id}")
  getPhoto(@path id: string): ImageFile;
}
```

Custom file types allow you to:

- Restrict allowed content types
- Add domain-specific metadata
- Create reusable file type definitions

## Handling File Metadata

Sometimes you need to separate file content from metadata. TypeSpec supports this pattern too:

```typespec
model FileMetadata {
  id: string;
  filename: string;
  contentType: string;
  size: int64;
  uploadedAt: utcDateTime;
  tags?: string[];
}

@route("/files")
interface Files {
  @post
  uploadFile(@bodyRoot file: File): FileMetadata;

  @get
  listFiles(): FileMetadata[];

  @get
  @route("/{id}")
  getFileMetadata(@path id: string): FileMetadata;

  @get
  @route("/{id}/content")
  downloadFile(@path id: string): File;
}
```

This pattern separates:

- Metadata operations (listing files, getting file info)
- Content operations (uploading and downloading the actual file content)

## Specifying Filename in Requests

By default, the `filename` property of the `File` type is intended for responses. To include a filename in requests, you can use additional decorators:

```typespec
model UploadableFile extends File {
  @header("X-Filename") filename: string;
}

@route("/documents")
interface Documents {
  @post
  uploadDocument(@bodyRoot document: UploadableFile): {
    id: string;
    filename: string;
  };
}
```

This example uses a custom header to communicate the filename.

## File Streaming

For large files, you might want to model streaming behavior:

```typespec
@route("/videos")
interface Videos {
  @get
  @route("/{id}/stream")
  streamVideo(
    @path id: string,
    @header accept: "video/mp4",
    @header("Range")? range: string
  ): {
    @header contentType: "video/mp4",
    @header("Content-Length") contentLength: int64,
    @header("Accept-Ranges") acceptRanges: "bytes",
    @bodyRoot content: bytes
  };
}
```

This example includes:

- Range header support for partial content requests
- Content length and accept ranges headers for client streaming

## File Type Validation

TypeSpec allows you to restrict the allowed file types to ensure your API only accepts appropriate files:

```typespec
@route("/documents")
interface Documents {
  @post
  uploadPdf(@bodyRoot document: File<"application/pdf", bytes>): {
    id: string;
  };

  @post
  @route("/spreadsheets")
  uploadSpreadsheet(
    @bodyRoot spreadsheet: File<
      "application/vnd.ms-excel" | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      bytes
    >,
  ): {
    id: string;
  };
}
```

By specifying content types in the `File` type parameters, you create explicit contracts about which file formats your API accepts.

## File Size Limitations

While TypeSpec doesn't directly enforce file size limits, you can document them using the `@doc` decorator:

```typespec
@route("/files")
interface Files {
  @doc("Upload a file. Maximum size: 10MB")
  @post
  uploadFile(@bodyRoot file: File): {
    id: string;
  };
}
```

## Advanced File Handling Patterns

### Resumable Uploads

For large files, you might want to support resumable uploads:

```typespec
@route("/large-files")
interface LargeFiles {
  // Initiate upload session
  @post
  initiateUpload(
    @body metadata: {
      filename: string;
      contentType: string;
      size: int64;
    },
  ): {
    uploadUrl: string;
    uploadId: string;
    expiresAt: utcDateTime;
  };

  // Upload chunk
  @put
  @route("/{uploadId}/chunks")
  uploadChunk(
    @path uploadId: string,
    @header("Content-Range") contentRange: string,
    @bodyRoot chunk: bytes,
  ): {
    bytesReceived: int64;
    totalBytes: int64;
  };

  // Complete upload
  @post
  @route("/{uploadId}/complete")
  completeUpload(@path uploadId: string): {
    fileId: string;
    size: int64;
    url: string;
  };
}
```

This pattern breaks file uploads into multiple steps:

1. Initiate an upload session
2. Upload file chunks with range information
3. Complete the upload process

### Direct Upload URLs

Another pattern is generating pre-signed URLs for direct uploads:

```typespec
@route("/direct-uploads")
interface DirectUploads {
  @post
  getUploadUrl(
    @body request: {
      filename: string;
      contentType: string;
      size: int64;
    }
  ): {
    uploadUrl: string;
    fileId: string;
    expiresAt: utcDateTime;
    headers: {
      @header contentType: string;
      @header("x-amz-acl")? acl: string;
    };
  };

  @get
  @route("/{fileId}/status")
  getUploadStatus(@path fileId: string): {
    status: "pending" | "completed" | "failed";
    url?: string;
  };
}
```

This approach:

- Generates a URL for direct upload to storage (like S3)
- Includes the necessary headers for the upload
- Provides a way to check upload status

## Best Practices for File Handling

When modeling file operations in TypeSpec, consider these best practices:

1. **Use the `File` type for clarity** rather than raw `bytes` when representing files.

2. **Be explicit about accepted file types** using the content type parameter:

   ```typespec
   File<"image/jpeg" | "image/png" | "image/gif", bytes>
   ```

3. **Create domain-specific file types** for consistent reuse:

   ```typespec
   model DocumentFile extends File<"application/pdf" | "application/msword", bytes> {}
   ```

4. **Separate metadata from content** when appropriate:

   ```typespec
   @get fileMetadata(): FileMetadata;
   @get fileContent(): File;
   ```

5. **Document file size limits** in your API specification:

   ```typespec
   @doc("Maximum file size: 100MB")
   ```

6. **Consider chunked upload mechanisms** for large files.

7. **Use multipart requests** when combining file uploads with other form data.

8. **Include appropriate content types and dispositions** in responses.

By following these best practices, you'll create clear, consistent file handling operations in your TypeSpec API definitions.
