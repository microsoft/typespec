# Multipart-form Payload Generation Support

## Table of Contents

1. [Motivation](#motivation)
2. [System.ClientModel Updates](#systemclientmodel-updates)
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

## System.ClientModel Updates

A new type can be added to facilitate building multipart/form-data requests and provide a streamlined API for clients that need to send multipart payloads. This type eliminates the need for manual boundary management and complex multipart construction while maintaining full control over content types and part metadata.

```c#
public partial class MultiPartFormContent : System.ClientModel.BinaryContent
{
    public MultiPartFormContent() { }
    public MultiPartFormContent(string boundary) { }
    public void Add(string name, System.BinaryData content) { }
    public void Add(string name, bool content, string? mediaType = "text/plain") { }
    public void Add(string name, byte[] content, string? mediaType = "application/octet-stream") { }
    public void Add(string name, System.ClientModel.FileBinaryContent fileContent) { }
    public void Add(string name, decimal content, string? mediaType = "text/plain") { }
    public void Add(string name, double content, string? mediaType = "text/plain") { }
    public void Add(string name, int content, string? mediaType = "text/plain") { }
    public void Add(string name, long content, string? mediaType = "text/plain") { }
    public void Add(string name, float content, string? mediaType = "text/plain") { }
    public void Add(string name, string content, string? mediaType = "text/plain") { }
    public void Add<T>(string name, System.ClientModel.Primitives.IPersistableModel<T> model) { }
    public void Add<T>(string name, System.ClientModel.Primitives.IPersistableModel<T> model, System.ClientModel.Primitives.ModelReaderWriterOptions? options = null, System.ClientModel.Primitives.ModelReaderWriterContext? context = null, string? mediaType = null) { }
    public override void Dispose() { }
    public override bool TryComputeLength(out long length) { throw null; }
    public override void WriteTo(System.IO.Stream stream, System.Threading.CancellationToken cancellationToken = default(System.Threading.CancellationToken)) { }
    public override System.Threading.Tasks.Task WriteToAsync(System.IO.Stream stream, System.Threading.CancellationToken cancellationToken = default(System.Threading.CancellationToken)) { throw null; }
}
```

### File Part Type

To support generating a convenience layer for file parts in multipart/form-data requests, a new type can be added to the System.ClientModel library for use by generated clients. This type serves as the common representation for file parts within multipart requests.

```csharp
public partial class FileBinaryContent : System.ClientModel.BinaryContent
{
    public FileBinaryContent(System.BinaryData data, string? mediaType = "application/octet-stream") { }
    public FileBinaryContent(System.IO.Stream stream, string? mediaType = "application/octet-stream") { }
    public FileBinaryContent(string path, string? mediaType = "application/octet-stream") { }
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

    using MultiPartFormContent content = body.ToMultipartContent();
    return await UploadDogAsync(content, content.MediaType, cancellationToken.CanBeCanceled ? new RequestOptions { CancellationToken = cancellationToken } : null).ConfigureAwait(false);
}

public virtual ClientResult UploadDog(Dog body, CancellationToken cancellationToken = default)
{
    Argument.AssertNotNull(body, nameof(body));

    using MultiPartFormContent content = body.ToMultipartContent();
    return UploadDog(content, content.MediaType, cancellationToken.CanBeCanceled ? new RequestOptions { CancellationToken = cancellationToken } : null);
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
public partial class Dog
{
    internal Dog()
    {
    }

    public partial class Dog
    {

        internal MultiPartFormContent ToMultipartContent()
        {
            MultiPartFormContent content = new();
            content.Add("id", Id);
            content.Add("profileImage", ProfileImage);
            
            return content;
        }
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

 using MultiPartFormContent content = new();
 content.Add("id", "123");
 content.Add("profileImage", new FileBinaryContent("C:\\myDog.jpg"));

 ClientResult response = await client.UploadDogAsync(content, content.MediaType);
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

    using MultiPartFormContent content = body.ToMultipartContent();
    return UploadCat(content, content.MediaType, cancellationToken.CanBeCanceled ? new RequestOptions { CancellationToken = cancellationToken } : null);
}

public virtual async Task<ClientResult> UploadCatAsync(Cat body, CancellationToken cancellationToken = default)
{
    Argument.AssertNotNull(body, nameof(body));

    using MultiPartFormContent content = body.ToMultipartContent();
    return await UploadCatAsync(content, content.MediaType, cancellationToken.CanBeCanceled ? new RequestOptions { CancellationToken = cancellationToken } : null).ConfigureAwait(false);
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

        ProfileImage = new(profileImagePath, contentType)
        {
            Filename = filename,
        };

    }
    public Cat(string id, string filename, string contentType, Stream profileImage)
    {
        Argument.AssertNotNullOrEmpty(id, nameof(id));
        Argument.AssertNotNullOrEmpty(filename, nameof(filename));
        Argument.AssertNotNullOrEmpty(contentType, nameof(contentType));
        Argument.AssertNotNull(profileImage, nameof(profileImage));

        ProfileImage = new(profileImage, contentType)
        {
            Filename = filename,
        };
    }

    public Cat(string id, string filename, string contentType, BinaryData profileImage)
    {
        Argument.AssertNotNullOrEmpty(id, nameof(id));
        Argument.AssertNotNullOrEmpty(filename, nameof(filename));
        Argument.AssertNotNullOrEmpty(contentType, nameof(contentType));
        Argument.AssertNotNull(profileImage, nameof(profileImage));

        ProfileImage = new(profileImage, contentType)
        {
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
public partial class Cat
{
    internal Cat()
    {
    }

    internal MultiPartFormContent ToMultipartContent()
    {
        MultiPartFormContent content = new();
        content.Add("id", Id);
        content.Add("profileImage", ProfileImage);

        return content;
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

 using MultiPartFormContent content = new();
 content.Add("id", "123");
 content.Add("profileImage",
     new FileBinaryContent("C:\\myCat.jpg", "image/jpeg")
     {
         Filename = "myCat.jpg"
     });

 ClientResult response = await client.UploadCatAsync(content, content.MediaType);
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

    using MultiPartFormContent content = body.ToMultipartContent();
    return UploadPetDetails(content, content.MediaType, cancellationToken.CanBeCanceled ? new RequestOptions { CancellationToken = cancellationToken } : null);
}

public virtual async Task<ClientResult> UploadPetDetailsAsync(PetDetails body, CancellationToken cancellationToken = default)
{
    Argument.AssertNotNull(body, nameof(body));

    using MultiPartFormContent content = body.ToMultipartContent();
    return await UploadPetDetailsAsync(content, content.MediaType, cancellationToken.CanBeCanceled ? new RequestOptions { CancellationToken = cancellationToken } : null).ConfigureAwait(false);
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
public partial class PetDetails
{
    internal PetDetails()
    {
    }

    internal MultiPartFormContent ToMultipartContent()
    {
        MultiPartFormContent content = new MultiPartFormContent();
        content.Add("id", Id);
        content.Add("ownerName", OwnerName);
        content.Add("petName", PetName);
        content.Add("address", Address, ModelSerializationExtensions.WireOptions, new PetStoreContext());
        content.Add("profileImage", ProfileImage);

        return content;
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

using MultiPartFormContent content = new();
content.Add("id", "123");
content.Add("ownerName", "John Doe");
content.Add("petName", "Winston");
content.Add("address", new Address("123 Main St."));
content.Add("profileImage", new FileBinaryContent("C:\\winston.jpg"));

var response = await client.UploadPetDetailsAsync(content, content.MediaType);
```

</details>
