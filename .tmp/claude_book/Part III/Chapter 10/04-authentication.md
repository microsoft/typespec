# Authentication

Authentication is a critical aspect of most HTTP APIs, ensuring that only authorized clients can access protected resources. TypeSpec provides robust features for modeling authentication requirements in your API, creating clear contracts about how clients should authenticate with your service.

## Understanding Authentication in TypeSpec

The TypeSpec HTTP library includes built-in models and decorators for common authentication schemes. These make it easy to define authentication requirements at various levels in your API, from service-wide defaults to operation-specific overrides.

## The `@useAuth` Decorator

The primary way to specify authentication in TypeSpec is the `@useAuth` decorator, which can be applied at different levels:

```typespec
import "@typespec/http";
using TypeSpec.Http;

// Service-level authentication
@service
@useAuth(BearerAuth)
namespace SecureAPI;

// Interface-level authentication
@useAuth(ApiKeyAuth<ApiKeyLocation.header, "X-API-Key">)
@route("/resources")
interface Resources {
  // Operations inherit this authentication
}

// Operation-level authentication
@route("/public")
interface PublicEndpoints {
  // This operation requires no authentication
  @useAuth(NoAuth)
  @get
  getPublicData(): PublicData;

  // This operation requires OAuth2
  @useAuth(OAuth2Auth<[ResourceScope.read]>)
  @get
  @route("/protected")
  getProtectedData(): ProtectedData;
}
```

The `@useAuth` decorator accepts authentication models that describe the authentication mechanism required.

## Common Authentication Models

The TypeSpec HTTP library provides models for standard authentication schemes:

### No Authentication

```typespec
@useAuth(NoAuth)
@route("/public")
interface PublicResources {
  @get
  getPublicData(): PublicData;
}
```

The `NoAuth` model explicitly indicates that no authentication is required. This is useful for public endpoints or to override a service-level authentication requirement.

### HTTP Basic Authentication

```typespec
@useAuth(BasicAuth)
@route("/basic-auth")
interface BasicAuthResources {
  @get
  getProtectedData(): ProtectedData;
}
```

The `BasicAuth` model represents HTTP Basic Authentication, requiring username and password credentials.

### Bearer Token Authentication

```typespec
@useAuth(BearerAuth)
@route("/bearer-auth")
interface BearerAuthResources {
  @get
  getProtectedData(): ProtectedData;
}
```

The `BearerAuth` model represents authentication using a bearer token in the `Authorization` header, commonly used with OAuth2 and JWT.

### API Key Authentication

```typespec
// API key in header
@useAuth(ApiKeyAuth<ApiKeyLocation.header, "X-API-Key">)
@route("/api-key")
interface ApiKeyResources {
  @get
  getProtectedData(): ProtectedData;
}

// API key in query parameter
@useAuth(ApiKeyAuth<ApiKeyLocation.query, "api_key">)
@route("/api-key-query")
interface ApiKeyQueryResources {
  @get
  getProtectedData(): ProtectedData;
}

// API key in cookie
@useAuth(ApiKeyAuth<ApiKeyLocation.cookie, "api_key">)
@route("/api-key-cookie")
interface ApiKeyCookieResources {
  @get
  getProtectedData(): ProtectedData;
}
```

The `ApiKeyAuth` model is a template that requires two parameters:

1. The location of the API key (header, query, or cookie)
2. The name of the header, query parameter, or cookie

### OAuth 2.0 Authentication

```typespec
@useAuth(
  OAuth2Auth<[ResourceScope.read, ResourceScope.write], [ImplicitFlow, AuthorizationCodeFlow]>
)
@route("/oauth2")
interface OAuth2Resources {
  @get
  getProtectedData(): ProtectedData;
}

// Define the required scopes
enum ResourceScope {
  read: "resource:read",
  write: "resource:write",
  admin: "resource:admin",
}
```

The `OAuth2Auth` model represents OAuth 2.0 authentication with:

1. Required OAuth2 scopes (first template parameter)
2. Supported OAuth2 flows (second template parameter)

### OpenID Connect Authentication

```typespec
@useAuth(OpenIdConnectAuth<"https://login.example.com/.well-known/openid-configuration">)
@route("/openid")
interface OpenIdResources {
  @get
  getProtectedData(): ProtectedData;
}
```

The `OpenIdConnectAuth` model represents OpenID Connect authentication, requiring the OpenID Connect URL.

## Combining Multiple Authentication Methods

TypeSpec allows you to specify multiple authentication options using union types:

```typespec
@useAuth(BearerAuth | ApiKeyAuth<ApiKeyLocation.header, "X-API-Key">)
@route("/flexible-auth")
interface FlexibleAuthResources {
  @get
  getProtectedData(): ProtectedData;
}
```

This example allows clients to authenticate using either a bearer token or an API key.

## Operation-Specific Authentication

Sometimes different operations require different authentication. You can override service or interface-level authentication at the operation level:

```typespec
@service
@useAuth(BearerAuth)
namespace MyService {
  @route("/resources")
  interface Resources {
    // This operation uses the default bearer authentication
    @get
    listResources(): Resource[];

    // This operation requires no authentication
    @useAuth(NoAuth)
    @get
    @route("/public")
    getPublicResource(): Resource;

    // This operation requires admin scope
    @useAuth(OAuth2Auth<[AdminScope.full]>)
    @delete
    @route("/{id}")
    deleteResource(@path id: string): void;
  }
}

enum AdminScope {
  full: "admin:full",
}
```

This flexibility allows you to design APIs with fine-grained authentication requirements.

## Custom Authentication Schemes

For custom authentication schemes, you can create your own authentication models:

```typespec
model CustomAuth {
  type: AuthType.http;
  scheme: "Custom";
}

@useAuth(CustomAuth)
@route("/custom-auth")
interface CustomAuthResources {
  @get
  getProtectedData(): ProtectedData;
}
```

Custom authentication models should include a `type` property with an appropriate `AuthType` value.

## OAuth 2.0 Scopes and Flows

TypeSpec provides detailed models for OAuth 2.0 authentication, allowing you to specify required scopes and supported flows:

```typespec
enum UserScope {
  read: "user:read",
  write: "user:write",
  admin: "user:admin",
}

@route("/users")
interface Users {
  // Read operation requires read scope
  @useAuth(OAuth2Auth<[UserScope.read]>)
  @get
  listUsers(): User[];

  // Write operation requires write scope
  @useAuth(OAuth2Auth<[UserScope.write]>)
  @post
  createUser(@body user: User): User;

  // Admin operation requires admin scope
  @useAuth(OAuth2Auth<[UserScope.admin]>)
  @delete
  @route("/{id}")
  deleteUser(@path id: string): void;
}
```

You can also specify which OAuth 2.0 flows are supported:

```typespec
@useAuth(
  OAuth2Auth<
    [UserScope.read, UserScope.write],
    [
      AuthorizationCodeFlow<
        "https://auth.example.com/oauth2/authorize",
        "https://auth.example.com/oauth2/token"
      >,
      ClientCredentialsFlow<"https://auth.example.com/oauth2/token">
    ]
  >
)
@route("/oauth2-detailed")
interface OAuth2DetailedResources {
  @get
  getProtectedData(): ProtectedData;
}
```

This example specifies:

1. Required scopes (`UserScope.read` and `UserScope.write`)
2. Support for both authorization code and client credentials flows
3. The authorization and token endpoints for each flow

## Authentication Error Responses

When designing APIs with authentication, it's important to define appropriate error responses. TypeSpec's HTTP library includes predefined response types for authentication errors:

```typespec
@route("/protected")
interface ProtectedResources {
  @useAuth(BearerAuth)
  @get
  getSecretData(): {
    @statusCode(200)
    @body
    data: SecretData;
  } | UnauthorizedResponse | ForbiddenResponse;
}
```

This example explicitly models the authentication error responses:

