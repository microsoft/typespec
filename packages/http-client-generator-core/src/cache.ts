import {
  Enum,
  Interface,
  isService,
  isTemplateDeclaration,
  isTemplateDeclarationOrInstance,
  Namespace,
  Operation,
} from "@typespec/compiler";
import { unsafe_Realm } from "@typespec/compiler/experimental";
import { getVersions } from "@typespec/versioning";
import { getClientLocation, getClientNameOverride, isInScope } from "./decorators.js";
import { SdkClient, TCGCContext } from "./interfaces.js";
import {
  clientKey,
  clientLocationKey,
  findServiceForOperation,
  getScopedDecoratorData,
  listAllUserDefinedNamespaces,
  listScopedDecoratorData,
  omitOperation,
  removeVersionsLargerThanExplicitlySpecified,
} from "./internal-utils.js";
import { reportDiagnostic } from "./lib.js";
import { getLibraryName } from "./public-utils.js";

/**
 * Create TCGC client types and prepare the cache for clients and operations.
 *
 * @param context TCGCContext
 */
export function prepareClientAndOperationCache(context: TCGCContext): void {
  // initialize the caches
  context.__rawClientsCache = new Map<Namespace | Interface | string, SdkClient>();
  context.__operationToClientCache = new Map<Operation, SdkClient>();
  context.__clientToOperationsCache = new Map<SdkClient, Operation[]>();
  context.__explicitClients = new Set<SdkClient>();

  // get root clients with full hierarchy (root clients + sub clients)
  const { clients, mergedSubClientTypes } = getRootClients(context);

  const servicesNs = new Set<Namespace>();
  clients.forEach((c) => c.services.forEach((s) => servicesNs.add(s)));

  // handle versioning with mutated types
  context.__packageVersions = new Map<Namespace, string[]>();
  context.__packageVersionEnum = new Map<Namespace, Enum | undefined>();

  for (const serviceNs of servicesNs) {
    const versions = getVersions(context.program, serviceNs)[1]?.getVersions();
    // If the service has no versioning, set empty
    if (!versions || versions.length === 0) {
      context.__packageVersions!.set(serviceNs, []);
      continue;
    }

    // Single service needs to filter versions based on `apiVersion` config
    if (servicesNs.size === 1) {
      removeVersionsLargerThanExplicitlySpecified(context, versions);
    }

    context.__packageVersionEnum!.set(serviceNs, versions[0].enumMember.enum);
    context.__packageVersions!.set(
      serviceNs,
      versions.map((v) => v.value),
    );
  }

  // iterate all clients and build a map of operations
  const queue: SdkClient[] = [...clients];
  let queueIdx = 0;
  while (queueIdx < queue.length) {
    const client = queue[queueIdx++];

    // operations directly under the client
    const operations = [];

    // Check if this is a merged sub client (has multiple services)
    const mergedTypes = mergedSubClientTypes.get(client);

    if (client.parent === undefined && client.services.length > 1 && !mergedTypes) {
      // multi-service root client
      operations.push(...client.services.flatMap((service) => [...service.operations.values()]));
    } else if (mergedTypes) {
      // multi-service sub client
      for (const type of mergedTypes) {
        operations.push(...type.operations.values());
      }
    } else if (client.type) {
      // single-service client or sub client
      operations.push(...client.type.operations.values());
    }

    // add operations
    for (const op of operations) {
      // skip operations that are not in scope
      if (!isInScope(context, op)) {
        continue;
      }

      // skip templated operations, omit operations (has override decorator)
      if (
        !isTemplateDeclarationOrInstance(op) &&
        !context.program.stateMap(omitOperation).get(op)
      ) {
        let pushClient: SdkClient = client;
        const clientLocation = getClientLocation(context, op);
        if (clientLocation) {
          // operation with `@clientLocation` decorator is placed in another client
          if (context.__rawClientsCache.has(clientLocation)) {
            pushClient = context.__rawClientsCache.get(clientLocation)!;
          } else {
            reportDiagnostic(context.program, {
              code: "client-location-wrong-type",
              target: op,
            });
          }
        }
        context.__clientToOperationsCache.get(pushClient)!.push(op);
        context.__operationToClientCache.set(op, pushClient);
      }
    }

    queue.push(...client.subClients);
  }

  // omit empty clients
  const needKeep = (client: SdkClient): boolean => {
    if (context.__explicitClients!.has(client) && !client.autoMergeService) return true;
    // recursively check and remove empty sub clients
    client.subClients = client.subClients.filter((subClient) => {
      const keep = needKeep(subClient);
      if (!keep) {
        context.__rawClientsCache!.delete(subClient.type!);
      }
      return keep;
    });

    // check if the client has operations or non-empty sub clients
    const hasOperations = context.__clientToOperationsCache!.get(client)!.length > 0;
    const hasSubClients = client.subClients.length > 0;

    return hasOperations || hasSubClients;
  };

  // start from the top-level clients and remove empty clients
  for (const client of clients) {
    const keepClient = needKeep(client);
    if (!keepClient && client.type) {
      context.__rawClientsCache.delete(client.type);
      context.__clientToOperationsCache.delete(client);
    }
  }
}

