// @ts-check
import { defineTypeSpecEcConfig } from "@typespec/astro-utils/expressive-code/config";

const base = process.env.TYPESPEC_WEBSITE_BASE_PATH ?? "/";

export default defineTypeSpecEcConfig(base);
