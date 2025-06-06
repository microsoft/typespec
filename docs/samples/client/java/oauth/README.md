# OAuth 2.0 Credential Support

This guide provides example implementations of OAuth 2.0 credentials to enable secure authentication in clients generated by TypeSpec.
With this approach, you can define OAuth 2.0 authentication directly in your TypeSpec files and supply custom credential implementations for a smooth, end-to-end authentication flow.

For more details, refer to the TypeSpec documentation: [Oauth2Auth](https://typespec.io/docs/libraries/http/reference/js-api/interfaces/oauth2auth/)

- [OAuth 2.0 Credential Support](#oauth-20-credential-support)
  - [Generate a client with OAuth2Auth](#generate-a-client-with-oauth2auth)
  - [Example implementation of OAuthTokenCredential](#example-implementation-of-oauthtokencredential)
  - [Example usage of OAuthTokenCredential and Custom Client](#example-usage-of-oauthtokencredential-and-custom-client)

### Generate a client with OAuth2Auth

In your TypeSpec, create a client using the `OAuth2Auth` flow:

```typespec
import "@typespec/http";

using TypeSpec.Http;

@useAuth(
  OAuth2Auth<[
    {
      type: OAuth2FlowType.clientCredentials,
      tokenUrl: "https://tokenUrl",
      scopes: ["scope"],
    }
  ]>
)
@service(#{ title: "Example Server API" })
@server("https://endpoint", "Example Server Endpoint")
namespace ExampleServer {
  model Result {
    value: string;
  }

  // Test API endpoint
  @route("/api/getValue")
  @get
  op getResult(): Result[];
}
```

### Example implementation of OAuthTokenCredential

Below is an example implementation of the `OAuthTokenCredential` class that supports the client credentials flow. This sample should be modified to meet your needs, including:

- Choosing the appropriate OAuth flow.
- Choosing the appropriate JSON library for your project. Jackson is used here only as an example.
- Appropriate error handling and logging.

```java
public class TestCredential implements OAuthTokenCredential {

    private String clientId;
    private String clientSecret;

    public TestCredential setClientId(String clientId) {
        this.clientId = clientId;
        return this;
    }

    public TestCredential setClientSecret(String clientSecret) {
        this.clientSecret = clientSecret;
        return this;
    }

    @Override
    public AccessToken getToken(OAuthTokenRequestContext request) {
        // This may also use a library from an IDP. This implementation simply performs the OAuth client credential flow.
        try {
            ObjectMapper mapper = new ObjectMapper();
            // get the first auth flow

            List<Map<String, String>> authFlows = mapper.readValue((String) request.getParams().get("auth_flows"), new TypeReference<List<Map<String, String>>>() {});
            // just use the first one
            String tokenUrl = authFlows.get(0).get("tokenUrl");
            String scope = authFlows.get(0).get("scopes");
            HttpClient client = getHttpClient(); // assumes a path in your environment to handle client pooling, etc.
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(tokenUrl))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString("grant_type=client_credentials&client_id=" + clientId + "&client_secret=" + clientSecret + "&scope=" + scope))
                    .build();

            HttpResponse<String> response = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                Map<String, Object> responseBody = mapper.readValue(response.body(), Map.class);
                String accessToken = (String)responseBody.get("access_token");
                return new AccessToken(accessToken, OffsetDateTime.now().plusSeconds((Integer)responseBody.get("expires_in")));
            } else {
                throw new RuntimeException("Failed to get token: " + response.body());
            }
        } catch (Exception e) {
            throw new RuntimeException("Exception occurred while getting token", e);
        }
    }
}
```

### Example usage of OAuthTokenCredential and Custom Client

This example demonstrates how to use the `AuthenticationTokenProvider` with the custom client constructor to authenticate and make a request to the API.

```java
TestCredential credential = new TestCredential().setClientId("myClientId").setClientSecret("myClientSecret");
var client = new ExampleServerClientBuilder().credential(credential).build();
client.getResult();
```
