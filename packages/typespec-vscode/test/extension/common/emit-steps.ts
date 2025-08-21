import { Page } from "playwright";
import { CaseScreenshot, retry } from "./utils";

/**
 * When emitting a select emit type.
 * @param page vscode project
 * @param type emit type
 */
export async function emitSelectType(page: Page, type: string, cs: CaseScreenshot) {
  const expectedDescriptionConfig = [
    { name: "OpenAPI Document", description: "Emitting OpenAPI3 Document from TypeSpec files." },
    {
      name: "Client Code",
      description:
        "Emitting Client Code from TypeSpec files. Supported languages are .NET, Python, Java, JavaScript.",
    },
    {
      name: "Server Stub",
      description:
        "Emitting Server Stub from TypeSpec files. Supported languages are .NET, JavaScript.",
    },
  ];
  await retry(
    page,
    3,
    async () => {
      const emiSelectTypeBox = page.getByRole("option", { name: type }).locator("label");
      const emiSelectTypeBoxDescriptionArr = await emiSelectTypeBox.allTextContents();
      const emiSelectTypeBoxDescription = emiSelectTypeBoxDescriptionArr[0].slice(type.length);
      const expectedDescription =
        (expectedDescriptionConfig.find((cfg) => cfg.name === type) || {}).description || "";
      if (emiSelectTypeBoxDescription === expectedDescription) {
        return true;
      } else {
        // Description mismatched, expected "${expectedDescription}", got "${emiSelectTypeBoxDescription}".
        return false;
      }
    },
    "Failed to find the emitSelectType description.",
    2,
    cs,
  );
  await cs.screenshot(page, "select_emitter_type");
  if (type === "OpenAPI Document" || type === "DefaultEmitterType") {
    await page.locator("a").filter({ hasText: type }).click();
  } else if (type === "Client Code") {
    await page.locator("a").filter({ hasText: "Client Code" }).first().click();
  } else if (type === "Server Stub") {
    await page
      .locator("a")
      .filter({ hasText: /^Server Stub$/ })
      .click();
  } else {
    await cs.screenshot(page, "select_emitter_type_error");
    throw new Error("Unsupported emit type");
  }
}

/**
 * If the emit type is chosen, the language will be selected next. Call this method to select
 * @param page vscode project
 * @param language language name (OpenAPI3, Python, Java, .NET, JavaScript)
 * @param types emitter types (Client Code, Server Stub, OpenAPI Document)
 **/
export async function emitSelectLanguage(
  page: Page,
  language: string = "",
  types: string = "",
  cs: CaseScreenshot,
) {
  let selectLangConfig: { name: string; description: string }[] = [];
  if (types === "Client Code") {
    selectLangConfig = [
      {
        name: "Python",
        description:
          "Emit client code for Python by TypeSpec library @typespec/http-client-python.",
      },
      {
        name: "Java",
        description: "Emit client code for Java by TypeSpec library @typespec/http-client-java.",
      },
      {
        name: ".NET",
        description: "Emit client code for .NET by TypeSpec library @typespec/http-client-csharp.",
      },
      {
        name: "JavaScript",
        description:
          "Emit client code for JavaScript by TypeSpec library @typespec/http-client-js.",
      },
    ];
  } else if (types === "Server Stub") {
    selectLangConfig = [
      {
        name: ".NET",
        description: "Emit server code for .NET by TypeSpec library @typespec/http-server-csharp.",
      },
      {
        name: "JavaScript",
        description:
          "Emit server code for JavaScript by TypeSpec library @typespec/http-server-js.",
      },
    ];
  }
  let languageName;
  let languageDescription;
  await retry(
    page,
    3,
    async () => {
      languageName = page.locator("a").filter({ hasText: language });
      return (await languageName.count()) > 0;
    },
    `Failed to find the language for code emitting.`,
    2,
    cs,
  );
  await retry(
    page,
    3,
    async () => {
      const languageBox = page.getByRole("option", { name: language }).locator("label");
      const languageDescriptionArr = await languageBox.allTextContents();
      languageDescription = languageDescriptionArr[0].slice(language.length);
      const expectedDescription =
        (selectLangConfig.find((cfg) => cfg.name === language) || {}).description || "";
      if (languageDescription === expectedDescription) {
        return true;
      } else {
        // Description mismatched, expected "${expectedDescription}", got "${languageDescription}".`,
        return false;
      }
    },
    "Failed to find the language for code emitting description.",
    2,
    cs,
  );
  await cs.screenshot(page, "select_language_" + language);
  const languageList = ["OpenAPI3", "Python", "Java", ".NET", "JavaScript"];
  if (languageList.indexOf(language) !== -1) {
    await page.locator("a").filter({ hasText: language }).first().click();
  } else {
    await cs.screenshot(page, "select_emitter_type_error");
    throw new Error("Unsupported language");
  }
}

/**
 * When emitting, choose emitters.
 * @param page vscode project
 * @param emitter emitter name
 * @description If the emitter name is not passed, it will choose "Choose another emitter".
 */
export async function emiChooseEmitter(page: Page, cs: CaseScreenshot) {
  const chooseEmitterExpectedDescription = "Choose another emitter for code emitting";
  const chooseEmitterExpectedName = "Choose another emitter";
  let chooseEmitterName;
  let chooseEmitterDescription;
  await retry(
    page,
    3,
    async () => {
      chooseEmitterName = page
        .getByRole("option", { name: "Choose another emitter" })
        .locator("a")
        .first();
      return (await chooseEmitterName.count()) > 0;
    },
    `Failed to find the "Choose another emitter" button.`,
    2,
    cs,
  );
  await retry(
    page,
    3,
    async () => {
      const chooseEmitterBox = page.getByText("Choose another emitterChoose");
      const chooseEmitterDescriptionArr = await chooseEmitterBox.allTextContents();
      chooseEmitterDescription = chooseEmitterDescriptionArr[0].slice(
        chooseEmitterExpectedName.length,
      );
      if (chooseEmitterDescription === chooseEmitterExpectedDescription) {
        return true;
      } else {
        // Description mismatched, expected "${chooseEmitterExpectedDescription}", got "${chooseEmitterDescription}".`,
        return false;
      }
    },
    "Failed to find the Choose another emitter description.",
    2,
    cs,
  );
  await cs.screenshot(page, "choose_another_emitter");
  await chooseEmitterName!.click();
}
