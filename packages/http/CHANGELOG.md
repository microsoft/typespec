# Change Log - @typespec/http

## 1.0.0-rc.0

### Breaking Changes

- [#6557](https://github.com/microsoft/typespec/pull/6557) Remove support for deprecated implicit multipart, migrate to explicit part with `@multipartBody` and `HttpPart<T>`
  
    ```diff lang=tsp
    op upload(
      @header contentType: "multipart/form-data",
    -  @body body: {
    +  @multipartBody body: {
    -    name: string;
    +    name: HttpPart<string>;
    -    avatar: bytes;
    +    avatar: HttpPart<bytes>;
      }
    ): void;
    ```
- [#6563](https://github.com/microsoft/typespec/pull/6563) Separate file bodies into their own `bodyKind`.
  
  The HTTP library will now return a body with `bodyKind: "file"` in all cases where emitters should treat the body as a file upload or download. Emitters that previously attempted to recognize File bodies by checking the `type` of an HTTP `"single"` body may now simply check if the `bodyKind` is `"file"`. This applies to all HTTP payloads where an `HttpOperationBody` can appear, including requests, responses, and multipart parts.

### Features

- [#6559](https://github.com/microsoft/typespec/pull/6559) [API] Expose `property?` on `HttpOperationPart`
- [#6652](https://github.com/microsoft/typespec/pull/6652) Add validation when using path or query options with the default value while the parameter is referenced in the uri template

### Bump dependencies

- [#6595](https://github.com/microsoft/typespec/pull/6595) Upgrade dependencies

### Bug Fixes

- [#6542](https://github.com/microsoft/typespec/pull/6542) Query parameter with `-` will be correctly represented in the resulting uri template
- [#6472](https://github.com/microsoft/typespec/pull/6472) Path parameters can now be optional under specific circumstances. This fix updates the validation to ensure it doesn't trigger in these scenarios.
  
  An optional parameter should have a leading `/` inside the `{}`.
  
  For example:
  
  ```tsp
  @route("optional{/param}/list")
  op optional(@path param?: string): void;
  ```
  
  Another supported scenario is using `@autoRoute`:
  ```tsp
  @autoRoute
  op optional(@path param?: string): void;
  ```


## 0.67.0

### Breaking Changes

- [#6387](https://github.com/microsoft/typespec/pull/6387) Removing deprecated items

- `isContentTypeHeader`
- `setLegacyStatusCodeState`

Moved to internal

- `setStatusCode`
- [#6305](https://github.com/microsoft/typespec/pull/6305) Remove deprecated items:

- `format` option from `@header` and `@query` decorators. Use `explode` option instead.

  ```diff
  -@header(#{ format: "multi"})
  -@query(#{ format: "multi"})
  +@header(#{ explode: true })
  +@query(#{ explode: true })
  ```
- `shared` option from `@route` decorator. Please use `@sharedRoute` instead.

  ```diff
  -@route("/doStuff", { shared: true })
  +@sharedRoute
  +@route("/doStuff")
  ```

- Javascript functions and typescript types:

  - `HeaderOptions.format`
  - `HeaderFieldOptions.format`
  - `QueryOptions.format`
  - `QueryParameterOptions.format`
  - `MetadataInfo.isEmptied`
  - `includeInterfaceRoutesInNamespace`
  - `getAllRoutes` -> `getAllHttpServices`
  - `OperationDetails` -> `HttpOperation`
  - `ServiceAuthentication` -> `Authentication`
  - `HttpOperationParameters.bodyType` -> `body.type`
  - `HttpOperationParameters.bodyParameter` -> `body.parameter`
  - `StatusCode` -> `HttpStatusCodesEntry`
- [#6433](https://github.com/microsoft/typespec/pull/6433) Stop exposing APIs that were not meant for external users. Please file issue if you had legitmate use of some of those APIs.
  - `@includeInapplicableMetadataInPayload` decorator was moved to `Private` namespace and stop exposing the accessor.
  - Functions used in  `getHttpOperation` to resolve the finalized view of the http operation but shouldn't be used directly.
    - `resolvePathAndParameters`
  - `validateRouteUnique` internal api used in http library validation
  - Moved custom route producer related APIs to experimental with `unsafe_` prefix. Those APIs are not ready for public use and **will** change in future.
    - `DefaultRouteProducer` -> `unsafe_DefaultRouteProducer`
    - `getRouteProducer` -> `unsafe_getRouteProducer`
    - `setRouteProducer` -> `unsafe_setRouteProducer`
    - `setRouteOptionsForNamespace` -> `unsafe_setRouteOptionsForNamespace`
    - `RouteProducer` -> `unsafe_RouteProducer`
    - `RouteProducerResult` -> `unsafe_RouteProducerResult`
    - `RouteResolutionOptions` -> `unsafe_RouteResolutionOptions`
    - `RouteOptions` -> `unsafe_RouteOptions`
- [#5977](https://github.com/microsoft/typespec/pull/5977) Minimum node version is now 20
- [#6357](https://github.com/microsoft/typespec/pull/6357) Changed the default content-type resolution behavior as follows:

- As before, if the content-type header is _explicitly_ specified (`@header contentType: valueof string`), the explicit content type is used (this behavior has not changed).
- If the type of an HTTP payload body has a Media Type hint (`@mediaTypeHint`), that media type is preferred as the default content-type for the request.
- The default content-type for `TypeSpec.bytes` has been changed to `application/octet-stream` to avoid serializing the data to base64-encoded JSON.
- The default content-type for all other scalar types has been changed to `text/plain` (previously, it was `application/json`).
- For multipart payloads, the default content-type of the payload has been changed to `multipart/form-data` if the `@multipartBody` parameter has a Model type and `multipart/mixed` if the multipart payload has a tuple type.
  - The content-type of individual parts in the multipart request has been changed to be the same as for HTTP payload bodies and follows the logic described above.

### Deprecations

- [#6464](https://github.com/microsoft/typespec/pull/6464) Deprecate implicit multipart body

  ```diff lang=tsp
  op upload(
    @header contentType: "multipart/form-data",
  -  @body body: {
  +  @multipartBody body: {
  -    name: string;
  +    name: HttpPart<string>;
  -    avatar: bytes;
  +    avatar: HttpPart<bytes>;
    }
  ): void;
  ```

### Features

- [#6345](https://github.com/microsoft/typespec/pull/6345) Update `BasicAuth` and `BearerAuth` types scheme to use standard name for scheme `Basic`, `Bearer`
- [#6327](https://github.com/microsoft/typespec/pull/6327) Remove reference to delete projection feature

### Bump dependencies

- [#6266](https://github.com/microsoft/typespec/pull/6266) Update dependencies

### Bug Fixes

- [#6513](https://github.com/microsoft/typespec/pull/6513) HTTP Media type resolution logic now treats literal types (String, Boolean, Numeric, and StringTemplate types) as equivalent to their given scalar types for the purposes of resolving their Media Type.


## 0.66.0

### Deprecations

- [#6130](https://github.com/microsoft/typespec/pull/6130) Updates `@header` decorator to accept values and adds the `explode` option.
Note that using the model expression syntax to pass in arguments, or using the
`format` field, are now deprecated.

```diff lang="tsp"
op example1(
-  @header({ name: "ETag" }) etag: string
+  @header(#{ name: "ETag" }) etag: string 
): void;

op example2(
-  @header({ format: "csv" }) list: string[]
+  @header list: string[]
): void;
```

### Features

- [#5996](https://github.com/microsoft/typespec/pull/5996) Emitter Framework V2


## 0.65.0

### Bump dependencies

- [#5690](https://github.com/microsoft/typespec/pull/5690) Upgrade dependencies

### Features

- [#5340](https://github.com/microsoft/typespec/pull/5340) Add Experimental Typekit helpers for `@typespec/http`


## 0.64.0

### Features

- [#5153](https://github.com/microsoft/typespec/pull/5153) Adds getStreamMetadata JS API to simplify getting stream metadata from operation parameters and responses.


## 0.63.0

### Bug Fixes

- [#5016](https://github.com/microsoft/typespec/pull/5016) Uri template attributes were not extracted when parameter was explicitly mark with `@path` or `@query` as well


## 0.62.0

### Bug Fixes

- [#4932](https://github.com/microsoft/typespec/pull/4932) [API] Fix: Generated `uriTemplate` correctly include `*` for explode query params
- [#4804](https://github.com/microsoft/typespec/pull/4804) The description parameter of `@server` is now optional.

### Bump dependencies

- [#4679](https://github.com/microsoft/typespec/pull/4679) Upgrade dependencies - October 2024

### Features

- [#4761](https://github.com/microsoft/typespec/pull/4761) Add `@cookie` decorator to specify cookie parameters
- [#4470](https://github.com/microsoft/typespec/pull/4470) Add new `LinkHeader` pagination type


## 0.61.0

### Bump dependencies

- [#4424](https://github.com/microsoft/typespec/pull/4424) Bump dependencies

### Features

- [#4513](https://github.com/microsoft/typespec/pull/4513) Adds HttpStream and JsonlStream models to to support streaming use-cases.


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
