// @ts-check
import {
  bundleAndUploadPackages,
  getPackageVersion,
} from "../../../packages/bundle-uploader/dist/src/index.js";
import { TypeSpecPlaygroundConfig } from "../../../packages/playground-website/src/index.js";
import { repoRoot } from "../../common/scripts/helpers.js";

await bundleAndUploadPackages({
  repoRoot: repoRoot,
  indexName: "typespec",
  indexVersion: await getPackageVersion(repoRoot, "@typespec/compiler"),
  packages: [...TypeSpecPlaygroundConfig.libraries],
});
