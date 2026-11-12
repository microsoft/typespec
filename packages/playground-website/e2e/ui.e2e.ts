import { expect, test } from "@playwright/test";
import { createUrlStateStorage } from "@typespec/playground/state-storage";

const host = `http://localhost:5173`;
const ctrlOrCmd = process.platform === "darwin" ? "Meta" : "Control";

test.describe("playground UI tests", () => {
  test.skip(process.platform === "win32", "https://github.com/microsoft/typespec/issues/1223");

  test("compiled http sample", async ({ page }) => {
    await page.goto(host);

    // Click the Samples button to open the drawer
    const samplesButton = page.locator('button[aria-label="Browse samples"]');
    await samplesButton.click();

    // Wait for the drawer to open and click on the HTTP service card
    const httpServiceCard = page.locator("text=HTTP service").first();
    await httpServiceCard.click();

    await expect(page.getByText(`title: Widget Service`)).toBeVisible();
  });

  test("explores scoped shapes with adapters, direct facets and declarations only", async ({
    page,
  }) => {
    const shape = page.getByLabel("Selected type shape", { exact: true });
    const open = async (sample: string) => {
      await page.goto(`${host}/?${new URLSearchParams({ sample, v: "scope-views" })}`);
      await expect(page.getByRole("heading", { name: "Scope explorer" })).toBeVisible();
    };

    await open("Conditional scopes: versions and visibility");
    await page.getByLabel("Scope: Example.Versions").selectOption("v1");
    await page.getByLabel("Scope: Lifecycle").selectOption("Read");
    await expect(shape).toContainText("oldValue: int32;");
    await expect(shape).toContainText("id: string;");
    await expect(shape).not.toContainText("secret:");
    await page.getByLabel("Scope: Example.Versions").selectOption("v2");
    await page.getByLabel("Scope: Lifecycle").selectOption("Create");
    await expect(shape).toContainText("value?: string;");
    await expect(shape).toContainText("secret: string;");
    await expect(shape).not.toContainText("id:");

    await open("Conditional scopes: direct shape facets");
    await page.getByLabel("Scope: DirectFacets.Versions").selectOption("v1");
    await expect(shape).toContainText("model LegacyWidget");
    await expect(shape).toContainText("value: int32;");
    await page
      .getByRole("tablist", { name: "Scope explorer views" })
      .getByRole("tab", { name: "Type graph", exact: true })
      .click();
    await expect(
      page.getByRole("treeitem", { name: "M LegacyWidget", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    await page.getByRole("tab", { name: "Shape comparison", exact: true }).click();
    await page.getByLabel("Scope: DirectFacets.Versions").selectOption("v2");
    await page.getByLabel("Scope: DirectFacets.Views").selectOption("write");
    await expect(shape).toContainText("value?: string;");
    await page
      .getByRole("tablist", { name: "Scope explorer views" })
      .getByRole("tab", { name: "Type graph", exact: true })
      .click();
    await expect(page.getByText("ModelProperty value", { exact: true })).toBeVisible();

    await open("Conditional scopes: declarations only");
    await page.getByLabel("Scope: DirectSyntax.Versions").selectOption("v1");
    await page.getByLabel("Scope: DirectSyntax.Visibility").selectOption("read");
    await expect(shape).toContainText("value: int32;");
    await page.getByLabel("Scope: DirectSyntax.Versions").selectOption("v2");
    await page.getByLabel("Scope: DirectSyntax.Visibility").selectOption("create");
    await expect(shape).toContainText("value: string;");
    await expect(shape).toContainText("secret: string;");
    await expect(shape).not.toContainText("id:");
    await page.getByLabel("Declaration", { exact: true }).selectOption("DirectSyntax.ServerState");
    await expect(shape).toContainText("not present");
    await page.getByLabel("Scope: DirectSyntax.Visibility").selectOption("read");
    await expect(shape).toContainText("generation: int32;");
    await page.getByLabel("Graph view", { exact: true }).selectOption("base");
    await page.getByLabel("Declaration", { exact: true }).selectOption("DirectSyntax.Value");
    await expect(shape).toContainText("legacy: int32,");
    await expect(shape).toContainText("current: string,");

    await open("Conditional scopes: hierarchy");
    await page.getByRole("tab", { name: "Readonly metadata", exact: true }).click();
    const metadata = page.getByLabel("Resolved readonly metadata");
    await page.getByLabel("Graph view", { exact: true }).selectOption("base");
    expect(JSON.parse(await metadata.innerText())["Widget @clientName"]).toBeUndefined();
    await page.getByLabel("Scope: AzureScopes").selectOption("provisioning");
    await expect(metadata).toContainText("ProvisioningWidget");
  });

  test("keeps the selected scope on edits and reports errors in unselected scopes", async ({
    page,
  }) => {
    const storage = createUrlStateStorage<{
      content: string;
      tspconfig: string;
      selectedViewer: string;
    }>({
      content: { queryParam: "c", compress: "lz-base64" },
      tspconfig: { queryParam: "tspconfig", compress: "lz-base64" },
      selectedViewer: { queryParam: "v" },
    });
    const params = storage.resolveSearchParams({
      content: `
        enum Clients { csharp, python }
        model Private when Clients.csharp { value: string; }
        model Widget { details: Private when Clients.csharp; }
      `,
      tspconfig: "kind: project\nfeatures:\n  - scoped-decorators\nemit: []\n",
      selectedViewer: "scope-views",
    });
    await page.goto(`${host}/?${params}`);
    const clients = page.getByLabel("Scope: Clients");
    await clients.selectOption("csharp");
    await expect(page.getByLabel("Selected type shape", { exact: true })).toContainText("details:");
    await page.locator(".monaco-editor").first().click();
    await page.keyboard.press(`${ctrlOrCmd}+End`);
    await page.keyboard.press("Enter");
    await page.keyboard.insertText("model Invalid { details: Private; }");
    const errors = page.getByRole("button", { name: /1 error/ });
    await errors.click();
    await expect(page.getByText(/which is absent in view 'Clients.python'/).first()).toBeVisible();
    await expect(clients).toHaveValue("csharp");
    await expect(page.getByLabel("Declaration", { exact: true })).toHaveValue("Widget");
  });

  test("Monaco workers respond for source and JSON output", async ({ page }) => {
    await page.addInitScript(() => {
      const workers: { url: string; receivedMessage: boolean }[] = [];
      Object.assign(window, { monacoWorkers: workers });
      const OriginalWorker = window.Worker;
      window.Worker = class extends OriginalWorker {
        constructor(url: string | URL, options?: WorkerOptions) {
          super(url, options);
          const state = { url: String(url), receivedMessage: false };
          workers.push(state);
          this.addEventListener("message", () => {
            state.receivedMessage = true;
          });
        }
      };
    });

    const storage = createUrlStateStorage<{ content: string; tspconfig: string }>({
      content: { queryParam: "c", compress: "lz-base64" },
      tspconfig: { queryParam: "tspconfig", compress: "lz-base64" },
    });
    const params = storage.resolveSearchParams({
      content:
        'import "@typespec/json-schema"; using TypeSpec.JsonSchema; @jsonSchema model WorkerTest { name: string; }',
      tspconfig:
        'emit:\n  - "@typespec/json-schema"\noptions:\n  "@typespec/json-schema":\n    file-type: json\n',
    });
    await page.goto(`${host}/?${params}`);

    await expect(page.getByRole("tab", { name: "WorkerTest.json", exact: true })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => Reflect.get(window, "monacoWorkers")))
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            url: expect.stringContaining("editor.worker"),
            receivedMessage: true,
          }),
          expect.objectContaining({
            url: expect.stringContaining("json.worker"),
            receivedMessage: true,
          }),
        ]),
      );
  });

  test("emit C# server", async ({ page }) => {
    await page.goto(host);

    await page.locator('button[aria-label="Browse samples"]').click();
    await page.locator("text=HTTP service").first().click();
    await page.getByLabel("Select an emitter").selectOption("@typespec/http-server-csharp");

    await expect(
      page.getByText("// Generated by @typespec/http-server-csharp").first(),
    ).toBeVisible();
  });

  test("report compilation errors", async ({ page }) => {
    await page.goto(host);
    const typespecEditor = page.locator(".monaco-editor").first();
    await typespecEditor.click();
    await page.keyboard.type("invalid");
    // When compilation errors occur, diagnostics are shown as error markers
    await expect(page.locator(".squiggly-error")).toBeVisible();
  });

  test("shared link works", async ({ page }) => {
    // Pass code "op sharedCode(): string;"
    // cspell:disable-next-line
    await page.goto(`${host}/?c=b3Agc2hhcmVkQ29kZSgpOiBzdHJpbmc7`);
    await expect(page.getByText(`operationId: sharedCode`)).toBeVisible();
  });

  test("save code with ctrl/cmd+S", async ({ page }) => {
    await page.goto(host);
    const typespecEditor = page.locator(".monaco-editor").first();
    await typespecEditor.click();
    await typespecEditor.pressSequentially("op sharedCode(): string;");
    await page.keyboard.press(`${ctrlOrCmd}+KeyS`);
    // cspell:disable-next-line
    const sharedCodeQueryPattern = new RegExp(`${host}/\\?.*c=b3Agc2hhcmVkQ29kZSgpOiBzdHJpbmc7.*`);
    await expect.poll(() => page.url()).toMatch(sharedCodeQueryPattern);
  });
});
