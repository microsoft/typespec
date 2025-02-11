# Multipart-form Payload Generation Support

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
 // use the BCL type to create a MultipartFormDataContent instance
 using MultipartFormDataContent multipartContent = new()
 {
     // add the id part, including the name of the part and it's value
     { new StringContent("123"), "id" }
 };

 // add the file part, including the name of the part and the file name
 await using var imageStream = File.OpenRead(SampleJpgPath);
 var streamContent = new StreamContent(imageStream);
 // set the appropriate content type
 streamContent.Headers.ContentType = MediaTypeHeaderValue.Parse("application/octet-stream");
 multipartContent.Add(streamContent, "profileImage", "profileImage.jpg");

 // convert the BCL type to BinaryContent, to be consumed by the protocol method
 using Stream multipartContentStream = await multipartContent.ReadAsStreamAsync();
 BinaryContent content = BinaryContent.Create(multipartContentStream);

 var requestContentType = multipartContent.Headers.ContentType!.ToString();

// call the service API using the client's protocol method.
 var response = await new MultiPartClient().UploadDogAsync(content, requestContentType);
```

This document provides a proposal for a generated convenience layer to remove some of this burden from users.

## Goals

- Provide discoverable convenience methods that simplify creating and sending multipart/form-data requests.
- Allow developers to serialize multipart/form-data requests using ModelReaderWriter.

## API View

## Usage Examples

This section covers some common users scenarios for specifying a multipart-form request within TypeSpec. It includes the proposed generated code and example usage.

### Operation That Contains a Payload with a File Part and a Primitive Type Part

<details>
<summary>TypeSpec</summary>

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
public virtual async Task<ClientResult> UploadDogAsync(Dog body, CancellationToken cancellationToken = default)
{
    Argument.AssertNotNull(body, nameof(body));

    using MultiPartFormDataBinaryContent content = body.ToMultipartContent();
    return await UploadDogAsync(content, content.ContentType, cancellationToken.CanBeCanceled ? new RequestOptions { CancellationToken = cancellationToken } : null).ConfigureAwait(false);
}
```

</details>

<details>
<summary>Dog.cs</summary>

```c#
namespace Pets.Multipart.Models
{
    public partial class Dog
    {
         public Dog(string id, MultiPartFile profileImage)
         {
             Argument.AssertNotNull(id, nameof(id));
             Argument.AssertNotNull(profileImage, nameof(profileImage));
        
             Id = id;
             ProfileImage = profileImage;
         }
        
         public string Id { get; }
         // MultiPartFile is a proposed convenience model type to represent a file part within a multipart/form-data request.
         public MultiPartFile ProfileImage { get; }
    }
}
```

</details>

<details>
<summary>Dog.Serialization.cs</summary>

```c#
namespace Pets.Multipart.Models
{
    public partial class Dog : IPersistableStreamModel<Dog>
    {
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

        void IPersistableStreamModel<Dog>.Write(Stream stream, ModelReaderWriterOptions options) => PersistableStreamModelWriteCore(stream, options);
        protected virtual void PersistableStreamModelWriteCore(Stream stream, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<Dog>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "MPFD":
                    SerializeMultipart(stream);
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
            using MultiPartFormDataBinaryContent content = ToMultipartContent();
            using MemoryStream stream = new MemoryStream();

            content.WriteTo(stream);
            if (stream.CanSeek)
            {
                stream.Seek(0, SeekOrigin.Begin);
            }
            return BinaryData.FromStream(stream);
        }

        private void SerializeMultipart(Stream stream)
        {
            using MultiPartFormDataBinaryContent content = ToMultipartContent();

            content.WriteTo(stream);
            if (stream.CanSeek)
            {
                stream.Seek(0, SeekOrigin.Begin);
            }
        }
    }
}

```

</details>

<details>
<summary>Example Usage</summary>

```csharp
    var sampleJpgPath = Path.Combine("assets", "profileImage.jpg");
    await using var imageStream = File.OpenRead(sampleJpgPath);

    var id = "123";
    var profileImage = new MultiPartFile(imageStream, "profileImage.jpg");
    var request = new Dog(id, profileImage);
    var response = await new MultiPartClient().UploadDogAsync(request);
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

// File is a TypeSpec model type
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
namespace Pets.Multipart.Models
{
    public partial class Cat
    {
        public Cat(string id, FileRequiredMetaData profileImage)
        {
            Argument.AssertNotNull(id, nameof(id));
            Argument.AssertNotNull(profileImage, nameof(profileImage));

            Id = id;
            ProfileImage = profileImage;
        }

        public string Id { get; }
        public FileRequiredMetaData ProfileImage { get; }
    }
}
```

