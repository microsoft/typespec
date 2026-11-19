import "@typespec/http";
import "@typespec/rest";
import "@typespec/versioning";
import "@azure-tools/typespec-azure-resource-manager";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.Versioning;
using Azure.ResourceManager;

@armProviderNamespace
@service(#{ title: "ArmCreateOnly" })
@versioned(Versions)
namespace TspTest.ArmCreateOnly;

enum Versions {
  v2026_01_01: "2026-01-01",
}

model Project is ProxyResource<{}> {
  ...ResourceNameParameter<Project>;
}

@parentResource(Project)
model Assessment is ProxyResource<AssessmentProperties> {
  ...ResourceNameParameter<Assessment>;
}

model AssessmentProperties {
  description?: string;
}

model DownloadUrl {
  url: string;
}

@armResourceOperations
interface Assessments {
  createOrReplace is ArmResourceCreateOrReplaceSync<Assessment>;
  get is ArmResourceRead<Assessment>;
  listByProject is ArmResourceListByParent<Assessment>;
  downloadUrl is ArmResourceActionSync<Assessment, void, DownloadUrl>;
}
