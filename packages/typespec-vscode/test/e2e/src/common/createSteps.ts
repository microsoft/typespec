import { Page } from "@playwright/test"
import { retry } from "./utils"

/**
 * When creating, select emitters
 * @param page vscode project
 * @param emitters The emitters that need to be selected. If you need to select all, just do not transmit them.
 */
async function selectEmitters(page: Page, emitters: string[]) {
  await page.keyboard.press("Enter")
}

/**
 * When creating, select template
 * @param page vscode project
 * @param templateName The name of the template that needs to be selected.
 */
async function selectTemplate(page: Page, templateName: string) {
  let templateList
  await retry(
    3,
    async () => {
      templateList = page.locator("a").filter({ hasText: templateName })
      return (await templateList.count()) > 0
    },
    `Failed to find ${templateName} template`
  )
  await templateList!.first().click()
}

/**
 * When creating, input project name
 * @param page vscode project
 */
async function inputProjectName(page: Page) {
  await retry(
    3,
    async () => {
      const titleInfo = page.getByText(/Please .*name/).first()
      return (await titleInfo.count()) > 0
    },
    "Failed to find the project name input box"
  )
  await page.keyboard.press("Enter")
}

export { selectEmitters, selectTemplate, inputProjectName }