interface ClientCreationResult {
  clients: SdkClient[];
  mergedSubClientTypes: Map<SdkClient, (Namespace | Interface)[]>;
}

/**
 * Create a fresh copy of an SdkClient, resetting hierarchy fields to their
 * initial state (empty subClients, no parent, clientPath = name).
 */
function cloneSdkClient(client: SdkClient): SdkClient {
  return {
    kind: "SdkClient",
    name: client.name,
    services: [...client.services],
    type: client.type,
    subClients: [],
    clientPath: client.name,
    autoMergeService: client.autoMergeService,
  };
}

/**
 * Get the TCGC root clients with full hierarchy.
 * If user has explicitly defined `@client` then we will use those clients.
 * If user has not defined any `@client` then we will create a client for the first service namespace.
 * This function also creates sub clients, handles multi-service merging,
 * and creates virtual sub clients for `@clientLocation` string values.
 *
 * @param context TCGCContext
 * @returns
 */
function getRootClients(context: TCGCContext): ClientCreationResult {
  const mergedSubClientTypes = new Map<SdkClient, (Namespace | Interface)[]>();
  const namespaces: Namespace[] = listAllUserDefinedNamespaces(context);

  // Collect all explicit @client declarations.
  // Clone each SdkClient so this context gets its own mutable copies.
  // The decorator stores SdkClient objects in the program state map, which is
  // shared across all TCGCContext instances (e.g., lint rules + emitters).
  // Without cloning, the hierarchy builder below would mutate the shared
  // objects (parent, subClients, clientPath), causing duplicates when a
  // second context processes the same program.
  const explicitClients: SdkClient[] = [];
  for (const ns of namespaces) {
    const nsClient = getScopedDecoratorData(context, clientKey, ns);
    if (nsClient) {
      explicitClients.push(cloneSdkClient(nsClient));
    }
    for (const i of ns.interfaces.values()) {
      const iClient = getScopedDecoratorData(context, clientKey, i);
      if (iClient) {
        explicitClients.push(cloneSdkClient(iClient));
      }
    }
  }

  let clients: SdkClient[];

  if (explicitClients.length > 0) {
    // ── Explicit @client path ──

    // Build client hierarchy

    // Explicit client cache
    explicitClients.forEach((c) => {
      context.__rawClientsCache!.set(c.type!, c);
      context.__clientToOperationsCache!.set(c, []);
      context.__explicitClients!.add(c);
    });

    // Build explicit client hierarchy
    explicitClients.forEach((client: SdkClient) => {
      let parentClientType: Namespace | undefined = client.type!.namespace;
      while (parentClientType) {
        const parentClient = context.__rawClientsCache?.get(parentClientType);
        if (parentClient) {
          client.parent = parentClient;
          client.clientPath = `${client.parent.name}.${client.clientPath}`;
          parentClient.subClients.push(client);
          break;
        }
        parentClientType = parentClientType.namespace;
      }
    });

    // Get root clients
    let validClients = true;
    clients = explicitClients.filter((c: SdkClient) => {
      if (c.parent === undefined && c.services.length === 0) {
        reportDiagnostic(context.program, {
          code: "root-client-missing-service",
          target: c.type!,
        });
        validClients = false;
        return false;
      }
      return c.parent === undefined;
    });

    // Validate service for sub client is exist or set service if not exist
    const validateAndSetServiceForSubClients = (parentClient: SdkClient) => {
      for (const subClient of parentClient.subClients) {
        if (subClient.services.length === 0) {
          subClient.services = [...parentClient.services];
        } else {
          for (const svc of subClient.services) {
            if (!parentClient.services.includes(svc)) {
              reportDiagnostic(context.program, {
                code: "nested-client-service-not-subset",
                target: subClient.type!,
              });
              validClients = false;
              break;
            }
            if (parentClient.autoMergeService) {
              reportDiagnostic(context.program, {
                code: "auto-merge-service-conflict",
                target: subClient.type!,
              });
              validClients = false;
              break;
            }
          }
          if (!validClients) {
            break;
          }
          validateAndSetServiceForSubClients(subClient);
        }
      }
    };
    for (const client of clients) {
      validateAndSetServiceForSubClients(client);
    }

    // If there is any invalid client, return empty clients to avoid potential downstream errors. The diagnostics will guide users to fix the issues.
    if (!validClients) {
      return { clients: [], mergedSubClientTypes };
    }

    // Add sub-client hierarchy if empty explicit client
    const subClientNameMap = new Map<string, SdkClient>();
    explicitClients.forEach((client: SdkClient) => {
      if (client.autoMergeService) {
        // Explicit auto-merge service client: follow services to build hierarchy
        const subClients: SdkClient[] = [];
        for (const specificService of client.services) {
          for (const sc of buildSubClientHierarchy(
            context,
            specificService,
            client.name,
            specificService,
            client,
          )) {
            if (
              !handleMultipleServicesSubClientNameConflict(
                context,
                sc,
                client,
                subClientNameMap,
                mergedSubClientTypes,
              )
            ) {
              subClients.push(sc);
            }
          }
        }
        context.__rawClientsCache!.set(client.type!, client);
        client.subClients = subClients;
        context.__clientToOperationsCache!.set(client, []);
      }
    });
  } else {
    // ── No explicit @client path ──
    // Create a separate root client for each service namespace

    const serviceNamespaces: Namespace[] = namespaces.filter((ns) =>
      isService(context.program, ns),
    );
    if (serviceNamespaces.length >= 1) {
      clients = [];
      for (const service of serviceNamespaces) {
        let originalName;
        const clientNameOverride = getClientNameOverride(context, service);
        if (clientNameOverride) {
          originalName = clientNameOverride;
        } else {
          originalName = service.name;
        }
        const clientName = originalName.endsWith("Client") ? originalName : `${originalName}Client`;
        const client: SdkClient = {
          kind: "SdkClient",
          name: clientName,
          services: [service],
          type: service,
          subClients: [],
          clientPath: clientName,
        };
        client.subClients = buildSubClientHierarchy(context, service, client.name, service, client);
        context.__rawClientsCache!.set(client.type!, client);
        context.__clientToOperationsCache!.set(client, []);
        clients.push(client);
      }
    } else {
      clients = [];
    }

    if (clients.length === 0) {
      return { clients, mergedSubClientTypes };
    }
  }

  // Create virtual sub clients for `@clientLocation` of string value
  // This applies to both explicit and non-explicit client paths
  createVirtualSubClientsFromClientLocation(context, clients);

  return { clients, mergedSubClientTypes };
}

