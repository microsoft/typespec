// @ts-check
import {
  bundleAndUploadPackages,
  getPackageVersion,
} from "../../packages/bundle-uploader/dist/src/index.js";
import { repoRoot } from "./helpers.js";

await bundleAndUploadPackages({
  repoRoot: repoRoot,
  indexName: "typespec",
  indexVersion: await getPackageVersion(repoRoot, "@typespec/compiler"),
  packages: [
    "@typespec/compiler",
    "@typespec/http",
    "@typespec/rest",
    "@typespec/openapi",
    "@typespec/versioning",
    "@typespec/openapi3",
    "@typespec/json-schema",
    "@typespec/protobuf",
  ],
});
