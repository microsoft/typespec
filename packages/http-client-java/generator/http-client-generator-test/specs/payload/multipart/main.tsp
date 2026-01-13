import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Test for multipart")
@scenarioService("/multipart")
namespace Payload.MultiPart;

model MultiPartRequest {
  id: HttpPart<string>;
  profileImage: HttpPart<bytes>;
}

model Address {
  city: string;
}

model FileSpecificContentType extends File {
  filename: string;
  contentType: "image/jpg";
}

model FileWithHttpPartSpecificContentTypeRequest {
  profileImage: HttpPart<FileSpecificContentType>;
}

model FileRequiredMetaData extends File {
  filename: string;
  contentType: string;
}

model FileWithHttpPartRequiredContentTypeRequest {
  profileImage: HttpPart<FileRequiredMetaData>;
}

model FileOptionalContentType extends File {
  filename: string;
}

model FileWithHttpPartOptionalContentTypeRequest {
  profileImage: HttpPart<FileOptionalContentType>;
}

model ComplexHttpPartsModelRequest {
  id: HttpPart<string>;
  address: HttpPart<Address>;
  profileImage: HttpPart<FileRequiredMetaData>;
  previousAddresses: HttpPart<Address[]>;
  pictures: HttpPart<FileRequiredMetaData>[];
}

model ComplexPartsRequest {
  id: HttpPart<string>;
  address: HttpPart<Address>;
  profileImage: HttpPart<bytes>;
  pictures: HttpPart<bytes>[];
}

model JsonPartRequest {
  address: HttpPart<Address>;
  profileImage: HttpPart<bytes>;
}

model BinaryArrayPartsRequest {
  id: HttpPart<string>;
  pictures: HttpPart<bytes>[];
}

model MultiBinaryPartsRequest {
  profileImage: HttpPart<bytes>;
  picture?: HttpPart<bytes>;
}

@route("/form-data")
namespace FormData {
  @scenario
  @scenarioDoc("""
    Expect request (
    - according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.4, content-type of file part shall be labeled with
      appropriate media type, server will check it; content-type of other parts is optional, server will ignore it.
    - according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.2, filename of file part SHOULD be supplied.
      If there are duplicated filename in same fieldName, server can't parse them all.
    ):
    ```
    POST /upload HTTP/1.1
    Content-Length: 428
    Content-Type: multipart/form-data; boundary=abcde12345
    
    --abcde12345
    Content-Disposition: form-data; name="id"
    Content-Type: text/plain
    
    123
    --abcde12345
    Content-Disposition: form-data; name="profileImage"; filename="<any-or-no-name-is-ok>"
    Content-Type: application/octet-stream;
    
    {…file content of .jpg file…}
    --abcde12345--
    ```
    """)
  @doc("Test content-type: multipart/form-data")
  @post
  @route("/mixed-parts")
  op basic(
    @header contentType: "multipart/form-data",
    @multipartBody body: MultiPartRequest,
  ): NoContentResponse;

  @scenario
  @scenarioDoc("""
    Expect request (
      - according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.4, content-type of file part shall be labeled with
        appropriate media type, server will check it; content-type of other parts is optional, server will ignore it.
      - according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.2, filename of file part SHOULD be supplied.
        If there are duplicated filename in same fieldName, server can't parse them all.
      ):
    ```
    POST /upload HTTP/1.1
    Content-Length: 428
    Content-Type: multipart/form-data; boundary=abcde12345
    
    --abcde12345
    Content-Disposition: form-data; name="id"
    Content-Type: text/plain
    
    123
    --abcde12345
    Content-Disposition: form-data; name="address"
    Content-Type: application/json
    
    {
      "city": "X"
    }
    --abcde12345
    Content-Disposition: form-data; name="profileImage"; filename="<any-or-no-name-is-ok>"
    Content-Type: application/octet-stream
    
    {…file content of .jpg file…}
    --abcde12345--
    Content-Disposition: form-data; name="previousAddresses"
    Content-Type: application/json
    
    [{
      "city": "Y"
    },{
      "city": "Z"
    }]
    --abcde12345
    Content-Disposition: form-data; name="pictures"; filename="<any-or-no-name-is-ok>"
    Content-Type: application/octet-stream
    
    {…file content of .png file…}
    --abcde12345
    Content-Disposition: form-data; name="pictures"; filename="<any-or-no-name-is-ok>"
    Content-Type: application/octet-stream
    
    {…file content of .png file…}
    --abcde12345--
    ```
    """)
  @doc("Test content-type: multipart/form-data for mixed scenarios")
  @post
  @route("/complex-parts")
  op fileArrayAndBasic(
    @header contentType: "multipart/form-data",
    @multipartBody body: ComplexPartsRequest,
  ): NoContentResponse;