/**
 * Create virtual sub clients for `@clientLocation` decorator with string target values.
 * This handles cases where operations are moved to a named sub-client that may not exist yet.
 */
function createVirtualSubClientsFromClientLocation(
  context: TCGCContext,
  clients: SdkClient[],
): void {
  if (clients.length === 0) return;

  const newSubClientWithServices = new Map<string, Namespace[]>();
  listScopedDecoratorData(context, clientLocationKey).forEach((v, k) => {
    // only deal with mutated types or without mutation
    if (
      (!context.__mutatedRealm && !unsafe_Realm.realmForType.has(k)) ||
      (context.__mutatedRealm && context.__mutatedRealm.hasType(k))
    ) {
      // If the target sub client already exists, handle the multiple services case
      if (typeof v === "string") {
        if (clients.length > 1) {
          // If there are multiple root clients, then we could not know where to put the virtual sub client, report error
          reportDiagnostic(context.program, {
            code: "client-location-conflict",
            target: k,
          });
          return;
        }

        // Check if a sub client with this name already exists, only check first level for string target
        const existingSc = clients[0].subClients.find(
          (sc) => sc.type && getLibraryName(context, sc.type) === v,
        );

        const operationService =
          clients[0].services.length > 1
            ? findServiceForOperation(clients[0].services, k as Operation)
            : clients[0].services[0];

        if (existingSc) {
          // Sub client already exists - check if moving this operation would create a multi-service situation
          if (!existingSc.services.includes(operationService)) {
            existingSc.services.push(operationService);
          }
          // Operation will be moved to this existing sub client during operations processing
          context.__rawClientsCache!.set(v, existingSc);
          return;
        }

        if (newSubClientWithServices.has(v)) {
          // Add the service to the list if it's not already there
          const services = newSubClientWithServices.get(v)!;
          if (!services.includes(operationService)) {
            services.push(operationService);
          }
        } else {
          newSubClientWithServices.set(v, [operationService]);
        }
      }
    }
  });

  if (newSubClientWithServices.size > 0) {
    newSubClientWithServices.forEach((services, scName) => {
      const sc: SdkClient = {
        kind: "SdkClient",
        name: scName,
        clientPath: `${clients[0].name}.${scName}`,
        services,
        type: undefined, // virtual sub client has no backing type
        subClients: [],
        parent: clients[0],
      };
      context.__rawClientsCache!.set(scName, sc);
      clients[0].subClients.push(sc);
      context.__clientToOperationsCache!.set(sc, []);
    });
  }
}

