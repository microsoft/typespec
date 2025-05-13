export { expectCodeFixOnAst } from "./code-fix-testing.js";
export { expectDiagnosticEmpty, expectDiagnostics, type DiagnosticMatch } from "./expect.js";
export { createTestFileSystem, mockFile } from "./fs.js";
export {
  createLinterRuleTester,
  type ApplyCodeFixExpect,
  type LinterRuleTestExpect,
  type LinterRuleTester,
} from "./rule-tester.js";
export { extractCursor, extractSquiggles } from "./source-utils.js";
export type { TestHostOptions } from "./test-compiler-host.js";
export { createTestHost, createTestRunner, findFilesFromPattern } from "./test-host.js";
export {
  createTestLibrary,
  createTestWrapper,
  expectTypeEquals,
  findTestPackageRoot,
  resolveVirtualPath,
  trimBlankLines,
  type TestWrapperOptions,
} from "./test-utils.js";
export type {
  BasicTestRunner,
  TestFileSystem as TestFileSystem,
  TestFiles,
  TestHost,
  TestHostConfig,
  TestHostError,
  TypeSpecTestLibrary,
  TypeSpecTestLibraryInit,
} from "./types.js";

// TODO: use named imports
export { t } from "./marked-template.js";
export * from "./test-host-v2.js";
