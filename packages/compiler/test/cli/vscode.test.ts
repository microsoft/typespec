import { beforeEach, expect, it, vi } from "vitest";

const mockRun = vi.fn();
vi.mock(import("../../src/core/cli/utils.js"), async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, run: (...args: any[]) => mockRun(...args) };
});

const { installVSCodeExtension, uninstallVSCodeExtension } =
  await import("../../src/core/cli/actions/vscode.js");

function createHost() {
  return { logger: { trace: vi.fn(), warn: vi.fn() } } as any;
}

beforeEach(() => {
  mockRun.mockReset();
});

it("install runs `code --install-extension` for the marketplace extension", async () => {
  const host = createHost();
  const diagnostics = await installVSCodeExtension(host, { insiders: false });
  expect(diagnostics).toEqual([]);
  expect(mockRun).toHaveBeenCalledWith(
    host,
    "code",
    ["--install-extension", "microsoft.typespec-vscode"],
    expect.anything(),
  );
});

it("uninstall runs `code --uninstall-extension` for the marketplace extension", async () => {
  const host = createHost();
  await uninstallVSCodeExtension(host, { insiders: false });
  expect(mockRun).toHaveBeenCalledWith(
    host,
    "code",
    ["--uninstall-extension", "microsoft.typespec-vscode"],
    expect.anything(),
  );
});

it("warns that `tsp code install` is deprecated and points to the docs", async () => {
  const host = createHost();
  await installVSCodeExtension(host, { insiders: false });
  expect(host.logger.warn).toHaveBeenCalledWith(
    expect.stringContaining("https://typespec.io/docs/introduction/editor/vscode/"),
  );
  expect(host.logger.warn).toHaveBeenCalledWith(expect.stringContaining("tsp code install"));
});

it("warns that `tsp code uninstall` is deprecated", async () => {
  const host = createHost();
  await uninstallVSCodeExtension(host, { insiders: false });
  expect(host.logger.warn).toHaveBeenCalledWith(expect.stringContaining("tsp code uninstall"));
});

it("uses `code-insiders` when --insiders is set", async () => {
  const host = createHost();
  await installVSCodeExtension(host, { insiders: true });
  expect(mockRun).toHaveBeenCalledWith(host, "code-insiders", expect.anything(), expect.anything());
});

it("reports vscode-in-path diagnostic when `code` is not found", async () => {
  const host = createHost();
  mockRun.mockImplementation(() => {
    const error: any = new Error("not found");
    error.code = "ENOENT";
    throw error;
  });
  const diagnostics = await installVSCodeExtension(host, { insiders: false });
  expect(diagnostics).toHaveLength(1);
  expect(diagnostics[0].code).toBe("vscode-in-path");
});
