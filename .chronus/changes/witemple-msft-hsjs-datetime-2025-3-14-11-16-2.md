---
changeKind: feature
packages:
  - "@typespec/http-server-js"
---

Added support for and enabled by default using the JS Temporal API for DateTime/Duration types. DateTime representation supports three modes:

- "temporal-polyfill" (default): uses the [Temporal API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal) and imports it from [temporal-polyfill](https://npmjs.com/package/temporal-polyfill).
- "temporal": uses the Temporal API and assumes it is available on the `globalThis` object (you are responsible for ensuring it is available in your environment). When Temporal is well-supported by JavaScript engines and TypeScript `global.d.ts` definitions for it are widely available, this will become the default mode.
- "date-duration": uses JavaScript `Date` and a custom `Duration` object. This mode is not recommended but is provided if you really don't want to depend on Temporal.

Set the DateTime mode using the `"datetime"` emitter option in `tspconfig.yaml`:

```yaml
options:
  @typespec/http-server-js:
    datetime: temporal-polyfill
```
