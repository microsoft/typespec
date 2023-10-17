# Change Log - @typespec/http

This log was last generated on Wed, 11 Oct 2023 23:31:35 GMT and should not be manually modified.

## 0.49.0
Wed, 11 Oct 2023 23:31:35 GMT

### Updates

- Add support for `@returns` and `@errors` doc comment tags.
- Add support for status code ranges for http responses. **Change to API** Http responses can now also return a `HttpStatusCodeRange` object for their status codes
- Emit error when multiple properties on a response model have the `@statusCode` decorator.
- Update dependencies

## 0.48.0
Tue, 12 Sep 2023 21:47:11 GMT

### Updates

- Deprecated `getRequestVisibility`. Added methods `getDefaultVisibilityForVerb` and `resolveRequestVisibility`. Use either depending on the situation.
- Add validation step to check whether any operation references another operation with a route prefix defined on a parent container.  This helps avoid unexpected route changes when using operation references.
- Avoid runtime errors when `OAuth2Auth` is given invalid `OAuth2Flow` arguments

## 0.47.0
Tue, 08 Aug 2023 22:32:10 GMT

### Updates

- Update doc for openapi developers
- Add collection format support: simple, form, ssv, tsv, pipes

## 0.46.0
Tue, 11 Jul 2023 22:06:00 GMT

### Updates

- Add documentation on `@header` auto header name resolution from property name.
- Support nested `@body`
- Update dependencies

## 0.45.0
Tue, 06 Jun 2023 22:44:16 GMT

### Updates

- Uptake doc comment changes
- Update decorators to use `valueof`
- Update decorators signature to use `{}` instead of `object`
- Add signature for missing decorators

## 0.44.0
Wed, 10 May 2023 21:24:00 GMT

### Updates

- Cleanup deprecated use
- No longer issues an error for multiple different responses for the same status code.
- Add `@sharedRoute` decorator for marking operations as sharing a route with other operations
- Deprecate the `shared` option in the `@route` decorator.  `@sharedRoute` is the new way to accomplish the same behavior.
- Update dependencies

## 0.43.1
Fri, 14 Apr 2023 15:09:01 GMT

### Patches

- **Fix** query format not accepting anything other than `csv` and `multi`

## 0.43.0
Tue, 11 Apr 2023 18:49:17 GMT

### Updates

- **Breaking change** `@header` and `@query` no longer default the `format` to `csv` and `multi` respectively. A value must now be provided when the type is an array.

## 0.42.0
Mon, 13 Mar 2023 21:30:44 GMT

### Updates

- Make canonical visibility configurable and default to none.

## 0.41.0
Fri, 03 Mar 2023 19:59:17 GMT

### Updates

- Move core HTTP functionality from `@typespec/rest` into a new `@typespec/http` library

