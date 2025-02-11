# Multipart-form Payload Generation Support

## Table of Contents

1. [Motivation](#motivation)
2. [Describing a multipart-form data request in TypeSpec](#describing-a-multipart-form-data-request-in-TypeSpec)
   - [Using `@body`](#using-body)
   - [Using `@multipartBody`](#using-multipart-body)
3. [User Scenarios](#user-scenarios)
4. [System ClientModel Updates](#system-clientmodel-updates)
5. [Emitter Updates](#proposed-emitter-updates)
   - [Pass through TCGC `multipartOptions` for model properties](#pass-through-tcgc-multipartoptions-for-model-properties)
6. [Follow-Ups](#Follow-ups)

## Motivation

TypeSpec support for explicit HTTP parts within a multipart-form request was added as part of [this issue](https://github.com/microsoft/TypeSpec/issues/3046). Currently, MGC does not generate a convenience layer for multipart/form-data requests and users have to rely on custom code or building the requests themselves to use the generated client protocol methods.

For example, in it's current state, in order to send a request for this sample operation a client user would need to construct the request themselves, relying on custom or BCL type boundary logic:

```tsp
model MultiPartRequest {
  id: string;
  profileImage: bytes;
}

@post
@route("/parts")
op basic(
  @header contentType: "multipart/form-data",
  @body body: MultiPartRequest,
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
 var response = await new MultiPartClient().BasicAsync(content, requestContentType);
```

This document provides a proposal for a generated convenience layer to remove some of this burden from users and includes a proposal for the changes required in the .NET emitter to support generating this.

## Describing a multipart-form data request in TypeSpec

TypeSpec supports describing a multipart-form data request in two ways:

### Using `@body`

```tsp
model MultiPartRequest {
  id: string;
  profileImage: bytes;
}

@post
@route("/parts")
op basic(
  @header contentType: "multipart/form-data",
  @body body: MultiPartRequest,
): NoContentResponse;
```

### Using `@multipartBody`

```tsp
model MultiPartRequest {
  id: HttpPart<string>;
  profileImage: HttpPart<FileRequiredMetadata>;
}

model FileRequiredMetaData extends File {
  filename: string;
  contentType: string;
}

@post
@route("/parts")
op basic(
  @header contentType: "multipart/form-data",
  @multipartBody body: MultiPartRequest,
): NoContentResponse;
```

When using the `multipartBody` decorator and `HttpPart` in an operation's request, users can use TypeSpec's built in [File](https://github.com/microsoft/typespec/blob/main/packages/http/lib/http.tsp#L110) to mark a part as a file part. This enables users to control the details of a file part within a multipart request, including changing the optionality of a file part's content-type and filename.

## User Scenarios

This section covers some users scenarios for specifying a multipart-form request, using both decorators `@body` + `@multipartBody`, and its' corresponding proposed generated code.

The primary impact on the generated convenience layer when using `@multipartBody` instead of `@body` for file parts, is the optionality of a file part's content-type and filename properties. When merely `bytes` is used within a `@body` decorator, the default behavior is assumed and the generated file part's content-type and filename properties will **always** be optional.

> **_NOTE:_**  This section covers some common scenarios users may use and it does not cover all scenarios.

### When content-type of an operation is "multipart/form-data" and using "@body" decorator

#### Example Operation That Contains a Payload with a File Part and a Primitive Type Part

<details>
<summary>TypeSpec</summary>

```tsp
model MultiPartRequest {
  id: string;
  profileImage: bytes;
}

@post
@route("/parts")
op basic(
  @header contentType: "multipart/form-data",
  @body body: MultiPartRequest,
): NoContentResponse;
```

</details>

<details>
<summary>Client</summary>

```c#
public virtual async Task<ClientResult> BasicAsync(MultiPartRequest body, CancellationToken cancellationToken = default)
{
    Argument.AssertNotNull(body, nameof(body));

    using MultiPartFormDataBinaryContent content = body.ToMultipartContent();
    return await BasicAsync(content, content.ContentType, cancellationToken.CanBeCanceled ? new RequestOptions { CancellationToken = cancellationToken } : null).ConfigureAwait(false);
}
```

</details>

<details>
<summary>MultiPartRequest.cs</summary>

```c#
namespace Payload.MultiPart.Models
{
    public partial class MultiPartRequest
    {
         public MultiPartRequest(string id, MultiPartFile profileImage)
         {
             Argument.AssertNotNull(id, nameof(id));
             Argument.AssertNotNull(profileImage, nameof(profileImage));
        
             Id = id;
             ProfileImage = profileImage;
         }
        
         public string Id { get; }
         public MultiPartFile ProfileImage { get; }
    }
}
```

</details>

<details>
<summary>MultiPartRequest.Serialization.cs</summary>

```c#
namespace Payload.MultiPart.Models
{
    public partial class MultiPartRequest : IPersistableStreamModel<MultiPartRequest>
    {
        private string _boundary;
        private string Boundary => _boundary ??= MultiPartFormDataBinaryContent.CreateBoundary();

        BinaryData IPersistableModel<MultiPartRequest>.Write(ModelReaderWriterOptions options) => PersistableModelWriteCore(options);
        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<MultiPartRequest>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "MPFD-ContentType":
                    return SerializeMultipartContentType();
                case "MPFD":
                    return SerializeMultipart();
                default:
                    throw new FormatException($"The model {nameof(MultiPartRequest)} does not support writing '{options.Format}' format.");
            }
        }

        void IPersistableStreamModel<MultiPartRequest>.Write(Stream stream, ModelReaderWriterOptions options) => PersistableModelWithStreamWriteCore(stream, options);
        protected virtual void PersistableModelWithStreamWriteCore(Stream stream, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<MultiPartRequest>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "MPFD":
                    SerializeMultipart(stream);
                    return;
                default:
                    throw new FormatException($"The model {nameof(MultiPartRequest)} does not support writing '{options.Format}' format.");
            }
        }

        MultiPartRequest IPersistableModel<MultiPartRequest>.Create(BinaryData data, ModelReaderWriterOptions options) => PersistableModelCreateCore(data, options);

        /// <param name="data"> The data to parse. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual MultiPartRequest PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<MultiPartRequest>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                default:
                    throw new FormatException($"The model {nameof(MultiPartRequest)} does not support reading '{options.Format}' format.");
            }
        }

        string IPersistableModel<MultiPartRequest>.GetFormatFromOptions(ModelReaderWriterOptions options) => "MPFD";

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
    var request = new MultiPartRequest(id, profileImage);
    var response = await new MultiPartClient().BasicAsync(request);
```

</details>

#### Example Operation That Contains a Payload with Complex Parts

<details>
<summary>TypeSpec</summary>

```tsp
model ComplexPartsRequest {
  id: string;
  address: Address;
  profileImage: bytes;
  pictures: bytes[];
}

model Address {
  city: string;
}

@post
@route("/complex-parts")
op fileArrayAndBasic(
    @header contentType: "multipart/form-data",
    @body body: ComplexPartsRequest,
): NoContentResponse;
```

</details>

<details>
<summary>Client</summary>

```c#
public virtual async Task<ClientResult> FileArrayAndBasicAsync(ComplexPartsRequest body, CancellationToken cancellationToken = default)
{
    Argument.AssertNotNull(body, nameof(body));

    using MultiPartFormDataBinaryContent content = body.ToMultipartContent();
    return await FileArrayAndBasicAsync(content, content.ContentType, cancellationToken.CanBeCanceled ? new RequestOptions { CancellationToken = cancellationToken } : null);
}
```

</details>

<details>
<summary>ComplexPartsRequest.cs</summary>

```c#
namespace Payload.MultiPart.Models
{
    namespace Payload.MultiPart.Models
    {
        public partial class ComplexPartsRequest
        {
            public ComplexPartsRequest(string id, Address address, MultiPartFile profileImage, IEnumerable<MultiPartFile> pictures)
            {
                Argument.AssertNotNull(id, nameof(id));
                Argument.AssertNotNull(address, nameof(address));
                Argument.AssertNotNull(profileImage, nameof(profileImage));
                Argument.AssertNotNull(pictures, nameof(pictures));
        
                Id = id;
                Address = address;
                ProfileImage = profileImage;
                Pictures = pictures.ToList();
            }
        
            public string Id { get; }
            public Address Address { get; }
            public MultiPartFile ProfileImage { get; }
            public IList<MultiPartFile> Pictures { get; }
        }
    }
}
```

</details>

<details>
<summary>ComplexPartsRequest.Serialization.cs</summary>

```c#
namespace Payload.MultiPart.Models
{
    public partial class ComplexPartsRequest : IPersistableStreamModel<ComplexPartsRequest>
    {
        private string _boundary;

        private string Boundary => _boundary ??= MultiPartFormDataBinaryContent.CreateBoundary();

        BinaryData IPersistableModel<ComplexPartsRequest>.Write(ModelReaderWriterOptions options) => PersistableModelWriteCore(options);
        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<ComplexPartsRequest>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "MPFD-ContentType":
                    return SerializeMultipartContentType();
                case "MPFD":
                    return SerializeMultipart();
                default:
                    throw new FormatException($"The model {nameof(ComplexPartsRequest)} does not support writing '{options.Format}' format.");
            }
        }

        void IPersistableStreamModel<ComplexPartsRequest>.Write(Stream stream, ModelReaderWriterOptions options) => PersistableModelWithStreamWriteCore(stream, options);
        protected virtual void PersistableModelWithStreamWriteCore(Stream stream, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<ComplexPartsRequest>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "MPFD":
                    SerializeMultipart(stream);
                    return;
                default:
                    throw new FormatException($"The model {nameof(ComplexPartsRequest)} does not support writing '{options.Format}' format.");
            }
        }

        ComplexPartsRequest IPersistableModel<ComplexPartsRequest>.Create(BinaryData data, ModelReaderWriterOptions options) => PersistableModelCreateCore(data, options);

        /// <param name="data"> The data to parse. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual ComplexPartsRequest PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<ComplexPartsRequest>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                default:
                    throw new FormatException($"The model {nameof(ComplexPartsRequest)} does not support reading '{options.Format}' format.");
            }
        }

        string IPersistableModel<ComplexPartsRequest>.GetFormatFromOptions(ModelReaderWriterOptions options) => "MPFD";
        internal MultiPartFormDataBinaryContent ToMultipartContent()
        {
            MultiPartFormDataBinaryContent content = new(Boundary);
            content.Add("id", Id);
            content.Add("address", Address);
            content.Add("profileImage", ProfileImage);

            foreach (var picture in Pictures)
            {
                content.Add("pictures", picture);
            }

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
<summary>Address.cs</summary>

```csharp
namespace Payload.MultiPart.Models
{
    public partial class Address
    {
        private protected readonly IDictionary<string, BinaryData> _additionalBinaryDataProperties;

        public Address(string city)
        {
            Argument.AssertNotNull(city, nameof(city));

            City = city;
        }

        internal Address(string city, IDictionary<string, BinaryData> additionalBinaryDataProperties)
        {
            City = city;
            _additionalBinaryDataProperties = additionalBinaryDataProperties;
        }

        public string City { get; }
    }
}
```

</details>

<details>
<summary>Address.Serialization.cs</summary>

```c#

namespace Payload.MultiPart.Models
{
    public partial class Address : IJsonModel<Address>
    {
        internal Address()
        {

        }

        void IJsonModel<Address>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            writer.WriteStartObject();
            JsonModelWriteCore(writer, options);
            writer.WriteEndObject();
        }

        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            var format = options.Format == "W" ? ((IPersistableModel<Address>)this).GetFormatFromOptions(options) : options.Format;
            if (format != "J")
            {
                throw new FormatException($"The model {nameof(Address)} does not support writing '{format}' format.");
            }

            writer.WritePropertyName("city"u8);
            writer.WriteStringValue(City);
            if (options.Format != "W" && _additionalBinaryDataProperties != null)
            {
                foreach (var item in _additionalBinaryDataProperties)
                {
                    writer.WritePropertyName(item.Key);
#if NET6_0_OR_GREATER
				    writer.WriteRawValue(item.Value);
#else
                    using (JsonDocument document = JsonDocument.Parse(item.Value))
                    {
                        JsonSerializer.Serialize(writer, document.RootElement);
                    }
#endif
                }
            }
        }

        Address IJsonModel<Address>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => JsonModelCreateCore(ref reader, options);

        protected virtual Address JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<Address>)this).GetFormatFromOptions(options) : options.Format;
            if (format != "J")
            {
                throw new FormatException($"The model {nameof(Address)} does not support reading '{format}' format.");
            }
            using JsonDocument document = JsonDocument.ParseValue(ref reader);
            return DeserializeAddress(document.RootElement, options);
        }

        internal static Address DeserializeAddress(JsonElement element, ModelReaderWriterOptions options)
        {
            if (element.ValueKind == JsonValueKind.Null)
            {
                return null;
            }
            string city = default;
            IDictionary<string, BinaryData> additionalBinaryDataProperties = default;
            foreach (var property in element.EnumerateObject())
            {
                if (property.NameEquals("city"u8))
                {
                    city = property.Value.GetString();
                    continue;
                }
                if (options.Format != "W")
                {
                    additionalBinaryDataProperties.Add(property.Name, BinaryData.FromString(property.Value.GetRawText()));
                }
            }
            return new Address(city, additionalBinaryDataProperties);
        }

        BinaryData IPersistableModel<Address>.Write(ModelReaderWriterOptions options) => PersistableModelWriteCore(options);

        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options)
        {
            var format = options.Format == "W" ? ((IPersistableModel<Address>)this).GetFormatFromOptions(options) : options.Format;

            switch (format)
            {
                case "J":
                    return ModelReaderWriter.Write(this, options);
                default:
                    throw new FormatException($"The model {nameof(Address)} does not support writing '{options.Format}' format.");
            }
        }

        Address IPersistableModel<Address>.Create(BinaryData data, ModelReaderWriterOptions options) => PersistableModelCreateCore(data, options);

        /// <param name="data"> The data to parse. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual Address PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<Address>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "J":
                    using (JsonDocument document = JsonDocument.Parse(data))
                    {
                        return DeserializeAddress(document.RootElement, options);
                    }
                default:
                    throw new FormatException($"The model {nameof(Address)} does not support reading '{options.Format}' format.");
            }
        }

        string IPersistableModel<Address>.GetFormatFromOptions(ModelReaderWriterOptions options) => "J";

        public static implicit operator BinaryContent(Address address)
        {
            if (address == null)
            {
                return null;
            }
            return BinaryContent.Create(address, ModelSerializationExtensions.WireOptions);
        }

        /// <param name="result"> The <see cref="ClientResult"/> to deserialize the <see cref="Address"/> from. </param>
        public static explicit operator Address(ClientResult result)
        {
            using PipelineResponse response = result.GetRawResponse();
            using JsonDocument document = JsonDocument.Parse(response.Content);
            return DeserializeAddress(document.RootElement, ModelSerializationExtensions.WireOptions);
        }
    }
}
```

</details>

<details>
<summary>Example Usage</summary>

```csharp
    var id = "123";
    Address address = new Address("X");
    
    var sampleJpgPath = Path.Combine("assets", "profileImage.jpg");
    await using var imageStream1 = File.OpenRead(sampleJpgPath);
    var profileImage = new MultiPartFile(imageStream1, "profileImage.jpg");

    var samplePngPath = Path.Combine("assets", "profileImage2.png");
    await using var imageStream2 = File.OpenRead(samplePngPath);
     var pictures = new List<MultiPartFile>()
     {
         new(imageStream1, "profileImage.jpg"),
         new(imageStream2, "profileImage2.png")
     };
    
    var request = new ComplexPartsRequest(id, address, profileImage, pictures);
    var response = await new MultiPartClient().FileArrayAndBasicAsync(request);
```

</details>

### When content-type of an operation is "multipart/form-data" and using "@multipartBody" decorator

#### Example Operation That Contains a Payload with a File Part and a Primitive Type Part

<details>
<summary>TypeSpec</summary>

```tsp
model MultiPartRequest {
  id: HttpPart<string>;
  profileImage: HttpPart<FileRequiredMetadata>;
}

model FileRequiredMetaData extends File {
  filename: string;
  contentType: string;
}

@post
@route("/parts")
op basic(
  @header contentType: "multipart/form-data",
  @multipartBody body: MultiPartRequest,
): NoContentResponse;
```

</details>

<details>
<summary>Client</summary>

```c#
public virtual async Task<ClientResult> BasicAsync(MultiPartRequest body, CancellationToken cancellationToken = default)
{
    Argument.AssertNotNull(body, nameof(body));

    using MultiPartFormDataBinaryContent content = body.ToMultipartContent();
    return await BasicAsync(content, content.ContentType, cancellationToken.CanBeCanceled ? new RequestOptions { CancellationToken = cancellationToken } : null).ConfigureAwait(false);
}
```

</details>

<details>
<summary>MultiPartRequest.cs</summary>

```c#
namespace Payload.MultiPart.Models
{
    public partial class MultiPartRequest
    {
        public MultiPartRequest(string id, FileRequiredMetaData profileImage)
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
<summary>MultiPartRequest.Serialization.cs</summary>

```c#
namespace Payload.MultiPart.Models
{
    public partial class MultiPartRequest : IPersistableStreamModel<MultiPartRequest>
    {
        private string _boundary;
        private string Boundary => _boundary ??= MultiPartFormDataBinaryContent.CreateBoundary();

        BinaryData IPersistableModel<MultiPartRequest>.Write(ModelReaderWriterOptions options) => PersistableModelWriteCore(options);
        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<MultiPartRequest>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "MPFD-ContentType":
                    return SerializeMultipartContentType();
                case "MPFD":
                    return SerializeMultipart();
                default:
                    throw new FormatException($"The model {nameof(MultiPartRequest)} does not support writing '{options.Format}' format.");
            }
        }

        void IPersistableStreamModel<MultiPartRequest>.Write(Stream stream, ModelReaderWriterOptions options) => PersistableModelWithStreamWriteCore(stream, options);
        protected virtual void PersistableModelWithStreamWriteCore(Stream stream, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<MultiPartRequest>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "MPFD":
                    SerializeMultipart(stream);
                    return;
                default:
                    throw new FormatException($"The model {nameof(MultiPartRequest)} does not support writing '{options.Format}' format.");
            }
        }

        MultiPartRequest IPersistableModel<MultiPartRequest>.Create(BinaryData data, ModelReaderWriterOptions options) => PersistableModelCreateCore(data, options);

        /// <param name="data"> The data to parse. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual MultiPartRequest PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<MultiPartRequest>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                default:
                    throw new FormatException($"The model {nameof(MultiPartRequest)} does not support reading '{options.Format}' format.");
            }
        }

        string IPersistableModel<MultiPartRequest>.GetFormatFromOptions(ModelReaderWriterOptions options) => "MPFD";

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
namespace Payload.MultiPart.Models
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
 var profileImage = new FileRequiredMetadata(imageStream, "image.jpg", "application/octet-stream");
 var request = new MultiPartRequest(id, profileImage);
 var response = await new MultiPartClient().BasicAsync(request);
```

</details>

#### Example Operation That Contains a Payload with Complex Parts

<details>
<summary>TypeSpec</summary>

```tsp
model ComplexPartsRequest {
  id: HttpPart<string>;
  address: HttpPart<Address>;
  profileImage: HttpPart<FileRequiredMetaData>;
  pictures: HttpPart<FileRequiredMetaData>[];
}

model Address {
  city: string;
}

model FileRequiredMetaData extends File {
  filename: string;
  contentType: string;
}

@post
@route("/complex-parts")
op fileArrayAndBasic(
    @header contentType: "multipart/form-data",
    @multipartBody body: ComplexPartsRequest,
): NoContentResponse;
```

</details>

<details>
<summary>Client</summary>

```c#
public virtual async Task<ClientResult> FileArrayAndBasicAsync(ComplexPartsRequest body, CancellationToken cancellationToken = default)
{
    Argument.AssertNotNull(body, nameof(body));

    using MultiPartFormDataBinaryContent content = body.ToMultipartContent();
    return await FileArrayAndBasicAsync(content, content.ContentType, cancellationToken.CanBeCanceled ? new RequestOptions { CancellationToken = cancellationToken } : null);
}
```

</details>

<details>
<summary>ComplexPartsRequest.cs</summary>

```c#
namespace Payload.MultiPart.Models
{
    namespace Payload.MultiPart.Models
    {
        public partial class ComplexPartsRequest
        {
            public ComplexPartsRequest(string id, Address address, FileRequiredMetaData profileImage, IEnumerable<FileRequiredMetaData> pictures)
            {
                Argument.AssertNotNull(id, nameof(id));
                Argument.AssertNotNull(address, nameof(address));
                Argument.AssertNotNull(profileImage, nameof(profileImage));
                Argument.AssertNotNull(pictures, nameof(pictures));
    
                Id = id;
                Address = address;
                ProfileImage = profileImage;
                Pictures = pictures.ToList();
            }
    
            public string Id { get; }
            public Address Address { get; }
            public FileRequiredMetaData ProfileImage { get; }
            public IList<FileRequiredMetaData> Pictures { get; }
        }
    }
}
```

</details>

<details>
<summary>ComplexPartsRequest.Serialization.cs</summary>

```c#
namespace Payload.MultiPart.Models
{
    public partial class ComplexPartsRequest : IPersistableStreamModel<ComplexPartsRequest>
    {
        private string _boundary;

        private string Boundary => _boundary ??= MultiPartFormDataBinaryContent.CreateBoundary();

        BinaryData IPersistableModel<ComplexPartsRequest>.Write(ModelReaderWriterOptions options) => PersistableModelWriteCore(options);
        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<ComplexPartsRequest>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "MPFD-ContentType":
                    return SerializeMultipartContentType();
                case "MPFD":
                    return SerializeMultipart();
                default:
                    throw new FormatException($"The model {nameof(ComplexPartsRequest)} does not support writing '{options.Format}' format.");
            }
        }

        void IPersistableStreamModel<ComplexPartsRequest>.Write(Stream stream, ModelReaderWriterOptions options) => PersistableModelWithStreamWriteCore(stream, options);
        protected virtual void PersistableModelWithStreamWriteCore(Stream stream, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<ComplexPartsRequest>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "MPFD":
                    SerializeMultipart(stream);
                    return;
                default:
                    throw new FormatException($"The model {nameof(ComplexPartsRequest)} does not support writing '{options.Format}' format.");
            }
        }

        ComplexPartsRequest IPersistableModel<ComplexPartsRequest>.Create(BinaryData data, ModelReaderWriterOptions options) => PersistableModelCreateCore(data, options);

        /// <param name="data"> The data to parse. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual ComplexPartsRequest PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<ComplexPartsRequest>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                default:
                    throw new FormatException($"The model {nameof(ComplexPartsRequest)} does not support reading '{options.Format}' format.");
            }
        }

        string IPersistableModel<ComplexPartsRequest>.GetFormatFromOptions(ModelReaderWriterOptions options) => "MPFD";
        internal MultiPartFormDataBinaryContent ToMultipartContent()
        {
            MultiPartFormDataBinaryContent content = new(Boundary);
            content.Add("id", Id);
            content.Add("address", Address);
            content.Add("profileImage", ProfileImage);

            foreach (var picture in Pictures)
            {
                content.Add("pictures", picture);
            }

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
<summary>Address.cs</summary>

```csharp
namespace Payload.MultiPart.Models
{
    public partial class Address
    {
        private protected readonly IDictionary<string, BinaryData> _additionalBinaryDataProperties;

        public Address(string city)
        {
            Argument.AssertNotNull(city, nameof(city));

            City = city;
        }

        internal Address(string city, IDictionary<string, BinaryData> additionalBinaryDataProperties)
        {
            City = city;
            _additionalBinaryDataProperties = additionalBinaryDataProperties;
        }

        public string City { get; }
    }
}
```

</details>

<details>
<summary>Address.Serialization.cs</summary>

```c#

namespace Payload.MultiPart.Models
{
    public partial class Address : IJsonModel<Address>
    {
        internal Address()
        {

        }

        void IJsonModel<Address>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            writer.WriteStartObject();
            JsonModelWriteCore(writer, options);
            writer.WriteEndObject();
        }

        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            var format = options.Format == "W" ? ((IPersistableModel<Address>)this).GetFormatFromOptions(options) : options.Format;
            if (format != "J")
            {
                throw new FormatException($"The model {nameof(Address)} does not support writing '{format}' format.");
            }

            writer.WritePropertyName("city"u8);
            writer.WriteStringValue(City);
            if (options.Format != "W" && _additionalBinaryDataProperties != null)
            {
                foreach (var item in _additionalBinaryDataProperties)
                {
                    writer.WritePropertyName(item.Key);
#if NET6_0_OR_GREATER
				    writer.WriteRawValue(item.Value);
#else
                    using (JsonDocument document = JsonDocument.Parse(item.Value))
                    {
                        JsonSerializer.Serialize(writer, document.RootElement);
                    }
#endif
                }
            }
        }

        Address IJsonModel<Address>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => JsonModelCreateCore(ref reader, options);

        protected virtual Address JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<Address>)this).GetFormatFromOptions(options) : options.Format;
            if (format != "J")
            {
                throw new FormatException($"The model {nameof(Address)} does not support reading '{format}' format.");
            }
            using JsonDocument document = JsonDocument.ParseValue(ref reader);
            return DeserializeAddress(document.RootElement, options);
        }

        internal static Address DeserializeAddress(JsonElement element, ModelReaderWriterOptions options)
        {
            if (element.ValueKind == JsonValueKind.Null)
            {
                return null;
            }
            string city = default;
            IDictionary<string, BinaryData> additionalBinaryDataProperties = default;
            foreach (var property in element.EnumerateObject())
            {
                if (property.NameEquals("city"u8))
                {
                    city = property.Value.GetString();
                    continue;
                }
                if (options.Format != "W")
                {
                    additionalBinaryDataProperties.Add(property.Name, BinaryData.FromString(property.Value.GetRawText()));
                }
            }
            return new Address(city, additionalBinaryDataProperties);
        }

        BinaryData IPersistableModel<Address>.Write(ModelReaderWriterOptions options) => PersistableModelWriteCore(options);

        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options)
        {
            var format = options.Format == "W" ? ((IPersistableModel<Address>)this).GetFormatFromOptions(options) : options.Format;

            switch (format)
            {
                case "J":
                    return ModelReaderWriter.Write(this, options);
                default:
                    throw new FormatException($"The model {nameof(Address)} does not support writing '{options.Format}' format.");
            }
        }

        Address IPersistableModel<Address>.Create(BinaryData data, ModelReaderWriterOptions options) => PersistableModelCreateCore(data, options);

        /// <param name="data"> The data to parse. </param>
        /// <param name="options"> The client options for reading and writing models. </param>
        protected virtual Address PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options)
        {
            string format = options.Format == "W" ? ((IPersistableModel<Address>)this).GetFormatFromOptions(options) : options.Format;
            switch (format)
            {
                case "J":
                    using (JsonDocument document = JsonDocument.Parse(data))
                    {
                        return DeserializeAddress(document.RootElement, options);
                    }
                default:
                    throw new FormatException($"The model {nameof(Address)} does not support reading '{options.Format}' format.");
            }
        }

        string IPersistableModel<Address>.GetFormatFromOptions(ModelReaderWriterOptions options) => "J";

        public static implicit operator BinaryContent(Address address)
        {
            if (address == null)
            {
                return null;
            }
            return BinaryContent.Create(address, ModelSerializationExtensions.WireOptions);
        }

        /// <param name="result"> The <see cref="ClientResult"/> to deserialize the <see cref="Address"/> from. </param>
        public static explicit operator Address(ClientResult result)
        {
            using PipelineResponse response = result.GetRawResponse();
            using JsonDocument document = JsonDocument.Parse(response.Content);
            return DeserializeAddress(document.RootElement, ModelSerializationExtensions.WireOptions);
        }
    }
}
```

</details>

<details>
<summary>FileRequiredMetaData.cs</summary>

```c#
namespace Payload.MultiPart.Models
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
    string id = "123";
    var address = new Address("X");

    var sampleJpgPath = Path.Combine("assets", "profileImage.jpg");
    await using var imageStream1 = File.OpenRead(sampleJpgPath);
    var profileImage = new FileRequiredMetaData(imageStream1, "profileImage.jpg", "application/octet-stream");
    
    var samplePngPath = Path.Combine("assets", "profileImage2.png");
    await using var imageStream2 = File.OpenRead(samplePngPath);
    var pictures = new List<FileRequiredMetaData>()
    {
        profileImage,
        new FileRequiredMetaData(imageStream2, "profileImage2.png", "application/octet-stream")
    };
    
    var request = new ComplexPartsRequest(id, address, profileImage, pictures);
    var response = await new FileArrayAndBasic(request);
