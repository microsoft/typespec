import type { DecoratorContext, Model, Namespace, Operation } from "@typespec/compiler";

// Re-export $lib to the compiler can get access to it and register your library correctly.
export { $lib } from "./lib.js";

export const namespace = "TypeSpec.Authorization";

export function $resourceServer(
  context: DecoratorContext,
  entity: Namespace,
  resourceServer: ResourceServer
) {
  // TODO
}

export function $authorize(
  context: DecoratorContext,
  entity: Namespace | Operation,
  ...authorization: AuthorizationType[]
) {
  // TODO
}

export function $entraOAuth2Scope(context: DecoratorContext, entity: Model) {
  // TODO
}

export function $entraAppRole(context: DecoratorContext, entity: Model) {
  // TODO
}

export function $entraGroup(context: DecoratorContext, entity: Model) {
  // TODO
}

// Authorization Server Metadata: https://datatracker.ietf.org/doc/html/rfc8414#section-2
export interface AuthorizationServer {
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

export interface ResourceAccess {
  id: string;
  type: string;
}

export interface RequiredResourceAccess {
  resourceAppId: string;
  resourceAccess: ResourceAccess[];
}

export interface OAuth2Scope {
  value: string;
  description?: string;
}

/**
 * Entra directory role required to consent to an OAuth2Scope/Permission.
 * I suppose User here encompasses, both member, external member and guest.
 */
export type EntraRoleRequiredToConsent = "User" | "Admin";

export interface EntraOAuth2Scope extends OAuth2Scope {
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
   * using "Type" here seems wrong.
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

export type AuthorizationDefined = "authorization_server" | "resource_server";

export interface Role {
  /**
   * displayName of the role
   */
  displayName: string;

  /**
   * Description of the role
   */
  description: string;

  /**
   * Defined by the authorization server or resource server
   */
  defined?: AuthorizationDefined;
}

export type EntraAllowedMemberType = "User" | "Application";

export interface EntraAppRole extends Role {
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

// Authentication schemes
export interface AuthenticationScheme {
  type: string;
  description?: string;
}

export interface BearerAuthenticationScheme extends AuthenticationScheme {
  type: "Bearer";
  description: "Bearer token. (IETF standard - RFC 6750)";
}

export interface PoPAuthenticationScheme extends AuthenticationScheme {
  type: "PoP";
  description: "Proof of Possession (Microsoft pre-cursor to demonstrated proof of possession)";
}

export interface DPoPAuthenticationScheme extends AuthenticationScheme {
  type: "DPoP";
  description: "Demonstrated Proof of Possession (IETF standard - RFC 9449)";
}

export interface ResourceServer {
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
  authentication_schemes_supported: AuthenticationScheme[];
  /**
   * The default authentication scheme that the resource server uses when generating a www-authenticate header in a 401 response.
   */
  default_authentication_scheme: AuthenticationScheme;
}

export type AuthorizationType = Groups | Roles | Scopes;

export interface Group {
  /**
   * Id of the group
   */
  id: string;

  /**
   * Optional description.
   */
  description?: string;
}

/**
 * Roles required to perform an operation relative to a resource
 */
export interface Roles {
  type: "roles";
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
export interface Groups {
  type: "groups";
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
export interface Scopes {
  type: "scopes";
  scopes: OAuth2Scope[];
}
