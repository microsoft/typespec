import "@typespec/rest";

using TypeSpec.Http;

model MyFlow {
  type: OAuth2FlowType.implicit;
  authorizationUrl: "https://api.example.com/oauth2/authorize";
  refreshUrl: "https://api.example.com/oauth2/refresh";
  scopes: ["read", "write"];
}

op simpl(): string;
