import { Locator, Page } from "playwright"
import { retry, screenShot, sleep } from "./utils"
import { keyboard, Key } from "@nut-tree-fork/nut-js"
import fs from "node:fs"
import path from "node:path"

/**
 * Before comparing the results, you need to check whether the conditions for result comparison are met.
 * @param page vscode object
 * @param text The text in which the element appears
 * @param errorMessage Error message when element does not appear
 * @param [count, sleep] count: Retry times, sleep: Sleep time between retries
 */
async function preContrastResult(
  page: Page,
  text: string,
  errorMessage: string,
  [count, sleep]: number[] = [10, 5]
) {
  await retry(
    count,
    async () => {
      const contrastResult = page.getByText(new RegExp(text)).first()
      return (await contrastResult.count()) > 0
    },
    errorMessage,
    sleep
  )
}

/**
 * Results comparison
 * @param res List of expected files
 * @param dir The directory to be compared needs to be converted into an absolute path using path.resolve
 */
async function contrastResult(res: string[], dir: string) {
  let resLength = 0
  if (fs.existsSync(dir)) {
    console.log(fs.readdirSync(dir))
    resLength = fs.readdirSync(dir).length
  }
  if (resLength !== res.length) {
    await screenShot.screenShot("error.png")
    screenShot.save()
    throw new Error("Failed to matches all files")
  }
}

/**
 * All cases need to execute the steps. Click the top input box and enter the command
 * @param page vscode object
 * @param {folderName, command}
 * folderName: The text in the top input box is usually the current open root directory,
 * command: After the top input box pops up, the command to be executed
 */
async function startWithCommandPalette(
  page: Page,
  { folderName, command }: { folderName: string; command: string }
) {
  await sleep(2)
  await page.locator("li").filter({ hasText: folderName }).first().click()
  await sleep(2)
  await screenShot.screenShot("open_top_panel.png")
  await page
    .getByRole("textbox", { name: "Search files by name (append" })
    .first()
    .fill(`>TypeSpec: ${command}`)
  let listForCreate: Locator
  await retry(
    5,
    async () => {
      listForCreate = page
        .locator("a")
        .filter({ hasText: `TypeSpec: ${command}` })
        .first()
      return (await listForCreate.count()) > 0
    },
    "Failed to find the specified option"
  )
  await screenShot.screenShot("input_command.png")
  await listForCreate!.click()
}

/**
 * Start the Project with Right click on the file
 * @param page vscode object
 * @param command create, emit or import
 * @param type specify whether the click is on file, folder or empty folder
 * command: specify which command to execute to the project
 */
async function startWithRightClick(page: Page, command: string, type?: string) {
  if (
    command == "Emit from TypeSpec" ||
    command == "Preview API Documentation"
  ) {
    const target = page.getByRole("treeitem", { name: "main.tsp" }).locator("a")
    await target.click({ button: "right" })
    await screenShot.screenShot("click_main.png")
    await page.getByRole("menuitem", { name: command }).click()
    await screenShot.screenShot(
      `${command == "Emit from TypeSpec" ? "emit" : "preview"}_typespec.png`
    )
  } else if (command == "Import TypeSpec from Openapi 3") {
    const targetName =
      type === "emptyfolder"
        ? "ImportTypespecProjectEmptyFolder"
        : "openapi.3.0.yaml"
    const target = page.getByRole("treeitem", { name: targetName }).locator("a")
    await target.click({ button: "right" })
    await screenShot.screenShot("openapi.3.0.png")
    await sleep(3)
    await page
      .getByRole("menuitem", { name: "Import TypeSpec from OpenAPI" })
      .click()
    await screenShot.screenShot("import_typespec.png")
  }
}

/**
 * In vscode, when you need to select a folder or a file, call this method
 * @param file When selecting a file, just pass it in. If you need to select a folder, you do not need to pass this parameter in.
 */
async function selectFolder(file: string = "") {
  await sleep(10)
  await keyboard.type(file)
  await screenShot.screenShot("select_folder.png")
  await keyboard.pressKey(Key.Enter)
  await keyboard.releaseKey(Key.Enter)
  await sleep(3)
}

/**
 * If the current folder is not empty, sometimes a pop-up will appear
 * asking "Do you want to continue selecting the current folder as the root directory?".
 * In this method, select "yes" because selecting "no" does not make sense.
 * @param page vscode object
 */
async function notEmptyFolderContinue(page: Page) {
  let yesBtn: Locator
  await retry(
    5,
    async () => {
      yesBtn = page.locator("a").filter({ hasText: "Yes" }).first()
      let noBtn = page.locator("a").filter({ hasText: "No" }).first() 
      return (await yesBtn.count() > 0) && (await noBtn.count() > 0) 
    },
    "Failed to find yes/no button",
    1
  )
  await retry(
    5,
    async () => {
      let yesdescriptionBox = page.getByRole("option", { name: "Yes" }).locator('label')
      let yesdescriptionText = await yesdescriptionBox.textContent();
      return yesdescriptionText !== null && (yesdescriptionText.includes("YesSelected folder"))
    },
    "Failed to match the description for the non-empty folder cases",
    1
  )
  await screenShot.screenShot("not_empty_folder_continue.png")
  await yesBtn!.click()
}

