#!/usr/bin/env node

// Workaround for https://github.com/microsoft/rushstack/issues/2400
// We can't use a file that may not have been built yet in package.json bin
await import("./dist/compiler/cli.js");
