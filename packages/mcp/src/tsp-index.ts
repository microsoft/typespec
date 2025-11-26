import type { MCPDecorators } from "../generated-defs/MCP.js";
import type { MCPPrivateDecorators } from "../generated-defs/MCP.Private.js";
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
  MCP: {
    mcpServer: $mcpServer,
    tool: toolDecorator,
    resource: $resource,
    readonly: readonlyDecorator,
    nondestructive: nondestructiveDecorator,
    idempotent: idempotentDecorator,
    closedWorld: closedWorldDecorator,
  } satisfies MCPDecorators,
  "MCP.Private": {
    serializeAsText: $serializeAsText,
  } satisfies MCPPrivateDecorators,
};
