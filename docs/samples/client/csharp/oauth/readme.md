# Authentication using AuthenticationTokenProvider

This readme is intended to demonstrate using the authentication token provider.

## Table of contents

- [Creating a client with OAuth Token](#create-custom-client-constructor-to-support-oauth-token)
- Example implementation of AuthenticationTokenProvider
- Example usage of AuthenticationTokenProvider and Custom Client

### Create custom client constructor to support OAuth token

This constructor initializes a new instance of the `SampleTypeSpecClient` class and sets a client pipeline with OAuth2 bearer token authentication using the provided `AuthenticationTokenProvider` and endpoint URI.

```csharp
using System.ClientModel;
using System.ClientModel.Primitives;

/// <summary>
/// Customize client to add custom constructor.
/// </summary>
public partial class SampleTypeSpecClient
{
  public SampleTypeSpecClient(Uri uri, AuthenticationTokenProvider credential)
  {
      _endpoint = uri;
      var options = new ClientPipelineOptions();
      Pipeline = ClientPipeline.Create(
          options,
          perCallPolicies: ReadOnlySpan<PipelinePolicy>.Empty,
          perTryPolicies: [new OAuth2BearerTokenAuthenticationPolicy(credential, flows)],
          beforeTransportPolicies: ReadOnlySpan<PipelinePolicy>.Empty
      );
  }
}
```

The full code is available [here](https://github.com/microsoft/typespec/blob/main/packages/http-client-csharp/generator/TestProjects/Local/Unbranded-TypeSpec/src/Custom/UnbrandedTypeSpecClient.cs).
