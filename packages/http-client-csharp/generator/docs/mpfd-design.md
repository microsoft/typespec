# Multipart-form Payload Generation Support

## Table of Contents

1. [Motivation](#motivation)
2. [System ClientModel & Azure.Core Updates](#system-clientmodel-and-azure.core-updates)
3. [Usage Examples](#usage-examples)

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

This document provides a proposal for a generated convenience layer to remove some of this burden from users focusing on unbranded clients,
but with the intention to provide support for both unbranded and azure branded libraries.

## Goals

- Provide discoverable convenience methods & APIs that simplify creating and sending multipart/form-data requests.

## System ClientModel and Azure.Core Updates

The BinaryContent & RequestContent classes are being extended with multipart/form-data capabilities to provide a streamlined API for building requests for clients that need to send multipart payloads. These additions eliminate the need for manual boundary management and complex multipart construction while maintaining full control over content types and part metadata.

### System.ClientModel

```c#
public abstract partial class BinaryContent : System.IDisposable
{
    // Add ContentType property
    public virtual string? ContentType { get { throw null; } set { } }

    // Add APIs for creating MPFD parts and payload.
    public static System.ClientModel.BinaryContent CreateMultipartFormDataContent(System.Collections.Generic.IEnumerable<System.ClientModel.BinaryContent> parts) { throw null; }
    public static System.ClientModel.BinaryContent CreateMultipartFormDataContent(string boundary, System.Collections.Generic.IEnumerable<System.ClientModel.BinaryContent> parts) { throw null; }
    public static System.ClientModel.BinaryContent CreateMultipartFormDataPart(string name, System.BinaryData content) { throw null; }
    public static System.ClientModel.BinaryContent CreateMultipartFormDataPart(string name, bool content) { throw null; }
    public static System.ClientModel.BinaryContent CreateMultipartFormDataPart(string name, byte[] content) { throw null; }
    public static System.ClientModel.BinaryContent CreateMultipartFormDataPart(string name, System.ClientModel.FileBinaryContent content) { throw null; }
    public static System.ClientModel.BinaryContent CreateMultipartFormDataPart(string name, decimal content) { throw null; }
    public static System.ClientModel.BinaryContent CreateMultipartFormDataPart(string name, double content) { throw null; }
    public static System.ClientModel.BinaryContent CreateMultipartFormDataPart(string name, int content) { throw null; }
    public static System.ClientModel.BinaryContent CreateMultipartFormDataPart(string name, long content) { throw null; }
    public static System.ClientModel.BinaryContent CreateMultipartFormDataPart(string name, float content) { throw null; }
    public static System.ClientModel.BinaryContent CreateMultipartFormDataPart(string name, string content) { throw null; }
    public static System.ClientModel.BinaryContent CreateMultipartFormDataPart<T>(string name, T model, System.ClientModel.Primitives.ModelReaderWriterOptions? options = null) where T : System.ClientModel.Primitives.IPersistableModel<T> { throw null; }
}
```

### Azure.Core

```c#
public abstract partial class RequestContent : System.IDisposable
{
    // Add ContentType property
    public virtual string? ContentType { get { throw null; } set { } }

    // Add APIs for creating MPFD parts and payload.
    public static Azure.Core.RequestContent CreateMultipartFormDataContent(System.Collections.Generic.IEnumerable<Azure.Core.RequestContent> parts) { throw null; }
    public static Azure.Core.RequestContent CreateMultipartFormDataContent(string boundary, System.Collections.Generic.IEnumerable<Azure.Core.RequestContent> parts) { throw null; }
    public static Azure.Core.RequestContent CreateMultipartFormDataPart(string name, Azure.Core.FileRequestContent content) { throw null; }
    public static Azure.Core.RequestContent CreateMultipartFormDataPart(string name, System.BinaryData content) { throw null; }
    public static Azure.Core.RequestContent CreateMultipartFormDataPart(string name, bool content) { throw null; }
    public static Azure.Core.RequestContent CreateMultipartFormDataPart(string name, byte[] content) { throw null; }
    public static Azure.Core.RequestContent CreateMultipartFormDataPart(string name, decimal content) { throw null; }
    public static Azure.Core.RequestContent CreateMultipartFormDataPart(string name, double content) { throw null; }
    public static Azure.Core.RequestContent CreateMultipartFormDataPart(string name, int content) { throw null; }
    public static Azure.Core.RequestContent CreateMultipartFormDataPart(string name, long content) { throw null; }
    public static Azure.Core.RequestContent CreateMultipartFormDataPart(string name, float content) { throw null; }
    public static Azure.Core.RequestContent CreateMultipartFormDataPart(string name, string content) { throw null; }
}
```

### File Part Type

To support generating a convenience layer for file parts described in a TypeSpec request, new convenience model type can be added to the System.ClientModel & Azure.Core libraries, to be consumed by generated clients. This new type can serve as the common type for file parts within a request.

#### System.ClientModel

```csharp
public sealed partial class FileBinaryContent : System.ClientModel.BinaryContent
{
    public FileBinaryContent(System.BinaryData data) { }
    public FileBinaryContent(System.IO.Stream stream) { }
    public FileBinaryContent(string path) { }
    public override string? ContentType { get { throw null; } set { } }
    public string? Filename { get { throw null; } set { } }
    public override void Dispose() { }
    public override bool TryComputeLength(out long length) { throw null; }
    public override void WriteTo(System.IO.Stream stream, System.Threading.CancellationToken cancellationToken = default(System.Threading.CancellationToken)) { }
    public override System.Threading.Tasks.Task WriteToAsync(System.IO.Stream stream, System.Threading.CancellationToken cancellationToken = default(System.Threading.CancellationToken)) { throw null; }
}
```

#### Azure.Core


```csharp
public sealed partial class FileRequestContent : Azure.Core.RequestContent
{
    public FileRequestContent(System.BinaryData data) { }
    public FileRequestContent(System.IO.Stream stream) { }
    public FileRequestContent(string path) { }
    public override string? ContentType { get { throw null; } set { } }
    public string? Filename { get { throw null; } set { } }
    public override void Dispose() { }
    public override bool TryComputeLength(out long length) { throw null; }
    public override void WriteTo(System.IO.Stream stream, System.Threading.CancellationToken cancellationToken = default(System.Threading.CancellationToken)) { }
    public override System.Threading.Tasks.Task WriteToAsync(System.IO.Stream stream, System.Threading.CancellationToken cancellationToken = default(System.Threading.CancellationToken)) { throw null; }
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

    using BinaryContent content = body.ToMultipartContent();
    return await UploadDogAsync(content, content.ContentType, cancellationToken.CanBeCanceled ? new RequestOptions { CancellationToken = cancellationToken } : null).ConfigureAwait(false);
}

public virtual ClientResult UploadDog(Dog body, CancellationToken cancellationToken = default)
{
    Argument.AssertNotNull(body, nameof(body));

    using BinaryContent content = body.ToMultipartContent();
    return UploadDog(content, content.ContentType, cancellationToken.CanBeCanceled ? new RequestOptions { CancellationToken = cancellationToken } : null);
}
```

</details>

<details>
<summary>Dog.cs</summary>

```c#
public partial class Dog
{
    public Dog(string id, string profileImagePath)
    {
        Argument.AssertNotNull(id, nameof(id));
        Argument.AssertNotNull(profileImagePath, nameof(profileImagePath));

        Id = id;
        ProfileImage = new(profileImagePath);

    }
    public Dog(string id, Stream profileImage)
    {
        Argument.AssertNotNull(id, nameof(id));
        Argument.AssertNotNull(profileImage, nameof(profileImage));

        Id = id;
        ProfileImage = new(profileImage);
    }

    public Dog(string id, BinaryData profileImage)
    {
        Argument.AssertNotNull(id, nameof(id));
        Argument.AssertNotNull(profileImage, nameof(profileImage));

        Id = id;
        ProfileImage = new(profileImage);
    }

    public Dog(string id, FileBinaryContent profileImage)
    {
        Argument.AssertNotNull(id, nameof(id));
        Argument.AssertNotNull(profileImage, nameof(profileImage));

        Id = id;
        ProfileImage = profileImage;
    }

    public string Id { get; }
    public FileBinaryContent ProfileImage { get; }
}
```

</details>

<details>
<summary>Dog.Serialization.cs</summary>

```c#
public partial class Dog : IPersistableModel<Dog>
{
    internal Dog()
    {
    }

    private string _boundary;

    BinaryData IPersistableModel<Dog>.Write(ModelReaderWriterOptions options) => PersistableModelWriteCore(options);
    protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options)
    {
        string format = options.Format == "W" ? ((IPersistableModel<Dog>)this).GetFormatFromOptions(options) : options.Format;
        switch (format)
        {
            case "MPFD":
                return SerializeMultipart();
            default:
                throw new FormatException($"The model {nameof(Dog)} does not support writing '{options.Format}' format.");
        }
    }

    Dog IPersistableModel<Dog>.Create(BinaryData data, ModelReaderWriterOptions options) => PersistableModelCreateCore(data, options);


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

    internal BinaryContent ToMultipartContent()
    {
        List<BinaryContent> parts = [];
        parts.Add(BinaryContent.CreateMultipartFormDataPart("id", Id));
        parts.Add(BinaryContent.CreateMultipartFormDataPart("profileImage", ProfileImage));

        return BinaryContent.CreateMultipartFormDataContent(parts);
    }

    private BinaryData SerializeMultipart()
    {
        using MemoryStream stream = new MemoryStream();
        using BinaryContent content = ToMultipartContent();

        content.WriteTo(stream);
        if (stream.CanSeek)
        {
            stream.Seek(0, SeekOrigin.Begin);
        }
        return BinaryData.FromStream(stream);
    }
}

```

</details>

<details>
<summary>Convenience Example Usage</summary>

```csharp
PetStoreClient client = new PetStoreClient();

Dog dog = new Dog("123", "C:\\myDog.jpg");
ClientResult response = await client.UploadDogAsync(dog);
```

</details>

<details>
<summary>Protocol Example Usage</summary>

```csharp
 PetStoreClient client = new PetStoreClient();

 List<BinaryContent> parts = [];
 parts.Add(BinaryContent.CreateMultipartFormDataPart("id", "123"));
 parts.Add(BinaryContent.CreateMultipartFormDataPart("profileImage", new FileBinaryContent("C:\\myDog.jpg")));

 using BinaryContent content = BinaryContent.CreateMultipartFormDataContent(parts);
 ClientResult response = await client.UploadDogAsync(content, content.ContentType);
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

    using BinaryContent content = body.ToMultipartContent();
    return UploadCat(content, content.ContentType, cancellationToken.CanBeCanceled ? new RequestOptions { CancellationToken = cancellationToken } : null);
}

public virtual async Task<ClientResult> UploadCatAsync(Cat body, CancellationToken cancellationToken = default)
{
    Argument.AssertNotNull(body, nameof(body));

    using BinaryContent content = body.ToMultipartContent();
    return await UploadCatAsync(content, content.ContentType, cancellationToken.CanBeCanceled ? new RequestOptions { CancellationToken = cancellationToken } : null).ConfigureAwait(false);
}
```

</details>

<details>
<summary>Cat.cs</summary>

```c#
public partial class Cat
{
    public Cat(string id, string filename, string contentType, string profileImagePath)
    {
        Argument.AssertNotNullOrEmpty(id, nameof(id));
        Argument.AssertNotNullOrEmpty(filename, nameof(filename));
        Argument.AssertNotNullOrEmpty(contentType, nameof(contentType));
        Argument.AssertNotNullOrEmpty(profileImagePath, nameof(profileImagePath));

        ProfileImage = new(profileImagePath)
        {
            ContentType = contentType,
            Filename = filename,
        };

    }
    public Cat(string id, string filename, string contentType, Stream profileImage)
    {
        Argument.AssertNotNullOrEmpty(id, nameof(id));
        Argument.AssertNotNullOrEmpty(filename, nameof(filename));
        Argument.AssertNotNullOrEmpty(contentType, nameof(contentType));
        Argument.AssertNotNull(profileImage, nameof(profileImage));

        ProfileImage = new(profileImage)
        {
            ContentType = contentType,
            Filename = filename,
        };
    }

    public Cat(string id, string filename, string contentType, BinaryData profileImage)
    {
        Argument.AssertNotNullOrEmpty(id, nameof(id));
        Argument.AssertNotNullOrEmpty(filename, nameof(filename));
        Argument.AssertNotNullOrEmpty(contentType, nameof(contentType));
        Argument.AssertNotNull(profileImage, nameof(profileImage));

        ProfileImage = new(profileImage)
        {
            ContentType = contentType,
            Filename = filename,
        };
    }

    public string Id { get; }
    public FileBinaryContent ProfileImage { get; }
}
```

</details>

<details>
<summary>Cat.Serialization.cs</summary>

```c#
public partial class Cat : IPersistableModel<Cat>
{
    internal Cat()
    {
    }

    BinaryData IPersistableModel<Cat>.Write(ModelReaderWriterOptions options) => PersistableModelWriteCore(options);
    protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options)
    {
        string format = options.Format == "W" ? ((IPersistableModel<Cat>)this).GetFormatFromOptions(options) : options.Format;
        switch (format)
        {
            case "MPFD":
                return SerializeMultipart();
            default:
                throw new FormatException($"The model {nameof(Cat)} does not support writing '{options.Format}' format.");
        }
    }

    Cat IPersistableModel<Cat>.Create(BinaryData data, ModelReaderWriterOptions options) => PersistableModelCreateCore(data, options);

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

    internal BinaryContent ToMultipartContent()
    {
        List<BinaryContent> parts = [];
        parts.Add(BinaryContent.CreateMultipartFormDataPart("id", Id));
        parts.Add(BinaryContent.CreateMultipartFormDataPart("profileImage", ProfileImage));

        return BinaryContent.CreateMultipartFormDataContent(parts);
    }

    private BinaryData SerializeMultipart()
    {
        using MemoryStream stream = new MemoryStream();
        using BinaryContent content = ToMultipartContent();

        content.WriteTo(stream);
        if (stream.CanSeek)
        {
            stream.Seek(0, SeekOrigin.Begin);
        }
        return BinaryData.FromStream(stream);
    }
}
```

</details>

<details>
<summary>Convenience Example Usage</summary>

```csharp
 PetStoreClient client = new PetStoreClient();

 Cat cat = new Cat("123", "myCat.jpg", "image/jpeg", "C:\\myCat.jpg");
 ClientResult response = await client.UploadCatAsync(cat);
```

</details>

<details>
<summary>Protocol Example Usage</summary>

```csharp
 PetStoreClient client = new PetStoreClient();

 List<BinaryContent> parts = [];
 parts.Add(BinaryContent.CreateMultipartFormDataPart("id", "123"));
 parts.Add(BinaryContent.CreateMultipartFormDataPart(
     "profileImage",
     new FileBinaryContent("C:\\myCat.jpg")
     {
         ContentType = "image/jpeg",
         Filename = "myCat.jpg"
     }));

 using BinaryContent content = BinaryContent.CreateMultipartFormDataContent(parts);
 ClientResult response = await client.UploadCatAsync(content, content.ContentType);
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
    @multipartBody body: PetDetails,
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

    using BinaryContent content = body.ToMultipartContent();
    return UploadPetDetails(content, content.ContentType, cancellationToken.CanBeCanceled ? new RequestOptions { CancellationToken = cancellationToken } : null);
}

public virtual async Task<ClientResult> UploadPetDetailsAsync(PetDetails body, CancellationToken cancellationToken = default)
{
    Argument.AssertNotNull(body, nameof(body));

    using BinaryContent content = body.ToMultipartContent();
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
    public PetDetails(string id, string ownerName, string petName, Address address, string profileImagePath)
    {
        Argument.AssertNotNullOrEmpty(id, nameof(id));
        Argument.AssertNotNullOrEmpty(ownerName, nameof(ownerName));
        Argument.AssertNotNullOrEmpty(petName, nameof(petName));
        Argument.AssertNotNull(address, nameof(address));
        Argument.AssertNotNull(profileImagePath, nameof(profileImagePath));

        Id = id;
        OwnerName = ownerName;
        PetName = petName;
        Address = address;
        ProfileImage = new(profileImagePath);

    }
    public PetDetails(string id, string ownerName, string petName, Address address, Stream profileImage)
    {
        Argument.AssertNotNullOrEmpty(id, nameof(id));
        Argument.AssertNotNullOrEmpty(ownerName, nameof(ownerName));
        Argument.AssertNotNullOrEmpty(petName, nameof(petName));
        Argument.AssertNotNull(address, nameof(address));
        Argument.AssertNotNull(profileImage, nameof(profileImage));

        Id = id;
        OwnerName = ownerName;
        PetName = petName;
        Address = address;
        ProfileImage = new(profileImage);
    }

    public PetDetails(string id, string ownerName, string petName, Address address, BinaryData profileImage)
    {
        Argument.AssertNotNullOrEmpty(id, nameof(id));
        Argument.AssertNotNullOrEmpty(ownerName, nameof(ownerName));
        Argument.AssertNotNullOrEmpty(petName, nameof(petName));
        Argument.AssertNotNull(address, nameof(address));
        Argument.AssertNotNull(profileImage, nameof(profileImage));

        Id = id;
        OwnerName = ownerName;
        PetName = petName;
        Address = address;
        ProfileImage = new(profileImage);
    }

    public PetDetails(string id, string ownerName, string petName, Address address, FileBinaryContent profileImage)
    {
        Argument.AssertNotNullOrEmpty(id, nameof(id));
        Argument.AssertNotNullOrEmpty(ownerName, nameof(ownerName));
        Argument.AssertNotNullOrEmpty(petName, nameof(petName));
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
    public FileBinaryContent ProfileImage { get; }
}
```

</details>

<details>
<summary>PetDetails.Serialization.cs</summary>

```c#
public partial class PetDetails : IPersistableModel<PetDetails>
{
    internal PetDetails()
    {
    }

    BinaryData IPersistableModel<PetDetails>.Write(ModelReaderWriterOptions options) => PersistableModelWriteCore(options);
    protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options)
    {
        string format = options.Format == "W" ? ((IPersistableModel<PetDetails>)this).GetFormatFromOptions(options) : options.Format;
        switch (format)
        {
            case "MPFD":
                return SerializeMultipart();
            default:
                throw new FormatException($"The model {nameof(PetDetails)} does not support writing '{options.Format}' format.");
        }
    }


    PetDetails IPersistableModel<PetDetails>.Create(BinaryData data, ModelReaderWriterOptions options) => PersistableModelCreateCore(data, options);

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

    internal BinaryContent ToMultipartContent()
    {
        List<BinaryContent> parts = [];
        parts.Add(BinaryContent.CreateMultipartFormDataPart("id", Id));
        parts.Add(BinaryContent.CreateMultipartFormDataPart("ownerName", OwnerName));
        parts.Add(BinaryContent.CreateMultipartFormDataPart("petName", PetName));
        parts.Add(BinaryContent.CreateMultipartFormDataPart("address", Address));
        parts.Add(BinaryContent.CreateMultipartFormDataPart("profileImage", ProfileImage));

        return BinaryContent.CreateMultipartFormDataContent(parts);
    }

    private BinaryData SerializeMultipart()
    {
        using MemoryStream stream = new MemoryStream();
        using BinaryContent content = ToMultipartContent();

        content.WriteTo(stream);
        if (stream.CanSeek)
        {
            stream.Seek(0, SeekOrigin.Begin);
        }
        return BinaryData.FromStream(stream);
    }
}
```

</details>

<details>
<summary>Convenience Example Usage</summary>

```csharp
PetStoreClient client = new PetStoreClient();

PetDetails petDetails = new PetDetails(
    "123",
    "John Doe",
    "Winston",
    new Address("123 Main St."),
    "C:\\winston.jpg");

var response = await client.UploadPetDetailsAsync(petDetails);
```

</details>

<details>
<summary>Protocol Example Usage</summary>

```csharp
 PetStoreClient client = new PetStoreClient();

 List<BinaryContent> parts = [];
 parts.Add(BinaryContent.CreateMultipartFormDataPart("id", "123"));
 parts.Add(BinaryContent.CreateMultipartFormDataPart("ownerName", "John Doe"));
 parts.Add(BinaryContent.CreateMultipartFormDataPart("petName", "Winston"));
 parts.Add(BinaryContent.CreateMultipartFormDataPart("address", new Address("123 Main St.")));
 parts.Add(BinaryContent.CreateMultipartFormDataPart("profileImage", new FileBinaryContent("C:\\winston.jpg")));

 using BinaryContent content = BinaryContent.CreateMultipartFormDataContent(parts);
 var response = await client.UploadPetDetailsAsync(content, content.ContentType);
```

</details>