function handleMultipleServicesSubClientNameConflict(
  context: TCGCContext,
  sc: SdkClient,
  client: SdkClient,
  subClientNameMap: Map<string, SdkClient>,
  mergedSubClientTypes: Map<SdkClient, (Namespace | Interface)[]>,
): boolean {
  if (client.services.length > 1 && sc.type) {
    // Track for conflict detection
    const scName = getLibraryName(context, sc.type);
    const existingSc = subClientNameMap.get(scName);
    if (!existingSc) {
      subClientNameMap.set(scName, sc);
    } else {
      // Conflict detected, update the existing sub client to have multiple services
      existingSc.services.push(sc.services[0]);

      // Re-parent moved children to the surviving sub client
      for (const child of sc.subClients) {
        child.parent = existingSc;
      }

      // Recursively merge same-named grandchildren instead of blindly appending
      mergeChildrenRecursively(context, existingSc, sc.subClients, mergedSubClientTypes);

      if (existingSc.type !== undefined) {
        mergedSubClientTypes.set(existingSc, [existingSc.type as Namespace | Interface]);
        existingSc.type = undefined;
      }
      // Store the merged types for later operations processing
      const types = mergedSubClientTypes.get(existingSc)!;
      if (sc.type) {
        types.push(sc.type);
      }

      // Redirect the merged-away sub client's type to the surviving sub client
      // so that @clientLocation lookups still resolve correctly.
      context.__rawClientsCache!.set(sc.type!, existingSc);
      context.__clientToOperationsCache!.delete(sc);

      return true;
    }
  }
  return false;
}

