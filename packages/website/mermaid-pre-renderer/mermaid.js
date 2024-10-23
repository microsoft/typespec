// @ts-check
import { join } from "path";
import { chromium } from "playwright";
import { pathToFileURL } from "url";

/**
 *
 * @param {string} definition
 * @returns
 */
async function renderMermaid(definition) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const mermaidHTMLPath = join(__dirname, "index.html");
  await page.goto(pathToFileURL(mermaidHTMLPath).href);

  const svg = await page.evaluateHandle((definition) => {
    /** @type {import("mermaid").default } */
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const mermaid = window.mermaid;
    mermaid.initialize({});
    // should throw an error if mmd diagram is invalid
    try {
      return mermaid.render("container", definition);
    } catch (error) {
      if (error instanceof Error) {
        // mermaid-js doesn't currently throws JS Errors, but let's leave this
        // here in case it does in the future
        throw error;
      } else {
        throw new Error(error?.message ?? "Unknown mermaid render error");
      }
    }
  }, definition);

  await browser.close();
  return svg;
}

export default { renderMermaid };
