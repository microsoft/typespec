// Have to create this file so we don't import any JS code from "prettier"
// itself otherwise it cause all kind of issue when bundling in the browser.
import type { util as utilType } from "prettier";
import * as prettier from "prettier/standalone";

export const util: typeof utilType = (prettier as any).util;
