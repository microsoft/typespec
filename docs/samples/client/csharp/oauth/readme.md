# Guide for CSharp Oath

This guide is intended to assist with creating custom client constructor to support the OAuth token.

## Table of contents

  - [Creating a client with OAuth Token](#create-custom-client-constructor-to-support-oauth-token)
  - Example implementation of AuthenticationTokenProvider
  - Example usage of AuthenticationTokenProvider and Custom Client

### Create custom client constructor to support OAuth token
This constructor initializes a new instance of the UnbrandedTypeSpecClient class, and sets a client pipeline with OAuth2 bearer token authentication using the provided AuthenticationTokenProvider and endpoint uri.

```csharp
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

