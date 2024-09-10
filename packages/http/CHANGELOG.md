# Change Log - @typespec/http

## 0.60.0

### Bug Fixes

- [#4322](https://github.com/microsoft/typespec/pull/4322) Use user provided description of model if model has a status code property(detect it as an response envelope)

### Features

- [#4139](https://github.com/microsoft/typespec/pull/4139) Internals: Migrate to new api for declaring decorator implementation


## 0.59.1

### Bug Fixes

- [#4155](https://github.com/microsoft/typespec/pull/4155) HotFix: Uri template not correctly built when using `@autoRoute`


## 0.59.0

### Bug Fixes

- [#3909](https://github.com/microsoft/typespec/pull/3909) Fix `HttpPart` not respecting explicit part name by always using the property name
- [#3933](https://github.com/microsoft/typespec/pull/3933) Fix some diagnostic not showing the right message

### Bump dependencies

- [#3948](https://github.com/microsoft/typespec/pull/3948) Update dependencies

### Features

- [#4046](https://github.com/microsoft/typespec/pull/4046) API: Expose `properties: HttpProperty[]` on operation parameter and response which reference all the properties of interest(Body, statusCode, contentType, implicitBodyProperty, etc.)
- [#3932](https://github.com/microsoft/typespec/pull/3932) `@route` can now take a uri template as defined by [RFC-6570](https://datatracker.ietf.org/doc/html/rfc6570#section-3.2.3)

  ```tsp
  @route("files{+path}") download(path: string): void;
  ```

### Deprecations

- [#3932](https://github.com/microsoft/typespec/pull/3932) API deprecation: `HttpOperation#pathSegments` is deprecated. Use `HttpOperation#uriTemplate` instead.
- [#3932](https://github.com/microsoft/typespec/pull/3932) Deprecated `@query({format: })` option. Use `@query(#{explode: true})` instead of `form` or `multi` format. Previously `csv`/`simple` is the default now.
  Decorator is also expecting an object value now instead of a model. A deprecation warning with a codefix will help migrating.

  ```diff
  - @query({format: "form"}) select: string[];
  + @query(#{explode: true}) select: string[];
  ```


## 0.58.0

### Bump dependencies

- [#3718](https://github.com/microsoft/typespec/pull/3718) Dependency updates July 2024

### Features

- [#3717](https://github.com/microsoft/typespec/pull/3717) Allow overriding base operation verb
- [#3676](https://github.com/microsoft/typespec/pull/3676) Expose `getHttpPart` and types functions
- [#3732](https://github.com/microsoft/typespec/pull/3732) Expose `model` property on `HttpAuth` to retrieve original type used to define security scheme

### Breaking Changes

- [#3737](https://github.com/microsoft/typespec/pull/3737) Keep trailing slash when building http routes, this is breaking if you used to have `@route()` ending with `/`.
  
  | TypeSpec                                                         | Before            | After              |
  | ---------------------------------------------------------------- | ----------------- | ------------------ |
  | `@route("users/")`                                               | `users`           | `users/`           |
  | `@route("users")`                                                | `users`           | `users`            |
  | on interface `@route("users/")` and on op `@route("addresses/")` | `users/addresses` | `users/addresses/` |
  | on interface `@route("users/")` and on op `@route("addresses")`  | `users/addresses` | `users/addresses`  |


## 0.57.0

### Bug Fixes

- [#3022](https://github.com/microsoft/typespec/pull/3022) Update Flow Template to make use of the new array values

### Bump dependencies

- [#3401](https://github.com/microsoft/typespec/pull/3401) Update dependencies - May 2024

### Features

- [#3342](https://github.com/microsoft/typespec/pull/3342) Add new multipart handling. Using `@multipartBody` with `HttpPart<Type, Options>`. See [multipart docs](https://typespec.io/docs/next/libraries/http/multipart) for more information.
  
  ```tsp
  op upload(@header contentType: "multipart/mixed", @multipartBody body: {
    name: HttpPart<string>;
    avatar: HttpPart<bytes>[];
  }): void;
  ```
- [#3462](https://github.com/microsoft/typespec/pull/3462) Use new compiler automatic `all` ruleset instead of explicitly provided one


## 0.56.0

### Bug Fixes

- [#3196](https://github.com/microsoft/typespec/pull/3196) Fix password flow defining `authorizationUrl` instead of `tokenUrl`
- [#3190](https://github.com/microsoft/typespec/pull/3190) Fix `@path` param mapping when spreading a record in operation parameters
- [#3218](https://github.com/microsoft/typespec/pull/3218) Fix: `@path` property shouldn't be applicableMetadata if the visibility contains `Read`

### Bump dependencies

- [#3169](https://github.com/microsoft/typespec/pull/3169) Update dependencies

### Breaking Changes

- [#2945](https://github.com/microsoft/typespec/pull/2945) Empty model after removing metadata and applying visibility always results in "void"
  This means the following case have changed from returning `{}` to no body
  
  ```tsp
  op b1(): {};
  op b2(): {@visibility("none") prop: string};
  op b3(): {@added(Versions.v2) prop: string};
  ```
  
  Workaround: Use explicit `@body`
  
  ```tsp
  op b1(): {@body _: {}};
  op b2(): {@body _: {@visibility("none") prop: string}};
  op b3(): {@body _: {@added(Versions.v2) prop: string}};
  ```
- [#2945](https://github.com/microsoft/typespec/pull/2945) Implicit status code always 200 except if response is explicitly `void`
  
  ```tsp
  op c1(): {@header foo: string}; // status code 200 (used to be 204)
  ```
  
  Solution: Add explicit `@statusCode`
  ```tsp
  op c1(): {@header foo: string, @statusCode _: 204};
  op c1(): {@header foo: string, ...NoContent}; // or spread common model
  ```
- [#2945](https://github.com/microsoft/typespec/pull/2945) `@body` means this is the body

  This change makes using `@body` mean this is the exact body and everything underneath will be included, including metadata properties. If metadata properties are present on the body, a warning will be logged.
  
  ```tsp
  op a1(): {@body _: {@header foo: string, other: string} };
                  ^ warning header in a body, it will not be included as a header.
  ```
  
  Use `@bodyRoot` if you want to only change where to resolve the body from.
  
  ```tsp
  op a1(): {@bodyRoot _: {@header foo: string, other: string} };
  ```
- [#2945](https://github.com/microsoft/typespec/pull/2945) Properties are not automatically omitted if everything was removed from metadata or visibility

  ```tsp
  op d1(): {headers: {@header foo: string}}; // body will be {headers: {}}
  ```
  
  Solution: use `@bodyIgnore`
  
  ```tsp
  op d1(): {@bodyIgnore headers: {@header foo: string}}; // body will be {headers: {}}
  ```


## 0.55.0

### Bump dependencies

- [#3027](https://github.com/microsoft/typespec/pull/3027) Update dependencies


## 0.54.0

### Bug Fixes

- [#2948](https://github.com/microsoft/typespec/pull/2948) Fix don't emit shared route error when verb don't match

### Bump dependencies

- [#2900](https://github.com/microsoft/typespec/pull/2900) Update dependencies

### Features

- [#2901](https://github.com/microsoft/typespec/pull/2901) Add ability to sepcify authentication and different scopes per operation
- [#2958](https://github.com/microsoft/typespec/pull/2958) Validate that only one `@useAuth` decorator is applied to a type.


## 0.53.0

### Patch Changes

- 8ed1d82: Fix: OpenIDConnect types not exposed on the TypeScript types


## 0.52.0

Wed, 24 Jan 2024 05:46:53 GMT

### Updates

- Fix: `@path` custom name not respected
- Fix: Wrong route generated when path parameter is not alpha numeric(Either with a different name provided in `@path` or if the property name is not an identifier)
- Migrate to new Internal/Public library definition
- Rename template parameters in preparation for named template argument instantiation.
- Update dependencies

## 0.51.0

Wed, 06 Dec 2023 19:40:58 GMT

### Updates

- Add diagnostic when a namespace exists with routes, but no namespace is marked with `@service`.

## 0.50.0

Wed, 08 Nov 2023 00:07:17 GMT

### Updates

- `TypeScript` use `types` entry under `exports` of `package.json` instead of legacy `typesVersions` to provide the definition files
- **BREAKING CHANGE** Dropped support for node 16, minimum node version is now 18

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
- Add validation step to check whether any operation references another operation with a route prefix defined on a parent container. This helps avoid unexpected route changes when using operation references.
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
- Deprecate the `shared` option in the `@route` decorator. `@sharedRoute` is the new way to accomplish the same behavior.
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
