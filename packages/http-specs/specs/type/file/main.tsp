import "@typespec/http";
import "@typespec/spector";

using TypeSpec.Http;
using Spector;

@doc("Test for File type usage in request and response bodies")
@scenarioService("/type/file")
namespace Type.File;

// Define custom File types for testing
model PngImageFile extends TypeSpec.Http.File {
  contentType: "image/png";
}

model ImageFile extends TypeSpec.Http.File {
  contentType: "image/png" | "image/jpeg";
}

/**
 * Test File as request and response body with specific content type
 */
@route("/body")
namespace Body {
  @scenario
  @scenarioDoc("""
    Test File type as request body with specific content type.
    Expected request:
    - Content-Type header: image/png
    - Body: binary content matching packages/http-specs/assets/image.png
    """)
  @post
  @route("/request/specific-content-type")
  op uploadFileSpecificContentType(@bodyRoot file: PngImageFile): NoContentResponse;

  @scenario
  @scenarioDoc("""
    Test File type as response body with specific content type.
    Expected response:
    - Content-Type header: image/png
    - Body: binary content matching packages/http-specs/assets/image.png
    """)
  @get
  @route("/response/specific-content-type")
  op downloadFileSpecificContentType(): PngImageFile;

  @scenario
  @scenarioDoc("""
    Test File type as request body with multiple allowed content types (image/png or image/jpeg).
    Client should send image/png.
    Expected request:
    - Content-Type header: image/png
    - Body: binary content matching packages/http-specs/assets/image.png
    """)
  @post
  @route("/request/multiple-content-types")
  op uploadFileMultipleContentTypes(@bodyRoot file: ImageFile): NoContentResponse;

  @scenario
  @scenarioDoc("""
    Test File type as response body with multiple allowed content types.
    Service will return image/png.
    Expected response:
    - Content-Type header: image/png
    - Body: binary content matching packages/http-specs/assets/image.png
    """)
  @get
  @route("/response/multiple-content-types")
  op downloadFileMultipleContentTypes(): ImageFile;

  @scenario
  @scenarioDoc("""
    Test File type as request body with unspecified content type (defaults to application/octet-stream).
    Expected request:
    - Content-Type header: application/octet-stream (or not specified)
    - Body: binary content matching packages/http-specs/assets/image.png
    """)
  @post
  @route("/request/default-content-type")
  op uploadFileDefaultContentType(@bodyRoot file: TypeSpec.Http.File): NoContentResponse;

  @scenario
  @scenarioDoc("""
    Test File type as response body with unspecified content type (defaults to application/octet-stream).
    Expected response:
    - Content-Type header: application/octet-stream
    - Body: binary content matching packages/http-specs/assets/image.png
    """)
  @get
  @route("/response/default-content-type")
  op downloadFileDefaultContentType(): TypeSpec.Http.File;
}

/**
 * Test File in multipart form data scenarios
 */
@route("/multipart")
namespace MultiPart {
  model FileWithSpecificContentType extends TypeSpec.Http.File {
    filename: string;
    contentType: "image/png";
  }

  model FileWithMultipleContentTypes extends TypeSpec.Http.File {
    filename: string;
    contentType: "image/png" | "image/jpeg";
  }

  model FileWithRequiredMetadata extends TypeSpec.Http.File {
    filename: string;
    contentType: string;
  }

  @scenario
  @scenarioDoc("""
    Test File type in multipart form data with specific content type.
    Expected request:
    ```
    POST /multipart/specific-content-type HTTP/1.1
    Content-Type: multipart/form-data; boundary=abcde12345
    
    --abcde12345
    Content-Disposition: form-data; name="file"; filename="image.png"
    Content-Type: image/png
    
    {…file content of image.png…}
    --abcde12345--
    ```
    """)
  @post
  @route("/specific-content-type")
  op uploadFileSpecificContentType(
    @header contentType: "multipart/form-data",
    @multipartBody body: {
      file: HttpPart<FileWithSpecificContentType>;
    },
  ): NoContentResponse;

  @scenario
  @scenarioDoc("""
    Test File type in multipart form data with multiple allowed content types.
    Client should send image/png.
    Expected request:
    ```
    POST /multipart/multiple-content-types HTTP/1.1
    Content-Type: multipart/form-data; boundary=abcde12345
    
    --abcde12345
    Content-Disposition: form-data; name="file"; filename="image.png"
    Content-Type: image/png
    
    {…file content of image.png…}
    --abcde12345--
    ```
    """)
  @post
  @route("/multiple-content-types")
  op uploadFileMultipleContentTypes(
    @header contentType: "multipart/form-data",
    @multipartBody body: {
      file: HttpPart<FileWithMultipleContentTypes>;
    },
  ): NoContentResponse;

  @scenario
  @scenarioDoc("""
    Test File type in multipart form data with required content type metadata.
    Expected request:
    ```
    POST /multipart/required-content-type HTTP/1.1
    Content-Type: multipart/form-data; boundary=abcde12345
    
    --abcde12345
    Content-Disposition: form-data; name="file"; filename="image.png"
    Content-Type: application/octet-stream
    
    {…file content of image.png…}
    --abcde12345--
    ```
    """)
  @post
  @route("/required-content-type")
  op uploadFileRequiredContentType(
    @header contentType: "multipart/form-data",
    @multipartBody body: {
      file: HttpPart<FileWithRequiredMetadata>;
    },
  ): NoContentResponse;

  @scenario
  @scenarioDoc("""
    Test multiple File instances in multipart form data.
    Expected request:
    ```
    POST /multipart/file-array HTTP/1.1
    Content-Type: multipart/form-data; boundary=abcde12345
    
    --abcde12345
    Content-Disposition: form-data; name="files"; filename="image1.png"
    Content-Type: image/png
    
    {…file content of image.png…}
    --abcde12345
    Content-Disposition: form-data; name="files"; filename="image2.png"
    Content-Type: image/png
    
    {…file content of image.png…}
    --abcde12345--
    ```
    """)
  @post
  @route("/file-array")
  op uploadFileArray(
    @header contentType: "multipart/form-data",
    @multipartBody body: {
      files: HttpPart<FileWithSpecificContentType>[];
    },
  ): NoContentResponse;
}
