---
title: Diagnostics
---

The OpenAPI emitter may produce any of the following diagnostic messages.

<!-- Topics within this section should be ordered alphabetically for easy lookup -->

## duplicate-header

This diagnostic is issued when a response header is defined more than once for a response of a specific status code.

**work in progress**

## duplicate-type-name

This diagnostic is issued when a schema or parameter name is a duplicate of another schema or parameter.
This generally happens when a model or parameter is renamed with the `@friendlyName` decorator.

To fix this issue, change the name or friendly-name of one of the models or parameters.

## inline-cycle

**work in progress**

## invalid-default

**work in progress**

## invalid-extension-key

This diagnostic is issued by the `@extension` decorator when the extension key does not start with "x-" as
required by the OpenAPI v3 specification.

To fix this issue, change the extension name to start with "x-".

## invalid-schema

**work in progress**

## invalid-server-variable

This diagnostic is issued when the a variable in the `@server` decorator is not defined as a string type.
Since server variables are substituted into the server URL which is a string, all variables must have string values.

To fix this issue, make sure all server variables are string type.

## path-query

This diagnostic is issued when the OpenAPI emitter finds an `@route` decorator that specifies a path that contains a query parameter.
This is not permitted by the OpenAPI v3 specification.

To fix this issue, redesign the API to only use paths without query parameters.

## union-null

This diagnostic is issued when the result of model composition is effectively a `null` schema which cannot be
represented in OpenAPI.

To fix this issue, correct the composition to produce a valid schema or remove it altogether.

## union-unsupported

This diagnostic is issued when the OpenAPI emitter finds a union of two incompatible types.

To fix this issue, correct the composition to produce a valid schema or remove it altogether.
