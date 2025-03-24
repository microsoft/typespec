// this file contains the code we want to run before others and will be the first to be imported in the extension.ts file
// so that the rollup will put the code in this file first in the bundle

// enable compiler internals export
(globalThis as any).enableCompilerInternalsExport = true;
