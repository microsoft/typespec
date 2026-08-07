import { createLibrary } from "@alloy-js/csharp";

/**
 * Library references for Microsoft.AspNetCore.Mvc attributes.
 * ASP.NET Core is not part of the BCL, so it has no `@alloy-js/csharp` builtin and must be
 * declared here. BCL namespaces (e.g. `System.Text.Json.Serialization`) should instead be
 * imported from `@alloy-js/csharp/global/*`.
 *
 * Using createLibrary ensures proper `using` directive generation and
 * Using createLibrary ensures proper `using` directive generation and
 * attribute name resolution (e.g., stripping "Attribute" suffix).
 */
export const AspNetMvc = createLibrary("Microsoft.AspNetCore.Mvc", {
  ApiControllerAttribute: { kind: "class", members: {} },
  ControllerBase: { kind: "class", members: {} },
  IActionResult: { kind: "interface", members: {} },
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
