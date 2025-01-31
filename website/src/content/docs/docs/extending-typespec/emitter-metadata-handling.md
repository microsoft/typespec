---
id: emitter-metadata-handling
title: Managing metadata and visibility in REST API emitters
---

Ensuring consistent handling of [automatic visibility](../libraries/http/operations.md#automatic-visibility) and [metadata](../libraries/http/operations.md#metadata) by all REST API emitters is crucial. To understand how these features work, please refer to the TypeSpec-author documentation. This guide will help you integrate these features into your own emitter correctly.

The standard `/rest` library offers a JavaScript API for emitters to interpret APIs written using its decorators. We will focus on the APIs that are specifically relevant to these features.

When we say that emitters should handle things consistently, we mean they should agree on how data is transmitted and received. A TypeSpec _specification_ should serve as a reliable reference for these details. However, emitters can still _abstract_ things above this level and make different choices. For instance, the OpenAPI emitter may split a single TypeSpec model into multiple suffixed schemas like `UserCreate` and `UserUpdate`, while a client SDK emitter might emit a single `User` class that can be serialized to a request or deserialized from a response with different fields present in different situations. These features were specifically designed to allow a TypeSpec specification to be written in terms of logical entities that emitters could then maintain.

## Getting started

If you're new to writing emitters, begin with the [emitter basics](./emitters-basics.md).

Next, examine the [REST metadata emitter sample](https://github.com/microsoft/typespec/tree/main/packages/samples/specs/rest-metadata-emitter). This sample uses all of the APIs discussed below to create a simple textual representation. It intentionally avoids splitting types like the OpenAPI emitter to highlight that this is not mandatory. Instead, it includes contextual comments to indicate how data depends on context.

However, if you want your emitter to split types like OpenAPI, you can still use the same API. Cross-referencing with the official [OpenAPI emitter](../emitters/openapi3/openapi.md) where these APIs are called can also be helpful.

## Key API

Here are the main APIs involved in managing these features. For more details, refer to the linked API reference documentation.

- [`getRequestVisibility(HttpVerb): Visibility`](../libraries/http/reference/js-api/functions/getRequestVisibility.md) - Use this to determine the visibility implied for data in the request parameters or body. Note that [`Visibility.Read`](../libraries/http/reference/js-api/enumerations/Visibility.md) is always applied for response data, so there is no corresponding API for the response.

- [`MetadataInfo`](../libraries/http/reference/js-api/interfaces/MetadataInfo.md) - Create this once for each program using [`createMetadataInfo(Program, MetadataInfoOptions)`](../libraries/http/reference/js-api/functions/createMetadataInfo.md). Then use it to understand metadata and visibility implications with the APIs below.

- [`MetadataInfo.getEffectivePayloadType(Type, Visibility): Type`](../libraries/http/reference/js-api/interfaces/MetadataInfo.md#geteffectivepayloadtype) - Use this recursively on every referenced type. When given an anonymous model sourced entirely from a single named model after metadata is moved elsewhere or invisible properties are removed, it will recover the named model. This handles the commonly discussed case of seeing that `op something(...Thing)` receives a `Thing` in its request body, among other cases.

- [`MetadataInfo.isTransformed(Model, Visibility)`](../libraries/http/reference/js-api/interfaces/MetadataInfo.md#istransformed) - Use this to check if a type undergoes any shape changes due to visibility or metadata. If not, this can allow for simplifications in emit.

- [`MetadataInfo.isPayloadProperty(ModelProperty, Visibility): boolean`](../libraries/http/reference/js-api/interfaces/MetadataInfo.md#ispayloadproperty) - Use this to check if a property is transmitted as an object property in the payload and is not invisible or metadata sent elsewhere.

- [`MetadataInfo.isOptional(ModelProperty, Visibility): boolean`](../libraries/http/reference/js-api/interfaces/MetadataInfo.md#isoptional) - Use this to determine if a property is optional for the given visibility. This will differ from `ModelProperty.isOptional` when the Visibility is Update, in which case the property is always considered optional.

- [`Visibility.Item`](../libraries/http/reference/js-api/enumerations/Visibility.md) - Add this flag when recursing into an array. This moves all metadata into the payload, which can be useful in scenarios like batching API calls.

## Working with metadata and visibility

When working with metadata and visibility, it's important to understand how they interact with each other and with the data being transmitted. Here are some key points to consider:

- Metadata is data about the data being transmitted. It can include information like the data's origin, when it was created or last updated, who created or updated it, and so on. Metadata is not usually visible to the end user, but it can be crucial for the system processing the data.

- Visibility determines what data is visible to the end user or the system at any given time. For example, some data might be visible only to the system, some only to the end user, and some to both. Visibility can change depending on the context, such as whether the data is being created, read, updated, or deleted.

- The `getRequestVisibility(HttpVerb): Visibility` API is used to determine the visibility implied for data in the request parameters or body. Note that `Visibility.Read` is always applied for response data, so there is no corresponding API for the response.

- The `MetadataInfo` API is used to create a metadata object for each program, which can then be used to reason about metadata and visibility implications.

- The `MetadataInfo.getEffectivePayloadType(Type, Visibility): Type` API is used recursively on every type that is referenced. It recovers the named model when given an anonymous model sourced entirely from a single named model after metadata is moved elsewhere or invisible properties are removed.

- The `MetadataInfo.isTransformed(Model, Visibility)` API is used to check if a type undergoes any changes in shape due to visibility or metadata. If not, this can allow for simplifications in emit.

- The `MetadataInfo.isPayloadProperty(ModelProperty, Visibility): boolean` API is used to check if a property is transmitted as an object property in the payload and is not invisible or metadata sent elsewhere.

- The `MetadataInfo.isOptional(ModelProperty, Visibility): boolean` API is used to determine if a property is optional for the given visibility. This will differ from `ModelProperty.isOptional` when the Visibility is Update, in which case the property is always considered optional.

- The `Visibility.Item` flag is added when recursing into an array. This moves all metadata into the payload, which can be useful in scenarios like batching API calls.

By understanding and correctly using these APIs and concepts, you can ensure that your emitter handles metadata and visibility consistently and effectively.
