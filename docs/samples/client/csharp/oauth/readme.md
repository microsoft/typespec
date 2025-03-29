# Authentication using AuthenticationTokenProvider

This readme is intended to demonstrate using the authentication token provider.

## Table of contents

- [Creating a client with OAuth Token](#create-custom-client-constructor-to-support-oauth-token)
- Example implementation of AuthenticationTokenProvider
- Example usage of AuthenticationTokenProvider and Custom Client

### Create custom client constructor to support OAuth token

This constructor initializes a new instance of the `SampleTypeSpecClient` class and sets a client pipeline with OAuth2 bearer token authentication using the provided `AuthenticationTokenProvider` and endpoint URI.

```csharp
public SampleTypeSpecClient(Uri uri, AuthenticationTokenProvider credential)
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
