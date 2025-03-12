# Multipart-form Payload Generation Support

## Table of Contents

1. [Motivation](#motivation)
2. [System ClientModel Updates](#system-clientmodel-updates)
3. [MultiPartFormDataBinaryContent Internal Helper](#multiPartFormDataBinaryContent-internal-helper-type)
4. [Usage Examples](#usage-examples)

## Motivation

TypeSpec support for explicit HTTP parts within a multipart-form request was added as part of [this issue](https://github.com/microsoft/TypeSpec/issues/3046). Currently, MTG does not generate a convenience layer for multipart/form-data requests and users have to rely on custom code or building the requests themselves to use the generated client protocol methods.

For example, in it's current state, in order to send a request for this sample operation a client user would need to construct the request themselves, relying on custom or BCL type boundary logic:

```tsp
model Dog {
  id: string;
  profileImage: bytes;
}

@post
@route("/dogs")
op uploadDog(
  @header contentType: "multipart/form-data",
  @body body: Dog,
): NoContentResponse;
```

```csharp
PetStoreClient client = new PetStoreClient();
// use the internal BCL type to create a MultipartFormDataContent
using MultipartFormDataContent multipartContent = new()
{
    // add the id part, including the name of the part and it's value
    { new StringContent("123"), "id" }
};

// add the file part, including the name of the part and the file name
await using FileStream imageStream = File.OpenRead("C:\\myDog.jpg");
StreamContent streamContent = new StreamContent(imageStream);
streamContent.Headers.ContentType = MediaTypeHeaderValue.Parse("application/octet-stream");
multipartContent.Add(streamContent, "dog", "myDog.jpg");

// convert the BCL type to BinaryContent
using Stream multipartContentStream = await multipartContent.ReadAsStreamAsync();
BinaryContent content = BinaryContent.Create(multipartContentStream);
string requestContentType = multipartContent.Headers.ContentType!.ToString();

ClientResult response = await client.UploadDogAsync(content, requestContentType);
```

This document provides a proposal for a generated convenience layer to remove some of this burden from users.

## Goals

- Provide discoverable convenience methods that simplify creating and sending multipart/form-data requests.
- Allow developers to serialize multipart/form-data requests using ModelReaderWriter.

## System ClientModel Updates

### File Part Types

To support generating a convenience layer for file parts described in a TypeSpec request, new convenience model types can be added to the System.ClientModel library, to be consumed by generated clients. These new types can serve as the common types for file parts within a request model.

```csharp
public partial class MultiPartFileWithOptionalMetadata
{
    public MultiPartFileWithOptionalMetadata(System.BinaryData contents) { }
    public MultiPartFileWithOptionalMetadata(System.IO.Stream contents) { }
    public System.BinaryData? Contents { get { throw null; } }
    public string ContentType { get { throw null; } set { } }
    public System.IO.Stream? File { get { throw null; } }
    public string? Filename { get { throw null; } set { } }
}

public partial class MultiPartFileWithRequiredContentType
{
    public MultiPartFileWithRequiredContentType(System.BinaryData contents, string contentType) { }
    public MultiPartFileWithRequiredContentType(System.IO.Stream contents, string contentType) { }
    public System.BinaryData? Contents { get { throw null; } }
    public string ContentType { get { throw null; } }
    public System.IO.Stream? File { get { throw null; } }
    public string? Filename { get { throw null; } set { } }
}

public partial class MultiPartFileWithRequiredFilename
{
    public MultiPartFileWithRequiredFilename(System.BinaryData contents, string filename) { }
    public MultiPartFileWithRequiredFilename(System.IO.Stream contents, string filename) { }
    public System.BinaryData? Contents { get { throw null; } }
    public string ContentType { get { throw null; } set { } }
    public System.IO.Stream? File { get { throw null; } }
    public string Filename { get { throw null; } }
}

public partial class MultiPartFileWithRequiredMetadata
{
    public MultiPartFileWithRequiredMetadata(System.BinaryData contents, string filename, string contentType) { }
    public MultiPartFileWithRequiredMetadata(System.IO.Stream contents, string filename, string contentType) { }
    public System.BinaryData? Contents { get { throw null; } }
    public string ContentType { get { throw null; } }
    public System.IO.Stream? File { get { throw null; } }
    public string Filename { get { throw null; } }
}
```

### Support Serializing a Model into a Stream using MRW

To support optimizing the serialization of large file parts within a request, the ModelReaderWriter serialization can be updated to support serializing a model into a stream. To support this, a new interface can be introduced for writing the model to the user supplied stream.

```csharp
public partial interface IStreamModel<out T> : System.ClientModel.Primitives.IPersistableModel<T>
{
    void Write(System.IO.Stream stream, System.ClientModel.Primitives.ModelReaderWriterOptions options);
}

public static partial class ModelReaderWriter
{
    public static void Write(object model, System.IO.Stream stream, System.ClientModel.Primitives.ModelReaderWriterOptions? options = null) { }
    public static void Write<T>(T model, System.IO.Stream stream, System.ClientModel.Primitives.ModelReaderWriterOptions? options = null) where T : System.ClientModel.Primitives.IStreamModel<T> { }
}
```

## MultiPartFormDataBinaryContent Internal Helper Type

<details>
<summary>MultiPartFormDataBinaryContent.cs</summary>

```c#
internal partial class MultiPartFormDataBinaryContent : BinaryContent
{
    private readonly MultipartFormDataContent _multipartContent;

    private const int BoundaryLength = 70;
    private const string BoundaryValues = "0123456789=ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";

    public MultiPartFormDataBinaryContent() : this(CreateBoundary()) { }

    // CUSTOM: Internal ctor to use in serialization
    internal MultiPartFormDataBinaryContent(string boundary)
    {
        _multipartContent = new MultipartFormDataContent(boundary);
    }

    internal string ContentType
    {
        get
        {
            Debug.Assert(_multipartContent.Headers.ContentType is not null);

            return _multipartContent.Headers.ContentType!.ToString();
        }
    }

    internal HttpContent HttpContent => _multipartContent;

    // CUSTOM: Add filepart to the multipart content.
    public void Add(string name, MultiPartFileWithOptionalMetadata file)
    {
        Argument.AssertNotNull(file, nameof(file));

        AddFilePart(name, file.File, file.Contents, file.Filename, file.ContentType);
    }

    // CUSTOM: Add filepart to the multipart content.
    public void Add(string name, MultiPartFileWithRequiredContentType file)
    {
        Argument.AssertNotNull(file, nameof(file));

        AddFilePart(name, file.File, file.Contents, file.Filename, file.ContentType);
    }

    // CUSTOM: Add filepart to the multipart content.
    public void Add(string name, MultiPartFileWithRequiredFilename file)
    {
        Argument.AssertNotNull(file, nameof(file));

        AddFilePart(name, file.File, file.Contents, file.Filename, file.ContentType);
    }

    // CUSTOM: Add filepart to the multipart content.
    public void Add(string name, MultiPartFileWithRequiredMetadata file)
    {
        Argument.AssertNotNull(file, nameof(file));

        AddFilePart(name, file.File, file.Contents, file.Filename, file.ContentType);
    }

    // CUSTOM: Add IPersistableModel part to the multipart content.
    public void Add<T>(string name, IPersistableModel<T> content, string contentType = default)
    {
        Argument.AssertNotNull(content, nameof(content));
        Argument.AssertNotNullOrEmpty(name, nameof(name));

        Add(name, ModelReaderWriter.Write(content, ModelSerializationExtensions.WireOptions), contentType: contentType);
    }

    // CUSTOM: Add optional content type parameter to the Add method.
    public void Add(string name, string content, string contentType = default)
    {
        Argument.AssertNotNull(content, nameof(content));
        Argument.AssertNotNullOrEmpty(name, nameof(name));

        StringContent stringContent = new(content);
        if (contentType is not null)
        {
            stringContent.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
        }

        Add(stringContent, name);
    }

    // CUSTOM: Add optional content type parameter to the Add method.
    public void Add(string name, int content, string contentType = default)
    {
        Argument.AssertNotNull(content, nameof(content));
        Argument.AssertNotNullOrEmpty(name, nameof(name));

        string value = content.ToString("G", CultureInfo.InvariantCulture);
        StringContent stringContent = new(value);
        if (contentType is not null)
        {
            stringContent.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
        }
        Add(stringContent, name);
    }

    // CUSTOM: Add optional content type parameter to the Add method.
    public void Add(string name, long content, string contentType = default)
    {
        Argument.AssertNotNull(content, nameof(content));
        Argument.AssertNotNullOrEmpty(name, nameof(name));

        string value = content.ToString("G", CultureInfo.InvariantCulture);
        StringContent stringContent = new(value);
        if (contentType is not null)
        {
            stringContent.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
        }
        Add(stringContent, name);
    }

    // CUSTOM: Add optional content type parameter to the Add method.
    public void Add(string name, float content, string contentType = default)
    {
        Argument.AssertNotNull(content, nameof(content));
        Argument.AssertNotNullOrEmpty(name, nameof(name));

        string value = content.ToString("G", CultureInfo.InvariantCulture);
        StringContent stringContent = new(value);
        if (contentType is not null)
        {
            stringContent.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
        }
        Add(stringContent, name);
    }

    // CUSTOM: Add optional content type parameter to the Add method.
    public void Add(string name, double content, string contentType = default)
    {
        Argument.AssertNotNull(content, nameof(content));
        Argument.AssertNotNullOrEmpty(name, nameof(name));

        string value = content.ToString("G", CultureInfo.InvariantCulture);
        StringContent stringContent = new(value);
        if (contentType is not null)
        {
            stringContent.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
        }
        Add(stringContent, name);
    }

    // CUSTOM: Add optional content type parameter to the Add method.
    public void Add(string name, decimal content, string contentType = default)
    {
        Argument.AssertNotNull(content, nameof(content));
        Argument.AssertNotNullOrEmpty(name, nameof(name));

        string value = content.ToString("G", CultureInfo.InvariantCulture);
        StringContent stringContent = new(value);
        if (contentType is not null)
        {
            stringContent.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
        }
        Add(stringContent, name);
    }

    // CUSTOM: Add optional content type parameter to the Add method.
    public void Add(string name, bool content, string contentType = default)
    {
        Argument.AssertNotNull(content, nameof(content));
        Argument.AssertNotNullOrEmpty(name, nameof(name));

        string value = content ? "true" : "false";
        StringContent stringContent = new(value);
        if (contentType is not null)
        {
            stringContent.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
        }
        Add(stringContent, name);
    }

    // CUSTOM: Add optional content type parameter to the Add method.
    public void Add(string name, byte[] content, string contentType = default)
    {
        Argument.AssertNotNull(content, nameof(content));
        Argument.AssertNotNullOrEmpty(name, nameof(name));
        var byteArrayContent = new ByteArrayContent(content);
        if (contentType is not null)
        {
            byteArrayContent.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
        }

        Add(byteArrayContent, name);
    }

    // CUSTOM: Add optional content type parameter to the Add method.
    public void Add(string name, BinaryData content, string fileName = default, string contentType = default)
    {
        Argument.AssertNotNull(content, nameof(content));
        Argument.AssertNotNullOrEmpty(name, nameof(name));

        ByteArrayContent byteArrayContent = new(content.ToArray());
        if (contentType is not null)
        {
            byteArrayContent.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
        }
        Add(byteArrayContent, name, fileName);
    }

    // CUSTOM: Add helper method to reduce code duplication.
    private void AddFilePart(string name, Stream fileStream, BinaryData contents, string filename = default, string contentType = default)
    {
        Argument.AssertNotNullOrEmpty(name, nameof(name));

        if (fileStream != null)
        {
            Add(name, fileStream, filename, contentType);
        }
        else if (contents != null)
        {
            Add(name, contents, filename, contentType);
        }
        else
        {
            throw new InvalidOperationException("File contents are not set.");
        }
    }

    // CUSTOM: Make private
    private void Add(string name, Stream stream, string fileName = default, string contentType = default)
    {
        Argument.AssertNotNull(stream, nameof(stream));
        Argument.AssertNotNullOrEmpty(name, nameof(name));

        StreamContent content = new(stream);
        if (contentType is not null)
        {
            content.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
        }
        Add(content, name, fileName);
    }

    private void Add(HttpContent content, string name, string fileName = default)
    {
        Argument.AssertNotNull(content, nameof(content));
        Argument.AssertNotNull(name, nameof(name));

        if (fileName is not null)
        {
            _multipartContent.Add(content, name, fileName);
        }
        else
        {
            _multipartContent.Add(content, name);
        }
    }

    // CUSTOM: Make static & internalize to use in serialization
#if NET6_0_OR_GREATER
    internal static string CreateBoundary() =>
        string.Create(BoundaryLength, 0, (chars, _) =>
        {
            Span<byte> random = stackalloc byte[BoundaryLength];
            Random.Shared.NextBytes(random);

            for (int i = 0; i < chars.Length; i++)
            {
                chars[i] = BoundaryValues[random[i] % BoundaryValues.Length];
            }
        });
#else
    private static readonly Random _random = new();

    internal static string CreateBoundary()
    {
        Span<char> chars = stackalloc char[BoundaryLength];

        byte[] random = new byte[BoundaryLength];
        lock (_random)
        {
            _random.NextBytes(random);
        }

        // Instead of `% BoundaryValues.Length` as is used above, use a mask to achieve the same result.
        // `% BoundaryValues.Length` is optimized to the equivalent on .NET Core but not on .NET Framework.
        const int Mask = 255 >> 2;
        Debug.Assert(BoundaryValues.Length - 1 == Mask);

        for (int i = 0; i < chars.Length; i++)
        {
            chars[i] = BoundaryValues[random[i] & Mask];
        }

        return chars.ToString();
    }
#endif

    public override bool TryComputeLength(out long length)
    {
        // We can't call the protected method on HttpContent

        if (_multipartContent.Headers.ContentLength is long contentLength)
        {
            length = contentLength;
            return true;
        }

        length = 0;
        return false;
    }

    public override void WriteTo(Stream stream, CancellationToken cancellationToken = default)
    {
#if NET5_0_OR_GREATER
        _multipartContent.CopyTo(stream, default, cancellationToken);
#else
        // TODO: polyfill sync-over-async for netstandard2.0 for Azure clients.
        // Tracked by https://github.com/Azure/azure-sdk-for-net/issues/42674
        _multipartContent.CopyToAsync(stream).GetAwaiter().GetResult();
#endif
    }

    public override async Task WriteToAsync(Stream stream, CancellationToken cancellationToken = default)
    {
#if NET5_0_OR_GREATER
        await _multipartContent.CopyToAsync(stream, cancellationToken).ConfigureAwait(false);
#else
        await _multipartContent.CopyToAsync(stream).ConfigureAwait(false);
#endif
    }

    public override void Dispose()
    {
        _multipartContent.Dispose();
    }
}
```

</details>

## Usage Examples

This section covers some common users scenarios for specifying a multipart-form request within TypeSpec. It includes the proposed generated code and example usage.

### Operation That Contains a Payload with a File Part and a Primitive Type Part

<details>
<summary>TypeSpec</summary>

```tsp
model Dog {
  id: HttpPart<string>;
  profileImage: HttpPart<File>; // File is a TypeSpec library model type
}

@post
@route("/dogs")
op uploadDog(
  @header contentType: "multipart/form-data",
  @multipartBody body: Dog,
): NoContentResponse;
```

#### The same operation can also be expressed using the `@body` decorator and a "bytes" type for the file part

```tsp
model Dog {
  id: string;
  profileImage: bytes;
}

@post
@route("/dogs")
op uploadDog(
  @header contentType: "multipart/form-data",
  @body body: Dog,
): NoContentResponse;
```

</details>

<details>
<summary>Client</summary>

```c#
// Protocol methods
 public virtual ClientResult UploadDog(BinaryContent content, string contentType, RequestOptions options = null)
 {
     Argument.AssertNotNull(content, nameof(content));
     Argument.AssertNotNull(contentType, nameof(contentType));

     using PipelineMessage message = CreateUploadDogRequest(content, contentType, options);
     return ClientResult.FromResponse(Pipeline.ProcessMessage(message, options));
 }

 public virtual async Task<ClientResult> UploadDogAsync(BinaryContent content, string contentType, RequestOptions options = null)
 {
     Argument.AssertNotNull(content, nameof(content));
     Argument.AssertNotNull(contentType, nameof(contentType));

     using PipelineMessage message = CreateUploadDogRequest(content, contentType, options);
     return ClientResult.FromResponse(await Pipeline.ProcessMessageAsync(message, options).ConfigureAwait(false));
 }

// Convenience methods
public virtual async Task<ClientResult> UploadDogAsync(Dog body, CancellationToken cancellationToken = default)
{
    Argument.AssertNotNull(body, nameof(body));

    using MultiPartFormDataBinaryContent content = body.ToMultipartContent();
    return await UploadDogAsync(content, content.ContentType, cancellationToken.CanBeCanceled ? new RequestOptions { CancellationToken = cancellationToken } : null).ConfigureAwait(false);
}

public virtual ClientResult UploadDog(Dog body, CancellationToken cancellationToken = default)
{
    Argument.AssertNotNull(body, nameof(body));

    using MultiPartFormDataBinaryContent content = body.ToMultipartContent();
    return UploadDog(content, content.ContentType, cancellationToken.CanBeCanceled ? new RequestOptions { CancellationToken = cancellationToken } : null);
}
```

</details>

<details>
<summary>Dog.cs</summary>

```c#
public partial class Dog
{
     public Dog(string id, MultiPartFileWithOptionalMetadata profileImage)
     {
         Argument.AssertNotNull(id, nameof(id));
         Argument.AssertNotNull(profileImage, nameof(profileImage));

         Id = id;
         ProfileImage = profileImage;
     }

     public string Id { get; }
     public MultiPartFileWithOptionalMetadata ProfileImage { get; }
}
```

</details>

<details>
<summary>Dog.Serialization.cs</summary>

```c#
public partial class Dog : IStreamModel<Dog>
{
    internal Dog()
    {
    }

    private string _boundary;
    private string Boundary => _boundary ??= MultiPartFormDataBinaryContent.CreateBoundary();

    BinaryData IPersistableModel<Dog>.Write(ModelReaderWriterOptions options) => PersistableModelWriteCore(options);
    protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options)
    {
        string format = options.Format == "W" ? ((IPersistableModel<Dog>)this).GetFormatFromOptions(options) : options.Format;
        switch (format)
        {
            case "MPFD-ContentType":
                return SerializeMultipartContentType();
            case "MPFD":
                return SerializeMultipart();
            default:
                throw new FormatException($"The model {nameof(Dog)} does not support writing '{options.Format}' format.");
        }
    }

    void IStreamModel<Dog>.Write(Stream stream, ModelReaderWriterOptions options) => PersistableStreamModelWriteCore(stream, options);
    protected virtual void PersistableStreamModelWriteCore(Stream stream, ModelReaderWriterOptions options)
    {
        string format = options.Format == "W" ? ((IPersistableModel<Dog>)this).GetFormatFromOptions(options) : options.Format;
        switch (format)
        {
            case "MPFD":
                WriteTo(stream);
                return;
            default:
                throw new FormatException($"The model {nameof(Dog)} does not support writing '{options.Format}' format.");
        }
    }

    Dog IPersistableModel<Dog>.Create(BinaryData data, ModelReaderWriterOptions options) => PersistableModelCreateCore(data, options);

    /// <param name="data"> The data to parse. </param>
    /// <param name="options"> The client options for reading and writing models. </param>
    protected virtual Dog PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options)
    {
        string format = options.Format == "W" ? ((IPersistableModel<Dog>)this).GetFormatFromOptions(options) : options.Format;
        switch (format)
        {
            default:
                throw new FormatException($"The model {nameof(Dog)} does not support reading '{options.Format}' format.");
        }
    }

    string IPersistableModel<Dog>.GetFormatFromOptions(ModelReaderWriterOptions options) => "MPFD";

    public static implicit operator BinaryContent(Dog dog)
    {
        if (dog == null)
        {
            return null;
        }
        return dog.ToMultipartContent();
    }

    internal MultiPartFormDataBinaryContent ToMultipartContent()
    {
        MultiPartFormDataBinaryContent content = new(Boundary);

        content.Add("id", Id);
        content.Add("profileImage", ProfileImage);

        return content;
    }

    private BinaryData SerializeMultipartContentType()
    {
        using MultiPartFormDataBinaryContent content = new(Boundary);
        return BinaryData.FromString(content.ContentType);
    }

    private BinaryData SerializeMultipart()
    {
        using MemoryStream stream = new MemoryStream();

        WriteTo(stream);
        if (stream.CanSeek)
        {
            stream.Seek(0, SeekOrigin.Begin);
        }
        return BinaryData.FromStream(stream);
    }

    private void WriteTo(Stream stream)
    {
        using MultiPartFormDataBinaryContent content = ToMultipartContent();
        content.WriteTo(stream);
    }
}

```

</details>

<details>
<summary>Convenience Example Usage</summary>

```csharp
PetStoreClient client = new PetStoreClient();

await using FileStream imageStream = File.OpenRead("C:\\myDog.jpg");
Dog dog = new Dog("123", new MultiPartFileWithOptionalMetadata(imageStream));

ClientResult response = await client.UploadDogAsync(dog);
```

</details>

<details>
<summary>Protocol Example Usage</summary>

```csharp
PetStoreClient client = new PetStoreClient();

await using FileStream imageStream = File.OpenRead("C:\\myDog.jpg");
Dog dog = new Dog("123", new MultiPartFileWithOptionalMetadata(imageStream));
// get the multipart content type, which includes the boundary
string contentType = ModelReaderWriter.Write(dog, new ModelReaderWriterOptions("MPFD-ContentType")).ToString();

ClientResult response = await client.UploadDogAsync(dog, contentType);
```

</details>

### Operation That Contains a Payload with a File Part, where the file's metadata is required, and a Primitive Type Part

<details>
<summary>TypeSpec</summary>

```tsp
model Cat {
  id: HttpPart<string>;
  profileImage: HttpPart<FileRequiredMetaData>;
}

// filename and contentType are required. File is a TypeSpec library model type
model FileRequiredMetaData extends File {
  filename: string;
  contentType: string;
}

@post
@route("/cats")
op uploadCat(
  @header contentType: "multipart/form-data",
  @multipartBody body: Cat,
): NoContentResponse;
```

</details>

<details>
<summary>Client</summary>

```c#
// Protocol methods
 public virtual ClientResult UploadCat(BinaryContent content, string contentType, RequestOptions options = null)
 {
     Argument.AssertNotNull(content, nameof(content));
     Argument.AssertNotNull(contentType, nameof(contentType));

     using PipelineMessage message = CreateUploadCatRequest(content, contentType, options);
     return ClientResult.FromResponse(Pipeline.ProcessMessage(message, options));
 }

 public virtual async Task<ClientResult> UploadCatAsync(BinaryContent content, string contentType, RequestOptions options = null)
 {
     Argument.AssertNotNull(content, nameof(content));
     Argument.AssertNotNull(contentType, nameof(contentType));

     using PipelineMessage message = CreateUploadCatRequest(content, contentType, options);
     return ClientResult.FromResponse(await Pipeline.ProcessMessageAsync(message, options).ConfigureAwait(false));
 }

// Convenience methods
public virtual ClientResult UploadCat(Cat body, CancellationToken cancellationToken = default)
{
    Argument.AssertNotNull(body, nameof(body));

    using MultiPartFormDataBinaryContent content = body.ToMultipartContent();
    return UploadCat(content, content.ContentType, cancellationToken.CanBeCanceled ? new RequestOptions { CancellationToken = cancellationToken } : null);
}

public virtual async Task<ClientResult> UploadCatAsync(Cat body, CancellationToken cancellationToken = default)
{
    Argument.AssertNotNull(body, nameof(body));

    using MultiPartFormDataBinaryContent content = body.ToMultipartContent();
    return await UploadCatAsync(content, content.ContentType, cancellationToken.CanBeCanceled ? new RequestOptions { CancellationToken = cancellationToken } : null).ConfigureAwait(false);
}
```

</details>

<details>
<summary>Cat.cs</summary>

```c#
public partial class Cat
{
    public Cat(string id, MultiPartFileWithRequiredMetadata profileImage)
    {
        Argument.AssertNotNull(id, nameof(id));
        Argument.AssertNotNull(profileImage, nameof(profileImage));

        Id = id;
        ProfileImage = profileImage;
    }

    public string Id { get; }
    public MultiPartFileWithRequiredMetadata ProfileImage { get; }
}
```

</details>

<details>
<summary>Cat.Serialization.cs</summary>

```c#
public partial class Cat : IStreamModel<Cat>
{
    internal Cat()
    {
    }

    private string _boundary;
    private string Boundary => _boundary ??= MultiPartFormDataBinaryContent.CreateBoundary();

    BinaryData IPersistableModel<Cat>.Write(ModelReaderWriterOptions options) => PersistableModelWriteCore(options);
    protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options)
    {
        string format = options.Format == "W" ? ((IPersistableModel<Cat>)this).GetFormatFromOptions(options) : options.Format;
        switch (format)
        {
            case "MPFD-ContentType":
                return SerializeMultipartContentType();
            case "MPFD":
                return SerializeMultipart();
            default:
                throw new FormatException($"The model {nameof(Cat)} does not support writing '{options.Format}' format.");
        }
    }

    void IStreamModel<Cat>.Write(Stream stream, ModelReaderWriterOptions options) => PersistableStreamModelWriteCore(stream, options);
    protected virtual void PersistableStreamModelWriteCore(Stream stream, ModelReaderWriterOptions options)
    {
        string format = options.Format == "W" ? ((IPersistableModel<Cat>)this).GetFormatFromOptions(options) : options.Format;
        switch (format)
        {
            case "MPFD":
                WriteTo(stream);
                return;
            default:
                throw new FormatException($"The model {nameof(Cat)} does not support writing '{options.Format}' format.");
        }
    }

    Cat IPersistableModel<Cat>.Create(BinaryData data, ModelReaderWriterOptions options) => PersistableModelCreateCore(data, options);

    /// <param name="data"> The data to parse. </param>
    /// <param name="options"> The client options for reading and writing models. </param>
    protected virtual Cat PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options)
    {
        string format = options.Format == "W" ? ((IPersistableModel<Cat>)this).GetFormatFromOptions(options) : options.Format;
        switch (format)
        {
            default:
                throw new FormatException($"The model {nameof(Cat)} does not support reading '{options.Format}' format.");
        }
    }

    string IPersistableModel<Cat>.GetFormatFromOptions(ModelReaderWriterOptions options) => "MPFD";

    public static implicit operator BinaryContent(Cat cat)
    {
        if (cat == null)
        {
            return null;
        }
        return cat.ToMultipartContent();
    }

    internal MultiPartFormDataBinaryContent ToMultipartContent()
    {
        MultiPartFormDataBinaryContent content = new(Boundary);

        content.Add("id", Id);
        content.Add("profileImage", ProfileImage);

        return content;
    }

    private BinaryData SerializeMultipartContentType()
    {
        using MultiPartFormDataBinaryContent content = new(Boundary);
        return BinaryData.FromString(content.ContentType);
    }

    private BinaryData SerializeMultipart()
    {
        using MemoryStream stream = new MemoryStream();

        WriteTo(stream);
        if (stream.CanSeek)
        {
            stream.Seek(0, SeekOrigin.Begin);
        }
        return BinaryData.FromStream(stream);
    }

    private void WriteTo(Stream stream)
    {
        using MultiPartFormDataBinaryContent content = ToMultipartContent();
        content.WriteTo(stream);
    }
}
```

</details>

<details>
<summary>Convenience Example Usage</summary>

```csharp
PetStoreClient client = new PetStoreClient();

await using FileStream imageStream = File.OpenRead("C:\\myCat.jpg");
Cat cat = new Cat("123", new MultiPartFileWithRequiredMetadata(imageStream, "myCat.jpg", "image/jpeg"));

ClientResult response = await client.UploadCatAsync(cat);
```

</details>

<details>
<summary>Protocol Example Usage</summary>

```csharp
PetStoreClient client = new PetStoreClient();

await using FileStream imageStream = File.OpenRead("C:\\myDog.jpg");
Cat cat = new Cat("123", new MultiPartFileWithRequiredMetadata(imageStream, "myCat.jpg", "image/jpeg"));
// get the multipart content type, which includes the boundary
string contentType = ModelReaderWriter.Write(cat, new ModelReaderWriterOptions("MPFD-ContentType")).ToString();

ClientResult response = await client.UploadCatAsync(cat, contentType);
```

</details>

### Operation That Contains a Payload with Primitive Parts, a File Part, and a Model Part

<details>
<summary>TypeSpec</summary>

```tsp
model Address {
  city: string;
}

model PetDetails {
  id: HttpPart<string>;
  ownerName: HttpPart<string>;
  petName: HttpPart<string>;
  address: HttpPart<Address>;
  profileImage: HttpPart<File>;
}

@post
@route("/pet/details")
op uploadPetDetails(
    @header contentType: "multipart/form-data",
    @body body: PetDetails,
): NoContentResponse;
```

#### The same operation can also be expressed using the `@body` decorator and a "bytes" type for the file part

```tsp
model Address {
  city: string;
}

model PetDetails {
  id: string;
  ownerName: string;
  petName: string;
  address: Address;
  profileImage: bytes;
}

@post
@route("/pet/details")
op uploadPetDetails(
    @header contentType: "multipart/form-data",
    @body body: PetDetails,
): NoContentResponse;
```

</details>

<details>
<summary>Client</summary>

```c#
// Protocol methods
public virtual ClientResult UploadPetDetails(BinaryContent content, string contentType, RequestOptions options = null)
{
    Argument.AssertNotNull(content, nameof(content));
    Argument.AssertNotNull(contentType, nameof(contentType));

    using PipelineMessage message = CreateUploadPetDetailsRequest(content, contentType, options);
    return ClientResult.FromResponse(Pipeline.ProcessMessage(message, options));
}

public virtual async Task<ClientResult> UploadPetDetailsAsync(BinaryContent content, string contentType, RequestOptions options = null)
{
    Argument.AssertNotNull(content, nameof(content));
    Argument.AssertNotNull(contentType, nameof(contentType));

    using PipelineMessage message = CreateUploadPetDetailsRequest(content, contentType, options);
    return ClientResult.FromResponse(await Pipeline.ProcessMessageAsync(message, options).ConfigureAwait(false));
}

// Convenience methods
public virtual ClientResult UploadPetDetails(PetDetails body, CancellationToken cancellationToken = default)
{
    Argument.AssertNotNull(body, nameof(body));

    using MultiPartFormDataBinaryContent content = body.ToMultipartContent();
    return UploadPetDetails(content, content.ContentType, cancellationToken.CanBeCanceled ? new RequestOptions { CancellationToken = cancellationToken } : null);
}

public virtual async Task<ClientResult> UploadPetDetailsAsync(PetDetails body, CancellationToken cancellationToken = default)
{
    Argument.AssertNotNull(body, nameof(body));

    using MultiPartFormDataBinaryContent content = body.ToMultipartContent();
    return await UploadPetDetailsAsync(content, content.ContentType, cancellationToken.CanBeCanceled ? new RequestOptions { CancellationToken = cancellationToken } : null).ConfigureAwait(false);
}
```

</details>

<details>
<summary>Address.cs</summary>

```c#
public partial class Address
{
    public Address(string city)
    {
        Argument.AssertNotNull(city, nameof(city));

        City = city;
    }

    public string City { get; }
}
```

</details>

<details>
<summary>PetDetails.cs</summary>

```c#
public partial class PetDetails
{
    public PetDetails(string id, string ownerName, string petName, Address address, MultiPartFileWithOptionalMetadata profileImage)
    {
        Argument.AssertNotNull(id, nameof(id));
        Argument.AssertNotNull(ownerName, nameof(ownerName));
        Argument.AssertNotNull(petName, nameof(petName));
        Argument.AssertNotNull(address, nameof(address));
        Argument.AssertNotNull(profileImage, nameof(profileImage));

        Id = id;
        OwnerName = ownerName;
        PetName = petName;
        Address = address;
        ProfileImage = profileImage;
    }

    public string Id { get; }
    public string OwnerName { get; }
    public string PetName { get; }
    public Address Address { get; }
    public MultiPartFileWithOptionalMetadata ProfileImage { get; }
}
```

</details>

<details>
<summary>PetDetails.Serialization.cs</summary>

```c#
public partial class PetDetails : IStreamModel<PetDetails>
{
    internal PetDetails()
    {
    }

    private string _boundary;

    private string Boundary => _boundary ??= MultiPartFormDataBinaryContent.CreateBoundary();

    BinaryData IPersistableModel<PetDetails>.Write(ModelReaderWriterOptions options) => PersistableModelWriteCore(options);
    protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options)
    {
        string format = options.Format == "W" ? ((IPersistableModel<PetDetails>)this).GetFormatFromOptions(options) : options.Format;
        switch (format)
        {
            case "MPFD-ContentType":
                return SerializeMultipartContentType();
            case "MPFD":
                return SerializeMultipart();
            default:
                throw new FormatException($"The model {nameof(PetDetails)} does not support writing '{options.Format}' format.");
        }
    }

    void IStreamModel<PetDetails>.Write(Stream stream, ModelReaderWriterOptions options) => PersistableModelWithStreamWriteCore(stream, options);
    protected virtual void PersistableModelWithStreamWriteCore(Stream stream, ModelReaderWriterOptions options)
    {
        string format = options.Format == "W" ? ((IPersistableModel<PetDetails>)this).GetFormatFromOptions(options) : options.Format;
        switch (format)
        {
            case "MPFD":
                WriteTo(stream);
                return;
            default:
                throw new FormatException($"The model {nameof(PetDetails)} does not support writing '{options.Format}' format.");
        }
    }

    PetDetails IPersistableModel<PetDetails>.Create(BinaryData data, ModelReaderWriterOptions options) => PersistableModelCreateCore(data, options);

    /// <param name="data"> The data to parse. </param>
    /// <param name="options"> The client options for reading and writing models. </param>
    protected virtual PetDetails PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options)
    {
        string format = options.Format == "W" ? ((IPersistableModel<PetDetails>)this).GetFormatFromOptions(options) : options.Format;
        switch (format)
        {
            default:
                throw new FormatException($"The model {nameof(PetDetails)} does not support reading '{options.Format}' format.");
        }
    }

    string IPersistableModel<PetDetails>.GetFormatFromOptions(ModelReaderWriterOptions options) => "MPFD";

    public static implicit operator BinaryContent(PetDetails petDetails)
    {
        if (petDetails == null)
        {
            return null;
        }
        return petDetails.ToMultipartContent();
    }

    internal MultiPartFormDataBinaryContent ToMultipartContent()
    {
        MultiPartFormDataBinaryContent content = new(Boundary);
        content.Add("id", Id);
        content.Add("ownerName", OwnerName);
        content.Add("petName", PetName);
        content.Add("address", Address);
        content.Add("profileImage", ProfileImage);

        return content;
    }

    private BinaryData SerializeMultipartContentType()
    {
        using MultiPartFormDataBinaryContent content = new(Boundary);
        return BinaryData.FromString(content.ContentType);
    }

    private BinaryData SerializeMultipart()
    {
        using MemoryStream stream = new MemoryStream();

        WriteTo(stream);
        if (stream.CanSeek)
        {
            stream.Seek(0, SeekOrigin.Begin);
        }
        return BinaryData.FromStream(stream);
    }

    private void WriteTo(Stream stream)
    {
        using MultiPartFormDataBinaryContent content = ToMultipartContent();
        content.WriteTo(stream);
    }
}
```

</details>

<details>
<summary>Convenience Example Usage</summary>

```csharp
PetStoreClient client = new PetStoreClient();

await using FileStream profileImageStream = File.OpenRead("C:\\winston.jpg");
PetDetails petDetails = new PetDetails(
    "123",
    "John Doe",
    "Winston",
    new Address("123 Main St."),
    new MultiPartFileWithOptionalMetadata(profileImageStream));

var response = await client.UploadPetDetailsAsync(petDetails);
```

</details>

<details>
<summary>Protocol Example Usage</summary>

```csharp
PetStoreClient client = new PetStoreClient();

await using FileStream profileImageStream = File.OpenRead("C:\\winston.jpg");
PetDetails petDetails = new PetDetails(
   "123",
   "John Doe",
   "Winston",
   new Address("123 Main St."),
   new MultiPartFileWithOptionalMetadata(profileImageStream));
// get the multipart content type, which includes the boundary
string contentType = ModelReaderWriter.Write(petDetails, new ModelReaderWriterOptions("MPFD-ContentType")).ToString();

ClientResult response = await client.UploadCatAsync(petDetails, contentType);
```

</details>
