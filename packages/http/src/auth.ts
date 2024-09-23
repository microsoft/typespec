import { Operation, Program } from "@typespec/compiler";
import { deepClone, deepEquals } from "@typespec/compiler/utils";
import { getAuthentication } from "./decorators.js";
import {
  Authentication,
  AuthenticationOptionReference,
  AuthenticationReference,
  HttpAuth,
  HttpAuthRef,
  HttpService,
  HttpServiceAuthentication,
  OAuth2Flow,
  Oauth2Auth,
} from "./types.js";

/**
 * Resolve the authentication for a given operation.
 * @param program Program
 * @param operation Operation
 * @returns Authentication provided on the operation or containing interface or namespace.
 */
export function getAuthenticationForOperation(
  program: Program,
  operation: Operation,
): Authentication | undefined {
  const operationAuth = getAuthentication(program, operation);
  if (operationAuth) {
    return operationAuth;
  }
  if (operation.interface !== undefined) {
    const interfaceAuth = getAuthentication(program, operation.interface);
    if (interfaceAuth) {
      return interfaceAuth;
    }
  }

  let namespace = operation.namespace;

  while (namespace) {
    const namespaceAuth = getAuthentication(program, namespace);
    if (namespaceAuth) {
      return namespaceAuth;
    }
    namespace = namespace.namespace;
  }
  return undefined;
}

/**
 * Compute the authentication for a given service.
 * @param service Http Service
 * @returns The normalized authentication for a service.
 */
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
  serviceSchemes: Record<string, HttpAuth>,
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
  scheme2: Oauth2Auth<Flows>,
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

function ignoreScopes<Flows extends OAuth2Flow[]>(
  scheme: Omit<Oauth2Auth<Flows>, "model">,
): Omit<Oauth2Auth<Flows>, "model"> {
  const flows: Flows = deepClone(scheme.flows);
  flows.forEach((flow) => {
    flow.scopes = [];
  });
  return {
    ...scheme,
    flows,
  };
}

function authsAreEqual(scheme1: HttpAuth, scheme2: HttpAuth): boolean {
  const { model: _model1, ...withoutModel1 } = scheme1;
  const { model: _model2, ...withoutModel2 } = scheme2;
  if (withoutModel1.type === "oauth2" && withoutModel2.type === "oauth2") {
    return deepEquals(ignoreScopes(withoutModel1), ignoreScopes(withoutModel2));
  }
  return deepEquals(withoutModel1, withoutModel2);
}
