# Authentication and Authorization Patterns

## Introduction to API Security

Security is a critical aspect of any API design. A well-designed API must protect sensitive data and operations while providing appropriate access to authorized users. In this section, we'll explore how to implement authentication and authorization in TypeSpec REST APIs.

## Authentication vs. Authorization

Before diving into implementation details, it's important to understand the distinction between authentication and authorization:

- **Authentication**: Verifies the identity of a client (who you are)
- **Authorization**: Determines what actions an authenticated client is allowed to perform (what you can do)

## Common Authentication Mechanisms

### Bearer Token Authentication

Bearer tokens (often JWT tokens) are a common authentication mechanism for REST APIs:

```typespec
@route("/products")
interface Products {
  @get
  @header("Authorization", "Bearer {token}")
  list(): Product[];
}
```

### API Key Authentication

API keys are another common authentication method:

```typespec
@route("/products")
interface Products {
  @get
  @header("X-API-Key")
  list(): Product[];
}
```

### Basic Authentication

Basic authentication uses a username and password:

```typespec
@route("/products")
interface Products {
  @get
  @header("Authorization", "Basic {credentials}")
  list(): Product[];
}
```

## Implementing Authentication in TypeSpec

### Using Security Definitions

TypeSpec's REST library provides a way to define security schemes:

```typespec
import "@typespec/rest";

using TypeSpec.Rest;

namespace APIAuth;

@securityType
model BearerAuth {
  @header authorization: string;
}

@securityType
model ApiKeyAuth {
  @header apiKey: string;
}
```

### Applying Security to Operations

Once defined, security schemes can be applied to operations:

```typespec
@route("/products")
@useAuth(APIAuth.BearerAuth)
interface Products {
  @get
  list(): Product[];

  @post
  create(@body product: ProductCreateRequest): Product;
}
```

### Multiple Authentication Options

APIs can support multiple authentication methods:

```typespec
@route("/products")
@useAuth(APIAuth.BearerAuth | APIAuth.ApiKeyAuth)
interface Products {
  @get
  list(): Product[];
}
```

### Operation-Specific Authentication

Different operations can have different authentication requirements:

```typespec
@route("/products")
interface Products {
  @get
  list(): Product[];

  @post
  @useAuth(APIAuth.BearerAuth)
  create(@body product: ProductCreateRequest): Product;
}
```

## OAuth 2.0 and OpenID Connect

### OAuth 2.0 Flow Types

OAuth 2.0 is a widely used authorization framework that TypeSpec can describe:

```typespec
import "@typespec/rest";

using TypeSpec.Rest;

namespace Security;

@doc("OAuth 2.0 Authorization Code flow")
@securityType
model OAuth2Auth {
  @doc("OAuth 2.0 Authorization")
  @header
  authorization: string;
}

@doc("OAuth 2.0 configuration")
model OAuth2Config {
  type: "oauth2";
  flows: OAuthFlows;
}

model OAuthFlows {
  @doc("Authorization Code flow configuration")
  authorizationCode?: OAuth2AuthorizationCodeFlow;

  @doc("Client Credentials flow configuration")
  clientCredentials?: OAuth2ClientCredentialsFlow;
}

model OAuth2AuthorizationCodeFlow {
  authorizationUrl: string;
  tokenUrl: string;
  scopes: Record<string>;
}

model OAuth2ClientCredentialsFlow {
  tokenUrl: string;
  scopes: Record<string>;
}
```

### Defining OAuth Scopes

OAuth scopes define the permissions a token grants:

```typespec
namespace Security;

enum ProductScopes {
  `products.read`,
  `products.write`,
}

@route("/products")
interface Products {
  @get
  @useAuth(OAuth2Auth, ProductScopes.read)
  list(): Product[];

  @post
  @useAuth(OAuth2Auth, ProductScopes.write)
  create(@body product: ProductCreateRequest): Product;
}
```

## Authorization Patterns

### Role-Based Access Control (RBAC)

