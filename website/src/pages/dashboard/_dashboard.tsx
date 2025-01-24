import { FluentLayout } from "@site/src/components/fluent/fluent-layout";
import {
  DashboardFromAzureStorage,
  type CoverageFromAzureStorageOptions,
} from "@typespec/spec-dashboard";

const options: CoverageFromAzureStorageOptions = {
  storageAccountName: "typespec",
  containerName: "coverage",
  manifestContainerName: "manifests-typespec",
  emitterNames: [
    "@typespec/http-client-python",
    "@typespec/http-client-csharp",
    "@azure-tools/typespec-ts-rlc",
    "@azure-tools/typespec-ts-modular",
    "@typespec/http-client-java",
  ],
};
export const DashboardPage: React.FunctionComponent = () => {
  return (
    <FluentLayout>
      <DashboardFromAzureStorage options={options} />;
    </FluentLayout>
  );
};
