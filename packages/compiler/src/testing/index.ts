export {
  /** @deprecated Using this should be a noop. Prefer new test framework*/
  StandardTestLibrary,
} from "./test-compiler-host.js";

export { expectCodeFixOnAst } from "./code-fix-testing.js";
export { expectDiagnosticEmpty, expectDiagnostics, type DiagnosticMatch } from "./expect.js";
export { createTestFileSystem, mockFile } from "./fs.js";
export { t } from "./marked-template.js";
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
export { createTester } from "./tester.js";
export type {
  BasicTestRunner,
  EmitterTester,
  EmitterTesterInstance,
  JsFile,
  MockFile,
  TestCompileOptions,
  TestCompileResult,
  TestEmitterCompileResult,
  TestFileSystem as TestFileSystem,
  TestFiles,
  TestHost,
  TestHostConfig,
  TestHostError,
  Tester,
  TesterInstance,
  TypeSpecTestLibrary,
  TypeSpecTestLibraryInit,
} from "./types.js";
