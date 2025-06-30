---
slug: 2025-05-30-typespec-mcp
title: "API-first MCP servers with TypeSpec"
description: "We are previewing a few libraries and emitters for authoring MCP servers with TypeSpec. Describe MCP server endpoints using decorators and generate a server implementation in JavaScript. Use the TypeSpec MCP server to help get set up."
publishDate: 2025-05-30
authors:
  - name: Brian Terlson
    title: Principal Architect
    socials:
      x: https://x.com/bterlson
      github: https://github.com/bterlson
      bluesky: https://bsky.app/profile/b.trl.sn
---

[MCP servers](https://modelcontextprotocol.io/) are everywhere these days. People are integrating MCP servers into their agentic workflows and driving everything from checking the weather to provisioning cloud infrastructure. Solutions abound for building MCP servers - the official SDK works great, or you can pick up one of dozens of the frameworks built by the community. There are also various approaches to building MCP servers from API descriptions, which is what we're most interested in.

We have been experimenting with API-first MCP servers, and we're [previewing various MCP projects](https://github.com/microsoft/typespec-mcp) to get feedback and ideas. These include:

- [typespec-mcp](https://github.com/microsoft/typespec-mcp/tree/main/packages/typespec-mcp) - a vocabulary for describing MCP servers in TypeSpec
- [typespec-mcp-server-js](https://github.com/microsoft/typespec-mcp/tree/main/packages/typespec-mcp-server-js) - a TypeSpec emitter for generating MCP servers from TypeSpec
- [typespec-http-mcp-server-js](https://github.com/microsoft/typespec-mcp/tree/main/packages/typespec-mcp-http-server-js) - a TypeSpec emitter for generating MCP servers for REST APIs written in TypeSpec
- [mcp-server-typespec](https://github.com/microsoft/typespec-mcp/tree/main/packages/mcp-server-typespec) - an MCP server to help your agent build things with TypeSpec

In this post, we'll say a few words about codegen in the age of AI and give some more details about each of the libraries we're previewing. Those of you interested in our new framework for building emitters should stick around to the end as well!

## Quick Example

Given the following TypeSpec:

```tsp
import "typespec-mcp";
using MCP;

@mcpServer(#{ name: "VectorMCP" })
namespace VectorMCP;

model Vec3 {
  x: int32;
  y: int32;
  z: int32;
}

@tool op addVector(v1: Vec3, v2: Vec3): Vec3;
@tool op subVector(v1: Vec3, v2: Vec3): Vec3;
```

After running `tsp compile` using the [typespec-mcp-server-js](https://github.com/microsoft/typespec-mcp/tree/main/packages/typespec-mcp-server-js) emitter, you implement your MCP server as follows, and your server is ready to go.

```ts
import { setToolHandler } from "#mcp-server";

setToolHandler({
  async addVector(v1, v2) {
    return {
      x: v1.x + v2.x,
      y: v1.y + v2.y,
      z: v1.z + v2.z,
    };
  },
  subVector(v1, v2) {
    return {
      x: v1.x - v2.x,
      y: v1.y - v2.y,
      z: v1.z - v2.z,
    };
  },
});
```

## AI 💓 Codegen

You might wonder, in the age of AI, why bother with this? You can ask your agent to implement the whole thing! Of course, you can do that. But it turns out that code generation and AI are best friends. Codegen makes guiderails for your agent that ultimately makes vibe coding more productive. Your MCP implementation is more reliable and implementing the actual logic using an agent is faster and cheaper.

This is in part because TypeSpec is a great way to iterate with your LLM on exactly what you want it to build. The TypeSpec contains a terse, human readable description of the functionality that will eventually be implemented, and iterating on that first means that you can be very crisp and clear about exactly what you want built.

Also, the generated code is reliable because it's a fully deterministic mapping from that spec to protocol handling code. For MCP servers, this means the generated code takes care of properly responding to each tool request, validating inputs and outputs against a well defined schema, marshalling values to and from JSON or other formats, and so forth. Agents can write this code but can get it wrong and, especially as complexity rises, their code needs to be carefully validated.

Implementing the unique logic your service needs is easier with codegen too. If you look at the example code above, you can see that all the MCP protocol specific details are abstracted away. Your agent doesn't need to know anything about the MCP protocol or figure out how to use an MCP SDK. All it has to do is implement the API contract which is fully documented in TypeScript, and something it is quite adept at. Simple prompts are likely to result in successful one-shots, and the reduction in context and LLM output means you will consume fewer tokens.

So what we're finding is that TypeSpec and code generation is super useful when used together with agents writing code. It allows you to be explicit about what you want built and then generate guiderails that make agents more successful at generating your code. Neat!

## Preview packages

### `typespec-mcp`: MCP server library

The [typespec-mcp typespec library](https://github.com/microsoft/typespec-mcp/tree/main/packages/typespec-mcp) gives you decorators to define MCP servers and tools. You can define tools using the `@tool` decorator. If you add a doc comment on the tool, it will be used as the tool's description. You can also use the built-in `@summary` decorator to provide a short description, and the `@readonly`, `@nondestructive`, `@idempotent`, and `@closedWorld` to provide tool descriptions.

The library also defines various well-known types used in MCP requests and results including `TextResult`, `ImageResult`, `AudioResult`, and `ResourceResult` for the various tool call responses and `MCPError` for describing the errors your MCP server might throw.

Lastly, it provides [typekits](https://typespec.io/docs/standard-library/reference/typekits/) for emitter authors to build their own codegen on top of this library.

### `typespec-mcp-server-js`: MCP server emitter

The [typespec-mcp-server-js](https://github.com/microsoft/typespec-mcp/tree/main/packages/typespec-mcp-server-js) emitter generates an MCP server from TypeSpec using the `typespec-mcp` library. This library generates the following parts:

- MCP tool definitions
- MCP tool handler which marshals requests and responses and dispatches to your implementation
- Zod schemas for all data types, requests, and responses
- TypeScript interfaces for all data types

You only need to import `setToolHandler` and `server` but the Zod schemas and TS interfaces are exported as well if you need them.

This emitter is also extensible. You can provide your own dispatcher code generation to handle MCP tool calls in a fully custom way. For example, `typespec-http-mcp-server-js` [leverages this capability](https://github.com/bterlson/typespec-mcp/blob/main/packages/typespec-mcp-http-server-js/src/emitter.tsx#L17) to swap out the default dispatcher with one that calls your REST server's http endpoints.

### `typespec-http-mcp-server-js`: MCP+Rest server emitter

This emitter will create a fully-functioning MCP server that proxies tool calls to REST server endpoints. You just need to add `@tool` on an HTTP operation and this emitter will do the rest!

### `mcp-server-typespec`: MCP server for building TypeSpec projects

We've used the above functionality to build an MCP server for TypeSpec. This MCP server provides the following tools:

- `learnTypeSpec` - Initializes the model with information about how to understand and write TypeSpec.
- `init` - Scaffolds out a new project in the current working directory with example tool implementation.
- `compile` - Runs tsp compile to generate emitter assets
- `build` - Executes npm run build in the current project.

Check out the readme for [installation instructions](https://github.com/bterlson/typespec-mcp/blob/main/README.md#installation) - it's really easy!

## Notes on Emitter Framework

Since the 1.0 release of TypeSpec we have been hard at work building a new emitter framework. It's starting to come together! All the emitters we're previewing are implemented using the new framework. One of the key features we wanted to enable was composition - the ability for emitters to offer reusable components that let others leverage that emitter's codegen in their own projects. As mentioned above, `typespec-mcp-server-js` provides hooks that allow customizing how the dispatching logic works. Another example is the [Zod emitter](https://github.com/bterlson/typespec-zod) which, on its own, converts data types in your TypeSpec to Zod schemas, but can also [be used as a library](https://github.com/bterlson/typespec-zod?tab=readme-ov-file#library-documentation) to drop in Zod schemas where ever they're needed. `typespec-mcp-server-js` [makes good use of this](https://github.com/bterlson/typespec-mcp/blob/main/packages/typespec-mcp-server-js/src/components/ZodTypes.tsx).

There's still a lot more work to do with the emitter framework, but we're happy to see it making progress and it's already capable of building fairly complex emitters.

## Next Steps

It's still early days, so there's still much to do. For the TypeSpec MCP vocabulary and MCP server emitter, we plan to add support for resources and prompts. There is also more marshalling work to do, for example converting dates and times from strings to Temporal objects.

We are also going to continue iterating on the `typespec-http-mcp-server-js` library, with the goal of allowing any REST API defined in TypeSpec to also generate a fully functioning MCP server.

We also look forward to hearing your feedback and ideas! Please feel free to join our [discord server](https://aka.ms/typespec/discord/) or file issues.
