import { FluentLayout } from "@site/src/components/fluent/fluent-layout";
import { DashboardFromAzureStorage } from "@typespec/spec-dashboard";

export const DashboardPage: React.FunctionComponent = () => {
  return (
    <FluentLayout>
      <DashboardFromAzureStorage />;
    </FluentLayout>
  );
};
