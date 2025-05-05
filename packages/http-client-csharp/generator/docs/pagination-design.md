# Support pagination in unbranded libraries

TypeSpec recently added [support for pagination](https://typespec.io/docs/standard-library/pagination/) that allows services to define APIs that return a paginated collection of results.

There are two types of pagination:
- Client driven pagination
- Server driven pagination

A service can choose to support either or both of these pagination types.

## Client driven pagination

This type allows the client to control the pagination behavior. The client maintains the necessary state to request the next set of results from the server. TypeSpec supports configuring the following in a client request:
- Page Size - number of items in a page
- Page Index - the page number
- Offset - number of items to skip

## Server driven pagination

The server can return additional metadata along with the results to inform the client how to fetch the next set of results. The metadata can contain
a continuation token or a set of links that can let the client fetch first, last, next or previous page.


## Pagination in unbranded client libraries 

### System.ClientModel types
```c#
public abstract class CollectionResult<T> : CollectionResult, IEnumerable<T>, IEnumerable
{
    protected internal CollectionResult() { }
    public IEnumerator<T> GetEnumerator() { throw null; }
    protected abstract IEnumerable<T> GetValuesFromPage(ClientResult page);
    IEnumerable.GetEnumerator() { throw null; }
}

public abstract class AsyncCollectionResult<T> : AsyncCollectionResult, IAsyncEnumerable<T>
{
    protected internal AsyncCollectionResult() { }
    public IAsyncEnumerator<T> GetAsyncEnumerator(CancellationToken cancellationToken = default(CancellationToken)) { throw null; }
    protected abstract AsyncEnumerable<T> GetValuesFromPageAsync(ClientResult page);
}

public abstract class CollectionResult
{
    protected CollectionResult() { }
    public abstract ContinuationToken? GetContinuationToken(ClientResult page);
    public abstract IEnumerable<ClientResult> GetRawPages();
}

public abstract partial class AsyncCollectionResult
{
    protected AsyncCollectionResult() { }
    public abstract ContinuationToken? GetContinuationToken(ClientResult page);
    public abstract IAsyncEnumerable<ClientResult> GetRawPagesAsync();
}

public partial class ContinuationToken
{
    protected ContinuationToken() { }
    protected ContinuationToken(BinaryData bytes) { }
    public static ContinuationToken FromBytes(BinaryData bytes) { throw null; }
    public virtual BinaryData ToBytes() { throw null; }
}
```

### Server driven with nextLink
#### TypeSpec
```ts
@list op listPets(@query @pageSize perPage?: int32): {
  @pageItems pets: Pet[];
  @nextLink next?: url;
};
```
#### Client APIs

```c#
public class PetClient 
{
    // protocol methods
    public virtual CollectionResult GetPets(int? perPage = default(int?), RequestOptions options = default(RequestOptions));
    public virtual AsyncCollectionResult GetPets(int? perPage = default(int?), RequestOptions options = default(RequestOptions));
    
    // convenience methods
    public virtual CollectionResult<Pet> GetPets(int? perPage = default(int?), CancellationToken cancellationToken = default(CancellationToken));
    public virtual AsyncCollectionResult<Pet> GetPetsAsync(int? perPage = default(int?), CancellationToken cancellationToken = default(CancellationToken));
}

internal class GetPetsCollectionResult : CollectionResult, CollectionResult<Pet>, AsyncCollectionResult, AsyncCollectionResult<T>
{
    public GetPetsCollectionResult(ClientPipeline pipeline, Uri endpoint, int? perPage, CancellationToken cancellationToken);
    public override ContinuationToken? GetContinuationToken(ClientResult page);
    public override IEnumerable<ClientResult> GetRawPages();
    public override async IAsyncEnumerable<ClientResult> GetRawPagesAsync();
    protected override IEnumerable<Pet> GetValuesFromPage(ClientResult page);
    protected override AsyncEnumerable<Pet> GetValuesFromPageAsync(ClientResult page);
}

internal class GetPetsCollectionResultPage : IJsonModel<InnerModel>
{
    public IList<Pet> Pets { get; }
    public Uri Next { get; }
    public static explicit operator GetPetsCollectionResultPage(ClientResult result);
}
```

#### Example Client Usage

```c#
PetClient client = new(...);

// sync convenience usage
foreach (Pet p in client.GetPets()) { ... }

// async convenience usage
await foreach (Pet p in client.GetPetsAsync(perPage: 20)) { ... }

// sync protocol usage
foreach (ClientResult page in client.GetPets(perPage: 10, options: requestOptions)) { ... }

// async protocol usage
await foreach (ClientResult page in client.GetPetsAsync(options: requestOptions)) { ... }
```

#### Example Client Implementation

```c#
public class PetClient 
{
    // protocol methods
    public virtual CollectionResult GetPets(int? perPage = default(int?), RequestOptions options = default(RequestOptions));
    public virtual AsyncCollectionResult GetPets(int? perPage = default(int?), RequestOptions options = default(RequestOptions));
     
    // convenience methods
    public virtual CollectionResult<Pet> GetPets(int? perPage = default(int?), CancellationToken cancellationToken = default(CancellationToken));
    public virtual AsyncCollectionResult<Pet> GetPetsAsync(int? perPage = default(int?), CancellationToken cancellationToken = default(CancellationToken));
}

internal class GetPetsCollectionResult : CollectionResult<Pet>, AsyncCollectionResult<T>
{
    private readonly Uri _endpoint;
    private readonly ClientPipeline _pipeline;
    private readonly int? _perPage;
    private readonly RequestOptions _options;

    public GetPetsCollectionResult(ClientPipeline pipeline, Uri endpoint, int? perPage, RequestOptions options)
    {
        _pipeline = pipeline;
        _endpoint = endpoint;
        _perPage = perPage;
        _cancellationToken = cancellationToken;
    }
    public override ContinuationToken? GetContinuationToken(ClientResult page)
    {
        // either return null or possibly get bytes from next link and use to initialize ContinuationToken?
        return default(ContinuationToken?); 
    }

    public override IEnumerable<ClientResult> GetRawPages()
    {
        Uri nextPageUri = GetInitialPageUri();
        while(nextPageUri != null)
        {
            CreatePageRequest(nextPageUri);
            ClientResult result = ClientResult.FromResponse(await Pipeline.ProcessMessageAsync(message, options).ConfigureAwait(false));
            yield return result;
            nextPageUri = GetNextLinkUriFromClientResult(result);
        }
    }
    public override async IAsyncEnumerable<ClientResult> GetRawPagesAsync()
    {
        Uri nextPageUri = GetInitialPageUri();
        while(nextPageUri != null)
        {
            CreatePageRequest(nextPageUri);
            ClientResult result = ClientResult.FromResponse(Pipeline.ProcessMessage(message, options));
            yield return result;
            nextPageUri = GetNextLinkUriFromClientResult(result);
        }
    }
    protected override IEnumerable<Pet> GetValuesFromPage(ClientResult page)
    {
        return ((GetPetsCollectionResultPage)page).Pets;
    }

    protected override AsyncEnumerable<Pet> GetValuesFromPageAsync(ClientResult page) => GetValuesFromPage(page).ToAsyncEnumerable();

    private Uri GetInitialPageUri()
    {
        ClientUriBuilder uri = new ClientUriBuilder();
        uri.Reset(_endpoint);
        uri.AppendPath("/pet", false);
        if(_perPage.HasValue)
        {
            uri.AppendQuery("perPage", _perPage.Value);
        }
    }

    private PipelineMessage CreatePageRequest(Uri pageUri)
    {
        PipelineMessage message = Pipeline.CreateMessage();
        message.ResponseClassifier = PipelineMessageClassifier200;
        PipelineRequest request = message.Request;
        request.Method = "GET";
        request.Uri = pageUri;
        message.Apply(_options);
        return message;
    }

    private Uri GetNextLinkFromClientResult(ClientResult page)
    {
        ((GetPetsCollectionResultPage)page).Next;
    }
}

internal class GetPetsCollectionResultPage : IJsonModel<InnerModel>
{
    public IList<Pet> Pets { get; }
    public Uri Next { get; }
    public static explicit operator GetPetsCollectionResultPage(ClientResult result);
}
```

### Server driven pagination with @continuationToken

#### TypeSpec
```ts
@list op listPetStores(@query string zipCode, @continuationToken @header string continuationToken?): {
  @pageItems petStores: PetStore[];
  @continuationToken continuationToken?: string;
};
```

#### Client APIs
```c#
public class PetStoreClient 
{
    // protocol methods
    public virtual CollectionResult GetPetStores(string zipCode = default(string), string continuationToken = default(string), RequestOptions options = default(RequestOptions));
    public virtual AsyncCollectionResult GetPetStoresAsync((string zipCode = default(string), string continuationToken = default(string), RequestOptions options = default(RequestOptions));

    // convenience methods
    public virtual CollectionResult<PetStore> GetPetStores(string zipCode = default(string), string continuationToken = default(string), CancellationToken cancellationToken = default(CancellationToken));
    public virtual AsyncCollectionResult<PetStore> GetPetStoresAsync((string zipCode = default(string), string continuationToken = default(string), CancellationToken cancellationToken = default(CancellationToken));
}

internal class GetPetStoresCollectionResult : CollectionResult<PetStore>, AsyncCollectionResult<PetStore>
{
    public GetPetStoresCollectionResult(ClientPipeline pipeline, Uri endpoint, int? perPage, CancellationToken cancellationToken);
    public override ContinuationToken? GetContinuationToken(ClientResult page);
    public override IEnumerable<ClientResult> GetRawPages();
    public override async IAsyncEnumerable<ClientResult> GetRawPagesAsync();
    protected override IEnumerable<PetStore> GetValuesFromPage(ClientResult page);
    protected override AsyncEnumerable<PetStore> GetValuesFromPageAsync(ClientResult page);
}

internal class GetPetStoresCollectionResultPage : IJsonModel<InnerModel>
{
    public IList<PetStore> PetStores { get; }
    public string ContinuationToken { get; }
    public static explicit operator GetPetStoresCollectionResultPage(ClientResult result);
}
```

#### Example Usage
```c#
PetStoreClient client = new(...);

// sync convenience usage
foreach (PetStore s in client.GetPetStores()) { ... }

// async convenience usage
await foreach (PetStore s in client.GetPetStoresAsync(zipCode: "98052")) { ... }

// sync protocol usage
foreach (ClientResult page in client.GetPetStores(zipCode: "10001", options: requestOptions)) { ... }

// async protocol usage
await foreach (ClientResult page in client.GetPetStoresAsync(options: requestOptions)) { ... }
```

#### Example Implementation

### Client driven with page size and page index or Offset

#### TypeSpec
```ts
@list op listPetToys(@query @offset offset?: int32, @query @pageIndex page?: int32, @query @pageSize perPage?: int32): {
  @pageItems pets: Pet[];
};
```

#### Client APIs
```c#
public class PetStoreClient 
{
    // protocol methods
    public virtual CollectionResult GetPetToys(int? offset = default(int?), int? pagesize = default(int?), RequestOptions options = default(RequestOptions));
    public virtual AsyncCollectionResult GetPetToysAsync(int? offset = default(int?), int? pagesize = default(int?), RequestOptions options = default(RequestOptions));
    public virtual CollectionResult GetPetToys(int? pageIndex = default(int?), int? pagesize = default(int?), RequestOptions options = default(RequestOptions));
    public virtual AsyncCollectionResult GetPetToysAsync(int? pageIndex = default(int?), int? pagesize = default(int?), RequestOptions options = default(RequestOptions));

    // convenience methods
    public virtual CollectionResult<PetToy> GetPetToys(int? offset = default(int?), int? pagesize = default(int?), CancellationToken cancellationToken = default(CancellationToken));
    public virtual AsyncCollectionResult<PetToy> GetPetToysAsync(int? offset = default(int?), int? pagesize = default(int?), CancellationToken cancellationToken = default(CancellationToken));
    public virtual CollectionResult<PetToy> GetPetToys(int? pageIndex = default(int?), int? pagesize = default(int?), CancellationToken cancellationToken = default(CancellationToken));
    public virtual AsyncCollectionResult<PetToy> GetPetToysAsync(int? pageIndex = default(int?), int? pagesize = default(int?), CancellationToken cancellationToken = default(CancellationToken));
}

internal class GetPetToysCollectionResult : CollectionResult<PetToy>, AsyncCollectionResult<PetToy>
{
    public GetPetToysCollectionResult(ClientPipeline pipeline, Uri endpoint, int? perPage, CancellationToken cancellationToken);
    public override ContinuationToken? GetContinuationToken(ClientResult page);
    public override IEnumerable<ClientResult> GetRawPages();
    public override async IAsyncEnumerable<ClientResult> GetRawPagesAsync();
    protected override IEnumerable<PetToy> GetValuesFromPage(ClientResult page);
    protected override AsyncEnumerable<PetToy> GetValuesFromPageAsync(ClientResult page);
}

internal class GetPetToysCollectionResultPage : IJsonModel<InnerModel>
{
    public IList<PetToys> PetToys { get; }
    public string ContinuationToken { get; }
    public static explicit operator GetPetToysCollectionResultPage(ClientResult result);
}
```


#### Example Usage
```c#
PetStoreClient client = new(...);

// sync convenience usage
foreach (PetToy t in client.GetPetStores()) { ... }

// async convenience usage
await foreach (Pet p in client.GetPetStoresAsync(zipCode: "98052")) { ... }

// sync protocol usage
foreach (ClientResult page in client.GetPetStores(zipCode: "10001", options: requestOptions)) { ... }

// async protocol usage
await foreach (ClientResult page in client.GetPetStoresAsync(options: requestOptions)) { ... }
```
