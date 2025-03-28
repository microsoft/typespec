### Create custom client constructor to support OAuth token
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