/**
 * Recursively merge incoming children into an existing sub-client's children.
 * If an incoming child has the same name as an existing child, merge them recursively;
 * otherwise, append the incoming child.
 */
function mergeChildrenRecursively(
  context: TCGCContext,
  existingSc: SdkClient,
  incomingChildren: SdkClient[],
  mergedSubClientTypes: Map<SdkClient, (Namespace | Interface)[]>,
): void {
  for (const incoming of incomingChildren) {
    const incomingName = incoming.type ? getLibraryName(context, incoming.type) : incoming.name;
    const existing = existingSc.subClients.find((child) => {
      const childName = child.type ? getLibraryName(context, child.type) : child.name;
      return childName === incomingName;
    });

    if (existing) {
      // Same-named grandchild found — merge recursively
      existing.services.push(...incoming.services.filter((s) => !existing.services.includes(s)));

      // Re-parent incoming's children
      for (const grandchild of incoming.subClients) {
        grandchild.parent = existing;
      }
      mergeChildrenRecursively(context, existing, incoming.subClients, mergedSubClientTypes);

      // Track merged types
      if (existing.type !== undefined) {
        mergedSubClientTypes.set(existing, [existing.type as Namespace | Interface]);
        existing.type = undefined;
      }
      const types = mergedSubClientTypes.get(existing)!;
      if (incoming.type) {
        types.push(incoming.type);
      }

      // Redirect the merged-away child's type to the surviving child
      // so that @clientLocation lookups still resolve correctly.
      if (incoming.type) {
        context.__rawClientsCache!.set(incoming.type, existing);
      }
      context.__clientToOperationsCache!.delete(incoming);
    } else {
      // No conflict — just append
      existingSc.subClients.push(incoming);
    }
  }
}

/**
 * Build a sub-client hierarchy by iterating child namespaces and interfaces of the given type.
 * Recursively creates sub-clients for all child namespaces and non-template interfaces,
 * returning the direct children as a list.
 *
 * @param context TCGCContext
 * @param type The parent namespace or interface whose children become sub-clients
 * @param clientPathPrefix The parent's client path prefix
 * @param service The service namespace
 * @param parent The parent client
 * @returns The list of direct child sub-clients
 */
function buildSubClientHierarchy(
  context: TCGCContext,
  type: Namespace | Interface,
  clientPathPrefix: string,
  service: Namespace,
  parent?: SdkClient,
): SdkClient[] {
  if (type.kind !== "Namespace") return [];

  const subClients: SdkClient[] = [];

  for (const ns of type.namespaces.values()) {
    const sc = createSubClient(context, ns, clientPathPrefix, service, parent);
    if (sc) subClients.push(sc);
  }
  for (const iface of type.interfaces.values()) {
    const sc = createSubClient(context, iface, clientPathPrefix, service, parent);
    if (sc) subClients.push(sc);
  }

  return subClients;
}

/**
 * Create a single sub-client for the given type and recursively build its children.
 */
function createSubClient(
  context: TCGCContext,
  type: Namespace | Interface,
  clientPathPrefix: string,
  service: Namespace,
  parent?: SdkClient,
): SdkClient | undefined {
  // Skip template interfaces
  if (type.kind === "Interface" && isTemplateDeclaration(type)) {
    return undefined;
  }

  const clientName = getLibraryName(context, type);
  const clientPath = `${clientPathPrefix}.${clientName}`;

  const subClient: SdkClient = {
    kind: "SdkClient",
    name: clientName,
    type,
    clientPath,
    services: [service],
    subClients: [],
    parent,
  };

  // Recursively build children for namespaces
  if (type.kind === "Namespace") {
    subClient.subClients = buildSubClientHierarchy(context, type, clientPath, service, subClient);
  }

  // Cache
  context.__rawClientsCache!.set(subClient.type!, subClient);
  context.__clientToOperationsCache!.set(subClient, []);

  return subClient;
}
