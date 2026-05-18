import { describe, expect, it } from "vitest";
import { emit } from "./test-host.js";

describe("@typespec/http-client-py: scaffold smoke test", () => {
  it("emits a Python package layout for a tiny service", async () => {
    const files = await emit(`
      @service(#{ title: "WidgetService" })
      namespace WidgetService;

      enum Color { red, green, blue }

      model Widget {
        id: string;
        name: string;
        color: Color;
        description?: string;
      }

      @route("/widgets")
      @get
      op listWidgets(): Widget[];

      @route("/widgets/{id}")
      @get
      op getWidget(@path id: string): Widget;
    `);

    const paths = Object.keys(files);

    // Package skeleton always present.
    expect(paths).toContain("pyproject.toml");
    expect(paths).toContain("README.md");
    expect(paths).toContain("test_package/__init__.py");
    expect(paths).toContain("test_package/_version.py");
    expect(paths).toContain("test_package/py.typed");

    // Models + client modules emitted.
    const pythonPaths = paths.filter((p) => p.endsWith(".py"));
    expect(pythonPaths.some((p) => p.endsWith("models.py"))).toBe(true);
    expect(pythonPaths.some((p) => p.includes("widget_service"))).toBe(true);

    // pyproject.toml references the default name/version + corehttp.
    const pyproject = files["pyproject.toml"];
    expect(pyproject).toContain('name = "test-package"');
    expect(pyproject).toContain('version = "1.0.0"');
    expect(pyproject).toMatch(/corehttp/);

    // models.py declares Widget + Color.
    const modelsContent = files["test_package/models.py"];
    expect(modelsContent).toMatch(/class\s+Widget/);
    expect(modelsContent).toMatch(/class\s+Color/);

    // Client stub raises NotImplementedError so users see a clear message.
    const clientContent = Object.entries(files).find(
      ([p]) => p.endsWith(".py") && p.includes("widget_service") && !p.endsWith("__init__.py"),
    )?.[1];
    expect(clientContent).toBeDefined();
    expect(clientContent!).toMatch(/NotImplementedError/);
  });

  it("respects package-name and package-version options", async () => {
    const { Tester } = await import("./test-host.js");
    const result = await Tester.compile(
      `
        @service(#{ title: "PingService" })
        namespace PingService;

        @route("/ping") @get op ping(): void;
      `,
      {
        compilerOptions: {
          options: {
            "@typespec/http-client-py": {
              "package-name": "ping-client",
              "package-version": "2.5.0",
            },
          },
        },
      },
    );

    expect(result.outputs["pyproject.toml"]).toContain('name = "ping-client"');
    expect(result.outputs["pyproject.toml"]).toContain('version = "2.5.0"');
    expect(Object.keys(result.outputs)).toContain("ping_client/__init__.py");
  });
});
