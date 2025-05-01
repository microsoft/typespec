# Speaker Notes: TypeSpec 1.0-RC Presentation

## Slide 1: Title

Hello everyone. I'm excited to talk to you about the TypeSpec 1.0 Release Candidate, which marks a significant milestone for the TypeSpec project. TypeSpec is designed to accelerate your initial API development while providing a sustainable approach to evolving your APIs over time. It lets you design faster today and scale more easily tomorrow.

## Slide 2: What is TypeSpec?

TypeSpec is an open source language and tooling specifically designed for describing API contracts. Created by Microsoft and shared with the broader community, it allows you to define your APIs in a concise, human-readable format that serves as a single source of truth. This means all your API artifacts - from specifications to code - are generated from this one definition, ensuring consistency across your entire API ecosystem.

## Slide 3: What TypeSpec Generates

From a single TypeSpec definition, you can generate multiple artifacts. These include industry-standard API specifications like OpenAPI, JSON Schema, and Protocol Buffers, server-side code skeletons in languages like C# and JavaScript, client libraries in multiple languages including JavaScript, Python, C#, and Java, comprehensive documentation, and even custom formats through our extensible emitter framework. This eliminates the need to maintain separate artifacts that can easily drift out of sync.

## Slide 4: API-First Development

The API-first approach that TypeSpec enables is transformative for development teams. By defining your API contract before implementation, you can generate all the artifacts you need consistently. This eliminates drift between implementations and documentation, accelerates your initial development by handling boilerplate automatically, and makes evolution over time much more sustainable because changes propagate consistently across all outputs.

## Slide 5: Who's Using TypeSpec?

TypeSpec is already proving valuable in real-world scenarios. Multiple teams within Microsoft have adopted it for their API development workflows. The Microsoft Learn Team has highlighted how TypeSpec's intuitive language makes API specifications accessible even to non-engineers. External organizations like the London Stock Exchange Group have reported significant benefits, noting that TypeSpec has shifted their API reviews to focus more on design rather than implementation details or compliance rules. We're seeing adoption across different industries with teams finding creative ways to leverage TypeSpec.

## Slide 6: TypeSpec in Action

Here's a simple example of TypeSpec in action. This code defines a Todo API with operations to get and create todo items. Notice how concise and readable the syntax is - it's clear what the API does and what data structures it uses. The model definitions clearly show the structure of the data, including required fields, types, and special annotations like visibility rules. From this single definition, TypeSpec can generate consistent OpenAPI specifications, client libraries, and server code.

## Slide 7: TypeSpec Workflow

One of the exciting new features in TypeSpec 1.0-RC is code generation. This feature is currently in preview, with active development based on community feedback. From your TypeSpec definition, you can generate both server-side code and client libraries. The server code provides a foundation for your implementation with controllers and models already structured according to your API design. The client libraries offer a consistent, type-safe interface across different languages, ensuring a coherent developer experience regardless of platform.

## Slide 8: What's in 1.0-RC?

The 1.0 Release Candidate includes a mix of stable components and preview features. The stable components include the compiler and core libraries like @typespec/compiler and @typespec/http, IDE support for both VS Code and Visual Studio, and emitters for OpenAPI 3.0 and JSON Schema. These have been heavily tested internally and are considered ready for production use.

We also have several preview features that we're actively developing based on community feedback. These include Protocol Buffer emitters, specialized libraries for various API patterns like events and versioning, and client/server code generation for multiple languages. We welcome your feedback on these preview features as we refine them.

## Slide 9: Emitter Framework

TypeSpec's emitter system allows your API definitions to be transformed into various formats. The stable OpenAPI 3.0 emitter ensures compatibility with existing OpenAPI workflows and toolchains, allowing teams to adopt TypeSpec while maintaining their current API ecosystem. For specialized needs, TypeSpec includes an experimental emitter framework for building custom emitters, giving you access to TypeSpec's compiler APIs and type system. For teams with existing OpenAPI definitions, we've also created a converter tool to help migrate to TypeSpec.

## Slide 10: Community & Ecosystem

We're building a vibrant ecosystem around TypeSpec with multiple channels for support and collaboration. You can report bugs and request features through GitHub Issues, ask questions and discuss ideas in GitHub Discussions, connect with other TypeSpec users in our Discord community, and learn from comprehensive documentation and examples on our website. We welcome contributions in any form - whether it's code, documentation, examples, or simply sharing your experiences using TypeSpec with others.

## Slide 11: Getting Started

Getting started with TypeSpec is straightforward. First, install TypeSpec following our installation guide. Then, create your first API definition using our quickstart guide to learn the basics of TypeSpec syntax. Once you have your definition, you can generate artifacts like OpenAPI specifications, client libraries, and server code. Finally, join our community to share your experiences and get help when needed.

## Slide 12: We Need Your Feedback!

As we prepare for the final 1.0 release, your feedback is essential. We particularly want to hear about your experiences with the preview features, including code generation. Please share your thoughts, bug reports, and feature requests on our GitHub repository. Your input will help shape the future of TypeSpec and ensure it meets the needs of API developers across different scenarios and industries.

## Slide 13: Thank You!

The TypeSpec 1.0-RC marks a significant milestone in our journey to create a powerful, flexible API design language. Try it out today, and help shape the future of TypeSpec through your feedback and contributions. You can find our documentation at typespec.io/docs, our GitHub repository at github.com/microsoft/typespec, and join our Discord community at aka.ms/typespec/discord.

Thank you to everyone who has contributed to TypeSpec so far, whether through code, documentation, testing, or feedback. Your contributions are what make this project possible.
