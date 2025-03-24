import "@typespec/rest";

using Http;

@service(#{ title: "Authenticated service with method override" })
@useAuth(BearerAuth | MyAuth<["read", "write"]>)
namespace TypeSpec.OperationAuth;

alias MyAuth<Scopes extends string[]> = OAuth2Auth<
  Flows = [
    {
      type: OAuth2FlowType.implicit;
      authorizationUrl: "https://api.example.com/oauth2/authorize";
      refreshUrl: "https://api.example.com/oauth2/refresh";
    }
  ],
  Scopes = Scopes
>;

// requires BearerAuth | MyAuth<["read", "write"]>
@route("/one")
op one(): void;

// requires optional ApiKeyAuth
@useAuth(NoAuth | ApiKeyAuth<ApiKeyLocation.header, "x-my-header">)
@route("/two")
op two(): void;

// requires MyAuth<"delete">
@useAuth(MyAuth<["delete"]>)
@route("/three")
op three(): void;
