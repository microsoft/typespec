---
changeKind: feature
packages:
  - "@typespec/bundler"
  - "@typespec/bundle-uploader"
---

Include imported Python wheels as binary assets alongside browser bundles, including assets imported by bundled dependencies. The Vite plugin and bundle uploader serve and publish these assets with the JavaScript.

```js
import wheel from "./generator.whl";

export const wheelUrl = new URL(wheel, import.meta.url).href;
```
