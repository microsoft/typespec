import { OAuth2Scope } from "@typespec/http";

export interface AuthenticationScheme {
    id: string;
    description: string;
    default: boolean;
}

export interface ResourceServer {
    id: string; //registration id from the authorization server
    authorization_server: string; //Issuer
    jwks_uri?: string; //JWKS URI
    authentication_schemes_supported: string[]; //Supported authentication schemes
}

export interface EntraProtectedResourceServer extends ResourceServer {
    
    token_type_supported: string[];
    token_version_supported: string; // This should be an enum
}

export interface AuthZBase {
  /**
   * Id of the authorization method
   */
  id: string;

  /**
   * Optional description.
   */
  description?: string;
}

export interface Role {
  /**
   * Id of the role
   */
  id: string;

  /**
   * Optional description.
   */
  description?: string;
}

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
 * Roles required to perform an operationg relative to a resource
 */
export interface Roles extends AuthZBase {
  /**
   * A list of roles allowed to performed an operation.
   */
  roles: Role[];
  /**
   * Where the roles are defined and looked up from.
   */
  definition: "authorization_server" | "resource_server";
  /**
   * The claim that contains the roles.  This is only required if the definition is "authorization_server".
   */
  claim?: string;
}

/**
 * Roles required to perform an operationg relative to a resource
 */
export interface Groups extends AuthZBase {
  /**
   * A list of groups allowed to performed an operation.
   */
  groups: Group[];
  /**
   * Where the groups are defined and looked up from.
   */
  definition: "authorization_server" | "resource_server";
  /**
   * The claim that contains the groups.  This is only required if the definition is "authorization_server".
   */
  claim?: string;
}

/**
 * Scopes are OAuth2 scopes required to performan an operation.  In Microsoft Entra these are also described as user permissions.
 */
export interface Scopes extends AuthZBase {
  scopes: OAuth2Scope[];
}

/**
 * App permissions are permissions directly assigned to a software agent that are required to perform an operation.
 */
export interface AppPermissions extends AuthZBase {
  scopes: OAuth2Scope[];
}
