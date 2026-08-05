This diagnostic is issued when an authentication scheme cannot be represented by the selected Java client flavor.

## Impact

The generated client may omit the scheme or fall back to a less specific credential type.

## ❌ Incorrect Usage

### API key outside a header

```typespec
@service
@useAuth(ApiKeyAuth<ApiKeyLocation.query, "api-key">)
namespace Contoso;
```

### Basic authentication for an Azure client

```typespec
@service
@useAuth(BasicAuth)
namespace Contoso;
```

```yaml
options:
  "@typespec/http-client-java":
    flavor: azure
```

## Diagnostic Message

The message identifies the unsupported scheme, location, or flavor. For example:

```text
ApiKey auth is currently only supported for ApiKeyLocation.header.
```

## ✅ How to Fix

Use OAuth2 authentication.

```typespec
@service
@useAuth(OAuth2Auth<[OAuthFlow]>)
namespace Contoso;

model OAuthFlow {
  type: OAuth2FlowType.clientCredentials;
  tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token";
  scopes: ["https://contoso.com/.default"];
}
```

## Suppression

Do not suppress this warning unless custom code will provide the intended authentication behavior.