RBAC assigns permissions to roles and users to roles:

```typespec
namespace Security;

enum Role {
  Admin,
  Editor,
  Viewer,
}

@error
model ForbiddenError {
  code: "Forbidden";
  message: string;
  requiredRole?: Role;
}

@route("/products")
interface Products {
  @get
  @useAuth(BearerAuth, Role.Viewer | Role.Editor | Role.Admin)
  @error(ForbiddenError, 403)
  list(): Product[];

  @post
  @useAuth(BearerAuth, Role.Editor | Role.Admin)
  @error(ForbiddenError, 403)
  create(@body product: ProductCreateRequest): Product;

  @delete
  @useAuth(BearerAuth, Role.Admin)
  @error(ForbiddenError, 403)
  deleteAll(): void;
}
```

### Attribute-Based Access Control (ABAC)

ABAC makes access decisions based on attributes:

```typespec
namespace Security;

model AccessPolicy {
  effect: "Allow" | "Deny";
  actions: string[];
  resources: string[];
  conditions?: Record<unknown>;
}

@error
model AccessDeniedError {
  code: "AccessDenied";
  message: string;
  requiredPolicy?: AccessPolicy;
}

@route("/organizations/{orgId}/products")
interface OrganizationProducts {
  @get
  @useAuth(BearerAuth)
  @error(AccessDeniedError, 403)
  list(@path orgId: string): Product[];
}
```

## Handling Authentication Errors

Define standard authentication errors:

```typespec
@error
model UnauthorizedError {
  code: "Unauthorized";
  message: string;
  scheme?: string;
}

@error
model ForbiddenError {
  code: "Forbidden";
  message: string;
  requiredPermission?: string;
}

@route("/products")
interface Products {
  @get
  @useAuth(BearerAuth)
  @error(UnauthorizedError, 401)
  @error(ForbiddenError, 403)
  list(): Product[];
}
```

## Multi-Tenant API Design

### Tenant Identification

Identify tenants in multi-tenant APIs:

```typespec
@route("/tenants/{tenantId}/products")
interface TenantProducts {
  @get
  @useAuth(BearerAuth)
  @error(UnauthorizedError, 401)
  @error(ForbiddenError, 403)
  list(@path tenantId: string): Product[];
}
```

### Tenant Isolation

Ensure proper tenant isolation:

```typespec
model TenantResource {
  @key
  id: string;

  @visibility("read", "create")
  tenantId: string;

  // Other properties
}

@route("/tenants/{tenantId}/resources")
interface TenantResources {
  @get
  @useAuth(BearerAuth)
  list(@path tenantId: string): TenantResource[];

  @post
  @useAuth(BearerAuth)
  create(@path tenantId: string, @body resource: TenantResource): TenantResource;
}
```

## API Keys Management

### API Key Structure

Define the structure of API keys:

```typespec
model ApiKey {
  @key
  id: string;

  @secret
  key: string;

  name: string;
  created: utcDateTime;
  lastUsed?: utcDateTime;
  expiresAt?: utcDateTime;
  scopes: string[];
}
```

### API Key Operations

Define operations for managing API keys:

```typespec
@route("/api-keys")
interface ApiKeys {
  @get
  @useAuth(BearerAuth)
  list(): ApiKey[];

  @post
  @useAuth(BearerAuth)
  create(@body request: ApiKeyCreateRequest): ApiKey;

  @delete
  @useAuth(BearerAuth)
  @path("/{id}")
  delete(@path id: string): void;
}
```

## Identity Integration

### User Identity

Represent user identity in your API:

```typespec
model User {
  @key
  id: string;

  @visibility("read")
  email: string;

  displayName: string;
  roles: Role[];
  created: utcDateTime;
}

@route("/users")
interface Users {
  @get
  @useAuth(BearerAuth, Role.Admin)
  list(): User[];

  @get
  @path("/me")
  @useAuth(BearerAuth)
  getCurrentUser(): User;
}
```

