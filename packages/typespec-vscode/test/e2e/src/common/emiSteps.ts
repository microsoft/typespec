import { Page } from "@playwright/test"

/**
 * When emitting a select project event, it will select the project with the given name.
 * @param page vscode project
 * @param text project name
 */
async function emitSelectProject(page: Page, text: string) {
  await page
    .getByRole("option", { name: new RegExp(text) })
    .locator("a")
    .click()
}

/**
 * When emitting a select emit type.
 * @param page vscode project
 * @param type emit type
 */
async function emitSelectType(page: Page, type: string) {
  await page.locator("a").filter({ hasText: type }).click()
}

/**
 * If the emit type is `OpenApiDocument`, the language will be selected next. Call this method to select
 * @param page vscode project
 */
async function emitSelectLanguageForOpenapi(page: Page) {
  await page
    .locator("a")
    .filter({ hasText: /^OpenAPI3$/ })
    .click()
}

export { emitSelectProject, emitSelectType, emitSelectLanguageForOpenapi }