- `UnauthorizedResponse` (401) for missing or invalid credentials
- `ForbiddenResponse` (403) for valid authentication but insufficient permissions

## Documenting Authentication Requirements

It's good practice to document authentication requirements using the `@doc` decorator:

```typespec
@doc("API for managing user data")
@useAuth(
  @doc("Bearer token authentication with JWT")
  BearerAuth
)
@route("/users")
interface Users {
  @doc("List all users (requires admin role)")
  @useAuth(
    @doc("OAuth2 authentication with admin scope")
    OAuth2Auth<[UserScope.admin]>
  )
  @get
  listUsers(): User[];
}
```

Clear documentation helps API consumers understand how to correctly authenticate with your service.

## API Key Management Example

Here's a more complete example of an API that both requires API keys and allows managing them:

```typespec
@service
@useAuth(ApiKeyAuth<ApiKeyLocation.header, "X-API-Key">)
namespace KeyManagementService;

model ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: utcDateTime;
  expiresAt?: utcDateTime;
  lastUsed?: utcDateTime;
}

model ApiKeyCreateRequest {
  name: string;
  expiresInDays?: int32;
}

model ApiKeyCreateResponse {
  id: string;
  name: string;
  key: string; // Full key, only returned at creation
  prefix: string;
  createdAt: utcDateTime;
  expiresAt?: utcDateTime;
}

@route("/api-keys")
interface ApiKeys {
  // List API keys
  @get
  listApiKeys(): ApiKey[];

  // Create a new API key
  @post
  createApiKey(@body request: ApiKeyCreateRequest): ApiKeyCreateResponse;

  // Delete an API key
  @delete
  @route("/{id}")
  deleteApiKey(@path id: string): void;

  // Test the authentication
  @get
  @route("/test")
  testAuthentication(): {
    authenticated: true;
    keyId: string;
  };
}
```

This example shows an API that both uses API key authentication and allows managing those API keys.

## Multi-Tenant Authentication Example

For multi-tenant services, you might need to combine authentication schemes:

```typespec
@service
namespace MultiTenantService;

model TenantAuth {
  @header("X-Tenant-ID") tenantId: string;
}

@useAuth(BearerAuth & TenantAuth)
@route("/tenants/{tenantId}/resources")
interface TenantResources {
  @get
  listResources(@path tenantId: string): Resource[];

  @post
  createResource(@path tenantId: string, @body resource: ResourceCreate): Resource;
}
```

This example requires both a bearer token for user authentication and a tenant ID header for tenant identification.

## Best Practices for Authentication in TypeSpec

When designing authentication in TypeSpec, consider these best practices:

1. **Apply authentication at the highest appropriate level** to avoid repetition:

   ```typespec
   @service
   @useAuth(BearerAuth)
   namespace SecureAPI;
   ```

2. **Be explicit about public endpoints** using `NoAuth`:

   ```typespec
   @useAuth(NoAuth)
   @get
   getPublicData(): PublicData;
   ```

3. **Use appropriate authentication schemes** for your API's security requirements:

   - Simple internal APIs: API keys
   - User-facing APIs: OAuth2 or OpenID Connect
   - Legacy systems: Basic Authentication (with HTTPS)

4. **Document authentication requirements** clearly with `@doc`:

   ```typespec
   @doc("Requires administrator privileges")
   @useAuth(OAuth2Auth<[AdminScope.full]>)
   ```

5. **Define authentication scopes** using enums for better structure and documentation:

   ```typespec
   enum UserScope {
     read: "user:read",
     write: "user:write",
   }
   ```

6. **Include appropriate authentication error responses** in your operation return types:

   ```typespec
   | UnauthorizedResponse
   | ForbiddenResponse
   ```

7. **Consider security implications** of your authentication choices, especially when using less secure methods like API keys.

8. **Be consistent with authentication schemes** across your API for better developer experience.

By following these practices, you'll create secure, usable APIs with clear authentication requirements that guide clients to implement correct authentication logic.
