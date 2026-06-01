import { createLibrary } from "@alloy-js/csharp";

/**
 * Library references for System.Text.Json.Serialization attributes.
 * Using createLibrary ensures proper `using` directive generation and
 * attribute name resolution (e.g., stripping "Attribute" suffix).
 */
export const JsonSerialization = createLibrary("System.Text.Json.Serialization", {
  JsonConverterAttribute: { kind: "class", members: {} },
  JsonPropertyNameAttribute: { kind: "class", members: {} },
  JsonStringEnumMemberNameAttribute: { kind: "class", members: {} },
  JsonStringEnumConverter: { kind: "class", members: {} },
});

/**
 * Library references for Microsoft.AspNetCore.Mvc attributes.
 * Using createLibrary ensures proper `using` directive generation and
 * attribute name resolution (e.g., stripping "Attribute" suffix).
 */
export const AspNetMvc = createLibrary("Microsoft.AspNetCore.Mvc", {
  ApiControllerAttribute: { kind: "class", members: {} },
  RouteAttribute: { kind: "class", members: {} },
  HttpGetAttribute: { kind: "class", members: {} },
  HttpPostAttribute: { kind: "class", members: {} },
  HttpPutAttribute: { kind: "class", members: {} },
  HttpDeleteAttribute: { kind: "class", members: {} },
  HttpPatchAttribute: { kind: "class", members: {} },
  HttpHeadAttribute: { kind: "class", members: {} },
  FromRouteAttribute: { kind: "class", members: {} },
  FromQueryAttribute: { kind: "class", members: {} },
  FromHeaderAttribute: { kind: "class", members: {} },
  FromBodyAttribute: { kind: "class", members: {} },
  ConsumesAttribute: { kind: "class", members: {} },
  ProducesResponseTypeAttribute: { kind: "class", members: {} },
});
