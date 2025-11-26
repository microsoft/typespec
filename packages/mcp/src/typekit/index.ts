import {
  ignoreDiagnostics,
  type Interface,
  type Model,
  type Namespace,
  type Operation,
  type Scalar,
  type Type,
  type Union,
} from "@typespec/compiler";
import { defineKit } from "@typespec/compiler/typekit";
import { getMcpServer, isTool, type McpServer } from "../decorators.js";
import { stateKeys } from "../lib.js";

export interface McpKit {
  tools: {
    list(server?: McpServer): Operation[];
  };
  builtins: {
    get TextResult(): Model;
    get LRO(): Model;
    get ImageResult(): Model;
    get AudioResult(): Model;
    get EmbeddedResource(): Model;
    get TextResource(): Model;
    get BinaryResource(): Model;
    get Resource(): Union;
    get FileData(): Scalar;
    get MCPError(): Model;
  };
  textResult: {
    is(type: Type): boolean;
    getSerializedType(type: Model): Type | undefined;
  };
  audioResult: {
    is(type: Type): boolean;
  };
  imageResult: {
    is(type: Type): boolean;
  };
  resourceResult: {
    is(type: Type): boolean;
  };
  servers: {
    list(): McpServer[];
  };
  isKnownMcpResult(type: Type): boolean;
}
interface TypekitExtension {
  /**
   * Typekit for @typespec/mcp
   * @experimental
   */
  mcp: McpKit;
}

declare module "@typespec/compiler/typekit" {
  interface Typekit extends TypekitExtension {}
}

function listUnder(container: Namespace | Interface) {
  const ops: Operation[] = [];

  function visitNamespace(ns: Namespace) {
    for (const member of ns.operations.values()) {
      ops.push(member);
    }
    for (const member of ns.interfaces.values()) {
      visitInterface(member);
    }
    for (const member of ns.namespaces.values()) {
      visitNamespace(member);
    }
  }

  function visitInterface(iface: Interface) {
    for (const op of iface.operations.values()) {
      ops.push(op);
    }
    // If interfaces can contain nested interfaces or namespaces, add similar logic here
  }

  if (container.kind === "Namespace") {
    visitNamespace(container);
  } else if (container.kind === "Interface") {
    visitInterface(container);
  }

  return ops;
}

function listContainersUnder(container: Namespace): (Namespace | Interface)[] {
  const result: (Namespace | Interface)[] = [];

  function visitNamespace(ns: Namespace) {
    result.push(ns);
    for (const member of ns.namespaces.values()) {
      visitNamespace(member);
    }
    for (const member of ns.interfaces.values()) {
      result.push(member);
    }
  }

  visitNamespace(container);

  return result;
}

defineKit<TypekitExtension>({
  mcp: {
    tools: {
      list(server?: McpServer) {
        const root = server?.container ?? this.program.getGlobalNamespaceType();
        return listUnder(root).filter((x) => isTool(this.program, x));
      },
    },
    builtins: {
      get BinaryResource(): Model {
        return ignoreDiagnostics(this.program.resolveTypeReference("MCP.BinaryResource"))! as Model;
      },
      get TextResult(): Model {
        return ignoreDiagnostics(this.program.resolveTypeReference("MCP.TextResult"))! as Model;
      },
      get LRO(): Model {
        return ignoreDiagnostics(this.program.resolveTypeReference("MCP.LRO"))! as Model;
      },
      get ImageResult(): Model {
        return ignoreDiagnostics(this.program.resolveTypeReference("MCP.ImageResult"))! as Model;
      },
      get AudioResult(): Model {
        return ignoreDiagnostics(this.program.resolveTypeReference("MCP.AudioResult"))! as Model;
      },
      get EmbeddedResource(): Model {
        return ignoreDiagnostics(
          this.program.resolveTypeReference("MCP.EmbeddedResource"),
        )! as Model;
      },
      get TextResource(): Model {
        return ignoreDiagnostics(this.program.resolveTypeReference("MCP.TextResource"))! as Model;
      },
      get FileData(): Scalar {
        return ignoreDiagnostics(this.program.resolveTypeReference("MCP.FileData"))! as Scalar;
      },
      get MCPError(): Model {
        return ignoreDiagnostics(this.program.resolveTypeReference("MCP.MCPError"))! as Model;
      },
      get Resource(): Union {
        return ignoreDiagnostics(this.program.resolveTypeReference("MCP.Resource"))! as Union;
      },
    },

    textResult: {
      is(type: Type) {
        return type.kind === "Model" && type.name === "TextResult";
      },
      getSerializedType(type: Model): Type | undefined {
        return this.program.stateMap(stateKeys.serializeAsText).get(type).dataType;
      },
    },

    audioResult: {
      is(type: Type) {
        return type.kind === "Model" && type.name === "AudioResult";
      },
    },

    imageResult: {
      is(type: Type) {
        return type.kind === "Model" && type.name === "ImageResult";
      },
    },

    resourceResult: {
      is(type: Type) {
        return type.kind === "Model" && type.name === "Resource";
      },
    },

    servers: {
      list() {
        return listContainersUnder(this.program.getGlobalNamespaceType())
          .map((x) => getMcpServer(this.program, x))
          .filter((x) => x !== undefined);
      },
    },

    isKnownMcpResult(type) {
      return (
        this.mcp.textResult.is(type) ||
        this.mcp.audioResult.is(type) ||
        this.mcp.imageResult.is(type) ||
        this.mcp.resourceResult.is(type)
      );
    },
  },
});
