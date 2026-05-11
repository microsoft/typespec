export { getAllPackages, getPublishablePackages, type PackageInfo } from "../utils/packages.js";

/**
 * Critical packages that must be built before other packages.
 * When using many pnpm --filter flags, pnpm may not correctly resolve the build
 * order. These packages and their dependencies (via the "..." suffix) are placed
 * first in the filter list to ensure they are built in the correct order.
 *
 * The key chain is: compiler → prettier-plugin-typespec → tspd
 * Many packages run `tspd gen-extern-signature` during their build and need tspd
 * (and its dependency prettier-plugin-typespec) to already be available.
 */
export const CRITICAL_PACKAGES = ["@typespec/prettier-plugin-typespec", "@typespec/tspd"];
