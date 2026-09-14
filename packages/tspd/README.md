# @typespec/tspd

**This library is experimental and will most likely significantly change in future versions.**

TypeSpec tspd is a tool to help you build TypeSpec libraries and emitters. It provide the ability to

- Generate decorator signatures and type checks
- Generate documentation for library types and emitter options

## Usage

```bash
tspd --enable-experimental gen-extern-signature
```

```bash
tspd --enable-experimental doc . --output-dir ./docs/
```

## Sub path exports

`gen-extern-signature` generates signatures for every entry of the `exports` field in `package.json` that defines a `typespec` condition.

Each export is compiled on its own and a decorator or function is attributed to the first export that reaches the file declaring it. This means entities declared in the root entrypoint stay on the root even when a sub path entrypoint imports it back.

Signatures for the root export(`.`) are written to `generated-defs/`, signatures for a sub path are written to a matching directory and import `$decorators`/`$functions` from that same sub path:

```
generated-defs/MyLib.ts                  <- from `.`,          imports from "my-lib"
generated-defs/streams/MyLib.Streams.ts  <- from `./streams`,  imports from "my-lib/streams"
```

For this to work the sub path must expose its own JS module (an `import` or `default` condition) exporting the `$decorators` of the decorators it declares, and its TypeSpec entrypoint must import that JS module.
