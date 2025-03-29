---
slug: 2025-03-31-typespec-1-0-release
title: "TypeSpec 1.0-RC: Write your API once, let TypeSpec do the rest"
image: ./TypeSpec_1_0_RC.png
description: "The TypeSpec 1.0 Release Candidate is here! This open-source project, created by Microsoft, brings a powerful yet concise API modeling language that generates server code, client libraries, schemas, and documentation from a single source of truth."
publishDate: 2025-03-19
author:
  name: Mario Guerra
  title: Senior Product Manager @ Microsoft
authorAvatar: assets/img/authors/mario_guerra.png
tags:
  - release
  - announcement
---

We're excited to announce the TypeSpec 1.0 Release Candidate, marking a significant milestone for the TypeSpec project. TypeSpec embodies a simple yet powerful principle: write your API once, and let TypeSpec take care of the rest. This straightforward approach allows you to focus on designing the perfect API contract while TypeSpec handles generating all the artifacts you need - from OpenAPI specifications to client libraries and server code scaffolding - saving you time and eliminating inconsistencies.

## What is TypeSpec?

TypeSpec is a language for describing API contracts. Using TypeSpec, you write your API definition in a concise, human-readable format, and TypeSpec takes care of generating:

- API specifications (OpenAPI, JSON Schema, Protocol Buffers)
- Server-side code skeletons (C#, JavaScript)
- Client libraries in multiple languages (JavaScript, Python, C#, Java)
- Documentation
- Custom formats through our emitter framework

This API-first development approach accelerates your initial API development by generating boilerplate code automatically, while also eliminating the need to maintain multiple, separate artifacts that can easily drift out of sync as your API evolves.

## Who's using TypeSpec?

TypeSpec is already being used by teams both inside and outside Microsoft to streamline their API development workflows:

> "One of the highlights [of using TypeSpec] was our ability to author API specs in a very simple and intuitive language. This meant that even [our PMs] who are not engineers were able to understand these API specifications. They could review them, make comments, and participate in designing those APIs."
>
> — _MS Learn Team_

> Before the introduction of TypeSpec and our move to an API first approach, an OAS [OpenAPI Specification] was a byproduct of the implementation phase. Manual OAS reviews were happening at the end of the development cycle and changes were contentious because of the code rework implied and the likely impact to the release schedule. TypeSpec provides a way to embed [our] guidelines and rules directly in the design. Reviews are now focused more on the design than on the rules and requires less time." [(read more)](../2024-11-04-typespec-at-lseg/blog.md)
>
> — _London Stock Exchange Group_

You can explore more real-world TypeSpec usage on our [videos page](https://typespec.io/videos/), featuring presentations from both Microsoft teams and external community members showing how they're using TypeSpec to improve their API development workflows.

## What's in the 1.0 Release Candidate

The 1.0-RC includes a foundation of stable core components alongside preview features that are still actively being developed based on community feedback.

### Stable components

These components have been thoroughly tested and are considered ready for testing in your production environment:

- **Compiler and core libraries**

  - [@typespec/compiler](https://www.npmjs.com/package/@typespec/compiler): The TypeSpec language compiler
  - [@typespec/http](https://www.npmjs.com/package/@typespec/http): HTTP protocol support
  - [@typespec/openapi](https://www.npmjs.com/package/@typespec/openapi): OpenAPI support

- **IDE support**

  - [typespec-vscode](https://marketplace.visualstudio.com/items?itemName=typespec.typespec-vscode): VS Code extension
  - [typespec.typespecvs](https://marketplace.visualstudio.com/items?itemName=typespec.typespecvs): Visual Studio extension

- **Stable emitters**
  - [@typespec/openapi3](https://www.npmjs.com/package/@typespec/openapi3): OpenAPI 3.0 output
  - [@typespec/json-schema](https://www.npmjs.com/package/@typespec/json-schema): JSON Schema output

### Preview features

We're also including several components in preview state that are still being developed. We welcome your feedback on these features:

- **Protocol emitters**

  - [@typespec/protobuf](https://www.npmjs.com/package/@typespec/protobuf): Protocol Buffer definitions

- **Libraries**

  - [@typespec/events](https://www.npmjs.com/package/@typespec/events)
  - [@typespec/rest](https://www.npmjs.com/package/@typespec/rest)
  - [@typespec/sse](https://www.npmjs.com/package/@typespec/sse)
  - [@typespec/streams](https://www.npmjs.com/package/@typespec/streams)
  - [@typespec/versioning](https://www.npmjs.com/package/@typespec/versioning)
  - [@typespec/xml](https://www.npmjs.com/package/@typespec/xml)

- **Client/server code generation (Preview)**
  - [@typespec/http-client-csharp](https://www.npmjs.com/package/@typespec/http-client-csharp)
  - [@typespec/http-client-js](https://www.npmjs.com/package/@typespec/http-client-js)
  - [@typespec/http-client-java](https://www.npmjs.com/package/@typespec/http-client-java)
  - [@typespec/http-client-python](https://www.npmjs.com/package/@typespec/http-client-python)
  - [@typespec/http-server-csharp](https://www.npmjs.com/package/@typespec/http-server-csharp)
  - [@typespec/http-server-js](https://www.npmjs.com/package/@typespec/http-server-js)

## TypeSpec in action

Let's see how TypeSpec works with a simple Todo API example. First, you define your API using TypeSpec's concise syntax:

```tsp title=main.tsp tryit="{"emit": ["@typespec/openapi3"]}"
import "@typespec/http";
import "@typespec/rest";
using Http;
using Rest;

@route("/todoitems")
interface TodoItems {
  @get getTodoItems(): TodoItem[];
  @post createTodoItem(@body body: CreateTodoItem): Http.CreatedResponse & TodoItem;
}

model TodoItem {
  @visibility(Lifecycle.Read)
  id: string;

  content: string;
  dueDate: utcDateTime;
  isCompleted: boolean;
  labels?: string[];
}

model CreateTodoItem {
  content: string;
  labels?: string[];
}
```

From this single definition, TypeSpec can generate multiple artifacts that keep your API implementation consistent across languages and platforms. One of the most powerful capabilities is the ability to generate both client and server code directly from your TypeSpec definition.

## Code generation (Preview)

One of the exciting new features in TypeSpec 1.0-RC is the ability to generate both server-side and client-side code. This feature is currently in preview, and we're actively seeking feedback to refine it.

![TypeSpec Workflow Diagram](./workflow-diagram-full.png)

### Server-side code

With the server-side code generators, TypeSpec can produce controller and model code from your API definition that serves as a foundation for your implementation:

```csharp
[HttpGet]
[Route("/todoitems")]
[ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(TodoItem[]))]
public virtual async Task<IActionResult> GetTodoItems()
{
    var result = await TodoItemsOperationsImpl.GetTodoItemsAsync();
    return Ok(result);
}
```

### Client libraries

TypeSpec can also generate client libraries in multiple languages, providing a consistent, type-safe interface to your API:

```javascript
const client = new TodoServiceClient();
const todo = await client.createTodoItem({
  content: "Buy groceries",
  dueDate: new Date("2025-03-31"),
  isCompleted: false,
});
console.log(todo);
```

### Current limitations

The code generation features are currently in preview and have a few technical limitations to be aware of:

- Limited support for authentication mechanisms
- Complex data transformations may require manual coding
- Not all HTTP features are fully supported
- Documentation for these features is still being developed

We're actively working to address these limitations and we welcome your feedback.

## Emitters: From TypeSpec to different formats

TypeSpec's emitter system allows your API definitions to be transformed into various formats. The 1.0-RC includes stable emitters for OpenAPI 3.0 and JSON Schema, with additional emitters in preview.

The OpenAPI 3.0 emitter is particularly important as it ensures compatibility with existing OpenAPI workflows and toolchains, allowing teams to adopt TypeSpec while maintaining their current API ecosystem. This means you can gradually introduce TypeSpec into your development process without disrupting existing tools and processes that depend on OpenAPI specifications.

### Custom emitters with the emitter framework

For teams with specialized needs, TypeSpec 1.0-RC includes a new experimental emitter framework that allows you to build custom emitters. This framework provides access to TypeSpec's compiler APIs and type system, enabling you to transform your TypeSpec definitions into any format your organization needs.

The emitter framework is designed to be extensible and developer-friendly, with clear patterns for accessing the TypeSpec type system, transforming types, and generating output. This opens up possibilities for creating custom emitters for internal specifications, proprietary formats, or integration with existing toolchains.

For teams with existing OpenAPI definitions, we've created an [OpenAPI to TypeSpec converter tool](https://typespec.io/docs/emitters/openapi3/cli/) to help migrate existing API definitions to TypeSpec.

## Community support and contributions

TypeSpec is an [open source project](https://github.com/microsoft/typespec) developed by Microsoft and shared with the community. We're working to build a vibrant ecosystem around TypeSpec with multiple channels for support, collaboration, and knowledge sharing:

- **[GitHub Issues](https://github.com/microsoft/typespec/issues)**: For bug reports, feature requests, and technical discussions
- **[Discord Community](https://aka.ms/typespec/discord/)**: Connect with other TypeSpec users and contributors
- **[Documentation](https://typespec.io/docs/)**: Comprehensive guides and examples on typespec.io

We welcome contributions and feedback from the community in any form - whether it's code, documentation, examples, or simply sharing your experiences using TypeSpec with others. While TypeSpec is developed by Microsoft, support is provided through these community channels rather than official Microsoft support services.

## Getting started

To start using TypeSpec 1.0-RC:

1. **Install TypeSpec**: Follow our [installation guide](https://typespec.io/docs/) to set up TypeSpec in your environment.
2. **Create your first TypeSpec definition**: Follow our [quickstart guide](https://typespec.io/docs/getting-started/getting-started-rest/01-setup-basic-syntax/) to learn the basics of TypeSpec syntax and features and create a simple API definition.
3. **Generate artifacts**: Use the TypeSpec CLI or IDE extensions to generate server code, client libraries, and API specifications from your TypeSpec definition.
4. **Join our community**: Connect with other TypeSpec users in our [Discord community](https://aka.ms/typespec/discord)

## We need your feedback!

As we prepare for the final 1.0 release, your feedback is essential. We particularly want to hear about your experiences with the preview features, including code generation.

Please share your thoughts, bug reports, and feature requests on our [GitHub repo](https://github.com/microsoft/typespec).

## Next steps

The TypeSpec 1.0-RC marks a significant milestone in our journey to create a powerful, flexible API design language. Try it out today, and help shape the future of TypeSpec through your feedback and contributions.

Thank you to everyone who has contributed to TypeSpec so far, whether through code, documentation, testing, or feedback. Your contributions are what make this project possible.
