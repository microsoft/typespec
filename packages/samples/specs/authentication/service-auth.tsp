import "@typespec/rest";

using Http;

@service(#{ title: "Authenticated service" })
@useAuth(
  // Here authentication can either be a
  // - ApiKey AND Basic Auth together
  // - Bearer token
  // - OAuth2
  BearerAuth | [ApiKeyAuth<ApiKeyLocation.header, "x-my-header">, BasicAuth] | OAuth2Auth<[MyFlow]>
)
namespace TypeSpec.ServiceAuth;

model MyFlow {
  type: OAuth2FlowType.implicit;
  authorizationUrl: "https://api.example.com/oauth2/authorize";
  refreshUrl: "https://api.example.com/oauth2/refresh";
  scopes: ["read", "write"];
}

op test(): string;
