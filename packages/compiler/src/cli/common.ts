import envPaths from "env-paths";
import { joinPaths } from "../core/path-utils.js";

const paths = envPaths("typespec", { suffix: "" });

export const KnownDirectories = {
  /**
   * The directory where the package manager are installed.
   */
  packageManager: joinPaths(paths.cache, "pm"),
  /**
   * The directory where the init template package is installed.
   */
  initTemplates: joinPaths(paths.cache, "init-templates"),
} as const;
