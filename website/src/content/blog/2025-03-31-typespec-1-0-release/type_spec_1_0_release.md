---
slug: 2025-03-31-typespec-1-0-release
title: "Introducing TypeSpec 1.0-RC: APIs at the speed of thought"
image: ./TypeSpec_1_0_RC.png
description: "TypeSpec 1.0-RC is here! Accelerate your API development by automatically generating server-side code, client libraries, schemas, and documentation directly from concise API models, enabling you to focus on innovation rather than implementation details."
publishDate: 2025-03-19
author:
  name: Mario Guerra
  title: Senior Product Manager @ Microsoft
authorAvatar: assets/img/authors/mario_guerra.png
tags:
  - release
  - announcement
---

Ever had a great idea for a new service, only to get bogged down by tedious boilerplate code and manual API specifications? With TypeSpec, you can now turn your API ideas into reality almost as quickly as you think of them.

Okay, so maybe not _that_ quickly, but you get the idea. TypeSpec has been in [development for while now](/blog/2024-04-25-introducing/), and we're excited to be marking a significant milestone for the TypeSpec project with the release of the 1.0 Release Candiate. The 1.0-RC release is a culmination of our efforts to create a powerful, flexible, and user-friendly API design language that meets the needs of developers and organizations alike, both inside and outside of Microsoft.

The feature we're most excited about is the ability to generate server-side and client-side code directly from your TypeSpec source files. This means you can define your API models and operations in a single source of truth, and TypeSpec will handle the rest. No more repetitive coding tasks or worrying about keeping your API implementation in sync with your specifications.

![TypeSpec Workflow Diagram](./workflow-diagram-full.png)

You can also generate OpenAPI specs directly from your TypeSpec definitions, making it easy to integrate with existing workflows.