  @scenario
  @scenarioDoc("""
    Expect request (
      - according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.4, content-type of file part shall be labeled with
        appropriate media type, server will check it; content-type of other parts is optional, server will ignore it.
      - according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.2, filename of file part SHOULD be supplied.
        If there are duplicated filename in same fieldName, server can't parse them all.
      ):
    ```
    POST /upload HTTP/1.1
    Content-Length: 428
    Content-Type: multipart/form-data; boundary=abcde12345
    
    --abcde12345
    Content-Disposition: form-data; name="address"
    Content-Type: application/json
    
    {
      "city": "X"
    }
    --abcde12345
    Content-Disposition: form-data; name="profileImage"; filename="<any-or-no-name-is-ok>"
    Content-Type: application/octet-stream
    
    {…file content of .jpg file…}
    --abcde12345--
    ```
    """)
  @doc("Test content-type: multipart/form-data for scenario contains json part and binary part ")
  @post
  @route("/json-part")
  op jsonPart(
    @header contentType: "multipart/form-data",
    @multipartBody body: JsonPartRequest,
  ): NoContentResponse;

  @scenario
  @scenarioDoc("""
    Expect request (
      - according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.4, content-type of file part shall be labeled with
        appropriate media type, server will check it; content-type of other parts is optional, server will ignore it.
      - according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.2, filename of file part SHOULD be supplied.
        If there are duplicated filename in same fieldName, server can't parse them all.
      ):
    ```
    POST /upload HTTP/1.1
    Content-Length: 428
    Content-Type: multipart/form-data; boundary=abcde12345
    
    --abcde12345
    Content-Disposition: form-data; name="id"
    Content-Type: text/plain
    
    123
    --abcde12345
    Content-Disposition: form-data; name="pictures"; filename="<any-or-no-name-is-ok>"
    Content-Type: application/octet-stream
    
    {…file content of .png file…}
    --abcde12345
    Content-Disposition: form-data; name="pictures"; filename="<any-or-no-name-is-ok>"
    Content-Type: application/octet-stream
    
    {…file content of .png file…}
    --abcde12345--
    ```
    """)
  @doc("Test content-type: multipart/form-data for scenario contains multi binary parts")
  @post
  @route("/binary-array-parts")
  op binaryArrayParts(
    @header contentType: "multipart/form-data",
    @multipartBody body: BinaryArrayPartsRequest,
  ): NoContentResponse;

  @scenario
  @scenarioDoc("""
    Please send request twice, first time with only profileImage, second time with both profileImage and picture(
      - according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.4, content-type of file part shall be labeled with
        appropriate media type, server will check it; content-type of other parts is optional, server will ignore it.
      - according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.2, filename of file part SHOULD be supplied.
        If there are duplicated filename in same fieldName, server can't parse them all.
      ):
    ```
    POST /upload HTTP/1.1
    Content-Length: 428
    Content-Type: multipart/form-data; boundary=abcde12345
    
    --abcde12345
    Content-Disposition: form-data; name="profileImage"; filename="<any-or-no-name-is-ok>"
    Content-Type: application/octet-stream
    
    {…file content of .jpg file…}
    --abcde12345
    Content-Disposition: form-data; name="picture"; filename="<any-or-no-name-is-ok>"
    Content-Type: application/octet-stream
    
    {…file content of .png file…}
    --abcde12345--
    ```
    """)
  @doc("Test content-type: multipart/form-data for scenario contains multi binary parts")
  @post
  @route("/multi-binary-parts")
  op multiBinaryParts(
    @header contentType: "multipart/form-data",
    @multipartBody body: MultiBinaryPartsRequest,
  ): NoContentResponse;

  @scenario
  @scenarioDoc("""
    this case will check filename and content-type of file part, so expect request:
    ```
    POST /upload HTTP/1.1
    Content-Length: 428
    Content-Type: multipart/form-data; boundary=abcde12345
    
    --abcde12345
    Content-Disposition: form-data; name="id"
    Content-Type: text/plain
    
    123
    --abcde12345
    Content-Disposition: form-data; name="profileImage"; filename="hello.jpg"
    Content-Type: image/jpg
    
    {…file content of .jpg file…}
    --abcde12345--
    ```
    """)
  @doc("Test content-type: multipart/form-data")
  @post
  @route("/check-filename-and-content-type")
  op checkFileNameAndContentType(
    @header contentType: "multipart/form-data",
    @multipartBody body: MultiPartRequest,
  ): NoContentResponse;

  @scenario
  @scenarioDoc("""
    Expect request (
    - according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.4, content-type of file part shall be labeled with 
      appropriate media type, server will check it; content-type of other parts is optional, server will ignore it.
    - according to https://datatracker.ietf.org/doc/html/rfc7578#section-4.2, filename of file part SHOULD be supplied.
      If there are duplicated filename in same filedName, server can't parse them all.
    ):
    ```
    POST /multipart/form-data/anonymous-model HTTP/1.1
    Content-Length: 428
    Content-Type: multipart/form-data; boundary=abcde12345
    
    --abcde12345
    Content-Disposition: form-data; name="profileImage"; filename="<any-name-is-ok>"
    Content-Type: application/octet-stream;
    
    {…file content of .jpg file…}
    --abcde12345--
    ```
    """)
  @doc("Test content-type: multipart/form-data")
  @post
  @route("/anonymous-model")
  op anonymousModel(
    @header contentType: "multipart/form-data",
    @multipartBody body: {
      profileImage: HttpPart<bytes>;
    },
  ): NoContentResponse;

