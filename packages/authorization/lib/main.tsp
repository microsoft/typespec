import "../dist/src/index.js";

using TypeSpec.Reflection;

namespace TypeSpec.Authorization;

alias AuthenticationScheme = BearerAuthenticationScheme | PoPAuthenticationScheme | DPoPAuthenticationScheme;

model BearerAuthenticationScheme {
  type: "Bearer";
}

model PoPAuthenticationScheme {
  type: "PoP";
}

model DPoPAuthenticationScheme {
  type: "DPoP";
}

alias AcceptedAuthenticationScheme = BearerAuthenticationScheme | PoPAuthenticationScheme | DPoPAuthenticationScheme;

// Authorization Server Metadata: https://datatracker.ietf.org/doc/html/rfc8414#section-2
model AuthorizationServer {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri?: string;
  registration_endpoint?: string;
  scopes_supported: string[];
  response_types_supported: string[];
  response_modes_supported?: string[];
  grant_types_supported?: string[];
  token_endpoint_auth_methods_supported?: string[];
  token_endpoint_auth_signing_alg_values_supported?: string[];
  service_documentation?: string;
  ui_locales_supported?: string[];
  op_policy_uri?: string;
  op_tos_uri?: string;
  revocation_endpoint?: string;
  revocation_endpoint_auth_methods_supported?: string[];
  revocation_endpoint_auth_signing_alg_values_supported?: string[];
  introspection_endpoint?: string;
  introspection_endpoint_auth_methods_supported?: string[];
  introspection_endpoint_auth_signing_alg_values_supported?: string[];
  code_challenge_methods_supported?: string[];
}

alias AuthorizationDefined = "authorization_server" | "resource_server";

model ResourceServer {
  /**
   * The authorization server that this service relies on for authorization
   */
  authorization_server: AuthorizationServer;

  /**
   * The application id of the resource server.  This id is a result of registration with the authorization server.
   */
  app_id: string;

  /**
   * The authentication schemes (token types) that the resource server supports.
   */
  authentication_schemes_supported: AcceptedAuthenticationScheme[];

  /**
   * The default authentication scheme that the resource server uses when generating a www-authenticate header in a 401 response.
   */
  default_authentication_scheme: AcceptedAuthenticationScheme;
}

model Role {
  /**
   * displayName of the role
   */
  displayName: string;

  /**
   * Description of the role
   */
  description?: string;
}

alias EntraAllowedMemberType = "User" | "Application";

model EntraAppRole extends Role {
  /**
   * The allowed member types for the role.
   */
  allowedMemberTypes: EntraAllowedMemberType[];

  /**
   * Directory Object Id of the role
   */
  id?: string;

  /**
   * Whether the role is enabled.
   */
  isEnabled: boolean;

  /**
   * Language of the role.
   */
  lang?: string;

  /**
   * Origin of the role.
   */
  origin?: string;

  /**
   * Unique identifier of the role transmitted in access tokens
   */
  value: string;
}

model OAuth2Scope {
  value: string;
  description?: string;
}

/**
 * Entra directory role required to consent to an OAuth2Scope/Permission.
 * I suppose User here encompasses, both member, external member and guest.
 */
alias EntraRoleRequiredToConsent = "User" | "Admin";

model EntraOAuth2Scope extends OAuth2Scope {
  /**
   * Object ID for the permission in the directory - Optional because it will be created if does not exist.
   */
  id?: string;

  /**
   * Whether the permission is enabled
   */
  isEnabled: boolean;

  /**
   * The directory role of the user providing consent. (Strictly speaking user should have been "member" here.)
   * Calling this type seems wrong...to me now... but understand why this was selected at the time.
   */
  type: EntraRoleRequiredToConsent;

  /**
   * The description of what is being consented to on behalf of the organization.
   */
  adminConsentDescription: string;

  /**
   * The display name of the permission that is being consented to on behalf of the organization.
   */
  adminConsentDisplayName: string;

  /**
   * The description of what is being consented to by the user.  If permitted to provide consent.
   */
  userConsentDescription: string;

  /**
   * The display name of the permission that is being consented to by the user.  If permitted to provide consent.
   */
  userConsentDisplayName: string;

  lang?: string;
  origin?: string;
}

model Group {
  /**
   * Id of the group
   */
  id: string;

  /**
   * Optional description.
   */
  description?: string;
}

alias Authorization = Roles | Groups | Scopes;

@doc("Describes the type of authorization check")
enum AuthorizationType {
  @doc("Is the principal a member of the application role")
  roles,

  @doc("Has the calling application been granted the permission to perform the operation")
  scopes,

  @doc("Is the principal a member of the group")
  groups,
}

/**
 * Roles required to perform an operation relative to a resource
 */
model Roles {
  type: AuthorizationType.roles;

  /**
   * A list of roles allowed to performed an operation.
   */
  roles: Role[];

  /**
   * Where the roles are defined and looked up from.
   */
  definition?: AuthorizationDefined;

  /**
   * The claim that contains the roles.  This is only required if the definition is "authorization_server".
   */
  claim?: string;
}

/**
 * Roles required to perform an operationg relative to a resource
 */
model Groups {
  type: AuthorizationType.groups;

  /**
   * A list of groups allowed to performed an operation.
   */
  groups: Group[];

  /**
   * Where the groups are defined and looked up from.
   */
  definition?: AuthorizationDefined;

  /**
   * The claim that contains the groups.  This is only required if the definition is "authorization_server".
   */
  claim?: string;
}

/**
 * Scopes are OAuth2 scopes required to perform an operation.  In Microsoft Entra these are also described as user permissions.
 */
model Scopes {
  type: AuthorizationType.scopes;
  scopes: OAuth2Scope[];
}

extern dec entraOAuth2Scope(Target: Model);
extern dec entraAppRole(Target: Model);
extern dec entraGroup(Target: Model);

extern dec resourceServer(target: Namespace, resourceServer: ResourceServer);

extern dec authorize(target: Namespace | Operation, authorization: Authorization[]);
