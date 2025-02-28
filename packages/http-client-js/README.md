# Http Client JavaScript

## Environment Variables

### `TYPESPEC_JS_EMITTER_TESTING`

This environment variable is used to enable testing-specific options in the TypeSpec JavaScript emitter.

- **Name:** `TYPESPEC_JS_EMITTER_TESTING`
- **Type:** `boolean`
- **Default:** `false`
- **Description:** When set to `true`, enables testing-specific options in the TypeSpec JavaScript emitter. This is used to configure the client for testing purposes, such as allowing insecure connections and setting retry options.

#### Usage

To enable testing-specific options, set the environment variable before running your tests:

```sh
export TYPESPEC_JS_EMITTER_TESTING=true
```

Or, if you are using a script, you can set it inline:

```sh
TYPESPEC_JS_EMITTER_TESTING=true node your-script.js
```