```

</details>

### Updated MultiPartFormDataBinaryContent Internal Helper Type

<details>
<summary>MultiPartFormDataBinaryContent.cs</summary>

```csharp

namespace Payload.MultiPart;

internal partial class MultiPartFormDataBinaryContent : BinaryContent
{
    private readonly MultipartFormDataContent _multipartContent;

    private const int BoundaryLength = 70;
    private const string BoundaryValues = "0123456789=ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";

    public MultiPartFormDataBinaryContent() : this(CreateBoundary()) { }

    // CUSTOM: Internal ctor to use in model serialization
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
    public void Add(string name, MultiPartFile file)
    {
        Argument.AssertNotNullOrEmpty(name, nameof(name));
        Argument.AssertNotNull(file, nameof(file));

        if (file.File != null)
        {
            Add(name, file.File, file.Filename, file.ContentType);
            return;
        }
        else if (file.Contents != null)
        {
            Add(name, file.Contents, file.Filename, file.ContentType);
            return;
        }

        throw new InvalidOperationException("File contents are not set.");
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

    private static string CreateBoundary()
    {
        Span<char> chars = stackalloc char[BoundaryLength];

        byte[] random = new byte[BoundaryLength];
        lock (_random)
        {
            _random.NextBytes(random);
        }

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

## Proposed Emitter Updates

This section covers the proposed updates to the emitter to support generating the proposed convenience layer.

### Pass through TCGC `multipartOptions` for model properties

TCGC provides an API that captures the options for a multipart part within a [model property](https://github.com/microsoft/TypeSpec/blob/main/packages/http-client-csharp/emitter/src/type/input-type.ts#L101). The [multipartOptions](https://github.com/Azure/typespec-azure/blob/main/packages/typespec-client-generator-core/src/interfaces.ts#L485) can be captured for parts within a request model, detailing the information about each part.

The TCGC API contains the following:

| Property            | Type                    | Description                                                                                       |
|---------------------|-------------------------|---------------------------------------------------------------------------------------------------|
| isFilePart          | `bool`                  | Whether this part is for a file.                                                                  |
| isMulti             | `bool`                  | Whether this part should be serialized as multiple parts with the same wire name.                                                                  |
| defaultContentTypes | `string[]`              | Default content-types calculated by TypeSpec compiler. |

The emitter's `InputModelProperty` interface can be updated to include the options:

```ts
export interface InputModelProperty extends InputTypeBase {
  kind: "property";
  name: string;
  serializedName: string;
  type: InputType;
  optional: boolean;
  readOnly: boolean;
  discriminator: boolean;
  crossLanguageDefinitionId: string;
  flatten: boolean;
  multipartOptions?: MultipartOptions;
}
```

#### Example Emitted Code Model

```tsp

model MultiPartRequest {
  id: string;
  profileImage: bytes;
}

@post
@route("/parts")
op basic(
  @header contentType: "multipart/form-data",
  @body body: MultiPartRequest,
): NoContentResponse;
```

The `MultiPartRequest` model properties would contain the following emitted `multipartOptions` properties:

```json
{
  "properties": [
    {
      "name": "id",
      "multipartOptions": {
        "isFilePart": false,
        "isMulti": false,
        "defaultContentTypes": []
      }
    },
    {
      "name": "profileImage",
      "multipartOptions": {
        "isFilePart": true,
        "isMulti": false,
        "defaultContentTypes": []
      }
    },
  ]
}
```

### Error Handling

It is an error for the `@multipartBody` decorator to appear in an operation whose content type is not multipart. An error diagnostic should be logged if the emitter encounters this scenario.

## Follow-Ups

- Generated proposal for Azure clients.
