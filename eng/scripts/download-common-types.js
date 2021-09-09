import { get } from "https";
import { existsSync, mkdirSync, createWriteStream } from "fs";
import { dirname } from "path";

const remoteSwaggerPath =
  "https://raw.githubusercontent.com/Azure/azure-rest-api-specs/main/specification/common-types/resource-management/v2/types.json";

const localSwaggerPath = "packages/common-types/resource-management/v2/types.json";
const dir = dirname(localSwaggerPath);
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}
const file = createWriteStream(localSwaggerPath);
get(remoteSwaggerPath, function (res) {
  res.pipe(file);
});
