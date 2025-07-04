import { Page } from "playwright";
import { retry, screenshot } from "./utils";

/**
 * When creating, select emitters
 * @param page vscode project
 * @param emitters The emitters that need to be selected. If you need to select all, just do not transmit them.
 */
async function selectEmitters(page: Page, emitters?: string[]) {
  const emittersConfig = [
    { name: "OpenAPI 3.1 document", description: "@typespec/openapi3" },
    { name: "C# client", description: "@typespec/http-client-csharp" },
    { name: "Java client", description: "@typespec/http-client-java" },
    { name: "JavaScript client", description: "@typespec/http-client-js" },
    { name: "Python client", description: "@typespec/http-client-python" },
    { name: "C# server stubs", description: "@typespec/http-server-csharp" },
    { name: "JavaScript server stubs", description: "@typespec/http-server-js" },
  ];
  let checks: any[] = [];
  await retry(
    page,
    3,
    async () => {
      checks = await Promise.all(
        emittersConfig.map(async (emitter, index) => {
          const nameLocator = page
            .getByRole("checkbox", { name: emitter.name })
            .locator("a")
            .filter({ hasText: emitter.name });
          const nameExists = (await nameLocator.count()) > 0;

          const nameBoxLocator = page.getByRole("checkbox", { name: `${emitter.name}, @` });
          const nameBoxLocatorText = await nameBoxLocator.textContent();
          const nameDescription = nameBoxLocatorText?.slice(emitter.name.length);

          if (!nameExists) {
            // Failed to find the following emitter name: "${emitter.name}".
            return false;
          }

          if (nameDescription?.includes(emitter.description) === false) {
            // Description mismatched, expected "${emitter.description}", got "${nameDescription}".
            return false;
          }
          return true;
        }),
      );
      return checks.every((result) => result);
    },
    "Failed to find the selectEmitter box.",
  );
  await page.getByRole("checkbox", { name: "Toggle all checkboxes" }).check();
  await screenshot(page, "linux", "select_emitter");
  await page.keyboard.press("Enter");
}

/**
 * When creating, select template
 * @param page vscode project
 * @param templateName The name of the template that needs to be selected.
 * @param templateNameDescription The description of the template that needs to be selected.
 */
async function selectTemplate(page: Page, templateName: string, templateNameDescription: string) {
  let templateListName;
  let templateListDescription;
  await retry(
    page,
    3,
    async () => {
      templateListName = page
        .getByRole("option", { name: templateName })
        .filter({ hasText: templateName });
      return (await templateListName.count()) > 0;
    },
    `Failed to find the following template: "${templateName}".`,
  );
  await retry(
    page,
    3,
    async () => {
      const templateListBox = page.getByRole("option", { name: templateName }).locator("label");
      const templateListDescriptionArr = await templateListBox.allTextContents();
      templateListDescription = templateListDescriptionArr[0].slice(templateName.length);
      if (templateNameDescription === templateListDescription) {
        return true;
      } else {
        // `Description mismatched, expected "${templateNameDescription}", got "${templateListDescription}".`
        return false;
      }
    },
    "Failed to find the selectTemplate box.",
  );
  await screenshot(page, "linux", "select_template");
  await templateListName!.first().click();
}

/**
 * When creating, verify the description below, then input project name
 * @param page vscode project
 */
async function inputProjectName(page: Page) {
  const titleInfoDescription =
    "Please input the project name (Press 'Enter' to confirm or 'Escape' to cancel)";
  await retry(
    page,
    3,
    async () => {
      const titleBox = page.locator("div").filter({ hasText: "0 Results0 SelectedPlease" }).nth(2);
      let titleBoxText = await titleBox.textContent();
      // Remove the known prefix and suffix noise in the captured lines.
      titleBoxText = titleBoxText
        ? titleBoxText.replace(/^0 Results0 Selected/, "").replace(/OK$/, "")
        : null;
      if (titleBoxText === titleInfoDescription) {
        return true;
      } else {
        // Description mismatched, expected "${titleInfoDescription}", got "${titleBoxText}".
        return false;
      }
    },
    "Failed to find the project name input box.",
  );
  await screenshot(page, "linux", "input_project_name");
  await page.keyboard.press("Enter");
}

/**
 * When creating, start with click
 */
async function startWithClick(page: Page) {
  await screenshot(page, "linux", "start_with_click");
  await page.getByRole("button", { name: "Create TypeSpec Project" }).click();
}

export { inputProjectName, selectEmitters, selectTemplate, startWithClick };
