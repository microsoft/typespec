# Change Log - @typespec/playground

This log was last generated on Wed, 04 Oct 2023 18:19:25 GMT and should not be manually modified.

## 0.1.0-alpha.1
Wed, 03 Oct 2023 18:00:18 GMT

### Updates

- Fix: Usage of the package in vite dev mode was broken. Some errors due to the loading of the manifest as well as monaco editor workers.
**BREAKING CHANGE:** Changed `import { PlaygroundManifest } from "@typespec/playground/manifest";` to`import PlaygroundManifest from "@typespec/playground/manifest";`