### Service-to-Service Authentication

Define patterns for service-to-service authentication:

```typespec
@securityType
model ServiceAuth {
  @header("X-Service-Auth") token: string;
}

@route("/internal/metrics")
@useAuth(ServiceAuth)
interface InternalMetrics {
  @get
  collect(): MetricsData;
}
```

## Secrets and Sensitive Data

### Marking Sensitive Properties

Use decorators to mark sensitive properties:

```typespec
@secret
scalar Password extends string;

model User {
  username: string;

  @secret
  password: Password;
}
```

### Redacting Sensitive Data

Define patterns for redacting sensitive data:

```typespec
model ApiKey {
  @key
  id: string;

  @secret
  @visibility("create")
  key: string;
}

@route("/api-keys")
interface ApiKeys {
  @post
  create(@body request: ApiKeyRequest): ApiKey;
}
```

## Audit Logging

### Audit Events

Define audit events for security-relevant operations:

```typespec
model AuditEvent {
  timestamp: utcDateTime;
  actor: string;
  action: string;
  resource: string;
  resourceId: string;
  result: "Success" | "Failure";
  details?: Record<unknown>;
}

@route("/audit-logs")
interface AuditLogs {
  @get
  @useAuth(BearerAuth, Role.Admin)
  list(): AuditEvent[];
}
```

## Security Headers

### Common Security Headers

Document security headers in your API:

```typespec
@route("/products")
interface Products {
  @get
  @header("Content-Security-Policy")
  @header("X-Content-Type-Options", "nosniff")
  @header("X-Frame-Options", "DENY")
  @header("X-XSS-Protection", "1; mode=block")
  list(): {
    @statusCode _: 200;
    @body products: Product[];
    @header("Cache-Control") cacheControl: string;
  };
}
```

## Rate Limiting and Throttling

### Rate Limit Headers

Define rate limit headers:

```typespec
@route("/products")
interface Products {
  @get
  @error(RateLimitError, 429)
  list(): {
    @statusCode _: 200;
    @body products: Product[];
    @header("X-RateLimit-Limit") limit: int32;
    @header("X-RateLimit-Remaining") remaining: int32;
    @header("X-RateLimit-Reset") resetTime: int32;
  };
}
```

### Rate Limit Errors

Define rate limit errors:

```typespec
@error
model RateLimitError {
  code: "RateLimitExceeded";
  message: string;

  @header("Retry-After")
  retryAfter: int32;
}
```

## Secure Webhooks

### Webhook Authentication

Define webhook authentication patterns:

```typespec
model Webhook {
  @key
  id: string;

  url: string;
  events: string[];

  @secret
  secret: string;
}

@route("/webhooks")
interface Webhooks {
  @post
  @useAuth(BearerAuth)
  create(@body webhook: WebhookCreateRequest): Webhook;
}
```

### Webhook Payload Signing

Document webhook payload signing:

```typespec
model WebhookPayload {
  @header("X-Webhook-Signature") signature: string;
  @body event: WebhookEvent;
}

model WebhookEvent {
  id: string;
  type: string;
  timestamp: utcDateTime;
  data: Record<unknown>;
}
```

## Best Practices for API Security

1. **Use HTTPS**: Always use HTTPS for all API endpoints.

2. **Token-Based Authentication**: Prefer token-based authentication over API keys for user authentication.

3. **Short-Lived Tokens**: Use short-lived access tokens with refresh tokens for long-term access.

4. **Principle of Least Privilege**: Grant only the permissions necessary for each client.

5. **Validate All Input**: Validate and sanitize all input to prevent injection attacks.

6. **Rate Limiting**: Implement rate limiting to prevent abuse.

7. **Audit Logging**: Log all authentication and authorization events.

8. **CORS Configuration**: Configure CORS headers properly for browser-based clients.

9. **Security Headers**: Use appropriate security headers in responses.

10. **Regular Security Testing**: Conduct regular security testing and code reviews.