/**
 * Install plugins directly from vscode
 * @param page vscode object
 */
async function installExtension(page: Page) {
  await page
    .getByRole("tab", { name: /Extensions/ })
    .locator("a")
    .click()
  await page.keyboard.type("Typespec")
  await page
    .getByLabel(/TypeSpec/)
    .getByRole("button", { name: "Install" })
    .click()
  await page.getByRole("button", { name: "Trust Publisher & Install" }).click()
  await sleep(10)
  await page
    .getByRole("tab", { name: /Explorer/ })
    .locator("a")
    .click()
}

/**
 * Install plugins directly from a local file
 * @param page vscode object
 * @param fullFilePath The absolute address of the plugin `vsix` needs to be obtained using the path.resolve method
 */
async function installExtensionForFile(page: Page, fullFilePath: string) {
  await screenShot.screenShot("open_vscode.png")
  await page
    .getByRole("tab", { name: /Extensions/ })
    .locator("a")
    .click()
  await screenShot.screenShot("change_extension.png")
  let moreItem: Locator
  await retry(
    10,
    async () => {
      moreItem = page.getByLabel(/Views and More Actions/).first()
      return (await moreItem.count()) > 0
    },
    "Failed to find more item",
    1
  )
  await moreItem!.click()
  await screenShot.screenShot("more_item.png")
  let fromInstall: Locator
  await retry(
    10,
    async () => {
      fromInstall = page.getByLabel(/Install from VSIX/).first()
      return (await fromInstall.count()) > 0
    },
    "Failed to find install from VSIX item",
    1
  )
  await fromInstall!.click()
  await selectFolder(fullFilePath)
  await retry(
    30,
    async () => {
      const installed = page.getByText(/Completed installing/).first()
      return (await installed.count()) > 0
    },
    "Failed to find installed status",
    1
  )
  await screenShot.screenShot("extension_installed.png")
  await sleep(5)
  await page
    .getByRole("tab", { name: /Explorer/ })
    .locator("a")
    .click()
  await screenShot.screenShot("change_explorer.png")
}

/**
 * Install plugins using the command
 */
async function installExtensionForCommand(page: Page, extensionDir: string) {
  const findVsix = () => {
    const dir = path.resolve(__dirname, "../../../");
    const files = fs.readdirSync(dir);
    const match = files.find((f) => /^typespec-vscode-.*\.vsix$/.test(f));
    if (!match) throw new Error("No typespec-vscode-*.vsix file found");
    return path.join(dir, match);
  };
  const vsixPath =
    process.env.VSIX_PATH || findVsix()
  await sleep(5)
  await page.keyboard.press("Control+Backquote")
  await screenShot.screenShot("open_terminal.png")
  await retry(
    10,
    async () => {
      const cmd = page.getByRole("textbox", { name: /Terminal/ }).first()
      return (await cmd.count()) > 0
    },
    "Failed to find command palette",
    3
  )
  const cmd = page.getByRole("textbox", { name: /Terminal/ }).first()
  await cmd.click()
  await sleep(5)
  await cmd.fill(
    `code --install-extension ${vsixPath} --extensions-dir ${extensionDir}`
  )
  await screenShot.screenShot("start_install_extension.png")
  await page.keyboard.press("Enter")
  await sleep(8)
  await page
    .getByRole("tab", { name: /Extensions/ })
    .locator("a")
    .click()
  await sleep(2)
  await retry(
    2,
    async () => {
      const installed = page.locator('span').filter({ hasText: /^TypeSpec$/ })
      return (await installed.count()) > 0
    },
    `Failed to install the extension.`,
    1
  )
  await page
    .getByLabel('Explorer').first()
    .click()  
  await screenShot.screenShot("start_install_extension_result.png")
}

async function closeVscode() {
  await keyboard.pressKey(Key.LeftAlt, Key.F4)
  await keyboard.releaseKey(Key.LeftAlt, Key.F4)
}

/**
 * If the current scenario is: the folder is not empty, you need to call this method
 * @param page vscode project
 * @param folderName The name of the folder that needs to be selected.
 */
function createTestFile(folderName: string) {
  const filePath = path.join(folderName, "test.txt")
  fs.writeFileSync(filePath, "test")
}

/**
 * Placeholder file, need to be deleted
 * @param folderName The name of the folder that needs to be selected.
 */
function deleteTestFile(folderName: string) {
  const filePath = path.join(folderName, "test.txt")
  fs.rmSync(filePath)
}

export {
  startWithRightClick,
  startWithCommandPalette,
  contrastResult,
  selectFolder,
  preContrastResult,
  notEmptyFolderContinue,
  installExtension,
  installExtensionForFile,
  installExtensionForCommand,
  closeVscode,
  createTestFile,
  deleteTestFile,
}
