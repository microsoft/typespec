import "../dist/src/tsp-index.js";

namespace MCP;

/**
 * Declare an operation that is an MCP Tool.
 * @param value - Default is true.
 */
extern dec tool(target: Reflection.Operation);

/**
 * Tool does not modify its environment.
 * @param value - Default is true.
 */
extern dec readonly(target: Reflection.Operation, value?: boolean);

/**
 * Tool will not perform any destructive operations.
 * @param value - Default is true.
 */
extern dec nondestructive(target: Reflection.Operation, value?: boolean);
/**
 * Repeated calls with same args have no additional effect
 * @param value - Default is true.
 */
extern dec idempotent(target: Reflection.Operation, value?: boolean);

/**
 * Tool will not interacts with external entities
 * @param value - Default is true.
 */
extern dec closedWorld(target: Reflection.Operation, value?: boolean);

extern dec resource(target: Reflection.Operation, uri?: valueof string);

model McpServerOptions {
  name?: string;
  version?: string;
  instructions?: string;
}
/**
 * Declare a namespace or interface as an MCP Server and provide server
 * metadata.
 */
extern dec mcpServer(target: Reflection.Namespace | Reflection.Interface, options?: valueof McpServerOptions);

namespace Private {
  extern dec serializeAsText(target: Reflection.Model, type: unknown);
}
/**
 * A long-running operation. Long-running operations may take a while
 * so the server may periodically return progress notifications.
 */
model LRO<TResult> {
  result: TResult;
}

@Private.serializeAsText(TDataType)
model TextResult<TDataType = never> {
  type: "text";
  text: string;
}

model ImageResult<MimeType extends string = string> {
  type: "image";
  data: FileData;
  mimeType: MimeType;
}

model AudioResult<MimeType extends string = string> {
  type: "audio";
  data: FileData;
  mimeType: MimeType;
}

model ResourceResult<TResourceType extends Resource = Resource> {
  type: "resource";
  resource: TResourceType;
}

model EmbeddedResource {
  type: "resource";
  resource: Resource;
}

model TextResource {
  uri: string;
  mimeType: "text/plain";
  text: string;
}

model BinaryResource<MimeType extends string = string> {
  uri: string;
  mimeType: MimeType;
  blob: FileData;
}

union Resource {
  TextResource,
  BinaryResource,
}

@encode(BytesKnownEncoding.base64)
scalar FileData extends bytes;

@error
model MCPError<TDataType = never> {
  code: safeint;
  message: string;
  data?: TDataType;
}
