import { Operation, Program } from "@typespec/compiler";
import { deepClone, deepEquals } from "@typespec/compiler/utils";
import { HttpStateKeys } from "./lib.js";
import {
  Authentication,
  HttpAuth,
  HttpService,
  NoAuth,
  OAuth2Flow,
  OAuth2Scope,
  Oauth2Auth,
} from "./types.js";

export function getAuthenticationForOperation(
  program: Program,
  operation: Operation
): Authentication | undefined {
  const operationAuth = program.stateMap(HttpStateKeys.authentication).get(operation);
  if (operationAuth === undefined && operation.interface !== undefined) {
    const interfaceAuth = program.stateMap(HttpStateKeys.authentication).get(operation.interface);
    return interfaceAuth;
  }
  return operationAuth;
}

export type HttpAuthRef = AnyHttpAuthRef | OAuth2HttpAuthRef | NoHttpAuthRef;

export interface AnyHttpAuthRef {
  readonly kind: "any";
  readonly auth: HttpAuth;
}

export interface NoHttpAuthRef {
  readonly kind: "noAuth";
  readonly auth: NoAuth;
}

/* Holder of this reference needs only a `scopes` subset of all scopes defined at `auth` */
export interface OAuth2HttpAuthRef {
  readonly kind: "oauth2";
  readonly auth: Oauth2Auth<OAuth2Flow[]>;
  readonly scopes: string[];
}

export interface AuthenticationReference {
  /**
   * Either one of those options can be used independently to authenticate.
   */
  readonly options: AuthenticationOptionReference[];
}

export interface AuthenticationOptionReference {
  /**
   * For this authentication option all the given auth have to be used together.
   */
  readonly all: HttpAuthRef[];
}

export interface HttpServiceAuthentication {
  /**
   * All the authentication schemes used in this service.
   * Some might only be used in certain operations.
   */
  readonly schemes: HttpAuth[];

  /**
   * Default authentication for operations in this service.
   */
  readonly defaultAuth: AuthenticationReference;

  /**
   * Authentication overrides for individual operations.
   */
  readonly operationsAuth: Map<Operation, AuthenticationReference>;
}

export function resolveAuthentication(service: HttpService): HttpServiceAuthentication {
  let schemes: Record<string, HttpAuth> = {};
  let defaultAuth: AuthenticationReference = { options: [] };
  const operationsAuth: Map<Operation, AuthenticationReference> = new Map();

  if (service.authentication) {
    const { newServiceSchemes, authOptions } = gatherAuth(service.authentication, {});
    schemes = newServiceSchemes;
    defaultAuth = authOptions;
  }

  for (const op of service.operations) {
    if (op.authentication) {
      const { newServiceSchemes, authOptions } = gatherAuth(op.authentication, schemes);
      schemes = newServiceSchemes;
      operationsAuth.set(op.operation, authOptions);
    }
  }

  return { schemes: Object.values(schemes), defaultAuth, operationsAuth };
}

function gatherAuth(
  authentication: Authentication,
  serviceSchemes: Record<string, HttpAuth>
): {
  newServiceSchemes: Record<string, HttpAuth>;
  authOptions: AuthenticationReference;
} {
  const newServiceSchemes: Record<string, HttpAuth> = serviceSchemes;
  const authOptions: AuthenticationReference = { options: [] };
  for (const option of authentication.options) {
    const authOption: AuthenticationOptionReference = { all: [] };
    for (const optionScheme of option.schemes) {
      const serviceScheme = serviceSchemes[optionScheme.id];
      let newServiceScheme = optionScheme;
      if (serviceScheme) {
        // If we've seen a different scheme by this id,
        // Make sure to not overwrite it
        if (!authsAreEqual(serviceScheme, optionScheme)) {
          while (serviceSchemes[newServiceScheme.id]) {
            newServiceScheme.id = newServiceScheme.id + "_";
          }
        }
        // Merging scopes when encountering the same Oauth2 scheme
        else if (serviceScheme.type === "oauth2" && optionScheme.type === "oauth2") {
          const x = mergeOAuthScopes(serviceScheme, optionScheme);
          newServiceScheme = x;
        }
      }
      const httpAuthRef = makeHttpAuthRef(optionScheme, newServiceScheme);
      newServiceSchemes[newServiceScheme.id] = newServiceScheme;
      authOption.all.push(httpAuthRef);
    }
    authOptions.options.push(authOption);
  }
  return { newServiceSchemes, authOptions };
}

function makeHttpAuthRef(local: HttpAuth, reference: HttpAuth): HttpAuthRef {
  if (reference.type === "oauth2" && local.type === "oauth2") {
    const scopes: string[] = [];
    for (const flow of local.flows) {
      scopes.push(...flow.scopes.map((x) => x.value));
    }
    return { kind: "oauth2", auth: reference, scopes: scopes };
  } else if (reference.type === "noAuth") {
    return { kind: "noAuth", auth: reference };
  } else {
    return { kind: "any", auth: reference };
  }
}

function mergeOAuthScopes<Flows extends OAuth2Flow[]>(
  scheme1: Oauth2Auth<Flows>,
  scheme2: Oauth2Auth<Flows>
): Oauth2Auth<Flows> {
  const flows = deepClone(scheme1.flows);
  flows.forEach((flow1, i) => {
    const flow2 = scheme2.flows[i];
    const scopes = Array.from(new Set(flow1.scopes.concat(flow2.scopes)));
    flows[i].scopes = scopes;
  });
  return {
    ...scheme1,
    flows,
  };
}

function setOauth2Scopes<Flows extends OAuth2Flow[]>(
  scheme: Oauth2Auth<Flows>,
  scopes: OAuth2Scope[]
): Oauth2Auth<Flows> {
  const flows: Flows = deepClone(scheme.flows);
  flows.forEach((flow) => {
    flow.scopes = scopes;
  });
  return {
    ...scheme,
    flows,
  };
}

function authsAreEqual(scheme1: HttpAuth, scheme2: HttpAuth): boolean {
  if (scheme1.type === "oauth2" && scheme2.type === "oauth2") {
    return deepEquals(setOauth2Scopes(scheme1, []), setOauth2Scopes(scheme2, []));
  }
  return deepEquals(scheme1, scheme2);
}
