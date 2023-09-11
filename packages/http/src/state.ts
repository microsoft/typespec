// FIXME - This is a workaround for the circular dependency issue when loading
// createStateSymbol.
// Issue: https://github.com/microsoft/typespec/issues/2301
function httpCreateStateSymbol(name: string): symbol {
  return Symbol.for(`@typespec/http.${name}`);
}

export const HttpStateKeys = {
  // decorators.ts
  authenticationKey: httpCreateStateSymbol("authentication"),
  headerFieldsKey: httpCreateStateSymbol("header"),
  queryFieldsKey: httpCreateStateSymbol("query"),
  pathFieldsKey: httpCreateStateSymbol("path"),
  bodyFieldsKey: httpCreateStateSymbol("body"),
  statusCodeKey: httpCreateStateSymbol("statusCode"),
  operationVerbsKey: httpCreateStateSymbol("verbs"),
  serversKey: httpCreateStateSymbol("servers"),
  includeInapplicableMetadataInPayloadKey: httpCreateStateSymbol(
    "includeInapplicableMetadataInPayload"
  ),

  // route.ts
  externalInterfaces: httpCreateStateSymbol("externalInterfaces"),
  routeProducerKey: httpCreateStateSymbol("routeProducer"),
  routesKey: httpCreateStateSymbol("routes"),
  sharedRoutesKey: httpCreateStateSymbol("sharedRoutes"),
  routeOptionsKey: httpCreateStateSymbol("routeOptions"),
};
