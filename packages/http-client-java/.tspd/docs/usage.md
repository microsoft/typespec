### Prerequisite

Install [Node.js](https://nodejs.org/) 20 or above. (Verify by running `node --version`)

Install [Java](https://docs.microsoft.com/java/openjdk/download) 17 or above. (Verify by running `java --version`)

Install [Maven](https://maven.apache.org/download.cgi). (Verify by running `mvn --version`)

### Experimental server-sent events

The Azure v1 flavor automatically generates typed streaming convenience methods for
supported `SSEStream` responses. Protocol `*WithResponse` methods retain their binary
response APIs. Unsupported encodings or ambiguous event definitions produce a diagnostic
and retain ordinary binary APIs.

A stream with exactly one unnamed, nonliteral JSON payload returns `Flux<T>` asynchronously
and `CloseableIterableStream<T>` synchronously. Models, scalars, arrays, dictionaries,
and nested collections are supported, including `@data` payload extraction. An array
is one stream item. Missing or empty event names and `message` select the default payload;
unexpected named events and null decoded payloads fail a direct-payload stream.

Named, mixed, and literal-containing streams return a generated base event type with typed
subtypes and `getValue()` accessors. Unknown names produce nonterminal, name-only events.
Primitive string, number, and boolean literals match only within their declared event
identity, before a general payload alternative. JSON literals use primitive kind and value;
raw `text/plain` string literals use exact text. A recognized identity with no matching
literal or general alternative fails the stream. Ambiguous general alternatives and
overlapping literal wire encodings are unsupported. Numeric literals that the upstream
SDK model rounds or represents outside its inferred Java numeric type are also unsupported,
rather than silently changing the literal or emitting an uncompilable constant.

Terminal events, including literal markers, are delivered once before the stream closes.
There is no built-in `[DONE]` marker, automatic reconnection, or protocol-metadata API.
Use try-with-resources for synchronous streams, especially when stopping iteration early;
cancel asynchronous subscriptions when stopping early.

This API remains experimental. Adding a named or literal alternative to a direct-payload
stream changes its element type to a wrapper and is a breaking SDK evolution.