  namespace HttpParts {
    namespace ContentType {
      @scenario
      @scenarioDoc("""
        This case will check filename and specific content-type of file part, so expect request:
        ```
        POST /upload HTTP/1.1
        Content-Length: 428
        Content-Type: multipart/form-data; boundary=abcde12345
        
        --abcde12345
        Content-Disposition: form-data; name="profileImage"; filename="hello.jpg"
        Content-Type: image/jpg
        
        {…file content of .jpg file…}
        --abcde12345--
        ```
        """)
      @doc("Test content-type: multipart/form-data")
      @post
      @route("/check-filename-and-specific-content-type-with-httppart")
      op imageJpegContentType(
        @header contentType: "multipart/form-data",
        @multipartBody body: FileWithHttpPartSpecificContentTypeRequest,
      ): NoContentResponse;

      @scenario
      @scenarioDoc("""
        This case will check required content-type of file part, so expect request:
        ```
        POST /upload HTTP/1.1
        Content-Length: 428
        Content-Type: multipart/form-data; boundary=abcde12345
        
        --abcde12345
        Content-Disposition: form-data; name="profileImage"; filename="<any-name-is-ok>"
        Content-Type: application/octet-stream
        
        {…file content of .jpg file…}
        --abcde12345--
        ```
        """)
      @doc("Test content-type: multipart/form-data")
      @post
      @route("/check-filename-and-required-content-type-with-httppart")
      op requiredContentType(
        @header contentType: "multipart/form-data",
        @multipartBody body: FileWithHttpPartRequiredContentTypeRequest,
      ): NoContentResponse;

      @scenario
      @scenarioDoc("""
        Please send request twice, first time with no content-type and second time with content-type "application/octet-stream". Expect request:
        ```
        POST /upload HTTP/1.1
        Content-Length: 428
        Content-Type: multipart/form-data; boundary=abcde12345
        
        --abcde12345
        Content-Disposition: form-data; name="profileImage"; filename="<any-name-is-ok>"
        Content-Type: application/octet-stream
        
        {…file content of .jpg file…}
        --abcde12345
        ```
        """)
      @doc("Test content-type: multipart/form-data for optional content type")
      @post
      @route("/file-with-http-part-optional-content-type")
      op optionalContentType(
        @header contentType: "multipart/form-data",
        @multipartBody body: FileWithHttpPartOptionalContentTypeRequest,
      ): NoContentResponse;
    }
    @scenario
    @scenarioDoc("""
      For File part, filename will not be checked but it is necessary otherwise server can't parse it;
      content-type will be checked with value "application/octet-stream". Expect request:
      ```
      POST /upload HTTP/1.1
      Content-Length: 428
      Content-Type: multipart/form-data; boundary=abcde12345
      
      --abcde12345
      Content-Disposition: form-data; name="id"
      Content-Type: text/plain
      
      123
      --abcde12345
      Content-Disposition: form-data; name="address"
      Content-Type: application/json
      
      {
        "city": "X"
      }
      --abcde12345
      Content-Disposition: form-data; name="profileImage"; filename="<any-name-is-ok>"
      Content-Type: application/octet-stream
      
      {…file content of .jpg file…}
      --abcde12345--
      Content-Disposition: form-data; name="previousAddresses"
      Content-Type: application/json
      
      [{
        "city": "Y"
      },{
        "city": "Z"
      }]
      --abcde12345
      Content-Disposition: form-data; name="pictures"; filename="<any-name-is-ok>"
      Content-Type: application/octet-stream
      
      {…file content of .png file…}
      --abcde12345
      Content-Disposition: form-data; name="pictures"; filename="<any-name-is-ok>"
      Content-Type: application/octet-stream
      
      {…file content of .png file…}
      --abcde12345--
      ```
      """)
    @doc("Test content-type: multipart/form-data for mixed scenarios")
    @post
    @route("/complex-parts-with-httppart")
    op jsonArrayAndFileArray(
      @header contentType: "multipart/form-data",
      @multipartBody body: ComplexHttpPartsModelRequest,
    ): NoContentResponse;

    namespace NonString {
      @scenario
      @scenarioDoc("""
        Expect request:
        ```
        POST /upload HTTP/1.1
        Content-Length: 428
        Content-Type: multipart/form-data; boundary=abcde12345
        
        --abcde12345
        Content-Disposition: form-data; name="temperature"
        Content-Type: text/plain
        
        0.5
        --abcde12345
        ```
        """)
      @doc("Test content-type: multipart/form-data for non string")
      @post
      @route("/non-string-float")
      op float(
        @header contentType: "multipart/form-data",
        @multipartBody body: {
          temperature: HttpPart<{
            @body body: float64;
            @header contentType: "text/plain";
          }>;
        },
      ): NoContentResponse;
    }
  }
}
