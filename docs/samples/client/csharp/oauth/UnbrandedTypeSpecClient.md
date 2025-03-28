### Create custom client with unbranded token

#### To create custom client with Uri and ApiKeyCredential

```csharp
/// <summary>
/// Initializes a new instance of the <see cref="UnbrandedTypeSpecClient"/> class.
/// </summary>
/// <param name="uri">The URI of the service.</param>
/// <param name="credential">The ApiKeyCredential.</param>
public FooClient(Uri endpoint, ApiKeyCredential keyCredential)
public UnbrandedTypeSpecClient(Uri endpoint, ApiKeyCredential keyCredential)
{
}
```

A code sample demonstrating creating a custom client with an ApiKeyCredential can be found [here](https://github.com/microsoft/typespec/blob/main/packages/http-client-csharp/generator/TestProjects/Local/Unbranded-TypeSpec/src/Generated/UnbrandedTypeSpecClient.cs#L37).

#### To create custom client with Uri and AuthenticationTokenProvider

```csharp
/// <summary>
/// Initializes a new instance of the <see cref="UnbrandedTypeSpecClient"/> class.
/// </summary>
/// <param name="uri">The URI of the service.</param>
/// <param name="credential">The authentication token provider.</param>
public UnbrandedTypeSpecClient(Uri uri, AuthenticationTokenProvider credential)
{
    var options = new ClientPipelineOptions();
    Pipeline = ClientPipeline.Create(
        options,
        perCallPolicies: ReadOnlySpan<PipelinePolicy>.Empty,
        perTryPolicies: [new OAuth2BearerTokenAuthenticationPolicy(credential, flows)],
        beforeTransportPolicies: ReadOnlySpan<PipelinePolicy>.Empty
    );
}
```

TODO: insert link here after PR gets merged
