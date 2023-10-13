---
id: emitter-metadata-handling
title: Handling metadata and visibility in emitters for REST API
---

# Handling metadata and visibility in emitters for REST API

It's important that all emitters for REST API handle [automatic visibility](../standard-library/http/operations.md#automatic-visibility) and [metadata](../standard-library/http/operations.md#metadata) consistently. Make sure to read through the TypeSpec-author documentation of these features to understand how they work. This document will cover how to incorporate them correctly into your own emitter.

The standard `@typespec/rest` library provides JavaScript API for emitters to interpret API written using its decorators. We'll look at the API that are particularly relevant to these features.

Note that when we say that emitters must handle things consistently, we mean that they must agree on how data is sent and received over the wire. After all, a TypeSpec _specification_ must be able to serve as a source-of-truth on these details. Nevertheless, emitters are still free to _abstract_ things above this level and to make different choices in doing so. For example, the OpenAPI emitter will sometimes split a single TypeSpec model into multiple suffixed schemas with names like `UserCreate` and `UserUpdate` while a client SDK emitter may choose to emit a single `User` class that that can be serialized to a request or deserialized from a response with different fields present in different cases. In fact, these features were designed specifically to allow a TypeSpec specification to be written in terms of logical entities that emitters could then preserve.

## Getting started

If you haven't written an emitter before, start with [emitter basics](./emitters-basics.md).

Then look at the [REST metadata emitter sample](https://github.com/microsoft/typespec/tree/main/packages/samples/rest-metadata-emitter). This emitter sample uses all of the API discussed below to write out a simple textual representation. It deliberately does not split types like the OpenAPI emitter in order to emphasize that this is not required. Instead, it adds contextual remarks to denote how data depends on context.

However, if your emitter does want to split types as OpenAPI does, then it will still use the same API. Cross-referencing with where the official [OpenAPI emitter] calls these API can also be instructive.

## Key API

These are the main API involved in handling these features. See the linked API reference documentation for more details.

- [`getRequestVisibility(HttpVerb): Visibility`](../standard-library/http/reference/js-api/index.md#getrequestvisibility) - Use this to determine the visibility implied for data in the request parameters or body. Also note that [`Visibility.Read`](../standard-library/http/reference/js-api/enumerations/Visibility.md#item) is always applied for response data and therefore there is no corresponding API for the response.

- [`MetadataInfo`](../standard-library/http/reference/js-api/interfaces/MetadataInfo.md) - Create this once for each program using [`createMetadataInfo(Program, MetadataInfoOptions)`](../standard-library/http/reference/js-api/index.md#createmetadatainfo) then use it to reason about metadata and visibility implications with the API below.

- [`MetadataInfo.getEffectivePayloadType(Type, Visibility): Type`](../standard-library/http/reference/js-api/interfaces/MetadataInfo.md#geteffectivepayloadtype) - Use this recursively on every type that is referenced. When given an anonymous model sourced entirely from a single named model after metadata is moved elsewhere or invisible properties are removed, it will recover the named model. This handles the commonly discussed case of seeing that `op something(...Thing)` receives a `Thing` in its request body, but also many other cases..

- [`MetadataInfo.isTransformed(Model, Visibility)`](../standard-library/http/reference/js-api/interfaces/MetadataInfo.md#istransformed) - Use this to check if a type undergoes any changes in shape due to visibility or metadata. If not, this can allow for simplifications in emit.

- [`MetadataInfo.isPayloadProperty(ModelProperty, Visibility): boolean`](../standard-library/http/reference/js-api/interfaces/MetadataInfo.md#ispayloadproperty) - Use this to check if a property is transmitted as an object property in the payload and is not invisible or metadata sent elsewhere.

- [`MetadataInfo.isOptional(ModelProperty, Visibility): boolean`](../standard-library/http/reference/js-api/interfaces/MetadataInfo.md#isoptional) - Use this to determine if a property is optional for the given visibility. This will differ from `ModelProperty.isOptional` when the Visibility is Update in which case the property is always considered optional.

- [`Visibility.Item`](../standard-library/http/reference/js-api/enumerations/Visibility.md#item) - Add this flag when recursing into an array. This moves all metadata into the payload, which can be useful in scenarios like batching API calls.
