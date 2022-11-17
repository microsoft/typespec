import {
  Application as TypeDocApplication,
  DefaultTheme,
  Options,
  DefaultThemeRenderContext,
  RendererEvent,
} from "typedoc";
import { toolbar } from "./toolbar.js";
import { versionPicker, versionPickerScript } from "./versionPicker.js";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function copyAssetsSync(source: string, dest: string) {
  const stat = fs.statSync(source);

  if (stat.isDirectory()) {
    for (const item of fs.readdirSync(source)) {
      copyAssetsSync(path.join(source, item), path.join(dest, item));
    }
  } else if (stat.isFile()) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(source, dest);
  }
}

export function loadTheme(app: TypeDocApplication) {
  app.renderer.defineTheme("azureSdk", AzureSdkTheme);
  app.renderer.hooks.on("content.begin", versionPicker);
  app.renderer.hooks.on("body.end", versionPickerScript);
  app.renderer.on(RendererEvent.END, (event: RendererEvent) => {
    const dest = path.join(event.outputDirectory, "assets");
    const source = path.join(__dirname, "..", "..", "theme", "assets");
    copyAssetsSync(source, dest);
  });
}

/**
 * The theme context is where all of the partials live for rendering a theme,
 * in addition to some helper functions.
 */
export class AzureSdkThemeContext extends DefaultThemeRenderContext {
  constructor(theme: DefaultTheme, options: Options) {
    super(theme, options);

    this.toolbar = (props) => {
      return toolbar(this, props);
    };
  }
}

export class AzureSdkTheme extends DefaultTheme {
  private _contextCache?: AzureSdkThemeContext;

  override getRenderContext(): AzureSdkThemeContext {
    this._contextCache ||= new AzureSdkThemeContext(this, this.application.options);
    return this._contextCache;
  }
}
