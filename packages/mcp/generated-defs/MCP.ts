import type { DecoratorContext, Interface, Namespace, Operation, Type } from "@typespec/compiler";

export interface McpServerOptions {
  readonly name?: string;
  readonly version?: string;
  readonly instructions?: string;
}

/**
 * Declare an operation that is an MCP Tool.
 *
 * @param value Default is true.
 */
export type ToolDecorator = (context: DecoratorContext, target: Operation) => void;

/**
 * Tool does not modify its environment.
 *
 * @param value Default is true.
 */
export type ReadonlyDecorator = (
  context: DecoratorContext,
  target: Operation,
  value?: Type,
) => void;

/**
 * Tool will not perform any destructive operations.
 *
 * @param value Default is true.
 */
export type NondestructiveDecorator = (
  context: DecoratorContext,
  target: Operation,
  value?: Type,
) => void;

/**
 * Repeated calls with same args have no additional effect
 *
 * @param value Default is true.
 */
export type IdempotentDecorator = (
  context: DecoratorContext,
  target: Operation,
  value?: Type,
) => void;

/**
 * Tool will not interacts with external entities
 *
 * @param value Default is true.
 */
export type ClosedWorldDecorator = (
  context: DecoratorContext,
  target: Operation,
  value?: Type,
) => void;

export type ResourceDecorator = (
  context: DecoratorContext,
  target: Operation,
  uri?: string,
) => void;

/**
 * Declare a namespace or interface as an MCP Server and provide server
 * metadata.
 */
export type McpServerDecorator = (
  context: DecoratorContext,
  target: Namespace | Interface,
  options?: McpServerOptions,
) => void;

export type MCPDecorators = {
  tool: ToolDecorator;
  readonly: ReadonlyDecorator;
  nondestructive: NondestructiveDecorator;
  idempotent: IdempotentDecorator;
  closedWorld: ClosedWorldDecorator;
  resource: ResourceDecorator;
  mcpServer: McpServerDecorator;
};