</details>

<details>
<summary>Cat.Serialization.cs</summary>

```c#
namespace Pets.Multipart.Models
{
    public partial class Cat : IPersistableStreamModel<Cat>
    {
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

        void IPersistableStreamModel<Cat>.Write(Stream stream, ModelReaderWriterOptions options) => PersistableStreamModelWriteCore(stream, options);
        protected virtual void PersistableStreamModelWriteCore(Stream stream, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<Cat>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "MPFD":
                    SerializeMultipart(stream);
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
            using MultiPartFormDataBinaryContent content = ToMultipartContent();
            using MemoryStream stream = new MemoryStream();

            content.WriteTo(stream);
            if (stream.CanSeek)
            {
                stream.Seek(0, SeekOrigin.Begin);
            }
            return BinaryData.FromStream(stream);
        }

        private void SerializeMultipart(Stream stream)
        {
            using MultiPartFormDataBinaryContent content = ToMultipartContent();

            content.WriteTo(stream);
            if (stream.CanSeek)
            {
                stream.Seek(0, SeekOrigin.Begin);
            }
        }
    }
}
```

</details>

<details>
<summary>FileRequiredMetaData.cs</summary>

```c#
namespace Pets.Multipart.Models
{
    public partial class FileRequiredMetaData : MultiPartFile
    {
        public FileRequiredMetaData(Stream contents, string filename, string contentType) : base(contents, filename, contentType)
        {
            Argument.AssertNotNull(contents, nameof(contents));
            Argument.AssertNotNull(filename, nameof(filename));
            Argument.AssertNotNull(contentType, nameof(contentType));
        }

        public FileRequiredMetaData(BinaryData contents, string filename, string contentType) : base(contents, filename, contentType)
        {
            Argument.AssertNotNull(contents, nameof(contents));
            Argument.AssertNotNull(filename, nameof(filename));
            Argument.AssertNotNull(contentType, nameof(contentType));
        }
    }
}
```

</details>

<details>
<summary>Example Usage</summary>

```csharp
 var id = "123";
 var sampleJpgPath = Path.Combine("assets", "image.jpg");
 await using var imageStream = File.OpenRead(sampleJpgPath);

 // both filename and content-type are required
 var profileImage = new FileRequiredMetaData(imageStream, "image.jpg", "application/octet-stream");
 var request = new Cat(id, profileImage);
 var response = await new MultiPartClient().UploadCatAsync(request);
```

</details>

## System ClientModel Updates

### File Part Convenience Type

To support generating a convenience layer for file parts described in a TypeSpec request, a new convenience model type can be added to the System.ClientModel package, to be consumed by generated clients. This new type, `MultiPartFile`, can serve as the type for file part properties within a request model.

```csharp
public class MultiPartFile
{
    public MultiPartFile(Stream contents, string? filename = default, string? contentType = default)
    {
        Argument.AssertNotNull(contents, nameof(contents));

        File = contents;
        Filename = filename;
        ContentType = contentType ?? "application/octet-stream";
    }

    public MultiPartFile(BinaryData contents, string? filename = default, string? contentType = default)
    {
        Argument.AssertNotNull(contents, nameof(contents));

        Contents = contents;
        Filename = filename;
        ContentType = contentType ?? "application/octet-stream";
    }

    public Stream? File { get; }
    public BinaryData? Contents { get; }
    public string? Filename { get; }
    public string ContentType { get; }
}
```

### Support Serializing a Model into a Stream using MRW

To support optimizing the serialization of large file parts within a request, the ModelReaderWriter serialization can be updated to support serializing a model into a stream. To support this, a new interface can be introduced which will contain an API for writing the model to the user supplied stream.

```csharp
public interface IPersistableStreamModel<out T> : IPersistableModel<T>
{
    /// <summary>
    /// Writes the model into the provided <see cref="Stream"/>.
    /// </summary>
    void Write(Stream stream, ModelReaderWriterOptions options);
}
```
