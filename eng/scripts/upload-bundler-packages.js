// @ts-check
import { bundleAndUploadPackages } from "../../packages/bundle-uploader/dist/src/index.js";

await bundleAndUploadPackages([
  "@typespec/compiler",
  "@typespec/http",
  "@typespec/rest",
  "@typespec/openapi",
  "@typespec/versioning",
  "@typespec/openapi3",
  "@typespec/json-schema",
  "@typespec/protobuf",
]);