The code generation feature is launching as part of 1.0-RC in a preview state, we encourage you to try it out and provide us with feedback on our [GitHub repo](https://github.com/microsoft/typespec).

### Server-side code:

Imagine building a "to do" service API. With TypeSpec, you start by defining your data models and operations in a concise and human-readable format. For example:

```tsp
@route("/todoitems")
namespace TodoItems {
  @get
  op getTodoItems(): GetTodoItemsResponse;

  model GetTodoItemsResponse {
    @statusCode statusCode: 200;
    @body todoitems: TodoItem[];
  }

  @post
  op createTodoItem(@body body: CreateTodoItemRequest): CreateTodoItemResponse;

  model CreateTodoItemResponse {
    @statusCode statusCode: 201;
    @body todoitem: TodoItem;
  }
}

model TodoItem {
  id: string;
  content: string;
  isCompleted: boolean;
  labels: string[];
}

model CreateTodoItemRequest {
  content: string;
  labels?: string[];
}
```

From this definition, TypeSpec generates foundational server-side code, such as controllers and models. For example, a generated C# controller method might look like this:

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

And a corresponding model:

```csharp
public partial class TodoItem
{
    public string Id { get; set; }
    public string Content { get; set; }
    public bool IsCompleted { get; set; }
    public string[] Labels { get; set; }
}
```

With the generated code in place, you can quickly integrate it into your project, build the service, and run it. TypeSpec ensures that your API implementation stays perfectly aligned with your specification, saving you time and effort.

- **Note:** The C# service codegen is currently in preview, so there may be gaps in the implementation. We want service codegen to be rock solid when we move from RC to full release, so we encourage you to try it out and tell us if/when it breaks to help us improve this feature.

### Client-side code generation

In addition to server-side code, TypeSpec can generate client-side libraries for multiple languages, including JavaScript, Python, C#, and Java, with support for additional languages like Rust in development.

For example, a generated JavaScript library will allow you to interact with your `todo` API like this:

```javascript
const client = new TodoServiceClient();
const todo = await client.createTodoItem({
  content: "Buy groceries",
  dueDate: "2025-03-21",
  isCompleted: false,
});
console.log(todo);
```

TypeSpec simplifies maintenance by allowing seamless updates to server and client code as APIs evolve, enabling you to focus on business logic rather than repetitive tasks.

## Emitters: From TypeSpec to the API format you need

TypeSpec's core value proposition is the ability to define your API once and generate multiple output formats. The 1.0-RC release ships with a stable OpenAPI 3.0 emitter (`@typespec/openapi3`), enabling you to seamlessly integrate TypeSpec into existing OpenAPI workflows and toolchains.

But our emitter story doesn't stop there. The TypeSpec ecosystem includes several additional emitters:

- **OpenAPI 2.0 Emitter**: For teams that still require Swagger/OpenAPI 2.0 compatibility
- **REST Emitter**: Produces JSON descriptions of REST APIs
- **Protocol Buffer Emitter**: Generates Protocol Buffer (protobuf) definitions
- **JsonSchema Emitter**: Creates JSON Schema documents from your TypeSpec types

While some of these emitters remain in preview as we gather feedback, they demonstrate the extensibility of TypeSpec across different API description formats.

For teams with existing OpenAPI definitions looking to adopt TypeSpec, we've also created the OpenAPI to TypeSpec converter tool. This tool helps you migrate your existing API definitions to TypeSpec, providing a smoother onboarding experience and preserving your investment in OpenAPI. You can find the converter in our [GitHub repository](https://github.com/microsoft/typespec/tree/main/packages/openapi3-to-typespec).

For teams with specialized needs, TypeSpec 1.0-RC includes a new [emitter framework](https://github.com/alloy-framework/alloy) that allows you to build custom emitters. This framework provides access to TypeSpec's compiler APIs and type system, enabling you to transform your TypeSpec definitions into any format your organization requires.

We'll be stabilizing both additional emitters and the emitter framework based on your feedback in upcoming releases. If you're interested in creating custom emitters, check out our [documentation](https://typespec.io/docs/emitters/overview) for guidance and examples.

## Stability of core components

The core components of TypeSpec, including the compiler, HTTP library, OpenAPI emitters, and VS/VSCode extensions, are in a stable state and ready for production use. These components have been thoroughly tested and are designed to provide a reliable foundation for your API development workflows.

## Preview features and known gaps

While the core components are stable, some features, such as the codegen emitters and certain protocol emitters, are still in preview. Here are the known gaps:

- **Service code generation**:

  - Missing support for advanced features like authentication and complex data transformations.
  - Limited documentation and examples.

- **Emitters in preview**:
  - Protocol Buffer Emitter.
  - JsonSchema Emitter.
  - REST Emitter.

We are actively seeking feedback on these preview features to prioritize fixes and enhancements. Your input is invaluable in shaping the future of TypeSpec.

## 1.0 RC packages

The following packages are considered stable and are part of the 1.0-RC release:

### Core

- **@typespec/compiler**: 1.0.0-rc.0
- **@typespec/http**: 1.0.0-rc.0
- **@typespec/openapi**: 1.0.0-rc.0
- **@typespec/standalone-cli**: 1.0.0-rc.0
- **typespec-vscode**: 1.0.0-rc.0

### Protocol emitters

- **@typespec/json-schema**: 1.0.0-rc.0
- **@typespec/openapi3**: 1.0.0-rc.0

These packages have been stable for several months and are ready for production use.

## Preview packages

Some packages remain in preview state as they are still undergoing development and testing. These include:

### Libraries

- **@typespec/events**
- **@typespec/rest**
- **@typespec/sse**
- **@typespec/streams**
- **@typespec/versioning**
- **@typespec/xml**

### Client/server emitters

- **@typespec/http-client-csharp**
- **@typespec/http-client-js**
- **@typespec/http-client-java**
- **@typespec/http-client-python**
- **@typespec/http-server-csharp**
- **@typespec/http-server-js**

## Focus on feedback

User feedback is essential for improving TypeSpec. We encourage you to try out the preview features and share your experiences with us on our [GitHub repo](https://github.com/microsoft/typespec). Whether it’s a bug report, a feature request, or general feedback, your input will help us refine TypeSpec and make it even better.

## Getting started with TypeSpec 1.0-RC

Follow our [install guide](https://typespec.io/docs/), define your models and operations, and generate code with our tools. Visit [our docs page](https://typespec.io/docs/) for guides and examples, or join our [community](https://typespec.io/community/) to connect.

## Next steps

We're excited to see how TypeSpec 1.0-RC transforms your API development workflow! Try it now and experience the power of server and client code generation from a single source of truth. Your feedback during this Release Candidate phase is crucial as we prepare for the final 1.0 release.
