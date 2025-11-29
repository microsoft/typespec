import type { TypeSpecMCPDecorators } from "../generated-defs/TypeSpec.MCP.js";
import type { TypeSpecMCPPrivateDecorators } from "../generated-defs/TypeSpec.MCP.Private.js";
import {
  $mcpServer,
  $resource,
  $serializeAsText,
  closedWorldDecorator,
  idempotentDecorator,
  nondestructiveDecorator,
  readonlyDecorator,
  toolDecorator,
} from "./decorators.js";

/** @internal */
export const $decorators = {
  "TypeSpec.MCP": {
    mcpServer: $mcpServer,
    tool: toolDecorator,
    resource: $resource,
    readonly: readonlyDecorator,
    nondestructive: nondestructiveDecorator,
    idempotent: idempotentDecorator,
    closedWorld: closedWorldDecorator,
  } satisfies TypeSpecMCPDecorators,
  "TypeSpec.MCP.Private": {
    serializeAsText: $serializeAsText,
  } satisfies TypeSpecMCPPrivateDecorators,
};
