import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mockRun = vi.fn();
vi.mock(import("../../src/core/cli/utils.js"), async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, run: (...args: any[]) => mockRun(...args) };
});

const mockDownload = vi.fn();
vi.mock(import("../../src/core/cli/download-vsix.js"), () => ({
  downloadVsixFromMarketplace: mockDownload,
}));

const { installVSExtension, uninstallVSExtension } =
  await import("../../src/core/cli/actions/vs.js");

function createHost() {
  return { logger: { trace: vi.fn(), warn: vi.fn() } } as any;
}

beforeEach(() => {
  mockDownload.mockReset().mockResolvedValue([]);
  mockRun.mockReset();
  // `run` is mocked; return a spawnSync-like result so Windows code paths
  // (e.g. isVSInstalled reading `proc.status`) don't throw.
  mockRun.mockReturnValue({ status: 1, stdout: "" });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

it("does not download the extension when only Visual Studio 2022 is installed", async () => {
  vi.stubGlobal("process", Object.create(process, { platform: { value: "win32" } }));
  mockRun.mockImplementation((_host, _command, args: string[]) => {
    const minimumVersion = Number.parseFloat(args[args.indexOf("-version") + 1].slice(1));
    return { status: 0, stdout: minimumVersion <= 17.14 ? "vs2022" : "" };
  });

  const diagnostics = await installVSExtension(createHost());

  expect(diagnostics).toEqual([expect.objectContaining({ code: "no-compatible-vs-installed" })]);
  expect(mockDownload).not.toHaveBeenCalled();
});

it("warns that `tsp vs install` is deprecated and points to the docs", async () => {
  const host = createHost();
  await installVSExtension(host);
  expect(host.logger.warn).toHaveBeenCalledWith(expect.stringContaining("tsp vs install"));
  expect(host.logger.warn).toHaveBeenCalledWith(
    expect.stringContaining("https://typespec.io/docs/introduction/editor/vs"),
  );
});

it("warns that `tsp vs uninstall` is deprecated and points to the docs", async () => {
  const host = createHost();
  await uninstallVSExtension(host);
  expect(host.logger.warn).toHaveBeenCalledWith(expect.stringContaining("tsp vs uninstall"));
  expect(host.logger.warn).toHaveBeenCalledWith(
    expect.stringContaining("https://typespec.io/docs/introduction/editor/vs"),
  );
});
