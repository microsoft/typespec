# Change Log - @typespec/http

This log was last generated on Tue, 11 Jul 2023 22:06:00 GMT and should not be manually modified.

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

