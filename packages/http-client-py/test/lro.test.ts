import { describe, expect, it } from "vitest";
import { emit } from "./test-host.js";

describe("@typespec/http-client-py: LRO operations", () => {
  it("emits a begin_* poller method when an operation returns 202 + Operation-Location", async () => {
    const files = await emit(`
      @service(#{ title: "WidgetService" })
      namespace WidgetService;

      model Widget {
        id: string;
        name: string;
      }

      model WidgetAccepted {
        @statusCode statusCode: 202;
        @header("Operation-Location") operationLocation: string;
      }

      @route("/widgets")
      @post
      op createWidget(@body widget: Widget): Widget | WidgetAccepted;
    `);

    const clientPath = Object.keys(files).find(
      (p) => p.endsWith(".py") && p.includes("widget_service") && !p.endsWith("__init__.py"),
    );
    expect(clientPath).toBeDefined();
    const client = files[clientPath!];

    // The method is renamed with a `begin_` prefix (Python convention for LROs).
    expect(client).toMatch(/def\s+begin_create_widget\s*\(/);
    // A private `_X_initial` companion exists.
    expect(client).toMatch(/def\s+_create_widget_initial\s*\(/);
    // The return type is wrapped in `LROPoller[...]`.
    expect(client).toMatch(/LROPoller\[/);
    // `LROPoller` is imported from the corehttp polling module.
    expect(client).toMatch(/from\s+corehttp\.polling\s+import[^\n]*LROPoller/);
    // The original method name should NOT appear as a top-level def (it was renamed).
    expect(client).not.toMatch(/def\s+create_widget\s*\(/);
  });

  it("falls back to a basic method when no LRO heuristic matches", async () => {
    const files = await emit(`
      @service(#{ title: "WidgetService" })
      namespace WidgetService;

      model Widget {
        id: string;
        name: string;
      }

      @route("/widgets/{id}")
      @get
      op getWidget(@path id: string): Widget;
    `);

    const clientPath = Object.keys(files).find(
      (p) => p.endsWith(".py") && p.includes("widget_service") && !p.endsWith("__init__.py"),
    );
    const client = files[clientPath!];

    // Plain method, not an LRO.
    expect(client).toMatch(/def\s+get_widget\s*\(/);
    expect(client).not.toMatch(/begin_get_widget/);
    expect(client).not.toMatch(/LROPoller/);
  });

  it("does not treat 202 without a status header as an LRO", async () => {
    const files = await emit(`
      @service(#{ title: "WidgetService" })
      namespace WidgetService;

      model Accepted {
        @statusCode statusCode: 202;
      }

      @route("/widgets")
      @post
      op fireAndForget(): Accepted;
    `);

    const clientPath = Object.keys(files).find(
      (p) => p.endsWith(".py") && p.includes("widget_service") && !p.endsWith("__init__.py"),
    );
    const client = files[clientPath!];

    // No header means no LRO inference — emit as a normal method.
    expect(client).toMatch(/def\s+fire_and_forget\s*\(/);
    expect(client).not.toMatch(/begin_fire_and_forget/);
    expect(client).not.toMatch(/LROPoller/);
  });
});
