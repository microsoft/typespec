export {
  /** @deprecated Using this should be a noop. Prefer new test framework*/
  StandardTestLibrary,
} from "./test-compiler-host.js";

export { expectCodeFixOnAst } from "./code-fix-testing.js";
export { expectDiagnosticEmpty, expectDiagnostics, type DiagnosticMatch } from "./expect.js";
export { createTestFileSystem, mockFile } from "./fs.js";
export { t, type TemplateWithMarkers } from "./marked-template.js";
export {
  createLinterRuleTester,
  type ApplyCodeFixExpect,
  type LinterRuleTestExpect,
  type LinterRuleTester,
} from "./rule-tester.js";
export { extractCursor, extractSquiggles } from "./source-utils.js";
export type { TestHostOptions } from "./test-compiler-host.js";
/* eslint-disable @typescript-eslint/no-deprecated -- exporting deprecated APIs for backward compatibility */
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
/* eslint-enable @typescript-eslint/no-deprecated */
export { createTester } from "./tester.js";
export type {
  EmitterTester,
  EmitterTesterInstance,
  JsFile,
  MockFile,
  TestCompileOptions,
  TestCompileResult,
  TestEmitterCompileResult,
  TestFileSystem as TestFileSystem,
  Tester,
  TesterInstance,
} from "./types.js";
/* eslint-disable @typescript-eslint/no-deprecated -- exporting deprecated APIs for backward compatibility */
export type {
  BasicTestRunner,
  TestFiles,
  TestHost,
  TestHostConfig,
  TestHostError,
  TypeSpecTestLibrary,
  TypeSpecTestLibraryInit,
} from "./types.js";
/* eslint-enable @typescript-eslint/no-deprecated */
