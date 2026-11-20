# TypeSpec Playground

Contains react components for the TypeSpec playground.

It can be used as a standalone custom playground with your own libraries or components can be used individually to customize the UI as you see fit.

## Usage

### Standalone

The stanalone playground provides some vite helpers to make it easy to get started.

In `vite.config.ts`:

```ts
import { definePlaygroundViteConfig } from "@typespec/playground/vite";

const config = definePlaygroundViteConfig({
  defaultEmitter: "@typespec/openapi3",
  libraries: [
    "@typespec/compiler",
    "@typespec/http",
    "@typespec/openapi3",

    // Add any other libraries here. Make sure those libraries are also dependencies of that package.
  ],
  samples: {
    "My sample": {
      filename: "samples/my.tsp",
      preferredEmitter: "@typespec/openapi3",
    },
  },
  links: {
    documentationUrl: "<link to your website>",
  },
});

export default config;
```

In `src/main.tsx`:

```tsx
import PlaygroundManifest from "@typespec/playground/manifest";
import { renderReactPlayground } from "@typespec/playground/react";
import { SwaggerUIViewer } from "@typespec/playground/react/viewers";
import { registerMonacoDefaultWorkersForVite } from "@typespec/playground/vite/workers";

// Import styles
import "@typespec/playground/styles.css";

registerMonacoDefaultWorkersForVite();

await renderReactPlayground({
  ...PlaygroundManifest,
  emitterViewers: {
    "@typespec/openapi3": [SwaggerUIViewer],
  },
});
```

### Monaco workers with Vite

Call `registerMonacoDefaultWorkersForVite()` from `@typespec/playground/vite/workers` before
creating any playground editors. This browser-only entry configures Monaco's editor and JSON
workers. The consuming Vite application bundles the workers, so their URLs follow its `base`
and asset configuration without copying assets from the playground package.

The registration function is no longer exported from `@typespec/playground`; update existing
imports to `@typespec/playground/vite/workers`. The function name and call are unchanged.
The `@typespec/playground/vite` entry is for the Node-side Vite configuration, not browser code.

`definePlaygroundViteConfig` already excludes the worker entry from dependency pre-bundling.
If you configure Vite yourself, add this exclusion so Vite can transform the worker imports
during development:

```ts
import { defineConfig } from "vite";

export default defineConfig({
  optimizeDeps: {
    exclude: ["@typespec/playground/vite/workers"],
  },
});
```

### Individual components

Playground react components can be used individually. For the TypeSpec compiler to be working correctly, the following conditions need to be met:

- The libraries **MUST** be loaded and registered
- The libraries **MUST** be importable by their name this means an import map must be setup. https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap
- The libraries **MUST** have been bundled using `@typespec/bundler`
